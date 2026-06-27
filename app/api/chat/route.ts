// 📁 FILE: app/api/chat/route.ts
// Server-side API route — keeps ANTHROPIC_API_KEY secure

import { NextRequest, NextResponse } from 'next/server';

const SYSTEM_PROMPT = `أنت مدرب مشاريع ذكي متخصص في أسواق الشرق الأوسط وشمال أفريقيا (MENA).
مهمتك مساعدة رواد الأعمال في المنطقة على تحقيق أول إيراداتهم وبناء مشاريعهم الناشئة.

قواعد أساسية:
- تجاوب دائماً بالعربية الفصحى الواضحة
- ركّز على السياق الاقتصادي والثقافي لمنطقة MENA (الخليج، المشرق، شمال أفريقيا)
- قدّم نصائح عملية وقابلة للتنفيذ فوراً
- استخدم أمثلة من أسواق المنطقة (السعودية، الإمارات، مصر، الأردن، المغرب...)
- اسأل أسئلة توضيحية عند الحاجة لتقديم نصيحة مخصصة
- شجّع على التحقق من الفكرة قبل البناء
- ابقَ مركّزاً على: التحقق من الفكرة، إيجاد العملاء، نماذج الإيراد، التمويل، والنمو
- لا تتجاوز 300 كلمة في كل رد — كن موجزاً ومفيداً
- استخدم **نص غامق** للنقاط المهمة
- رقّم الخطوات عند تقديم قوائم`;

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: 'messages required' }, { status: 400 });
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY!,
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

    if (!response.ok) {
      const err = await response.text();
      console.error('Anthropic API error:', err);
      return NextResponse.json({ error: 'AI service error' }, { status: 500 });
    }

    const data = await response.json();
    const reply = data.content?.[0]?.text ?? 'عذراً، لم أتمكن من الرد. حاول مرة أخرى.';

    return NextResponse.json({ reply });
  } catch (error) {
    console.error('Chat route error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
