import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Stack from '@mui/material/Stack';
import Skeleton from '@mui/material/Skeleton';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Typography from '@mui/material/Typography';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip as RechartTooltip,
  Legend, ResponsiveContainer, FunnelChart, Funnel, LabelList,
} from 'recharts';

interface DashboardData {
  growth_data: { date: string; users: number; new_users: number }[];
  traffic_data: { date: string; page_views: number; unique_visitors: number }[];
  top_pages: { page: string; views: number }[];
  conversion_funnel: { stage: string; value: number; fill: string }[];
  geo_data: { state: string; users: number }[];
  device_data: { name: string; value: number; fill: string }[];
  referral_data: { source: string; visitors: number }[];
  role_split: { founders: number; investors: number };
}

interface Props {
  data: DashboardData | null;
  loading: boolean;
  growthPeriod: '7d' | '30d';
  trafficPeriod: '7d' | '30d';
  onGrowthPeriodChange: (v: '7d' | '30d') => void;
  onTrafficPeriodChange: (v: '7d' | '30d') => void;
}

const CHART_COLORS = ['#1B6B3E', '#2A8A52', '#2A8A52', '#D08A28', '#C0392B', '#1B6B3E'];
const AXIS_STYLE = { fontSize: 11, fill: '#B5AE9F' };
const GRID_STROKE = '#F7F3EC';

const formatDate = (d: unknown) => {
  const dt = new Date(String(d ?? ''));
  return `${dt.getMonth() + 1}/${dt.getDate()}`;
};

function ChartHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <Stack direction="row" alignItems="center" justifyContent="space-between" mb={2}>
      <Typography variant="subtitle1" fontWeight={700}>{title}</Typography>
      {action}
    </Stack>
  );
}

export default function AdminDashboardCharts({
  data, loading, growthPeriod, trafficPeriod, onGrowthPeriodChange, onTrafficPeriodChange,
}: Props) {
  const sliceGrowth = data?.growth_data?.slice(growthPeriod === '7d' ? -7 : -30) ?? [];
  const sliceTraffic = data?.traffic_data?.slice(trafficPeriod === '7d' ? -7 : -30) ?? [];

  const roleSplitData = [
    { name: 'Founders', value: data?.role_split?.founders ?? 0, fill: '#1B6B3E' },
    { name: 'Investors', value: data?.role_split?.investors ?? 0, fill: '#2A8A52' },
  ];

  return (
    <>
      {/* Row 1: User Growth + Role Split */}
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} sx={{ mb: 3 }}>
        <Box flex={2}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <ChartHeader
                title="User Growth"
                action={
                  <ToggleButtonGroup value={growthPeriod} exclusive size="small"
                    onChange={(_, v) => v && onGrowthPeriodChange(v)}>
                    <ToggleButton value="7d" sx={{ px: 1.5, fontSize: '0.75rem' }}>7d</ToggleButton>
                    <ToggleButton value="30d" sx={{ px: 1.5, fontSize: '0.75rem' }}>30d</ToggleButton>
                  </ToggleButtonGroup>
                }
              />
              {loading ? <Skeleton variant="rectangular" height={220} /> : (
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={sliceGrowth} margin={{ top: 4, right: 16, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
                    <XAxis dataKey="date" tickFormatter={formatDate} tick={AXIS_STYLE} />
                    <YAxis tick={AXIS_STYLE} />
                    <RechartTooltip contentStyle={{ borderRadius: 8, border: '1px solid #E8E4DC', fontSize: 12 }} labelFormatter={formatDate} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Line type="monotone" dataKey="users" name="Total Users" stroke="#1B6B3E" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="new_users" name="New Users" stroke="#2A8A52" strokeWidth={2} dot={false} strokeDasharray="4 2" />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </Box>

        <Box flex={1}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <ChartHeader title="User Type Split" />
              {loading ? <Skeleton variant="rectangular" height={220} /> : (
                <Box>
                  <ResponsiveContainer width="100%" height={160}>
                    <PieChart>
                      <Pie data={roleSplitData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                        {roleSplitData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                      </Pie>
                      <RechartTooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <Stack spacing={1} mt={1}>
                    {roleSplitData.map(d => (
                      <Stack key={d.name} direction="row" alignItems="center" justifyContent="space-between">
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: d.fill }} />
                          <Typography variant="caption" color="text.secondary">{d.name}</Typography>
                        </Stack>
                        <Typography variant="caption" fontWeight={700}>{d.value}</Typography>
                      </Stack>
                    ))}
                  </Stack>
                </Box>
              )}
            </CardContent>
          </Card>
        </Box>
      </Stack>

      {/* Row 2: Traffic Overview + Device Breakdown */}
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} sx={{ mb: 3 }}>
        <Box flex={2}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <ChartHeader
                title="Traffic Overview"
                action={
                  <ToggleButtonGroup value={trafficPeriod} exclusive size="small"
                    onChange={(_, v) => v && onTrafficPeriodChange(v)}>
                    <ToggleButton value="7d" sx={{ px: 1.5, fontSize: '0.75rem' }}>7d</ToggleButton>
                    <ToggleButton value="30d" sx={{ px: 1.5, fontSize: '0.75rem' }}>30d</ToggleButton>
                  </ToggleButtonGroup>
                }
              />
              {loading ? <Skeleton variant="rectangular" height={220} /> : (
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={sliceTraffic} margin={{ top: 4, right: 16, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
                    <XAxis dataKey="date" tickFormatter={formatDate} tick={AXIS_STYLE} />
                    <YAxis tick={AXIS_STYLE} />
                    <RechartTooltip contentStyle={{ borderRadius: 8, border: '1px solid #E8E4DC', fontSize: 12 }} labelFormatter={formatDate} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Line type="monotone" dataKey="page_views" name="Page Views" stroke="#1B6B3E" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="unique_visitors" name="Unique Visitors" stroke="#2A8A52" strokeWidth={2} dot={false} strokeDasharray="4 2" />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </Box>

        <Box flex={1}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <ChartHeader title="Device Breakdown" />
              {loading ? <Skeleton variant="rectangular" height={220} /> : (
                <Box>
                  <ResponsiveContainer width="100%" height={160}>
                    <PieChart>
                      <Pie data={data?.device_data ?? []} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                        {(data?.device_data ?? []).map((entry, i) => <Cell key={i} fill={entry.fill} />)}
                      </Pie>
                      <RechartTooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} formatter={(v) => [`${v}%`]} />
                    </PieChart>
                  </ResponsiveContainer>
                  <Stack spacing={1} mt={1}>
                    {(data?.device_data ?? []).map(d => (
                      <Stack key={d.name} direction="row" alignItems="center" justifyContent="space-between">
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: d.fill }} />
                          <Typography variant="caption" color="text.secondary">{d.name}</Typography>
                        </Stack>
                        <Typography variant="caption" fontWeight={700}>{d.value}%</Typography>
                      </Stack>
                    ))}
                  </Stack>
                </Box>
              )}
            </CardContent>
          </Card>
        </Box>
      </Stack>

      {/* Row 3: Top Pages + Referral Sources */}
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={3} sx={{ mb: 3 }}>
        <Box flex={1}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <ChartHeader title="Top Pages" />
              {loading ? <Skeleton variant="rectangular" height={260} /> : (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={data?.top_pages ?? []} layout="vertical" margin={{ top: 0, right: 16, left: 70, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} horizontal={false} />
                    <XAxis type="number" tick={AXIS_STYLE} />
                    <YAxis type="category" dataKey="page" tick={{ ...AXIS_STYLE, fontSize: 10 }} width={70} />
                    <RechartTooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                    <Bar dataKey="views" name="Views" fill="#1B6B3E" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </Box>

        <Box flex={1}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <ChartHeader title="Referral Sources" />
              {loading ? <Skeleton variant="rectangular" height={260} /> : (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={data?.referral_data ?? []} margin={{ top: 0, right: 16, left: -20, bottom: 24 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
                    <XAxis dataKey="source" tick={{ ...AXIS_STYLE, fontSize: 10 }} angle={-20} textAnchor="end" interval={0} />
                    <YAxis tick={AXIS_STYLE} />
                    <RechartTooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                    <Bar dataKey="visitors" name="Visitors" radius={[4, 4, 0, 0]}>
                      {(data?.referral_data ?? []).map((_, i) => (
                        <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </Box>
      </Stack>

      {/* Row 4: Conversion Funnel + Geographic Distribution */}
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
        <Box sx={{ flex: '0 0 auto', width: { xs: '100%', md: '40%' } }}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <ChartHeader title="Conversion Funnel" />
              {loading ? <Skeleton variant="rectangular" height={240} /> : (
                <ResponsiveContainer width="100%" height={240}>
                  <FunnelChart>
                    <RechartTooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                    <Funnel dataKey="value" data={data?.conversion_funnel ?? []} isAnimationActive>
                      <LabelList position="right" fill="#8A8070" stroke="none" dataKey="stage" style={{ fontSize: 12, fontWeight: 600 }} />
                      <LabelList position="center" fill="#fff" stroke="none" dataKey="value" style={{ fontSize: 11 }} />
                    </Funnel>
                  </FunnelChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </Box>

        <Box flex={1}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <ChartHeader title="Geographic Distribution (US)" />
              {loading ? <Skeleton variant="rectangular" height={240} /> : (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={data?.geo_data ?? []} margin={{ top: 0, right: 16, left: -20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={GRID_STROKE} />
                    <XAxis dataKey="state" tick={AXIS_STYLE} />
                    <YAxis tick={AXIS_STYLE} />
                    <RechartTooltip contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                    <Bar dataKey="users" name="Users" radius={[4, 4, 0, 0]}>
                      {(data?.geo_data ?? []).map((_, i) => (
                        <Cell key={i} fill={`hsl(${200 + i * 10}, 70%, ${50 - i * 2}%)`} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </Box>
      </Stack>
    </>
  );
}
