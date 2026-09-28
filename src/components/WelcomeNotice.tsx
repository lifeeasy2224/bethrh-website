import { useState, useEffect } from 'react';
import Dialog from '@mui/material/Dialog';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import SmartToyOutlinedIcon from '@mui/icons-material/SmartToyOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import { Link } from 'react-router-dom';

const SEEN_KEY = 'bethra_welcome_seen';

/**
 * One-time welcome modal for new visitors: explains Bethra is run by AI and
 * how ideas are handled (links to /privacy). Shown once (localStorage), prerender-safe
 * (localStorage is only read in an effect, so the dialog defaults closed).
 */
export default function WelcomeNotice() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(SEEN_KEY)) setOpen(true);
    } catch { /* localStorage unavailable — skip */ }
  }, []);

  function dismiss() {
    try { localStorage.setItem(SEEN_KEY, '1'); } catch { /* ignore */ }
    setOpen(false);
  }

  return (
    <Dialog
      open={open}
      onClose={dismiss}
      maxWidth="xs"
      fullWidth
      PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden' } }}
    >
      {/* Header */}
      <Box sx={{ bgcolor: '#0F3D24', color: 'white', px: 4, pt: 4, pb: 3, textAlign: 'center' }}>
        <Box
          sx={{
            width: 56, height: 56, borderRadius: '50%',
            bgcolor: 'rgba(212,166,83,0.15)', color: '#D4A653',
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center', mb: 1.5,
          }}
        >
          <SmartToyOutlinedIcon sx={{ fontSize: 30 }} />
        </Box>
        <Typography variant="h6" fontWeight={800}>تُدار بالذكاء الاصطناعي ١٠٠٪</Typography>
        <Typography variant="body2" sx={{ color: 'rgba(247,243,236,0.7)', mt: 0.5 }}>
          أفكارك في أمان — ذكاءٌ يعمل من أجلك فقط.
        </Typography>
      </Box>

      {/* Body */}
      <Box sx={{ px: 4, py: 3 }}>
        <Stack spacing={2}>
          <Stack direction="row" spacing={1.5} alignItems="flex-start">
            <LockOutlinedIcon sx={{ color: '#2A8A52', fontSize: 22, mt: 0.25, flexShrink: 0 }} />
            <Typography variant="body2" color="text.secondary">
              <strong>أفكارك ملكك.</strong> لا نبيع بياناتك، ولا نشاركها مع أي جهة لأغراض تسويقية. تُعالَج أفكارك بالذكاء الاصطناعي عبر مزوّدنا (Anthropic) لتقديم التحليل والتدريب فقط، ولا يطّلع فريق بذرة على محتواك إلا عند الحاجة لتقديم الدعم أو حماية المنصة.{' '}
              {/* The dialog is global, so close it when navigating away. */}
              <Typography component={Link} to="/privacy" onClick={dismiss} variant="body2" sx={{ color: 'primary.main', fontWeight: 600, textDecoration: 'none' }}>
                اقرأ سياسة الخصوصية
              </Typography>
            </Typography>
          </Stack>
          <Stack direction="row" spacing={1.5} alignItems="flex-start">
            <MailOutlineIcon sx={{ color: '#A07830', fontSize: 22, mt: 0.25, flexShrink: 0 }} />
            <Typography variant="body2" color="text.secondary">
              تحتاج مساعدة من إنسان؟ <strong>راسلنا</strong> وسيساعدك فريقنا.
            </Typography>
          </Stack>
        </Stack>

        <Button
          fullWidth
          variant="contained"
          onClick={dismiss}
          sx={{ mt: 3, bgcolor: '#D4A653', color: '#0F3D24', fontWeight: 700, py: 1.25, '&:hover': { bgcolor: '#E8C07A' } }}
        >
          فهمت — لنبدأ البناء
        </Button>
      </Box>
    </Dialog>
  );
}
