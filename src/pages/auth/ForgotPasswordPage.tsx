import React, { useState } from 'react';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { Link } from 'react-router-dom';
import { supabase } from '../../supabase';
import BethraLogo from '../../components/BethraLogo';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    const { error: err } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (err) {
      setError(err.message);
      setLoading(false);
    } else {
      setSubmitted(true);
    }
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#FAF8F3', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ py: 2.5, px: 4, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'white' }}>
        <BethraLogo iconSize={26} fontSize="1.1rem" />
      </Box>

      <Container maxWidth="xs" sx={{ flex: 1, display: 'flex', alignItems: 'center', py: 6 }}>
        <Box sx={{ width: '100%' }}>
          {!submitted ? (
            <>
              <Box sx={{ textAlign: 'center', mb: 4 }}>
                <Box sx={{ width: 56, height: 56, borderRadius: '50%', bgcolor: '#F0F5F1', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
                  <MailOutlineIcon sx={{ color: 'primary.main', fontSize: 28 }} />
                </Box>
                <Typography variant="h4" fontWeight={700} gutterBottom>نسيت كلمة المرور؟</Typography>
                <Typography color="text.secondary" variant="body2">
                  أدخل البريد الإلكتروني المرتبط بحسابك وسنرسل لك رابطاً لإعادة تعيين كلمة المرور.
                </Typography>
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

                    <Button
                      type="submit"
                      variant="contained"
                      size="large"
                      fullWidth
                      disabled={loading || !email.trim()}
                    >
                      {loading ? 'جارٍ الإرسال…' : 'أرسل رابط إعادة التعيين'}
                    </Button>
                  </Stack>
                </form>
              </Card>
            </>
          ) : (
            <Card sx={{ p: { xs: 3, sm: 4 }, textAlign: 'center' }}>
              <CheckCircleOutlineIcon sx={{ fontSize: 56, color: 'success.main', mb: 2 }} />
              <Typography variant="h5" fontWeight={700} gutterBottom>تفقّد بريدك الوارد</Typography>
              <Typography color="text.secondary" variant="body2" sx={{ mb: 3 }}>
                أرسلنا رابط إعادة تعيين كلمة المرور إلى <strong>{email}</strong>. تنتهي صلاحية الرابط خلال ساعة.
              </Typography>
              <Typography variant="caption" color="text.secondary">
                لم يصلك؟ تفقّد مجلد الرسائل غير المرغوبة أو{' '}
                <Typography
                  component="span"
                  variant="caption"
                  sx={{ color: 'primary.main', cursor: 'pointer', fontWeight: 600 }}
                  onClick={() => { setSubmitted(false); }}
                >
                  حاول مرة أخرى
                </Typography>.
              </Typography>
            </Card>
          )}

          <Box sx={{ textAlign: 'center', mt: 3 }}>
            <Button component={Link} to="/login" startIcon={<ArrowBackIcon />} sx={{ color: 'text.secondary', textTransform: 'none' }}>
              العودة لتسجيل الدخول
            </Button>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
