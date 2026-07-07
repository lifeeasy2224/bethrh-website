import { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import LinearProgress from '@mui/material/LinearProgress';
import Alert from '@mui/material/Alert';
import DownloadIcon from '@mui/icons-material/Download';
import {
  ResponsiveContainer, LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip, Legend,
} from 'recharts';
import { useAdminAuth, ADMIN_API } from '../../contexts/AdminAuthContext';

interface TrafficAnalyticsResponse {
  daily: Array<{
    date: string;
    visitors: number;
    page_views: number;
    new_users: number;
    returning_users: number;
    avg_session_duration_seconds: number;
    bounce_rate: number;
    organic_traffic: number;
    paid_traffic: number;
    social_traffic: number;
    direct_traffic: number;
    referral_traffic: number;
    mobile_users: number;
    desktop_users: number;
    tablet_users: number;
  }>;
  pageBreakdown: Array<{ page: string; views: number }>;
  topStates: Array<{ state: string; visitors: number }>;
  peakHours: number[][];
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <Card sx={{ borderRadius: 2, boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)' }}>
      <CardContent sx={{ p: 3 }}>
        <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {label}
        </Typography>
        <Typography variant="h3" fontWeight={800} sx={{ mt: 0.5, lineHeight: 1 }}>
          {value}
        </Typography>
        {sub && <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{sub}</Typography>}
      </CardContent>
    </Card>
  );
}

const formatChartDate = (d: unknown) => {
  const dt = new Date(String(d ?? ''));
  return `${dt.getMonth() + 1}/${dt.getDate()}`;
};

const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return `${mins}m ${secs}s`;
};

const downloadCSV = (data: TrafficAnalyticsResponse['daily'], filename: string) => {
  const headers = [
    'date', 'visitors', 'page_views', 'new_users', 'returning_users',
    'avg_session_duration_seconds', 'bounce_rate', 'organic_traffic',
    'paid_traffic', 'social_traffic', 'direct_traffic', 'referral_traffic',
    'mobile_users', 'desktop_users', 'tablet_users',
  ];
  const rows = data.map(row =>
    headers.map(h => row[h as keyof typeof row]).join(',')
  );
  const csv = [headers.join(','), ...rows].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

export default function AdminTrafficPage() {
  const { sessionToken } = useAdminAuth();
  const [data, setData] = useState<TrafficAnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [days, setDays] = useState(7);

  useEffect(() => {
    if (!sessionToken) return;
    void (async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(`${ADMIN_API}/analytics-traffic`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` },
          body: JSON.stringify({ session_token: sessionToken, days }),
        });
        const json = await res.json() as TrafficAnalyticsResponse & { error?: string };
        if (!res.ok) {
          setError(json.error ?? 'Failed to load traffic analytics');
          setLoading(false);
          return;
        }
        setData(json);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        setLoading(false);
      }
    })();
  }, [sessionToken, days]);

  if (error) {
    return (
      <Box sx={{ p: 4, bgcolor: '#FAF8F3', minHeight: '100vh' }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  if (!data) {
    return (
      <Box sx={{ bgcolor: '#FAF8F3', minHeight: '100vh' }}>
        {loading && <LinearProgress />}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
          <Typography color="text.secondary">Loading traffic analytics...</Typography>
        </Box>
      </Box>
    );
  }

  const totalVisitors = data.daily.reduce((sum, d) => sum + d.visitors, 0);
  const totalPageViews = data.daily.reduce((sum, d) => sum + d.page_views, 0);
  const avgDuration = data.daily.length > 0
    ? data.daily.reduce((sum, d) => sum + d.avg_session_duration_seconds, 0) / data.daily.length
    : 0;
  const avgBounceRate = data.daily.length > 0
    ? data.daily.reduce((sum, d) => sum + d.bounce_rate, 0) / data.daily.length
    : 0;

  const trafficSourcesData = data.daily.map(d => ({
    date: formatChartDate(d.date),
    organic: d.organic_traffic,
    paid: d.paid_traffic,
    social: d.social_traffic,
    direct: d.direct_traffic,
    referral: d.referral_traffic,
  }));

  const newVsReturningData = [
    { name: 'New Users', value: data.daily.reduce((sum, d) => sum + d.new_users, 0) },
    { name: 'Returning Users', value: data.daily.reduce((sum, d) => sum + d.returning_users, 0) },
  ];

  const deviceBreakdownData = [
    { name: 'Mobile', value: data.daily.reduce((sum, d) => sum + d.mobile_users, 0) },
    { name: 'Desktop', value: data.daily.reduce((sum, d) => sum + d.desktop_users, 0) },
    { name: 'Tablet', value: data.daily.reduce((sum, d) => sum + d.tablet_users, 0) },
  ];

  const peakHoursMax = Math.max(...data.peakHours.flat());
  const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <Box sx={{ bgcolor: '#FAF8F3', minHeight: '100vh', pb: 4 }}>
      {loading && <LinearProgress sx={{ position: 'sticky', top: 0, zIndex: 1100 }} />}

      {/* Header */}
      <Box sx={{ bgcolor: 'white', borderBottom: '1px solid', borderColor: 'divider', px: 4, py: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
          <Box>
            <Typography variant="h4" fontWeight={700} gutterBottom>
              Traffic Analytics
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Real-time visitor, traffic source, and behavior metrics
            </Typography>
          </Box>
          <Stack direction="row" spacing={1}>
            {[7, 30, 90].map(d => (
              <Button
                key={d}
                variant={days === d ? 'contained' : 'outlined'}
                size="small"
                onClick={() => setDays(d)}
                sx={days === d ? { bgcolor: '#1B6B3E', '&:hover': { bgcolor: '#0F3D24' } } : {}}
              >
                {d}d
              </Button>
            ))}
            <Button
              variant="outlined"
              size="small"
              startIcon={<DownloadIcon />}
              onClick={() => downloadCSV(data.daily, `traffic-analytics-${days}d.csv`)}
            >
              Export CSV
            </Button>
          </Stack>
        </Stack>
      </Box>

      <Box sx={{ px: 4, py: 4 }}>
        {/* Stat Cards */}
        <Grid container spacing={2.5} sx={{ mb: 4 }}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard label="Total Visitors" value={totalVisitors.toLocaleString()} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard label="Total Page Views" value={totalPageViews.toLocaleString()} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard label="Avg Session Duration" value={formatDuration(avgDuration)} sub="per session" />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard label="Avg Bounce Rate" value={`${avgBounceRate.toFixed(1)}%`} sub="user sessions" />
          </Grid>
        </Grid>

        {/* Charts */}
        <Grid container spacing={3}>
          {/* Visitors & Page Views Trend */}
          <Grid size={{ xs: 12, lg: 6 }}>
            <Card sx={{ borderRadius: 2, boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)' }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={700} gutterBottom>
                  Visitors &amp; Page Views Trend
                </Typography>
                <Box sx={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data.daily}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E8E4DC" />
                      <XAxis dataKey="date" tickFormatter={formatChartDate} tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                      <ReTooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} labelFormatter={formatChartDate} />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="visitors"
                        name="Visitors"
                        stroke="#1B6B3E"
                        strokeWidth={2}
                        dot={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="page_views"
                        name="Page Views"
                        stroke="#2A8A52"
                        strokeWidth={2}
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Traffic Sources */}
          <Grid size={{ xs: 12, lg: 6 }}>
            <Card sx={{ borderRadius: 2, boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)' }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={700} gutterBottom>
                  Traffic Sources
                </Typography>
                <Box sx={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trafficSourcesData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E8E4DC" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                      <ReTooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="organic"
                        name="Organic"
                        stackId="1"
                        stroke="#1B6B3E"
                        fill="#1B6B3E"
                        fillOpacity={0.7}
                      />
                      <Area
                        type="monotone"
                        dataKey="paid"
                        name="Paid"
                        stackId="1"
                        stroke="#D4A653"
                        fill="#D4A653"
                        fillOpacity={0.7}
                      />
                      <Area
                        type="monotone"
                        dataKey="social"
                        name="Social"
                        stackId="1"
                        stroke="#2A8A52"
                        fill="#2A8A52"
                        fillOpacity={0.7}
                      />
                      <Area
                        type="monotone"
                        dataKey="direct"
                        name="Direct"
                        stackId="1"
                        stroke="#2A8A52"
                        fill="#2A8A52"
                        fillOpacity={0.7}
                      />
                      <Area
                        type="monotone"
                        dataKey="referral"
                        name="Referral"
                        stackId="1"
                        stroke="#C0392B"
                        fill="#C0392B"
                        fillOpacity={0.7}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* New vs Returning Visitors */}
          <Grid size={{ xs: 12, md: 6, lg: 3 }}>
            <Card sx={{ borderRadius: 2, boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)', height: '100%' }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={700} gutterBottom>
                  New vs Returning
                </Typography>
                <Box sx={{ height: 250 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={newVsReturningData}
                        cx="50%"
                        cy="45%"
                        innerRadius={50}
                        outerRadius={75}
                        dataKey="value"
                        paddingAngle={3}
                      >
                        <Cell fill="#1B6B3E" />
                        <Cell fill="#DEEBE2" />
                      </Pie>
                      <ReTooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                      <Legend
                        verticalAlign="bottom"
                        height={36}
                        iconSize={10}
                        iconType="circle"
                        formatter={(v) => <span style={{ fontSize: 12 }}>{v}</span>}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1, textAlign: 'center' }}>
                  Total: {newVsReturningData.reduce((sum, d) => sum + d.value, 0).toLocaleString()}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Device Breakdown */}
          <Grid size={{ xs: 12, md: 6, lg: 3 }}>
            <Card sx={{ borderRadius: 2, boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)', height: '100%' }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={700} gutterBottom>
                  Device Breakdown
                </Typography>
                <Box sx={{ height: 250 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={deviceBreakdownData}
                        cx="50%"
                        cy="45%"
                        innerRadius={50}
                        outerRadius={75}
                        dataKey="value"
                        paddingAngle={3}
                      >
                        <Cell fill="#1B6B3E" />
                        <Cell fill="#2A8A52" />
                        <Cell fill="#D4A653" />
                      </Pie>
                      <ReTooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                      <Legend
                        verticalAlign="bottom"
                        height={36}
                        iconSize={10}
                        iconType="circle"
                        formatter={(v) => <span style={{ fontSize: 12 }}>{v}</span>}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1, textAlign: 'center' }}>
                  Total: {deviceBreakdownData.reduce((sum, d) => sum + d.value, 0).toLocaleString()}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Top Pages */}
          <Grid size={{ xs: 12, lg: 6 }}>
            <Card sx={{ borderRadius: 2, boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)' }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={700} gutterBottom>
                  Top Pages by Views
                </Typography>
                <Box sx={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={data.pageBreakdown}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 180, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#E8E4DC" />
                      <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                      <YAxis dataKey="page" type="category" tick={{ fontSize: 11 }} width={175} />
                      <ReTooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                      <Bar dataKey="views" fill="#1B6B3E" radius={[0, 8, 8, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Top US States */}
          <Grid size={{ xs: 12, lg: 6 }}>
            <Card sx={{ borderRadius: 2, boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)' }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={700} gutterBottom>
                  Top US States
                </Typography>
                <Box sx={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={data.topStates}
                      layout="vertical"
                      margin={{ top: 5, right: 30, left: 60, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#E8E4DC" />
                      <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                      <YAxis dataKey="state" type="category" tick={{ fontSize: 11 }} width={55} />
                      <ReTooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                      <Bar dataKey="visitors" fill="#2A8A52" radius={[0, 8, 8, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Peak Hours Heatmap */}
          <Grid size={{ xs: 12 }}>
            <Card sx={{ borderRadius: 2, boxShadow: '0 1px 3px rgba(0, 0, 0, 0.08)' }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={700} gutterBottom>
                  Peak Hours Heatmap
                </Typography>
                <Box sx={{ overflowX: 'auto', mt: 2 }}>
                  <Stack direction="row" spacing={1}>
                    <Box sx={{ pt: 3 }}>
                      {dayLabels.map(day => (
                        <Box
                          key={day}
                          sx={{
                            height: 20,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 10,
                            fontWeight: 600,
                            mb: 0.5,
                          }}
                        >
                          {day}
                        </Box>
                      ))}
                    </Box>
                    <Box>
                      <Stack direction="row" spacing={0.25} sx={{ mb: 0.5 }}>
                        {[0, 6, 12, 18, 23].map(h => (
                          <Box key={h} sx={{ width: 20, textAlign: 'center', fontSize: 9, color: 'text.secondary' }}>
                            {h}
                          </Box>
                        ))}
                      </Stack>
                      <Stack direction="column" spacing={0.5}>
                        {data.peakHours.map((dayHours, dayIndex) => (
                          <Stack key={dayIndex} direction="row" spacing={0.25}>
                            {dayHours.map((hourValue, hourIndex) => {
                              const ratio = peakHoursMax > 0 ? hourValue / peakHoursMax : 0;
                              const opacity = 0.05 + ratio * 0.85;
                              return (
                                <Box
                                  key={hourIndex}
                                  sx={{
                                    width: 20,
                                    height: 20,
                                    bgcolor: `rgba(27, 107, 62, ${opacity})`,
                                    borderRadius: 0.5,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: 8,
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    '&:hover': {
                                      transform: 'scale(1.1)',
                                      boxShadow: '0 2px 8px rgba(27, 107, 62, 0.3)',
                                    },
                                    title: `${dayLabels[dayIndex]} ${hourIndex}:00 - ${hourValue} visitors`,
                                  }}
                                  title={`${dayLabels[dayIndex]} ${hourIndex}:00 - ${hourValue} visitors`}
                                >
                                  {hourValue > 0 && hourValue < 10 ? hourValue : ''}
                                </Box>
                              );
                            })}
                          </Stack>
                        ))}
                      </Stack>
                    </Box>
                  </Stack>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                  Heatmap showing peak visitor activity by day and hour. Darker cells indicate higher traffic.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}
