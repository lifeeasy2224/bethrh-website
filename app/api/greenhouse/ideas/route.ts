import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(req: NextRequest) {
  const sector = new URL(req.url).searchParams.get('sector');

  let query = supabase
    .from('greenhouse_listings')
    .select('id, brand_name, logo, tagline, sector, iro, breakeven_months, score, level, contact_requests, published_at')
    .eq('status', 'active')
    .gte('score', 75)
    .order('score', { ascending: false });

  if (sector && sector !== 'all') {
    query = query.eq('sector', sector);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json(data ?? []);
}
