import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Stack from '@mui/material/Stack';
import Avatar from '@mui/material/Avatar';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import Skeleton from '@mui/material/Skeleton';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import Link from '@mui/material/Link';
import Tooltip from '@mui/material/Tooltip';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import VerifiedUserOutlinedIcon from '@mui/icons-material/VerifiedUserOutlined';
import LockResetOutlinedIcon from '@mui/icons-material/LockResetOutlined';
import BlockOutlinedIcon from '@mui/icons-material/BlockOutlined';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import PersonSwitchOutlinedIcon from '@mui/icons-material/ManageAccountsOutlined';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import CalendarTodayOutlinedIcon from '@mui/icons-material/CalendarTodayOutlined';
import LightbulbOutlinedIcon from '@mui/icons-material/LightbulbOutlined';
import HistoryOutlinedIcon from '@mui/icons-material/HistoryOutlined';
import { useAdminAuth, ADMIN_API } from '../../contexts/AdminAuthContext';

// ── Types ─────────────────────────────────────────────────────────────────────

interface UserDetail {
  profile: {
    id: string;
    user_id: string;
    full_name: string;
    role: string;
    status: string;
    plan: string;
    created_at: string;
    last_active: string | null;
    email: string | null;
    email_confirmed_at: string | null;
    last_sign_in_at: string | null;
    email_verified: boolean;
    onboarding_completed: boolean;
    suspension_reason: string | null;
    suspended_at: string | null;
  };
  founder_profile: Record<string, string> | null;
  investor_profile: Record<string, string> | null;
  ideas: { id: string; title: string; created_at: string; status: string }[];
  tickets: { id: string; subject: string; status: string; priority: string; created_at: string }[];
  action_log: { action: string; reason: string | null; created_at: string }[];
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function fmtShort(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Stack direction="row" alignItems="baseline" spacing={1} sx={{ py: 0.75 }}>
      <Typography variant="caption" color="text.secondary" sx={{ minWidth: 140, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.65rem' }}>
        {label}
      </Typography>
      <Typography variant="body2" color="text.primary" sx={{ flex: 1 }}>{value}</Typography>
    </Stack>
  );
}

// ── Confirm Dialog ────────────────────────────────────────────────────────────

interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (reason?: string) => void;
  title: string;
  message: string;
  requireReason?: boolean;
  requireTyping?: string;
  confirmLabel?: string;
  severity?: 'warning' | 'error';
  loading?: boolean;
}

function ConfirmDialog({
  open, onClose, onConfirm, title, message,
  requireReason, requireTyping, confirmLabel = 'Confirm',
  severity = 'warning', loading,
}: ConfirmDialogProps) {
  const [reason, setReason] = useState('');
  const [typed, setTyped] = useState('');

  const canConfirm = (!requireReason || reason.trim().length >= 5) &&
    (!requireTyping || typed === requireTyping);

  function handleClose() {
    setReason('');
    setTyped('');
    onClose();
  }

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <WarningAmberIcon sx={{ color: severity === 'error' ? 'error.main' : 'warning.main' }} />
        {title}
      </DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" mb={2}>{message}</Typography>
        {requireReason && (
          <TextField
            label="Reason"
            value={reason}
            onChange={e => setReason(e.target.value)}
            fullWidth multiline rows={2}
            required size="small"
            placeholder="Describe the reason for this action…"
            sx={{ mb: 2 }}
          />
        )}
        {requireTyping && (
          <Box>
            <Typography variant="caption" color="text.secondary" mb={0.5} display="block">
              Type <strong>{requireTyping}</strong> to confirm:
            </Typography>
            <TextField
              value={typed}
              onChange={e => setTyped(e.target.value)}
              fullWidth size="small"
              placeholder={requireTyping}
            />
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={handleClose} sx={{ textTransform: 'none', color: 'text.secondary' }}>Cancel</Button>
        <Button
          variant="contained"
          disabled={!canConfirm || loading}
          onClick={() => onConfirm(requireReason ? reason : undefined)}
          sx={{
            textTransform: 'none', fontWeight: 700,
            bgcolor: severity === 'error' ? 'error.main' : 'warning.main',
            '&:hover': { bgcolor: severity === 'error' ? 'error.dark' : 'warning.dark' },
          }}
        >
          {loading ? 'Processing…' : confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function AdminUserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { sessionToken, admin } = useAdminAuth();

  const [detail, setDetail] = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState('');
  const [toastSeverity, setToastSeverity] = useState<'success' | 'error'>('success');

  // Dialog states
  const [suspendOpen, setSuspendOpen] = useState(false);
  const [unsuspendOpen, setUnsuspendOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const fetchDetail = useCallback(async () => {
    if (!sessionToken || !id) return;
    setLoading(true);
    try {
      const res = await fetch(`${ADMIN_API}/user-detail`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ session_token: sessionToken, user_id: id }),
      });
      const json = await res.json() as UserDetail;
      setDetail(json);
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [sessionToken, id]);

  useEffect(() => { fetchDetail(); }, [fetchDetail]);

  async function doAction(action_type: string, extra?: Record<string, string>) {
    if (!sessionToken || !id) return;
    setActionLoading(true);
    try {
      const res = await fetch(`${ADMIN_API}/user-action`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ session_token: sessionToken, user_id: id, action_type, ...extra }),
      });
      const json = await res.json() as { error?: string };
      if (!res.ok) throw new Error(json.error ?? 'Action failed');
      setToast(`Action '${action_type.replace(/_/g, ' ')}' completed successfully`);
      setToastSeverity('success');
      await fetchDetail();
    } catch (e) {
      setToast((e as Error).message);
      setToastSeverity('error');
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) {
    return (
      <Box sx={{ py: 4 }}>
        <Container maxWidth="xl">
          <Skeleton width={200} height={32} sx={{ mb: 3 }} />
          <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 4 }}><Skeleton variant="rectangular" height={400} sx={{ borderRadius: 2 }} /></Grid>
            <Grid size={{ xs: 12, md: 8 }}><Skeleton variant="rectangular" height={400} sx={{ borderRadius: 2 }} /></Grid>
          </Grid>
        </Container>
      </Box>
    );
  }

  if (!detail) {
    return (
      <Box sx={{ py: 4 }}>
        <Container maxWidth="xl">
          <Alert severity="error">User not found.</Alert>
        </Container>
      </Box>
    );
  }

  const { profile, founder_profile, investor_profile, ideas, tickets, action_log } = detail;
  const isSuspended = profile.status === 'suspended';
  const roleColor = profile.role === 'investor' ? '#2A8A52' : '#1B6B3E';

  return (
    <Box sx={{ py: 4 }}>
      <Container maxWidth="xl">
        {/* Breadcrumb */}
        <Breadcrumbs sx={{ mb: 2 }}>
          <Link component="button" underline="hover" color="inherit" variant="body2"
            onClick={() => navigate('/admin/users')} sx={{ cursor: 'pointer' }}>
            Users
          </Link>
          <Typography variant="body2" color="text.primary">{profile.full_name}</Typography>
        </Breadcrumbs>

        <Stack direction="row" alignItems="center" spacing={1.5} mb={3}>
          <IconButton onClick={() => navigate('/admin/users')} size="small">
            <ArrowBackIcon sx={{ fontSize: 20 }} />
          </IconButton>
          <Typography variant="h5" fontWeight={800}>{profile.full_name}</Typography>
          <Chip
            label={profile.role === 'investor' ? 'Investor' : 'Founder'}
            size="small"
            sx={{ bgcolor: `${roleColor}18`, color: roleColor, fontWeight: 600 }}
          />
          {isSuspended && <Chip label="Suspended" size="small" color="warning" sx={{ fontWeight: 600 }} />}
          {!isSuspended && profile.status === 'active' && (
            <Chip label="Active" size="small" sx={{ bgcolor: '#2A8A5218', color: '#2A8A52', fontWeight: 600 }} />
          )}
        </Stack>

        <Grid container spacing={3}>
          {/* Left: Profile Info + Actions */}
          <Grid size={{ xs: 12, md: 4 }}>
            {/* Avatar card */}
            <Card sx={{ mb: 2.5, textAlign: 'center' }}>
              <CardContent sx={{ p: 3 }}>
                <Avatar sx={{ width: 80, height: 80, mx: 'auto', mb: 2, bgcolor: `${roleColor}18`, color: roleColor, fontSize: '2rem', fontWeight: 800 }}>
                  {profile.full_name?.charAt(0).toUpperCase() ?? '?'}
                </Avatar>
                <Typography variant="h6" fontWeight={700}>{profile.full_name}</Typography>
                <Typography variant="body2" color="text.secondary">{profile.email ?? '—'}</Typography>
                <Stack direction="row" justifyContent="center" spacing={1} mt={1.5}>
                  <Chip label={profile.plan} size="small" sx={{ textTransform: 'capitalize', bgcolor: 'grey.100', fontSize: '0.72rem' }} />
                  {profile.email_verified && (
                    <Tooltip title="Email verified"><VerifiedUserOutlinedIcon sx={{ fontSize: 18, color: '#2A8A52' }} /></Tooltip>
                  )}
                </Stack>
              </CardContent>
            </Card>

            {/* Profile details */}
            <Card sx={{ mb: 2.5 }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="subtitle2" fontWeight={700} mb={1.5}>Account Info</Typography>
                <Divider sx={{ mb: 1.5 }} />
                <InfoRow label="User ID" value={<Typography variant="caption" sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>{profile.id}</Typography>} />
                <InfoRow label="Email" value={
                  <Stack direction="row" alignItems="center" spacing={0.5}>
                    <EmailOutlinedIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
                    <span>{profile.email ?? '—'}</span>
                  </Stack>
                } />
                <InfoRow label="Role" value={profile.role === 'investor' ? 'Investor' : 'Entrepreneur'} />
                <InfoRow label="Status" value={profile.status} />
                <InfoRow label="Plan" value={<Typography variant="body2" sx={{ textTransform: 'capitalize' }}>{profile.plan}</Typography>} />
                <InfoRow label="Onboarding" value={profile.onboarding_completed ? 'Complete' : 'Incomplete'} />
                <InfoRow label="Joined" value={
                  <Stack direction="row" alignItems="center" spacing={0.5}>
                    <CalendarTodayOutlinedIcon sx={{ fontSize: 13, color: 'text.disabled' }} />
                    <span>{fmtShort(profile.created_at)}</span>
                  </Stack>
                } />
                <InfoRow label="Last Active" value={fmtShort(profile.last_active)} />
                <InfoRow label="Last Sign In" value={fmtDate(profile.last_sign_in_at)} />
                {isSuspended && profile.suspension_reason && (
                  <>
                    <Divider sx={{ my: 1 }} />
                    <InfoRow label="Suspend Reason" value={
                      <Typography variant="body2" color="warning.main">{profile.suspension_reason}</Typography>
                    } />
                    <InfoRow label="Suspended At" value={fmtDate(profile.suspended_at)} />
                  </>
                )}
              </CardContent>
            </Card>

            {/* Role-specific profile */}
            {(founder_profile || investor_profile) && (
              <Card sx={{ mb: 2.5 }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="subtitle2" fontWeight={700} mb={1.5}>
                    {profile.role === 'investor' ? 'Investor Profile' : 'Founder Profile'}
                  </Typography>
                  <Divider sx={{ mb: 1.5 }} />
                  {Object.entries(founder_profile ?? investor_profile ?? {})
                    .filter(([k]) => !['id', 'user_id', 'created_at', 'updated_at'].includes(k))
                    .slice(0, 8)
                    .map(([k, v]) => (
                      <InfoRow key={k} label={k.replace(/_/g, ' ')} value={String(v ?? '—')} />
                    ))}
                </CardContent>
              </Card>
            )}

            {/* Admin Actions */}
            <Card>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="subtitle2" fontWeight={700} mb={2}>Admin Actions</Typography>
                <Stack spacing={1.5}>
                  <Button
                    variant="outlined" fullWidth size="small"
                    startIcon={<LockResetOutlinedIcon />}
                    disabled={actionLoading}
                    onClick={() => doAction('reset_password')}
                    sx={{ justifyContent: 'flex-start', textTransform: 'none', borderColor: 'grey.300', color: 'text.primary', fontWeight: 600 }}
                  >
                    Reset Password
                  </Button>

                  <Button
                    variant="outlined" fullWidth size="small"
                    startIcon={<VerifiedUserOutlinedIcon />}
                    disabled={actionLoading || profile.email_verified}
                    onClick={() => doAction('verify_email')}
                    sx={{ justifyContent: 'flex-start', textTransform: 'none', borderColor: 'grey.300', color: '#2A8A52', fontWeight: 600, '&:hover': { borderColor: '#2A8A52', bgcolor: '#2A8A5208' } }}
                  >
                    {profile.email_verified ? 'Email Verified' : 'Verify Email'}
                  </Button>

                  {!isSuspended ? (
                    <Button
                      variant="outlined" fullWidth size="small"
                      startIcon={<BlockOutlinedIcon />}
                      disabled={actionLoading}
                      onClick={() => setSuspendOpen(true)}
                      sx={{ justifyContent: 'flex-start', textTransform: 'none', borderColor: 'warning.main', color: 'warning.main', fontWeight: 600, '&:hover': { bgcolor: 'warning.main', color: 'white' } }}
                    >
                      Suspend Account
                    </Button>
                  ) : (
                    <Button
                      variant="outlined" fullWidth size="small"
                      startIcon={<CheckCircleOutlinedIcon />}
                      disabled={actionLoading}
                      onClick={() => setUnsuspendOpen(true)}
                      sx={{ justifyContent: 'flex-start', textTransform: 'none', borderColor: '#2A8A52', color: '#2A8A52', fontWeight: 600, '&:hover': { bgcolor: '#2A8A52', color: 'white' } }}
                    >
                      Unsuspend Account
                    </Button>
                  )}

                  <Button
                    variant="outlined" fullWidth size="small"
                    startIcon={<PersonSwitchOutlinedIcon />}
                    disabled={actionLoading}
                    onClick={() => doAction('change_role', { new_role: profile.role === 'founder' ? 'investor' : 'founder' })}
                    sx={{ justifyContent: 'flex-start', textTransform: 'none', borderColor: 'grey.300', color: 'text.secondary', fontWeight: 600 }}
                  >
                    Switch to {profile.role === 'founder' ? 'Investor' : 'Founder'}
                  </Button>

                  {admin?.role === 'super_admin' && (
                    <Button
                      variant="outlined" fullWidth size="small"
                      startIcon={<DeleteOutlineIcon />}
                      disabled={actionLoading}
                      onClick={() => setDeleteOpen(true)}
                      sx={{ justifyContent: 'flex-start', textTransform: 'none', borderColor: 'error.main', color: 'error.main', fontWeight: 600, '&:hover': { bgcolor: 'error.main', color: 'white' } }}
                    >
                      Delete Account
                    </Button>
                  )}
                </Stack>
              </CardContent>
            </Card>
          </Grid>

          {/* Right: Ideas, Tickets, Action Log */}
          <Grid size={{ xs: 12, md: 8 }}>
            {/* Ideas */}
            <Card sx={{ mb: 2.5 }}>
              <CardContent sx={{ p: 3 }}>
                <Stack direction="row" alignItems="center" spacing={1.5} mb={2}>
                  <LightbulbOutlinedIcon sx={{ color: '#1B6B3E', fontSize: 20 }} />
                  <Typography variant="subtitle1" fontWeight={700}>
                    Ideas Submitted ({ideas.length})
                  </Typography>
                </Stack>
                <Divider sx={{ mb: 2 }} />
                {ideas.length === 0
                  ? <Typography variant="body2" color="text.secondary">No ideas submitted yet.</Typography>
                  : ideas.map(idea => (
                      <Stack key={idea.id} direction="row" alignItems="center" justifyContent="space-between"
                        sx={{ py: 1.25, borderBottom: '1px solid', borderColor: 'grey.100', '&:last-child': { borderBottom: 'none' } }}>
                        <Typography variant="body2" fontWeight={500}>{idea.title}</Typography>
                        <Stack direction="row" alignItems="center" spacing={1.5}>
                          <Chip label={idea.status} size="small" sx={{ fontSize: '0.7rem', textTransform: 'capitalize', bgcolor: 'grey.100' }} />
                          <Typography variant="caption" color="text.secondary">{fmtShort(idea.created_at)}</Typography>
                        </Stack>
                      </Stack>
                    ))
                }
              </CardContent>
            </Card>

            {/* Support Tickets */}
            <Card sx={{ mb: 2.5 }}>
              <CardContent sx={{ p: 3 }}>
                <Stack direction="row" alignItems="center" spacing={1.5} mb={2}>
                  <Box sx={{ width: 20, height: 20, borderRadius: '50%', bgcolor: '#C0392B18', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Typography sx={{ fontSize: '0.6rem', color: '#C0392B', fontWeight: 800 }}>!</Typography>
                  </Box>
                  <Typography variant="subtitle1" fontWeight={700}>
                    Support Tickets ({tickets.length})
                  </Typography>
                </Stack>
                <Divider sx={{ mb: 2 }} />
                {tickets.length === 0
                  ? <Typography variant="body2" color="text.secondary">No support tickets.</Typography>
                  : tickets.map(ticket => (
                      <Stack key={ticket.id} direction="row" alignItems="center" justifyContent="space-between"
                        sx={{ py: 1.25, borderBottom: '1px solid', borderColor: 'grey.100', '&:last-child': { borderBottom: 'none' } }}>
                        <Typography variant="body2" fontWeight={500}>{ticket.subject}</Typography>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Chip label={ticket.priority} size="small"
                            sx={{
                              fontSize: '0.68rem', textTransform: 'capitalize',
                              bgcolor: ticket.priority === 'urgent' ? '#C0392B18' : ticket.priority === 'high' ? '#D08A2818' : 'grey.100',
                              color: ticket.priority === 'urgent' ? '#C0392B' : ticket.priority === 'high' ? '#D08A28' : 'text.secondary',
                            }} />
                          <Chip label={ticket.status} size="small"
                            sx={{ fontSize: '0.68rem', textTransform: 'capitalize', bgcolor: 'grey.100' }} />
                          <Typography variant="caption" color="text.secondary">{fmtShort(ticket.created_at)}</Typography>
                        </Stack>
                      </Stack>
                    ))
                }
              </CardContent>
            </Card>

            {/* Admin Action Log */}
            <Card>
              <CardContent sx={{ p: 3 }}>
                <Stack direction="row" alignItems="center" spacing={1.5} mb={2}>
                  <HistoryOutlinedIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                  <Typography variant="subtitle1" fontWeight={700}>
                    Admin Action History ({action_log.length})
                  </Typography>
                </Stack>
                <Divider sx={{ mb: 2 }} />
                {action_log.length === 0
                  ? <Typography variant="body2" color="text.secondary">No admin actions recorded.</Typography>
                  : action_log.map((entry, i) => (
                      <Stack key={i} direction="row" alignItems="flex-start" spacing={2}
                        sx={{ py: 1.25, borderBottom: '1px solid', borderColor: 'grey.100', '&:last-child': { borderBottom: 'none' } }}>
                        <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#1B6B3E', mt: 0.75, flexShrink: 0 }} />
                        <Box flex={1}>
                          <Typography variant="body2" fontWeight={600} sx={{ textTransform: 'capitalize' }}>
                            {entry.action.replace(/_/g, ' ')}
                          </Typography>
                          {entry.reason && (
                            <Typography variant="caption" color="text.secondary">{entry.reason}</Typography>
                          )}
                        </Box>
                        <Typography variant="caption" color="text.disabled" sx={{ flexShrink: 0 }}>
                          {fmtShort(entry.created_at)}
                        </Typography>
                      </Stack>
                    ))
                }
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>

      {/* Suspend Dialog */}
      <ConfirmDialog
        open={suspendOpen}
        onClose={() => setSuspendOpen(false)}
        onConfirm={reason => { setSuspendOpen(false); doAction('suspend', { reason: reason ?? '' }); }}
        title="Suspend Account"
        message={`This will prevent ${profile.full_name} from accessing their account. They will see a suspension notice on login.`}
        requireReason
        confirmLabel="Suspend Account"
        severity="warning"
        loading={actionLoading}
      />

      {/* Unsuspend Dialog */}
      <ConfirmDialog
        open={unsuspendOpen}
        onClose={() => setUnsuspendOpen(false)}
        onConfirm={() => { setUnsuspendOpen(false); doAction('unsuspend'); }}
        title="Unsuspend Account"
        message={`This will restore ${profile.full_name}'s access to their account.`}
        confirmLabel="Unsuspend Account"
        severity="warning"
        loading={actionLoading}
      />

      {/* Delete Dialog */}
      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={() => { setDeleteOpen(false); doAction('delete').then(() => navigate('/admin/users')); }}
        title="Delete Account Permanently"
        message={`This will permanently delete ${profile.full_name}'s account and all associated data. This action cannot be undone.`}
        requireTyping="DELETE"
        confirmLabel="Delete Permanently"
        severity="error"
        loading={actionLoading}
      />

      <Snackbar
        open={!!toast}
        autoHideDuration={4000}
        onClose={() => setToast('')}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={toastSeverity} onClose={() => setToast('')} sx={{ width: '100%' }}>
          {toast}
        </Alert>
      </Snackbar>
    </Box>
  );
}
