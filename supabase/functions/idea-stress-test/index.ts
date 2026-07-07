import Anthropic from 'npm:@anthropic-ai/sdk';
import { guardIp } from '../_shared/rate-limit.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

interface AnalysisResult {
  score: number;
  verdict: string;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  market_size: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    // Public tool — rate-limit by IP to cap anonymous abuse (no login required).
    const limited = await guardIp(req, 'idea-stress-test', corsHeaders);
    if (limited) return limited;

    const { idea, target_customer, problem_solved, revenue_model, competitors } = await req.json() as {
      idea: string;
      target_customer: string;
      problem_solved: string;
      revenue_model: string;
      competitors: string;
    };

    if (!idea) {
      return new Response(JSON.stringify({ error: 'idea is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY')! });

    const prompt = `You are a startup validation expert for Bethra (بذرة), a platform for Arab entrepreneurs in the MENA region. Analyze this startup idea:
- Idea: ${idea}
- Target customer: ${target_customer}
- Problem solved: ${problem_solved}
- Revenue model: ${revenue_model}
- Competitors: ${competitors}

Analysis requirements:
- Evaluate the idea for the MENA market specifically: local demand, regional competitors, regulations/licensing, VAT, payment and delivery habits (WhatsApp-first, cash on delivery), and the Gulf/Egypt funding landscape.
- market_size should reflect the MENA/Arab market (use USD).
- Write ALL text values (verdict, strengths, weaknesses, suggestions, market_size) in clear, modern Arabic (فصحى ميسّرة). Keep common startup terms (MVP, SaaS) in Latin script when natural.

Respond ONLY with a valid JSON object in this exact format (no markdown, no extra text):
{
  "score": <number 1-10>,
  "verdict": "<جملة واحدة — هل ننصحه بالمتابعة؟>",
  "strengths": ["<نقطة قوة 1>", "<نقطة قوة 2>", "<نقطة قوة 3>"],
  "weaknesses": ["<نقطة ضعف 1>", "<نقطة ضعف 2>", "<نقطة ضعف 3>"],
  "suggestions": ["<خطوة عملية 1>", "<خطوة عملية 2>", "<خطوة عملية 3>"],
  "market_size": "<تقدير تقريبي لحجم السوق في المنطقة>"
}`;

    const completion = await anthropic.messages.create({
      model: 'claude-opus-4-8',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    });

    let raw = '';
    for (const block of completion.content) {
      if (block.type === 'text') { raw = block.text; break; }
    }

    // Extract JSON from response (handle any wrapping text)
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('AI did not return valid JSON');
    }

    const result: AnalysisResult = JSON.parse(jsonMatch[0]);

    // Clamp score to 1-10
    result.score = Math.max(1, Math.min(10, Math.round(result.score * 10) / 10));

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});
