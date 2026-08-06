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
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ArticleOutlinedIcon from '@mui/icons-material/ArticleOutlined';
import AdminLayout from '../../components/AdminLayout';
import { adminDb } from '../../lib/adminDb';
import { useAdminAuth } from '../../contexts/AdminAuthContext';

interface Template {
  id: string;
  name: string;
  subject: string;
  preview_text: string | null;
  body_html: string;
  category: string;
  is_builtin: boolean;
  created_at: string;
}

const CATEGORIES = ['all', 'onboarding', 'upgrade', 're-engagement', 'newsletter', 'announcement', 'engagement', 'investor'];

const CATEGORY_META: Record<string, { label: string; color: string; bg: string }> = {
  onboarding:     { label: 'Onboarding',     color: '#2A8A52', bg: '#F0F5F1' },
  upgrade:        { label: 'Upgrade',        color: '#D08A28', bg: '#F5EAD3' },
  're-engagement':{ label: 'Re-engagement',  color: '#C0392B', bg: '#FAF0EE' },
  newsletter:     { label: 'Newsletter',     color: '#1B6B3E', bg: '#F0F5F1' },
  announcement:   { label: 'Announcement',   color: '#2A8A52', bg: '#F0F5F1' },
  engagement:     { label: 'Engagement',     color: '#1B6B3E', bg: '#F0F5F1' },
  investor:       { label: 'Investor',       color: '#8A8070', bg: '#F7F3EC' },
  general:        { label: 'General',        color: '#3E382E', bg: '#FAF8F3' },
};

export default function AdminTemplatesPage() {
  const { sessionToken } = useAdminAuth();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('all');
  const [dialog, setDialog] = useState<'create' | 'edit' | 'delete' | 'preview' | null>(null);
  const [selected, setSelected] = useState<Template | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', subject: '', preview_text: '', body_html: '', category: 'general' });

  const load = useCallback(async () => {
    if (!sessionToken) return;
    setLoading(true);
    const { data } = await adminDb(sessionToken, 'marketing_templates').select('*', { order: [{ column: 'is_builtin', ascending: false }, { column: 'name' }] });
    setTemplates((data ?? []) as Template[]);
    setLoading(false);
  }, [sessionToken]);

  useEffect(() => { void load(); }, [load]);

  const filtered = templates.filter(t => {
    const matchSearch = !search || t.name.toLowerCase().includes(search.toLowerCase()) || t.subject.toLowerCase().includes(search.toLowerCase());
    const matchCat = catFilter === 'all' || t.category === catFilter;
    return matchSearch && matchCat;
  });

  function openCreate() {
    setForm({ name: '', subject: '', preview_text: '', body_html: '', category: 'general' });
    setSelected(null);
    setDialog('create');
  }

  function openEdit(t: Template) {
    setForm({ name: t.name, subject: t.subject, preview_text: t.preview_text ?? '', body_html: t.body_html, category: t.category });
    setSelected(t);
    setDialog('edit');
  }

  async function handleDuplicate(t: Template) {
    if (!sessionToken) return;
    await adminDb(sessionToken, 'marketing_templates').insert({
      name: `${t.name} (Copy)`, subject: t.subject, preview_text: t.preview_text,
      body_html: t.body_html, category: t.category, is_builtin: false,
    });
    void load();
  }

  async function handleSave() {
    // Never save an empty-body template — it would send blank emails downstream.
    if (!form.name.trim() || !form.subject.trim() || !form.body_html.trim() || !sessionToken) return;
    setSaving(true);
    if (dialog === 'create') {
      await adminDb(sessionToken, 'marketing_templates').insert({ ...form, is_builtin: false });
    } else if (dialog === 'edit' && selected) {
      await adminDb(sessionToken, 'marketing_templates').update(form, { id: selected.id });
    }
    setSaving(false);
    setDialog(null);
    void load();
  }

  async function handleDelete() {
    if (!selected || !sessionToken) return;
    setSaving(true);
    await adminDb(sessionToken, 'marketing_templates').delete({ id: selected.id });
    setSaving(false);
    setDialog(null);
    void load();
  }

  return (
    <AdminLayout>
      <Box sx={{ p: 3, bgcolor: '#FAF8F3', minHeight: '100vh' }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 3 }}>
          <Box>
            <Typography variant="h5" fontWeight={800}>Email Templates</Typography>
            <Typography variant="body2" color="text.secondary">Reusable email templates for your campaigns</Typography>
          </Box>
          <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>New Template</Button>
        </Stack>

        {/* Category filter + search */}
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }} flexWrap="wrap">
          <TextField
            size="small" placeholder="Search templates..."
            value={search} onChange={e => setSearch(e.target.value)} sx={{ width: 260 }}
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 18, color: 'text.disabled' }} /></InputAdornment> }}
          />
          <Stack direction="row" spacing={0.5} flexWrap="wrap">
            {CATEGORIES.map(c => (
              <Chip key={c} label={c === 'all' ? 'All' : CATEGORY_META[c]?.label ?? c} size="small"
                onClick={() => setCatFilter(c)}
                sx={{ cursor: 'pointer', fontWeight: 600, fontSize: '0.7rem',
                  bgcolor: catFilter === c ? '#1B6B3E' : 'white', color: catFilter === c ? 'white' : 'text.secondary',
                  border: '1px solid', borderColor: catFilter === c ? '#1B6B3E' : 'grey.200' }}
              />
            ))}
          </Stack>
        </Stack>

        {loading && <LinearProgress sx={{ mb: 2, borderRadius: 1 }} />}

        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'grey.200' }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#FAF8F3' }}>
                {['Template', 'Category', 'Subject', 'Type', ''].map(col => (
                  <TableCell key={col} sx={{ fontWeight: 700, fontSize: '0.75rem', color: '#8A8070' }}>{col}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map(t => {
                const cm = CATEGORY_META[t.category] ?? CATEGORY_META.general;
                return (
                  <TableRow key={t.id} sx={{ '&:last-child td': { border: 0 }, '&:hover': { bgcolor: '#FAF8F3' } }}>
                    <TableCell>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <ArticleOutlinedIcon sx={{ fontSize: 18, color: '#3AAD6A' }} />
                        <Typography variant="body2" fontWeight={700}>{t.name}</Typography>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Chip label={cm.label} size="small"
                        sx={{ bgcolor: cm.bg, color: cm.color, fontWeight: 700, fontSize: '0.7rem', height: 20 }} />
                    </TableCell>
                    <TableCell sx={{ maxWidth: 260 }}>
                      <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block', maxWidth: 240 }}>{t.subject}</Typography>
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={0.5} alignItems="center">
                        <Chip label={t.is_builtin ? 'Built-in' : 'Custom'} size="small"
                          sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700,
                            bgcolor: t.is_builtin ? '#F5EAD3' : '#F0F5F1',
                            color: t.is_builtin ? '#D08A28' : '#1B6B3E' }} />
                        {!t.body_html?.trim() && (
                          <Chip label="⚠️ فارغ" size="small"
                            sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700, bgcolor: '#F5DDD9', color: '#C0392B' }} />
                        )}
                      </Stack>
                    </TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                        <Tooltip title="Preview"><IconButton size="small" onClick={() => { setSelected(t); setDialog('preview'); }}><ArticleOutlinedIcon sx={{ fontSize: 15 }} /></IconButton></Tooltip>
                        <Tooltip title="Edit"><IconButton size="small" onClick={() => openEdit(t)}><EditOutlinedIcon sx={{ fontSize: 15 }} /></IconButton></Tooltip>
                        <Tooltip title="Duplicate"><IconButton size="small" onClick={() => void handleDuplicate(t)}><ContentCopyIcon sx={{ fontSize: 15 }} /></IconButton></Tooltip>
                        <Tooltip title="Delete">
                          <span>
                            <IconButton size="small" color="error" disabled={t.is_builtin} onClick={() => { setSelected(t); setDialog('delete'); }}>
                              <DeleteOutlineIcon sx={{ fontSize: 15 }} />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                );
              })}
              {!loading && filtered.length === 0 && (
                <TableRow><TableCell colSpan={5} align="center" sx={{ py: 5, color: 'text.secondary' }}>No templates found.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      </Box>

      {/* Create/Edit Dialog */}
      <Dialog open={dialog === 'create' || dialog === 'edit'} onClose={() => setDialog(null)} maxWidth="md" fullWidth>
        <DialogTitle>{dialog === 'create' ? 'Create Template' : 'Edit Template'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Stack direction="row" spacing={2}>
              <TextField label="Template Name" size="small" fullWidth value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
              <TextField
                select label="Category" size="small" sx={{ minWidth: 160 }} value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                SelectProps={{ native: true }}
              >
                {Object.keys(CATEGORY_META).map(c => <option key={c} value={c}>{CATEGORY_META[c].label}</option>)}
              </TextField>
            </Stack>
            <TextField label="Subject Line" size="small" fullWidth value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} placeholder="Use {{first_name}} for personalization" />
            <TextField label="Preview Text" size="small" fullWidth value={form.preview_text} onChange={e => setForm(f => ({ ...f, preview_text: e.target.value }))} />
            <TextField
              label="HTML Body"
              multiline rows={10} size="small" fullWidth value={form.body_html}
              onChange={e => setForm(f => ({ ...f, body_html: e.target.value }))}
              placeholder="<h1>Hello {{first_name}}!</h1><p>Your message here.</p>"
              sx={{ '& textarea': { fontFamily: 'monospace', fontSize: '0.8rem' } }}
            />
            <Typography variant="caption" color="text.secondary">
              Available variables: {'{{first_name}}'}, {'{{full_name}}'}, {'{{email}}'}, {'{{app_name}}'}, {'{{cta_url}}'}
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialog(null)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={!form.name.trim() || !form.subject.trim() || !form.body_html.trim() || saving}>
            {dialog === 'create' ? 'Create Template' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={dialog === 'preview'} onClose={() => setDialog(null)} maxWidth="md" fullWidth>
        <DialogTitle>{selected?.name}</DialogTitle>
        <DialogContent>
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>Subject: <strong>{selected?.subject}</strong></Typography>
          <Box sx={{ border: '1px solid', borderColor: 'grey.200', borderRadius: 1, p: 2, bgcolor: 'white', minHeight: 200 }}
            dangerouslySetInnerHTML={{ __html: selected?.body_html ?? '' }} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialog(null)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={dialog === 'delete'} onClose={() => setDialog(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Delete Template</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Are you sure you want to delete <strong>{selected?.name}</strong>? This cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialog(null)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDelete} disabled={saving}>Delete</Button>
        </DialogActions>
      </Dialog>
    </AdminLayout>
  );
}
