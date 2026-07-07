import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Grid from '@mui/material/Grid';
import Chip from '@mui/material/Chip';
import LinearProgress from '@mui/material/LinearProgress';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import AddIcon from '@mui/icons-material/Add';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import LightbulbOutlinedIcon from '@mui/icons-material/LightbulbOutlined';
import { supabase, SECTORS, getStageInfo, type UserIdea } from '../../supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useIdea } from '../../contexts/IdeaContext';

const PLAN_MAX_IDEAS: Record<string, number> = { free: 1, pro: 999, growth: 999, builder: 3, launch: 5, family: 3 };

interface IdeaForm {
  title: string;
  sector: string;
  problem: string;
  solution: string;
  target_customer: string;
  revenue_model: string;
}

const EMPTY_FORM: IdeaForm = { title: '', sector: '', problem: '', solution: '', target_customer: '', revenue_model: '' };

export default function IdeaPage() {
  const { user, profile } = useAuth();
  const { ideas, selectedIdeaId, setSelectedIdeaId, refreshIdeas } = useIdea();
  const [searchParams] = useSearchParams();
  const [formOpen, setFormOpen] = useState(false);
  const [editIdea, setEditIdea] = useState<UserIdea | null>(null);
  const [form, setForm] = useState<IdeaForm>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<IdeaForm>>({});
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<UserIdea | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [menuAnchor, setMenuAnchor] = useState<{ el: HTMLElement; idea: UserIdea } | null>(null);
  const [toast, setToast] = useState<{ msg: string; sev: 'success' | 'error' } | null>(null);
  const [upgradeOpen, setUpgradeOpen] = useState(false);

  const plan = profile?.plan ?? 'free';
  const maxIdeas = PLAN_MAX_IDEAS[plan] ?? 1;
  const atLimit = ideas.length >= maxIdeas;

  // Auto-open the add idea dialog when navigated with ?new=true
  useEffect(() => {
    if (searchParams.get('new') === 'true') {
      if (atLimit) {
        setUpgradeOpen(true);
      } else {
        setEditIdea(null);
        setForm(EMPTY_FORM);
        setErrors({});
        setFormOpen(true);
      }
    }
  // Only run once on mount (plan limit may not be known yet at that point, but that's fine)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function openNew() {
    if (atLimit) { setUpgradeOpen(true); return; }
    setEditIdea(null);
    setForm(EMPTY_FORM);
    setErrors({});
    setFormOpen(true);
  }

  function openEdit(idea: UserIdea) {
    setEditIdea(idea);
    setForm({ title: idea.title, sector: idea.sector, problem: idea.problem, solution: idea.solution, target_customer: idea.target_customer, revenue_model: '' });
    setErrors({});
    setFormOpen(true);
  }

  function validate(): boolean {
    const e: Partial<IdeaForm> = {};
    if (!form.title.trim()) e.title = 'مطلوب';
    if (!form.sector) e.sector = 'مطلوب';
    if (form.problem.trim().length < 30) e.problem = '٣٠ حرفاً على الأقل';
    if (form.solution.trim().length < 30) e.solution = '٣٠ حرفاً على الأقل';
    if (form.target_customer.trim().length < 10) e.target_customer = '١٠ أحرف على الأقل';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function handleSave() {
    if (!validate() || !user) return;
    setSaving(true);
    if (editIdea) {
      const { error } = await supabase.from('user_ideas').update({
        title: form.title.trim(), sector: form.sector,
        problem: form.problem.trim(), solution: form.solution.trim(),
        target_customer: form.target_customer.trim(),
        updated_at: new Date().toISOString(),
      }).eq('id', editIdea.id);
      if (error) { setToast({ msg: 'تعذّر حفظ الفكرة.', sev: 'error' }); setSaving(false); return; }
      setToast({ msg: 'تم تحديث الفكرة!', sev: 'success' });
    } else {
      const { data, error } = await supabase.from('user_ideas').insert({
        user_id: user.id, title: form.title.trim(), sector: form.sector,
        problem: form.problem.trim(), solution: form.solution.trim(),
        target_customer: form.target_customer.trim(), stage: 'seed', iq_score: 0,
      }).select().maybeSingle();
      if (error || !data) { setToast({ msg: 'تعذّرت إضافة الفكرة.', sev: 'error' }); setSaving(false); return; }
      setSelectedIdeaId(data.id);
      setToast({ msg: 'زُرعت الفكرة! هيا ننمّيها.', sev: 'success' });
    }
    setSaving(false);
    setFormOpen(false);
    await refreshIdeas();
  }

  async function handleDelete() {
    if (!deleteTarget || deleteConfirm !== 'DELETE') return;
    setDeleting(true);
    const { error } = await supabase.from('user_ideas').delete().eq('id', deleteTarget.id);
    if (error) { setToast({ msg: 'تعذّر حذف الفكرة.', sev: 'error' }); setDeleting(false); return; }
    if (selectedIdeaId === deleteTarget.id) setSelectedIdeaId(null);
    setToast({ msg: 'حُذفت الفكرة.', sev: 'success' });
    setDeleteTarget(null);
    setDeleteConfirm('');
    setDeleting(false);
    await refreshIdeas();
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight={800}>أفكاري</Typography>
          <Typography variant="body2" color="text.secondary">أضف أفكار مشاريعك وتابعها وأدرها.</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openNew}>أضف فكرة جديدة</Button>
      </Stack>

      {ideas.length === 0 ? (
        <Card sx={{ textAlign: 'center', p: 6, border: '2px dashed', borderColor: 'divider', boxShadow: 'none' }}>
          <LightbulbOutlinedIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" fontWeight={700} gutterBottom>لا أفكار بعد</Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>ابدأ رحلتك بإضافة فكرتك الأولى، أو تصفّح مكتبة الأفكار للإلهام.</Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
            <Button variant="contained" startIcon={<AddIcon />} onClick={openNew}>أضف فكرة جديدة</Button>
            <Button variant="outlined" component={Link} to="/ideas-library">تصفّح مكتبة الأفكار</Button>
          </Stack>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {ideas.map(idea => {
            const s = getStageInfo(idea.stage);
            return (
              <Grid size={{ xs: 12, md: 6 }} key={idea.id}>
                <Card sx={{ height: '100%', border: selectedIdeaId === idea.id ? '2px solid' : '1px solid', borderColor: selectedIdeaId === idea.id ? 'primary.main' : 'divider', transition: 'all 150ms ease', '&:hover': { boxShadow: 4 } }}>
                  <CardContent sx={{ p: 2.5 }}>
                    <Stack direction="row" alignItems="flex-start" justifyContent="space-between">
                      <Stack direction="row" spacing={1.5} alignItems="flex-start" sx={{ flex: 1, minWidth: 0 }}>
                        <Box sx={{ width: 44, height: 44, borderRadius: 2, bgcolor: 'grey.100', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', flexShrink: 0 }}>{s.emoji}</Box>
                        <Box sx={{ minWidth: 0, flex: 1 }}>
                          <Typography variant="subtitle1" fontWeight={700} noWrap>{idea.title}</Typography>
                          <Stack direction="row" spacing={0.75} sx={{ mt: 0.5 }} flexWrap="wrap">
                            <Chip label={idea.sector} size="small" sx={{ height: 20, fontSize: '0.7rem' }} />
                            <Chip label={s.label} size="small" sx={{ height: 20, fontSize: '0.7rem', bgcolor: `${s.color}18`, color: s.color, fontWeight: 700 }} />
                          </Stack>
                        </Box>
                      </Stack>
                      <IconButton size="small" onClick={e => setMenuAnchor({ el: e.currentTarget, idea })}><MoreVertIcon fontSize="small" /></IconButton>
                    </Stack>

                    <Box sx={{ mt: 2 }}>
                      <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                        <Typography variant="caption" color="text.secondary">درجة بذرة</Typography>
                        <Typography variant="caption" fontWeight={700}>{idea.iq_score}/100</Typography>
                      </Stack>
                      <LinearProgress variant="determinate" value={idea.iq_score} sx={{ height: 6, borderRadius: 3, bgcolor: 'grey.100', '& .MuiLinearProgress-bar': { bgcolor: idea.iq_score >= 80 ? '#2A8A52' : idea.iq_score >= 50 ? '#1B6B3E' : '#D4A653', borderRadius: 3 } }} />
                    </Box>

                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1.5, display: '-webkit-box', overflow: 'hidden', textOverflow: 'ellipsis', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                      {idea.problem}
                    </Typography>

                    <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
                      <Button size="small" variant="outlined" component={Link} to={`/journey/validation?idea=${idea.id}`} onClick={() => setSelectedIdeaId(idea.id)} endIcon={<ArrowForwardIcon sx={{ fontSize: '14px !important' }} />}>
                        عرض الرحلة
                      </Button>
                      <Button size="small" variant="text" startIcon={<EditOutlinedIcon sx={{ fontSize: '14px !important' }} />} onClick={() => openEdit(idea)}>تعديل</Button>
                    </Stack>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* Idea menu */}
      <Menu anchorEl={menuAnchor?.el} open={!!menuAnchor} onClose={() => setMenuAnchor(null)}>
        <MenuItem onClick={() => { if (menuAnchor) openEdit(menuAnchor.idea); setMenuAnchor(null); }}>
          <EditOutlinedIcon fontSize="small" sx={{ mr: 1 }} />تعديل
        </MenuItem>
        <MenuItem sx={{ color: 'error.main' }} onClick={() => { if (menuAnchor) setDeleteTarget(menuAnchor.idea); setMenuAnchor(null); }}>
          <DeleteOutlineIcon fontSize="small" sx={{ mr: 1 }} />حذف
        </MenuItem>
      </Menu>

      {/* Add/Edit dialog */}
      <Dialog open={formOpen} onClose={() => setFormOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle fontWeight={700}>{editIdea ? 'تعديل الفكرة' : 'إضافة فكرة جديدة'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <TextField label="اسم الفكرة *" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} error={!!errors.title} helperText={errors.title} fullWidth inputProps={{ maxLength: 60 }} />
            <TextField select label="القطاع *" value={form.sector} onChange={e => setForm(f => ({ ...f, sector: e.target.value }))} error={!!errors.sector} helperText={errors.sector} fullWidth>
              {SECTORS.map(s => <MenuItem key={s.key} value={s.key}>{s.emoji} {s.label}</MenuItem>)}
            </TextField>
            <TextField label="المشكلة *" value={form.problem} onChange={e => setForm(f => ({ ...f, problem: e.target.value }))} error={!!errors.problem} helperText={errors.problem ?? `${form.problem.length}/500 (الحد الأدنى ٣٠)`} multiline rows={3} fullWidth inputProps={{ maxLength: 500 }} />
            <TextField label="الحل *" value={form.solution} onChange={e => setForm(f => ({ ...f, solution: e.target.value }))} error={!!errors.solution} helperText={errors.solution ?? `${form.solution.length}/500 (الحد الأدنى ٣٠)`} multiline rows={3} fullWidth inputProps={{ maxLength: 500 }} />
            <TextField label="العميل المستهدف *" value={form.target_customer} onChange={e => setForm(f => ({ ...f, target_customer: e.target.value }))} error={!!errors.target_customer} helperText={errors.target_customer} fullWidth inputProps={{ maxLength: 200 }} />
            <TextField label="نموذج الإيرادات (اختياري)" value={form.revenue_model} onChange={e => setForm(f => ({ ...f, revenue_model: e.target.value }))} multiline rows={2} fullWidth inputProps={{ maxLength: 300 }} />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setFormOpen(false)}>إلغاء</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving}>{saving ? 'جارٍ الحفظ…' : editIdea ? 'احفظ التغييرات' : '🌱 ازرع هذه الفكرة'}</Button>
        </DialogActions>
      </Dialog>

      {/* Delete dialog */}
      <Dialog open={!!deleteTarget} onClose={() => setDeleteTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle fontWeight={700}>حذف هذه الفكرة؟</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mb: 2 }}>سيؤدي هذا إلى حذف الفكرة نهائياً مع كل بيانات التحقق والمخطط والرحلة المرتبطة بها.</Alert>
          <Typography variant="body2" sx={{ mb: 1.5 }}>اكتب <strong>DELETE</strong> للتأكيد:</Typography>
          <TextField fullWidth size="small" value={deleteConfirm} onChange={e => setDeleteConfirm(e.target.value)} placeholder="DELETE" />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => { setDeleteTarget(null); setDeleteConfirm(''); }}>إلغاء</Button>
          <Button color="error" variant="contained" onClick={handleDelete} disabled={deleteConfirm !== 'DELETE' || deleting}>
            {deleting ? 'جارٍ الحذف…' : 'احذف نهائياً'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Upgrade dialog */}
      <Dialog open={upgradeOpen} onClose={() => setUpgradeOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle fontWeight={700}>بلغت حد الأفكار ({ideas.length}/{maxIdeas})</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">رقِّ خطتك لإضافة أفكار أكثر وفتح عدّة المؤسس الكاملة.</Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setUpgradeOpen(false)}>لاحقاً</Button>
          <Button variant="contained" component={Link} to="/pricing" onClick={() => setUpgradeOpen(false)}>رقِّ الآن</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={!!toast} autoHideDuration={4000} onClose={() => setToast(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={toast?.sev} variant="filled" onClose={() => setToast(null)}>{toast?.msg}</Alert>
      </Snackbar>
    </Container>
  );
}
