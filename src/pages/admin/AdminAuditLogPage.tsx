import { useEffect, useState, useRef } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import CircularProgress from '@mui/material/CircularProgress';
import Pagination from '@mui/material/Pagination';
import Table from '@mui/material/Table';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import TableBody from '@mui/material/TableBody';
import LinearProgress from '@mui/material/LinearProgress';
import Chip from '@mui/material/Chip';
import Avatar from '@mui/material/Avatar';
import Tooltip from '@mui/material/Tooltip';
import Stack from '@mui/material/Stack';
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import { useAdminAuth, ADMIN_API } from '../../contexts/AdminAuthContext';

type AdminUser = {
  id: string;
  full_name: string;
  role: string;
};

type AuditLog = {
  id: string;
  admin_user_id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  details: Record<string, unknown>;
  ip_address: string;
  created_at: string;
  admin_users: { full_name: string; role: string };
};

type AuditLogResponse = {
  logs: AuditLog[];
  total: number;
  total_pages: number;
  admins: AdminUser[];
};

const ACTION_COLORS: Record<string, string> = {
  created:   '#2A8A52',
  updated:   '#2A8A52',
  deleted:   '#C0392B',
  suspended: '#D08A28',
  restored:  '#2A8A52',
  approved:  '#2A8A52',
  rejected:  '#C0392B',
  login:     '#8A8070',
  logout:    '#8A8070',
};

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('en-US', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
}

function initials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

function formatDetails(details: Record<string, unknown>) {
  const keys = Object.keys(details);
  if (!keys.length) return '—';
  const preview = keys.slice(0, 2).map(k => `${k}: ${JSON.stringify(details[k])}`).join(', ');
  return keys.length > 2 ? `${preview}, …` : preview;
}

export default function AdminAuditLogPage() {
  const { sessionToken } = useAdminAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const [search, setSearch] = useState('');
  const [adminFilter, setAdminFilter] = useState('all');
  const [actionFilter, setActionFilter] = useState('all');
  const [entityTypeFilter, setEntityTypeFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const load = (p = 1, q = search) => {
    if (!sessionToken) return;
    setLoading(true);
    fetch(`${ADMIN_API}/audit-log-list`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` },
      body: JSON.stringify({
        session_token: sessionToken, page: p, limit: 20,
        admin_id: adminFilter !== 'all' ? adminFilter : undefined,
        action_filter: actionFilter !== 'all' ? actionFilter : undefined,
        entity_type: entityTypeFilter !== 'all' ? entityTypeFilter : undefined,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
        search: q || undefined,
      }),
    })
      .then(r => r.json())
      .then((d: AuditLogResponse) => {
        setLogs(d.logs ?? []);
        setTotal(d.total ?? 0);
        setTotalPages(d.total_pages ?? 1);
        if (d.admins?.length) setAdmins(d.admins);
      })
      .catch(() => {/* silent */})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { setPage(1); load(1, search); }, 300);
  }, [search]);

  const handleFilter = () => { setPage(1); load(1); };

  return (
    <Box sx={{ bgcolor: '#FAF8F3', minHeight: '100vh', p: 3 }}>
      {loading && <LinearProgress sx={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999 }} />}

      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={3} flexWrap="wrap" gap={2}>
        <Box>
          <Typography variant="h5" fontWeight={800}>Audit Log</Typography>
          <Typography variant="body2" color="text.secondary">Records all admin actions — retained for 2 years</Typography>
        </Box>
        <Chip label={`${total.toLocaleString()} records`} variant="outlined" />
      </Stack>

      {/* Filters */}
      <Card sx={{ p: 2, borderRadius: 2, mb: 3 }}>
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 2 }}>
          <TextField
            placeholder="Search entity or action..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            size="small"
          />
          <FormControl size="small">
            <InputLabel>Admin</InputLabel>
            <Select label="Admin" value={adminFilter} onChange={e => { setAdminFilter(e.target.value); handleFilter(); }}>
              <MenuItem value="all">All Admins</MenuItem>
              {admins.map(a => (
                <MenuItem key={a.id} value={a.id}>{a.full_name}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small">
            <InputLabel>Action</InputLabel>
            <Select label="Action" value={actionFilter} onChange={e => { setActionFilter(e.target.value); handleFilter(); }}>
              <MenuItem value="all">All Actions</MenuItem>
              {['created', 'updated', 'deleted', 'suspended', 'restored', 'approved', 'rejected', 'login', 'logout'].map(a => (
                <MenuItem key={a} value={a}>{a.charAt(0).toUpperCase() + a.slice(1)}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl size="small">
            <InputLabel>Entity Type</InputLabel>
            <Select label="Entity Type" value={entityTypeFilter} onChange={e => { setEntityTypeFilter(e.target.value); handleFilter(); }}>
              <MenuItem value="all">All Types</MenuItem>
              {['user', 'idea', 'ticket', 'setting', 'feedback', 'admin'].map(t => (
                <MenuItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label="Date From" type="date" value={dateFrom} size="small"
            slotProps={{ inputLabel: { shrink: true } }}
            onChange={e => { setDateFrom(e.target.value); handleFilter(); }}
          />
          <TextField
            label="Date To" type="date" value={dateTo} size="small"
            slotProps={{ inputLabel: { shrink: true } }}
            onChange={e => { setDateTo(e.target.value); handleFilter(); }}
          />
        </Box>
      </Card>

      {/* Table */}
      <Card sx={{ borderRadius: 2, overflow: 'hidden' }}>
        {loading && !logs.length ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : logs.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <AssignmentOutlinedIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
            <Typography color="text.secondary">No audit logs found</Typography>
          </Box>
        ) : (
          <Box sx={{ overflowX: 'auto' }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.50' }}>
                  {['Timestamp', 'Admin', 'Action', 'Entity Type', 'Entity', 'Details', 'IP Address'].map(h => (
                    <TableCell key={h} sx={{ fontWeight: 700 }}>{h}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {logs.map(log => {
                  const color = ACTION_COLORS[log.action] ?? '#8A8070';
                  const shortId = log.entity_id?.slice(0, 8) ?? '—';
                  return (
                    <TableRow key={log.id} hover>
                      <TableCell sx={{ fontSize: '0.75rem', whiteSpace: 'nowrap', color: 'text.secondary' }}>
                        {formatDateTime(log.created_at)}
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Avatar sx={{ width: 26, height: 26, fontSize: '0.65rem', bgcolor: '#1B6B3E', fontWeight: 700 }}>
                            {initials(log.admin_users?.full_name ?? '?')}
                          </Avatar>
                          <Box>
                            <Typography variant="caption" fontWeight={600} display="block">
                              {log.admin_users?.full_name ?? '—'}
                            </Typography>
                            <Chip
                              label={log.admin_users?.role ?? ''}
                              size="small"
                              sx={{ height: 16, fontSize: '0.6rem' }}
                            />
                          </Box>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={log.action}
                          size="small"
                          sx={{ bgcolor: color, color: 'white', fontWeight: 700, fontSize: '0.7rem', height: 20 }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption">{log.entity_type}</Typography>
                      </TableCell>
                      <TableCell>
                        <Tooltip title={log.entity_id ?? ''} placement="top">
                          <Typography
                            variant="caption"
                            sx={{ fontFamily: 'monospace', bgcolor: 'grey.100', px: 0.75, py: 0.25, borderRadius: 0.5, display: 'inline-block' }}
                          >
                            {shortId}
                          </Typography>
                        </Tooltip>
                      </TableCell>
                      <TableCell sx={{ maxWidth: 220 }}>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ fontFamily: 'monospace', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                          title={formatDetails(log.details ?? {})}
                        >
                          {formatDetails(log.details ?? {})}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                          {log.ip_address ?? '—'}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Box>
        )}

        {totalPages > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 2, borderTop: '1px solid', borderColor: 'divider' }}>
            <Pagination
              count={totalPages}
              page={page}
              onChange={(_, p) => { setPage(p); load(p); }}
              color="primary"
              size="small"
            />
          </Box>
        )}
      </Card>
    </Box>
  );
}
