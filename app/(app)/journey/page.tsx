'use client';

import { useEffect, useState, useRef } from 'react';
import { supabase, Idea, Task } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CircleCheck as CheckCircle2, Circle, ChevronDown, ChevronUp, Flame, Star, Sparkles, CircleAlert as Info } from 'lucide-react';
import IdeaDropdown, { usePersistedIdeaId } from '@/components/IdeaDropdown';
import ReviewModal, { wasReviewShown } from '@/components/ReviewModal';

type TaskWithNotes = Task & { expanded?: boolean };

const PHASES = [
  { label: 'المرحلة ١: التحقق', weeks: [1, 2, 3, 4], color: 'text-[var(--green-deep)]',  bg: 'bg-[rgba(15,61,36,0.06)]',   border: 'border-[rgba(15,61,36,0.2)]' },
  { label: 'المرحلة ٢: البناء',  weeks: [5, 6, 7, 8], color: 'text-[var(--green-brand)]', bg: 'bg-[rgba(27,107,62,0.06)]',  border: 'border-[rgba(27,107,62,0.2)]' },
  { label: 'المرحلة ٣: النمو',   weeks: [9, 10, 11, 12], color: 'text-[var(--gold)]',     bg: 'bg-[rgba(212,166,83,0.08)]', border: 'border-[rgba(212,166,83,0.25)]' },
];

export default function JourneyPage() {
  const { supaUser, isInvestor, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlIdea = searchParams.get('idea');

  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [selectedId, persistIdeaId] = usePersistedIdeaId(urlIdea ?? '');
  const [tasks, setTasks] = useState<TaskWithNotes[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);
  const [savingNote, setSavingNote] = useState<string | null>(null);
  const [noteEdits, setNoteEdits] = useState<Record<string, string>>({});
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewPhaseLabel, setReviewPhaseLabel] = useState('');
  const prevPhaseRef = useRef<boolean[]>([false, false, false]);

  useEffect(() => {
    if (!authLoading && isInvestor) router.replace('/investor-assistant');
  }, [authLoading, isInvestor, router]);

  // Sync URL param on mount
  useEffect(() => {
    if (urlIdea) persistIdeaId(urlIdea);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!supaUser) return;
    supabase
      .from('ideas')
      .select('*')
      .eq('user_id', supaUser.id)
      .eq('stage', 'committed')
      .order('committed_at', { ascending: false })
      .then(({ data }) => {
        // Deduplicate by title
        const seen = new Set<string>();
        const unique = (data ?? []).filter(i => {
          const key = (i.title ?? '').trim().toLowerCase();
          if (seen.has(key)) return false;
          seen.add(key);
          return true;
        });
        setIdeas(unique);
        if (unique.length > 0 && !selectedId) persistIdeaId(unique[0].id);
        setLoading(false);
      });
  }, [supaUser]);

  useEffect(() => {
    if (!selectedId || !supaUser) return;
    supabase
      .from('tasks')
      .select('*')
      .eq('idea_id', selectedId)
      .eq('user_id', supaUser.id)
      .order('week', { ascending: true })
      .then(({ data }) => {
        setTasks(data ?? []);
        const edits: Record<string, string> = {};
        (data ?? []).forEach(t => { edits[t.id] = t.notes ?? ''; });
        setNoteEdits(edits);
      });
  }, [selectedId, supaUser]);

  async function toggleTask(task: TaskWithNotes) {
    if (toggling) return;
    setToggling(task.id);
    const newStatus = task.status === 'done' ? 'todo' : 'done';
    await supabase.from('tasks').update({ status: newStatus }).eq('id', task.id);
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: newStatus } : t));
    setToggling(null);
  }

  async function saveNote(taskId: string) {
    setSavingNote(taskId);
    const note = noteEdits[taskId] ?? '';
    await supabase.from('tasks').update({ notes: note || null }).eq('id', taskId);
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, notes: note || null } : t));
    setSavingNote(null);
  }

  function toggleExpand(taskId: string) {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, expanded: !t.expanded } : t));
  }

  const selectedIdea = ideas.find(i => i.id === selectedId) ?? null;
  const done = tasks.filter(t => t.status === 'done').length;
  const total = tasks.length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  // Detect phase completion transitions to trigger review modal
  useEffect(() => {
    if (!tasks.length || !selectedId) return;
    PHASES.forEach((phase, idx) => {
      const phaseTasks = tasks.filter(t => phase.weeks.includes(t.week));
      const phaseComplete = phaseTasks.length > 0 && phaseTasks.every(t => t.status === 'done');
      const wasComplete = prevPhaseRef.current[idx];
      if (phaseComplete && !wasComplete && !wasReviewShown('stage_complete', `${selectedId}_phase_${idx}`)) {
        setReviewPhaseLabel(phase.label);
        setReviewOpen(true);
      }
      prevPhaseRef.current[idx] = phaseComplete;
    });
  }, [tasks, selectedId]);

  const endDate = selectedIdea?.committed_at
    ? new Date(new Date(selectedIdea.committed_at).getTime() + 90 * 24 * 60 * 60 * 1000)
    : null;

  if (authLoading || loading) {
    return (
      <div className="p-6 max-w-3xl mx-auto space-y-4">
        <div className="h-8 w-56 bg-muted rounded animate-pulse" />
        <div className="h-48 bg-muted rounded-xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6" dir="rtl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">مشوار الـ ٩٠ يوماً</h1>
        <p className="text-muted-foreground text-sm mt-1">خطتك التنفيذية لتحويل الفكرة إلى مشروع حقيقي</p>
      </div>

      {/* Shared idea dropdown */}
      <IdeaDropdown
        selectedId={selectedId}
        onSelect={persistIdeaId}
        filterStage="committed"
        label="اختر الفكرة الملتزم بها"
      />

      {/* No committed ideas */}
      {ideas.length === 0 && (
        <div className="bg-card rounded-xl border border-dashed border-border p-10 text-center">
          <Flame className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="font-medium mb-1">لا توجد التزامات نشطة</p>
          <p className="text-muted-foreground text-sm mb-4">التزم بفكرة من صفحة رحلتي لبدء مشوار الـ ٩٠ يوماً</p>
          <Link href="/ideas" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition">
            اذهب إلى رحلتي
          </Link>
        </div>
      )}

      {ideas.length > 0 && !selectedId && (
        <div className="bg-card rounded-xl border border-dashed border-border p-10 text-center">
          <Flame className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm font-medium text-muted-foreground">اختر فكرة من القائمة أعلاه للبدء</p>
        </div>
      )}

      {selectedId && (
        <>
          {/* Progress summary */}
          {selectedIdea && (
            <div className="bg-card rounded-xl border border-border p-5">
              <div className="flex items-center justify-between gap-4 mb-3 flex-row-reverse">
                <div className="text-right">
                  <p className="font-semibold text-sm">{selectedIdea.title ?? 'فكرة بلا عنوان'}</p>
                  {endDate && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      ينتهي في {endDate.toLocaleDateString('ar-SA', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                  )}
                </div>
                <div className="text-left shrink-0">
                  <div className="text-2xl font-bold text-primary">{pct}%</div>
                  <div className="text-xs text-muted-foreground">{done}/{total} أسبوع</div>
                </div>
              </div>
              <div className="w-full h-2 rounded-full bg-border overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${pct}%`,
                    background: pct >= 80
                      ? 'hsl(144,58%,40%)'
                      : pct >= 50
                      ? 'hsl(200,72%,45%)'
                      : 'hsl(35,90%,50%)',
                  }}
                />
              </div>
              {pct >= 80 && (
                <div className="mt-3 flex items-center gap-2 flex-row-reverse" style={{ color: 'var(--green-brand)' }}>
                  <Star className="w-4 h-4" />
                  <p className="text-xs font-medium">أكملت ٨٠٪ — ملفك الاستثماري جاهز! <Link href="/pitch" className="underline">اعرضه الآن</Link></p>
                </div>
              )}
            </div>
          )}

          {/* Disclaimer note */}
          <div className="flex items-start gap-2 flex-row-reverse p-3 rounded-lg bg-secondary/50 border border-border">
            <Info className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground leading-relaxed">
              هذه مهام إرشادية مبنية على أفضل الممارسات. يمكنك تعديلها لتناسب مشروعك. الهدف: التقدم المستمر وليس الكمال.
            </p>
          </div>

          {/* Phases */}
          {PHASES.map(phase => {
            const phaseTasks = tasks.filter(t => phase.weeks.includes(t.week));
            const phaseDone = phaseTasks.filter(t => t.status === 'done').length;
            const phaseComplete = phaseTasks.length > 0 && phaseDone === phaseTasks.length;

            return (
              <div key={phase.label} className={`rounded-xl border ${phase.border} overflow-hidden`}>
                {/* Phase header */}
                <div className={`${phase.bg} px-5 py-3 flex items-center justify-between flex-row-reverse`}>
                  <div className="flex items-center gap-2 flex-row-reverse">
                    {phaseComplete
                      ? <CheckCircle2 className="w-4 h-4" style={{ color: 'var(--green-brand)' }} />
                      : <Sparkles className={`w-4 h-4 ${phase.color}`} />
                    }
                    <span className={`text-sm font-semibold ${phase.color}`}>{phase.label}</span>
                  </div>
                  <span className="text-xs font-medium text-muted-foreground">
                    {phaseDone}/{phaseTasks.length}
                  </span>
                </div>

                {/* Tasks */}
                <div className="divide-y divide-border">
                  {phaseTasks.map(task => (
                    <div key={task.id} className="bg-card">
                      {/* Task row */}
                      <div className="flex items-center gap-3 px-4 py-3 flex-row-reverse">
                        <button
                          onClick={() => toggleTask(task)}
                          disabled={toggling === task.id}
                          className="shrink-0 transition-transform active:scale-90"
                        >
                          {toggling === task.id
                            ? <div className="w-4 h-4 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin" />
                            : task.status === 'done'
                            ? <CheckCircle2 className="w-4 h-4" style={{ color: 'var(--green-mid)' }} />
                            : <Circle className="w-4 h-4 text-muted-foreground hover:text-primary transition-colors" />
                          }
                        </button>

                        <div className="flex-1 text-right min-w-0">
                          <p className={`text-sm ${task.status === 'done' ? 'line-through text-muted-foreground' : ''}`}>
                            <span className="text-xs text-muted-foreground ml-1">أسبوع {task.week}:</span>
                            {task.title}
                          </p>
                          {task.notes && !task.expanded && (
                            <p className="text-xs text-muted-foreground mt-0.5 truncate">{task.notes}</p>
                          )}
                        </div>

                        <button
                          onClick={() => toggleExpand(task.id)}
                          className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {task.expanded
                            ? <ChevronUp className="w-3.5 h-3.5" />
                            : <ChevronDown className="w-3.5 h-3.5" />
                          }
                        </button>
                      </div>

                      {/* Notes panel */}
                      {task.expanded && (
                        <div className="px-4 pb-3 bg-secondary/20">
                          <label className="block text-xs font-medium mb-1.5 text-right text-muted-foreground">
                            ملاحظاتك لهذا الأسبوع (ماذا تعلمت؟)
                          </label>
                          <textarea
                            value={noteEdits[task.id] ?? ''}
                            onChange={e => setNoteEdits(prev => ({ ...prev, [task.id]: e.target.value }))}
                            rows={3}
                            placeholder="سجّل ملاحظاتك، ما نجح، ما فشل، ماذا تعلمت..."
                            className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                            dir="rtl"
                          />
                          <div className="flex justify-end mt-2">
                            <button
                              onClick={() => saveNote(task.id)}
                              disabled={savingNote === task.id}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition disabled:opacity-60"
                            >
                              {savingNote === task.id
                                ? <div className="w-3 h-3 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                                : 'حفظ'
                              }
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}

                  {phaseTasks.length === 0 && (
                    <div className="px-5 py-4 text-center text-sm text-muted-foreground">
                      لا توجد مهام لهذه المرحلة
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </>
      )}

      <ReviewModal
        open={reviewOpen}
        trigger="stage_complete"
        triggerContext={reviewPhaseLabel}
        userRole="founder"
        onClose={() => setReviewOpen(false)}
      />
    </div>
  );
}
