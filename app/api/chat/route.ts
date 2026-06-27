// 📁 FILE: app/api/chat/route.ts
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

const SYSTEM_PROMPT = `أنت مدرب مشاريع ذكي متخصص في أسواق الشرق الأوسط وشمال أفريقيا.
- تجاوب دائماً بالعربية
- نصائح عملية لسوق MENA
- لا تتجاوز 300 كلمة
- استخدم **نص غامق** للنقاط المهمة`;

// Messages that are error responses — skip them
const ERROR_PHRASES = [
  'عذراً، حدث خطأ',
  'عذراً، لم أتمكن',
  'خطأ من Claude',
  'خطأ في الاتصال',
  'خطأ في قراءة',
  'لم أتلقَّ رسالة',
  'API key missing',
];

function isErrorMessage(text: string): boolean {
  return ERROR_PHRASES.some(phrase => text.includes(phrase));
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ reply: 'مفتاح API غير موجود في البيئة' }, { status: 200 });
  }

  let messages: { role: string; message?: string; content?: string }[] = [];
  try {
    const body = await req.json();
    messages = body.messages || [];
  } catch {
    return NextResponse.json({ reply: 'خطأ في قراءة البيانات' }, { status: 200 });
  }

  // Filter out error messages and build clean conversation
  const cleanMessages: { role: 'user' | 'assistant'; content: string }[] = [];

  for (const m of messages) {
    const content = (m.message || m.content || '').trim();
    const role = m.role === 'user' ? 'user' : 'assistant';

    // Skip empty or error messages
    if (!content || isErrorMessage(content)) continue;

    // Skip consecutive same roles
    const last = cleanMessages[cleanMessages.length - 1];
    if (last && last.role === role) continue;

    cleanMessages.push({ role, content });
  }

  // If nothing valid, return helpful message
  if (cleanMessages.length === 0 || cleanMessages[cleanMessages.length - 1].role !== 'user') {
    return NextResponse.json({
      reply: 'أهلاً! كيف يمكنني مساعدتك في مشروعك اليوم؟'
    }, { status: 200 });
  }

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages: cleanMessages,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('Anthropic error:', res.status, errText);
      return NextResponse.json({
        reply: `خطأ من Claude API: ${res.status} — ${errText.substring(0, 100)}`
      }, { status: 200 });
    }

    const data = await res.json();
    const reply = data.content?.[0]?.text || 'لم أتمكن من الرد، حاول مرة أخرى';
    return NextResponse.json({ reply });

  } catch (err) {
    console.error('Fetch error:', err);
    return NextResponse.json({
      reply: `خطأ في الاتصال: ${err instanceof Error ? err.message : 'unknown error'}`
    }, { status: 200 });
  }
}
