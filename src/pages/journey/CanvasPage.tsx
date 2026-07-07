import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Grid from '@mui/material/Grid';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import IconButton from '@mui/material/IconButton';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import LinearProgress from '@mui/material/LinearProgress';
import Tooltip from '@mui/material/Tooltip';
import CircularProgress from '@mui/material/CircularProgress';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { createElement } from 'react';
import { supabase, type CanvasData } from '../../supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useIdea } from '../../contexts/IdeaContext';

const BLOCKS = [
  { key: 'key_partners', title: 'الشركاء الرئيسيون', helper: 'من شركاؤك وموردوك الرئيسيون؟' },
  { key: 'key_activities', title: 'الأنشطة الرئيسية', helper: 'ما الأنشطة الأساسية التي يتطلبها عرض قيمتك؟' },
  { key: 'value_proposition', title: 'عرض القيمة', helper: 'ما القيمة الفريدة التي تقدمها لعملائك؟' },
  { key: 'customer_relationships', title: 'علاقات العملاء', helper: 'كيف تكسب عملاءك وتحافظ عليهم وتنمّيهم؟' },
  { key: 'customer_segments', title: 'شرائح العملاء', helper: 'من هم أهم عملائك؟' },
  { key: 'key_resources', title: 'الموارد الرئيسية', helper: 'ما الموارد الأساسية التي يتطلبها عرض قيمتك؟' },
  { key: 'channels', title: 'القنوات', helper: 'كيف تصل إلى شرائح عملائك؟' },
  { key: 'cost_structure', title: 'هيكل التكاليف', helper: 'ما أهم التكاليف في مشروعك؟' },
  { key: 'revenue_streams', title: 'مصادر الإيرادات', helper: 'كيف يجني مشروعك المال؟' },
];

const BLOCK_COLORS: Record<string, { color: string; bg: string }> = {
  key_partners: { color: '#2A8A52', bg: '#DEEBE2' },
  key_activities: { color: '#1B6B3E', bg: '#DEEBE2' },
  value_proposition: { color: '#D08A28', bg: '#FAF5E9' },
  customer_relationships: { color: '#1B6B3E', bg: '#DEEBE2' },
  customer_segments: { color: '#D08A28', bg: '#F5EAD3' },
  key_resources: { color: '#2A8A52', bg: '#DEEBE2' },
  channels: { color: '#1B6B3E', bg: '#DEEBE2' },
  cost_structure: { color: '#C0392B', bg: '#F5DDD9' },
  revenue_streams: { color: '#1B6B3E', bg: '#DEEBE2' },
};

export default function CanvasPage() {
  const { user, profile } = useAuth();
  const { selectedIdea, selectedIdeaId } = useIdea();
  const [canvas, setCanvas] = useState<CanvasData | null>(null);
  const [editBlock, setEditBlock] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; sev: 'success' | 'error' } | null>(null);
  const [financials, setFinancials] = useState({ monthly_revenue: '', monthly_costs: '', break_even_month: '' });

  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const plan = profile?.plan ?? 'free';
  const canEdit = plan !== 'free';
  const canExport = plan !== 'free';

  async function loadCanvas() {
    if (!selectedIdeaId) return;
    const { data } = await supabase.from('canvas_data').select('*').eq('user_idea_id', selectedIdeaId).maybeSingle();
    setCanvas(data as CanvasData | null);
    if (data) {
      setFinancials({ monthly_revenue: String(data.monthly_revenue || ''), monthly_costs: String(data.monthly_costs || ''), break_even_month: String(data.break_even_month || '') });
    }
  }

  useEffect(() => { if (user && selectedIdeaId) loadCanvas(); }, [selectedIdeaId, user]);

  async function saveBlock() {
    if (!editBlock || !user || !selectedIdeaId) return;
    setSaving(true);
    const { data, error } = await supabase
      .from('canvas_data')
      .upsert({ user_idea_id: selectedIdeaId, [editBlock]: editContent, updated_at: new Date().toISOString() }, { onConflict: 'user_idea_id' })
      .select('user_idea_id')
      .maybeSingle();
    if (!error && data) {
      await loadCanvas();
      setToast({ msg: 'تم الحفظ!', sev: 'success' });
    } else {
      setToast({ msg: 'تعذّر الحفظ. حاول مرة أخرى.', sev: 'error' });
    }
    setSaving(false);
    setEditBlock(null);
  }

  async function saveFinancials() {
    if (!user || !selectedIdeaId) return;
    const payload = {
      user_idea_id: selectedIdeaId,
      monthly_revenue: parseFloat(financials.monthly_revenue) || 0,
      monthly_costs: parseFloat(financials.monthly_costs) || 0,
      break_even_month: parseInt(financials.break_even_month) || 0,
      updated_at: new Date().toISOString(),
    };
    const { data, error } = await supabase
      .from('canvas_data')
      .upsert(payload, { onConflict: 'user_idea_id' })
      .select('user_idea_id')
      .maybeSingle();
    if (!error && data) { await loadCanvas(); setToast({ msg: 'حُفظت البيانات المالية!', sev: 'success' }); }
    else { setToast({ msg: 'تعذّر حفظ البيانات المالية.', sev: 'error' }); }
  }

  async function downloadPdf() {
    if (!canvas || !selectedIdea) return;
    if (!canExport) { setShowUpgradeModal(true); return; }
    setGeneratingPdf(true);
    try {
      const [{ pdf }, { default: CanvasPdfDocument }] = await Promise.all([
        import('@react-pdf/renderer'),
        import('../../components/CanvasPdfDocument'),
      ]);
      const date = new Date().toLocaleDateString('ar', { year: 'numeric', month: 'long', day: 'numeric' });
      const blob = await pdf(
        createElement(CanvasPdfDocument, {
          canvas,
          ideaName: selectedIdea.title,
          founderName: profile?.full_name ?? 'رائد الأعمال',
          date,
        }) as any
      ).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const safeName = selectedIdea.title.replace(/[^a-zA-Z0-9]/g, '_').replace(/_+/g, '_');
      const dateStr = new Date().toISOString().split('T')[0];
      link.href = url;
      link.download = `Bethra_Canvas_${safeName}_${dateStr}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch {
      setToast({ msg: 'تعذّر توليد ملف PDF. حاول مرة أخرى.', sev: 'error' });
    } finally {
      setGeneratingPdf(false);
    }
  }

  const MIN_BLOCK_LEN = 20;
  const missingBlocks = BLOCKS.filter(b => !((canvas as any)?.[b.key]?.length >= MIN_BLOCK_LEN));
  const filled = BLOCKS.length - missingBlocks.length;
  const pct = Math.round(filled / BLOCKS.length * 100);
  // Human-readable list of what still blocks the PDF export.
  const missingNames = missingBlocks.map(b => b.title).join(', ');
  const exportBlockedReason = missingBlocks.length
    ? `أضف ${MIN_BLOCK_LEN} حرفاً على الأقل إلى ${missingBlocks.length} ${missingBlocks.length > 1 ? 'مربعات' : 'مربع'} قبل التصدير: ${missingNames}`
    : '';

  const netProfit = (parseFloat(financials.monthly_revenue) || 0) - (parseFloat(financials.monthly_costs) || 0);

  if (!selectedIdea) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="info">اختر فكرة من القائمة أعلاه لعرض مخطط نموذج العمل.</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ sm: 'center' }} justifyContent="space-between" sx={{ mb: 1 }}>
        <Box>
          <Typography variant="h5" fontWeight={800}>مخطط نموذج العمل</Typography>
          <Typography variant="body2" color="text.secondary">ارسم مشروعك كاملاً في صفحة واحدة.</Typography>
        </Box>
        <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mt: { xs: 1, sm: 0 } }}>
          <Typography variant="body2" color="text.secondary">اكتمل {filled}/{BLOCKS.length} مربعات</Typography>
          <Box sx={{ width: 100 }}>
            <LinearProgress variant="determinate" value={pct} sx={{ height: 8, borderRadius: 4, '& .MuiLinearProgress-bar': { bgcolor: pct >= 70 ? 'success.main' : 'primary.main' } }} />
          </Box>
          <Typography variant="body2" fontWeight={700}>{pct}%</Typography>
        </Stack>
      </Stack>

      {!canEdit && (
        <Alert severity="warning" sx={{ mb: 2 }} action={<Button size="small" component={Link} to="/pricing">رقِّ</Button>}>
          تعديل المخطط وتصدير PDF يتطلبان خطة مدفوعة. العرض متاح للجميع.
        </Alert>
      )}

      {/* Free user: show locked PDF button */}
      {!canEdit && (
        <Stack direction="row" justifyContent="flex-end" sx={{ mb: 2 }}>
          <Tooltip title="رقِّ خطتك لتصدير مخططك كملف PDF بهوية بذرة" arrow>
            <span>
              <Button
                variant="outlined"
                size="small"
                startIcon={<LockOutlinedIcon />}
                onClick={() => setShowUpgradeModal(true)}
                sx={{ borderColor: '#B5AE9F', color: '#B5AE9F' }}
              >
                حمّل PDF
              </Button>
            </span>
          </Tooltip>
        </Stack>
      )}

      {/* Canvas grid */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        {BLOCKS.map(block => {
          const c = BLOCK_COLORS[block.key];
          const content = canvas ? (canvas as any)[block.key] : '';
          const isFilled = content?.length >= 20;
          return (
            <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={block.key}>
              <Card sx={{ height: '100%', border: isFilled ? '1px solid' : '1px dashed', borderColor: isFilled ? c.color : 'divider', transition: 'all 150ms ease', '&:hover': { boxShadow: 3 } }}>
                <CardContent sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: c.color }} />
                      <Typography variant="caption" fontWeight={700} sx={{ color: c.color, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{block.title}</Typography>
                    </Stack>
                    {canEdit && (
                      <IconButton size="small" onClick={() => { setEditBlock(block.key); setEditContent(content ?? ''); }}>
                        <EditOutlinedIcon fontSize="small" sx={{ color: 'text.disabled' }} />
                      </IconButton>
                    )}
                  </Stack>
                  <Typography variant="caption" color="text.secondary" sx={{ mb: 1, fontStyle: 'italic' }}>{block.helper}</Typography>
                  <Typography variant="body2" color={content ? 'text.primary' : 'text.disabled'} sx={{ flex: 1, whiteSpace: 'pre-wrap', lineHeight: 1.6, fontSize: '0.8125rem' }}>
                    {content || 'اضغط تعديل لإضافة محتوى…'}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Financial projections */}
      <Card>
        <CardContent sx={{ p: 2.5 }}>
          <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2 }}>التوقعات المالية</Typography>
          <Grid container spacing={2} alignItems="flex-end">
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField label="الإيراد الشهري ($)" value={financials.monthly_revenue} onChange={e => setFinancials(f => ({ ...f, monthly_revenue: e.target.value }))} fullWidth size="small" type="number" disabled={!canEdit} />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField label="التكاليف الشهرية ($)" value={financials.monthly_costs} onChange={e => setFinancials(f => ({ ...f, monthly_costs: e.target.value }))} fullWidth size="small" type="number" disabled={!canEdit} />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField label="شهر التعادل" value={financials.break_even_month} onChange={e => setFinancials(f => ({ ...f, break_even_month: e.target.value }))} fullWidth size="small" type="number" disabled={!canEdit} />
            </Grid>
            {canEdit && (
              <Grid size={{ xs: 12 }}>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Button variant="outlined" size="small" onClick={saveFinancials}>احفظ البيانات المالية</Button>
                  <Tooltip
                    title={exportBlockedReason}
                    arrow
                  >
                    <span>
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={generatingPdf ? <CircularProgress size={14} color="inherit" /> : <FileDownloadOutlinedIcon />}
                        onClick={downloadPdf}
                        disabled={filled < BLOCKS.length || generatingPdf}
                        sx={{
                          bgcolor: '#0F3D24',
                          color: '#fff',
                          fontWeight: 600,
                          '&:hover': { bgcolor: '#D4A653', color: '#0F3D24' },
                          '&.Mui-disabled': { bgcolor: '#B5AE9F', color: '#fff' },
                        }}
                      >
                        {generatingPdf ? 'جارٍ التوليد…' : 'حمّل PDF'}
                      </Button>
                    </span>
                  </Tooltip>
                </Stack>
                {exportBlockedReason && (
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                    {exportBlockedReason}
                  </Typography>
                )}
              </Grid>
            )}
          </Grid>
          {(financials.monthly_revenue || financials.monthly_costs) ? (
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 2 }}>
              <Card sx={{ flex: 1, bgcolor: netProfit >= 0 ? '#DEEBE2' : '#F5DDD9' }}>
                <CardContent sx={{ p: '12px !important', textAlign: 'center' }}>
                  <Typography variant="h6" fontWeight={800} sx={{ color: netProfit >= 0 ? '#1B6B3E' : '#C0392B' }}>
                    {netProfit >= 0 ? '+' : ''}${netProfit.toFixed(0)}/mo
                  </Typography>
                  <Typography variant="caption" color="text.secondary">صافي الربح</Typography>
                </CardContent>
              </Card>
              {financials.break_even_month && (
                <Card sx={{ flex: 1 }}>
                  <CardContent sx={{ p: '12px !important', textAlign: 'center' }}>
                    <Typography variant="h6" fontWeight={800} color="primary.main">الشهر {financials.break_even_month}</Typography>
                    <Typography variant="caption" color="text.secondary">نقطة التعادل</Typography>
                  </CardContent>
                </Card>
              )}
            </Stack>
          ) : null}
        </CardContent>
      </Card>

      {/* Edit modal */}
      <Dialog open={!!editBlock} onClose={() => setEditBlock(null)} maxWidth="sm" fullWidth>
        <DialogTitle fontWeight={700}>{BLOCKS.find(b => b.key === editBlock)?.title}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{BLOCKS.find(b => b.key === editBlock)?.helper}</Typography>
          <TextField multiline rows={6} fullWidth value={editContent} onChange={e => setEditContent(e.target.value)} placeholder="أضف نقاطاً أو فقرة قصيرة…" />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setEditBlock(null)}>إلغاء</Button>
          <Button variant="contained" onClick={saveBlock} disabled={saving}>{saving ? 'جارٍ الحفظ…' : 'حفظ'}</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={!!toast} autoHideDuration={3000} onClose={() => setToast(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={toast?.sev} variant="filled" onClose={() => setToast(null)}>{toast?.msg}</Alert>
      </Snackbar>

      {/* Upgrade modal */}
      <Dialog open={showUpgradeModal} onClose={() => setShowUpgradeModal(false)} maxWidth="xs" fullWidth>
        <DialogTitle fontWeight={700} sx={{ color: '#0F3D24' }}>صدّر مخططك كملف PDF</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            رقِّ إلى خطة مدفوعة لتحميل PDF احترافي بهوية بذرة لمخطط نموذج عملك — مثالي لمشاركته مع المستثمرين والشركاء.
          </Typography>
          <Stack spacing={1.5}>
            <Stack direction="row" spacing={1} alignItems="center">
              <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#D4A653' }} />
              <Typography variant="body2" color="text.secondary">صفحة غلاف باسم فكرتك وهوية بذرة</Typography>
            </Stack>
            <Stack direction="row" spacing={1} alignItems="center">
              <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#D4A653' }} />
              <Typography variant="body2" color="text.secondary">شبكة المخطط الكاملة بتسعة مربعات ملونة</Typography>
            </Stack>
            <Stack direction="row" spacing={1} alignItems="center">
              <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#D4A653' }} />
              <Typography variant="body2" color="text.secondary">صفحة التوقعات المالية (إن مُلئت)</Typography>
            </Stack>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, flexDirection: 'column', gap: 1 }}>
          <Button
            variant="contained"
            fullWidth
            component={Link}
            to="/pricing"
            onClick={() => setShowUpgradeModal(false)}
            sx={{ bgcolor: '#0F3D24', '&:hover': { bgcolor: '#D4A653', color: '#0F3D24' }, fontWeight: 700 }}
          >
            شاهد خطط الأسعار
          </Button>
          <Button fullWidth onClick={() => setShowUpgradeModal(false)} color="inherit" size="small">
            لاحقاً
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
