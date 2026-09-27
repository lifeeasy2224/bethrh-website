import React, { useState, useEffect } from 'react';
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
import CircularProgress from '@mui/material/CircularProgress';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import LockResetOutlinedIcon from '@mui/icons-material/LockResetOutlined';
import LinkOffIcon from '@mui/icons-material/LinkOff';
import { Link, useNavigate } from 'react-router-dom';
import { supabase, hasPasswordRecoveryEvent, clearPasswordRecoveryEvent } from '../supabase';
import BethraLogo from '../components/BethraLogo';

const MIN_LENGTH = 8;

type Status = 'checking' | 'ready' | 'invalid';

export default function ResetPasswordPage() {
  const [status, setStatus] = useState<Status>('checking');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Only a genuine PASSWORD_RECOVERY event unlocks the form — an existing
  // session isn't enough, because Supabase keeps a signed-in user's session
  // even when their recovery link has expired or was already used.
  useEffect(() => {
    let active = true;

    // In case the link is still being processed when this page mounts.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (active && event === 'PASSWORD_RECOVERY') setStatus('ready');
    });

    // getSession() resolves once the client has finished reading the link.
    // Supabase dispatches PASSWORD_RECOVERY on a zero-delay timer queued
    // before that, so deciding on our own zero-delay timer sees the result.
    void supabase.auth.getSession().then(() => {
      setTimeout(() => {
        if (!active) return;
        setStatus(s => (s === 'ready' || hasPasswordRecoveryEvent() ? 'ready' : 'invalid'));
      }, 0);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (password.length < MIN_LENGTH) {
      setError('يجب أن تتكوّن كلمة المرور من ٨ أحرف على الأقل.');
      return;
    }
    if (password !== confirm) {
      setError('كلمتا المرور غير متطابقتين.');
      return;
    }

    setLoading(true);
    const { error: err } = await supabase.auth.updateUser({ password });

    if (err) {
      const code = (err as { code?: string }).code;
      if (code === 'same_password') {
        setError('يجب أن تختلف كلمة المرور الجديدة عن كلمة المرور الحالية.');
      } else if (code === 'weak_password') {
        setError('كلمة المرور ضعيفة جداً. استخدم مزيجاً من الأحرف والأرقام والرموز.');
      } else if (code === 'session_not_found' || code === 'session_expired' || err.name === 'AuthSessionMissingError') {
        setStatus('invalid');
      } else {
        setError('تعذّر تحديث كلمة المرور. حاول مرة أخرى.');
      }
      setLoading(false);
      return;
    }

    // Sign out everywhere so the founder logs in fresh with the new password.
    // LoginPage also redirects signed-in users straight to their dashboard, so
    // without this the success message would never be seen. If the global
    // sign-out can't reach the server, still clear this browser's session.
    clearPasswordRecoveryEvent();
    const { error: signOutErr } = await supabase.auth.signOut();
    if (signOutErr) await supabase.auth.signOut({ scope: 'local' });

    navigate('/login', {
      replace: true,
      state: { notice: 'تم تغيير كلمة المرور بنجاح. سجّل الدخول بكلمة المرور الجديدة.' },
    });
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#FAF8F3', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ py: 2.5, px: 4, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'white' }}>
        <BethraLogo iconSize={26} fontSize="1.1rem" />
      </Box>

      <Container maxWidth="xs" sx={{ flex: 1, display: 'flex', alignItems: 'center', py: 6 }}>
        <Box sx={{ width: '100%' }}>
          {status === 'checking' && (
            <Box sx={{ textAlign: 'center' }}>
              <CircularProgress />
              <Typography color="text.secondary" variant="body2" sx={{ mt: 2 }}>
                جارٍ التحقق من الرابط…
              </Typography>
            </Box>
          )}

          {status === 'invalid' && (
            <Card sx={{ p: { xs: 3, sm: 4 }, textAlign: 'center' }}>
              <LinkOffIcon sx={{ fontSize: 56, color: 'warning.main', mb: 2 }} />
              <Typography variant="h5" fontWeight={700} gutterBottom>انتهت صلاحية الرابط</Typography>
              <Typography color="text.secondary" variant="body2" sx={{ mb: 3 }}>
                رابط إعادة تعيين كلمة المرور غير صالح أو انتهت صلاحيته أو سبق استخدامه. اطلب رابطاً جديداً وسنرسله إلى بريدك فوراً.
              </Typography>
              <Button component={Link} to="/forgot-password" variant="contained" size="large" fullWidth>
                اطلب رابطاً جديداً
              </Button>
            </Card>
          )}

          {status === 'ready' && (
            <>
              <Box sx={{ textAlign: 'center', mb: 4 }}>
                <Box sx={{ width: 56, height: 56, borderRadius: '50%', bgcolor: '#F0F5F1', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
                  <LockResetOutlinedIcon sx={{ color: 'primary.main', fontSize: 28 }} />
                </Box>
                <Typography variant="h4" fontWeight={700} gutterBottom>تعيين كلمة مرور جديدة</Typography>
                <Typography color="text.secondary" variant="body2">
                  اختر كلمة مرور جديدة لحسابك في بذرة (٨ أحرف على الأقل).
                </Typography>
              </Box>

              <Card sx={{ p: { xs: 3, sm: 4 } }}>
                <form onSubmit={handleSubmit}>
                  <Stack spacing={2.5}>
                    {error && <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>}

                    <TextField
                      label="كلمة المرور الجديدة"
                      type={showPass ? 'text' : 'password'}
                      required
                      fullWidth
                      autoFocus
                      autoComplete="new-password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      slotProps={{
                        input: {
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton
                                onClick={() => setShowPass(!showPass)}
                                edge="end"
                                size="small"
                                aria-label={showPass ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
                              >
                                {showPass ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                              </IconButton>
                            </InputAdornment>
                          ),
                        },
                      }}
                    />

                    <TextField
                      label="تأكيد كلمة المرور"
                      type={showPass ? 'text' : 'password'}
                      required
                      fullWidth
                      autoComplete="new-password"
                      value={confirm}
                      onChange={e => setConfirm(e.target.value)}
                      error={confirm.length > 0 && confirm !== password}
                      helperText={confirm.length > 0 && confirm !== password ? 'كلمتا المرور غير متطابقتين' : ' '}
                    />

                    <Button
                      type="submit"
                      variant="contained"
                      size="large"
                      fullWidth
                      disabled={loading || !password || !confirm}
                    >
                      {loading ? 'جارٍ الحفظ…' : 'حفظ كلمة المرور'}
                    </Button>
                  </Stack>
                </form>
              </Card>
            </>
          )}

          <Box sx={{ textAlign: 'center', mt: 3 }}>
            <Button component={Link} to="/login" sx={{ color: 'text.secondary', textTransform: 'none' }}>
              العودة لتسجيل الدخول
            </Button>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
