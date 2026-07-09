import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import EmailIcon from '@mui/icons-material/Email';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import { Link } from 'react-router-dom';
import BethraLogo from './BethraLogo';

const WA_URL = 'https://wa.me/14804476256';

const SOCIALS = [
  {
    label: 'Instagram',
    href: 'https://www.instagram.com/lifeeasy6256/',
    hover: '#E4405F',
    path: 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z',
  },
  {
    label: 'TikTok',
    href: 'https://www.tiktok.com/@bethra.co',
    hover: '#ffffff',
    path: 'M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z',
  },
  {
    label: 'Threads',
    href: 'https://www.threads.com/@bethra.co',
    hover: '#ffffff',
    path: 'M12.186 24h-.007c-3.581-.024-6.334-1.205-8.184-3.509C2.35 18.44 1.5 15.586 1.472 12.01v-.017c.03-3.579.879-6.43 2.525-8.482C5.845 1.205 8.6.024 12.18 0h.014c2.746.02 5.043.725 6.826 2.098 1.677 1.29 2.858 3.13 3.509 5.467l-2.04.569c-1.104-3.96-3.898-5.984-8.304-6.015-2.91.022-5.11.936-6.54 2.717C4.307 6.504 3.616 8.914 3.589 12c.027 3.086.718 5.496 2.057 7.164 1.43 1.783 3.631 2.698 6.54 2.717 2.623-.02 4.358-.631 5.8-2.045 1.647-1.613 1.618-3.593 1.09-4.798-.31-.71-.873-1.3-1.634-1.75-.192 1.352-.622 2.446-1.284 3.272-.886 1.102-2.14 1.704-3.73 1.79-1.202.065-2.361-.218-3.259-.801-1.063-.689-1.685-1.74-1.752-2.964-.065-1.19.408-2.285 1.33-3.082.88-.76 2.119-1.207 3.583-1.291a13.853 13.853 0 0 1 3.02.142c-.126-.742-.375-1.332-.75-1.757-.513-.586-1.308-.883-2.359-.89h-.029c-.844 0-1.992.232-2.721 1.32L7.734 7.847c.98-1.454 2.568-2.256 4.478-2.256h.044c3.194.02 5.097 1.975 5.287 5.388.108.046.216.094.322.144 1.49.7 2.58 1.761 3.154 3.07.797 1.82.871 4.79-1.548 7.158-1.85 1.81-4.094 2.628-7.277 2.65Z',
  },
  {
    label: 'LinkedIn',
    href: 'https://www.linkedin.com/company/bethra',
    hover: '#0A66C2',
    path: 'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z',
  },
];

const FOOTER_LINKS = [
  { label: 'المزايا', to: '/#features' },
  { label: 'مكتبة الأفكار', to: '/ideas-library' },
  { label: 'الأسعار', to: '/pricing' },
  { label: 'عن المؤسس', to: '/#founder' },
  { label: 'سياسة الخصوصية', to: '/privacy' },
  { label: 'الشروط والأحكام', to: '/terms' },
  { label: 'مركز المساعدة', to: '/help' },
  { label: 'تواصل معنا', to: '/contact' },
];

export default function Footer() {
  return (
    <Box component="footer" sx={{ bgcolor: '#0A2A19', color: 'rgba(247,243,236,0.6)', pt: 4, pb: 3 }}>
      <Container maxWidth="lg">
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} spacing={2} mb={2}>
          {/* Logo */}
          <BethraLogo dark iconSize={26} fontSize="1rem" />

          {/* Links row */}
          <Stack direction="row" flexWrap="wrap" gap={{ xs: 1.5, sm: 2 }} justifyContent={{ xs: 'flex-start', sm: 'center' }}>
            {FOOTER_LINKS.map(link => (
              <Typography
                key={link.label}
                component={Link}
                to={link.to}
                variant="caption"
                sx={{ color: 'grey.300', textDecoration: 'none', '&:hover': { color: 'white' }, transition: 'color 150ms ease' }}
              >
                {link.label}
              </Typography>
            ))}
          </Stack>

          {/* Contact icons */}
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Box
              component="a"
              href="mailto:info@bethra.co"
              sx={{ color: 'grey.300', display: 'flex', alignItems: 'center', '&:hover': { color: 'white' }, transition: 'color 150ms ease' }}
            >
              <EmailIcon sx={{ fontSize: 18 }} />
            </Box>
            <Box
              component="a"
              href={WA_URL}
              target="_blank"
              rel="noopener noreferrer"
              sx={{ color: 'grey.300', display: 'flex', alignItems: 'center', '&:hover': { color: '#25D366' }, transition: 'color 150ms ease' }}
            >
              <WhatsAppIcon sx={{ fontSize: 18 }} />
            </Box>
            {SOCIALS.map(s => (
              <Box
                key={s.label}
                component="a"
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={s.label}
                sx={{ color: 'grey.300', display: 'flex', alignItems: 'center', '&:hover': { color: s.hover }, transition: 'color 150ms ease' }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                  <path d={s.path} />
                </svg>
              </Box>
            ))}
          </Stack>
        </Stack>

        <Divider sx={{ borderColor: 'grey.800', mb: 2 }} />

        <Typography variant="caption" sx={{ color: 'grey.400' }}>
          © ٢٠٢٦ Life Easy LLC — جميع الحقوق محفوظة.
        </Typography>
      </Container>
    </Box>
  );
}
