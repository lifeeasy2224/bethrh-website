import { useState, useEffect, useRef, type ReactNode } from 'react';
import { useNavigate, useLocation, Link as RouterLink } from 'react-router-dom';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Avatar from '@mui/material/Avatar';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Divider from '@mui/material/Divider';
import Tooltip from '@mui/material/Tooltip';
import Collapse from '@mui/material/Collapse';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Badge from '@mui/material/Badge';
import Popover from '@mui/material/Popover';
import Stack from '@mui/material/Stack';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import MenuIcon from '@mui/icons-material/Menu';
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import LightbulbOutlinedIcon from '@mui/icons-material/LightbulbOutlined';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import ContactsOutlinedIcon from '@mui/icons-material/ContactsOutlined';
import LocalOfferOutlinedIcon from '@mui/icons-material/LocalOfferOutlined';
import CampaignOutlinedIcon from '@mui/icons-material/CampaignOutlined';
import EditNoteIcon from '@mui/icons-material/EditNote';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import AssignmentOutlinedIcon from '@mui/icons-material/AssignmentOutlined';
import NotificationsOutlinedIcon from '@mui/icons-material/NotificationsOutlined';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import LogoutIcon from '@mui/icons-material/Logout';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import PersonAddOutlinedIcon from '@mui/icons-material/PersonAddOutlined';
import ConfirmationNumberOutlinedIcon from '@mui/icons-material/ConfirmationNumberOutlined';
import ReportOutlinedIcon from '@mui/icons-material/ReportOutlined';
import GppMaybeOutlinedIcon from '@mui/icons-material/GppMaybeOutlined';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { useAdminAuth, type AdminRole, ADMIN_API } from '../contexts/AdminAuthContext';
import BethraLogo from './BethraLogo';

import { createContext, useContext } from 'react';

const AdminLayoutContext = createContext(false);

const SIDEBAR_WIDTH = 240;

// Admin-specific theme — user requested indigo (#1B6B3E)
const adminTheme = createTheme({
  palette: {
    primary: { main: '#1B6B3E', contrastText: '#fff' },
    error: { main: '#C0392B' },
    success: { main: '#2A8A52' },
    background: { default: '#FAF8F3', paper: '#ffffff' },
  },
  components: {
    MuiButton: { styleOverrides: { root: { textTransform: 'none', borderRadius: 8 } } },
    MuiPaper: { styleOverrides: { root: { borderRadius: 8 } } },
  },
});

interface NavChild { label: string; path: string; }
interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  path?: string;
  children?: NavChild[];
  superAdminOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: DashboardOutlinedIcon, path: '/admin/dashboard' },
  {
    id: 'users', label: 'Users', icon: PeopleAltOutlinedIcon,
    children: [
      { label: 'All Users', path: '/admin/users' },
      { label: 'Entrepreneurs', path: '/admin/users?role=founder' },
      { label: 'Investors', path: '/admin/users?role=investor' },
      { label: 'Suspended', path: '/admin/users?status=suspended' },
    ],
  },
  {
    id: 'ideas', label: 'Ideas Library', icon: LightbulbOutlinedIcon,
    children: [
      { label: 'All Ideas', path: '/admin/ideas-library' },
      { label: 'Add New Idea', path: '/admin/ideas-library/new' },
      { label: 'Sectors', path: '/admin/ideas-library/sectors' },
      { label: 'Import / Export', path: '/admin/ideas-library/import-export' },
    ],
  },
  {
    id: 'analytics', label: 'Analytics', icon: TrendingUpIcon,
    children: [
      { label: 'Traffic', path: '/admin/analytics/traffic' },
      { label: 'Users', path: '/admin/analytics/users' },
      { label: 'Business', path: '/admin/analytics/business' },
    ],
  },
  { id: 'comments', label: 'Comments & Feedback', icon: ChatBubbleOutlineIcon, path: '/admin/comments' },
  {
    id: 'crm', label: 'CRM', icon: ContactsOutlinedIcon,
    children: [
      { label: 'Overview', path: '/admin/crm' },
      { label: 'Tags', path: '/admin/crm/tags' },
      { label: 'Segments', path: '/admin/crm/segments' },
      { label: 'Revenue', path: '/admin/crm/revenue' },
    ],
  },
  {
    id: 'marketing', label: 'Marketing', icon: CampaignOutlinedIcon,
    children: [
      { label: 'Overview', path: '/admin/marketing' },
      { label: 'Campaigns', path: '/admin/marketing/campaigns' },
      { label: 'Templates', path: '/admin/marketing/templates' },
      { label: 'Upload Contacts', path: '/admin/marketing/upload' },
      { label: 'Suppression List', path: '/admin/marketing/suppression' },
      { label: 'Testimonials', path: '/admin/marketing/testimonials' },
      { label: 'Automations', path: '/admin/marketing/automations' },
    ],
  },
  { id: 'promo-codes', label: 'Promo Codes', icon: LocalOfferOutlinedIcon, path: '/admin/promo-codes' },
  { id: 'content', label: 'Site Content', icon: EditNoteIcon, path: '/admin/content' },
  {
    id: 'support', label: 'Support Tickets', icon: SupportAgentIcon,
    children: [
      { label: 'All Tickets', path: '/admin/support' },
      { label: 'Account Recovery', path: '/admin/support/recovery' },
    ],
  },
  { id: 'audit', label: 'Audit Log', icon: AssignmentOutlinedIcon, path: '/admin/audit-log' },
  { id: 'settings', label: 'Settings', icon: SettingsOutlinedIcon, path: '/admin/settings', superAdminOnly: true },
];

const ROLE_LABELS: Record<AdminRole, string> = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  moderator: 'Moderator',
};

interface AdminNotification {
  id: string;
  type: 'new_user' | 'ticket' | 'report' | 'failed_login' | 'system_error' | 'traffic';
  title: string;
  message: string;
  link: string;
  read_by: string[];
  created_at: string;
}

const NOTIF_ICONS: Record<string, React.ElementType> = {
  new_user: PersonAddOutlinedIcon,
  ticket: ConfirmationNumberOutlinedIcon,
  report: ReportOutlinedIcon,
  failed_login: GppMaybeOutlinedIcon,
  system_error: ErrorOutlineIcon,
  traffic: ShowChartIcon,
};

const NOTIF_COLORS: Record<string, string> = {
  new_user: '#2A8A52',
  ticket: '#2A8A52',
  report: '#D08A28',
  failed_login: '#C0392B',
  system_error: '#C0392B',
  traffic: '#1B6B3E',
};

function timeAgo(dateStr: string) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function NotificationBell() {
  const { sessionToken, admin } = useAdminAuth();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval>>(undefined);

  const fetchNotifications = async () => {
    if (!sessionToken) return;
    try {
      const res = await fetch(`${ADMIN_API}/notifications-list`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` },
        body: JSON.stringify({ session_token: sessionToken }),
      });
      const data = await res.json() as { notifications: AdminNotification[]; unread: number };
      setNotifications(data.notifications ?? []);
      setUnread(data.unread ?? 0);
    } catch { /* silent */ }
  };

  useEffect(() => {
    void fetchNotifications();
    pollRef.current = setInterval(() => { void fetchNotifications(); }, 30000);
    return () => clearInterval(pollRef.current);
  }, [sessionToken]);

  const handleOpen = async (e: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(e.currentTarget);
    setLoading(true);
    await fetchNotifications();
    setLoading(false);
  };

  const markAllRead = async () => {
    if (!sessionToken) return;
    try {
      await fetch(`${ADMIN_API}/notifications-mark-read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` },
        body: JSON.stringify({ session_token: sessionToken }),
      });
      setUnread(0);
      setNotifications(prev => prev.map(n => ({
        ...n,
        read_by: admin?.id && !n.read_by.includes(admin.id) ? [...n.read_by, admin.id] : n.read_by,
      })));
    } catch { /* silent */ }
  };

  const isRead = (n: AdminNotification) => admin?.id ? n.read_by.includes(admin.id) : false;

  return (
    <>
      <Tooltip title="Notifications">
        <IconButton size="small" onClick={handleOpen}>
          <Badge badgeContent={unread || undefined} color="error" max={99}>
            <NotificationsOutlinedIcon sx={{ fontSize: 22 }} />
          </Badge>
        </IconButton>
      </Tooltip>
      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        slotProps={{ paper: { sx: { width: 380, maxHeight: 520, overflow: 'hidden', display: 'flex', flexDirection: 'column' } } }}
      >
        {/* Header */}
        <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid', borderColor: 'divider', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="subtitle1" fontWeight={700}>Notifications</Typography>
            {unread > 0 && (
              <Chip label={unread} size="small" color="error" sx={{ height: 18, fontSize: '0.7rem', fontWeight: 700 }} />
            )}
          </Stack>
          {unread > 0 && (
            <Typography
              variant="caption"
              sx={{ color: '#1B6B3E', cursor: 'pointer', fontWeight: 600, '&:hover': { textDecoration: 'underline' } }}
              onClick={markAllRead}
            >
              Mark all read
            </Typography>
          )}
        </Box>

        {/* List */}
        <Box sx={{ overflowY: 'auto', flex: 1 }}>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress size={24} />
            </Box>
          ) : notifications.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 5 }}>
              <CheckCircleOutlineIcon sx={{ fontSize: 36, color: 'text.disabled', mb: 1 }} />
              <Typography variant="body2" color="text.secondary">All caught up!</Typography>
            </Box>
          ) : (
            notifications.map(n => {
              const Icon = NOTIF_ICONS[n.type] ?? NotificationsOutlinedIcon;
              const color = NOTIF_COLORS[n.type] ?? '#8A8070';
              const read = isRead(n);
              return (
                <Box
                  key={n.id}
                  onClick={() => { setAnchorEl(null); if (n.link) navigate(n.link); }}
                  sx={{
                    px: 2, py: 1.5,
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    bgcolor: read ? 'transparent' : 'rgba(27, 107, 62,0.04)',
                    cursor: 'pointer',
                    '&:hover': { bgcolor: 'grey.50' },
                    display: 'flex',
                    gap: 1.5,
                    alignItems: 'flex-start',
                  }}
                >
                  <Box sx={{ width: 32, height: 32, borderRadius: '8px', bgcolor: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, mt: 0.25 }}>
                    <Icon sx={{ fontSize: 16, color }} />
                  </Box>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Typography variant="body2" fontWeight={read ? 400 : 700} noWrap>{n.title}</Typography>
                      {!read && <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: '#1B6B3E', flexShrink: 0, ml: 1 }} />}
                    </Stack>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }} noWrap>{n.message}</Typography>
                    <Typography variant="caption" sx={{ color: '#B5AE9F', fontSize: '0.7rem' }}>{timeAgo(n.created_at)}</Typography>
                  </Box>
                </Box>
              );
            })
          )}
        </Box>
      </Popover>
    </>
  );
}

function SidebarContent({ onClose }: { onClose?: () => void }) {
  const { admin, logout } = useAdminAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState<string | null>(() => {
    // Auto-expand the section matching the current path
    const match = NAV_ITEMS.find(item =>
      item.children?.some(c => location.pathname.startsWith(c.path))
    );
    return match?.id ?? null;
  });

  const toggle = (id: string) => setExpanded(prev => prev === id ? null : id);

  const isActive = (path: string) =>
    location.pathname === path || location.pathname.startsWith(path + '/');

  const handleLogout = async () => {
    await logout();
    navigate('/admin/login', { replace: true });
  };

  const visibleItems = NAV_ITEMS.filter(item =>
    !item.superAdminOnly || admin?.role === 'super_admin'
  );

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: '#0A2A19' }}>
      {/* Logo */}
      <Box sx={{ px: 3, py: 2.5, display: 'flex', alignItems: 'center', gap: 1.5, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <BethraLogo dark to="/admin/dashboard" iconSize={26} fontSize="1rem" subtitle="Admin Panel" />
      </Box>

      {/* Navigation */}
      <Box sx={{ flex: 1, overflowY: 'auto', py: 1.5, '&::-webkit-scrollbar': { width: 4 }, '&::-webkit-scrollbar-track': { bgcolor: 'transparent' }, '&::-webkit-scrollbar-thumb': { bgcolor: 'rgba(255,255,255,0.15)', borderRadius: 2 } }}>
        <List disablePadding>
          {visibleItems.map(item => (
            <Box key={item.id}>
              {item.children ? (
                <>
                  <ListItemButton
                    onClick={() => toggle(item.id)}
                    sx={{
                      mx: 1, borderRadius: 1.5, mb: 0.25,
                      color: 'rgba(255,255,255,0.65)',
                      '&:hover': { bgcolor: 'rgba(255,255,255,0.07)', color: 'white' },
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 36, color: 'inherit' }}>
                      <item.icon sx={{ fontSize: 20 }} />
                    </ListItemIcon>
                    <ListItemText primary={item.label} primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: 500 }} />
                    {expanded === item.id ? <ExpandLessIcon sx={{ fontSize: 16 }} /> : <ExpandMoreIcon sx={{ fontSize: 16 }} />}
                  </ListItemButton>
                  <Collapse in={expanded === item.id} timeout="auto" unmountOnExit>
                    <List disablePadding>
                      {item.children.map(child => {
                        const active = isActive(child.path);
                        return (
                          <ListItem key={child.path} disablePadding>
                            <ListItemButton
                              component={RouterLink}
                              to={child.path}
                              onClick={onClose}
                              sx={{
                                pl: 6.5, py: 0.75, mx: 1, borderRadius: 1.5, mb: 0.25,
                                bgcolor: active ? '#1B6B3E' : 'transparent',
                                color: active ? 'white' : 'rgba(255,255,255,0.55)',
                                '&:hover': { bgcolor: active ? '#0F3D24' : 'rgba(255,255,255,0.07)', color: 'white' },
                              }}
                            >
                              <ListItemText primary={child.label} primaryTypographyProps={{ fontSize: '0.8125rem' }} />
                            </ListItemButton>
                          </ListItem>
                        );
                      })}
                    </List>
                  </Collapse>
                </>
              ) : (
                <ListItem disablePadding>
                  <ListItemButton
                    component={RouterLink}
                    to={item.path!}
                    onClick={onClose}
                    sx={{
                      mx: 1, borderRadius: 1.5, mb: 0.25,
                      bgcolor: isActive(item.path!) ? '#1B6B3E' : 'transparent',
                      color: isActive(item.path!) ? 'white' : 'rgba(255,255,255,0.65)',
                      '&:hover': { bgcolor: isActive(item.path!) ? '#0F3D24' : 'rgba(255,255,255,0.07)', color: 'white' },
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 36, color: 'inherit' }}>
                      <item.icon sx={{ fontSize: 20 }} />
                    </ListItemIcon>
                    <ListItemText primary={item.label} primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: 500 }} />
                  </ListItemButton>
                </ListItem>
              )}
            </Box>
          ))}
        </List>
      </Box>

      {/* User info + logout */}
      <Box sx={{ p: 2, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
          <Avatar sx={{ width: 34, height: 34, bgcolor: '#1B6B3E', fontSize: '0.875rem', fontWeight: 700 }}>
            {admin?.full_name?.charAt(0).toUpperCase() ?? 'A'}
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="body2" fontWeight={600} sx={{ color: 'white', lineHeight: 1.2 }} noWrap>
              {admin?.full_name}
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.7rem' }}>
              {admin ? ROLE_LABELS[admin.role] : ''}
            </Typography>
          </Box>
        </Box>
        <ListItemButton onClick={handleLogout} sx={{ borderRadius: 1.5, color: 'rgba(255,255,255,0.55)', '&:hover': { bgcolor: 'rgba(192, 57, 43,0.15)', color: '#E05B4C' }, px: 1.5, py: 0.75 }}>
          <ListItemIcon sx={{ minWidth: 30, color: 'inherit' }}>
            <LogoutIcon sx={{ fontSize: 18 }} />
          </ListItemIcon>
          <ListItemText primary="Sign out" primaryTypographyProps={{ fontSize: '0.8125rem' }} />
        </ListItemButton>
      </Box>
    </Box>
  );
}

interface AdminLayoutProps { children: ReactNode; }

export default function AdminLayout({ children }: AdminLayoutProps) {
  const isNested = useContext(AdminLayoutContext);
  const { admin, logout } = useAdminAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileAnchor, setProfileAnchor] = useState<null | HTMLElement>(null);
  const navigate = useNavigate();

  if (isNested) return <>{children}</>;

  const handleLogout = async () => {
    setProfileAnchor(null);
    await logout();
    navigate('/admin/login', { replace: true });
  };

 return (
    <AdminLayoutContext.Provider value={true}>
    <ThemeProvider theme={adminTheme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', height: '100vh', bgcolor: 'background.default' }}>

        {/* Desktop permanent sidebar */}
        <Box component="nav" sx={{ width: { md: SIDEBAR_WIDTH }, flexShrink: { md: 0 } }}>
          <Drawer
            variant="temporary"
            open={mobileOpen}
            onClose={() => setMobileOpen(false)}
            ModalProps={{ keepMounted: true }}
            sx={{
              display: { xs: 'block', md: 'none' },
              '& .MuiDrawer-paper': { width: SIDEBAR_WIDTH, bgcolor: '#0A2A19', border: 'none', boxSizing: 'border-box' },
            }}
          >
            <SidebarContent onClose={() => setMobileOpen(false)} />
          </Drawer>
          <Drawer
            variant="permanent"
            sx={{
              display: { xs: 'none', md: 'block' },
              '& .MuiDrawer-paper': { width: SIDEBAR_WIDTH, bgcolor: '#0A2A19', border: 'none', boxSizing: 'border-box' },
            }}
            open
          >
            <SidebarContent />
          </Drawer>
        </Box>

        {/* Main content column */}
        <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
          {/* Top AppBar */}
          <AppBar
            position="sticky"
            elevation={0}
            sx={{ bgcolor: 'white', borderBottom: '1px solid', borderColor: 'grey.200', color: 'text.primary', zIndex: 1100 }}
          >
            <Toolbar sx={{ gap: 1 }}>
              <IconButton
                size="small"
                onClick={() => setMobileOpen(true)}
                sx={{ display: { md: 'none' }, mr: 1 }}
              >
                <MenuIcon />
              </IconButton>

              <Box sx={{ flex: 1 }} />

              <NotificationBell />

              <Tooltip title="Account">
                <IconButton
                  size="small"
                  onClick={e => setProfileAnchor(e.currentTarget)}
                  sx={{ ml: 0.5 }}
                >
                  <Avatar sx={{ width: 32, height: 32, bgcolor: '#1B6B3E', fontSize: '0.8rem', fontWeight: 700 }}>
                    {admin?.full_name?.charAt(0).toUpperCase() ?? 'A'}
                  </Avatar>
                </IconButton>
              </Tooltip>

              <Menu
                anchorEl={profileAnchor}
                open={Boolean(profileAnchor)}
                onClose={() => setProfileAnchor(null)}
                slotProps={{ paper: { sx: { mt: 0.5, minWidth: 200 } } }}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              >
                <Box sx={{ px: 2, py: 1.5 }}>
                  <Typography variant="body2" fontWeight={700}>{admin?.full_name}</Typography>
                  <Typography variant="caption" color="text.secondary">{admin?.email}</Typography>
                </Box>
                <Divider />
                <MenuItem onClick={() => { setProfileAnchor(null); navigate('/admin/setup-2fa'); }} dense>
                  <ListItemIcon><PersonOutlineIcon fontSize="small" /></ListItemIcon>
                  2FA Settings
                </MenuItem>
                <Divider />
                <MenuItem
                  dense
                  sx={{ color: 'error.main' }}
                  onClick={handleLogout}
                >
                  <ListItemIcon sx={{ color: 'error.main' }}><LogoutIcon fontSize="small" /></ListItemIcon>
                  Sign out
                </MenuItem>
              </Menu>
            </Toolbar>
          </AppBar>

          {/* Page content */}
          <Box sx={{ flex: 1, overflowY: 'auto', bgcolor: '#FAF8F3' }}>
            {children}
          </Box>
        </Box>
     </Box>
    </ThemeProvider>
    </AdminLayoutContext.Provider>
  );
}
