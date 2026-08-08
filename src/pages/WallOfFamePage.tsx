import { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import { Link } from 'react-router-dom';
import { supabase } from '../supabase';

const FONT = '"Noto Kufi Arabic", "Nunito Sans", sans-serif';

const TABS = ['الكل', 'المشاريع الجانبية', 'مغيّرو المسار', 'روّاد بلا واسطة'];

const TAB_FILTER: Record<string, string[]> = {
  'المشاريع الجانبية': ['مشروع جانبي'],
  'مغيّرو المسار': ['مغيّر مسار', 'مغيّرة مسار'],
  'روّاد بلا واسطة': ['رائدة بلا واسطة', 'رائد بلا واسطة'],
};

// Real founder stories are loaded from the DB (public.success_stories, published
// only). Every stat, the featured story, and the founder grid render ONLY when
// genuine entries exist — no fabricated founders, counts, or timelines.
interface Story {
  id: string;
  name: string;
  idea: string;
  category: string | null;
  days_to_first_dollar: number | null;
  quote: string | null;
  role: string | null;
  is_featured: boolean;
}

function Avatar({ size, initials }: { size: number; initials: string }) {
  return (
    <Box sx={{
      width: size,
      height: size,
      borderRadius: '50%',
      border: '3px solid #D4A653',
      bgcolor: '#1B6B3E',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    }}>
      <Typography sx={{
        fontFamily: FONT,
        fontWeight: 700,
        fontSize: size * 0.3,
        color: '#D4A653',
        lineHeight: 1,
      }}>
        {initials}
      </Typography>
    </Box>
  );
}

function GoldPill({ label }: { label: string }) {
  return (
    <Box sx={{
      display: 'inline-block',
      bgcolor: 'rgba(212,166,83,0.15)',
      border: '1px solid #D4A653',
      borderRadius: '100px',
      px: 1.25,
      py: 0.375,
    }}>
      <Typography sx={{
        fontFamily: FONT,
        fontWeight: 700,
        fontSize: '0.6875rem',
        color: '#D4A653',
        lineHeight: 1,
      }}>
        {label}
      </Typography>
    </Box>
  );
}

function OutlinedPill({ label }: { label: string }) {
  return (
    <Box sx={{
      display: 'inline-block',
      border: '1px solid rgba(255,255,255,0.35)',
      borderRadius: '100px',
      px: 1.25,
      py: 0.375,
    }}>
      <Typography sx={{
        fontFamily: FONT,
        fontWeight: 400,
        fontSize: '0.6875rem',
        color: 'rgba(255,255,255,0.75)',
        lineHeight: 1,
      }}>
        {label}
      </Typography>
    </Box>
  );
}

function initialsOf(name: string) {
  return name.split(' ').map(p => p[0]).filter(Boolean).join('').slice(0, 3);
}

export default function WallOfFamePage() {
  const [activeTab, setActiveTab] = useState('الكل');
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    supabase
      .from('success_stories')
      .select('id, name, idea, category, days_to_first_dollar, quote, role, is_featured')
      .eq('is_published', true)
      .order('sort_order', { ascending: true })
      .then(({ data, error }) => {
        if (error) console.error('Failed to fetch success stories:', error);
        if (active) {
          setStories((data as Story[]) ?? []);
          setLoading(false);
        }
      });
    return () => { active = false; };
  }, []);

  const hasStories = stories.length > 0;
  const featured = stories.find(s => s.is_featured) ?? null;
  // The grid shows every non-featured story (the featured one has its own block).
  const gridStories = stories.filter(s => s.id !== featured?.id);
  const visible = gridStories.filter(f =>
    activeTab === 'الكل' || (f.category ? TAB_FILTER[activeTab]?.includes(f.category) : false)
  );

  // Aggregate stats are computed from real rows only — never hardcoded.
  const dayValues = stories.map(s => s.days_to_first_dollar).filter((d): d is number => typeof d === 'number');
  const avgDays = dayValues.length > 0
    ? Math.round(dayValues.reduce((a, b) => a + b, 0) / dayValues.length)
    : null;

  return (
    <Box sx={{ bgcolor: '#0F3D24', minHeight: '100vh' }}>

      {/* Hero */}
      <Box sx={{ pt: { xs: 10, md: 14 }, pb: { xs: 6, md: 8 }, textAlign: 'center' }}>
        <Container maxWidth="md">
          <Typography sx={{
            fontFamily: FONT,
            fontWeight: 900,
            fontSize: { xs: '2rem', sm: '2.625rem', md: '3rem' },
            color: 'white',
            lineHeight: 1.1,
            mb: 2,
            letterSpacing: '-0.02em',
          }}>
            لوحة شرف أول دولار 🏆
          </Typography>
          <Typography sx={{
            fontFamily: FONT,
            fontWeight: 400,
            fontSize: { xs: '1rem', md: '1.125rem' },
            color: 'rgba(255,255,255,0.80)',
            mb: 3,
            lineHeight: 1.7,
          }}>
            روّاد حقيقيون. مبيعات أولى حقيقية. دليل حقيقي أن الأفكار تتحول إلى دخل.
          </Typography>
          {hasStories && (
            <Typography sx={{
              fontFamily: FONT,
              fontWeight: 700,
              fontSize: { xs: '1rem', md: '1.125rem' },
              color: '#D4A653',
            }}>
              {stories.length} رائد أعمال {stories.length === 1 ? 'كسب' : 'كسبوا'} أول دولار له مع بذرة
            </Typography>
          )}
        </Container>
      </Box>

      {/* Featured Story — only when a real featured entry exists */}
      {featured && (
        <Box sx={{ pb: { xs: 6, md: 8 } }}>
          <Container maxWidth="md">
            <Box sx={{
              bgcolor: '#0F3D24',
              borderRadius: '16px',
              p: { xs: 3, md: 4 },
              display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' },
              alignItems: { sm: 'flex-start' },
              gap: 3,
            }}>
              <Avatar size={80} initials={initialsOf(featured.name)} />
              <Box>
                {featured.quote && (
                  <Typography sx={{
                    fontFamily: FONT,
                    fontWeight: 400,
                    fontStyle: 'italic',
                    fontSize: '1rem',
                    color: 'white',
                    lineHeight: 1.7,
                    mb: 2,
                  }}>
                    «{featured.quote}»
                  </Typography>
                )}
                <Stack direction="row" alignItems="center" spacing={1.5} flexWrap="wrap" gap={1}>
                  <Typography sx={{
                    fontFamily: FONT,
                    fontWeight: 700,
                    fontSize: '0.9375rem',
                    color: 'white',
                  }}>
                    {featured.name}
                  </Typography>
                  {featured.role && (
                    <Typography sx={{
                      fontFamily: FONT,
                      fontWeight: 300,
                      fontSize: '0.875rem',
                      color: '#D4A653',
                    }}>
                      {featured.role}
                    </Typography>
                  )}
                  {featured.days_to_first_dollar != null && (
                    <GoldPill label={`أول دولار في ${featured.days_to_first_dollar} أيام`} />
                  )}
                </Stack>
              </Box>
            </Box>
          </Container>
        </Box>
      )}

      {/* Filter Tabs + Founder Grid — only when real stories exist */}
      {!loading && hasStories ? (
        <>
          <Box sx={{ pb: { xs: 4, md: 5 } }}>
            <Container maxWidth="lg">
              <Stack direction="row" spacing={0} sx={{ borderBottom: '1px solid rgba(255,255,255,0.12)', overflowX: 'auto', pb: 0 }}>
                {TABS.map(tab => (
                  <Box
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    sx={{
                      px: 2.5,
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
                      fontSize: '0.9375rem',
                      color: activeTab === tab ? '#D4A653' : 'rgba(255,255,255,0.60)',
                      transition: 'color 150ms ease',
                    }}>
                      {tab}
                    </Typography>
                  </Box>
                ))}
              </Stack>
            </Container>
          </Box>

          <Box sx={{ pb: { xs: 8, md: 10 } }}>
            <Container maxWidth="lg">
              <Grid container spacing={3}>
                {visible.map((f) => (
                  <Grid key={f.id} size={{ xs: 12, sm: 6, md: 4 }}>
                    <Box sx={{
                      bgcolor: '#1B6B3E',
                      borderRadius: '12px',
                      p: 3,
                      height: '100%',
                      transition: 'box-shadow 200ms ease, transform 200ms ease',
                      '&:hover': {
                        boxShadow: '0 0 0 1px rgba(212,166,83,0.35), 0 8px 24px rgba(212,166,83,0.12)',
                        transform: 'translateY(-2px)',
                      },
                    }}>
                      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 1.75 }}>
                        <Avatar size={48} initials={initialsOf(f.name)} />
                        <Box>
                          <Typography sx={{
                            fontFamily: FONT,
                            fontWeight: 700,
                            fontSize: '1rem',
                            color: 'white',
                            lineHeight: 1.3,
                          }}>
                            {f.name}
                          </Typography>
                        </Box>
                      </Stack>
                      <Typography sx={{
                        fontFamily: FONT,
                        fontWeight: 400,
                        fontSize: '0.875rem',
                        color: 'rgba(255,255,255,0.70)',
                        mb: 2,
                        lineHeight: 1.5,
                      }}>
                        {f.idea}
                      </Typography>
                      <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                        {f.days_to_first_dollar != null && <GoldPill label={`أول دولار في ${f.days_to_first_dollar} أيام`} />}
                        {f.category && <OutlinedPill label={f.category} />}
                      </Stack>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Container>
          </Box>
        </>
      ) : !loading && (
        /* Honest empty state — no fabricated proof; invites the first real founder */
        <Box sx={{ pb: { xs: 8, md: 10 } }}>
          <Container maxWidth="sm">
            <Box sx={{
              bgcolor: '#1B6B3E',
              borderRadius: '16px',
              p: { xs: 4, md: 5 },
              textAlign: 'center',
              border: '1px dashed rgba(212,166,83,0.35)',
            }}>
              <Typography sx={{
                fontFamily: FONT, fontWeight: 700, fontSize: '1.125rem', color: 'white', mb: 1.5,
              }}>
                الجدار بانتظار أول اسم
              </Typography>
              <Typography sx={{
                fontFamily: FONT, fontWeight: 400, fontSize: '0.9375rem',
                color: 'rgba(255,255,255,0.70)', lineHeight: 1.7,
              }}>
                كن أول رائد أعمال يصل إلى أول دولار مع بذرة — وقد يكون اسمك هنا.
              </Typography>
            </Box>
          </Container>
        </Box>
      )}

      {/* Bottom CTA */}
      <Box sx={{ py: { xs: 10, md: 12 }, bgcolor: 'rgba(0,0,0,0.15)', textAlign: 'center' }}>
        <Container maxWidth="sm">
          <Typography sx={{
            fontFamily: FONT,
            fontWeight: 700,
            fontSize: { xs: '1.375rem', md: '1.625rem' },
            color: 'white',
            mb: 1.5,
          }}>
            تريد أن ترى اسمك هنا؟
          </Typography>
          {avgDays != null && (
            <Typography sx={{
              fontFamily: FONT,
              fontWeight: 400,
              fontSize: '1rem',
              color: 'rgba(255,255,255,0.70)',
              mb: 4,
              lineHeight: 1.7,
            }}>
              روّاد بذرة على هذا الجدار كسبوا أول دولار خلال {avgDays} يوماً في المتوسط.
            </Typography>
          )}
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
              mt: avgDays != null ? 0 : 2,
            }}
          >
            ابدأ رحلتك
          </Button>
        </Container>
      </Box>

    </Box>
  );
}
