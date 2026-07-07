import { useState } from 'react';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';

const FONT = '"Noto Kufi Arabic", "Nunito Sans", sans-serif';

const TABS = ['الكل', 'التحقق', 'المشاريع الجانبية', 'أول إيراد', 'نصائح للروّاد الأفراد', 'قصص المؤسسين'];

const ARTICLES = [
  {
    title: 'كيف تتحقق من فكرة مشروعك الجانبي في ٥ دقائق',
    category: 'التحقق',
    readTime: '٤ د',
    icon: '💡',
  },
  {
    title: 'خطة العمل الوحيدة التي يحتاجها رائد الأعمال الفرد فعلاً',
    category: 'نصائح للروّاد الأفراد',
    readTime: '٦ د',
    icon: '📋',
  },
  {
    title: 'من مشروع جانبي إلى تفرغ كامل: متى تقفز؟',
    category: 'المشاريع الجانبية',
    readTime: '٥ د',
    icon: '🚀',
  },
  {
    title: 'كسبت أول دولار في ٤٨ ساعة — إليك كيف',
    category: 'قصص المؤسسين',
    readTime: '٣ د',
    icon: '💰',
  },
  {
    title: 'دليل برامج دعم روّاد الأعمال في الخليج (٢٠٢٦)',
    category: 'نصائح للروّاد الأفراد',
    readTime: '٧ د',
    icon: '🏛️',
  },
  {
    title: 'كيف تحصل على أول عميل يدفع لك هذا الأسبوع',
    category: 'أول إيراد',
    readTime: '٥ د',
    icon: '🤝',
  },
  {
    title: 'من موظف إلى رائد أعمال: دليل خطوة بخطوة',
    category: 'المشاريع الجانبية',
    readTime: '٦ د',
    icon: '🔄',
  },
  {
    title: 'لماذا لا تحتاج خطة عمل من ٤٠ صفحة',
    category: 'التحقق',
    readTime: '٤ د',
    icon: '📝',
  },
];

function ArticleCard({ article }: { article: typeof ARTICLES[number] }) {
  return (
    <Box
      component="a"
      href="#"
      sx={{
        display: 'block',
        textDecoration: 'none',
        bgcolor: '#0F3D24',
        borderRadius: '12px',
        overflow: 'hidden',
        border: '1px solid transparent',
        transition: 'transform 200ms ease, border-color 200ms ease, box-shadow 200ms ease',
        '&:hover': {
          transform: 'translateY(-4px)',
          borderColor: 'rgba(212,166,83,0.50)',
          boxShadow: '0 8px 24px rgba(212,166,83,0.10)',
        },
      }}
    >
      {/* Thumbnail */}
      <Box sx={{
        height: 200,
        bgcolor: '#0F3D24',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <Typography sx={{ fontSize: '3rem', lineHeight: 1 }}>{article.icon}</Typography>
      </Box>

      {/* Content */}
      <Box sx={{ p: 2.5 }}>
        {/* Category badge */}
        <Box sx={{
          display: 'inline-block',
          bgcolor: 'rgba(212,166,83,0.15)',
          border: '1px solid rgba(212,166,83,0.35)',
          borderRadius: '100px',
          px: 1.25,
          py: 0.25,
          mb: 1.5,
        }}>
          <Typography sx={{
            fontFamily: FONT,
            fontWeight: 700,
            fontSize: '0.6875rem',
            color: '#D4A653',
            textTransform: 'uppercase',
            letterSpacing: '0.07em',
            lineHeight: 1,
          }}>
            {article.category}
          </Typography>
        </Box>

        {/* Title */}
        <Typography sx={{
          fontFamily: FONT,
          fontWeight: 700,
          fontSize: '1rem',
          color: 'white',
          lineHeight: 1.45,
          mb: 1.5,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}>
          {article.title}
        </Typography>

        {/* Read time */}
        <Typography sx={{
          fontFamily: FONT,
          fontWeight: 300,
          fontSize: '0.75rem',
          color: 'rgba(255,255,255,0.50)',
        }}>
          {article.readTime} قراءة
        </Typography>
      </Box>
    </Box>
  );
}

export default function BlogPage() {
  const [activeTab, setActiveTab] = useState('الكل');
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const visible = activeTab === 'الكل'
    ? ARTICLES
    : ARTICLES.filter(a => a.category === activeTab);

  function handleSubscribe() {
    if (email.trim()) {
      setSubscribed(true);
      setEmail('');
    }
  }

  return (
    <Box sx={{ bgcolor: '#0F3D24', minHeight: '100vh' }}>

      {/* Header */}
      <Box sx={{ pt: { xs: 10, md: 14 }, pb: { xs: 5, md: 7 }, textAlign: 'center' }}>
        <Container maxWidth="md">
          <Typography sx={{
            fontFamily: FONT,
            fontWeight: 900,
            fontSize: { xs: '2rem', md: '2.5rem' },
            color: 'white',
            lineHeight: 1.1,
            letterSpacing: '-0.02em',
            mb: 1.5,
          }}>
            مدونة أول دولار
          </Typography>
          <Typography sx={{
            fontFamily: FONT,
            fontWeight: 400,
            fontSize: { xs: '1rem', md: '1.0625rem' },
            color: 'rgba(255,255,255,0.70)',
            lineHeight: 1.6,
          }}>
            أدلة عملية لروّاد يسعون خلف أول دولار. بلا حشو.
          </Typography>
        </Container>
      </Box>

      {/* Filter Tabs */}
      <Box sx={{ mb: { xs: 4, md: 5 } }}>
        <Container maxWidth="lg">
          <Box sx={{
            borderBottom: '1px solid rgba(255,255,255,0.10)',
            overflowX: 'auto',
            WebkitOverflowScrolling: 'touch',
            '&::-webkit-scrollbar': { display: 'none' },
          }}>
            <Stack direction="row" sx={{ width: 'max-content', minWidth: '100%' }}>
              {TABS.map(tab => (
                <Box
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  sx={{
                    px: { xs: 2, md: 2.5 },
                    pb: 1.5,
                    cursor: 'pointer',
                    borderBottom: activeTab === tab ? '2px solid #D4A653' : '2px solid transparent',
                    mb: '-1px',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <Typography sx={{
                    fontFamily: FONT,
                    fontWeight: activeTab === tab ? 700 : 400,
                    fontSize: '0.875rem',
                    color: activeTab === tab ? '#D4A653' : 'rgba(255,255,255,0.65)',
                    transition: 'color 150ms ease',
                  }}>
                    {tab}
                  </Typography>
                </Box>
              ))}
            </Stack>
          </Box>
        </Container>
      </Box>

      {/* Article Grid */}
      <Box sx={{ pb: { xs: 8, md: 10 } }}>
        <Container maxWidth="lg">
          {visible.length > 0 ? (
            <Grid container spacing={3}>
              {visible.map((article) => (
                <Grid key={article.title} size={{ xs: 12, sm: 6, md: 4 }}>
                  <ArticleCard article={article} />
                </Grid>
              ))}
            </Grid>
          ) : (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Typography sx={{
                fontFamily: FONT,
                fontWeight: 400,
                fontSize: '1rem',
                color: 'rgba(255,255,255,0.50)',
              }}>
                مقالات أكثر في هذا التصنيف قريباً.
              </Typography>
            </Box>
          )}
        </Container>
      </Box>

      {/* Bottom */}
      <Box sx={{ py: { xs: 8, md: 10 }, bgcolor: 'rgba(0,0,0,0.15)', textAlign: 'center' }}>
        <Container maxWidth="sm">
          <Typography sx={{
            fontFamily: FONT,
            fontWeight: 400,
            fontSize: '0.9375rem',
            color: 'rgba(255,255,255,0.60)',
            mb: 5,
          }}>
            مقالات جديدة كل أسبوع.
          </Typography>

          <Typography sx={{
            fontFamily: FONT,
            fontWeight: 700,
            fontSize: { xs: '1.25rem', md: '1.5rem' },
            color: 'white',
            mb: 3,
          }}>
            نصائح ريادية إلى بريدك مباشرة
          </Typography>

          {subscribed ? (
            <Typography sx={{
              fontFamily: FONT,
              fontWeight: 700,
              fontSize: '1rem',
              color: '#D4A653',
            }}>
              تم! تفقّد بريدك لأول نصيحة.
            </Typography>
          ) : (
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={1.5}
              alignItems="stretch"
            >
              <TextField
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSubscribe()}
                placeholder="بريدك@الإلكتروني.com"
                variant="outlined"
                size="small"
                fullWidth
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Typography sx={{ fontSize: '1rem' }}>✉️</Typography>
                    </InputAdornment>
                  ),
                }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    bgcolor: '#1B6B3E',
                    borderRadius: 2,
                    fontFamily: FONT,
                    fontSize: '0.9375rem',
                    color: 'white',
                    '& fieldset': { borderColor: 'rgba(255,255,255,0.18)' },
                    '&:hover fieldset': { borderColor: 'rgba(212,166,83,0.50)' },
                    '&.Mui-focused fieldset': { borderColor: '#D4A653' },
                  },
                  '& input::placeholder': { color: 'rgba(255,255,255,0.40)' },
                  '& input': { color: 'white', fontFamily: FONT },
                }}
              />
              <Button
                onClick={handleSubscribe}
                variant="contained"
                sx={{
                  bgcolor: '#D4A653',
                  color: '#0F3D24',
                  fontFamily: FONT,
                  fontWeight: 700,
                  fontSize: '0.9375rem',
                  px: 3,
                  py: 1,
                  borderRadius: 2,
                  textTransform: 'none',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  '&:hover': { bgcolor: '#A07830' },
                }}
              >
                اشترك
              </Button>
            </Stack>
          )}
        </Container>
      </Box>

    </Box>
  );
}
