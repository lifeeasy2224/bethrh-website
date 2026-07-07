import { useState, useEffect, useCallback } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import LinearProgress from '@mui/material/LinearProgress';
import Table from '@mui/material/Table';
import TableHead from '@mui/material/TableHead';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';
import TablePagination from '@mui/material/TablePagination';
import Tooltip from '@mui/material/Tooltip';
import Divider from '@mui/material/Divider';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SearchIcon from '@mui/icons-material/Search';
import DownloadIcon from '@mui/icons-material/Download';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { useParams, useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/AdminLayout';
import { adminDb } from '../../lib/adminDb';
import { useAdminAuth } from '../../contexts/AdminAuthContext';

interface Campaign {
  id: string;
  name: string;
  subject: string;
  status: string;
  from_name: string;
  from_email: string;
  total_recipients: number;
  sent_count: number;
  deliver_count: number;
  open_count: number;
  click_count: number;
  bounce_count: number;
  unsubscribe_count: number;
  ab_enabled: boolean;
  ab_variants: Array<{ label: string; subject: string; split: number }> | null;
  sent_at: string | null;
  created_at: string;
}

interface Recipient {
  id: string;
  email: string;
  full_name: string | null;
  status: string;
  ab_variant: string | null;
  sent_at: string | null;
  opened_at: string | null;
  clicked_at: string | null;
  delivered_at: string | null;
  bounced_at: string | null;
}

const STATUS_META: Record<string, { label: string; color: string; bg: string }> = {
  pending:     { label: 'Pending',     color: '#8A8070', bg: '#F7F3EC' },
  sent:        { label: 'Sent',        color: '#1B6B3E', bg: '#F0F5F1' },
  delivered:   { label: 'Delivered',   color: '#2A8A52', bg: '#F0F5F1' },
  opened:      { label: 'Opened',      color: '#2A8A52', bg: '#F0F5F1' },
  clicked:     { label: 'Clicked',     color: '#D08A28', bg: '#F5EAD3' },
  bounced:     { label: 'Bounced',     color: '#C0392B', bg: '#FAF0EE' },
  failed:      { label: 'Failed',      color: '#C0392B', bg: '#FAF0EE' },
  unsubscribed:{ label: 'Unsubscribed',color: '#8A8070', bg: '#F7F3EC' },
};

function fmtTime(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function pct(a: number, b: number): number {
  if (!b) return 0;
  return a / b * 100;
}

interface GaugeProps { value: number; label: string; benchmark: number; good: number; warn: number; }

function PerformanceGauge({ value, label, benchmark, good, warn }: GaugeProps) {
  const color = value >= good ? '#2A8A52' : value >= warn ? '#D08A28' : '#C0392B';
  const size = 100;
  const strokeW = 10;
  const r = (size - strokeW) / 2;
  const circ = 2 * Math.PI * r;
  // 270° arc (from 135° to 405°)
  const arcFrac = 0.75;
  const arcLen = circ * arcFrac;
  const filled = arcLen * Math.min(value / (good * 1.5), 1);
  const benchmarkFilled = arcLen * Math.min(benchmark / (good * 1.5), 1);

  return (
    <Box sx={{ textAlign: 'center', flex: 1 }}>
      <Box sx={{ position: 'relative', width: size, height: size, mx: 'auto' }}>
        <svg width={size} height={size} style={{ transform: 'rotate(135deg)' }}>
          {/* Track */}
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#E8E4DC" strokeWidth={strokeW}
            strokeDasharray={`${arcLen} ${circ - arcLen}`} strokeLinecap="round" />
          {/* Benchmark marker */}
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#B5AE9F" strokeWidth={2}
            strokeDasharray={`1 ${circ - 1}`} strokeDashoffset={-(benchmarkFilled - 1)} strokeLinecap="round" />
          {/* Value arc */}
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={strokeW}
            strokeDasharray={`${filled} ${circ - filled}`} strokeLinecap="round" style={{ transition: 'stroke-dasharray 0.5s ease' }} />
        </svg>
        <Box sx={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', mt: 0.5 }}>
          <Typography variant="h6" fontWeight={800} sx={{ color, lineHeight: 1, fontSize: '1.1rem' }}>
            {value.toFixed(1)}%
          </Typography>
        </Box>
      </Box>
      <Typography variant="body2" fontWeight={700} sx={{ mt: 0.5 }}>{label}</Typography>
      <Typography variant="caption" color="text.secondary">Benchmark: {benchmark}%</Typography>
    </Box>
  );
}

export default function AdminCampaignReport() {
  const { id } = useParams<{ id: string }>();
  const { sessionToken } = useAdminAuth();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [loading, setLoading] = useState(true);
  const [recipientsLoading, setRecipientsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const rowsPerPage = 50;

  const load = useCallback(async () => {
    if (!id || !sessionToken) return;
    setLoading(true);
    const { data } = await adminDb(sessionToken, 'marketing_campaigns')
      .select('*', { match: { id }, single: true });
    setCampaign((data ?? null) as Campaign | null);
    setLoading(false);
  }, [id, sessionToken]);

  const loadRecipients = useCallback(async () => {
    if (!id || !sessionToken) return;
    setRecipientsLoading(true);
    const { data } = await adminDb(sessionToken, 'campaign_recipients')
      .select('id,email,full_name,status,ab_variant,sent_at,opened_at,clicked_at,delivered_at,bounced_at', { match: { campaign_id: id }, order: { column: 'sent_at', ascending: false }, limit: 1000 });
    setRecipients((data ?? []) as Recipient[]);
    setRecipientsLoading(false);
  }, [id, sessionToken]);

  useEffect(() => { void load(); void loadRecipients(); }, [load, loadRecipients]);

  const filteredRecipients = recipients.filter(r => {
    const matchStatus = statusFilter === 'all' || r.status === statusFilter;
    const matchSearch = !search || r.email.toLowerCase().includes(search.toLowerCase()) || (r.full_name ?? '').toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  const paginated = filteredRecipients.slice(page * rowsPerPage, (page + 1) * rowsPerPage);

  function exportCsv() {
    const header = 'Email,Name,Variant,Status,Sent At,Opened At,Clicked At';
    const rows = filteredRecipients.map(r =>
      [r.email, r.full_name ?? '', r.ab_variant ?? '', r.status, fmtTime(r.sent_at), fmtTime(r.opened_at), fmtTime(r.clicked_at)].join(',')
    );
    const csv = [header, ...rows].join('\n');
    const a = document.createElement('a');
    a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv);
    a.download = `campaign-report-${id}.csv`;
    a.click();
  }

  // A/B test breakdown
  function getAbStats() {
    if (!campaign?.ab_enabled || !campaign.ab_variants) return null;
    return campaign.ab_variants.map(v => {
      const varRec = recipients.filter(r => r.ab_variant === v.label);
      const sent = varRec.length;
      const opened = varRec.filter(r => ['opened', 'clicked'].includes(r.status)).length;
      const openRate = pct(opened, sent);
      return { ...v, sent, opened, openRate };
    });
  }
  const abStats = getAbStats();
  const abWinner = abStats ? abStats.reduce((best, v) => v.openRate > best.openRate ? v : best, abStats[0]) : null;

  if (loading) {
    return <AdminLayout><LinearProgress /></AdminLayout>;
  }

  if (!campaign) {
    return <AdminLayout><Box sx={{ p: 3 }}><Typography>Campaign not found.</Typography></Box></AdminLayout>;
  }

  const sent = campaign.sent_count;
  const delivered = campaign.deliver_count;
  const opened = campaign.open_count;
  const clicked = campaign.click_count;
  const bounced = campaign.bounce_count;
  const unsubscribed = campaign.unsubscribe_count;

  const openRate = pct(opened, delivered);
  const clickRate = pct(clicked, opened);
  const deliverRate = pct(delivered, sent);
  const bounceRate = pct(bounced, sent);

  return (
    <AdminLayout>
      <Box sx={{ p: 3, bgcolor: '#FAF8F3', minHeight: '100vh' }}>
        {/* Header */}
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
          <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/admin/marketing/campaigns')} size="small" sx={{ color: 'text.secondary' }}>
            Back
          </Button>
        </Stack>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 3 }}>
          <Box>
            <Typography variant="h5" fontWeight={800}>{campaign.name}</Typography>
            <Typography variant="body2" color="text.secondary">Subject: {campaign.subject}</Typography>
          </Box>
          <Chip
            label={campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
            size="small"
            sx={{ bgcolor: campaign.status === 'sent' ? '#F0F5F1' : '#F7F3EC', color: campaign.status === 'sent' ? '#2A8A52' : '#8A8070', fontWeight: 700 }}
          />
        </Stack>

        {/* Top stat cards */}
        <Stack direction="row" spacing={2} sx={{ mb: 3 }} flexWrap="wrap">
          {[
            { label: 'Sent', value: sent.toLocaleString(), sub: '100%', color: '#8A8070', bg: '#F7F3EC' },
            { label: 'Delivered', value: delivered.toLocaleString(), sub: `${deliverRate.toFixed(1)}% of sent`, color: '#1B6B3E', bg: '#F0F5F1' },
            { label: 'Opened', value: opened.toLocaleString(), sub: `${openRate.toFixed(1)}% of delivered`, color: '#2A8A52', bg: '#F0F5F1' },
            { label: 'Clicked', value: clicked.toLocaleString(), sub: `${clickRate.toFixed(1)}% of opened`, color: '#D08A28', bg: '#F5EAD3' },
            { label: 'Unsubscribed', value: unsubscribed.toLocaleString(), sub: `${pct(unsubscribed, sent).toFixed(1)}% of sent`, color: '#D08A28', bg: '#FAF5E9' },
            { label: 'Bounced', value: bounced.toLocaleString(), sub: `${bounceRate.toFixed(1)}% of sent`, color: '#C0392B', bg: '#FAF0EE' },
          ].map(s => (
            <Card key={s.label} elevation={0} sx={{ border: '1px solid', borderColor: 'grey.200', borderRadius: 2, p: 2, minWidth: 110, flex: '1 1 auto' }}>
              <Typography variant="caption" color="text.secondary" fontWeight={600} display="block">{s.label}</Typography>
              <Typography variant="h6" fontWeight={800} sx={{ color: s.color, my: 0.25 }}>{s.value}</Typography>
              <Typography variant="caption" color="text.secondary">{s.sub}</Typography>
            </Card>
          ))}
        </Stack>

        {/* Performance gauges + funnel */}
        <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 3 }}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'grey.200', borderRadius: 2, p: 2.5, flex: 1 }}>
            <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2 }}>Performance Gauges</Typography>
            <Stack direction="row" spacing={2}>
              <PerformanceGauge value={openRate} label="Open Rate" benchmark={21} good={25} warn={15} />
              <PerformanceGauge value={clickRate} label="Click Rate" benchmark={2.5} good={5} warn={2} />
            </Stack>
            <Typography variant="caption" color="text.disabled" textAlign="center" display="block" sx={{ mt: 1 }}>
              Industry benchmarks: SaaS open rate 21%, click rate 2.5%
            </Typography>
          </Card>

          {/* Email funnel */}
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'grey.200', borderRadius: 2, p: 2.5, flex: 1 }}>
            <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2 }}>Email Funnel</Typography>
            <Stack spacing={1}>
              {[
                { label: 'Sent', count: sent, color: '#8A8070', width: 100 },
                { label: 'Delivered', count: delivered, color: '#1B6B3E', width: pct(delivered, sent) },
                { label: 'Opened', count: opened, color: '#2A8A52', width: pct(opened, sent) },
                { label: 'Clicked', count: clicked, color: '#D08A28', width: pct(clicked, sent) },
              ].map(f => (
                <Box key={f.label}>
                  <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.25 }}>
                    <Typography variant="caption" fontWeight={600}>{f.label}</Typography>
                    <Typography variant="caption" fontWeight={600}>{f.count.toLocaleString()}</Typography>
                  </Stack>
                  <Box sx={{ height: 8, bgcolor: '#E8E4DC', borderRadius: 4, overflow: 'hidden' }}>
                    <Box sx={{ height: '100%', width: `${Math.min(f.width, 100)}%`, bgcolor: f.color, borderRadius: 4, transition: 'width 0.4s ease' }} />
                  </Box>
                </Box>
              ))}
            </Stack>
          </Card>
        </Stack>

        {/* A/B Test Results */}
        {abStats && abStats.length > 0 && (
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'grey.200', borderRadius: 2, p: 2.5, mb: 3 }}>
            <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5 }}>A/B Test Results</Typography>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: '#FAF8F3' }}>
                  {['Variant', 'Subject', 'Split', 'Sent', 'Opened', 'Open Rate', 'Winner'].map(h => (
                    <TableCell key={h} sx={{ fontWeight: 700, fontSize: '0.75rem', color: '#8A8070' }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {abStats.map(v => (
                  <TableRow key={v.label} sx={{ '&:last-child td': { border: 0 } }}>
                    <TableCell><Chip label={`Variant ${v.label}`} size="small" sx={{ fontWeight: 700, fontSize: '0.7rem' }} /></TableCell>
                    <TableCell><Typography variant="caption">{v.subject}</Typography></TableCell>
                    <TableCell><Typography variant="caption">{v.split}%</Typography></TableCell>
                    <TableCell><Typography variant="body2" fontWeight={600}>{v.sent}</Typography></TableCell>
                    <TableCell><Typography variant="body2" fontWeight={600}>{v.opened}</Typography></TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={700} sx={{ color: v.label === abWinner?.label ? '#2A8A52' : 'text.primary' }}>
                        {v.openRate.toFixed(1)}%
                      </Typography>
                    </TableCell>
                    <TableCell>
                      {v.label === abWinner?.label && <CheckCircleOutlineIcon sx={{ fontSize: 18, color: '#2A8A52' }} />}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}

        {/* Recipient list */}
        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'grey.200' }}>
          <Box sx={{ px: 2.5, pt: 2.5, pb: 1.5 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
              <Typography variant="subtitle1" fontWeight={700}>
                Recipients ({filteredRecipients.length.toLocaleString()})
              </Typography>
              <Tooltip title="Export filtered recipients to CSV">
                <Button size="small" startIcon={<DownloadIcon />} onClick={exportCsv} variant="outlined">
                  Export CSV
                </Button>
              </Tooltip>
            </Stack>
            <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
              <TextField
                size="small" placeholder="Search email or name..."
                value={search} onChange={e => { setSearch(e.target.value); setPage(0); }} sx={{ width: 260 }}
                InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 18, color: 'text.disabled' }} /></InputAdornment> }}
              />
              <Stack direction="row" spacing={0.5} flexWrap="wrap">
                {['all', 'sent', 'delivered', 'opened', 'clicked', 'bounced', 'unsubscribed'].map(s => (
                  <Chip key={s} label={s === 'all' ? 'All' : STATUS_META[s]?.label ?? s} size="small"
                    onClick={() => { setStatusFilter(s); setPage(0); }}
                    sx={{ cursor: 'pointer', fontWeight: 600, fontSize: '0.7rem',
                      bgcolor: statusFilter === s ? '#1B6B3E' : 'white', color: statusFilter === s ? 'white' : 'text.secondary',
                      border: '1px solid', borderColor: statusFilter === s ? '#1B6B3E' : 'grey.200' }}
                  />
                ))}
              </Stack>
            </Stack>
          </Box>
          <Divider />
          {recipientsLoading && <LinearProgress />}
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#FAF8F3' }}>
                {['Email', 'Name', 'Variant', 'Status', 'Sent', 'Opened', 'Clicked'].map(h => (
                  <TableCell key={h} sx={{ fontWeight: 700, fontSize: '0.75rem', color: '#8A8070' }}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {paginated.map(r => {
                const sm = STATUS_META[r.status] ?? STATUS_META.sent;
                return (
                  <TableRow key={r.id} sx={{ '&:last-child td': { border: 0 } }}>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>{r.email}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{r.full_name ?? '—'}</Typography>
                    </TableCell>
                    <TableCell>
                      {r.ab_variant ? <Chip label={r.ab_variant} size="small" sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700, bgcolor: '#F5EAD3', color: '#D08A28' }} /> : <Typography variant="caption" color="text.disabled">—</Typography>}
                    </TableCell>
                    <TableCell>
                      <Chip label={sm.label} size="small" sx={{ bgcolor: sm.bg, color: sm.color, fontWeight: 700, fontSize: '0.7rem', height: 20 }} />
                    </TableCell>
                    <TableCell><Typography variant="caption" color="text.secondary">{fmtTime(r.sent_at)}</Typography></TableCell>
                    <TableCell><Typography variant="caption" color="text.secondary">{fmtTime(r.opened_at)}</Typography></TableCell>
                    <TableCell><Typography variant="caption" color="text.secondary">{fmtTime(r.clicked_at)}</Typography></TableCell>
                  </TableRow>
                );
              })}
              {!recipientsLoading && filteredRecipients.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                    No recipients match your filters.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          {filteredRecipients.length > rowsPerPage && (
            <TablePagination
              component="div" count={filteredRecipients.length} page={page} rowsPerPage={rowsPerPage}
              onPageChange={(_, p) => setPage(p)} rowsPerPageOptions={[]} />
          )}
        </Card>
      </Box>
    </AdminLayout>
  );
}
