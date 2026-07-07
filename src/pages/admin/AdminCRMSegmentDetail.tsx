import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Table from '@mui/material/Table';
import TableHead from '@mui/material/TableHead';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';
import Avatar from '@mui/material/Avatar';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import Link from '@mui/material/Link';
import LinearProgress from '@mui/material/LinearProgress';
import Pagination from '@mui/material/Pagination';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Divider from '@mui/material/Divider';
import InputAdornment from '@mui/material/InputAdornment';
import Tooltip from '@mui/material/Tooltip';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import PersonAddOutlinedIcon from '@mui/icons-material/PersonAddOutlined';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import DownloadIcon from '@mui/icons-material/Download';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import ListAltIcon from '@mui/icons-material/ListAlt';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import AdminLayout from '../../components/AdminLayout';
import { adminDb } from '../../lib/adminDb';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import {
  type Segment, type SegmentRule, type EnrichedUser, type FieldDef,
  FIELD_DEFS, applyRules,
} from './crmSegmentEngine';

const PER_PAGE = 25;

interface CrmContact {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  full_name: string | null;
  phone: string | null;
  company: string | null;
  role: string | null;
  segment_id: string;
  created_at: string;
}

function initials(name: string | null): string {
  if (!name) return '?';
  return name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2);
}

function daysBetween(date: string | null): number {
  if (!date) return 9999;
  return Math.floor((Date.now() - new Date(date).getTime()) / 86400000);
}

// ─── Edit Rules Dialog ────────────────────────────────────────────────────────

function RuleRow({
  rule, index, onChange, onRemove,
}: {
  rule: SegmentRule;
  index: number;
  onChange: (idx: number, r: SegmentRule) => void;
  onRemove: (idx: number) => void;
}) {
  const fieldDef = FIELD_DEFS.find(f => f.field === rule.field) ?? FIELD_DEFS[0];

  return (
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ sm: 'center' }}>
      <FormControl size="small" sx={{ minWidth: 160 }}>
        <InputLabel>Field</InputLabel>
        <Select
          label="Field"
          value={rule.field}
          onChange={e => {
            const nf = FIELD_DEFS.find(f => f.field === e.target.value) ?? FIELD_DEFS[0];
            onChange(index, { field: e.target.value, operator: nf.operators[0].value, value: nf.type === 'number' || nf.type === 'days' ? 0 : (nf.options?.[0]?.value ?? '') });
          }}
        >
          {Object.entries(FIELD_DEFS.reduce<Record<string, FieldDef[]>>((acc, f) => { if (!acc[f.category]) acc[f.category] = []; acc[f.category].push(f); return acc; }, {})).map(([cat, fields]) => [
            <MenuItem key={`cat-${cat}`} disabled sx={{ fontSize: '0.7rem', fontWeight: 800, color: '#8A8070', textTransform: 'uppercase' }}>{cat}</MenuItem>,
            ...fields.map(f => <MenuItem key={f.field} value={f.field} sx={{ pl: 3 }}>{f.label}</MenuItem>),
          ])}
        </Select>
      </FormControl>
      <FormControl size="small" sx={{ minWidth: 150 }}>
        <InputLabel>Condition</InputLabel>
        <Select label="Condition" value={rule.operator} onChange={e => onChange(index, { ...rule, operator: e.target.value })}>
          {fieldDef.operators.map(op => <MenuItem key={op.value} value={op.value}>{op.label}</MenuItem>)}
        </Select>
      </FormControl>
      {(fieldDef.type === 'number' || fieldDef.type === 'days') ? (
        <TextField size="small" type="number" label="Value" value={rule.value as number} onChange={e => onChange(index, { ...rule, value: Number(e.target.value) })} sx={{ width: 100 }} slotProps={{ htmlInput: { min: 0 } }} />
      ) : fieldDef.type === 'select' ? (
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Value</InputLabel>
          <Select label="Value" value={rule.value as string} onChange={e => onChange(index, { ...rule, value: e.target.value })}>
            {fieldDef.options?.map(opt => <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>)}
          </Select>
        </FormControl>
      ) : null}
      <IconButton size="small" onClick={() => onRemove(index)} color="error" sx={{ ml: 'auto !important' }}>
        <CloseIcon sx={{ fontSize: 16 }} />
      </IconButton>
    </Stack>
  );
}

function EditRulesDialog({
  open, segment, allUsers, onClose, onSaved,
}: {
  open: boolean;
  segment: Segment;
  allUsers: EnrichedUser[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const { sessionToken } = useAdminAuth();
  const [rules, setRules] = useState<SegmentRule[]>(segment.rules);
  const [saving, setSaving] = useState(false);

  useEffect(() => { setRules(segment.rules); }, [segment.rules]);

  const preview = applyRules(allUsers, rules);

  function addRule() {
    setRules(r => [...r, { field: FIELD_DEFS[0].field, operator: FIELD_DEFS[0].operators[0].value, value: FIELD_DEFS[0].options?.[0]?.value ?? '' }]);
  }

  async function save() {
    if (!sessionToken) return;
    setSaving(true);
    await adminDb(sessionToken, 'marketing_segments').update({ rules, user_count: preview.length, updated_at: new Date().toISOString() }, { id: segment.id });
    setSaving(false);
    onSaved();
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Edit Rules — {segment.name}</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="subtitle2" fontWeight={700}>Rules (ALL must match)</Typography>
            <Button size="small" startIcon={<AddIcon />} onClick={addRule} variant="outlined" sx={{ fontSize: '0.75rem' }}>Add Rule</Button>
          </Stack>
          {rules.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 3, border: '2px dashed', borderColor: 'divider', borderRadius: 2 }}>
              <Typography variant="body2" color="text.secondary">No rules — matches ALL users</Typography>
              <Button size="small" sx={{ mt: 1 }} onClick={addRule} startIcon={<AddIcon />}>Add First Rule</Button>
            </Box>
          ) : (
            <Stack spacing={1.5}>
              {rules.map((rule, i) => (
                <Box key={i}>
                  {i > 0 && <Typography variant="caption" sx={{ color: '#1B6B3E', fontWeight: 700, display: 'block', mb: 1.5 }}>AND</Typography>}
                  <RuleRow rule={rule} index={i} onChange={(idx, r) => setRules(prev => prev.map((x, j) => j === idx ? r : x))} onRemove={idx => setRules(prev => prev.filter((_, j) => j !== idx))} />
                </Box>
              ))}
            </Stack>
          )}
          <Box sx={{ p: 2, bgcolor: '#FAF8F3', borderRadius: 2, border: '1px solid', borderColor: 'grey.200' }}>
            <Chip label={`${preview.length} user${preview.length !== 1 ? 's' : ''} match`} size="small" sx={{ bgcolor: '#F0F5F1', color: '#1B6B3E', fontWeight: 700 }} />
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={save} disabled={saving}>Save Rules</Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── Add Members Dialog (Manual) ─────────────────────────────────────────────

function AddMembersDialog({
  open, segmentId, existingIds, allUsers, onClose, onSaved,
}: {
  open: boolean;
  segmentId: string;
  existingIds: Set<string>;
  allUsers: EnrichedUser[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const { sessionToken } = useAdminAuth();
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<EnrichedUser[]>([]);
  const [saving, setSaving] = useState(false);

  const filtered = search
    ? allUsers.filter(u => !existingIds.has(u.user_id) && !selected.some(s => s.user_id === u.user_id) && (u.full_name ?? '').toLowerCase().includes(search.toLowerCase())).slice(0, 8)
    : [];

  async function save() {
    if (!selected.length || !sessionToken) return;
    setSaving(true);
    await adminDb(sessionToken, 'segment_members').insert(selected.map(u => ({ segment_id: segmentId, user_id: u.user_id })));
    await adminDb(sessionToken, 'marketing_segments').update({ user_count: existingIds.size + selected.length, updated_at: new Date().toISOString() }, { id: segmentId });
    setSaving(false);
    setSelected([]);
    setSearch('');
    onSaved();
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Add Members</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField size="small" fullWidth placeholder="Search by name…" value={search} onChange={e => setSearch(e.target.value)}
            slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 18, color: 'text.disabled' }} /></InputAdornment> } }}
          />
          {filtered.length > 0 && (
            <Box sx={{ border: '1px solid', borderColor: 'grey.200', borderRadius: 1, overflow: 'hidden' }}>
              {filtered.map(u => (
                <Box key={u.user_id} onClick={() => { setSelected(prev => [...prev, u]); setSearch(''); }}
                  sx={{ px: 1.5, py: 0.75, cursor: 'pointer', '&:hover': { bgcolor: '#FAF8F3' }, display: 'flex', alignItems: 'center', gap: 1, borderBottom: '1px solid', borderColor: 'grey.100', '&:last-child': { borderBottom: 0 } }}>
                  <Avatar sx={{ width: 24, height: 24, bgcolor: '#1B6B3E', fontSize: '0.65rem' }}>{initials(u.full_name)}</Avatar>
                  <Typography variant="body2">{u.full_name ?? '—'}</Typography>
                </Box>
              ))}
            </Box>
          )}
          {selected.length > 0 && (
            <Stack direction="row" flexWrap="wrap" gap={0.75}>
              {selected.map(u => (
                <Chip key={u.user_id} label={u.full_name ?? '—'} size="small"
                  onDelete={() => setSelected(prev => prev.filter(x => x.user_id !== u.user_id))}
                  avatar={<Avatar sx={{ bgcolor: '#1B6B3E !important', fontSize: '0.55rem !important' }}>{initials(u.full_name)}</Avatar>}
                />
              ))}
            </Stack>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={save} disabled={!selected.length || saving}>Add {selected.length > 0 ? `(${selected.length})` : ''}</Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminCRMSegmentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { sessionToken } = useAdminAuth();
  const [segment, setSegment] = useState<Segment | null>(null);
  const [matchedUsers, setMatchedUsers] = useState<EnrichedUser[]>([]);
  const [allUsers, setAllUsers] = useState<EnrichedUser[]>([]);
  const [crmContacts, setCrmContacts] = useState<CrmContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [editRulesOpen, setEditRulesOpen] = useState(false);
  const [addMembersOpen, setAddMembersOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    if (!id || !sessionToken) return;
    setLoading(true);
    const [
      { data: segData },
      { data: profilesData },
      { data: ideasData },
      { data: membersData },
      { data: contactsData, error: contactsErr },
    ] = await Promise.all([
      adminDb(sessionToken, 'marketing_segments').select('*', { match: { id }, single: true }),
      adminDb(sessionToken, 'profiles').select('user_id, full_name, role, tier, lead_score, lifecycle_stage, user_status, last_login_at, created_at, login_count, iq_score'),
      adminDb(sessionToken, 'user_ideas').select('user_id'),
      adminDb(sessionToken, 'segment_members').select('user_id', { match: { segment_id: id } }),
      adminDb(sessionToken, 'crm_contacts').select('*', { match: { segment_id: id } }),
    ]);

    if (contactsErr) console.error('crm_contacts fetch error:', contactsErr);

    if (!segData) { setLoading(false); return; }

    const ideasCountMap: Record<string, number> = {};
    (ideasData ?? []).forEach((r: { user_id: string }) => {
      ideasCountMap[r.user_id] = (ideasCountMap[r.user_id] ?? 0) + 1;
    });

    const users: EnrichedUser[] = (profilesData ?? []).map((p: Omit<EnrichedUser, 'ideas_count'>) => ({
      ...p,
      ideas_count: ideasCountMap[p.user_id] ?? 0,
      lead_score: p.lead_score ?? 0,
      login_count: p.login_count ?? 0,
    }));

    setAllUsers(users);
    setCrmContacts((contactsData ?? []) as CrmContact[]);

    const seg: Segment = { ...segData, rules: (segData.rules ?? []) as SegmentRule[] };
    setSegment(seg);

    if (seg.type === 'smart') {
      setMatchedUsers(applyRules(users, seg.rules));
    } else {
      const memberIds = new Set((membersData ?? []).map((r: { user_id: string }) => r.user_id));
      setMatchedUsers(users.filter(u => memberIds.has(u.user_id)));
    }

    setLoading(false);
  }, [id, sessionToken]);

  useEffect(() => { void load(); }, [load]);

  async function removeMember(userId: string) {
    if (!id || segment?.type !== 'manual' || !sessionToken) return;
    await adminDb(sessionToken, 'segment_members').delete({ segment_id: id, user_id: userId });
    setMatchedUsers(prev => prev.filter(u => u.user_id !== userId));
  }

  async function removeContact(contactId: string) {
    if (!id || !sessionToken) return;
    await adminDb(sessionToken, 'crm_contacts').delete({ id: contactId });
    setCrmContacts(prev => prev.filter(c => c.id !== contactId));
  }

  async function deleteSegment() {
    if (!id || !sessionToken) return;
    setDeleting(true);
    await adminDb(sessionToken, 'marketing_segments').delete({ id });
    navigate('/admin/crm/segments', { replace: true });
  }

  const totalCount = matchedUsers.length + crmContacts.length;

  function exportCSV() {
    const header = 'Name,Email,Company,Role,Plan,Lead Score,Last Active,Status\n';
    const userRows = matchedUsers.map(u =>
      [u.full_name ?? '', '', '', u.role ?? '', u.tier ?? 'free', u.lead_score, u.last_login_at ? `${daysBetween(u.last_login_at)}d ago` : '', u.user_status ?? ''].join(',')
    );
    const contactRows = crmContacts.map(c => {
      const name = c.full_name || [c.first_name, c.last_name].filter(Boolean).join(' ') || '';
      return [name, c.email, c.company ?? '', c.role ?? '', '', '', '', 'External'].join(',');
    });
    const blob = new Blob([header + [...userRows, ...contactRows].join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${segment?.name ?? 'segment'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Paginate across both lists combined
  const allRows = page === 1
    ? { users: matchedUsers.slice(0, PER_PAGE), contacts: [] as CrmContact[] }
    : (() => {
        const start = (page - 1) * PER_PAGE;
        const end = page * PER_PAGE;
        const usersSlice = matchedUsers.slice(start, Math.min(end, matchedUsers.length));
        const contactStart = Math.max(0, start - matchedUsers.length);
        const contactEnd = Math.max(0, end - matchedUsers.length);
        const contactsSlice = crmContacts.slice(contactStart, contactEnd);
        return { users: usersSlice, contacts: contactsSlice };
      })();

  // Simpler approach: combine into flat paged list
  const paginatedUsers = matchedUsers.slice(
    Math.max(0, (page - 1) * PER_PAGE),
    Math.min(matchedUsers.length, page * PER_PAGE)
  );
  const contactOffset = Math.max(0, (page - 1) * PER_PAGE - matchedUsers.length);
  const contactLimit = Math.max(0, page * PER_PAGE - Math.max(matchedUsers.length, (page - 1) * PER_PAGE));
  const paginatedContacts = crmContacts.slice(contactOffset, contactOffset + contactLimit);

  const pageCount = Math.ceil(totalCount / PER_PAGE);
  const existingIds = new Set(matchedUsers.map(u => u.user_id));

  // suppress unused variable
  void allRows;

  if (loading) {
    return (
      <AdminLayout>
        <Box sx={{ p: 3 }}><LinearProgress /></Box>
      </AdminLayout>
    );
  }

  if (!segment) {
    return (
      <AdminLayout>
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="text.secondary">Segment not found.</Typography>
          <Button onClick={() => navigate('/admin/crm/segments')} sx={{ mt: 2 }}>Back to Segments</Button>
        </Box>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <Box sx={{ p: 3, bgcolor: '#FAF8F3', minHeight: '100vh' }}>
        {/* Breadcrumb */}
        <Breadcrumbs sx={{ mb: 2, fontSize: '0.8rem' }}>
          <Link component={RouterLink} to="/admin/crm" underline="hover" color="text.secondary" sx={{ fontSize: '0.8rem' }}>CRM</Link>
          <Link component={RouterLink} to="/admin/crm/segments" underline="hover" color="text.secondary" sx={{ fontSize: '0.8rem' }}>Segments</Link>
          <Typography color="text.primary" sx={{ fontSize: '0.8rem' }}>{segment.name}</Typography>
        </Breadcrumbs>

        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
          <IconButton size="small" onClick={() => navigate('/admin/crm/segments')}>
            <ArrowBackIcon sx={{ fontSize: 18 }} />
          </IconButton>
          <Typography variant="h5" fontWeight={800} sx={{ flex: 1 }}>{segment.name}</Typography>
          {segment.type === 'smart' ? (
            <Chip icon={<AutoAwesomeIcon sx={{ fontSize: 13 }} />} label="Smart" size="small" sx={{ bgcolor: '#DEEBE2', color: '#1B6B3E', fontWeight: 700 }} />
          ) : (
            <Chip icon={<ListAltIcon sx={{ fontSize: 13 }} />} label="Manual" size="small" sx={{ bgcolor: '#DEEBE2', color: '#2A8A52', fontWeight: 700 }} />
          )}
        </Stack>

        {/* Stats + actions row */}
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr auto' }, gap: 2, mb: 3 }}>
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'grey.200' }}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Stack direction="row" spacing={3} alignItems="center" flexWrap="wrap" gap={1}>
                <Box>
                  <Typography variant="h4" fontWeight={800}>{totalCount}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {matchedUsers.length > 0 && crmContacts.length > 0
                      ? `${matchedUsers.length} users · ${crmContacts.length} uploaded`
                      : crmContacts.length > 0
                      ? `${crmContacts.length} uploaded contacts`
                      : 'Users in segment'}
                  </Typography>
                </Box>
                {segment.type === 'smart' && segment.rules.length > 0 && (
                  <>
                    <Divider orientation="vertical" flexItem />
                    <Box>
                      <Typography variant="caption" color="text.secondary" fontWeight={700}>RULES</Typography>
                      <Stack direction="row" spacing={0.5} flexWrap="wrap" gap={0.5} sx={{ mt: 0.5 }}>
                        {segment.rules.map((r, i) => {
                          const fd = FIELD_DEFS.find(f => f.field === r.field);
                          return (
                            <Chip
                              key={i}
                              label={`${fd?.label ?? r.field} ${r.operator} ${r.value}`}
                              size="small"
                              sx={{ height: 20, fontSize: '0.68rem', bgcolor: '#F7F3EC', color: '#554E41' }}
                            />
                          );
                        })}
                        {segment.rules.length === 0 && <Typography variant="caption" color="text.secondary">All users</Typography>}
                      </Stack>
                    </Box>
                  </>
                )}
              </Stack>
            </CardContent>
          </Card>

          <Stack direction={{ xs: 'row', md: 'column' }} spacing={1} justifyContent="center">
            {segment.type === 'smart' ? (
              <Button variant="outlined" startIcon={<EditOutlinedIcon />} onClick={() => setEditRulesOpen(true)} size="small">
                Edit Rules
              </Button>
            ) : (
              <Button variant="outlined" startIcon={<PersonAddOutlinedIcon />} onClick={() => setAddMembersOpen(true)} size="small">
                Add Members
              </Button>
            )}
            <Button variant="outlined" startIcon={<DownloadIcon />} onClick={exportCSV} size="small">
              Export CSV
            </Button>
            <Button variant="outlined" color="error" startIcon={<DeleteOutlineIcon />} onClick={() => setDeleteConfirm(true)} size="small">
              Delete
            </Button>
          </Stack>
        </Box>

        {/* Contact Table */}
        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'grey.200' }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: '#FAF8F3' }}>
                {['Name', 'Email / Company', 'Role', 'Plan', 'Lead Score', 'Last Active', 'Status', ''].map(col => (
                  <TableCell key={col} sx={{ fontWeight: 700, fontSize: '0.75rem', color: '#8A8070' }}>{col}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {/* Auth user rows */}
              {paginatedUsers.map(u => (
                <TableRow key={u.user_id} hover sx={{ cursor: 'pointer', '&:last-child td': { border: 0 } }} onClick={() => navigate(`/admin/crm/users/${u.user_id}`)}>
                  <TableCell>
                    <Stack direction="row" spacing={1.25} alignItems="center">
                      <Avatar sx={{ width: 26, height: 26, bgcolor: '#1B6B3E', fontSize: '0.7rem', fontWeight: 700 }}>
                        {initials(u.full_name)}
                      </Avatar>
                      <Typography variant="body2" fontWeight={600}>{u.full_name ?? '—'}</Typography>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Typography variant="caption" color="text.secondary">—</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip label={u.role === 'investor' ? 'Investor' : 'Founder'} size="small"
                      sx={{ bgcolor: u.role === 'investor' ? '#DEEBE2' : '#F0F5F1', color: u.role === 'investor' ? '#2A8A52' : '#1B6B3E', fontWeight: 700, fontSize: '0.7rem', height: 20 }} />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>{u.tier ?? 'free'}</Typography>
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={0.75} alignItems="center">
                      <Typography variant="body2" fontWeight={700} sx={{ color: u.lead_score >= 70 ? '#2A8A52' : u.lead_score >= 40 ? '#D08A28' : '#C0392B' }}>
                        {u.lead_score}
                      </Typography>
                      <Box sx={{ width: 40, height: 4, borderRadius: 2, bgcolor: '#E8E4DC', overflow: 'hidden' }}>
                        <Box sx={{ width: `${u.lead_score}%`, height: '100%', bgcolor: u.lead_score >= 70 ? '#2A8A52' : u.lead_score >= 40 ? '#D08A28' : '#C0392B', borderRadius: 2 }} />
                      </Box>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {u.last_login_at ? `${daysBetween(u.last_login_at)}d ago` : '—'}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {(() => {
                      const s = u.user_status ?? 'inactive';
                      const map: Record<string, { label: string; color: string; bg: string }> = {
                        active: { label: 'Active', color: '#2A8A52', bg: '#DEEBE2' },
                        inactive: { label: 'Inactive', color: '#D08A28', bg: '#F5EAD3' },
                        at_risk: { label: 'At Risk', color: '#C0392B', bg: '#F5DDD9' },
                        churned: { label: 'Churned', color: '#8A8070', bg: '#F7F3EC' },
                      };
                      const info = map[s] ?? map.inactive;
                      return <Chip label={info.label} size="small" sx={{ bgcolor: info.bg, color: info.color, fontWeight: 700, fontSize: '0.7rem', height: 20 }} />;
                    })()}
                  </TableCell>
                  <TableCell padding="none">
                    <Stack direction="row" spacing={0}>
                      <Tooltip title="View profile">
                        <IconButton size="small" onClick={e => { e.stopPropagation(); navigate(`/admin/crm/users/${u.user_id}`); }}>
                          <OpenInNewIcon sx={{ fontSize: 15 }} />
                        </IconButton>
                      </Tooltip>
                      {segment.type === 'manual' && (
                        <Tooltip title="Remove from segment">
                          <IconButton size="small" color="error" onClick={e => { e.stopPropagation(); void removeMember(u.user_id); }}>
                            <DeleteOutlineIcon sx={{ fontSize: 15 }} />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}

              {/* Uploaded contact rows */}
              {paginatedContacts.map(c => {
                const displayName = c.full_name || [c.first_name, c.last_name].filter(Boolean).join(' ') || c.email;
                return (
                  <TableRow key={c.id} sx={{ bgcolor: '#FAF8F3', '&:last-child td': { border: 0 } }}>
                    <TableCell>
                      <Stack direction="row" spacing={1.25} alignItems="center">
                        <Avatar sx={{ width: 26, height: 26, bgcolor: '#8A8070', fontSize: '0.7rem', fontWeight: 700 }}>
                          {initials(displayName)}
                        </Avatar>
                        <Stack spacing={0}>
                          <Typography variant="body2" fontWeight={600}>{displayName}</Typography>
                          <Chip label="Uploaded" size="small" sx={{ height: 14, fontSize: '0.6rem', bgcolor: '#F7F3EC', color: '#8A8070', width: 'fit-content', '& .MuiChip-label': { px: 0.75 } }} />
                        </Stack>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Stack spacing={0}>
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>{c.email}</Typography>
                        {c.company && <Typography variant="caption" color="text.disabled">{c.company}</Typography>}
                      </Stack>
                    </TableCell>
                    <TableCell>
                      {c.role
                        ? <Chip label={c.role} size="small" sx={{ bgcolor: '#F7F3EC', color: '#8A8070', fontWeight: 700, fontSize: '0.7rem', height: 20 }} />
                        : <Typography variant="caption" color="text.disabled">—</Typography>}
                    </TableCell>
                    <TableCell><Typography variant="caption" color="text.disabled">—</Typography></TableCell>
                    <TableCell><Typography variant="caption" color="text.disabled">—</Typography></TableCell>
                    <TableCell><Typography variant="caption" color="text.disabled">—</Typography></TableCell>
                    <TableCell>
                      <Chip label="External" size="small" sx={{ bgcolor: '#FAF8F3', color: '#B5AE9F', fontWeight: 700, fontSize: '0.7rem', height: 20, border: '1px solid #E8E4DC' }} />
                    </TableCell>
                    <TableCell padding="none">
                      <Tooltip title="Remove contact">
                        <IconButton size="small" color="error" onClick={() => void removeContact(c.id)}>
                          <DeleteOutlineIcon sx={{ fontSize: 15 }} />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                );
              })}

              {totalCount === 0 && (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 5, color: 'text.secondary' }}>No contacts in this segment</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          {pageCount > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 2, borderTop: '1px solid', borderColor: 'grey.100' }}>
              <Pagination count={pageCount} page={page} onChange={(_, v) => setPage(v)} size="small" color="primary" />
            </Box>
          )}
        </Card>
      </Box>

      {segment.type === 'smart' && (
        <EditRulesDialog
          open={editRulesOpen}
          segment={segment}
          allUsers={allUsers}
          onClose={() => setEditRulesOpen(false)}
          onSaved={() => { setEditRulesOpen(false); void load(); }}
        />
      )}

      {segment.type === 'manual' && (
        <AddMembersDialog
          open={addMembersOpen}
          segmentId={segment.id}
          existingIds={existingIds}
          allUsers={allUsers}
          onClose={() => setAddMembersOpen(false)}
          onSaved={() => { setAddMembersOpen(false); void load(); }}
        />
      )}

      <Dialog open={deleteConfirm} onClose={() => setDeleteConfirm(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Delete Segment</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Delete <strong>{segment.name}</strong>? This cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirm(false)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={deleteSegment} disabled={deleting}>Delete</Button>
        </DialogActions>
      </Dialog>
    </AdminLayout>
  );
}
