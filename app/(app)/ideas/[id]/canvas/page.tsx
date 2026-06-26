'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase, Idea } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { ArrowRight, ArrowLeft, Save, CircleCheck as CheckCircle2, CircleAlert as AlertCircle, Loader as Loader2, TriangleAlert as AlertTriangle, X, Send, Sparkles, ChevronDown, ChevronUp, Plus, Trash2, DollarSign, TrendingUp } from 'lucide-react';

// ─────────────── Types ───────────────
type FinancialItem = { id: string; label: string; amount: number; type: 'cost' | 'revenue' };

type CanvasDraft = {
  value_proposition: string;
  customer_segments: string;
  channels: string;
  customer_relationships: string;
  revenue_streams: string;
  key_resources: string;
  key_activities: string;
  key_partners: string;
  cost_structure: string;
  financial_items: FinancialItem[];
};

type ValidationError = { field: string; message: string };

type AiMessage = { role: 'user' | 'assistant'; content: string };

// ─────────────── Constants ───────────────
const CANVAS_BOXES: {
  key: keyof Omit<CanvasDraft, 'financial_items'>;
  label: string;
  sublabel: string;
  hint: string;
  color: string;
  bg: string;
  span?: 'full';
}[] = [
  {
    key: 'value_proposition',
    label: 'عرض القيمة',
    sublabel: 'لماذا يختارك العميل؟',
    hint: 'صِف القيمة الفريدة التي تقدمها — ما الذي يجعلك مختلفاً؟',
    color: 'var(--green-brand)',
    bg: 'hsl(144,58%,96%)',
    span: 'full',
  },
  {
    key: 'customer_segments',
    label: 'شرائح العملاء',
    sublabel: 'لمن تبني هذا؟',
    hint: 'حدّد الجمهور بدقة — العمر، الموقع، السلوك، الاحتياج.',
    color: 'hsl(200,72%,36%)',
    bg: 'hsl(200,72%,96%)',
  },
  {
    key: 'channels',
    label: 'قنوات الوصول',
    sublabel: 'كيف تصل لعملائك؟',
    hint: 'القنوات الرقمية، المبيعات المباشرة، الشراكات، الإعلانات.',
    color: 'hsl(38,95%,36%)',
    bg: 'hsl(38,95%,96%)',
  },
  {
    key: 'customer_relationships',
    label: 'علاقات العملاء',
    sublabel: 'كيف تبني الولاء؟',
    hint: 'دعم، مجتمع، تخصيص، خدمة ذاتية، برامج ولاء.',
    color: 'hsl(280,50%,36%)',
    bg: 'hsl(280,50%,97%)',
  },
  {
    key: 'revenue_streams',
    label: 'مصادر الإيراد',
    sublabel: 'كيف تجني المال؟',
    hint: 'اشتراكات، بيع مباشر، عمولات، إعلانات، رسوم خدمة.',
    color: 'hsl(340,65%,36%)',
    bg: 'hsl(340,65%,97%)',
  },
  {
    key: 'key_resources',
    label: 'الموارد الرئيسية',
    sublabel: 'ما تحتاجه للعمل',
    hint: 'بشري، مادي، فكري، مالي — ما الأصول الجوهرية؟',
    color: 'hsl(25,80%,36%)',
    bg: 'hsl(25,80%,97%)',
  },
  {
    key: 'key_activities',
    label: 'الأنشطة الرئيسية',
    sublabel: 'ماذا تفعل كل يوم؟',
    hint: 'الإنتاج، التسويق، التطوير، خدمة العملاء.',
    color: 'hsl(160,55%,28%)',
    bg: 'hsl(160,55%,97%)',
  },
  {
    key: 'key_partners',
    label: 'الشراكات الرئيسية',
    sublabel: 'من يدعمك؟',
    hint: 'الموردون، الحلفاء الاستراتيجيون، المرخّصون.',
    color: 'hsl(220,55%,36%)',
    bg: 'hsl(220,55%,97%)',
  },
  {
    key: 'cost_structure',
    label: 'هيكل التكاليف',
    sublabel: 'ما تكلفه إدارة العمل؟',
    hint: 'تكاليف ثابتة، متغيرة، أجور، استئجار، تسويق.',
    color: 'hsl(0,60%,36%)',
    bg: 'hsl(0,60%,97%)',
  },
];

const EMPTY_DRAFT: CanvasDraft = {
  value_proposition: '',
  customer_segments: '',
  channels: '',
  customer_relationships: '',
  revenue_streams: '',
  key_resources: '',
  key_activities: '',
  key_partners: '',
  cost_structure: '',
  financial_items: [],
};

// ─────────────── Sub-components ───────────────

function Banner() {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed) return null;
  return (
    <div className="flex items-start gap-3 px-4 py-3 rounded-xl border flex-row-reverse" style={{ background: 'hsl(43,90%,96%)', borderColor: 'hsl(43,80%,72%)' }}>
      <button onClick={() => setDismissed(true)} className="shrink-0 mt-0.5 p-0.5 rounded hover:bg-black/10 transition-colors">
        <X className="w-3.5 h-3.5" style={{ color: 'var(--gold)' }} />
      </button>
      <div className="flex-1 text-right">
        <p className="text-sm font-bold mb-0.5" style={{ color: 'hsl(43,70%,28%)' }}>
          نسخة مبدئية — حدّث الأرقام بعد أول ١٠ عملاء
        </p>
        <p className="text-xs" style={{ color: 'hsl(43,60%,38%)' }}>
          الأرقام الآن تقديرية. بعد أول ١٠ عمليات بيع حقيقية، راجع التكاليف والأسعار وعدّل النموذج وفق الواقع.
        </p>
      </div>
      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" style={{ color: 'var(--gold)' }} />
    </div>
  );
}

function FinancialSection({
  items,
  onChange,
  errors,
}: {
  items: FinancialItem[];
  onChange: (items: FinancialItem[]) => void;
  errors: ValidationError[];
}) {
  const [open, setOpen] = useState(true);
  const hasError = errors.some(e => e.field === 'financial_items');

  const costs = items.filter(i => i.type === 'cost');
  const revenues = items.filter(i => i.type === 'revenue');
  const totalCosts = costs.reduce((s, i) => s + i.amount, 0);
  const totalRevenues = revenues.reduce((s, i) => s + i.amount, 0);
  const profit = totalRevenues - totalCosts;

  function addItem(type: 'cost' | 'revenue') {
    onChange([...items, { id: crypto.randomUUID(), label: '', amount: 0, type }]);
  }

  function updateItem(id: string, patch: Partial<FinancialItem>) {
    onChange(items.map(i => i.id === id ? { ...i, ...patch } : i));
  }

  function removeItem(id: string) {
    onChange(items.filter(i => i.id !== id));
  }

  return (
    <div
      className="rounded-2xl border overflow-hidden"
      style={{ borderColor: hasError ? 'hsl(0,70%,72%)' : 'hsl(42,25%,82%)' }}
    >
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-secondary/40 transition-colors flex-row-reverse"
        style={{ background: hasError ? 'hsl(0,70%,97%)' : 'hsl(0,0%,100%)' }}
      >
        <div className="flex items-center gap-2 flex-row-reverse">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'hsl(144,58%,92%)' }}>
            <DollarSign className="w-4 h-4" style={{ color: 'var(--green-brand)' }} />
          </div>
          <div className="text-right">
            <p className="font-bold text-sm" style={{ color: 'hsl(158,30%,14%)' }}>التحليل المالي</p>
            <p className="text-xs" style={{ color: 'hsl(158,15%,48%)' }}>
              {costs.length} تكاليف / {revenues.length} إيرادات
              {hasError && <span className="mr-1 text-red-600 font-bold">— يحتاج {5 - costs.length > 0 ? `${5 - costs.length} تكاليف إضافية` : 'إكمال'}</span>}
            </p>
          </div>
        </div>
        {open ? <ChevronUp className="w-4 h-4" style={{ color: 'hsl(158,15%,48%)' }} /> : <ChevronDown className="w-4 h-4" style={{ color: 'hsl(158,15%,48%)' }} />}
      </button>

      {open && (
        <div className="px-5 pb-5" style={{ background: 'hsl(0,0%,100%)' }}>
          <div className="grid md:grid-cols-2 gap-5">
            {/* Costs */}
            <div>
              <div className="flex items-center justify-between mb-3 flex-row-reverse">
                <p className="font-semibold text-sm" style={{ color: 'hsl(0,60%,36%)' }}>التكاليف (٥+ مطلوبة)</p>
                <button
                  onClick={() => addItem('cost')}
                  className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg font-medium transition-colors"
                  style={{ background: 'hsl(0,60%,96%)', color: 'var(--text-dark)' }}
                >
                  <Plus className="w-3 h-3" /> إضافة
                </button>
              </div>
              <div className="space-y-2">
                {costs.map(item => (
                  <div key={item.id} className="flex items-center gap-2">
                    <button onClick={() => removeItem(item.id)} className="p-1 rounded hover:bg-red-50 transition-colors shrink-0">
                      <Trash2 className="w-3 h-3 text-red-400" />
                    </button>
                    <input
                      type="number"
                      value={item.amount || ''}
                      onChange={e => updateItem(item.id, { amount: Number(e.target.value) })}
                      placeholder="المبلغ $"
                      className="w-24 px-2 py-1.5 rounded-lg border text-xs text-left focus:outline-none focus:ring-1"
                      style={{ borderColor: 'hsl(42,25%,82%)' }}
                      dir="ltr"
                    />
                    <input
                      value={item.label}
                      onChange={e => updateItem(item.id, { label: e.target.value })}
                      placeholder="اسم التكلفة..."
                      className="flex-1 px-2.5 py-1.5 rounded-lg border text-xs text-right focus:outline-none focus:ring-1"
                      style={{ borderColor: 'hsl(42,25%,82%)' }}
                      dir="rtl"
                    />
                  </div>
                ))}
                {costs.length === 0 && (
                  <p className="text-xs text-center py-3" style={{ color: 'hsl(158,15%,56%)' }}>أضِف تكاليفك (إيجار، رواتب، تسويق...)</p>
                )}
              </div>
              {costs.length > 0 && (
                <div className="mt-2 pt-2 border-t text-right" style={{ borderColor: 'hsl(42,25%,88%)' }}>
                  <span className="text-xs font-bold" style={{ color: 'hsl(0,60%,36%)' }}>
                    إجمالي التكاليف: ${totalCosts.toLocaleString()}
                  </span>
                </div>
              )}
            </div>

            {/* Revenues */}
            <div>
              <div className="flex items-center justify-between mb-3 flex-row-reverse">
                <p className="font-semibold text-sm" style={{ color: 'var(--green-brand)' }}>الإيرادات</p>
                <button
                  onClick={() => addItem('revenue')}
                  className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg font-medium transition-colors"
                  style={{ background: 'hsl(144,58%,94%)', color: 'var(--green-brand)' }}
                >
                  <Plus className="w-3 h-3" /> إضافة
                </button>
              </div>
              <div className="space-y-2">
                {revenues.map(item => (
                  <div key={item.id} className="flex items-center gap-2">
                    <button onClick={() => removeItem(item.id)} className="p-1 rounded hover:bg-red-50 transition-colors shrink-0">
                      <Trash2 className="w-3 h-3 text-red-400" />
                    </button>
                    <input
                      type="number"
                      value={item.amount || ''}
                      onChange={e => updateItem(item.id, { amount: Number(e.target.value) })}
                      placeholder="المبلغ $"
                      className="w-24 px-2 py-1.5 rounded-lg border text-xs text-left focus:outline-none focus:ring-1"
                      style={{ borderColor: 'hsl(42,25%,82%)' }}
                      dir="ltr"
                    />
                    <input
                      value={item.label}
                      onChange={e => updateItem(item.id, { label: e.target.value })}
                      placeholder="اسم الإيراد..."
                      className="flex-1 px-2.5 py-1.5 rounded-lg border text-xs text-right focus:outline-none focus:ring-1"
                      style={{ borderColor: 'hsl(42,25%,82%)' }}
                      dir="rtl"
                    />
                  </div>
                ))}
                {revenues.length === 0 && (
                  <p className="text-xs text-center py-3" style={{ color: 'hsl(158,15%,56%)' }}>أضِف مصادر إيرادك</p>
                )}
              </div>
              {revenues.length > 0 && (
                <div className="mt-2 pt-2 border-t text-right" style={{ borderColor: 'hsl(42,25%,88%)' }}>
                  <span className="text-xs font-bold" style={{ color: 'var(--green-brand)' }}>
                    إجمالي الإيرادات: ${totalRevenues.toLocaleString()}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Profit indicator */}
          {(costs.length > 0 || revenues.length > 0) && (
            <div
              className="mt-4 rounded-xl px-4 py-3 flex items-center justify-between flex-row-reverse"
              style={{
                background: profit >= 0 ? 'hsl(144,58%,96%)' : 'hsl(0,70%,97%)',
                border: `1px solid ${profit >= 0 ? 'hsl(144,40%,82%)' : 'hsl(0,60%,82%)'}`,
              }}
            >
              <TrendingUp className="w-4 h-4 shrink-0" style={{ color: profit >= 0 ? 'var(--green-brand)' : 'hsl(0,60%,36%)' }} />
              <div className="text-right">
                <p className="text-xs font-medium" style={{ color: 'hsl(158,15%,48%)' }}>
                  {profit >= 0 ? 'ربح تقديري شهري' : 'خسارة تقديرية شهرية'}
                </p>
                <p className="text-sm font-extrabold" style={{ color: profit >= 0 ? 'var(--green-brand)' : 'hsl(0,60%,36%)' }}>
                  {profit >= 0 ? '+' : ''}{profit.toLocaleString()} $
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function AiInterviewPanel({
  idea,
  draft,
  onFill,
  onClose,
}: {
  idea: Idea;
  draft: CanvasDraft;
  onFill: (patch: Partial<CanvasDraft>) => void;
  onClose: () => void;
}) {
  const [messages, setMessages] = useState<AiMessage[]>([
    {
      role: 'assistant',
      content: `أهلاً! أنا هنا أساعدك تبني نموذج العمل لفكرة "${idea.title}". خبّرني عن فكرتك بكلماتك الخاصة وأنا سأسألك وأملأ المربعات معك. ابدأ!`,
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function send() {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput('');
    setMessages(m => [...m, { role: 'user', content: userMsg }]);
    setLoading(true);

    const apiKey = process.env.NEXT_PUBLIC_OPENAI_KEY;

    // Build current draft summary
    const currentSummary = Object.entries(draft)
      .filter(([k]) => k !== 'financial_items')
      .map(([k, v]) => `${k}: ${(v as string).substring(0, 80) || '(فارغ)'}`)
      .join('\n');

    // If no API key, use smart rule-based fill
    if (!apiKey) {
      setTimeout(() => {
        const reply = generateSmartReply(userMsg, messages, draft, idea);
        setMessages(m => [...m, { role: 'assistant', content: reply.text }]);
        if (reply.patch) onFill(reply.patch);
        setLoading(false);
      }, 800);
      return;
    }

    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: 'gpt-4o',
          max_tokens: 600,
          messages: [
            {
              role: 'system',
              content: `أنت مستشار ريادي خبير. أنت تساعد مؤسساً عبر حوار لملء نموذج العمل التجاري (Business Model Canvas) بالعربية.

الفكرة: ${idea.title}
الوصف: ${idea.description}
القطاع: ${idea.sector}

محتوى النموذج الحالي:
${currentSummary}

قواعدك:
1. اسأل سؤالاً واحداً محدداً في كل رسالة
2. بعد كل إجابة، استخرج المعلومات الجوهرية وأضِفها للمربع المناسب
3. أجِب بـ JSON: {"text":"رسالتك للمؤسس","fill":{"box_key":"المحتوى المقترح"}}
4. box_key يجب أن يكون أحد: value_proposition, customer_segments, channels, customer_relationships, revenue_streams, key_resources, key_activities, key_partners, cost_structure
5. تحدث بالعامية العربية الودودة`
            },
            ...messages.map(m => ({ role: m.role, content: m.content })),
            { role: 'user', content: userMsg }
          ]
        })
      });
      const json = await res.json();
      const content = json.choices?.[0]?.message?.content ?? '';
      const parsed = JSON.parse(content.match(/\{[\s\S]*\}/)?.[0] ?? '{}');
      const replyText = parsed.text ?? content;
      const fill = parsed.fill ?? {};

      setMessages(m => [...m, { role: 'assistant', content: replyText }]);
      if (Object.keys(fill).length > 0) {
        onFill(fill as Partial<CanvasDraft>);
      }
    } catch {
      setMessages(m => [...m, { role: 'assistant', content: 'عفواً، حدث خطأ تقني. جرّب مرة ثانية.' }]);
    }
    setLoading(false);
  }

  return (
    <div className="fixed inset-y-0 left-0 z-50 w-full sm:w-96 flex flex-col border-r shadow-2xl" style={{ background: 'var(--white)', borderColor: 'var(--gray-light)' }} dir="rtl">
      {/* Header */}
      <div className="px-4 py-3.5 border-b flex items-center justify-between flex-row-reverse" style={{ borderColor: 'var(--gray-light)', background: 'var(--green-deep)' }}>
        <div className="flex items-center gap-2 flex-row-reverse">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'hsl(0,0%,100%,0.15)' }}>
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div className="text-right">
            <p className="font-bold text-sm text-white">مساعد الـ Canvas</p>
            <p className="text-xs" style={{ color: 'hsl(144,58%,80%)' }}>يملأ المربعات معك</p>
          </div>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-lg transition-colors" style={{ background: 'hsl(0,0%,100%,0.12)' }}>
          <X className="w-4 h-4 text-white" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-start' : 'justify-end'}`}>
            <div
              className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed text-right`}
              style={
                m.role === 'assistant'
                  ? { background: 'hsl(144,58%,94%)', color: 'var(--green-deep)', borderBottomRightRadius: '4px' }
                  : { background: 'var(--text-dark)', color: 'white', borderBottomLeftRadius: '4px' }
              }
            >
              {m.content}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-end">
            <div className="px-3.5 py-2.5 rounded-2xl" style={{ background: 'hsl(144,58%,94%)', borderBottomRightRadius: '4px' }}>
              <Loader2 className="w-4 h-4 animate-spin" style={{ color: 'var(--green-brand)' }} />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t" style={{ borderColor: 'var(--gray-light)' }}>
        <div className="flex gap-2 items-end">
          <button
            onClick={send}
            disabled={!input.trim() || loading}
            className="p-2.5 rounded-xl shrink-0 transition-all"
            style={{
              background: input.trim() && !loading ? 'var(--green-deep)' : 'var(--gray-light)',
              color: input.trim() && !loading ? 'white' : 'var(--gray-mid)',
            }}
          >
            <Send className="w-4 h-4" />
          </button>
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder="اكتب هنا..."
            rows={2}
            className="flex-1 px-3 py-2 rounded-xl border text-sm resize-none focus:outline-none focus:ring-1 text-right"
            style={{ borderColor: 'var(--gray-light)' }}
            dir="rtl"
          />
        </div>
      </div>
    </div>
  );
}

// Simple rule-based reply when no OpenAI key
function generateSmartReply(
  userMsg: string,
  _history: AiMessage[],
  draft: CanvasDraft,
  idea: Idea
): { text: string; patch?: Partial<CanvasDraft> } {
  const emptyBoxes = Object.entries(draft)
    .filter(([k, v]) => k !== 'financial_items' && (v as string).trim().length < 30)
    .map(([k]) => k);

  if (emptyBoxes.length === 0) {
    return { text: 'رائع! كل المربعات مكتملة. راجعها وتأكد أن كل محتوى واضح ومحدد، ثم اضغط "حفظ النهائي".' };
  }

  const target = emptyBoxes[0] as keyof Omit<CanvasDraft, 'financial_items'>;
  const labels: Record<string, string> = {
    value_proposition: 'عرض القيمة',
    customer_segments: 'شرائح العملاء',
    channels: 'قنوات الوصول',
    customer_relationships: 'علاقات العملاء',
    revenue_streams: 'مصادر الإيراد',
    key_resources: 'الموارد الرئيسية',
    key_activities: 'الأنشطة الرئيسية',
    key_partners: 'الشراكات الرئيسية',
    cost_structure: 'هيكل التكاليف',
  };

  const questions: Record<string, string> = {
    value_proposition: `ممتاز! لفكرة "${idea.title}" — كيف تصف القيمة التي تقدمها للعميل في جملة واضحة؟ ما الذي يجعلك مختلفاً؟`,
    customer_segments: 'من هو عميلك المثالي بالضبط؟ صِف عمره، مكانه، احتياجه، وما يجعله يدفع لك.',
    channels: 'كيف ستصل لعملائك؟ واتساب؟ إنستغرام؟ مبيعات مباشرة؟',
    customer_relationships: 'كيف ستبني علاقة طويلة مع عملائك؟ دعم؟ متابعة؟ برنامج ولاء؟',
    revenue_streams: 'كيف ستجني المال تحديداً؟ اشتراك شهري؟ رسوم لكل بيع؟ كلاهما؟',
    key_resources: 'ما الموارد الجوهرية التي تحتاجها للعمل؟ فريق؟ تقنية؟ مخزن؟',
    key_activities: 'ما النشاطات التي ستؤديها يومياً لإيصال قيمتك للعميل؟',
    key_partners: 'من الشركاء والموردون الذين تعتمد عليهم؟',
    cost_structure: 'ما أكبر تكاليفك؟ أجور؟ إيجار؟ تسويق؟ تحدث بأرقام تقريبية.',
  };

  if (userMsg.trim().length >= 20) {
    const patch: Partial<CanvasDraft> = {
      [target]: userMsg.trim().substring(0, 300),
    };
    const nextEmpty = emptyBoxes.slice(1)[0] as keyof Omit<CanvasDraft, 'financial_items'> | undefined;
    const nextQ = nextEmpty ? questions[nextEmpty] : 'كل المربعات الآن فيها محتوى! تحقق من التحليل المالي وأضِف التكاليف والإيرادات.';
    return {
      text: `ممتاز، سجّلت هذا في مربع "${labels[target]}". ${nextQ}`,
      patch,
    };
  }

  return { text: questions[target] ?? 'تابع وأخبرني أكثر عن فكرتك.' };
}

// ─────────────── Main Page ───────────────
export default function CanvasEditorPage() {
  const { id } = useParams<{ id: string }>();
  const { supaUser } = useAuth();
  const router = useRouter();

  const [idea, setIdea] = useState<Idea | null>(null);
  const [draft, setDraft] = useState<CanvasDraft>(EMPTY_DRAFT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState('');
  const [showAiPanel, setShowAiPanel] = useState(false);
  const [hasValidation, setHasValidation] = useState(false);
  const autoSaveRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const load = useCallback(async () => {
    if (!supaUser) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { router.replace('/signup'); return; }

    const [ideaRes, canvasRes, validRes] = await Promise.all([
      supabase.from('ideas').select('*').eq('id', id).eq('user_id', supaUser.id).maybeSingle(),
      fetch(`/api/canvas?ideaId=${id}`, { headers: { Authorization: `Bearer ${session.access_token}` } }),
      fetch(`/api/validate-idea?ideaId=${id}`, { headers: { Authorization: `Bearer ${session.access_token}` } }),
    ]);

    if (ideaRes.data) setIdea(ideaRes.data);

    if (canvasRes.ok) {
      const canvasData = await canvasRes.json();
      if (canvasData) {
        setDraft({
          value_proposition: canvasData.value_proposition ?? '',
          customer_segments: canvasData.customer_segments ?? '',
          channels: canvasData.channels ?? '',
          customer_relationships: canvasData.customer_relationships ?? '',
          revenue_streams: canvasData.revenue_streams ?? '',
          key_resources: canvasData.key_resources ?? '',
          key_activities: canvasData.key_activities ?? '',
          key_partners: canvasData.key_partners ?? '',
          cost_structure: canvasData.cost_structure ?? '',
          financial_items: canvasData.financial_items ?? [],
        });
      }
    }

    if (validRes.ok) {
      const validData = await validRes.json();
      setHasValidation(validData?.result === 'passed');
    }

    setLoading(false);
  }, [supaUser, id, router]);

  useEffect(() => { load(); }, [load]);

  // Auto-save on change (debounced 2s)
  const triggerAutoSave = useCallback(async (currentDraft: CanvasDraft) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    await fetch('/api/canvas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ ideaId: id, draft: currentDraft, finalSave: false }),
    });
  }, [id]);

  function handleChange(key: keyof Omit<CanvasDraft, 'financial_items'>, value: string) {
    const updated = { ...draft, [key]: value };
    setDraft(updated);
    if (autoSaveRef.current) clearTimeout(autoSaveRef.current);
    autoSaveRef.current = setTimeout(() => triggerAutoSave(updated), 2000);
  }

  function handleFinancialChange(items: FinancialItem[]) {
    const updated = { ...draft, financial_items: items };
    setDraft(updated);
    if (autoSaveRef.current) clearTimeout(autoSaveRef.current);
    autoSaveRef.current = setTimeout(() => triggerAutoSave(updated), 2000);
  }

  function handleAiFill(patch: Partial<CanvasDraft>) {
    const updated = { ...draft, ...patch };
    setDraft(updated);
    if (autoSaveRef.current) clearTimeout(autoSaveRef.current);
    autoSaveRef.current = setTimeout(() => triggerAutoSave(updated), 1000);
  }

  async function handleFinalSave() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { router.replace('/signup'); return; }
    setSaving(true);
    setSaveError('');
    setValidationErrors([]);

    const res = await fetch('/api/canvas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ ideaId: id, draft, finalSave: true }),
    });

    const data = await res.json();
    setSaving(false);

    if (res.status === 422) {
      if (data.errors) setValidationErrors(data.errors);
      if (data.error === 'score_too_low') setSaveError(data.message);
      return;
    }

    if (!res.ok) { setSaveError(data.error ?? 'خطأ غير متوقع'); return; }

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 4000);
  }

  // Progress calculation
  const filledBoxes = CANVAS_BOXES.filter(b => draft[b.key].trim().length >= 30).length;
  const totalBoxes = CANVAS_BOXES.length;
  const costs = draft.financial_items.filter(i => i.type === 'cost').length;
  const progressPct = Math.round(((filledBoxes / totalBoxes) * 0.7 + Math.min(1, costs / 5) * 0.3) * 100);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--green-brand)' }} />
      </div>
    );
  }

  if (!idea) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 min-h-screen" dir="rtl">
        <AlertCircle className="w-10 h-10" style={{ color: 'hsl(0,60%,50%)' }} />
        <p className="font-medium">الفكرة غير موجودة</p>
        <Link href="/ideas" className="text-sm text-primary hover:underline">العودة لأفكاري</Link>
      </div>
    );
  }

  return (
    <div className="relative" dir="rtl">
      {/* AI Panel overlay */}
      {showAiPanel && (
        <AiInterviewPanel
          idea={idea}
          draft={draft}
          onFill={handleAiFill}
          onClose={() => setShowAiPanel(false)}
        />
      )}

      <div className={`max-w-4xl mx-auto px-4 py-6 space-y-5 transition-all ${showAiPanel ? 'sm:mr-96' : ''}`}>

        {/* Top bar */}
        <div className="flex items-center justify-between flex-row-reverse gap-3">
          <div className="flex items-center gap-3 flex-row-reverse">
            <div className="text-right">
              <h1 className="font-bold text-lg leading-tight" style={{ color: 'var(--text-dark)' }}>
                {idea.title ?? 'نموذج العمل التجاري'}
              </h1>
              <p className="text-xs" style={{ color: 'var(--gray-mid)' }}>Canvas — نموذج العمل التجاري</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={`/ideas/${id}`}
              className="flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg border transition-colors"
              style={{ borderColor: 'var(--gray-light)', color: 'var(--gray-mid)' }}
            >
              <ArrowRight className="w-4 h-4" />
              الفكرة
            </Link>
            <button
              onClick={() => setShowAiPanel(p => !p)}
              className={`flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg border transition-all ${showAiPanel ? 'bg-primary text-primary-foreground border-primary' : ''}`}
              style={showAiPanel ? {} : { borderColor: 'var(--gray-light)', color: 'var(--green-brand)' }}
            >
              <Sparkles className="w-4 h-4" />
              <span className="hidden sm:inline">اجعل AI يعبّي معي</span>
            </button>
          </div>
        </div>

        {/* Validation gate warning */}
        {!hasValidation && (
          <div className="flex items-start gap-3 p-4 rounded-xl border flex-row-reverse" style={{ background: 'hsl(0,70%,97%)', borderColor: 'hsl(0,60%,80%)' }}>
            <div className="flex-1 text-right">
              <p className="font-bold text-sm mb-0.5" style={{ color: 'hsl(0,60%,30%)' }}>يجب اجتياز اختبار البذرة أولاً</p>
              <p className="text-xs mb-2" style={{ color: 'hsl(0,50%,40%)' }}>يمكنك الكتابة الآن، لكن الحفظ النهائي يتطلب اجتياز الاختبار الأولي.</p>
              <Link
                href={`/onboarding/validate-idea?ideaId=${id}`}
                className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg transition-all"
                style={{ background: 'hsl(0,60%,36%)', color: 'var(--white)' }}
              >
                اجتاز الاختبار الآن
                <ArrowLeft className="w-3 h-3" />
              </Link>
            </div>
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" style={{ color: 'hsl(0,60%,50%)' }} />
          </div>
        )}

        {/* Banner */}
        <Banner />

        {/* Progress */}
        <div className="rounded-2xl border px-5 py-4" style={{ background: 'var(--white)', borderColor: 'var(--gray-light)' }}>
          <div className="flex items-center justify-between mb-2 flex-row-reverse">
            <span className="text-sm font-medium" style={{ color: 'var(--text-dark)' }}>اكتمال النموذج</span>
            <span className="text-sm font-bold" style={{ color: progressPct >= 80 ? 'var(--green-brand)' : 'var(--gold)' }}>
              {progressPct}%
            </span>
          </div>
          <div className="h-2.5 rounded-full" style={{ background: 'var(--gray-light)' }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${progressPct}%`,
                background: progressPct >= 80 ? 'var(--green-brand)' : 'var(--gold)',
              }}
            />
          </div>
          <p className="text-xs mt-1.5 text-right" style={{ color: 'var(--gray-mid)' }}>
            {filledBoxes}/{totalBoxes} مربعات مكتملة (٣٠+ حرف) · {costs}/٥ تكاليف مسجّلة
          </p>
        </div>

        {/* Validation errors */}
        {validationErrors.length > 0 && (
          <div className="rounded-xl border p-4" style={{ background: 'hsl(0,70%,97%)', borderColor: 'hsl(0,60%,80%)' }}>
            <p className="font-bold text-sm mb-2 text-right" style={{ color: 'hsl(0,60%,30%)' }}>أكمل هذه النواقص قبل الحفظ النهائي:</p>
            <ul className="space-y-1">
              {validationErrors.map((e, i) => (
                <li key={i} className="text-xs text-right flex items-start gap-1.5 flex-row-reverse">
                  <span className="mt-0.5 shrink-0" style={{ color: 'hsl(0,60%,50%)' }}>•</span>
                  <span style={{ color: 'hsl(0,50%,36%)' }}>{e.message}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {saveError && (
          <div className="rounded-xl border p-4 text-right text-sm" style={{ background: 'hsl(0,70%,97%)', borderColor: 'hsl(0,60%,80%)', color: 'var(--text-dark)' }}>
            {saveError}
          </div>
        )}

        {saveSuccess && (
          <div className="rounded-xl border p-4 flex items-center gap-2 flex-row-reverse" style={{ background: 'hsl(144,58%,96%)', borderColor: 'hsl(144,40%,80%)' }}>
            <CheckCircle2 className="w-4 h-4 shrink-0" style={{ color: 'var(--green-brand)' }} />
            <span className="text-sm font-bold" style={{ color: 'var(--green-deep)' }}>تم حفظ النموذج بنجاح!</span>
          </div>
        )}

        {/* Canvas boxes */}
        <div className="space-y-3">
          {/* Value Proposition — full width */}
          {CANVAS_BOXES.filter(b => b.span === 'full').map(box => (
            <CanvasBox
              key={box.key}
              box={box}
              value={draft[box.key]}
              onChange={v => handleChange(box.key, v)}
              errors={validationErrors}
            />
          ))}

          {/* Rest — 2-col grid */}
          <div className="grid md:grid-cols-2 gap-3">
            {CANVAS_BOXES.filter(b => !b.span).map(box => (
              <CanvasBox
                key={box.key}
                box={box}
                value={draft[box.key]}
                onChange={v => handleChange(box.key, v)}
                errors={validationErrors}
              />
            ))}
          </div>
        </div>

        {/* Financial section */}
        <FinancialSection
          items={draft.financial_items}
          onChange={handleFinancialChange}
          errors={validationErrors}
        />

        {/* Save button */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pb-8 flex-row-reverse">
          <button
            onClick={handleFinalSave}
            disabled={saving || !hasValidation}
            className="flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl font-bold text-sm transition-all shadow-md hover:shadow-lg"
            style={{
              background: hasValidation && !saving ? 'var(--green-deep)' : 'var(--gray-light)',
              color: hasValidation && !saving ? 'white' : 'var(--gray-mid)',
            }}
          >
            {saving ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> يتحقق الذكاء الاصطناعي...</>
            ) : (
              <><Save className="w-4 h-4" /> حفظ النهائي (يتطلب نقاط AI ≥ ٦٠)</>
            )}
          </button>
          <p className="text-xs text-center sm:text-right" style={{ color: 'var(--gray-mid)' }}>
            يُحفظ تلقائياً كل ٢ ثانية · الحفظ النهائي يتطلب اكتمال جميع المتطلبات
          </p>
        </div>
      </div>
    </div>
  );
}

function CanvasBox({
  box,
  value,
  onChange,
  errors,
}: {
  box: typeof CANVAS_BOXES[0];
  value: string;
  onChange: (v: string) => void;
  errors: ValidationError[];
}) {
  const hasError = errors.some(e => e.field === box.key);
  const charCount = value.trim().length;
  const isComplete = charCount >= 30;

  return (
    <div
      className="rounded-xl border transition-all"
      style={{
        borderColor: hasError ? 'hsl(0,60%,72%)' : isComplete ? `${box.color}55` : 'hsl(42,25%,82%)',
      }}
    >
      <div className="px-4 pt-4 pb-1">
        <div className="flex items-start gap-2 mb-3 flex-row-reverse">
          <div className="flex-1 text-right">
            <div className="flex items-center gap-1.5 flex-row-reverse mb-0.5">
              <p className="font-bold text-sm" style={{ color: 'hsl(158,30%,14%)' }}>{box.label}</p>
              {isComplete && <CheckCircle2 className="w-3.5 h-3.5" style={{ color: 'hsl(144,58%,36%)' }} />}
            </div>
            <p className="text-xs" style={{ color: 'hsl(158,15%,52%)' }}>{box.sublabel}</p>
          </div>
          <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: box.bg }}>
            <div className="w-3 h-3 rounded-full" style={{ background: box.color }} />
          </div>
        </div>
        <p className="text-xs mb-2 text-right" style={{ color: 'hsl(158,15%,54%)' }}>{box.hint}</p>
        <textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          rows={box.span === 'full' ? 4 : 3}
          placeholder={`اكتب هنا...`}
          className="w-full px-3 py-2.5 rounded-lg border text-sm resize-none focus:outline-none focus:ring-1 text-right leading-relaxed transition-colors"
          style={{
            borderColor: hasError ? 'hsl(0,60%,72%)' : 'var(--gray-light)',
            background: hasError ? 'hsl(0,70%,99%)' : 'var(--off-white)',
            color: 'var(--text-dark)',
          }}
          dir="rtl"
        />
      </div>
      <div className="flex items-center justify-between px-4 pb-3 mt-1">
        <div />
        <span
          className={`text-xs font-medium ${isComplete ? '' : charCount > 0 ? '' : ''}`}
          style={{ color: isComplete ? 'var(--green-brand)' : charCount > 0 ? 'var(--gold)' : 'var(--gray-mid)' }}
        >
          {charCount} / ٣٠ {isComplete ? '✓' : ''}
        </span>
      </div>
    </div>
  );
}
