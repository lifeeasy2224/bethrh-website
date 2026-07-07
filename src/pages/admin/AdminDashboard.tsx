import { useState, useEffect, useCallback, lazy, Suspense, Component, type ReactNode } from 'react';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import Avatar from '@mui/material/Avatar';
import Chip from '@mui/material/Chip';
import Skeleton from '@mui/material/Skeleton';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import LightbulbOutlinedIcon from '@mui/icons-material/LightbulbOutlined';
import EmojiObjectsOutlinedIcon from '@mui/icons-material/EmojiObjectsOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import SupportAgentOutlinedIcon from '@mui/icons-material/SupportAgentOutlined';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { useAdminAuth, ADMIN_API } from '../../contexts/AdminAuthContext';

const AdminDashboardCharts = lazy(() => import('./AdminDashboardCharts'));

// ── Types ─────────────────────────────────────────────────────────────────────

interface DashboardData {
  total_users: number;
  new_users_today: number;
  total_ideas: number;
  user_submitted_ideas: number;
  pending_tickets: number;
  active_admin_sessions: number;
  recent_users: { id: string; full_name: string; role: string; created_at: string; status: string }[];
  role_split: { founders: number; investors: number };
  growth_data: { date: string; users: number; new_users: number }[];
  traffic_data: { date: string; page_views: number; unique_visitors: number }[];
  top_pages: { page: string; views: number }[];
  conversion_funnel: { stage: string; value: number; fill: string }[];
  geo_data: { state: string; users: number }[];
  device_data: { name: string; value: number; fill: string }[];
  referral_data: { source: string; visitors: number }[];
}

// ── Error Boundary ────────────────────────────────────────────────────────────

class ChartErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    if (this.state.failed) {
      return (
        <Box sx={{ py: 4, textAlign: 'center', color: 'text.secondary' }}>
          <Typography variant="body2">Charts could not be loaded.</Typography>
        </Box>
      );
    }
    return this.props.children;
  }
}

// ── Stat Card ─────────────────────────────────────────────────────────────────

function StatCard({
  icon, label, value, sub, color, loading, tooltip,
}: {
  icon: React.ReactNode; label: string; value: number | string;
  sub?: string; color: string; loading: boolean; tooltip?: string;
}) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ p: 3 }}>
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between" mb={1}>
          <Box>
            <Stack direction="row" alignItems="center" spacing={0.5} mb={0.5}>
              <Typography variant="caption" color="text.secondary" fontWeight={600}
                sx={{ textTransform: 'uppercase', letterSpacing: '0.06em', fontSize: '0.7rem' }}>
                {label}
              </Typography>
              {tooltip && (
                <Tooltip title={tooltip} arrow>
                  <InfoOutlinedIcon sx={{ fontSize: 13, color: 'text.disabled', cursor: 'default' }} />
                </Tooltip>
              )}
            </Stack>
            {loading
              ? <Skeleton width={64} height={40} />
              : <Typography variant="h4" fontWeight={800} sx={{ color: 'text.primary', lineHeight: 1.1 }}>
                  {typeof value === 'number' ? value.toLocaleString() : value}
                </Typography>}
            {sub && !loading && (
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.25, display: 'block' }}>
                {sub}
              </Typography>
            )}
          </Box>
          <Box sx={{
            width: 46, height: 46, borderRadius: '12px',
            bgcolor: `${color}18`, display: 'flex',
            alignItems: 'center', justifyContent: 'center', color, flexShrink: 0,
          }}>
            {icon}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const { admin, sessionToken } = useAdminAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [growthPeriod, setGrowthPeriod] = useState<'7d' | '30d'>('30d');
  const [trafficPeriod, setTrafficPeriod] = useState<'7d' | '30d'>('30d');

  const fetchStats = useCallback(async () => {
    if (!sessionToken) return;
    try {
      const res = await fetch(`${ADMIN_API}/dashboard-stats`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ session_token: sessionToken }),
      });
      const json = await res.json() as DashboardData;
      setData(json);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [sessionToken]);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  const now = new Date();
  const hour = now.getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  const roleColor = (role: string) => role === 'investor' ? '#2A8A52' : '#1B6B3E';

  const statCards = [
    {
      icon: <PeopleAltOutlinedIcon sx={{ fontSize: 22 }} />,
      label: 'Total Users', value: data?.total_users ?? 0,
      sub: 'All registered accounts', color: '#1B6B3E',
    },
    {
      icon: <TrendingUpIcon sx={{ fontSize: 22 }} />,
      label: 'New Users Today', value: data?.new_users_today ?? 0,
      sub: 'Registered today', color: '#2A8A52',
    },
    {
      icon: <LightbulbOutlinedIcon sx={{ fontSize: 22 }} />,
      label: 'Ideas in Library', value: data?.total_ideas ?? 0,
      sub: 'Curated library ideas', color: '#1B6B3E',
    },
    {
      icon: <EmojiObjectsOutlinedIcon sx={{ fontSize: 22 }} />,
      label: 'User-Submitted Ideas', value: data?.user_submitted_ideas ?? 0,
      sub: 'Entrepreneur ideas', color: '#2A8A52',
    },
    {
      icon: <VisibilityOutlinedIcon sx={{ fontSize: 22 }} />,
      label: 'Active Visitors', value: data?.active_admin_sessions ?? 0,
      sub: 'Estimated real-time', color: '#D08A28',
      tooltip: 'Approximated from active sessions',
    },
    {
      icon: <SupportAgentOutlinedIcon sx={{ fontSize: 22 }} />,
      label: 'Pending Tickets', value: data?.pending_tickets ?? 0,
      sub: 'Open + in progress', color: '#C0392B',
    },
  ];

  return (
    <Box sx={{ py: 4 }}>
      <Container maxWidth="xl">
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" fontWeight={800} gutterBottom>
            {greeting}, {admin?.full_name?.split(' ')[0]}
          </Typography>
          <Typography color="text.secondary">Here's what's happening with Bethra today.</Typography>
        </Box>

        {/* 6 Stat Cards */}
        <Grid container spacing={2.5} sx={{ mb: 4 }}>
          {statCards.map(card => (
            <Grid key={card.label} size={{ xs: 12, sm: 6, lg: 4, xl: 2 }}>
              <StatCard {...card} loading={loading} />
            </Grid>
          ))}
        </Grid>

        {/* Charts — isolated in a lazy-loaded module */}
        <ChartErrorBoundary>
          <Suspense fallback={<Skeleton variant="rectangular" height={300} sx={{ borderRadius: 2, mb: 3 }} />}>
            <AdminDashboardCharts
              data={data}
              loading={loading}
              growthPeriod={growthPeriod}
              trafficPeriod={trafficPeriod}
              onGrowthPeriodChange={setGrowthPeriod}
              onTrafficPeriodChange={setTrafficPeriod}
            />
          </Suspense>
        </ChartErrorBoundary>

        {/* Row 5: Recent Sign-ups + Quick Actions */}
        <Grid container spacing={3} sx={{ mt: 3 }}>
          <Grid size={{ xs: 12, md: 7 }}>
            <Card>
              <CardContent sx={{ p: 3 }}>
                <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2.5}>
                  <Typography variant="subtitle1" fontWeight={700}>Recent Sign-ups</Typography>
                  <Button size="small" href="/admin/users"
                    sx={{ color: '#1B6B3E', textTransform: 'none', fontSize: '0.8125rem' }}>
                    View all →
                  </Button>
                </Stack>
                <Divider sx={{ mb: 2 }} />
                {loading
                  ? Array.from({ length: 5 }).map((_, i) => (
                      <Stack key={i} direction="row" alignItems="center" spacing={2} sx={{ py: 1.25 }}>
                        <Skeleton variant="circular" width={38} height={38} />
                        <Box flex={1}><Skeleton width="60%" /><Skeleton width="40%" height={14} /></Box>
                      </Stack>
                    ))
                  : data?.recent_users?.length
                    ? data.recent_users.map(user => (
                        <Stack key={user.id} direction="row" alignItems="center" spacing={2}
                          sx={{ py: 1.25, borderBottom: '1px solid', borderColor: 'grey.100', '&:last-child': { borderBottom: 'none' } }}>
                          <Avatar sx={{ width: 38, height: 38, bgcolor: roleColor(user.role), fontSize: '0.875rem', fontWeight: 700 }}>
                            {user.full_name?.charAt(0).toUpperCase() ?? '?'}
                          </Avatar>
                          <Box flex={1} minWidth={0}>
                            <Typography variant="body2" fontWeight={600} noWrap>{user.full_name}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {new Date(user.created_at).toLocaleDateString()}
                            </Typography>
                          </Box>
                          <Stack direction="row" spacing={0.75}>
                            <Chip label={user.role === 'investor' ? 'Investor' : 'Founder'} size="small"
                              sx={{ bgcolor: `${roleColor(user.role)}18`, color: roleColor(user.role), fontWeight: 600, fontSize: '0.7rem' }} />
                            {user.status === 'suspended' && (
                              <Chip label="Suspended" size="small" color="warning" sx={{ fontSize: '0.7rem', fontWeight: 600 }} />
                            )}
                          </Stack>
                        </Stack>
                      ))
                    : <Typography color="text.secondary" variant="body2" sx={{ py: 2, textAlign: 'center' }}>No users yet.</Typography>
                }
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 5 }}>
            <Card sx={{ mb: 2.5 }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="subtitle1" fontWeight={700} mb={2}>Quick Actions</Typography>
                <Stack spacing={1.5}>
                  {[
                    { label: 'Add idea to library', href: '/admin/ideas-library', color: '#1B6B3E' },
                    { label: 'View all users', href: '/admin/users', color: '#2A8A52' },
                    { label: 'Review support tickets', href: '/admin/support', color: '#D08A28' },
                    { label: 'Check audit log', href: '/admin/audit-log', color: '#8A8070' },
                  ].map(a => (
                    <Button key={a.label} component="a" href={a.href} variant="outlined" fullWidth
                      sx={{ justifyContent: 'flex-start', textTransform: 'none', borderColor: 'grey.200', color: a.color, fontWeight: 600, '&:hover': { borderColor: a.color, bgcolor: `${a.color}08` } }}>
                      {a.label}
                    </Button>
                  ))}
                </Stack>
              </CardContent>
            </Card>
            <Card sx={{ bgcolor: '#1B6B3E' }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="subtitle1" fontWeight={700} sx={{ color: 'white', mb: 0.5 }}>
                  2FA {admin?.totp_enabled ? 'Active' : 'Not Configured'}
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.75)', mb: 2 }}>
                  {admin?.totp_enabled
                    ? 'Your account is secured with two-factor authentication.'
                    : 'Set up 2FA to secure your admin account.'}
                </Typography>
                {!admin?.totp_enabled && (
                  <Button variant="contained" size="small" href="/admin/setup-2fa"
                    sx={{ bgcolor: 'white', color: '#1B6B3E', '&:hover': { bgcolor: 'rgba(255,255,255,0.9)' }, fontWeight: 700 }}>
                    Set up 2FA
                  </Button>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
