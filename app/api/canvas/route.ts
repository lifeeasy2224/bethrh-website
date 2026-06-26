import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Field benchmarks per sector (average character count expected)
const FIELD_BENCHMARKS: Record<string, Record<string, string>> = {
  'Agri-Food': {
    value_proposition: 'حل سريع وطازج يصل لأصحاب المطاعم بسعر أقل من السوق',
    customer_segments: 'مطاعم صغيرة ومتوسطة، محلات عصائر، مقاهي في المدن الكبيرة',
    revenue_streams: 'رسوم توصيل ثابتة، اشتراك شهري للطلبات المنتظمة',
  },
  'Services': {
    value_proposition: 'خدمة موثوقة بحجز سريع ونتيجة مضمونة خلال ٢٤ ساعة',
    customer_segments: 'أسر مشغولة ومكاتب شركات في المدن الكبيرة',
    revenue_streams: 'دفع لكل زيارة أو اشتراك شهري',
  },
  'Agri-Tech': {
    value_proposition: 'تقنية تقلل الهدر وترفع الإنتاجية للمزارعين الصغار',
    customer_segments: 'مزارعون يمتلكون ٥-٥٠ دونم، تعاونيات زراعية',
    revenue_streams: 'رسوم اشتراك شهري أو رسوم لكل موسم',
  },
};

function getFieldBenchmark(field: string, sector: string | null): string | null {
  const sectorData = FIELD_BENCHMARKS[sector ?? ''];
  return sectorData?.[field] ?? null;
}

type FinancialItem = { label: string; amount: number; type: 'cost' | 'revenue' };

type CanvasDraft = {
  value_proposition: string;
  customer_segments: string;
  channels: string;
  customer_relationships: string;
  revenue_streams: string;
  key_resources: string;
  key_activities: string;
  key_partners: string;
  cost_structure: string;
  financial_items: FinancialItem[];
};

type ValidationError = { field: string; message: string };

function validateCanvas(draft: CanvasDraft): ValidationError[] {
  const errors: ValidationError[] = [];
  const BOXES: (keyof Omit<CanvasDraft, 'financial_items'>)[] = [
    'value_proposition', 'customer_segments', 'channels',
    'customer_relationships', 'revenue_streams', 'key_resources',
    'key_activities', 'key_partners', 'cost_structure',
  ];

  const LABELS: Record<string, string> = {
    value_proposition: 'عرض القيمة',
    customer_segments: 'شرائح العملاء',
    channels: 'قنوات الوصول',
    customer_relationships: 'علاقات العملاء',
    revenue_streams: 'مصادر الإيراد',
    key_resources: 'الموارد الرئيسية',
    key_activities: 'الأنشطة الرئيسية',
    key_partners: 'الشراكات الرئيسية',
    cost_structure: 'هيكل التكاليف',
  };

  for (const box of BOXES) {
    const val = (draft[box] as string).trim();
    if (val.length < 30) {
      errors.push({ field: box, message: `${LABELS[box]}: يجب أن يحتوي على ٣٠ حرفاً على الأقل (حالياً ${val.length})` });
    }
  }

  const costs = draft.financial_items.filter(i => i.type === 'cost');
  const revenues = draft.financial_items.filter(i => i.type === 'revenue');

  if (costs.length < 5) {
    errors.push({ field: 'financial_items', message: `التحليل المالي: أضِف ${5 - costs.length} بند تكاليف إضافي على الأقل` });
  }
  if (revenues.length < 1) {
    errors.push({ field: 'financial_items', message: 'التحليل المالي: أضِف مصدر إيراد واحداً على الأقل' });
  }

  return errors;
}

async function scoreCanvasWithAI(draft: CanvasDraft, ideaTitle: string): Promise<number> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    // Rule-based: average fill quality
    const BOXES: (keyof Omit<CanvasDraft, 'financial_items'>)[] = [
      'value_proposition', 'customer_segments', 'channels',
      'customer_relationships', 'revenue_streams', 'key_resources',
      'key_activities', 'key_partners', 'cost_structure',
    ];
    const total = BOXES.reduce((s, k) => s + Math.min(1, (draft[k] as string).trim().length / 100), 0);
    const hasFinancial = draft.financial_items.length >= 6 ? 1 : draft.financial_items.length / 6;
    return Math.round(((total / BOXES.length) * 0.8 + hasFinancial * 0.2) * 100);
  }

  try {
    const summary = Object.entries(draft)
      .filter(([k]) => k !== 'financial_items')
      .map(([k, v]) => `${k}: ${(v as string).substring(0, 120)}`)
      .join('\n');

    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'gpt-4o',
        max_tokens: 100,
        messages: [
          { role: 'system', content: 'أنت محكّم نماذج أعمال. قيّم اكتمال وجودة النموذج من ١٠٠ وأجِب بـ JSON فقط: {"score":75}' },
          { role: 'user', content: `الفكرة: ${ideaTitle}\n${summary}` }
        ]
      })
    });
    const json = await res.json();
    const parsed = JSON.parse(json.choices?.[0]?.message?.content?.match(/\{[\s\S]*\}/)?.[0] ?? '{}');
    return Math.min(100, Math.max(0, Number(parsed.score) || 0));
  } catch {
    return 60;
  }
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
    .from('canvas_drafts')
    .select('*')
    .eq('idea_id', ideaId)
    .eq('user_id', user.id)
    .maybeSingle();

  return NextResponse.json(data ?? null);
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: { user }, error: authError } = await supabase.auth.getUser(
    authHeader.replace('Bearer ', '')
  );
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { ideaId, draft, finalSave = false } = body as {
    ideaId: string;
    draft: CanvasDraft;
    finalSave?: boolean;
  };

  if (!ideaId) return NextResponse.json({ error: 'ideaId required' }, { status: 400 });

  // Verify ownership
  const { data: idea } = await supabase
    .from('ideas').select('id, title, sector').eq('id', ideaId).eq('user_id', user.id).maybeSingle();
  if (!idea) return NextResponse.json({ error: 'Idea not found' }, { status: 404 });

  // If finalSave, run validation gates
  if (finalSave) {
    const errors = validateCanvas(draft);
    if (errors.length > 0) {
      return NextResponse.json({ error: 'validation_failed', errors }, { status: 422 });
    }

    // Check AI score >= 60
    const aiScore = await scoreCanvasWithAI(draft, idea.title ?? '');
    if (aiScore < 60) {
      return NextResponse.json({
        error: 'score_too_low',
        aiScore,
        message: `نقاط الجودة ${aiScore}/100 — يجب أن تكون ٦٠ على الأقل. طوّر محتوى المربعات.`
      }, { status: 422 });
    }

    const { data: saved, error: saveErr } = await supabase
      .from('canvas_drafts')
      .upsert({
        idea_id: ideaId,
        user_id: user.id,
        ...draft,
        ai_score: aiScore,
        is_locked: true,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'idea_id' })
      .select()
      .maybeSingle();

    if (saveErr) return NextResponse.json({ error: saveErr.message }, { status: 500 });
    return NextResponse.json({ ...saved, aiScore });
  }

  // Auto-save draft (no validation)
  const { data: saved, error: saveErr } = await supabase
    .from('canvas_drafts')
    .upsert({
      idea_id: ideaId,
      user_id: user.id,
      ...draft,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'idea_id' })
    .select()
    .maybeSingle();

  if (saveErr) return NextResponse.json({ error: saveErr.message }, { status: 500 });

  // Build benchmarks for response
  const benchmarks: Record<string, string | null> = {
    value_proposition: getFieldBenchmark('value_proposition', idea.sector),
    customer_segments: getFieldBenchmark('customer_segments', idea.sector),
    revenue_streams: getFieldBenchmark('revenue_streams', idea.sector),
  };

  return NextResponse.json({ ...saved, benchmarks });
}
