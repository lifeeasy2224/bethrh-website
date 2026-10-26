import { useState, useEffect, useCallback, useRef } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Alert from '@mui/material/Alert';
import LinearProgress from '@mui/material/LinearProgress';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Collapse from '@mui/material/Collapse';
import SendIcon from '@mui/icons-material/Send';
import CloseIcon from '@mui/icons-material/Close';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import AdminLayout from '../../components/AdminLayout';
import { useAdminAuth, ADMIN_API } from '../../contexts/AdminAuthContext';
import { supabase } from '../../supabase';

// Approval queue for one-off emails sent from info@bethra.co.
// Drafts are prepared (by Claude or an admin) in public.outbound_emails;
// nothing leaves until an admin taps "Approve & send" here.

const OUTBOUND_API = ADMIN_API.replace(/\/admin-auth$/, '/outbound-email');
const BUCKET = 'email-assets';

interface Attachment { path: string; filename: string }
interface Outbound {
  id: string;
  created_at: string;
  created_by: string;
  purpose: string | null;
  status: 'pending_approval' | 'sending' | 'sent' | 'failed' | 'rejected';
  from_name: string;
  from_email: string;
  to_emails: string[];
  cc_emails: string[];
  bcc_emails: string[];
  subject: string;
  body_html: string;
  attachments: Attachment[];
  approved_by: string | null;
  sent_at: string | null;
  last_event: string | null;
  last_event_at: string | null;
  error: string | null;
}

const STATUS_META: Record<Outbound['status'], { label: string; color: string; bg: string }> = {
  pending_approval: { label: 'Awaiting approval', color: '#A07830', bg: '#F5EAD3' },
  sending:          { label: 'Sending',           color: '#1B6B3E', bg: '#F0F5F1' },
  sent:             { label: 'Sent',              color: '#1B6B3E', bg: '#DEEBE2' },
  failed:           { label: 'Failed',            color: '#C0392B', bg: '#FAF0EE' },
  rejected:         { label: 'Rejected',          color: '#8A8070', bg: '#F7F3EC' },
};

function fmt(d: string | null) {
  if (!d) return '';
  return new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

async function api<T>(sessionToken: string, action: string, payload: Record<string, unknown> = {}): Promise<T & { error?: string }> {
  const res = await fetch(OUTBOUND_API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` },
    body: JSON.stringify({ session_token: sessionToken, action, ...payload }),
  });
  return res.json();
}

function Recipients({ label, list }: { label: string; list: string[] }) {
  if (!list.length) return null;
  return (
    <Stack direction="row" spacing={1} alignItems="flex-start" sx={{ mb: 0.5 }}>
      <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ minWidth: 34, pt: 0.4 }}>{label}</Typography>
      <Stack direction="row" flexWrap="wrap" useFlexGap spacing={0.5}>
        {list.map(e => <Chip key={e} size="small" label={e} sx={{ fontSize: 12 }} />)}
      </Stack>
    </Stack>
  );
}

function OutboundCard({ item, sessionToken, onChanged }: { item: Outbound; sessionToken: string; onChanged: () => void }) {
  const [showPreview, setShowPreview] = useState(item.status === 'pending_approval');
  const [confirm, setConfirm] = useState<'approve' | 'reject' | null>(null);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const pending = item.status === 'pending_approval';
  const meta = STATUS_META[item.status];

  const openAttachment = async (a: Attachment) => {
    const r = await api<{ url?: string }>(sessionToken, 'attachment_url', { path: a.path });
    if (r.url) window.open(r.url, '_blank', 'noopener');
    else setMsg({ type: 'error', text: r.error ?? 'Could not open attachment' });
  };

  const saveAttachments = async (list: Attachment[]) => {
    const r = await api<{ ok?: boolean }>(sessionToken, 'set_attachments', { id: item.id, attachments: list });
    if (!r.ok) throw new Error(r.error ?? 'Could not save attachments');
    onChanged();
  };

  const onPickFile = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true); setMsg(null);
    try {
      const u = await api<{ path?: string; token?: string }>(sessionToken, 'upload_url', { filename: file.name });
      if (!u.path || !u.token) throw new Error(u.error ?? 'Could not prepare upload');
      const { error } = await supabase.storage.from(BUCKET).uploadToSignedUrl(u.path, u.token, file, { contentType: file.type || 'application/octet-stream' });
      if (error) throw new Error(error.message);
      await saveAttachments([...(item.attachments ?? []), { path: u.path, filename: file.name }]);
      setMsg({ type: 'success', text: `Attached ${file.name}` });
    } catch (e) {
      setMsg({ type: 'error', text: (e as Error).message });
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const removeAttachment = async (a: Attachment) => {
    setBusy(true); setMsg(null);
    try { await saveAttachments(item.attachments.filter(x => x.path !== a.path)); }
    catch (e) { setMsg({ type: 'error', text: (e as Error).message }); }
    finally { setBusy(false); }
  };

  const act = async () => {
    if (!confirm) return;
    setBusy(true); setMsg(null);
    const r = await api<{ ok?: boolean }>(sessionToken, confirm, confirm === 'reject' ? { id: item.id, reason } : { id: item.id });
    setBusy(false);
    setConfirm(null);
    if (r.ok) { setMsg({ type: 'success', text: confirm === 'approve' ? 'Sent.' : 'Rejected.' }); onChanged(); }
    else setMsg({ type: 'error', text: r.error ?? 'Something went wrong' });
  };

  return (
    <Card elevation={0} sx={{ border: '1px solid', borderColor: pending ? '#E8C07A' : 'grey.200', borderRadius: 2, p: { xs: 2, sm: 2.5 }, mb: 2 }}>
      {busy && <LinearProgress sx={{ mb: 1.5 }} />}
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={1} sx={{ mb: 1.5 }}>
        <Box sx={{ minWidth: 0 }}>
          <Typography fontWeight={800} sx={{ fontSize: 16, wordBreak: 'break-word' }} dir="auto">{item.subject}</Typography>
          {item.purpose && <Typography variant="body2" color="text.secondary" dir="auto">{item.purpose}</Typography>}
          <Typography variant="caption" color="text.secondary">
            From {item.from_name} &lt;{item.from_email}&gt; · prepared by {item.created_by} · {fmt(item.created_at)}
          </Typography>
        </Box>
        <Box>
          <Chip size="small" label={meta.label} sx={{ color: meta.color, bgcolor: meta.bg, fontWeight: 700 }} />
        </Box>
      </Stack>

      <Recipients label="To" list={item.to_emails} />
      <Recipients label="CC" list={item.cc_emails} />
      <Recipients label="BCC" list={item.bcc_emails} />

      <Stack direction="row" flexWrap="wrap" useFlexGap spacing={1} sx={{ mt: 1.5 }}>
        {(item.attachments ?? []).map(a => (
          <Chip
            key={a.path}
            icon={<DescriptionOutlinedIcon />}
            label={a.filename}
            onClick={() => void openAttachment(a)}
            onDelete={pending ? () => void removeAttachment(a) : undefined}
            variant="outlined"
          />
        ))}
        {pending && (
          <>
            <input ref={fileRef} type="file" hidden onChange={e => void onPickFile(e.target.files?.[0])} />
            <Button size="small" startIcon={<AttachFileIcon />} disabled={busy} onClick={() => fileRef.current?.click()}>Attach file</Button>
          </>
        )}
      </Stack>

      {item.status === 'sent' && (
        <Typography variant="body2" sx={{ mt: 1.5 }} color="text.secondary">
          Sent {fmt(item.sent_at)}{item.approved_by ? ` · approved by ${item.approved_by}` : ''}
          {item.last_event && item.last_event !== 'sent' ? ` · last event: ${item.last_event} (${fmt(item.last_event_at)})` : ''}
        </Typography>
      )}
      {item.error && <Alert severity={item.status === 'rejected' ? 'info' : 'error'} sx={{ mt: 1.5 }}>{item.error}</Alert>}
      {msg && <Alert severity={msg.type} sx={{ mt: 1.5 }} onClose={() => setMsg(null)}>{msg.text}</Alert>}

      <Stack direction="row" spacing={1} sx={{ mt: 2 }} flexWrap="wrap" useFlexGap>
        <Button size="small" startIcon={<VisibilityOutlinedIcon />} onClick={() => setShowPreview(v => !v)}>
          {showPreview ? 'Hide preview' : 'Preview'}
        </Button>
        {pending && (
          <>
            <Box sx={{ flex: 1 }} />
            <Button size="small" color="inherit" startIcon={<CloseIcon />} disabled={busy} onClick={() => setConfirm('reject')}>Reject</Button>
            <Button variant="contained" startIcon={<SendIcon />} disabled={busy} onClick={() => setConfirm('approve')}
              sx={{ bgcolor: '#0F3D24', '&:hover': { bgcolor: '#1B6B3E' } }}>
              Approve &amp; send
            </Button>
          </>
        )}
      </Stack>

      <Collapse in={showPreview} unmountOnExit>
        <Box sx={{ mt: 2, border: '1px solid', borderColor: 'grey.200', borderRadius: 2, overflow: 'hidden', bgcolor: '#F7F3EC' }}>
          <iframe title={`preview-${item.id}`} srcDoc={item.body_html} sandbox="" style={{ width: '100%', height: 720, border: 0, display: 'block' }} />
        </Box>
      </Collapse>

      <Dialog open={confirm !== null} onClose={() => !busy && setConfirm(null)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ pr: 6 }}>
          {confirm === 'approve' ? 'Send this email now?' : 'Reject this email?'}
          <IconButton onClick={() => setConfirm(null)} sx={{ position: 'absolute', right: 8, top: 8 }} disabled={busy}><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent>
          {confirm === 'approve' ? (
            <Stack spacing={1}>
              <Typography variant="body2" dir="auto"><b>{item.subject}</b></Typography>
              <Typography variant="body2">To: {item.to_emails.join(', ')}</Typography>
              {item.cc_emails.length > 0 && <Typography variant="body2">CC: {item.cc_emails.join(', ')}</Typography>}
              {item.bcc_emails.length > 0 && <Typography variant="body2">BCC: {item.bcc_emails.join(', ')}</Typography>}
              <Typography variant="body2">Attachments: {item.attachments?.length ? item.attachments.map(a => a.filename).join(', ') : 'none'}</Typography>
              <Alert severity="warning" sx={{ mt: 1 }}>A sent email cannot be recalled.</Alert>
            </Stack>
          ) : (
            <TextField label="Reason (optional)" fullWidth multiline minRows={2} value={reason} onChange={e => setReason(e.target.value)} sx={{ mt: 1 }} />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirm(null)} disabled={busy}>Cancel</Button>
          <Button variant="contained" onClick={() => void act()} disabled={busy}
            color={confirm === 'reject' ? 'error' : 'primary'}
            sx={confirm === 'approve' ? { bgcolor: '#0F3D24', '&:hover': { bgcolor: '#1B6B3E' } } : undefined}>
            {confirm === 'approve' ? 'Send now' : 'Reject'}
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
}

const TABS: { key: string; label: string; status?: Outbound['status'] }[] = [
  { key: 'pending', label: 'Awaiting approval', status: 'pending_approval' },
  { key: 'sent', label: 'Sent', status: 'sent' },
  { key: 'all', label: 'All' },
];

export default function AdminOutboxPage() {
  const { sessionToken } = useAdminAuth();
  const [tab, setTab] = useState(0);
  const [items, setItems] = useState<Outbound[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!sessionToken) return;
    setLoading(true); setError(null);
    const status = TABS[tab].status;
    const r = await api<{ data?: Outbound[] }>(sessionToken, 'list', status ? { status } : {});
    if (r.error) setError(r.error);
    setItems(r.data ?? []);
    setLoading(false);
  }, [sessionToken, tab]);

  useEffect(() => { void load(); }, [load]);

  return (
    <AdminLayout>
      <Box sx={{ p: { xs: 1.5, sm: 3 }, bgcolor: '#FAF8F3', minHeight: '100vh' }}>
        <Box sx={{ mb: 2 }}>
          <Typography variant="h5" fontWeight={800}>Outbox</Typography>
          <Typography variant="body2" color="text.secondary">
            Emails prepared for sending from info@bethra.co. Nothing is sent until you approve it.
          </Typography>
        </Box>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable" allowScrollButtonsMobile sx={{ mb: 2 }}>
          {TABS.map(t => <Tab key={t.key} label={t.label} />)}
        </Tabs>
        {loading && <LinearProgress sx={{ mb: 2 }} />}
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {!loading && !error && items.length === 0 && (
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'grey.200', borderRadius: 2, p: 4, textAlign: 'center' }}>
            <Typography color="text.secondary">Nothing here.</Typography>
          </Card>
        )}
        {sessionToken && items.map(item => (
          <OutboundCard key={`${item.id}-${item.status}-${(item.attachments ?? []).length}`} item={item} sessionToken={sessionToken} onChanged={() => void load()} />
        ))}
      </Box>
    </AdminLayout>
  );
}
