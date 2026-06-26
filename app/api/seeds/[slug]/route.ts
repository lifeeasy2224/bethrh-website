import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(
  _req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const { data, error } = await supabase
    .from('seeds')
    .select('*')
    .eq('slug', params.slug)
    .eq('status', 'active')
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data)  return NextResponse.json({ error: 'not found' }, { status: 404 });

  return NextResponse.json(data);
}
