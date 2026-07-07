import { useState, useRef } from 'react';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Avatar from '@mui/material/Avatar';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import SmartToyOutlinedIcon from '@mui/icons-material/SmartToyOutlined';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import BethraLogo from './BethraLogo';

const NAVY = '#0F3D24';
const GOLD = '#D4A653';

const PUBLIC_NAV = [
  { label: 'تحقق من فكرتك', to: '/validate', badge: 'مجاناً' },
  { label: 'مكتبة الأفكار', to: '/ideas-library' },
  { label: 'كيف تعمل بذرة', to: '/#how-it-works' },
  { label: 'الأسعار', to: '/pricing' },
];

const FOR_FOUNDERS = [
  { label: 'أصحاب المشاريع الجانبية', to: '/#side-hustlers' },
  { label: 'روّاد بلا واسطة', to: '/#underrepresented-founders' },
  { label: 'الخريجون ومغيّرو المسار', to: '/#career-changers' },
];

export default function NavBar() {
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuAnchor, setUserMenuAnchor] = useState<HTMLElement | null>(null);
  const [foundersAnchor, setFoundersAnchor] = useState<HTMLElement | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const founderNav = [
    { label: 'لوحة التحكم', to: '/dashboard', icon: <DashboardOutlinedIcon sx={{ fontSize: 18 }} /> },
    { label: 'رحلتي', to: '/journey', icon: <TrendingUpIcon sx={{ fontSize: 18 }} /> },
    { label: 'المدرّب الذكي', to: '/ai-coach', icon: <SmartToyOutlinedIcon sx={{ fontSize: 18 }} /> },
  ];

  const investorNav = [
    { label: 'لوحة التحكم', to: '/investor/dashboard', icon: <DashboardOutlinedIcon sx={{ fontSize: 18 }} /> },
    { label: 'السوق', to: '/marketplace', icon: <StorefrontOutlinedIcon sx={{ fontSize: 18 }} /> },
  ];

  const loggedInNav = profile?.role === 'investor' ? investorNav : founderNav;

  async function handleSignOut() {
    setUserMenuAnchor(null);
    await signOut();
    navigate('/');
  }

  const openFounders = (e: React.MouseEvent<HTMLElement>) => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setFoundersAnchor(e.currentTarget);
  };
  const closeFoundersDelayed = () => {
    closeTimer.current = setTimeout(() => setFoundersAnchor(null), 120);
  };
  const keepFoundersOpen = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  };

  const navLinkSx = {
    fontFamily: '"Noto Kufi Arabic", "Nunito Sans", sans-serif',
    fontWeight: 400,
    fontSize: '0.875rem',
    color: 'rgba(255,255,255,0.85)',
    textTransform: 'none' as const,
    letterSpacing: 0,
    px: 1.25,
    py: 0.75,
    minWidth: 0,
    '&:hover': { color: 'white', bgcolor: 'rgba(255,255,255,0.06)' },
  };

  return (
    <>
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          bgcolor: 'rgba(15, 61, 36,0.95)',
          backdropFilter: 'blur(16px)',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          zIndex: t => t.zIndex.appBar,
        }}
      >
        <Toolbar sx={{ maxWidth: 1280, mx: 'auto', width: '100%', px: { xs: 2, sm: 3 }, minHeight: 64, gap: 2 }}>

          {/* Logo */}
          <BethraLogo dark iconSize={28} fontSize="1.0625rem" />

          {/* Desktop nav */}
          {!user ? (
            <Stack direction="row" spacing={0} sx={{ display: { xs: 'none', md: 'flex' }, ml: 4, alignItems: 'center' }}>
              {PUBLIC_NAV.map(item => (
                <Box key={item.label} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Button component={Link} to={item.to} sx={navLinkSx} disableRipple={false}>
                    {item.label}
                  </Button>
                  {item.badge && (
                    <Box sx={{
                      bgcolor: GOLD, color: NAVY,
                      fontFamily: '"Noto Kufi Arabic", "Nunito Sans", sans-serif',
                      fontWeight: 700, fontSize: '0.5625rem',
                      letterSpacing: '0.06em',
                      px: 0.75, py: 0.2,
                      borderRadius: 0.75,
                      textTransform: 'uppercase',
                      lineHeight: 1.4,
                      mt: -1.5,
                      flexShrink: 0,
                    }}>
                      {item.badge}
                    </Box>
                  )}
                </Box>
              ))}

              {/* For Founders dropdown */}
              <Box
                onMouseEnter={openFounders}
                onMouseLeave={closeFoundersDelayed}
                sx={{ display: 'flex', alignItems: 'center', position: 'relative' }}
              >
                <Button
                  endIcon={
                    <KeyboardArrowDownIcon sx={{
                      fontSize: '1rem !important',
                      transition: 'transform 0.2s ease',
                      transform: foundersAnchor ? 'rotate(180deg)' : 'rotate(0deg)',
                    }} />
                  }
                  sx={navLinkSx}
                  disableRipple={false}
                >
                  لروّاد الأعمال
                </Button>

                {/* Inline dropdown — stays within the hover zone */}
                {Boolean(foundersAnchor) && (
                  <Box
                    onMouseEnter={keepFoundersOpen}
                    onMouseLeave={closeFoundersDelayed}
                    sx={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      mt: 0.5,
                      bgcolor: '#123F27',
                      border: '1px solid rgba(255,255,255,0.12)',
                      boxShadow: '0 8px 32px rgba(0,0,0,0.35)',
                      borderRadius: 2,
                      minWidth: 220,
                      zIndex: t => t.zIndex.appBar + 10,
                      py: 0.5,
                    }}
                  >
                    {FOR_FOUNDERS.map(item => (
                      <Box
                        key={item.label}
                        component={Link}
                        to={item.to}
                        onClick={() => {
                          setFoundersAnchor(null);
                          const id = item.to.replace('/#', '');
                          setTimeout(() => {
                            const el = document.getElementById(id);
                            if (!el) return;
                            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            el.classList.add('pulse-highlight');
                            setTimeout(() => el.classList.remove('pulse-highlight'), 1200);
                          }, 50);
                        }}
                        sx={{
                          display: 'block',
                          fontFamily: '"Noto Kufi Arabic", "Nunito Sans", sans-serif',
                          fontWeight: 400,
                          fontSize: '0.875rem',
                          color: 'rgba(255,255,255,0.85)',
                          textDecoration: 'none',
                          py: 1.25, px: 2,
                          '&:hover': { bgcolor: 'rgba(212,166,83,0.05)', color: '#D4A653' },
                        }}
                      >
                        {item.label}
                      </Box>
                    ))}
                  </Box>
                )}
              </Box>
            </Stack>
          ) : (
            <Stack direction="row" spacing={0} sx={{ display: { xs: 'none', md: 'flex' }, ml: 4, alignItems: 'center' }}>
              {loggedInNav.map(item => (
                <Button
                  key={item.label}
                  component={Link}
                  to={item.to}
                  startIcon={item.icon}
                  sx={{ ...navLinkSx, color: 'rgba(255,255,255,0.75)', '& .MuiButton-startIcon': { color: GOLD } }}
                >
                  {item.label}
                </Button>
              ))}
            </Stack>
          )}

          <Box sx={{ flex: 1 }} />

          {/* Desktop right */}
          <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 1 }}>
            {!user ? (
              <>
                <Button
                  component={Link} to="/login"
                  sx={{
                    fontFamily: '"Noto Kufi Arabic", "Nunito Sans", sans-serif',
                    fontWeight: 400, fontSize: '0.875rem',
                    color: 'rgba(255,255,255,0.8)',
                    textTransform: 'none',
                    '&:hover': { color: 'white', bgcolor: 'transparent' },
                  }}
                >
                  تسجيل الدخول
                </Button>
                <Button
                  component={Link} to="/signup"
                  sx={{
                    bgcolor: GOLD, color: NAVY,
                    fontFamily: '"Noto Kufi Arabic", "Nunito Sans", sans-serif',
                    fontWeight: 700, fontSize: '0.875rem',
                    textTransform: 'none',
                    px: 2.5, py: 1,
                    borderRadius: 1.5,
                    boxShadow: 'none',
                    '&:hover': { bgcolor: '#A07830', boxShadow: `0 4px 16px ${GOLD}44` },
                  }}
                >
                  ابدأ مجاناً
                </Button>
              </>
            ) : (
              <>
                <IconButton size="small" sx={{ color: 'rgba(255,255,255,0.6)', '&:hover': { color: 'white' } }}>
                  <NotificationsNoneIcon />
                </IconButton>
                <IconButton onClick={e => setUserMenuAnchor(e.currentTarget)} size="small" sx={{ ml: 0.5 }}>
                  <Avatar sx={{
                    width: 34, height: 34,
                    bgcolor: GOLD, color: NAVY,
                    fontSize: '0.8rem', fontWeight: 700,
                  }}>
                    {profile?.full_name ? profile.full_name[0].toUpperCase() : '?'}
                  </Avatar>
                </IconButton>
                <Menu
                  anchorEl={userMenuAnchor}
                  open={Boolean(userMenuAnchor)}
                  onClose={() => setUserMenuAnchor(null)}
                  slotProps={{
                    paper: {
                      sx: {
                        mt: 1, minWidth: 200,
                        bgcolor: '#123F27',
                        border: '1px solid rgba(255,255,255,0.12)',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.35)',
                        borderRadius: 2, backgroundImage: 'none',
                      },
                    },
                  }}
                >
                  <Box sx={{ px: 2, py: 1.5 }}>
                    <Typography sx={{ fontFamily: '"Noto Kufi Arabic", "Nunito Sans", sans-serif', fontWeight: 600, fontSize: '0.875rem', color: 'white' }}>
                      {profile?.full_name}
                    </Typography>
                    <Typography sx={{ fontFamily: '"Noto Kufi Arabic", "Nunito Sans", sans-serif', fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', textTransform: 'capitalize' }}>
                      {profile?.role === 'investor' ? 'مستثمر' : 'رائد أعمال'} · {profile?.plan === 'free' ? 'البداية' : profile?.plan}
                    </Typography>
                  </Box>
                  <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />
                  <MenuItem
                    component={Link}
                    to={profile?.role === 'investor' ? '/investor/dashboard' : '/dashboard'}
                    onClick={() => setUserMenuAnchor(null)}
                    sx={{ fontFamily: '"Noto Kufi Arabic", "Nunito Sans", sans-serif', fontSize: '0.875rem', color: 'rgba(255,255,255,0.85)', '&:hover': { bgcolor: 'rgba(255,255,255,0.08)', color: 'white' } }}
                  >
                    لوحة التحكم
                  </MenuItem>
                  <MenuItem
                    component={Link} to="/settings"
                    onClick={() => setUserMenuAnchor(null)}
                    sx={{ fontFamily: '"Noto Kufi Arabic", "Nunito Sans", sans-serif', fontSize: '0.875rem', color: 'rgba(255,255,255,0.85)', '&:hover': { bgcolor: 'rgba(255,255,255,0.08)', color: 'white' } }}
                  >
                    الإعدادات
                  </MenuItem>
                  <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />
                  <MenuItem
                    onClick={handleSignOut}
                    sx={{ fontFamily: '"Noto Kufi Arabic", "Nunito Sans", sans-serif', fontSize: '0.875rem', color: '#E05B4C', '&:hover': { bgcolor: 'rgba(224, 91, 76,0.08)' } }}
                  >
                    تسجيل الخروج
                  </MenuItem>
                </Menu>
              </>
            )}
          </Box>

          {/* Mobile hamburger */}
          <IconButton
            sx={{ display: { md: 'none' }, color: 'white' }}
            onClick={() => setMobileOpen(true)}
          >
            <MenuIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* Mobile full-screen overlay */}
      <Box sx={{
        display: { md: 'none' },
        position: 'fixed', inset: 0,
        zIndex: t => t.zIndex.modal,
        bgcolor: NAVY,
        transform: mobileOpen ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        flexDirection: 'column',
        overflow: 'auto',
      }}>
        {/* Mobile header */}
        <Box sx={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          px: 2.5, py: 2,
          borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}>
          <BethraLogo dark iconSize={26} fontSize="1rem" />
          <IconButton onClick={() => setMobileOpen(false)} sx={{ color: 'white' }}>
            <CloseIcon />
          </IconButton>
        </Box>

        {/* Mobile nav links */}
        <Box sx={{ flex: 1, px: 2.5, py: 3 }}>
          {!user ? (
            <Stack spacing={0.5}>
              {/* Validate — first with gold accent */}
              <Button
                component={Link} to="/validate"
                fullWidth
                onClick={() => setMobileOpen(false)}
                sx={{
                  justifyContent: 'flex-start',
                  fontFamily: '"Noto Kufi Arabic", "Nunito Sans", sans-serif',
                  fontWeight: 700, fontSize: '1rem',
                  color: GOLD, textTransform: 'none',
                  py: 1.5, px: 1.5,
                  borderRadius: 1.5,
                  bgcolor: 'rgba(212,166,83,0.08)',
                  border: `1px solid rgba(212,166,83,0.2)`,
                  mb: 1,
                  '&:hover': { bgcolor: 'rgba(212,166,83,0.14)' },
                }}
              >
                تحقق من فكرتك
                <Box component="span" sx={{
                  ml: 1.5, bgcolor: GOLD, color: NAVY,
                  fontWeight: 700, fontSize: '0.5rem',
                  letterSpacing: '0.06em', px: 0.75, py: 0.25,
                  borderRadius: 0.5, textTransform: 'uppercase',
                }}>
                  مجاناً
                </Box>
              </Button>

              {[
                { label: 'مكتبة الأفكار', to: '/ideas-library' },
                { label: 'كيف تعمل بذرة', to: '/#how-it-works' },
                { label: 'الأسعار', to: '/pricing' },
              ].map(item => (
                <Button
                  key={item.label}
                  component={Link} to={item.to}
                  fullWidth
                  onClick={() => setMobileOpen(false)}
                  sx={{
                    justifyContent: 'flex-start',
                    fontFamily: '"Noto Kufi Arabic", "Nunito Sans", sans-serif',
                    fontWeight: 400, fontSize: '1rem',
                    color: 'rgba(255,255,255,0.85)',
                    textTransform: 'none',
                    py: 1.5, px: 1.5, borderRadius: 1.5,
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.06)', color: 'white' },
                  }}
                >
                  {item.label}
                </Button>
              ))}

              <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)', my: 1 }} />
              <Typography sx={{
                fontFamily: '"Noto Kufi Arabic", "Nunito Sans", sans-serif',
                fontWeight: 600, fontSize: '0.7rem',
                color: GOLD, letterSpacing: '0.1em',
                textTransform: 'uppercase', px: 1.5, mb: 0.5,
              }}>
                لروّاد الأعمال
              </Typography>
              {FOR_FOUNDERS.map(item => (
                <Button
                  key={item.label}
                  component={Link} to={item.to}
                  fullWidth
                  onClick={() => {
                    setMobileOpen(false);
                    const id = item.to.replace('/#', '');
                    setTimeout(() => {
                      const el = document.getElementById(id);
                      if (!el) return;
                      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      el.classList.add('pulse-highlight');
                      setTimeout(() => el.classList.remove('pulse-highlight'), 1200);
                    }, 350);
                  }}
                  sx={{
                    justifyContent: 'flex-start',
                    fontFamily: '"Noto Kufi Arabic", "Nunito Sans", sans-serif',
                    fontWeight: 400, fontSize: '0.9375rem',
                    color: 'rgba(255,255,255,0.7)',
                    textTransform: 'none',
                    py: 1.25, px: 1.5, borderRadius: 1.5,
                    '&:hover': { bgcolor: 'rgba(212,166,83,0.05)', color: '#D4A653' },
                  }}
                >
                  {item.label}
                </Button>
              ))}
            </Stack>
          ) : (
            <Stack spacing={0.5}>
              {loggedInNav.map(item => (
                <Button
                  key={item.label}
                  component={Link} to={item.to}
                  fullWidth
                  startIcon={item.icon}
                  onClick={() => setMobileOpen(false)}
                  sx={{
                    justifyContent: 'flex-start',
                    fontFamily: '"Noto Kufi Arabic", "Nunito Sans", sans-serif',
                    fontWeight: 400, fontSize: '1rem',
                    color: 'rgba(255,255,255,0.85)',
                    textTransform: 'none',
                    py: 1.5, px: 1.5, borderRadius: 1.5,
                    '& .MuiButton-startIcon': { color: GOLD },
                    '&:hover': { bgcolor: 'rgba(255,255,255,0.06)', color: 'white' },
                  }}
                >
                  {item.label}
                </Button>
              ))}
            </Stack>
          )}
        </Box>

        {/* Mobile bottom CTA */}
        <Box sx={{ px: 2.5, pb: 4, pt: 2, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
          {!user ? (
            <Stack spacing={1.25}>
              <Button
                component={Link} to="/login"
                fullWidth
                onClick={() => setMobileOpen(false)}
                sx={{
                  fontFamily: '"Noto Kufi Arabic", "Nunito Sans", sans-serif',
                  fontWeight: 400, fontSize: '0.9375rem',
                  color: 'rgba(255,255,255,0.7)',
                  textTransform: 'none', py: 1.5,
                  border: '1px solid rgba(255,255,255,0.15)', borderRadius: 1.5,
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.05)', color: 'white' },
                }}
              >
                تسجيل الدخول
              </Button>
              <Button
                component={Link} to="/signup"
                fullWidth
                onClick={() => setMobileOpen(false)}
                sx={{
                  bgcolor: GOLD, color: NAVY,
                  fontFamily: '"Noto Kufi Arabic", "Nunito Sans", sans-serif',
                  fontWeight: 700, fontSize: '0.9375rem',
                  textTransform: 'none', py: 1.75, borderRadius: 1.5,
                  boxShadow: `0 4px 20px ${GOLD}44`,
                  '&:hover': { bgcolor: '#A07830' },
                }}
              >
                ابدأ مجاناً
              </Button>
            </Stack>
          ) : (
            <Button
              onClick={() => { handleSignOut(); setMobileOpen(false); }}
              fullWidth
              sx={{
                fontFamily: '"Noto Kufi Arabic", "Nunito Sans", sans-serif',
                fontWeight: 400, fontSize: '0.9375rem',
                color: '#E05B4C', textTransform: 'none',
                py: 1.5, border: '1px solid rgba(224, 91, 76,0.25)',
                borderRadius: 1.5,
                '&:hover': { bgcolor: 'rgba(224, 91, 76,0.08)' },
              }}
            >
              تسجيل الخروج
            </Button>
          )}
        </Box>
      </Box>
    </>
  );
}
