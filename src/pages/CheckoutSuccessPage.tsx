import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import CircularProgress from '@mui/material/CircularProgress';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useAuth } from '../contexts/AuthContext';

const REDIRECT_DELAY = 5000;

export default function CheckoutSuccessPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { profile, refreshProfile } = useAuth();
  const [countdown, setCountdown] = useState(REDIRECT_DELAY / 1000);

  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    // Refresh the profile so the new plan is reflected immediately
    refreshProfile();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          const dashboard = profile?.role === 'investor' ? '/investor/dashboard' : '/dashboard';
          navigate(dashboard);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [navigate, profile]);

  function goToDashboard() {
    const dashboard = profile?.role === 'investor' ? '/investor/dashboard' : '/dashboard';
    navigate(dashboard);
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'grey.50',
      }}
    >
      <Container maxWidth="sm">
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Box
            sx={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              bgcolor: 'success.light',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 3,
            }}
          >
            <CheckCircleIcon sx={{ fontSize: 44, color: 'success.dark' }} />
          </Box>

          <Typography variant="h4" fontWeight={800} gutterBottom>
            كل شيء جاهز!
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 4, fontSize: '1.05rem' }}>
            اشتراكك مفعّل الآن. أهلاً بك في بذرة.
          </Typography>

          {sessionId && (
            <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mb: 3 }}>
              الجلسة: {sessionId.slice(0, 24)}...
            </Typography>
          )}

          <Button
            variant="contained"
            size="large"
            onClick={goToDashboard}
            sx={{ py: 1.5, px: 4, fontWeight: 700, fontSize: '1rem', mb: 2 }}
          >
            اذهب إلى لوحة التحكم
          </Button>

          <Stack direction="row" spacing={1} justifyContent="center" alignItems="center">
            <CircularProgress size={14} thickness={5} color="inherit" sx={{ color: 'text.disabled' }} />
            <Typography variant="caption" color="text.disabled">
              سيُعاد توجيهك خلال {countdown} ث...
            </Typography>
          </Stack>
        </Box>
      </Container>
    </Box>
  );
}
