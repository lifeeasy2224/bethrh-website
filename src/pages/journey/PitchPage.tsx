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
import Table from '@mui/material/Table';
import TableHead from '@mui/material/TableHead';
import TableBody from '@mui/material/TableBody';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import Alert from '@mui/material/Alert';
import Chip from '@mui/material/Chip';
import Snackbar from '@mui/material/Snackbar';
import Divider from '@mui/material/Divider';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import PublicIcon from '@mui/icons-material/Public';
import { supabase, type CanvasData } from '../../supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useIdea } from '../../contexts/IdeaContext';

interface PitchDataRow {
  user_idea_id: string;
  investment_amount: number | null;
  use_of_funds: string;
  elevator_pitch: string;
  pitch_problem: string;
  pitch_solution: string;
  target_market: string;
  revenue_model: string;
  projected_roi: string;
  break_even_summary: string;
  last_generated_at: string | null;
  is_published: boolean;
  published_at: string | null;
}

const PUBLISH_LIMITS: Record<string, number> = { growth: 3, launch: 1, family: 3 };

export default function PitchPage() {
  const { user, profile } = useAuth();
  const { selectedIdea, selectedIdeaId } = useIdea();
  const [canvas, setCanvas] = useState<CanvasData | null>(null);
  const [validationCount, setValidationCount] = useState(0);
  const [pitchData, setPitchData] = useState<PitchDataRow | null>(null);
  const [publishedCount, setPublishedCount] = useState(0);

  const [investmentAmt, setInvestmentAmt] = useState('');
  const [useOfFunds, setUseOfFunds] = useState('');
  const [elevatorPitch, setElevatorPitch] = useState('');
  const [pitchProblem, setPitchProblem] = useState('');
  const [pitchSolution, setPitchSolution] = useState('');
  const [targetMarket, setTargetMarket] = useState('');
  const [revenueModel, setRevenueModel] = useState('');
  const [projectedRoi, setProjectedRoi] = useState('');
  const [breakEvenSummary, setBreakEvenSummary] = useState('');

  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [toast, setToast] = useState<{ msg: string; sev: 'success' | 'error' } | null>(null);
  const [generated, setGenerated] = useState(false);

  const plan = profile?.plan ?? 'free';
  const canAccess = plan === 'growth' || plan === 'launch' || plan === 'family';
  const publishLimit = PUBLISH_LIMITS[plan] ?? 0;

  async function loadData() {
    if (!selectedIdeaId || !user) return;
    const [c, v, p, pub] = await Promise.all([
      supabase.from('canvas_data').select('*').eq('user_idea_id', selectedIdeaId).maybeSingle(),
      supabase.from('validation_entries').select('id', { count: 'exact' }).eq('user_idea_id', selectedIdeaId),
      supabase.from('pitch_data').select('*').eq('user_idea_id', selectedIdeaId).maybeSingle(),
      supabase.from('pitch_data').select('id', { count: 'exact' }).eq('user_id', user.id).eq('is_published', true),
    ]);
    setCanvas(c.data as CanvasData | null);
    setValidationCount(v.count ?? 0);
    setPitchData(p.data as PitchDataRow | null);
    setPublishedCount(pub.count ?? 0);
    if (p.data) {
      setInvestmentAmt(String(p.data.investment_amount ?? ''));
      setUseOfFunds(p.data.use_of_funds ?? '');
      setElevatorPitch(p.data.elevator_pitch ?? '');
      setPitchProblem(p.data.pitch_problem ?? '');
      setPitchSolution(p.data.pitch_solution ?? '');
      setTargetMarket(p.data.target_market ?? '');
      setRevenueModel(p.data.revenue_model ?? '');
      setProjectedRoi(p.data.projected_roi ?? '');
      setBreakEvenSummary(p.data.break_even_summary ?? '');
    }
  }

  useEffect(() => { loadData(); }, [selectedIdeaId]);

  const score = selectedIdea?.iq_score ?? 0;
  const filledBlocks = canvas
    ? ['key_partners', 'key_activities', 'value_proposition', 'customer_relationships', 'customer_segments', 'key_resources', 'channels', 'cost_structure', 'revenue_streams']
        .filter(k => (canvas as any)[k]?.length >= 20).length
    : 0;
  const canvasPct = Math.round(filledBlocks / 9 * 100);
  const hasFinancials = !!(canvas?.monthly_revenue && canvas?.monthly_costs);

  const requirements = [
    { label: 'درجة بذرة ≥ ٥٠', met: score >= 50, value: `${score}/100`, link: null },
    { label: 'اكتمال المخطط ٧٠٪ على الأقل', met: canvasPct >= 70, value: `٪${canvasPct}`, link: '/journey/canvas' },
    { label: '٥ أنشطة تحقق على الأقل', met: validationCount >= 5, value: String(validationCount), link: '/journey/validation' },
    { label: 'التوقعات المالية معبأة', met: hasFinancials, value: hasFinancials ? 'تم' : 'ناقصة', link: '/journey/canvas' },
  ];

  const allMet = requirements.every(r => r.met);
  const canPublish = allMet && score >= 80 && !pitchData?.is_published && publishedCount < publishLimit;

  async function handleGenerate() {
    if (!user || !selectedIdeaId || !allMet) return;
    setSaving(true);
    const now = new Date().toISOString();
    const { data } = await supabase.from('pitch_data').upsert({
      user_idea_id: selectedIdeaId,
      user_id: user.id,
      investment_amount: parseFloat(investmentAmt) || null,
      use_of_funds: useOfFunds,
      elevator_pitch: elevatorPitch,
      pitch_problem: pitchProblem,
      pitch_solution: pitchSolution,
      target_market: targetMarket,
      revenue_model: revenueModel,
      projected_roi: projectedRoi,
      break_even_summary: breakEvenSummary,
      last_generated_at: now,
    }, { onConflict: 'user_idea_id' }).select().maybeSingle();
    if (data) setPitchData(data as PitchDataRow);
    setGenerated(true);
    setSaving(false);
    setToast({ msg: 'وُلّد العرض التمويلي!', sev: 'success' });
  }

  async function handlePublish() {
    if (!user || !selectedIdeaId || !canPublish) return;
    setPublishing(true);
    const now = new Date().toISOString();
    await supabase.from('pitch_data').upsert({
      user_idea_id: selectedIdeaId,
      user_id: user.id,
      is_published: true,
      published_at: now,
    }, { onConflict: 'user_idea_id' });
    // Mark idea as in_marketplace
    await supabase.from('user_ideas').update({ in_marketplace: true }).eq('id', selectedIdeaId);
    // Trigger investor matching
    const { error } = await supabase.functions.invoke('send-investor-match', {
      body: { idea_id: selectedIdeaId },
    });
    if (error) console.warn('Matching notification failed:', error);
    setPitchData(prev => prev ? { ...prev, is_published: true, published_at: now } : null);
    setPublishedCount(c => c + 1);
    setPublishing(false);
    setToast({ msg: '🚀 نُشر عرضك في سوق المستثمرين!', sev: 'success' });
  }

  if (!selectedIdea) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="info">اختر فكرة من القائمة أعلاه لعرض عرضك التمويلي.</Alert>
      </Container>
    );
  }

  if (!canAccess) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Card sx={{ textAlign: 'center', p: 6, border: '2px dashed', borderColor: 'divider', boxShadow: 'none' }}>
          <LockOutlinedIcon sx={{ fontSize: 44, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h5" fontWeight={700} gutterBottom>العرض التمويلي يتطلب خطة نمو</Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>ولّد عرضاً جاهزاً للمستثمرين من بياناتك تلقائياً. صدّره PDF أو شاركه برابط خاص.</Typography>
          <Button variant="contained" component={Link} to="/pricing">رقِّ إلى نمو — $19/شهر</Button>
        </Card>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={800}>العرض التمويلي</Typography>
        <Typography variant="body2" color="text.secondary">عرضك الجاهز للمستثمرين، مولّد تلقائياً.</Typography>
      </Box>

      {/* Requirements checklist */}
      {!allMet && (
        <Card sx={{ mb: 3, border: '1px solid', borderColor: 'warning.light' }}>
          <CardContent sx={{ p: 2.5 }}>
            <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2 }}>أكمل هذه المتطلبات لتوليد عرضك:</Typography>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ '& th': { fontWeight: 700, fontSize: '0.75rem' } }}>
                  <TableCell>المتطلب</TableCell>
                  <TableCell>الحالة</TableCell>
                  <TableCell>القيمة</TableCell>
                  <TableCell />
                </TableRow>
              </TableHead>
              <TableBody>
                {requirements.map(r => (
                  <TableRow key={r.label}>
                    <TableCell sx={{ fontSize: '0.8125rem' }}>{r.label}</TableCell>
                    <TableCell>
                      {r.met
                        ? <CheckCircleIcon sx={{ color: 'success.main', fontSize: 18 }} />
                        : <CancelIcon sx={{ color: 'error.light', fontSize: 18 }} />}
                    </TableCell>
                    <TableCell sx={{ fontSize: '0.8125rem' }}>{r.value}</TableCell>
                    <TableCell>
                      {!r.met && r.link && (
                        <Button size="small" component={Link} to={r.link} endIcon={<ArrowForwardIcon sx={{ fontSize: '12px !important' }} />} sx={{ fontSize: '0.75rem' }}>
                          أكمل
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {allMet && (
        <Alert severity="success" sx={{ mb: 3 }}>
          اكتملت كل المتطلبات! {pitchData?.last_generated_at && `آخر توليد: ${new Date(pitchData.last_generated_at).toLocaleDateString('ar')}.`}
        </Alert>
      )}

      {/* Pitch details form */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: 2.5 }}>
          <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2 }}>تفاصيل العرض</Typography>
          <Stack spacing={2}>
            <TextField
              label="عرض المصعد (جملة واحدة)"
              value={elevatorPitch}
              onChange={e => setElevatorPitch(e.target.value)}
              fullWidth
              size="small"
              placeholder="مثال: نساعد الأمهات والآباء المشغولين على اكتشاف أنشطة عائلية قريبة في أقل من ٦٠ ثانية."
            />
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField label="المشكلة (بكلماتك)" value={pitchProblem} onChange={e => setPitchProblem(e.target.value)} fullWidth size="small" multiline rows={3} />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField label="الحل" value={pitchSolution} onChange={e => setPitchSolution(e.target.value)} fullWidth size="small" multiline rows={3} />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField label="السوق المستهدف" value={targetMarket} onChange={e => setTargetMarket(e.target.value)} fullWidth size="small" placeholder="مثال: عائلات بين ٢٨–٤٥ سنة في مدن الخليج الكبرى" />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField label="نموذج الإيرادات" value={revenueModel} onChange={e => setRevenueModel(e.target.value)} fullWidth size="small" placeholder="مثال: اشتراك SaaS بـ $29/شهر + عمولة سوق" />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField label="العائد المتوقع" value={projectedRoi} onChange={e => setProjectedRoi(e.target.value)} fullWidth size="small" placeholder="مثال: ٣ أضعاف خلال ٣ سنوات" />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField label="ملخص نقطة التعادل" value={breakEvenSummary} onChange={e => setBreakEvenSummary(e.target.value)} fullWidth size="small" placeholder="مثال: الشهر ١٤ عند ٤٥٠ عميلاً يدفعون" />
              </Grid>
            </Grid>
          </Stack>
        </CardContent>
      </Card>

      {/* The Ask section */}
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: 2.5 }}>
          <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2 }}>طلب التمويل (اختياري)</Typography>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField label="مبلغ الاستثمار المطلوب ($)" value={investmentAmt} onChange={e => setInvestmentAmt(e.target.value)} type="number" fullWidth size="small" />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField label="أوجه استخدام التمويل" value={useOfFunds} onChange={e => setUseOfFunds(e.target.value)} fullWidth size="small" placeholder="مثال: تطوير المنتج، أول ٣ توظيفات، التسويق" />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
        <Button variant="contained" size="large" onClick={handleGenerate} disabled={saving || !allMet}>
          {saving ? 'جارٍ الحفظ…' : pitchData?.last_generated_at ? 'حدّث العرض' : 'ولّد العرض'}
        </Button>

        {(generated || pitchData?.last_generated_at) && allMet && (
          pitchData?.is_published ? (
            <Chip icon={<PublicIcon />} label="منشور في السوق" color="success" sx={{ fontWeight: 700 }} />
          ) : (
            <Box>
              <Button
                variant="outlined"
                size="large"
                startIcon={<PublicIcon />}
                onClick={handlePublish}
                disabled={publishing || !canPublish}
                color="success"
              >
                {publishing ? 'جارٍ النشر…' : 'انشر في السوق'}
              </Button>
              {score < 80 && <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>النشر يتطلب درجة بذرة ≥ ٨٠</Typography>}
              {publishedCount >= publishLimit && publishLimit > 0 && (
                <Typography variant="caption" color="error" sx={{ display: 'block', mt: 0.5 }}>
                  بلغت حد النشر ({publishLimit} في خطتك)
                </Typography>
              )}
            </Box>
          )
        )}
      </Stack>

      {/* Pitch preview */}
      {(generated || pitchData?.last_generated_at) && allMet && (
        <Card sx={{ border: '2px solid', borderColor: 'primary.main' }}>
          <CardContent sx={{ p: 3 }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
              <Chip label="عرض المستثمرين" sx={{ bgcolor: 'primary.main', color: 'white', fontWeight: 700 }} />
              {pitchData?.is_published && (
                <Chip icon={<PublicIcon />} label="حي في السوق" color="success" size="small" sx={{ fontWeight: 700 }} />
              )}
            </Stack>

            <Typography variant="h4" fontWeight={900} gutterBottom sx={{ textTransform: 'uppercase' }}>{selectedIdea.title}</Typography>
            <Stack direction="row" spacing={1} sx={{ mb: 3 }}>
              <Chip label={selectedIdea.sector} size="small" />
              <Chip label={`درجة بذرة: ${score}/100`} size="small" sx={{ bgcolor: score >= 80 ? '#DEEBE2' : '#DEEBE2', fontWeight: 700 }} />
            </Stack>

            {elevatorPitch && (
              <Box sx={{ mb: 2.5, p: 2, bgcolor: 'grey.50', borderRadius: 2, borderLeft: '4px solid', borderColor: 'primary.main' }}>
                <Typography variant="body1" fontStyle="italic" fontWeight={500}>"{elevatorPitch}"</Typography>
              </Box>
            )}

            <Divider sx={{ mb: 2.5 }} />

            {[
              { heading: 'المشكلة', content: pitchProblem || selectedIdea.problem },
              { heading: 'الحل', content: pitchSolution || selectedIdea.solution },
              { heading: 'العميل المستهدف', content: targetMarket || selectedIdea.target_customer },
            ].map(s => (
              <Box key={s.heading} sx={{ mb: 2.5 }}>
                <Typography variant="overline" fontWeight={700} color="primary.main">{s.heading}</Typography>
                <Typography variant="body2" sx={{ mt: 0.5, lineHeight: 1.75 }}>{s.content}</Typography>
              </Box>
            ))}

            {(revenueModel || projectedRoi || breakEvenSummary) && (
              <Box sx={{ mb: 2.5 }}>
                <Typography variant="overline" fontWeight={700} color="primary.main">نموذج العمل</Typography>
                <Stack spacing={0.5} sx={{ mt: 0.5 }}>
                  {revenueModel && <Typography variant="body2">• نموذج الإيرادات: {revenueModel}</Typography>}
                  {projectedRoi && <Typography variant="body2">• العائد المتوقع: {projectedRoi}</Typography>}
                  {breakEvenSummary && <Typography variant="body2">• نقطة التعادل: {breakEvenSummary}</Typography>}
                </Stack>
              </Box>
            )}

            <Box sx={{ mb: 2.5 }}>
              <Typography variant="overline" fontWeight={700} color="primary.main">التحقق</Typography>
              <Stack spacing={0.5} sx={{ mt: 0.5 }}>
                <Typography variant="body2">• اكتمل {validationCount} من أنشطة التحقق</Typography>
                {canvas?.monthly_revenue && <Typography variant="body2">• الإيراد الشهري المحتمل: ${canvas.monthly_revenue}</Typography>}
              </Stack>
            </Box>

            {canvas && (
              <Box sx={{ mb: 2.5 }}>
                <Typography variant="overline" fontWeight={700} color="primary.main">البيانات المالية</Typography>
                <Stack spacing={0.5} sx={{ mt: 0.5 }}>
                  {canvas.monthly_revenue && <Typography variant="body2">• الإيراد الشهري: ${canvas.monthly_revenue}</Typography>}
                  {canvas.monthly_costs && <Typography variant="body2">• التكاليف الشهرية: ${canvas.monthly_costs}</Typography>}
                  {canvas.break_even_month && <Typography variant="body2">• نقطة التعادل: الشهر {canvas.break_even_month}</Typography>}
                </Stack>
              </Box>
            )}

            {(investmentAmt || useOfFunds) && (
              <Box sx={{ p: 2, bgcolor: 'primary.main', borderRadius: 2, mt: 2 }}>
                <Typography variant="overline" fontWeight={700} sx={{ color: 'white' }}>طلب التمويل</Typography>
                {investmentAmt && <Typography variant="body2" sx={{ color: 'white', mt: 0.5 }}>المطلوب: ${parseFloat(investmentAmt).toLocaleString()}</Typography>}
                {useOfFunds && <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.9)', mt: 0.25 }}>أوجه الاستخدام: {useOfFunds}</Typography>}
              </Box>
            )}
          </CardContent>
        </Card>
      )}

      <Snackbar open={!!toast} autoHideDuration={4000} onClose={() => setToast(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={toast?.sev ?? 'success'} variant="filled" onClose={() => setToast(null)}>{toast?.msg}</Alert>
      </Snackbar>
    </Container>
  );
}
