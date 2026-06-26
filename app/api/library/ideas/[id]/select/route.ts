import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { buildWeeklyTasks } from '@/lib/supabase';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const token = authHeader.replace('Bearer ', '');
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const body = await req.json();
  const { country, city = '', differentiation, advantage, custom_name } = body;

  // Validate required fields
  if (!country || !differentiation || !advantage || !custom_name) {
    return NextResponse.json({ error: 'missing required fields' }, { status: 400 });
  }
  if (differentiation.length < 50) {
    return NextResponse.json({ error: 'differentiation must be at least 50 characters' }, { status: 400 });
  }
  if (advantage.length < 30) {
    return NextResponse.json({ error: 'advantage must be at least 30 characters' }, { status: 400 });
  }
  if (custom_name.length < 3 || custom_name.length > 50) {
    return NextResponse.json({ error: 'custom_name must be between 3 and 50 characters' }, { status: 400 });
  }

  // Check user hasn't already selected this idea
  const { data: existing } = await supabase
    .from('idea_library_selections')
    .select('id')
    .eq('user_id', user.id)
    .eq('library_idea_id', params.id)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: 'already_selected', message: 'أنت تعمل على هذه الفكرة بالفعل' }, { status: 409 });
  }

  // Check user hasn't exceeded the 2-idea limit
  const { count } = await supabase
    .from('idea_library_selections')
    .select('id', { count: 'exact' })
    .eq('user_id', user.id);

  if ((count ?? 0) >= 2) {
    return NextResponse.json({
      error: 'limit_exceeded',
      message: 'يمكنك اختيار فكرتين كحد أقصى. أكمل فكرتك الحالية أولاً.'
    }, { status: 400 });
  }

  // Check library idea capacity
  const { data: libraryIdea } = await supabase
    .from('idea_library')
    .select('id, max_entrepreneurs, current_entrepreneurs, title_ar, sector, solution_ar, target_market_ar, revenue_model_ar')
    .eq('id', params.id)
    .maybeSingle();

  if (!libraryIdea) return NextResponse.json({ error: 'idea not found' }, { status: 404 });
  if (libraryIdea.current_entrepreneurs >= libraryIdea.max_entrepreneurs) {
    return NextResponse.json({ error: 'capacity_full', message: 'جميع المقاعد محجوزة — جرّب فكرة أخرى' }, { status: 400 });
  }

  // Create the user idea
  const { data: newIdea, error: ideaError } = await supabase
    .from('ideas')
    .insert({
      user_id: user.id,
      title: custom_name,
      description: `${differentiation}\n\nالميزة: ${advantage}`,
      sector: libraryIdea.sector,
      stage: 'ideation',
      week: 1,
      validation_score: 5,
    })
    .select()
    .single();

  if (ideaError) return NextResponse.json({ error: ideaError.message }, { status: 500 });

  // Pre-fill canvas draft with base data
  const canvasData = {
    idea_id: newIdea.id,
    user_id: user.id,
    value_proposition: libraryIdea.solution_ar,
    customer_segments: libraryIdea.target_market_ar,
    revenue_streams: libraryIdea.revenue_model_ar,
  };

  await supabase.from('canvas_drafts').upsert(canvasData, { onConflict: 'idea_id' });

  // Create 90-day tasks
  const tasks = buildWeeklyTasks(newIdea.id, user.id, null);
  await supabase.from('tasks').insert(tasks);

  // Record the selection (counter is handled by trigger)
  await supabase.from('idea_library_selections').insert({
    user_id: user.id,
    library_idea_id: params.id,
    user_idea_id: newIdea.id,
    country,
    city,
    differentiation,
    advantage,
    custom_name,
  });

  return NextResponse.json({
    success: true,
    new_idea_id: newIdea.id,
    message: 'تم نسخ الفكرة بنجاح! ابدأ رحلة التحقق الآن.',
    redirect_to: `/ideas/${newIdea.id}`,
  });
}
