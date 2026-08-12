import { useState, useEffect, useRef } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import IconButton from '@mui/material/IconButton';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import FormControl from '@mui/material/FormControl';
import Chip from '@mui/material/Chip';
import LinearProgress from '@mui/material/LinearProgress';
import CircularProgress from '@mui/material/CircularProgress';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import Divider from '@mui/material/Divider';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import MenuIcon from '@mui/icons-material/Menu';
import AddIcon from '@mui/icons-material/Add';
import NotificationsOutlinedIcon from '@mui/icons-material/NotificationsOutlined';
import LightbulbOutlinedIcon from '@mui/icons-material/LightbulbOutlined';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useIdea } from '../../contexts/IdeaContext';
import FounderSidebar from '../../components/FounderSidebar';
import { supabase, getStageInfo } from '../../supabase';
import { recomputeIqScore, type ScoreBreakdown } from '../../lib/iqScore';
import { assessIdea } from '../../lib/assessIdea';
import JourneyOverview from './overview/JourneyOverview';
import { buildJourney } from './overview/journeyModel';

const ZERO_BREAKDOWN: ScoreBreakdown = { validation: 0, model: 0, financials: 0, journey: 0, coach: 0, total: 0 };

async function fireConfetti() {
  const confetti = (await import('canvas-confetti')).default;
  confetti({ particleCount: 150, spread: 70, origin: { y: 0.6 }, colors: ['#D4A653', '#0F3D24', '#1B6B3E', '#ffffff'] });
  setTimeout(() => confetti({ particleCount: 80, spread: 50, origin: { y: 0.5 }, colors: ['#D4A653', '#D4A653'] }), 400);
}

// Canvas block keys used to count "filled" blocks for the score/model progress.
const CANVAS_KEYS = ['key_partners', 'key_activities', 'value_proposition', 'customer_relationships', 'customer_segments', 'key_resources', 'channels', 'cost_structure', 'revenue_streams'];

interface DashboardMetrics {
  iqScore: number;
  breakdown: ScoreBreakdown;
  validationCount: number;
  canvasBlocksFilled: number;
  journeyTasksDone: number;
  swotExists: boolean;
  pitchExists: boolean;
  recentActivity: Array<{ icon: string; text: string; time: string }>;
}

const EMPTY_METRICS: DashboardMetrics = {
  iqScore: 0, breakdown: ZERO_BREAKDOWN, validationCount: 0, canvasBlocksFilled: 0,
  journeyTasksDone: 0, swotExists: false, pitchExists: false, recentActivity: [],
};

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
  const [metrics, setMetrics] = useState<DashboardMetrics>(EMPTY_METRICS);

  const firstName = profile?.full_name?.split(' ')[0] ?? 'يا صديقي';
  const plan = profile?.plan ?? 'free';
  const stage = selectedIdea ? getStageInfo(selectedIdea.stage) : null;
  const noIdeas = !loading && ideas.length === 0;

  useEffect(() => {
    if (!selectedIdeaId) {
      setMetrics(EMPTY_METRICS);
      return;
    }

    let cancelled = false;

    async function loadMetrics() {
      // Counts that drive the stop cards come from real rows, plus swot/pitch
      // existence (new — needed for the SWOT/Pitch stop states the old
      // dashboard never rendered).
      const [valRes, canvasRes, tasksRes, swotRes, pitchRes] = await Promise.all([
        supabase.from('validation_entries').select('id, type, created_at', { count: 'exact' }).eq('user_idea_id', selectedIdeaId!),
        supabase.from('canvas_data').select('*').eq('user_idea_id', selectedIdeaId!).maybeSingle(),
        supabase.from('journey_tasks').select('id, task_key, week_number, completed_at', { count: 'exact' }).eq('user_idea_id', selectedIdeaId!).eq('is_completed', true),
        supabase.from('swot_analyses').select('id', { count: 'exact', head: true }).eq('user_idea_id', selectedIdeaId!),
        supabase.from('pitch_data').select('id', { count: 'exact', head: true }).eq('user_idea_id', selectedIdeaId!),
      ]);
      if (cancelled) return;

      const validationCount = valRes.count ?? 0;
      const canvasBlocksFilled = canvasRes.data
        ? CANVAS_KEYS.filter(k => (canvasRes.data as Record<string, string>)[k]?.length >= 20).length
        : 0;
      const journeyTasksDone = tasksRes.count ?? 0;
      const swotExists = (swotRes.count ?? 0) > 0;
      const pitchExists = (pitchRes.count ?? 0) > 0;

      // Recent activity from validation + tasks (last 4) — unchanged from the
      // previous dashboard, still feeds the kept "Recent activity" card.
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

      // ── Phase 1 (preserved verbatim): the real evidence-weighted score —
      // single source of truth in recomputeIqScore, which also persists
      // user_ideas.iq_score / iq_breakdown. ──
      const scoreRes = await recomputeIqScore(selectedIdeaId!);
      if (cancelled) return;

      setMetrics({
        iqScore: scoreRes?.score ?? 0,
        breakdown: scoreRes?.breakdown ?? ZERO_BREAKDOWN,
        validationCount, canvasBlocksFilled, journeyTasksDone, swotExists, pitchExists,
        recentActivity: recentActivity.slice(0, 4),
      });

      // ── Phase 2 (preserved verbatim): bounded AI-assessment refresh, at
      // most one LLM call per load, only when the assessment is missing or
      // >14 days stale. Folds the fresh score in when it lands. ──
      const { data: meta } = await supabase.from('user_ideas').select('coach_assessment_at').eq('id', selectedIdeaId!).maybeSingle();
      if (cancelled) return;
      const assessedAt = meta?.coach_assessment_at ? new Date(meta.coach_assessment_at as string).getTime() : 0;
      if (Date.now() - assessedAt > 14 * 24 * 60 * 60 * 1000) {
        void (async () => {
          await assessIdea(selectedIdeaId!);
          const refreshed = await recomputeIqScore(selectedIdeaId!);
          if (!cancelled && refreshed) {
            setMetrics(m => ({ ...m, iqScore: refreshed.score, breakdown: refreshed.breakdown }));
          }
        })();
      }
    }

    void loadMetrics();
    return () => { cancelled = true; };
  }, [selectedIdeaId, profile]);

  // Auto-confetti when stage advances.
  useEffect(() => {
    if (!selectedIdea) return;
    const prev = prevStageRef.current;
    prevStageRef.current = selectedIdea.stage;
    if (prev && prev !== selectedIdea.stage) {
      void fireConfetti();
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
    void fireConfetti();
    setCelebrationToast(isRevenue ? '🎉 مبروك أول إيراد لك!' : '🎉 أول عميل لك — رائع!');
  }

  // Milestone logging is offered once a founder has traction (growing/ready) —
  // replaces the old dashboard's "First Dollar" path-widget buttons, which
  // were dropped along with that widget.
  const canLogMilestone = !!selectedIdea && (selectedIdea.stage === 'growing' || selectedIdea.stage === 'ready');

  // Active-idea switcher — lives next to "My Ideas" inside the overview, not
  // in the header, to keep the top of the page uncluttered. Only shown with
  // 2+ ideas.
  const ideaSwitcher = ideas.length > 1 ? (
    <FormControl size="small" sx={{ minWidth: { xs: '100%', sm: 260 } }}>
      <Select
        value={selectedIdeaId ?? ''}
        onChange={e => setSelectedIdeaId(e.target.value || null)}
        sx={{
          color: '#FFFFFF', bgcolor: '#1B6B3E', fontSize: 13, fontWeight: 600,
          '& .MuiOutlinedInput-notchedOutline': { borderColor: '#2C5940' },
          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#3D7A54' },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#D4A653' },
          '& .MuiSvgIcon-root': { color: '#8DA697' },
        }}
      >
        {ideas.map(idea => {
          const s = getStageInfo(idea.stage);
          return <MenuItem key={idea.id} value={idea.id}>{s.emoji} {idea.title} (الدرجة: {idea.iq_score})</MenuItem>;
        })}
      </Select>
    </FormControl>
  ) : null;

  const journey = buildJourney({
    hasIdea: !!selectedIdea,
    ideaName: selectedIdea?.title ?? 'فكرتك',
    founderName: profile?.full_name ?? null,
    stageLabel: stage?.label ?? 'Seed',
    ideaCreatedAt: selectedIdea?.created_at ?? null,
    ideasCount: ideas.length,
    iqScore: metrics.iqScore,
    scoreBreakdown: metrics.breakdown,
    validationCount: metrics.validationCount,
    canvasBlocksFilled: metrics.canvasBlocksFilled,
    journeyTasksDone: metrics.journeyTasksDone,
    swotExists: metrics.swotExists,
    pitchExists: metrics.pitchExists,
  });

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

        {/* Full-width content: the journey map goes full-bleed across the whole
            content area (no maxWidth cap). The header and the cards below carry
            their own inset padding, matched to the map's own padding so they
            line up with its content edge. */}
        <Box sx={{ flex: 1, width: '100%', pb: { xs: 2, sm: 3 } }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ sm: 'center' }} justifyContent="space-between" spacing={2} sx={{ px: { xs: 2.5, sm: 5, md: 7 }, pt: { xs: 2, sm: 3 }, pb: { xs: 2, sm: 2.5 } }}>
            <Box>
              <Typography variant="h4" fontWeight={800}>أهلاً بعودتك يا {firstName}!</Typography>
              <Typography color="text.secondary" sx={{ mt: 0.5 }}>رحلتك — محطة تلو الأخرى.</Typography>
            </Box>
            <Button variant="contained" startIcon={<AddIcon />} component={Link} to="/journey?new=true" sx={{ whiteSpace: 'nowrap', flexShrink: 0, alignSelf: { xs: 'flex-start', sm: 'auto' } }}>
              أضف فكرة جديدة
            </Button>
          </Stack>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}><CircularProgress /></Box>
          ) : noIdeas ? (
            <Box sx={{ maxWidth: 640, mx: 'auto', px: { xs: 2, sm: 3 }, pt: { xs: 2, sm: 4 } }}>
              <Card sx={{ textAlign: 'center', p: { xs: 4, sm: 6 }, border: '2px dashed', borderColor: 'divider', boxShadow: 'none' }}>
                <LightbulbOutlinedIcon sx={{ fontSize: 44, color: 'text.disabled', mb: 1.5 }} />
                <Typography variant="h5" fontWeight={800} gutterBottom>أهلاً بك في بذرة! 🎉</Typography>
                <Typography color="text.secondary" sx={{ mb: 3 }}>أضف فكرتك الأولى لتبدأ رحلتك الريادية.</Typography>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
                  <Button variant="contained" startIcon={<AddIcon />} component={Link} to="/journey?new=true">أضف فكرتي</Button>
                  <Button variant="outlined" component={Link} to="/ideas-library">تصفّح مكتبة الأفكار</Button>
                </Stack>
              </Card>
            </Box>
          ) : !selectedIdea ? (
            <Box sx={{ maxWidth: 640, mx: 'auto', px: { xs: 2, sm: 3 }, pt: { xs: 2, sm: 4 } }}>
              <Card sx={{ textAlign: 'center', p: 5, boxShadow: 'none', border: '1px solid', borderColor: 'divider' }}>
                <Typography color="text.secondary">اختر فكرة بالأعلى لترى رحلتك.</Typography>
              </Card>
            </Box>
          ) : (
            <>
              <JourneyOverview
                journey={journey}
                ideaSwitcher={ideaSwitcher}
                onOpenRoute={route => navigate(route)}
                onAskCoach={() => navigate('/ai-coach')}
              />

              {canLogMilestone && (
                <Box sx={{ px: { xs: 2.5, sm: 5, md: 7 } }}>
                  <Card sx={{ mt: 2, p: 2, boxShadow: 'none', border: '1px solid', borderColor: 'divider' }}>
                    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ sm: 'center' }} justifyContent="space-between">
                      <Box>
                        <Typography variant="subtitle2" fontWeight={700}>حققت إنجازاً؟</Typography>
                        <Typography variant="caption" color="text.secondary">سجّل إنجازاً حقيقياً — يرفع مرحلتك.</Typography>
                      </Box>
                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                        <Button size="small" variant="outlined" onClick={() => setMilestoneDialog('customer')}>👤 أول عميل</Button>
                        <Button size="small" variant="outlined" onClick={() => setMilestoneDialog('revenue')}>💰 أول دولار</Button>
                      </Stack>
                    </Stack>
                  </Card>
                </Box>
              )}

              {/* Condensed ideas-list (kept, Decision 3) */}
              <Box sx={{ px: { xs: 2.5, sm: 5, md: 7 }, mt: 3 }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
                  <Typography variant="h6" fontWeight={700}>أفكاري</Typography>
                  <Button component={Link} to="/journey" endIcon={<ArrowBackIcon />} size="small">عرض الكل</Button>
                </Stack>
                <Stack spacing={1.5} sx={{ maxWidth: 720 }}>
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
              </Box>

              {/* Recent-activity feed (kept, Decision 3) */}
              <Box sx={{ px: { xs: 2.5, sm: 5, md: 7 }, mt: 3, maxWidth: 720 }}>
                <Card>
                  <CardContent sx={{ p: 2 }}>
                    <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>النشاط الأخير</Typography>
                    {metrics.recentActivity.length === 0 ? (
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
              </Box>

              {/* Free-plan upgrade nudge — not addressed by the locked decisions;
                  kept as the dashboard's only upgrade nudge since Decision 1
                  removed the in-map "all stops locked" upsell. */}
              {plan === 'free' && (
                <Box sx={{ px: { xs: 2.5, sm: 5, md: 7 }, mt: 3, maxWidth: 720 }}>
                  <Card sx={{ background: 'linear-gradient(135deg, #1B6B3E 0%, #D08A28 100%)', border: 'none' }}>
                    <CardContent sx={{ p: 2.5 }}>
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                        <RocketLaunchIcon sx={{ color: 'white', fontSize: 20 }} />
                        <Typography variant="body2" fontWeight={700} sx={{ color: 'white' }}>افتح الرحلة كاملة</Typography>
                      </Stack>
                      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.85)', display: 'block', mb: 2 }}>
                        المخطط والتحقق ورحلة الـ٩٠ يوماً والمدرّب الذكي والمجموعات — كلها في خطة برو.
                      </Typography>
                      <Button component={Link} to="/pricing" variant="contained" size="small" sx={{ bgcolor: 'white', color: '#1B6B3E', fontWeight: 700, '&:hover': { bgcolor: 'grey.100' } }}>
                        رقِّ — $9/شهر ←
                      </Button>
                    </CardContent>
                  </Card>
                </Box>
              )}
            </>
          )}
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
