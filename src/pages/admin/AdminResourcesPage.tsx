import { useEffect, useState, useCallback, useRef } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import LinearProgress from '@mui/material/LinearProgress';
import Chip from '@mui/material/Chip';
import Switch from '@mui/material/Switch';
import Table from '@mui/material/Table';
import TableHead from '@mui/material/TableHead';
import TableBody from '@mui/material/TableBody';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import IconButton from '@mui/material/IconButton';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Tooltip from '@mui/material/Tooltip';
import FolderOutlinedIcon from '@mui/icons-material/FolderOutlined';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import CircularProgress from '@mui/material/CircularProgress';
import AdminLayout from '../../components/AdminLayout';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import {
  listResources, uploadResource, updateResource, deleteResource,
  MAX_FILE_BYTES, ALLOWED_MIME, type AdminResourceDocument,
} from '../../lib/adminResources';

const ACCEPT = '.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.csv,.png,.jpg,.jpeg';

function formatSize(bytes: number | null): string {
  if (!bytes || bytes <= 0) return '—';
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} كيلوبايت`;
  return `${(bytes / 1024 / 1024).toFixed(1)} ميغابايت`;
}

export default function AdminResourcesPage() {
  const { sessionToken } = useAdminAuth();
  const [docs, setDocs] = useState<AdminResourceDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [snack, setSnack] = useState<{ msg: string; severity: 'success' | 'error' | 'info' } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<AdminResourceDocument | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    if (!sessionToken) return;
    setLoading(true);
    setDocs(await listResources(sessionToken));
    setLoading(false);
  }, [sessionToken]);

  useEffect(() => { void load(); }, [load]);

  const resetForm = () => {
    setFile(null); setTitle(''); setDescription(''); setCategory('');
    if (fileRef.current) fileRef.current.value = '';
  };

  const onPickFile = (f: File | null) => {
    setFile(f);
    if (f && !title.trim()) setTitle(f.name.replace(/\.[^.]+$/, ''));
  };

  const handleUpload = async () => {
    if (!sessionToken || !file) return;
    setUploading(true);
    const res = await uploadResource(sessionToken, file, { title, description, category });
    setUploading(false);
    if (!res.ok) { setSnack({ msg: res.error, severity: 'error' }); return; }
    resetForm();
    setSnack({ msg: 'تم الرفع. المورد غير منشور — فعّل «منشور» عند الجاهزية.', severity: 'success' });
    await load();
  };

  const togglePublished = async (doc: AdminResourceDocument) => {
    if (!sessionToken) return;
    setBusyId(doc.id);
    const res = await updateResource(sessionToken, doc.id, { is_published: !doc.is_published });
    setBusyId(null);
    if (!res.ok) { setSnack({ msg: res.error, severity: 'error' }); return; }
    setDocs(prev => prev.map(d => (d.id === doc.id ? res.document : d)));
    setSnack({ msg: res.document.is_published ? 'نُشر — يمكن للروّاد رؤيته الآن.' : 'أُلغي النشر.', severity: 'info' });
  };

  const handleDelete = async () => {
    if (!sessionToken || !confirmDelete) return;
    const doc = confirmDelete;
    setConfirmDelete(null);
    setBusyId(doc.id);
    const res = await deleteResource(sessionToken, doc.id);
    setBusyId(null);
    if (!res.ok) { setSnack({ msg: res.error ?? 'تعذّر الحذف.', severity: 'error' }); return; }
    setDocs(prev => prev.filter(d => d.id !== doc.id));
    setSnack({ msg: 'حُذف — أُزيل الملف والسجل.', severity: 'success' });
  };

  const fileTooBig = !!file && file.size > MAX_FILE_BYTES;
  const fileBadType = !!file && file.type !== '' && !ALLOWED_MIME.has(file.type);
  const canUpload = !!file && !!title.trim() && !fileTooBig && !fileBadType && !uploading;

  return (
    <AdminLayout>
      <Box>
        <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 0.5 }}>
          <FolderOutlinedIcon sx={{ color: 'primary.main' }} />
          <Typography variant="h5" fontWeight={800}>موارد الرائد</Typography>
        </Stack>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          ارفع أدلة وقوالب وأدوات. تبقى الملفات خاصة حتى تنشرها — الموارد المنشورة فقط تظهر للروّاد.
        </Typography>

        {/* Upload */}
        <Card sx={{ mb: 3 }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="subtitle1" fontWeight={800} sx={{ mb: 2 }}>رفع مورد</Typography>
            <input ref={fileRef} type="file" accept={ACCEPT} hidden onChange={e => onPickFile(e.target.files?.[0] ?? null)} />
            <Stack spacing={2}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }}>
                <Button variant="outlined" startIcon={<UploadFileIcon />} onClick={() => fileRef.current?.click()} sx={{ flexShrink: 0 }}>
                  {file ? 'تغيير الملف' : 'اختر ملفاً'}
                </Button>
                <Typography variant="body2" color={fileTooBig || fileBadType ? 'error' : 'text.secondary'} noWrap>
                  {file ? `${file.name} · ${formatSize(file.size)}` : 'PDF، Word، PowerPoint، Excel، CSV، PNG، JPG · حتى ٢٥ ميغابايت'}
                </Typography>
              </Stack>
              {fileTooBig && <Alert severity="error">هذا الملف يتجاوز حد الـ٢٥ ميغابايت.</Alert>}
              {fileBadType && <Alert severity="error">نوع هذا الملف غير مدعوم.</Alert>}
              <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
                <TextField label="العنوان" value={title} onChange={e => setTitle(e.target.value)} fullWidth size="small" required />
                <TextField label="الفئة" value={category} onChange={e => setCategory(e.target.value)} fullWidth size="small" placeholder="عام" helperText="تُستخدم لتجميع الموارد في صفحة الرائد" />
              </Stack>
              <TextField label="الوصف" value={description} onChange={e => setDescription(e.target.value)} fullWidth size="small" multiline minRows={2} />
              <Box>
                <Button
                  variant="contained"
                  onClick={handleUpload}
                  disabled={!canUpload}
                  startIcon={uploading ? <CircularProgress size={16} color="inherit" /> : <UploadFileIcon />}
                >
                  {uploading ? 'جارٍ الرفع…' : 'رفع'}
                </Button>
              </Box>
            </Stack>
          </CardContent>
        </Card>

        {/* List */}
        <Card>
          {loading && <LinearProgress />}
          <CardContent sx={{ p: 0 }}>
            {!loading && docs.length === 0 ? (
              <Box sx={{ p: 6, textAlign: 'center' }}>
                <FolderOutlinedIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
                <Typography color="text.secondary">لا توجد موارد بعد. ارفع واحدة أعلاه.</Typography>
              </Box>
            ) : (
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>العنوان</TableCell>
                    <TableCell>الفئة</TableCell>
                    <TableCell>الملف</TableCell>
                    <TableCell>الحجم</TableCell>
                    <TableCell align="center">منشور</TableCell>
                    <TableCell align="right">إجراءات</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {docs.map(doc => (
                    <TableRow key={doc.id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight={700}>{doc.title}</Typography>
                        {doc.description && (
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', maxWidth: 320, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {doc.description}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell><Chip label={doc.category} size="small" /></TableCell>
                      <TableCell>
                        <Typography variant="caption" color="text.secondary" title={doc.file_name}>{doc.file_name}</Typography>
                      </TableCell>
                      <TableCell><Typography variant="caption">{formatSize(doc.size_bytes)}</Typography></TableCell>
                      <TableCell align="center">
                        {busyId === doc.id ? (
                          <CircularProgress size={16} />
                        ) : (
                          <Switch checked={doc.is_published} onChange={() => togglePublished(doc)} size="small" />
                        )}
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="حذف المورد (يزيل الملف والسجل)">
                          <span>
                            <IconButton size="small" onClick={() => setConfirmDelete(doc)} disabled={busyId === doc.id}>
                              <DeleteOutlineIcon fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <Dialog open={!!confirmDelete} onClose={() => setConfirmDelete(null)}>
          <DialogTitle>حذف هذا المورد؟</DialogTitle>
          <DialogContent>
            <Typography variant="body2">
              سيُزال «{confirmDelete?.title}» وملفه نهائياً من التخزين. لا يمكن التراجع عن هذا.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setConfirmDelete(null)}>إلغاء</Button>
            <Button color="error" variant="contained" onClick={handleDelete}>حذف</Button>
          </DialogActions>
        </Dialog>

        <Snackbar open={!!snack} autoHideDuration={5000} onClose={() => setSnack(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
          <Alert severity={snack?.severity ?? 'info'} variant="filled" onClose={() => setSnack(null)}>{snack?.msg}</Alert>
        </Snackbar>
      </Box>
    </AdminLayout>
  );
}
