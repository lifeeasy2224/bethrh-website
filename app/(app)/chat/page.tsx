'use client';

import { useEffect, useRef, useState } from 'react';
import { supabase, AiChat } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { Send, Bot, User, Sparkles, Trash2 } from 'lucide-react';

const STARTER_PROMPTS = [
  'كيف أتحقق من فكرة مشروعي في السوق؟',
  'ما أفضل القطاعات لرواد الأعمال في الشرق الأوسط؟',
  'كيف أجد أول 10 عملاء لي؟',
  'ساعدني في كتابة عرض القيمة',
];

function buildMockResponse(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes('تحقق') || lower.includes('فكرة') || lower.includes('validate')) {
    return 'سؤال ممتاز! للتحقق من فكرتك في أسواق الشرق الأوسط، ابدأ بـ 10 مقابلات مع عملاء محتملين قبل البناء. ركّز على: (١) هل هذه مشكلة حقيقية؟ (٢) كيف يحلونها اليوم؟ (٣) هل سيدفعون مقابل حل أفضل؟ استهدف الحصول على 3 طلبات مسبقة أو 20 تسجيلاً كأول هدف. سجّل كل شيء في متتبع التحقق هنا.';
  }
  if (lower.includes('قطاع') || lower.includes('زراعي') || lower.includes('غذاء')) {
    return 'القطاعات الأربعة الرئيسية ذات الفرص الكبيرة في منطقة الشرق الأوسط: **التقنية والفينتك** (حلول الدفع، الخدمات المالية)، **الرعاية الصحية** (الصحة الرقمية، العيادات)، **التجارة الإلكترونية** (المنتجات المحلية، اللوجستيات)، و**التعليم** (التعلم الإلكتروني، المهارات التقنية). أي قطاع يثير اهتمامك أكثر؟';
  }
  if (lower.includes('عميل') || lower.includes('أول')) {
    return 'للعثور على أول 10 عملاء: (١) ابدأ بشبكتك الشخصية — من يعاني من المشكلة التي تحلها؟ (٢) انشر في مجموعات LinkedIn وتويتر ذات الصلة بقطاعك. (٣) زر 3 شركات أو مجمعات أعمال محلية شخصياً. (٤) اطلب من كل عميل إحالة واحدة. الهدف ليس التوسع بعد — بل التعلم. ما هي فكرتك؟';
  }
  if (lower.includes('عرض القيمة') || lower.includes('value')) {
    return 'عرض القيمة القوي يتبع هذه الصيغة: **"نساعد [نوع العميل] الذي [يعاني من هذه المشكلة] على [تحقيق هذه النتيجة] بخلاف [البدائل الحالية]."** مثال: "نساعد الشركات الصغيرة في الخليج على تحصيل مدفوعاتها بسرعة أكبر بنسبة 40% عبر منصتنا الرقمية." ما هو نوع عميلك ومشكلته؟';
  }
  if (lower.includes('إيرادات') || lower.includes('تسعير') || lower.includes('نموذج')) {
    return 'لمرحلة الانطلاق، فكّر في هذه النماذج: (١) **المبيعات المباشرة** — مناسب للمنتجات الملموسة. (٢) **الاشتراك** — رسوم شهرية للقيمة المستمرة. (٣) **العمولة** — نسبة من المعاملات، مخاطر أقل. ابدأ بما يحتاج أقل قدر من بناء الثقة. ما نموذج عملك؟';
  }
  return 'سؤال رائع! لأقدم لك أفضل نصيحة، هل يمكنك إخباري بـ: (١) فكرة مشروعك أو قطاعه، (٢) التحدي المحدد الذي تواجهه، (٣) المرحلة التي أنت فيها (فكرة، تحقق، بناء)؟ هذا سيساعدني على تخصيص إجابتي.';
}

export default function ChatPage() {
  const { supaUser } = useAuth();
  const [messages, setMessages] = useState<AiChat[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [thinking, setThinking] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!supaUser) return;
    supabase
      .from('ai_chats')
      .select('*')
      .eq('user_id', supaUser.id)
      .order('created_at', { ascending: true })
      .then(({ data }) => {
        setMessages((data as AiChat[]) ?? []);
        setLoading(false);
      });
  }, [supaUser]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, thinking]);

  async function sendMessage(text?: string) {
    const msg = (text ?? input).trim();
    if (!msg || !supaUser) return;
    setInput('');

    const userMsg: AiChat = {
      id: `temp-${Date.now()}`,
      user_id: supaUser.id,
      role: 'user',
      message: msg,
      created_at: new Date().toISOString(),
    };
    setMessages(m => [...m, userMsg]);
    setThinking(true);

    await Promise.all([
      supabase.from('ai_chats').insert({ user_id: supaUser.id, role: 'user', message: msg }),
      supabase.from('question_logs').insert({ user_id: supaUser.id, question: msg }),
    ]);
    await new Promise(r => setTimeout(r, 900 + Math.random() * 700));

    const reply = buildMockResponse(msg);
    const aiMsg: AiChat = {
      id: `temp-ai-${Date.now()}`,
      user_id: supaUser.id,
      role: 'assistant',
      message: reply,
      created_at: new Date().toISOString(),
    };

    await supabase.from('ai_chats').insert({ user_id: supaUser.id, role: 'assistant', message: reply });
    setMessages(m => [...m, aiMsg]);
    setThinking(false);
  }

  async function clearHistory() {
    if (!supaUser || !confirm('مسح كل سجل المحادثة؟')) return;
    await supabase.from('ai_chats').delete().eq('user_id', supaUser.id);
    setMessages([]);
  }

  function formatMessage(text: string) {
    return text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  }

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)] md:h-screen" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card shrink-0 flex-row-reverse">
        <div className="flex items-center gap-3 flex-row-reverse">
          <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
            <Sparkles style={{ width: 18, height: 18 }} className="text-primary" />
          </div>
          <div className="text-right">
            <h1 className="font-semibold text-sm">مدرب المشاريع الذكي</h1>
            <p className="text-xs text-muted-foreground">متخصص في أسواق الشرق الأوسط</p>
          </div>
        </div>
        {messages.length > 0 && (
          <button onClick={clearHistory} className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : messages.length === 0 ? (
          <div className="max-w-lg mx-auto">
            <div className="text-center mb-8">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-7 h-7 text-primary" />
              </div>
              <h2 className="font-semibold text-lg mb-1">مدرب مشاريعك الذكي</h2>
              <p className="text-muted-foreground text-sm">اسأل أي شيء عن التحقق من فكرتك أو إيجاد العملاء أو تنمية مشروعك.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {STARTER_PROMPTS.map(prompt => (
                <button
                  key={prompt}
                  onClick={() => sendMessage(prompt)}
                  className="text-right px-4 py-3 rounded-xl border border-border bg-card hover:border-primary/40 hover:bg-primary/5 text-sm transition-all"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map(msg => (
              <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${msg.role === 'user' ? 'bg-primary' : 'bg-primary/10'}`}>
                  {msg.role === 'user'
                    ? <User className="w-3.5 h-3.5 text-primary-foreground" />
                    : <Bot className="w-3.5 h-3.5 text-primary" />
                  }
                </div>
                <div
                  className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground rounded-tl-sm'
                      : 'bg-card border border-border rounded-tr-sm'
                  }`}
                  dir="rtl"
                  dangerouslySetInnerHTML={{ __html: formatMessage(msg.message) }}
                />
              </div>
            ))}
            {thinking && (
              <div className="flex gap-3">
                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Bot className="w-3.5 h-3.5 text-primary" />
                </div>
                <div className="px-4 py-3 rounded-2xl bg-card border border-border">
                  <div className="flex gap-1 items-center h-4">
                    <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
          </>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 pb-4 pt-2 border-t border-border bg-background shrink-0">
        <form
          onSubmit={e => { e.preventDefault(); sendMessage(); }}
          className="flex gap-2 max-w-2xl mx-auto flex-row-reverse"
        >
          <input
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="اسأل مدرب مشاريعك..."
            disabled={thinking}
            dir="rtl"
            className="flex-1 px-4 py-2.5 rounded-xl border border-input bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-60 transition"
          />
          <button
            type="submit"
            disabled={!input.trim() || thinking}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition disabled:opacity-60 shrink-0"
          >
            <Send className="w-4 h-4 rotate-180" />
          </button>
        </form>
      </div>
    </div>
  );
}
