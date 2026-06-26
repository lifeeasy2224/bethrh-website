import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(req: NextRequest) {
  const sector = req.nextUrl.searchParams.get('sector');

  let query = supabase
    .from('seeds')
    .select('id, slug, name, sector_id, sector_emoji, sector_label, short_description, investment_min, investment_max, roi_estimate, break_even_months, max_spots, spots_taken')
    .eq('status', 'active')
    .order('created_at', { ascending: true });

  if (sector && sector !== 'all') {
    query = query.eq('sector_id', sector);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}
