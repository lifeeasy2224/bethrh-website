'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase, Idea, ValidationLog, SECTORS, STAGES } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { ArrowRight, CreditCard as Edit2, Trash2, Save, X, TrendingUp, ChartBar as BarChart2, Calendar, Flame, CircleCheck as CheckCircle2, Star, LayoutGrid } from 'lucide-react';

const STAGE_COLORS: Record<string, string> = {
  ideation:   'bg-[rgba(212,166,83,0.1)] text-[var(--gold)]',
  validation: 'bg-[rgba(27,107,62,0.08)] text-[var(--green-brand)]',
  canvas:     'bg-[rgba(27,107,62,0.08)] text-[var(--green-brand)]',
  build:      'bg-[rgba(212,166,83,0.1)] text-[var(--gold)]',
  launch:     'bg-[rgba(27,107,62,0.1)] text-[var(--green-brand)]',
  growth:     'bg-[rgba(27,107,62,0.12)] text-[var(--green-brand)]',
};

const STAGE_LABELS: Record<string, string> = {
  ideation:   'الفكرة',
  validation: 'التحقق',
  canvas:     'نموذج الأعمال',
  build:      'البناء',
  launch:     'الإطلاق',
  growth:     'النمو',
};

const SECTOR_LABELS: Record<string, string> = {
  'Agri-Food': 'الغذاء الزراعي',
  'Agri-Tech': 'التكنولوجيا الزراعية',
  'Services':  'الخدمات',
  'Export':    'التصدير',
};

export default function IdeaDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { supaUser } = useAuth();
  const router = useRouter();
  const [idea, setIdea] = useState<Idea | null>(null);
  const [logs, setLogs] = useState<ValidationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', sector: '', stage: '', week: 1, validation_score: 0 });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [committing, setCommitting] = useState(false);

  async function load() {
    const { data: ideaData } = await supabase.from('ideas').select('*').eq('id', id).maybeSingle();
    const { data: logsData } = await supabase
      .from('validation_logs')
      .select('*')
      .eq('idea_id', id)
      .order('created_at', { ascending: false });
    setIdea(ideaData);
    if (ideaData) {
      setForm({
        title: ideaData.title ?? '',
        description: ideaData.description ?? '',
        sector: ideaData.sector ?? '',
        stage: ideaData.stage,
        week: ideaData.week,
        validation_score: ideaData.validation_score,
      });
    }
    setLogs(logsData ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, [id]);

  async function handleSave() {
    setSaving(true);
    await supabase.from('ideas').update(form).eq('id', id);
    setSaving(false);
    setEditing(false);
    load();
  }

  async function handleDelete() {
    if (!confirm('حذف هذه الفكرة؟ لا يمكن التراجع عن هذا الإجراء.')) return;
    setDeleting(true);
    await supabase.from('ideas').delete().eq('id', id);
    router.replace('/ideas');
  }

  async function handleCommit() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { alert('سجل دخول أولاً'); return; }

    // Prevent duplicate commitments
    const { data: existing } = await supabase
      .from('ideas')
      .select('id')
      .eq('user_id', user.id)
      .eq('stage', 'committed')
      .eq('title', idea?.title ?? '')
      .maybeSingle();
    if (existing) {
      alert('لديك التزام نشط بهذه الفكرة بالفعل.');
      return;
    }

    setCommitting(true);

    const { data: seed } = await supabase.from('ideas').select('*').eq('id', id).maybeSingle();
    if (!seed) { setCommitting(false); return; }

    const { data: newIdea } = await supabase
      .from('ideas')
      .insert({
        title: seed.title,
        description: seed.description,
        sector: seed.sector,
        difficulty: (seed as any).difficulty,
        stage: 'committed',
        week: 1,
        user_id: user.id,
      })
      .select()
      .maybeSingle();

    if (!newIdea) { setCommitting(false); return; }

    const tasks = [
      { title: (seed as any).first_step_48h ?? 'نفّذ الخطوة الأولى خلال 48 ساعة', week: 1 },
      { title: 'تحدث مع 10 عملاء محتملين', week: 2 },
      { title: 'اصنع نموذج أولي', week: 3 },
      { title: 'احصل على أول دفعة', week: 4 },
      { title: 'عدل المنتج حسب التعليقات', week: 5 },
      { title: 'بيع لـ3 عملاء', week: 6 },
      { title: 'شغل إعلانات واتساب', week: 7 },
      { title: 'وظف أول مساعد', week: 8 },
      { title: 'أتمتة عملية واحدة', week: 9 },
      { title: 'وسع الفريق', week: 10 },
      { title: 'ضاعف الإيرادات', week: 11 },
      { title: 'خطط للتوسع', week: 12 },
    ].map(t => ({ ...t, idea_id: newIdea.id, user_id: user.id, status: 'todo' }));

    await supabase.from('tasks').insert(tasks);

    setCommitting(false);
    router.push('/dashboard');
  }

  const isCommitted = idea?.committed_user_id === supaUser?.id && !!idea?.committed_at;

  const inputCls = 'w-full px-3.5 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring';

  if (loading) {
    return (
      <div className="p-6 max-w-3xl mx-auto space-y-4">
        <div className="h-8 w-48 bg-muted rounded animate-pulse" />
        <div className="h-48 bg-muted rounded-xl animate-pulse" />
      </div>
    );
  }

  if (!idea) {
    return (
      <div className="p-6 max-w-3xl mx-auto text-center">
        <p className="text-muted-foreground">الفكرة غير موجودة.</p>
        <Link href="/ideas" className="text-primary hover:underline mt-4 block">العودة للأفكار</Link>
      </div>
    );
  }

  const totalInterviews = logs.reduce((s, l) => s + l.interviews, 0);
  const totalSignups = logs.reduce((s, l) => s + l.signups, 0);
  const totalRevenue = logs.reduce((s, l) => s + l.preorders_usd, 0);

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6" dir="rtl">
      <div className="flex items-center gap-3 flex-row-reverse">
        <Link href="/ideas" className="p-1.5 rounded-lg hover:bg-secondary transition-colors">
          <ArrowRight className="w-4 h-4" />
        </Link>
        <h1 className="text-xl font-bold flex-1 truncate text-right">{idea.title ?? 'فكرة بلا عنوان'}</h1>
        <button onClick={() => setEditing(!editing)} className="p-1.5 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground">
          {editing ? <X className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
        </button>
        <button onClick={handleDelete} disabled={deleting} className="p-1.5 rounded-lg hover:bg-destructive/10 transition-colors text-muted-foreground hover:text-destructive">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Detail / Edit card */}
      <div className="bg-card rounded-xl border border-border p-5">
        {editing ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5 text-right">العنوان</label>
              <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className={inputCls} dir="rtl" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5 text-right">الوصف</label>
              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={4} className={`${inputCls} resize-none`} dir="rtl" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5 text-right">القطاع</label>
                <select value={form.sector} onChange={e => setForm(f => ({ ...f, sector: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                  <option value="">لا يوجد</option>
                  {SECTORS.map(s => <option key={s} value={s}>{SECTOR_LABELS[s] ?? s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5 text-right">المرحلة</label>
                <select value={form.stage} onChange={e => setForm(f => ({ ...f, stage: e.target.value }))} className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                  {STAGES.map(s => <option key={s} value={s}>{STAGE_LABELS[s] ?? s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5 text-right">الأسبوع</label>
                <input type="number" min={1} max={12} value={form.week} onChange={e => setForm(f => ({ ...f, week: parseInt(e.target.value) || 1 }))} className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5 text-right">النقاط</label>
                <input type="number" min={0} value={form.validation_score} onChange={e => setForm(f => ({ ...f, validation_score: parseInt(e.target.value) || 0 }))} className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
              </div>
            </div>
            <div className="flex gap-3 flex-row-reverse">
              <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition disabled:opacity-60">
                {saving ? <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" /> : <><Save className="w-3.5 h-3.5" /> حفظ</>}
              </button>
              <button onClick={() => setEditing(false)} className="px-4 py-2 rounded-lg text-sm font-medium border border-border hover:bg-secondary transition">إلغاء</button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2 flex-row-reverse">
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STAGE_COLORS[idea.stage] ?? 'bg-secondary text-secondary-foreground'}`}>
                {STAGE_LABELS[idea.stage] ?? idea.stage}
              </span>
              {idea.sector && (
                <span className="text-xs px-2.5 py-1 rounded-full bg-secondary text-secondary-foreground">
                  {SECTOR_LABELS[idea.sector] ?? idea.sector}
                </span>
              )}
              <span className="text-xs px-2.5 py-1 rounded-full bg-secondary text-secondary-foreground flex items-center gap-1">
                <Calendar className="w-3 h-3" /> أسبوع {idea.week}
              </span>
              <span className="text-xs px-2.5 py-1 rounded-full bg-secondary text-secondary-foreground flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> النقاط: {idea.validation_score}
              </span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed text-right">
              {idea.description ?? 'لا يوجد وصف.'}
            </p>

            {/* 90-day commitment */}
            {isCommitted ? (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-[rgba(212,166,83,0.06)] border border-[rgba(212,166,83,0.25)] flex-row-reverse">
                <Flame className="w-5 h-5 shrink-0" style={{ color: 'var(--gold)' }} />
                <div className="flex-1 text-right">
                  <p className="text-sm font-semibold" style={{ color: 'var(--gold)' }}>ملتزم بهذه الفكرة لـ 90 يوم</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--gold)' }}>
                    بدأ في {new Date(idea.committed_at!).toLocaleDateString('ar-SA', { day: 'numeric', month: 'long', year: 'numeric' })}
                    {' — '}ينتهي في {new Date(new Date(idea.committed_at!).getTime() + 90 * 24 * 60 * 60 * 1000).toLocaleDateString('ar-SA', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
                <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: 'var(--gold)' }} />
              </div>
            ) : (
              <button
                onClick={handleCommit}
                disabled={committing}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 active:scale-[0.99] transition-all disabled:opacity-60 flex-row-reverse"
              >
                {committing ? (
                  <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Flame className="w-4 h-4" />
                )}
                التزام 90 يوم
              </button>
            )}
          </div>
        )}
      </div>

      {/* Validation summary */}
      <div>
        <div className="flex items-center justify-between mb-3 flex-row-reverse">
          <h2 className="text-base font-semibold">تقدم التحقق</h2>
          <Link href={`/validation?idea=${idea.id}`} className="text-sm text-primary hover:underline flex items-center gap-1 flex-row-reverse">
            <BarChart2 className="w-3.5 h-3.5" /> تسجيل إدخال
          </Link>
        </div>
        <div className="grid grid-cols-3 gap-3 mb-4">
          {[
            { label: 'مقابلات', value: totalInterviews },
            { label: 'تسجيلات', value: totalSignups },
            { label: 'الإيرادات', value: `$${totalRevenue}` },
          ].map(({ label, value }) => (
            <div key={label} className="bg-card rounded-xl border border-border p-4 text-center">
              <div className="text-2xl font-bold">{value}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
            </div>
          ))}
        </div>

        {logs.length > 0 ? (
          <div className="space-y-2">
            {logs.slice(0, 5).map(log => (
              <div key={log.id} className="bg-card rounded-xl border border-border p-4">
                <div className="flex items-center gap-4 text-sm flex-wrap flex-row-reverse">
                  <span className="text-muted-foreground text-xs">{new Date(log.created_at).toLocaleDateString('ar-SA', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  <span className="text-xs">{log.interviews} مقابلات</span>
                  <span className="text-xs">{log.signups} تسجيلات</span>
                  <span className="text-xs">${log.preorders_usd}</span>
                </div>
                {log.notes && <p className="text-xs text-muted-foreground mt-2 line-clamp-2 text-right">{log.notes}</p>}
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-card rounded-xl border border-dashed border-border p-6 text-center">
            <p className="text-muted-foreground text-sm">لا توجد سجلات تحقق بعد.</p>
            <Link href={`/validation?idea=${idea.id}`} className="text-primary text-sm hover:underline mt-1 block">سجّل أول إدخال للتحقق ←</Link>
          </div>
        )}
      </div>

      {/* Canvas CTA */}
      <div className="bg-card rounded-xl border border-border p-5 flex items-center gap-4 flex-row-reverse">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'rgba(27,107,62,0.07)' }}>
          <LayoutGrid className="w-5 h-5" style={{ color: 'var(--green-brand)' }} />
        </div>
        <div className="flex-1 text-right">
          <p className="font-semibold text-sm">نموذج العمل التجاري</p>
          <p className="text-xs text-muted-foreground mt-0.5">ابنِ الـ Canvas الكامل بـ ٩ مربعات + تحليل مالي</p>
        </div>
        <Link
          href={`/ideas/${id}/canvas`}
          className="shrink-0 flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-semibold transition flex-row-reverse"
          style={{ background: 'var(--green-brand)' }}
        >
          <LayoutGrid className="w-3.5 h-3.5" />
          ابدأ
        </Link>
      </div>

      {/* Score CTA */}
      <div className="bg-card rounded-xl border border-border p-5 flex items-center gap-4 flex-row-reverse">
        <div className="w-10 h-10 rounded-xl bg-[rgba(212,166,83,0.1)] flex items-center justify-center shrink-0">
          <Star className="w-5 h-5" style={{ color: 'var(--gold)' }} />
        </div>
        <div className="flex-1 text-right">
          <p className="font-semibold text-sm">تقويم الفكرة</p>
          <p className="text-xs text-muted-foreground mt-0.5">قيّم فكرتك من ١٠٠ بناءً على ٦ معايير ريادية</p>
        </div>
        <Link
          href={`/ideas/${id}/score`}
          className="shrink-0 flex items-center gap-2 px-4 py-2 rounded-lg text-white text-sm font-semibold transition flex-row-reverse"
          style={{ background: 'var(--gold)', color: 'var(--green-deep)' }}
        >
          <Star className="w-3.5 h-3.5" />
          تقويم
        </Link>
      </div>
    </div>
  );
}
