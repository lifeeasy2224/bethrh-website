import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import { Link } from 'react-router-dom';

const FONT = '"Noto Kufi Arabic", "Nunito Sans", sans-serif';

const VS_SECTIONS = [
  {
    competitor: 'LivePlan',
    competitorDesc: 'قالب خطة عمل للبنوك وصناديق الاستثمار',
    ideaiqDesc: 'مسار إيرادات لروّاد الأعمال الأفراد الباحثين عن أول عميل',
    footer: 'LivePlan ينتهي عند الخطة. بذرة تنتهي عند أول دولار لك.',
  },
  {
    competitor: 'ChatGPT',
    competitorDesc: 'ذكاء اصطناعي عام يعطيك مقالات استراتيجية',
    ideaiqDesc: 'مدرّب مدرَّب على رحلة المؤسس يعطيك مهام هذا الأسبوع تحديداً',
    footer: 'ChatGPT لا يعرف مرحلتك ولا تقدمك. بذرة تعرف.',
  },
  {
    competitor: 'Notion',
    competitorDesc: 'صفحة فارغة — ودبّر نفسك',
    ideaiqDesc: 'انطلاقة موجّهة بتحقق ومحطات إنجاز ومهام جاهزة',
    footer: 'Notion أداة. بذرة شريك مؤسس.',
  },
];

const CHECK = '✅';
const CROSS = '❌';
const PARTIAL = '⚠️';

const TABLE_FEATURES = [
  { label: 'إطار للتحقق من الفكرة',    liveplan: PARTIAL, chatgpt: PARTIAL, notion: CROSS,    bizplan: PARTIAL, canva: CROSS,    ideaiq: CHECK },
  { label: 'مهام أسبوعية تراعي مرحلتك',     liveplan: CROSS,   chatgpt: CROSS,   notion: CROSS,    bizplan: CROSS,   canva: CROSS,    ideaiq: CHECK },
  { label: 'تدريب ذكاء اصطناعي (مدرَّب للمؤسسين)',liveplan: CROSS,   chatgpt: PARTIAL, notion: CROSS,    bizplan: CROSS,   canva: CROSS,    ideaiq: CHECK },
  { label: 'مولّد عروض المستثمرين',     liveplan: PARTIAL, chatgpt: PARTIAL, notion: CROSS,    bizplan: PARTIAL, canva: PARTIAL,  ideaiq: CHECK },
  { label: 'خارطة تنفيذ ٩٠ يوماً',     liveplan: CROSS,   chatgpt: CROSS,   notion: CROSS,    bizplan: CROSS,   canva: CROSS,    ideaiq: CHECK },
  { label: 'مخطط نموذج العمل',        liveplan: PARTIAL, chatgpt: PARTIAL, notion: PARTIAL,  bizplan: PARTIAL, canva: CHECK,    ideaiq: CHECK },
  { label: 'تتبع محطات الإيراد',   liveplan: PARTIAL, chatgpt: CROSS,   notion: CROSS,    bizplan: PARTIAL, canva: CROSS,    ideaiq: CHECK },
  { label: 'مصمم لروّاد الأعمال الأفراد',       liveplan: CROSS,   chatgpt: CROSS,   notion: CROSS,    bizplan: CROSS,   canva: CROSS,    ideaiq: CHECK },
  { label: 'التركيز على أول دولار (لا مجرد خطة)',liveplan: CROSS,   chatgpt: CROSS,   notion: CROSS,    bizplan: CROSS,   canva: CROSS,    ideaiq: CHECK },
];

const COLUMNS = [
  { key: 'liveplan', label: 'LivePlan' },
  { key: 'chatgpt',  label: 'ChatGPT' },
  { key: 'notion',   label: 'Notion' },
  { key: 'bizplan',  label: 'Bizplan' },
  { key: 'canva',    label: 'Canva' },
  { key: 'ideaiq',   label: 'بذرة', isUs: true },
];

export default function WhyBethraPage() {
  return (
    <Box sx={{ bgcolor: '#0F3D24', minHeight: '100vh' }}>

      {/* Hero */}
      <Box sx={{ pt: { xs: 10, md: 14 }, pb: { xs: 7, md: 9 }, textAlign: 'center' }}>
        <Container maxWidth="md">
          <Typography sx={{
            fontFamily: FONT,
            fontWeight: 900,
            fontSize: { xs: '2rem', sm: '2.5rem', md: '2.875rem' },
            color: 'white',
            lineHeight: 1.15,
            letterSpacing: '-0.02em',
            maxWidth: 800,
            mx: 'auto',
            mb: 2.5,
          }}>
            المنصة الوحيدة التي تأخذك من الفكرة إلى أول دولار
          </Typography>
          <Typography sx={{
            fontFamily: FONT,
            fontWeight: 400,
            fontSize: { xs: '1rem', md: '1.125rem' },
            color: 'rgba(255,255,255,0.80)',
            lineHeight: 1.7,
          }}>
            الأدوات الأخرى تعطيك جزءاً. بذرة تعطيك الرحلة كاملة.
          </Typography>
        </Container>
      </Box>

      {/* VS Sections */}
      <Box sx={{ pb: { xs: 8, md: 10 } }}>
        <Container maxWidth="md">
          <Stack spacing={3}>
            {VS_SECTIONS.map((vs) => (
              <Box key={vs.competitor}>
                <Grid container sx={{ borderRadius: '12px', overflow: 'hidden' }}>
                  {/* Competitor side */}
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Box sx={{
                      bgcolor: '#1B6B3E',
                      p: 3,
                      height: '100%',
                      borderRight: { sm: '1px solid rgba(255,255,255,0.08)' },
                      borderBottom: { xs: '1px solid rgba(255,255,255,0.08)', sm: 'none' },
                    }}>
                      <Typography sx={{
                        fontFamily: FONT,
                        fontWeight: 700,
                        fontSize: '0.875rem',
                        color: 'rgba(255,255,255,0.50)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                        mb: 1,
                      }}>
                        {vs.competitor}
                      </Typography>
                      <Typography sx={{
                        fontFamily: FONT,
                        fontWeight: 400,
                        fontSize: '1rem',
                        color: 'rgba(255,255,255,0.50)',
                        lineHeight: 1.6,
                      }}>
                        {vs.competitorDesc}
                      </Typography>
                    </Box>
                  </Grid>
                  {/* Bethra side */}
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Box sx={{
                      bgcolor: 'rgba(212,166,83,0.08)',
                      border: '1px solid rgba(212,166,83,0.20)',
                      borderLeft: { sm: 'none' },
                      borderTop: { xs: 'none', sm: '1px solid rgba(212,166,83,0.20)' },
                      borderRadius: { xs: '0 0 12px 12px', sm: '0 12px 12px 0' },
                      p: 3,
                      height: '100%',
                    }}>
                      <Typography sx={{
                        fontFamily: FONT,
                        fontWeight: 700,
                        fontSize: '0.875rem',
                        color: '#D4A653',
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                        mb: 1,
                      }}>
                        بذرة
                      </Typography>
                      <Typography sx={{
                        fontFamily: FONT,
                        fontWeight: 400,
                        fontSize: '1rem',
                        color: 'white',
                        lineHeight: 1.6,
                      }}>
                        {vs.ideaiqDesc}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
                <Typography sx={{
                  fontFamily: FONT,
                  fontWeight: 700,
                  fontSize: '0.875rem',
                  color: 'rgba(255,255,255,0.80)',
                  textAlign: 'center',
                  mt: 1.5,
                  px: 2,
                }}>
                  {vs.footer}
                </Typography>
              </Box>
            ))}
          </Stack>
        </Container>
      </Box>

      {/* Comparison Table */}
      <Box sx={{ pb: { xs: 8, md: 10 }, bgcolor: 'rgba(0,0,0,0.15)' }}>
        <Container maxWidth="lg">
          <Typography sx={{
            fontFamily: FONT,
            fontWeight: 700,
            fontSize: { xs: '1.375rem', md: '1.75rem' },
            color: 'white',
            textAlign: 'center',
            mb: 4,
            pt: { xs: 6, md: 8 },
          }}>
            مقارنة ميزة بميزة
          </Typography>
          <Box sx={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <Box sx={{ minWidth: 680 }}>
              {/* Header row */}
              <Box sx={{
                display: 'grid',
                gridTemplateColumns: `1fr repeat(${COLUMNS.length}, 1fr)`,
                borderBottom: '1px solid rgba(255,255,255,0.12)',
                pb: 1.5,
                mb: 0,
              }}>
                <Box />
                {COLUMNS.map((col) => (
                  <Box key={col.key} sx={{ textAlign: 'center', px: 1 }}>
                    <Typography sx={{
                      fontFamily: FONT,
                      fontWeight: 700,
                      fontSize: '0.8125rem',
                      color: col.isUs ? '#D4A653' : 'rgba(255,255,255,0.55)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                    }}>
                      {col.label}
                    </Typography>
                  </Box>
                ))}
              </Box>

              {/* Data rows */}
              {TABLE_FEATURES.map((row, i) => (
                <Box
                  key={row.label}
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: `1fr repeat(${COLUMNS.length}, 1fr)`,
                    py: 1.375,
                    borderBottom: '1px solid rgba(255,255,255,0.06)',
                    bgcolor: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.02)',
                    borderRadius: 1,
                  }}
                >
                  <Box sx={{ pr: 2 }}>
                    <Typography sx={{
                      fontFamily: FONT,
                      fontWeight: 400,
                      fontSize: '0.875rem',
                      color: 'rgba(255,255,255,0.85)',
                    }}>
                      {row.label}
                    </Typography>
                  </Box>
                  {COLUMNS.map((col) => (
                    <Box key={col.key} sx={{ textAlign: 'center' }}>
                      <Typography sx={{ fontSize: '1rem', lineHeight: 1 }}>
                        {row[col.key as keyof typeof row]}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              ))}

              {/* Legend */}
              <Stack direction="row" spacing={3} sx={{ mt: 2.5, justifyContent: 'center', flexWrap: 'wrap', gap: 1 }}>
                {[
                  { icon: CHECK, label: 'دعم كامل' },
                  { icon: PARTIAL, label: 'جزئي / بحلول بديلة' },
                  { icon: CROSS, label: 'غير متوفر' },
                ].map((l) => (
                  <Stack key={l.label} direction="row" alignItems="center" spacing={0.75}>
                    <Typography sx={{ fontSize: '0.875rem' }}>{l.icon}</Typography>
                    <Typography sx={{ fontFamily: FONT, fontWeight: 300, fontSize: '0.75rem', color: 'rgba(255,255,255,0.50)' }}>
                      {l.label}
                    </Typography>
                  </Stack>
                ))}
              </Stack>
            </Box>
          </Box>
        </Container>
      </Box>

      {/* Bottom CTA */}
      <Box sx={{ py: { xs: 10, md: 12 }, textAlign: 'center' }}>
        <Container maxWidth="sm">
          <Typography sx={{
            fontFamily: FONT,
            fontWeight: 700,
            fontSize: { xs: '1.375rem', md: '1.625rem' },
            color: 'white',
            mb: 4,
          }}>
            جاهز لترى الفرق؟
          </Typography>
          <Stack spacing={2} alignItems="center">
            <Button
              component={Link}
              to="/validate"
              variant="contained"
              size="large"
              sx={{
                bgcolor: '#D4A653',
                color: '#0F3D24',
                fontFamily: FONT,
                fontWeight: 700,
                fontSize: '1rem',
                px: 4,
                py: 1.625,
                borderRadius: 2,
                textTransform: 'none',
                '&:hover': { bgcolor: '#A07830' },
              }}
            >
              جرّب اختبار الفكرة في ٥ دقائق
            </Button>
            <Typography
              component={Link}
              to="/signup"
              sx={{
                fontFamily: FONT,
                fontWeight: 400,
                fontSize: '0.9375rem',
                color: '#D4A653',
                textDecoration: 'none',
                '&:hover': { textDecoration: 'underline' },
              }}
            >
              أو ابدأ البناء الآن ←
            </Typography>
          </Stack>
        </Container>
      </Box>

    </Box>
  );
}
