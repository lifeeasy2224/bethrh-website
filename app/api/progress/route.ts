import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function deriveStage(p: {
  stage_1_done: boolean;
  stage_2_score: number;
  stage_3_tasks_done: number;
  stage_4_first_customer: boolean;
}): string {
  if (!p.stage_1_done) return 'seed';
  if (p.stage_2_score < 75) return 'sprout';
  if (p.stage_3_tasks_done < 80) return 'root';
  if (!p.stage_4_first_customer) return 'stem';
  return 'pitch';
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: { user }, error: authError } = await supabase.auth.getUser(
    authHeader.replace('Bearer ', '')
  );
  if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data: progress } = await supabase
    .from('founder_progress')
    .select('*')
    .eq('user_id', user.id)
    .maybeSingle();

  const { data: ideas } = await supabase
    .from('ideas')
    .select('id, validation_score, stage')
    .eq('user_id', user.id);

  const { data: tasks } = await supabase
    .from('tasks')
    .select('status')
    .eq('user_id', user.id);

  const ideaCount = ideas?.length ?? 0;
  const maxScore = ideas?.reduce((m, i) => Math.max(m, i.validation_score ?? 0), 0) ?? 0;
  const totalTasks = tasks?.length ?? 0;
  const doneTasks = tasks?.filter(t => t.status === 'done').length ?? 0;
  const tasksPct = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  const derived = {
    stage_1_done: ideaCount > 0,
    stage_2_score: maxScore,
    stage_3_tasks_done: tasksPct,
    stage_4_first_customer: progress?.stage_4_first_customer ?? false,
  };

  const currentStage = deriveStage(derived);

  if (!progress) {
    await supabase.from('founder_progress').upsert({
      user_id: user.id,
      current_stage: currentStage,
      ...derived,
    });
  } else if (progress.current_stage !== currentStage) {
    await supabase.from('founder_progress').update({
      current_stage: currentStage,
      stage_1_done: derived.stage_1_done,
      stage_2_score: derived.stage_2_score,
      stage_3_tasks_done: derived.stage_3_tasks_done,
      updated_at: new Date().toISOString(),
    }).eq('user_id', user.id);
  }

  return NextResponse.json({
    currentStage,
    ideaCount,
    maxScore,
    tasksPct,
    doneTasks,
    totalTasks,
    badges: progress?.badges ?? [],
    stages: {
      seed:   { status: 'completed' },
      sprout: { status: derived.stage_1_done ? (maxScore >= 75 ? 'completed' : 'active') : 'locked', score: maxScore },
      root:   { status: maxScore >= 75 ? (tasksPct >= 80 ? 'completed' : 'active') : 'locked', pct: tasksPct },
      stem:   { status: tasksPct >= 80 ? (derived.stage_4_first_customer ? 'completed' : 'active') : 'locked' },
      pitch:  { status: derived.stage_1_done ? 'active' : 'locked' },
      branch: { status: 'soon' },
      fruit:  { status: 'soon' },
    },
  });
}
