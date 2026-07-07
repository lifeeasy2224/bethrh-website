import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Divider from '@mui/material/Divider';
import Alert from '@mui/material/Alert';
import Skeleton from '@mui/material/Skeleton';
import LinearProgress from '@mui/material/LinearProgress';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import TimerOutlinedIcon from '@mui/icons-material/TimerOutlined';
import PeopleOutlinedIcon from '@mui/icons-material/PeopleOutlined';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';
import LightbulbOutlinedIcon from '@mui/icons-material/LightbulbOutlined';
import { Link } from 'react-router-dom';
import NavBar from '../components/NavBar';
import Footer from '../components/Footer';
import { supabase, type LibraryIdea } from '../supabase';
import { useAuth } from '../contexts/AuthContext';

const SECTOR_EMOJI: Record<string, string> = {
  'Food & Agriculture': '🌾',
  'B2B SaaS': '💼',
  'E-commerce': '🛒',
  Fintech: '💰',
  EdTech: '📚',
  HealthTech: '🏥',
  Logistics: '🚚',
  Services: '🔧',
};

const DIFFICULTY_META: Record<string, { label: string; color: string }> = {
  easy: { label: 'مناسبة للمبتدئين', color: '#2A8A52' },
  medium: { label: 'متوسطة', color: '#D4A653' },
  hard: { label: 'متقدمة', color: '#C0392B' },
};

// Arabic display for sector keys (keys stay English — match library_ideas.sector)
const SECTOR_AR: Record<string, string> = {
  'Food & Agriculture': 'الغذاء والزراعة',
  'B2B SaaS': 'البرمجيات كخدمة',
  'E-commerce': 'التجارة الإلكترونية',
  Fintech: 'التقنية المالية',
  EdTech: 'تقنية التعليم',
  HealthTech: 'التقنية الصحية',
  Logistics: 'اللوجستيات',
  Services: 'الخدمات',
  Sustainability: 'الاستدامة',
};

function StatCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub?: string }) {
  return (
    <Card variant="outlined" sx={{ height: '100%' }}>
      <CardContent sx={{ p: 2.5 }}>
        <Box sx={{ color: 'primary.main', mb: 1 }}>{icon}</Box>
        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {label}
        </Typography>
        <Typography variant="h6" sx={{ fontWeight: 700, mt: 0.25 }}>
          {value}
        </Typography>
        {sub && (
          <Typography variant="caption" color="text.secondary">
            {sub}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}

function Section({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <Box sx={{ mb: 4 }}>
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
        {icon && <Box sx={{ color: 'primary.main' }}>{icon}</Box>}
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          {title}
        </Typography>
      </Stack>
      <Divider sx={{ mb: 2 }} />
      {children}
    </Box>
  );
}

function fmt(n: number) {
  if (n >= 1000) return `$${(n / 1000).toFixed(0)}K`;
  return `$${n}`;
}

export default function IdeasLibraryDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  const [idea, setIdea] = useState<LibraryIdea | null>(null);
  const [hasGrabbed, setHasGrabbed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;
    void loadIdea();
  }, [slug, user?.id]);

  async function loadIdea() {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('library_ideas')
        .select('*')
        .eq('slug', slug)
        .eq('is_published', true)
        .maybeSingle();

      if (fetchError) throw fetchError;
      if (!data) { setError('الفكرة غير موجودة.'); return; }
      setIdea(data);

      if (user?.id) {
        void supabase
          .from('library_idea_views')
          .insert({ library_idea_id: data.id, user_id: user.id });

        const { data: grab } = await supabase
          .from('library_grabs')
          .select('id')
          .eq('library_idea_id', data.id)
          .eq('user_id', user.id)
          .maybeSingle();
        setHasGrabbed(!!grab);
      }
    } catch {
      setError('تعذّر تحميل الفكرة. حاول مرة أخرى.');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <NavBar />
        <Container maxWidth="lg" sx={{ pt: 14, pb: 8 }}>
          <Skeleton variant="text" width={200} sx={{ mb: 3 }} />
          <Skeleton variant="rounded" height={200} sx={{ mb: 3 }} />
          <Grid container spacing={3}>
            {Array.from({ length: 4 }).map((_, i) => (
              <Grid size={{ xs: 6, md: 3 }} key={i}>
                <Skeleton variant="rounded" height={100} />
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>
    );
  }

  if (error || !idea) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <NavBar />
        <Container maxWidth="md" sx={{ pt: 14, pb: 8, textAlign: 'center' }}>
          <Alert severity="error" sx={{ mb: 3 }}>{error ?? 'الفكرة غير موجودة.'}</Alert>
          <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/ideas-library')}>
            العودة للمكتبة
          </Button>
        </Container>
      </Box>
    );
  }

  const remaining = idea.spots_total - idea.spots_taken;
  const spotsColor = remaining === 0 ? 'error.main' : remaining === 1 ? 'warning.main' : 'success.main';
  const canGrab = !!user && profile?.plan !== 'free' && remaining > 0 && !hasGrabbed;
  const emoji = idea.emoji || SECTOR_EMOJI[idea.sector] || '💡';
  const diffMeta = DIFFICULTY_META[idea.difficulty];

  // Idea details are a paid feature: the library list is free to browse, but
  // opening a full idea requires an active paid plan.
  const isPaid = !!profile && profile.plan !== 'free';
  if (!isPaid) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <NavBar />
        <Container maxWidth="sm" sx={{ pt: 14, pb: 8, textAlign: 'center', flex: 1 }}>
          <Typography sx={{ fontSize: 56, mb: 1 }}>{emoji}</Typography>
          <Typography variant="h5" fontWeight={800} sx={{ mb: 0.5 }}>{idea.title}</Typography>
          <Chip label={SECTOR_AR[idea.sector] ?? idea.sector} size="small" sx={{ mb: 3 }} />
          <Card variant="outlined" sx={{ borderRadius: 3 }}>
            <CardContent sx={{ p: 4 }}>
              <LockOutlinedIcon sx={{ fontSize: 40, color: 'primary.main', mb: 1.5 }} />
              <Typography variant="h6" fontWeight={700} sx={{ mb: 1 }}>
                تفاصيل الفكرة الكاملة ميزة مدفوعة
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                تصفّح المكتبة مجاني. لفتح التفاصيل الكاملة — المشكلة والحل والسوق والبيانات المالية — ولحجز هذه الفكرة، رقِّ إلى خطة مدفوعة.
              </Typography>
              <Button variant="contained" size="large" component={Link} to="/pricing" sx={{ mb: 1.5 }}>
                رقِّ لعرض التفاصيل الكاملة
              </Button>
              <Box>
                <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/ideas-library')} size="small">
                  العودة للمكتبة
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Container>
        <Footer />
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <NavBar />

      {/* Hero */}
      <Box
        sx={{
          pt: { xs: 10, md: 12 },
          pb: 6,
          background: 'linear-gradient(160deg, #F0F5F1 0%, #F0F5F1 100%)',
          borderBottom: '1px solid',
          borderColor: 'divider',
        }}
      >
        <Container maxWidth="lg">
          <Breadcrumbs sx={{ mb: 2 }}>
            <Link to="/ideas-library" style={{ textDecoration: 'none', color: 'inherit' }}>
              <Typography variant="body2" color="text.secondary" sx={{ '&:hover': { color: 'primary.main' } }}>
                مكتبة الأفكار
              </Typography>
            </Link>
            <Typography variant="body2" color="text.primary">
              {idea.title}
            </Typography>
          </Breadcrumbs>

          <Grid container spacing={4} alignItems="flex-start">
            <Grid size={{ xs: 12, md: 8 }}>
              <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
                <Box
                  sx={{
                    width: 64,
                    height: 64,
                    borderRadius: 3,
                    bgcolor: 'white',
                    border: '1px solid',
                    borderColor: 'divider',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '2rem',
                    flexShrink: 0,
                  }}
                >
                  {emoji}
                </Box>
                <Box>
                  <Stack direction="row" spacing={1} sx={{ mb: 0.5, flexWrap: 'wrap', gap: 0.5 }}>
                    <Chip label={`${SECTOR_EMOJI[idea.sector] ?? ''} ${SECTOR_AR[idea.sector] ?? idea.sector}`} size="small" variant="outlined" />
                    <Chip
                      label={diffMeta.label}
                      size="small"
                      sx={{ bgcolor: diffMeta.color + '22', color: diffMeta.color, fontWeight: 700 }}
                    />
                    {idea.is_featured && <Chip label="مميزة" size="small" color="primary" />}
                  </Stack>
                  <Typography variant="h3" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
                    {idea.title}
                  </Typography>
                </Box>
              </Stack>
              <Typography variant="body1" color="text.secondary" sx={{ fontSize: '1.05rem', lineHeight: 1.7 }}>
                {idea.tagline}
              </Typography>
            </Grid>

            {/* CTA sidebar */}
            <Grid size={{ xs: 12, md: 4 }}>
              <Card sx={{ border: '1px solid', borderColor: 'divider' }}>
                <CardContent sx={{ p: 3 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
                    <Typography variant="subtitle2" color="text.secondary">
                      التوفّر
                    </Typography>
                    <Typography variant="subtitle2" sx={{ color: spotsColor, fontWeight: 700 }}>
                      {remaining === 0 ? 'مكتملة' : `متبقٍ ${remaining}/${idea.spots_total} مقاعد`}
                    </Typography>
                  </Stack>
                  <LinearProgress
                    variant="determinate"
                    value={(idea.spots_taken / idea.spots_total) * 100}
                    sx={{
                      mb: 2.5,
                      height: 6,
                      borderRadius: 3,
                      bgcolor: '#F7F3EC',
                      '& .MuiLinearProgress-bar': {
                        bgcolor: remaining === 0 ? 'error.main' : remaining === 1 ? 'warning.main' : 'success.main',
                      },
                    }}
                  />

                  {!user ? (
                    <Stack spacing={1.5}>
                      <Button
                        variant="contained"
                        fullWidth
                        size="large"
                        onClick={() => navigate('/signup')}
                      >
                        سجّل لتحجز هذه الفكرة
                      </Button>
                      <Button
                        variant="outlined"
                        fullWidth
                        size="small"
                        onClick={() => navigate('/login')}
                      >
                        لديك حساب بالفعل؟
                      </Button>
                    </Stack>
                  ) : profile?.role === 'investor' ? (
                    <Stack spacing={1.5}>
                      <Alert severity="info" sx={{ py: 1 }}>
                        <Typography variant="caption" fontWeight={600}>
                          هذه مكتبة أفكار الروّاد. تصفّح سوق المستثمرين للتواصل مع المؤسسين.
                        </Typography>
                      </Alert>
                      <Button
                        variant="contained"
                        fullWidth
                        onClick={() => navigate('/marketplace')}
                      >
                        اذهب إلى سوق المستثمرين
                      </Button>
                    </Stack>
                  ) : profile?.plan === 'free' ? (
                    <Stack spacing={1.5}>
                      <Alert severity="info" sx={{ py: 1 }}>
                        <Typography variant="caption" fontWeight={600}>
                          رقِّ إلى برو لتحجز الأفكار
                        </Typography>
                      </Alert>
                      <Button
                        variant="contained"
                        fullWidth
                        startIcon={<LockOutlinedIcon />}
                        onClick={() => navigate('/pricing')}
                      >
                        رقِّ إلى برو
                      </Button>
                    </Stack>
                  ) : remaining === 0 ? (
                    <Button variant="outlined" fullWidth disabled startIcon={<LockOutlinedIcon />}>
                      اكتملت جميع المقاعد
                    </Button>
                  ) : hasGrabbed ? (
                    <Stack spacing={1.5}>
                      <Alert severity="success" icon={<CheckCircleOutlineIcon />} sx={{ py: 1 }}>
                        <Typography variant="caption" fontWeight={600}>
                          حجزت هذه الفكرة بالفعل
                        </Typography>
                      </Alert>
                      <Button variant="outlined" fullWidth onClick={() => navigate('/dashboard')}>
                        اذهب إلى لوحة التحكم
                      </Button>
                    </Stack>
                  ) : (
                    <Button
                      variant="contained"
                      fullWidth
                      size="large"
                      disabled={!canGrab}
                      onClick={() => navigate(`/ideas-library/${idea.slug}/customize`)}
                    >
                      احجز الفكرة وخصّصها ←
                    </Button>
                  )}

                  <Divider sx={{ my: 2 }} />

                  <Stack spacing={0.75}>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="caption" color="text.secondary">مدة الإطلاق</Typography>
                      <Typography variant="caption" fontWeight={700}>{idea.time_to_launch_weeks}–{idea.time_to_launch_weeks + 4} أسبوعاً</Typography>
                    </Stack>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="caption" color="text.secondary">تكلفة البدء</Typography>
                      <Typography variant="caption" fontWeight={700}>{fmt(idea.initial_investment_min)}–{fmt(idea.initial_investment_max)}</Typography>
                    </Stack>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="caption" color="text.secondary">نقطة التعادل</Typography>
                      <Typography variant="caption" fontWeight={700}>{idea.break_even_months} شهراً</Typography>
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Body */}
      <Box sx={{ py: 6, flex: 1 }}>
        <Container maxWidth="lg">
          <Grid container spacing={4}>
            <Grid size={{ xs: 12, md: 8 }}>
              {/* Financials */}
              <Section title="لمحة مالية" icon={<AttachMoneyIcon />}>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <StatCard
                      icon={<TrendingUpIcon />}
                      label="العائد المتوقع"
                      value={`${idea.est_roi_min}–${idea.est_roi_max}%`}
                      sub="السنة ١–٢"
                    />
                  </Grid>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <StatCard
                      icon={<AttachMoneyIcon />}
                      label="تكلفة البدء"
                      value={`${fmt(idea.initial_investment_min)}–${fmt(idea.initial_investment_max)}`}
                      sub="الاستثمار الأولي"
                    />
                  </Grid>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <StatCard
                      icon={<TimerOutlinedIcon />}
                      label="نقطة التعادل"
                      value={`${idea.break_even_months} شهر`}
                      sub="تقديري"
                    />
                  </Grid>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <StatCard
                      icon={<AttachMoneyIcon />}
                      label="الإيراد الشهري (سنة ١)"
                      value={`${fmt(idea.monthly_revenue_y1_min)}–${fmt(idea.monthly_revenue_y1_max)}`}
                      sub="عند الاستقرار"
                    />
                  </Grid>
                </Grid>
              </Section>

              {/* Problem */}
              <Section title="المشكلة" icon={<WarningAmberIcon />}>
                <Typography variant="body1" sx={{ lineHeight: 1.8, color: 'text.secondary' }}>
                  {idea.problem}
                </Typography>
              </Section>

              {/* Solution */}
              <Section title="الحل" icon={<LightbulbOutlinedIcon />}>
                <Typography variant="body1" sx={{ lineHeight: 1.8, color: 'text.secondary' }}>
                  {idea.solution}
                </Typography>
              </Section>

              {/* Target Market */}
              <Section title="السوق المستهدف" icon={<PeopleOutlinedIcon />}>
                <Typography variant="body1" sx={{ lineHeight: 1.8, color: 'text.secondary' }}>
                  {idea.target_market}
                </Typography>
              </Section>

              {/* Revenue Model */}
              <Section title="نموذج الإيرادات" icon={<AttachMoneyIcon />}>
                <Typography variant="body1" sx={{ lineHeight: 1.8, color: 'text.secondary' }}>
                  {idea.revenue_model}
                </Typography>
              </Section>

              {/* Why Now */}
              <Section title="لماذا الآن؟" icon={<TrendingUpIcon />}>
                <Typography variant="body1" sx={{ lineHeight: 1.8, color: 'text.secondary' }}>
                  {idea.why_now}
                </Typography>
              </Section>

              {/* Biggest Challenge */}
              <Section title="أكبر تحدٍّ" icon={<WarningAmberIcon />}>
                <Alert severity="warning" sx={{ mb: 0 }}>
                  <Typography variant="body2" sx={{ lineHeight: 1.7 }}>
                    {idea.biggest_challenge}
                  </Typography>
                </Alert>
              </Section>

              {/* Best Markets */}
              <Section title="أفضل الأسواق للإطلاق" icon={<StorefrontOutlinedIcon />}>
                <Typography variant="body1" sx={{ lineHeight: 1.8, color: 'text.secondary' }}>
                  {idea.best_markets}
                </Typography>
              </Section>

              {/* Tags */}
              {idea.tags.length > 0 && (
                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 1.5 }}>الوسوم</Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ gap: 0.75 }}>
                    {idea.tags.map((tag) => (
                      <Chip key={tag} label={tag} size="small" variant="outlined" />
                    ))}
                  </Stack>
                </Box>
              )}
            </Grid>

            {/* Sticky sidebar summary */}
            <Grid size={{ xs: 12, md: 4 }}>
              <Box sx={{ position: { md: 'sticky' }, top: { md: 24 } }}>
                <Card sx={{ border: '1px solid', borderColor: 'divider', mb: 2 }}>
                  <CardContent sx={{ p: 2.5 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1.5 }}>إحصاءات سريعة</Typography>
                    <Stack spacing={1.5}>
                      {[
                        { label: 'القطاع', value: `${SECTOR_EMOJI[idea.sector] ?? ''} ${SECTOR_AR[idea.sector] ?? idea.sector}` },
                        { label: 'الصعوبة', value: diffMeta.label },
                        { label: 'مدة الإطلاق', value: `${idea.time_to_launch_weeks} أسبوعاً` },
                        { label: 'حد الروّاد', value: `${idea.spots_total} إجمالاً` },
                        { label: 'المقاعد المتبقية', value: `${remaining}` },
                      ].map(({ label, value }) => (
                        <Stack key={label} direction="row" justifyContent="space-between">
                          <Typography variant="caption" color="text.secondary">{label}</Typography>
                          <Typography variant="caption" fontWeight={700}>{value}</Typography>
                        </Stack>
                      ))}
                    </Stack>
                  </CardContent>
                </Card>

                {!user && (
                  <Card sx={{ border: '1px solid', borderColor: 'primary.light', bgcolor: 'primary.50' }}>
                    <CardContent sx={{ p: 2.5 }}>
                      <Typography variant="subtitle2" sx={{ mb: 1 }}>
                        تريد حجز هذه الفكرة؟
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        أنشئ حساباً مجانياً لتستكشف أكثر، ثم رقِّ إلى برو لتحجز وتخصّص.
                      </Typography>
                      <Button variant="contained" fullWidth onClick={() => navigate('/signup')}>
                        ابدأ مجاناً
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      <Footer />
    </Box>
  );
}
