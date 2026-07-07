import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Avatar from '@mui/material/Avatar';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import InputAdornment from '@mui/material/InputAdornment';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SearchIcon from '@mui/icons-material/Search';
import LockResetIcon from '@mui/icons-material/LockReset';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import MergeIcon from '@mui/icons-material/MergeType';
import EmailIcon from '@mui/icons-material/Email';
import RestoreIcon from '@mui/icons-material/Restore';
import LogoutIcon from '@mui/icons-material/Logout';
import PhonelinkEraseIcon from '@mui/icons-material/PhonelinkErase';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { useAdminAuth, ADMIN_API } from '../../contexts/AdminAuthContext';

interface UserResult {
  id: string;
  user_id: string;
  full_name: string;
  role: string;
  status: string;
  plan: string;
  email?: string;
}

interface RecoveryTool {
  key: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  bg: string;
  superAdminOnly?: boolean;
  requiresConfirm?: boolean;
  requiresNote?: boolean;
  requiresExtra?: 'email' | 'merge_target';
  danger?: boolean;
}

function initials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

export default function AdminSupportRecoveryPage() {
  const navigate = useNavigate();
  const { sessionToken, admin } = useAdminAuth();

  const [search, setSearch] = useState('');
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<UserResult[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserResult | null>(null);

  const [confirmTool, setConfirmTool] = useState<RecoveryTool | null>(null);
  const [confirmNote, setConfirmNote] = useState('');
  const [confirmExtra, setConfirmExtra] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const [snack, setSnack] = useState<{ msg: string; sev: 'success' | 'error' } | null>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const RECOVERY_TOOLS: RecoveryTool[] = [
    {
      key: 'force_password_reset',
      label: 'Force Password Reset',
      description: 'Send a password reset link to the user\'s registered email address.',
      icon: <LockResetIcon />, color: '#2A8A52', bg: 'rgba(42, 138, 82,0.08)',
    },
    {
      key: 'verify_email',
      label: 'Manual Email Verification',
      description: 'Mark the user\'s email as verified without requiring them to click a link.',
      icon: <VerifiedUserIcon />, color: '#2A8A52', bg: 'rgba(42, 138, 82,0.08)',
      requiresConfirm: true,
    },
    {
      key: 'unlock_account',
      label: 'Unlock Account',
      description: 'Remove account suspension or lockout caused by failed login attempts.',
      icon: <LockOpenIcon />, color: '#D08A28', bg: 'rgba(208, 138, 40,0.08)',
      requiresConfirm: true,
    },
    {
      key: 'change_email',
      label: 'Change Email Address',
      description: 'Update the user\'s email address. A verification will be sent to the new address.',
      icon: <EmailIcon />, color: '#1B6B3E', bg: 'rgba(27, 107, 62,0.08)',
      requiresConfirm: true, requiresExtra: 'email',
    },
    {
      key: 'force_logout',
      label: 'Force Logout All Sessions',
      description: 'Invalidate all active sessions for this user across all devices.',
      icon: <LogoutIcon />, color: '#D08A28', bg: 'rgba(208, 138, 40,0.08)',
      requiresConfirm: true,
    },
    {
      key: 'reset_2fa',
      label: 'Reset 2FA',
      description: 'Temporarily remove 2FA requirement. User will need to re-enroll on next login.',
      icon: <PhonelinkEraseIcon />, color: '#C0392B', bg: 'rgba(192, 57, 43,0.08)',
      requiresConfirm: true, requiresNote: true, superAdminOnly: true, danger: true,
    },
    {
      key: 'merge_accounts',
      label: 'Merge Accounts',
      description: 'Combine two accounts into one. Transfers all data to the primary account.',
      icon: <MergeIcon />, color: '#0F3D24', bg: 'rgba(15, 61, 36,0.08)',
      requiresConfirm: true, requiresExtra: 'merge_target', superAdminOnly: true, danger: true, requiresNote: true,
    },
  ];

  const searchUsers = useCallback(async (q: string) => {
    if (!q.trim() || !sessionToken) { setResults([]); return; }
    setSearching(true);
    try {
      const res = await fetch(`${ADMIN_API}/users-list`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` },
        body: JSON.stringify({ session_token: sessionToken, page: 1, limit: 8, search: q }),
      });
      const data = await res.json() as { users: UserResult[] };
      setResults(data.users ?? []);
    } catch { setResults([]); }
    finally { setSearching(false); }
  }, [sessionToken]);

  function handleSearch(val: string) {
    setSearch(val);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => void searchUsers(val), 300);
  }

  function openTool(tool: RecoveryTool) {
    if (!selectedUser) { setSnack({ msg: 'Select a user first', sev: 'error' }); return; }
    if (tool.superAdminOnly && admin?.role !== 'super_admin') {
      setSnack({ msg: 'This action requires Super Admin permissions', sev: 'error' }); return;
    }
    if (!tool.requiresConfirm) {
      void runAction(tool, '', '');
    } else {
      setConfirmTool(tool); setConfirmNote(''); setConfirmExtra('');
    }
  }

  async function runAction(tool: RecoveryTool, note: string, extra: string) {
    if (!selectedUser) return;
    setActionLoading(true);
    try {
      const body: Record<string, string> = {
        session_token: sessionToken ?? '',
        recovery_action: tool.key,
        user_id: selectedUser.id,
        notes: note,
      };
      if (tool.requiresExtra === 'email') body.new_email = extra;
      if (tool.requiresExtra === 'merge_target') body.merge_target_id = extra;

      const res = await fetch(`${ADMIN_API}/account-recovery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` },
        body: JSON.stringify(body),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Action failed');
      setSnack({ msg: `${tool.label} completed successfully`, sev: 'success' });
      setConfirmTool(null);
    } catch (e) {
      setSnack({ msg: (e as Error).message, sev: 'error' });
    } finally {
      setActionLoading(false);
    }
  }

  return (
    <Box sx={{ bgcolor: 'grey.50', minHeight: '100vh' }}>
      {/* Header */}
      <Box sx={{ bgcolor: 'white', borderBottom: '1px solid', borderColor: 'divider', px: 3, py: 2 }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/admin/support')} sx={{ color: 'text.secondary' }}>
            Support
          </Button>
          <Typography color="text.disabled">/</Typography>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Box sx={{ width: 32, height: 32, borderRadius: '8px', bgcolor: 'rgba(27, 107, 62,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <RestoreIcon sx={{ color: '#1B6B3E', fontSize: 18 }} />
            </Box>
            <Typography variant="h6" fontWeight={700}>Account Recovery Tools</Typography>
          </Stack>
        </Stack>
      </Box>

      <Box sx={{ px: 3, py: 3 }}>
        <Grid container spacing={3}>
          {/* Left: User Search */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Card sx={{ mb: 2 }}>
              <CardContent sx={{ p: 3 }}>
                <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2 }}>Search User</Typography>
                <TextField
                  placeholder="Name or email..."
                  value={search}
                  onChange={e => handleSearch(e.target.value)}
                  fullWidth size="small"
                  slotProps={{ input: { startAdornment: <InputAdornment position="start">{searching ? <CircularProgress size={14} /> : <SearchIcon fontSize="small" />}</InputAdornment> } }}
                />

                {results.length > 0 && (
                  <Stack spacing={0.5} sx={{ mt: 2 }}>
                    {results.map(user => (
                      <Box
                        key={user.id}
                        onClick={() => { setSelectedUser(user); setResults([]); setSearch(user.full_name); }}
                        sx={{
                          p: 1.5, borderRadius: 1.5, cursor: 'pointer',
                          border: '1px solid', borderColor: 'divider',
                          bgcolor: selectedUser?.id === user.id ? 'rgba(27, 107, 62,0.06)' : 'white',
                          '&:hover': { bgcolor: 'grey.50' },
                        }}
                      >
                        <Stack direction="row" spacing={1.5} alignItems="center">
                          <Avatar sx={{ width: 30, height: 30, bgcolor: '#1B6B3E', fontSize: '0.65rem', fontWeight: 700 }}>
                            {initials(user.full_name)}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight={600} lineHeight={1.2}>{user.full_name}</Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'capitalize' }}>
                              {user.role} · {user.plan}
                            </Typography>
                          </Box>
                        </Stack>
                      </Box>
                    ))}
                  </Stack>
                )}
              </CardContent>
            </Card>

            {selectedUser && (
              <Card>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2 }}>Selected User</Typography>
                  <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
                    <Avatar sx={{ width: 44, height: 44, bgcolor: '#1B6B3E', fontWeight: 700 }}>
                      {initials(selectedUser.full_name)}
                    </Avatar>
                    <Box>
                      <Typography variant="body2" fontWeight={700}>{selectedUser.full_name}</Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'capitalize' }}>
                        {selectedUser.role} · {selectedUser.plan}
                      </Typography>
                    </Box>
                  </Stack>
                  <Divider sx={{ mb: 1.5 }} />
                  <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                    <Typography variant="caption" color="text.secondary">Account Status</Typography>
                    <Chip
                      label={selectedUser.status}
                      size="small"
                      sx={{
                        height: 18, fontSize: '0.65rem', fontWeight: 700, textTransform: 'capitalize',
                        bgcolor: selectedUser.status === 'active' ? 'rgba(42, 138, 82,0.1)' : 'rgba(192, 57, 43,0.1)',
                        color: selectedUser.status === 'active' ? '#2A8A52' : '#C0392B',
                      }}
                    />
                  </Stack>
                  <Button
                    size="small"
                    variant="text"
                    fullWidth
                    onClick={() => setSelectedUser(null)}
                    sx={{ mt: 1, color: 'text.secondary', fontSize: '0.75rem' }}
                  >
                    Clear selection
                  </Button>
                </CardContent>
              </Card>
            )}
          </Grid>

          {/* Right: Recovery Tools */}
          <Grid size={{ xs: 12, md: 8 }}>
            <Grid container spacing={2}>
              {RECOVERY_TOOLS.map(tool => {
                const isLocked = tool.superAdminOnly && admin?.role !== 'super_admin';
                return (
                  <Grid size={{ xs: 12, sm: 6 }} key={tool.key}>
                    <Card
                      sx={{
                        height: '100%',
                        opacity: isLocked ? 0.55 : 1,
                        border: tool.danger ? '1px solid rgba(192, 57, 43,0.2)' : '1px solid',
                        borderColor: tool.danger ? 'rgba(192, 57, 43,0.2)' : 'divider',
                        transition: 'box-shadow 0.15s',
                        '&:hover': isLocked ? {} : { boxShadow: 3 },
                      }}
                    >
                      <CardContent sx={{ p: 2.5, height: '100%', display: 'flex', flexDirection: 'column' }}>
                        <Stack direction="row" spacing={1.5} alignItems="flex-start" sx={{ mb: 1.5 }}>
                          <Box
                            sx={{
                              width: 38, height: 38, borderRadius: '10px', flexShrink: 0,
                              bgcolor: tool.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
                              '& .MuiSvgIcon-root': { color: tool.color, fontSize: 20 },
                            }}
                          >
                            {tool.icon}
                          </Box>
                          <Box sx={{ flex: 1 }}>
                            <Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap">
                              <Typography variant="body2" fontWeight={700} lineHeight={1.3}>{tool.label}</Typography>
                              {tool.superAdminOnly && (
                                <Chip label="Super Admin" size="small" sx={{ height: 16, fontSize: '0.6rem', fontWeight: 700, bgcolor: 'rgba(15, 61, 36,0.1)', color: '#0F3D24' }} />
                              )}
                            </Stack>
                          </Box>
                        </Stack>
                        <Typography variant="caption" color="text.secondary" sx={{ flex: 1, lineHeight: 1.5, mb: 2 }}>
                          {tool.description}
                        </Typography>
                        <Button
                          variant={tool.danger ? 'outlined' : 'contained'}
                          size="small"
                          fullWidth
                          disabled={isLocked || !selectedUser}
                          onClick={() => openTool(tool)}
                          color={tool.danger ? 'error' : 'primary'}
                          sx={!tool.danger ? { bgcolor: '#1B6B3E', '&:hover': { bgcolor: '#0F3D24' } } : {}}
                        >
                          {isLocked ? 'Super Admin Only' : !selectedUser ? 'Select a User First' : 'Run'}
                        </Button>
                      </CardContent>
                    </Card>
                  </Grid>
                );
              })}
            </Grid>
          </Grid>
        </Grid>
      </Box>

      {/* Confirm Dialog */}
      <Dialog open={!!confirmTool} onClose={() => setConfirmTool(null)} maxWidth="sm" fullWidth>
        {confirmTool && (
          <>
            <DialogTitle>
              <Stack direction="row" spacing={1.5} alignItems="center">
                {confirmTool.danger && <WarningAmberIcon sx={{ color: 'warning.main' }} />}
                <Typography variant="h6" fontWeight={700}>{confirmTool.label}</Typography>
              </Stack>
            </DialogTitle>
            <DialogContent dividers>
              <Alert severity={confirmTool.danger ? 'warning' : 'info'} sx={{ mb: 2 }}>
                Target user: <strong>{selectedUser?.full_name}</strong>
              </Alert>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {confirmTool.description}
              </Typography>

              {confirmTool.requiresExtra === 'email' && (
                <TextField
                  label="New email address *"
                  value={confirmExtra}
                  onChange={e => setConfirmExtra(e.target.value)}
                  fullWidth size="small" type="email" sx={{ mb: 2 }}
                />
              )}
              {confirmTool.requiresExtra === 'merge_target' && (
                <TextField
                  label="Target user profile ID to merge from *"
                  value={confirmExtra}
                  onChange={e => setConfirmExtra(e.target.value)}
                  fullWidth size="small" sx={{ mb: 2 }}
                  helperText="The account being merged will be suspended after the merge."
                />
              )}
              {confirmTool.requiresNote && (
                <TextField
                  label="Notes / reason"
                  value={confirmNote}
                  onChange={e => setConfirmNote(e.target.value)}
                  fullWidth size="small" multiline rows={2}
                  placeholder="Optional but recommended for audit trail"
                />
              )}
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 2 }}>
              <Button onClick={() => setConfirmTool(null)}>Cancel</Button>
              <Button
                variant="contained"
                color={confirmTool.danger ? 'error' : 'primary'}
                disabled={actionLoading || (!!confirmTool.requiresExtra && !confirmExtra)}
                onClick={() => void runAction(confirmTool, confirmNote, confirmExtra)}
                sx={!confirmTool.danger ? { bgcolor: '#1B6B3E', '&:hover': { bgcolor: '#0F3D24' } } : {}}
              >
                {actionLoading ? <CircularProgress size={16} color="inherit" /> : 'Confirm'}
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      <Snackbar open={!!snack} autoHideDuration={4000} onClose={() => setSnack(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={snack?.sev ?? 'success'} onClose={() => setSnack(null)}>{snack?.msg}</Alert>
      </Snackbar>
    </Box>
  );
}
