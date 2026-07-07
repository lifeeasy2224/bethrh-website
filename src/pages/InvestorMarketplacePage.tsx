import { useState } from 'react';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import SearchIcon from '@mui/icons-material/Search';
import TuneIcon from '@mui/icons-material/Tune';
import { Link } from 'react-router-dom';
import NavBar from '../components/NavBar';
import Footer from '../components/Footer';
import { IQScoreBadge, SectorChip } from '../components/IQScore';

const SECTOR_EMOJIS: Record<string, string> = {
  'Food & Agriculture': '🌾', 'B2B SaaS': '💻', 'E-commerce': '🛒',
  'Fintech': '💳', 'EdTech': '📚', 'HealthTech': '🏥', 'Logistics': '🚚', 'Services': '🤝',
};

const MARKETPLACE_IDEAS = [
  { id: '1', title: 'AI-Powered Farm Management SaaS', sector: 'Food & Agriculture', score: 87, stage: 'ready', founder: 'Sarah K.', location: 'Phoenix, AZ', seeking: '$150K', desc: 'Automate crop monitoring and yield prediction for small to mid-size farms.' },
  { id: '2', title: 'HR Compliance Automation Platform', sector: 'B2B SaaS', score: 83, stage: 'ready', founder: 'James R.', location: 'Austin, TX', seeking: '$250K', desc: 'Automate HR policy updates and audit trails for growing SMBs.' },
  { id: '3', title: 'Telemedicine for Rural Communities', sector: 'HealthTech', score: 82, stage: 'ready', founder: 'Priya M.', location: 'Denver, CO', seeking: '$500K', desc: 'Affordable video consultations and prescriptions for underserved rural areas.' },
  { id: '4', title: 'B2B Supply Chain Visibility Platform', sector: 'Logistics', score: 74, stage: 'growing', founder: 'Marcus T.', location: 'Chicago, IL', seeking: '$200K', desc: 'Real-time multi-vendor supply chain tracking and analytics.' },
  { id: '5', title: 'Construction Project Management SaaS', sector: 'B2B SaaS', score: 79, stage: 'growing', founder: 'Derek L.', location: 'Dallas, TX', seeking: '$100K', desc: 'End-to-end project management built for construction firms.' },
  { id: '6', title: 'Micro-Investment App for Gen Z', sector: 'Fintech', score: 71, stage: 'growing', founder: 'Aisha B.', location: 'New York, NY', seeking: '$300K', desc: 'Round-up investing with social features for young adults.' },
];

const STAGES = ['All Stages', 'Ready', 'Growing', 'Seed'];

export default function InvestorMarketplacePage() {
  const [search, setSearch] = useState('');
  const [stage, setStage] = useState('All Stages');

  const filtered = MARKETPLACE_IDEAS.filter(idea => {
    const matchesStage = stage === 'All Stages' || idea.stage === stage.toLowerCase();
    const matchesSearch = !search || idea.title.toLowerCase().includes(search.toLowerCase()) || idea.founder.toLowerCase().includes(search.toLowerCase());
    return matchesStage && matchesSearch;
  });

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <NavBar />

      <Box sx={{ pt: { xs: 10, md: 12 }, pb: 6, bgcolor: '#FAF5E9', textAlign: 'center' }}>
        <Container maxWidth="md">
          <Chip label="For Investors" size="small" sx={{ bgcolor: '#F5EAD3', color: 'secondary.dark', fontWeight: 700, mb: 2 }} />
          <Typography variant="h2" fontWeight={800} gutterBottom sx={{ fontFamily: '"Noto Kufi Arabic", "Nunito Sans", sans-serif' }}>
            Investor Marketplace
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 4, fontSize: '1.1rem' }}>
            Discover pre-validated startup ideas from talented founders. Filter by IQ score, sector, and funding stage.
          </Typography>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} justifyContent="center">
            <TextField
              placeholder="Search ideas or founders…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              sx={{ maxWidth: 400, bgcolor: 'white', borderRadius: 2 }}
              size="small"
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon color="action" fontSize="small" />
                    </InputAdornment>
                  ),
                },
              }}
            />
            <Button variant="outlined" startIcon={<TuneIcon />} sx={{ bgcolor: 'white' }}>
              Filters
            </Button>
          </Stack>
        </Container>
      </Box>

      <Box sx={{ py: 5, flex: 1 }}>
        <Container maxWidth="lg">
          <Stack direction="row" spacing={1} sx={{ mb: 4, flexWrap: 'wrap', gap: 1 }}>
            {STAGES.map(s => (
              <Chip
                key={s}
                label={s}
                onClick={() => setStage(s)}
                sx={{
                  cursor: 'pointer',
                  bgcolor: stage === s ? 'secondary.main' : 'grey.100',
                  color: stage === s ? 'white' : 'text.secondary',
                  fontWeight: stage === s ? 700 : 500,
                  '&:hover': { bgcolor: stage === s ? 'secondary.dark' : 'grey.200' },
                }}
              />
            ))}
          </Stack>

          <Grid container spacing={3}>
            {filtered.map(idea => (
              <Grid size={{ xs: 12, md: 6 }} key={idea.id}>
                <Card sx={{ height: '100%', '&:hover': { boxShadow: 4, transform: 'translateY(-2px)' }, transition: 'all 150ms ease' }}>
                  <CardContent sx={{ p: 3 }}>
                    <Stack direction="row" alignItems="flex-start" spacing={2} sx={{ mb: 2 }}>
                      <Box sx={{ width: 48, height: 48, borderRadius: 2, bgcolor: '#F7F3EC', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', flexShrink: 0 }}>
                        {SECTOR_EMOJIS[idea.sector] ?? '💡'}
                      </Box>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="body1" fontWeight={700} gutterBottom noWrap>{idea.title}</Typography>
                        <SectorChip sector={idea.sector} emoji={SECTOR_EMOJIS[idea.sector]} />
                      </Box>
                      <IQScoreBadge score={idea.score} size="small" showLabel />
                    </Stack>

                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2, lineHeight: 1.65 }}>
                      {idea.desc}
                    </Typography>

                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                      <Box>
                        <Typography variant="caption" color="text.secondary">Founder</Typography>
                        <Typography variant="body2" fontWeight={600}>{idea.founder} · {idea.location}</Typography>
                      </Box>
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="caption" color="text.secondary">Seeking</Typography>
                        <Typography variant="body2" fontWeight={700} color="secondary.main">{idea.seeking}</Typography>
                      </Box>
                    </Stack>

                    <Button
                      component={Link}
                      to="/signup"
                      variant="contained"
                      fullWidth
                      size="small"
                      sx={{ background: 'linear-gradient(135deg, #1B6B3E, #D4A653)', color: '#1A1A1A' }}
                    >
                      Connect with Founder →
                    </Button>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {filtered.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Typography color="text.secondary">No ideas match your filters. Try adjusting the search.</Typography>
            </Box>
          )}
        </Container>
      </Box>

      <Footer />
    </Box>
  );
}
