import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import MenuIcon from '@mui/icons-material/Menu';
import SearchIcon from '@mui/icons-material/Search';
import NotificationsOutlinedIcon from '@mui/icons-material/NotificationsOutlined';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import Avatar from '@mui/material/Avatar';
import Skeleton from '@mui/material/Skeleton';
import { Link, useNavigate } from 'react-router-dom';
import { supabase, SECTORS, getStageInfo, type UserIdea, type CanvasData, type ConnectionRequest } from '../../supabase';
import { useAuth } from '../../contexts/AuthContext';
import InvestorSidebar from '../../components/InvestorSidebar';

interface MergedIdea extends UserIdea {
  canvas_data?: CanvasData | null;
  pitch_data?: { investment_amount: number; use_of_funds: string } | null;
  connection_status?: 'pending' | 'accepted' | 'declined' | null;
}

export default function InvestorMarketplacePage() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  const [ideas, setIdeas] = useState<MergedIdea[]>([]);
  const [loading, setLoading] = useState(true);
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [requestMap, setRequestMap] = useState<Map<string, ConnectionRequest>>(new Map());

  const [search, setSearch] = useState('');
  const [sectorFilter, setSectorFilter] = useState<string[]>([]);
  const [scoreFilter, setScoreFilter] = useState(0);
  const [sortBy, setSortBy] = useState<'score' | 'newest' | 'roi'>('score');

  // Auth guard
  useEffect(() => {
    if (!user) {
      navigate('/auth/signin');
    }
  }, [user, navigate]);

  // Fetch data on mount
  useEffect(() => {
    if (!user) return;
    const userId = user.id;

    async function fetchData() {
      try {
        setLoading(true);

        // 1. Fetch marketplace ideas (in_marketplace=true)
        const { data: ideasData, error: ideasError } = await supabase
          .from('user_ideas')
          .select('*')
          .eq('in_marketplace', true);

        if (ideasError) throw ideasError;

        const baseIdeas = (ideasData || []) as UserIdea[];

        // 2. Fetch canvas data and pitch data for each idea (in parallel)
        const ideasWithData = await Promise.all(
          baseIdeas.map(async (idea) => {
            const [canvasRes, pitchRes] = await Promise.all([
              supabase
                .from('canvas_data')
                .select('*')
                .eq('user_idea_id', idea.id)
                .maybeSingle(),
              supabase
                .from('pitch_data')
                .select('investment_amount, use_of_funds')
                .eq('user_idea_id', idea.id)
                .maybeSingle(),
            ]);

            return {
              ...idea,
              canvas_data: canvasRes.data as CanvasData | null,
              pitch_data: pitchRes.data as { investment_amount: number; use_of_funds: string } | null,
            };
          })
        );

        // 3. Fetch saved ideas for current investor
        const { data: savedData, error: savedError } = await supabase
          .from('saved_ideas')
          .select('idea_id')
          .eq('investor_id', userId);

        if (savedError) throw savedError;
        const savedSet = new Set((savedData || []).map(s => s.idea_id));

        // 4. Fetch connection requests for current investor
        const { data: requestsData, error: requestsError } = await supabase
          .from('connection_requests')
          .select('*')
          .eq('investor_id', userId);

        if (requestsError) throw requestsError;
        const reqMap = new Map(
          (requestsData || []).map(r => [r.idea_id, r])
        );

        setIdeas(ideasWithData);
        setSavedIds(savedSet);
        setRequestMap(reqMap);
      } catch (error) {
        console.error('Error fetching marketplace data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [user]);

  // Compute filtered ideas
  const filteredIdeas = ideas
    .filter(idea => {
      const matchesSearch =
        !search ||
        idea.title.toLowerCase().includes(search.toLowerCase()) ||
        idea.business_name?.toLowerCase().includes(search.toLowerCase());

      const matchesSector =
        sectorFilter.length === 0 ||
        sectorFilter.includes(idea.sector);

      const matchesScore = idea.iq_score >= scoreFilter;

      return matchesSearch && matchesSector && matchesScore;
    })
    .sort((a, b) => {
      if (sortBy === 'score') return b.iq_score - a.iq_score;
      if (sortBy === 'newest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      if (sortBy === 'roi') {
        const roiA = a.canvas_data?.monthly_revenue && a.canvas_data?.monthly_costs
          ? ((a.canvas_data.monthly_revenue - a.canvas_data.monthly_costs) / a.canvas_data.monthly_costs) * 100
          : 0;
        const roiB = b.canvas_data?.monthly_revenue && b.canvas_data?.monthly_costs
          ? ((b.canvas_data.monthly_revenue - b.canvas_data.monthly_costs) / b.canvas_data.monthly_costs) * 100
          : 0;
        return roiB - roiA;
      }
      return 0;
    });

  const avgScore =
    ideas.length > 0
      ? Math.round(ideas.reduce((sum, idea) => sum + idea.iq_score, 0) / ideas.length)
      : 0;

  const toggleSave = async (ideaId: string) => {
    if (!user) return;

    const isSaved = savedIds.has(ideaId);

    if (isSaved) {
      await supabase
        .from('saved_ideas')
        .delete()
        .eq('investor_id', user.id)
        .eq('idea_id', ideaId);

      setSavedIds(prev => {
        const next = new Set(prev);
        next.delete(ideaId);
        return next;
      });
    } else {
      await supabase
        .from('saved_ideas')
        .insert([{ investor_id: user.id, idea_id: ideaId }]);

      setSavedIds(prev => new Set(prev).add(ideaId));
    }
  };

  const getSectorLabel = (sectorKey: string) => {
    const sector = SECTORS.find(s => s.key === sectorKey);
    return sector ? `${sector.emoji} ${sector.label}` : sectorKey;
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return '#2A8A52';
    if (score >= 60) return '#1B6B3E';
    return '#D4A653';
  };

  const filtersActive = search.length > 0 || sectorFilter.length > 0 || scoreFilter !== 0 || sortBy !== 'score';

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#FAF8F3' }}>
      <InvestorSidebar
        open={sidebarOpen}
        onToggle={() => setSidebarOpen(o => !o)}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        {/* AppBar */}
        <AppBar position="sticky" elevation={0} sx={{ bgcolor: 'white', borderBottom: '1px solid', borderColor: 'divider' }}>
          <Toolbar sx={{ gap: 1 }}>
            <IconButton sx={{ display: { lg: 'none' } }} onClick={() => setMobileOpen(true)} size="small">
              <MenuIcon />
            </IconButton>
            <StorefrontOutlinedIcon sx={{ fontSize: 20 }} />
            <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1rem' }}>
              سوق المستثمرين
            </Typography>
            <Box sx={{ flex: 1 }} />
            <IconButton size="small">
              <NotificationsOutlinedIcon />
            </IconButton>
            <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: '0.8rem', fontWeight: 700 }}>
              {profile?.full_name?.[0] ?? 'I'}
            </Avatar>
          </Toolbar>
        </AppBar>

        {/* Main Content */}
        <Box sx={{ flex: 1, p: { xs: 2, sm: 3, md: 4 } }}>
          <Container maxWidth="lg" disableGutters>
            {/* Header */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="h5" fontWeight={800} gutterBottom>
                سوق المستثمرين
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                اكتشف أفكار مشاريع متحقَّقاً منها مسبقاً وتواصل مع أصحابها
              </Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ flexWrap: 'wrap', gap: 1 }}>
                <Chip label={`${ideas.length} فكرة معروضة`} variant="outlined" size="small" />
                <Chip label={`متوسط الدرجة: ${avgScore}`} variant="outlined" size="small" />
              </Stack>
            </Box>

            {/* Filter Bar */}
            <Card sx={{ p: 2.5, mb: 3 }}>
              <Stack spacing={2}>
                {/* Search */}
                <TextField
                  fullWidth
                  size="small"
                  placeholder="ابحث عن أفكار..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  slotProps={{
                    input: {
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon sx={{ fontSize: 18 }} />
                        </InputAdornment>
                      ),
                    },
                  }}
                />

                {/* Sector Chips */}
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1, fontWeight: 600 }}>
                    القطاعات
                  </Typography>
                  <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                    {SECTORS.map(s => (
                      <Chip
                        key={s.key}
                        label={`${s.emoji} ${s.label}`}
                        onClick={() =>
                          setSectorFilter(prev =>
                            prev.includes(s.key)
                              ? prev.filter(x => x !== s.key)
                              : [...prev, s.key]
                          )
                        }
                        variant={sectorFilter.includes(s.key) ? 'filled' : 'outlined'}
                        color={sectorFilter.includes(s.key) ? 'primary' : 'default'}
                        size="small"
                        sx={{ cursor: 'pointer' }}
                      />
                    ))}
                  </Stack>
                </Box>

                {/* Score & Sort Row */}
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5, fontWeight: 600 }}>
                      الحد الأدنى للدرجة: {scoreFilter}
                    </Typography>
                    <TextField
                      type="range"
                      fullWidth
                      inputProps={{ min: 0, max: 100, step: 5 }}
                      value={scoreFilter}
                      onChange={e => setScoreFilter(Number(e.target.value))}
                      slotProps={{ input: { sx: { cursor: 'pointer' } } }}
                    />
                  </Box>

                  <TextField
                    select
                    size="small"
                    value={sortBy}
                    onChange={e => setSortBy(e.target.value as 'score' | 'newest' | 'roi')}
                    defaultValue="score"
                    sx={{ minWidth: 150 }}
                    slotProps={{
                      select: {
                        native: true,
                      },
                    }}
                  >
                    <option value="score">الأعلى درجة</option>
                    <option value="newest">الأحدث</option>
                    <option value="roi">الأعلى عائداً</option>
                  </TextField>
                </Stack>

                {/* Clear Filters */}
                {filtersActive && (
                  <Button
                    variant="text"
                    size="small"
                    onClick={() => {
                      setSearch('');
                      setSectorFilter([]);
                      setScoreFilter(0);
                      setSortBy('score');
                    }}
                  >
                    امسح المرشحات
                  </Button>
                )}
              </Stack>
            </Card>

            {/* Ideas Grid */}
            {loading ? (
              <Grid container spacing={3}>
                {Array.from({ length: 6 }).map((_, i) => (
                  <Grid key={i} size={{ xs: 12, sm: 6, lg: 4 }}>
                    <Card sx={{ height: 420 }}>
                      <CardContent sx={{ p: 2.5 }}>
                        <Skeleton variant="rounded" width={40} height={24} sx={{ mb: 1.5 }} />
                        <Skeleton variant="text" sx={{ mb: 1 }} />
                        <Skeleton variant="text" width="80%" sx={{ mb: 2 }} />
                        <Skeleton variant="rectangular" height={80} sx={{ mb: 2, borderRadius: 1 }} />
                        <Divider sx={{ my: 2 }} />
                        <Skeleton variant="text" sx={{ mb: 1 }} />
                        <Skeleton variant="text" width="60%" sx={{ mb: 2 }} />
                        <Skeleton variant="rectangular" height={36} sx={{ borderRadius: 1 }} />
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            ) : filteredIdeas.length === 0 ? (
              <Card sx={{ p: 4, textAlign: 'center', border: '2px dashed', borderColor: 'divider' }}>
                <Typography color="text.secondary" variant="body2">
                  لا أفكار مطابقة لمرشحاتك. جرّب تعديل معايير البحث.
                </Typography>
              </Card>
            ) : (
              <Grid container spacing={3}>
                {filteredIdeas.map(idea => {
                  const isSaved = savedIds.has(idea.id);
                  const connectionReq = requestMap.get(idea.id);
                  const roi =
                    idea.canvas_data?.monthly_revenue && idea.canvas_data?.monthly_costs
                      ? ((idea.canvas_data.monthly_revenue - idea.canvas_data.monthly_costs) / idea.canvas_data.monthly_costs) * 100
                      : null;
                  const scoreColor = getScoreColor(idea.iq_score);

                  return (
                    <Grid key={idea.id} size={{ xs: 12, sm: 6, lg: 4 }}>
                      <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                        <CardActionArea component={Link} to={`/marketplace/${idea.id}`} sx={{ flex: 1 }}>
                          <CardContent sx={{ p: 2.5, pb: 0 }}>
                            {/* Top row: Sector + Bookmark */}
                            <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 1.5 }}>
                              <Chip label={getSectorLabel(idea.sector)} size="small" variant="outlined" />
                              <IconButton
                                size="small"
                                onClick={e => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  toggleSave(idea.id);
                                }}
                                sx={{ mt: -0.75, mr: -0.75 }}
                              >
                                {isSaved ? <BookmarkIcon sx={{ fontSize: 20 }} /> : <BookmarkBorderIcon sx={{ fontSize: 20 }} />}
                              </IconButton>
                            </Stack>

                            {/* Title */}
                            <Typography
                              variant="h6"
                              fontWeight={700}
                              sx={{
                                mb: 1,
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                              }}
                            >
                              {idea.title}
                            </Typography>

                            {/* IQ Score Badge & Stage */}
                            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
                              <Box
                                sx={{
                                  width: 44,
                                  height: 44,
                                  borderRadius: 1,
                                  border: `2px solid ${scoreColor}`,
                                  bgcolor: `${scoreColor}18`,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  flexShrink: 0,
                                }}
                              >
                                <Typography sx={{ fontWeight: 700, fontSize: '0.9rem', color: scoreColor }}>
                                  {idea.iq_score}
                                </Typography>
                              </Box>
                              <Chip label={getStageInfo(idea.stage).label} size="small" variant="outlined" />
                            </Stack>

                            {/* Problem */}
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              sx={{
                                mb: 1.5,
                                display: '-webkit-box',
                                WebkitLineClamp: 3,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                              }}
                            >
                              {idea.problem}
                            </Typography>

                            <Divider sx={{ my: 1.5 }} />

                            {/* Metrics Grid */}
                            <Grid container spacing={1} sx={{ mb: 1.5 }}>
                              <Grid size={6}>
                                <Box>
                                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                                    العائد المتوقع
                                  </Typography>
                                  <Typography variant="body2" fontWeight={600}>
                                    {roi !== null ? `٪${roi.toFixed(0)}` : '—'}
                                  </Typography>
                                </Box>
                              </Grid>
                              <Grid size={6}>
                                <Box>
                                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                                    نقطة التعادل
                                  </Typography>
                                  <Typography variant="body2" fontWeight={600}>
                                    {idea.canvas_data?.break_even_month ? `${idea.canvas_data.break_even_month} شهر` : '—'}
                                  </Typography>
                                </Box>
                              </Grid>
                              <Grid size={6}>
                                <Box>
                                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                                    الاستثمار
                                  </Typography>
                                  <Typography variant="body2" fontWeight={600}>
                                    {idea.pitch_data?.investment_amount
                                      ? `$${(idea.pitch_data.investment_amount / 1000).toFixed(0)}K`
                                      : '—'}
                                  </Typography>
                                </Box>
                              </Grid>
                              <Grid size={6}>
                                <Box>
                                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                                    الحالة
                                  </Typography>
                                  <Typography variant="body2" fontWeight={600}>
                                    {getStageInfo(idea.stage).label}
                                  </Typography>
                                </Box>
                              </Grid>
                            </Grid>
                          </CardContent>
                        </CardActionArea>

                        {/* Connection Status Overlay */}
                        {connectionReq && (
                          <Box sx={{ px: 2.5, pb: 1 }}>
                            <Chip
                              label={connectionReq.status === 'pending' ? 'طلب معلّق' : connectionReq.status === 'accepted' ? 'طلب مقبول' : 'طلب مرفوض'}
                              size="small"
                              color={
                                connectionReq.status === 'pending'
                                  ? 'warning'
                                  : connectionReq.status === 'accepted'
                                    ? 'success'
                                    : 'error'
                              }
                              sx={{ width: '100%' }}
                            />
                          </Box>
                        )}

                        {/* View Details Button */}
                        <Box sx={{ p: 2.5, pt: 0 }}>
                          <Button
                            component={Link}
                            to={`/marketplace/${idea.id}`}
                            fullWidth
                            variant="outlined"
                            size="small"
                          >
                            عرض التفاصيل ←
                          </Button>
                        </Box>
                      </Card>
                    </Grid>
                  );
                })}
              </Grid>
            )}
          </Container>
        </Box>
      </Box>
    </Box>
  );
}
