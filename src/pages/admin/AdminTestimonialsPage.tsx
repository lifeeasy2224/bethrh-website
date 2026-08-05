import { useState, useEffect, useCallback } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import Switch from '@mui/material/Switch';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import LinearProgress from '@mui/material/LinearProgress';
import Table from '@mui/material/Table';
import TableHead from '@mui/material/TableHead';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';
import Tooltip from '@mui/material/Tooltip';
import AddIcon from '@mui/icons-material/Add';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import FormatQuoteOutlinedIcon from '@mui/icons-material/FormatQuoteOutlined';
import AdminLayout from '../../components/AdminLayout';
import { adminDb } from '../../lib/adminDb';
import { useAdminAuth } from '../../contexts/AdminAuthContext';

interface Testimonial {
  id: string;
  quote: string;
  display_name: string;
  role: string;
  city: string | null;
  avatar_url: string | null;
  is_published: boolean;
  sort_order: number;
  created_at: string;
}

interface FormState {
  quote: string;
  display_name: string;
  role: string;
  city: string;
  avatar_url: string;
  is_published: boolean;
  sort_order: number;
}

const EMPTY_FORM: FormState = {
  quote: '', display_name: '', role: '', city: '', avatar_url: '', is_published: false, sort_order: 0,
};

export default function AdminTestimonialsPage() {
  const { sessionToken } = useAdminAuth();
  const [items, setItems] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState<'create' | 'edit' | 'delete' | null>(null);
  const [selected, setSelected] = useState<Testimonial | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!sessionToken) return;
    setLoading(true);
    const { data } = await adminDb(sessionToken, 'testimonials')
      .select('*', { order: { column: 'sort_order', ascending: true } });
    setItems((data ?? []) as Testimonial[]);
    setLoading(false);
  }, [sessionToken]);

  useEffect(() => { void load(); }, [load]);

  function openCreate() {
    // Default the new testimonial to the end of the current order.
    const nextOrder = items.length ? Math.max(...items.map(i => i.sort_order)) + 1 : 0;
    setForm({ ...EMPTY_FORM, sort_order: nextOrder });
    setSelected(null);
    setDialog('create');
  }

  function openEdit(t: Testimonial) {
    setForm({
      quote: t.quote,
      display_name: t.display_name,
      role: t.role,
      city: t.city ?? '',
      avatar_url: t.avatar_url ?? '',
      is_published: t.is_published,
      sort_order: t.sort_order,
    });
    setSelected(t);
    setDialog('edit');
  }

  function openDelete(t: Testimonial) {
    setSelected(t);
    setDialog('delete');
  }

  const canSave = form.quote.trim() && form.display_name.trim() && form.role.trim();

  async function handleSave() {
    if (!canSave || !sessionToken) return;
    setSaving(true);
    const payload = {
      quote: form.quote.trim(),
      display_name: form.display_name.trim(),
      role: form.role.trim(),
      city: form.city.trim() || null,
      avatar_url: form.avatar_url.trim() || null,
      is_published: form.is_published,
      sort_order: form.sort_order,
      updated_at: new Date().toISOString(),
    };
    if (dialog === 'create') {
      await adminDb(sessionToken, 'testimonials').insert(payload);
    } else if (dialog === 'edit' && selected) {
      await adminDb(sessionToken, 'testimonials').update(payload, { id: selected.id });
    }
    setSaving(false);
    setDialog(null);
    void load();
  }

  async function handleDelete() {
    if (!selected || !sessionToken) return;
    setSaving(true);
    await adminDb(sessionToken, 'testimonials').delete({ id: selected.id });
    setSaving(false);
    setDialog(null);
    setSelected(null);
    void load();
  }

  async function togglePublish(t: Testimonial) {
    if (!sessionToken) return;
    // Optimistic flip, then persist.
    setItems(prev => prev.map(i => i.id === t.id ? { ...i, is_published: !i.is_published } : i));
    await adminDb(sessionToken, 'testimonials').update(
      { is_published: !t.is_published, updated_at: new Date().toISOString() },
      { id: t.id },
    );
    void load();
  }

  // Swap sort_order with the adjacent row (in the currently-sorted list).
  async function move(t: Testimonial, dir: -1 | 1) {
    if (!sessionToken) return;
    const idx = items.findIndex(i => i.id === t.id);
    const swapIdx = idx + dir;
    if (swapIdx < 0 || swapIdx >= items.length) return;
    const other = items[swapIdx];
    await Promise.all([
      adminDb(sessionToken, 'testimonials').update({ sort_order: other.sort_order }, { id: t.id }),
      adminDb(sessionToken, 'testimonials').update({ sort_order: t.sort_order }, { id: other.id }),
    ]);
    void load();
  }

  const publishedCount = items.filter(i => i.is_published).length;

  return (
    <AdminLayout>
      <Box sx={{ p: 3, bgcolor: '#FAF8F3', minHeight: '100vh' }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 3 }}>
          <Box>
            <Typography variant="h5" fontWeight={800}>Testimonials</Typography>
            <Typography variant="body2" color="text.secondary">
              Real, curated quotes shown on the public homepage. Only published testimonials appear on the site.
            </Typography>
          </Box>
          <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
            New Testimonial
          </Button>
        </Stack>

        {loading && <LinearProgress sx={{ mb: 2, borderRadius: 1 }} />}

        <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 2 }}>
          <Chip
            icon={<FormatQuoteOutlinedIcon sx={{ fontSize: 15 }} />}
            label={`${items.length} total`}
            size="small"
            sx={{ bgcolor: '#F0F5F1', color: '#1B6B3E', fontWeight: 700 }}
          />
          <Chip
            label={`${publishedCount} published`}
            size="small"
            sx={{ bgcolor: '#F0F5F1', color: '#2A8A52', fontWeight: 700 }}
          />
        </Stack>

        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'grey.200' }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#FAF8F3' }}>
                {['Order', 'Quote', 'Name', 'Role', 'City', 'Published', ''].map(col => (
                  <TableCell key={col} sx={{ fontWeight: 700, fontSize: '0.75rem', color: '#8A8070' }}>{col}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((t, idx) => (
                <TableRow key={t.id} sx={{ '&:last-child td': { border: 0 } }}>
                  <TableCell>
                    <Stack direction="row" spacing={0.25} alignItems="center">
                      <Typography variant="body2" fontWeight={700} sx={{ width: 20 }}>{t.sort_order}</Typography>
                      <Stack>
                        <IconButton size="small" disabled={idx === 0} onClick={() => move(t, -1)} sx={{ p: 0.25 }}>
                          <ArrowUpwardIcon sx={{ fontSize: 14 }} />
                        </IconButton>
                        <IconButton size="small" disabled={idx === items.length - 1} onClick={() => move(t, 1)} sx={{ p: 0.25 }}>
                          <ArrowDownwardIcon sx={{ fontSize: 14 }} />
                        </IconButton>
                      </Stack>
                    </Stack>
                  </TableCell>
                  <TableCell sx={{ maxWidth: 340 }}>
                    <Typography variant="body2" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                      {t.quote}
                    </Typography>
                  </TableCell>
                  <TableCell><Typography variant="body2" fontWeight={600}>{t.display_name}</Typography></TableCell>
                  <TableCell><Typography variant="body2" color="text.secondary">{t.role}</Typography></TableCell>
                  <TableCell><Typography variant="body2" color="text.secondary">{t.city ?? '—'}</Typography></TableCell>
                  <TableCell>
                    <Tooltip title={t.is_published ? 'Published — visible on homepage' : 'Draft — hidden'}>
                      <Switch checked={t.is_published} onChange={() => togglePublish(t)} size="small" />
                    </Tooltip>
                  </TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                      <Tooltip title="Edit">
                        <IconButton size="small" onClick={() => openEdit(t)}>
                          <EditOutlinedIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton size="small" color="error" onClick={() => openDelete(t)}>
                          <DeleteOutlineIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
              {!loading && items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 5, color: 'text.secondary' }}>
                    No testimonials yet. Add real founder quotes above — the homepage stays on its honest placeholder until one is published.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      </Box>

      {/* Create / Edit Dialog */}
      <Dialog open={dialog === 'create' || dialog === 'edit'} onClose={() => setDialog(null)} maxWidth="sm" fullWidth>
        <DialogTitle>{dialog === 'create' ? 'New Testimonial' : 'Edit Testimonial'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Quote"
              size="small"
              fullWidth
              multiline
              minRows={3}
              value={form.quote}
              onChange={e => setForm(f => ({ ...f, quote: e.target.value }))}
              placeholder="The founder's own words…"
            />
            <Stack direction="row" spacing={2}>
              <TextField
                label="Display Name"
                size="small"
                fullWidth
                value={form.display_name}
                onChange={e => setForm(f => ({ ...f, display_name: e.target.value }))}
                placeholder="e.g. أحمد محمد"
              />
              <TextField
                label="Role"
                size="small"
                fullWidth
                value={form.role}
                onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                placeholder="e.g. مؤسس"
              />
            </Stack>
            <Stack direction="row" spacing={2}>
              <TextField
                label="City (optional)"
                size="small"
                fullWidth
                value={form.city}
                onChange={e => setForm(f => ({ ...f, city: e.target.value }))}
                placeholder="e.g. الرياض"
              />
              <TextField
                label="Sort Order"
                size="small"
                type="number"
                sx={{ width: 140 }}
                value={form.sort_order}
                onChange={e => setForm(f => ({ ...f, sort_order: Number(e.target.value) || 0 }))}
              />
            </Stack>
            <TextField
              label="Avatar URL (optional)"
              size="small"
              fullWidth
              value={form.avatar_url}
              onChange={e => setForm(f => ({ ...f, avatar_url: e.target.value }))}
              placeholder="https://…"
            />
            <Stack direction="row" alignItems="center" spacing={1}>
              <Switch
                checked={form.is_published}
                onChange={e => setForm(f => ({ ...f, is_published: e.target.checked }))}
              />
              <Typography variant="body2">
                {form.is_published ? 'Published (visible on homepage)' : 'Draft (hidden)'}
              </Typography>
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialog(null)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={!canSave || saving}>
            {dialog === 'create' ? 'Create' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={dialog === 'delete'} onClose={() => setDialog(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Delete Testimonial</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Delete the testimonial from <strong>{selected?.display_name}</strong>? This cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialog(null)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDelete} disabled={saving}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </AdminLayout>
  );
}
