import React from 'react';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';
import HandshakeOutlinedIcon from '@mui/icons-material/HandshakeOutlined';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import MenuBookOutlinedIcon from '@mui/icons-material/MenuBookOutlined';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import MenuIcon from '@mui/icons-material/Menu';
import { Link, useLocation } from 'react-router-dom';
import BethraLogo from './BethraLogo';

const SIDEBAR_WIDTH = 260;
const SIDEBAR_COLLAPSED = 64;

const INVESTOR_NAV = [
  { label: 'العودة للرئيسية', icon: <HomeOutlinedIcon />, to: '/', dividerBefore: false },
  { label: 'لوحة التحكم', icon: <DashboardOutlinedIcon />, to: '/investor/dashboard', dividerBefore: true },
  { label: 'السوق', icon: <StorefrontOutlinedIcon />, to: '/marketplace', dividerBefore: false },
  { label: 'تواصلاتي', icon: <HandshakeOutlinedIcon />, to: '/investor/connections', dividerBefore: false },
  { label: 'دليل المستثمر', icon: <MenuBookOutlinedIcon />, to: '/investor/guide', dividerBefore: false },
  { label: 'ملفي الشخصي', icon: <PersonOutlineIcon />, to: '/investor/profile', dividerBefore: false },
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
      <Box sx={{ fontSize: 20, display: 'flex', flexShrink: 0 }}>{item.icon}</Box>
      {!collapsed && (
        <Typography variant="body2" sx={{ fontWeight: active ? 600 : 500, color: 'inherit' }}>
          {item.label}
        </Typography>
      )}
    </Box>
  );
  if (collapsed) return <Tooltip title={item.label} placement="right">{content}</Tooltip>;
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
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: open ? 'space-between' : 'center', px: open ? 2 : 0, py: 2, minHeight: 64 }}>
        {open && <BethraLogo dark to="/investor/dashboard" iconSize={26} fontSize="1.05rem" />}
        <IconButton onClick={onToggle} size="small" sx={{ color: 'grey.500', '&:hover': { color: 'white' } }}>
          {open ? <ChevronLeftIcon fontSize="small" /> : <MenuIcon fontSize="small" />}
        </IconButton>
      </Box>

      <Divider sx={{ borderColor: 'grey.800' }} />

      <Box sx={{ flex: 1, overflowY: 'auto', px: 1, py: 1 }}>
        {INVESTOR_NAV.map((item, i) => (
          <React.Fragment key={item.to}>
            {item.dividerBefore && i > 0 && <Divider sx={{ my: 1, borderColor: 'grey.800' }} />}
            <NavItem item={item} active={location.pathname === item.to} collapsed={!open} />
          </React.Fragment>
        ))}
      </Box>

      <Box sx={{ px: 1, pb: 1 }}>
        <Divider sx={{ borderColor: 'grey.800', mb: 1 }} />
        {BOTTOM_NAV.map(item => (
          <NavItem key={item.to} item={item} active={location.pathname === item.to} collapsed={!open} />
        ))}
      </Box>
    </Box>
  );
}

export default function InvestorSidebar({ open, onToggle, mobileOpen, onMobileClose }: Props) {
  return (
    <>
      <Box sx={{ display: { xs: 'none', lg: 'block' }, flexShrink: 0, width: open ? SIDEBAR_WIDTH : SIDEBAR_COLLAPSED, transition: 'width 250ms ease' }}>
        <Box sx={{ position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: (t) => t.zIndex.drawer, overflow: 'hidden' }}>
          <SidebarContent open={open} onToggle={onToggle} />
        </Box>
      </Box>
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
