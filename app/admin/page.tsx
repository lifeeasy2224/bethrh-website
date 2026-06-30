'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAdminAuth } from '@/lib/admin-auth-context';
import { supabase } from '@/lib/supabase';
import {
  Users, Lightbulb, TrendingUp, Clock, Circle as XCircle,
  DollarSign, ArrowUp, ArrowDown, MessageSquare, Activity, RefreshCw, Sprout, Send,
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, LabelList, ResponsiveContainer,
} from 'recharts';

type StatsData = {
  totalUsers: number;
  totalIdeas: number;
  activeUsers: number;
  mrr: number;
  conversionRate: number;
  abandonRate: number;
  avgEditsPerCanvas: number;
  avgTimeToComplete: number;
  signupsLast7Days: { day: string; users: number }[];
  ideasByStage: { name: string; count: number; color: string }[];
  planDistribution: { name: string; value: number; color: string }[];
  topCountries: { country: string; users: number; percentage: number }[];
  conversionFunnel: { name: string; value: number; fill: string }[];
  recentIdeas: { id: string; title: string; stage: string; time: string }[];
  topQuestions: { question: string; count: number; percentage: number }[];
  publishedListings: number;
  totalContactRequests: number;
  listingsBySector: { sector: string; count: number }[];
};

function StatCard({ title, value, icon: Icon, change, changeType, subtitle }: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  change?: number;
  changeType?: 'up' | 'down';
  subtitle?: string;
}) {
  return (
    <div className="bg-card rounded-xl p-5 border border-border shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-muted-foreground">{title}</p>
        <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center">
          <Icon className="w-4 h-4 text-primary" />
        </div>
      </div>
      <p className="text-2xl font-bold text-foreground mb-1">
        {typeof value === 'number' ? value.toLocaleString() : value}
      </p>
      {subtitle && <p className="text-xs text-muted-foreground mb-1">{subtitle}</p>}
      {change !== undefined && (
        <div className={`flex items-center gap-1 text-xs ${changeType === 'up' ? 'text-emerald-600' : 'text-destructive'}`}>
          {changeType === 'up' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
          <span>{Math.abs(change)}%</span>
        </div>
      )}
    </div>
  );
}

export default function AdminDashboardPage() {
  const { admin } = useAdminAuth();
  const [dateRange, setDateRange] = useState('7 أيام');
  const [stats, setStats] = useState<StatsData | null>(null);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    setFetching(true);
    setError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('No session');

      const res = await fetch('/api/admin/stats', {
        headers: { Authorization: `Bearer ${session.access_token}` },
        cache: 'no-store',
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }

      const data: StatsData = await res.json();
      setStats(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'خطأ في جلب البيانات');
    } finally {
      setFetching(false);
    }
  }, []);

  useEffect(() => {
    if (!admin) return;
    fetchStats();
  }, [admin, fetchStats]);

  if (fetching && !stats) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4" dir="rtl">
        <p className="text-destructive text-sm">{error}</p>
        <button onClick={fetchStats} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary text-sm hover:bg-secondary/80">
          <RefreshCw className="w-4 h-4" /> إعادة المحاولة
        </button>
      </div>
    );
  }

  const s = stats!;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="text-right">
          <h1 className="text-2xl font-bold">إحصائيات المنصة</h1>
          <p className="text-muted-foreground text-sm mt-0.5">بيانات حقيقية من قاعدة البيانات</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchStats}
            disabled={fetching}
            className="p-2 rounded-lg border border-border hover:bg-secondary transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${fetching ? 'animate-spin' : ''}`} />
          </button>
          <div className="flex gap-1.5">
            {['اليوم', '7 أيام', '30 يوم', 'كل الوقت'].map(range => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  dateRange === range
                    ? 'bg-foreground text-background'
                    : 'bg-secondary text-muted-foreground hover:text-foreground'
                }`}
              >
                {range}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Row 1 */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard title="إجمالي المستخدمين" value={s.totalUsers} icon={Users} />
        <StatCard title="إجمالي الأفكار" value={s.totalIdeas} icon={Lightbulb} />
        <StatCard title="نشطون (7 أيام)" value={s.activeUsers} icon={TrendingUp} />
        <StatCard title="MRR" value={`$${s.mrr.toLocaleString()}`} icon={DollarSign} />
        <StatCard title="معدل التحويل" value={`${s.conversionRate}%`} icon={Activity} />
      </div>

      {/* Stats Row 2 — quality */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard title="متوسط التعديلات / Canvas" value={s.avgEditsPerCanvas} icon={Activity} subtitle="كلما أقل كان أفضل" />
        <StatCard title="متوسط وقت الإنجاز" value={`${s.avgTimeToComplete} دقيقة`} icon={Clock} subtitle="من فكرة إلى Canvas كامل" />
        <StatCard title="معدل التخلي" value={`${s.abandonRate}%`} icon={XCircle} subtitle="يتركون قبل إكمال Canvas" />
      </div>

      {/* Stats Row 3 — Investor / Greenhouse */}
      <div>
        <h2 className="text-sm font-semibold text-muted-foreground mb-3 text-right flex items-center gap-2 flex-row-reverse">
          <Sprout className="w-4 h-4" />
          إحصائيات المشتل 🪴
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard title="بذور منشورة" value={s.publishedListings} icon={Sprout} subtitle="في المشتل حالياً" />
          <StatCard title="طلبات تواصل" value={s.totalContactRequests} icon={Send} subtitle="إجمالي طلبات المستثمرين" />
          <div className="bg-card rounded-xl p-5 border border-border shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-muted-foreground">البذور حسب القطاع</p>
              <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center">
                <Sprout className="w-4 h-4 text-primary" />
              </div>
            </div>
            {s.listingsBySector.length === 0 ? (
              <p className="text-xs text-muted-foreground">لا توجد بيانات بعد</p>
            ) : (
              <div className="space-y-1.5">
                {s.listingsBySector.map(({ sector, count }) => (
                  <div key={sector} className="flex items-center justify-between text-sm">
                    <span className="font-semibold tabular-nums">{count}</span>
                    <span className="text-muted-foreground text-xs">{sector}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-xl p-5 border border-border">
          <h3 className="font-semibold text-sm mb-4 text-right">التسجيلات آخر 7 أيام</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={s.signupsLast7Days}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 11 }} />
              <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid hsl(var(--border))' }} />
              <Line type="monotone" dataKey="users" stroke="#10B981" strokeWidth={2.5} dot={{ fill: '#10B981', r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card rounded-xl p-5 border border-border">
          <h3 className="font-semibold text-sm mb-4 text-right">الأفكار حسب المرحلة</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={s.ideasByStage}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 10 }} />
              <YAxis stroke="hsl(var(--muted-foreground))" tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid hsl(var(--border))' }} />
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                {s.ideasByStage.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Pie + Countries */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="bg-card rounded-xl p-5 border border-border">
          <h3 className="font-semibold text-sm mb-4 text-right">توزيع الخطط</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={s.planDistribution} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={5} dataKey="value">
                {s.planDistribution.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid hsl(var(--border))' }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="space-y-1.5 mt-3">
            {s.planDistribution.map(plan => (
              <div key={plan.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: plan.color }} />
                  <span className="text-muted-foreground">{plan.name}</span>
                </div>
                <span className="font-semibold">{plan.value}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card rounded-xl p-5 border border-border lg:col-span-2">
          <h3 className="font-semibold text-sm mb-4 text-right">المستخدمون حسب الدولة</h3>
          <div className="space-y-3">
            {s.topCountries.map(c => (
              <div key={c.country}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-medium">{c.country}</span>
                  <span className="text-sm text-muted-foreground">{c.users} مستخدم</span>
                </div>
                <div className="w-full bg-secondary rounded-full h-1.5">
                  <div className="bg-primary h-1.5 rounded-full" style={{ width: `${c.percentage}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Questions + Funnel */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-xl p-5 border border-border">
          <div className="flex items-center gap-2 mb-4">
            <MessageSquare className="w-4 h-4 text-primary" />
            <h3 className="font-semibold text-sm">أكثر الأسئلة اللي يسألونها</h3>
          </div>
          {s.topQuestions.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">لا توجد أسئلة مسجّلة بعد</p>
          ) : (
            <div className="space-y-3">
              {s.topQuestions.map((item, i) => (
                <div key={i}>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm">{i + 1}. {item.question}</p>
                    <span className="text-sm font-semibold">{item.count}</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-1.5">
                    <div className="bg-primary h-1.5 rounded-full" style={{ width: `${item.percentage}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-card rounded-xl p-5 border border-border">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-4 h-4 text-emerald-600" />
            <h3 className="font-semibold text-sm">Funnel التحويل</h3>
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={s.conversionFunnel} layout="vertical" margin={{ left: 8, right: 40 }}>
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" width={90} />
              <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid hsl(var(--border))' }} />
              <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                {s.conversionFunnel.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                <LabelList dataKey="value" position="right" style={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Ideas */}
      <div className="bg-card rounded-xl p-5 border border-border">
        <h3 className="font-semibold text-sm mb-4 text-right">آخر الأفكار المسجلة</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-right">
                <th className="pb-3 px-2 font-medium text-muted-foreground">الفكرة</th>
                <th className="pb-3 px-2 font-medium text-muted-foreground">المرحلة</th>
                <th className="pb-3 px-2 font-medium text-muted-foreground">الوقت</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {s.recentIdeas.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-6 text-center text-muted-foreground">لا توجد أفكار بعد</td>
                </tr>
              ) : s.recentIdeas.map(idea => (
                <tr key={idea.id} className="hover:bg-secondary/30 transition-colors">
                  <td className="py-3 px-2 font-medium">{idea.title}</td>
                  <td className="py-3 px-2">
                    <span className="text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-full">{idea.stage}</span>
                  </td>
                  <td className="py-3 px-2 text-muted-foreground">{idea.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
