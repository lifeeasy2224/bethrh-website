import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import Divider from '@mui/material/Divider';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import Skeleton from '@mui/material/Skeleton';
import LinearProgress from '@mui/material/LinearProgress';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import { useAdminAuth, ADMIN_API } from '../../contexts/AdminAuthContext';
import { adminDb } from '../../lib/adminDb';

const SECTORS = [
  'Food & Agriculture', 'B2B SaaS', 'E-commerce', 'Fintech',
  'EdTech', 'HealthTech', 'Logistics', 'Services',
];
const SECTOR_EMOJI: Record<string, string> = {
  'Food & Agriculture': '🌾', 'B2B SaaS': '💼', 'E-commerce': '🛒',
  'Fintech': '💰', 'EdTech': '📚', 'HealthTech': '🏥',
  'Logistics': '🚚', 'Services': '🔧',
};
const DIFFICULTIES = ['easy', 'medium', 'hard'] as const;

interface IdeaForm {
  slug: string;
  title: string;
  sector: string;
  emoji: string;
  tagline: string;
  problem: string;
  solution: string;
  target_market: string;
  revenue_model: string;
  why_now: string;
  biggest_challenge: string;
  best_markets: string;
  quick_start_steps: string;
  financial_estimates: string;
  est_roi_min: number;
  est_roi_max: number;
  break_even_months: number;
  initial_investment_min: number;
  initial_investment_max: number;
  monthly_revenue_y1_min: number;
  monthly_revenue_y1_max: number;
  difficulty: 'easy' | 'medium' | 'hard';
  time_to_launch_weeks: number;
  spots_total: number;
  is_published: boolean;
  is_featured: boolean;
  tags: string[];
  tags_input: string;
}

const EMPTY: IdeaForm = {
  slug: '', title: '', sector: 'Food & Agriculture', emoji: '💡', tagline: '',
  problem: '', solution: '', target_market: '', revenue_model: '',
  why_now: '', biggest_challenge: '', best_markets: '',
  quick_start_steps: '', financial_estimates: '',
  est_roi_min: 0, est_roi_max: 0, break_even_months: 12,
  initial_investment_min: 0, initial_investment_max: 0,
  monthly_revenue_y1_min: 0, monthly_revenue_y1_max: 0,
  difficulty: 'medium', time_to_launch_weeks: 8, spots_total: 3,
  is_published: false, is_featured: false,
  tags: [], tags_input: '',
};

// Minimal rich text toolbar — bold, italic, bullet list, numbered list, link
function RichTextEditor({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  function wrap(before: string, after: string) {
    const el = document.activeElement as HTMLTextAreaElement | null;
    if (!el) { onChange(value + before + after); return; }
    const start = el.selectionStart ?? 0;
    const end = el.selectionEnd ?? 0;
    const sel = value.slice(start, end);
    const next = value.slice(0, start) + before + sel + after + value.slice(end);
    onChange(next);
  }

  function insertAtLine(prefix: string) {
    const el = document.activeElement as HTMLTextAreaElement | null;
    const pos = el?.selectionStart ?? value.length;
    const lineStart = value.lastIndexOf('\n', pos - 1) + 1;
    const next = value.slice(0, lineStart) + prefix + value.slice(lineStart);
    onChange(next);
  }

  const toolbarBtns = [
    { label: 'B', title: 'Bold', action: () => wrap('**', '**'), sx: { fontWeight: 900, fontFamily: 'serif' } },
    { label: 'I', title: 'Italic', action: () => wrap('_', '_'), sx: { fontStyle: 'italic', fontFamily: 'serif' } },
    { label: '•', title: 'Bullet list', action: () => insertAtLine('- '), sx: {} },
    { label: '1.', title: 'Numbered list', action: () => insertAtLine('1. '), sx: {} },
    { label: '🔗', title: 'Link', action: () => wrap('[', '](url)'), sx: {} },
  ];

  return (
    <Box>
      <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
        {label} <Typography component="span" variant="caption" color="text.disabled">(Markdown supported)</Typography>
      </Typography>
      <Box sx={{ border: '1px solid', borderColor: 'grey.300', borderRadius: 1, overflow: 'hidden', '&:focus-within': { borderColor: 'primary.main', boxShadow: '0 0 0 2px rgba(27, 107, 62,0.15)' } }}>
        {/* Toolbar */}
        <Stack direction="row" spacing={0} sx={{ bgcolor: 'grey.50', borderBottom: '1px solid', borderColor: 'grey.200', px: 1, py: 0.5 }}>
          {toolbarBtns.map(btn => (
            <Button
              key={btn.label}
              size="small"
              onClick={btn.action}
              title={btn.title}
              sx={{ minWidth: 32, px: 1, py: 0.25, fontSize: '0.8rem', lineHeight: 1.5, color: 'text.primary', ...btn.sx }}
            >
              {btn.label}
            </Button>
          ))}
        </Stack>
        <textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          style={{
            width: '100%', minHeight: 120, border: 'none', outline: 'none', resize: 'vertical',
            padding: '10px 12px', fontFamily: 'inherit', fontSize: '0.875rem', lineHeight: 1.6,
            boxSizing: 'border-box', background: 'transparent',
          }}
        />
      </Box>
    </Box>
  );
}

interface SectionProps { title: string; children: React.ReactNode; }
function Section({ title, children }: SectionProps) {
  return (
    <Card sx={{ mb: 3 }}>
      <CardContent sx={{ p: 3 }}>
        <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2.5, pb: 1.5, borderBottom: '1px solid', borderColor: 'divider' }}>
          {title}
        </Typography>
        {children}
      </CardContent>
    </Card>
  );
}

export default function AdminIdeasFormPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const isEdit = !!id;
  const { sessionToken } = useAdminAuth();

  const [form, setForm] = useState<IdeaForm>({ ...EMPTY });
  const [loadingIdea, setLoadingIdea] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [lastEdited, setLastEdited] = useState<{ by: string; at: string } | null>(null);

  // Sector options come from the managed `sectors` table (Admin -> Ideas Library
  // -> Sectors). Seed with the legacy hardcoded list so the picker still works if
  // the table is empty or fails to load.
  const [sectorOptions, setSectorOptions] = useState<{ name: string; emoji: string }[]>(
    SECTORS.map(s => ({ name: s, emoji: SECTOR_EMOJI[s] ?? '💡' })),
  );

  useEffect(() => {
    if (!sessionToken) return;
    void (async () => {
      const { data } = await adminDb(sessionToken, 'sectors').select('name, emoji, is_active, sort_order', {
        order: [{ column: 'sort_order', ascending: true }, { column: 'name', ascending: true }],
      });
      const rows = (data as { name: string; emoji: string | null; is_active: boolean }[] | null) ?? [];
      const active = rows.filter(r => r.is_active !== false).map(r => ({ name: r.name, emoji: r.emoji ?? '💡' }));
      if (active.length) setSectorOptions(active);
    })();
  }, [sessionToken]);

  useEffect(() => {
    if (!isEdit) return;
    void (async () => {
      const res = await fetch(`${ADMIN_API}/idea-get`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` },
        body: JSON.stringify({ session_token: sessionToken, idea_id: id }),
      });
      const data = await res.json() as { idea?: Record<string, unknown>; error?: string };
      if (!res.ok || !data.idea) { setError(data.error ?? 'Failed to load idea'); setLoadingIdea(false); return; }
      const idea = data.idea;
      setForm({
        slug: String(idea.slug ?? ''),
        title: String(idea.title ?? ''),
        sector: String(idea.sector ?? 'Food & Agriculture'),
        emoji: String(idea.emoji ?? '💡'),
        tagline: String(idea.tagline ?? ''),
        problem: String(idea.problem ?? ''),
        solution: String(idea.solution ?? ''),
        target_market: String(idea.target_market ?? ''),
        revenue_model: String(idea.revenue_model ?? ''),
        why_now: String(idea.why_now ?? ''),
        biggest_challenge: String(idea.biggest_challenge ?? ''),
        best_markets: String(idea.best_markets ?? ''),
        quick_start_steps: String(idea.quick_start_steps ?? ''),
        financial_estimates: String(idea.financial_estimates ?? ''),
        est_roi_min: Number(idea.est_roi_min) || 0,
        est_roi_max: Number(idea.est_roi_max) || 0,
        break_even_months: Number(idea.break_even_months) || 12,
        initial_investment_min: Number(idea.initial_investment_min) || 0,
        initial_investment_max: Number(idea.initial_investment_max) || 0,
        monthly_revenue_y1_min: Number(idea.monthly_revenue_y1_min) || 0,
        monthly_revenue_y1_max: Number(idea.monthly_revenue_y1_max) || 0,
        difficulty: (['easy', 'medium', 'hard'].includes(String(idea.difficulty)) ? idea.difficulty : 'medium') as 'easy' | 'medium' | 'hard',
        time_to_launch_weeks: Number(idea.time_to_launch_weeks) || 8,
        spots_total: Number(idea.spots_total) || 3,
        is_published: Boolean(idea.is_published),
        is_featured: Boolean(idea.is_featured),
        tags: Array.isArray(idea.tags) ? (idea.tags as string[]) : [],
        tags_input: Array.isArray(idea.tags) ? (idea.tags as string[]).join(', ') : '',
      });
      if (idea.last_edited_by) {
        setLastEdited({ by: String(idea.last_edited_by), at: String(idea.last_edited_at ?? '') });
      }
      setLoadingIdea(false);
    })();
  }, [id, isEdit, sessionToken]);

  function set<K extends keyof IdeaForm>(key: K, val: IdeaForm[K]) {
    setForm(prev => ({ ...prev, [key]: val }));
  }

  function tf(key: keyof IdeaForm) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm(prev => ({ ...prev, [key]: e.target.value }));
  }

  // Auto-generate slug from title if creating new
  function handleTitleChange(val: string) {
    set('title', val);
    if (!isEdit && !form.slug) {
      set('slug', val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''));
    }
  }

  async function handleSave() {
    if (!form.title || !form.slug) { setError('Title and slug are required.'); return; }
    setError('');
    setSaving(true);

    const tags = form.tags_input.split(',').map(t => t.trim()).filter(Boolean);
    const payload = {
      slug: form.slug, title: form.title, sector: form.sector, emoji: form.emoji,
      tagline: form.tagline, problem: form.problem, solution: form.solution,
      target_market: form.target_market, revenue_model: form.revenue_model,
      why_now: form.why_now, biggest_challenge: form.biggest_challenge,
      best_markets: form.best_markets, quick_start_steps: form.quick_start_steps,
      financial_estimates: form.financial_estimates,
      est_roi_min: Number(form.est_roi_min) || 0,
      est_roi_max: Number(form.est_roi_max) || 0,
      break_even_months: Number(form.break_even_months) || 12,
      initial_investment_min: Number(form.initial_investment_min) || 0,
      initial_investment_max: Number(form.initial_investment_max) || 0,
      monthly_revenue_y1_min: Number(form.monthly_revenue_y1_min) || 0,
      monthly_revenue_y1_max: Number(form.monthly_revenue_y1_max) || 0,
      difficulty: form.difficulty,
      time_to_launch_weeks: Number(form.time_to_launch_weeks) || 8,
      spots_total: Number(form.spots_total) || 3,
      is_published: form.is_published,
      is_featured: form.is_featured,
      tags,
    };

    try {
      const action = isEdit ? 'idea-update' : 'idea-create';
      const bodyPayload = isEdit
        ? { session_token: sessionToken, idea_id: id, idea: payload }
        : { session_token: sessionToken, idea: payload };

      const res = await fetch(`${ADMIN_API}/${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` },
        body: JSON.stringify(bodyPayload),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Save failed');
      navigate('/admin/ideas-library');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }

  if (loadingIdea) {
    return (
      <Box sx={{ p: 4 }}>
        {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} height={60} sx={{ mb: 2 }} />)}
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: 'grey.50', minHeight: '100vh' }}>
      {/* Header */}
      <Box sx={{ bgcolor: 'white', borderBottom: '1px solid', borderColor: 'divider', px: 3, py: 2, position: 'sticky', top: 0, zIndex: 10 }}>
        {saving && <LinearProgress sx={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, borderRadius: 0 }} />}
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/admin/ideas-library')} sx={{ color: 'text.secondary' }}>
              Ideas Library
            </Button>
            <Typography color="text.disabled">/</Typography>
            <Typography variant="h6" fontWeight={700}>
              {isEdit ? 'Edit Idea' : 'New Idea'}
            </Typography>
          </Stack>
          <Stack direction="row" spacing={2} alignItems="center">
            {lastEdited && (
              <Typography variant="caption" color="text.disabled">
                Last edited {new Date(lastEdited.at).toLocaleDateString()} by {lastEdited.by.split('@')[0]}
              </Typography>
            )}
            <Button
              variant="contained"
              startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveOutlinedIcon />}
              onClick={() => void handleSave()}
              disabled={saving}
              sx={{ bgcolor: '#1B6B3E', '&:hover': { bgcolor: '#0F3D24' }, fontWeight: 700 }}
            >
              {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Idea'}
            </Button>
          </Stack>
        </Stack>
      </Box>

      <Box sx={{ maxWidth: 900, mx: 'auto', px: 3, py: 4 }}>
        {error && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>{error}</Alert>}

        {/* Basic Info */}
        <Section title="Basic Info">
          <Grid container spacing={2.5}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField label="Title *" value={form.title} onChange={e => handleTitleChange(e.target.value)} fullWidth required />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField label="Slug (URL) *" value={form.slug} onChange={tf('slug')} fullWidth required helperText="e.g. my-farm-idea" />
            </Grid>
            <Grid size={{ xs: 4, sm: 2 }}>
              <TextField
                label="Emoji"
                value={form.emoji}
                onChange={tf('emoji')}
                fullWidth
                slotProps={{ htmlInput: { style: { fontSize: '1.5rem', textAlign: 'center' } } }}
              />
            </Grid>
            <Grid size={{ xs: 8, sm: 4 }}>
              <FormControl fullWidth>
                <InputLabel>Sector</InputLabel>
                <Select label="Sector" value={form.sector} onChange={e => set('sector', e.target.value)}>
                  {(sectorOptions.some(o => o.name === form.sector)
                    ? sectorOptions
                    : [...sectorOptions, { name: form.sector, emoji: form.emoji || SECTOR_EMOJI[form.sector] || '💡' }]
                  ).map(s => <MenuItem key={s.name} value={s.name}>{s.emoji} {s.name}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <FormControl fullWidth>
                <InputLabel>Difficulty</InputLabel>
                <Select label="Difficulty" value={form.difficulty} onChange={e => set('difficulty', e.target.value as 'easy' | 'medium' | 'hard')}>
                  {DIFFICULTIES.map(d => <MenuItem key={d} value={d} sx={{ textTransform: 'capitalize' }}>{d}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 6, sm: 3 }}>
              <TextField label="Spots Total" type="number" value={form.spots_total} onChange={tf('spots_total')} fullWidth />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField label="Tagline" value={form.tagline} onChange={tf('tagline')} fullWidth helperText="One-line pitch (shown in cards)" />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <Stack direction="row" spacing={3}>
                <FormControlLabel
                  control={<Switch checked={form.is_published} onChange={e => set('is_published', e.target.checked)} />}
                  label="Published"
                />
                <FormControlLabel
                  control={<Switch checked={form.is_featured} onChange={e => set('is_featured', e.target.checked)} />}
                  label="Featured"
                />
              </Stack>
            </Grid>
          </Grid>
        </Section>

        {/* Rich Text Content */}
        <Section title="Content">
          <Stack spacing={3}>
            <RichTextEditor label="Problem" value={form.problem} onChange={v => set('problem', v)} />
            <RichTextEditor label="Solution" value={form.solution} onChange={v => set('solution', v)} />
            <RichTextEditor label="Target Customer / Market" value={form.target_market} onChange={v => set('target_market', v)} />
            <RichTextEditor label="Revenue Model" value={form.revenue_model} onChange={v => set('revenue_model', v)} />
            <RichTextEditor label="Why It Works (Why Now?)" value={form.why_now} onChange={v => set('why_now', v)} />
            <RichTextEditor label="Risks &amp; Challenges" value={form.biggest_challenge} onChange={v => set('biggest_challenge', v)} />
            <RichTextEditor label="Best Markets" value={form.best_markets} onChange={v => set('best_markets', v)} />
            <RichTextEditor label="Quick Start Steps" value={form.quick_start_steps} onChange={v => set('quick_start_steps', v)} />
            <RichTextEditor label="Financial Estimates" value={form.financial_estimates} onChange={v => set('financial_estimates', v)} />
          </Stack>
        </Section>

        {/* Financials */}
        <Section title="Financials">
          <Grid container spacing={2.5}>
            {([
              { label: 'ROI Min %', key: 'est_roi_min' },
              { label: 'ROI Max %', key: 'est_roi_max' },
              { label: 'Break-even (months)', key: 'break_even_months' },
              { label: 'Time to Launch (weeks)', key: 'time_to_launch_weeks' },
              { label: 'Investment Min $', key: 'initial_investment_min' },
              { label: 'Investment Max $', key: 'initial_investment_max' },
              { label: 'Y1 Monthly Rev Min $', key: 'monthly_revenue_y1_min' },
              { label: 'Y1 Monthly Rev Max $', key: 'monthly_revenue_y1_max' },
            ] as { label: string; key: keyof IdeaForm }[]).map(({ label, key }) => (
              <Grid size={{ xs: 6, sm: 3 }} key={key}>
                <TextField label={label} type="number" value={form[key]} onChange={tf(key)} fullWidth />
              </Grid>
            ))}
          </Grid>
        </Section>

        {/* Tags */}
        <Section title="Tags">
          <TextField
            label="Tags (comma-separated)"
            value={form.tags_input}
            onChange={tf('tags_input')}
            fullWidth
            helperText="e.g. saas, subscription, health"
          />
          {form.tags_input && (
            <Stack direction="row" flexWrap="wrap" gap={0.75} sx={{ mt: 1.5 }}>
              {form.tags_input.split(',').map(t => t.trim()).filter(Boolean).map(tag => (
                <Chip key={tag} label={tag} size="small" sx={{ bgcolor: 'rgba(27, 107, 62,0.1)', color: '#1B6B3E', fontWeight: 600 }} />
              ))}
            </Stack>
          )}
        </Section>

        <Divider sx={{ mb: 3 }} />

        <Stack direction="row" justifyContent="space-between">
          <Button onClick={() => navigate('/admin/ideas-library')} sx={{ color: 'text.secondary' }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SaveOutlinedIcon />}
            onClick={() => void handleSave()}
            disabled={saving}
            sx={{ bgcolor: '#1B6B3E', '&:hover': { bgcolor: '#0F3D24' }, fontWeight: 700 }}
          >
            {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Idea'}
          </Button>
        </Stack>
      </Box>
    </Box>
  );
}
