// 📁 FILE: app/(app)/chat/page.tsx
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

export default function ChatPage() {
  const { supaUser } = useAuth();
  const [messages, setMessages] = useState<AiChat[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [thinking, setThinking] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Load chat history from Supabase
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

    // Optimistic UI — show user message immediately
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

    // Save user message to Supabase
    await Promise.all([
      supabase.from('ai_chats').insert({ user_id: supaUser.id, role: 'user', message: msg }),
      supabase.from('question_logs').insert({ user_id: supaUser.id, question: msg }),
    ]);

    try {
      // Call our secure server-side API route
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages.filter(m => !m.id.startsWith('temp-ai-')),
        }),
      });

      const data = await response.json();
      const reply = data.reply ?? 'عذراً، حدث خطأ. حاول مرة أخرى.';

      // Save AI reply to Supabase
      await supabase.from('ai_chats').insert({
        user_id: supaUser.id,
        role: 'assistant',
        message: reply,
      });

      const aiMsg: AiChat = {
        id: `temp-ai-${Date.now()}`,
        user_id: supaUser.id,
        role: 'assistant',
        message: reply,
        created_at: new Date().toISOString(),
      };
      setMessages(m => [...m, aiMsg]);
    } catch {
      const errorMsg: AiChat = {
        id: `temp-ai-${Date.now()}`,
        user_id: supaUser.id,
        role: 'assistant',
        message: 'عذراً، لم أتمكن من الاتصال بالمساعد الذكي. تأكد من اتصالك بالإنترنت وحاول مرة أخرى.',
        created_at: new Date().toISOString(),
      };
      setMessages(m => [...m, errorMsg]);
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
            <p className="text-xs text-muted-foreground">متخصص في أسواق الشرق الأوسط</p>
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
          <div className="max-w-lg mx-auto">
            <div className="text-center mb-8">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-7 h-7 text-primary" />
              </div>
              <h2 className="font-semibold text-lg mb-1">مدرب مشاريعك الذكي</h2>
              <p className="text-muted-foreground text-sm">
                مدعوم بـ Claude AI — اسأل أي شيء عن التحقق من فكرتك أو إيجاد العملاء أو تنمية مشروعك.
              </p>
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
