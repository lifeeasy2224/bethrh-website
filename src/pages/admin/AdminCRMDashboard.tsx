import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Chip from '@mui/material/Chip';
import Avatar from '@mui/material/Avatar';
import TextField from '@mui/material/TextField';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Table from '@mui/material/Table';
import TableHead from '@mui/material/TableHead';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';
import TableSortLabel from '@mui/material/TableSortLabel';
import Pagination from '@mui/material/Pagination';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import LinearProgress from '@mui/material/LinearProgress';
import InputAdornment from '@mui/material/InputAdornment';
import SearchIcon from '@mui/icons-material/Search';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import FiberNewIcon from '@mui/icons-material/FiberNew';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import AdminLayout from '../../components/AdminLayout';
import { adminDb } from '../../lib/adminDb';
import { useAdminAuth } from '../../contexts/AdminAuthContext';

type SortDir = 'asc' | 'desc';
type SortField = 'full_name' | 'email' | 'tier' | 'lead_score' | 'last_login_at' | 'created_at';

interface CRMUser {
  user_id: string;
  full_name: string | null;
  email?: string;
  role: string | null;
  tier: string | null;
  lead_score: number;
  lifecycle_stage: string | null;
  user_status: string | null;
  last_login_at: string | null;
  created_at: string | null;
  iq_score?: number;
  tags?: Array<{ name: string; color: string }>;
}

interface Stats {
  total: number;
  active7: number;
  atRisk: number;
  paying: number;
  newThisWeek: number;
  mrr: number;
}

function daysBetween(date: string | null): number {
  if (!date) return 999;
  return Math.floor((Date.now() - new Date(date).getTime()) / 86400000);
}

function calculateStatus(lastLogin: string | null): string {
  const d = daysBetween(lastLogin);
  if (d <= 7) return 'active';
  if (d <= 30) return 'inactive';
  if (d <= 60) return 'at_risk';
  return 'churned';
}

function statusChip(status: string) {
  const map: Record<string, { label: string; color: string; bg: string }> = {
    active: { label: 'Active', color: '#2A8A52', bg: '#DEEBE2' },
    inactive: { label: 'Inactive', color: '#D08A28', bg: '#F5EAD3' },
    at_risk: { label: 'At Risk', color: '#C0392B', bg: '#F5DDD9' },
    churned: { label: 'Churned', color: '#8A8070', bg: '#F7F3EC' },
  };
  const s = map[status] ?? map.inactive;
  return (
    <Chip
      label={s.label}
      size="small"
      sx={{ bgcolor: s.bg, color: s.color, fontWeight: 700, fontSize: '0.7rem', height: 20 }}
    />
  );
}

function lifecycleChip(stage: string | null) {
  const map: Record<string, { label: string; color: string; bg: string }> = {
    new: { label: 'New', color: '#2A8A52', bg: '#DEEBE2' },
    onboarding: { label: 'Onboarding', color: '#1B6B3E', bg: '#DEEBE2' },
    active: { label: 'Active', color: '#2A8A52', bg: '#DEEBE2' },
    power_user: { label: 'Power User', color: '#D08A28', bg: '#F5EAD3' },
    paying: { label: 'Paying', color: '#1B6B3E', bg: '#F0F5F1' },
    churned: { label: 'Churned', color: '#8A8070', bg: '#F7F3EC' },
  };
  const s = map[stage ?? 'new'] ?? map.new;
  return (
    <Chip
      label={s.label}
      size="small"
      sx={{ bgcolor: s.bg, color: s.color, fontWeight: 700, fontSize: '0.7rem', height: 20 }}
    />
  );
}

function leadScoreColor(score: number): string {
  if (score >= 70) return '#2A8A52';
  if (score >= 40) return '#D08A28';
  return '#C0392B';
}

function initials(name: string | null): string {
  if (!name) return '?';
  return name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2);
}

const TIER_COLORS: Record<string, string> = {
  free: '#8A8070',
  starter: '#2A8A52',
  builder: '#2A8A52',
  pro: '#1B6B3E',
  growth: '#D08A28',
  launch: '#D08A28',
  accelerator: '#1B6B3E',
  family: '#2A8A52',
};

export default function AdminCRMDashboard() {
  const navigate = useNavigate();
  const { sessionToken } = useAdminAuth();
  const [users, setUsers] = useState<CRMUser[]>([]);
  const [filtered, setFiltered] = useState<CRMUser[]>([]);
  const [stats, setStats] = useState<Stats>({ total: 0, active7: 0, atRisk: 0, paying: 0, newThisWeek: 0, mrr: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [planFilter, setPlanFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [page, setPage] = useState(1);
  const PER_PAGE = 25;

  const load = useCallback(async () => {
    if (!sessionToken) return;
    setLoading(true);
    const { data: profilesData } = await adminDb(sessionToken, 'profiles')
      .select('user_id, full_name, role, tier, lead_score, lifecycle_stage, user_status, last_login_at, created_at, iq_score');

    const { data: tagsData } = await adminDb(sessionToken, 'admin_user_tags')
      .select('user_id, admin_crm_tags(name, color)');

    const tagsByUser: Record<string, Array<{ name: string; color: string }>> = {};
    (tagsData ?? []).forEach((row: Record<string, unknown>) => {
      const uid = row.user_id as string;
      const t = row.admin_crm_tags as { name: string; color: string } | null;
      if (!t) return;
      if (!tagsByUser[uid]) tagsByUser[uid] = [];
      tagsByUser[uid].push(t);
    });

    const enriched: CRMUser[] = (profilesData ?? []).map((p: CRMUser) => ({
      ...p,
      user_status: calculateStatus(p.last_login_at),
      lead_score: p.lead_score ?? 0,
      tags: tagsByUser[p.user_id] ?? [],
    }));

    const now = Date.now();
    const week = 7 * 86400000;
    const newStats: Stats = {
      total: enriched.length,
      active7: enriched.filter(u => daysBetween(u.last_login_at) <= 7).length,
      atRisk: enriched.filter(u => {
        const d = daysBetween(u.last_login_at);
        return d >= 30 && (u.tier ?? 'free') !== 'free';
      }).length,
      paying: enriched.filter(u => ['pro', 'growth', 'accelerator', 'builder', 'launch', 'family'].includes(u.tier ?? '')).length,
      newThisWeek: enriched.filter(u => u.created_at && (now - new Date(u.created_at).getTime()) <= week).length,
      mrr: 0,
    };

    setStats(newStats);
    setUsers(enriched);
    setFiltered(enriched);
    setLoading(false);
  }, [sessionToken]);

  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    let result = [...users];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(u =>
        (u.full_name ?? '').toLowerCase().includes(q) ||
        (u.email ?? '').toLowerCase().includes(q)
      );
    }
    if (roleFilter) result = result.filter(u => u.role === roleFilter);
    if (planFilter) result = result.filter(u => (u.tier ?? 'free') === planFilter);
    if (statusFilter) result = result.filter(u => u.user_status === statusFilter);

    result.sort((a, b) => {
      let av: string | number | null = a[sortField] as string | number | null;
      let bv: string | number | null = b[sortField] as string | number | null;
      av = av ?? '';
      bv = bv ?? '';
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ? 1 : -1;
      return 0;
    });

    setFiltered(result);
    setPage(1);
  }, [users, search, roleFilter, planFilter, statusFilter, sortField, sortDir]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('asc'); }
  };

  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const pageCount = Math.ceil(filtered.length / PER_PAGE);

  const STAT_CARDS = [
    { label: 'Total Users', value: stats.total, icon: PeopleAltOutlinedIcon, color: '#1B6B3E', bg: '#F0F5F1' },
    { label: 'Active (7 days)', value: stats.active7, icon: TrendingUpIcon, color: '#2A8A52', bg: '#DEEBE2' },
    { label: 'At Risk', value: stats.atRisk, icon: WarningAmberIcon, color: '#C0392B', bg: '#F5DDD9' },
    { label: 'Paying Users', value: stats.paying, icon: AttachMoneyIcon, color: '#1B6B3E', bg: '#DEEBE2' },
    { label: 'New This Week', value: stats.newThisWeek, icon: FiberNewIcon, color: '#2A8A52', bg: '#DEEBE2' },
    { label: 'MRR', value: `$${stats.mrr.toLocaleString()}`, icon: AttachMoneyIcon, color: '#D08A28', bg: '#F5EAD3' },
  ];

  return (
    <AdminLayout>
      <Box sx={{ p: 3, bgcolor: '#FAF8F3', minHeight: '100vh' }}>
        {/* Header */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h5" fontWeight={800} color="text.primary">CRM Overview</Typography>
          <Typography variant="body2" color="text.secondary">User intelligence and lead management</Typography>
        </Box>

        {loading && <LinearProgress sx={{ mb: 2, borderRadius: 1 }} />}

        {/* Stats Grid */}
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 2, mb: 3 }}>
          {STAT_CARDS.map(s => {
            const Icon = s.icon;
            return (
              <Card key={s.label} elevation={0} sx={{ border: '1px solid', borderColor: 'grey.200' }}>
                <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                    <Box>
                      <Typography variant="caption" color="text.secondary" fontWeight={600} sx={{ textTransform: 'uppercase', letterSpacing: 0.5, fontSize: '0.68rem' }}>
                        {s.label}
                      </Typography>
                      <Typography variant="h5" fontWeight={800} sx={{ mt: 0.25, color: 'text.primary' }}>
                        {s.value}
                      </Typography>
                    </Box>
                    <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Icon sx={{ fontSize: 18, color: s.color }} />
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            );
          })}
        </Box>

        {/* Filters */}
        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'grey.200', mb: 2 }}>
          <Box sx={{ p: 2, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 2, alignItems: 'center' }}>
            <TextField
              size="small"
              placeholder="Search name or email…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon sx={{ fontSize: 18, color: 'text.disabled' }} />
                    </InputAdornment>
                  ),
                },
              }}
            />
            <FormControl size="small">
              <InputLabel>Role</InputLabel>
              <Select value={roleFilter} label="Role" onChange={e => setRoleFilter(e.target.value)}>
                <MenuItem value="">All Roles</MenuItem>
                <MenuItem value="founder">Founder</MenuItem>
                <MenuItem value="investor">Investor</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small">
              <InputLabel>Plan</InputLabel>
              <Select value={planFilter} label="Plan" onChange={e => setPlanFilter(e.target.value)}>
                <MenuItem value="">All Plans</MenuItem>
                <MenuItem value="free">Free</MenuItem>
                <MenuItem value="builder">Builder</MenuItem>
                <MenuItem value="launch">Launch</MenuItem>
                <MenuItem value="family">Family</MenuItem>
                <MenuItem value="pro">Pro</MenuItem>
                <MenuItem value="growth">Growth</MenuItem>
                <MenuItem value="accelerator">Accelerator</MenuItem>
              </Select>
            </FormControl>
            <FormControl size="small">
              <InputLabel>Status</InputLabel>
              <Select value={statusFilter} label="Status" onChange={e => setStatusFilter(e.target.value)}>
                <MenuItem value="">All Statuses</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
                <MenuItem value="at_risk">At Risk</MenuItem>
                <MenuItem value="churned">Churned</MenuItem>
              </Select>
            </FormControl>
            <Typography variant="caption" color="text.secondary" sx={{ justifySelf: 'end' }}>
              {filtered.length} user{filtered.length !== 1 ? 's' : ''}
            </Typography>
          </Box>
        </Card>

        {/* Table */}
        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'grey.200' }}>
          <Box sx={{ overflowX: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: '#FAF8F3' }}>
                  {([
                    { id: 'full_name', label: 'Name' },
                    { id: 'email', label: 'Email' },
                    { id: null, label: 'Role' },
                    { id: 'tier', label: 'Plan' },
                    { id: 'lead_score', label: 'Lead Score' },
                    { id: 'last_login_at', label: 'Last Active' },
                    { id: null, label: 'Status' },
                    { id: null, label: 'Lifecycle' },
                    { id: null, label: 'Tags' },
                    { id: null, label: '' },
                  ] as Array<{ id: SortField | null; label: string }>).map(col => (
                    <TableCell key={col.label} sx={{ fontWeight: 700, fontSize: '0.75rem', color: '#8A8070', whiteSpace: 'nowrap' }}>
                      {col.id ? (
                        <TableSortLabel
                          active={sortField === col.id}
                          direction={sortField === col.id ? sortDir : 'asc'}
                          onClick={() => col.id && toggleSort(col.id)}
                        >
                          {col.label}
                        </TableSortLabel>
                      ) : col.label}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {paginated.map(u => (
                  <TableRow
                    key={u.user_id}
                    hover
                    sx={{ cursor: 'pointer', '&:last-child td': { border: 0 } }}
                    onClick={() => navigate(`/admin/crm/users/${u.user_id}`)}
                  >
                    <TableCell>
                      <Stack direction="row" spacing={1.25} alignItems="center">
                        <Avatar sx={{ width: 28, height: 28, fontSize: '0.75rem', fontWeight: 700, bgcolor: '#1B6B3E' }}>
                          {initials(u.full_name)}
                        </Avatar>
                        <Typography variant="body2" fontWeight={600} noWrap sx={{ maxWidth: 140 }}>
                          {u.full_name ?? '—'}
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary" noWrap sx={{ maxWidth: 180 }}>
                        {u.email ?? '—'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={u.role === 'investor' ? 'Investor' : 'Founder'}
                        size="small"
                        sx={{
                          bgcolor: u.role === 'investor' ? '#DEEBE2' : '#F0F5F1',
                          color: u.role === 'investor' ? '#2A8A52' : '#1B6B3E',
                          fontWeight: 700, fontSize: '0.7rem', height: 20,
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={(u.tier ?? 'free').charAt(0).toUpperCase() + (u.tier ?? 'free').slice(1)}
                        size="small"
                        sx={{ bgcolor: `${TIER_COLORS[u.tier ?? 'free']}18`, color: TIER_COLORS[u.tier ?? 'free'], fontWeight: 700, fontSize: '0.7rem', height: 20 }}
                      />
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={0.75} alignItems="center">
                        <Typography variant="body2" fontWeight={700} sx={{ color: leadScoreColor(u.lead_score), minWidth: 24 }}>
                          {u.lead_score}
                        </Typography>
                        <Box sx={{ width: 50, height: 4, borderRadius: 2, bgcolor: '#E8E4DC', overflow: 'hidden' }}>
                          <Box sx={{ width: `${u.lead_score}%`, height: '100%', bgcolor: leadScoreColor(u.lead_score), borderRadius: 2 }} />
                        </Box>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {u.last_login_at ? `${daysBetween(u.last_login_at)}d ago` : '—'}
                      </Typography>
                    </TableCell>
                    <TableCell>{statusChip(u.user_status ?? 'inactive')}</TableCell>
                    <TableCell>{lifecycleChip(u.lifecycle_stage)}</TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={0.5} flexWrap="wrap" gap={0.5}>
                        {(u.tags ?? []).slice(0, 2).map(t => (
                          <Chip
                            key={t.name}
                            label={t.name}
                            size="small"
                            sx={{ bgcolor: `${t.color}22`, color: t.color, fontWeight: 700, fontSize: '0.65rem', height: 18 }}
                          />
                        ))}
                        {(u.tags ?? []).length > 2 && (
                          <Chip label={`+${(u.tags ?? []).length - 2}`} size="small" sx={{ height: 18, fontSize: '0.65rem' }} />
                        )}
                      </Stack>
                    </TableCell>
                    <TableCell padding="none">
                      <Tooltip title="View profile">
                        <IconButton size="small" onClick={e => { e.stopPropagation(); navigate(`/admin/crm/users/${u.user_id}`); }}>
                          <OpenInNewIcon sx={{ fontSize: 15 }} />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
                {!loading && paginated.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={10} align="center" sx={{ py: 5, color: 'text.secondary' }}>
                      <PersonOutlineIcon sx={{ fontSize: 32, mb: 1, display: 'block', mx: 'auto', color: 'text.disabled' }} />
                      No users found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </Box>

          {pageCount > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 2, borderTop: '1px solid', borderColor: 'grey.100' }}>
              <Pagination
                count={pageCount}
                page={page}
                onChange={(_, v) => setPage(v)}
                size="small"
                color="primary"
              />
            </Box>
          )}
        </Card>
      </Box>
    </AdminLayout>
  );
}
