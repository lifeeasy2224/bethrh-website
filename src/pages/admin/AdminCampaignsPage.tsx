import { useState, useEffect, useCallback } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import LinearProgress from '@mui/material/LinearProgress';
import Table from '@mui/material/Table';
import TableHead from '@mui/material/TableHead';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';
import Tooltip from '@mui/material/Tooltip';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Divider from '@mui/material/Divider';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import SendOutlinedIcon from '@mui/icons-material/SendOutlined';
import DraftsOutlinedIcon from '@mui/icons-material/DraftsOutlined';
import ScheduleIcon from '@mui/icons-material/Schedule';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import OpenInFullIcon from '@mui/icons-material/OpenInFull';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/AdminLayout';
import { adminDb } from '../../lib/adminDb';
import { useAdminAuth } from '../../contexts/AdminAuthContext';

interface Campaign {
  id: string;
  name: string;
  subject: string;
  status: string;
  total_recipients: number;
  sent_count: number;
  open_count: number;
  click_count: number;
  scheduled_at: string | null;
  sent_at: string | null;
  created_at: string;
  ab_enabled: boolean;
}

const STATUS_META: Record<string, { label: string; color: string; bg: string; icon: React.ReactNode }> = {
  draft:     { label: 'Draft',     color: '#8A8070', bg: '#F7F3EC', icon: <DraftsOutlinedIcon sx={{ fontSize: 14 }} /> },
  scheduled: { label: 'Scheduled', color: '#D08A28', bg: '#F5EAD3', icon: <ScheduleIcon sx={{ fontSize: 14 }} /> },
  sending:   { label: 'Sending',   color: '#1B6B3E', bg: '#F0F5F1', icon: <SendOutlinedIcon sx={{ fontSize: 14 }} /> },
  sent:      { label: 'Sent',      color: '#2A8A52', bg: '#F0F5F1', icon: <CheckCircleOutlineIcon sx={{ fontSize: 14 }} /> },
  cancelled: { label: 'Cancelled', color: '#C0392B', bg: '#FAF0EE', icon: <CancelOutlinedIcon sx={{ fontSize: 14 }} /> },
};

function fmtDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function pct(a: number, b: number) {
  if (!b) return '0%';
  return `${Math.round((a / b) * 100)}%`;
}

export default function AdminCampaignsPage() {
  const navigate = useNavigate();
  const { sessionToken } = useAdminAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const [menuCampaign, setMenuCampaign] = useState<Campaign | null>(null);

  const load = useCallback(async () => {
    if (!sessionToken) return;
    setLoading(true);
    const { data } = await adminDb(sessionToken, 'marketing_campaigns')
      .select('id,name,subject,status,total_recipients,sent_count,open_count,click_count,scheduled_at,sent_at,created_at,ab_enabled', { order: { column: 'created_at', ascending: false } });
    setCampaigns((data ?? []) as Campaign[]);
    setLoading(false);
  }, [sessionToken]);

  useEffect(() => { void load(); }, [load]);

  const filtered = campaigns.filter(c => {
    const matchSearch = !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.subject.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const stats = {
    total: campaigns.length,
    sent: campaigns.filter(c => c.status === 'sent').length,
    draft: campaigns.filter(c => c.status === 'draft').length,
    scheduled: campaigns.filter(c => c.status === 'scheduled').length,
    totalSent: campaigns.reduce((s, c) => s + c.sent_count, 0),
    totalOpens: campaigns.reduce((s, c) => s + c.open_count, 0),
  };

  async function handleDelete(id: string) {
    if (!sessionToken) return;
    await adminDb(sessionToken, 'marketing_campaigns').delete({ id });
    void load();
  }

  async function handleDuplicate(campaign: Campaign) {
    if (!sessionToken) return;
    await adminDb(sessionToken, 'marketing_campaigns').insert({
      name: `${campaign.name} (Copy)`,
      subject: campaign.subject,
      body_html: '',
      status: 'draft',
    });
    void load();
  }

  return (
    <AdminLayout>
      <Box sx={{ p: 3, bgcolor: '#FAF8F3', minHeight: '100vh' }}>
        {/* Header */}
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 3 }}>
          <Box>
            <Typography variant="h5" fontWeight={800}>Email Campaigns</Typography>
            <Typography variant="body2" color="text.secondary">Create and send targeted email campaigns</Typography>
          </Box>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate('/admin/marketing/campaigns/new')}>
            New Campaign
          </Button>
        </Stack>

        {/* Stat cards */}
        <Stack direction="row" spacing={2} sx={{ mb: 3 }} flexWrap="wrap">
          {[
            { label: 'Total Campaigns', value: stats.total, color: '#1B6B3E', bg: '#F0F5F1' },
            { label: 'Sent', value: stats.sent, color: '#2A8A52', bg: '#F0F5F1' },
            { label: 'Drafts', value: stats.draft, color: '#8A8070', bg: '#F7F3EC' },
            { label: 'Scheduled', value: stats.scheduled, color: '#D08A28', bg: '#F5EAD3' },
            { label: 'Emails Sent', value: stats.totalSent.toLocaleString(), color: '#2A8A52', bg: '#F0F5F1' },
            { label: 'Total Opens', value: stats.totalOpens.toLocaleString(), color: '#1B6B3E', bg: '#F0F5F1' },
          ].map(s => (
            <Card key={s.label} elevation={0} sx={{ border: '1px solid', borderColor: 'grey.200', borderRadius: 2, p: 2, minWidth: 120, flex: '1 1 auto' }}>
              <Typography variant="caption" color="text.secondary" fontWeight={600} display="block">{s.label}</Typography>
              <Typography variant="h6" fontWeight={800} sx={{ color: s.color, mt: 0.5 }}>{s.value}</Typography>
            </Card>
          ))}
        </Stack>

        {/* Filters */}
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }} flexWrap="wrap">
          <TextField
            size="small"
            placeholder="Search campaigns..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            sx={{ width: 280 }}
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 18, color: 'text.disabled' }} /></InputAdornment> }}
          />
          <Stack direction="row" spacing={0.5}>
            {['all', 'draft', 'scheduled', 'sending', 'sent', 'cancelled'].map(s => (
              <Chip
                key={s}
                label={s === 'all' ? 'All' : STATUS_META[s]?.label ?? s}
                size="small"
                onClick={() => setStatusFilter(s)}
                sx={{
                  cursor: 'pointer', fontWeight: 600, fontSize: '0.7rem',
                  bgcolor: statusFilter === s ? '#1B6B3E' : 'white',
                  color: statusFilter === s ? 'white' : 'text.secondary',
                  border: '1px solid',
                  borderColor: statusFilter === s ? '#1B6B3E' : 'grey.200',
                }}
              />
            ))}
          </Stack>
        </Stack>

        {loading && <LinearProgress sx={{ mb: 2, borderRadius: 1 }} />}

        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'grey.200' }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#FAF8F3' }}>
                {['Campaign', 'Status', 'Recipients', 'Open Rate', 'Click Rate', 'Date', ''].map(col => (
                  <TableCell key={col} sx={{ fontWeight: 700, fontSize: '0.75rem', color: '#8A8070' }}>{col}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map(c => {
                const meta = STATUS_META[c.status] ?? STATUS_META.draft;
                return (
                  <TableRow key={c.id} sx={{ '&:last-child td': { border: 0 }, '&:hover': { bgcolor: '#FAF8F3' } }}>
                    <TableCell sx={{ maxWidth: 260 }}>
                      <Stack direction="row" spacing={1} alignItems="flex-start">
                        <EmailOutlinedIcon sx={{ fontSize: 18, color: '#3AAD6A', mt: 0.2 }} />
                        <Box>
                          <Typography variant="body2" fontWeight={700} noWrap sx={{ maxWidth: 200 }}>{c.name}</Typography>
                          <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: 200, display: 'block' }}>{c.subject}</Typography>
                          {c.ab_enabled && <Chip label="A/B" size="small" sx={{ height: 16, fontSize: '0.6rem', fontWeight: 700, bgcolor: '#F5EAD3', color: '#D08A28', mt: 0.25 }} />}
                        </Box>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Chip
                        icon={meta.icon as React.ReactElement}
                        label={meta.label}
                        size="small"
                        sx={{ bgcolor: meta.bg, color: meta.color, fontWeight: 700, fontSize: '0.7rem', height: 22 }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>{c.total_recipients.toLocaleString()}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600} color={c.open_count > 0 ? '#2A8A52' : 'text.secondary'}>
                        {pct(c.open_count, c.sent_count)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600} color={c.click_count > 0 ? '#1B6B3E' : 'text.secondary'}>
                        {pct(c.click_count, c.sent_count)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary">
                        {fmtDate(c.sent_at ?? c.scheduled_at ?? c.created_at)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                        <Tooltip title="View Report">
                          <IconButton size="small" onClick={() => navigate(`/admin/marketing/campaigns/${c.id}`)}>
                            <OpenInFullIcon sx={{ fontSize: 15 }} />
                          </IconButton>
                        </Tooltip>
                        <IconButton size="small" onClick={e => { setMenuAnchor(e.currentTarget); setMenuCampaign(c); }}>
                          <MoreVertIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Stack>
                    </TableCell>
                  </TableRow>
                );
              })}
              {!loading && filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                    {search || statusFilter !== 'all' ? 'No campaigns match your filters.' : 'No campaigns yet. Create your first campaign above.'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      </Box>

      <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={() => setMenuAnchor(null)}>
        {menuCampaign?.status === 'draft' && (
          <MenuItem onClick={() => { navigate(`/admin/marketing/campaigns/${menuCampaign.id}/edit`); setMenuAnchor(null); }}>
            Edit Campaign
          </MenuItem>
        )}
        <MenuItem onClick={() => { if (menuCampaign) void handleDuplicate(menuCampaign); setMenuAnchor(null); }}>
          <ContentCopyIcon sx={{ fontSize: 16, mr: 1 }} /> Duplicate
        </MenuItem>
        <Divider />
        <MenuItem
          sx={{ color: 'error.main' }}
          onClick={() => { if (menuCampaign) void handleDelete(menuCampaign.id); setMenuAnchor(null); }}
        >
          <DeleteOutlineIcon sx={{ fontSize: 16, mr: 1 }} /> Delete
        </MenuItem>
      </Menu>
    </AdminLayout>
  );
}
