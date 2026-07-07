import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import Stepper from '@mui/material/Stepper';
import Chip from '@mui/material/Chip';
import Skeleton from '@mui/material/Skeleton';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import QrCode2Icon from '@mui/icons-material/QrCode2';
import SecurityIcon from '@mui/icons-material/Security';
import { useAdminAuth, ADMIN_API } from '../../contexts/AdminAuthContext';

const STEPS = ['Scan QR Code', 'Verify Code', 'Save Backup Codes'];

export default function AdminSetup2FAPage() {
  const navigate = useNavigate();
  const { admin, sessionToken } = useAdminAuth();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [secret, setSecret] = useState('');
  const [verifyCode, setVerifyCode] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!admin || !sessionToken) return;
    // Generate TOTP secret
    fetch(`${ADMIN_API}/setup-2fa`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
      },
      body: JSON.stringify({ session_token: sessionToken }),
    }).then(r => r.json()).then(async (data: { secret: string; otp_url: string }) => {
      setSecret(data.secret);
      // Generate QR code using qrcode library
      try {
        const QRCode = (await import('qrcode')).default;
        const url = await QRCode.toDataURL(data.otp_url, { width: 220, margin: 2 });
        setQrDataUrl(url);
      } catch {
        setQrDataUrl('');
      }
    }).catch(() => setError('Failed to generate 2FA secret'));
  }, [admin, sessionToken]);

  async function handleConfirm() {
    if (verifyCode.length !== 6) return;
    setError('');
    setLoading(true);
    try {
      const res = await fetch(`${ADMIN_API}/confirm-2fa`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ session_token: sessionToken, totp_code: verifyCode }),
      });
      const data = await res.json() as { backup_codes?: string[]; error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Verification failed');
      setBackupCodes(data.backup_codes ?? []);
      setStep(2);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  function copyBackupCodes() {
    navigator.clipboard.writeText(backupCodes.join('\n'));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (!admin) { navigate('/admin/login', { replace: true }); return null; }

  return (
    <Container maxWidth="sm" sx={{ py: 6 }}>
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Box sx={{ width: 56, height: 56, borderRadius: '14px', bgcolor: 'rgba(27, 107, 62,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2 }}>
          <SecurityIcon sx={{ color: '#1B6B3E', fontSize: 28 }} />
        </Box>
        <Typography variant="h5" fontWeight={800} gutterBottom>Set Up Two-Factor Authentication</Typography>
        <Typography color="text.secondary">Protect your admin account with an authenticator app.</Typography>
      </Box>

      <Stepper activeStep={step} sx={{ mb: 4 }}>
        {STEPS.map(label => (
          <Step key={label}><StepLabel>{label}</StepLabel></Step>
        ))}
      </Stepper>

      <Card>
        <CardContent sx={{ p: 4 }}>
          {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

          {/* Step 0: QR Code */}
          {step === 0 && (
            <Stack spacing={3} alignItems="center">
              <Typography variant="body2" color="text.secondary" textAlign="center">
                Scan this QR code with Google Authenticator, Authy, or any TOTP app.
              </Typography>

              <Box sx={{ p: 2, bgcolor: 'white', borderRadius: 2, border: '1px solid', borderColor: 'grey.200', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 220, height: 220 }}>
                {qrDataUrl
                  ? <img src={qrDataUrl} alt="2FA QR Code" style={{ width: 200, height: 200 }} />
                  : <Skeleton variant="rectangular" width={200} height={200} />}
              </Box>

              <Box sx={{ width: '100%' }}>
                <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Can't scan? Enter manually:
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5, bgcolor: 'grey.100', borderRadius: 1.5, p: 1.5 }}>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace', letterSpacing: '0.15em', flex: 1, wordBreak: 'break-all' }}>
                    {secret || '—'}
                  </Typography>
                  <Button
                    size="small"
                    startIcon={<ContentCopyIcon sx={{ fontSize: 14 }} />}
                    onClick={() => navigator.clipboard.writeText(secret)}
                    sx={{ flexShrink: 0, fontSize: '0.75rem' }}
                  >
                    Copy
                  </Button>
                </Box>
              </Box>

              <Button
                variant="contained"
                fullWidth
                size="large"
                onClick={() => setStep(1)}
                disabled={!secret}
                sx={{ bgcolor: '#1B6B3E', '&:hover': { bgcolor: '#0F3D24' }, fontWeight: 700 }}
              >
                I've scanned the QR code →
              </Button>
            </Stack>
          )}

          {/* Step 1: Verify */}
          {step === 1 && (
            <Stack spacing={3}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 2, bgcolor: 'rgba(27, 107, 62,0.06)', borderRadius: 2 }}>
                <QrCode2Icon sx={{ color: '#1B6B3E' }} />
                <Typography variant="body2">
                  Enter the 6-digit code shown in your authenticator app to verify setup.
                </Typography>
              </Box>
              <TextField
                label="6-digit verification code"
                value={verifyCode}
                onChange={e => setVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                fullWidth
                inputProps={{ style: { fontFamily: 'monospace', fontSize: '1.5rem', letterSpacing: '0.3em', textAlign: 'center' } }}
                placeholder="000000"
                autoFocus
              />
              <Stack direction="row" spacing={2}>
                <Button variant="outlined" onClick={() => setStep(0)} sx={{ flex: 1 }}>Back</Button>
                <Button
                  variant="contained"
                  onClick={handleConfirm}
                  disabled={loading || verifyCode.length !== 6}
                  sx={{ flex: 2, bgcolor: '#1B6B3E', '&:hover': { bgcolor: '#0F3D24' }, fontWeight: 700 }}
                >
                  {loading ? 'Verifying…' : 'Enable 2FA'}
                </Button>
              </Stack>
            </Stack>
          )}

          {/* Step 2: Backup codes */}
          {step === 2 && (
            <Stack spacing={3}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, p: 2, bgcolor: 'rgba(42, 138, 82,0.08)', borderRadius: 2 }}>
                <CheckCircleIcon sx={{ color: 'success.main' }} />
                <Typography variant="body2" fontWeight={600}>2FA enabled successfully!</Typography>
              </Box>

              <Box>
                <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                  Save your backup codes
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Store these somewhere safe. Each code can only be used once if you lose access to your authenticator.
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1, bgcolor: 'grey.50', borderRadius: 2, p: 2 }}>
                  {backupCodes.map(code => (
                    <Chip key={code} label={code} sx={{ fontFamily: 'monospace', fontWeight: 600, bgcolor: 'white' }} />
                  ))}
                </Box>
              </Box>

              <Stack direction="row" spacing={2}>
                <Button
                  variant="outlined"
                  startIcon={<ContentCopyIcon />}
                  onClick={copyBackupCodes}
                  color={copied ? 'success' : 'primary'}
                  sx={{ flex: 1 }}
                >
                  {copied ? 'Copied!' : 'Copy codes'}
                </Button>
                <Button
                  variant="contained"
                  onClick={() => navigate('/admin/dashboard', { replace: true })}
                  sx={{ flex: 2, bgcolor: '#1B6B3E', '&:hover': { bgcolor: '#0F3D24' }, fontWeight: 700 }}
                >
                  Continue to Dashboard
                </Button>
              </Stack>

              <Divider />
              <Alert severity="warning" sx={{ fontSize: '0.8125rem' }}>
                These codes will not be shown again. Make sure you've saved them before continuing.
              </Alert>
            </Stack>
          )}
        </CardContent>
      </Card>
    </Container>
  );
}
