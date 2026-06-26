import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sector = searchParams.get('sector');
  const country = searchParams.get('country');
  const availableOnly = searchParams.get('available_only') !== 'false';

  let query = supabase
    .from('idea_library')
    .select('*')
    .eq('is_active', true)
    .order('sector')
    .order('title_ar');

  if (sector) query = query.eq('sector', sector);
  if (country) query = query.contains('suitable_countries', [country]);
  if (availableOnly) query = query.filter('current_entrepreneurs', 'lt', supabase.from('idea_library').select('max_entrepreneurs'));

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
