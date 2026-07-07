import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import LinearProgress from '@mui/material/LinearProgress';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import { useAdminAuth, ADMIN_API } from '../../contexts/AdminAuthContext';
import BethraLogo from '../../components/BethraLogo';

interface PasswordRule { label: string; test: (p: string) => boolean; }
const PASSWORD_RULES: PasswordRule[] = [
  { label: 'At least 12 characters', test: p => p.length >= 12 },
  { label: 'One uppercase letter', test: p => /[A-Z]/.test(p) },
  { label: 'One number', test: p => /[0-9]/.test(p) },
  { label: 'One special character', test: p => /[^A-Za-z0-9]/.test(p) },
];

async function checkNeedsSetup(): Promise<boolean> {
  const res = await fetch(`${ADMIN_API}/needs-setup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
    },
    body: '{}',
  });
  const data = await res.json() as { needs_setup: boolean };
  return data.needs_setup;
}

async function setupFirstAdmin(email: string, password: string, fullName: string): Promise<void> {
  const res = await fetch(`${ADMIN_API}/setup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({ email, password, full_name: fullName }),
  });
  const data = await res.json() as { error?: string };
  if (!res.ok) throw new Error(data.error ?? 'Setup failed');
}

export default function AdminLoginPage() {
  const navigate = useNavigate();
  const { admin, login } = useAdminAuth();

  const [isFirstRun, setIsFirstRun] = useState(false);
  const [checking, setChecking] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Login fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Setup fields
  const [setupFullName, setSetupFullName] = useState('');
  const [setupEmail, setSetupEmail] = useState('');
  const [setupPassword, setSetupPassword] = useState('');
  const [setupConfirm, setSetupConfirm] = useState('');
  const [setupDone, setSetupDone] = useState(false);

  useEffect(() => {
    if (admin) { navigate('/admin/dashboard', { replace: true }); return; }
    checkNeedsSetup().then(needs => {
      setIsFirstRun(needs);
      setChecking(false);
    }).catch(() => setChecking(false));
  }, [admin, navigate]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const { requires_2fa, session_token } = await login(email, password);
      if (requires_2fa) {
        navigate('/admin/verify-2fa', { state: { session_token }, replace: true });
      } else {
        navigate('/admin/dashboard', { replace: true });
      }
    } catch (err) {
      const msg = (err as Error).message;
      setError(msg);
    } finally {
      setLoading(false);
    }
  }

  async function handleSetup(e: React.FormEvent) {
    e.preventDefault();
    if (setupPassword !== setupConfirm) { setError('Passwords do not match'); return; }
    const allMet = PASSWORD_RULES.every(r => r.test(setupPassword));
    if (!allMet) { setError('Password does not meet all requirements'); return; }
    setError('');
    setLoading(true);
    try {
      await setupFirstAdmin(setupEmail, setupPassword, setupFullName);
      setSetupDone(true);
      setIsFirstRun(false);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  if (checking) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', bgcolor: '#0A2A19' }}>
        <CircularProgress sx={{ color: '#1B6B3E' }} />
      </Box>
    );
  }

  const passwordRulesMet = PASSWORD_RULES.map(r => r.test(setupPassword));

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
        {/* Logo */}
        <Stack direction="row" alignItems="center" justifyContent="center" spacing={1.5} mb={4}>
          <BethraLogo dark iconSize={38} fontSize="1.4rem" subtitle="Admin Panel" />
        </Stack>

        <Card sx={{ bgcolor: 'white', borderRadius: 3, boxShadow: '0 25px 60px rgba(0,0,0,0.4)' }}>
          {loading && <LinearProgress sx={{ borderRadius: '12px 12px 0 0', bgcolor: 'rgba(27, 107, 62,0.1)', '& .MuiLinearProgress-bar': { bgcolor: '#1B6B3E' } }} />}
          <CardContent sx={{ p: 4 }}>

            {/* ── First-run Setup ── */}
            {isFirstRun && !setupDone && (
              <>
                <Typography variant="h5" fontWeight={800} gutterBottom>Create Super Admin</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  No admin accounts exist yet. Create the first super admin account.
                </Typography>
                <Chip label="First-time Setup" color="warning" size="small" sx={{ mb: 3 }} />

                {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

                <Box component="form" onSubmit={handleSetup}>
                  <Stack spacing={2}>
                    <TextField label="Full name" value={setupFullName} onChange={e => setSetupFullName(e.target.value)} fullWidth required autoFocus />
                    <TextField label="Email address" type="email" value={setupEmail} onChange={e => setSetupEmail(e.target.value)} fullWidth required />
                    <TextField
                      label="Password"
                      type={showPassword ? 'text' : 'password'}
                      value={setupPassword}
                      onChange={e => setSetupPassword(e.target.value)}
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

                    {setupPassword && (
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
                      value={setupConfirm}
                      onChange={e => setSetupConfirm(e.target.value)}
                      fullWidth required
                      error={!!setupConfirm && setupPassword !== setupConfirm}
                      helperText={setupConfirm && setupPassword !== setupConfirm ? 'Passwords do not match' : ''}
                    />
                    <Button type="submit" variant="contained" size="large" fullWidth disabled={loading} sx={{ bgcolor: '#1B6B3E', '&:hover': { bgcolor: '#0F3D24' }, fontWeight: 700, mt: 1 }}>
                      {loading ? 'Creating account…' : 'Create Super Admin Account'}
                    </Button>
                  </Stack>
                </Box>
              </>
            )}

            {/* ── Setup Success ── */}
            {setupDone && (
              <Box sx={{ textAlign: 'center', py: 2 }}>
                <CheckCircleIcon sx={{ fontSize: 48, color: 'success.main', mb: 2 }} />
                <Typography variant="h6" fontWeight={700} gutterBottom>Account created!</Typography>
                <Typography color="text.secondary" sx={{ mb: 3 }}>
                  Your super admin account is ready. Sign in to continue.
                </Typography>
                <Button variant="contained" onClick={() => setSetupDone(false)} sx={{ bgcolor: '#1B6B3E', '&:hover': { bgcolor: '#0F3D24' } }}>
                  Sign In
                </Button>
              </Box>
            )}

            {/* ── Login Form ── */}
            {!isFirstRun && !setupDone && (
              <>
                <Typography variant="h5" fontWeight={800} gutterBottom>Admin Sign In</Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Sign in to access the Bethra admin panel.
                </Typography>

                {error && (
                  <Alert severity={error.includes('locked') ? 'warning' : 'error'} sx={{ mb: 2 }}>
                    {error}
                  </Alert>
                )}

                <Box component="form" onSubmit={handleLogin}>
                  <Stack spacing={2.5}>
                    <TextField
                      label="Email address"
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      fullWidth required autoFocus
                      autoComplete="username"
                    />
                    <TextField
                      label="Password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      fullWidth required
                      autoComplete="current-password"
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
                    <Button type="submit" variant="contained" size="large" fullWidth disabled={loading} sx={{ bgcolor: '#1B6B3E', '&:hover': { bgcolor: '#0F3D24' }, fontWeight: 700 }}>
                      {loading ? 'Signing in…' : 'Sign In'}
                    </Button>
                  </Stack>
                </Box>

                <Divider sx={{ my: 3 }} />
                <Typography variant="caption" color="text.secondary" align="center" display="block">
                  Protected by 2FA and session security. Max 5 login attempts before lockout.
                </Typography>
              </>
            )}
          </CardContent>
        </Card>

        <Typography variant="caption" sx={{ display: 'block', textAlign: 'center', mt: 3, color: 'rgba(255,255,255,0.3)' }}>
          © 2026 Life Easy LLC · Bethra Admin
        </Typography>
      </Box>
    </Box>
  );
}
