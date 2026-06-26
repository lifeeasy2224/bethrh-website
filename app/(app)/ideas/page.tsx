'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase, Idea, SECTORS, STAGES } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { useRouter, useSearchParams } from 'next/navigation';
import { Plus, Lightbulb, TrendingUp, Search, CircleCheck as CheckCircle2, Flame, Circle } from 'lucide-react';
import { Task } from '@/lib/supabase';
import IdeaDropdown, { usePersistedIdeaId } from '@/components/IdeaDropdown';

const STAGE_COLORS: Record<string, string> = {
  ideation: 'bg-[rgba(212,166,83,0.1)] text-[var(--gold)] border-[rgba(212,166,83,0.25)]',
  canvas:   'bg-[rgba(27,107,62,0.08)] text-[var(--green-brand)] border-[rgba(27,107,62,0.2)]',
  pitch:    'bg-[rgba(15,61,36,0.08)] text-[var(--green-deep)] border-[rgba(15,61,36,0.2)]',
  growth:   'bg-[rgba(27,107,62,0.12)] text-[var(--green-brand)] border-[rgba(27,107,62,0.2)]',
};

const STAGE_LABELS: Record<string, string> = {
  ideation: 'الفكرة',
  canvas:   'النموذج',
  pitch:    'عرض للتمويل',
  growth:   'مشوار الـ 90 يوم',
};

const SECTOR_LABELS: Record<string, string> = {
  // التكنولوجيا
  'FinTech':           'تكنولوجيا مالية',
  'EdTech':            'تكنولوجيا تعليمية',
  'HealthTech':        'تكنولوجيا صحية',
  'AgriTech':          'تكنولوجيا زراعية',
  'LogisticsTech':     'تكنولوجيا لوجستية',
  'PropTech':          'تكنولوجيا عقارية',
  'LegalTech':         'تكنولوجيا قانونية',
  'HRTech':            'تكنولوجيا موارد بشرية',
  'CleanTech':         'تكنولوجيا نظيفة',
  'FoodTech':          'تكنولوجيا غذائية',
  // التجارة والخدمات
  'E-Commerce':        'التجارة الإلكترونية',
  'Retail':            'التجزئة',
  'Food & Beverage':   'الغذاء والمشروبات',
  'Fashion & Apparel': 'الأزياء والملبوسات',
  'Beauty & Wellness': 'الجمال والعافية',
  'Tourism & Hospitality': 'السياحة والضيافة',
  'Events & Entertainment': 'الفعاليات والترفيه',
  'Media & Content':   'الإعلام والمحتوى',
  'Advertising & Marketing': 'الإعلان والتسويق',
  // الرعاية والتعليم
  'Healthcare & Clinics': 'الرعاية الصحية والعيادات',
  'Education & Training': 'التعليم والتدريب',
  'Childcare & Family':   'رعاية الأطفال والأسرة',
  'Social Impact':        'الأثر الاجتماعي',
  // الصناعة والزراعة
  'Agriculture & Farming': 'الزراعة والمزارع',
  'Food Export':           'تصدير الغذاء',
  'Manufacturing':         'التصنيع',
  'Construction & Infrastructure': 'البناء والبنية التحتية',
  'Energy & Sustainability':       'الطاقة والاستدامة',
  // المال والأعمال
  'Financial Services':   'الخدمات المالية',
  'Consulting & Advisory': 'الاستشارات',
  'Legal & Compliance':   'القانون والامتثال',
  'Accounting & Tax':     'المحاسبة والضرائب',
  'HR & Recruitment':     'الموارد البشرية والتوظيف',
  // العقارات والخدمات المنزلية
  'Real Estate':    'العقارات',
  'Home Services':  'الخدمات المنزلية',
  'Furniture & Decor': 'الأثاث والديكور',
  // الخدمات اللوجستية
  'Delivery & Logistics': 'التوصيل واللوجستيات',
  'Supply Chain':         'سلسلة التوريد',
  'Import & Export':      'الاستيراد والتصدير',
  // أخرى
  'SaaS / Software': 'برمجيات / SaaS',
  'Gaming & Esports': 'الألعاب والرياضات الإلكترونية',
  'Sports & Fitness': 'الرياضة واللياقة',
  'Automotive':       'السيارات',
  'Pets & Animals':   'الحيوانات الأليفة',
  'Nonprofit':        'غير ربحي',
  'Other':            'أخرى',
};

const TaskRow = ({ task }: { task: Task }) => (
  <div className="flex items-center gap-2 flex-row-reverse py-1">
    {task.status === 'done'
      ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--green-brand)' }} />
      : <Circle className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
    }
    <span className={`text-xs flex-1 text-right ${task.status === 'done' ? 'line-through text-muted-foreground' : ''}`}>
      {task.title}
    </span>
    <span className="text-[10px] text-muted-foreground shrink-0">أسبوع {task.week}</span>
  </div>
);

const IdeaCard = ({ idea, onCommit, committing, isCommitted }: {
  idea: Idea;
  onCommit: (e: React.MouseEvent, idea: Idea) => void;
  committing: string | null;
  isCommitted: boolean;
}) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [showTasks, setShowTasks] = useState(false);

  useEffect(() => {
    if (!showTasks) return;
    supabase
      .from('tasks')
      .select('*')
      .eq('idea_id', idea.id)
      .order('week', { ascending: true })
      .then(({ data }) => setTasks(data ?? []));
  }, [showTasks, idea.id]);

  return (
    <div className={`group bg-card rounded-xl border transition-all ${isCommitted ? 'border-[rgba(212,166,83,0.3)] bg-[rgba(212,166,83,0.05)]' : 'border-border hover:border-primary/40 hover:shadow-sm'}`}>
      <Link href={`/ideas/${idea.id}`} className="block p-5">
        <div className="flex items-start gap-4 flex-row-reverse">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${isCommitted ? 'bg-[rgba(212,166,83,0.1)]' : 'bg-primary/10'}`}>
            {isCommitted
              ? <Flame className="w-5 h-5" style={{ color: 'var(--gold)' }} />
              : <Lightbulb className="w-5 h-5 text-primary" />
            }
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-4 flex-row-reverse">
              <div className="min-w-0 text-right">
                <h3 className="font-semibold text-sm group-hover:text-primary transition-colors">{idea.title ?? 'فكرة بلا عنوان'}</h3>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{idea.description ?? 'لا يوجد وصف'}</p>
              </div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                <TrendingUp className="w-3.5 h-3.5" />
                <span className="font-medium">{idea.validation_score}</span>
              </div>
            </div>

            <div className="flex items-center justify-between mt-3 flex-row-reverse gap-3 flex-wrap">
              <div className="flex items-center gap-2 flex-wrap flex-row-reverse">
                <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${STAGE_COLORS[idea.stage] ?? 'bg-secondary text-secondary-foreground border-border'}`}>
                  {STAGE_LABELS[idea.stage] ?? idea.stage}
                </span>
                {idea.sector && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
                    {SECTOR_LABELS[idea.sector] ?? idea.sector}
                  </span>
                )}
                <span className="text-xs text-muted-foreground">أسبوع {idea.week}</span>
                {isCommitted && idea.committed_at && (
                  <span className="text-xs font-medium flex items-center gap-1" style={{ color: 'var(--gold)' }}>
                    <CheckCircle2 className="w-3 h-3" />
                    ملتزم منذ {new Date(idea.committed_at).toLocaleDateString('ar-SA', { day: 'numeric', month: 'short' })}
                  </span>
                )}
              </div>

              <button
                onClick={(e) => onCommit(e, idea)}
                disabled={committing === idea.id || isCommitted}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all shrink-0 flex-row-reverse ${
                  isCommitted
                    ? 'bg-[rgba(212,166,83,0.1)] border-[rgba(212,166,83,0.3)] cursor-default'
                    : 'bg-primary/5 text-primary border-primary/30 hover:bg-primary hover:text-primary-foreground hover:border-primary active:scale-95'
                }`}
                style={isCommitted ? { color: 'var(--gold)' } : {}}
              >
                {committing === idea.id ? (
                  <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : isCommitted ? (
                  <CheckCircle2 className="w-3.5 h-3.5" />
                ) : (
                  <Flame className="w-3.5 h-3.5" />
                )}
                {isCommitted ? 'ملتزم · 90 يوم' : 'التزام 90 يوم'}
              </button>
            </div>
          </div>
        </div>
      </Link>

      {/* Tasks toggle */}
      <div className="border-t border-border px-5 py-2">
        <button
          onClick={() => setShowTasks(v => !v)}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors flex-row-reverse w-full justify-end"
        >
          <span>{showTasks ? 'إخفاء المهام' : 'عرض المهام'}</span>
          <CheckCircle2 className="w-3.5 h-3.5" />
        </button>
        {showTasks && (
          <div className="mt-2 space-y-0.5 pb-1">
            {tasks.length === 0
              ? <p className="text-xs text-muted-foreground text-right py-1">لا توجد مهام لهذه الفكرة</p>
              : tasks.map(task => <TaskRow key={task.id} task={task} />)
            }
          </div>
        )}
      </div>
    </div>
  );
};

export default function IdeasPage() {
  const { supaUser } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [filterStage, setFilterStage] = useState(() => searchParams.get('stage') ?? '');
  const [filterSector, setFilterSector] = useState('');
  const [committing, setCommitting] = useState<string | null>(null);
  const [selectedId, persistIdeaId] = usePersistedIdeaId();

  const [form, setForm] = useState({ title: '', description: '', sector: '', stage: 'ideation', week: 1 });
  const [saving, setSaving] = useState(false);

  async function load() {
    if (!supaUser) return;
    const { data } = await supabase
      .from('ideas')
      .select('*')
      .eq('user_id', supaUser.id)
      .order('created_at', { ascending: false });
    console.log('Real data from Supabase:', data);
    console.log('Ideas length:', data?.length);
    console.log('Current user:', supaUser.id);
    setIdeas(data || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, [supaUser]);

  useEffect(() => {
    const stage = searchParams.get('stage') ?? '';
    setFilterStage(stage);
  }, [searchParams]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!supaUser) return;
    setSaving(true);
    const { error } = await supabase.from('ideas').insert({ user_id: supaUser.id, ...form });
    if (error) {
      alert('فشل حفظ الفكرة: ' + error.message);
      setSaving(false);
      return;
    }
    setForm({ title: '', description: '', sector: '', stage: 'ideation', week: 1 });
    setShowForm(false);
    setSaving(false);
    load();
  }

  async function handleCommit(e: React.MouseEvent, seedIdea: Idea) {
    e.preventDefault();
    e.stopPropagation();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { alert('سجل دخول أولاً'); return; }

    // Prevent duplicate commitments for the same idea
    const { data: existing } = await supabase
      .from('ideas')
      .select('id')
      .eq('user_id', user.id)
      .eq('stage', 'committed')
      .eq('title', seedIdea.title ?? '')
      .maybeSingle();
    if (existing) {
      alert('لديك التزام نشط بهذه الفكرة بالفعل.');
      return;
    }

    setCommitting(seedIdea.id);

    const { data: seed } = await supabase.from('ideas').select('*').eq('id', seedIdea.id).maybeSingle();
    if (!seed) { setCommitting(null); return; }

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

    if (!newIdea) { setCommitting(null); return; }

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

    setCommitting(null);
    router.push('/dashboard');
  }

  const isCommitted = (idea: Idea) =>
    idea.committed_user_id === supaUser?.id && !!idea.committed_at;

  const filtered = ideas.filter(i => {
    const q = search.toLowerCase();
    return (
      (!q || i.title?.toLowerCase().includes(q) || i.description?.toLowerCase().includes(q)) &&
      (!filterStage || i.stage === filterStage) &&
      (!filterSector || i.sector === filterSector)
    );
  });

  const inputCls = 'w-full px-3.5 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring';

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6" dir="rtl">
      <div className="flex items-center justify-between flex-row-reverse">
        <div className="text-right">
          <h1 className="text-2xl font-bold">رحلتي</h1>
          <p className="text-muted-foreground text-sm mt-1">{ideas.length} فكرة في رحلتك</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition flex-row-reverse"
        >
          <Plus className="w-4 h-4" />
          فكرة جديدة
        </button>
      </div>

      {/* Shared idea dropdown — persists selection across all رحلتي sub-pages */}
      <IdeaDropdown
        selectedId={selectedId}
        onSelect={persistIdeaId}
        label="الفكرة المحددة:"
        showEmptyHint={false}
      />

      {/* New idea form */}
      {showForm && (
        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="font-semibold mb-4 text-right">إضافة فكرة جديدة</h3>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium mb-1.5 text-right">العنوان</label>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required placeholder="مثال: تصدير زيت الزيتون مباشرة للمستهلك" className={inputCls} dir="rtl" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium mb-1.5 text-right">الوصف</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} placeholder="صف فكرة مشروعك..." className={`${inputCls} resize-none`} dir="rtl" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5 text-right">القطاع</label>
                <select value={form.sector} onChange={e => setForm(f => ({ ...f, sector: e.target.value }))} className={inputCls}>
                  <option value="">اختر القطاع</option>
                  {SECTORS.map(s => <option key={s} value={s}>{SECTOR_LABELS[s] ?? s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5 text-right">المرحلة</label>
                <select value={form.stage} onChange={e => setForm(f => ({ ...f, stage: e.target.value }))} className={inputCls}>
                  {STAGES.map(s => <option key={s} value={s}>{STAGE_LABELS[s] ?? s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5 text-right">الأسبوع</label>
                <input type="number" min={1} max={12} value={form.week} onChange={e => setForm(f => ({ ...f, week: parseInt(e.target.value) || 1 }))} className={inputCls} />
              </div>
            </div>
            <div className="flex gap-3 flex-row-reverse">
              <button type="submit" disabled={saving} className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition disabled:opacity-60">
                {saving ? <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" /> : 'حفظ الفكرة'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg text-sm font-medium border border-border hover:bg-secondary transition">إلغاء</button>
            </div>
          </form>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 flex-row-reverse">
        <div className="relative flex-1">
          <Search className="absolute top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground right-3" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="ابحث في الأفكار..." className="w-full py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring pr-9 pl-3.5" dir="rtl" />
        </div>
        <select value={filterStage} onChange={e => setFilterStage(e.target.value)} className="px-3.5 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring">
          <option value="">كل المراحل</option>
          {STAGES.map(s => <option key={s} value={s}>{STAGE_LABELS[s] ?? s}</option>)}
        </select>
        <select value={filterSector} onChange={e => setFilterSector(e.target.value)} className="px-3.5 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring">
          <option value="">كل القطاعات</option>
          {SECTORS.map(s => <option key={s} value={s}>{SECTOR_LABELS[s] ?? s}</option>)}
        </select>
      </div>

      {/* Ideas list */}
      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />)}</div>
      ) : filtered.length === 0 ? (
        <div className="bg-card rounded-xl border border-dashed border-border p-12 text-center">
          <Lightbulb className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="font-medium mb-1">{ideas.length === 0 ? 'لا توجد أفكار بعد' : 'لا توجد أفكار مطابقة'}</p>
          <p className="text-muted-foreground text-sm">{ideas.length === 0 ? 'انقر على "فكرة جديدة" لإضافة أول فكرة لمشروعك.' : 'حاول تعديل البحث أو الفلاتر.'}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(idea => (
            <IdeaCard
              key={idea.id}
              idea={idea}
              onCommit={handleCommit}
              committing={committing}
              isCommitted={isCommitted(idea)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
