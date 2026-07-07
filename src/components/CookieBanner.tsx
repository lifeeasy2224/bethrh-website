import { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Slide from '@mui/material/Slide';
import { Link } from 'react-router-dom';

const STORAGE_KEY = 'bethra_cookie_consent';

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      const t = setTimeout(() => setVisible(true), 800);
      return () => clearTimeout(t);
    }
  }, []);

  function accept() {
    localStorage.setItem(STORAGE_KEY, 'accepted');
    setVisible(false);
  }

  function decline() {
    localStorage.setItem(STORAGE_KEY, 'declined');
    setVisible(false);
  }

  return (
    <Slide direction="up" in={visible} mountOnEnter unmountOnExit>
      <Box
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 1400,
          bgcolor: 'grey.900',
          color: 'grey.100',
          px: { xs: 2, md: 4 },
          py: 2.5,
          borderTop: '1px solid',
          borderColor: 'grey.800',
        }}
      >
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={2}
          alignItems={{ sm: 'center' }}
          justifyContent="space-between"
          maxWidth="lg"
          sx={{ mx: 'auto' }}
        >
          <Typography variant="body2" sx={{ color: 'grey.300', lineHeight: 1.6 }}>
            نستخدم ملفات تعريف ارتباط أساسية فقط لإبقائك مسجّلاً وآمناً.{' '}
            <Typography
              component={Link}
              to="/cookies"
              variant="body2"
              sx={{ color: 'primary.light', textDecoration: 'underline', '&:hover': { color: 'white' } }}
            >
              سياسة ملفات الارتباط
            </Typography>
          </Typography>
          <Stack direction="row" spacing={1.5} flexShrink={0}>
            <Button
              size="small"
              variant="outlined"
              onClick={decline}
              sx={{ color: 'grey.400', borderColor: 'grey.700', '&:hover': { borderColor: 'grey.500', color: 'grey.200' }, whiteSpace: 'nowrap' }}
            >
              رفض
            </Button>
            <Button
              size="small"
              variant="contained"
              onClick={accept}
              sx={{ whiteSpace: 'nowrap' }}
            >
              قبول الكل
            </Button>
          </Stack>
        </Stack>
      </Box>
    </Slide>
  );
}
