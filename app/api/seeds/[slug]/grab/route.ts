import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

const ERROR_MESSAGES: Record<string, string> = {
  SEED_NOT_FOUND:   'لم يتم العثور على هذه البذرة',
  NO_SPOTS:         'اكتملت المقاعد لهذه الفكرة',
  ALREADY_GRABBED:  'لقد التقطت هذه البذرة من قبل',
};

export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
  }
  const token = authHeader.slice(7);

  const userClient = createClient(supabaseUrl, supabaseAnon, {
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  const { data: { user }, error: authError } = await userClient.auth.getUser(token);
  if (authError || !user) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 });
  }

  const { data: profile } = await userClient
    .from('users')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  if (profile?.role === 'investor') {
    return NextResponse.json({ error: 'هذه الميزة للمؤسسين فقط' }, { status: 403 });
  }

  // Resolve seed id from slug
  const { data: seed } = await userClient
    .from('seeds')
    .select('id')
    .eq('slug', params.slug)
    .eq('status', 'active')
    .maybeSingle();

  if (!seed) {
    return NextResponse.json({ error: ERROR_MESSAGES.SEED_NOT_FOUND }, { status: 404 });
  }

  const { data: ideaId, error: grabError } = await userClient
    .rpc('grab_seed', { p_seed_id: seed.id, p_user_id: user.id });

  if (grabError) {
    const key = Object.keys(ERROR_MESSAGES).find(k => grabError.message.includes(k));
    return NextResponse.json(
      { error: key ? ERROR_MESSAGES[key] : 'حدث خطأ، حاول مجدداً' },
      { status: 400 }
    );
  }

  return NextResponse.json({ idea_id: ideaId });
}
