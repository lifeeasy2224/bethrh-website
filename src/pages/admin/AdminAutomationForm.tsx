import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import FormHelperText from '@mui/material/FormHelperText';
import Button from '@mui/material/Button';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import Alert from '@mui/material/Alert';
import Divider from '@mui/material/Divider';
import InputAdornment from '@mui/material/InputAdornment';
import CircularProgress from '@mui/material/CircularProgress';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AdminLayout from '../../components/AdminLayout';
import { adminDb } from '../../lib/adminDb';
import { useAdminAuth } from '../../contexts/AdminAuthContext';

const TRIGGERS: Array<{ value: string; label: string; description: string }> = [
  { value: 'signup',                   label: 'New user signup',              description: 'Fires when a new user creates an account' },
  { value: 'inactive_7_days',          label: 'Inactive 7 days',              description: 'User hasn\'t logged in for 7 days' },
  { value: 'inactive_14_days',         label: 'Inactive 14 days',             description: 'User hasn\'t logged in for 14 days' },
  { value: 'inactive_30_days',         label: 'Inactive 30 days',             description: 'User hasn\'t logged in for 30 days' },
  { value: 'milestone_completed',      label: 'Milestone completed',          description: 'User completes any journey milestone' },
  { value: 'limit_hit',                label: 'Plan limit reached',           description: 'Free user hits a plan usage limit' },
  { value: 'pricing_page_visited',     label: 'Visited pricing page',         description: 'Free user visited pricing but didn\'t upgrade' },
  { value: 'plan_upgraded',            label: 'Plan upgraded',                description: 'User upgrades to a paid plan' },
  { value: 'plan_cancelled',           label: 'Plan cancelled',               description: 'User cancels their subscription' },
  { value: 'first_idea_created',       label: 'First idea created',           description: 'User creates their very first idea' },
  { value: 'stress_test_completed',    label: 'Stress test completed',        description: 'User completes an idea stress test' },
  { value: 'canvas_completed',         label: 'Canvas completed',             description: 'User fills all 9 business canvas blocks' },
  { value: 'investor_no_action_7_days', label: 'Investor inactive 7 days',   description: 'Investor signed up but made no connections in 7 days' },
  { value: 'review_request',           label: 'Review request',               description: 'User has been active for 30+ days' },
];

interface Template { id: string; name: string; subject: string }
interface Segment  { id: string; name: string }

interface FormState {
  name: string;
  trigger_type: string;
  delay_value: string;
  delay_unit: 'hours' | 'days';
  template_id: string;
  segment_id: string;
  frequency_cap: string;
  status: 'active' | 'paused';
}

const EMPTY: FormState = {
  name: '', trigger_type: '', delay_value: '0', delay_unit: 'hours',
  template_id: '', segment_id: '', frequency_cap: '1', status: 'paused',
};

export default function AdminAutomationForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();
  const { sessionToken } = useAdminAuth();
  const isEdit = !!id;

  const [form, setForm] = useState<FormState>(EMPTY);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState<Partial<FormState>>({});

  useEffect(() => {
    loadOptions();
    if (isEdit) loadAutomation();
  }, [id, sessionToken]);

  async function loadOptions() {
    if (!sessionToken) return;
    const [{ data: t }, { data: s }] = await Promise.all([
      adminDb(sessionToken, 'marketing_templates').select('id, name, subject', { order: { column: 'name' } }),
      adminDb(sessionToken, 'marketing_segments').select('id, name', { order: { column: 'name' } }),
    ]);
    setTemplates((t ?? []) as Template[]);
    setSegments((s ?? []) as Segment[]);
  }

  async function loadAutomation() {
    if (!sessionToken) return;
    const { data, error } = await adminDb(sessionToken, 'marketing_automations')
      .select('*', { match: { id }, single: true });
    if (error || !data) { navigate('/admin/marketing/automations'); return; }

    const row = data as Record<string, unknown>;
    const hours = Number(row.delay_hours ?? 0);
    const isInDays = hours > 0 && hours % 24 === 0;
    setForm({
      name: String(row.name ?? ''),
      trigger_type: String(row.trigger_type ?? ''),
      delay_value: isInDays ? String(hours / 24) : String(hours),
      delay_unit: isInDays ? 'days' : 'hours',
      template_id: String(row.template_id ?? ''),
      segment_id: String(row.segment_id ?? ''),
      frequency_cap: String(row.frequency_cap ?? 1),
      status: (row.status as 'active' | 'paused') ?? 'paused',
    });
  }

  function set(field: keyof FormState, value: string) {
    setForm(prev => ({ ...prev, [field]: value }));
    setErrors(prev => ({ ...prev, [field]: '' }));
  }

  function validate(): boolean {
    const e: Partial<FormState> = {};
    if (!form.name.trim())        e.name         = 'Name is required';
    if (!form.trigger_type)       e.trigger_type = 'Trigger is required';
    if (!form.template_id)        e.template_id  = 'Template is required';
    const cap = Number(form.frequency_cap);
    if (isNaN(cap) || cap < 1)    e.frequency_cap = 'Must be at least 1';
    const delay = Number(form.delay_value);
    if (isNaN(delay) || delay < 0) e.delay_value = 'Must be 0 or more';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function save() {
    if (!validate() || !sessionToken) return;
    setSaving(true);
    setError('');

    const delayHours = form.delay_unit === 'days'
      ? Number(form.delay_value) * 24
      : Number(form.delay_value);

    const payload = {
      name: form.name.trim(),
      trigger_type: form.trigger_type,
      delay_hours: delayHours,
      template_id: form.template_id || null,
      segment_id: form.segment_id || null,
      frequency_cap: Number(form.frequency_cap),
      status: form.status,
      updated_at: new Date().toISOString(),
    };

    let err;
    if (isEdit) {
      ({ error: err } = await adminDb(sessionToken, 'marketing_automations').update(payload, { id }));
    } else {
      ({ error: err } = await adminDb(sessionToken, 'marketing_automations').insert(payload));
    }

    setSaving(false);
    if (err) { setError(err); return; }
    navigate('/admin/marketing/automations');
  }

  const selectedTrigger = TRIGGERS.find(t => t.value === form.trigger_type);

  return (
    <AdminLayout>
      <Box sx={{ p: 3, bgcolor: '#FAF8F3', minHeight: '100vh' }}>
        <Stack direction="row" alignItems="center" gap={1} mb={3}>
          <Button
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/admin/marketing/automations')}
            sx={{ color: 'text.secondary', minWidth: 0, px: 1 }}
          >
            Automations
          </Button>
          <Typography variant="h5" fontWeight={800}>
            {isEdit ? 'Edit Automation' : 'New Automation'}
          </Typography>
        </Stack>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'grey.200', borderRadius: 2, maxWidth: 680 }}>
          <CardContent sx={{ p: 3 }}>

            {/* Name */}
            <Typography variant="subtitle2" fontWeight={700} mb={1}>Automation Name</Typography>
            <TextField
              fullWidth size="small"
              placeholder="e.g. Welcome Series — Day 3"
              value={form.name}
              onChange={e => set('name', e.target.value)}
              error={!!errors.name}
              helperText={errors.name}
              sx={{ mb: 3 }}
            />

            <Divider sx={{ mb: 3 }} />

            {/* Trigger */}
            <Typography variant="subtitle2" fontWeight={700} mb={1}>Trigger</Typography>
            <FormControl fullWidth size="small" error={!!errors.trigger_type} sx={{ mb: selectedTrigger ? 1 : 3 }}>
              <InputLabel>Trigger type</InputLabel>
              <Select
                value={form.trigger_type}
                label="Trigger type"
                onChange={e => set('trigger_type', e.target.value)}
              >
                {TRIGGERS.map(t => (
                  <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>
                ))}
              </Select>
              {errors.trigger_type && <FormHelperText>{errors.trigger_type}</FormHelperText>}
            </FormControl>
            {selectedTrigger && (
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 3 }}>
                {selectedTrigger.description}
              </Typography>
            )}

            {/* Delay */}
            <Typography variant="subtitle2" fontWeight={700} mb={1}>Send Delay</Typography>
            <Stack direction="row" gap={1} mb={3}>
              <TextField
                size="small" type="number"
                value={form.delay_value}
                onChange={e => set('delay_value', e.target.value)}
                error={!!errors.delay_value}
                helperText={errors.delay_value || 'Use 0 to send immediately'}
                InputProps={{ inputProps: { min: 0 } }}
                sx={{ width: 160 }}
              />
              <FormControl size="small" sx={{ width: 120 }}>
                <Select
                  value={form.delay_unit}
                  onChange={e => set('delay_unit', e.target.value as 'hours' | 'days')}
                >
                  <MenuItem value="hours">Hours</MenuItem>
                  <MenuItem value="days">Days</MenuItem>
                </Select>
              </FormControl>
              <Typography variant="body2" sx={{ alignSelf: 'center', color: 'text.secondary', ml: 1 }}>
                after trigger fires
              </Typography>
            </Stack>

            <Divider sx={{ mb: 3 }} />

            {/* Template */}
            <Typography variant="subtitle2" fontWeight={700} mb={1}>Email Template</Typography>
            <FormControl fullWidth size="small" error={!!errors.template_id} sx={{ mb: 3 }}>
              <InputLabel>Template</InputLabel>
              <Select
                value={form.template_id}
                label="Template"
                onChange={e => set('template_id', e.target.value)}
              >
                <MenuItem value=""><em>Select a template…</em></MenuItem>
                {templates.map(t => (
                  <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>
                ))}
              </Select>
              {errors.template_id
                ? <FormHelperText>{errors.template_id}</FormHelperText>
                : <FormHelperText>The email body that will be sent</FormHelperText>}
            </FormControl>

            {/* Audience filter */}
            <Typography variant="subtitle2" fontWeight={700} mb={1}>Audience Filter <Typography component="span" variant="caption" color="text.secondary">(optional)</Typography></Typography>
            <FormControl fullWidth size="small" sx={{ mb: 3 }}>
              <InputLabel>Segment</InputLabel>
              <Select
                value={form.segment_id}
                label="Segment"
                onChange={e => set('segment_id', e.target.value)}
              >
                <MenuItem value=""><em>All users (no filter)</em></MenuItem>
                {segments.map(s => (
                  <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>
                ))}
              </Select>
              <FormHelperText>Only trigger for users in this segment</FormHelperText>
            </FormControl>

            <Divider sx={{ mb: 3 }} />

            {/* Frequency cap */}
            <Typography variant="subtitle2" fontWeight={700} mb={1}>Frequency Cap</Typography>
            <TextField
              size="small" type="number"
              value={form.frequency_cap}
              onChange={e => set('frequency_cap', e.target.value)}
              error={!!errors.frequency_cap}
              helperText={errors.frequency_cap || 'Maximum times this automation can send to the same user'}
              InputProps={{
                inputProps: { min: 1 },
                endAdornment: <InputAdornment position="end">sends/user</InputAdornment>,
              }}
              sx={{ width: 220, mb: 3 }}
            />

            <Divider sx={{ mb: 3 }} />

            {/* Status toggle */}
            <Stack direction="row" alignItems="flex-start" justifyContent="space-between">
              <Box>
                <Typography variant="subtitle2" fontWeight={700}>Status</Typography>
                <Typography variant="caption" color="text.secondary">
                  {form.status === 'active'
                    ? 'This automation is live and will send emails when triggered.'
                    : 'Automation is paused. Activate to start sending.'}
                </Typography>
              </Box>
              <FormControlLabel
                control={
                  <Switch
                    checked={form.status === 'active'}
                    onChange={e => set('status', e.target.checked ? 'active' : 'paused')}
                    sx={{
                      '& .MuiSwitch-switchBase.Mui-checked': { color: '#2A8A52' },
                      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: '#2A8A52' },
                    }}
                  />
                }
                label={<Typography variant="body2" fontWeight={600} sx={{ color: form.status === 'active' ? '#2A8A52' : 'text.secondary' }}>{form.status === 'active' ? 'Active' : 'Paused'}</Typography>}
                labelPlacement="start"
              />
            </Stack>

            {form.status === 'active' && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                This automation will start sending emails immediately once saved.
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Save / Cancel */}
        <Stack direction="row" gap={2} mt={3}>
          <Button
            variant="contained"
            onClick={save}
            disabled={saving}
            startIcon={saving ? <CircularProgress size={16} color="inherit" /> : undefined}
            sx={{ bgcolor: '#1B6B3E', '&:hover': { bgcolor: '#0F3D24' } }}
          >
            {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Automation'}
          </Button>
          <Button variant="outlined" onClick={() => navigate('/admin/marketing/automations')}>
            Cancel
          </Button>
        </Stack>
      </Box>
    </AdminLayout>
  );
}
