import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import Anthropic from 'npm:@anthropic-ai/sdk';
import { guardUser } from '../_shared/rate-limit.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface SwotResult {
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    // Require a signed-in user and enforce the per-user AI rate limit.
    const guard = await guardUser(req, 'swot-analysis', corsHeaders);
    if (guard.response) return guard.response;

    const { title, problem, solution, target_customer, sector, canvas } = await req.json() as {
      title: string;
      problem: string;
      solution: string;
      target_customer: string;
      sector: string;
      canvas?: Record<string, string>;
    };

    if (!title || !problem) {
      return new Response(JSON.stringify({ error: 'title and problem are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY')! });

    const canvasContext = canvas
      ? `\nBusiness Model Context:
- Value Proposition: ${canvas.value_proposition || 'N/A'}
- Revenue Streams: ${canvas.revenue_streams || 'N/A'}
- Key Partners: ${canvas.key_partners || 'N/A'}
- Customer Segments: ${canvas.customer_segments || 'N/A'}`
      : '';

    const prompt = `You are a startup strategy expert performing a SWOT analysis for Bethra (بذرة), a platform for Arab entrepreneurs in the MENA region.

Startup Details:
- Name: ${title}
- Sector: ${sector}
- Problem: ${problem}
- Solution: ${solution}
- Target Customer: ${target_customer}${canvasContext}

Generate a concise, practical SWOT analysis with exactly 4 items per quadrant.
Be specific to this startup — avoid generic advice.

MENA context requirements:
- Write every item in clear, modern Arabic (فصحى ميسّرة). Keep common startup terms (MVP, SaaS, CAC) in Latin script when natural.
- Ground opportunities and threats in the MENA market: local regulations and licensing, VAT, regional competitors, Gulf/Egypt consumer behavior (WhatsApp-first, cash on delivery), government programs (رؤية 2030, منشآت), seasonality (رمضان), and the regional funding landscape.

Respond ONLY with a valid JSON object in this exact format (no markdown, no extra text), with all item strings in Arabic:
{
  "strengths": ["نقطة قوة 1", "نقطة قوة 2", "نقطة قوة 3", "نقطة قوة 4"],
  "weaknesses": ["نقطة ضعف 1", "نقطة ضعف 2", "نقطة ضعف 3", "نقطة ضعف 4"],
  "opportunities": ["فرصة 1", "فرصة 2", "فرصة 3", "فرصة 4"],
  "threats": ["تهديد 1", "تهديد 2", "تهديد 3", "تهديد 4"]
}`;

    const completion = await anthropic.messages.create({
      model: 'claude-opus-4-8',
      max_tokens: 1500,
      messages: [{ role: 'user', content: prompt }],
    });

    let raw = '{}';
    for (const block of completion.content) {
      if (block.type === 'text') { raw = block.text; break; }
    }
    // Strip markdown code fences the model may add despite instructions, so the
    // happy-path parse works; fall back to extracting the first {...} block.
    raw = raw.replace(/```json\s*/gi, '').replace(/```/g, '').trim();
    let result: SwotResult;
    try {
      result = JSON.parse(raw);
    } catch {
      const match = raw.match(/\{[\s\S]*\}/);
      result = match ? JSON.parse(match[0]) : { strengths: [], weaknesses: [], opportunities: [], threats: [] };
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
