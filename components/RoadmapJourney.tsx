'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { Lock, CircleCheck as CheckCircle2, ChevronLeft, Sparkles, Star, Flame, LayoutGrid, Mic, GitBranch, Apple } from 'lucide-react';

type StageStatus = 'completed' | 'active' | 'locked' | 'soon';

type StageInfo = {
  key: string;
  label: string;
  sublabel: string;
  icon: React.ElementType;
  color: string;
  bgActive: string;
  bgDone: string;
  unlockHint: string;
  badge: string;
};

const STAGES: StageInfo[] = [
  {
    key: 'seed',
    label: 'البذرة',
    sublabel: 'ابدأ بفكرتك',
    icon: Star,
    color: 'text-[var(--gold)]',
    bgActive: 'bg-[rgba(212,166,83,0.1)] border-[var(--gold)]',
    bgDone: 'bg-[rgba(212,166,83,0.15)] border-[var(--gold)]',
    unlockHint: 'تفتح تلقائياً',
    badge: 'حامل البذرة',
  },
  {
    key: 'sprout',
    label: 'الإنبات',
    sublabel: 'تحقق من فكرتك',
    icon: Flame,
    color: 'text-[var(--green-brand)]',
    bgActive: 'bg-[rgba(27,107,62,0.08)] border-[var(--green-brand)]',
    bgDone: 'bg-[rgba(27,107,62,0.12)] border-[var(--green-brand)]',
    unlockHint: 'احفظ فكرتك الأولى',
    badge: 'المنبت',
  },
  {
    key: 'root',
    label: 'التجذر',
    sublabel: 'نموذج العمل التجاري',
    icon: LayoutGrid,
    color: 'text-[var(--green-mid)]',
    bgActive: 'bg-[rgba(42,138,82,0.08)] border-[var(--green-mid)]',
    bgDone: 'bg-[rgba(42,138,82,0.12)] border-[var(--green-mid)]',
    unlockHint: 'نقاط التحقق 75+',
    badge: 'المتجذر',
  },
  {
    key: 'stem',
    label: 'الساق',
    sublabel: 'مشوار الـ ٩٠ يوماً',
    icon: CheckCircle2,
    color: 'text-[var(--green-deep)]',
    bgActive: 'bg-[rgba(15,61,36,0.08)] border-[var(--green-deep)]',
    bgDone: 'bg-[rgba(15,61,36,0.12)] border-[var(--green-deep)]',
    unlockHint: 'أكمل ٨٠٪ من مهام ٣٠ يوماً',
    badge: 'الساقي',
  },
  {
    key: 'pitch',
    label: 'عرض التمويل',
    sublabel: 'جاهز للمستثمرين',
    icon: Mic,
    color: 'text-[var(--gold)]',
    bgActive: 'bg-[rgba(212,166,83,0.08)] border-[var(--gold)]',
    bgDone: 'bg-[rgba(212,166,83,0.15)] border-[var(--gold)]',
    unlockHint: 'أكمل مرحلة الإنبات',
    badge: 'الخطيب',
  },
  {
    key: 'branch',
    label: 'التفرع',
    sublabel: 'التوسع والنمو',
    icon: GitBranch,
    color: 'text-[var(--green-brand)]',
    bgActive: 'bg-[rgba(27,107,62,0.08)] border-[var(--green-brand)]',
    bgDone: 'bg-[rgba(27,107,62,0.12)] border-[var(--green-brand)]',
    unlockHint: 'قريباً',
    badge: 'المتفرع',
  },
  {
    key: 'fruit',
    label: 'الإثمار',
    sublabel: 'شركة كاملة النضج',
    icon: Apple,
    color: 'text-[var(--gold-light)]',
    bgActive: 'bg-[rgba(232,192,122,0.1)] border-[var(--gold-light)]',
    bgDone: 'bg-[rgba(232,192,122,0.15)] border-[var(--gold-light)]',
    unlockHint: 'قريباً',
    badge: 'المثمر',
  },
];

type ProgressData = {
  currentStage: string;
  ideaCount: number;
  maxScore: number;
  tasksPct: number;
  doneTasks: number;
  totalTasks: number;
  badges: string[];
  stages: Record<string, { status: StageStatus; score?: number; pct?: number }>;
};

function CelebrationModal({ badge, onClose }: { badge: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-card rounded-2xl border border-border p-8 max-w-sm w-full mx-4 text-center shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="text-6xl mb-4">🌱</div>
        <h2 className="text-2xl font-extrabold mb-2">مبروك!</h2>
        <p className="text-muted-foreground mb-4">لقد فتحت شارة</p>
        <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full font-bold text-sm mb-6" style={{ background: 'rgba(27,107,62,0.1)', color: 'var(--green-brand)' }}>
          <Sparkles className="w-4 h-4" />
          {badge}
        </div>
        <button
          onClick={onClose}
          className="w-full py-2.5 rounded-xl font-semibold bg-primary text-primary-foreground hover:bg-primary/90 transition"
        >
          رائع، واصل!
        </button>
      </div>
    </div>
  );
}

export default function RoadmapJourney() {
  const { supaUser } = useAuth();
  const [data, setData] = useState<ProgressData | null>(null);
  const [loading, setLoading] = useState(true);
  const [celebrateBadge, setCelebrateBadge] = useState<string | null>(null);
  const [prevBadges, setPrevBadges] = useState<string[]>([]);

  const load = useCallback(async () => {
    if (!supaUser) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const res = await fetch('/api/progress', {
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    if (!res.ok) return;
    const json: ProgressData = await res.json();
    setData(json);

    const newBadges = json.badges.filter(b => !prevBadges.includes(b));
    if (newBadges.length > 0) {
      setCelebrateBadge(newBadges[0]);
    }
    setPrevBadges(json.badges);
    setLoading(false);
  }, [prevBadges]);

  useEffect(() => { load(); }, [supaUser]);

  if (loading) {
    return (
      <div className="bg-card rounded-2xl border border-border p-6 animate-pulse h-40" />
    );
  }
  if (!data) return null;

  const activeIdx = STAGES.findIndex(s => s.key === data.currentStage);

  return (
    <>
      {celebrateBadge && (
        <CelebrationModal badge={celebrateBadge} onClose={() => setCelebrateBadge(null)} />
      )}

      <div className="bg-card rounded-2xl border border-border overflow-hidden" dir="rtl">
        {/* Header */}
        <div className="px-5 py-4 border-b border-border flex items-center justify-between flex-row-reverse">
          <div className="text-right">
            <h2 className="font-bold text-base">رحلة الريادي</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              أنت في مرحلة <span className="font-semibold text-foreground">{STAGES.find(s => s.key === data.currentStage)?.label}</span>
            </p>
          </div>
          {data.badges.length > 0 && (
            <div className="flex items-center gap-1.5 flex-row-reverse">
              {data.badges.slice(0, 3).map(b => (
                <span key={b} className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ background: 'rgba(27,107,62,0.1)', color: 'var(--green-brand)' }}>
                  {b}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Stages row — horizontal scroll on mobile */}
        <div className="px-4 py-5 overflow-x-auto">
          <div className="flex items-start gap-0 min-w-max">
            {STAGES.map((stage, i) => {
              const stageData = data.stages[stage.key];
              const status: StageStatus = stageData?.status ?? 'locked';
              const isActive = status === 'active';
              const isDone = status === 'completed';
              const isSoon = status === 'soon';
              const isLocked = status === 'locked';
              const Icon = stage.icon;

              return (
                <div key={stage.key} className="flex items-start">
                  {/* Stage card */}
                  <div className={`relative flex flex-col items-center text-center w-[88px] px-2`}>
                    {/* Circle icon */}
                    <div className={`w-12 h-12 rounded-2xl border-2 flex items-center justify-center mb-2 transition-all ${
                      isDone
                        ? 'bg-primary/10 border-primary'
                        : isActive
                        ? stage.bgActive + ' shadow-md'
                        : isSoon || isLocked
                        ? 'bg-secondary border-border opacity-50'
                        : 'bg-secondary border-border'
                    }`}>
                      {isDone
                        ? <CheckCircle2 className="w-5 h-5 text-primary" />
                        : isLocked || isSoon
                        ? <Lock className="w-4 h-4 text-muted-foreground" />
                        : <Icon className={`w-5 h-5 ${stage.color}`} />
                      }
                    </div>

                    {/* Label */}
                    <span className={`text-xs font-semibold leading-tight ${
                      isDone ? 'text-primary' : isActive ? 'text-foreground' : 'text-muted-foreground'
                    }`}>
                      {stage.label}
                    </span>
                    <span className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{stage.sublabel}</span>

                    {/* Progress bar for active stage */}
                    {isActive && stage.key === 'sprout' && (
                      <div className="mt-2 w-full">
                        <div className="w-full h-1 rounded-full bg-border overflow-hidden">
                          <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${Math.min(100, data.maxScore)}%` }} />
                        </div>
                        <span className="text-[10px] text-muted-foreground">{data.maxScore}/100</span>
                      </div>
                    )}
                    {isActive && stage.key === 'root' && (
                      <div className="mt-2 w-full">
                        <div className="w-full h-1 rounded-full bg-border overflow-hidden">
                          <div className="h-full bg-[var(--green-mid)] rounded-full transition-all" style={{ width: `${data.tasksPct}%` }} />
                        </div>
                        <span className="text-[10px] text-muted-foreground">{data.tasksPct}%</span>
                      </div>
                    )}

                    {/* Unlock hint */}
                    {(isLocked || isSoon) && (
                      <span className="text-[10px] text-muted-foreground mt-1.5 leading-tight">{stage.unlockHint}</span>
                    )}

                    {/* Active pulse */}
                    {isActive && (
                      <span className="absolute top-0 right-2 w-2.5 h-2.5 rounded-full bg-primary animate-ping opacity-75" />
                    )}
                  </div>

                  {/* Connector */}
                  {i < STAGES.length - 1 && (
                    <div className={`mt-5 flex items-center shrink-0 ${i < activeIdx ? 'opacity-100' : 'opacity-25'}`}>
                      <div className={`w-4 h-0.5 ${i < activeIdx ? 'bg-primary' : 'bg-border'}`} />
                      <ChevronLeft className={`w-3 h-3 -mr-1 ${i < activeIdx ? 'text-primary' : 'text-border'}`} />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom summary bar */}
        <div className="px-5 py-3 border-t border-border bg-secondary/30 flex items-center justify-between gap-4 flex-row-reverse">
          <div className="flex items-center gap-4 flex-row-reverse text-xs text-muted-foreground">
            <span>{data.ideaCount} فكرة</span>
            <span className="w-px h-3 bg-border" />
            <span>{data.doneTasks}/{data.totalTasks} مهمة</span>
            <span className="w-px h-3 bg-border" />
            <span>نقاط التحقق: {data.maxScore}</span>
          </div>
          <div className="flex items-center gap-1">
            {STAGES.slice(0, 5).map((s, i) => (
              <div
                key={s.key}
                className={`w-1.5 h-1.5 rounded-full transition-all ${
                  i < activeIdx ? 'bg-primary' : i === activeIdx ? 'bg-primary scale-125' : 'bg-border'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
