import React from 'react';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import LightbulbOutlinedIcon from '@mui/icons-material/LightbulbOutlined';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import SmartToyOutlinedIcon from '@mui/icons-material/SmartToyOutlined';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import MenuIcon from '@mui/icons-material/Menu';
import HandshakeOutlinedIcon from '@mui/icons-material/HandshakeOutlined';
import RocketLaunchIcon from '@mui/icons-material/RocketLaunch';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { PLAN_LABELS } from '../supabase';
import BethraLogo from './BethraLogo';

const SIDEBAR_WIDTH = 260;
const SIDEBAR_COLLAPSED = 64;

const FOUNDER_NAV = [
  { label: 'العودة للرئيسية', icon: <HomeOutlinedIcon />, to: '/', dividerBefore: false },
  { label: 'لوحة التحكم', icon: <DashboardOutlinedIcon />, to: '/dashboard', dividerBefore: true },
  { label: 'مكتبة الأفكار', icon: <LightbulbOutlinedIcon />, to: '/ideas-library', dividerBefore: false },
  { label: 'رحلتي', icon: <TrendingUpIcon />, to: '/journey', dividerBefore: false },
  { label: 'مجموعاتي', icon: <GroupsOutlinedIcon />, to: '/groups', dividerBefore: false },
  { label: 'التواصلات', icon: <HandshakeOutlinedIcon />, to: '/connections', dividerBefore: false },
  { label: 'المدرّب الذكي', icon: <SmartToyOutlinedIcon />, to: '/ai-coach', dividerBefore: false },
];

const BOTTOM_NAV = [
  { label: 'المساعدة', icon: <HelpOutlineIcon />, to: '/help' },
  { label: 'الإعدادات', icon: <SettingsOutlinedIcon />, to: '/settings' },
];

interface NavItemProps {
  item: { label: string; icon: React.ReactNode; to: string };
  active: boolean;
  collapsed: boolean;
}

function NavItem({ item, active, collapsed }: NavItemProps) {
  const content = (
    <Box
      component={Link}
      to={item.to}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        px: 2,
        py: 1.25,
        borderRadius: 1.5,
        textDecoration: 'none',
        transition: 'all 150ms ease',
        bgcolor: active ? 'primary.main' : 'transparent',
        color: active ? 'white' : 'grey.400',
        '&:hover': {
          bgcolor: active ? 'primary.dark' : 'grey.800',
          color: 'white',
        },
      }}
    >
      <Box sx={{ fontSize: 20, display: 'flex', flexShrink: 0, color: active ? 'white' : 'grey.500' }}>
        {item.icon}
      </Box>
      {!collapsed && (
        <Typography variant="body2" sx={{ fontWeight: active ? 600 : 500, color: 'inherit', lineHeight: 1.3 }}>
          {item.label}
        </Typography>
      )}
    </Box>
  );

  if (collapsed) {
    return <Tooltip title={item.label} placement="right">{content}</Tooltip>;
  }
  return content;
}

interface Props {
  open: boolean;
  onToggle: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

function SidebarContent({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  const location = useLocation();
  const { profile } = useAuth();
  const plan = profile?.plan ?? 'free';
  const planLabel = PLAN_LABELS[plan] ?? 'مجاني';

  return (
    <Box sx={{
      width: open ? SIDEBAR_WIDTH : SIDEBAR_COLLAPSED,
      height: '100%',
      bgcolor: '#0A2A19',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      transition: 'width 250ms ease',
    }}>
      {/* Logo */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: open ? 'space-between' : 'center', px: open ? 2 : 0, py: 2, minHeight: 64, flexShrink: 0 }}>
        {open && <BethraLogo dark to="/dashboard" iconSize={26} fontSize="1.05rem" />}
        <IconButton onClick={onToggle} size="small" sx={{ color: 'grey.500', '&:hover': { color: 'white' } }}>
          {open ? <ChevronLeftIcon fontSize="small" /> : <MenuIcon fontSize="small" />}
        </IconButton>
      </Box>

      <Divider sx={{ borderColor: 'grey.800' }} />

      {/* Main nav */}
      <Box sx={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', px: 1, py: 1 }}>
        {FOUNDER_NAV.map((item, i) => (
          <React.Fragment key={item.to}>
            {item.dividerBefore && i > 0 && <Divider sx={{ my: 1, borderColor: 'grey.800' }} />}
            <NavItem item={item} active={location.pathname === item.to} collapsed={!open} />
          </React.Fragment>
        ))}
      </Box>

      {/* Bottom nav */}
      <Box sx={{ px: 1, pb: 1 }}>
        <Divider sx={{ borderColor: 'grey.800', mb: 1 }} />
        {BOTTOM_NAV.map(item => (
          <NavItem key={item.to} item={item} active={location.pathname === item.to} collapsed={!open} />
        ))}

        {/* Plan badge + upgrade CTA */}
        {open && (
          <Box sx={{ mt: 1, mx: 1, p: 1.5, borderRadius: 2, bgcolor: 'grey.800', border: '1px solid', borderColor: 'grey.700' }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" mb={1}>
              <Typography variant="caption" sx={{ color: 'grey.300', fontWeight: 600 }}>خطتك الحالية</Typography>
              <Chip
                label={planLabel}
                size="small"
                sx={{
                  bgcolor: plan === 'free' ? 'grey.700' : 'primary.main',
                  color: 'white',
                  fontWeight: 700,
                  height: 20,
                  fontSize: '0.65rem',
                }}
              />
            </Stack>
            {plan === 'free' && (
              <Button
                component={Link}
                to="/pricing"
                size="small"
                fullWidth
                variant="contained"
                startIcon={<RocketLaunchIcon sx={{ fontSize: '14px !important' }} />}
                sx={{ fontSize: '0.75rem', py: 0.75, background: 'linear-gradient(135deg, #1B6B3E, #D4A653)', color: '#1A1A1A' }}
              >
                ترقية ←
              </Button>
            )}
          </Box>
        )}
      </Box>
    </Box>
  );
}

export default function FounderSidebar({ open, onToggle, mobileOpen, onMobileClose }: Props) {
  return (
    <>
      {/* Desktop permanent */}
      <Box sx={{ display: { xs: 'none', lg: 'block' }, flexShrink: 0, width: open ? SIDEBAR_WIDTH : SIDEBAR_COLLAPSED, transition: 'width 250ms ease' }}>
        <Box sx={{ position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: (t) => t.zIndex.drawer, overflow: 'hidden' }}>
          <SidebarContent open={open} onToggle={onToggle} />
        </Box>
      </Box>

      {/* Mobile temporary */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onMobileClose}
        ModalProps={{ keepMounted: true }}
        sx={{ display: { lg: 'none' }, '& .MuiDrawer-paper': { width: SIDEBAR_WIDTH, border: 'none', bgcolor: 'transparent' } }}
      >
        <SidebarContent open={true} onToggle={onMobileClose} />
      </Drawer>
    </>
  );
}
