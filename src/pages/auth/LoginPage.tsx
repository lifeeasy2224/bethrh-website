import React, { useState, useEffect, useRef } from 'react';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Stack from '@mui/material/Stack';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { LoginIcon } from '../../components/rtlIcons';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { restorePendingIdea } from '../../lib/pendingIdea';
import BethraLogo from '../../components/BethraLogo';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, user, profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const justLoggedIn = useRef(false);

  const searchParams = new URLSearchParams(location.search);
  const redirectParam = searchParams.get('redirect');
  const navState = location.state as { from?: Location; notice?: string } | null;
  const stateFrom = navState?.from;
  const from = redirectParam ?? (stateFrom ? stateFrom.pathname + (stateFrom.search ?? '') : null);

  // One-off success message handed over by another page (e.g. after a password reset).
  const notice = navState?.notice ?? '';
  const [noticeOpen, setNoticeOpen] = useState(!!notice);

  // Redirect after login once auth state + profile are both settled
  useEffect(() => {
    if (!justLoggedIn.current) return;
    if (authLoading) return;
    if (!user) return;
    justLoggedIn.current = false;
    void (async () => {
      // §4 bridge: an anon user who validated + stashed an idea, then logs in to
      // an EXISTING account (skipping onboarding), gets their idea created now and
      // lands on the journey. Idempotent — clears the stash, so it can't double.
      if (profile?.role !== 'investor') {
        const restoredId = await restorePendingIdea(user.id);
        if (restoredId) {
          navigate('/journey/canvas', { replace: true });
          return;
        }
      }
      if (from) {
        navigate(from, { replace: true });
      } else if (profile?.role === 'investor') {
        navigate('/investor/dashboard', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    })();
  }, [user, profile, authLoading, from, navigate]);

  // If already logged in, redirect immediately
  useEffect(() => {
    if (!authLoading && user) {
      if (from) {
        navigate(from, { replace: true });
      } else if (profile?.role === 'investor') {
        navigate('/investor/dashboard', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error: err } = await signIn(email.trim(), password);
    if (err) {
      const msg = (err.message ?? '').toLowerCase();
      const isUnconfirmed = msg.includes('not confirmed') || msg.includes('email not confirmed')
        || (err as { code?: string }).code === 'email_not_confirmed';
      setError(isUnconfirmed
        ? 'يرجى تأكيد بريدك الإلكتروني أولاً — تفقّد صندوق الوارد للعثور على رابط التفعيل الذي أرسلناه عند التسجيل.'
        : 'البريد الإلكتروني أو كلمة المرور غير صحيحة. حاول مرة أخرى.');
      setLoading(false);
    } else {
      justLoggedIn.current = true;
    }
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#FAF8F3', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ py: 2.5, px: 4, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'white' }}>
        <BethraLogo iconSize={26} fontSize="1.1rem" />
      </Box>

      <Container maxWidth="xs" sx={{ flex: 1, display: 'flex', alignItems: 'center', py: 6 }}>
        <Box sx={{ width: '100%' }}>
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Typography variant="h3" fontWeight={700} gutterBottom>أهلاً بعودتك</Typography>
            <Typography color="text.secondary">سجّل الدخول إلى حسابك في بذرة</Typography>
          </Box>

          <Card sx={{ p: { xs: 3, sm: 4 } }}>
            <form onSubmit={handleSubmit}>
              <Stack spacing={2.5}>
                {error && <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>}

                <TextField
                  label="البريد الإلكتروني"
                  type="email"
                  required
                  fullWidth
                  autoFocus
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />

                <TextField
                  label="كلمة المرور"
                  type={showPass ? 'text' : 'password'}
                  required
                  fullWidth
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  slotProps={{
                    input: {
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton onClick={() => setShowPass(!showPass)} edge="end" size="small">
                            {showPass ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                          </IconButton>
                        </InputAdornment>
                      ),
                    },
                  }}
                />

                <Box sx={{ textAlign: 'right', mt: -1 }}>
                  <Typography component={Link} to="/forgot-password" variant="body2" sx={{ color: 'primary.main', textDecoration: 'none', fontWeight: 500 }}>
                    نسيت كلمة المرور؟
                  </Typography>
                </Box>

                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  fullWidth
                  disabled={loading || !email.trim() || !password}
                  startIcon={<LoginIcon />}
                >
                  {loading ? 'جارٍ تسجيل الدخول…' : 'تسجيل الدخول ←'}
                </Button>
              </Stack>
            </form>
          </Card>

          <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mt: 3 }}>
            ليس لديك حساب؟{' '}
            <Typography component={Link} to="/signup" variant="body2" sx={{ color: 'primary.main', fontWeight: 600, textDecoration: 'none' }}>
              أنشئ حساباً مجاناً
            </Typography>
          </Typography>
        </Box>
      </Container>

      <Snackbar open={noticeOpen} autoHideDuration={6000} onClose={() => setNoticeOpen(false)} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
        <Alert severity="success" variant="filled" onClose={() => setNoticeOpen(false)}>{notice}</Alert>
      </Snackbar>
    </Box>
  );
}
