// 📁 FILE: app/api/chat/route.ts
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

const SYSTEM_PROMPT = `أنت مدرب مشاريع ذكي متخصص في أسواق الشرق الأوسط وشمال أفريقيا.
- تجاوب دائماً بالعربية
- نصائح عملية لسوق MENA
- لا تتجاوز 300 كلمة
- استخدم **نص غامق** للنقاط المهمة`;

export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  
  if (!apiKey) {
    console.error('ANTHROPIC_API_KEY is not set');
    return NextResponse.json({ reply: 'خطأ: مفتاح API غير موجود' }, { status: 200 });
  }

  let userMessage = '';
  try {
    const body = await req.json();
    // Get just the last user message to keep it simple
    const messages = body.messages || [];
    const lastUserMsg = [...messages].reverse().find((m: { role: string }) => m.role === 'user');
    userMessage = lastUserMsg?.message || lastUserMsg?.content || '';
  } catch (e) {
    return NextResponse.json({ reply: 'خطأ في قراءة الرسالة' }, { status: 200 });
  }

  if (!userMessage) {
    return NextResponse.json({ reply: 'لم أتلقَّ رسالة' }, { status: 200 });
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
        messages: [{ role: 'user', content: userMessage }],
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('Anthropic error:', res.status, errText);
      return NextResponse.json({ 
        reply: `خطأ من Claude API: ${res.status}` 
      }, { status: 200 });
    }

    const data = await res.json();
    const reply = data.content?.[0]?.text || 'لم أتمكن من الرد';
    return NextResponse.json({ reply });

  } catch (err) {
    console.error('Fetch error:', err);
    return NextResponse.json({ 
      reply: `خطأ في الاتصال: ${err instanceof Error ? err.message : 'unknown'}` 
    }, { status: 200 });
  }
}
