import { useState, useEffect, useCallback } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Chip from '@mui/material/Chip';
import LinearProgress from '@mui/material/LinearProgress';
import Table from '@mui/material/Table';
import TableHead from '@mui/material/TableHead';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';
import Button from '@mui/material/Button';
import SendOutlinedIcon from '@mui/icons-material/SendOutlined';
import MarkEmailReadOutlinedIcon from '@mui/icons-material/MarkEmailReadOutlined';
import AdsClickOutlinedIcon from '@mui/icons-material/AdsClickOutlined';
import BlockIcon from '@mui/icons-material/Block';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import AddIcon from '@mui/icons-material/Add';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/AdminLayout';
import { adminDb } from '../../lib/adminDb';
import { useAdminAuth } from '../../contexts/AdminAuthContext';

interface Campaign {
  id: string;
  name: string;
  status: string;
  total_recipients: number;
  sent_count: number;
  deliver_count: number;
  open_count: number;
  click_count: number;
  bounce_count: number;
  unsubscribe_count: number;
  sent_at: string | null;
  created_at: string;
}

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  draft:     { label: 'Draft',     color: '#8A8070', bg: '#F7F3EC' },
  scheduled: { label: 'Scheduled', color: '#D08A28', bg: '#F5EAD3' },
  sending:   { label: 'Sending',   color: '#1B6B3E', bg: '#F0F5F1' },
  sent:      { label: 'Sent',      color: '#2A8A52', bg: '#F0F5F1' },
  cancelled: { label: 'Cancelled', color: '#C0392B', bg: '#FAF0EE' },
};

function pct(a: number, b: number) {
  if (!b) return '—';
  return `${(a / b * 100).toFixed(1)}%`;
}

function fmtDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function AdminMarketingDashboard() {
  const navigate = useNavigate();
  const { sessionToken } = useAdminAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [suppCount, setSuppCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!sessionToken) return;
    setLoading(true);
    const [{ data: campData }, { count }] = await Promise.all([
      adminDb(sessionToken, 'marketing_campaigns')
        .select('id,name,status,total_recipients,sent_count,deliver_count,open_count,click_count,bounce_count,unsubscribe_count,sent_at,created_at', { order: { column: 'created_at', ascending: false }, limit: 50 }),
      adminDb(sessionToken, 'email_suppression_list').select('*', { count: 'exact', head: true }),
    ]);
    setCampaigns((campData ?? []) as Campaign[]);
    setSuppCount(count ?? 0);
    setLoading(false);
  }, [sessionToken]);

  useEffect(() => { void load(); }, [load]);

  const sentCampaigns = campaigns.filter(c => c.status === 'sent');
  const totalSent = sentCampaigns.reduce((s, c) => s + c.sent_count, 0);
  const totalDelivered = sentCampaigns.reduce((s, c) => s + c.deliver_count, 0);
  const totalOpened = sentCampaigns.reduce((s, c) => s + c.open_count, 0);
  const totalClicked = sentCampaigns.reduce((s, c) => s + c.click_count, 0);

  const avgOpenRate = totalDelivered > 0 ? (totalOpened / totalDelivered * 100) : 0;
  const avgClickRate = totalOpened > 0 ? (totalClicked / totalOpened * 100) : 0;

  // Last 10 sent campaigns for the table
  const recentSent = sentCampaigns.slice(0, 10);

  // Performance trend: last 10 sent campaigns (oldest first for chart)
  const trendData = recentSent.slice().reverse();

  return (
    <AdminLayout>
      <Box sx={{ p: 3, bgcolor: '#FAF8F3', minHeight: '100vh' }}>
        {/* Header */}
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 3 }}>
          <Box>
            <Typography variant="h5" fontWeight={800}>Marketing Overview</Typography>
            <Typography variant="body2" color="text.secondary">Campaign performance and email marketing stats</Typography>
          </Box>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/admin/marketing/campaigns/new')}>
            New Campaign
          </Button>
        </Stack>

        {loading && <LinearProgress sx={{ mb: 2, borderRadius: 1 }} />}

        {/* Stat cards */}
        <Stack direction="row" spacing={2} sx={{ mb: 3 }} flexWrap="wrap">
          {[
            { label: 'Campaigns Sent', value: sentCampaigns.length, icon: <SendOutlinedIcon sx={{ fontSize: 20 }} />, color: '#1B6B3E', bg: '#F0F5F1' },
            { label: 'Emails Sent', value: totalSent.toLocaleString(), icon: <EmailOutlinedIcon sx={{ fontSize: 20 }} />, color: '#2A8A52', bg: '#F0F5F1' },
            { label: 'Avg Open Rate', value: `${avgOpenRate.toFixed(1)}%`, icon: <MarkEmailReadOutlinedIcon sx={{ fontSize: 20 }} />, color: '#2A8A52', bg: '#F0F5F1' },
            { label: 'Avg Click Rate', value: `${avgClickRate.toFixed(1)}%`, icon: <AdsClickOutlinedIcon sx={{ fontSize: 20 }} />, color: '#D08A28', bg: '#F5EAD3' },
            { label: 'Suppressed', value: suppCount.toLocaleString(), icon: <BlockIcon sx={{ fontSize: 20 }} />, color: '#C0392B', bg: '#FAF0EE' },
            { label: 'Active Automations', value: '0', icon: <TrendingUpIcon sx={{ fontSize: 20 }} />, color: '#8A8070', bg: '#F7F3EC' },
          ].map(s => (
            <Card key={s.label} elevation={0} sx={{ border: '1px solid', borderColor: 'grey.200', borderRadius: 2, p: 2, minWidth: 130, flex: '1 1 auto' }}>
              <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1 }}>
                <Box sx={{ width: 36, height: 36, borderRadius: 1.5, bgcolor: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color }}>
                  {s.icon}
                </Box>
              </Stack>
              <Typography variant="h6" fontWeight={800} sx={{ color: s.color }}>{s.value}</Typography>
              <Typography variant="caption" color="text.secondary" fontWeight={600}>{s.label}</Typography>
            </Card>
          ))}
        </Stack>

        {/* Industry benchmarks */}
        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'grey.200', borderRadius: 2, p: 2.5, mb: 3 }}>
          <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>Performance vs. Industry Benchmarks (SaaS)</Typography>
          <Stack direction="row" spacing={4} flexWrap="wrap">
            {[
              { label: 'Open Rate', yours: avgOpenRate, benchmark: 21, good: 25, warn: 15 },
              { label: 'Click Rate', yours: avgClickRate, benchmark: 2.5, good: 5, warn: 2 },
            ].map(m => {
              const color = m.yours >= m.good ? '#2A8A52' : m.yours >= m.warn ? '#D08A28' : '#C0392B';
              return (
                <Box key={m.label} sx={{ minWidth: 260, flex: '1 1 auto' }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
                    <Typography variant="body2" fontWeight={600}>{m.label}</Typography>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Typography variant="body2" fontWeight={800} sx={{ color }}>{m.yours.toFixed(1)}%</Typography>
                      <Typography variant="caption" color="text.secondary">vs {m.benchmark}% avg</Typography>
                    </Stack>
                  </Stack>
                  <Box sx={{ position: 'relative', height: 8, bgcolor: '#E8E4DC', borderRadius: 4, overflow: 'hidden' }}>
                    <Box sx={{ height: '100%', width: `${Math.min(m.yours / (m.good * 1.5) * 100, 100)}%`, bgcolor: color, borderRadius: 4, transition: 'width 0.4s ease' }} />
                  </Box>
                  <Stack direction="row" justifyContent="space-between" sx={{ mt: 0.5 }}>
                    <Typography variant="caption" color="text.disabled">0%</Typography>
                    <Typography variant="caption" color="text.disabled">Benchmark: {m.benchmark}%</Typography>
                    <Typography variant="caption" color="text.disabled">Good: {m.good}%+</Typography>
                  </Stack>
                </Box>
              );
            })}
          </Stack>
        </Card>

        {/* Performance trend sparkline */}
        {trendData.length > 1 && (
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'grey.200', borderRadius: 2, p: 2.5, mb: 3 }}>
            <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2 }}>Open Rate Trend — Last {trendData.length} Campaigns</Typography>
            <Box sx={{ display: 'flex', alignItems: 'flex-end', gap: 1, height: 60 }}>
              {trendData.map((c, i) => {
                const rate = c.deliver_count > 0 ? (c.open_count / c.deliver_count * 100) : 0;
                const maxRate = Math.max(...trendData.map(x => x.deliver_count > 0 ? x.open_count / x.deliver_count * 100 : 0), 1);
                const h = Math.max((rate / maxRate) * 100, 4);
                const color = rate >= 25 ? '#2A8A52' : rate >= 15 ? '#D08A28' : '#C0392B';
                return (
                  <Box key={c.id} sx={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
                    <Typography variant="caption" sx={{ fontSize: '0.6rem', color, fontWeight: 700 }}>{rate.toFixed(0)}%</Typography>
                    <Box sx={{ width: '100%', height: `${h}%`, bgcolor: color, borderRadius: '3px 3px 0 0', opacity: 0.8, transition: 'all 0.3s' }} />
                    <Typography variant="caption" sx={{ fontSize: '0.55rem', color: 'text.disabled', writing: 'mode' }} noWrap>
                      {i + 1}
                    </Typography>
                  </Box>
                );
              })}
            </Box>
          </Card>
        )}

        {/* Recent campaigns table */}
        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'grey.200' }}>
          <Box sx={{ px: 2.5, pt: 2.5, pb: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="subtitle1" fontWeight={700}>Recent Campaigns</Typography>
            <Button size="small" onClick={() => navigate('/admin/marketing/campaigns')}>View All</Button>
          </Box>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#FAF8F3' }}>
                {['Campaign', 'Date Sent', 'Recipients', 'Open Rate', 'Click Rate', 'Status', ''].map(col => (
                  <TableCell key={col} sx={{ fontWeight: 700, fontSize: '0.75rem', color: '#8A8070' }}>{col}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {recentSent.map(c => {
                const meta = STATUS_META[c.status] ?? STATUS_META.draft;
                const openRate = pct(c.open_count, c.deliver_count);
                const clickRate = pct(c.click_count, c.open_count);
                return (
                  <TableRow
                    key={c.id}
                    sx={{ '&:last-child td': { border: 0 }, '&:hover': { bgcolor: '#FAF8F3', cursor: 'pointer' } }}
                    onClick={() => navigate(`/admin/marketing/campaigns/${c.id}/report`)}
                  >
                    <TableCell>
                      <Typography variant="body2" fontWeight={700}>{c.name}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary">{fmtDate(c.sent_at)}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>{c.total_recipients.toLocaleString()}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600} color={openRate !== '—' && parseFloat(openRate) >= 21 ? '#2A8A52' : 'text.primary'}>
                        {openRate}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600} color={clickRate !== '—' && parseFloat(clickRate) >= 2.5 ? '#2A8A52' : 'text.primary'}>
                        {clickRate}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={meta.label} size="small" sx={{ bgcolor: meta.bg, color: meta.color, fontWeight: 700, fontSize: '0.7rem', height: 20 }} />
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" sx={{ color: '#1B6B3E', fontWeight: 600 }}>View Report →</Typography>
                    </TableCell>
                  </TableRow>
                );
              })}
              {!loading && recentSent.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 5, color: 'text.secondary' }}>
                    No sent campaigns yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      </Box>
    </AdminLayout>
  );
}
