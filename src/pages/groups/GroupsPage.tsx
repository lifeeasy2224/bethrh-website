import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Grid from '@mui/material/Grid';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Avatar from '@mui/material/Avatar';
import IconButton from '@mui/material/IconButton';
import AddIcon from '@mui/icons-material/Add';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import MenuIcon from '@mui/icons-material/Menu';
import NotificationsOutlinedIcon from '@mui/icons-material/NotificationsOutlined';
import PeopleAltOutlinedIcon from '@mui/icons-material/PeopleAltOutlined';
import { supabase, SECTORS } from '../../supabase';
import { useAuth } from '../../contexts/AuthContext';
import FounderSidebar from '../../components/FounderSidebar';

interface Group {
  id: string;
  name: string;
  description: string;
  sector: string;
  max_members: number;
  is_public: boolean;
  owner_id: string;
  created_at: string;
  member_count?: number;
  is_member?: boolean;
}

const MEETING_FREQUENCIES = ['أسبوعياً', 'كل أسبوعين', 'شهرياً'];

interface GroupCardProps {
  group: Group;
  joining: string | null;
  onJoin: (id: string) => void;
}

function GroupCard({ group, joining, onJoin }: GroupCardProps) {
  return (
    <Card sx={{ height: '100%', '&:hover': { boxShadow: 3 }, transition: 'box-shadow 150ms ease' }}>
      <CardContent sx={{ p: 2.5 }}>
        <Stack direction="row" alignItems="flex-start" justifyContent="space-between" sx={{ mb: 1.5 }}>
          <Box sx={{ width: 44, height: 44, borderRadius: 2, bgcolor: 'primary.main', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <GroupsOutlinedIcon sx={{ color: 'white', fontSize: 22 }} />
          </Box>
          {group.is_member && <Chip label="عضو" size="small" color="success" sx={{ height: 20, fontSize: '0.7rem', fontWeight: 700 }} />}
        </Stack>

        <Typography variant="subtitle1" fontWeight={700} gutterBottom>{group.name}</Typography>
        {group.sector && <Chip label={group.sector} size="small" sx={{ height: 20, fontSize: '0.7rem', mb: 1 }} />}
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
          {group.description || 'لا وصف بعد.'}
        </Typography>

        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack direction="row" alignItems="center" spacing={0.5}>
            <PeopleAltOutlinedIcon sx={{ fontSize: 14, color: 'text.disabled' }} />
            <Typography variant="caption" color="text.secondary">حتى {group.max_members} أعضاء</Typography>
          </Stack>
          {group.is_member ? (
            <Button size="small" variant="outlined" component={Link} to={`/groups/${group.id}`}>افتح</Button>
          ) : (
            <Button size="small" variant="contained" onClick={() => onJoin(group.id)} disabled={joining === group.id}>
              {joining === group.id ? 'جارٍ الانضمام…' : 'انضم'}
            </Button>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}

export default function GroupsPage() {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [tab, setTab] = useState(0);
  const [myGroups, setMyGroups] = useState<Group[]>([]);
  const [publicGroups, setPublicGroups] = useState<Group[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [joining, setJoining] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', description: '', sector: '', meeting_frequency: 'أسبوعياً', max_members: '6' });
  const [saving, setSaving] = useState(false);

  const plan = profile?.plan ?? 'free';
  const canCreate = plan !== 'free';

  useEffect(() => { if (user) loadGroups(); }, [user]);

  async function loadGroups() {
    if (!user) return;
    const [memberships, allPublic] = await Promise.all([
      supabase.from('group_members').select('group_id').eq('user_id', user.id),
      supabase.from('accountability_groups').select('*').eq('is_public', true).order('created_at', { ascending: false }),
    ]);
    const memberGroupIds = new Set((memberships.data ?? []).map((m: any) => m.group_id));

    const publicList = ((allPublic.data ?? []) as Group[]).map(g => ({
      ...g,
      is_member: memberGroupIds.has(g.id),
    }));
    setPublicGroups(publicList);
    setMyGroups(publicList.filter(g => g.is_member));
  }

  async function handleCreate() {
    if (!user || !form.name.trim()) return;
    setSaving(true);
    const { data, error } = await supabase
      .from('accountability_groups')
      .insert({
        owner_id: user.id,
        created_by: user.id,
        name: form.name.trim(),
        description: form.description.trim(),
        sector: form.sector,
        meeting_frequency: form.meeting_frequency,
        max_members: parseInt(form.max_members) || 6,
        is_public: true,
      })
      .select()
      .maybeSingle();
    if (error || !data) { setSaving(false); return; }

    await supabase.from('group_members').insert({ group_id: data.id, user_id: user.id, role: 'owner' });
    setSaving(false);
    setCreateOpen(false);
    setForm({ name: '', description: '', sector: '', meeting_frequency: 'أسبوعياً', max_members: '6' });
    setToast('أُنشئت المجموعة!');
    await loadGroups();
    navigate(`/groups/${data.id}`);
  }

  async function handleJoin(groupId: string) {
    if (!user) return;
    setJoining(groupId);
    await supabase.from('group_members').insert({ group_id: groupId, user_id: user.id, role: 'member' });
    setJoining(null);
    setToast('انضممت للمجموعة!');
    await loadGroups();
  }

  const displayGroups = tab === 0 ? myGroups : publicGroups;

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#FAF8F3' }}>
      <FounderSidebar
        open={sidebarOpen}
        onToggle={() => setSidebarOpen(o => !o)}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <AppBar position="sticky" elevation={0} sx={{ bgcolor: 'white', borderBottom: '1px solid', borderColor: 'divider' }}>
          <Toolbar sx={{ gap: 1 }}>
            <IconButton sx={{ display: { lg: 'none' } }} onClick={() => setMobileOpen(true)} size="small">
              <MenuIcon />
            </IconButton>
            <GroupsOutlinedIcon sx={{ color: 'primary.main', mr: 0.5 }} />
            <Typography variant="h6" fontWeight={700} sx={{ flex: 1 }}>مجموعات الالتزام</Typography>
            <IconButton size="small"><NotificationsOutlinedIcon /></IconButton>
            <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: '0.8rem', fontWeight: 700 }}>
              {profile?.full_name?.[0] ?? 'F'}
            </Avatar>
          </Toolbar>
        </AppBar>

        <Container maxWidth="lg" sx={{ py: 4, flex: 1 }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 3 }}>
            <Box>
              <Typography variant="h5" fontWeight={800}>مجموعات الالتزام</Typography>
              <Typography variant="body2" color="text.secondary">حافظ على استمراريتك مع فريق من الروّاد أمثالك.</Typography>
            </Box>
            {canCreate ? (
              <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreateOpen(true)}>أنشئ مجموعة</Button>
            ) : (
              <Button variant="outlined" startIcon={<LockOutlinedIcon />} href="/pricing">رقِّ لإنشاء مجموعة</Button>
            )}
          </Stack>

          <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3 }}>
            <Tab label={`مجموعاتي (${myGroups.length})`} />
            <Tab label={`تصفّح الكل (${publicGroups.length})`} />
          </Tabs>

          {displayGroups.length === 0 ? (
            <Card sx={{ textAlign: 'center', p: 6, border: '2px dashed', borderColor: 'divider', boxShadow: 'none' }}>
              <GroupsOutlinedIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
              <Typography variant="h6" fontWeight={700} gutterBottom>
                {tab === 0 ? 'لا مجموعات بعد' : 'لا مجموعات عامة بعد'}
              </Typography>
              <Typography color="text.secondary" sx={{ mb: 3 }}>
                {tab === 0
                  ? 'انضم إلى مجموعة قائمة أو أنشئ دائرة التزامك الخاصة.'
                  : 'كن أول من ينشئ مجموعة لقطاعك.'}
              </Typography>
              {tab === 0 && <Button variant="outlined" onClick={() => setTab(1)}>تصفّح المجموعات</Button>}
            </Card>
          ) : (
            <Grid container spacing={3}>
              {displayGroups.map(g => (
                <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={g.id}>
                  <GroupCard group={g} joining={joining} onJoin={handleJoin} />
                </Grid>
              ))}
            </Grid>
          )}
        </Container>
      </Box>

      {/* Create group dialog */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle fontWeight={700}>أنشئ مجموعة التزام</DialogTitle>
        <DialogContent>
          <Stack spacing={2.5} sx={{ mt: 1 }}>
            <TextField label="اسم المجموعة *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} fullWidth inputProps={{ maxLength: 60 }} />
            <TextField label="الوصف" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} multiline rows={2} fullWidth inputProps={{ maxLength: 300 }} />
            <TextField select label="القطاع" value={form.sector} onChange={e => setForm(f => ({ ...f, sector: e.target.value }))} fullWidth>
              <MenuItem value=""><em>أي قطاع</em></MenuItem>
              {SECTORS.map(s => <MenuItem key={s.key} value={s.key}>{s.emoji} {s.label}</MenuItem>)}
            </TextField>
            <TextField select label="تكرار اللقاءات" value={form.meeting_frequency} onChange={e => setForm(f => ({ ...f, meeting_frequency: e.target.value }))} fullWidth>
              {MEETING_FREQUENCIES.map(f => <MenuItem key={f} value={f}>{f}</MenuItem>)}
            </TextField>
            <TextField label="الحد الأقصى للأعضاء" type="number" value={form.max_members} onChange={e => setForm(f => ({ ...f, max_members: e.target.value }))} fullWidth inputProps={{ min: 2, max: 20 }} helperText="المُوصى به: ٤–٨" />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setCreateOpen(false)}>إلغاء</Button>
          <Button variant="contained" onClick={handleCreate} disabled={saving || !form.name.trim()}>
            {saving ? 'جارٍ الإنشاء…' : 'أنشئ المجموعة'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={!!toast} autoHideDuration={3000} onClose={() => setToast(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity="success" variant="filled" onClose={() => setToast(null)}>{toast}</Alert>
      </Snackbar>
    </Box>
  );
}
