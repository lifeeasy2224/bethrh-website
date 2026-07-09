import { useState, useEffect, useRef } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormLabel from '@mui/material/FormLabel';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import SendOutlinedIcon from '@mui/icons-material/SendOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import PeopleOutlinedIcon from '@mui/icons-material/PeopleOutlined';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/AdminLayout';
import { supabase } from '../../supabase';
import { adminDb } from '../../lib/adminDb';
import { useAdminAuth } from '../../contexts/AdminAuthContext';

const STEPS = ['Setup', 'Audience', 'Content', 'Preview', 'Send'];

interface Segment { id: string; name: string; type: string; user_count: number; }
interface Template { id: string; name: string; subject: string; body_html: string; preview_text: string | null; }

interface AudienceUser {
  user_id: string;
  full_name: string | null;
  email: string;
}

export default function AdminCampaignNew() {
  const navigate = useNavigate();
  const { sessionToken } = useAdminAuth();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 1 – Setup
  const [campaignName, setCampaignName] = useState('');
  const [fromName, setFromName] = useState('Team');
  const [fromEmail, setFromEmail] = useState('');
  const [replyTo, setReplyTo] = useState('');

  // Step 2 – Audience
  const [segments, setSegments] = useState<Segment[]>([]);
  const [selectedSegment, setSelectedSegment] = useState('');
  const [audienceUsers, setAudienceUsers] = useState<AudienceUser[]>([]);
  const [audienceLoading, setAudienceLoading] = useState(false);
  const [abEnabled, setAbEnabled] = useState(false);
  const [abSplit, setAbSplit] = useState<'50_50' | '30_30_40'>('50_50');

  // Step 3 – Content
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [subject, setSubject] = useState('');
  const [previewText, setPreviewText] = useState('');
  const [bodyHtml, setBodyHtml] = useState('');
  const [abSubjectB, setAbSubjectB] = useState('');

  // Step 5 – Send
  const [sendMode, setSendMode] = useState<'now' | 'schedule'>('now');
  const [scheduledAt, setScheduledAt] = useState('');

  const loadedRef = useRef(false);

  useEffect(() => {
    if (loadedRef.current || !sessionToken) return;
    loadedRef.current = true;
    void (async () => {
      const [{ data: segData }, { data: tplData }, { data: profileData }] = await Promise.all([
        adminDb(sessionToken, 'marketing_segments').select('id,name,type,user_count', { order: { column: 'name' } }),
        adminDb(sessionToken, 'marketing_templates').select('id,name,subject,body_html,preview_text', { order: { column: 'name' } }),
        adminDb(sessionToken, 'profiles').select('user_id', { limit: 1 }),
      ]);
      setSegments((segData ?? []) as Segment[]);
      setTemplates((tplData ?? []) as Template[]);
      // set default from_email from settings if available
      void profileData;
    })();
  }, [sessionToken]);

  useEffect(() => {
    if (!selectedSegment) { setAudienceUsers([]); return; }
    if (!sessionToken) return;
    setAudienceLoading(true);
    void (async () => {
      const seg = segments.find(s => s.id === selectedSegment);
      if (!seg) { setAudienceLoading(false); return; }
      if (seg.type === 'manual') {
        const { data } = await adminDb(sessionToken, 'segment_members')
          .select('user_id, profiles!inner(full_name, user_id)', { match: { segment_id: selectedSegment }, limit: 10 });
        const users = (data ?? []).map((r: { user_id: string; profiles: unknown }) => ({
          user_id: r.user_id,
          full_name: (r.profiles as { full_name: string | null } | null)?.full_name ?? null,
          email: '',
        }));
        setAudienceUsers(users);
      } else {
        // For smart segments, fetch enriched users and evaluate
        const { data: profiles } = await adminDb(sessionToken, 'enriched_users')
          .select('user_id,full_name', { limit: 10 });
        setAudienceUsers((profiles ?? []).map((p: { user_id: string; full_name: string | null }) => ({ user_id: p.user_id, full_name: p.full_name, email: '' })));
      }
      setAudienceLoading(false);
    })();
  }, [selectedSegment, segments, sessionToken]);

  function handleTemplateSelect(id: string) {
    setSelectedTemplate(id);
    const tpl = templates.find(t => t.id === id);
    if (tpl) {
      setSubject(tpl.subject);
      setPreviewText(tpl.preview_text ?? '');
      setBodyHtml(tpl.body_html);
    }
  }

  function canProceed() {
    if (step === 0) return campaignName.trim() && fromName.trim() && fromEmail.trim();
    if (step === 1) return Boolean(selectedSegment);
    if (step === 2) return subject.trim() && bodyHtml.trim();
    return true;
  }

  async function handleSend() {
    if (!sessionToken) return;
    setSaving(true);
    setError(null);
    const seg = segments.find(s => s.id === selectedSegment);
    const abVariants = abEnabled
      ? abSplit === '50_50'
        ? [{ label: 'A', subject, split: 50 }, { label: 'B', subject: abSubjectB, split: 50 }]
        : [{ label: 'A', subject, split: 30 }, { label: 'B', subject: abSubjectB, split: 30 }, { label: 'C', subject, split: 40 }]
      : null;

    const { data: campaign, error: insertErr } = await adminDb(sessionToken, 'marketing_campaigns').insert({
      name: campaignName.trim(),
      subject: subject.trim(),
      preview_text: previewText.trim() || null,
      body_html: bodyHtml,
      from_name: fromName.trim(),
      from_email: fromEmail.trim(),
      reply_to: replyTo.trim() || null,
      segment_id: selectedSegment || null,
      status: sendMode === 'now' ? 'sending' : 'scheduled',
      send_mode: sendMode,
      scheduled_at: sendMode === 'schedule' && scheduledAt ? new Date(scheduledAt).toISOString() : null,
      ab_enabled: abEnabled,
      ab_variants: abVariants,
      total_recipients: seg?.user_count ?? 0,
    }, { returning: 'id', single: true });

    if (insertErr || !campaign) {
      setError(insertErr ?? 'Failed to create campaign');
      setSaving(false);
      return;
    }

    if (sendMode === 'now') {
      // Trigger edge function
      await supabase.functions.invoke('send-campaign', { body: { campaign_id: campaign.id } });
    }

    setSaving(false);
    setSaved(true);
  }

  if (saved) {
    return (
      <AdminLayout>
        <Box sx={{ p: 6, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          <CheckCircleOutlineIcon sx={{ fontSize: 64, color: '#2A8A52' }} />
          <Typography variant="h5" fontWeight={800}>
            {sendMode === 'now' ? 'Campaign Sending!' : 'Campaign Scheduled!'}
          </Typography>
          <Typography color="text.secondary">
            {sendMode === 'now' ? 'Your campaign is being delivered to recipients.' : `Scheduled for ${scheduledAt}.`}
          </Typography>
          <Button variant="contained" onClick={() => navigate('/admin/marketing/campaigns')}>View All Campaigns</Button>
        </Box>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <Box sx={{ p: 3, bgcolor: '#FAF8F3', minHeight: '100vh' }}>
        {/* Header */}
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 3 }}>
          <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/admin/marketing/campaigns')} size="small" sx={{ color: 'text.secondary' }}>
            Back
          </Button>
          <Typography variant="h5" fontWeight={800}>New Campaign</Typography>
        </Stack>

        {/* Stepper */}
        <Stepper activeStep={step} sx={{ mb: 4, maxWidth: 700 }}>
          {STEPS.map(label => (
            <Step key={label}><StepLabel>{label}</StepLabel></Step>
          ))}
        </Stepper>

        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'grey.200', p: 3, maxWidth: 800 }}>
          {/* STEP 0 — Setup */}
          {step === 0 && (
            <Stack spacing={2.5}>
              <Typography variant="h6" fontWeight={700}>Campaign Setup</Typography>
              <TextField label="Campaign Name" size="small" fullWidth value={campaignName} onChange={e => setCampaignName(e.target.value)} placeholder="e.g. June Newsletter" />
              <Stack direction="row" spacing={2}>
                <TextField label="From Name" size="small" fullWidth value={fromName} onChange={e => setFromName(e.target.value)} />
                <TextField label="From Email" size="small" fullWidth value={fromEmail} onChange={e => setFromEmail(e.target.value)} type="email" placeholder="info@bethra.co" />
              </Stack>
              <TextField label="Reply-To Email (optional)" size="small" fullWidth value={replyTo} onChange={e => setReplyTo(e.target.value)} type="email" />
            </Stack>
          )}

          {/* STEP 1 — Audience */}
          {step === 1 && (
            <Stack spacing={2.5}>
              <Typography variant="h6" fontWeight={700}>Select Audience</Typography>
              <FormControl size="small" fullWidth>
                <InputLabel>Segment</InputLabel>
                <Select value={selectedSegment} label="Segment" onChange={e => setSelectedSegment(e.target.value)}>
                  {segments.map(s => (
                    <MenuItem key={s.id} value={s.id}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <span>{s.name}</span>
                        <Chip label={`${s.user_count} users`} size="small" sx={{ height: 18, fontSize: '0.65rem' }} />
                        <Chip label={s.type} size="small" sx={{ height: 18, fontSize: '0.65rem', bgcolor: s.type === 'smart' ? '#F0F5F1' : '#F0F5F1', color: s.type === 'smart' ? '#1B6B3E' : '#2A8A52' }} />
                      </Stack>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {selectedSegment && (
                <Box sx={{ bgcolor: '#FAF8F3', border: '1px solid', borderColor: 'grey.200', borderRadius: 1.5, p: 2 }}>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                    <PeopleOutlinedIcon sx={{ fontSize: 16, color: '#1B6B3E' }} />
                    <Typography variant="body2" fontWeight={700}>
                      {audienceLoading ? 'Loading...' : `${segments.find(s => s.id === selectedSegment)?.user_count ?? 0} recipients`}
                    </Typography>
                  </Stack>
                  {audienceLoading ? <CircularProgress size={16} /> : (
                    <Typography variant="caption" color="text.secondary">
                      Preview: {audienceUsers.slice(0, 5).map(u => u.full_name ?? u.user_id).join(', ')}
                      {audienceUsers.length > 5 ? ` and ${audienceUsers.length - 5} more...` : ''}
                    </Typography>
                  )}
                </Box>
              )}

              <Divider />
              <Typography variant="subtitle2" fontWeight={700}>A/B Testing</Typography>
              <FormControlLabel control={<Switch checked={abEnabled} onChange={e => setAbEnabled(e.target.checked)} />} label="Enable A/B Test" />
              {abEnabled && (
                <FormControl>
                  <FormLabel sx={{ fontSize: '0.8rem', fontWeight: 600, color: 'text.primary', mb: 0.5 }}>Split Ratio</FormLabel>
                  <RadioGroup row value={abSplit} onChange={e => setAbSplit(e.target.value as typeof abSplit)}>
                    <FormControlLabel value="50_50" control={<Radio size="small" />} label="50% / 50% (2 variants)" />
                    <FormControlLabel value="30_30_40" control={<Radio size="small" />} label="30% / 30% / 40% (3 variants)" />
                  </RadioGroup>
                </FormControl>
              )}
            </Stack>
          )}

          {/* STEP 2 — Content */}
          {step === 2 && (
            <Stack spacing={2.5}>
              <Typography variant="h6" fontWeight={700}>Email Content</Typography>
              <FormControl size="small" fullWidth>
                <InputLabel>Start from Template (optional)</InputLabel>
                <Select value={selectedTemplate} label="Start from Template (optional)" onChange={e => handleTemplateSelect(e.target.value)}>
                  <MenuItem value=""><em>Blank</em></MenuItem>
                  {templates.map(t => <MenuItem key={t.id} value={t.id}>{t.name}</MenuItem>)}
                </Select>
              </FormControl>
              <TextField label="Subject Line" size="small" fullWidth value={subject} onChange={e => setSubject(e.target.value)} placeholder="Use {{first_name}} for personalization" />
              {abEnabled && (
                <TextField label={abSplit === '50_50' ? 'Subject Line (Variant B)' : 'Subject Line (Variant B)'} size="small" fullWidth value={abSubjectB} onChange={e => setAbSubjectB(e.target.value)} />
              )}
              <TextField label="Preview Text" size="small" fullWidth value={previewText} onChange={e => setPreviewText(e.target.value)} placeholder="Short summary shown in inbox preview" />
              <TextField
                label="HTML Body"
                multiline rows={12} size="small" fullWidth value={bodyHtml}
                onChange={e => setBodyHtml(e.target.value)}
                placeholder="<h1>Hello {{first_name}}!</h1><p>Your message here.</p>"
                sx={{ '& textarea': { fontFamily: 'monospace', fontSize: '0.8rem' } }}
              />
              <Typography variant="caption" color="text.secondary">
                Variables: {'{{first_name}}'}, {'{{full_name}}'}, {'{{email}}'}, {'{{app_name}}'}, {'{{cta_url}}'}
              </Typography>
            </Stack>
          )}

          {/* STEP 3 — Preview */}
          {step === 3 && (
            <Stack spacing={2.5}>
              <Typography variant="h6" fontWeight={700}>Preview</Typography>
              <Box sx={{ bgcolor: '#F7F3EC', borderRadius: 1.5, p: 2 }}>
                <Stack spacing={0.5}>
                  <Typography variant="caption" color="text.secondary">From: <strong>{fromName} &lt;{fromEmail}&gt;</strong></Typography>
                  <Typography variant="caption" color="text.secondary">Subject: <strong>{subject}</strong></Typography>
                  {previewText && <Typography variant="caption" color="text.secondary">Preview: <em>{previewText}</em></Typography>}
                  <Typography variant="caption" color="text.secondary">
                    To: {segments.find(s => s.id === selectedSegment)?.name ?? 'No segment selected'} ({segments.find(s => s.id === selectedSegment)?.user_count ?? 0} recipients)
                  </Typography>
                  {abEnabled && <Chip label={`A/B Test: ${abSplit === '50_50' ? '2 variants' : '3 variants'}`} size="small" sx={{ width: 'fit-content', bgcolor: '#F5EAD3', color: '#D08A28', fontWeight: 700 }} />}
                </Stack>
              </Box>
              <Box sx={{ border: '1px solid', borderColor: 'grey.200', borderRadius: 1.5, p: 2, bgcolor: 'white', maxHeight: 400, overflow: 'auto' }}
                dangerouslySetInnerHTML={{ __html: bodyHtml }} />
            </Stack>
          )}

          {/* STEP 4 — Send */}
          {step === 4 && (
            <Stack spacing={2.5}>
              <Typography variant="h6" fontWeight={700}>Send Campaign</Typography>

              {/* Summary table */}
              <Table size="small">
                <TableBody>
                  {[
                    ['Campaign Name', campaignName],
                    ['From', `${fromName} <${fromEmail}>`],
                    ['Subject', subject],
                    ['Audience', `${segments.find(s => s.id === selectedSegment)?.name ?? '—'} (${segments.find(s => s.id === selectedSegment)?.user_count ?? 0} recipients)`],
                    ['A/B Test', abEnabled ? `Yes — ${abSplit === '50_50' ? '50/50' : '30/30/40'} split` : 'No'],
                  ].map(([label, value]) => (
                    <TableRow key={label}>
                      <TableCell sx={{ fontWeight: 600, color: 'text.secondary', width: 140, border: 0, py: 0.75 }}>{label}</TableCell>
                      <TableCell sx={{ border: 0, py: 0.75 }}>{value}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <Divider />

              <FormControl>
                <FormLabel sx={{ fontSize: '0.85rem', fontWeight: 700, color: 'text.primary', mb: 0.5 }}>Send Time</FormLabel>
                <RadioGroup value={sendMode} onChange={e => setSendMode(e.target.value as 'now' | 'schedule')}>
                  <FormControlLabel value="now" control={<Radio size="small" />} label="Send now" />
                  <FormControlLabel value="schedule" control={<Radio size="small" />} label="Schedule for later" />
                </RadioGroup>
              </FormControl>

              {sendMode === 'schedule' && (
                <TextField label="Schedule Date & Time" size="small" type="datetime-local" value={scheduledAt} onChange={e => setScheduledAt(e.target.value)}
                  InputLabelProps={{ shrink: true }} sx={{ maxWidth: 280 }} />
              )}

              {error && <Alert severity="error">{error}</Alert>}
            </Stack>
          )}

          {/* Navigation */}
          <Stack direction="row" justifyContent="space-between" sx={{ mt: 4 }}>
            <Button onClick={() => setStep(s => s - 1)} disabled={step === 0} startIcon={<ArrowBackIcon />}>
              Back
            </Button>
            {step < STEPS.length - 1 ? (
              <Button variant="contained" onClick={() => setStep(s => s + 1)} disabled={!canProceed()} endIcon={<ArrowForwardIcon />}>
                Continue
              </Button>
            ) : (
              <Button
                variant="contained" color={sendMode === 'now' ? 'primary' : 'success'}
                onClick={handleSend} disabled={saving}
                startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <SendOutlinedIcon />}
              >
                {sendMode === 'now' ? 'Send Now' : 'Schedule Campaign'}
              </Button>
            )}
          </Stack>
        </Card>
      </Box>
    </AdminLayout>
  );
}
