import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Chip from '@mui/material/Chip';
import Table from '@mui/material/Table';
import TableHead from '@mui/material/TableHead';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';
import TableSortLabel from '@mui/material/TableSortLabel';
import Pagination from '@mui/material/Pagination';
import TextField from '@mui/material/TextField';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import InputAdornment from '@mui/material/InputAdornment';
import Button from '@mui/material/Button';
import Tooltip from '@mui/material/Tooltip';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import SearchIcon from '@mui/icons-material/Search';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import { adminDb, adminAuthListUsers } from '../../lib/adminDb';
import { useAdminAuth } from '../../contexts/AdminAuthContext';

const PLAN_PRICES: Record<string, number> = {
  builder: 19, launch: 29, family: 49, pro: 49, growth: 79, accelerator: 149,
};

const PLAN_COLORS: Record<string, 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error'> = {
  builder: 'default', launch: 'primary', family: 'secondary',
  pro: 'secondary', growth: 'warning', accelerator: 'error',
};

interface ActiveRow {
  user_id: string;
  full_name: string | null;
  email: string;
  plan: string;
  billing_cycle: string;
  status: string;
  stripe_subscription_id: string | null;
  current_period_end: string | null;
  created_at: string | null;
  amount: number;
}

interface ChurnedRow {
  user_id: string;
  full_name: string | null;
  email: string;
  plan: string;
  amount: number;
  cancelled_at: string | null;
  started_at: string | null;
  days_active: number;
}

type SortDir = 'asc' | 'desc';

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function statusColor(status: string): 'success' | 'warning' | 'error' | 'default' {
  if (status === 'active') return 'success';
  if (status === 'past_due') return 'warning';
  if (status === 'canceled' || status === 'cancelled') return 'error';
  return 'default';
}

export default function AdminSubscriptionsPage() {
  const navigate = useNavigate();
  const { sessionToken } = useAdminAuth();
  const [tab, setTab] = useState(0);

  // Active state
  const [active, setActive] = useState<ActiveRow[]>([]);
  const [activeSearch, setActiveSearch] = useState('');
  const [activePlan, setActivePlan] = useState('all');
  const [activeStatus, setActiveStatus] = useState('all');
  const [activePage, setActivePage] = useState(1);
  const [activeSortBy, setActiveSortBy] = useState<keyof ActiveRow>('amount');
  const [activeSortDir, setActiveSortDir] = useState<SortDir>('desc');

  // Churned state
  const [churned, setChurned] = useState<ChurnedRow[]>([]);
  const [churnedSearch, setChurnedSearch] = useState('');
  const [churnedPlan, setChurnedPlan] = useState('all');
  const [churnedPage, setChurnedPage] = useState(1);
  const [churnedSortBy, setChurnedSortBy] = useState<keyof ChurnedRow>('cancelled_at');
  const [churnedSortDir, setChurnedSortDir] = useState<SortDir>('desc');

  const PAGE_SIZE = 25;

  useEffect(() => {
    loadActive();
    loadChurned();
  }, [sessionToken]);

  async function loadActive() {
    if (!sessionToken) return;
    const { data: subs } = await adminDb(sessionToken, 'subscriptions')
      .select('user_id, plan, billing_cycle, status, stripe_subscription_id, current_period_end, created_at, amount', {
        notIn: { status: ['canceled', 'cancelled'] },
        order: { column: 'created_at', ascending: false },
      });

    if (!subs?.length) { setActive([]); return; }

    const userIds = (subs as Array<{ user_id: string }>).map(s => s.user_id);
    const { data: profiles } = await adminDb(sessionToken, 'profiles')
      .select('user_id, full_name', { in: { user_id: userIds } });

    const { data: usersData } = await adminAuthListUsers(sessionToken, { perPage: 1000 });
    const users = usersData?.users;
    const emailMap = new Map((users ?? []).map((u: { id: string; email?: string }) => [u.id, u.email ?? '']));
    const nameMap = new Map(((profiles ?? []) as Array<{ user_id: string; full_name: string | null }>).map(p => [p.user_id, p.full_name]));

    const rows: ActiveRow[] = (subs as Array<{
      user_id: string; plan: string; billing_cycle: string; status: string;
      stripe_subscription_id: string | null; current_period_end: string | null;
      created_at: string | null; amount: number | null;
    }>).map(s => ({
      ...s,
      full_name: nameMap.get(s.user_id) ?? null,
      email: emailMap.get(s.user_id) ?? '',
      amount: s.amount ?? PLAN_PRICES[s.plan] ?? 0,
    }));
    setActive(rows);
  }

  async function loadChurned() {
    if (!sessionToken) return;
    const { data: subs } = await adminDb(sessionToken, 'subscriptions')
      .select('user_id, plan, cancelled_at, created_at, amount', {
        in: { status: ['canceled', 'cancelled'] },
        order: { column: 'cancelled_at', ascending: false },
      });

    if (!subs?.length) { setChurned([]); return; }

    const userIds = (subs as Array<{ user_id: string }>).map(s => s.user_id);
    const { data: profiles } = await adminDb(sessionToken, 'profiles')
      .select('user_id, full_name', { in: { user_id: userIds } });

    const { data: usersData } = await adminAuthListUsers(sessionToken, { perPage: 1000 });
    const users = usersData?.users;
    const emailMap = new Map((users ?? []).map((u: { id: string; email?: string }) => [u.id, u.email ?? '']));
    const nameMap = new Map(((profiles ?? []) as Array<{ user_id: string; full_name: string | null }>).map(p => [p.user_id, p.full_name]));

    const rows: ChurnedRow[] = (subs as Array<{
      user_id: string; plan: string; cancelled_at: string | null; created_at: string | null; amount: number | null;
    }>).map(s => {
      const start = s.created_at ? new Date(s.created_at).getTime() : 0;
      const end = s.cancelled_at ? new Date(s.cancelled_at).getTime() : Date.now();
      const days = start ? Math.round((end - start) / 86400000) : 0;
      return {
        user_id: s.user_id,
        full_name: nameMap.get(s.user_id) ?? null,
        email: emailMap.get(s.user_id) ?? '',
        plan: s.plan ?? '',
        amount: s.amount ?? PLAN_PRICES[s.plan] ?? 0,
        cancelled_at: s.cancelled_at,
        started_at: s.created_at,
        days_active: days,
      };
    });
    setChurned(rows);
  }

  // Active filtering + sorting
  const filteredActive = active
    .filter(r => {
      const q = activeSearch.toLowerCase();
      const matchSearch = !q || (r.full_name ?? '').toLowerCase().includes(q) || r.email.toLowerCase().includes(q);
      const matchPlan = activePlan === 'all' || r.plan === activePlan;
      const matchStatus = activeStatus === 'all' || r.status === activeStatus;
      return matchSearch && matchPlan && matchStatus;
    })
    .sort((a, b) => {
      const av = a[activeSortBy] ?? '';
      const bv = b[activeSortBy] ?? '';
      if (av < bv) return activeSortDir === 'asc' ? -1 : 1;
      if (av > bv) return activeSortDir === 'asc' ? 1 : -1;
      return 0;
    });

  const activeTotal = filteredActive.length;
  const activeSlice = filteredActive.slice((activePage - 1) * PAGE_SIZE, activePage * PAGE_SIZE);

  // Churned filtering + sorting
  const filteredChurned = churned
    .filter(r => {
      const q = churnedSearch.toLowerCase();
      const matchSearch = !q || (r.full_name ?? '').toLowerCase().includes(q) || r.email.toLowerCase().includes(q);
      const matchPlan = churnedPlan === 'all' || r.plan === churnedPlan;
      return matchSearch && matchPlan;
    })
    .sort((a, b) => {
      const av = a[churnedSortBy] ?? '';
      const bv = b[churnedSortBy] ?? '';
      if (av < bv) return churnedSortDir === 'asc' ? -1 : 1;
      if (av > bv) return churnedSortDir === 'asc' ? 1 : -1;
      return 0;
    });

  const churnedTotal = filteredChurned.length;
  const churnedSlice = filteredChurned.slice((churnedPage - 1) * PAGE_SIZE, churnedPage * PAGE_SIZE);

  function toggleActiveSort(col: keyof ActiveRow) {
    if (activeSortBy === col) setActiveSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setActiveSortBy(col); setActiveSortDir('desc'); }
    setActivePage(1);
  }

  function toggleChurnedSort(col: keyof ChurnedRow) {
    if (churnedSortBy === col) setChurnedSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setChurnedSortBy(col); setChurnedSortDir('desc'); }
    setChurnedPage(1);
  }

  function exportCSV(rows: object[], filename: string) {
    if (!rows.length) return;
    const keys = Object.keys(rows[0]);
    const lines = [keys.join(','), ...rows.map(r =>
      keys.map(k => {
        const v = (r as Record<string, unknown>)[k];
        return typeof v === 'string' && v.includes(',') ? `"${v}"` : String(v ?? '');
      }).join(',')
    )];
    const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
  }

  const plans = ['builder', 'launch', 'family', 'pro', 'growth', 'accelerator'];

  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={3}>
        <Stack direction="row" alignItems="center" gap={1}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/admin/crm/revenue')}
            sx={{ color: 'text.secondary', minWidth: 0, px: 1 }}
          >
            Revenue
          </Button>
          <Typography variant="h5" fontWeight={700}>Subscriptions</Typography>
        </Stack>
        <Tooltip title="Export current view">
          <Button
            variant="outlined"
            startIcon={<FileDownloadOutlinedIcon />}
            onClick={() => {
              if (tab === 0) exportCSV(filteredActive, 'active-subscriptions.csv');
              else exportCSV(filteredChurned, 'churned-subscriptions.csv');
            }}
          >
            Export CSV
          </Button>
        </Tooltip>
      </Stack>

      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3 }}>
        <Tab label={`Active (${active.length})`} />
        <Tab label={`Churned (${churned.length})`} />
      </Tabs>

      {tab === 0 && (
        <Card>
          <CardContent>
            <Stack direction={{ xs: 'column', sm: 'row' }} gap={2} mb={2}>
              <TextField
                size="small"
                placeholder="Search name or email…"
                value={activeSearch}
                onChange={e => { setActiveSearch(e.target.value); setActivePage(1); }}
                InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
                sx={{ flex: 1 }}
              />
              <FormControl size="small" sx={{ minWidth: 140 }}>
                <InputLabel>Plan</InputLabel>
                <Select value={activePlan} label="Plan" onChange={e => { setActivePlan(e.target.value); setActivePage(1); }}>
                  <MenuItem value="all">All plans</MenuItem>
                  {plans.map(p => <MenuItem key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</MenuItem>)}
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: 130 }}>
                <InputLabel>Status</InputLabel>
                <Select value={activeStatus} label="Status" onChange={e => { setActiveStatus(e.target.value); setActivePage(1); }}>
                  <MenuItem value="all">All statuses</MenuItem>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="past_due">Past due</MenuItem>
                  <MenuItem value="trialing">Trialing</MenuItem>
                </Select>
              </FormControl>
            </Stack>

            <Table size="small">
              <TableHead>
                <TableRow sx={{ '& th': { fontWeight: 600, bgcolor: '#FAF8F3' } }}>
                  <TableCell>Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={activeSortBy === 'plan'}
                      direction={activeSortBy === 'plan' ? activeSortDir : 'asc'}
                      onClick={() => toggleActiveSort('plan')}
                    >Plan</TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={activeSortBy === 'amount'}
                      direction={activeSortBy === 'amount' ? activeSortDir : 'desc'}
                      onClick={() => toggleActiveSort('amount')}
                    >MRR</TableSortLabel>
                  </TableCell>
                  <TableCell>Billing</TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={activeSortBy === 'created_at'}
                      direction={activeSortBy === 'created_at' ? activeSortDir : 'desc'}
                      onClick={() => toggleActiveSort('created_at')}
                    >Started</TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={activeSortBy === 'current_period_end'}
                      direction={activeSortBy === 'current_period_end' ? activeSortDir : 'asc'}
                      onClick={() => toggleActiveSort('current_period_end')}
                    >Next Billing</TableSortLabel>
                  </TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {activeSlice.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                      No active subscriptions found
                    </TableCell>
                  </TableRow>
                )}
                {activeSlice.map(row => (
                  <TableRow key={row.user_id} hover sx={{ cursor: 'pointer' }}
                    onClick={() => navigate(`/admin/crm/users/${row.user_id}`)}>
                    <TableCell>
                      <Typography variant="body2" fontWeight={500}>
                        {row.full_name || '—'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.8rem' }}>
                        {row.email}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={row.plan}
                        color={PLAN_COLORS[row.plan] ?? 'default'}
                        size="small"
                        sx={{ textTransform: 'capitalize' }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>
                        ${row.amount}/mo
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ color: 'text.secondary', textTransform: 'capitalize' }}>
                        {row.billing_cycle ?? 'monthly'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        {formatDate(row.created_at)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        {formatDate(row.current_period_end)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={row.status}
                        color={statusColor(row.status)}
                        size="small"
                        sx={{ textTransform: 'capitalize' }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {activeTotal > PAGE_SIZE && (
              <Stack alignItems="center" mt={2}>
                <Pagination
                  count={Math.ceil(activeTotal / PAGE_SIZE)}
                  page={activePage}
                  onChange={(_, p) => setActivePage(p)}
                  size="small"
                />
              </Stack>
            )}
            <Typography variant="caption" sx={{ color: 'text.secondary', mt: 1, display: 'block' }}>
              Showing {Math.min((activePage - 1) * PAGE_SIZE + 1, activeTotal)}–{Math.min(activePage * PAGE_SIZE, activeTotal)} of {activeTotal}
            </Typography>
          </CardContent>
        </Card>
      )}

      {tab === 1 && (
        <Card>
          <CardContent>
            <Stack direction={{ xs: 'column', sm: 'row' }} gap={2} mb={2}>
              <TextField
                size="small"
                placeholder="Search name or email…"
                value={churnedSearch}
                onChange={e => { setChurnedSearch(e.target.value); setChurnedPage(1); }}
                InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
                sx={{ flex: 1 }}
              />
              <FormControl size="small" sx={{ minWidth: 140 }}>
                <InputLabel>Was Plan</InputLabel>
                <Select value={churnedPlan} label="Was Plan" onChange={e => { setChurnedPlan(e.target.value); setChurnedPage(1); }}>
                  <MenuItem value="all">All plans</MenuItem>
                  {plans.map(p => <MenuItem key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</MenuItem>)}
                </Select>
              </FormControl>
            </Stack>

            <Table size="small">
              <TableHead>
                <TableRow sx={{ '& th': { fontWeight: 600, bgcolor: '#FAF8F3' } }}>
                  <TableCell>Name</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={churnedSortBy === 'plan'}
                      direction={churnedSortBy === 'plan' ? churnedSortDir : 'asc'}
                      onClick={() => toggleChurnedSort('plan')}
                    >Was Plan</TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={churnedSortBy === 'amount'}
                      direction={churnedSortBy === 'amount' ? churnedSortDir : 'desc'}
                      onClick={() => toggleChurnedSort('amount')}
                    >Was Paying</TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={churnedSortBy === 'cancelled_at'}
                      direction={churnedSortBy === 'cancelled_at' ? churnedSortDir : 'desc'}
                      onClick={() => toggleChurnedSort('cancelled_at')}
                    >Cancelled</TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={churnedSortBy === 'days_active'}
                      direction={churnedSortBy === 'days_active' ? churnedSortDir : 'desc'}
                      onClick={() => toggleChurnedSort('days_active')}
                    >Days Active</TableSortLabel>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {churnedSlice.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                      No churned subscriptions found
                    </TableCell>
                  </TableRow>
                )}
                {churnedSlice.map(row => (
                  <TableRow key={row.user_id} hover sx={{ cursor: 'pointer' }}
                    onClick={() => navigate(`/admin/crm/users/${row.user_id}`)}>
                    <TableCell>
                      <Typography variant="body2" fontWeight={500}>
                        {row.full_name || '—'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.8rem' }}>
                        {row.email}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={row.plan || '—'}
                        color={row.plan ? (PLAN_COLORS[row.plan] ?? 'default') : 'default'}
                        size="small"
                        sx={{ textTransform: 'capitalize' }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600} sx={{ color: 'error.main' }}>
                        ${row.amount}/mo
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        {formatDate(row.cancelled_at)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                        {row.days_active > 0 ? `${row.days_active}d` : '—'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {churnedTotal > PAGE_SIZE && (
              <Stack alignItems="center" mt={2}>
                <Pagination
                  count={Math.ceil(churnedTotal / PAGE_SIZE)}
                  page={churnedPage}
                  onChange={(_, p) => setChurnedPage(p)}
                  size="small"
                />
              </Stack>
            )}
            <Typography variant="caption" sx={{ color: 'text.secondary', mt: 1, display: 'block' }}>
              {churnedTotal === 0
                ? 'No results'
                : `Showing ${Math.min((churnedPage - 1) * PAGE_SIZE + 1, churnedTotal)}–${Math.min(churnedPage * PAGE_SIZE, churnedTotal)} of ${churnedTotal}`}
            </Typography>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
