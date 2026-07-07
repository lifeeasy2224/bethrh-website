import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import LinearProgress from '@mui/material/LinearProgress';
import Checkbox from '@mui/material/Checkbox';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import SmartToyOutlinedIcon from '@mui/icons-material/SmartToyOutlined';
import { supabase } from '../../supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useIdea } from '../../contexts/IdeaContext';
import { useReview } from '../../contexts/ReviewContext';

interface Week {
  num: number;
  phase: number;
  title: string;
  main: string;
  subs: string[];
  coachTip: string;
}

const WEEKS: Week[] = [
  { num: 1, phase: 1, title: 'حدد عميلك', main: 'اكتب بدقة من هو عميلك (العمر، الوظيفة, الموقع، المشكلة)', subs: ['اذكر ٣ أماكن يتواجد فيها عملاؤك', 'اكتب ٥ أسئلة للمقابلات', 'حدد ١٠ عملاء محتملين للتحدث معهم'], coachTip: 'ساعدني أكتب أسئلة مقابلات العملاء لفكرتي' },
  { num: 2, phase: 1, title: 'تحدث مع ٥ عملاء', main: 'أجرِ ٥ مقابلات مع عملاء (حضورياً أو عبر الفيديو)', subs: ['سجّل كل مقابلة في متتبّع التحقق', 'حدد أهم ٣ مشكلات ذُكرت', 'اكتب ملخصاً من فقرة واحدة لما تعلمته'], coachTip: 'ما الأنماط التي أبحث عنها في مقابلات العملاء؟' },
  { num: 3, phase: 1, title: 'ابنِ منتجك الأولي (MVP)', main: 'أنشئ منتجاً أولياً أو صفحة هبوط', subs: ['حدد الميزة الجوهرية الواحدة', 'ابنِها (أو أنشئ صفحة هبوط تصفها)', 'شاركها مع ٣ عملاء محتملين لأخذ الملاحظات'], coachTip: 'ما أبسط MVP يمكنني بناؤه لفكرتي؟' },
  { num: 4, phase: 1, title: 'احصل على أول إشارة', main: 'احصل على تسجيل اهتمام أو طلب مسبق أو دفعة واحدة على الأقل', subs: ['جهّز طريقة لجمع التسجيلات أو المدفوعات', 'تواصل مع من قابلتهم', 'سجّل النتائج في متتبّع التحقق'], coachTip: 'كيف أحصل على أول عميل يدفع؟' },
  { num: 5, phase: 2, title: 'حسّن بناءً على الملاحظات', main: 'طوّر منتجك/خدمتك بناءً على ملاحظات العملاء', subs: ['اذكر أهم ٣ تحسينات', 'نفّذ التغيير الأكثر طلباً', 'خذ ملاحظات ٣ عملاء على النسخة المحسّنة'], coachTip: 'كيف أرتب أولويات الملاحظات التي أتصرف بناءً عليها؟' },
  { num: 6, phase: 2, title: 'بِع لثلاثة عملاء جدد', main: 'اكسب ٣ عملاء جدد يدفعون أو يلتزمون بالتسجيل', subs: ['صُغ عرض بيعك (جملة واحدة)', 'تواصل مع ١٠ عملاء محتملين', 'تابع مع كل من أبدى اهتماماً'], coachTip: 'اكتب لي عرض بيع قصيراً لفكرتي' },
  { num: 7, phase: 2, title: 'جهّز العمليات', main: 'أنشئ إجراءات أساسية للتسليم والدعم والفوترة', subs: ['وثّق إجراء التسليم لديك', 'جهّز قناة دعم بسيطة للعملاء', 'أنشئ أول فاتورة أو نظام دفع'], coachTip: 'ما الإجراءات الأساسية التي أجهّزها أولاً؟' },
  { num: 8, phase: 2, title: 'ابدأ التسويق', main: 'أطلق قناة تسويق واحدة (سوشال، محتوى، إعلانات، أو توصيات)', subs: ['اختر قناتك التسويقية الأساسية', 'أنشئ ٥ قطع محتوى', 'قِس نتائجك بعد أسبوع'], coachTip: 'أي قناة تسويق تناسب نوع مشروعي؟' },
  { num: 9, phase: 3, title: 'أتمت عملية واحدة', main: 'أخرج نفسك من مهمة متكررة واحدة', subs: ['حدد أكثر مهامك المتكررة استهلاكاً للوقت', 'ابحث عن أداة أو نظام لأتمتتها', 'اختبر الأتمتة مع سيناريو عميل حقيقي'], coachTip: 'ما الذي أؤتمته أولاً في مشروعي؟' },
  { num: 10, phase: 3, title: 'ضاعف قاعدة عملائك', main: 'انتقل من عددك الحالي من العملاء إلى الضعف', subs: ['أطلق برنامج توصيات', 'أنشئ دراسة حالة من أفضل عملائك', 'اعقد شراكة مع نشاط مكمّل واحد'], coachTip: 'ما أسرع طريقة لمضاعفة عملائي؟' },
  { num: 11, phase: 3, title: 'حسّن اقتصاديات الوحدة', main: 'قلّل التكاليف أو زد الإيراد لكل عميل', subs: ['احسب تكلفة اكتساب العميل (CAC)', 'حدد شريحة عملائك الأكثر ربحية', 'اختبر رفع سعر أو عرض بيع إضافي واحد'], coachTip: 'كيف أحسّن هوامشي دون رفع الأسعار كثيراً؟' },
  { num: 12, phase: 3, title: 'خطط للربع القادم', main: 'راجع تقدمك، وضع أهداف الربع الثاني، وادرس خيارات التمويل', subs: ['اكتب مراجعة عمل من صفحة واحدة', 'ضع ٣ أهداف قابلة للقياس للربع القادم', 'قرر: تمويل ذاتي، أم جولة استثمار، أم البقاء خفيفاً'], coachTip: 'ساعدني أفكر: هل أحتاج جولة تمويل؟' },
];

const PHASE_LABELS = ['التحقق', 'البناء', 'النمو'];
const PHASE_COLORS = ['#1B6B3E', '#1B6B3E', '#D08A28'];

type TaskMap = Record<string, Record<string, boolean>>;

export default function NinetyDayPage() {
  const { user, profile } = useAuth();
  const { selectedIdea, selectedIdeaId } = useIdea();
  const { triggerReview } = useReview();
  const [tasks, setTasks] = useState<TaskMap>({});
  const [toast, setToast] = useState<string | null>(null);

  const plan = profile?.plan ?? 'free';
  const canAccess = plan !== 'free';

  async function loadTasks() {
    if (!selectedIdeaId) return;
    const { data } = await supabase.from('journey_tasks').select('*').eq('user_idea_id', selectedIdeaId);
    const map: TaskMap = {};
    (data ?? []).forEach((t: any) => {
      if (!map[t.week_number]) map[t.week_number] = {};
      map[t.week_number][t.task_key] = !!t.is_completed || !!t.completed_at;
    });
    setTasks(map);
  }

  useEffect(() => { if (user && selectedIdeaId) loadTasks(); }, [selectedIdeaId, user]);

  async function toggleTask(weekNum: number, taskKey: string, current: boolean) {
    if (!user || !selectedIdeaId) return;
    const newVal = !current;
    setTasks(prev => ({ ...prev, [weekNum]: { ...(prev[weekNum] ?? {}), [taskKey]: newVal } }));

    const existing = await supabase.from('journey_tasks').select('id').eq('user_idea_id', selectedIdeaId).eq('week_number', weekNum).eq('task_key', taskKey).maybeSingle();

    const now = new Date().toISOString();
    if (existing.data?.id) {
      await supabase.from('journey_tasks').update({ is_completed: newVal, completed_at: now }).eq('id', existing.data.id);
    } else {
      await supabase.from('journey_tasks').insert({ user_idea_id: selectedIdeaId, week_number: weekNum, task_key: taskKey, is_completed: newVal, completed_at: now });
    }
  }

  const totalTasks = WEEKS.reduce((sum, w) => sum + 1 + w.subs.length, 0);
  const doneTasks = WEEKS.reduce((sum, w) => {
    const wt = tasks[w.num] ?? {};
    return sum + (wt['main'] ? 1 : 0) + w.subs.filter((_, i) => wt[`sub_${i}`]).length;
  }, 0);
  const overallPct = Math.round(doneTasks / totalTasks * 100);

  // The 90-Day Journey is the final stage. Ask for a review only once the whole
  // journey is complete (all tasks done). ReviewContext dedupes via localStorage,
  // so this fires at most once per user + idea.
  useEffect(() => {
    if (totalTasks > 0 && overallPct === 100 && selectedIdeaId) {
      triggerReview('stage_complete', '90-Day Journey', selectedIdeaId);
    }
  }, [overallPct, totalTasks, selectedIdeaId]);

  function isWeekUnlocked(w: Week): boolean {
    if (w.num === 1) return true;
    const prev = tasks[w.num - 1] ?? {};
    return !!prev['main'];
  }

  function getWeekStatus(w: Week): 'complete' | 'in_progress' | 'locked' | 'upcoming' {
    if (!isWeekUnlocked(w)) return 'locked';
    const wt = tasks[w.num] ?? {};
    const main = !!wt['main'];
    const anySub = w.subs.some((_, i) => wt[`sub_${i}`]);
    if (main) return 'complete';
    if (anySub) return 'in_progress';
    return 'upcoming';
  }

  const phaseProgress = [1, 2, 3].map(phase => {
    const phaseWeeks = WEEKS.filter(w => w.phase === phase);
    const phaseDone = phaseWeeks.reduce((sum, w) => sum + (getWeekStatus(w) === 'complete' ? 1 : 0), 0);
    return Math.round(phaseDone / phaseWeeks.length * 100);
  });

  if (!selectedIdea) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="info">اختر فكرة لعرض رحلة الـ ٩٠ يوماً.</Alert>
      </Container>
    );
  }

  if (!canAccess) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Card sx={{ textAlign: 'center', p: 6, border: '2px dashed', borderColor: 'divider', boxShadow: 'none' }}>
          <LockOutlinedIcon sx={{ fontSize: 44, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h5" fontWeight={700} gutterBottom>رحلة الـ ٩٠ يوماً تتطلب خطة برو</Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>خطتك التنفيذية أسبوعاً بأسبوع من أول مقابلة حتى أول دولار.</Typography>
          <Button variant="contained" component={Link} to="/pricing">رقِّ إلى برو — $9/شهر</Button>
        </Card>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ sm: 'center' }} justifyContent="space-between" sx={{ mb: 2 }}>
        <Box>
          <Typography variant="h5" fontWeight={800}>رحلة الـ ٩٠ يوماً</Typography>
          <Typography variant="body2" color="text.secondary">خطة تنفيذ أسبوعاً بأسبوع — من أول مقابلة حتى أول دولار.</Typography>
        </Box>
        <Box sx={{ mt: { xs: 1, sm: 0 }, textAlign: { sm: 'right' } }}>
          <Typography variant="h6" fontWeight={800} color="primary.main">اكتمل ٪{overallPct}</Typography>
          <Box sx={{ width: 180, mt: 0.5 }}>
            <LinearProgress variant="determinate" value={overallPct} sx={{ height: 8, borderRadius: 4, '& .MuiLinearProgress-bar': { background: 'linear-gradient(90deg, #1B6B3E, #D08A28)' } }} />
          </Box>
        </Box>
      </Stack>

      {/* Phase overview */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: 2.5 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3}>
            {[1, 2, 3].map((phase, i) => (
              <Box key={phase} sx={{ flex: 1 }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 0.5 }}>
                  <Typography variant="caption" fontWeight={700} sx={{ color: PHASE_COLORS[i] }}>المرحلة {phase}: {PHASE_LABELS[i]}</Typography>
                  <Typography variant="caption" fontWeight={700}>{phaseProgress[i]}%</Typography>
                </Stack>
                <LinearProgress variant="determinate" value={phaseProgress[i]} sx={{ height: 6, borderRadius: 3, bgcolor: 'grey.100', '& .MuiLinearProgress-bar': { bgcolor: PHASE_COLORS[i] } }} />
                <Typography variant="caption" color="text.secondary">الأسابيع {(i * 4) + 1}–{(i * 4) + 4}</Typography>
              </Box>
            ))}
          </Stack>
        </CardContent>
      </Card>

      {/* Weeks */}
      <Stack spacing={2}>
        {WEEKS.map(week => {
          const status = getWeekStatus(week);
          const wt = tasks[week.num] ?? {};
          const isLocked = status === 'locked';
          const borderColor = { complete: '#2A8A52', in_progress: '#1B6B3E', locked: '#E8E4DC', upcoming: '#E8E4DC' }[status];
          const badge = { complete: '✅ مكتمل', in_progress: '🔄 قيد التنفيذ', locked: '🔒 مقفل', upcoming: '⬜ قادم' }[status];

          return (
            <Card key={week.num} sx={{ borderLeft: `4px solid ${borderColor}`, opacity: isLocked ? 0.6 : 1 }}>
              <CardContent sx={{ p: 2.5 }}>
                <Stack direction="row" alignItems="flex-start" justifyContent="space-between" sx={{ mb: 1.5 }}>
                  <Box>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Chip label={`الأسبوع ${week.num}`} size="small" sx={{ height: 20, fontSize: '0.7rem', bgcolor: `${PHASE_COLORS[week.phase - 1]}18`, color: PHASE_COLORS[week.phase - 1], fontWeight: 700 }} />
                      <Chip label={badge} size="small" sx={{ height: 20, fontSize: '0.7rem' }} />
                    </Stack>
                    <Typography variant="subtitle1" fontWeight={700} sx={{ mt: 0.75 }}>{week.title}</Typography>
                  </Box>
                </Stack>

                {/* Main task */}
                <Stack direction="row" alignItems="flex-start" spacing={1} sx={{ mb: 1, p: 1.5, bgcolor: 'grey.50', borderRadius: 1 }}>
                  <Checkbox size="small" checked={!!wt['main']} onChange={() => !isLocked && toggleTask(week.num, 'main', !!wt['main'])} disabled={isLocked} sx={{ mt: -0.5, p: 0.5 }} />
                  <Box>
                    <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>المهمة الرئيسية</Typography>
                    <Typography variant="body2" sx={{ textDecoration: wt['main'] ? 'line-through' : 'none', color: wt['main'] ? 'text.disabled' : 'text.primary' }}>
                      {week.main}
                    </Typography>
                  </Box>
                </Stack>

                {/* Sub-tasks */}
                <Stack spacing={0.75} sx={{ pl: 1 }}>
                  {week.subs.map((sub, si) => (
                    <Stack key={si} direction="row" spacing={1} alignItems="flex-start">
                      <Checkbox size="small" checked={!!wt[`sub_${si}`]} onChange={() => !isLocked && toggleTask(week.num, `sub_${si}`, !!wt[`sub_${si}`])} disabled={isLocked} sx={{ mt: -0.5, p: 0.5 }} />
                      <Typography variant="body2" sx={{ pt: 0.25, textDecoration: wt[`sub_${si}`] ? 'line-through' : 'none', color: wt[`sub_${si}`] ? 'text.disabled' : 'text.primary' }}>
                        {sub}
                      </Typography>
                    </Stack>
                  ))}
                </Stack>

                {/* Coach tip */}
                <Box sx={{ mt: 1.5, p: 1.25, bgcolor: '#F0F5F1', borderRadius: 1.5 }}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <SmartToyOutlinedIcon sx={{ fontSize: 16, color: 'secondary.main' }} />
                    <Typography variant="caption" color="secondary.main" fontWeight={600}>اسأل المدرّب الذكي:</Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ flex: 1 }}>"{week.coachTip}"</Typography>
                    <Button size="small" component={Link} to={`/ai-coach`} sx={{ fontSize: '0.7rem', py: 0.25, px: 1, minWidth: 0 }}>اسأل ←</Button>
                  </Stack>
                </Box>
              </CardContent>
            </Card>
          );
        })}
      </Stack>

      <Snackbar open={!!toast} autoHideDuration={3000} onClose={() => setToast(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity="success" variant="filled" onClose={() => setToast(null)}>{toast}</Alert>
      </Snackbar>
    </Container>
  );
}
