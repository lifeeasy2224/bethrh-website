import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid';
import { supabase } from '../supabase';

interface Testimonial {
  id: string;
  quote: string;
  display_name: string;
  role: string;
  city: string | null;
  avatar_url: string | null;
  sort_order: number;
}

// Public homepage testimonials. Reads ONLY published rows from the
// `testimonials` table (RLS: public_read_published_testimonials). No hardcoded
// personas — every testimonial shown here is real content an admin curated and
// published. If nothing is published yet, we show an honest invitation instead
// of fabricated social proof (§1e anti-fabrication).
export default function TestimonialsSection() {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    supabase
      .from('testimonials')
      .select('id,quote,display_name,role,city,avatar_url,sort_order')
      .eq('is_published', true)
      .order('sort_order', { ascending: true })
      .then(({ data, error }) => {
        if (!active) return;
        if (error) console.error('Failed to fetch testimonials:', error.message);
        setTestimonials((data as Testimonial[]) ?? []);
        setLoading(false);
      });
    return () => { active = false; };
  }, []);

  // While loading, render nothing to avoid a layout flash on the landing page.
  if (loading) return null;

  // No published testimonials → honest placeholder, never fabricated quotes.
  if (testimonials.length === 0) {
    return (
      <Box sx={{ py: { xs: 8, md: 10 }, bgcolor: 'grey.50' }}>
        <Container maxWidth="md">
          <Typography variant="h2" fontWeight={800} textAlign="center" sx={{ mb: 2 }}>
            كن من أوائل روّاد الأعمال الذين يستخدمون بذرة
          </Typography>
          <Typography variant="body1" color="text.secondary" textAlign="center">
            شارك تجربتك وساعد الآخرين على النجاح
          </Typography>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ py: { xs: 8, md: 10 }, bgcolor: 'grey.50' }}>
      <Container maxWidth="lg">
        <Typography variant="h2" fontWeight={800} textAlign="center" sx={{ mb: 6 }}>
          ماذا يقول روّاد الأعمال
        </Typography>
        <Grid container spacing={3}>
          {testimonials.map(t => (
            <Grid size={{ xs: 12, md: 4 }} key={t.id}>
              <Card sx={{ height: '100%', boxShadow: 2 }}>
                <CardContent sx={{ p: 4 }}>
                  <Typography
                    variant="body1"
                    sx={{ fontStyle: 'italic', lineHeight: 1.75, color: 'text.secondary', mb: 3, fontSize: '1.0625rem' }}
                  >
                    "{t.quote}"
                  </Typography>
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <Box
                      sx={{
                        width: 40, height: 40, borderRadius: '50%', flexShrink: 0,
                        background: t.avatar_url ? undefined : 'linear-gradient(135deg, #1B6B3E, #D4A653)',
                        backgroundImage: t.avatar_url ? `url(${t.avatar_url})` : undefined,
                        backgroundSize: 'cover', backgroundPosition: 'center',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'white', fontWeight: 700,
                      }}
                    >
                      {t.avatar_url ? '' : t.display_name.charAt(0)}
                    </Box>
                    <Box>
                      <Typography variant="body2" fontWeight={700}>{t.display_name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {t.role}{t.city ? ` — ${t.city}` : ''}
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}
