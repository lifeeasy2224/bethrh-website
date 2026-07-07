import { useState, useEffect } from 'react';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Alert from '@mui/material/Alert';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import CircularProgress from '@mui/material/CircularProgress';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Snackbar from '@mui/material/Snackbar';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import GppBadOutlinedIcon from '@mui/icons-material/GppBadOutlined';
import { supabase, type CanvasData } from '../../supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useIdea } from '../../contexts/IdeaContext';

interface SwotData {
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
  generated_at?: string;
}

const QUADRANTS = [
  {
    key: 'strengths' as const,
    label: 'نقاط القوة',
    icon: <CheckCircleOutlineIcon />,
    color: '#1B6B3E',
    bg: '#DEEBE2',
    borderColor: '#1B6B3E',
    emoji: '💪',
  },
  {
    key: 'weaknesses' as const,
    label: 'نقاط الضعف',
    icon: <WarningAmberIcon />,
    color: '#D08A28',
    bg: '#F5EAD3',
    borderColor: '#D08A28',
    emoji: '⚠️',
  },
  {
    key: 'opportunities' as const,
    label: 'الفرص',
    icon: <TrendingUpIcon />,
    color: '#1B6B3E',
    bg: '#DEEBE2',
    borderColor: '#1B6B3E',
    emoji: '🚀',
  },
  {
    key: 'threats' as const,
    label: 'التهديدات',
    icon: <GppBadOutlinedIcon />,
    color: '#C0392B',
    bg: '#F5DDD9',
    borderColor: '#C0392B',
    emoji: '⚡',
  },
];

export default function SwotPage() {
  const { user } = useAuth();
  const { selectedIdea, selectedIdeaId } = useIdea();
  const [swot, setSwot] = useState<SwotData | null>(null);
  const [canvas, setCanvas] = useState<CanvasData | null>(null);
  const [generating, setGenerating] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedIdeaId) return;
    async function load() {
      const [s, c] = await Promise.all([
        supabase.from('swot_analyses').select('*').eq('user_idea_id', selectedIdeaId!).maybeSingle(),
        supabase.from('canvas_data').select('*').eq('user_idea_id', selectedIdeaId!).maybeSingle(),
      ]);
      if (s.data) setSwot(s.data as SwotData);
      if (c.data) setCanvas(c.data as CanvasData);
    }
    load();
  }, [selectedIdeaId]);

  async function handleGenerate() {
    if (!selectedIdea || !user || !selectedIdeaId) return;
    setGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('swot-analysis', {
        body: {
          title: selectedIdea.title,
          problem: selectedIdea.problem,
          solution: selectedIdea.solution,
          target_customer: selectedIdea.target_customer,
          sector: selectedIdea.sector,
          canvas: canvas ?? undefined,
        },
      });

      if (error) {
        // Surface a specific message (e.g. the rate-limit 429) from the response body.
        let msg = error.message || 'تعذّر توليد تحليل SWOT. حاول مرة أخرى.';
        const ctx = (error as { context?: Response }).context;
        if (ctx && typeof ctx.json === 'function') {
          const body = await ctx.json().catch(() => null);
          if (body?.error) msg = body.error;
        }
        throw new Error(msg);
      }
      // An empty array is truthy, so guard on actual content — otherwise an
      // empty AI response gets stored as a "0 items" SWOT with a fresh timestamp.
      if (!Array.isArray(data?.strengths) || data.strengths.length === 0) {
        throw new Error('لم يُرجع الذكاء الاصطناعي أي تحليل. حاول مرة أخرى.');
      }

      const now = new Date().toISOString();
      await supabase.from('swot_analyses').upsert({
        user_id: user.id,
        user_idea_id: selectedIdeaId,
        strengths: data.strengths,
        weaknesses: data.weaknesses,
        opportunities: data.opportunities,
        threats: data.threats,
        generated_at: now,
      }, { onConflict: 'user_idea_id' });

      setSwot({ ...data, generated_at: now });
      setToast('تم توليد تحليل SWOT!');
    } catch (err) {
      setToast((err as Error).message || 'تعذّر توليد تحليل SWOT. حاول مرة أخرى.');
    } finally {
      setGenerating(false);
    }
  }

  if (!selectedIdea) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="info">اختر فكرة من القائمة أعلاه لتوليد تحليل SWOT.</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 3 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2}>
          <Box>
            <Typography variant="h5" fontWeight={800}>تحليل SWOT</Typography>
            <Typography variant="body2" color="text.secondary">
              نقاط القوة والضعف والفرص والتهديدات لفكرتك — بالذكاء الاصطناعي.
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={generating ? <CircularProgress size={16} sx={{ color: 'white' }} /> : <AutoAwesomeIcon />}
            onClick={handleGenerate}
            disabled={generating}
          >
            {generating ? 'جارٍ التوليد…' : swot ? 'أعد توليد التحليل' : 'ولّد تحليل SWOT بالذكاء الاصطناعي'}
          </Button>
        </Stack>
      </Box>

      {swot?.generated_at && (
        <Alert severity="success" sx={{ mb: 3 }}>
          آخر توليد: {new Date(swot.generated_at).toLocaleDateString('ar', { year: 'numeric', month: 'long', day: 'numeric' })}
        </Alert>
      )}

      {!swot && !generating && (
        <Card sx={{ textAlign: 'center', p: 6, border: '2px dashed', borderColor: 'divider', boxShadow: 'none', mb: 3 }}>
          <AutoAwesomeIcon sx={{ fontSize: 44, color: 'text.disabled', mb: 2 }} />
          <Typography variant="h6" fontWeight={700} gutterBottom>لا يوجد تحليل SWOT بعد</Typography>
          <Typography color="text.secondary" sx={{ mb: 3, maxWidth: 480, mx: 'auto' }}>
            اضغط «ولّد تحليل SWOT» لتحصل على تحليل مخصص بناءً على فكرتك ونموذج عملك وسوقك المستهدف.
          </Typography>
          <Button variant="contained" startIcon={<AutoAwesomeIcon />} onClick={handleGenerate}>
            ولّد تحليل SWOT بالذكاء الاصطناعي
          </Button>
        </Card>
      )}

      {generating && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <CircularProgress size={48} sx={{ mb: 2 }} />
          <Typography color="text.secondary">نحلّل فكرتك بالذكاء الاصطناعي…</Typography>
        </Box>
      )}

      {swot && !generating && (
        <>
          <Grid container spacing={2.5}>
            {QUADRANTS.map(q => (
              <Grid size={{ xs: 12, sm: 6 }} key={q.key}>
                <Card sx={{ height: '100%', borderTop: `4px solid ${q.borderColor}` }}>
                  <CardContent sx={{ p: 2.5 }}>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                      <Box sx={{
                        width: 36, height: 36, borderRadius: 2,
                        bgcolor: q.bg, display: 'flex', alignItems: 'center',
                        justifyContent: 'center', color: q.color,
                      }}>
                        {q.icon}
                      </Box>
                      <Box>
                        <Typography variant="subtitle1" fontWeight={800}>{q.emoji} {q.label}</Typography>
                        <Chip label={`${(swot[q.key] ?? []).length} عناصر`} size="small" sx={{ height: 18, fontSize: '0.65rem', bgcolor: q.bg, color: q.color, fontWeight: 700 }} />
                      </Box>
                    </Stack>
                    <List dense sx={{ p: 0 }}>
                      {(swot[q.key] ?? []).map((item, i) => (
                        <ListItem key={i} sx={{ px: 0, py: 0.5 }} alignItems="flex-start">
                          <ListItemIcon sx={{ minWidth: 24, mt: 0.25 }}>
                            <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: q.color, mt: 0.75 }} />
                          </ListItemIcon>
                          <ListItemText
                            primary={item}
                            primaryTypographyProps={{ variant: 'body2', lineHeight: 1.6 }}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          <Alert severity="info" sx={{ mt: 3 }} icon={<AutoAwesomeIcon />}>
            وُلّد هذا التحليل بالذكاء الاصطناعي بناءً على تفاصيل فكرتك ومخطط نموذج عملك.
            استخدمه نقطة انطلاق للتخطيط الاستراتيجي — وتحقق من كل نقطة ببيانات سوق حقيقية.
          </Alert>
        </>
      )}

      <Snackbar open={!!toast} autoHideDuration={3000} onClose={() => setToast(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={toast?.includes('تعذّر') || toast?.includes('لم يُرجع') ? 'error' : 'success'} variant="filled" onClose={() => setToast(null)}>
          {toast}
        </Alert>
      </Snackbar>
    </Container>
  );
}
