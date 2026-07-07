import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import LinearProgress from '@mui/material/LinearProgress';
import CircularProgress from '@mui/material/CircularProgress';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { ADMIN_API } from '../../contexts/AdminAuthContext';
import BethraLogo from '../../components/BethraLogo';

interface PasswordRule { label: string; test: (p: string) => boolean; }
const PASSWORD_RULES: PasswordRule[] = [
  { label: 'At least 12 characters', test: p => p.length >= 12 },
  { label: 'One uppercase letter', test: p => /[A-Z]/.test(p) },
  { label: 'One number', test: p => /[0-9]/.test(p) },
  { label: 'One special character', test: p => /[^A-Za-z0-9]/.test(p) },
];

export default function AdminAcceptInvitePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const inviteToken = searchParams.get('token') ?? '';

  const [loading, setLoading] = useState(false);
  const [validating, setValidating] = useState(true);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  useEffect(() => {
    if (!inviteToken) { setValidating(false); return; }
    setValidating(false);
  }, [inviteToken]);

  const passwordRulesMet = PASSWORD_RULES.map(r => r.test(password));

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) { setError('Passwords do not match'); return; }
    if (!passwordRulesMet.every(Boolean)) { setError('Password does not meet all requirements'); return; }
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${ADMIN_API}/accept-invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ invite_token: inviteToken, password, full_name: fullName }),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Failed to create account');
      setDone(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  if (validating) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', bgcolor: '#0A2A19' }}>
        <CircularProgress sx={{ color: '#1B6B3E' }} />
      </Box>
    );
  }

  return (
    <Box sx={{
      minHeight: '100vh',
      bgcolor: '#0A2A19',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      p: 2,
      backgroundImage: 'radial-gradient(ellipse at 60% 20%, rgba(27, 107, 62,0.15) 0%, transparent 60%)',
    }}>
      <Box sx={{ width: '100%', maxWidth: 420 }}>
        <Stack direction="row" alignItems="center" justifyContent="center" spacing={1.5} mb={4}>
          <BethraLogo dark to="/admin/login" iconSize={38} fontSize="1.4rem" subtitle="Admin Panel" />
        </Stack>

        <Card sx={{ bgcolor: 'white', borderRadius: 3, boxShadow: '0 25px 60px rgba(0,0,0,0.4)' }}>
          {loading && <LinearProgress sx={{ borderRadius: '12px 12px 0 0', bgcolor: 'rgba(27, 107, 62,0.1)', '& .MuiLinearProgress-bar': { bgcolor: '#1B6B3E' } }} />}
          <CardContent sx={{ p: 4 }}>
            {!inviteToken && (
              <Alert severity="error">Invalid or missing invite link. Please request a new invite.</Alert>
            )}

            {inviteToken && !done && (
              <>
                <Typography variant="h5" fontWeight={800} gutterBottom>Accept Admin Invite</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Set up your admin account to complete the invitation.
                </Typography>

                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                <Box component="form" onSubmit={handleSubmit}>
                  <Stack spacing={2}>
                    <TextField label="Full name" value={fullName} onChange={e => setFullName(e.target.value)} fullWidth required autoFocus />
                    <TextField
                      label="Password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      fullWidth required
                      slotProps={{
                        input: {
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton size="small" onClick={() => setShowPassword(p => !p)}>
                                {showPassword ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                              </IconButton>
                            </InputAdornment>
                          ),
                        },
                      }}
                    />
                    {password && (
                      <Box sx={{ bgcolor: 'grey.50', borderRadius: 1.5, p: 1.5 }}>
                        {PASSWORD_RULES.map((rule, i) => (
                          <Stack key={i} direction="row" alignItems="center" spacing={1} sx={{ py: 0.25 }}>
                            {passwordRulesMet[i]
                              ? <CheckCircleIcon sx={{ fontSize: 15, color: 'success.main' }} />
                              : <RadioButtonUncheckedIcon sx={{ fontSize: 15, color: 'grey.400' }} />}
                            <Typography variant="caption" sx={{ color: passwordRulesMet[i] ? 'success.main' : 'text.secondary' }}>
                              {rule.label}
                            </Typography>
                          </Stack>
                        ))}
                      </Box>
                    )}
                    <TextField
                      label="Confirm password"
                      type="password"
                      value={confirm}
                      onChange={e => setConfirm(e.target.value)}
                      fullWidth required
                      error={!!confirm && password !== confirm}
                      helperText={confirm && password !== confirm ? 'Passwords do not match' : ''}
                    />
                    <Button type="submit" variant="contained" size="large" fullWidth disabled={loading} sx={{ bgcolor: '#1B6B3E', '&:hover': { bgcolor: '#0F3D24' }, fontWeight: 700 }}>
                      {loading ? 'Creating account…' : 'Create Account'}
                    </Button>
                  </Stack>
                </Box>
              </>
            )}

            {done && (
              <Box sx={{ textAlign: 'center', py: 2 }}>
                <CheckCircleIcon sx={{ fontSize: 48, color: 'success.main', mb: 2 }} />
                <Typography variant="h6" fontWeight={700} gutterBottom>Account created!</Typography>
                <Typography color="text.secondary" sx={{ mb: 3 }}>
                  Your admin account is ready. Sign in to get started.
                </Typography>
                <Button variant="contained" onClick={() => navigate('/admin/login', { replace: true })} sx={{ bgcolor: '#1B6B3E', '&:hover': { bgcolor: '#0F3D24' } }}>
                  Sign In
                </Button>
              </Box>
            )}
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
