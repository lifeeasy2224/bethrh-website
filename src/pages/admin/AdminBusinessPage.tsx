import { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import LinearProgress from '@mui/material/LinearProgress';
import Stack from '@mui/material/Stack';
import Chip from '@mui/material/Chip';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import StarIcon from '@mui/icons-material/Star';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  RadialBarChart,
  RadialBar,
  Cell,
} from 'recharts';
import { useAdminAuth, ADMIN_API } from '../../contexts/AdminAuthContext';

type RevenueMonth = {
  month: string;
  mrr: number;
  new_mrr: number;
  churned_mrr: number;
};

type ConversionStage = {
  stage: string;
  value: number;
};

type Idea = {
  title: string;
  sector: string;
  view_count: number;
  grab_count: number;
  is_featured: boolean;
};

type ConnectionTrendItem = {
  week: string;
  connections: number;
};

type BusinessAnalyticsData = {
  revenueMonths: RevenueMonth[];
  convFunnel: ConversionStage[];
  ideas: Idea[];
  totalConnections: number;
  healthScore: number;
  connectionTrend: ConnectionTrendItem[];
};

function StatCard({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <Card sx={{ p: 2.5, borderRadius: 2, bgcolor: 'white', height: '100%' }}>
      <Typography variant="caption" color="text.secondary" fontWeight={500}>{label}</Typography>
      <Typography variant="h5" fontWeight={700} sx={{ mt: 0.5, color: color ?? '#1B6B3E' }}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </Typography>
    </Card>
  );
}

export default function AdminBusinessPage() {
  const { sessionToken } = useAdminAuth();
  const [data, setData] = useState<BusinessAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sessionToken) return;
    setLoading(true);
    fetch(`${ADMIN_API}/analytics-business`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` },
      body: JSON.stringify({ session_token: sessionToken, days: 30 }),
    })
      .then(r => r.json())
      .then((d: BusinessAnalyticsData) => setData(d))
      .catch(() => {/* silent */})
      .finally(() => setLoading(false));
  }, [sessionToken]);

  const currentMrr = data?.revenueMonths?.length ? data.revenueMonths[data.revenueMonths.length - 1].mrr : 0;
  const totalViews = (data?.ideas ?? []).reduce((s, i) => s + i.view_count, 0);
  const healthColor = (data?.healthScore ?? 0) >= 80 ? '#2A8A52' : (data?.healthScore ?? 0) >= 60 ? '#D4A653' : '#C0392B';
  const maxFunnel = Math.max(...(data?.convFunnel ?? [{ value: 1 }]).map(s => s.value));
  const funnelColors = ['#2A8A52', '#3AAD6A', '#3AAD6A', '#DEEBE2', '#DEEBE2'];

  return (
    <Box sx={{ bgcolor: '#FAF8F3', minHeight: '100vh', p: 3 }}>
      {loading && <LinearProgress sx={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999 }} />}

      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={800}>Business Analytics</Typography>
        <Typography variant="body2" color="text.secondary">Revenue, conversions, and platform performance</Typography>
      </Box>

      {/* Stat Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: 'Current MRR', value: `$${currentMrr.toLocaleString()}` },
          { label: 'Total Connections', value: data?.totalConnections ?? 0 },
          { label: 'Platform Health', value: `${data?.healthScore ?? 0}/100`, color: healthColor },
          { label: 'Ideas Library Views', value: totalViews },
        ].map(stat => (
          <Grid key={stat.label} size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard label={stat.label} value={stat.value} color={stat.color} />
          </Grid>
        ))}
      </Grid>

      {/* Charts Row 1 — MRR + Connections */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Card sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" fontWeight={700} mb={2}>MRR Trend</Typography>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', height: 300, alignItems: 'center' }}>
                <CircularProgress />
              </Box>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <ComposedChart data={data?.revenueMonths ?? []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E8E4DC" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #E8E4DC' }} />
                  <Legend />
                  <Bar yAxisId="left" dataKey="new_mrr" fill="#2A8A52" name="New MRR" radius={[4, 4, 0, 0]} />
                  <Bar yAxisId="left" dataKey="churned_mrr" fill="#C0392B" name="Churned MRR" radius={[4, 4, 0, 0]} />
                  <Line yAxisId="right" type="monotone" dataKey="mrr" stroke="#1B6B3E" strokeWidth={2} name="Total MRR" dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            )}
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" fontWeight={700} mb={2}>Connection Trend</Typography>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data?.connectionTrend ?? []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E8E4DC" />
                <XAxis dataKey="week" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #E8E4DC' }} />
                <Bar dataKey="connections" fill="#1B6B3E" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </Grid>
      </Grid>

      {/* Charts Row 2 — Funnel + Health */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" fontWeight={700} mb={3}>Subscription Funnel</Typography>
            <Stack spacing={2}>
              {(data?.convFunnel ?? []).map((stage, idx) => (
                <Box key={stage.stage}>
                  <Stack direction="row" justifyContent="space-between" mb={0.5}>
                    <Typography variant="caption" fontWeight={500}>{stage.stage}</Typography>
                    <Typography variant="caption" fontWeight={700} color="text.secondary">
                      {stage.value.toLocaleString()} ({((stage.value / maxFunnel) * 100).toFixed(0)}%)
                    </Typography>
                  </Stack>
                  <Box
                    sx={{
                      width: `${(stage.value / maxFunnel) * 100}%`,
                      height: 32,
                      bgcolor: funnelColors[idx % funnelColors.length],
                      borderRadius: 1,
                      minWidth: 40,
                      transition: 'width 0.5s ease',
                    }}
                  />
                </Box>
              ))}
            </Stack>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ p: 3, borderRadius: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Typography variant="h6" fontWeight={700} mb={2} alignSelf="flex-start">Platform Health Score</Typography>
            <ResponsiveContainer width="100%" height={200}>
              <RadialBarChart
                cx="50%" cy="80%"
                innerRadius="60%" outerRadius="90%"
                startAngle={180} endAngle={0}
                data={[{ value: data?.healthScore ?? 0, fill: healthColor }]}
              >
                <RadialBar dataKey="value" cornerRadius={8} background={{ fill: '#F7F3EC' }}>
                  <Cell fill={healthColor} />
                </RadialBar>
              </RadialBarChart>
            </ResponsiveContainer>
            <Box sx={{ textAlign: 'center', mt: -4 }}>
              <Typography variant="h3" fontWeight={800} sx={{ color: healthColor }}>
                {data?.healthScore ?? 0}
              </Typography>
              <Typography variant="caption" color="text.secondary">out of 100</Typography>
            </Box>
          </Card>
        </Grid>
      </Grid>

      {/* Ideas Library Table */}
      <Card sx={{ borderRadius: 2, overflow: 'hidden' }}>
        <Box sx={{ px: 3, py: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography variant="h6" fontWeight={700}>Ideas Library Performance</Typography>
        </Box>
        <Box sx={{ overflowX: 'auto' }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'grey.50' }}>
                <TableCell sx={{ fontWeight: 700 }}>Title</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Sector</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>Views</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>Grabs</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>Conversion</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700 }}>Featured</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {(data?.ideas ?? []).map((idea, idx) => (
                <TableRow key={`${idea.title}-${idx}`} hover sx={{ '&:nth-of-type(even)': { bgcolor: 'grey.50' } }}>
                  <TableCell sx={{ fontWeight: 500, maxWidth: 240 }}>
                    <Typography variant="body2" noWrap>{idea.title}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={idea.sector} size="small" variant="outlined" sx={{ fontSize: '0.7rem' }} />
                  </TableCell>
                  <TableCell align="right">{idea.view_count.toLocaleString()}</TableCell>
                  <TableCell align="right">{idea.grab_count.toLocaleString()}</TableCell>
                  <TableCell align="right">
                    <Typography variant="body2" fontWeight={600} sx={{ color: '#2A8A52' }}>
                      {idea.view_count > 0 ? ((idea.grab_count / idea.view_count) * 100).toFixed(1) : '0'}%
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    {idea.is_featured && <StarIcon sx={{ fontSize: 16, color: '#D4A653' }} />}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      </Card>
    </Box>
  );
}
