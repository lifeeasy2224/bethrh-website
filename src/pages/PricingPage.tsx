import { useState } from 'react';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import { Link, useNavigate } from 'react-router-dom';
import NavBar from '../components/NavBar';
import Footer from '../components/Footer';
import { useAuth } from '../contexts/AuthContext';
import { useSEO } from '../hooks/useSEO';

const FONT = '"Noto Kufi Arabic", "Nunito Sans", sans-serif';
const NAVY = '#0F3D24';
const GOLD = '#D4A653';

interface Plan {
  id: string;
  letter: string;
  name: string;
  outcomeLabel: string;
  price: string;
  priceSuffix: string;
  badge: string | null;
  highlighted: boolean;
  cta: string;
  ctaTo: string;
  features: string[];
}

const PLANS: Plan[] = [
  {
    id: 'starter',
    letter: '🌱',
    name: 'مجاني',
    outcomeLabel: 'ابدأ واستكشف المنصة',
    price: '$0',
    priceSuffix: 'دائماً',
    badge: null,
    highlighted: false,
    cta: 'ابدأ مجاناً',
    ctaTo: '/signup',
    features: [
      'تصفّح مكتبة الأفكار كاملة',
      'عرض المشكلة فقط لكل فكرة',
      'التقط فكرة واحدة فقط',
      'التحقق الأساسي من الفكرة',
      'الملف الشخصي',
    ],
  },
  {
    id: 'pro',
    letter: '🌿',
    name: 'برو',
    outcomeLabel: 'للمؤسس الجاد',
    price: '$9',
    priceSuffix: '/شهر',
    badge: 'الأكثر شعبية ✦',
    highlighted: true,
    cta: 'اشترك في برو',
    ctaTo: '/signup',
    features: [
      'كل ما في المجاني',
      'تفاصيل الأفكار كاملة',
      'التقاط أفكار غير محدودة',
      'مدرب AI — ٥٠ رسالة/يوم',
      'التحقق من الفكرة (AI)',
      'نموذج الإيرادات والتحليل المالي',
      'خطوات البدء السريع',
      'أفضل الأسواق',
      'تتبع التقدم (٩٠ يوم)',
    ],
  },
  {
    id: 'growth',
    letter: '🚀',
    name: 'نمو',
    outcomeLabel: 'للفريق الريادي',
    price: '$19',
    priceSuffix: '/شهر',
    badge: null,
    highlighted: false,
    cta: 'اشترك في نمو',
    ctaTo: '/signup',
    features: [
      'كل ما في برو',
      'فريق حتى ٣ أعضاء',
      'مدرب AI — ٢٠٠ رسالة/يوم',
      'تقارير متقدمة',
      'دعم أولوية (٢٤ ساعة)',
      'Pitch Deck AI',
      'تحليل SWOT متقدم',
      'ربط مع المستثمرين',
    ],
  },
  {
    id: 'accelerator',
    letter: '🏢',
    name: 'المسرعات',
    outcomeLabel: 'للمسرعات والشركات',
    price: 'مخصص',
    priceSuffix: '',
    badge: null,
    highlighted: false,
    cta: 'تواصل معنا',
    ctaTo: '/contact',
    features: [
      'كل ما في نمو',
      'فريق غير محدود',
      'لوحة تحكم مخصصة',
      'تكامل API',
      'تقارير مخصصة',
      'مدير حساب مخصص',
      'تدريب الفريق',
      'SLA مضمون',
    ],
  },
];

const FAQ_ITEMS = [
  { q: 'هل يمكنني الإلغاء في أي وقت؟', a: 'نعم، يمكنك إلغاء اشتراكك في أي وقت دون رسوم إضافية.' },
  { q: 'هل هناك تجربة مجانية للخطط المدفوعة؟', a: 'الخطة المجانية متاحة دائماً. يمكنك الترقية متى شئت.' },
  { q: 'ما الفرق بين برو ونمو؟', a: 'نمو يضيف دعم الفريق (٣ أعضاء)، مدرب AI أكثر، وتقارير متقدمة.' },
  { q: 'ما هي «المسرعات»؟', a: 'للمسرعات والحاضنات والشركات التي تحتاج حلولاً مخصصة. تواصل معنا.' },
  { q: 'ما وسائل الدفع المقبولة؟', a: 'جميع البطاقات الائتمانية الرئيسية عبر Stripe — آمنة ومشفّرة ومتوافقة مع معايير PCI.' },
  { q: 'هل المستثمرون مجاناً؟', a: 'نعم. المستثمرون الموثّقون يستخدمون بذرة مجاناً دائماً. مؤسسو خطة نمو يظهرون للمستثمرين في السوق.' },
];

export default function PricingPage() {
  const [faqOpen, setFaqOpen] = useState<string | false>(false);
  const { user, profile } = useAuth();
  useSEO({
    title: 'الأسعار — بذرة',
    description: 'أسعار بسيطة وشفافة تناسب كل مرحلة. ابدأ مجاناً وارتقِ كلما نما مشروعك.',
    canonicalPath: '/pricing',
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: FAQ_ITEMS.map(item => ({
          '@type': 'Question',
          name: item.q,
          acceptedAnswer: { '@type': 'Answer', text: item.a },
        })),
      },
    ],
  });
  const navigate = useNavigate();

  function handlePlanCta(plan: Plan) {
    if (user) {
      if (plan.id === 'starter') {
        navigate(profile?.role === 'investor' ? '/investor/dashboard' : '/dashboard');
      } else if (plan.id === 'accelerator') {
        navigate('/contact');
      } else {
        navigate(`/checkout?plan=${plan.id}`);
      }
    } else {
      navigate(plan.ctaTo);
    }
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', bgcolor: NAVY }}>
      <NavBar />

      {/* Hero */}
      <Box sx={{ pt: { xs: 10, md: 13 }, pb: { xs: 5, md: 7 }, textAlign: 'center' }}>
        <Container maxWidth="md">
          <Typography sx={{
            fontFamily: FONT, fontWeight: 900,
            fontSize: { xs: '2rem', md: '2.75rem' },
            color: 'white', lineHeight: 1.1,
            letterSpacing: '-0.02em', mb: 1.5,
          }}>
            أسعار تناسب كل مرحلة
          </Typography>
          <Typography sx={{
            fontFamily: FONT, fontWeight: 400,
            fontSize: { xs: '1rem', md: '1.0625rem' },
            color: 'rgba(255,255,255,0.65)', lineHeight: 1.7,
          }}>
            ابدأ مجاناً — اشترك عندما تكون جاهزاً. بدون عقود أو التزامات.
          </Typography>
        </Container>
      </Box>

      {/* Plan cards */}
      <Box sx={{ pb: { xs: 6, md: 8 } }}>
        <Container maxWidth="lg">
          <Grid container spacing={2.5} alignItems="stretch">
            {PLANS.map(plan => (
              <Grid key={plan.id} size={{ xs: 12, sm: 6, lg: 3 }}>
                <Box sx={{ position: 'relative', height: '100%' }}>
                  {/* POPULAR badge — absolutely positioned top-right */}
                  {plan.badge && (
                    <Box sx={{
                      position: 'absolute', top: -12, right: 16, zIndex: 2,
                      bgcolor: GOLD, color: NAVY,
                      fontFamily: FONT, fontWeight: 700,
                      fontSize: '0.625rem', letterSpacing: '0.1em',
                      px: 1.25, py: 0.375,
                      borderRadius: '100px',
                    }}>
                      {plan.badge}
                    </Box>
                  )}

                  <Box sx={{
                    height: '100%',
                    bgcolor: '#0F3D24',
                    borderRadius: '12px',
                    border: plan.highlighted ? `2px solid ${GOLD}` : '1px solid rgba(255,255,255,0.08)',
                    p: 3,
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: plan.highlighted ? `0 0 32px rgba(212,166,83,0.15)` : 'none',
                  }}>
                    {/* Letter badge + name */}
                    <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 2 }}>
                      <Box sx={{
                        width: 38, height: 38, borderRadius: '10px',
                        bgcolor: plan.highlighted ? 'rgba(212,166,83,0.15)' : 'rgba(255,255,255,0.06)',
                        border: plan.highlighted ? `1px solid rgba(212,166,83,0.35)` : '1px solid rgba(255,255,255,0.1)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                      }}>
                        <Typography sx={{
                          fontFamily: FONT, fontWeight: 700,
                          fontSize: '1rem',
                          color: plan.highlighted ? GOLD : 'rgba(255,255,255,0.60)',
                        }}>
                          {plan.letter}
                        </Typography>
                      </Box>
                      <Typography sx={{
                        fontFamily: FONT, fontWeight: 700,
                        fontSize: '0.9375rem', color: 'white',
                      }}>
                        {plan.name}
                      </Typography>
                    </Stack>

                    {/* Outcome headline */}
                    <Typography sx={{
                      fontFamily: FONT, fontWeight: 700,
                      fontSize: '0.6875rem', color: GOLD,
                      letterSpacing: '0.07em', textTransform: 'uppercase',
                      mb: 1.75,
                      lineHeight: 1.4,
                    }}>
                      {plan.outcomeLabel}
                    </Typography>

                    {/* Price */}
                    <Stack direction="row" alignItems="baseline" spacing={0.5} sx={{ mb: 2.5 }}>
                      <Typography sx={{
                        fontFamily: FONT, fontWeight: 900,
                        fontSize: plan.price.length > 4 ? '1.75rem' : '2.25rem',
                        color: 'white', lineHeight: 1,
                      }}>
                        {plan.price}
                      </Typography>
                      {plan.priceSuffix && (
                        <Typography sx={{
                          fontFamily: FONT, fontWeight: 300,
                          fontSize: '0.875rem',
                          color: 'rgba(255,255,255,0.50)',
                        }}>
                          {plan.priceSuffix}
                        </Typography>
                      )}
                    </Stack>

                    {/* Divider */}
                    <Box sx={{ borderTop: '1px solid rgba(255,255,255,0.08)', mb: 2.5 }} />

                    {/* Features */}
                    <Stack spacing={1.25} sx={{ flex: 1, mb: 3 }}>
                      {plan.features.map(f => (
                        <Stack key={f} direction="row" spacing={1} alignItems="flex-start">
                          <CheckCircleIcon sx={{
                            color: plan.highlighted ? GOLD : 'rgba(255,255,255,0.40)',
                            fontSize: 15, flexShrink: 0, mt: '2px',
                          }} />
                          <Typography sx={{
                            fontFamily: FONT, fontWeight: 400,
                            fontSize: '0.8125rem', color: 'rgba(255,255,255,0.80)',
                            lineHeight: 1.5,
                          }}>
                            {f}
                          </Typography>
                        </Stack>
                      ))}
                    </Stack>

                    {/* CTA */}
                    <Button
                      fullWidth
                      variant={plan.highlighted ? 'contained' : 'outlined'}
                      onClick={() => handlePlanCta(plan)}
                      {...(!user && { component: Link, to: plan.ctaTo })}
                      sx={plan.highlighted ? {
                        bgcolor: GOLD, color: NAVY,
                        fontFamily: FONT, fontWeight: 700,
                        fontSize: '0.9375rem', textTransform: 'none',
                        borderRadius: 2, py: 1.25,
                        '&:hover': { bgcolor: '#A07830', boxShadow: 'none' },
                        boxShadow: 'none',
                      } : {
                        borderColor: `rgba(212,166,83,0.50)`,
                        color: GOLD,
                        fontFamily: FONT, fontWeight: 700,
                        fontSize: '0.9375rem', textTransform: 'none',
                        borderRadius: 2, py: 1.25,
                        '&:hover': { borderColor: GOLD, bgcolor: 'rgba(212,166,83,0.06)' },
                      }}
                    >
                      {user && plan.id !== 'starter' && plan.id !== 'accelerator' ? 'اشترك الآن' : plan.cta}
                    </Button>
                  </Box>
                </Box>
              </Grid>
            ))}
          </Grid>

          {/* Trust signals */}
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={{ xs: 1, sm: 3 }}
            justifyContent="center"
            alignItems="center"
            sx={{ mt: 4 }}
          >
            {['خطة مجانية دائمة', 'بدون عقود', 'ألغِ في أي وقت'].map(t => (
              <Stack key={t} direction="row" spacing={0.75} alignItems="center">
                <CheckCircleIcon sx={{ color: GOLD, fontSize: 15 }} />
                <Typography sx={{
                  fontFamily: FONT, fontWeight: 400,
                  fontSize: '0.8125rem', color: 'rgba(255,255,255,0.60)',
                }}>
                  {t}
                </Typography>
              </Stack>
            ))}
          </Stack>
        </Container>
      </Box>

      {/* Callout cards */}
      <Box sx={{ pb: { xs: 8, md: 10 }, bgcolor: 'rgba(0,0,0,0.15)' }}>
        <Container maxWidth="lg">
          <Grid container spacing={3} sx={{ pt: { xs: 6, md: 8 } }}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Box sx={{
                bgcolor: '#0F3D24',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '12px', p: 3,
                display: 'flex', gap: 2, alignItems: 'flex-start',
              }}>
                <Box sx={{
                  width: 42, height: 42, borderRadius: '10px',
                  bgcolor: 'rgba(212,166,83,0.12)',
                  border: '1px solid rgba(212,166,83,0.25)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <SchoolOutlinedIcon sx={{ color: GOLD, fontSize: 22 }} />
                </Box>
                <Box>
                  <Typography sx={{ fontFamily: FONT, fontWeight: 700, fontSize: '1rem', color: 'white', mb: 0.5 }}>
                    خصم الطلاب
                  </Typography>
                  <Typography sx={{ fontFamily: FONT, fontWeight: 400, fontSize: '0.875rem', color: 'rgba(255,255,255,0.65)', lineHeight: 1.6 }}>
                    الطلاب يحصلون على برو بخصم ٥٠٪ ببريد جامعي صالح. راسلنا على{' '}
                    <Box component="span" sx={{ color: GOLD }}>hello@bethra.co</Box> للحصول عليه.
                  </Typography>
                </Box>
              </Box>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <Box sx={{
                bgcolor: '#0F3D24',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '12px', p: 3,
                display: 'flex', gap: 2, alignItems: 'flex-start',
              }}>
                <Box sx={{
                  width: 42, height: 42, borderRadius: '10px',
                  bgcolor: 'rgba(212,166,83,0.12)',
                  border: '1px solid rgba(212,166,83,0.25)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <GroupsOutlinedIcon sx={{ color: GOLD, fontSize: 22 }} />
                </Box>
                <Box>
                  <Typography sx={{ fontFamily: FONT, fontWeight: 700, fontSize: '1rem', color: 'white', mb: 0.5 }}>
                    تدير مسرّعة أعمال؟
                  </Typography>
                  <Typography sx={{ fontFamily: FONT, fontWeight: 400, fontSize: '0.875rem', color: 'rgba(255,255,255,0.65)', lineHeight: 1.6 }}>
                    جهّز دفعتك كاملة بحلول مخصصة للمسرعات والحاضنات ←{' '}
                    <Box component="span" sx={{ color: GOLD }}>hello@bethra.co</Box>
                  </Typography>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* FAQ */}
      <Box sx={{ py: { xs: 8, md: 10 } }}>
        <Container maxWidth="md">
          <Typography sx={{
            fontFamily: FONT, fontWeight: 700,
            fontSize: { xs: '1.5rem', md: '1.875rem' },
            color: 'white', textAlign: 'center', mb: 5,
          }}>
            أسئلة شائعة
          </Typography>
          <Stack spacing={1.5}>
            {FAQ_ITEMS.map(item => (
              <Accordion
                key={item.q}
                expanded={faqOpen === item.q}
                onChange={(_, exp) => setFaqOpen(exp ? item.q : false)}
                sx={{
                  bgcolor: '#0F3D24',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: '10px !important',
                  '&:before': { display: 'none' },
                  '&.Mui-expanded': { border: `1px solid rgba(212,166,83,0.30)` },
                  boxShadow: 'none',
                }}
              >
                <AccordionSummary
                  expandIcon={<ExpandMoreIcon sx={{ color: GOLD }} />}
                  sx={{ py: 0.25 }}
                >
                  <Typography sx={{ fontFamily: FONT, fontWeight: 700, fontSize: '0.9375rem', color: 'white' }}>
                    {item.q}
                  </Typography>
                </AccordionSummary>
                <AccordionDetails sx={{ pt: 0 }}>
                  <Typography sx={{ fontFamily: FONT, fontWeight: 400, fontSize: '0.875rem', color: 'rgba(255,255,255,0.65)', lineHeight: 1.75 }}>
                    {item.a}
                  </Typography>
                </AccordionDetails>
              </Accordion>
            ))}
          </Stack>

          {/* Bottom CTA */}
          <Box sx={{ textAlign: 'center', mt: 6 }}>
            <Button
              component={Link}
              to="/contact"
              variant="contained"
              size="large"
              sx={{
                bgcolor: GOLD, color: NAVY,
                fontFamily: FONT, fontWeight: 700,
                fontSize: '1rem', textTransform: 'none',
                px: 4, py: 1.5, borderRadius: 2,
                boxShadow: 'none',
                '&:hover': { bgcolor: '#A07830', boxShadow: 'none' },
              }}
            >
              هل تحتاج مساعدة في اختيار الخطة؟ تواصل معنا
            </Button>
          </Box>
        </Container>
      </Box>

      <Footer />
    </Box>
  );
}
