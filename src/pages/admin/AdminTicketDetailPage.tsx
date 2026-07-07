import { useState, useEffect, useRef } from 'react';
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
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Avatar from '@mui/material/Avatar';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import Menu from '@mui/material/Menu';
import ListItemText from '@mui/material/ListItemText';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SendIcon from '@mui/icons-material/Send';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import ArticleOutlinedIcon from '@mui/icons-material/ArticleOutlined';
import { useAdminAuth, ADMIN_API } from '../../contexts/AdminAuthContext';

const STATUS_OPTIONS = [
  { value: 'open', label: 'New', color: '#2A8A52', bg: 'rgba(42, 138, 82,0.1)' },
  { value: 'in_progress', label: 'In Progress', color: '#D08A28', bg: 'rgba(208, 138, 40,0.1)' },
  { value: 'resolved', label: 'Resolved', color: '#2A8A52', bg: 'rgba(42, 138, 82,0.1)' },
  { value: 'closed', label: 'Closed', color: '#8A8070', bg: 'rgba(138, 128, 112,0.1)' },
];

const PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low', color: '#8A8070' },
  { value: 'normal', label: 'Medium', color: '#D08A28' },
  { value: 'high', label: 'High', color: '#D08A28' },
  { value: 'urgent', label: 'Critical', color: '#C0392B' },
];

const REPLY_TEMPLATES = [
  { label: 'Password Reset Sent', body: 'We have sent a password reset link to your registered email address. Please check your inbox (and spam folder). The link expires in 1 hour.' },
  { label: 'Account Verified', body: 'Your account has been verified. You should now have full access to all features. Please try logging in again.' },
  { label: 'Bug Acknowledged', body: 'Thank you for reporting this issue. We have logged it and our engineering team is investigating. We will keep you updated on the progress.' },
  { label: 'Feature Request Noted', body: 'Thank you for your suggestion! We have added it to our product roadmap for review. We appreciate your feedback in helping us improve the platform.' },
  { label: 'General Acknowledgment', body: 'Thank you for reaching out to Bethra support. We have received your message and will respond within 24 hours. We appreciate your patience.' },
];

interface Ticket {
  id: string;
  ticket_number: number;
  user_id: string | null;
  subject: string;
  body: string;
  status: string;
  priority: string;
  category: string;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
}

interface Reply {
  id: string;
  ticket_id: string;
  sender_type: 'admin' | 'user';
  sender_id: string;
  sender_name: string;
  body: string;
  created_at: string;
}

interface AdminUser {
  id: string;
  full_name: string;
  role: string;
}

interface UserProfile {
  full_name: string;
  email: string | null;
  role: string;
  plan: string;
  status: string;
  created_at: string;
}

function initials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

const CATEGORY_LABELS: Record<string, string> = {
  login: '🔐 Login Issues', account_recovery: '🔑 Account Recovery',
  billing: '💳 Billing', bug: '🐛 Bug Report', other: '📋 Other',
};

export default function AdminTicketDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { sessionToken } = useAdminAuth();

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [adminList, setAdminList] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [replyBody, setReplyBody] = useState('');
  const [replyStatus, setReplyStatus] = useState('');
  const [sending, setSending] = useState(false);

  const [templateAnchor, setTemplateAnchor] = useState<HTMLElement | null>(null);
  const [snack, setSnack] = useState<{ msg: string; sev: 'success' | 'error' } | null>(null);

  const threadRef = useRef<HTMLDivElement>(null);

  async function loadTicket() {
    if (!id || !sessionToken) return;
    setLoading(true);
    try {
      const res = await fetch(`${ADMIN_API}/ticket-detail`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` },
        body: JSON.stringify({ session_token: sessionToken, ticket_id: id }),
      });
      const data = await res.json() as {
        ticket: Ticket; replies: Reply[]; user_profile: UserProfile | null;
        admin_list: AdminUser[]; error?: string;
      };
      if (!res.ok) throw new Error(data.error ?? 'Load failed');
      setTicket(data.ticket);
      setReplies(data.replies ?? []);
      setUserProfile(data.user_profile);
      setAdminList(data.admin_list ?? []);
      setReplyStatus(data.ticket.status);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void loadTicket(); }, [id, sessionToken]);

  useEffect(() => {
    if (threadRef.current) {
      threadRef.current.scrollTop = threadRef.current.scrollHeight;
    }
  }, [replies]);

  async function handleSendReply() {
    if (!replyBody.trim() || !ticket) return;
    setSending(true);
    const res = await fetch(`${ADMIN_API}/ticket-reply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` },
      body: JSON.stringify({ session_token: sessionToken, ticket_id: ticket.id, reply_body: replyBody, new_status: replyStatus || undefined }),
    });
    setSending(false);
    if (res.ok) {
      setReplyBody('');
      setSnack({ msg: 'Reply sent', sev: 'success' });
      void loadTicket();
    } else {
      setSnack({ msg: 'Failed to send reply', sev: 'error' });
    }
  }

  async function handleTicketUpdate(field: string, value: string) {
    if (!ticket) return;
    const updates: Record<string, string> = { [field]: value };
    await fetch(`${ADMIN_API}/ticket-update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` },
      body: JSON.stringify({ session_token: sessionToken, ticket_id: ticket.id, ...updates }),
    });
    setTicket(prev => prev ? { ...prev, [field]: value } : null);
    setSnack({ msg: 'Ticket updated', sev: 'success' });
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !ticket) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error">{error || 'Ticket not found'}</Alert>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/admin/support')} sx={{ mt: 2 }}>Back to Support</Button>
      </Box>
    );
  }

  const statusConfig = STATUS_OPTIONS.find(s => s.value === ticket.status) ?? STATUS_OPTIONS[0];

  return (
    <Box sx={{ bgcolor: 'grey.50', minHeight: '100vh' }}>
      {/* Header */}
      <Box sx={{ bgcolor: 'white', borderBottom: '1px solid', borderColor: 'divider', px: 3, py: 2 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/admin/support')} sx={{ color: 'text.secondary' }}>
              Support
            </Button>
            <Typography color="text.disabled">/</Typography>
            <Typography variant="h6" fontWeight={700}>Ticket #{ticket.ticket_number}</Typography>
            <Chip
              label={statusConfig.label}
              size="small"
              sx={{ bgcolor: statusConfig.bg, color: statusConfig.color, fontWeight: 700 }}
            />
          </Stack>
          <Stack direction="row" spacing={1}>
            <Chip label={CATEGORY_LABELS[ticket.category] ?? ticket.category} size="small" variant="outlined" />
          </Stack>
        </Stack>
      </Box>

      <Box sx={{ px: 3, py: 3 }}>
        <Grid container spacing={3}>
          {/* Left: Conversation */}
          <Grid size={{ xs: 12, lg: 8 }}>
            <Card sx={{ mb: 2 }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="h6" fontWeight={700} gutterBottom>{ticket.subject}</Typography>
                <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                  <Chip label={`Priority: ${PRIORITY_OPTIONS.find(p => p.value === ticket.priority)?.label ?? ticket.priority}`} size="small" sx={{ fontSize: '0.7rem' }} />
                  <Typography variant="caption" color="text.secondary" sx={{ alignSelf: 'center' }}>
                    Opened {new Date(ticket.created_at).toLocaleString()}
                  </Typography>
                </Stack>
                <Box sx={{ bgcolor: 'grey.50', borderRadius: 2, p: 2.5 }}>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>{ticket.body}</Typography>
                </Box>
              </CardContent>
            </Card>

            {/* Thread */}
            {replies.length > 0 && (
              <Box ref={threadRef} sx={{ mb: 2, maxHeight: 420, overflowY: 'auto' }}>
                <Stack spacing={2}>
                  {replies.map(reply => {
                    const isAdmin = reply.sender_type === 'admin';
                    return (
                      <Box
                        key={reply.id}
                        sx={{
                          display: 'flex',
                          flexDirection: isAdmin ? 'row-reverse' : 'row',
                          gap: 1.5,
                          alignItems: 'flex-start',
                        }}
                      >
                        <Avatar
                          sx={{
                            width: 32, height: 32, fontSize: '0.7rem', fontWeight: 700, flexShrink: 0,
                            bgcolor: isAdmin ? '#1B6B3E' : 'grey.300',
                            color: isAdmin ? 'white' : 'text.secondary',
                          }}
                        >
                          {initials(reply.sender_name)}
                        </Avatar>
                        <Box sx={{ maxWidth: '78%' }}>
                          <Stack direction={isAdmin ? 'row-reverse' : 'row'} spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                            <Typography variant="caption" fontWeight={700}>{reply.sender_name}</Typography>
                            {isAdmin && <Chip label="Admin" size="small" sx={{ height: 16, fontSize: '0.6rem', bgcolor: 'rgba(27, 107, 62,0.1)', color: '#1B6B3E', fontWeight: 700 }} />}
                            <Typography variant="caption" color="text.disabled">
                              {new Date(reply.created_at).toLocaleString()}
                            </Typography>
                          </Stack>
                          <Box
                            sx={{
                              bgcolor: isAdmin ? 'rgba(27, 107, 62,0.08)' : 'white',
                              border: '1px solid',
                              borderColor: isAdmin ? 'rgba(27, 107, 62,0.2)' : 'divider',
                              borderRadius: isAdmin ? '12px 4px 12px 12px' : '4px 12px 12px 12px',
                              p: 2,
                            }}
                          >
                            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>
                              {reply.body}
                            </Typography>
                          </Box>
                        </Box>
                      </Box>
                    );
                  })}
                </Stack>
              </Box>
            )}

            {/* Reply Form */}
            {ticket.status !== 'closed' && (
              <Card>
                <CardContent sx={{ p: 3 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1.5 }}>
                    <Typography variant="subtitle2" fontWeight={700}>Reply</Typography>
                    <Button
                      size="small"
                      variant="outlined"
                      startIcon={<ArticleOutlinedIcon fontSize="small" />}
                      onClick={e => setTemplateAnchor(e.currentTarget)}
                      sx={{ fontSize: '0.75rem' }}
                    >
                      Use Template
                    </Button>
                  </Stack>

                  <TextField
                    multiline
                    rows={4}
                    fullWidth
                    placeholder="Write your reply..."
                    value={replyBody}
                    onChange={e => setReplyBody(e.target.value)}
                    sx={{ mb: 2 }}
                  />

                  <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
                    <FormControl size="small" sx={{ minWidth: 160 }}>
                      <InputLabel>Update Status</InputLabel>
                      <Select label="Update Status" value={replyStatus} onChange={e => setReplyStatus(e.target.value)}>
                        {STATUS_OPTIONS.map(s => (
                          <MenuItem key={s.value} value={s.value}>
                            <Box component="span" sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: s.color, display: 'inline-block', mr: 1 }} />
                            {s.label}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>

                    <Button
                      variant="contained"
                      endIcon={sending ? <CircularProgress size={14} color="inherit" /> : <SendIcon fontSize="small" />}
                      onClick={() => void handleSendReply()}
                      disabled={sending || !replyBody.trim()}
                      sx={{ bgcolor: '#1B6B3E', '&:hover': { bgcolor: '#0F3D24' }, fontWeight: 700 }}
                    >
                      {sending ? 'Sending…' : 'Send Reply'}
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            )}
          </Grid>

          {/* Right: Sidebar */}
          <Grid size={{ xs: 12, lg: 4 }}>
            {/* Ticket Controls */}
            <Card sx={{ mb: 2 }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2 }}>Ticket Details</Typography>
                <Stack spacing={2}>
                  <FormControl fullWidth size="small">
                    <InputLabel>Status</InputLabel>
                    <Select label="Status" value={ticket.status} onChange={e => void handleTicketUpdate('status', e.target.value)}>
                      {STATUS_OPTIONS.map(s => (
                        <MenuItem key={s.value} value={s.value}>
                          <Box component="span" sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: s.color, display: 'inline-block', mr: 1 }} />
                          {s.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <FormControl fullWidth size="small">
                    <InputLabel>Priority</InputLabel>
                    <Select label="Priority" value={ticket.priority} onChange={e => void handleTicketUpdate('priority', e.target.value)}>
                      {PRIORITY_OPTIONS.map(p => (
                        <MenuItem key={p.value} value={p.value}>
                          <Typography sx={{ color: p.color, fontWeight: 700, fontSize: '0.875rem' }}>{p.label}</Typography>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <FormControl fullWidth size="small">
                    <InputLabel>Assign To</InputLabel>
                    <Select
                      label="Assign To"
                      value={ticket.assigned_to ?? ''}
                      onChange={e => void handleTicketUpdate('assigned_to', e.target.value)}
                    >
                      <MenuItem value=""><em>Unassigned</em></MenuItem>
                      {adminList.map(a => <MenuItem key={a.id} value={a.id}>{a.full_name}</MenuItem>)}
                    </Select>
                  </FormControl>
                  <FormControl fullWidth size="small">
                    <InputLabel>Category</InputLabel>
                    <Select label="Category" value={ticket.category} onChange={e => void handleTicketUpdate('category', e.target.value)}>
                      <MenuItem value="login">🔐 Login Issues</MenuItem>
                      <MenuItem value="account_recovery">🔑 Account Recovery</MenuItem>
                      <MenuItem value="billing">💳 Billing</MenuItem>
                      <MenuItem value="bug">🐛 Bug Report</MenuItem>
                      <MenuItem value="other">📋 Other</MenuItem>
                    </Select>
                  </FormControl>
                </Stack>
              </CardContent>
            </Card>

            {/* User Profile */}
            {userProfile && (
              <Card sx={{ mb: 2 }}>
                <CardContent sx={{ p: 3 }}>
                  <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
                    <PersonOutlineIcon sx={{ color: 'text.secondary', fontSize: 18 }} />
                    <Typography variant="subtitle2" fontWeight={700}>User Profile</Typography>
                  </Stack>
                  <Stack spacing={1.5}>
                    <Stack direction="row" alignItems="center" spacing={1.5}>
                      <Avatar sx={{ width: 40, height: 40, bgcolor: '#1B6B3E', fontWeight: 700, fontSize: '0.875rem' }}>
                        {initials(userProfile.full_name)}
                      </Avatar>
                      <Box>
                        <Typography variant="body2" fontWeight={700}>{userProfile.full_name}</Typography>
                        <Typography variant="caption" color="text.secondary">{userProfile.email ?? 'No email'}</Typography>
                      </Box>
                    </Stack>
                    <Divider />
                    {[
                      { label: 'Role', value: userProfile.role },
                      { label: 'Plan', value: userProfile.plan },
                      { label: 'Status', value: userProfile.status },
                      { label: 'Joined', value: new Date(userProfile.created_at).toLocaleDateString() },
                    ].map(({ label, value }) => (
                      <Stack key={label} direction="row" justifyContent="space-between">
                        <Typography variant="caption" color="text.secondary">{label}</Typography>
                        <Typography variant="caption" fontWeight={600} sx={{ textTransform: 'capitalize' }}>{value}</Typography>
                      </Stack>
                    ))}
                    <Button
                      size="small"
                      variant="outlined"
                      fullWidth
                      onClick={() => navigate('/admin/support/recovery')}
                      sx={{ mt: 0.5, fontSize: '0.75rem' }}
                    >
                      Account Recovery Tools
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            )}
          </Grid>
        </Grid>
      </Box>

      {/* Template Menu */}
      <Menu anchorEl={templateAnchor} open={!!templateAnchor} onClose={() => setTemplateAnchor(null)}>
        {REPLY_TEMPLATES.map(t => (
          <MenuItem
            key={t.label}
            onClick={() => { setReplyBody(t.body); setTemplateAnchor(null); }}
            sx={{ maxWidth: 320 }}
          >
            <ListItemText
              primary={t.label}
              secondary={t.body.slice(0, 60) + '…'}
              slotProps={{ primary: { variant: 'body2', fontWeight: 600 }, secondary: { variant: 'caption' } }}
            />
          </MenuItem>
        ))}
      </Menu>

      <Snackbar open={!!snack} autoHideDuration={3000} onClose={() => setSnack(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={snack?.sev ?? 'success'} onClose={() => setSnack(null)}>{snack?.msg}</Alert>
      </Snackbar>
    </Box>
  );
}
