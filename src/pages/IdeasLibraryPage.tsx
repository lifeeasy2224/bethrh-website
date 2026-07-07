import { useState, useEffect } from 'react';
import { useSEO } from '../hooks/useSEO';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActionArea from '@mui/material/CardActionArea';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Skeleton from '@mui/material/Skeleton';
import Alert from '@mui/material/Alert';
import LinearProgress from '@mui/material/LinearProgress';
import Tooltip from '@mui/material/Tooltip';
import SearchIcon from '@mui/icons-material/Search';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import PeopleOutlinedIcon from '@mui/icons-material/PeopleOutlined';
import TimerOutlinedIcon from '@mui/icons-material/TimerOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import LoginOutlinedIcon from '@mui/icons-material/LoginOutlined';
import { useNavigate } from 'react-router-dom';
import NavBar from '../components/NavBar';
import Footer from '../components/Footer';
import { supabase, type LibraryIdea } from '../supabase';
import { useAuth } from '../contexts/AuthContext';

const ALL_SECTORS = ['All', 'Food & Agriculture', 'B2B SaaS', 'E-commerce', 'Fintech', 'EdTech', 'HealthTech', 'Logistics', 'Services', 'Sustainability'];

// Arabic display names — keys stay English (must match library_ideas.sector)
const SECTOR_AR: Record<string, string> = {
  All: 'كل القطاعات',
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

const DIFFICULTY_AR: Record<string, string> = { easy: 'سهلة', medium: 'متوسطة', hard: 'صعبة' };

const SECTOR_EMOJI: Record<string, string> = {
  'Food & Agriculture': '🌾',
  'B2B SaaS': '💼',
  'E-commerce': '🛒',
  Fintech: '💰',
  EdTech: '📚',
  HealthTech: '🏥',
  Logistics: '🚚',
  Services: '🔧',
  Sustainability: '🌱',
};

const DIFFICULTY_COLOR: Record<string, string> = {
  easy: '#2A8A52',
  medium: '#D4A653',
  hard: '#C0392B',
};

function IdeaCardSkeleton() {
  return (
    <Card>
      <CardContent sx={{ p: 3 }}>
        <Stack direction="row" justifyContent="space-between" sx={{ mb: 2 }}>
          <Skeleton variant="rounded" width={48} height={48} />
          <Skeleton variant="rounded" width={64} height={24} />
        </Stack>
        <Skeleton variant="text" sx={{ fontSize: '1rem', mb: 0.5 }} />
        <Skeleton variant="text" sx={{ fontSize: '0.875rem' }} />
        <Skeleton variant="text" sx={{ fontSize: '0.875rem', mb: 2 }} />
        <Stack direction="row" spacing={1}>
          <Skeleton variant="rounded" width={80} height={22} />
          <Skeleton variant="rounded" width={60} height={22} />
        </Stack>
      </CardContent>
    </Card>
  );
}

function SpotsMeter({ taken, total }: { taken: number; total: number }) {
  const remaining = total - taken;
  const pct = (taken / total) * 100;
  const color = remaining === 0 ? '#C0392B' : remaining === 1 ? '#D4A653' : '#2A8A52';

  return (
    <Tooltip title={`متبقٍ ${remaining} من ${total} مقاعد`} arrow>
      <Box>
        <LinearProgress
          variant="determinate"
          value={pct}
          sx={{
            height: 4,
            borderRadius: 2,
            bgcolor: '#F7F3EC',
            mb: 0.5,
            '& .MuiLinearProgress-bar': { bgcolor: color },
          }}
        />
        <Typography variant="caption" sx={{ color, fontWeight: 600 }}>
          {remaining === 0 ? 'مكتملة' : `متبقٍ ${remaining} ${remaining !== 1 ? 'مقاعد' : 'مقعد'}`}
        </Typography>
      </Box>
    </Tooltip>
  );
}

function IdeaCard({ idea }: { idea: LibraryIdea }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const emoji = idea.emoji || SECTOR_EMOJI[idea.sector] || '💡';
  const remaining = idea.spots_total - idea.spots_taken;

  function handleViewIdea() {
    if (!user) {
      navigate('/login', { state: { from: { pathname: `/ideas-library/${idea.slug}` } } });
      return;
    }
    navigate(`/ideas-library/${idea.slug}`);
  }

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'all 150ms ease',
        '&:hover': { boxShadow: 6, transform: 'translateY(-2px)' },
        opacity: remaining === 0 ? 0.7 : 1,
      }}
    >
      <CardActionArea
        onClick={handleViewIdea}
        sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'stretch' }}
      >
        <CardContent sx={{ flex: 1, p: 3, display: 'flex', flexDirection: 'column' }}>
          <Stack direction="row" alignItems="flex-start" justifyContent="space-between" sx={{ mb: 2 }}>
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: 2,
                bgcolor: 'grey.100',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.5rem',
                flexShrink: 0,
              }}
            >
              {emoji}
            </Box>
            <Stack direction="row" spacing={0.5} alignItems="center">
              {idea.is_featured && (
                <Chip label="مميزة" size="small" color="primary" sx={{ fontWeight: 700, fontSize: '0.7rem' }} />
              )}
              <Chip
                label={DIFFICULTY_AR[idea.difficulty] ?? idea.difficulty}
                size="small"
                sx={{
                  bgcolor: DIFFICULTY_COLOR[idea.difficulty] + '22',
                  color: DIFFICULTY_COLOR[idea.difficulty],
                  fontWeight: 700,
                  fontSize: '0.7rem',
                  textTransform: 'capitalize',
                }}
              />
            </Stack>
          </Stack>

          <Typography variant="subtitle2" sx={{ mb: 0.5, fontWeight: 700, fontSize: '0.9375rem', lineHeight: 1.4 }}>
            {idea.title}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2, lineHeight: 1.6, flex: 1 }}>
            {idea.tagline}
          </Typography>

          <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap', gap: 0.5 }}>
            <Chip
              label={`${SECTOR_EMOJI[idea.sector] ?? ''} ${SECTOR_AR[idea.sector] ?? idea.sector}`}
              size="small"
              variant="outlined"
              sx={{ fontSize: '0.7rem' }}
            />
            <Chip
              icon={<TrendingUpIcon sx={{ fontSize: '0.75rem !important' }} />}
              label={`عائد ${idea.est_roi_min}–${idea.est_roi_max}٪`}
              size="small"
              variant="outlined"
              sx={{ fontSize: '0.7rem' }}
            />
            <Chip
              icon={<TimerOutlinedIcon sx={{ fontSize: '0.75rem !important' }} />}
              label={`الإطلاق خلال ${idea.time_to_launch_weeks} أسبوعاً`}
              size="small"
              variant="outlined"
              sx={{ fontSize: '0.7rem' }}
            />
          </Stack>

          <SpotsMeter taken={idea.spots_taken} total={idea.spots_total} />
        </CardContent>
      </CardActionArea>

      <Box sx={{ px: 3, pb: 2.5 }}>
        {remaining === 0 ? (
          <Button variant="outlined" fullWidth size="small" disabled startIcon={<LockOutlinedIcon />}>
            اكتملت جميع المقاعد
          </Button>
        ) : !user ? (
          <Button
            variant="contained"
            fullWidth
            size="small"
            onClick={handleViewIdea}
            startIcon={<LoginOutlinedIcon />}
          >
            سجّل الدخول للاطلاع
          </Button>
        ) : (
          <Button
            variant="contained"
            fullWidth
            size="small"
            onClick={handleViewIdea}
          >
            اطّلع على الفكرة كاملة ←
          </Button>
        )}
      </Box>
    </Card>
  );
}

export default function IdeasLibraryPage() {
  const [search, setSearch] = useState('');
  const [activeSector, setActiveSector] = useState('All');
  const [ideas, setIdeas] = useState<LibraryIdea[]>([]);
  useSEO({
    title: 'مكتبة أفكار المشاريع — بذرة',
    description: 'تصفّح أفكار مشاريع مدروسة في التقنية المالية والصحية والتعليمية والاستدامة وغيرها. صفِّ حسب القطاع واعثر على فرصتك القادمة.',
    canonicalPath: '/ideas-library',
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadIdeas() {
      try {
        setLoading(true);
        const { data, error: fetchError } = await supabase
          .from('library_ideas')
          .select('*')
          .eq('is_published', true)
          .order('is_featured', { ascending: false })
          .order('created_at', { ascending: true });

        if (fetchError) throw fetchError;
        setIdeas(data ?? []);
      } catch {
        // DEV preview fallback: no backend configured yet — show the seeded
        // Arabic ideas from the migration so the library can be reviewed.
        // import.meta.env.DEV is compile-time false in production builds,
        // so this branch (and the sample data) is stripped from prod.
        if (import.meta.env.DEV) {
          const { SAMPLE_IDEAS } = await import('../dev/sampleIdeas');
          setIdeas(SAMPLE_IDEAS as unknown as LibraryIdea[]);
        } else {
          setError('تعذّر تحميل الأفكار. حاول مرة أخرى.');
        }
      } finally {
        setLoading(false);
      }
    }
    void loadIdeas();
  }, []);

  const filtered = ideas.filter((idea) => {
    const matchesSector = activeSector === 'All' || idea.sector === activeSector;
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      idea.title.toLowerCase().includes(q) ||
      idea.tagline.toLowerCase().includes(q) ||
      idea.tags.some((t) => t.toLowerCase().includes(q));
    return matchesSector && matchesSearch;
  });

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <NavBar />

      {/* Hero */}
      <Box
        sx={{
          pt: { xs: 10, md: 12 },
          pb: 7,
          bgcolor: '#0F3D24',
          textAlign: 'center',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
        }}
      >
        <Container maxWidth="md">
          <Chip
            label="أفكار جديدة كل أسبوع"
            size="small"
            sx={{ mb: 2, bgcolor: '#D4A653', color: '#0F3D24', fontWeight: 700 }}
          />
          <Typography variant="h1" sx={{ mb: 2, fontSize: { xs: '2rem', md: '2.75rem' }, color: 'white', fontFamily: '"Noto Kufi Arabic", "Nunito Sans", sans-serif', fontWeight: 800 }}>
            مكتبة الأفكار
          </Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.65)', mb: 4, fontSize: '1.1rem', maxWidth: 560, mx: 'auto' }}>
            أكثر من {ideas.length > 0 ? ideas.length : '٢٠'} فكرة مشروع مدروسة مسبقاً مع بيانات مالية وسوقية وخطط إطلاق خطوة بخطوة. احجز فكرتك واجعلها ملكك.
          </Typography>

          <Stack direction="row" spacing={3} justifyContent="center" sx={{ mb: 4, flexWrap: 'wrap', gap: 2 }}>
            {[
              { icon: <TrendingUpIcon fontSize="small" />, label: 'توقعات العائد مشمولة' },
              { icon: <PeopleOutlinedIcon fontSize="small" />, label: 'حد أقصى ٣ روّاد لكل فكرة' },
              { icon: <TimerOutlinedIcon fontSize="small" />, label: 'جاهزة للإطلاق خلال أسابيع' },
            ].map(({ icon, label }) => (
              <Stack key={label} direction="row" spacing={0.75} alignItems="center">
                <Box sx={{ color: '#D4A653' }}>{icon}</Box>
                <Typography variant="body2" fontWeight={600} sx={{ color: 'rgba(255,255,255,0.70)' }}>
                  {label}
                </Typography>
              </Stack>
            ))}
          </Stack>

          <TextField
            placeholder="ابحث عن أفكار أو قطاعات أو كلمات مفتاحية…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            fullWidth
            sx={{
              maxWidth: 520,
              borderRadius: 2,
              '& .MuiOutlinedInput-root': {
                bgcolor: 'rgba(255,255,255,0.07)',
                borderRadius: 2,
                '& fieldset': { borderColor: 'rgba(255,255,255,0.18)' },
                '&:hover fieldset': { borderColor: 'rgba(212,166,83,0.50)' },
                '&.Mui-focused fieldset': { borderColor: '#D4A653' },
                '& input': { color: 'white' },
                '& input::placeholder': { color: 'rgba(255,255,255,0.40)', opacity: 1 },
              },
            }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: 'rgba(255,255,255,0.40)' }} />
                  </InputAdornment>
                ),
              },
            }}
          />
        </Container>
      </Box>

      <Box sx={{ py: 6, flex: 1 }}>
        <Container maxWidth="lg">
          {/* Sector filter */}
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 4 }}>
            {ALL_SECTORS.map((s) => (
              <Chip
                key={s}
                label={s === 'All' ? SECTOR_AR.All : `${SECTOR_EMOJI[s] ?? ''} ${SECTOR_AR[s] ?? s}`}
                onClick={() => setActiveSector(s)}
                sx={{
                  cursor: 'pointer',
                  bgcolor: activeSector === s ? 'primary.main' : 'grey.100',
                  color: activeSector === s ? 'white' : 'text.secondary',
                  fontWeight: activeSector === s ? 700 : 500,
                  '&:hover': { bgcolor: activeSector === s ? 'primary.dark' : 'grey.200' },
                }}
              />
            ))}
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {loading ? (
            <Grid container spacing={3}>
              {Array.from({ length: 6 }).map((_, i) => (
                <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={i}>
                  <IdeaCardSkeleton />
                </Grid>
              ))}
            </Grid>
          ) : filtered.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 10 }}>
              <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                لا توجد أفكار مطابقة
              </Typography>
              <Typography variant="body2" color="text.secondary">
                جرّب كلمة بحث مختلفة أو قطاعاً آخر.
              </Typography>
            </Box>
          ) : (
            <Grid container spacing={3}>
              {filtered.map((idea) => (
                <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={idea.id}>
                  <IdeaCard idea={idea} />
                </Grid>
              ))}
            </Grid>
          )}
        </Container>
      </Box>

      <Footer />
    </Box>
  );
}
