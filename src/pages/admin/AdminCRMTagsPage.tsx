import { useState, useEffect, useCallback } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
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
import LocalOfferOutlinedIcon from '@mui/icons-material/LocalOfferOutlined';
import AdminLayout from '../../components/AdminLayout';
import { adminDb } from '../../lib/adminDb';
import { useAdminAuth } from '../../contexts/AdminAuthContext';

interface Tag {
  id: string;
  name: string;
  color: string;
  created_at: string;
  user_count?: number;
}

// Distinct shades from the Bethra brand palette (tags must be tellable apart)
const PRESET_COLORS = [
  '#D4A653', '#C0392B', '#E8C07A', '#2A8A52',
  '#1B6B3E', '#3AAD6A', '#217A48', '#D08A28',
  '#A07830', '#8A8070', '#96271B', '#0F3D24',
];

const DEFAULT_TAGS = [
  { name: 'VIP', color: '#D4A653' },
  { name: 'Hot Lead', color: '#C0392B' },
  { name: 'Churning', color: '#D08A28' },
  { name: 'Needs Help', color: '#96271B' },
  { name: 'Investor Lead', color: '#1B6B3E' },
  { name: 'Power User', color: '#2A8A52' },
  { name: 'Beta Tester', color: '#3AAD6A' },
];

export default function AdminCRMTagsPage() {
  const { sessionToken } = useAdminAuth();
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialog, setDialog] = useState<'create' | 'edit' | 'delete' | null>(null);
  const [selected, setSelected] = useState<Tag | null>(null);
  const [tagName, setTagName] = useState('');
  const [tagColor, setTagColor] = useState(PRESET_COLORS[0]);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!sessionToken) return;
    setLoading(true);
    const { data: tagsData } = await adminDb(sessionToken, 'admin_crm_tags').select('*', { order: { column: 'name' } });
    const tagList = (tagsData ?? []) as Tag[];

    const { data: countsData } = await adminDb(sessionToken, 'admin_user_tags')
      .select('tag_id');

    const counts: Record<string, number> = {};
    (countsData ?? []).forEach((r: { tag_id: string }) => {
      counts[r.tag_id] = (counts[r.tag_id] ?? 0) + 1;
    });

    setTags(tagList.map(t => ({ ...t, user_count: counts[t.id] ?? 0 })));
    setLoading(false);
  }, [sessionToken]);

  useEffect(() => { void load(); }, [load]);

  function openCreate() {
    setTagName('');
    setTagColor(PRESET_COLORS[0]);
    setSelected(null);
    setDialog('create');
  }

  function openEdit(tag: Tag) {
    setTagName(tag.name);
    setTagColor(tag.color);
    setSelected(tag);
    setDialog('edit');
  }

  function openDelete(tag: Tag) {
    setSelected(tag);
    setDialog('delete');
  }

  async function handleSave() {
    if (!tagName.trim() || !sessionToken) return;
    setSaving(true);
    if (dialog === 'create') {
      await adminDb(sessionToken, 'admin_crm_tags').insert({ name: tagName.trim(), color: tagColor });
    } else if (dialog === 'edit' && selected) {
      await adminDb(sessionToken, 'admin_crm_tags').update({ name: tagName.trim(), color: tagColor }, { id: selected.id });
    }
    setSaving(false);
    setDialog(null);
    void load();
  }

  async function handleDelete() {
    if (!selected || !sessionToken) return;
    setSaving(true);
    await adminDb(sessionToken, 'admin_user_tags').delete({ tag_id: selected.id });
    await adminDb(sessionToken, 'admin_crm_tags').delete({ id: selected.id });
    setSaving(false);
    setDialog(null);
    setSelected(null);
    void load();
  }

  const isDefault = (name: string) => DEFAULT_TAGS.some(t => t.name === name);

  return (
    <AdminLayout>
      <Box sx={{ p: 3, bgcolor: '#FAF8F3', minHeight: '100vh' }}>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" sx={{ mb: 3 }}>
          <Box>
            <Typography variant="h5" fontWeight={800}>CRM Tags</Typography>
            <Typography variant="body2" color="text.secondary">Organize and label users with custom tags</Typography>
          </Box>
          <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}>
            New Tag
          </Button>
        </Stack>

        {loading && <LinearProgress sx={{ mb: 2, borderRadius: 1 }} />}

        {/* Summary chips */}
        <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mb: 2 }}>
          <Chip
            icon={<LocalOfferOutlinedIcon sx={{ fontSize: 15 }} />}
            label={`${tags.length} tags`}
            size="small"
            sx={{ bgcolor: '#F0F5F1', color: '#1B6B3E', fontWeight: 700 }}
          />
          <Chip
            label={`${tags.reduce((sum, t) => sum + (t.user_count ?? 0), 0)} assignments`}
            size="small"
            sx={{ bgcolor: '#F0F5F1', color: '#2A8A52', fontWeight: 700 }}
          />
        </Stack>

        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'grey.200' }}>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#FAF8F3' }}>
                {['Tag', 'Color', 'Users', 'Type', ''].map(col => (
                  <TableCell key={col} sx={{ fontWeight: 700, fontSize: '0.75rem', color: '#8A8070' }}>{col}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {tags.map(t => (
                <TableRow key={t.id} sx={{ '&:last-child td': { border: 0 } }}>
                  <TableCell>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Box sx={{ width: 12, height: 12, borderRadius: '50%', bgcolor: t.color, flexShrink: 0 }} />
                      <Chip
                        label={t.name}
                        size="small"
                        sx={{ bgcolor: `${t.color}22`, color: t.color, fontWeight: 700, fontSize: '0.75rem' }}
                      />
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={0.75} alignItems="center">
                      <Box sx={{ width: 18, height: 18, borderRadius: 1, bgcolor: t.color }} />
                      <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                        {t.color.toUpperCase()}
                      </Typography>
                    </Stack>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>{t.user_count ?? 0}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={isDefault(t.name) ? 'Default' : 'Custom'}
                      size="small"
                      sx={{
                        height: 18, fontSize: '0.65rem', fontWeight: 700,
                        bgcolor: isDefault(t.name) ? '#F5EAD3' : '#F0F5F1',
                        color: isDefault(t.name) ? '#D08A28' : '#1B6B3E',
                      }}
                    />
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
              {!loading && tags.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 5, color: 'text.secondary' }}>
                    No tags yet. Create your first tag above.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Card>
      </Box>

      {/* Create / Edit Dialog */}
      <Dialog open={dialog === 'create' || dialog === 'edit'} onClose={() => setDialog(null)} maxWidth="xs" fullWidth>
        <DialogTitle>{dialog === 'create' ? 'Create Tag' : 'Edit Tag'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Tag Name"
              size="small"
              fullWidth
              value={tagName}
              onChange={e => setTagName(e.target.value)}
              placeholder="e.g. Hot Lead"
            />
            <Box>
              <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ display: 'block', mb: 1 }}>COLOR</Typography>
              <Stack direction="row" flexWrap="wrap" gap={0.75}>
                {PRESET_COLORS.map(c => (
                  <Box
                    key={c}
                    onClick={() => setTagColor(c)}
                    sx={{
                      width: 28, height: 28, borderRadius: 1, bgcolor: c, cursor: 'pointer',
                      border: tagColor === c ? '3px solid #1A1A1A' : '3px solid transparent',
                      '&:hover': { transform: 'scale(1.1)' },
                      transition: 'transform 0.1s',
                    }}
                  />
                ))}
              </Stack>
              <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mt: 1.5 }}>
                <Box sx={{ width: 28, height: 28, borderRadius: 1, bgcolor: tagColor, border: '1px solid', borderColor: 'grey.200' }} />
                <TextField
                  size="small"
                  value={tagColor}
                  onChange={e => setTagColor(e.target.value)}
                  placeholder="#000000"
                  sx={{ width: 120, '& input': { fontFamily: 'monospace', fontSize: '0.8rem' } }}
                />
                <Chip label={tagName || 'Preview'} size="small" sx={{ bgcolor: `${tagColor}22`, color: tagColor, fontWeight: 700 }} />
              </Stack>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialog(null)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={!tagName.trim() || saving}>
            {dialog === 'create' ? 'Create Tag' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={dialog === 'delete'} onClose={() => setDialog(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Delete Tag</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            Are you sure you want to delete <strong>{selected?.name}</strong>? This will remove it from{' '}
            <strong>{selected?.user_count ?? 0} user{(selected?.user_count ?? 0) !== 1 ? 's' : ''}</strong>.
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
