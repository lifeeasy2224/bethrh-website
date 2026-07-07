import { useState, useEffect, useCallback } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import LinearProgress from '@mui/material/LinearProgress';
import Divider from '@mui/material/Divider';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer,
} from 'recharts';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/AdminLayout';
import { adminDb } from '../../lib/adminDb';
import { useAdminAuth } from '../../contexts/AdminAuthContext';

const PLAN_PRICES: Record<string, number> = {
  builder: 19, launch: 29, family: 49, pro: 49, growth: 79, accelerator: 149,
};

const PLAN_COLORS: Record<string, string> = {
  builder: '#2A8A52', launch: '#2A8A52', family: '#2A8A52',
  pro: '#1B6B3E', growth: '#D08A28', accelerator: '#1B6B3E',
};

const PAYING_TIERS = ['builder', 'launch', 'family', 'pro', 'growth', 'accelerator'];

interface Profile {
  user_id: string;
  plan: string | null;
  tier: string | null;
  created_at: string | null;
  visited_pricing: boolean | null;
  total_revenue: number | null;
}

interface MrrSnapshot {
  month: string;
  total_mrr: number;
  total_customers: number;
  new_mrr: number;
  churned_mrr: number;
  builder_count: number;
  launch_count: number;
  pro_count: number;
  growth_count: number;
  family_count: number;
  accelerator_count: number;
}

interface RevenueEvent {
  event_type: string;
  plan: string | null;
  amount: number | null;
  created_at: string;
}

function fmtMoney(n: number) {
  return `$${n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function fmtMonth(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
}

export default function AdminRevenuePage() {
  const navigate = useNavigate();
  const { sessionToken } = useAdminAuth();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [snapshots, setSnapshots] = useState<MrrSnapshot[]>([]);
  const [events, setEvents] = useState<RevenueEvent[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!sessionToken) return;
    setLoading(true);
    const [
      { data: profileData },
      { data: snapshotData },
      { data: eventData },
      { count: userCount },
    ] = await Promise.all([
      adminDb(sessionToken, 'profiles').select('user_id,plan,tier,created_at,visited_pricing,total_revenue', { limit: 2000 }),
      adminDb(sessionToken, 'mrr_snapshots').select('*', { order: { column: 'month', ascending: true }, limit: 24 }),
      adminDb(sessionToken, 'revenue_events').select('event_type,plan,amount,created_at', { order: { column: 'created_at', ascending: true } }),
      adminDb(sessionToken, 'profiles').select('*', { count: 'exact', head: true }),
    ]);
    setProfiles((profileData ?? []) as Profile[]);
    setSnapshots((snapshotData ?? []) as MrrSnapshot[]);
    setEvents((eventData ?? []) as RevenueEvent[]);
    setTotalUsers(userCount ?? 0);
    setLoading(false);
  }, [sessionToken]);

  useEffect(() => { void load(); }, [load]);

  // Derived stats
  const payingProfiles = profiles.filter(p => {
    const plan = p.plan ?? p.tier ?? '';
    return PAYING_TIERS.includes(plan);
  });

  const mrr = payingProfiles.reduce((s, p) => {
    const plan = (p.plan ?? p.tier ?? '').toLowerCase();
    return s + (PLAN_PRICES[plan] ?? 0);
  }, 0);

  const arr = mrr * 12;
  const totalPayingCustomers = payingProfiles.length;
  const arpu = totalPayingCustomers > 0 ? mrr / totalPayingCustomers : 0;

  // Month-over-month from snapshots
  const latestSnapshot = snapshots[snapshots.length - 1];
  const newMrrThisMonth = latestSnapshot?.new_mrr ?? 0;
  const churnedMrrThisMonth = latestSnapshot?.churned_mrr ?? 0;
  const netMrrGrowth = newMrrThisMonth - churnedMrrThisMonth;

  // Avg LTV: ARPU × avg months subscribed
  const ltv = arpu * 14; // industry avg ~14 months for SaaS

  // Revenue by plan for pie chart
  const planBreakdown = PAYING_TIERS
    .map(plan => {
      const count = payingProfiles.filter(p => (p.plan ?? p.tier ?? '') === plan).length;
      const revenue = count * (PLAN_PRICES[plan] ?? 0);
      return { name: plan.charAt(0).toUpperCase() + plan.slice(1), value: revenue, count, plan };
    })
    .filter(p => p.count > 0);

  // New vs Churned bar chart — last 6 months from events
  const last6Months = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - i));
    return { key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`, label: fmtMonth(d.toISOString()) };
  });

  const newVsChurned = last6Months.map(({ key, label }) => {
    const monthEvents = events.filter(e => e.created_at.startsWith(key));
    const newMrr = monthEvents.filter(e => e.event_type === 'subscription_created').reduce((s, e) => s + (e.amount ?? 0), 0);
    const churnedMrr = monthEvents.filter(e => e.event_type === 'subscription_cancelled').reduce((s, e) => s + (e.amount ?? 0), 0);
    const snap = snapshots.find(s => s.month.startsWith(key));
    return { label, newMrr, churnedMrr, net: newMrr - churnedMrr, totalMrr: snap?.total_mrr ?? 0 };
  });

  // MRR over time from snapshots
  const mrrTrend = snapshots.map(s => ({ label: fmtMonth(s.month), mrr: s.total_mrr, customers: s.total_customers }));

  // Conversion funnel
  const activeUsers = profiles.filter(p => {
    if (!p.created_at) return false;
    const days = (Date.now() - new Date(p.created_at).getTime()) / 86400000;
    return days >= 7;
  }).length;
  const visitedPricing = profiles.filter(p => p.visited_pricing).length;
  const paidCount = payingProfiles.length;

  const funnelData = [
    { stage: 'Total Signups', count: totalUsers, color: '#1B6B3E' },
    { stage: 'Active (7+ days)', count: activeUsers, color: '#2A8A52' },
    { stage: 'Visited Pricing', count: visitedPricing, color: '#D08A28' },
    { stage: 'Paying', count: paidCount, color: '#2A8A52' },
  ];

  const STAT_CARDS = [
    { label: 'MRR', value: fmtMoney(mrr), icon: <AttachMoneyIcon />, color: '#2A8A52', bg: '#F0F5F1', trend: netMrrGrowth >= 0 ? `+${fmtMoney(netMrrGrowth)} MoM` : `${fmtMoney(netMrrGrowth)} MoM`, trendUp: netMrrGrowth >= 0 },
    { label: 'ARR', value: fmtMoney(arr), icon: <ShowChartIcon />, color: '#2A8A52', bg: '#F0F5F1', trend: 'MRR × 12', trendUp: true },
    { label: 'New MRR (Month)', value: fmtMoney(newMrrThisMonth), icon: <TrendingUpIcon />, color: '#1B6B3E', bg: '#F0F5F1', trend: 'new subs', trendUp: true },
    { label: 'Churned MRR (Month)', value: fmtMoney(churnedMrrThisMonth), icon: <TrendingDownIcon />, color: '#C0392B', bg: '#FAF0EE', trend: 'lost revenue', trendUp: false },
    { label: 'Net MRR Growth', value: fmtMoney(netMrrGrowth), icon: <TrendingUpIcon />, color: netMrrGrowth >= 0 ? '#2A8A52' : '#C0392B', bg: netMrrGrowth >= 0 ? '#F0F5F1' : '#FAF0EE', trend: 'new − churned', trendUp: netMrrGrowth >= 0 },
    { label: 'Paying Customers', value: totalPayingCustomers.toLocaleString(), icon: <PeopleAltOutlinedIcon />, color: '#1B6B3E', bg: '#F0F5F1', trend: `of ${totalUsers} total`, trendUp: true },
    { label: 'ARPU', value: fmtMoney(arpu), icon: <AttachMoneyIcon />, color: '#D08A28', bg: '#F5EAD3', trend: 'per month', trendUp: true },
    { label: 'Avg LTV', value: fmtMoney(ltv), icon: <ShowChartIcon />, color: '#1B6B3E', bg: '#F0F5F1', trend: '~14mo retention', trendUp: true },
  ];

  return (
    <AdminLayout>
      <Box sx={{ p: 3, bgcolor: '#FAF8F3', minHeight: '100vh' }}>
        {/* Header */}
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 3 }}>
          <Box>
            <Typography variant="h5" fontWeight={800}>Revenue & Growth</Typography>
            <Typography variant="body2" color="text.secondary">MRR, ARR, churn, and conversion analytics</Typography>
          </Box>
          <Button variant="outlined" onClick={() => navigate('/admin/crm/revenue/subscriptions')}>
            View Subscriptions
          </Button>
        </Stack>

        {loading && <LinearProgress sx={{ mb: 2, borderRadius: 1 }} />}

        {/* 8 Stat cards */}
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 2, mb: 3 }}>
          {STAT_CARDS.map(s => (
            <Card key={s.label} elevation={0} sx={{ border: '1px solid', borderColor: 'grey.200', borderRadius: 2, p: 2 }}>
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                <Box sx={{ width: 32, height: 32, borderRadius: 1.5, bgcolor: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color, '& svg': { fontSize: 18 } }}>
                  {s.icon}
                </Box>
              </Stack>
              <Typography variant="h6" fontWeight={800} sx={{ color: s.color, lineHeight: 1.1 }}>{s.value}</Typography>
              <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" sx={{ mt: 0.25 }}>{s.label}</Typography>
              <Typography variant="caption" sx={{ color: s.trendUp ? '#2A8A52' : '#C0392B', fontSize: '0.65rem', fontWeight: 600 }}>{s.trend}</Typography>
            </Card>
          ))}
        </Box>

        {/* Charts row 1: MRR trend + Revenue by plan */}
        <Stack direction={{ xs: 'column', lg: 'row' }} spacing={2} sx={{ mb: 2 }}>
          {/* MRR Over Time */}
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'grey.200', borderRadius: 2, p: 2.5, flex: 2 }}>
            <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>MRR Over Time</Typography>
            {mrrTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={mrrTrend} margin={{ top: 4, right: 16, bottom: 0, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F7F3EC" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis tickFormatter={v => `$${v}`} tick={{ fontSize: 11 }} width={60} />
                  <Tooltip formatter={(v: unknown) => [fmtMoney(Number(v)), 'MRR']} />
                  <Line type="monotone" dataKey="mrr" stroke="#2A8A52" strokeWidth={2.5} dot={{ r: 4, fill: '#2A8A52' }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <Box sx={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography color="text.disabled">No snapshot data yet. Runs on the 1st of each month.</Typography>
              </Box>
            )}
          </Card>

          {/* Revenue by Plan Pie */}
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'grey.200', borderRadius: 2, p: 2.5, flex: 1 }}>
            <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>Revenue by Plan</Typography>
            {planBreakdown.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie data={planBreakdown} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value">
                      {planBreakdown.map(entry => (
                        <Cell key={entry.plan} fill={PLAN_COLORS[entry.plan] ?? '#8A8070'} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: unknown) => [fmtMoney(Number(v)), 'MRR']} />
                  </PieChart>
                </ResponsiveContainer>
                <Stack spacing={0.5} sx={{ mt: 1 }}>
                  {planBreakdown.map(p => (
                    <Stack key={p.plan} direction="row" justifyContent="space-between" alignItems="center">
                      <Stack direction="row" spacing={0.75} alignItems="center">
                        <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: PLAN_COLORS[p.plan] ?? '#8A8070' }} />
                        <Typography variant="caption" fontWeight={600}>{p.name}</Typography>
                        <Typography variant="caption" color="text.secondary">×{p.count}</Typography>
                      </Stack>
                      <Typography variant="caption" fontWeight={700}>{fmtMoney(p.value)}</Typography>
                    </Stack>
                  ))}
                </Stack>
              </>
            ) : (
              <Box sx={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography color="text.disabled" variant="caption">No paying customers yet.</Typography>
              </Box>
            )}
          </Card>
        </Stack>

        {/* Charts row 2: New vs Churned + Conversion Funnel */}
        <Stack direction={{ xs: 'column', lg: 'row' }} spacing={2} sx={{ mb: 2 }}>
          {/* New vs Churned Bar */}
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'grey.200', borderRadius: 2, p: 2.5, flex: 2 }}>
            <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>New vs Churned MRR — Last 6 Months</Typography>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={newVsChurned} margin={{ top: 4, right: 16, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F7F3EC" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={v => `$${v}`} tick={{ fontSize: 11 }} width={55} />
                <Tooltip formatter={(v: unknown, name: unknown) => [fmtMoney(Number(v)), String(name) === 'newMrr' ? 'New MRR' : 'Churned MRR']} />
                <Legend formatter={(value) => value === 'newMrr' ? 'New MRR' : 'Churned MRR'} />
                <Bar dataKey="newMrr" fill="#2A8A52" radius={[3, 3, 0, 0]} maxBarSize={40} />
                <Bar dataKey="churnedMrr" fill="#C0392B" radius={[3, 3, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </Card>

          {/* Conversion Funnel */}
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'grey.200', borderRadius: 2, p: 2.5, flex: 1 }}>
            <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>Conversion Funnel</Typography>
            <Stack spacing={1.5}>
              {funnelData.map((stage, i) => {
                const pct = funnelData[0].count > 0 ? Math.round(stage.count / funnelData[0].count * 100) : 0;
                const prevPct = i > 0 && funnelData[i - 1].count > 0
                  ? Math.round(stage.count / funnelData[i - 1].count * 100)
                  : null;
                return (
                  <Box key={stage.stage}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
                      <Typography variant="caption" fontWeight={600}>{stage.stage}</Typography>
                      <Stack direction="row" spacing={0.75} alignItems="center">
                        <Typography variant="caption" fontWeight={800}>{stage.count.toLocaleString()}</Typography>
                        {prevPct !== null && (
                          <Chip label={`${prevPct}% step`} size="small" sx={{ height: 16, fontSize: '0.6rem', fontWeight: 700, bgcolor: '#F7F3EC', color: '#8A8070' }} />
                        )}
                      </Stack>
                    </Stack>
                    <Box sx={{ position: 'relative', height: 10, bgcolor: '#E8E4DC', borderRadius: 5, overflow: 'hidden' }}>
                      <Box sx={{ height: '100%', width: `${pct}%`, bgcolor: stage.color, borderRadius: 5, transition: 'width 0.5s ease' }} />
                    </Box>
                    <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.65rem' }}>{pct}% of signups</Typography>
                  </Box>
                );
              })}
            </Stack>

            <Divider sx={{ my: 1.5 }} />
            <Typography variant="caption" color="text.secondary">
              Free→Paid: <strong style={{ color: '#2A8A52' }}>{totalUsers > 0 ? (paidCount / totalUsers * 100).toFixed(1) : '0'}%</strong>
            </Typography>
          </Card>
        </Stack>
      </Box>
    </AdminLayout>
  );
}
