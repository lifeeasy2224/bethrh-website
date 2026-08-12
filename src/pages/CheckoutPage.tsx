import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import Collapse from '@mui/material/Collapse';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import VerifiedUserOutlinedIcon from '@mui/icons-material/VerifiedUserOutlined';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import CloseIcon from '@mui/icons-material/Close';
import CheckIcon from '@mui/icons-material/Check';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../supabase';
import NavBar from '../components/NavBar';

interface PlanConfig {
  name: string;
  monthly: number;
  annual: number;
  annualMonthly: number;
  color: string;
  bg: string;
  icon: React.ReactNode;
  features: string[];
}

const PLANS: Record<string, PlanConfig> = {
  pro: {
    name: 'برو',
    monthly: 9,
    annual: 86,
    annualMonthly: 7,
    color: '#1B6B3E',
    bg: '#DEEBE2',
    icon: <TrendingUpIcon sx={{ fontSize: 22 }} />,
    features: [
      'تفاصيل الأفكار كاملة',
      'التقاط أفكار غير محدودة',
      'مدرب AI — ٥٠ رسالة/يوم',
      'التحقق من الفكرة (AI)',
      'نموذج الإيرادات والتحليل المالي',
      'خطوات البدء السريع وأفضل الأسواق',
      'تتبع التقدم (٩٠ يوم)',
    ],
  },
  growth: {
    name: 'نمو',
    monthly: 19,
    annual: 182,
    annualMonthly: 15,
    color: '#1B6B3E',
    bg: '#DEEBE2',
    icon: <RocketLaunchIcon sx={{ fontSize: 22 }} />,
    features: [
      'كل ما في برو',
      'مدرب AI — ٢٠٠ رسالة/يوم',
      'تقارير متقدمة ودعم أولوية',
      'Pitch Deck AI وتحليل SWOT متقدم',
      'ربط مع المستثمرين',
    ],
  },
};

type PromoState = { code: string; discountPct: number; label: string } | null;

export default function CheckoutPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Promo code state
  const [promoInput, setPromoInput] = useState('');
  const [promoApplied, setPromoApplied] = useState<PromoState>(null);
  const [promoError, setPromoError] = useState('');
  const [promoLoading, setPromoLoading] = useState(false);

  const planId = searchParams.get('plan') ?? 'pro';
  const billing = (searchParams.get('billing') ?? 'monthly') as 'monthly' | 'annual';
  const plan = PLANS[planId];

  useEffect(() => {
    if (!user) navigate('/login');
  }, [user, navigate]);

  useEffect(() => {
    if (!plan) navigate('/pricing');
  }, [plan, navigate]);

  if (!plan) return null;

  const displayPrice = billing === 'annual' ? plan.annualMonthly : plan.monthly;
  const totalBilled = billing === 'annual' ? plan.annual : plan.monthly;
  const discountedTotal = promoApplied
    ? Math.round(totalBilled * (1 - promoApplied.discountPct / 100) * 100) / 100
    : totalBilled;

  // Shared by the "طبّق" button and the bfcache re-validation below — both need
  // the exact same validate-and-set logic, just fed a different source code.
  async function validateAndApplyCode(rawCode: string) {
    const code = rawCode.trim().toUpperCase();
    if (!code) return;
    setPromoLoading(true);
    setPromoError('');
    setPromoApplied(null);

    const { data, error: dbErr } = await supabase
      .from('promo_codes')
      .select('code, discount_pct, max_uses, uses_count, expires_at, is_active')
      .eq('code', code)
      .maybeSingle();

    setPromoLoading(false);

    if (dbErr || !data) { setPromoError('رمز خصم غير صالح'); return; }
    if (!data.is_active) { setPromoError('رمز الخصم لم يعد فعّالاً'); return; }
    if (data.expires_at && new Date(data.expires_at) < new Date()) { setPromoError('انتهت صلاحية رمز الخصم'); return; }
    if (data.max_uses !== null && data.uses_count >= data.max_uses) { setPromoError('بلغ رمز الخصم حد استخدامه'); return; }

    setPromoApplied({ code: data.code as string, discountPct: data.discount_pct as number, label: `خصم ${data.discount_pct}٪` });
  }

  async function applyPromo() {
    await validateAndApplyCode(promoInput);
  }

  function removePromo() {
    setPromoApplied(null);
    setPromoInput('');
    setPromoError('');
  }

  // bfcache resilience: if this page is restored from the back-forward cache
  // (e.g. the founder navigated away and back), the DOM can still show a
  // stale "promo applied" chip while React state doesn't match what a fresh
  // mount would have — this was the diagnosed root cause of the promo
  // silently not reaching checkout. Re-validate against the live DB whenever
  // a persisted pageshow fires with a promo still marked as applied.
  useEffect(() => {
    function onPageShow(e: PageTransitionEvent) {
      if (e.persisted && promoApplied) {
        void validateAndApplyCode(promoApplied.code);
      }
    }
    window.addEventListener('pageshow', onPageShow);
    return () => window.removeEventListener('pageshow', onPageShow);
  }, [promoApplied]);

  async function handleCheckout() {
    setError('');

    // Guard: the UI shows a promo as applied, but its code would serialize
    // falsy on submit — this is the exact failure mode that let a validated
    // promo silently fall through to a full-price Stripe session. Stop and
    // surface a clear error instead of charging full price silently.
    if (promoApplied && !(promoApplied.code && promoApplied.code.trim())) {
      setError('حدث خطأ في كود الخصم. يرجى إعادة إدخاله قبل المتابعة.');
      setPromoApplied(null);
      return;
    }

    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const fnUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-checkout`;
      const res = await fetch(fnUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          'Apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          plan: planId,
          billing,
          origin: window.location.origin,
          promo_code: promoApplied?.code ?? null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'تعذّر إنشاء جلسة الدفع');

      // 100% off — edge function handled it directly
      if (data.free) {
        window.location.href = data.redirect;
        return;
      }

      window.location.href = data.url;
    } catch (err) {
      setError((err as Error).message);
      setLoading(false);
    }
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: 'grey.50' }}>
      <NavBar />

      <Box sx={{ flex: 1, pt: { xs: 10, md: 12 }, pb: 8 }}>
        <Container maxWidth="md">
          {/* Back link */}
          <Button
            component={Link}
            to="/pricing"
            startIcon={<ArrowBackIcon />}
            sx={{ mb: 4, color: 'text.secondary', textTransform: 'none', fontWeight: 500 }}
          >
            العودة للأسعار
          </Button>

          <Grid container spacing={3} alignItems="flex-start">
            {/* Left — plan summary */}
            <Grid size={{ xs: 12, md: 7 }}>
              <Card sx={{ border: '1px solid', borderColor: 'divider', boxShadow: 2 }}>
                <CardContent sx={{ p: 4 }}>
                  {/* Plan header */}
                  <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
                    <Box sx={{
                      width: 48, height: 48, borderRadius: 2,
                      bgcolor: plan.bg, color: plan.color,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {plan.icon}
                    </Box>
                    <Box>
                      <Typography variant="overline" fontWeight={700} color="text.secondary" lineHeight={1.2}>
                        الخطة المختارة
                      </Typography>
                      <Typography variant="h5" fontWeight={800}>{plan.name}</Typography>
                    </Box>
                    <Box sx={{ ml: 'auto !important' }}>
                      <Chip
                        label={billing === 'annual' ? 'سنوي — وفّر ٢٠٪' : 'شهري'}
                        size="small"
                        sx={{
                          bgcolor: billing === 'annual' ? 'success.main' : 'grey.100',
                          color: billing === 'annual' ? 'white' : 'text.secondary',
                          fontWeight: 700,
                        }}
                      />
                    </Box>
                  </Stack>

                  {/* Price */}
                  <Box sx={{ bgcolor: 'grey.50', borderRadius: 2, p: 2.5, mb: 3 }}>
                    <Stack direction="row" alignItems="baseline" spacing={0.5}>
                      <Typography variant="h3" fontWeight={800} sx={{ fontSize: '2.25rem' }}>
                        ${displayPrice}
                      </Typography>
                      <Typography color="text.secondary">/شهر</Typography>
                    </Stack>
                    {billing === 'annual' && (
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        تُحاسب ${totalBilled}/سنة — توفّر ${(plan.monthly * 12) - plan.annual}/سنة
                      </Typography>
                    )}
                    {billing === 'monthly' && (
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        فوترة شهرية — انتقل للسنوي لتوفّر ٢٠٪
                      </Typography>
                    )}
                  </Box>

                  <Divider sx={{ mb: 3 }} />

                  {/* Features */}
                  <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>
                    ماذا تشمل الخطة
                  </Typography>
                  <Stack spacing={1.25}>
                    {plan.features.map(f => (
                      <Stack key={f} direction="row" spacing={1.25} alignItems="flex-start">
                        <CheckCircleIcon sx={{ color: 'success.main', fontSize: 17, flexShrink: 0, mt: '1px' }} />
                        <Typography variant="body2">{f}</Typography>
                      </Stack>
                    ))}
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            {/* Right — payment action */}
            <Grid size={{ xs: 12, md: 5 }}>
              <Card sx={{ border: '1px solid', borderColor: 'divider', boxShadow: 3, position: 'sticky', top: 100 }}>
                <CardContent sx={{ p: 3.5 }}>
                  <Typography variant="h6" fontWeight={700} gutterBottom>
                    أكمل طلبك
                  </Typography>

                  <Stack spacing={1} sx={{ mb: 3 }}>
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="body2" color="text.secondary">خطة {plan.name}</Typography>
                      <Typography variant="body2" fontWeight={600} sx={{ textDecoration: promoApplied ? 'line-through' : 'none', color: promoApplied ? 'text.disabled' : 'text.primary' }}>
                        ${displayPrice}/mo
                      </Typography>
                    </Stack>
                    {billing === 'annual' && (
                      <Stack direction="row" justifyContent="space-between">
                        <Typography variant="body2" color="text.secondary">الخصم السنوي</Typography>
                        <Typography variant="body2" fontWeight={600} color="success.main">
                          −${(plan.monthly * 12) - plan.annual}/سنة
                        </Typography>
                      </Stack>
                    )}
                    {promoApplied && (
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Stack direction="row" spacing={0.75} alignItems="center">
                          <LocalOfferIcon sx={{ fontSize: 13, color: 'success.main' }} />
                          <Typography variant="body2" color="success.main" fontWeight={600}>
                            رمز خصم ({promoApplied.code})
                          </Typography>
                        </Stack>
                        <Typography variant="body2" fontWeight={600} color="success.main">
                          −{promoApplied.discountPct}%
                        </Typography>
                      </Stack>
                    )}
                    <Divider />
                    <Stack direction="row" justifyContent="space-between">
                      <Typography variant="body2" fontWeight={700}>
                        {billing === 'annual' ? 'الإجمالي المحاسب اليوم' : 'الإجمالي الشهري'}
                      </Typography>
                      <Stack alignItems="flex-end">
                        <Typography variant="body2" fontWeight={700} color={promoApplied ? 'success.main' : 'text.primary'}>
                          ${discountedTotal}{billing === 'annual' ? '/سنة' : '/شهر'}
                        </Typography>
                        {promoApplied && promoApplied.discountPct < 100 && (
                          <Typography variant="caption" color="text.disabled" sx={{ textDecoration: 'line-through' }}>
                            ${totalBilled}{billing === 'annual' ? '/سنة' : '/شهر'}
                          </Typography>
                        )}
                      </Stack>
                    </Stack>
                  </Stack>

                  {/* Promo code input */}
                  <Box sx={{ mb: 2.5 }}>
                    <Collapse in={!promoApplied}>
                      <Stack direction="row" spacing={1}>
                        <TextField
                          size="small"
                          placeholder="رمز الخصم"
                          value={promoInput}
                          onChange={e => { setPromoInput(e.target.value.toUpperCase()); setPromoError(''); }}
                          onKeyDown={e => e.key === 'Enter' && void applyPromo()}
                          fullWidth
                          error={!!promoError}
                          helperText={promoError}
                          InputProps={{
                            startAdornment: (
                              <InputAdornment position="start">
                                <LocalOfferIcon sx={{ fontSize: 16, color: 'text.disabled' }} />
                              </InputAdornment>
                            ),
                            sx: { fontFamily: 'monospace', fontWeight: 600, letterSpacing: '0.04em' },
                          }}
                          sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
                        />
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => void applyPromo()}
                          disabled={!promoInput.trim() || promoLoading}
                          sx={{ minWidth: 80, flexShrink: 0, borderRadius: 1.5 }}
                        >
                          {promoLoading ? <CircularProgress size={14} /> : 'طبّق'}
                        </Button>
                      </Stack>
                    </Collapse>

                    <Collapse in={!!promoApplied}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 1.5, py: 1, bgcolor: 'success.50', borderRadius: 1.5, border: '1px solid', borderColor: 'success.light' }}>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <CheckIcon sx={{ fontSize: 16, color: 'success.main' }} />
                          <Typography variant="body2" fontWeight={700} color="success.main">
                            {promoApplied?.code} — {promoApplied?.label} مُطبَّق!
                          </Typography>
                        </Stack>
                        <IconButton size="small" onClick={removePromo} sx={{ p: 0.25 }}>
                          <CloseIcon sx={{ fontSize: 15, color: 'text.disabled' }} />
                        </IconButton>
                      </Box>
                    </Collapse>
                  </Box>

                  {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
                  )}

                  <Button
                    variant="contained"
                    size="large"
                    fullWidth
                    onClick={handleCheckout}
                    disabled={loading}
                    startIcon={loading ? <CircularProgress size={18} color="inherit" /> : <LockOutlinedIcon />}
                    sx={{ py: 1.5, fontWeight: 700, fontSize: '1rem', mb: 2 }}
                  >
                    {loading
                      ? 'جارٍ المعالجة...'
                      : promoApplied?.discountPct === 100
                        ? 'فعّل الخطة مجاناً'
                        : 'ادفع بأمان عبر Stripe'}
                  </Button>

                  {/* Trust badges */}
                  <Stack spacing={1}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <LockOutlinedIcon sx={{ fontSize: 15, color: 'text.disabled' }} />
                      <Typography variant="caption" color="text.disabled">
                        تشفير SSL بـ ٢٥٦ بت · متوافق مع PCI
                      </Typography>
                    </Stack>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <VerifiedUserOutlinedIcon sx={{ fontSize: 15, color: 'text.disabled' }} />
                      <Typography variant="caption" color="text.disabled">
                        ضمان استرداد خلال ٧ أيام
                      </Typography>
                    </Stack>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <AutorenewIcon sx={{ fontSize: 15, color: 'text.disabled' }} />
                      <Typography variant="caption" color="text.disabled">
                        ألغِ في أي وقت، بلا عقود
                      </Typography>
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Container>
      </Box>
    </Box>
  );
}
