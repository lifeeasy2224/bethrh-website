import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Chip from '@mui/material/Chip';
import Skeleton from '@mui/material/Skeleton';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TableSortLabel from '@mui/material/TableSortLabel';
import Pagination from '@mui/material/Pagination';
import Tooltip from '@mui/material/Tooltip';
import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import SearchIcon from '@mui/icons-material/Search';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import PersonOutlinedIcon from '@mui/icons-material/PersonOutlined';
import BlockOutlinedIcon from '@mui/icons-material/BlockOutlined';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import { useAdminAuth, ADMIN_API } from '../../contexts/AdminAuthContext';

// ── Types ─────────────────────────────────────────────────────────────────────

interface UserRow {
  id: string;
  user_id: string;
  full_name: string;
  role: 'founder' | 'investor';
  status: 'active' | 'suspended' | 'pending';
  plan: string;
  created_at: string;
  last_active: string | null;
  ideas_count: number;
  email_verified: boolean;
  onboarding_completed: boolean;
}

type SortField = 'full_name' | 'role' | 'status' | 'created_at' | 'last_active';
type SortDir = 'asc' | 'desc';

// ── Helper ────────────────────────────────────────────────────────────────────

function statusChip(status: string) {
  const map: Record<string, { label: string; color: string; bg: string }> = {
    active:    { label: 'Active',    color: '#2A8A52', bg: '#2A8A5218' },
    suspended: { label: 'Suspended', color: '#D08A28', bg: '#D08A2818' },
    pending:   { label: 'Pending',   color: '#2A8A52', bg: '#2A8A5218' },
  };
  const s = map[status] ?? map['active'];
  return (
    <Chip label={s.label} size="small"
      sx={{ bgcolor: s.bg, color: s.color, fontWeight: 600, fontSize: '0.7rem', height: 22 }} />
  );
}

function roleChip(role: string) {
  const isInvestor = role === 'investor';
  return (
    <Chip
      label={isInvestor ? 'Investor' : 'Founder'}
      size="small"
      sx={{
        bgcolor: isInvestor ? '#2A8A5218' : '#1B6B3E18',
        color: isInvestor ? '#2A8A52' : '#1B6B3E',
        fontWeight: 600, fontSize: '0.7rem', height: 22,
      }}
    />
  );
}

function fmtDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function AdminUsersPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { sessionToken } = useAdminAuth();

  const [users, setUsers] = useState<UserRow[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [exportLoading, setExportLoading] = useState(false);
  const [toast, setToast] = useState('');

  // Filters — initialized from URL query params
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState(() => searchParams.get('role') ?? 'all');
  const [statusFilter, setStatusFilter] = useState(() => searchParams.get('status') ?? 'all');
  const [activityFilter, setActivityFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<SortField>('created_at');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current); };
  }, [search]);

  const fetchUsers = useCallback(async () => {
    if (!sessionToken) return;
    setLoading(true);
    try {
      const res = await fetch(`${ADMIN_API}/users-list`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          session_token: sessionToken,
          page,
          limit: 25,
          search: debouncedSearch,
          role: roleFilter,
          status: statusFilter,
          activity: activityFilter,
          sort_by: sortBy,
          sort_dir: sortDir,
        }),
      });
      const json = await res.json() as { users: UserRow[]; total: number; total_pages: number };
      setUsers(json.users ?? []);
      setTotal(json.total ?? 0);
      setTotalPages(json.total_pages ?? 1);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [sessionToken, page, debouncedSearch, roleFilter, statusFilter, activityFilter, sortBy, sortDir]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  function handleSort(field: SortField) {
    if (sortBy === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortDir('desc');
    }
    setPage(1);
  }

  async function handleExport() {
    if (!sessionToken) return;
    setExportLoading(true);
    try {
      const res = await fetch(`${ADMIN_API}/export-users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ session_token: sessionToken }),
      });
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `users-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      setToast('Export downloaded successfully');
    } catch {
      setToast('Export failed');
    } finally {
      setExportLoading(false);
    }
  }

  const SortCell = ({ field, label }: { field: SortField; label: string }) => (
    <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', color: 'text.secondary', whiteSpace: 'nowrap' }}>
      <TableSortLabel
        active={sortBy === field}
        direction={sortBy === field ? sortDir : 'desc'}
        onClick={() => handleSort(field)}
      >
        {label}
      </TableSortLabel>
    </TableCell>
  );

  return (
    <Box sx={{ py: 4 }}>
      <Container maxWidth="xl">
        {/* Header */}
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between" mb={3} flexWrap="wrap" gap={2}>
          <Box>
            <Typography variant="h5" fontWeight={800} gutterBottom>User Management</Typography>
            <Typography color="text.secondary">
              {loading ? 'Loading…' : `${total.toLocaleString()} user${total !== 1 ? 's' : ''} total`}
            </Typography>
          </Box>
          <Button
            variant="outlined"
            startIcon={<FileDownloadOutlinedIcon />}
            onClick={handleExport}
            disabled={exportLoading}
            sx={{ borderColor: 'grey.300', color: 'text.primary', textTransform: 'none', fontWeight: 600 }}
          >
            {exportLoading ? 'Exporting…' : 'Export CSV'}
          </Button>
        </Stack>

        {/* Summary chips */}
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {[
            { label: 'Total', value: total, icon: <PeopleAltOutlinedIcon sx={{ fontSize: 16 }} />, color: '#1B6B3E' },
            { label: 'Active', value: users.filter(u => u.status === 'active').length, icon: <CheckCircleOutlinedIcon sx={{ fontSize: 16 }} />, color: '#2A8A52' },
            { label: 'Suspended', value: users.filter(u => u.status === 'suspended').length, icon: <BlockOutlinedIcon sx={{ fontSize: 16 }} />, color: '#D08A28' },
            { label: 'Investors', value: users.filter(u => u.role === 'investor').length, icon: <PersonOutlinedIcon sx={{ fontSize: 16 }} />, color: '#2A8A52' },
          ].map(s => (
            <Grid key={s.label} size={{ xs: 6, sm: 3 }}>
              <Card variant="outlined" sx={{ borderRadius: 2 }}>
                <CardContent sx={{ p: '12px 16px !important' }}>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Box sx={{ color: s.color }}>{s.icon}</Box>
                    <Box>
                      <Typography variant="h6" fontWeight={800} lineHeight={1}>{s.value}</Typography>
                      <Typography variant="caption" color="text.secondary">{s.label}</Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Filters */}
        <Card variant="outlined" sx={{ mb: 3, borderRadius: 2 }}>
          <CardContent sx={{ p: 2 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid size={{ xs: 12, sm: 4, md: 4 }}>
                <TextField
                  fullWidth size="small"
                  placeholder="Search by name…"
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
              </Grid>
              <Grid size={{ xs: 6, sm: 2 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Type</InputLabel>
                  <Select value={roleFilter} label="Type" onChange={e => { setRoleFilter(e.target.value); setPage(1); }}>
                    <MenuItem value="all">All Types</MenuItem>
                    <MenuItem value="founder">Entrepreneur</MenuItem>
                    <MenuItem value="investor">Investor</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 6, sm: 2 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Status</InputLabel>
                  <Select value={statusFilter} label="Status" onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
                    <MenuItem value="all">All Statuses</MenuItem>
                    <MenuItem value="active">Active</MenuItem>
                    <MenuItem value="suspended">Suspended</MenuItem>
                    <MenuItem value="pending">Pending</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 6, sm: 2 }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Activity</InputLabel>
                  <Select value={activityFilter} label="Activity" onChange={e => { setActivityFilter(e.target.value); setPage(1); }}>
                    <MenuItem value="all">All Activity</MenuItem>
                    <MenuItem value="7d">Active last 7d</MenuItem>
                    <MenuItem value="30d">Active last 30d</MenuItem>
                    <MenuItem value="90d">Active last 90d</MenuItem>
                    <MenuItem value="inactive">Inactive 90d+</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 6, sm: 2 }}>
                <Button
                  variant="text"
                  size="small"
                  onClick={() => { setSearch(''); setRoleFilter('all'); setStatusFilter('all'); setActivityFilter('all'); setPage(1); }}
                  sx={{ color: 'text.secondary', textTransform: 'none' }}
                >
                  Clear filters
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.50' }}>
                  <SortCell field="full_name" label="Name" />
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', color: 'text.secondary' }}>Type</TableCell>
                  <SortCell field="status" label="Status" />
                  <SortCell field="created_at" label="Joined" />
                  <SortCell field="last_active" label="Last Active" />
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', color: 'text.secondary' }}>Ideas</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', color: 'text.secondary' }}>Plan</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: '0.75rem', color: 'text.secondary' }} align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading
                  ? Array.from({ length: 10 }).map((_, i) => (
                      <TableRow key={i}>
                        {Array.from({ length: 8 }).map((_, j) => (
                          <TableCell key={j}><Skeleton height={20} /></TableCell>
                        ))}
                      </TableRow>
                    ))
                  : users.length === 0
                    ? (
                      <TableRow>
                        <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                          <Typography color="text.secondary" variant="body2">No users found.</Typography>
                        </TableCell>
                      </TableRow>
                    )
                    : users.map(user => (
                        <TableRow key={user.id} hover sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'grey.50' } }}
                          onClick={() => navigate(`/admin/users/${user.id}`)}>
                          <TableCell>
                            <Stack direction="row" alignItems="center" spacing={1.5}>
                              <Avatar sx={{ width: 32, height: 32, bgcolor: user.role === 'investor' ? '#2A8A5218' : '#1B6B3E18', color: user.role === 'investor' ? '#2A8A52' : '#1B6B3E', fontSize: '0.8rem', fontWeight: 700 }}>
                                {user.full_name?.charAt(0).toUpperCase() ?? '?'}
                              </Avatar>
                              <Box>
                                <Typography variant="body2" fontWeight={600} sx={{ lineHeight: 1.2 }}>{user.full_name}</Typography>
                                {user.email_verified && (
                                  <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.65rem' }}>Verified</Typography>
                                )}
                              </Box>
                            </Stack>
                          </TableCell>
                          <TableCell>{roleChip(user.role)}</TableCell>
                          <TableCell>{statusChip(user.status)}</TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                              {fmtDate(user.created_at)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                              {fmtDate(user.last_active)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight={600}>{user.ideas_count}</Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="caption" sx={{ textTransform: 'capitalize', color: 'text.secondary' }}>
                              {user.plan}
                            </Typography>
                          </TableCell>
                          <TableCell align="right" onClick={e => e.stopPropagation()}>
                            <Tooltip title="View profile" arrow>
                              <IconButton
                                size="small"
                                onClick={() => navigate(`/admin/users/${user.id}`)}
                                sx={{ color: '#1B6B3E' }}
                              >
                                <VisibilityOutlinedIcon sx={{ fontSize: 16 }} />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        </TableRow>
                      ))
                }
              </TableBody>
            </Table>
          </TableContainer>

          {/* Pagination */}
          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 3, py: 2, borderTop: '1px solid', borderColor: 'grey.100' }}>
              <Typography variant="body2" color="text.secondary">
                Page {page} of {totalPages} · {total.toLocaleString()} total
              </Typography>
              <Pagination
                count={totalPages}
                page={page}
                onChange={(_, v) => setPage(v)}
                size="small"
                sx={{ '& .MuiPaginationItem-root.Mui-selected': { bgcolor: '#1B6B3E', color: 'white' } }}
              />
            </Box>
          )}
        </Card>
      </Container>

      <Snackbar
        open={!!toast}
        autoHideDuration={3500}
        onClose={() => setToast('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" onClose={() => setToast('')} sx={{ width: '100%' }}>
          {toast}
        </Alert>
      </Snackbar>
    </Box>
  );
}
