import { useLocation } from 'react-router-dom';
import Box from '@mui/material/Box';
import Tooltip from '@mui/material/Tooltip';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';

const WA_URL = 'https://wa.me/14804476256';

export default function WhatsAppFAB() {
  const { pathname } = useLocation();

  if (pathname.startsWith('/admin') || pathname.startsWith('/onboarding')) {
    return null;
  }

  return (
    <Tooltip title="تواصل معنا عبر واتساب" placement="left" arrow>
      <Box
        component="a"
        href={WA_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="تواصل معنا عبر واتساب"
        sx={{
          position: 'fixed',
          bottom: 20,
          right: 20,
          zIndex: 1299,
          width: { xs: 56, sm: 52 },
          height: { xs: 56, sm: 52 },
          borderRadius: '50%',
          bgcolor: '#25D366',
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 20px rgba(37,211,102,0.4)',
          textDecoration: 'none',
          transition: 'transform 200ms ease, box-shadow 200ms ease',
          animation: 'waPulse 30s 3s infinite',
          '@keyframes waPulse': {
            '0%': { boxShadow: '0 4px 20px rgba(37,211,102,0.4)' },
            '2%': { boxShadow: '0 0 0 10px rgba(37,211,102,0.2), 0 4px 20px rgba(37,211,102,0.4)' },
            '4%': { boxShadow: '0 0 0 18px rgba(37,211,102,0.0), 0 4px 20px rgba(37,211,102,0.4)' },
            '100%': { boxShadow: '0 4px 20px rgba(37,211,102,0.4)' },
          },
          '&:hover': {
            transform: 'scale(1.08)',
            boxShadow: '0 6px 24px rgba(37,211,102,0.6)',
          },
        }}
      >
        <WhatsAppIcon sx={{ fontSize: { xs: 28, sm: 26 } }} />
      </Box>
    </Tooltip>
  );
}
