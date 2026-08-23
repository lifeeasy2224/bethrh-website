import { useState, useEffect, useCallback, useMemo } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
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
import TextField from '@mui/material/TextField';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import EventAvailableOutlinedIcon from '@mui/icons-material/EventAvailableOutlined';
import FlagOutlinedIcon from '@mui/icons-material/FlagOutlined';
import AdminLayout from '../../components/AdminLayout';
import { adminDb } from '../../lib/adminDb';
import { useAdminAuth } from '../../contexts/AdminAuthContext';

const PRIORITIES = ['High', 'Medium', 'Low'] as const;
const STAGES = ['Identified', 'Contacted', 'Responded', 'Follow-up Scheduled', 'Closed'] as const;
type Priority = typeof PRIORITIES[number];
type Stage = typeof STAGES[number];

// Bethra admin palette (matches AdminCRMDashboard / AdminCampaignsPage).
const PRIORITY_META: Record<Priority, { color: string; bg: string }> = {
  High:   { color: '#C0392B', bg: '#F5DDD9' },
  Medium: { color: '#D08A28', bg: '#F5EAD3' },
  Low:    { color: '#8A8070', bg: '#F7F3EC' },
};
const PRIORITY_RANK: Record<string, number> = { High: 0, Medium: 1, Low: 2 };
const STAGE_META: Record<Stage, { color: string; bg: string }> = {
  'Identified':          { color: '#8A8070', bg: '#F7F3EC' },
  'Contacted':           { color: '#D08A28', bg: '#F5EAD3' },
  'Responded':           { color: '#3AAD6A', bg: '#F0F5F1' },
  'Follow-up Scheduled': { color: '#D08A28', bg: '#F5EAD3' },
  'Closed':              { color: '#2A8A52', bg: '#F0F5F1' },
};

interface Contact {
  id: string;
  email: string;
  full_name: string | null;
  company: string | null;
  priority: string | null;
  stage: string | null;
  last_contacted: string | null; // timestamptz
  follow_up_date: string | null; // date (YYYY-MM-DD)
  notes: string | null;
  categoryNames: string[];
}

// Local-time YYYY-MM-DD helpers (follow_up_date is a plain DATE; compare as strings).
function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function dateInput(v: string | null): string {
  return v ? v.slice(0, 10) : '';
}
function fmtDate(v: string | null): string {
  if (!v) return '—';
  const d = new Date(v.length <= 10 ? v + 'T00:00:00' : v);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function AdminCRMPipeline() {
  const { sessionToken } = useAdminAuth();
  const [loading, setLoading] = useState(true);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [followFilter, setFollowFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('priority');
  const [editing, setEditing] = useState<Contact | null>(null);
  const [toast, setToast] = useState<{ severity: 'success' | 'error'; msg: string } | null>(null);

  const load = useCallback(async () => {
    if (!sessionToken) return;
    setLoading(true);
    const [cRes, lRes, sRes] = await Promise.all([
      adminDb(sessionToken, 'crm_contacts').select(
        'id,email,full_name,company,priority,stage,last_contacted,follow_up_date,notes',
        { order: { column: 'created_at', ascending: false } }),
      adminDb(sessionToken, 'contact_segments').select('contact_id,segment_id'),
      adminDb(sessionToken, 'marketing_segments').select('id,name'),
    ]);
    const nameById = new Map(((sRes.data ?? []) as Array<{ id: string; name: string }>).map(s => [s.id, s.name]));
    const byContact = new Map<string, string[]>();
    for (const l of (lRes.data ?? []) as Array<{ contact_id: string; segment_id: string }>) {
      const arr = byContact.get(l.contact_id) ?? [];
      const n = nameById.get(l.segment_id);
      if (n) arr.push(n);
      byContact.set(l.contact_id, arr);
    }
    // One row per CONTACT (not per category); a contact in multiple categories shows
    // all of them as chips. Dedup is inherent since we key by contact id.
    setContacts(((cRes.data ?? []) as Omit<Contact, 'categoryNames'>[]).map(c => ({
      ...c, categoryNames: byContact.get(c.id) ?? [],
    })));
    setLoading(false);
  }, [sessionToken]);

  useEffect(() => { void load(); }, [load]);

  const today = toDateStr(new Date());
  const weekEnd = useMemo(() => { const d = new Date(); d.setDate(d.getDate() + 6); return toDateStr(d); }, []);

  const isOverdue = useCallback((c: Contact) =>
    !!c.follow_up_date && c.follow_up_date < today && c.stage !== 'Closed', [today]);
  const isDueThisWeek = useCallback((c: Contact) =>
    !!c.follow_up_date && c.follow_up_date >= today && c.follow_up_date <= weekEnd && c.stage !== 'Closed', [today, weekEnd]);

  // Follow-up summary header — live counts from the data that exists (0s until set).
  const summary = useMemo(() => ({
    overdue: contacts.filter(isOverdue).length,
    dueThisWeek: contacts.filter(isDueThisWeek).length,
    high: contacts.filter(c => c.priority === 'High').length,
    medium: contacts.filter(c => c.priority === 'Medium').length,
    low: contacts.filter(c => c.priority === 'Low').length,
  }), [contacts, isOverdue, isDueThisWeek]);

  const rows = useMemo(() => {
    let r = contacts;
    if (priorityFilter !== 'all') r = r.filter(c => (c.priority ?? '') === priorityFilter);
    if (followFilter === 'overdue') r = r.filter(isOverdue);
    else if (followFilter === 'week') r = r.filter(isDueThisWeek);
    else if (followFilter === 'scheduled') r = r.filter(c => !!c.follow_up_date && c.stage !== 'Closed');
    else if (followFilter === 'none') r = r.filter(c => !c.follow_up_date);
    const sorted = [...r];
    if (sortBy === 'priority') {
      sorted.sort((a, b) => (PRIORITY_RANK[a.priority ?? ''] ?? 9) - (PRIORITY_RANK[b.priority ?? ''] ?? 9));
    } else if (sortBy === 'followup') {
      // Soonest follow-up first; nulls last.
      sorted.sort((a, b) => (a.follow_up_date ?? '9999').localeCompare(b.follow_up_date ?? '9999'));
    } else {
      sorted.sort((a, b) => (a.full_name ?? a.email).localeCompare(b.full_name ?? b.email));
    }
    return sorted;
  }, [contacts, priorityFilter, followFilter, sortBy, isOverdue, isDueThisWeek]);

  async function save(patch: Partial<Contact>) {
    if (!editing || !sessionToken) return;
    const { error } = await adminDb(sessionToken, 'crm_contacts').update({
      priority: patch.priority || null,
      stage: patch.stage || null,
      last_contacted: patch.last_contacted || null,
      follow_up_date: patch.follow_up_date || null,
      notes: patch.notes || null,
      updated_at: new Date().toISOString(),
    }, { id: editing.id });
    if (error) { setToast({ severity: 'error', msg: `Save failed: ${error}` }); return; }
    setToast({ severity: 'success', msg: 'Pipeline updated.' });
    setEditing(null);
    void load();
  }

  const STAT_CARDS = [
    { label: 'Overdue follow-ups', value: summary.overdue, icon: <WarningAmberOutlinedIcon sx={{ fontSize: 20 }} />, color: '#C0392B', bg: '#F5DDD9' },
    { label: 'Due this week', value: summary.dueThisWeek, icon: <EventAvailableOutlinedIcon sx={{ fontSize: 20 }} />, color: '#D08A28', bg: '#F5EAD3' },
    { label: 'High priority', value: summary.high, icon: <FlagOutlinedIcon sx={{ fontSize: 20 }} />, color: '#C0392B', bg: '#F5DDD9' },
    { label: 'Medium priority', value: summary.medium, icon: <FlagOutlinedIcon sx={{ fontSize: 20 }} />, color: '#D08A28', bg: '#F5EAD3' },
    { label: 'Low priority', value: summary.low, icon: <FlagOutlinedIcon sx={{ fontSize: 20 }} />, color: '#8A8070', bg: '#F7F3EC' },
  ];

  return (
    <AdminLayout>
      <Box sx={{ p: 3, bgcolor: '#FAF8F3', minHeight: '100vh' }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="h5" fontWeight={800}>CRM Pipeline</Typography>
          <Typography variant="body2" color="text.secondary">Prioritize contacts and track follow-ups</Typography>
        </Box>

        {loading && <LinearProgress sx={{ mb: 2, borderRadius: 1 }} />}

        {/* Follow-up summary header — real live counts */}
        <Stack direction="row" spacing={2} sx={{ mb: 3 }} flexWrap="wrap">
          {STAT_CARDS.map(s => (
            <Card key={s.label} elevation={0} sx={{ border: '1px solid', borderColor: 'grey.200', borderRadius: 2, p: 2, minWidth: 150, flex: '1 1 auto' }}>
              <Box sx={{ width: 36, height: 36, borderRadius: 1.5, bgcolor: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color, mb: 1 }}>
                {s.icon}
              </Box>
              <Typography variant="h6" fontWeight={800} sx={{ color: s.color }}>{s.value}</Typography>
              <Typography variant="caption" color="text.secondary" fontWeight={600}>{s.label}</Typography>
            </Card>
          ))}
        </Stack>

        {/* Filters + sort */}
        <Stack direction="row" spacing={1.5} sx={{ mb: 2 }} flexWrap="wrap">
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Priority</InputLabel>
            <Select label="Priority" value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}>
              <MenuItem value="all">All priorities</MenuItem>
              {PRIORITIES.map(p => <MenuItem key={p} value={p}>{p}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 170 }}>
            <InputLabel>Follow-up</InputLabel>
            <Select label="Follow-up" value={followFilter} onChange={e => setFollowFilter(e.target.value)}>
              <MenuItem value="all">All follow-ups</MenuItem>
              <MenuItem value="overdue">Overdue</MenuItem>
              <MenuItem value="week">Due this week</MenuItem>
              <MenuItem value="scheduled">Scheduled (open)</MenuItem>
              <MenuItem value="none">No date set</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Sort by</InputLabel>
            <Select label="Sort by" value={sortBy} onChange={e => setSortBy(e.target.value)}>
              <MenuItem value="priority">Priority</MenuItem>
              <MenuItem value="followup">Follow-up due</MenuItem>
              <MenuItem value="name">Name</MenuItem>
            </Select>
          </FormControl>
          <Box sx={{ flex: 1 }} />
          <Typography variant="caption" color="text.secondary" sx={{ alignSelf: 'center' }}>{rows.length} contact{rows.length === 1 ? '' : 's'}</Typography>
        </Stack>

        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'grey.200' }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: '#FAF8F3' }}>
                {['Contact', 'Categories', 'Priority', 'Stage', 'Last Contacted', 'Follow-up', ''].map(h => (
                  <TableCell key={h} sx={{ fontWeight: 700, fontSize: '0.75rem', color: '#8A8070' }}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map(c => {
                const overdue = isOverdue(c);
                return (
                  <TableRow key={c.id} hover sx={{ '&:hover': { bgcolor: '#FAF8F3' } }}>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>{c.full_name ?? '—'}</Typography>
                      <Typography variant="caption" color="text.secondary">{c.email}</Typography>
                    </TableCell>
                    <TableCell sx={{ maxWidth: 200 }}>
                      <Stack direction="row" gap={0.5} flexWrap="wrap">
                        {c.categoryNames.length
                          ? c.categoryNames.map(n => <Chip key={n} label={n} size="small" sx={{ height: 18, fontSize: '0.62rem', bgcolor: '#F0F5F1', color: '#1B6B3E' }} />)
                          : <Typography variant="caption" color="text.disabled">—</Typography>}
                      </Stack>
                    </TableCell>
                    <TableCell>
                      {c.priority
                        ? <Chip label={c.priority} size="small" sx={{ height: 20, fontSize: '0.68rem', fontWeight: 700, bgcolor: PRIORITY_META[c.priority as Priority]?.bg, color: PRIORITY_META[c.priority as Priority]?.color }} />
                        : <Typography variant="caption" color="text.disabled">—</Typography>}
                    </TableCell>
                    <TableCell>
                      {c.stage
                        ? <Chip label={c.stage} size="small" sx={{ height: 20, fontSize: '0.66rem', fontWeight: 700, bgcolor: STAGE_META[c.stage as Stage]?.bg, color: STAGE_META[c.stage as Stage]?.color }} />
                        : <Typography variant="caption" color="text.disabled">—</Typography>}
                    </TableCell>
                    <TableCell><Typography variant="caption" color="text.secondary">{fmtDate(c.last_contacted)}</Typography></TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={0.5} alignItems="center">
                        <Typography variant="caption" sx={{ color: overdue ? '#C0392B' : 'text.secondary', fontWeight: overdue ? 700 : 400 }}>
                          {fmtDate(c.follow_up_date)}
                        </Typography>
                        {overdue && <Chip label="Overdue" size="small" sx={{ height: 16, fontSize: '0.58rem', fontWeight: 700, bgcolor: '#F5DDD9', color: '#C0392B' }} />}
                      </Stack>
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Edit pipeline">
                        <IconButton size="small" onClick={() => setEditing(c)}><EditOutlinedIcon sx={{ fontSize: 16 }} /></IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })}
              {!loading && rows.length === 0 && (
                <TableRow><TableCell colSpan={7} align="center" sx={{ py: 5, color: 'text.secondary' }}>No contacts match these filters.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      </Box>

      {editing && <PipelineEditDialog contact={editing} onClose={() => setEditing(null)} onSave={save} />}

      <Snackbar open={Boolean(toast)} autoHideDuration={4000} onClose={() => setToast(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        {toast ? <Alert severity={toast.severity} onClose={() => setToast(null)}>{toast.msg}</Alert> : undefined}
      </Snackbar>
    </AdminLayout>
  );
}

function PipelineEditDialog({ contact, onClose, onSave }: {
  contact: Contact; onClose: () => void; onSave: (patch: Partial<Contact>) => Promise<void>;
}) {
  const [priority, setPriority] = useState(contact.priority ?? '');
  const [stage, setStage] = useState(contact.stage ?? '');
  const [lastContacted, setLastContacted] = useState(dateInput(contact.last_contacted));
  const [followUp, setFollowUp] = useState(dateInput(contact.follow_up_date));
  const [notes, setNotes] = useState(contact.notes ?? '');
  const [saving, setSaving] = useState(false);

  async function submit() {
    setSaving(true);
    await onSave({
      priority: priority || null,
      stage: stage || null,
      last_contacted: lastContacted || null,
      follow_up_date: followUp || null,
      notes: notes || null,
    });
    setSaving(false);
  }

  return (
    <Dialog open onClose={saving ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 800 }}>
        Pipeline — {contact.full_name ?? contact.email}
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Stack direction="row" spacing={2}>
            <FormControl size="small" fullWidth>
              <InputLabel>Priority</InputLabel>
              <Select label="Priority" value={priority} onChange={e => setPriority(e.target.value)}>
                <MenuItem value=""><em>Unset</em></MenuItem>
                {PRIORITIES.map(p => <MenuItem key={p} value={p}>{p}</MenuItem>)}
              </Select>
            </FormControl>
            <FormControl size="small" fullWidth>
              <InputLabel>Stage</InputLabel>
              <Select label="Stage" value={stage} onChange={e => setStage(e.target.value)}>
                <MenuItem value=""><em>Unset</em></MenuItem>
                {STAGES.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
              </Select>
            </FormControl>
          </Stack>
          <Stack direction="row" spacing={2}>
            <TextField label="Last contacted" type="date" size="small" fullWidth value={lastContacted}
              onChange={e => setLastContacted(e.target.value)} InputLabelProps={{ shrink: true }} />
            <TextField label="Follow-up date" type="date" size="small" fullWidth value={followUp}
              onChange={e => setFollowUp(e.target.value)} InputLabelProps={{ shrink: true }} />
          </Stack>
          <TextField label="Notes" size="small" fullWidth multiline minRows={4} value={notes} onChange={e => setNotes(e.target.value)} />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>Cancel</Button>
        <Button variant="contained" onClick={() => void submit()} disabled={saving} sx={{ bgcolor: '#1B6B3E', '&:hover': { bgcolor: '#2A8A52' } }}>{saving ? 'Saving…' : 'Save'}</Button>
      </DialogActions>
    </Dialog>
  );
}
