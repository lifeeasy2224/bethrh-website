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
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'API key missing' }, { status: 500 });
    }

    const body = await req.json();
    const messages = body.messages;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'No messages provided' }, { status: 400 });
    }

    // Build clean messages array — only user/assistant roles, only valid messages
    const cleanMessages: { role: 'user' | 'assistant'; content: string }[] = [];
    
    for (const m of messages) {
      const role = m.role === 'user' ? 'user' : 'assistant';
      const content = (m.message || m.content || '').trim();
      if (!content) continue;
      
      // Anthropic requires alternating user/assistant — skip consecutive same roles
      const last = cleanMessages[cleanMessages.length - 1];
      if (last && last.role === role) continue;
      
      cleanMessages.push({ role, content });
    }

    // Must start with user message
    if (cleanMessages.length === 0 || cleanMessages[0].role !== 'user') {
      return NextResponse.json({ error: 'Must start with user message' }, { status: 400 });
    }

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
        messages: cleanMessages,
      }),
    });

    const responseText = await response.text();

    if (!response.ok) {
      return NextResponse.json(
        { error: `Anthropic ${response.status}: ${responseText}` },
        { status: 500 }
      );
    }

    const data = JSON.parse(responseText);
    const reply = data.content?.[0]?.text ?? 'عذراً، لم أتمكن من الرد. حاول مرة أخرى.';

    return NextResponse.json({ reply });

  } catch (error) {
    return NextResponse.json(
      { error: `Server error: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    );
  }
}
