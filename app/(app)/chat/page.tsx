// 📁 FILE: app/(app)/chat/page.tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { supabase, AiChat } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { Send, Bot, User, Sparkles, Trash2 } from 'lucide-react';

// ── Enhanced starter prompts — grouped by founder journey stage ──
const STARTER_PROMPTS = [
  // Stage 1 — Idea & Validation
  'لدي فكرة مشروع لكن لا أعرف إن كانت تستحق المتابعة — كيف أتحقق منها في 2 أسبوع؟',
  'ما الأسئلة التي يجب أن أسألها لعملائي المحتملين قبل بناء أي شيء؟',
  // Stage 2 — First Customers
  'مشروعي جاهز لكن لا عملاء بعد — أعطني خطة عملية للوصول لأول 10 عملاء هذا الشهر',
  'كيف أكتب عرض قيمة مقنعاً لمشروعي يجعل العميل يقول "هذا بالضبط ما أحتاجه"؟',
  // Stage 3 — Revenue & Growth
  'كيف أحدد السعر المناسب لمنتجي أو خدمتي في سوق الشرق الأوسط؟',
  'ما أفضل نموذج إيراد لمشروع خدمي في مرحلة الانطلاق — اشتراك، عمولة، أم مبيعات مباشرة؟',
  // Stage 4 — Funding & Pitch
  'كيف أبني ملف مشروع (Pitch Deck) يقنع المستثمرين في منطقة الخليج؟',
  'ما القطاعات الأكثر جذباً للتمويل في منطقة MENA الآن وكيف أضع مشروعي فيها؟',
];

// ── Prompt categories for display ──
const PROMPT_CATEGORIES = [
  {
    label: '💡 التحقق من الفكرة',
    prompts: [
      'لدي فكرة مشروع لكن لا أعرف إن كانت تستحق المتابعة — كيف أتحقق منها في 2 أسبوع؟',
      'ما الأسئلة التي يجب أن أسألها لعملائي المحتملين قبل بناء أي شيء؟',
    ],
  },
  {
    label: '🎯 أول عملاء',
    prompts: [
      'مشروعي جاهز لكن لا عملاء بعد — أعطني خطة عملية للوصول لأول 10 عملاء هذا الشهر',
      'كيف أكتب عرض قيمة مقنعاً لمشروعي يجعل العميل يقول "هذا بالضبط ما أحتاجه"؟',
    ],
  },
  {
    label: '💰 الإيرادات والتسعير',
    prompts: [
      'كيف أحدد السعر المناسب لمنتجي أو خدمتي في سوق الشرق الأوسط؟',
      'ما أفضل نموذج إيراد لمشروع خدمي في مرحلة الانطلاق — اشتراك، عمولة، أم مبيعات مباشرة؟',
    ],
  },
  {
    label: '🚀 التمويل والنمو',
    prompts: [
      'كيف أبني ملف مشروع (Pitch Deck) يقنع المستثمرين في منطقة الخليج؟',
      'ما القطاعات الأكثر جذباً للتمويل في منطقة MENA الآن وكيف أضع مشروعي فيها؟',
    ],
  },
];

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
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setThinking(true);

    await Promise.all([
      supabase.from('ai_chats').insert({ user_id: supaUser.id, role: 'user', message: msg }),
      supabase.from('question_logs').insert({ user_id: supaUser.id, question: msg }),
    ]);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: updatedMessages }),
      });

      const data = await response.json();
      const reply = data.reply ?? 'عذراً، حدث خطأ. حاول مرة أخرى.';

      await supabase.from('ai_chats').insert({
        user_id: supaUser.id,
        role: 'assistant',
        message: reply,
      });

      setMessages(m => [...m, {
        id: `temp-ai-${Date.now()}`,
        user_id: supaUser.id,
        role: 'assistant',
        message: reply,
        created_at: new Date().toISOString(),
      }]);
    } catch {
      setMessages(m => [...m, {
        id: `temp-ai-${Date.now()}`,
        user_id: supaUser.id,
        role: 'assistant',
        message: 'عذراً، لم أتمكن من الاتصال. تأكد من اتصالك بالإنترنت وحاول مرة أخرى.',
        created_at: new Date().toISOString(),
      }]);
    } finally {
      setThinking(false);
    }
  }

  async function clearHistory() {
    if (!supaUser || !confirm('مسح كل سجل المحادثة؟')) return;
    await supabase.from('ai_chats').delete().eq('user_id', supaUser.id);
    setMessages([]);
  }

  function formatMessage(text: string) {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br/>');
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
            <p className="text-xs text-muted-foreground">متخصص في أسواق الشرق الأوسط · مدعوم بـ Claude AI</p>
          </div>
        </div>
        {messages.length > 0 && (
          <button
            onClick={clearHistory}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
          >
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
          <div className="max-w-2xl mx-auto">
            {/* Welcome */}
            <div className="text-center mb-8">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-7 h-7 text-primary" />
              </div>
              <h2 className="font-semibold text-lg mb-1">مدرب مشاريعك الذكي</h2>
              <p className="text-muted-foreground text-sm max-w-sm mx-auto">
                أنا هنا لمساعدتك في كل مرحلة من رحلتك الريادية — من الفكرة إلى أول إيراد وما بعده.
              </p>
            </div>

            {/* Categorized prompts */}
            <div className="space-y-5">
              {PROMPT_CATEGORIES.map(cat => (
                <div key={cat.label}>
                  <p className="text-xs font-bold text-muted-foreground mb-2 text-right tracking-wide">
                    {cat.label}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {cat.prompts.map(prompt => (
                      <button
                        key={prompt}
                        onClick={() => sendMessage(prompt)}
                        className="text-right px-4 py-3 rounded-xl border border-border bg-card hover:border-primary/40 hover:bg-primary/5 text-sm transition-all leading-relaxed"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Tip */}
            <p className="text-center text-xs text-muted-foreground mt-6 opacity-60">
              💡 كلما كانت سؤالك أكثر تفصيلاً، كان ردي أكثر دقة وفائدة
            </p>
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
            placeholder="اسأل مدرب مشاريعك... كن محدداً للحصول على أفضل إجابة"
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
