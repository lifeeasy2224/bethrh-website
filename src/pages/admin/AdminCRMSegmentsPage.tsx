import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
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
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import LinearProgress from '@mui/material/LinearProgress';
import Avatar from '@mui/material/Avatar';
import Tooltip from '@mui/material/Tooltip';
import InputAdornment from '@mui/material/InputAdornment';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import ListAltIcon from '@mui/icons-material/ListAlt';
import SearchIcon from '@mui/icons-material/Search';
import CloseIcon from '@mui/icons-material/Close';
import AdminLayout from '../../components/AdminLayout';
import { adminDb } from '../../lib/adminDb';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import {
  type Segment, type SegmentRule, type EnrichedUser, type FieldDef,
  FIELD_DEFS, applyRules,
} from './crmSegmentEngine';

interface SegmentWithCount extends Segment {
  liveCount?: number;
}

function initials(name: string | null): string {
  if (!name) return '?';
  return name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2);
}

// ─── Rule Row ────────────────────────────────────────────────────────────────

function RuleRow({
  rule, index, onChange, onRemove,
}: {
  rule: SegmentRule;
  index: number;
  onChange: (idx: number, r: SegmentRule) => void;
  onRemove: (idx: number) => void;
}) {
  const fieldDef = FIELD_DEFS.find(f => f.field === rule.field) ?? FIELD_DEFS[0];
  const operatorDef = fieldDef.operators.find(o => o.value === rule.operator) ?? fieldDef.operators[0];

  return (
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ sm: 'center' }}>
      {/* Field */}
      <FormControl size="small" sx={{ minWidth: 160 }}>
        <InputLabel>Field</InputLabel>
        <Select
          label="Field"
          value={rule.field}
          onChange={e => {
            const newField = FIELD_DEFS.find(f => f.field === e.target.value) ?? FIELD_DEFS[0];
            onChange(index, {
              field: e.target.value,
              operator: newField.operators[0].value,
              value: newField.type === 'number' || newField.type === 'days' ? 0 : (newField.options?.[0]?.value ?? ''),
            });
          }}
        >
          {Object.entries(
            FIELD_DEFS.reduce<Record<string, FieldDef[]>>((acc, f) => {
              if (!acc[f.category]) acc[f.category] = [];
              acc[f.category].push(f);
              return acc;
            }, {})
          ).map(([cat, fields]) => [
            <MenuItem key={`cat-${cat}`} disabled sx={{ fontSize: '0.7rem', fontWeight: 800, color: '#8A8070', textTransform: 'uppercase' }}>
              {cat}
            </MenuItem>,
            ...fields.map(f => (
              <MenuItem key={f.field} value={f.field} sx={{ pl: 3 }}>{f.label}</MenuItem>
            )),
          ])}
        </Select>
      </FormControl>

      {/* Operator */}
      <FormControl size="small" sx={{ minWidth: 150 }}>
        <InputLabel>Condition</InputLabel>
        <Select
          label="Condition"
          value={rule.operator}
          onChange={e => onChange(index, { ...rule, operator: e.target.value })}
        >
          {fieldDef.operators.map(op => (
            <MenuItem key={op.value} value={op.value}>{op.label}</MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Value */}
      {(fieldDef.type === 'number' || fieldDef.type === 'days') ? (
        <TextField
          size="small"
          type="number"
          label={fieldDef.type === 'days' ? 'Days' : 'Value'}
          value={rule.value as number}
          onChange={e => onChange(index, { ...rule, value: Number(e.target.value) })}
          sx={{ width: 100 }}
          slotProps={{ htmlInput: { min: 0 } }}
        />
      ) : fieldDef.type === 'select' ? (
        <FormControl size="small" sx={{ minWidth: 140 }}>
          <InputLabel>Value</InputLabel>
          <Select
            label="Value"
            value={rule.value as string}
            onChange={e => onChange(index, { ...rule, value: e.target.value })}
          >
            {fieldDef.options?.map(opt => (
              <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
            ))}
          </Select>
        </FormControl>
      ) : null}

      {/* Label hint for days */}
      {fieldDef.type === 'days' && (
        <Typography variant="caption" color="text.secondary">
          {operatorDef.label.replace('X', String(rule.value))}
        </Typography>
      )}

      <IconButton size="small" onClick={() => onRemove(index)} color="error" sx={{ ml: 'auto !important' }}>
        <CloseIcon sx={{ fontSize: 16 }} />
      </IconButton>
    </Stack>
  );
}

// ─── Create Smart Segment Dialog ─────────────────────────────────────────────

function SmartSegmentDialog({
  open,
  onClose,
  onSaved,
  allUsers,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  allUsers: EnrichedUser[];
}) {
  const { sessionToken } = useAdminAuth();
  const [name, setName] = useState('');
  const [rules, setRules] = useState<SegmentRule[]>([]);
  const [logic] = useState<'AND' | 'OR'>('AND');
  const [saving, setSaving] = useState(false);

  const preview = applyRules(allUsers, rules, logic);

  function addRule() {
    setRules(r => [...r, { field: FIELD_DEFS[0].field, operator: FIELD_DEFS[0].operators[0].value, value: FIELD_DEFS[0].options?.[0]?.value ?? '' }]);
  }

  function updateRule(idx: number, rule: SegmentRule) {
    setRules(r => r.map((x, i) => i === idx ? rule : x));
  }

  function removeRule(idx: number) {
    setRules(r => r.filter((_, i) => i !== idx));
  }

  async function save() {
    if (!name.trim() || !sessionToken) return;
    setSaving(true);
    await adminDb(sessionToken, 'marketing_segments').insert({
      name: name.trim(),
      type: 'smart',
      rules: rules,
      user_count: preview.length,
    });
    setSaving(false);
    setName('');
    setRules([]);
    onSaved();
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Stack direction="row" alignItems="center" spacing={1}>
          <AutoAwesomeIcon sx={{ color: '#1B6B3E' }} />
          <Typography fontWeight={700}>Create Smart Segment</Typography>
        </Stack>
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} sx={{ mt: 1 }}>
          <TextField
            label="Segment Name"
            size="small"
            fullWidth
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Founders Ready to Upgrade"
          />

          <Box>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
              <Typography variant="subtitle2" fontWeight={700}>Rules (ALL must match)</Typography>
              <Button size="small" startIcon={<AddIcon />} onClick={addRule} variant="outlined" sx={{ fontSize: '0.75rem' }}>
                Add Rule
              </Button>
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
                    {i > 0 && (
                      <Typography variant="caption" sx={{ color: '#1B6B3E', fontWeight: 700, display: 'block', mb: 1.5, pl: 0.5 }}>
                        AND
                      </Typography>
                    )}
                    <RuleRow rule={rule} index={i} onChange={updateRule} onRemove={removeRule} />
                  </Box>
                ))}
              </Stack>
            )}
          </Box>

          {/* Preview */}
          <Box sx={{ p: 2, bgcolor: '#FAF8F3', borderRadius: 2, border: '1px solid', borderColor: 'grey.200' }}>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
              <Typography variant="subtitle2" fontWeight={700}>Preview</Typography>
              <Chip
                label={`${preview.length} user${preview.length !== 1 ? 's' : ''} match`}
                size="small"
                sx={{ bgcolor: '#F0F5F1', color: '#1B6B3E', fontWeight: 700 }}
              />
            </Stack>
            {preview.length > 0 && (
              <Stack direction="row" spacing={1} flexWrap="wrap">
                {preview.slice(0, 5).map(u => (
                  <Stack key={u.user_id} direction="row" spacing={0.5} alignItems="center">
                    <Avatar sx={{ width: 20, height: 20, bgcolor: '#1B6B3E', fontSize: '0.6rem' }}>
                      {initials(u.full_name)}
                    </Avatar>
                    <Typography variant="caption">{u.full_name ?? 'Unknown'}</Typography>
                  </Stack>
                ))}
                {preview.length > 5 && (
                  <Typography variant="caption" color="text.secondary">+{preview.length - 5} more</Typography>
                )}
              </Stack>
            )}
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={save} disabled={!name.trim() || saving}>
          Save Segment
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── Create Manual Segment Dialog ────────────────────────────────────────────

function ManualSegmentDialog({
  open,
  onClose,
  onSaved,
  allUsers,
}: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  allUsers: EnrichedUser[];
}) {
  const { sessionToken } = useAdminAuth();
  const [name, setName] = useState('');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<EnrichedUser[]>([]);
  const [saving, setSaving] = useState(false);

  const filtered = search
    ? allUsers.filter(u =>
        (u.full_name ?? '').toLowerCase().includes(search.toLowerCase()) &&
        !selected.some(s => s.user_id === u.user_id)
      ).slice(0, 8)
    : [];

  function addUser(u: EnrichedUser) {
    setSelected(prev => [...prev, u]);
    setSearch('');
  }

  function removeUser(userId: string) {
    setSelected(prev => prev.filter(u => u.user_id !== userId));
  }

  async function save() {
    if (!name.trim() || !sessionToken) return;
    setSaving(true);
    const { data: seg } = await adminDb(sessionToken, 'marketing_segments').insert({
      name: name.trim(),
      type: 'manual',
      rules: [],
      user_count: selected.length,
    }, { single: true });

    if (seg && selected.length > 0) {
      await adminDb(sessionToken, 'segment_members').insert(
        selected.map(u => ({ segment_id: seg.id, user_id: u.user_id }))
      );
    }
    setSaving(false);
    setName('');
    setSelected([]);
    setSearch('');
    onSaved();
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Stack direction="row" alignItems="center" spacing={1}>
          <ListAltIcon sx={{ color: '#1B6B3E' }} />
          <Typography fontWeight={700}>Create Manual Segment</Typography>
        </Stack>
      </DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField
            label="Segment Name"
            size="small"
            fullWidth
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. VIP Invite List"
          />

          <Box>
            <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>Add Users</Typography>
            <TextField
              size="small"
              fullWidth
              placeholder="Search by name or email…"
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
            {filtered.length > 0 && (
              <Box sx={{ mt: 0.5, border: '1px solid', borderColor: 'grey.200', borderRadius: 1, overflow: 'hidden' }}>
                {filtered.map(u => (
                  <Box
                    key={u.user_id}
                    onClick={() => addUser(u)}
                    sx={{ px: 1.5, py: 0.75, cursor: 'pointer', '&:hover': { bgcolor: '#FAF8F3' }, display: 'flex', alignItems: 'center', gap: 1, borderBottom: '1px solid', borderColor: 'grey.100', '&:last-child': { borderBottom: 0 } }}
                  >
                    <Avatar sx={{ width: 24, height: 24, bgcolor: '#1B6B3E', fontSize: '0.65rem' }}>
                      {initials(u.full_name)}
                    </Avatar>
                    <Box>
                      <Typography variant="body2" fontWeight={600}>{u.full_name ?? '—'}</Typography>
                      <Typography variant="caption" color="text.secondary">{u.role} · {u.tier ?? 'free'}</Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            )}
          </Box>

          {selected.length > 0 && (
            <Box>
              <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ display: 'block', mb: 0.75 }}>
                SELECTED ({selected.length})
              </Typography>
              <Stack direction="row" flexWrap="wrap" gap={0.75}>
                {selected.map(u => (
                  <Chip
                    key={u.user_id}
                    label={u.full_name ?? '—'}
                    size="small"
                    onDelete={() => removeUser(u.user_id)}
                    avatar={<Avatar sx={{ bgcolor: '#1B6B3E !important', fontSize: '0.55rem !important' }}>{initials(u.full_name)}</Avatar>}
                  />
                ))}
              </Stack>
            </Box>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={save} disabled={!name.trim() || saving}>
          Create Segment
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminCRMSegmentsPage() {
  const navigate = useNavigate();
  const { sessionToken } = useAdminAuth();
  const [segments, setSegments] = useState<SegmentWithCount[]>([]);
  const [allUsers, setAllUsers] = useState<EnrichedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [smartDialog, setSmartDialog] = useState(false);
  const [manualDialog, setManualDialog] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const load = useCallback(async () => {
    if (!sessionToken) return;
    setLoading(true);
    const [{ data: segsData }, { data: profilesData }, { data: ideasCountData }] = await Promise.all([
      adminDb(sessionToken, 'marketing_segments').select('*', { order: { column: 'created_at' } }),
      adminDb(sessionToken, 'profiles').select('user_id, full_name, role, tier, lead_score, lifecycle_stage, user_status, last_login_at, created_at, login_count, iq_score'),
      adminDb(sessionToken, 'user_ideas').select('user_id'),
    ]);

    const ideasCountMap: Record<string, number> = {};
    (ideasCountData ?? []).forEach((r: { user_id: string }) => {
      ideasCountMap[r.user_id] = (ideasCountMap[r.user_id] ?? 0) + 1;
    });

    const users: EnrichedUser[] = (profilesData ?? []).map((p: Omit<EnrichedUser, 'ideas_count'>) => ({
      ...p,
      ideas_count: ideasCountMap[p.user_id] ?? 0,
      lead_score: p.lead_score ?? 0,
      login_count: p.login_count ?? 0,
    }));

    setAllUsers(users);

    const enrichedSegs: SegmentWithCount[] = (segsData ?? []).map((seg: Segment) => {
      const rules = (seg.rules ?? []) as SegmentRule[];
      const liveCount = seg.type === 'smart' ? applyRules(users, rules).length : (seg.user_count ?? 0);
      return { ...seg, rules, liveCount };
    });

    setSegments(enrichedSegs);
    setLoading(false);
  }, [sessionToken]);

  useEffect(() => { void load(); }, [load]);

  async function deleteSegment() {
    if (!deleteId || !sessionToken) return;
    setDeleting(true);
    await adminDb(sessionToken, 'marketing_segments').delete({ id: deleteId });
    setDeleteId(null);
    setDeleting(false);
    void load();
  }

  const smartCount = segments.filter(s => s.type === 'smart').length;
  const manualCount = segments.filter(s => s.type === 'manual').length;

  return (
    <AdminLayout>
      <Box sx={{ p: 3, bgcolor: '#FAF8F3', minHeight: '100vh' }}>
        {/* Header */}
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={2} sx={{ mb: 3 }}>
          <Box>
            <Typography variant="h5" fontWeight={800}>Segments</Typography>
            <Typography variant="body2" color="text.secondary">Group users by behavior, profile, or manual selection</Typography>
          </Box>
          <Stack direction="row" spacing={1}>
            <Button variant="outlined" startIcon={<ListAltIcon />} onClick={() => setManualDialog(true)}>
              Manual Segment
            </Button>
            <Button variant="contained" startIcon={<AutoAwesomeIcon />} onClick={() => setSmartDialog(true)}>
              Smart Segment
            </Button>
          </Stack>
        </Stack>

        {loading && <LinearProgress sx={{ mb: 2, borderRadius: 1 }} />}

        {/* Summary */}
        <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
          <Chip label={`${segments.length} total`} size="small" sx={{ bgcolor: '#F0F5F1', color: '#1B6B3E', fontWeight: 700 }} />
          <Chip icon={<AutoAwesomeIcon sx={{ fontSize: 14 }} />} label={`${smartCount} smart`} size="small" sx={{ bgcolor: '#DEEBE2', color: '#1B6B3E', fontWeight: 700 }} />
          <Chip icon={<ListAltIcon sx={{ fontSize: 14 }} />} label={`${manualCount} manual`} size="small" sx={{ bgcolor: '#DEEBE2', color: '#2A8A52', fontWeight: 700 }} />
        </Stack>

        {/* Table */}
        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'grey.200' }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#FAF8F3' }}>
                {['Segment Name', 'Type', 'Users', 'Rules', 'Actions'].map(col => (
                  <TableCell key={col} sx={{ fontWeight: 700, fontSize: '0.75rem', color: '#8A8070' }}>{col}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {segments.map(seg => (
                <TableRow
                  key={seg.id}
                  hover
                  sx={{ cursor: 'pointer', '&:last-child td': { border: 0 } }}
                  onClick={() => navigate(`/admin/crm/segments/${seg.id}`)}
                >
                  <TableCell>
                    <Typography variant="body2" fontWeight={700}>{seg.name}</Typography>
                  </TableCell>
                  <TableCell>
                    {seg.type === 'smart' ? (
                      <Chip
                        icon={<AutoAwesomeIcon sx={{ fontSize: 13 }} />}
                        label="Smart"
                        size="small"
                        sx={{ bgcolor: '#DEEBE2', color: '#1B6B3E', fontWeight: 700, fontSize: '0.7rem', height: 22 }}
                      />
                    ) : (
                      <Chip
                        icon={<ListAltIcon sx={{ fontSize: 13 }} />}
                        label="Manual"
                        size="small"
                        sx={{ bgcolor: '#DEEBE2', color: '#2A8A52', fontWeight: 700, fontSize: '0.7rem', height: 22 }}
                      />
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={700}>{seg.liveCount ?? seg.user_count}</Typography>
                  </TableCell>
                  <TableCell>
                    {seg.type === 'smart' && seg.rules.length > 0 ? (
                      <Stack direction="row" spacing={0.5} flexWrap="wrap" gap={0.5}>
                        {seg.rules.slice(0, 2).map((r, i) => {
                          const fd = FIELD_DEFS.find(f => f.field === r.field);
                          return (
                            <Chip
                              key={i}
                              label={`${fd?.label ?? r.field} ${r.operator} ${r.value}`}
                              size="small"
                              sx={{ height: 18, fontSize: '0.65rem', bgcolor: '#F7F3EC', color: '#554E41' }}
                            />
                          );
                        })}
                        {seg.rules.length > 2 && (
                          <Chip label={`+${seg.rules.length - 2}`} size="small" sx={{ height: 18, fontSize: '0.65rem' }} />
                        )}
                      </Stack>
                    ) : seg.type === 'smart' ? (
                      <Typography variant="caption" color="text.secondary">All users</Typography>
                    ) : (
                      <Typography variant="caption" color="text.secondary">Manual list</Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={0.25}>
                      <Tooltip title="View segment">
                        <IconButton size="small" onClick={e => { e.stopPropagation(); navigate(`/admin/crm/segments/${seg.id}`); }}>
                          <OpenInNewIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton size="small" color="error" onClick={e => { e.stopPropagation(); setDeleteId(seg.id); }}>
                          <DeleteOutlineIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
              {!loading && segments.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 5 }}>
                    <AutoAwesomeIcon sx={{ fontSize: 32, color: 'text.disabled', mb: 1, display: 'block', mx: 'auto' }} />
                    <Typography color="text.secondary">No segments yet. Create your first smart or manual segment.</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      </Box>

      <SmartSegmentDialog
        open={smartDialog}
        onClose={() => setSmartDialog(false)}
        onSaved={() => { setSmartDialog(false); void load(); }}
        allUsers={allUsers}
      />

      <ManualSegmentDialog
        open={manualDialog}
        onClose={() => setManualDialog(false)}
        onSaved={() => { setManualDialog(false); void load(); }}
        allUsers={allUsers}
      />

      {/* Delete confirmation */}
      <Dialog open={!!deleteId} onClose={() => setDeleteId(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Delete Segment</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            This segment and all its member associations will be permanently deleted.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteId(null)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={deleteSegment} disabled={deleting}>Delete</Button>
        </DialogActions>
      </Dialog>
    </AdminLayout>
  );
}
