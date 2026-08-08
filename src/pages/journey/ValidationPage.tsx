import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Grid from '@mui/material/Grid';
import Chip from '@mui/material/Chip';
import Table from '@mui/material/Table';
import TableHead from '@mui/material/TableHead';
import TableBody from '@mui/material/TableBody';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import IconButton from '@mui/material/IconButton';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { supabase, type ValidationEntry } from '../../supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useIdea } from '../../contexts/IdeaContext';
import { recomputeIqScore } from '../../lib/iqScore';

const ENTRY_TYPES = [
  { value: 'interview', label: '🎤 مقابلة', color: '#1B6B3E' },
  { value: 'signup', label: '✋ تسجيل اهتمام', color: '#1B6B3E' },
  { value: 'preorder', label: '💵 طلب مسبق', color: '#D08A28' },
  { value: 'observation', label: '👁️ ملاحظة', color: '#2A8A52' },
  { value: 'other', label: '📝 غير ذلك', color: '#8A8070' },
];

const SENTIMENTS = [
  { value: 'positive', label: '😊 إيجابي' },
  { value: 'neutral', label: '😐 محايد' },
  { value: 'negative', label: '😟 سلبي' },
];

interface EntryForm {
  type: string;
  notes: string;
  amount: string;
  sentiment: string;
}

export default function ValidationPage() {
  const { user, profile } = useAuth();
  const { selectedIdea, selectedIdeaId } = useIdea();
  const [entries, setEntries] = useState<ValidationEntry[]>([]);
  const [form, setForm] = useState<EntryForm>({ type: 'interview', notes: '', amount: '', sentiment: 'positive' });
  const [errors, setErrors] = useState<Partial<EntryForm>>({});
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const plan = profile?.plan ?? 'free';
  const canEdit = plan !== 'free';

  async function loadEntries() {
    if (!selectedIdeaId) return;
    const { data } = await supabase
      .from('validation_entries')
      .select('*')
      .eq('user_idea_id', selectedIdeaId)
      .order('created_at', { ascending: false });
    setEntries((data ?? []) as ValidationEntry[]);
  }

  useEffect(() => { if (user && selectedIdeaId) loadEntries(); }, [selectedIdeaId, user]);

  function validate() {
    const e: Partial<EntryForm> = {};
    if (form.notes.trim().length < 10) e.notes = '١٠ أحرف على الأقل';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleAdd() {
    if (!validate() || !user || !selectedIdeaId) return;
    setSaving(true);
    const { error } = await supabase.from('validation_entries').insert({
      user_idea_id: selectedIdeaId,
      type: form.type,
      notes: form.notes.trim(),
      amount: form.type === 'preorder' && form.amount ? parseFloat(form.amount) : 0,
      sentiment: form.sentiment,
    });
    if (error) { setToast('تعذّر حفظ النشاط.'); setSaving(false); return; }
    setForm({ type: 'interview', notes: '', amount: '', sentiment: 'positive' });
    setSaving(false);
    setToast('سُجّل نشاط التحقق!');
    await loadEntries();
    if (selectedIdeaId) void recomputeIqScore(selectedIdeaId); // logging a signal moves the score now
  }

  async function handleDelete(id: string) {
    await supabase.from('validation_entries').delete().eq('id', id);
    setEntries(prev => prev.filter(e => e.id !== id));
    if (selectedIdeaId) void recomputeIqScore(selectedIdeaId);
  }

  const interviews = entries.filter(e => e.type === 'interview').length;
  const signups = entries.filter(e => e.type === 'signup').length;
  const preorders = entries.filter(e => e.type === 'preorder').reduce((s, e) => s + (e.amount ?? 0), 0);
  const positiveCount = entries.filter((e: any) => e.sentiment === 'positive').length;

  const typeInfo = (t: string) => ENTRY_TYPES.find(x => x.value === t) ?? ENTRY_TYPES[0];
  const sentimentEmoji = (s: string) => ({ positive: '😊', neutral: '😐', negative: '😟' }[s] ?? '😊');

  if (!selectedIdea) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="info">اختر فكرة من القائمة أعلاه لعرض متتبّع التحقق.</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={800}>متتبّع التحقق</Typography>
        <Typography variant="body2" color="text.secondary">أثبت أن الناس يريدون فكرتك فعلاً.</Typography>
      </Box>

      {/* Stats */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: 'مقابلات', value: interviews, color: '#1B6B3E' },
          { label: 'تسجيلات اهتمام', value: signups, color: '#1B6B3E' },
          { label: 'طلبات مسبقة ($)', value: `$${preorders.toFixed(0)}`, color: '#D08A28' },
          { label: 'نسبة الإيجابية', value: entries.length ? `٪${Math.round(positiveCount / entries.length * 100)}` : '—', color: '#D08A28' },
        ].map(s => (
          <Grid size={{ xs: 6, md: 3 }} key={s.label}>
            <Card>
              <CardContent sx={{ p: '16px !important', textAlign: 'center' }}>
                <Typography variant="h4" fontWeight={800} sx={{ color: s.color }}>{s.value}</Typography>
                <Typography variant="caption" color="text.secondary">{s.label}</Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Log form */}
      {!canEdit ? (
        <Card sx={{ mb: 3, border: '2px dashed', borderColor: 'divider', boxShadow: 'none' }}>
          <CardContent sx={{ textAlign: 'center', py: 4 }}>
            <LockOutlinedIcon sx={{ fontSize: 36, color: 'text.disabled', mb: 1 }} />
            <Typography variant="h6" fontWeight={700} gutterBottom>متتبّع التحقق يتطلب خطة برو</Typography>
            <Typography color="text.secondary" sx={{ mb: 2 }}>تتبّع مقابلات العملاء وتسجيلات الاهتمام والطلبات المسبقة لإثبات طلب حقيقي.</Typography>
            <Button variant="contained" component={Link} to="/pricing">رقِّ إلى برو — $9/شهر</Button>
          </CardContent>
        </Card>
      ) : (
        <Card sx={{ mb: 3 }}>
          <CardContent sx={{ p: 2.5 }}>
            <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2 }}>سجّل نشاط تحقق جديد</Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <TextField select label="النوع" value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))} fullWidth size="small">
                  {ENTRY_TYPES.map(t => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <TextField select label="الانطباع" value={form.sentiment} onChange={e => setForm(f => ({ ...f, sentiment: e.target.value }))} fullWidth size="small">
                  {SENTIMENTS.map(s => <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>)}
                </TextField>
              </Grid>
              {form.type === 'preorder' && (
                <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                  <TextField label="المبلغ ($)" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} type="number" fullWidth size="small" />
                </Grid>
              )}
              <Grid size={{ xs: 12 }}>
                <TextField label="ماذا تعلمت؟ *" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} error={!!errors.notes} helperText={errors.notes} multiline rows={2} fullWidth size="small" />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Button variant="contained" startIcon={<AddIcon />} onClick={handleAdd} disabled={saving}>
                  {saving ? 'جارٍ الإضافة…' : 'أضف نشاطاً'}
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}

      {/* History */}
      <Card>
        <CardContent sx={{ p: 2.5 }}>
          <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2 }}>السجل ({entries.length})</Typography>
          {entries.length === 0 ? (
            <Typography variant="body2" color="text.secondary">لا أنشطة تحقق بعد. سجّل أول تفاعل مع عميل من الأعلى!</Typography>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow sx={{ '& th': { fontWeight: 700, fontSize: '0.75rem' } }}>
                  <TableCell>التاريخ</TableCell>
                  <TableCell>النوع</TableCell>
                  <TableCell>الانطباع</TableCell>
                  <TableCell>الملاحظات</TableCell>
                  <TableCell align="right" />
                </TableRow>
              </TableHead>
              <TableBody>
                {entries.map(entry => (
                  <>
                    <TableRow key={entry.id} sx={{ '&:hover': { bgcolor: 'grey.50' }, cursor: 'pointer' }} onClick={() => setExpanded(expanded === entry.id ? null : entry.id)}>
                      <TableCell sx={{ whiteSpace: 'nowrap', fontSize: '0.8125rem' }}>{new Date(entry.created_at).toLocaleDateString('ar', { month: 'short', day: 'numeric' })}</TableCell>
                      <TableCell>
                        <Chip label={typeInfo(entry.type).label} size="small" sx={{ fontSize: '0.7rem', height: 20, bgcolor: `${typeInfo(entry.type).color}18`, color: typeInfo(entry.type).color, fontWeight: 700 }} />
                      </TableCell>
                      <TableCell sx={{ fontSize: '1rem' }}>{sentimentEmoji((entry as any).sentiment ?? 'positive')}</TableCell>
                      <TableCell sx={{ fontSize: '0.8125rem', maxWidth: 240 }}>
                        <Typography variant="caption" sx={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: expanded === entry.id ? 'normal' : 'nowrap' }}>
                          {entry.notes}
                        </Typography>
                      </TableCell>
                      <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                        {expanded === entry.id ? <ExpandLessIcon fontSize="small" sx={{ color: 'text.disabled', verticalAlign: 'middle' }} /> : <ExpandMoreIcon fontSize="small" sx={{ color: 'text.disabled', verticalAlign: 'middle' }} />}
                        {canEdit && <IconButton size="small" onClick={e => { e.stopPropagation(); handleDelete(entry.id); }}><DeleteOutlineIcon fontSize="small" sx={{ color: 'error.light' }} /></IconButton>}
                      </TableCell>
                    </TableRow>
                    {entry.type === 'preorder' && (entry as any).amount > 0 && (
                      <TableRow key={`${entry.id}-amount`} sx={{ bgcolor: 'grey.50' }}>
                        <TableCell colSpan={5} sx={{ py: 0.5, pl: 3, fontSize: '0.75rem', color: 'text.secondary' }}>
                          مبلغ الطلب المسبق: <strong>${(entry as any).amount}</strong>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Snackbar open={!!toast} autoHideDuration={4000} onClose={() => setToast(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity="success" variant="filled" onClose={() => setToast(null)}>{toast}</Alert>
      </Snackbar>
    </Container>
  );
}
