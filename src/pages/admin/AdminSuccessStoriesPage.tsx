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
import EmojiEventsOutlinedIcon from '@mui/icons-material/EmojiEventsOutlined';
import StarIcon from '@mui/icons-material/Star';
import AdminLayout from '../../components/AdminLayout';
import { adminDb } from '../../lib/adminDb';
import { useAdminAuth } from '../../contexts/AdminAuthContext';

interface SuccessStory {
  id: string;
  name: string;
  idea: string;
  category: string | null;
  days_to_first_dollar: number | null;
  quote: string | null;
  role: string | null;
  is_featured: boolean;
  is_published: boolean;
  sort_order: number;
  created_at: string;
}

interface FormState {
  name: string;
  idea: string;
  category: string;
  days_to_first_dollar: string;
  quote: string;
  role: string;
  is_featured: boolean;
  is_published: boolean;
  sort_order: number;
}

const EMPTY_FORM: FormState = {
  name: '', idea: '', category: '', days_to_first_dollar: '', quote: '', role: '',
  is_featured: false, is_published: false, sort_order: 0,
};

export default function AdminSuccessStoriesPage() {
  const { sessionToken } = useAdminAuth();
  const [items, setItems] = useState<SuccessStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState<'create' | 'edit' | 'delete' | null>(null);
  const [selected, setSelected] = useState<SuccessStory | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!sessionToken) return;
    setLoading(true);
    const { data } = await adminDb(sessionToken, 'success_stories')
      .select('*', { order: { column: 'sort_order', ascending: true } });
    setItems((data ?? []) as SuccessStory[]);
    setLoading(false);
  }, [sessionToken]);

  useEffect(() => { void load(); }, [load]);

  function openCreate() {
    // Default the new story to the end of the current order.
    const nextOrder = items.length ? Math.max(...items.map(i => i.sort_order)) + 1 : 0;
    setForm({ ...EMPTY_FORM, sort_order: nextOrder });
    setSelected(null);
    setDialog('create');
  }

  function openEdit(s: SuccessStory) {
    setForm({
      name: s.name,
      idea: s.idea,
      category: s.category ?? '',
      days_to_first_dollar: s.days_to_first_dollar != null ? String(s.days_to_first_dollar) : '',
      quote: s.quote ?? '',
      role: s.role ?? '',
      is_featured: s.is_featured,
      is_published: s.is_published,
      sort_order: s.sort_order,
    });
    setSelected(s);
    setDialog('edit');
  }

  function openDelete(s: SuccessStory) {
    setSelected(s);
    setDialog('delete');
  }

  const canSave = form.name.trim() && form.idea.trim();

  async function handleSave() {
    if (!canSave || !sessionToken) return;
    setSaving(true);
    const days = form.days_to_first_dollar.trim();
    const payload = {
      name: form.name.trim(),
      idea: form.idea.trim(),
      category: form.category.trim() || null,
      days_to_first_dollar: days ? Number(days) : null,
      quote: form.quote.trim() || null,
      role: form.role.trim() || null,
      is_featured: form.is_featured,
      is_published: form.is_published,
      sort_order: form.sort_order,
      updated_at: new Date().toISOString(),
    };
    if (dialog === 'create') {
      await adminDb(sessionToken, 'success_stories').insert(payload);
    } else if (dialog === 'edit' && selected) {
      await adminDb(sessionToken, 'success_stories').update(payload, { id: selected.id });
    }
    setSaving(false);
    setDialog(null);
    void load();
  }

  async function handleDelete() {
    if (!selected || !sessionToken) return;
    setSaving(true);
    await adminDb(sessionToken, 'success_stories').delete({ id: selected.id });
    setSaving(false);
    setDialog(null);
    setSelected(null);
    void load();
  }

  async function togglePublish(s: SuccessStory) {
    if (!sessionToken) return;
    // Optimistic flip, then persist.
    setItems(prev => prev.map(i => i.id === s.id ? { ...i, is_published: !i.is_published } : i));
    await adminDb(sessionToken, 'success_stories').update(
      { is_published: !s.is_published, updated_at: new Date().toISOString() },
      { id: s.id },
    );
    void load();
  }

  async function toggleFeatured(s: SuccessStory) {
    if (!sessionToken) return;
    setItems(prev => prev.map(i => i.id === s.id ? { ...i, is_featured: !i.is_featured } : i));
    await adminDb(sessionToken, 'success_stories').update(
      { is_featured: !s.is_featured, updated_at: new Date().toISOString() },
      { id: s.id },
    );
    void load();
  }

  // Swap sort_order with the adjacent row (in the currently-sorted list).
  async function move(s: SuccessStory, dir: -1 | 1) {
    if (!sessionToken) return;
    const idx = items.findIndex(i => i.id === s.id);
    const swapIdx = idx + dir;
    if (swapIdx < 0 || swapIdx >= items.length) return;
    const other = items[swapIdx];
    await Promise.all([
      adminDb(sessionToken, 'success_stories').update({ sort_order: other.sort_order }, { id: s.id }),
      adminDb(sessionToken, 'success_stories').update({ sort_order: s.sort_order }, { id: other.id }),
    ]);
    void load();
  }

  const publishedCount = items.filter(i => i.is_published).length;

  return (
    <AdminLayout>
      <Box sx={{ p: 3, bgcolor: '#FAF8F3', minHeight: '100vh' }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 3 }}>
          <Box>
            <Typography variant="h5" fontWeight={800}>قصص النجاح — لوحة الشرف</Typography>
            <Typography variant="body2" color="text.secondary">
              قصص حقيقية موثّقة تظهر على صفحة «لوحة شرف أول دولار» العامة. تظهر فقط القصص المنشورة، وكل الأرقام (العدد، متوسط الأيام) تُحسب من القصص الحقيقية فقط — بلا أرقام مُختلقة.
            </Typography>
          </Box>
          <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
            قصة جديدة
          </Button>
        </Stack>

        {loading && <LinearProgress sx={{ mb: 2, borderRadius: 1 }} />}

        <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 2 }}>
          <Chip
            icon={<EmojiEventsOutlinedIcon sx={{ fontSize: 15 }} />}
            label={`${items.length} إجمالي`}
            size="small"
            sx={{ bgcolor: '#F0F5F1', color: '#1B6B3E', fontWeight: 700 }}
          />
          <Chip
            label={`${publishedCount} منشورة`}
            size="small"
            sx={{ bgcolor: '#F0F5F1', color: '#2A8A52', fontWeight: 700 }}
          />
        </Stack>

        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'grey.200' }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#FAF8F3' }}>
                {['الترتيب', 'الاسم', 'الفكرة', 'الفئة', 'أيام', 'مميّزة', 'منشورة', ''].map(col => (
                  <TableCell key={col} sx={{ fontWeight: 700, fontSize: '0.75rem', color: '#8A8070' }}>{col}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {items.map((s, idx) => (
                <TableRow key={s.id} sx={{ '&:last-child td': { border: 0 } }}>
                  <TableCell>
                    <Stack direction="row" spacing={0.25} alignItems="center">
                      <Typography variant="body2" fontWeight={700} sx={{ width: 20 }}>{s.sort_order}</Typography>
                      <Stack>
                        <IconButton size="small" disabled={idx === 0} onClick={() => move(s, -1)} sx={{ p: 0.25 }}>
                          <ArrowUpwardIcon sx={{ fontSize: 14 }} />
                        </IconButton>
                        <IconButton size="small" disabled={idx === items.length - 1} onClick={() => move(s, 1)} sx={{ p: 0.25 }}>
                          <ArrowDownwardIcon sx={{ fontSize: 14 }} />
                        </IconButton>
                      </Stack>
                    </Stack>
                  </TableCell>
                  <TableCell><Typography variant="body2" fontWeight={600}>{s.name}</Typography></TableCell>
                  <TableCell sx={{ maxWidth: 280 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                      {s.idea}
                    </Typography>
                  </TableCell>
                  <TableCell><Typography variant="body2" color="text.secondary">{s.category ?? '—'}</Typography></TableCell>
                  <TableCell><Typography variant="body2" color="text.secondary">{s.days_to_first_dollar ?? '—'}</Typography></TableCell>
                  <TableCell>
                    <Tooltip title={s.is_featured ? 'قصة مميّزة — تظهر في الأعلى' : 'ليست مميّزة'}>
                      <IconButton size="small" onClick={() => toggleFeatured(s)}>
                        <StarIcon sx={{ fontSize: 18, color: s.is_featured ? '#D4A653' : 'action.disabled' }} />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                  <TableCell>
                    <Tooltip title={s.is_published ? 'منشورة — مرئية على الموقع' : 'مسوّدة — مخفية'}>
                      <Switch checked={s.is_published} onChange={() => togglePublish(s)} size="small" />
                    </Tooltip>
                  </TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                      <Tooltip title="تعديل">
                        <IconButton size="small" onClick={() => openEdit(s)}>
                          <EditOutlinedIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="حذف">
                        <IconButton size="small" color="error" onClick={() => openDelete(s)}>
                          <DeleteOutlineIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
              {!loading && items.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 5, color: 'text.secondary' }}>
                    لا توجد قصص نجاح بعد. أضف قصة حقيقية — تبقى صفحة لوحة الشرف على حالتها الصادقة الفارغة حتى تُنشر قصة.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      </Box>

      {/* Create / Edit Dialog */}
      <Dialog open={dialog === 'create' || dialog === 'edit'} onClose={() => setDialog(null)} maxWidth="sm" fullWidth>
        <DialogTitle>{dialog === 'create' ? 'قصة نجاح جديدة' : 'تعديل قصة النجاح'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Stack direction="row" spacing={2}>
              <TextField
                label="الاسم"
                size="small"
                fullWidth
                required
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="e.g. أحمد محمد"
              />
              <TextField
                label="الدور"
                size="small"
                fullWidth
                value={form.role}
                onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                placeholder="e.g. مؤسس"
              />
            </Stack>
            <TextField
              label="الفكرة"
              size="small"
              fullWidth
              required
              value={form.idea}
              onChange={e => setForm(f => ({ ...f, idea: e.target.value }))}
              placeholder="وصف موجز للفكرة أو المشروع"
            />
            <Stack direction="row" spacing={2}>
              <TextField
                label="الفئة (اختياري)"
                size="small"
                fullWidth
                value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                placeholder="e.g. مشروع جانبي"
              />
              <TextField
                label="أيام حتى أول دولار"
                size="small"
                type="number"
                sx={{ width: 200 }}
                value={form.days_to_first_dollar}
                onChange={e => setForm(f => ({ ...f, days_to_first_dollar: e.target.value }))}
                placeholder="اختياري"
              />
            </Stack>
            <TextField
              label="الاقتباس (اختياري)"
              size="small"
              fullWidth
              multiline
              minRows={3}
              value={form.quote}
              onChange={e => setForm(f => ({ ...f, quote: e.target.value }))}
              placeholder="كلمات الرائد بنفسه…"
            />
            <TextField
              label="الترتيب"
              size="small"
              type="number"
              sx={{ width: 140 }}
              value={form.sort_order}
              onChange={e => setForm(f => ({ ...f, sort_order: Number(e.target.value) || 0 }))}
            />
            <Stack direction="row" alignItems="center" spacing={1}>
              <Switch
                checked={form.is_featured}
                onChange={e => setForm(f => ({ ...f, is_featured: e.target.checked }))}
              />
              <Typography variant="body2">
                {form.is_featured ? 'قصة مميّزة (تظهر في أعلى الصفحة)' : 'قصة عادية'}
              </Typography>
            </Stack>
            <Stack direction="row" alignItems="center" spacing={1}>
              <Switch
                checked={form.is_published}
                onChange={e => setForm(f => ({ ...f, is_published: e.target.checked }))}
              />
              <Typography variant="body2">
                {form.is_published ? 'منشورة (مرئية على الموقع)' : 'مسوّدة (مخفية)'}
              </Typography>
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialog(null)}>إلغاء</Button>
          <Button variant="contained" onClick={handleSave} disabled={!canSave || saving}>
            {dialog === 'create' ? 'إنشاء' : 'حفظ التغييرات'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={dialog === 'delete'} onClose={() => setDialog(null)} maxWidth="xs" fullWidth>
        <DialogTitle>حذف قصة النجاح</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            حذف قصة <strong>{selected?.name}</strong>؟ لا يمكن التراجع عن هذا الإجراء.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialog(null)}>إلغاء</Button>
          <Button variant="contained" color="error" onClick={handleDelete} disabled={saving}>
            حذف
          </Button>
        </DialogActions>
      </Dialog>
    </AdminLayout>
  );
}
