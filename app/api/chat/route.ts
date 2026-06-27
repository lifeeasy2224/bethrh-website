// 📁 FILE: app/api/chat/route.ts
import { NextRequest, NextResponse } from 'next/server';

const SYSTEM_PROMPT = `أنت مدرب مشاريع ذكي متخصص في أسواق الشرق الأوسط وشمال أفريقيا (MENA).
مهمتك مساعدة رواد الأعمال في المنطقة على تحقيق أول إيراداتهم وبناء مشاريعهم الناشئة.
- تجاوب دائماً بالعربية الفصحى الواضحة
- قدّم نصائح عملية مخصصة لسوق MENA
- لا تتجاوز 300 كلمة في كل رد
- استخدم **نص غامق** للنقاط المهمة
- رقّم الخطوات عند تقديم قوائم`;

export async function POST(req: NextRequest) {
  // Step 1: Check API key exists
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'ANTHROPIC_API_KEY not found in environment' },
      { status: 500 }
    );
  }

  // Step 2: Parse request
  let messages;
  try {
    const body = await req.json();
    messages = body.messages;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  if (!messages || !Array.isArray(messages)) {
    return NextResponse.json({ error: 'messages array required' }, { status: 400 });
  }

  // Step 3: Call Anthropic
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages: messages.map((m: { role: string; message: string }) => ({
          role: m.role === 'user' ? 'user' : 'assistant',
          content: m.message,
        })),
      }),
    });

    const responseText = await response.text();

    if (!response.ok) {
      return NextResponse.json(
        { error: `Anthropic error ${response.status}: ${responseText}` },
        { status: 500 }
      );
    }

    const data = JSON.parse(responseText);
    const reply = data.content?.[0]?.text ?? 'عذراً، لم أتمكن من الرد.';
    return NextResponse.json({ reply });

  } catch (error) {
    return NextResponse.json(
      { error: `Fetch failed: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    );
  }
}
