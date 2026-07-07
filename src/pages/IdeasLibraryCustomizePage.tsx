import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Grid from '@mui/material/Grid';
import Alert from '@mui/material/Alert';
import Divider from '@mui/material/Divider';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import CircularProgress from '@mui/material/CircularProgress';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { Link } from 'react-router-dom';
import NavBar from '../components/NavBar';
import Footer from '../components/Footer';
import { supabase, type LibraryIdea } from '../supabase';
import { useAuth } from '../contexts/AuthContext';

const STEPS = ['راجع الفكرة', 'سمِّ مشروعك', 'أكّد الحجز'];

export default function IdeasLibraryCustomizePage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  const [idea, setIdea] = useState<LibraryIdea | null>(null);
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [businessName, setBusinessName] = useState('');
  const [city, setCity] = useState('');
  const [notes, setNotes] = useState('');

  const [grabCount, setGrabCount] = useState(0);

  useEffect(() => {
    if (!slug) return;
    void loadIdea();
  }, [slug]);

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
      if (!data) { setError('IDEA_NOT_FOUND'); return; }
      setIdea(data);

      if (user?.id) {
        const { count } = await supabase
          .from('library_grabs')
          .select('id', { count: 'exact' })
          .eq('user_id', user.id);
        setGrabCount(count ?? 0);

        const { data: existing } = await supabase
          .from('library_grabs')
          .select('id')
          .eq('library_idea_id', data.id)
          .eq('user_id', user.id)
          .maybeSingle();

        if (existing) {
          setError('حجزت هذه الفكرة بالفعل.');
        }
      }
    } catch {
      setError('تعذّر تحميل الفكرة.');
    } finally {
      setLoading(false);
    }
  }

  async function handleGrab() {
    if (!user?.id || !idea) return;
    const userId = user.id;

    try {
      setSubmitting(true);
      setError(null);

      // Re-check availability with a fresh read
      const { data: fresh } = await supabase
        .from('library_ideas')
        .select('spots_taken, spots_total')
        .eq('id', idea.id)
        .maybeSingle();

      if (!fresh || fresh.spots_taken >= fresh.spots_total) {
        setError('عذراً، اكتملت المقاعد للتو. اختر فكرة أخرى.');
        return;
      }

      // Create the user_idea from library idea
      const { data: newIdea, error: ideaError } = await supabase
        .from('user_ideas')
        .insert({
          user_id: userId,
          library_idea_id: idea.id,
          title: businessName || idea.title,
          sector: idea.sector,
          problem: idea.problem,
          solution: idea.solution,
          target_customer: idea.target_market,
          business_name: businessName || '',
          city: city || '',
          stage: 'seed',
          iq_score: 10,
          differentiator: '',
          advantage: '',
          in_marketplace: false,
        })
        .select('id')
        .maybeSingle();

      if (ideaError) throw ideaError;

      // Record the grab
      const { error: grabError } = await supabase
        .from('library_grabs')
        .insert({
          library_idea_id: idea.id,
          user_id: userId,
          user_idea_id: newIdea?.id ?? null,
          status: 'grabbed',
        });

      if (grabError) throw grabError;

      setSuccess(true);
    } catch {
      setError('حدث خطأ ما. حاول مرة أخرى.');
    } finally {
      setSubmitting(false);
    }
  }

  // Guard: not logged in
  if (!user) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <NavBar />
        <Container maxWidth="sm" sx={{ pt: 16, pb: 8, textAlign: 'center' }}>
          <LockOutlinedIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h5" sx={{ mb: 1, fontWeight: 700 }}>تسجيل الدخول مطلوب</Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            أنشئ حساباً أو سجّل الدخول لتحجز الأفكار وتخصّصها.
          </Typography>
          <Stack direction="row" spacing={2} justifyContent="center">
            <Button variant="contained" onClick={() => navigate('/signup')}>سجّل مجاناً</Button>
            <Button variant="outlined" onClick={() => navigate('/login')}>تسجيل الدخول</Button>
          </Stack>
        </Container>
      </Box>
    );
  }

  // Guard: investor role — redirect to marketplace
  if (profile?.role === 'investor') {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <NavBar />
        <Container maxWidth="sm" sx={{ pt: 16, pb: 8, textAlign: 'center' }}>
          <Typography variant="h5" sx={{ mb: 1, fontWeight: 700 }}>سوق المستثمرين</Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            هذا القسم لروّاد الأعمال. تصفّح سوق المستثمرين لتجد مشاريع تستثمر فيها.
          </Typography>
          <Button variant="contained" size="large" onClick={() => navigate('/marketplace')}>
            اذهب إلى السوق
          </Button>
        </Container>
      </Box>
    );
  }

  // Guard: free plan
  if (profile?.plan === 'free') {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <NavBar />
        <Container maxWidth="sm" sx={{ pt: 16, pb: 8, textAlign: 'center' }}>
          <LockOutlinedIcon sx={{ fontSize: 48, color: 'warning.main', mb: 2 }} />
          <Typography variant="h5" sx={{ mb: 1, fontWeight: 700 }}>خطة برو مطلوبة</Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            رقِّ إلى برو أو أعلى لتحجز أفكاراً من المكتبة وتبدأ البناء.
          </Typography>
          <Button variant="contained" size="large" onClick={() => navigate('/pricing')}>
            شاهد الأسعار
          </Button>
        </Container>
      </Box>
    );
  }

  // Guard: max 2 grabs per user
  if (grabCount >= 2 && idea) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <NavBar />
        <Container maxWidth="sm" sx={{ pt: 16, pb: 8, textAlign: 'center' }}>
          <Alert severity="warning" sx={{ mb: 3 }}>
            حجزت فكرتين بالفعل — وهذا الحد الحالي. ركّز عليهما قبل حجز المزيد.
          </Alert>
          <Button variant="outlined" onClick={() => navigate('/dashboard')}>اذهب إلى لوحة التحكم</Button>
        </Container>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <NavBar />
        <Container maxWidth="md" sx={{ pt: 16, pb: 8, textAlign: 'center' }}>
          <CircularProgress />
        </Container>
      </Box>
    );
  }

  if (!idea || error === 'IDEA_NOT_FOUND') {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <NavBar />
        <Container maxWidth="md" sx={{ pt: 16, pb: 8 }}>
          <Alert severity="error">{error === 'IDEA_NOT_FOUND' ? 'الفكرة غير موجودة.' : error ?? 'الفكرة غير موجودة.'}</Alert>
          <Button sx={{ mt: 2 }} startIcon={<ArrowBackIcon />} onClick={() => navigate('/ideas-library')}>
            العودة للمكتبة
          </Button>
        </Container>
      </Box>
    );
  }

  if (success) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <NavBar />
        <Container maxWidth="sm" sx={{ pt: 16, pb: 8, textAlign: 'center' }}>
          <CheckCircleIcon sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>
            حُجزت الفكرة!
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 4, lineHeight: 1.7 }}>
            أُضيفت <strong>{businessName || idea.title}</strong> إلى لوحة تحكمك. ابدأ رحلتك وحوّل الفكرة إلى واقع.
          </Typography>
          <Stack direction="row" spacing={2} justifyContent="center">
            <Button variant="contained" size="large" onClick={() => navigate('/journey')}>
              ابدأ رحلتي
            </Button>
            <Button variant="outlined" onClick={() => navigate('/ideas-library')}>
              تصفّح أفكاراً أخرى
            </Button>
          </Stack>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <NavBar />

      <Box sx={{ pt: { xs: 10, md: 12 }, pb: 4, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Container maxWidth="md">
          <Breadcrumbs sx={{ mb: 2 }}>
            <Link to="/ideas-library" style={{ textDecoration: 'none', color: 'inherit' }}>
              <Typography variant="body2" color="text.secondary">مكتبة الأفكار</Typography>
            </Link>
            <Link to={`/ideas-library/${slug}`} style={{ textDecoration: 'none', color: 'inherit' }}>
              <Typography variant="body2" color="text.secondary">{idea.title}</Typography>
            </Link>
            <Typography variant="body2" color="text.primary">الحجز والتخصيص</Typography>
          </Breadcrumbs>
          <Typography variant="h4" sx={{ fontWeight: 800, mb: 3 }}>
            احجز هذه الفكرة وخصّصها
          </Typography>
          <Stepper activeStep={step} sx={{ mb: 0 }}>
            {STEPS.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
        </Container>
      </Box>

      <Box sx={{ py: 5, flex: 1 }}>
        <Container maxWidth="md">
          {error && error !== 'IDEA_NOT_FOUND' && (
            <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
          )}

          {step === 0 && (
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 7 }}>
                <Card>
                  <CardContent sx={{ p: 3 }}>
                    <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
                      <Box
                        sx={{
                          width: 56,
                          height: 56,
                          borderRadius: 2,
                          bgcolor: 'grey.100',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '1.75rem',
                        }}
                      >
                        {idea.emoji || '💡'}
                      </Box>
                      <Box>
                        <Typography variant="h6" fontWeight={700}>{idea.title}</Typography>
                        <Typography variant="body2" color="text.secondary">{idea.sector}</Typography>
                      </Box>
                    </Stack>

                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7, mb: 2 }}>
                      {idea.tagline}
                    </Typography>

                    <Divider sx={{ my: 2 }} />

                    <Grid container spacing={2}>
                      {[
                        { label: 'تكلفة البدء', value: `$${(idea.initial_investment_min / 1000).toFixed(0)}K–$${(idea.initial_investment_max / 1000).toFixed(0)}K` },
                        { label: 'نطاق العائد', value: `${idea.est_roi_min}–${idea.est_roi_max}%` },
                        { label: 'نقطة التعادل', value: `${idea.break_even_months} شهراً` },
                        { label: 'مدة الإطلاق', value: `${idea.time_to_launch_weeks} أسبوعاً` },
                      ].map(({ label, value }) => (
                        <Grid size={{ xs: 6 }} key={label}>
                          <Typography variant="caption" color="text.secondary">{label}</Typography>
                          <Typography variant="subtitle2" fontWeight={700}>{value}</Typography>
                        </Grid>
                      ))}
                    </Grid>
                  </CardContent>
                </Card>
              </Grid>

              <Grid size={{ xs: 12, md: 5 }}>
                <Card sx={{ bgcolor: 'grey.50' }}>
                  <CardContent sx={{ p: 3 }}>
                    <Typography variant="subtitle2" sx={{ mb: 2 }}>ماذا ستحصل عليه</Typography>
                    <Stack spacing={1.5}>
                      {[
                        'ملخص كامل للمشكلة والحل',
                        'تحليل السوق المستهدف',
                        'تفصيل نموذج الإيرادات',
                        'التوقعات المالية',
                        'أفضل الأسواق للإطلاق',
                        'لوحة رحلة معبأة مسبقاً',
                        'فكرتك قابلة للتخصيص بالكامل',
                      ].map((item) => (
                        <Stack key={item} direction="row" spacing={1} alignItems="flex-start">
                          <CheckCircleIcon sx={{ color: 'success.main', fontSize: '1rem', mt: 0.25, flexShrink: 0 }} />
                          <Typography variant="body2">{item}</Typography>
                        </Stack>
                      ))}
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Stack direction="row" justifyContent="flex-end">
                  <Button variant="contained" size="large" onClick={() => setStep(1)}>
                    متابعة ←
                  </Button>
                </Stack>
              </Grid>
            </Grid>
          )}

          {step === 1 && (
            <Card sx={{ maxWidth: 560, mx: 'auto' }}>
              <CardContent sx={{ p: 4 }}>
                <Typography variant="h5" fontWeight={700} sx={{ mb: 1 }}>
                  اجعلها فكرتك
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  أعطِ نسختك من الفكرة اسماً وموقعاً. يمكنك تغييرهما لاحقاً.
                </Typography>

                <Stack spacing={2.5}>
                  <TextField
                    label="اسم المشروع / الفكرة"
                    placeholder={idea.title}
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    fullWidth
                    helperText="ماذا ستسمي مشروعك؟ (اختياري)"
                  />
                  <TextField
                    label="مدينتك"
                    placeholder="مثال: الرياض"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    fullWidth
                    helperText="يساعدنا على تخصيص توصيات السوق"
                  />
                  <TextField
                    label="ملاحظاتك (اختياري)"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    fullWidth
                    multiline
                    rows={3}
                    helperText="أي أفكار حول كيف ستكيّف هذه الفكرة"
                  />
                </Stack>

                <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
                  <Button variant="outlined" onClick={() => setStep(0)} startIcon={<ArrowBackIcon />}>
                    رجوع
                  </Button>
                  <Button variant="contained" sx={{ flex: 1 }} onClick={() => setStep(2)}>
                    راجع وأكّد ←
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          )}

          {step === 2 && (
            <Card sx={{ maxWidth: 560, mx: 'auto' }}>
              <CardContent sx={{ p: 4 }}>
                <Typography variant="h5" fontWeight={700} sx={{ mb: 1 }}>
                  أكّد حجزك
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  راجع التفاصيل أدناه قبل حجز مقعدك.
                </Typography>

                <Stack spacing={2} sx={{ mb: 3 }}>
                  {[
                    { label: 'الفكرة', value: idea.title },
                    { label: 'اسم مشروعك', value: businessName || '(اسم الفكرة الأصلي)' },
                    { label: 'مدينتك', value: city || '(غير محددة)' },
                    { label: 'المقاعد المتبقية بعد الحجز', value: `${idea.spots_total - idea.spots_taken - 1} من ${idea.spots_total}` },
                  ].map(({ label, value }) => (
                    <Stack key={label} direction="row" justifyContent="space-between" alignItems="flex-start">
                      <Typography variant="body2" color="text.secondary">{label}</Typography>
                      <Typography variant="body2" fontWeight={600} sx={{ textAlign: 'right', maxWidth: '60%' }}>{value}</Typography>
                    </Stack>
                  ))}
                </Stack>

                <Alert severity="info" sx={{ mb: 3 }}>
                  <Typography variant="caption">
                    حجز الفكرة ينشئ نسخة خاصة في لوحتك. لا يرى الروّاد الآخرون نسختك — الملكية كاملة لك.
                  </Typography>
                </Alert>

                <Stack direction="row" spacing={2}>
                  <Button variant="outlined" onClick={() => setStep(1)} startIcon={<ArrowBackIcon />}>
                    رجوع
                  </Button>
                  <Button
                    variant="contained"
                    color="success"
                    sx={{ flex: 1 }}
                    onClick={handleGrab}
                    disabled={submitting}
                    startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : undefined}
                  >
                    {submitting ? 'جارٍ الحجز…' : 'احجز هذه الفكرة'}
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          )}
        </Container>
      </Box>

      <Footer />
    </Box>
  );
}
