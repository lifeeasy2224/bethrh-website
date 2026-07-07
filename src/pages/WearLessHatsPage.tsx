import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import { Link } from 'react-router-dom';

const FONT = '"Noto Kufi Arabic", "Nunito Sans", sans-serif';

const HOW_IT_WORKS = [
  {
    emoji: '📍',
    title: 'أخبرنا عن مرحلتك',
    desc: 'أين أنت الآن؟ فكرة، تحقق، بناء، أم بيع؟',
  },
  {
    emoji: '📋',
    title: 'احصل على مهامك الأسبوعية',
    desc: 'الذكاء الاصطناعي يولّد ٢-٣ مهام ذات أولوية لهذا الأسبوع فقط',
  },
  {
    emoji: '🚫',
    title: 'اعرف ما تتجاوزه',
    desc: 'إرشاد واضح لما تفوّضه أو تؤجّله أو تتجاهله',
  },
];

const FOCUS_ITEMS = [
  { type: 'do',    icon: '✅', text: 'قابل ٥ عملاء محتملين واسألهم عن أكبر مشكلة تواجههم' },
  { type: 'do',    icon: '✅', text: 'صُغ عرض قيمتك في جملة واحدة' },
  { type: 'defer', icon: '⏸️', text: 'أجّل: تصميم الشعار — لا تحتاجه قبل التحقق' },
  { type: 'defer', icon: '⏸️', text: 'أجّل: تسجيل الشركة — بعد أول عملية بيع' },
  { type: 'skip',  icon: '🚫', text: 'تجاوز: بناء موقع كامل — تكفيك صفحة هبوط' },
  { type: 'skip',  icon: '🚫', text: 'تجاوز: استراتيجية السوشال ميديا — ركّز على التواصل المباشر' },
];

export default function WearLessHatsPage() {
  return (
    <Box sx={{ bgcolor: '#0F3D24', minHeight: '100vh' }}>

      {/* Hero */}
      <Box sx={{ py: { xs: 10, md: 14 }, textAlign: 'center' }}>
        <Container maxWidth="md">
          <Typography sx={{
            fontFamily: FONT,
            fontWeight: 900,
            fontSize: { xs: '2.25rem', sm: '3rem', md: '3.5rem' },
            color: 'white',
            lineHeight: 1.1,
            mb: 3,
            letterSpacing: '-0.02em',
          }}>
            توقف عن لبس كل القبعات
          </Typography>
          <Typography sx={{
            fontFamily: FONT,
            fontWeight: 400,
            fontSize: { xs: '1rem', md: '1.125rem' },
            color: 'rgba(255,255,255,0.80)',
            lineHeight: 1.7,
            maxWidth: 700,
            mx: 'auto',
            mb: 5,
          }}>
            ٦١٪ من الروّاد الأفراد يقولون إن إدارة كل شيء وحدهم أصعب مما توقعوا.
            بذرة تخبرك بالضبط بما تركّز عليه هذا الأسبوع — وما تتجاوزه.
          </Typography>
          <Button
            component={Link}
            to="/signup"
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
            احصل على خطة تركيزي الأسبوعية
          </Button>
        </Container>
      </Box>

      {/* How It Works */}
      <Box sx={{ py: { xs: 8, md: 10 }, bgcolor: 'rgba(0,0,0,0.15)' }}>
        <Container maxWidth="lg">
          <Typography sx={{
            fontFamily: FONT,
            fontWeight: 700,
            fontSize: { xs: '1.5rem', md: '1.875rem' },
            color: 'white',
            textAlign: 'center',
            mb: 6,
          }}>
            كيف تعمل
          </Typography>
          <Grid container spacing={3}>
            {HOW_IT_WORKS.map((card) => (
              <Grid key={card.title} size={{ xs: 12, sm: 4 }}>
                <Box sx={{
                  bgcolor: '#1B6B3E',
                  borderRadius: '12px',
                  p: 3,
                  height: '100%',
                }}>
                  <Typography sx={{ fontSize: '2rem', mb: 1.5 }}>{card.emoji}</Typography>
                  <Typography sx={{
                    fontFamily: FONT,
                    fontWeight: 700,
                    fontSize: '1.0625rem',
                    color: 'white',
                    mb: 1,
                  }}>
                    {card.title}
                  </Typography>
                  <Typography sx={{
                    fontFamily: FONT,
                    fontWeight: 400,
                    fontSize: '0.9375rem',
                    color: 'rgba(255,255,255,0.75)',
                    lineHeight: 1.6,
                  }}>
                    {card.desc}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Sample Output */}
      <Box sx={{ py: { xs: 8, md: 10 } }}>
        <Container maxWidth="sm">
          <Typography sx={{
            fontFamily: FONT,
            fontWeight: 700,
            fontSize: { xs: '1.375rem', md: '1.625rem' },
            color: 'white',
            textAlign: 'center',
            mb: 4,
          }}>
            شاهدها عملياً
          </Typography>
          <Box sx={{
            bgcolor: '#0F3D24',
            borderTop: '3px solid #D4A653',
            borderRadius: '16px',
            p: 3,
          }}>
            <Typography sx={{
              fontFamily: FONT,
              fontWeight: 700,
              fontSize: '1.125rem',
              color: '#D4A653',
              mb: 2.5,
            }}>
              تركيزك للأسبوع الثالث
            </Typography>
            <Stack spacing={1.5}>
              {FOCUS_ITEMS.map((item, i) => (
                <Box key={i} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                  <Box component="span" sx={{ fontSize: '1rem', mt: '1px', flexShrink: 0 }}>
                    {item.icon}
                  </Box>
                  <Typography sx={{
                    fontFamily: FONT,
                    fontWeight: 400,
                    fontSize: '0.9375rem',
                    lineHeight: 1.5,
                    color: item.type === 'do'
                      ? 'rgba(255,255,255,0.92)'
                      : item.type === 'defer'
                        ? 'rgba(255,255,255,0.60)'
                        : 'rgba(255,255,255,0.40)',
                  }}>
                    {item.text}
                  </Typography>
                </Box>
              ))}
            </Stack>
          </Box>
        </Container>
      </Box>

      {/* Stat Section */}
      <Box sx={{ py: { xs: 6, md: 8 }, bgcolor: 'rgba(0,0,0,0.15)', textAlign: 'center' }}>
        <Container maxWidth="md">
          <Typography sx={{
            fontFamily: FONT,
            fontWeight: 400,
            fontSize: { xs: '1rem', md: '1.125rem' },
            color: 'rgba(255,255,255,0.60)',
            mb: 1.5,
          }}>
            معظم الأدوات تعطيك قائمة مهام من ٤٧ بنداً.
          </Typography>
          <Typography sx={{
            fontFamily: FONT,
            fontWeight: 700,
            fontSize: { xs: '1.25rem', md: '1.5rem' },
            color: 'white',
          }}>
            بذرة تعطيك ٢-٣ أشياء تُحدث فرقاً حقيقياً.
          </Typography>
        </Container>
      </Box>

      {/* Bottom CTA */}
      <Box sx={{ py: { xs: 10, md: 12 }, textAlign: 'center' }}>
        <Container maxWidth="sm">
          <Typography sx={{
            fontFamily: FONT,
            fontWeight: 700,
            fontSize: { xs: '1.5rem', md: '2rem' },
            color: 'white',
            mb: 4,
          }}>
            جاهز للتركيز على ما يهم فعلاً؟
          </Typography>
          <Button
            component={Link}
            to="/signup"
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
            ابدأ البناء ←
          </Button>
        </Container>
      </Box>

    </Box>
  );
}
