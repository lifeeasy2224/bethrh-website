import { useState, useEffect, useRef, type ReactNode } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActionArea from '@mui/material/CardActionArea';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import IconButton from '@mui/material/IconButton';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import LinearProgress from '@mui/material/LinearProgress';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import FormControl from '@mui/material/FormControl';
import Chip from '@mui/material/Chip';
import Tooltip from '@mui/material/Tooltip';
import Grid from '@mui/material/Grid';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import Divider from '@mui/material/Divider';
import MenuIcon from '@mui/icons-material/Menu';
import AddIcon from '@mui/icons-material/Add';
import LightbulbOutlinedIcon from '@mui/icons-material/LightbulbOutlined';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import SmartToyOutlinedIcon from '@mui/icons-material/SmartToyOutlined';
import NotificationsOutlinedIcon from '@mui/icons-material/NotificationsOutlined';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import FactCheckOutlinedIcon from '@mui/icons-material/FactCheckOutlined';
import LocalFireDepartmentIcon from '@mui/icons-material/LocalFireDepartment';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useIdea } from '../../contexts/IdeaContext';
import FounderSidebar from '../../components/FounderSidebar';
import { supabase, getStageInfo } from '../../supabase';
import { recomputeIqScore, TOTAL_JOURNEY_TASKS } from '../../lib/iqScore';

async function fireConfetti() {
  const confetti = (await import('canvas-confetti')).default;
  confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, colors: ['#D4A653', '#0F3D24', '#1B6B3E', '#ffffff'] });
  setTimeout(() => confetti({ particleCount: 80, spread: 50, origin: { y: 0.5 }, colors: ['#D4A653', '#D4A653'] }), 400);
}

// Stage → path node index (0-based out of 5 nodes)
function stageToNodeIndex(stage: string): number {
  if (stage === 'ready') return 3;
  if (stage === 'growing') return 2;
  return 1; // seed = at least "Idea" done
}

function StatCard({ icon, label, value, sub, color = '#1B6B3E' }: { icon: ReactNode; label: string; value: string; sub?: string; color?: string }) {
  return (
    <Card sx={{ flex: 1, minWidth: 0 }}>
      <CardContent sx={{ p: '16px !important' }}>
        <Stack direction="row" spacing={1.5} alignItems="flex-start">
          <Box sx={{ width: 44, height: 44, borderRadius: 2, bgcolor: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', color, flexShrink: 0 }}>
            {icon}
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h5" fontWeight={800} lineHeight={1.1}>{value}</Typography>
            {sub && <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>{sub}</Typography>}
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25 }}>{label}</Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

const STAGE_PROGRESS: Record<string, number> = { seed: 25, growing: 60, ready: 90 };

const PATH_NODES = [
  { label: 'الفكرة', emoji: '💡' },
  { label: 'تم التحقق', emoji: '✅' },
  { label: 'أول عرض', emoji: '📋' },
  { label: 'أول عميل', emoji: '👤' },
  { label: 'أول دولار', emoji: '💰' },
];

const PATH_NEXT_STEPS: Record<number, string> = {
  0: 'أضف فكرتك الأولى لتبدأ رحلتك',
  1: 'تحدث مع ٥ عملاء للتحقق من فكرتك',
  2: 'أنشئ عرضك الأول وشاركه مع ٥ عملاء محتملين',
  3: 'أغلق صفقة أول عميل يدفع',
  4: 'وصلت — الآن توسّع!',
};

interface DashboardMetrics {
  iqScore: number;
  journeyPct: number;
  validationCount: number;
  canvasBlocksFilled: number;
  journeyTasksDone: number;
  recentActivity: Array<{ icon: string; text: string; time: string }>;
}

export default function FounderDashboard() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuAnchor, setUserMenuAnchor] = useState<HTMLElement | null>(null);
  const [milestoneDialog, setMilestoneDialog] = useState<'customer' | 'revenue' | null>(null);
  const [milestoneNote, setMilestoneNote] = useState('');
  const [milestoneAmount, setMilestoneAmount] = useState('');
  const [savingMilestone, setSavingMilestone] = useState(false);
  const [celebrationToast, setCelebrationToast] = useState<string | null>(null);
  const prevStageRef = useRef<string | null>(null);
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const { ideas, selectedIdea, selectedIdeaId, setSelectedIdeaId, loading } = useIdea();
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    iqScore: 0,
    journeyPct: 0,
    validationCount: 0,
    canvasBlocksFilled: 0,
    journeyTasksDone: 0,
    recentActivity: [],
  });

  const firstName = profile?.full_name?.split(' ')[0] ?? 'يا صديقي';
  const plan = profile?.plan ?? 'free';
  const streak = profile?.current_streak ?? 0;
  const stage = selectedIdea ? getStageInfo(selectedIdea.stage) : null;
  const progress = selectedIdea ? STAGE_PROGRESS[selectedIdea.stage] ?? 25 : 0;
  const noIdeas = !loading && ideas.length === 0;

  // Current path node index based on stage
  const currentNodeIndex = selectedIdea ? stageToNodeIndex(selectedIdea.stage) : 0;

  useEffect(() => {
    if (!selectedIdeaId) {
      setMetrics(m => ({ ...m, iqScore: 0, journeyPct: 0, validationCount: 0, canvasBlocksFilled: 0, journeyTasksDone: 0 }));
      return;
    }

    async function loadMetrics() {
      const [valRes, canvasRes, tasksRes] = await Promise.all([
        supabase.from('validation_entries').select('id, type, created_at', { count: 'exact' }).eq('user_idea_id', selectedIdeaId),
        supabase.from('canvas_data').select('*').eq('user_idea_id', selectedIdeaId!).maybeSingle(),
        supabase.from('journey_tasks').select('id, task_key, week_number, completed_at').eq('user_idea_id', selectedIdeaId!).eq('is_completed', true),
      ]);

      const validationCount = valRes.count ?? 0;

      const CANVAS_KEYS = ['key_partners', 'key_activities', 'value_proposition', 'customer_relationships', 'customer_segments', 'key_resources', 'channels', 'cost_structure', 'revenue_streams'];
      const canvasBlocksFilled = canvasRes.data
        ? CANVAS_KEYS.filter(k => (canvasRes.data as Record<string, string>)[k]?.length >= 20).length
        : 0;

      const journeyTasksDone = tasksRes.data?.length ?? 0;
      const journeyPct = Math.round((journeyTasksDone / TOTAL_JOURNEY_TASKS) * 100);

      // The real evidence-weighted score (lib/iqScore.ts) — fetches its own inputs
      // and persists user_ideas.iq_score only if changed.
      const scoreRes = await recomputeIqScore(selectedIdeaId!);
      const iqScore = scoreRes?.score ?? 0;

      // Recent activity from validation + tasks (last 4)
      const recentActivity: Array<{ icon: string; text: string; time: string }> = [];
      const formatTime = (iso: string) => {
        const diff = (Date.now() - new Date(iso).getTime()) / 1000;
        if (diff < 3600) return `قبل ${Math.round(diff / 60)} د`;
        if (diff < 86400) return `قبل ${Math.round(diff / 3600)} س`;
        if (diff < 172800) return 'أمس';
        return `قبل ${Math.round(diff / 86400)} يوم`;
      };

      (valRes.data ?? []).slice(0, 2).forEach((v: { type: string; created_at: string }) => {
        const labels: Record<string, string> = { interview: 'سُجّلت مقابلة', signup: 'سُجّل تسجيل اهتمام', preorder: 'سُجّل طلب مسبق', observation: 'سُجّلت ملاحظة', other: 'سُجّل نشاط تحقق' };
        recentActivity.push({ icon: '🎯', text: labels[v.type] ?? 'سُجّل نشاط تحقق', time: formatTime(v.created_at) });
      });

      (tasksRes.data ?? []).slice(0, 2).forEach((t: { task_key: string; completed_at: string }) => {
        recentActivity.push({ icon: '✅', text: `اكتملت مهمة — الأسبوع ${(t as unknown as { week_number: number }).week_number ?? ''}`, time: formatTime(t.completed_at) });
      });

      // keep insertion order (already sorted by recency from DB)

      setMetrics({ iqScore, journeyPct, validationCount, canvasBlocksFilled, journeyTasksDone, recentActivity: recentActivity.slice(0, 4) });
    }

    loadMetrics();
  }, [selectedIdeaId, profile]);

  // Auto-confetti when stage advances
  useEffect(() => {
    if (!selectedIdea) return;
    const prev = prevStageRef.current;
    prevStageRef.current = selectedIdea.stage;
    if (prev && prev !== selectedIdea.stage) {
      fireConfetti();
      const labels: Record<string, string> = { growing: '🎉 فكرتك تنمو!', ready: '🚀 فكرتك جاهزة للمستثمرين!' };
      if (labels[selectedIdea.stage]) setCelebrationToast(labels[selectedIdea.stage]);
    }
  }, [selectedIdea?.stage]);

  async function handleMilestoneSave() {
    if (!selectedIdeaId || !user) return;
    setSavingMilestone(true);
    const isRevenue = milestoneDialog === 'revenue';
    await supabase.from('milestone_logs').insert({
      user_id: user.id,
      user_idea_id: selectedIdeaId,
      milestone_type: milestoneDialog,
      note: milestoneNote || null,
      amount: isRevenue ? (parseFloat(milestoneAmount) || null) : null,
    });
    await supabase.from('user_ideas').update({ stage: 'ready' }).eq('id', selectedIdeaId);
    setSavingMilestone(false);
    setMilestoneDialog(null);
    setMilestoneNote('');
    setMilestoneAmount('');
    fireConfetti();
    setCelebrationToast(isRevenue ? '🎉 مبروك أول إيراد لك!' : '🎉 أول عميل لك — رائع!');
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'grey.50' }}>
      <FounderSidebar open={sidebarOpen} onToggle={() => setSidebarOpen(o => !o)} mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />

      <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <AppBar position="sticky" color="default" elevation={0} sx={{ bgcolor: 'white', borderBottom: '1px solid', borderColor: 'divider' }}>
          <Toolbar sx={{ gap: 1 }}>
            <IconButton sx={{ display: { lg: 'none' } }} onClick={() => setMobileOpen(true)} size="small"><MenuIcon /></IconButton>
            <Typography variant="h6" fontWeight={700} sx={{ flex: 1 }}>لوحة التحكم</Typography>
            <IconButton size="small"><NotificationsOutlinedIcon /></IconButton>
            <IconButton onClick={e => setUserMenuAnchor(e.currentTarget)} size="small" sx={{ p: 0 }}>
              <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: '0.8rem', fontWeight: 700 }}>
                {profile?.full_name?.[0] ?? 'F'}
              </Avatar>
            </IconButton>
            <Menu
              anchorEl={userMenuAnchor}
              open={Boolean(userMenuAnchor)}
              onClose={() => setUserMenuAnchor(null)}
              slotProps={{ paper: { sx: { mt: 1, minWidth: 180 } } }}
            >
              <Box sx={{ px: 2, py: 1 }}>
                <Typography variant="body2" fontWeight={700}>{profile?.full_name}</Typography>
                <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'capitalize' }}>
                  {profile?.plan === 'free' ? 'مجاني' : profile?.plan}
                </Typography>
              </Box>
              <Divider />
              <MenuItem component={Link} to="/settings" onClick={() => setUserMenuAnchor(null)}>الإعدادات</MenuItem>
              <Divider />
              <MenuItem
                onClick={async () => { setUserMenuAnchor(null); await signOut(); navigate('/'); }}
                sx={{ color: 'error.main' }}
              >
                تسجيل الخروج
              </MenuItem>
            </Menu>
          </Toolbar>
        </AppBar>

        <Box sx={{ flex: 1, p: { xs: 2, sm: 3 }, maxWidth: 1200, mx: 'auto', width: '100%' }}>

          {/* Welcome */}
          <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ sm: 'center' }} justifyContent="space-between" spacing={2} sx={{ mb: 3 }}>
            <Box>
              <Typography variant="h4" fontWeight={800}>أهلاً بعودتك يا {firstName}!</Typography>
              <Typography color="text.secondary" sx={{ mt: 0.5 }}>تابع رحلتك الريادية خطوة بخطوة.</Typography>
            </Box>
            <Button variant="contained" startIcon={<AddIcon />} component={Link} to="/journey?new=true" sx={{ whiteSpace: 'nowrap', flexShrink: 0 }}>
              أضف فكرة جديدة
            </Button>
          </Stack>

          {/* Journey Progress Card */}
          <Card sx={{ mb: 3, background: selectedIdea ? 'linear-gradient(135deg, #0F3D24 0%, #1B6B3E 60%, #D08A28 100%)' : 'white' }}>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              {selectedIdea ? (
                <>
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                    <Typography variant="h6" fontWeight={700} sx={{ color: 'white' }}>
                      أنت في مرحلة <strong>{stage?.label}</strong> {stage?.emoji}
                    </Typography>
                  </Stack>
                  <Stack direction="row" justifyContent="space-between" sx={{ mb: 1 }}>
                    {['🌱 بذرة', '🌿 تنمو', '🍎 جاهزة'].map((s, i) => (
                      <Typography key={i} variant="caption" sx={{ color: 'rgba(255,255,255,0.8)', fontWeight: 600 }}>{s}</Typography>
                    ))}
                  </Stack>
                  <LinearProgress
                    variant="determinate"
                    value={progress}
                    sx={{
                      height: 10, borderRadius: 5,
                      bgcolor: 'rgba(255,255,255,0.2)',
                      '& .MuiLinearProgress-bar': { bgcolor: 'white', borderRadius: 5 },
                    }}
                  />
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', mt: 0.5, display: 'block' }}>
                    درجة بذرة: {metrics.iqScore}/100 · اكتمل {metrics.journeyTasksDone}/{TOTAL_JOURNEY_TASKS} من مهام الرحلة
                  </Typography>
                </>
              ) : noIdeas ? (
                <Box sx={{ textAlign: 'center', py: 3 }}>
                  <Typography variant="h5" fontWeight={700} gutterBottom>أهلاً بك في بذرة! 🎉</Typography>
                  <Typography color="text.secondary" sx={{ mb: 2 }}>أضف فكرتك الأولى لتبدأ رحلتك الريادية.</Typography>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
                    <Button variant="contained" startIcon={<AddIcon />} component={Link} to="/journey?new=true">أضف فكرتي</Button>
                    <Button variant="outlined" component={Link} to="/ideas-library">تصفّح مكتبة الأفكار</Button>
                  </Stack>
                </Box>
              ) : (
                <Box sx={{ textAlign: 'center', py: 2 }}>
                  <Typography color="text.secondary">اختر فكرة بالأسفل لترى تقدم رحلتك.</Typography>
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Stats */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid size={{ xs: 6, md: 3 }}>
              <StatCard icon={<LightbulbOutlinedIcon />} label="الأفكار" value={String(ideas.length)} sub={ideas.length === 0 ? 'أضف الأولى!' : undefined} color="#1B6B3E" />
            </Grid>
            <Grid size={{ xs: 6, md: 3 }}>
              <StatCard icon={<TrendingUpIcon />} label="درجة بذرة" value={selectedIdea ? `${metrics.iqScore}/100` : '—'} sub={stage?.label} color="#1B6B3E" />
            </Grid>
            <Grid size={{ xs: 6, md: 3 }}>
              <StatCard icon={<LocalFireDepartmentIcon />} label="سلسلة الأيام" value={String(streak)} sub={streak === 1 ? 'يوم' : 'أيام'} color="#D4A653" />
            </Grid>
            <Grid size={{ xs: 6, md: 3 }}>
              <StatCard icon={<CalendarMonthOutlinedIcon />} label="الرحلة" value={selectedIdea ? `٪${metrics.journeyPct}` : '—'} sub="مكتملة" color="#D08A28" />
            </Grid>
          </Grid>

          {/* First Dollar Progress Widget */}
          <Box sx={{
            mt: 3,
            bgcolor: '#0F3D24',
            border: '1px solid rgba(212,166,83,0.2)',
            borderRadius: '12px',
            p: 3,
          }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2.5 }}>
              <Typography sx={{ fontFamily: '"Noto Kufi Arabic", "Nunito Sans", sans-serif', fontWeight: 700, fontSize: '1rem', color: 'white' }}>
                مسارك نحو أول دولار
              </Typography>
              <Typography component={Link} to="/journey/idea" sx={{ fontFamily: '"Noto Kufi Arabic", "Nunito Sans", sans-serif', fontWeight: 400, fontSize: '0.875rem', color: '#D4A653', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
                عرض الرحلة ←
              </Typography>
            </Stack>

            {/* Progress nodes — driven by currentNodeIndex */}
            <Box sx={{ position: 'relative', px: 1, mb: 2 }}>
              <Box sx={{ position: 'absolute', top: 17, left: 'calc(10% + 18px)', right: 'calc(10% + 18px)', height: '2px', display: 'flex' }}>
                {[0, 1, 2, 3].map(i => (
                  <Box key={i} sx={{
                    flex: 1, height: '2px',
                    bgcolor: i < currentNodeIndex - 1 ? '#D4A653' : 'transparent',
                    backgroundImage: i < currentNodeIndex - 1 ? 'none'
                      : i === currentNodeIndex - 1 ? 'repeating-linear-gradient(to right, #D4A653 0, #D4A653 6px, transparent 6px, transparent 10px)'
                        : 'repeating-linear-gradient(to right, #8A8070 0, #8A8070 6px, transparent 6px, transparent 10px)',
                  }} />
                ))}
              </Box>
              <Stack direction="row" justifyContent="space-between">
                {PATH_NODES.map((node, idx) => {
                  const state = idx < currentNodeIndex ? 'done' : idx === currentNodeIndex ? 'current' : 'upcoming';
                  return (
                    <Box key={node.label} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '20%' }}>
                      <Box sx={{
                        width: 36, height: 36, borderRadius: '50%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '1rem',
                        bgcolor: state === 'done' ? '#D4A653' : '#0F3D24',
                        border: state === 'done' ? '2px solid #D4A653' : state === 'current' ? '2px solid #D4A653' : '2px dashed #8A8070',
                        zIndex: 1, position: 'relative',
                        ...(state === 'current' && {
                          animation: 'pulseGold 1.8s ease-in-out infinite',
                          '@keyframes pulseGold': {
                            '0%, 100%': { boxShadow: '0 0 0 0 rgba(212,166,83,0.5)' },
                            '50%': { boxShadow: '0 0 0 6px rgba(212,166,83,0)' },
                          },
                        }),
                      }}>
                        {node.emoji}
                      </Box>
                      <Typography sx={{ fontFamily: '"Noto Kufi Arabic", "Nunito Sans", sans-serif', fontWeight: 300, fontSize: '0.6875rem', color: 'rgba(255,255,255,0.7)', mt: 0.75, textAlign: 'center', lineHeight: 1.3 }}>
                        {node.label}
                      </Typography>
                    </Box>
                  );
                })}
              </Stack>
            </Box>

            {/* Status row */}
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={0.5} alignItems={{ sm: 'center' }}>
              <Typography sx={{ fontFamily: '"Noto Kufi Arabic", "Nunito Sans", sans-serif', fontWeight: 400, fontSize: '0.875rem', color: 'rgba(255,255,255,0.8)' }}>
                📍 <strong>مرحلتك الحالية: {PATH_NODES[currentNodeIndex]?.label ?? 'الفكرة'}</strong>
              </Typography>
              <Typography sx={{ fontFamily: '"Noto Kufi Arabic", "Nunito Sans", sans-serif', fontWeight: 400, fontSize: '0.875rem', color: 'rgba(255,255,255,0.8)', display: { xs: 'block', sm: 'inline' } }}>
                <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>&nbsp;·&nbsp;</Box>
                التالي: {PATH_NEXT_STEPS[currentNodeIndex] ?? ''}
              </Typography>
            </Stack>

            {/* Manual milestone buttons for First Customer + First $ */}
            {selectedIdea && currentNodeIndex >= 2 && (
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ mt: 2.5 }}>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => setMilestoneDialog('customer')}
                  sx={{ borderColor: '#D4A653', color: '#D4A653', '&:hover': { bgcolor: 'rgba(212,166,83,0.1)', borderColor: '#D4A653' }, fontWeight: 700, fontSize: '0.8rem' }}
                >
                  👤 حصلت على أول عميل!
                </Button>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => setMilestoneDialog('revenue')}
                  sx={{ borderColor: '#D4A653', color: '#D4A653', '&:hover': { bgcolor: 'rgba(212,166,83,0.1)', borderColor: '#D4A653' }, fontWeight: 700, fontSize: '0.8rem' }}
                >
                  💰 كسبت أول دولار!
                </Button>
              </Stack>
            )}
          </Box>

          <Grid container spacing={3}>
            {/* Left: Idea selector + quick actions */}
            <Grid size={{ xs: 12, md: 8 }}>

              {/* Idea selector */}
              {ideas.length > 0 && (
                <Card sx={{ mb: 3 }}>
                  <CardContent sx={{ p: 2 }}>
                    <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>الفكرة النشطة</Typography>
                    <FormControl fullWidth size="small">
                      <Select
                        value={selectedIdeaId ?? ''}
                        onChange={e => setSelectedIdeaId(e.target.value || null)}
                        displayEmpty
                        sx={{ '& .MuiOutlinedInput-notchedOutline': { borderColor: 'divider' } }}
                      >
                        <MenuItem value=""><em>— اختر فكرة —</em></MenuItem>
                        {ideas.map(idea => {
                          const s = getStageInfo(idea.stage);
                          return (
                            <MenuItem key={idea.id} value={idea.id}>
                              {s.emoji} {idea.title} (الدرجة: {idea.iq_score})
                            </MenuItem>
                          );
                        })}
                      </Select>
                    </FormControl>
                  </CardContent>
                </Card>
              )}

              {/* Quick action buttons */}
              <Card sx={{ mb: 3 }}>
                <CardContent sx={{ p: 2 }}>
                  <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2 }}>إجراءات سريعة</Typography>
                  <Grid container spacing={2}>
                    {[
                      { icon: <Box sx={{ fontSize: '1.75rem', lineHeight: 1 }}>🎯</Box>, label: 'تركيز هذا الأسبوع', desc: 'مهامك ذات الأولوية ٢-٣ — تجاهل الضجيج', to: selectedIdeaId ? `/journey/90-day?idea=${selectedIdeaId}` : '/journey', color: '#D4A653', bg: '#0F3D24', goldBorder: true },
                      { icon: <FactCheckOutlinedIcon sx={{ fontSize: 28 }} />, label: 'التحقق', desc: 'سجّل المقابلات والتسجيلات والطلبات المسبقة', to: selectedIdeaId ? `/journey/validation?idea=${selectedIdeaId}` : '#', color: '#1B6B3E', bg: '#DEEBE2' },
                      { icon: <RocketLaunchIcon sx={{ fontSize: 28 }} />, label: 'العرض التمويلي', desc: 'ولّد عرضك الجاهز للمستثمرين', to: selectedIdeaId ? `/journey/pitch?idea=${selectedIdeaId}` : '#', color: '#D08A28', bg: '#FAF5E9' },
                      { icon: <CalendarMonthOutlinedIcon sx={{ fontSize: 28 }} />, label: 'رحلة الـ ٩٠ يوماً', desc: 'خطة تنفيذ أسبوعاً بأسبوع', to: selectedIdeaId ? `/journey/90-day?idea=${selectedIdeaId}` : '#', color: '#1B6B3E', bg: '#DEEBE2' },
                    ].map(a => (
                      <Grid size={{ xs: 12, sm: 3 }} key={a.label}>
                        <Tooltip title={!selectedIdeaId && a.to === '#' ? 'اختر فكرة أولاً' : ''} arrow>
                          <span style={{ display: 'block', height: '100%' }}>
                            <Card
                              component={Link}
                              to={a.to === '#' && !selectedIdeaId ? '#' : a.to}
                              sx={{
                                textDecoration: 'none', height: '100%',
                                opacity: a.to === '#' && !selectedIdeaId ? 0.5 : 1,
                                cursor: a.to === '#' && !selectedIdeaId ? 'not-allowed' : 'pointer',
                                borderLeft: (a as { goldBorder?: boolean }).goldBorder ? '4px solid #D4A653' : undefined,
                                '&:hover': a.to === '#' && !selectedIdeaId ? {} : { boxShadow: 3, transform: 'translateY(-2px)' },
                                transition: 'all 150ms ease',
                                pointerEvents: a.to === '#' && !selectedIdeaId ? 'none' : 'auto',
                              }}
                            >
                              <CardContent sx={{ p: 2, textAlign: 'center' }}>
                                <Box sx={{ width: 52, height: 52, borderRadius: 2, bgcolor: a.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: a.color, mx: 'auto', mb: 1 }}>
                                  {a.icon}
                                </Box>
                                <Typography variant="body2" fontWeight={700}>{a.label}</Typography>
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25 }}>{a.desc}</Typography>
                                <ArrowForwardIcon sx={{ fontSize: 14, color: 'text.disabled', mt: 0.5 }} />
                              </CardContent>
                            </Card>
                          </span>
                        </Tooltip>
                      </Grid>
                    ))}
                  </Grid>
                </CardContent>
              </Card>

              {/* Ideas list */}
              <Box>
                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
                  <Typography variant="h6" fontWeight={700}>أفكاري</Typography>
                  <Button component={Link} to="/journey" endIcon={<ArrowForwardIcon />} size="small">عرض الكل</Button>
                </Stack>

                {noIdeas ? (
                  <Card sx={{ textAlign: 'center', p: 4, border: '2px dashed', borderColor: 'divider', boxShadow: 'none' }}>
                    <LightbulbOutlinedIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
                    <Typography color="text.secondary" variant="body2" gutterBottom>لم تضف أي أفكار بعد.</Typography>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} justifyContent="center" sx={{ mt: 2 }}>
                      <Button component={Link} to="/journey?new=true" variant="contained" size="small" startIcon={<AddIcon />}>أضف فكرة جديدة</Button>
                      <Button component={Link} to="/ideas-library" variant="outlined" size="small">تصفّح المكتبة</Button>
                    </Stack>
                  </Card>
                ) : (
                  <Stack spacing={1.5}>
                    {ideas.slice(0, 3).map(idea => {
                      const s = getStageInfo(idea.stage);
                      return (
                        <Card
                          key={idea.id}
                          component={Link}
                          to={`/journey?idea=${idea.id}`}
                          onClick={() => setSelectedIdeaId(idea.id)}
                          sx={{ textDecoration: 'none', transition: 'all 150ms ease', '&:hover': { boxShadow: 3 }, border: selectedIdeaId === idea.id ? '2px solid' : '1px solid', borderColor: selectedIdeaId === idea.id ? 'primary.main' : 'divider' }}
                        >
                          <CardContent sx={{ p: '14px !important' }}>
                            <Stack direction="row" spacing={2} alignItems="center">
                              <Box sx={{ width: 44, height: 44, borderRadius: 2, bgcolor: 'grey.100', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', flexShrink: 0 }}>
                                {s.emoji}
                              </Box>
                              <Box sx={{ flex: 1, minWidth: 0 }}>
                                <Typography variant="body2" fontWeight={700} noWrap>{idea.title}</Typography>
                                <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
                                  <Chip label={idea.sector} size="small" sx={{ height: 18, fontSize: '0.65rem' }} />
                                  <Typography variant="caption" color="text.secondary">{s.label}</Typography>
                                </Stack>
                              </Box>
                              <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
                                <Typography variant="body2" fontWeight={800} color={idea.iq_score >= 80 ? 'success.main' : idea.iq_score >= 50 ? 'primary.main' : 'warning.main'}>
                                  {idea.iq_score}/100
                                </Typography>
                                <LinearProgress variant="determinate" value={idea.iq_score} sx={{ width: 60, height: 4, borderRadius: 2, mt: 0.5, bgcolor: 'grey.100', '& .MuiLinearProgress-bar': { bgcolor: idea.iq_score >= 80 ? '#2A8A52' : idea.iq_score >= 50 ? '#1B6B3E' : '#D4A653' } }} />
                              </Box>
                            </Stack>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </Stack>
                )}
              </Box>
            </Grid>

            {/* Right column */}
            <Grid size={{ xs: 12, md: 4 }}>
              {/* AI Coach shortcut */}
              <Card sx={{ mb: 2 }}>
                <CardActionArea component={Link} to="/ai-coach" sx={{ p: 2.5 }}>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Box sx={{ width: 48, height: 48, borderRadius: 2, bgcolor: '#F0F5F1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <SmartToyOutlinedIcon sx={{ color: 'secondary.main', fontSize: 26 }} />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                      <Typography variant="body2" fontWeight={700}>المدرّب الذكي</Typography>
                      <Typography variant="caption" color="text.secondary">اسألني أي شيء عن مشروعك</Typography>
                    </Box>
                    <ArrowForwardIcon sx={{ color: 'text.disabled', fontSize: 16 }} />
                  </Stack>
                </CardActionArea>
              </Card>

              {/* Recent activity */}
              <Card>
                <CardContent sx={{ p: 2 }}>
                  <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>النشاط الأخير</Typography>
                  {noIdeas || metrics.recentActivity.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">لا نشاط بعد. ابدأ رحلتك!</Typography>
                  ) : (
                    <Stack spacing={0}>
                      {metrics.recentActivity.map((item, i) => (
                        <Box key={i} sx={{ py: 1, borderBottom: i < metrics.recentActivity.length - 1 ? '1px solid' : 'none', borderColor: 'divider', '&:hover': { bgcolor: 'grey.50' }, borderRadius: 1, px: 0.5 }}>
                          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
                            <Typography variant="caption" sx={{ flex: 1 }}>
                              {item.icon} {item.text}
                            </Typography>
                            <Typography variant="caption" color="text.disabled" sx={{ flexShrink: 0 }}>{item.time}</Typography>
                          </Stack>
                        </Box>
                      ))}
                    </Stack>
                  )}
                </CardContent>
              </Card>

              {/* Upgrade CTA for free users */}
              {plan === 'free' && (
                <Card sx={{ mt: 2, background: 'linear-gradient(135deg, #1B6B3E 0%, #D08A28 100%)', border: 'none' }}>
                  <CardContent sx={{ p: 2.5 }}>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                      <RocketLaunchIcon sx={{ color: 'white', fontSize: 20 }} />
                      <Typography variant="body2" fontWeight={700} sx={{ color: 'white' }}>افتح الرحلة كاملة</Typography>
                    </Stack>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.85)', display: 'block', mb: 2 }}>
                      المخطط والتحقق ورحلة الـ ٩٠ يوماً والمدرّب الذكي والمجموعات — كلها في خطة برو.
                    </Typography>
                    <Button component={Link} to="/pricing" variant="contained" size="small" fullWidth sx={{ bgcolor: 'white', color: '#1B6B3E', fontWeight: 700, '&:hover': { bgcolor: 'grey.100' } }}>
                      رقِّ — $9/شهر ←
                    </Button>
                  </CardContent>
                </Card>
              )}
            </Grid>
          </Grid>
        </Box>
      </Box>

      {/* Milestone Dialog */}
      <Dialog open={!!milestoneDialog} onClose={() => setMilestoneDialog(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>
          {milestoneDialog === 'customer' ? '👤 إنجاز أول عميل!' : '💰 إنجاز أول إيراد!'}
        </DialogTitle>
        <DialogContent>
          <Typography color="text.secondary" sx={{ mb: 2, fontSize: '0.9375rem' }}>
            {milestoneDialog === 'customer'
              ? 'هذا إنجاز كبير! أخبرنا عن أول عميل لك. سيُحفظ في رحلتك ويرفع درجة بذرة الخاصة بك.'
              : 'حققت إيراداً — إنجاز ضخم! شارك التفاصيل بالأسفل.'}
          </Typography>
          {milestoneDialog === 'revenue' && (
            <TextField
              label="المبلغ المكتسب ($)"
              type="number"
              value={milestoneAmount}
              onChange={e => setMilestoneAmount(e.target.value)}
              fullWidth
              size="small"
              sx={{ mb: 2 }}
            />
          )}
          <TextField
            label="أخبرنا عنه (اختياري)"
            value={milestoneNote}
            onChange={e => setMilestoneNote(e.target.value)}
            fullWidth
            multiline
            rows={3}
            size="small"
            placeholder={milestoneDialog === 'customer' ? 'من هو أول عميل لك؟ وكيف وصلت إليه؟' : 'كيف كسبت أول دولار لك؟'}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setMilestoneDialog(null)} color="inherit">إلغاء</Button>
          <Button variant="contained" onClick={handleMilestoneSave} disabled={savingMilestone}>
            {savingMilestone ? 'جارٍ الحفظ…' : 'احتفل! 🎉'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={!!celebrationToast} autoHideDuration={5000} onClose={() => setCelebrationToast(null)} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert severity="success" variant="filled" onClose={() => setCelebrationToast(null)} sx={{ fontWeight: 700, fontSize: '1rem' }}>
          {celebrationToast}
        </Alert>
      </Snackbar>
    </Box>
  );
}
