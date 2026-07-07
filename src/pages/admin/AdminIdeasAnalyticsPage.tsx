import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import DownloadIcon from '@mui/icons-material/Download';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis,
  Tooltip as ReTooltip, CartesianGrid, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { useAdminAuth, ADMIN_API } from '../../contexts/AdminAuthContext';

interface AnalyticsData {
  idea: { id: string; title: string; view_count: number; grab_count: number; spots_total: number; spots_taken: number };
  chart_data: { date: string; views: number; grabs: number }[];
  grab_rate: number;
  status_breakdown: { grabbed: number; converted: number; abandoned: number };
  total_views: number;
  total_grabs: number;
}

const GRAB_COLORS = ['#1B6B3E', '#2A8A52', '#C0392B'];

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <Card>
      <CardContent sx={{ p: 3 }}>
        <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {label}
        </Typography>
        <Typography variant="h3" fontWeight={800} sx={{ mt: 0.5, lineHeight: 1 }}>{value}</Typography>
        {sub && <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{sub}</Typography>}
      </CardContent>
    </Card>
  );
}

const formatChartDate = (d: unknown) => {
  const dt = new Date(String(d ?? ''));
  return `${dt.getMonth() + 1}/${dt.getDate()}`;
};

export default function AdminIdeasAnalyticsPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { sessionToken } = useAdminAuth();

  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!id || !sessionToken) return;
    void (async () => {
      const res = await fetch(`${ADMIN_API}/idea-analytics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` },
        body: JSON.stringify({ session_token: sessionToken, idea_id: id }),
      });
      const json = await res.json() as AnalyticsData & { error?: string };
      if (!res.ok) { setError(json.error ?? 'Failed to load analytics'); setLoading(false); return; }
      setData(json);
      setLoading(false);
    })();
  }, [id, sessionToken]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !data) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error">{error || 'Idea not found'}</Alert>
      </Box>
    );
  }

  const grabStatusPie = [
    { name: 'Active', value: data.status_breakdown.grabbed },
    { name: 'Converted', value: data.status_breakdown.converted },
    { name: 'Abandoned', value: data.status_breakdown.abandoned },
  ].filter(d => d.value > 0);

  return (
    <Box sx={{ bgcolor: 'grey.50', minHeight: '100vh' }}>
      {/* Header */}
      <Box sx={{ bgcolor: 'white', borderBottom: '1px solid', borderColor: 'divider', px: 3, py: 2 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/admin/ideas-library')} sx={{ color: 'text.secondary' }}>
              Ideas Library
            </Button>
            <Typography color="text.disabled">/</Typography>
            <Typography variant="h6" fontWeight={700} noWrap sx={{ maxWidth: 340 }}>
              {data.idea.title}
            </Typography>
            <Chip label="Analytics" size="small" sx={{ bgcolor: 'rgba(27, 107, 62,0.1)', color: '#1B6B3E', fontWeight: 700 }} />
          </Stack>
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<VisibilityOutlinedIcon />}
              onClick={() => window.open(`/ideas-library/${id}`, '_blank')}
            >
              Preview
            </Button>
            <Button
              variant="contained"
              size="small"
              startIcon={<EditOutlinedIcon />}
              onClick={() => navigate(`/admin/ideas-library/${id}/edit`)}
              sx={{ bgcolor: '#1B6B3E', '&:hover': { bgcolor: '#0F3D24' } }}
            >
              Edit Idea
            </Button>
          </Stack>
        </Stack>
      </Box>

      <Box sx={{ px: 3, py: 4 }}>
        {/* Stat Cards */}
        <Grid container spacing={2.5} sx={{ mb: 4 }}>
          <Grid size={{ xs: 6, sm: 3 }}>
            <StatCard label="Total Views" value={data.total_views.toLocaleString()} />
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <StatCard label="Total Grabs" value={data.total_grabs} sub={`${data.idea.spots_taken}/${data.idea.spots_total} spots`} />
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <StatCard
              label="Grab Rate"
              value={`${data.grab_rate}%`}
              sub={data.total_views > 0 ? 'views → grabs' : 'No views yet'}
            />
          </Grid>
          <Grid size={{ xs: 6, sm: 3 }}>
            <StatCard
              label="Conversion"
              value={data.total_grabs > 0 ? `${Math.round((data.status_breakdown.converted / data.total_grabs) * 100)}%` : '—'}
              sub="grabs → converted"
            />
          </Grid>
        </Grid>

        {/* Charts */}
        <Grid container spacing={3}>
          {/* Views & Grabs over Time */}
          <Grid size={{ xs: 12, lg: 8 }}>
            <Card>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="subtitle1" fontWeight={700} gutterBottom>Views &amp; Grabs — Last 30 Days</Typography>
                <Box sx={{ height: 280 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data.chart_data}>
                      <defs>
                        <linearGradient id="viewsGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#1B6B3E" stopOpacity={0.18} />
                          <stop offset="95%" stopColor="#1B6B3E" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="grabsGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#2A8A52" stopOpacity={0.18} />
                          <stop offset="95%" stopColor="#2A8A52" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#E8E4DC" />
                      <XAxis dataKey="date" tickFormatter={formatChartDate} tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                      <ReTooltip
                        contentStyle={{ fontSize: 12, borderRadius: 8 }}
                        labelFormatter={formatChartDate}
                      />
                      <Area type="monotone" dataKey="views" name="Views" stroke="#1B6B3E" strokeWidth={2} fill="url(#viewsGrad)" />
                      <Area type="monotone" dataKey="grabs" name="Grabs" stroke="#2A8A52" strokeWidth={2} fill="url(#grabsGrad)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Grab Status Breakdown */}
          <Grid size={{ xs: 12, lg: 4 }}>
            <Card sx={{ height: '100%' }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="subtitle1" fontWeight={700} gutterBottom>Grab Status</Typography>
                {grabStatusPie.length === 0 ? (
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 220 }}>
                    <Typography color="text.secondary" variant="body2">No grabs yet</Typography>
                  </Box>
                ) : (
                  <Box sx={{ height: 240 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={grabStatusPie}
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={85}
                          dataKey="value"
                          paddingAngle={3}
                        >
                          {grabStatusPie.map((_, i) => (
                            <Cell key={i} fill={GRAB_COLORS[i % GRAB_COLORS.length]} />
                          ))}
                        </Pie>
                        <Legend iconSize={10} iconType="circle" formatter={(v) => <span style={{ fontSize: 12 }}>{v}</span>} />
                        <ReTooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
                      </PieChart>
                    </ResponsiveContainer>
                  </Box>
                )}
                <Stack spacing={1} sx={{ mt: 1 }}>
                  {[
                    { label: 'Active Grabs', value: data.status_breakdown.grabbed, color: '#1B6B3E' },
                    { label: 'Converted', value: data.status_breakdown.converted, color: '#2A8A52' },
                    { label: 'Abandoned', value: data.status_breakdown.abandoned, color: '#C0392B' },
                  ].map(({ label, value, color }) => (
                    <Stack key={label} direction="row" justifyContent="space-between" alignItems="center">
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: color }} />
                        <Typography variant="body2" color="text.secondary">{label}</Typography>
                      </Stack>
                      <Typography variant="body2" fontWeight={700}>{value}</Typography>
                    </Stack>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          {/* Summary */}
          <Grid size={{ xs: 12 }}>
            <Card>
              <CardContent sx={{ p: 3 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
                  <Box>
                    <Typography variant="subtitle1" fontWeight={700}>Summary</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Showing 30-day activity. Views and grabs are tracked in real time.
                    </Typography>
                  </Box>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<DownloadIcon />}
                    onClick={() => {
                      const csv = ['date,views,grabs', ...data.chart_data.map(r => `${r.date},${r.views},${r.grabs}`)].join('\n');
                      const blob = new Blob([csv], { type: 'text/csv' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url; a.download = `idea-analytics-${id}.csv`; a.click();
                      URL.revokeObjectURL(url);
                    }}
                  >
                    Export Chart Data
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Box>
  );
}
