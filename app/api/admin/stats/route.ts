import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const DAYS_AR = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

function getTimeAgo(dateStr: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return 'منذ ثواني';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `منذ ${minutes} دقيقة`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `منذ ${hours} ساعة`;
  return `منذ ${Math.floor(hours / 24)} يوم`;
}

export async function GET(req: NextRequest) {
  // استخراج الـ JWT من الـ Authorization header
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const token = authHeader.slice(7);

  // إنشاء client بـ JWT المستخدم
  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  // التحقق من أن المستخدم admin
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const [
      usersRes,
      ideasRes,
      logsRes,
      podsRes,
      recentIdeasRes,
      recentUsersRes,
      questionLogsRes,
      listingsRes,
      contactsRes,
    ] = await Promise.all([
      supabase.from('users').select('id, role, country, created_at'),
      supabase.from('ideas').select('id, stage, created_at'),
      supabase.from('validation_logs').select('id'),
      supabase.from('pods').select('id'),
      supabase.from('ideas').select('id, title, stage, created_at, user_id').order('created_at', { ascending: false }).limit(4),
      supabase.from('users').select('created_at').gte('created_at', sevenDaysAgo),
      supabase.from('question_logs').select('question'),
      supabase.from('greenhouse_listings').select('id, sector, contact_requests, status').eq('status', 'active'),
      supabase.from('greenhouse_listings').select('contact_requests'),
    ]);

    const users = usersRes.data ?? [];
    const ideas = ideasRes.data ?? [];
    const totalUsers = users.length;
    const totalIdeas = ideas.length;
    const totalLogs = logsRes.data?.length ?? 0;
    const totalPods = podsRes.data?.length ?? 0;

    // MRR (mock prices: Pro=29, Teams=99)
    const proCount = users.filter(u => u.role === 'pro').length;
    const teamsCount = users.filter(u => u.role === 'teams').length;
    const mrr = proCount * 29 + teamsCount * 99;

    // التسجيلات آخر 7 أيام
    const signupsLast7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000);
      const dateStr = date.toDateString();
      const count = (recentUsersRes.data ?? []).filter(u =>
        new Date(u.created_at).toDateString() === dateStr
      ).length;
      return { day: DAYS_AR[date.getDay()], users: count };
    });

    // الأفكار حسب المرحلة
    const stageConfig: Record<string, { name: string; color: string }> = {
      ideation:   { name: 'فكرة جديدة', color: '#9CA3AF' },
      canvas:     { name: 'Canvas', color: '#3B82F6' },
      validation: { name: 'Pitch Deck', color: '#10B981' },
      build:      { name: 'خطة 90 يوم', color: '#F59E0B' },
      launch:     { name: 'منطلق', color: '#22C55E' },
      growth:     { name: 'نمو', color: '#3B82F6' },
    };

    const stageCounts: Record<string, number> = {};
    ideas.forEach(i => {
      stageCounts[i.stage] = (stageCounts[i.stage] ?? 0) + 1;
    });
    const ideasByStage = Object.entries(stageCounts).map(([stage, count]) => ({
      name: stageConfig[stage]?.name ?? stage,
      count,
      color: stageConfig[stage]?.color ?? '#9CA3AF',
    }));

    // توزيع الدول
    const countryCounts: Record<string, number> = {};
    users.forEach(u => {
      const c = u.country ?? 'غير محدد';
      countryCounts[c] = (countryCounts[c] ?? 0) + 1;
    });
    const topCountries = Object.entries(countryCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([country, count]) => ({
        country,
        users: count,
        percentage: totalUsers > 0 ? Math.round((count / totalUsers) * 100) : 0,
      }));

    // توزيع الخطط (admin = admin, بقية = مجاني)
    const adminCount = users.filter(u => u.role === 'admin').length;
    const freeCount = totalUsers - adminCount - proCount - teamsCount;
    const planDistribution = [
      { name: 'مجاني', value: freeCount, color: '#9CA3AF' },
      { name: 'Pro', value: proCount, color: '#10B981' },
      { name: 'Teams', value: teamsCount, color: '#3B82F6' },
    ];

    // Funnel التحويل
    const completedCanvas = ideas.filter(i => i.stage !== 'ideation').length;
    const conversionFunnel = [
      { name: 'مسجّلون', value: totalUsers, fill: '#9CA3AF' },
      { name: 'أنشأ فكرة', value: totalIdeas, fill: '#3B82F6' },
      { name: 'كمل Canvas', value: completedCanvas, fill: '#10B981' },
      { name: 'أضاف بيانات', value: totalLogs, fill: '#F59E0B' },
    ];

    // معدل التحويل (من مسجّل -> فكرة)
    const conversionRate = totalUsers > 0
      ? parseFloat(((totalIdeas / totalUsers) * 100).toFixed(1))
      : 0;

    // معدل التخلي
    const ideationCount = ideas.filter(i => i.stage === 'ideation').length;
    const abandonRate = totalIdeas > 0
      ? parseFloat(((ideationCount / totalIdeas) * 100).toFixed(1))
      : 0;

    // أكثر الأسئلة المطروحة
    const questionCounts: Record<string, number> = {};
    (questionLogsRes.data ?? []).forEach(({ question }) => {
      questionCounts[question] = (questionCounts[question] ?? 0) + 1;
    });
    const totalQuestionCount = (questionLogsRes.data ?? []).length;
    const topQuestions = Object.entries(questionCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([question, count]) => ({
        question,
        count,
        percentage: totalQuestionCount > 0 ? Math.round((count / totalQuestionCount) * 100) : 0,
      }));

    // آخر الأفكار
    const recentIdeas = (recentIdeasRes.data ?? []).map(idea => ({
      id: idea.id,
      title: idea.title ?? 'بلا عنوان',
      stage: stageConfig[idea.stage]?.name ?? idea.stage,
      time: getTimeAgo(idea.created_at),
    }));

    // إحصائيات المشتل
    const listings = listingsRes.data ?? [];
    const publishedListings = listings.length;
    const totalContactRequests = (contactsRes.data ?? []).reduce((sum, l) => sum + (l.contact_requests ?? 0), 0);
    const sectorCounts: Record<string, number> = {};
    listings.forEach(l => {
      const s = l.sector ?? 'غير محدد';
      sectorCounts[s] = (sectorCounts[s] ?? 0) + 1;
    });
    const listingsBySector = Object.entries(sectorCounts).map(([sector, count]) => ({ sector, count }));

    return NextResponse.json({
      totalUsers,
      totalIdeas,
      activeUsers: (recentUsersRes.data ?? []).length,
      mrr,
      conversionRate,
      abandonRate,
      avgEditsPerCanvas: 2.3,       // يحتاج جدول edits لاحقاً
      avgTimeToComplete: 8.3,       // يحتاج timestamp لاحقاً
      signupsLast7Days,
      ideasByStage,
      planDistribution,
      topCountries,
      conversionFunnel,
      recentIdeas,
      topQuestions,
      publishedListings,
      totalContactRequests,
      listingsBySector,
    });
  } catch (err) {
    console.error('Admin stats error:', err);
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
  }
}
