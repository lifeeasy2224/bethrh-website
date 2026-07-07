import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid';
import Avatar from '@mui/material/Avatar';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemText from '@mui/material/ListItemText';
import Badge from '@mui/material/Badge';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Divider from '@mui/material/Divider';
import { useTheme } from '@mui/material/styles';
import MenuIcon from '@mui/icons-material/Menu';
import NotificationsNoneOutlined from '@mui/icons-material/NotificationsNoneOutlined';
import StorefrontOutlined from '@mui/icons-material/StorefrontOutlined';
import HandshakeOutlined from '@mui/icons-material/HandshakeOutlined';
import HourglassTopOutlined from '@mui/icons-material/HourglassTopOutlined';
import TuneOutlined from '@mui/icons-material/TuneOutlined';
import MenuBookOutlined from '@mui/icons-material/MenuBookOutlined';
import PersonOutlined from '@mui/icons-material/PersonOutlined';
import ArrowForwardOutlined from '@mui/icons-material/ArrowForwardOutlined';
import InvestorSidebar from '../../components/InvestorSidebar';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../supabase';

interface IdeaData {
  id: string;
  title: string;
  sector: string;
  iq_score: number;
  problem: string;
  created_at: string;
  pitch_data: {
    investment_amount: number;
  } | null;
  canvas_data: {
    break_even_month: number;
  } | null;
}

export default function InvestorDashboard() {
  const navigate = useNavigate();
  const theme = useTheme();
  const { user, profile, signOut } = useAuth();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuAnchor, setUserMenuAnchor] = useState<HTMLElement | null>(null);

  const [marketplaceCount, setMarketplaceCount] = useState(0);
  const [activeConnectionsCount, setActiveConnectionsCount] = useState(0);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const [investorProfile, setInvestorProfile] = useState<any>(null);
  const [recommendedIdeas, setRecommendedIdeas] = useState<IdeaData[]>([]);
  const [newThisWeek, setNewThisWeek] = useState(0);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [activityFeed, setActivityFeed] = useState<Array<{ icon: string; text: string; time: string }>>([]);

  useEffect(() => {
    if (!user?.id) {
      return;
    }

    const loadData = async () => {
      try {
        // Load marketplace ideas count
        const { count: marketCount } = await supabase
          .from('user_ideas')
          .select('*', { count: 'exact', head: true })
          .eq('in_marketplace', true)
          .gte('iq_score', 80);

        setMarketplaceCount(marketCount || 0);

        // Load active connections count
        const { count: activeCount } = await supabase
          .from('connections')
          .select('*', { count: 'exact', head: true })
          .eq('investor_id', user.id)
          .eq('status', 'active');

        setActiveConnectionsCount(activeCount || 0);

        // Load pending requests count
        const { count: pendingCount } = await supabase
          .from('connection_requests')
          .select('*', { count: 'exact', head: true })
          .eq('investor_id', user.id)
          .eq('status', 'pending');

        setPendingRequestsCount(pendingCount || 0);

        // Load investor profile
        const { data: profileData } = await supabase
          .from('investor_profiles')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();

        setInvestorProfile(profileData);

        // Load recommended ideas
        let ideasQuery = supabase
          .from('user_ideas')
          .select(
            `
            id,
            title,
            sector,
            iq_score,
            problem,
            created_at,
            pitch_data,
            canvas_data
          `
          )
          .eq('in_marketplace', true)
          .gte('iq_score', 80)
          .order('iq_score', { ascending: false })
          .limit(6);

        // Filter by investor's sectors of interest if available
        if (profileData?.sectors_of_interest && profileData.sectors_of_interest.length > 0) {
          ideasQuery = ideasQuery.in('sector', profileData.sectors_of_interest);
        }

        const { data: ideasData } = await ideasQuery;
        setRecommendedIdeas(ideasData || []);

        // Load recent connections (used for activity feed)
        const { data: connectionsData } = await supabase
          .from('connections')
          .select(
            `
            id,
            created_at,
            user_ideas(title),
            investor_profiles(name, avatar_url)
          `
          )
          .eq('investor_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5);

        const { count: notifCount } = await supabase
          .from('notifications')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('is_read', false);

        setUnreadNotifications(notifCount || 0);

        // New ideas this week
        const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
        const { count: weekCount } = await supabase
          .from('user_ideas')
          .select('*', { count: 'exact', head: true })
          .eq('in_marketplace', true)
          .gte('iq_score', 80)
          .gte('created_at', weekAgo);
        setNewThisWeek(weekCount || 0);

        // Build activity feed from connections + notifications
        const formatTime = (iso: string) => {
          const diff = (Date.now() - new Date(iso).getTime()) / 1000;
          if (diff < 3600) return `قبل ${Math.round(diff / 60)} د`;
          if (diff < 86400) return `قبل ${Math.round(diff / 3600)} س`;
          if (diff < 172800) return 'أمس';
          return `قبل ${Math.round(diff / 86400)} يوم`;
        };

        const feed: Array<{ icon: string; text: string; time: string; _ts: number }> = [];

        (connectionsData || []).slice(0, 3).forEach((c: any) => {
          const title = Array.isArray(c.user_ideas) ? c.user_ideas[0]?.title : c.user_ideas?.title;
          if (title) feed.push({ icon: '🤝', text: `تواصلت مع «${title}»`, time: formatTime(c.created_at), _ts: new Date(c.created_at).getTime() });
        });

        const { data: notifData } = await supabase
          .from('notifications')
          .select('message, created_at, type')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5);

        (notifData || []).forEach((n: any) => {
          const icons: Record<string, string> = { connection: '🔔', match: '⭐', message: '💬' };
          feed.push({ icon: icons[n.type] ?? '🔔', text: n.message, time: formatTime(n.created_at), _ts: new Date(n.created_at).getTime() });
        });

        feed.sort((a, b) => b._ts - a._ts);
        setActivityFeed(feed.slice(0, 6).map(({ icon, text, time }) => ({ icon, text, time })));

      } catch (error) {
        console.error('Error loading dashboard data:', error);
      }
    };

    loadData();
  }, [user?.id]);

  const handleSidebarToggle = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const handleMobileClose = () => {
    setMobileOpen(false);
  };

  const getInitial = () => {
    if (investorProfile?.name) {
      return investorProfile.name.charAt(0).toUpperCase();
    }
    return user?.email?.charAt(0).toUpperCase() || 'U';
  };

  const hasNoData = activeConnectionsCount === 0 && marketplaceCount === 0;

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <InvestorSidebar
        open={sidebarOpen}
        onToggle={handleSidebarToggle}
        mobileOpen={mobileOpen}
        onMobileClose={handleMobileClose}
      />

      <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
        {/* AppBar */}
        <AppBar
          position="sticky"
          sx={{
            bgcolor: 'background.paper',
            color: 'text.primary',
            elevation: 0,
            borderBottom: `1px solid ${theme.palette.divider}`,
          }}
        >
          <Toolbar>
            {true && (
              <IconButton
                color="inherit"
                edge="start"
                onClick={handleSidebarToggle}
                sx={{ mr: 2 }}
              >
                <MenuIcon />
              </IconButton>
            )}
            <Box sx={{ flex: 1 }} />
            <IconButton color="inherit">
              <Badge badgeContent={unreadNotifications} color="error">
                <NotificationsNoneOutlined />
              </Badge>
            </IconButton>
            <IconButton onClick={e => setUserMenuAnchor(e.currentTarget)} size="small" sx={{ p: 0, ml: 1 }}>
              <Avatar
                sx={{
                  width: 32,
                  height: 32,
                  bgcolor: theme.palette.secondary.main,
                }}
              >
                {getInitial()}
              </Avatar>
            </IconButton>
            <Menu
              anchorEl={userMenuAnchor}
              open={Boolean(userMenuAnchor)}
              onClose={() => setUserMenuAnchor(null)}
              slotProps={{ paper: { sx: { mt: 1, minWidth: 180 } } }}
            >
              <Box sx={{ px: 2, py: 1 }}>
                <Typography variant="body2" fontWeight={700}>{profile?.full_name ?? user?.email}</Typography>
                <Typography variant="caption" color="text.secondary">مستثمر</Typography>
              </Box>
              <Divider />
              <MenuItem component={Link} to="/settings" onClick={() => setUserMenuAnchor(null)}>الإعدادات</MenuItem>
              <Divider />
              <MenuItem
                onClick={async () => { setUserMenuAnchor(null); await signOut(); navigate('/'); }}
                sx={{ color: 'error.main' }}
              >
                تسجيل الخروج
              </MenuItem>
            </Menu>
          </Toolbar>
        </AppBar>

        {/* Main Content */}
        <Box sx={{ flex: 1, overflow: 'auto' }}>
          <Container maxWidth="lg" sx={{ py: 4 }}>
            {/* Welcome Header */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="h5" sx={{ fontWeight: 800, mb: 0.5 }}>
                أهلاً بعودتك يا {investorProfile?.name?.split(' ')[0] ?? user?.email?.split('@')[0] ?? 'مستثمرنا'}!
              </Typography>
              <Typography variant="body2" color="text.secondary">
                اكتشف أفكاراً متحقَّقاً منها مسبقاً وجاهزة للاستثمار.
                {newThisWeek > 0 && (
                  <Chip label={`${newThisWeek} جديدة هذا الأسبوع`} size="small" color="success" sx={{ ml: 1.5, fontWeight: 700, height: 20, fontSize: '0.7rem' }} />
                )}
              </Typography>
            </Box>

            {/* Stats Bar */}
            <Grid container spacing={2} sx={{ mb: 4 }}>
              {/* Available */}
              <Grid size={{ xs: 6, md: 3 }}>
                <Card sx={{ height: '100%' }}>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'center',
                        mb: 2,
                      }}
                    >
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: 56,
                          height: 56,
                          borderRadius: '50%',
                          bgcolor: '#1B6B3E',
                        }}
                      >
                        <StorefrontOutlined sx={{ color: 'white', fontSize: 28 }} />
                      </Box>
                    </Box>
                    <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
                      {marketplaceCount}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      متاحة
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              {/* Connections */}
              <Grid size={{ xs: 6, md: 3 }}>
                <Card sx={{ height: '100%' }}>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'center',
                        mb: 2,
                      }}
                    >
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: 56,
                          height: 56,
                          borderRadius: '50%',
                          bgcolor: theme.palette.success.main,
                        }}
                      >
                        <HandshakeOutlined sx={{ color: 'white', fontSize: 28 }} />
                      </Box>
                    </Box>
                    <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
                      {activeConnectionsCount}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      تواصلات
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              {/* Pending */}
              <Grid size={{ xs: 6, md: 3 }}>
                <Card sx={{ height: '100%' }}>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'center',
                        mb: 2,
                      }}
                    >
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: 56,
                          height: 56,
                          borderRadius: '50%',
                          bgcolor: theme.palette.warning.main,
                        }}
                      >
                        <HourglassTopOutlined sx={{ color: 'white', fontSize: 28 }} />
                      </Box>
                    </Box>
                    <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
                      {pendingRequestsCount}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      معلّقة
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>

              {/* Matches */}
              <Grid size={{ xs: 6, md: 3 }}>
                <Card sx={{ height: '100%' }}>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'center',
                        mb: 2,
                      }}
                    >
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: 56,
                          height: 56,
                          borderRadius: '50%',
                          bgcolor: theme.palette.primary.main,
                        }}
                      >
                        <TuneOutlined sx={{ color: 'white', fontSize: 28 }} />
                      </Box>
                    </Box>
                    <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
                      {recommendedIdeas.length}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      متوافقة
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Empty State */}
            {hasNoData && (
              <Card
                sx={{
                  border: `2px dashed ${theme.palette.divider}`,
                  mb: 4,
                }}
              >
                <CardContent sx={{ textAlign: 'center', py: 6 }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                    أهلاً بك في لوحة المستثمر!
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    ابدأ بهذه الخطوات الأربع البسيطة:
                  </Typography>
                  <Box sx={{ textAlign: 'left', display: 'inline-block', mb: 3 }}>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      ١. أكمل ملفك الاستثماري لنطابق لك الأفكار
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      ٢. تصفّح السوق لتكتشف أفكاراً متحقَّقاً منها
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      ٣. تواصل مع مؤسسين تتوافق رؤيتهم مع رؤيتك
                    </Typography>
                    <Typography variant="body2">
                      ٤. تابع تواصلاتك وأدر محفظتك
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={() => navigate('/investor/profile')}
                    >
                      أكمل ملفي
                    </Button>
                    <Button
                      variant="outlined"
                      color="primary"
                      onClick={() => navigate('/marketplace')}
                    >
                      تصفّح السوق
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            )}

            {/* Recommended Ideas */}
            {recommendedIdeas.length > 0 && (
              <Box sx={{ mb: 4 }}>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                    مُوصى بها لك
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    أفكار مطابقة لاهتماماتك ومعاييرك الاستثمارية
                  </Typography>
                </Box>
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  {recommendedIdeas.map((idea) => (
                    <Grid key={idea.id} size={{ xs: 12, md: 6, lg: 4 }}>
                      <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                        <CardContent sx={{ flex: 1 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                            <Chip
                              label={idea.sector}
                              size="small"
                              variant="outlined"
                            />
                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: 32,
                                height: 32,
                                borderRadius: '50%',
                                bgcolor: theme.palette.success.main,
                                ml: 'auto',
                              }}
                            >
                              <Typography
                                sx={{
                                  color: 'white',
                                  fontWeight: 700,
                                  fontSize: '0.875rem',
                                }}
                              >
                                {idea.iq_score}
                              </Typography>
                            </Box>
                          </Box>
                          <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                            {idea.title}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            {idea.problem.length > 100
                              ? `${idea.problem.substring(0, 100)}...`
                              : idea.problem}
                          </Typography>
                          <Box sx={{ mb: 2 }}>
                            {idea.pitch_data?.investment_amount && (
                              <Typography variant="caption" display="block" sx={{ mb: 1 }}>
                                مبلغ الاستثمار: ${idea.pitch_data.investment_amount.toLocaleString()}
                              </Typography>
                            )}
                            {idea.canvas_data?.break_even_month && (
                              <Typography variant="caption" display="block">
                                نقطة التعادل: الشهر {idea.canvas_data.break_even_month}
                              </Typography>
                            )}
                          </Box>
                        </CardContent>
                        <Box sx={{ px: 2, pb: 2 }}>
                          <Button
                            fullWidth
                            variant="text"
                            color="primary"
                            endIcon={<ArrowForwardOutlined fontSize="small" />}
                            onClick={() => navigate(`/marketplace/${idea.id}`)}
                          >
                            عرض التفاصيل
                          </Button>
                        </Box>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
                <Box sx={{ textAlign: 'right' }}>
                  <Button
                    variant="text"
                    color="primary"
                    endIcon={<ArrowForwardOutlined fontSize="small" />}
                    onClick={() => navigate('/marketplace')}
                  >
                    عرض الكل في السوق
                  </Button>
                </Box>
              </Box>
            )}

            {/* Recent Activity */}
            {activityFeed.length > 0 && (
              <Box sx={{ mb: 4 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
                  النشاط الأخير
                </Typography>
                <Card>
                  <List sx={{ width: '100%' }}>
                    {activityFeed.map((item, index) => (
                      <React.Fragment key={index}>
                        <ListItem>
                          <ListItemAvatar>
                            <Avatar sx={{ bgcolor: theme.palette.primary.light, color: theme.palette.primary.contrastText, fontSize: '1.1rem' }}>
                              {item.icon}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={item.text}
                            secondary={item.time}
                            primaryTypographyProps={{ variant: 'body2', fontWeight: 600 }}
                            secondaryTypographyProps={{ variant: 'caption' }}
                          />
                        </ListItem>
                        {index < activityFeed.length - 1 && (
                          <Box sx={{ borderBottom: `1px solid ${theme.palette.divider}` }} />
                        )}
                      </React.Fragment>
                    ))}
                  </List>
                </Card>
              </Box>
            )}

            {/* Quick Actions */}
            <Box>
              <Grid container spacing={2}>
                {/* Browse Marketplace */}
                <Grid size={{ xs: 12, sm: 4 }}>
                  <Card sx={{ height: '100%' }}>
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'center',
                          mb: 2,
                        }}
                      >
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: 56,
                            height: 56,
                            borderRadius: '50%',
                            bgcolor: theme.palette.action.hover,
                          }}
                        >
                          <StorefrontOutlined
                            sx={{ color: theme.palette.primary.main, fontSize: 28 }}
                          />
                        </Box>
                      </Box>
                      <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                        تصفّح السوق
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        استكشف كل الأفكار المتحقَّق منها المتاحة
                      </Typography>
                      <Button
                        variant="text"
                        color="primary"
                        endIcon={<ArrowForwardOutlined fontSize="small" />}
                        onClick={() => navigate('/marketplace')}
                      >
                        تصفّح
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Investor Guide */}
                <Grid size={{ xs: 12, sm: 4 }}>
                  <Card sx={{ height: '100%' }}>
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'center',
                          mb: 2,
                        }}
                      >
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: 56,
                            height: 56,
                            borderRadius: '50%',
                            bgcolor: theme.palette.action.hover,
                          }}
                        >
                          <MenuBookOutlined
                            sx={{ color: theme.palette.primary.main, fontSize: 28 }}
                          />
                        </Box>
                      </Box>
                      <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                        دليل المستثمر
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        تعلّم أفضل ممارسات تقييم الأفكار
                      </Typography>
                      <Button
                        variant="text"
                        color="primary"
                        endIcon={<ArrowForwardOutlined fontSize="small" />}
                        onClick={() => navigate('/investor/guide')}
                      >
                        اقرأ
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>

                {/* My Profile */}
                <Grid size={{ xs: 12, sm: 4 }}>
                  <Card sx={{ height: '100%' }}>
                    <CardContent sx={{ textAlign: 'center' }}>
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'center',
                          mb: 2,
                        }}
                      >
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: 56,
                            height: 56,
                            borderRadius: '50%',
                            bgcolor: theme.palette.action.hover,
                          }}
                        >
                          <PersonOutlined
                            sx={{ color: theme.palette.primary.main, fontSize: 28 }}
                          />
                        </Box>
                      </Box>
                      <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
                        ملفي الشخصي
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        حدّث تفضيلاتك الاستثمارية
                      </Typography>
                      <Button
                        variant="text"
                        color="primary"
                        endIcon={<ArrowForwardOutlined fontSize="small" />}
                        onClick={() => navigate('/investor/profile')}
                      >
                        عدّل
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Box>
          </Container>
        </Box>
      </Box>
    </Box>
  );
}
