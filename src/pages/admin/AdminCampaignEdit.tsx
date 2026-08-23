import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import Divider from '@mui/material/Divider';
import LinearProgress from '@mui/material/LinearProgress';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SendOutlinedIcon from '@mui/icons-material/SendOutlined';
import AdminLayout from '../../components/AdminLayout';
import { adminDb } from '../../lib/adminDb';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import SendCampaignDialog from './SendCampaignDialog';

interface Segment { id: string; name: string; }
interface AbVariant { label: string; subject: string; split: number; }
interface Campaign {
  id: string; name: string; subject: string | null;
  preview_text: string | null; body_html: string | null;
  from_name: string | null; from_email: string | null; reply_to: string | null;
  segment_id: string | null; ab_enabled: boolean | null; ab_variants: AbVariant[] | null;
  status: string | null;
}

export default function AdminCampaignEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { sessionToken } = useAdminAuth();

  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; sev: 'success' | 'error' } | null>(null);

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [sendTarget, setSendTarget] = useState<Campaign | null>(null);

  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [previewText, setPreviewText] = useState('');
  const [bodyHtml, setBodyHtml] = useState('');
  const [fromName, setFromName] = useState('');
  const [fromEmail, setFromEmail] = useState('');
  const [replyTo, setReplyTo] = useState('');
  const [segmentId, setSegmentId] = useState('');
  const [abEnabled, setAbEnabled] = useState(false);
  const [abSubjectB, setAbSubjectB] = useState('');

  const load = useCallback(async () => {
    if (!id || !sessionToken) return;
    setLoading(true);
    const [{ data: c }, { data: segs }] = await Promise.all([
      adminDb(sessionToken, 'marketing_campaigns').select('*', { match: { id }, single: true }),
      adminDb(sessionToken, 'marketing_segments').select('id,name', { order: { column: 'name', ascending: true } }),
    ]);
    setSegments((segs ?? []) as Segment[]);
    if (!c) { setNotFound(true); setLoading(false); return; }
    const camp = c as Campaign;
    setCampaign(camp);
    setName(camp.name ?? '');
    setSubject(camp.subject ?? '');
    setPreviewText(camp.preview_text ?? '');
    setBodyHtml(camp.body_html ?? '');
    setFromName(camp.from_name ?? '');
    setFromEmail(camp.from_email ?? '');
    setReplyTo(camp.reply_to ?? '');
    setSegmentId(camp.segment_id ?? '');
    setAbEnabled(!!camp.ab_enabled);
    setAbSubjectB(camp.ab_variants?.find(v => v.label === 'B')?.subject ?? '');
    setLoading(false);
  }, [id, sessionToken]);

  useEffect(() => { void load(); }, [load]);

  async function save() {
    if (!id || !sessionToken || !campaign) return;
    if (!name.trim()) { setToast({ msg: 'Campaign name is required.', sev: 'error' }); return; }
    setSaving(true);
    // 2-way A/B when enabled; otherwise no variants.
    const ab_variants: AbVariant[] | null = abEnabled
      ? [{ label: 'A', subject: subject.trim(), split: 50 }, { label: 'B', subject: abSubjectB.trim(), split: 50 }]
      : null;
    const { error } = await adminDb(sessionToken, 'marketing_campaigns').update({
      name: name.trim(),
      subject: subject.trim() || null,
      preview_text: previewText.trim() || null,
      body_html: bodyHtml,
      from_name: fromName.trim() || null,
      from_email: fromEmail.trim() || null,
      reply_to: replyTo.trim() || null,
      segment_id: segmentId || null,
      ab_enabled: abEnabled,
      ab_variants,
      updated_at: new Date().toISOString(),
    }, { id });
    setSaving(false);
    if (error) { setToast({ msg: `Save failed: ${error}`, sev: 'error' }); return; }
    setToast({ msg: 'Campaign saved.', sev: 'success' });
    void load();
  }

  if (loading) return <AdminLayout><LinearProgress /></AdminLayout>;
  if (notFound) return (
    <AdminLayout>
      <Box sx={{ p: 3 }}>
        <Typography variant="h6">Campaign not found.</Typography>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/admin/marketing/campaigns')} sx={{ mt: 2 }}>Back to Campaigns</Button>
      </Box>
    </AdminLayout>
  );

  return (
    <AdminLayout>
      <Box sx={{ p: 3, bgcolor: '#FAF8F3', minHeight: '100vh' }}>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 3 }}>
          <IconButton size="small" onClick={() => navigate('/admin/marketing/campaigns')}><ArrowBackIcon /></IconButton>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h5" fontWeight={800}>Edit Campaign</Typography>
            <Typography variant="body2" color="text.secondary">{campaign?.status ? `Status: ${campaign.status}` : ''}</Typography>
          </Box>
          {campaign && ['draft', 'scheduled'].includes(campaign.status ?? '') && (
            <Button
              variant="outlined"
              startIcon={<SendOutlinedIcon />}
              onClick={() => campaign && setSendTarget(campaign)}
              disabled={saving}
              sx={{ borderColor: '#1B6B3E', color: '#1B6B3E', '&:hover': { borderColor: '#2A8A52', bgcolor: '#F0F5F1' } }}
            >
              Send
            </Button>
          )}
          <Button variant="contained" onClick={() => void save()} disabled={saving} sx={{ bgcolor: '#1B6B3E', '&:hover': { bgcolor: '#2A8A52' } }}>
            {saving ? 'Saving…' : 'Save'}
          </Button>
        </Stack>

        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'grey.200', p: 3, maxWidth: 820 }}>
          <Stack spacing={2.5}>
            <TextField label="Campaign Name" size="small" fullWidth value={name} onChange={e => setName(e.target.value)} />

            <FormControl size="small" fullWidth>
              <InputLabel>Segment</InputLabel>
              <Select label="Segment" value={segmentId} onChange={e => setSegmentId(e.target.value)}>
                <MenuItem value=""><em>None</em></MenuItem>
                {segments.map(s => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
              </Select>
            </FormControl>

            <Divider>Sender</Divider>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField label="From Name" size="small" fullWidth value={fromName} onChange={e => setFromName(e.target.value)} />
              <TextField label="From Email" size="small" fullWidth value={fromEmail} onChange={e => setFromEmail(e.target.value)} placeholder="hello@bethra.co" />
            </Stack>
            <TextField label="Reply-To (optional)" size="small" fullWidth value={replyTo} onChange={e => setReplyTo(e.target.value)} />

            <Divider>Content</Divider>
            <TextField label="Subject" size="small" fullWidth value={subject} onChange={e => setSubject(e.target.value)} />
            <TextField label="Preview Text (optional)" size="small" fullWidth value={previewText} onChange={e => setPreviewText(e.target.value)} />
            <TextField label="Body (HTML)" size="small" fullWidth multiline minRows={12} value={bodyHtml} onChange={e => setBodyHtml(e.target.value)}
              sx={{ '& textarea': { fontFamily: 'monospace', fontSize: '0.82rem' } }} />

            <Divider>A/B Test</Divider>
            <FormControlLabel control={<Switch checked={abEnabled} onChange={e => setAbEnabled(e.target.checked)} />} label="Enable A/B subject test (50/50)" />
            {abEnabled && (
              <TextField label="Variant B Subject" size="small" fullWidth value={abSubjectB} onChange={e => setAbSubjectB(e.target.value)}
                helperText="Variant A uses the Subject above." />
            )}
          </Stack>
        </Card>
      </Box>

      <Snackbar open={!!toast} autoHideDuration={4000} onClose={() => setToast(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={toast?.sev ?? 'success'} variant="filled" onClose={() => setToast(null)}>{toast?.msg}</Alert>
      </Snackbar>

      <SendCampaignDialog
        campaign={sendTarget}
        sessionToken={sessionToken}
        onClose={() => setSendTarget(null)}
        onSent={() => { setSendTarget(null); void load(); }}
      />
    </AdminLayout>
  );
}
