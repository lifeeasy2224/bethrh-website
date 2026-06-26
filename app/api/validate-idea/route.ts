import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Rule-based scoring when no OpenAI key available
function ruleScore(q1: string, q2: string, q3: string): { score: number; feedback: string; result: 'passed' | 'failed' } {
  let score = 0;
  const notes: string[] = [];

  // Q1: problem clarity — at least 40 chars, specific keywords
  if (q1.trim().length >= 80) score += 35;
  else if (q1.trim().length >= 40) score += 20;
  else { score += 5; notes.push('وصف المشكلة قصير جداً — اشرح بتفاصيل أكثر.'); }

  // Q2: audience specificity
  if (q2.trim().length >= 50) score += 35;
  else if (q2.trim().length >= 25) score += 20;
  else { score += 5; notes.push('حدّد جمهورك أكثر — من هم بالضبط؟ أعمارهم؟ موقعهم؟'); }

  // Q3: evidence — does it mention numbers, interviews, signups?
  const hasNumbers = /\d/.test(q3);
  const hasEvidence = /مقابل|عميل|اشتر|دفع|طلب|شخص|استطلاع|survey|interview/i.test(q3);
  if (hasNumbers && hasEvidence) score += 30;
  else if (hasNumbers || hasEvidence) score += 18;
  else if (q3.trim().length >= 40) score += 10;
  else { score += 3; notes.push('الدليل على الطلب ضعيف — تحدث مع 5 أشخاص على الأقل وأضِف ما قالوه.'); }

  const result = score >= 60 ? 'passed' : 'failed';

  const feedback = result === 'passed'
    ? `ممتاز! فكرتك اجتازت الفلتر الأولي بنقاط ${score}/100. ${notes.length ? 'ملاحظات للتحسين: ' + notes.join(' ') : 'يمكنك الآن بناء النموذج الكامل.'}`
    : `فكرتك تحتاج تقوية قبل الانتقال للنموذج. النقاط: ${score}/100. ${notes.join(' ')} راجع إجاباتك وأعِد المحاولة.`;

  return { score, feedback, result };
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: { user }, error: authError } = await supabase.auth.getUser(
    authHeader.replace('Bearer ', '')
  );
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { ideaId, q1, q2, q3 } = await req.json();
  if (!ideaId || !q1 || !q2 || !q3) {
    return NextResponse.json({ error: 'ideaId and three answers required' }, { status: 400 });
  }

  // Verify idea belongs to user
  const { data: idea } = await supabase
    .from('ideas').select('id, title').eq('id', ideaId).eq('user_id', user.id).maybeSingle();
  if (!idea) return NextResponse.json({ error: 'Idea not found' }, { status: 404 });

  let score: number;
  let feedback: string;
  let result: 'passed' | 'failed';

  const apiKey = process.env.OPENAI_API_KEY;
  if (apiKey) {
    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: 'gpt-4o',
          max_tokens: 400,
          messages: [
            {
              role: 'system',
              content: `أنت محكّم متخصص في ريادة الأعمال للسوق العربي. مهمتك تقييم فكرة مشروع بناءً على إجابات المؤسس على ٣ أسئلة.
أعطِ نقاطاً من ١٠٠ ونتيجة "passed" أو "failed" (الحد الأدنى للنجاح ٦٠).
المعايير:
- وضوح المشكلة (٣٥ نقطة): هل المشكلة حقيقية ومحددة؟
- تحديد الجمهور (٣٥ نقطة): هل الجمهور محدد بدقة؟
- دليل الطلب (٣٠ نقطة): هل يوجد أي دليل فعلي (أرقام، مقابلات، طلبات)؟
أجب بـ JSON فقط: {"score":75,"result":"passed","feedback":"..."}`
            },
            {
              role: 'user',
              content: `الفكرة: ${idea.title}
السؤال ١ — ما المشكلة التي تحلها بالتحديد؟
الجواب: ${q1}

السؤال ٢ — من هو جمهورك المستهدف بدقة؟
الجواب: ${q2}

السؤال ٣ — ما دليلك الملموس على وجود الطلب؟
الجواب: ${q3}`
            }
          ]
        })
      });
      const json = await res.json();
      const content = json.choices?.[0]?.message?.content ?? '{}';
      const parsed = JSON.parse(content.match(/\{[\s\S]*\}/)?.[0] ?? '{}');
      score = Math.min(100, Math.max(0, Number(parsed.score) || 0));
      feedback = parsed.feedback ?? '';
      result = score >= 60 ? 'passed' : 'failed';
    } catch {
      const rb = ruleScore(q1, q2, q3);
      score = rb.score; feedback = rb.feedback; result = rb.result;
    }
  } else {
    const rb = ruleScore(q1, q2, q3);
    score = rb.score; feedback = rb.feedback; result = rb.result;
  }

  // Upsert validation record
  const { data: saved, error: saveErr } = await supabase
    .from('idea_validations')
    .upsert({
      idea_id: ideaId,
      user_id: user.id,
      q1_problem: q1,
      q2_audience: q2,
      q3_evidence: q3,
      ai_feedback: feedback,
      result,
      score,
    }, { onConflict: 'idea_id' })
    .select()
    .maybeSingle();

  if (saveErr) return NextResponse.json({ error: saveErr.message }, { status: 500 });

  return NextResponse.json(saved);
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: { user }, error: authError } = await supabase.auth.getUser(
    authHeader.replace('Bearer ', '')
  );
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const ideaId = new URL(req.url).searchParams.get('ideaId');
  if (!ideaId) return NextResponse.json({ error: 'ideaId required' }, { status: 400 });

  const { data } = await supabase
    .from('idea_validations')
    .select('*')
    .eq('idea_id', ideaId)
    .eq('user_id', user.id)
    .maybeSingle();

  return NextResponse.json(data ?? null);
}
