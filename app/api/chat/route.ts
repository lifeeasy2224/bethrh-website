// 📁 FILE: app/api/chat/route.ts
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

// ── Rate limiting config ──────────────────────────────────────────
const DAILY_MESSAGE_LIMIT = 10;      // Max messages per user per day
const MAX_MESSAGE_LENGTH  = 500;     // Max characters per message

// ── Topic guard — reject off-topic messages ───────────────────────
const OFF_TOPIC_KEYWORDS = [
  // Personal/social
  'اشعار', 'شعر', 'قصيدة', 'أغنية', 'فيلم', 'مسلسل', 'رياضة', 'كرة',
  'طبخ', 'وصفة', 'حب', 'علاقة', 'زواج', 'طلاق',
  // Non-business
  'ترجمة', 'translate', 'joke', 'نكتة', 'لعبة', 'game',
  'صحة', 'طب', 'دواء', 'سياسة', 'دين',
];

const BUSINESS_KEYWORDS = [
  'مشروع', 'فكرة', 'عميل', 'إيراد', 'مبيعات', 'تسويق', 'منتج', 'خدمة',
  'استثمار', 'تمويل', 'شركة', 'ريادة', 'سوق', 'منافس', 'سعر', 'ربح',
  'خسارة', 'نمو', 'تحقق', 'validate', 'startup', 'business', 'pitch',
  'عرض', 'قيمة', 'هدف', 'خطة', 'استراتيجية', 'مستثمر', 'مؤسس',
];

function isOffTopic(message: string): boolean {
  const lower = message.toLowerCase();
  // If message has business keywords → allow
  const hasBusiness = BUSINESS_KEYWORDS.some(kw => lower.includes(kw));
  if (hasBusiness) return false;
  // If message has off-topic keywords → reject
  const hasOffTopic = OFF_TOPIC_KEYWORDS.some(kw => lower.includes(kw));
  if (hasOffTopic) return true;
  // Short greetings → allow (مرحبا، كيف حالك، etc.)
  if (message.trim().length < 30) return false;
  return false;
}

// ── In-memory rate limiter (resets on server restart) ────────────
// For production, use Redis or Supabase — this works for now
const userMessageCounts = new Map<string, { count: number; date: string }>();

function checkRateLimit(userId: string): { allowed: boolean; remaining: number } {
  const today = new Date().toISOString().split('T')[0];
  const record = userMessageCounts.get(userId);

  if (!record || record.date !== today) {
    userMessageCounts.set(userId, { count: 1, date: today });
    return { allowed: true, remaining: DAILY_MESSAGE_LIMIT - 1 };
  }

  if (record.count >= DAILY_MESSAGE_LIMIT) {
    return { allowed: false, remaining: 0 };
  }

  record.count += 1;
  return { allowed: true, remaining: DAILY_MESSAGE_LIMIT - record.count };
}

// ── System prompt ─────────────────────────────────────────────────
const SYSTEM_PROMPT = `أنت مدرب مشاريع ذكي متخصص في أسواق الشرق الأوسط وشمال أفريقيا (MENA).
مهمتك الوحيدة: مساعدة رواد الأعمال في بناء مشاريعهم وتحقيق أول إيراداتهم.

قواعد صارمة:
- تجاوب فقط على أسئلة ريادة الأعمال والمشاريع والتسويق والتمويل
- إذا سألك المستخدم عن أي موضوع آخر (شعر، طبخ، رياضة، ترجمة، إلخ)، اعتذر بلطف وأعده لموضوع المشاريع
- تجاوب بالعربية دائماً
- لا تتجاوز 250 كلمة في كل رد
- استخدم **نص غامق** للنقاط المهمة
- رقّم الخطوات عند تقديم قوائم
- ركّز على السياق الاقتصادي لمنطقة MENA`;

// ── Main handler ──────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    // Never expose this error to users
    console.error('CRITICAL: ANTHROPIC_API_KEY missing');
    return NextResponse.json({
      reply: 'الخدمة غير متاحة مؤقتاً. سيتم إصلاحها قريباً.',
    });
  }

  let userId = '';
  let messages: { role: string; message?: string; content?: string }[] = [];

  try {
    const body = await req.json();
    messages = body.messages || [];
    userId = body.userId || 'anonymous';
  } catch {
    return NextResponse.json({ reply: 'خطأ في قراءة البيانات.' });
  }

  // ── 1. Rate limit check ──
  const { allowed, remaining } = checkRateLimit(userId);
  if (!allowed) {
    return NextResponse.json({
      reply: `لقد استنفدت حصتك اليومية (${DAILY_MESSAGE_LIMIT} رسائل). عُد غداً للاستمرار! 🌱\n\nفي غضون ذلك، يمكنك تصفح **مكتبة الأفكار** أو **أدوات التحقق** المتاحة مجاناً.`,
    });
  }

  // ── 2. Message length check ──
  const lastUserMsg = [...messages].reverse().find(m => m.role === 'user');
  const userText = (lastUserMsg?.message || lastUserMsg?.content || '').trim();

  if (!userText) {
    return NextResponse.json({ reply: 'لم أتلقَّ رسالة. حاول مرة أخرى.' });
  }

  if (userText.length > MAX_MESSAGE_LENGTH) {
    return NextResponse.json({
      reply: `رسالتك طويلة جداً (${userText.length} حرف). الحد الأقصى ${MAX_MESSAGE_LENGTH} حرف. يرجى تلخيص سؤالك.`,
    });
  }

  // ── 3. Topic guard ──
  if (isOffTopic(userText)) {
    return NextResponse.json({
      reply: 'أنا متخصص في مساعدتك على بناء مشروعك وتنمية أعمالك في منطقة MENA. هل لديك سؤال عن فكرتك، عملاءك، أو استراتيجيتك؟ 🌱',
    });
  }

  // ── 4. Build clean messages for Claude ──
  const ERROR_PHRASES = ['عذراً، حدث خطأ', 'خطأ من Claude', 'الخدمة غير متاحة', 'استنفدت حصتك'];
  const cleanMessages: { role: 'user' | 'assistant'; content: string }[] = [];

  for (const m of messages) {
    const content = (m.message || m.content || '').trim();
    const role = m.role === 'user' ? 'user' : 'assistant';
    if (!content || ERROR_PHRASES.some(p => content.includes(p))) continue;
    const last = cleanMessages[cleanMessages.length - 1];
    if (last && last.role === role) continue;
    cleanMessages.push({ role, content });
  }

  if (cleanMessages.length === 0 || cleanMessages[cleanMessages.length - 1].role !== 'user') {
    return NextResponse.json({ reply: 'كيف يمكنني مساعدتك في مشروعك؟' });
  }

  // ── 5. Call Claude ──
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
        max_tokens: 800,
        system: SYSTEM_PROMPT,
        messages: cleanMessages,
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      // Log for Moha, hide from user
      console.error(`[BETHRA ALERT] Claude API error ${res.status}:`, errText);
      return NextResponse.json({
        reply: 'الخدمة غير متاحة مؤقتاً. حاول مرة أخرى بعد قليل. 🙏',
      });
    }

    const data = await res.json();
    const reply = data.content?.[0]?.text || 'لم أتمكن من الرد. حاول مرة أخرى.';

    // Add remaining count hint if getting low
    const hint = remaining <= 3 && remaining > 0
      ? `\n\n_( ${remaining} رسائل متبقية لهذا اليوم )_`
      : '';

    return NextResponse.json({ reply: reply + hint });

  } catch (err) {
    console.error('[BETHRA ALERT] Fetch error:', err);
    return NextResponse.json({
      reply: 'الخدمة غير متاحة مؤقتاً. تأكد من اتصالك بالإنترنت وحاول مرة أخرى.',
    });
  }
}
