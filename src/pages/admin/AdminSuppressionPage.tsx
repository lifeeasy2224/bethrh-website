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
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import TablePagination from '@mui/material/TablePagination';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import BlockIcon from '@mui/icons-material/Block';
import UploadFileOutlinedIcon from '@mui/icons-material/UploadFileOutlined';
import AdminLayout from '../../components/AdminLayout';
import { adminDb } from '../../lib/adminDb';
import { useAdminAuth } from '../../contexts/AdminAuthContext';

interface Suppression {
  id: string;
  email: string;
  reason: string;
  notes: string | null;
  created_at: string;
}

const REASON_META: Record<string, { label: string; color: string; bg: string }> = {
  unsubscribed: { label: 'Unsubscribed', color: '#8A8070', bg: '#F7F3EC' },
  bounced:      { label: 'Bounced',      color: '#C0392B', bg: '#FAF0EE' },
  complaint:    { label: 'Complaint',    color: '#D08A28', bg: '#F5EAD3' },
  manual:       { label: 'Manual',       color: '#1B6B3E', bg: '#F0F5F1' },
};

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function AdminSuppressionPage() {
  const { sessionToken } = useAdminAuth();
  const [items, setItems] = useState<Suppression[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [reasonFilter, setReasonFilter] = useState('all');
  const [page, setPage] = useState(0);
  const [rowsPerPage] = useState(25);
  const [dialog, setDialog] = useState<'add' | 'delete' | 'import' | null>(null);
  const [selected, setSelected] = useState<Suppression | null>(null);
  const [addEmail, setAddEmail] = useState('');
  const [addReason, setAddReason] = useState('manual');
  const [addNotes, setAddNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [importText, setImportText] = useState('');

  const load = useCallback(async () => {
    if (!sessionToken) return;
    setLoading(true);
    const { data } = await adminDb(sessionToken, 'email_suppression_list').select('*', { order: { column: 'created_at', ascending: false } });
    setItems((data ?? []) as Suppression[]);
    setLoading(false);
  }, [sessionToken]);

  useEffect(() => { void load(); }, [load]);

  const filtered = items.filter(item => {
    const matchSearch = !search || item.email.toLowerCase().includes(search.toLowerCase());
    const matchReason = reasonFilter === 'all' || item.reason === reasonFilter;
    return matchSearch && matchReason;
  });

  const paginated = filtered.slice(page * rowsPerPage, (page + 1) * rowsPerPage);

  async function handleAdd() {
    if (!addEmail.trim() || !sessionToken) return;
    setSaving(true);
    await adminDb(sessionToken, 'email_suppression_list').upsert({ email: addEmail.trim().toLowerCase(), reason: addReason, notes: addNotes.trim() || null }, { onConflict: 'email' });
    setSaving(false);
    setDialog(null);
    setAddEmail('');
    setAddNotes('');
    void load();
  }

  async function handleDelete() {
    if (!selected || !sessionToken) return;
    setSaving(true);
    await adminDb(sessionToken, 'email_suppression_list').delete({ id: selected.id });
    setSaving(false);
    setDialog(null);
    void load();
  }

  async function handleImport() {
    const emails = importText.split(/[\n,;]+/).map(e => e.trim().toLowerCase()).filter(e => e.includes('@'));
    if (!emails.length || !sessionToken) return;
    setSaving(true);
    await adminDb(sessionToken, 'email_suppression_list').upsert(
      emails.map(email => ({ email, reason: 'manual' })),
      { onConflict: 'email' }
    );
    setSaving(false);
    setDialog(null);
    setImportText('');
    void load();
  }

  const stats = {
    total: items.length,
    unsubscribed: items.filter(i => i.reason === 'unsubscribed').length,
    bounced: items.filter(i => i.reason === 'bounced').length,
    complaint: items.filter(i => i.reason === 'complaint').length,
  };

  return (
    <AdminLayout>
      <Box sx={{ p: 3, bgcolor: '#FAF8F3', minHeight: '100vh' }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 3 }}>
          <Box>
            <Typography variant="h5" fontWeight={800}>Suppression List</Typography>
            <Typography variant="body2" color="text.secondary">Manage email addresses that should never receive campaigns</Typography>
          </Box>
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" startIcon={<UploadFileOutlinedIcon />} onClick={() => setDialog('import')}>Import</Button>
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialog('add')}>Add Email</Button>
          </Stack>
        </Stack>

        {/* Stats */}
        <Stack direction="row" spacing={2} sx={{ mb: 3 }} flexWrap="wrap">
          {[
            { label: 'Total Suppressed', value: stats.total, color: '#1B6B3E', bg: '#F0F5F1' },
            { label: 'Unsubscribed', value: stats.unsubscribed, color: '#8A8070', bg: '#F7F3EC' },
            { label: 'Bounced', value: stats.bounced, color: '#C0392B', bg: '#FAF0EE' },
            { label: 'Complaints', value: stats.complaint, color: '#D08A28', bg: '#F5EAD3' },
          ].map(s => (
            <Card key={s.label} elevation={0} sx={{ border: '1px solid', borderColor: 'grey.200', borderRadius: 2, p: 2, minWidth: 130, flex: '1 1 auto' }}>
              <Typography variant="caption" color="text.secondary" fontWeight={600} display="block">{s.label}</Typography>
              <Typography variant="h6" fontWeight={800} sx={{ color: s.color, mt: 0.5 }}>{s.value.toLocaleString()}</Typography>
            </Card>
          ))}
        </Stack>

        {/* Filters */}
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
          <TextField size="small" placeholder="Search emails..." value={search} onChange={e => { setSearch(e.target.value); setPage(0); }} sx={{ width: 280 }}
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 18, color: 'text.disabled' }} /></InputAdornment> }} />
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Reason</InputLabel>
            <Select value={reasonFilter} label="Reason" onChange={e => { setReasonFilter(e.target.value); setPage(0); }}>
              <MenuItem value="all">All Reasons</MenuItem>
              {Object.entries(REASON_META).map(([k, v]) => <MenuItem key={k} value={k}>{v.label}</MenuItem>)}
            </Select>
          </FormControl>
        </Stack>

        {loading && <LinearProgress sx={{ mb: 2, borderRadius: 1 }} />}

        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'grey.200' }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#FAF8F3' }}>
                {['Email', 'Reason', 'Notes', 'Added', ''].map(col => (
                  <TableCell key={col} sx={{ fontWeight: 700, fontSize: '0.75rem', color: '#8A8070' }}>{col}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {paginated.map(item => {
                const rm = REASON_META[item.reason] ?? REASON_META.manual;
                return (
                  <TableRow key={item.id} sx={{ '&:last-child td': { border: 0 } }}>
                    <TableCell>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <BlockIcon sx={{ fontSize: 15, color: '#E05B4C' }} />
                        <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.82rem' }}>{item.email}</Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Chip label={rm.label} size="small" sx={{ bgcolor: rm.bg, color: rm.color, fontWeight: 700, fontSize: '0.7rem', height: 20 }} />
                    </TableCell>
                    <TableCell><Typography variant="caption" color="text.secondary">{item.notes ?? '—'}</Typography></TableCell>
                    <TableCell><Typography variant="caption" color="text.secondary">{fmtDate(item.created_at)}</Typography></TableCell>
                    <TableCell align="right">
                      <Tooltip title="Remove from list">
                        <IconButton size="small" color="error" onClick={() => { setSelected(item); setDialog('delete'); }}>
                          <DeleteOutlineIcon sx={{ fontSize: 15 }} />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })}
              {!loading && filtered.length === 0 && (
                <TableRow><TableCell colSpan={5} align="center" sx={{ py: 5, color: 'text.secondary' }}>No suppressed emails found.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
          {filtered.length > rowsPerPage && (
            <TablePagination
              component="div" count={filtered.length} page={page} rowsPerPage={rowsPerPage}
              onPageChange={(_, p) => setPage(p)} rowsPerPageOptions={[]} />
          )}
        </Card>
      </Box>

      {/* Add Dialog */}
      <Dialog open={dialog === 'add'} onClose={() => setDialog(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Add to Suppression List</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Email Address" size="small" fullWidth value={addEmail} onChange={e => setAddEmail(e.target.value)} placeholder="user@example.com" />
            <FormControl size="small" fullWidth>
              <InputLabel>Reason</InputLabel>
              <Select value={addReason} label="Reason" onChange={e => setAddReason(e.target.value)}>
                {Object.entries(REASON_META).map(([k, v]) => <MenuItem key={k} value={k}>{v.label}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField label="Notes (optional)" size="small" fullWidth value={addNotes} onChange={e => setAddNotes(e.target.value)} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialog(null)}>Cancel</Button>
          <Button variant="contained" onClick={handleAdd} disabled={!addEmail.trim() || saving}>Add Email</Button>
        </DialogActions>
      </Dialog>

      {/* Import Dialog */}
      <Dialog open={dialog === 'import'} onClose={() => setDialog(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Import Suppression Emails</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
            Paste email addresses below, one per line (or comma/semicolon separated).
          </Typography>
          <TextField multiline rows={8} fullWidth size="small" value={importText} onChange={e => setImportText(e.target.value)} placeholder="user1@example.com&#10;user2@example.com" sx={{ '& textarea': { fontFamily: 'monospace', fontSize: '0.8rem' } }} />
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            {importText.split(/[\n,;]+/).map(e => e.trim()).filter(e => e.includes('@')).length} valid emails detected
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialog(null)}>Cancel</Button>
          <Button variant="contained" onClick={handleImport} disabled={saving}>Import</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={dialog === 'delete'} onClose={() => setDialog(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Remove from Suppression List</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Remove <strong>{selected?.email}</strong> from the suppression list? They may receive future campaigns.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialog(null)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDelete} disabled={saving}>Remove</Button>
        </DialogActions>
      </Dialog>
    </AdminLayout>
  );
}
