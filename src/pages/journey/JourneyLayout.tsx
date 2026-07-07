import { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate, Link } from 'react-router-dom';
import Box from '@mui/material/Box';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import FormControl from '@mui/material/FormControl';
import Avatar from '@mui/material/Avatar';
import IconButton from '@mui/material/IconButton';
import Button from '@mui/material/Button';
import MenuIcon from '@mui/icons-material/Menu';
import NotificationsOutlinedIcon from '@mui/icons-material/NotificationsOutlined';
import AddIcon from '@mui/icons-material/Add';
import { useAuth } from '../../contexts/AuthContext';
import { useIdea } from '../../contexts/IdeaContext';
import FounderSidebar from '../../components/FounderSidebar';
import { getStageInfo } from '../../supabase';

const TABS = [
  { label: 'أفكاري', path: '/journey' },
  { label: 'التحقق', path: '/journey/validation' },
  { label: 'المخطط', path: '/journey/canvas' },
  { label: 'SWOT', path: '/journey/swot' },
  { label: 'العرض التمويلي', path: '/journey/pitch' },
  { label: 'رحلة الـ ٩٠ يوماً', path: '/journey/90-day' },
];

export default function JourneyLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const { ideas, selectedIdeaId, setSelectedIdeaId } = useIdea();

  // Sync idea from URL param
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const ideaParam = params.get('idea');
    if (ideaParam && ideaParam !== selectedIdeaId) {
      setSelectedIdeaId(ideaParam);
    }
  }, [location.search]);

  const activeTab = TABS.findIndex(t => {
    if (t.path === '/journey') return location.pathname === '/journey' || location.pathname.startsWith('/journey/idea');
    return location.pathname.startsWith(t.path);
  });

  function handleTabChange(_: React.SyntheticEvent, idx: number) {
    const path = TABS[idx].path;
    const q = selectedIdeaId ? `?idea=${selectedIdeaId}` : '';
    navigate(`${path}${q}`);
  }

  const noIdea = !selectedIdeaId;
  const showNoBanner = noIdea && location.pathname !== '/journey' && !location.pathname.startsWith('/journey/idea');

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'grey.50' }}>
      <FounderSidebar open={sidebarOpen} onToggle={() => setSidebarOpen(o => !o)} mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />

      <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <AppBar position="sticky" color="default" elevation={0} sx={{ bgcolor: 'white', borderBottom: '1px solid', borderColor: 'divider' }}>
          <Toolbar sx={{ gap: 1 }}>
            <IconButton sx={{ display: { lg: 'none' } }} onClick={() => setMobileOpen(true)} size="small"><MenuIcon /></IconButton>
            <Typography variant="h6" fontWeight={700} sx={{ flex: 1 }}>رحلتي</Typography>
            {ideas.length > 0 && (
              <FormControl size="small" sx={{ minWidth: 200 }}>
                <Select
                  value={selectedIdeaId ?? ''}
                  onChange={e => {
                    const id = e.target.value || null;
                    setSelectedIdeaId(id);
                    if (id) navigate(`${location.pathname}?idea=${id}`);
                  }}
                  displayEmpty
                  sx={{ fontSize: '0.875rem', '& .MuiOutlinedInput-notchedOutline': { borderColor: 'divider' } }}
                >
                  <MenuItem value=""><em>— اختر فكرة —</em></MenuItem>
                  {ideas.map(idea => {
                    const s = getStageInfo(idea.stage);
                    return (
                      <MenuItem key={idea.id} value={idea.id} sx={{ fontSize: '0.875rem' }}>
                        {s.emoji} {idea.title.length > 28 ? idea.title.slice(0, 28) + '…' : idea.title} ({idea.iq_score})
                      </MenuItem>
                    );
                  })}
                </Select>
              </FormControl>
            )}
            <IconButton size="small"><NotificationsOutlinedIcon /></IconButton>
            <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: '0.8rem', fontWeight: 700 }}>
              {profile?.full_name?.[0] ?? 'F'}
            </Avatar>
          </Toolbar>

          <Box sx={{ borderTop: '1px solid', borderColor: 'divider', px: 2 }}>
            <Tabs value={activeTab >= 0 ? activeTab : 0} onChange={handleTabChange} variant="scrollable" scrollButtons="auto"
              sx={{ '& .MuiTab-root': { fontSize: '0.875rem', fontWeight: 500, textTransform: 'none', minWidth: 'auto', px: 2, py: 1.5 }, '& .Mui-selected': { fontWeight: 700 } }}>
              {TABS.map(t => <Tab key={t.path} label={t.label} />)}
            </Tabs>
          </Box>
        </AppBar>

        {showNoBanner && (
          <Alert severity="info" sx={{ mx: 3, mt: 2, borderRadius: 2 }}
            action={ideas.length === 0
              ? <Button size="small" component={Link} to="/journey?new=true" startIcon={<AddIcon />}>أضف فكرة</Button>
              : undefined
            }>
            {ideas.length === 0
              ? 'ليست لديك أفكار بعد. أضف فكرة لتبدأ!'
              : 'اختر فكرة من القائمة أعلاه لتبدأ.'
            }
          </Alert>
        )}

        <Box sx={{ flex: 1 }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
