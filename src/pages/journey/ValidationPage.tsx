import { useState, useEffect, Fragment } from 'react';
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
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import TableHead from '@mui/material/TableHead';
import TableBody from '@mui/material/TableBody';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import IconButton from '@mui/material/IconButton';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { supabase, type ValidationEntry } from '../../supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useIdea } from '../../contexts/IdeaContext';
import { recomputeIqScore } from '../../lib/iqScore';

// The Validation Tracker is free on every plan: nothing on this page checks the plan.
const ENTRY_TYPES = [
  { value: 'interview', label: '🎤 مقابلة', color: '#1B6B3E' },
  { value: 'signup', label: '✋ تسجيل اهتمام', color: '#1B6B3E' },
  { value: 'preorder', label: '💵 طلب مسبق', color: '#D08A28' },
  { value: 'observation', label: '👁️ ملاحظة', color: '#2A8A52' },
];

const SENTIMENTS = [
  { value: '', label: 'بدون انطباع' },
  { value: 'positive', label: '😊 إيجابي' },
  { value: 'neutral', label: '😐 محايد' },
  { value: 'negative', label: '😟 سلبي' },
];

interface EntryForm {
  type: string;
  notes: string;
  amount: string;
  sentiment: string;
  who: string;
  proof_url: string;
  next_step: string;
}

const EMPTY_FORM: EntryForm = { type: 'interview', notes: '', amount: '', sentiment: 'positive', who: '', proof_url: '', next_step: '' };

// Mirrors the DB CHECK constraints on validation_entries.
const WHO_MAX = 120;
const PROOF_MAX = 500;
const NEXT_STEP_MAX = 200;
const PROOF_RE = /^https?:\/\//;

// Proof links only make sense for sign-ups and pre-orders.
const takesProof = (type: string) => type === 'signup' || type === 'preorder';
// Every type except the automatic AI first read needs a named source.
const needsWho = (type: string) => type !== 'stress_test';

function checkEvidenceFields(f: EntryForm): Partial<EntryForm> {
  const e: Partial<EntryForm> = {};
  const who = f.who.trim();
  if (needsWho(f.type) && !who) e.who = 'اكتب مع مَن تحدّثت: صفة أو جهة';
  else if (who.length > WHO_MAX) e.who = `الحد الأقصى ${WHO_MAX} حرفاً`;
  const proof = f.proof_url.trim();
  if (takesProof(f.type) && proof) {
    if (!PROOF_RE.test(proof)) e.proof_url = 'يجب أن يبدأ بـ http:// أو https://';
    else if (proof.length > PROOF_MAX) e.proof_url = `الحد الأقصى ${PROOF_MAX} حرفاً`;
  }
  if (f.next_step.trim().length > NEXT_STEP_MAX) e.next_step = `الحد الأقصى ${NEXT_STEP_MAX} حرفاً`;
  return e;
}

export default function ValidationPage() {
  const { user } = useAuth();
  const { selectedIdea, selectedIdeaId } = useIdea();
  const [entries, setEntries] = useState<ValidationEntry[]>([]);
  const [form, setForm] = useState<EntryForm>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<EntryForm>>({});
  const [saving, setSaving] = useState(false);
  const [toast, setToastState] = useState<{ msg: string; severity: 'success' | 'error' } | null>(null);
  // A failure must look like a failure: pass 'error' for anything that did not save.
  const setToast = (msg: string, severity: 'success' | 'error' = 'success') => setToastState({ msg, severity });
  const [expanded, setExpanded] = useState<string | null>(null);
  const [reaction, setReaction] = useState<{ text: string; entryCount: number; totalCommitted: number } | null>(null);
  // Edit dialog: the entry being edited (null = closed) and its form.
  const [editing, setEditing] = useState<ValidationEntry | null>(null);
  const [editForm, setEditForm] = useState<EntryForm>(EMPTY_FORM);
  const [editErrors, setEditErrors] = useState<Partial<EntryForm>>({});
  const [editSaving, setEditSaving] = useState(false);
  // Inline "add who" on an older entry: which row is open, its draft, and save state.
  const [whoEditId, setWhoEditId] = useState<string | null>(null);
  const [whoDraft, setWhoDraft] = useState('');
  const [whoSaving, setWhoSaving] = useState(false);

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
    Object.assign(e, checkEvidenceFields(form));
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function fetchReaction(entry: { type: string; notes: string; sentiment: string | null; amount: number }) {
    if (!selectedIdeaId) return;
    const { data, error } = await supabase.functions.invoke('validation-reaction', {
      body: { idea_id: selectedIdeaId, entry },
    });
    if (error || !data) return; // silent failure — never blocks the add flow
    setReaction({ text: data.reaction, entryCount: data.entry_count, totalCommitted: data.total_committed });
  }

  async function handleAdd() {
    if (!validate() || !user || !selectedIdeaId) return;
    setSaving(true);
    setReaction(null); // auto-clear the previous reaction on a new add
    const entry = {
      type: form.type,
      notes: form.notes.trim(),
      amount: form.type === 'preorder' && form.amount ? parseFloat(form.amount) : 0,
      sentiment: form.sentiment || null,
    };
    const { error } = await supabase.from('validation_entries').insert({
      user_idea_id: selectedIdeaId,
      ...entry,
      who: form.who.trim() || null,
      proof_url: takesProof(form.type) && form.proof_url.trim() ? form.proof_url.trim() : null,
      next_step: form.next_step.trim() || null,
    });
    if (error) { setToast('تعذّر حفظ النشاط.', 'error'); setSaving(false); return; }
    setForm(EMPTY_FORM);
    setSaving(false);
    setToast('سُجّل نشاط التحقق!');
    await loadEntries();
    if (selectedIdeaId) void recomputeIqScore(selectedIdeaId); // logging a signal moves the score now
    void fetchReaction(entry);
  }

  async function handleDelete(id: string) {
    const { error } = await supabase.from('validation_entries').delete().eq('id', id);
    if (error) { setToast('تعذّر حذف النشاط.', 'error'); return; }
    setEntries(prev => prev.filter(e => e.id !== id));
    if (selectedIdeaId) void recomputeIqScore(selectedIdeaId);
  }

  function openEdit(entry: ValidationEntry) {
    setEditErrors({});
    setEditForm({
      // An unknown / retired type (the old "other") is edited as an observation.
      type: ENTRY_TYPES.some(t => t.value === entry.type) ? entry.type : 'observation',
      notes: entry.notes,
      amount: entry.amount ? String(entry.amount) : '',
      sentiment: entry.sentiment ?? '',
      who: entry.who ?? '',
      proof_url: entry.proof_url ?? '',
      next_step: entry.next_step ?? '',
    });
    setEditing(entry);
  }

  async function handleUpdate() {
    if (!editing) return;
    const ee: Partial<EntryForm> = {};
    if (editForm.notes.trim().length < 10) ee.notes = '١٠ أحرف على الأقل';
    Object.assign(ee, checkEvidenceFields(editForm));
    if (Object.keys(ee).length) { setEditErrors(ee); return; }
    setEditErrors({});
    setEditSaving(true);
    const { error } = await supabase
      .from('validation_entries')
      .update({
        type: editForm.type,
        notes: editForm.notes.trim(),
        amount: editForm.type === 'preorder' && editForm.amount ? parseFloat(editForm.amount) : 0,
        sentiment: editForm.sentiment || null,
        who: editForm.who.trim() || null,
        proof_url: takesProof(editForm.type) && editForm.proof_url.trim() ? editForm.proof_url.trim() : null,
        next_step: editForm.next_step.trim() || null,
      })
      .eq('id', editing.id);
    setEditSaving(false);
    // Surface a failed write instead of pretending it saved.
    if (error) { setToast('تعذّر تحديث النشاط.', 'error'); return; }
    setEditing(null);
    setToast('تم تحديث النشاط!');
    await loadEntries();
    if (selectedIdeaId) void recomputeIqScore(selectedIdeaId);
  }

  // Fill in "who" on an entry logged before the field existed.
  async function saveWho(entryId: string) {
    const who = whoDraft.trim();
    if (!who) { setToast('اكتب صفة أو جهة.', 'error'); return; }
    if (who.length > WHO_MAX) { setToast(`اجعلها أقل من ${WHO_MAX} حرفاً.`, 'error'); return; }
    setWhoSaving(true);
    const { error } = await supabase.from('validation_entries').update({ who }).eq('id', entryId);
    setWhoSaving(false);
    if (error) { setToast('تعذّر الحفظ. حاول مرة أخرى.', 'error'); return; }
    setWhoEditId(null);
    setWhoDraft('');
    setToast('تم الحفظ.');
    await loadEntries();
    if (selectedIdeaId) void recomputeIqScore(selectedIdeaId);
  }

  const interviews = entries.filter(e => e.type === 'interview').length;
  const signups = entries.filter(e => e.type === 'signup').length;
  const preorders = entries.filter(e => e.type === 'preorder').reduce((s, e) => s + (e.amount ?? 0), 0);
  const positiveCount = entries.filter((e: any) => e.sentiment === 'positive').length;

  // 'stress_test' is the AI first read logged from /validate: an AI opinion, not customer evidence.
  // Any other type that is not offered any more (the old "other") is shown as an observation.
  const typeInfo = (t: string) => t === 'stress_test'
    ? { value: 'stress_test', label: '🤖 قراءة أولى بالذكاء الاصطناعي', color: '#8A8070' }
    : (ENTRY_TYPES.find(x => x.value === t) ?? ENTRY_TYPES.find(x => x.value === 'observation')!);
  // An empty sentiment is stored as NULL and scores as neutral, so it shows as '—'.
  const sentimentEmoji = (s: string | null | undefined) => (s ? ({ positive: '😊', neutral: '😐', negative: '😟' } as Record<string, string>)[s] ?? '—' : '—');

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
        <Typography variant="body2" color="text.secondary">أثبت أن الناس يريدون فكرتك فعلاً. المتتبّع مجاني في كل الخطط.</Typography>
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
              <TextField select label="الانطباع (اختياري)" value={form.sentiment} onChange={e => setForm(f => ({ ...f, sentiment: e.target.value }))} fullWidth size="small" slotProps={{ inputLabel: { shrink: true }, select: { displayEmpty: true } }}>
                {SENTIMENTS.map(s => <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>)}
              </TextField>
            </Grid>
            {form.type === 'preorder' && (
              <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                <TextField label="المبلغ ($)" value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} type="number" fullWidth size="small" />
              </Grid>
            )}
            <Grid size={{ xs: 12, sm: 6, md: 6 }}>
              <TextField label="مع مَن تحدّثت؟ *" value={form.who} onChange={e => setForm(f => ({ ...f, who: e.target.value }))} error={!!errors.who} helperText={errors.who ?? 'صفة الشخص أو جهته، مثلاً: صاحبة مقهى في عمّان.'} fullWidth size="small" inputProps={{ maxLength: WHO_MAX }} />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField label="ماذا تعلمت؟ *" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} error={!!errors.notes} helperText={errors.notes} multiline rows={2} fullWidth size="small" />
            </Grid>
            {takesProof(form.type) && (
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField label="رابط الإثبات (اختياري)" value={form.proof_url} onChange={e => setForm(f => ({ ...f, proof_url: e.target.value }))} error={!!errors.proof_url} helperText={errors.proof_url ?? 'لقطة شاشة، إيصال، استمارة، محادثة…'} placeholder="https://" fullWidth size="small" inputProps={{ maxLength: PROOF_MAX, dir: 'ltr' }} />
              </Grid>
            )}
            <Grid size={{ xs: 12, md: takesProof(form.type) ? 6 : 12 }}>
              <TextField label="الخطوة التالية (اختياري)" value={form.next_step} onChange={e => setForm(f => ({ ...f, next_step: e.target.value }))} error={!!errors.next_step} helperText={errors.next_step ?? 'ماذا ستفعل بهذا الدليل؟'} fullWidth size="small" inputProps={{ maxLength: NEXT_STEP_MAX }} />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <Button variant="contained" startIcon={<AddIcon />} onClick={handleAdd} disabled={saving}>
                {saving ? 'جارٍ الإضافة…' : 'أضف نشاطاً'}
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {reaction && (
        <Alert severity="info" sx={{ mb: 3 }} onClose={() => setReaction(null)}>
          <Typography variant="body2">{reaction.text}</Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
            لديك {reaction.entryCount} إدخال، بإجمالي ${reaction.totalCommitted}
          </Typography>
        </Alert>
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
                  <TableCell>مع مَن</TableCell>
                  <TableCell>الملاحظات</TableCell>
                  <TableCell align="right" />
                </TableRow>
              </TableHead>
              <TableBody>
                {entries.map(entry => (
                  <Fragment key={entry.id}>
                    <TableRow sx={{ '&:hover': { bgcolor: 'grey.50' }, cursor: 'pointer' }} onClick={() => setExpanded(expanded === entry.id ? null : entry.id)}>
                      <TableCell sx={{ whiteSpace: 'nowrap', fontSize: '0.8125rem' }}>{new Date(entry.created_at).toLocaleDateString('ar', { month: 'short', day: 'numeric' })}</TableCell>
                      <TableCell>
                        <Chip label={typeInfo(entry.type).label} size="small" sx={{ fontSize: '0.7rem', height: 20, bgcolor: `${typeInfo(entry.type).color}18`, color: typeInfo(entry.type).color, fontWeight: 700 }} />
                      </TableCell>
                      <TableCell sx={{ fontSize: '1rem' }}>{sentimentEmoji(entry.sentiment)}</TableCell>
                      <TableCell sx={{ fontSize: '0.8125rem', maxWidth: 220 }} onClick={e => { if (whoEditId === entry.id) e.stopPropagation(); }}>
                        {entry.who?.trim() ? (
                          <Typography variant="caption" sx={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{entry.who}</Typography>
                        ) : !needsWho(entry.type) ? (
                          <Typography variant="caption" color="text.disabled">—</Typography>
                        ) : whoEditId === entry.id ? (
                          <Stack direction="row" spacing={0.5} alignItems="center" onClick={e => e.stopPropagation()}>
                            <TextField
                              autoFocus size="small" placeholder="صفة أو جهة" value={whoDraft}
                              onChange={e => setWhoDraft(e.target.value)}
                              onKeyDown={e => { if (e.key === 'Enter') void saveWho(entry.id); if (e.key === 'Escape') setWhoEditId(null); }}
                              inputProps={{ maxLength: WHO_MAX, 'aria-label': 'مع مَن' }}
                              sx={{ minWidth: 150 }}
                            />
                            <Button size="small" variant="contained" disabled={whoSaving} onClick={() => void saveWho(entry.id)}>حفظ</Button>
                            <Button size="small" color="inherit" onClick={() => setWhoEditId(null)}>إلغاء</Button>
                          </Stack>
                        ) : (
                          <Chip
                            label="أضف «مع مَن» ليُحتسب في مؤشر الجاهزية" size="small" color="warning" variant="outlined"
                            onClick={e => { e.stopPropagation(); setWhoEditId(entry.id); setWhoDraft(''); }}
                            sx={{ cursor: 'pointer', fontWeight: 600, fontSize: '0.7rem', height: 'auto', '& .MuiChip-label': { whiteSpace: 'normal', py: 0.25 } }}
                          />
                        )}
                      </TableCell>
                      <TableCell sx={{ fontSize: '0.8125rem', maxWidth: 240 }}>
                        <Typography variant="caption" sx={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: expanded === entry.id ? 'normal' : 'nowrap' }}>
                          {entry.notes}
                        </Typography>
                      </TableCell>
                      <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                        {expanded === entry.id ? <ExpandLessIcon fontSize="small" sx={{ color: 'text.disabled', verticalAlign: 'middle' }} /> : <ExpandMoreIcon fontSize="small" sx={{ color: 'text.disabled', verticalAlign: 'middle' }} />}
                        {entry.type !== 'stress_test' && (
                          <IconButton size="small" aria-label="تعديل النشاط" onClick={e => { e.stopPropagation(); openEdit(entry); }}><EditOutlinedIcon fontSize="small" sx={{ color: 'text.secondary' }} /></IconButton>
                        )}
                        <IconButton size="small" aria-label="حذف النشاط" onClick={e => { e.stopPropagation(); void handleDelete(entry.id); }}><DeleteOutlineIcon fontSize="small" sx={{ color: 'error.light' }} /></IconButton>
                      </TableCell>
                    </TableRow>
                    {entry.type === 'preorder' && entry.amount > 0 && (
                      <TableRow sx={{ bgcolor: 'grey.50' }}>
                        <TableCell colSpan={6} sx={{ py: 0.5, pl: 3, fontSize: '0.75rem', color: 'text.secondary' }}>
                          مبلغ الطلب المسبق: <strong>${entry.amount}</strong>
                        </TableCell>
                      </TableRow>
                    )}
                    {expanded === entry.id && (entry.proof_url || entry.next_step) && (
                      <TableRow sx={{ bgcolor: 'grey.50' }}>
                        <TableCell colSpan={6} sx={{ py: 0.75, pl: 3, fontSize: '0.75rem', color: 'text.secondary' }}>
                          {entry.proof_url && PROOF_RE.test(entry.proof_url) && (
                            <Box>الإثبات: <a href={entry.proof_url} target="_blank" rel="noopener noreferrer nofollow" dir="ltr">{entry.proof_url}</a></Box>
                          )}
                          {entry.next_step && <Box>الخطوة التالية: {entry.next_step}</Box>}
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Edit dialog */}
      <Dialog open={!!editing} onClose={() => !editSaving && setEditing(null)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 700 }}>تعديل النشاط</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ pt: 1 }}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField select label="النوع" value={editForm.type} onChange={e => setEditForm(f => ({ ...f, type: e.target.value }))} fullWidth size="small">
                {ENTRY_TYPES.map(t => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField select label="الانطباع (اختياري)" value={editForm.sentiment} onChange={e => setEditForm(f => ({ ...f, sentiment: e.target.value }))} fullWidth size="small" slotProps={{ inputLabel: { shrink: true }, select: { displayEmpty: true } }}>
                {SENTIMENTS.map(s => <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>)}
              </TextField>
            </Grid>
            {editForm.type === 'preorder' && (
              <Grid size={{ xs: 12 }}>
                <TextField label="المبلغ ($)" value={editForm.amount} onChange={e => setEditForm(f => ({ ...f, amount: e.target.value }))} type="number" fullWidth size="small" />
              </Grid>
            )}
            <Grid size={{ xs: 12 }}>
              <TextField label="مع مَن تحدّثت؟ *" value={editForm.who} onChange={e => setEditForm(f => ({ ...f, who: e.target.value }))} error={!!editErrors.who} helperText={editErrors.who ?? 'صفة الشخص أو جهته، مثلاً: صاحبة مقهى في عمّان.'} fullWidth size="small" inputProps={{ maxLength: WHO_MAX }} />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField label="ماذا تعلمت؟ *" value={editForm.notes} onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))} error={!!editErrors.notes} helperText={editErrors.notes} multiline rows={3} fullWidth size="small" />
            </Grid>
            {takesProof(editForm.type) && (
              <Grid size={{ xs: 12 }}>
                <TextField label="رابط الإثبات (اختياري)" value={editForm.proof_url} onChange={e => setEditForm(f => ({ ...f, proof_url: e.target.value }))} error={!!editErrors.proof_url} helperText={editErrors.proof_url ?? 'لقطة شاشة، إيصال، استمارة، محادثة…'} placeholder="https://" fullWidth size="small" inputProps={{ maxLength: PROOF_MAX, dir: 'ltr' }} />
              </Grid>
            )}
            <Grid size={{ xs: 12 }}>
              <TextField label="الخطوة التالية (اختياري)" value={editForm.next_step} onChange={e => setEditForm(f => ({ ...f, next_step: e.target.value }))} error={!!editErrors.next_step} helperText={editErrors.next_step ?? 'ماذا ستفعل بهذا الدليل؟'} fullWidth size="small" inputProps={{ maxLength: NEXT_STEP_MAX }} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button color="inherit" onClick={() => setEditing(null)} disabled={editSaving}>إلغاء</Button>
          <Button variant="contained" onClick={() => void handleUpdate()} disabled={editSaving}>{editSaving ? 'جارٍ الحفظ…' : 'حفظ التعديلات'}</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={!!toast} autoHideDuration={4000} onClose={() => setToastState(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={toast?.severity ?? 'success'} variant="filled" onClose={() => setToastState(null)}>{toast?.msg}</Alert>
      </Snackbar>
    </Container>
  );
}
