'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase, Idea, Task } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { Lightbulb, ChartBar as BarChart2, MessageSquare, TrendingUp, ArrowLeft, Target, DollarSign, UserCheck, Flame, CircleCheck as CheckCircle2, Circle, Sparkles, Star, SquareCheck as CheckSquare, Route } from 'lucide-react';
import RoadmapJourney from '@/components/RoadmapJourney';
import { usePersistedIdeaId } from '@/components/IdeaDropdown';

const STAGE_COLORS: Record<string, string> = {
  ideation: 'bg-[rgba(212,166,83,0.15)] text-[#7a5a1a]',
  canvas:   'bg-[rgba(27,107,62,0.1)] text-[var(--green-brand)]',
  pitch:    'bg-[rgba(27,107,62,0.15)] text-[var(--green-deep)]',
  growth:   'bg-[rgba(27,107,62,0.2)] text-[var(--green-brand)]',
};

const STAGE_LABELS: Record<string, string> = {
  ideation: 'الفكرة',
  canvas:   'النموذج',
  pitch:    'عرض للتمويل',
  growth:   'مشوار الـ 90 يوم',
};

type Stats = { totalIdeas: number; totalInterviews: number; totalSignups: number; totalRevenue: number };
type IdeaWithTasks = Idea & { tasks: Task[] };

function NextTaskCard({ ideas }: { ideas: IdeaWithTasks[] }) {
  const nextTask = ideas.flatMap(i => i.tasks.filter(t => t.status === 'todo')).at(0);
  const parentIdea = nextTask ? ideas.find(i => i.tasks.some(t => t.id === nextTask.id)) : null;

  // Check if all tasks are done across all committed ideas
  const allDone = ideas.length > 0 && ideas.every(i => i.tasks.length > 0 && i.tasks.every(t => t.status === 'done'));
  const completedIdea = allDone ? ideas[0] : null;

  if (allDone && completedIdea) {
    return (
      <div className="bg-card rounded-xl border p-5" style={{ borderColor: 'var(--gold)', background: 'rgba(212,166,83,0.06)' }} dir="rtl">
        <div className="flex items-start gap-3 flex-row-reverse">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: 'rgba(212,166,83,0.15)' }}>
            <Star className="w-4 h-4" style={{ color: 'var(--gold)' }} />
          </div>
          <div className="flex-1 text-right">
            <p className="font-bold text-sm" style={{ color: 'var(--green-deep)' }}>أكملت مشوار الـ ٩٠ يوم!</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--gray-mid)' }}>حان وقت تقويم فكرتك ومعرفة نتيجتها من ١٠٠</p>
          </div>
          <Link
            href={`/ideas/${completedIdea.id}/score`}
            className="shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-lg text-white text-xs font-semibold transition flex-row-reverse hover:opacity-90"
            style={{ background: 'var(--gold)', color: 'var(--green-deep)' }}
          >
            <Star className="w-3 h-3" />
            قيّم الآن
          </Link>
        </div>
      </div>
    );
  }

  if (!nextTask || !parentIdea) {
    return (
      <div className="bg-card rounded-xl border border-dashed border-border p-5 text-center" dir="rtl">
        <Sparkles className="w-6 h-6 text-primary mx-auto mb-2" />
        <p className="text-sm font-medium">لا توجد مهام معلقة</p>
        <p className="text-xs text-muted-foreground mt-1">أنجزت كل مهامك — واصل!</p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border border-primary/30 p-5" dir="rtl">
      <div className="flex items-start gap-3 flex-row-reverse">
        <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <Flame className="w-4 h-4 text-primary" />
        </div>
        <div className="flex-1 text-right">
          <p className="text-xs text-muted-foreground mb-0.5">مهمتك التالية</p>
          <p className="font-semibold text-sm">{nextTask.title}</p>
          <p className="text-xs text-muted-foreground mt-1">{parentIdea.title ?? 'فكرة'} · أسبوع {nextTask.week}</p>
        </div>
        <Link
          href={`/ideas/${parentIdea.id}`}
          className="shrink-0 flex items-center gap-1 text-xs text-primary font-medium hover:underline"
        >
          ابدأ
          <ArrowLeft className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { supaUser } = useAuth();
  const router = useRouter();
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [allNonCommitted, setAllNonCommitted] = useState<Idea[]>([]);
  const [selectedIdeaId, persistIdeaId] = usePersistedIdeaId();
  const [committedIdeas, setCommittedIdeas] = useState<IdeaWithTasks[]>([]);
  const [stats, setStats] = useState<Stats>({ totalIdeas: 0, totalInterviews: 0, totalSignups: 0, totalRevenue: 0 });
  const [loading, setLoading] = useState(true);
  const [togglingTask, setTogglingTask] = useState<string | null>(null);

  useEffect(() => {
    if (!supaUser) return;
    async function load() {
      const { data: userData } = await supabase
        .from('ideas').select('*').eq('user_id', supaUser!.id)
        .neq('stage', 'committed')
        .order('created_at', { ascending: false }).limit(5);

      // Deduplicate by title (keep most recent)
      const seen = new Set<string>();
      const deduped = (userData ?? []).filter(i => {
        const key = (i.title ?? '').trim().toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      }).slice(0, 3);

      setAllNonCommitted(userData ?? []);
      // Auto-select first idea if none persisted
      if (userData && userData.length > 0 && !selectedIdeaId) {
        persistIdeaId(userData[0].id);
      }

      const { data: allIdeas } = await supabase
        .from('ideas').select('id').eq('user_id', supaUser!.id);

      if (allIdeas && allIdeas.length > 0) {
        const ids = allIdeas.map(i => i.id);
        const { data: logs } = await supabase
          .from('validation_logs').select('interviews, signups, preorders_usd').in('idea_id', ids);
        if (logs) {
          const agg = logs.reduce(
            (acc, l) => ({
              totalInterviews: acc.totalInterviews + (l.interviews || 0),
              totalSignups: acc.totalSignups + (l.signups || 0),
              totalRevenue: acc.totalRevenue + (l.preorders_usd || 0),
            }),
            { totalInterviews: 0, totalSignups: 0, totalRevenue: 0 }
          );
          setStats({ totalIdeas: allIdeas.length, ...agg });
        } else {
          setStats(s => ({ ...s, totalIdeas: allIdeas.length }));
        }
      }

      const { data: ideasData } = await supabase
        .from('ideas')
        .select(`*, tasks ( id, idea_id, user_id, title, week, status, created_at )`)
        .eq('user_id', supaUser!.id)
        .eq('stage', 'committed')
        .order('committed_at', { ascending: false });

      if (ideasData && ideasData.length > 0) {
        // Deduplicate committed ideas by title
        const seenCommitted = new Set<string>();
        const uniqueCommitted = ideasData.filter(i => {
          const key = (i.title ?? '').trim().toLowerCase();
          if (seenCommitted.has(key)) return false;
          seenCommitted.add(key);
          return true;
        });
        const withTasks = uniqueCommitted.map(idea => ({
          ...idea,
          tasks: ((idea as any).tasks ?? []).sort((a: Task, b: Task) => a.week - b.week),
        }));
        setCommittedIdeas(withTasks);
      } else {
        setCommittedIdeas([]);
      }

      setIdeas(deduped);
      setLoading(false);
    }
    load();
  }, [supaUser]);

  async function toggleTask(task: Task) {
    if (togglingTask) return;
    setTogglingTask(task.id);
    const newStatus = task.status === 'done' ? 'todo' : 'done';
    await supabase.from('tasks').update({ status: newStatus }).eq('id', task.id);
    setCommittedIdeas(prev =>
      prev.map(idea => ({
        ...idea,
        tasks: idea.tasks.map(t => t.id === task.id ? { ...t, status: newStatus } : t),
      }))
    );
    setTogglingTask(null);
  }

  const statCards = [
    { label: 'الأفكار',            value: stats.totalIdeas,         icon: Lightbulb,  color: 'var(--gold)',        bg: 'rgba(212,166,83,0.12)' },
    { label: 'المقابلات',          value: stats.totalInterviews,    icon: UserCheck,  color: 'var(--green-brand)', bg: 'rgba(27,107,62,0.1)' },
    { label: 'التسجيلات',          value: stats.totalSignups,       icon: Target,     color: 'var(--green-brand)', bg: 'rgba(27,107,62,0.1)' },
    { label: 'الطلبات المسبقة ($)', value: `$${stats.totalRevenue}`, icon: DollarSign, color: 'var(--green-deep)',  bg: 'rgba(27,107,62,0.12)' },
  ];

  const actionButtons = [
    { label: 'التحقق',             desc: 'تتبع مقابلاتك',           icon: CheckSquare, color: 'var(--green-brand)', bg: 'rgba(27,107,62,0.08)',   path: '/validation' },
    { label: 'عرض للتمويل',        desc: 'ملفك الاستثماري',          icon: BarChart2,   color: 'var(--green-brand)', bg: 'rgba(27,107,62,0.1)',    path: '/pitch' },
    { label: 'مشوار الـ ٩٠ يوماً', desc: 'مهامك الأسبوعية',          icon: Route,       color: 'var(--green-deep)',  bg: 'rgba(27,107,62,0.12)',   path: '/journey' },
  ];

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6" dir="rtl">
      {/* Heading */}
      <div>
        <h1 className="text-2xl font-bold">لوحة المؤسس</h1>
        <p className="text-muted-foreground mt-1 text-sm">تابع رحلتك الريادية خطوة بخطوة.</p>
      </div>

      {/* Roadmap Journey — always on top */}
      <RoadmapJourney />

      {/* Next task card (only when committed ideas exist) */}
      {committedIdeas.length > 0 && <NextTaskCard ideas={committedIdeas} />}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-card rounded-xl border border-border p-4">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center mb-3" style={{ background: bg }}>
              <Icon style={{ width: 18, height: 18, color }} />
            </div>
            <div className="text-2xl font-bold">{value}</div>
            <div className="text-sm text-muted-foreground mt-0.5 text-right">{label}</div>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="bg-card rounded-xl border border-border p-5" dir="rtl">
        <h2 className="text-base font-semibold mb-4 text-right">إجراءات سريعة</h2>

        {/* Idea picker */}
        {allNonCommitted.length === 0 ? (
          <div className="mb-4 p-3 rounded-lg bg-secondary/50 text-center text-sm text-muted-foreground">
            لا توجد أفكار —{' '}
            <Link href="/ideas" className="text-primary font-medium hover:underline">أضف فكرة الآن</Link>
          </div>
        ) : (
          <div className="mb-4">
            <label className="block text-xs font-medium text-muted-foreground mb-1.5 text-right">اختر فكرة</label>
            <select
              value={selectedIdeaId}
              onChange={e => persistIdeaId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              {allNonCommitted.map(i => (
                <option key={i.id} value={i.id}>{i.title ?? 'فكرة بلا عنوان'}</option>
              ))}
            </select>
          </div>
        )}

        {/* Action buttons — disabled until idea selected */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {actionButtons.map(({ label, desc, icon: Icon, color, bg, path }) => (
            <button
              key={label}
              onClick={() => selectedIdeaId && router.push(`${path}?idea=${selectedIdeaId}`)}
              disabled={!selectedIdeaId}
              className={`group flex items-start gap-3 p-4 rounded-xl border transition-all text-right flex-row-reverse ${
                selectedIdeaId
                  ? 'bg-card border-border hover:border-primary/40 hover:shadow-sm cursor-pointer'
                  : 'bg-secondary/30 border-border opacity-50 cursor-not-allowed'
              }`}
            >
              <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: bg }}>
                <Icon className="w-4 h-4" style={{ color }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium text-sm">{label}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{desc}</div>
              </div>
            </button>
          ))}
        </div>

        {/* Secondary: canvas + chat */}
        <div className="mt-3 pt-3 border-t border-border flex items-center justify-end gap-4 flex-row-reverse">
          <button
            onClick={() => selectedIdeaId && router.push(`/ideas/${selectedIdeaId}/canvas`)}
            disabled={!selectedIdeaId}
            className={`inline-flex items-center gap-1.5 text-sm font-medium flex-row-reverse ${selectedIdeaId ? 'hover:underline cursor-pointer' : 'text-muted-foreground/40 cursor-not-allowed'}`}
            style={selectedIdeaId ? { color: 'var(--green-brand)' } : {}}
          >
            <BarChart2 className="w-4 h-4" />
            نموذج العمل (Canvas)
          </button>
          <Link href="/chat" className="inline-flex items-center gap-1.5 text-sm text-primary font-medium hover:underline flex-row-reverse">
            <MessageSquare className="w-4 h-4" />
            استشر المدرب
          </Link>
        </div>
      </div>

      {/* Recent ideas */}
      <div>
        <div className="flex items-center justify-between mb-3 flex-row-reverse">
          <h2 className="text-base font-semibold">الأفكار الأخيرة</h2>
          <Link href="/ideas" className="text-sm text-primary hover:underline flex items-center gap-1 flex-row-reverse">
            عرض الكل <ArrowLeft className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="space-y-3">{[1, 2].map(i => <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />)}</div>
        ) : ideas.length === 0 ? (
          <div className="bg-card rounded-xl border border-dashed border-border p-8 text-center">
            <Lightbulb className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground text-sm">لا توجد أفكار بعد. أضف أول فكرة لمشروعك!</p>
            <Link href="/ideas" className="inline-flex mt-3 text-sm text-primary hover:underline font-medium">إنشاء فكرة ←</Link>
          </div>
        ) : (
          <div className="space-y-3">
            {ideas.map(idea => (
              <Link
                key={idea.id}
                href={`/ideas/${idea.id}`}
                className="flex items-center gap-4 bg-card rounded-xl border border-border p-4 hover:border-primary/40 hover:shadow-sm transition-all group flex-row-reverse"
              >
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate text-right">{idea.title ?? 'فكرة بلا عنوان'}</div>
                  <div className="text-xs text-muted-foreground mt-0.5 truncate text-right">{idea.description ?? 'لا يوجد وصف'}</div>
                </div>
                <div className="flex items-center gap-2 shrink-0 flex-row-reverse">
                  {idea.sector && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">{idea.sector}</span>
                  )}
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STAGE_COLORS[idea.stage] ?? 'bg-secondary text-secondary-foreground'}`}>
                    {STAGE_LABELS[idea.stage] ?? idea.stage}
                  </span>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <TrendingUp className="w-3.5 h-3.5" />{idea.validation_score}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Committed ideas with weekly tasks */}
      {committedIdeas.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3 flex-row-reverse">
            <h2 className="text-base font-semibold flex items-center gap-2 flex-row-reverse">
              <Flame className="w-4 h-4" style={{ color: 'var(--gold)' }} />
              التزاماتي · ٩٠ يوماً
            </h2>
          </div>
          <div className="space-y-4">
            {committedIdeas.map(idea => {
              const doneCount = idea.tasks.filter(t => t.status === 'done').length;
              const progress = idea.tasks.length > 0 ? Math.round((doneCount / idea.tasks.length) * 100) : 0;
              const endDate = idea.committed_at
                ? new Date(new Date(idea.committed_at).getTime() + 90 * 24 * 60 * 60 * 1000)
                : null;
              return (
                <div key={idea.id} className="bg-card rounded-xl border p-5" style={{ borderColor: 'var(--gold)' }}>
                  <div className="flex items-start justify-between gap-3 mb-3 flex-row-reverse">
                    <div className="text-right">
                      <h3 className="font-semibold text-sm">{idea.title ?? 'فكرة بلا عنوان'}</h3>
                      {endDate && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          ينتهي في {endDate.toLocaleDateString('ar-SA', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-xs font-medium" style={{ color: 'var(--gold)' }}>{doneCount}/{idea.tasks.length}</span>
                      <div className="w-16 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(212,166,83,0.15)' }}>
                        <div className="h-full rounded-full transition-all" style={{ width: `${progress}%`, background: 'var(--gold)' }} />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    {idea.tasks.map(task => (
                      <button
                        key={task.id}
                        onClick={() => toggleTask(task)}
                        disabled={togglingTask === task.id}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-right transition-colors flex-row-reverse ${
                          task.status === 'done'
                            ? 'bg-[rgba(27,107,62,0.08)] text-[var(--green-brand)]'
                            : 'bg-secondary/50 hover:bg-secondary text-foreground'
                        }`}
                      >
                        {task.status === 'done'
                          ? <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: 'var(--green-brand)' }} />
                          : <Circle className="w-4 h-4 text-muted-foreground shrink-0" />
                        }
                        <span className={`flex-1 ${task.status === 'done' ? 'line-through opacity-60' : ''}`}>
                          <span className="text-xs text-muted-foreground ml-1">أسبوع {task.week}:</span>
                          {task.title}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
