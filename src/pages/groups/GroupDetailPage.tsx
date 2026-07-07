import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Chip from '@mui/material/Chip';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Avatar from '@mui/material/Avatar';
import IconButton from '@mui/material/IconButton';
import Divider from '@mui/material/Divider';
import LinearProgress from '@mui/material/LinearProgress';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import CircularProgress from '@mui/material/CircularProgress';
import InputAdornment from '@mui/material/InputAdornment';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemText from '@mui/material/ListItemText';
import Tooltip from '@mui/material/Tooltip';
import MenuIcon from '@mui/icons-material/Menu';
import NotificationsOutlinedIcon from '@mui/icons-material/NotificationsOutlined';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import EmojiEventsOutlinedIcon from '@mui/icons-material/EmojiEventsOutlined';
import PersonAddAltOutlinedIcon from '@mui/icons-material/PersonAddAltOutlined';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import PersonOutlineOutlinedIcon from '@mui/icons-material/PersonOutlineOutlined';
import CheckIcon from '@mui/icons-material/Check';
import LinkIcon from '@mui/icons-material/Link';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { supabase } from '../../supabase';
import { useAuth } from '../../contexts/AuthContext';
import FounderSidebar from '../../components/FounderSidebar';

interface Group {
  id: string;
  name: string;
  description: string;
  sector: string;
  meeting_frequency: string;
  max_members: number;
  owner_id: string;
  invite_code?: string;
}

interface Member {
  id: string;
  user_id: string;
  role: string;
  joined_at: string;
  profiles?: { full_name: string };
}

interface Checkin {
  id: string;
  user_id: string;
  progress_text: string;
  goal_for_next_week: string;
  streak: number;
  created_at: string;
  profiles?: { full_name: string };
}

interface ProfileResult {
  id: string;
  user_id: string;
  full_name: string;
  role: string;
}

export default function GroupDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [tab, setTab] = useState(0);
  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [checkins, setCheckins] = useState<Checkin[]>([]);
  const [myCheckin, setMyCheckin] = useState<Checkin | null>(null);
  const [checkinForm, setCheckinForm] = useState({ progress_text: '', goal_for_next_week: '' });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; sev: 'success' | 'error' } | null>(null);
  const [isMember, setIsMember] = useState(false);
  const [loading, setLoading] = useState(true);

  // Add member dialog
  const [addMemberOpen, setAddMemberOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ProfileResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [addingUserId, setAddingUserId] = useState<string | null>(null);
  const [addedUserIds, setAddedUserIds] = useState<Set<string>>(new Set());

  // Invite link dialog
  const [inviteOpen, setInviteOpen] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);

  // Leave / remove dialogs
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [removeMemberId, setRemoveMemberId] = useState<string | null>(null);
  const [removeMemberName, setRemoveMemberName] = useState('');

  useEffect(() => {
    if (id && user) loadAll();
  }, [id, user]);

  async function loadAll() {
    if (!id || !user) return;
    setLoading(true);

    const [groupRes, membersRes, checkinsRes, myMemberRes] = await Promise.all([
      supabase.from('accountability_groups').select('*').eq('id', id).maybeSingle(),
      supabase.from('group_members').select('*, profiles(full_name)').eq('group_id', id),
      supabase.from('group_checkins').select('*, profiles(full_name)').eq('group_id', id).order('created_at', { ascending: false }),
      supabase.from('group_members').select('id').eq('group_id', id).eq('user_id', user.id).maybeSingle(),
    ]);

    setGroup(groupRes.data as Group | null);
    setMembers((membersRes.data ?? []) as Member[]);

    const allCheckins = (checkinsRes.data ?? []) as Checkin[];
    setCheckins(allCheckins);

    const thisWeek = getWeekStart();
    const mine = allCheckins.find(c => c.user_id === user.id && new Date(c.created_at) >= thisWeek);
    setMyCheckin(mine ?? null);
    if (mine) setCheckinForm({ progress_text: mine.progress_text, goal_for_next_week: mine.goal_for_next_week });

    setIsMember(!!myMemberRes.data);
    setLoading(false);
  }

  function getWeekStart(): Date {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - d.getDay());
    return d;
  }

  async function submitCheckin() {
    if (!user || !id || !checkinForm.progress_text.trim()) return;
    setSaving(true);

    const prevCheckins = checkins.filter(c => c.user_id === user.id);
    const streak = prevCheckins.length + 1;
    const weekStartIso = getWeekStart().toISOString().slice(0, 10);
    const progressText = checkinForm.progress_text.trim();
    const goalText = checkinForm.goal_for_next_week.trim();

    if (myCheckin) {
      const { error } = await supabase.from('group_checkins').update({
        progress_text: progressText,
        goal_for_next_week: goalText,
        accomplished: progressText,
        goal_next_week: goalText || 'N/A',
      }).eq('id', myCheckin.id);
      if (error) { setToast({ msg: 'تعذّر تحديث التسجيل.', sev: 'error' }); setSaving(false); return; }
      setToast({ msg: 'حُدّث تسجيلك الأسبوعي!', sev: 'success' });
    } else {
      const { error } = await supabase.from('group_checkins').insert({
        group_id: id,
        user_id: user.id,
        week_start: weekStartIso,
        accomplished: progressText,
        goal_next_week: goalText || 'N/A',
        progress_text: progressText,
        goal_for_next_week: goalText,
        streak,
      });
      if (error) { setToast({ msg: 'تعذّر إرسال التسجيل.', sev: 'error' }); setSaving(false); return; }
      setToast({ msg: 'أُرسل تسجيلك الأسبوعي! 🎉', sev: 'success' });
    }
    setSaving(false);
    await loadAll();
  }

  async function handleSearch() {
    if (!searchQuery.trim()) { setSearchResults([]); return; }
    setSearching(true);
    const { data } = await supabase
      .from('profiles')
      .select('id, user_id, full_name, role')
      .ilike('full_name', `%${searchQuery.trim()}%`)
      .eq('role', 'founder')
      .limit(10);
    const memberUserIds = new Set(members.map(m => m.user_id));
    setSearchResults(
      ((data ?? []) as ProfileResult[]).filter(p => !memberUserIds.has(p.user_id) && p.user_id !== user?.id)
    );
    setSearching(false);
  }

  async function handleAddMember(profileResult: ProfileResult) {
    if (!id) return;
    setAddingUserId(profileResult.user_id);
    const { error } = await supabase
      .from('group_members')
      .insert({ group_id: id, user_id: profileResult.user_id, role: 'member' });
    if (error) {
      setToast({ msg: 'تعذّرت إضافة العضو. ربما هو في المجموعة بالفعل.', sev: 'error' });
    } else {
      setAddedUserIds(prev => new Set([...prev, profileResult.user_id]));
      setToast({ msg: `أُضيف ${profileResult.full_name} إلى المجموعة!`, sev: 'success' });
      await loadAll();
    }
    setAddingUserId(null);
  }

  async function handleRemoveMember() {
    if (!removeMemberId || !id) return;
    const { error } = await supabase
      .from('group_members')
      .delete()
      .eq('group_id', id)
      .eq('user_id', removeMemberId);
    setRemoveMemberId(null);
    if (error) {
      setToast({ msg: 'تعذّرت إزالة العضو.', sev: 'error' });
    } else {
      setToast({ msg: `أُزيل ${removeMemberName} من المجموعة.`, sev: 'success' });
      await loadAll();
    }
  }

  async function handleLeaveGroup() {
    if (!user || !id) return;
    const { error } = await supabase
      .from('group_members')
      .delete()
      .eq('group_id', id)
      .eq('user_id', user.id);
    setLeaveOpen(false);
    if (error) {
      setToast({ msg: 'تعذّرت مغادرة المجموعة.', sev: 'error' });
    } else {
      navigate('/groups');
    }
  }

  function copyInviteLink() {
    const inviteLink = `${window.location.origin}/groups/join/${group?.invite_code ?? id}`;
    navigator.clipboard.writeText(inviteLink).then(() => {
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2500);
    });
  }

  function openAddMember() {
    setSearchQuery('');
    setSearchResults([]);
    setAddedUserIds(new Set());
    setAddMemberOpen(true);
  }

  const isOwner = group?.owner_id === user?.id;
  const isFull = members.length >= (group?.max_members ?? 0);
  const weekStart = getWeekStart();
  const thisWeekCheckins = checkins.filter(c => new Date(c.created_at) >= weekStart);
  const checkinRate = members.length > 0 ? Math.round(thisWeekCheckins.length / members.length * 100) : 0;
  const inviteLink = `${window.location.origin}/groups/join/${group?.invite_code ?? id}`;

  // Per-member streak from their check-in history
  function getMemberStreak(userId: string): number {
    const memberCheckins = checkins.filter(c => c.user_id === userId);
    return memberCheckins[0]?.streak ?? 0;
  }

  function hasCheckedInThisWeek(userId: string): boolean {
    return thisWeekCheckins.some(c => c.user_id === userId);
  }

  if (loading) return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'grey.50' }}>
      <FounderSidebar open={sidebarOpen} onToggle={() => setSidebarOpen(o => !o)} mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />
      <Box sx={{ flex: 1, p: 4 }}><LinearProgress /></Box>
    </Box>
  );

  if (!group) return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'grey.50' }}>
      <FounderSidebar open={sidebarOpen} onToggle={() => setSidebarOpen(o => !o)} mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />
      <Box sx={{ flex: 1, p: 4 }}><Alert severity="error">المجموعة غير موجودة.</Alert></Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'grey.50' }}>
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
            <IconButton size="small" onClick={() => navigate('/groups')} sx={{ mr: 0.5 }}>
              <ArrowBackIcon fontSize="small" />
            </IconButton>
            <GroupsOutlinedIcon sx={{ color: 'primary.main', mr: 0.5 }} />
            <Typography variant="h6" fontWeight={700} sx={{ flex: 1 }} noWrap>{group.name}</Typography>
            <IconButton size="small"><NotificationsOutlinedIcon /></IconButton>
            <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: '0.8rem', fontWeight: 700 }}>
              {profile?.full_name?.[0] ?? 'F'}
            </Avatar>
          </Toolbar>
        </AppBar>

        <Container maxWidth="lg" sx={{ py: 4, flex: 1 }}>
          {/* Header */}
          <Stack direction={{ xs: 'column', sm: 'row' }} alignItems={{ sm: 'flex-start' }} spacing={2} sx={{ mb: 2 }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h5" fontWeight={800} gutterBottom>{group.name}</Typography>
              <Stack direction="row" spacing={1} sx={{ mb: 1 }} flexWrap="wrap">
                {group.sector && <Chip label={group.sector} size="small" sx={{ height: 20, fontSize: '0.7rem' }} />}
                {group.meeting_frequency && <Chip label={group.meeting_frequency} size="small" variant="outlined" sx={{ height: 20, fontSize: '0.7rem' }} />}
                <Chip label={`${members.length}/${group.max_members} أعضاء`} size="small" variant="outlined" sx={{ height: 20, fontSize: '0.7rem' }} />
              </Stack>
              {group.description && (
                <Typography variant="body2" color="text.secondary">{group.description}</Typography>
              )}
            </Box>

            {/* Action buttons — visible at top */}
            <Stack direction="row" spacing={1} flexWrap="wrap" justifyContent={{ xs: 'flex-start', sm: 'flex-end' }}>
              {isMember && (
                <Tooltip title="شارك رابط الدعوة مع روّاد آخرين">
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<LinkIcon />}
                    onClick={() => setInviteOpen(true)}
                    disabled={isFull}
                  >
                    ادعُ أعضاء
                  </Button>
                </Tooltip>
              )}
              {isOwner && !isFull && (
                <Button
                  variant="contained"
                  size="small"
                  startIcon={<PersonAddAltOutlinedIcon />}
                  onClick={openAddMember}
                >
                  أضف عضواً
                </Button>
              )}
              {isMember && !isOwner && (
                <Button
                  variant="outlined"
                  size="small"
                  color="error"
                  startIcon={<ExitToAppIcon />}
                  onClick={() => setLeaveOpen(true)}
                >
                  غادر المجموعة
                </Button>
              )}
            </Stack>
          </Stack>

          {/* How it works — shown to all members */}
          {isMember && (
            <Alert
              icon={<InfoOutlinedIcon />}
              severity="info"
              sx={{ mb: 3, py: 0.75 }}
            >
              <Typography variant="caption" sx={{ fontWeight: 600 }}>كيف تعمل:</Typography>
              <Typography variant="caption" sx={{ display: 'block' }}>
                سجّل حضورك كل أسبوع لمشاركة تقدمك وهدفك. الأعضاء المنتظمون يبنون سلسلة إنجاز.
                {isOwner && ' بصفتك المالك، يمكنك إضافة أعضاء بالبحث عن أسمائهم أو مشاركة رابط الدعوة.'}
              </Typography>
            </Alert>
          )}

          {/* Weekly check-in progress */}
          <Card sx={{ mb: 3, bgcolor: '#F0F5F1' }}>
            <CardContent sx={{ p: 2 }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
                <Typography variant="subtitle2" fontWeight={700}>تسجيلات هذا الأسبوع</Typography>
                <Typography variant="caption" fontWeight={700} color="primary.main">{thisWeekCheckins.length}/{members.length}</Typography>
              </Stack>
              <LinearProgress
                variant="determinate"
                value={checkinRate}
                sx={{ height: 8, borderRadius: 4, bgcolor: 'white', '& .MuiLinearProgress-bar': { bgcolor: checkinRate === 100 ? 'success.main' : 'primary.main' } }}
              />
              {checkinRate === 100 && members.length > 1 && (
                <Typography variant="caption" color="success.main" fontWeight={700} sx={{ display: 'block', mt: 0.75 }}>
                  سجّل جميع الأعضاء هذا الأسبوع!
                </Typography>
              )}
            </CardContent>
          </Card>

          <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 3 }}>
            <Tab label="التسجيلات الأسبوعية" />
            <Tab label={`الأعضاء (${members.length})`} />
          </Tabs>

          {/* CHECK-INS TAB */}
          {tab === 0 && (
            <Stack spacing={3}>
              {isMember && (
                <Card sx={{ border: myCheckin ? '1px solid' : '2px dashed', borderColor: myCheckin ? 'success.main' : 'primary.main' }}>
                  <CardContent sx={{ p: 2.5 }}>
                    <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                      <CheckCircleOutlineIcon sx={{ color: myCheckin ? 'success.main' : 'text.disabled', fontSize: 20 }} />
                      <Typography variant="subtitle2" fontWeight={700}>
                        {myCheckin ? 'تسجيلك لهذا الأسبوع' : 'أرسل تسجيلك الأسبوعي'}
                      </Typography>
                      {myCheckin && <Chip label="تم" size="small" color="success" sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700 }} />}
                    </Stack>
                    <Stack spacing={2}>
                      <TextField
                        label="ماذا أنجزت هذا الأسبوع؟ *"
                        value={checkinForm.progress_text}
                        onChange={e => setCheckinForm(f => ({ ...f, progress_text: e.target.value }))}
                        multiline rows={3} fullWidth size="small"
                        placeholder="شارك إنجازاتك وعوائقك ودروسك المستفادة…"
                      />
                      <TextField
                        label="هدف الأسبوع القادم"
                        value={checkinForm.goal_for_next_week}
                        onChange={e => setCheckinForm(f => ({ ...f, goal_for_next_week: e.target.value }))}
                        multiline rows={2} fullWidth size="small"
                        placeholder="ما الشيء الواحد الذي تلتزم به الأسبوع القادم؟"
                      />
                      <Button
                        variant="contained"
                        onClick={submitCheckin}
                        disabled={saving || !checkinForm.progress_text.trim()}
                        sx={{ alignSelf: 'flex-start' }}
                      >
                        {saving ? 'جارٍ الحفظ…' : myCheckin ? 'حدّث التسجيل' : 'أرسل التسجيل'}
                      </Button>
                    </Stack>
                  </CardContent>
                </Card>
              )}

              {!isMember && (
                <Alert severity="info">
                  أنت تشاهد هذه المجموعة كضيف. انضم إليها لترسل تسجيلاتك الأسبوعية.
                </Alert>
              )}

              <Typography variant="subtitle2" fontWeight={700} color="text.secondary">
                كل تسجيلات هذا الأسبوع ({thisWeekCheckins.length})
              </Typography>
              {thisWeekCheckins.length === 0 ? (
                <Card sx={{ textAlign: 'center', p: 4, boxShadow: 'none', border: '1px dashed', borderColor: 'divider' }}>
                  <CheckCircleOutlineIcon sx={{ fontSize: 36, color: 'text.disabled', mb: 1 }} />
                  <Typography variant="body2" color="text.secondary">لا تسجيلات هذا الأسبوع بعد.</Typography>
                  {isMember && <Typography variant="caption" color="text.secondary">كن أول من يسجّل!</Typography>}
                </Card>
              ) : thisWeekCheckins.map(c => (
                <Card key={c.id} sx={{ border: c.user_id === user?.id ? '1px solid' : 'none', borderColor: 'primary.main' }}>
                  <CardContent sx={{ p: 2.5 }}>
                    <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 1.5 }}>
                      <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: '0.8rem', fontWeight: 700 }}>
                        {(c.profiles?.full_name ?? 'M')[0]}
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="subtitle2" fontWeight={700}>
                          {c.profiles?.full_name ?? 'عضو'}
                          {c.user_id === user?.id && <Chip label="أنت" size="small" sx={{ ml: 0.75, height: 16, fontSize: '0.6rem' }} />}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(c.created_at).toLocaleDateString('ar', { month: 'short', day: 'numeric' })}
                        </Typography>
                      </Box>
                      {c.streak > 1 && (
                        <Chip
                          icon={<EmojiEventsOutlinedIcon sx={{ fontSize: '14px !important' }} />}
                          label={`سلسلة ${c.streak} أسابيع`}
                          size="small"
                          sx={{ height: 20, fontSize: '0.7rem', bgcolor: '#F5EAD3', color: '#D08A28' }}
                        />
                      )}
                    </Stack>
                    <Typography variant="body2" sx={{ mb: c.goal_for_next_week ? 1 : 0, lineHeight: 1.7 }}>{c.progress_text}</Typography>
                    {c.goal_for_next_week && (
                      <>
                        <Divider sx={{ my: 1 }} />
                        <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ display: 'block', mb: 0.5 }}>هدف الأسبوع القادم:</Typography>
                        <Typography variant="caption" color="text.secondary">{c.goal_for_next_week}</Typography>
                      </>
                    )}
                  </CardContent>
                </Card>
              ))}
            </Stack>
          )}

          {/* MEMBERS TAB */}
          {tab === 1 && (
            <Stack spacing={2}>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Typography variant="subtitle2" color="text.secondary">
                  شُغل {members.length} من {group.max_members} مقاعد
                  {isFull && <Chip label="مكتملة" size="small" color="warning" sx={{ ml: 1, height: 18, fontSize: '0.65rem' }} />}
                </Typography>
                {isOwner && !isFull && (
                  <Stack direction="row" spacing={1}>
                    <Button variant="outlined" size="small" startIcon={<LinkIcon />} onClick={() => setInviteOpen(true)}>
                      شارك رابط الدعوة
                    </Button>
                    <Button variant="contained" size="small" startIcon={<PersonAddAltOutlinedIcon />} onClick={openAddMember}>
                      أضف عضواً
                    </Button>
                  </Stack>
                )}
              </Stack>

              {isFull && isOwner && (
                <Alert severity="info" sx={{ py: 0.5 }}>
                  المجموعة مكتملة ({group.max_members}/{group.max_members}). أزل عضواً لتضيف آخر.
                </Alert>
              )}

              <Stack spacing={1.5}>
                {members.map(m => {
                  const streak = getMemberStreak(m.user_id);
                  const checkedIn = hasCheckedInThisWeek(m.user_id);
                  return (
                    <Card key={m.id}>
                      <CardContent sx={{ p: 2, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Avatar sx={{ width: 38, height: 38, bgcolor: checkedIn ? 'success.main' : 'grey.300', fontSize: '0.85rem', fontWeight: 700 }}>
                          {(m.profiles?.full_name ?? 'M')[0]}
                        </Avatar>
                        <Box sx={{ flex: 1 }}>
                          <Stack direction="row" alignItems="center" spacing={0.75} flexWrap="wrap">
                            <Typography variant="body2" fontWeight={700}>{m.profiles?.full_name ?? 'عضو'}</Typography>
                            {m.role === 'owner' && (
                              <Chip label="المالك" size="small" sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700, bgcolor: '#DEEBE2', color: '#1B6B3E' }} />
                            )}
                            {m.user_id === user?.id && m.role !== 'owner' && (
                              <Chip label="أنت" size="small" sx={{ height: 18, fontSize: '0.65rem' }} />
                            )}
                          </Stack>
                          <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mt: 0.25 }}>
                            <Typography variant="caption" color="text.secondary">
                              انضم {new Date(m.joined_at).toLocaleDateString('ar', { month: 'short', year: 'numeric' })}
                            </Typography>
                            {streak > 0 && (
                              <Typography variant="caption" sx={{ color: '#D08A28', fontWeight: 600 }}>
                                🔥 سلسلة {streak} أسابيع
                              </Typography>
                            )}
                          </Stack>
                        </Box>
                        <Stack direction="row" spacing={0.75} alignItems="center">
                          {checkedIn
                            ? <Chip icon={<CheckIcon sx={{ fontSize: '12px !important' }} />} label="سجّل" size="small" color="success" sx={{ height: 20, fontSize: '0.65rem' }} />
                            : <Chip label="ليس بعد" size="small" variant="outlined" sx={{ height: 20, fontSize: '0.65rem', color: 'text.disabled', borderColor: 'divider' }} />
                          }
                          {isOwner && m.user_id !== user?.id && m.role !== 'owner' && (
                            <Tooltip title="أزل العضو">
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => {
                                  setRemoveMemberId(m.user_id);
                                  setRemoveMemberName(m.profiles?.full_name ?? 'هذا العضو');
                                }}
                              >
                                <DeleteOutlineIcon sx={{ fontSize: 18 }} />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Stack>
                      </CardContent>
                    </Card>
                  );
                })}
              </Stack>

              {/* Leave group for non-owners */}
              {isMember && !isOwner && (
                <Box sx={{ pt: 1 }}>
                  <Divider sx={{ mb: 2 }} />
                  <Button
                    variant="outlined"
                    color="error"
                    size="small"
                    startIcon={<ExitToAppIcon />}
                    onClick={() => setLeaveOpen(true)}
                  >
                    غادر هذه المجموعة
                  </Button>
                </Box>
              )}
            </Stack>
          )}
        </Container>
      </Box>

      {/* Invite Link Dialog */}
      <Dialog open={inviteOpen} onClose={() => setInviteOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle fontWeight={700}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <LinkIcon color="primary" />
            <span>ادعُ أعضاء</span>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
            شارك هذا الرابط مع روّاد آخرين لدعوتهم إلى <strong>{group.name}</strong>.
            سيتمكنون من طلب الانضمام للمجموعة.
          </Typography>
          <Card sx={{ bgcolor: 'grey.50', mb: 2 }}>
            <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
              <Typography variant="body2" sx={{ fontFamily: 'monospace', wordBreak: 'break-all', color: 'primary.main' }}>
                {inviteLink}
              </Typography>
            </CardContent>
          </Card>
          <Button
            variant="contained"
            startIcon={linkCopied ? <CheckIcon /> : <ContentCopyIcon />}
            onClick={copyInviteLink}
            color={linkCopied ? 'success' : 'primary'}
            fullWidth
          >
            {linkCopied ? 'نُسخ الرابط!' : 'انسخ رابط الدعوة'}
          </Button>
          <Alert severity="info" sx={{ mt: 2 }} icon={<InfoOutlinedIcon />}>
            <Typography variant="caption">
              يمكنك أيضاً البحث عن أعضاء بالاسم عبر زر «أضف عضواً» في تبويب الأعضاء.
            </Typography>
          </Alert>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setInviteOpen(false)}>تم</Button>
        </DialogActions>
      </Dialog>

      {/* Add Member Dialog (search by name) */}
      <Dialog open={addMemberOpen} onClose={() => setAddMemberOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle fontWeight={700}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <PersonAddAltOutlinedIcon color="primary" />
            <span>أضف عضواً بالاسم</span>
          </Stack>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            ابحث عن الروّاد بالاسم لإضافتهم مباشرة إلى <strong>{group.name}</strong>.
          </Typography>
          <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="ابحث بالاسم…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') handleSearch(); }}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchOutlinedIcon fontSize="small" color="action" />
                    </InputAdornment>
                  ),
                },
              }}
            />
            <Button variant="contained" onClick={handleSearch} disabled={searching || !searchQuery.trim()}>
              {searching ? <CircularProgress size={18} color="inherit" /> : 'بحث'}
            </Button>
          </Stack>

          {searchResults.length > 0 && (
            <List disablePadding>
              {searchResults.map((p, i) => {
                const alreadyAdded = addedUserIds.has(p.user_id);
                const isAdding = addingUserId === p.user_id;
                return (
                  <Box key={p.user_id}>
                    {i > 0 && <Divider />}
                    <ListItem
                      disablePadding
                      sx={{ py: 1 }}
                      secondaryAction={
                        alreadyAdded ? (
                          <Chip
                            icon={<CheckIcon sx={{ fontSize: '14px !important' }} />}
                            label="أُضيف"
                            size="small"
                            color="success"
                            sx={{ height: 24, fontSize: '0.7rem', fontWeight: 700 }}
                          />
                        ) : (
                          <Button
                            size="small"
                            variant="outlined"
                            onClick={() => handleAddMember(p)}
                            disabled={isAdding}
                            startIcon={isAdding ? <CircularProgress size={12} /> : <PersonAddAltOutlinedIcon sx={{ fontSize: '14px !important' }} />}
                          >
                            {isAdding ? 'جارٍ الإضافة…' : 'أضف'}
                          </Button>
                        )
                      }
                    >
                      <ListItemAvatar>
                        <Avatar sx={{ width: 36, height: 36, bgcolor: 'primary.main', fontSize: '0.85rem', fontWeight: 700 }}>
                          {p.full_name?.[0] ?? '?'}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={<Typography variant="body2" fontWeight={600}>{p.full_name}</Typography>}
                        secondary={<Typography variant="caption" color="text.secondary" sx={{ textTransform: 'capitalize' }}>{p.role}</Typography>}
                      />
                    </ListItem>
                  </Box>
                );
              })}
            </List>
          )}

          {searchQuery.trim() && !searching && searchResults.length === 0 && (
            <Stack alignItems="center" spacing={1} sx={{ py: 3 }}>
              <PersonOutlineOutlinedIcon sx={{ fontSize: 40, color: 'text.disabled' }} />
              <Typography variant="body2" color="text.secondary">لا روّاد مطابقين لـ «{searchQuery}»</Typography>
              <Typography variant="caption" color="text.secondary">تُعرض فقط الحسابات غير المنضمّة لهذه المجموعة.</Typography>
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setAddMemberOpen(false)}>تم</Button>
        </DialogActions>
      </Dialog>

      {/* Remove Member Confirmation */}
      <Dialog open={!!removeMemberId} onClose={() => setRemoveMemberId(null)} maxWidth="xs" fullWidth>
        <DialogTitle fontWeight={700}>إزالة العضو؟</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            هل أنت متأكد من إزالة <strong>{removeMemberName}</strong> من المجموعة؟
            سيبقى سجل تسجيلاته محفوظاً.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setRemoveMemberId(null)}>إلغاء</Button>
          <Button variant="contained" color="error" onClick={handleRemoveMember}>أزل</Button>
        </DialogActions>
      </Dialog>

      {/* Leave Group Confirmation */}
      <Dialog open={leaveOpen} onClose={() => setLeaveOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle fontWeight={700}>مغادرة المجموعة؟</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            هل أنت متأكد من مغادرة <strong>{group.name}</strong>؟ يمكنك العودة لاحقاً إن توفر مقعد.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setLeaveOpen(false)}>ابقَ في المجموعة</Button>
          <Button variant="contained" color="error" onClick={handleLeaveGroup}>غادر المجموعة</Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={!!toast}
        autoHideDuration={3000}
        onClose={() => setToast(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity={toast?.sev ?? 'success'} variant="filled" onClose={() => setToast(null)}>
          {toast?.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
}
