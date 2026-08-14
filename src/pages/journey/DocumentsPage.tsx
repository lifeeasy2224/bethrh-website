import { useState, useEffect, useRef } from 'react';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Alert from '@mui/material/Alert';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Snackbar from '@mui/material/Snackbar';
import CircularProgress from '@mui/material/CircularProgress';
import IconButton from '@mui/material/IconButton';
import Collapse from '@mui/material/Collapse';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import CheckIcon from '@mui/icons-material/Check';
import { supabase, type UserIdea, type CanvasData } from '../../supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useIdea } from '../../contexts/IdeaContext';
import { recomputeIqScore } from '../../lib/iqScore';
import {
  listDocuments, uploadAndExtract, deleteDocument,
  MAX_FILE_BYTES, MAX_FILES_PER_IDEA, MAX_PAGES,
  type IdeaDocument, type DocExtraction,
} from '../../lib/documents';

const IDEA_FIELDS: Array<{ key: keyof NonNullable<DocExtraction['idea']>; label: string }> = [
  { key: 'title', label: 'اسم الفكرة' },
  { key: 'sector', label: 'القطاع' },
  { key: 'problem', label: 'المشكلة' },
  { key: 'solution', label: 'الحل' },
  { key: 'target_customer', label: 'العميل المستهدف' },
  { key: 'differentiator', label: 'ما يميّزك' },
  { key: 'advantage', label: 'ميزتك التنافسية' },
];

const CANVAS_BLOCKS: Array<{ key: keyof NonNullable<DocExtraction['canvas']>; label: string }> = [
  { key: 'value_proposition', label: 'عرض القيمة' },
  { key: 'customer_segments', label: 'شرائح العملاء' },
  { key: 'channels', label: 'القنوات' },
  { key: 'customer_relationships', label: 'علاقات العملاء' },
  { key: 'revenue_streams', label: 'مصادر الإيرادات' },
  { key: 'key_resources', label: 'الموارد الرئيسية' },
  { key: 'key_activities', label: 'الأنشطة الرئيسية' },
  { key: 'key_partners', label: 'الشركاء الرئيسيون' },
  { key: 'cost_structure', label: 'هيكل التكاليف' },
];

const SWOT_QUADS: Array<{ key: 'strengths' | 'weaknesses' | 'opportunities' | 'threats'; label: string }> = [
  { key: 'strengths', label: 'نقاط القوة' },
  { key: 'weaknesses', label: 'نقاط الضعف' },
  { key: 'opportunities', label: 'الفرص' },
  { key: 'threats', label: 'التهديدات' },
];

const VALIDATION_TYPE_LABELS: Record<string, string> = {
  interview: 'مقابلة', preorder: 'طلب مسبق', signup: 'تسجيل اهتمام', observation: 'ملاحظة', other: 'غير ذلك',
};
const SENTIMENT_LABELS: Record<string, string> = { positive: 'إيجابي', neutral: 'محايد', negative: 'سلبي' };
const VALID_TYPES = new Set(['interview', 'preorder', 'signup', 'observation', 'other']);
const VALID_SENTIMENTS = new Set(['positive', 'neutral', 'negative']);

export default function DocumentsPage() {
  const { user } = useAuth();
  const { selectedIdea, selectedIdeaId } = useIdea();
  const [docs, setDocs] = useState<IdeaDocument[]>([]);
  const [uploading, setUploading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; sev: 'success' | 'error' | 'info' } | null>(null);
  const [confirmDeleteDoc, setConfirmDeleteDoc] = useState<IdeaDocument | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function load() {
    if (!selectedIdeaId) return;
    setDocs(await listDocuments(selectedIdeaId));
  }
  useEffect(() => { void load(); setExpandedId(null); }, [selectedIdeaId]);

  async function handleFile(file: File | null) {
    if (!file || !user || !selectedIdeaId) return;
    setUploading(true);
    try {
      const res = await uploadAndExtract(user.id, selectedIdeaId, file);
      await load();
      setExpandedId(res.document.id);
      setToast({ msg: 'استُخرجت البيانات — راجع كل قسم أدناه وطبّق ما تريد.', sev: 'success' });
    } catch (e) {
      setToast({ msg: (e as Error).message, sev: 'error' });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  async function handleConfirmDelete() {
    if (!confirmDeleteDoc) return;
    await deleteDocument(confirmDeleteDoc);
    if (expandedId === confirmDeleteDoc.id) setExpandedId(null);
    setConfirmDeleteDoc(null);
    await load();
  }

  if (!selectedIdea) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="info">اختر فكرة من القائمة أعلاه لعرض المستندات.</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={800}>المستندات</Typography>
        <Typography variant="body2" color="text.secondary">
          ارفع مستنداً (PDF) وسنستخرج منه ما يخدم فكرتك — والقرار لك في تطبيق أي جزء.
        </Typography>
      </Box>

      {/* Upload + the rules, stated plainly up front */}
      <Card sx={{ mb: 3, border: '1px solid', borderColor: 'divider' }}>
        <CardContent sx={{ p: 3 }}>
          <input ref={fileRef} type="file" accept="application/pdf,.pdf" hidden onChange={e => handleFile(e.target.files?.[0] ?? null)} />
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }} justifyContent="space-between">
            <Box>
              <Typography variant="subtitle1" fontWeight={800}>رفع مستند</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                PDF فقط · حتى {(MAX_FILE_BYTES / 1024 / 1024).toFixed(0)} ميغابايت · {MAX_PAGES} صفحات · حتى {MAX_FILES_PER_IDEA} ملفاً
              </Typography>
            </Box>
            <Button
              variant="contained"
              size="large"
              startIcon={uploading ? <CircularProgress size={16} color="inherit" /> : <UploadFileIcon />}
              onClick={() => fileRef.current?.click()}
              disabled={uploading || docs.length >= MAX_FILES_PER_IDEA}
              sx={{ flexShrink: 0 }}
            >
              {uploading ? 'جارٍ الرفع والتحليل…' : 'رفع مستند'}
            </Button>
          </Stack>
        </CardContent>
      </Card>

      {docs.length === 0 && (
        <Card sx={{ textAlign: 'center', p: 5, border: '1px dashed', borderColor: 'divider', boxShadow: 'none' }}>
          <DescriptionOutlinedIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
          <Typography fontWeight={700}>لم ترفع أي مستند بعد</Typography>
          <Typography variant="body2" color="text.secondary">ابدأ بدراسة أو عرض أو أي وثيقة تصف فكرتك.</Typography>
        </Card>
      )}

      <Stack spacing={2}>
        {docs.map(doc => (
          <DocumentCard
            key={doc.id}
            doc={doc}
            expanded={expandedId === doc.id}
            onToggle={() => setExpandedId(id => (id === doc.id ? null : doc.id))}
            onDelete={() => setConfirmDeleteDoc(doc)}
            ideaId={selectedIdeaId!}
            userId={user!.id}
            onToast={(msg, sev) => setToast({ msg, sev })}
          />
        ))}
      </Stack>

      <Dialog open={!!confirmDeleteDoc} onClose={() => setConfirmDeleteDoc(null)} maxWidth="xs" fullWidth>
        <DialogTitle fontWeight={700}>حذف هذا المستند؟</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">سيُحذف الملف نهائياً من التخزين. لا يمكن التراجع عن هذا.</Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setConfirmDeleteDoc(null)} color="inherit">إلغاء</Button>
          <Button variant="contained" color="error" onClick={handleConfirmDelete}>حذف</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={!!toast} autoHideDuration={5000} onClose={() => setToast(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={toast?.sev ?? 'success'} variant="filled" onClose={() => setToast(null)}>{toast?.msg}</Alert>
      </Snackbar>
    </Container>
  );
}

function DocumentCard({ doc, expanded, onToggle, onDelete, ideaId, userId, onToast }: {
  doc: IdeaDocument;
  expanded: boolean;
  onToggle: () => void;
  onDelete: () => void;
  ideaId: string;
  userId: string;
  onToast: (msg: string, sev: 'success' | 'error' | 'info') => void;
}) {
  const ex = doc.extraction;
  const failed = doc.status === 'failed';
  const inProgress = doc.status === 'uploaded' || doc.status === 'processing';

  return (
    <Card sx={{ border: '1px solid', borderColor: expanded ? 'primary.main' : 'divider' }}>
      <CardContent sx={{ p: 2.5 }}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <DescriptionOutlinedIcon color={failed ? 'disabled' : 'primary'} />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography fontWeight={700} noWrap>{doc.file_name}</Typography>
            <Typography variant="caption" color="text.secondary">
              {doc.page_count ? `${doc.page_count} صفحة · ` : ''}
              {new Date(doc.uploaded_at).toLocaleDateString('ar')}
            </Typography>
          </Box>
          {doc.status === 'extracted' && <Chip label="مستخرَج بالذكاء الاصطناعي" size="small" color="primary" icon={<AutoAwesomeIcon />} sx={{ fontWeight: 700 }} />}
          {inProgress && <Chip label="جارٍ المعالجة…" size="small" />}
          {failed && <Chip label="تعذّرت القراءة" size="small" />}
          {doc.status === 'extracted' && (
            <IconButton size="small" onClick={onToggle} aria-label="expand">
              <ExpandMoreIcon sx={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: '0.2s' }} />
            </IconButton>
          )}
          <IconButton size="small" onClick={onDelete} aria-label="delete"><DeleteOutlineIcon /></IconButton>
        </Stack>

        {failed && doc.error && (
          <Alert severity="warning" sx={{ mt: 1.5 }}>{doc.error}</Alert>
        )}

        {doc.status === 'extracted' && ex && (
          <Collapse in={expanded} unmountOnExit>
            <Divider sx={{ my: 2 }} />
            <Alert severity="info" sx={{ mb: 2 }}>
              كل ما يلي استُخرج من مستندك بالذكاء الاصطناعي. لا يُحفظ شيء قبل أن تراجعه وتضغط <strong>طبّق</strong>. عدّل ما تريد أولاً.
            </Alert>
            <ReviewSections extraction={ex} ideaId={ideaId} userId={userId} onToast={onToast} />
          </Collapse>
        )}
      </CardContent>
    </Card>
  );
}

interface ValRow { type: string; notes: string; amount: number; sentiment: string; keep: boolean }

function ReviewSections({ extraction, ideaId, userId, onToast }: {
  extraction: DocExtraction;
  ideaId: string;
  userId: string;
  onToast: (msg: string, sev: 'success' | 'error' | 'info') => void;
}) {
  // Editable working copies of each pillar (founder confirms/edits before applying).
  const [ideaFields, setIdeaFields] = useState<Record<string, string>>(() => {
    const o: Record<string, string> = {};
    for (const f of IDEA_FIELDS) { const v = extraction.idea?.[f.key]; if (v?.trim()) o[f.key] = v; }
    return o;
  });
  const [canvasFields, setCanvasFields] = useState<Record<string, string>>(() => {
    const o: Record<string, string> = {};
    for (const b of CANVAS_BLOCKS) { const v = extraction.canvas?.[b.key]; if (v?.trim()) o[b.key] = v; }
    return o;
  });
  const [swotFields, setSwotFields] = useState(() => ({
    strengths: [...(extraction.swot?.strengths ?? [])],
    weaknesses: [...(extraction.swot?.weaknesses ?? [])],
    opportunities: [...(extraction.swot?.opportunities ?? [])],
    threats: [...(extraction.swot?.threats ?? [])],
  }));
  const [valRows, setValRows] = useState<ValRow[]>(() =>
    (extraction.validation ?? []).map(v => ({
      type: v.type ?? 'other', notes: v.notes ?? '', amount: v.amount ?? 0, sentiment: v.sentiment ?? 'neutral', keep: true,
    }))
  );
  const fin = extraction.financials ?? {};

  const [busy, setBusy] = useState<string | null>(null);
  const [appliedKeys, setAppliedKeys] = useState<Set<string>>(new Set());

  async function run(key: string, fn: () => Promise<boolean>) {
    setBusy(key);
    try {
      const applied = await fn();
      if (applied) {
        setAppliedKeys(s => new Set(s).add(key));
        onToast('تم تطبيق البيانات على فكرتك', 'success');
      } else {
        onToast('لا جديد لإضافته', 'info');
      }
    } catch {
      onToast('تعذّر التطبيق، حاول مجدداً', 'error');
    } finally {
      setBusy(null);
    }
  }

  const hasIdea = Object.values(ideaFields).some(v => v.trim());
  const canvasKeys = Object.keys(canvasFields).filter(k => canvasFields[k].trim());
  const hasFin = (fin.monthly_revenue ?? 0) > 0 || (fin.monthly_costs ?? 0) > 0 || (fin.break_even_month ?? 0) > 0;
  const hasSwot = SWOT_QUADS.some(q => swotFields[q.key].some(s => s.trim()));
  const hasVal = valRows.some(v => v.keep && (v.notes.trim() || v.amount > 0));

  // FILL-EMPTY ONLY — only write a field when the current column is empty and
  // the extracted value is non-empty. Never overwrites founder-written content.
  async function applyIdea(): Promise<boolean> {
    const { data: cur } = await supabase.from('user_ideas')
      .select('title, sector, problem, solution, target_customer, differentiator, advantage')
      .eq('id', ideaId).maybeSingle();
    const c = (cur ?? {}) as Partial<UserIdea>;
    const patch: Record<string, string> = {};
    for (const f of IDEA_FIELDS) {
      const curVal = String(c[f.key] ?? '').trim();
      const newVal = (ideaFields[f.key] ?? '').trim();
      if (!curVal && newVal) patch[f.key] = newVal;
    }
    if (!Object.keys(patch).length) return false;
    const { error } = await supabase.from('user_ideas').update(patch).eq('id', ideaId);
    if (error) throw error;
    // Idea details don't feed the score — no recompute.
    return true;
  }

  async function applyCanvas(): Promise<boolean> {
    const { data: cur } = await supabase.from('canvas_data').select('*').eq('user_idea_id', ideaId).maybeSingle();
    const c = (cur ?? {}) as Partial<CanvasData>;
    const patch: Record<string, string> = {};
    for (const b of CANVAS_BLOCKS) {
      const curVal = String(c[b.key] ?? '').trim();
      const newVal = (canvasFields[b.key] ?? '').trim();
      if (!curVal && newVal) patch[b.key] = newVal;
    }
    if (!Object.keys(patch).length) return false;
    const { error } = await supabase.from('canvas_data')
      .upsert({ user_idea_id: ideaId, ...patch, updated_at: new Date().toISOString() }, { onConflict: 'user_idea_id' });
    if (error) throw error;
    void recomputeIqScore(ideaId);
    return true;
  }

  async function applyFinancials(): Promise<boolean> {
    const { data: cur } = await supabase.from('canvas_data')
      .select('monthly_revenue, monthly_costs, break_even_month').eq('user_idea_id', ideaId).maybeSingle();
    const c = (cur ?? {}) as Partial<CanvasData>;
    const patch: Record<string, number> = {};
    if (!Number(c.monthly_revenue) && Number(fin.monthly_revenue) > 0) patch.monthly_revenue = Number(fin.monthly_revenue);
    if (!Number(c.monthly_costs) && Number(fin.monthly_costs) > 0) patch.monthly_costs = Number(fin.monthly_costs);
    if (!Number(c.break_even_month) && Number(fin.break_even_month) > 0) patch.break_even_month = Number(fin.break_even_month);
    if (!Object.keys(patch).length) return false;
    const { error } = await supabase.from('canvas_data')
      .upsert({ user_idea_id: ideaId, ...patch, updated_at: new Date().toISOString() }, { onConflict: 'user_idea_id' });
    if (error) throw error;
    void recomputeIqScore(ideaId);
    return true;
  }

  // APPEND + DEDUPE — merges with existing points rather than replacing them.
  async function applySwot(): Promise<boolean> {
    const { data: cur } = await supabase.from('swot_analyses')
      .select('strengths, weaknesses, opportunities, threats').eq('user_idea_id', ideaId).maybeSingle();
    const merge = (existing: unknown, add: string[]) => {
      const base = Array.isArray(existing) ? (existing as string[]) : [];
      const seen = new Set(base.map(s => s.trim().toLowerCase()));
      const extra = add.map(s => s.trim()).filter(s => s && !seen.has(s.toLowerCase()));
      return { merged: [...base, ...extra], added: extra.length > 0 };
    };
    const s = merge(cur?.strengths, swotFields.strengths);
    const w = merge(cur?.weaknesses, swotFields.weaknesses);
    const o = merge(cur?.opportunities, swotFields.opportunities);
    const t = merge(cur?.threats, swotFields.threats);
    if (!s.added && !w.added && !o.added && !t.added) return false;
    const { error } = await supabase.from('swot_analyses').upsert({
      user_id: userId,
      user_idea_id: ideaId,
      strengths: s.merged, weaknesses: w.merged, opportunities: o.merged, threats: t.merged,
      generated_at: new Date().toISOString(),
    }, { onConflict: 'user_idea_id' });
    if (error) throw error;
    // SWOT points don't feed the score — no recompute.
    return true;
  }

  // Additive — always inserts new rows, never overwrites.
  async function applyValidation(): Promise<boolean> {
    const rows = valRows
      .filter(v => v.keep && (v.notes.trim() || v.amount > 0))
      .map(v => ({
        user_idea_id: ideaId,
        type: VALID_TYPES.has(v.type) ? v.type : 'other',
        notes: v.notes.trim(),
        amount: v.amount > 0 ? v.amount : 0,
        sentiment: VALID_SENTIMENTS.has(v.sentiment) ? v.sentiment : 'neutral',
      }));
    if (!rows.length) return false;
    const { error } = await supabase.from('validation_entries').insert(rows);
    if (error) throw error;
    void recomputeIqScore(ideaId);
    return true;
  }

  return (
    <Stack spacing={3}>
      {/* الفكرة */}
      {hasIdea && (
        <PillarBlock title="الفكرة" hint>
          <Stack spacing={1.5}>
            {IDEA_FIELDS.filter(f => ideaFields[f.key] !== undefined).map(f => (
              <TextField
                key={f.key}
                label={f.label}
                value={ideaFields[f.key]}
                onChange={e => setIdeaFields(s => ({ ...s, [f.key]: e.target.value }))}
                fullWidth size="small" multiline={f.key === 'problem' || f.key === 'solution'} minRows={f.key === 'problem' || f.key === 'solution' ? 2 : undefined}
              />
            ))}
          </Stack>
          <ApplyBtn busy={busy === 'idea'} applied={appliedKeys.has('idea')} onClick={() => run('idea', applyIdea)} />
        </PillarBlock>
      )}

      {/* نموذج العمل */}
      {canvasKeys.length > 0 && (
        <PillarBlock title="نموذج العمل" hint>
          <Stack spacing={1.5}>
            {CANVAS_BLOCKS.filter(b => canvasFields[b.key] !== undefined).map(b => (
              <TextField key={b.key} label={b.label} value={canvasFields[b.key]} onChange={e => setCanvasFields(c => ({ ...c, [b.key]: e.target.value }))} fullWidth size="small" multiline />
            ))}
          </Stack>
          <ApplyBtn busy={busy === 'canvas'} applied={appliedKeys.has('canvas')} onClick={() => run('canvas', applyCanvas)} />
        </PillarBlock>
      )}

      {/* المؤشرات المالية */}
      {hasFin && (
        <PillarBlock title="المؤشرات المالية" hint>
          <Stack direction="row" spacing={1.5} flexWrap="wrap">
            {(fin.monthly_revenue ?? 0) > 0 && <Chip label={`الإيراد الشهري: $${fin.monthly_revenue!.toLocaleString()}`} />}
            {(fin.monthly_costs ?? 0) > 0 && <Chip label={`التكاليف الشهرية: $${fin.monthly_costs!.toLocaleString()}`} />}
            {(fin.break_even_month ?? 0) > 0 && <Chip label={`شهر التعادل: ${fin.break_even_month}`} />}
          </Stack>
          <ApplyBtn busy={busy === 'fin'} applied={appliedKeys.has('fin')} onClick={() => run('fin', applyFinancials)} />
        </PillarBlock>
      )}

      {/* التحليل الرباعي */}
      {hasSwot && (
        <PillarBlock title="التحليل الرباعي">
          <Stack spacing={1.5}>
            {SWOT_QUADS.map(q => swotFields[q.key].length > 0 && (
              <Box key={q.key}>
                <Typography variant="caption" fontWeight={700} color="text.secondary">{q.label}</Typography>
                {swotFields[q.key].map((item, i) => (
                  <TextField key={i} value={item} onChange={e => setSwotFields(s => ({ ...s, [q.key]: s[q.key].map((x, j) => j === i ? e.target.value : x) }))} fullWidth size="small" sx={{ mt: 0.5 }} />
                ))}
              </Box>
            ))}
          </Stack>
          <ApplyBtn busy={busy === 'swot'} applied={appliedKeys.has('swot')} onClick={() => run('swot', applySwot)} />
        </PillarBlock>
      )}

      {/* أدلة التحقق */}
      {valRows.length > 0 && (
        <PillarBlock title="أدلة التحقق">
          <Stack spacing={1.5}>
            {valRows.map((v, i) => (
              <Box key={i} sx={{ p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 1.5, opacity: v.keep ? 1 : 0.5 }}>
                <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }} flexWrap="wrap">
                  <Chip label={VALIDATION_TYPE_LABELS[v.type] ?? v.type} size="small" />
                  {v.sentiment && <Chip label={SENTIMENT_LABELS[v.sentiment] ?? v.sentiment} size="small" color={v.sentiment === 'positive' ? 'success' : v.sentiment === 'negative' ? 'error' : 'default'} variant="outlined" />}
                  {v.amount > 0 && <Chip label={`$${v.amount.toLocaleString()}`} size="small" />}
                  <Box sx={{ flex: 1 }} />
                  <Button size="small" color="inherit" onClick={() => setValRows(list => list.map((x, j) => j === i ? { ...x, keep: !x.keep } : x))}>
                    {v.keep ? 'تخطَّ' : 'أضف'}
                  </Button>
                </Stack>
                <TextField value={v.notes} onChange={e => setValRows(list => list.map((x, j) => j === i ? { ...x, notes: e.target.value } : x))} fullWidth size="small" multiline disabled={!v.keep} />
              </Box>
            ))}
          </Stack>
          <ApplyBtn busy={busy === 'val'} applied={appliedKeys.has('val')} disabled={!hasVal} onClick={() => run('val', applyValidation)} />
        </PillarBlock>
      )}

      {!hasIdea && canvasKeys.length === 0 && !hasFin && !hasSwot && valRows.length === 0 && (
        <Alert severity="info">لم نجد في هذا المستند محتوى يمكن ربطه بأقسام فكرتك تلقائياً. يمكنك إضافة التفاصيل يدوياً من كل صفحة.</Alert>
      )}
    </Stack>
  );
}

function PillarBlock({ title, hint, children }: { title: string; hint?: boolean; children: React.ReactNode }) {
  return (
    <Box>
      <Typography variant="subtitle2" fontWeight={800} sx={{ mb: 1 }}>{title}</Typography>
      {children}
      {hint && <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>يُضاف إلى الحقول الفارغة فقط</Typography>}
    </Box>
  );
}

function ApplyBtn({ busy, applied, disabled, onClick }: { busy: boolean; applied: boolean; disabled?: boolean; onClick: () => void }) {
  return (
    <Button
      variant="outlined" size="small" sx={{ mt: 1.5 }}
      disabled={busy || disabled || applied}
      onClick={onClick}
      startIcon={busy ? <CircularProgress size={14} color="inherit" /> : applied ? <CheckIcon fontSize="small" /> : undefined}
      color={applied ? 'success' : 'primary'}
    >
      {applied ? 'تم التطبيق ✓' : 'طبّق'}
    </Button>
  );
}
