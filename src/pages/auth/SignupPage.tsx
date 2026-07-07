import React, { useState } from 'react';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import Alert from '@mui/material/Alert';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import BethraLogo from '../../components/BethraLogo';
import { sendEmail } from '../../lib/sendEmail';
import { supabase } from '../../supabase';

type Role = 'founder' | 'investor';
type Step = 'role' | 'form' | 'confirm';

export default function SignupPage() {
  const [step, setStep] = useState<Step>('role');
  const [role, setRole] = useState<Role | null>(null);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);

  const passwordValid = password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password);

  async function handleResend() {
    setResending(true);
    setError('');
    setResent(false);
    const { error: err } = await supabase.auth.resend({ type: 'signup', email: email.trim() });
    setResending(false);
    if (err) { setError(err.message); return; }
    setResent(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!role || !passwordValid) return;
    setLoading(true);
    setError('');
    const { error: err, needsConfirmation } = await signUp(email.trim(), password, fullName.trim(), role);
    if (err) {
      setError(err.message.includes('already registered') ? 'يوجد حساب مسجّل بهذا البريد الإلكتروني بالفعل.' : err.message);
      setLoading(false);
    } else {
      void sendEmail(email.trim(), 'welcome-email', {
        name: fullName.trim(),
        role: role === 'founder' ? 'Founder' : 'Investor',
        dashboard_url: `${window.location.origin}/${role}/dashboard`,
        unsubscribe_url: `${window.location.origin}/settings`,
      });
      if (needsConfirmation) {
        // Email confirmation required — user isn't logged in yet. Show a
        // "check your email" screen instead of bouncing them to login.
        setStep('confirm');
        setLoading(false);
      } else {
        navigate('/onboarding');
      }
    }
  }

  if (step === 'confirm') {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: '#FAF8F3', display: 'flex', flexDirection: 'column' }}>
        <Box sx={{ py: 2.5, px: 4, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'white' }}>
          <BethraLogo iconSize={26} fontSize="1.1rem" />
        </Box>
        <Container maxWidth="sm" sx={{ flex: 1, display: 'flex', alignItems: 'center', py: 6 }}>
          <Box sx={{ width: '100%', textAlign: 'center' }}>
            <CheckCircleIcon sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
            <Typography variant="h4" fontWeight={700} gutterBottom>شكراً لتسجيلك! 🎉</Typography>
            <Typography color="text.secondary" sx={{ mb: 1 }}>
              أرسلنا رسالة تأكيد إلى <strong>{email.trim()}</strong>.
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 4 }}>
              اضغط على الرابط في الرسالة لتفعيل حسابك، ثم سجّل الدخول.
              لا تجدها؟ تفقّد مجلد الرسائل غير المرغوبة.
            </Typography>
            <Stack spacing={2} alignItems="center">
              <Button variant="contained" size="large" onClick={() => navigate('/login')}>
                الذهاب لتسجيل الدخول
              </Button>
              {resent ? (
                <Typography variant="body2" sx={{ color: 'success.main', fontWeight: 600 }}>
                  ✓ أُعيد إرسال رسالة التأكيد — تفقّد بريدك الوارد والرسائل غير المرغوبة.
                </Typography>
              ) : (
                <Button variant="text" onClick={handleResend} disabled={resending}>
                  {resending ? 'جارٍ الإرسال…' : 'لم تصلك؟ أعد إرسال رسالة التأكيد'}
                </Button>
              )}
              {error && <Alert severity="error" sx={{ width: '100%' }}>{error}</Alert>}
            </Stack>
          </Box>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#FAF8F3', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ py: 2.5, px: 4, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'white' }}>
        <BethraLogo iconSize={26} fontSize="1.1rem" />
      </Box>

      <Container maxWidth="sm" sx={{ flex: 1, display: 'flex', alignItems: 'center', py: 6 }}>
        <Box sx={{ width: '100%' }}>
          {step === 'role' ? (
            <>
              <Box sx={{ textAlign: 'center', mb: 4 }}>
                <Typography variant="h3" fontWeight={700} gutterBottom>انضم إلى بذرة</Typography>
                <Typography color="text.secondary">اختر كيف تريد استخدام بذرة</Typography>
              </Box>

              <Stack spacing={2}>
                {([
                  {
                    role: 'founder' as Role,
                    emoji: '🚀',
                    title: 'أنا رائد أعمال',
                    desc: 'لديّ فكرة وأريد التحقق منها وبناءها وعرضها على المستثمرين.',
                    color: '#1B6B3E',
                    bgColor: '#F0F5F1',
                  },
                  {
                    role: 'investor' as Role,
                    emoji: '💰',
                    title: 'أنا مستثمر',
                    desc: 'أبحث عن أفكار متحقَّق منها مسبقاً ومؤسسين موهوبين لأدعمهم.',
                    color: '#D08A28',
                    bgColor: '#FAF5E9',
                  },
                ]).map(opt => (
                  <Card
                    key={opt.role}
                    onClick={() => { setRole(opt.role); setStep('form'); }}
                    sx={{
                      cursor: 'pointer',
                      border: '2px solid',
                      borderColor: role === opt.role ? opt.color : 'divider',
                      transition: 'all 150ms ease',
                      '&:hover': { borderColor: opt.color, transform: 'translateY(-1px)', boxShadow: 3 },
                    }}
                  >
                    <CardContent sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, p: 3 }}>
                      <Box sx={{ width: 52, height: 52, borderRadius: 2, bgcolor: opt.bgColor, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '1.75rem' }}>
                        {opt.emoji}
                      </Box>
                      <Box>
                        <Typography variant="h6" fontWeight={700}>{opt.title}</Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>{opt.desc}</Typography>
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </Stack>

              <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mt: 3 }}>
                لديك حساب بالفعل؟{' '}
                <Typography component={Link} to="/login" variant="body2" sx={{ color: 'primary.main', fontWeight: 600, textDecoration: 'none' }}>
                  تسجيل الدخول
                </Typography>
              </Typography>
            </>
          ) : (
            <>
              <Box sx={{ textAlign: 'center', mb: 4 }}>
                <Box sx={{ width: 56, height: 56, borderRadius: 2, bgcolor: role === 'founder' ? '#F0F5F1' : '#F0F5F1', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.75rem', mb: 2 }}>
                  {role === 'founder' ? '🚀' : '💰'}
                </Box>
                <Typography variant="h4" fontWeight={700} gutterBottom>
                  {role === 'founder' ? 'أنشئ حساب رائد الأعمال' : 'أنشئ حساب المستثمر'}
                </Typography>
                <Typography color="text.secondary" variant="body2">
                  {role === 'founder' ? 'لست رائد أعمال؟' : 'لست مستثمراً؟'}{' '}
                  <Typography component="span" sx={{ color: 'primary.main', cursor: 'pointer', fontWeight: 600 }} onClick={() => setStep('role')}>
                    ارجع
                  </Typography>
                </Typography>
              </Box>

              <Card sx={{ p: { xs: 3, sm: 4 } }}>
                <form onSubmit={handleSubmit}>
                  <Stack spacing={2.5}>
                    {error && <Alert severity="error" sx={{ borderRadius: 2 }}>{error}</Alert>}

                    <TextField
                      label="الاسم الكامل"
                      required
                      fullWidth
                      value={fullName}
                      onChange={e => setFullName(e.target.value)}
                      autoFocus
                    />

                    <TextField
                      label="البريد الإلكتروني"
                      type="email"
                      required
                      fullWidth
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
                      helperText="٨ أحرف على الأقل، حرف كبير واحد، ورقم واحد"
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

                    {/* Password strength */}
                    {password.length > 0 && (
                      <Stack spacing={0.5}>
                        {[
                          { label: '٨ أحرف على الأقل', pass: password.length >= 8 },
                          { label: 'حرف كبير واحد (بالإنجليزية)', pass: /[A-Z]/.test(password) },
                          { label: 'رقم واحد', pass: /[0-9]/.test(password) },
                        ].map(r => (
                          <Stack key={r.label} direction="row" spacing={0.75} alignItems="center">
                            <CheckCircleIcon sx={{ fontSize: 14, color: r.pass ? 'success.main' : 'text.disabled' }} />
                            <Typography variant="caption" sx={{ color: r.pass ? 'success.main' : 'text.disabled' }}>{r.label}</Typography>
                          </Stack>
                        ))}
                      </Stack>
                    )}

                    <Button
                      type="submit"
                      variant="contained"
                      size="large"
                      fullWidth
                      disabled={loading || !fullName.trim() || !email.trim() || !passwordValid}
                      startIcon={role === 'founder' ? <RocketLaunchIcon /> : <MonetizationOnIcon />}
                    >
                      {loading ? 'جارٍ إنشاء الحساب…' : 'أنشئ حسابك ←'}
                    </Button>

                    <Divider>
                      <Typography variant="caption" color="text.secondary">أو</Typography>
                    </Divider>

                    <Button
                      variant="outlined"
                      fullWidth
                      disabled
                      sx={{ color: 'text.secondary', justifyContent: 'center', gap: 1 }}
                    >
                      <img src="https://www.google.com/favicon.ico" width="16" height="16" alt="" />
                      المتابعة بحساب Google (قريباً)
                    </Button>
                  </Stack>
                </form>
              </Card>

              <Typography variant="caption" color="text.secondary" textAlign="center" sx={{ mt: 2.5, display: 'block' }}>
                بتسجيلك أنت توافق على{' '}
                <Typography component={Link} to="/terms" variant="caption" sx={{ color: 'primary.main', textDecoration: 'none' }}>الشروط والأحكام</Typography>
                {' '}و{' '}
                <Typography component={Link} to="/privacy" variant="caption" sx={{ color: 'primary.main', textDecoration: 'none' }}>سياسة الخصوصية</Typography>
              </Typography>

              <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ mt: 1.5 }}>
                لديك حساب بالفعل؟{' '}
                <Typography component={Link} to="/login" variant="body2" sx={{ color: 'primary.main', fontWeight: 600, textDecoration: 'none' }}>
                  تسجيل الدخول
                </Typography>
              </Typography>
            </>
          )}
        </Box>
      </Container>
    </Box>
  );
}
