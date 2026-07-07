import { useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import Link from '@mui/material/Link';
import LinearProgress from '@mui/material/LinearProgress';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { useAdminAuth } from '../../contexts/AdminAuthContext';
import BethraLogo from '../../components/BethraLogo';

export default function AdminVerify2FAPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { verifyTotp } = useAdminAuth();
  const sessionToken = (location.state as { session_token: string } | null)?.session_token ?? '';

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [useBackup, setUseBackup] = useState(false);
  const [code, setCode] = useState(['', '', '', '', '', '']);
  const [backupCode, setBackupCode] = useState('');
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  if (!sessionToken) {
    navigate('/admin/login', { replace: true });
    return null;
  }

  function handleDigit(index: number, value: string) {
    if (!/^\d*$/.test(value)) return;
    const newCode = [...code];
    newCode[index] = value.slice(-1);
    setCode(newCode);
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
    if (newCode.every(d => d !== '')) {
      submit(newCode.join(''));
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  async function submit(totpCode?: string) {
    const finalCode = totpCode ?? code.join('');
    if (!useBackup && finalCode.length < 6) return;
    setError('');
    setLoading(true);
    try {
      await verifyTotp(sessionToken, useBackup ? '' : finalCode, useBackup ? backupCode : undefined);
      navigate('/admin/dashboard', { replace: true });
    } catch (err) {
      setError((err as Error).message);
      setCode(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
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
      <Box sx={{ width: '100%', maxWidth: 400 }}>
        {/* Logo */}
        <Stack direction="row" alignItems="center" justifyContent="center" spacing={1.5} mb={4}>
          <BethraLogo dark to="/admin/login" iconSize={38} fontSize="1.4rem" subtitle="Admin Panel" />
        </Stack>

        <Card sx={{ bgcolor: 'white', borderRadius: 3, boxShadow: '0 25px 60px rgba(0,0,0,0.4)' }}>
          {loading && <LinearProgress sx={{ borderRadius: '12px 12px 0 0', bgcolor: 'rgba(27, 107, 62,0.1)', '& .MuiLinearProgress-bar': { bgcolor: '#1B6B3E' } }} />}
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ textAlign: 'center', mb: 3 }}>
              <Box sx={{ width: 52, height: 52, borderRadius: '14px', bgcolor: 'rgba(27, 107, 62,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2 }}>
                <LockOutlinedIcon sx={{ color: '#1B6B3E', fontSize: 26 }} />
              </Box>
              <Typography variant="h5" fontWeight={800} gutterBottom>Two-Factor Authentication</Typography>
              <Typography variant="body2" color="text.secondary">
                {useBackup ? 'Enter one of your 8-character backup codes.' : 'Enter the 6-digit code from your authenticator app.'}
              </Typography>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

            {!useBackup ? (
              <>
                <Stack direction="row" spacing={1} justifyContent="center" mb={3}>
                  {code.map((digit, i) => (
                    <TextField
                      key={i}
                      value={digit}
                      onChange={e => handleDigit(i, e.target.value)}
                      onKeyDown={e => handleKeyDown(i, e as React.KeyboardEvent<HTMLInputElement>)}
                      inputRef={el => { inputRefs.current[i] = el; }}
                      inputProps={{ maxLength: 1, style: { textAlign: 'center', fontSize: '1.5rem', fontWeight: 700, padding: '10px 0' } }}
                      sx={{ width: 48 }}
                    />
                  ))}
                </Stack>
                <Button
                  variant="contained"
                  fullWidth
                  size="large"
                  disabled={loading || code.some(d => !d)}
                  onClick={() => submit()}
                  sx={{ bgcolor: '#1B6B3E', '&:hover': { bgcolor: '#0F3D24' }, fontWeight: 700, mb: 2 }}
                >
                  {loading ? 'Verifying…' : 'Verify'}
                </Button>
              </>
            ) : (
              <>
                <TextField
                  label="Backup code"
                  value={backupCode}
                  onChange={e => setBackupCode(e.target.value.toUpperCase())}
                  fullWidth
                  placeholder="XXXXXXXX"
                  inputProps={{ style: { fontFamily: 'monospace', letterSpacing: '0.2em', fontSize: '1.1rem' } }}
                  sx={{ mb: 2 }}
                />
                <Button
                  variant="contained"
                  fullWidth
                  size="large"
                  disabled={loading || backupCode.length < 8}
                  onClick={() => submit()}
                  sx={{ bgcolor: '#1B6B3E', '&:hover': { bgcolor: '#0F3D24' }, fontWeight: 700, mb: 2 }}
                >
                  {loading ? 'Verifying…' : 'Use Backup Code'}
                </Button>
              </>
            )}

            <Divider sx={{ mb: 2 }} />
            <Stack spacing={1} alignItems="center">
              <Link
                component="button"
                variant="body2"
                onClick={() => { setUseBackup(p => !p); setError(''); }}
                sx={{ color: '#1B6B3E' }}
              >
                {useBackup ? 'Use authenticator app instead' : "Don't have access? Use a backup code"}
              </Link>
              <Link
                component="button"
                variant="body2"
                onClick={() => navigate('/admin/login', { replace: true })}
                sx={{ color: 'text.secondary' }}
              >
                Back to sign in
              </Link>
            </Stack>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}
