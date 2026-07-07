import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Card from '@mui/material/Card';
import TextField from '@mui/material/TextField';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Chip from '@mui/material/Chip';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TableSortLabel from '@mui/material/TableSortLabel';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Pagination from '@mui/material/Pagination';
import LinearProgress from '@mui/material/LinearProgress';
import Avatar from '@mui/material/Avatar';
import InputAdornment from '@mui/material/InputAdornment';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import SearchIcon from '@mui/icons-material/Search';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { useAdminAuth, ADMIN_API } from '../../contexts/AdminAuthContext';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  open:        { label: 'New',         color: '#2A8A52', bg: 'rgba(42, 138, 82,0.1)' },
  in_progress: { label: 'In Progress', color: '#D08A28', bg: 'rgba(208, 138, 40,0.1)' },
  resolved:    { label: 'Resolved',    color: '#2A8A52', bg: 'rgba(42, 138, 82,0.1)' },
  closed:      { label: 'Closed',      color: '#8A8070', bg: 'rgba(138, 128, 112,0.1)' },
};

const PRIORITY_CONFIG: Record<string, { label: string; color: string }> = {
  low:    { label: 'Low',      color: '#8A8070' },
  normal: { label: 'Medium',   color: '#D08A28' },
  high:   { label: 'High',     color: '#D08A28' },
  urgent: { label: 'Critical', color: '#C0392B' },
};

const CATEGORY_LABELS: Record<string, string> = {
  login:            '🔐 Login Issues',
  account_recovery: '🔑 Account Recovery',
  billing:          '💳 Billing',
  bug:              '🐛 Bug Report',
  other:            '📋 Other',
};

interface Ticket {
  id: string;
  ticket_number: number;
  user_id: string | null;
  user_name: string;
  user_email: string | null;
  subject: string;
  body: string;
  status: string;
  priority: string;
  category: string;
  assigned_to: string | null;
  assigned_to_name: string | null;
  created_at: string;
  updated_at: string;
}

type SortKey = 'ticket_number' | 'created_at' | 'updated_at' | 'status' | 'priority';

function initials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

export default function AdminSupportPage() {
  const navigate = useNavigate();
  const { sessionToken } = useAdminAuth();

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [sortBy, setSortBy] = useState<SortKey>('created_at');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const [snack, setSnack] = useState<{ msg: string; sev: 'success' | 'error' } | null>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const load = useCallback(async (
    p = page, q = search, st = statusFilter, pr = priorityFilter,
    cat = categoryFilter, sb = sortBy, sd = sortDir
  ) => {
    if (!sessionToken) return;
    setLoading(true);
    try {
      const res = await fetch(`${ADMIN_API}/tickets-list`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` },
        body: JSON.stringify({ session_token: sessionToken, page: p, limit: 25, search: q, status: st, priority: pr, category: cat, sort_by: sb, sort_dir: sd }),
      });
      const data = await res.json() as { tickets: Ticket[]; total: number; total_pages: number };
      setTickets(data.tickets ?? []);
      setTotal(data.total ?? 0);
      setTotalPages(data.total_pages ?? 1);
    } catch { setSnack({ msg: 'Failed to load tickets', sev: 'error' }); }
    finally { setLoading(false); }
  }, [sessionToken]);

  useEffect(() => { void load(); }, []);

  function handleSearch(val: string) {
    setSearch(val);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => { setPage(1); void load(1, val, statusFilter, priorityFilter, categoryFilter, sortBy, sortDir); }, 300);
  }

  function handleFilter(key: string, val: string) {
    const next = { st: statusFilter, pr: priorityFilter, cat: categoryFilter };
    if (key === 'status') { next.st = val; setStatusFilter(val); }
    if (key === 'priority') { next.pr = val; setPriorityFilter(val); }
    if (key === 'category') { next.cat = val; setCategoryFilter(val); }
    setPage(1);
    void load(1, search, next.st, next.pr, next.cat, sortBy, sortDir);
  }

  function handleSort(col: SortKey) {
    const d = sortBy === col && sortDir === 'desc' ? 'asc' : 'desc';
    setSortBy(col); setSortDir(d); setPage(1);
    void load(1, search, statusFilter, priorityFilter, categoryFilter, col, d);
  }

  function handlePage(_: unknown, p: number) { setPage(p); void load(p); }

  // Stats
  const openCount = tickets.filter(t => t.status === 'open').length;
  const inProgressCount = tickets.filter(t => t.status === 'in_progress').length;
  const urgentCount = tickets.filter(t => t.priority === 'urgent').length;

  return (
    <Box sx={{ bgcolor: 'grey.50', minHeight: '100vh' }}>
      {/* Header */}
      <Box sx={{ bgcolor: 'white', borderBottom: '1px solid', borderColor: 'divider', px: 3, py: 2 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Box sx={{ width: 36, height: 36, borderRadius: '10px', bgcolor: 'rgba(27, 107, 62,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <SupportAgentIcon sx={{ color: '#1B6B3E', fontSize: 20 }} />
            </Box>
            <Box>
              <Typography variant="h5" fontWeight={800} lineHeight={1}>Support Tickets</Typography>
              <Typography variant="caption" color="text.secondary">{total} total tickets</Typography>
            </Box>
          </Stack>
          <Stack direction="row" spacing={1}>
            {urgentCount > 0 && (
              <Chip label={`${urgentCount} Critical`} size="small" sx={{ bgcolor: 'rgba(192, 57, 43,0.1)', color: '#C0392B', fontWeight: 700 }} />
            )}
            {openCount > 0 && (
              <Chip label={`${openCount} New`} size="small" sx={{ bgcolor: 'rgba(42, 138, 82,0.1)', color: '#2A8A52', fontWeight: 700 }} />
            )}
            {inProgressCount > 0 && (
              <Chip label={`${inProgressCount} In Progress`} size="small" sx={{ bgcolor: 'rgba(208, 138, 40,0.1)', color: '#D08A28', fontWeight: 700 }} />
            )}
          </Stack>
        </Stack>
      </Box>

      <Box sx={{ px: 3, py: 3 }}>
        {/* Filters */}
        <Stack direction="row" spacing={2} sx={{ mb: 3 }} flexWrap="wrap" alignItems="center">
          <TextField
            placeholder="Search tickets..."
            value={search}
            onChange={e => handleSearch(e.target.value)}
            size="small"
            sx={{ width: 240 }}
            slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> } }}
          />
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>Status</InputLabel>
            <Select label="Status" value={statusFilter} onChange={e => handleFilter('status', e.target.value)}>
              <MenuItem value="all">All Status</MenuItem>
              <MenuItem value="open">New</MenuItem>
              <MenuItem value="in_progress">In Progress</MenuItem>
              <MenuItem value="resolved">Resolved</MenuItem>
              <MenuItem value="closed">Closed</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>Priority</InputLabel>
            <Select label="Priority" value={priorityFilter} onChange={e => handleFilter('priority', e.target.value)}>
              <MenuItem value="all">All Priority</MenuItem>
              <MenuItem value="urgent">Critical</MenuItem>
              <MenuItem value="high">High</MenuItem>
              <MenuItem value="normal">Medium</MenuItem>
              <MenuItem value="low">Low</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>Category</InputLabel>
            <Select label="Category" value={categoryFilter} onChange={e => handleFilter('category', e.target.value)}>
              <MenuItem value="all">All Categories</MenuItem>
              <MenuItem value="login">🔐 Login Issues</MenuItem>
              <MenuItem value="account_recovery">🔑 Account Recovery</MenuItem>
              <MenuItem value="billing">💳 Billing</MenuItem>
              <MenuItem value="bug">🐛 Bug Report</MenuItem>
              <MenuItem value="other">📋 Other</MenuItem>
            </Select>
          </FormControl>
        </Stack>

        {/* Table */}
        <Card sx={{ overflow: 'hidden' }}>
          {loading && <LinearProgress sx={{ height: 2 }} />}
          <Box sx={{ overflowX: 'auto' }}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.50' }}>
                  <TableCell sx={{ fontWeight: 700, width: 70 }}>
                    <TableSortLabel active={sortBy === 'ticket_number'} direction={sortBy === 'ticket_number' ? sortDir : 'desc'} onClick={() => handleSort('ticket_number')}>
                      #
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, minWidth: 180 }}>User</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Category</TableCell>
                  <TableCell sx={{ fontWeight: 700, minWidth: 220 }}>Subject</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>
                    <TableSortLabel active={sortBy === 'status'} direction={sortBy === 'status' ? sortDir : 'asc'} onClick={() => handleSort('status')}>
                      Status
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>
                    <TableSortLabel active={sortBy === 'priority'} direction={sortBy === 'priority' ? sortDir : 'asc'} onClick={() => handleSort('priority')}>
                      Priority
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Assigned To</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>
                    <TableSortLabel active={sortBy === 'created_at'} direction={sortBy === 'created_at' ? sortDir : 'desc'} onClick={() => handleSort('created_at')}>
                      Created
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {!loading && tickets.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center" sx={{ py: 8 }}>
                      <CheckCircleOutlineIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1, display: 'block', mx: 'auto' }} />
                      <Typography color="text.secondary">No tickets found</Typography>
                    </TableCell>
                  </TableRow>
                ) : tickets.map(t => {
                  const status = STATUS_CONFIG[t.status] ?? STATUS_CONFIG.open;
                  const priority = PRIORITY_CONFIG[t.priority] ?? PRIORITY_CONFIG.normal;
                  return (
                    <TableRow key={t.id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate(`/admin/support/${t.id}`)}>
                      <TableCell>
                        <Typography variant="body2" fontWeight={700} color="text.secondary">
                          #{t.ticket_number ?? '—'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Avatar sx={{ width: 30, height: 30, fontSize: '0.7rem', bgcolor: '#1B6B3E', fontWeight: 700 }}>
                            {initials(t.user_name)}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight={600} lineHeight={1.2}>{t.user_name}</Typography>
                            {t.user_email && (
                              <Typography variant="caption" color="text.secondary">{t.user_email}</Typography>
                            )}
                          </Box>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption">{CATEGORY_LABELS[t.category] ?? t.category}</Typography>
                      </TableCell>
                      <TableCell sx={{ maxWidth: 260 }}>
                        <Typography variant="body2" fontWeight={600} noWrap>{t.subject}</Typography>
                        <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block', maxWidth: 240 }}>
                          {t.body.slice(0, 80)}…
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={status.label}
                          size="small"
                          sx={{ bgcolor: status.bg, color: status.color, fontWeight: 700, height: 22, fontSize: '0.7rem' }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" fontWeight={700} sx={{ color: priority.color }}>
                          {priority.label}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" color={t.assigned_to_name ? 'text.primary' : 'text.disabled'}>
                          {t.assigned_to_name ?? 'Unassigned'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(t.created_at).toLocaleDateString()}
                        </Typography>
                      </TableCell>
                      <TableCell align="right" onClick={e => e.stopPropagation()}>
                        <Tooltip title="Open ticket">
                          <IconButton size="small" onClick={() => navigate(`/admin/support/${t.id}`)}>
                            <OpenInNewIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Box>

          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 2, borderTop: '1px solid', borderColor: 'divider' }}>
              <Pagination count={totalPages} page={page} onChange={handlePage} color="primary" size="small" />
            </Box>
          )}
        </Card>
      </Box>

      <Snackbar open={!!snack} autoHideDuration={4000} onClose={() => setSnack(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={snack?.sev ?? 'success'} onClose={() => setSnack(null)}>{snack?.msg}</Alert>
      </Snackbar>
    </Box>
  );
}
