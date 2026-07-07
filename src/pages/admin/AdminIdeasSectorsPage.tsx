import { useState, useEffect, useCallback } from 'react';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Chip from '@mui/material/Chip';
import Switch from '@mui/material/Switch';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import LinearProgress from '@mui/material/LinearProgress';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import AddIcon from '@mui/icons-material/Add';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import { adminDb } from '../../lib/adminDb';

interface Sector {
  id: string;
  name: string;
  emoji: string | null;
  sort_order: number | null;
  is_active: boolean;
}

type FormState = { name: string; emoji: string; sort_order: number; is_active: boolean };
const EMPTY: FormState = { name: '', emoji: '💡', sort_order: 0, is_active: true };

export default function AdminIdeasSectorsPage() {
  const { sessionToken } = useAdminAuth();
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialog, setDialog] = useState<'add' | 'edit' | 'delete' | null>(null);
  const [selected, setSelected] = useState<Sector | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY);
  const [toast, setToast] = useState<{ msg: string; sev: 'success' | 'error' } | null>(null);

  const load = useCallback(async () => {
    if (!sessionToken) return;
    setLoading(true);
    const { data, error } = await adminDb(sessionToken, 'sectors').select('*', {
      order: [{ column: 'sort_order', ascending: true }, { column: 'name', ascending: true }],
    });
    if (error) setToast({ msg: `Failed to load sectors: ${error}`, sev: 'error' });
    setSectors((data as Sector[]) ?? []);
    setLoading(false);
  }, [sessionToken]);

  useEffect(() => { load(); }, [load]);

  function openAdd() {
    setSelected(null);
    setForm({ ...EMPTY, sort_order: (sectors.at(-1)?.sort_order ?? sectors.length) + 1 });
    setDialog('add');
  }

  function openEdit(s: Sector) {
    setSelected(s);
    setForm({ name: s.name, emoji: s.emoji ?? '💡', sort_order: s.sort_order ?? 0, is_active: s.is_active });
    setDialog('edit');
  }

  async function save() {
    if (!sessionToken || !form.name.trim()) return;
    setSaving(true);
    const payload = {
      name: form.name.trim(),
      emoji: form.emoji.trim() || '💡',
      sort_order: Number(form.sort_order) || 0,
      is_active: form.is_active,
    };
    const { error } = dialog === 'edit' && selected
      ? await adminDb(sessionToken, 'sectors').update(payload, { id: selected.id })
      : await adminDb(sessionToken, 'sectors').insert(payload);
    setSaving(false);
    if (error) { setToast({ msg: error, sev: 'error' }); return; }
    setToast({ msg: dialog === 'edit' ? 'Sector updated.' : 'Sector added.', sev: 'success' });
    setDialog(null);
    await load();
  }

  async function toggleActive(s: Sector) {
    if (!sessionToken) return;
    const { error } = await adminDb(sessionToken, 'sectors').update({ is_active: !s.is_active }, { id: s.id });
    if (error) { setToast({ msg: error, sev: 'error' }); return; }
    await load();
  }

  async function remove() {
    if (!sessionToken || !selected) return;
    setSaving(true);
    const { error } = await adminDb(sessionToken, 'sectors').delete({ id: selected.id });
    setSaving(false);
    if (error) { setToast({ msg: error, sev: 'error' }); return; }
    setToast({ msg: 'Sector deleted.', sev: 'success' });
    setDialog(null);
    await load();
  }

  return (
    <Box sx={{ py: 4 }}>
      <Container maxWidth="xl">
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={3}>
          <Box>
            <Typography variant="h5" fontWeight={800} mb={0.5}>Sectors</Typography>
            <Typography color="text.secondary">
              Manage the sectors that power the sector picker when creating a Library idea.
            </Typography>
          </Box>
          <Button variant="contained" startIcon={<AddIcon />} onClick={openAdd}>Add Sector</Button>
        </Stack>

        <Card>
          {loading && <LinearProgress />}
          <Table>
            <TableHead>
              <TableRow>
                {['Emoji', 'Name', 'Order', 'Active', ''].map((c, i) => (
                  <TableCell key={c || i} sx={{ fontWeight: 700, fontSize: '0.75rem', color: '#8A8070' }} align={i === 4 ? 'right' : 'left'}>{c}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {sectors.map(s => (
                <TableRow key={s.id} hover>
                  <TableCell sx={{ fontSize: '1.25rem' }}>{s.emoji}</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>{s.name}</TableCell>
                  <TableCell>{s.sort_order}</TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Switch size="small" checked={s.is_active} onChange={() => toggleActive(s)} />
                      <Chip
                        label={s.is_active ? 'Active' : 'Hidden'}
                        size="small"
                        sx={{ bgcolor: s.is_active ? '#DEEBE2' : '#F7F3EC', color: s.is_active ? '#2A8A52' : '#8A8070' }}
                      />
                    </Stack>
                  </TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => openEdit(s)}><EditOutlinedIcon fontSize="small" /></IconButton>
                    <IconButton size="small" color="error" onClick={() => { setSelected(s); setDialog('delete'); }}><DeleteOutlineIcon fontSize="small" /></IconButton>
                  </TableCell>
                </TableRow>
              ))}
              {!loading && sectors.length === 0 && (
                <TableRow><TableCell colSpan={5} align="center" sx={{ py: 5, color: 'text.secondary' }}>No sectors yet. Add your first one.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      </Container>

      {/* Add / Edit dialog */}
      <Dialog open={dialog === 'add' || dialog === 'edit'} onClose={() => setDialog(null)} maxWidth="xs" fullWidth>
        <DialogTitle fontWeight={700}>{dialog === 'edit' ? 'Edit Sector' : 'Add Sector'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <TextField label="Name" size="small" fullWidth value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} autoFocus />
            <TextField label="Emoji" size="small" value={form.emoji} onChange={e => setForm(f => ({ ...f, emoji: e.target.value }))} sx={{ width: 120 }} helperText="Shown in pickers" />
            <TextField label="Sort order" size="small" type="number" value={form.sort_order} onChange={e => setForm(f => ({ ...f, sort_order: Number(e.target.value) }))} sx={{ width: 140 }} helperText="Lower shows first" />
            <Stack direction="row" alignItems="center" spacing={1}>
              <Switch checked={form.is_active} onChange={e => setForm(f => ({ ...f, is_active: e.target.checked }))} />
              <Typography variant="body2">{form.is_active ? 'Active (selectable)' : 'Hidden'}</Typography>
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialog(null)}>Cancel</Button>
          <Button variant="contained" onClick={save} disabled={saving || !form.name.trim()}>{saving ? 'Saving…' : 'Save'}</Button>
        </DialogActions>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={dialog === 'delete'} onClose={() => setDialog(null)} maxWidth="xs" fullWidth>
        <DialogTitle fontWeight={700}>Delete sector?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Delete <strong>{selected?.name}</strong>? Existing ideas keep their sector text, but it will
            no longer appear in the picker. Consider hiding it instead.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialog(null)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={remove} disabled={saving}>{saving ? 'Deleting…' : 'Delete'}</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={!!toast} autoHideDuration={4000} onClose={() => setToast(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={toast?.sev} variant="filled" onClose={() => setToast(null)}>{toast?.msg}</Alert>
      </Snackbar>
    </Box>
  );
}
