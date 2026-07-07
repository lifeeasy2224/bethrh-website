import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link as RouterLink } from 'react-router-dom';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Chip from '@mui/material/Chip';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Divider from '@mui/material/Divider';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import LinearProgress from '@mui/material/LinearProgress';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Breadcrumbs from '@mui/material/Breadcrumbs';
import Link from '@mui/material/Link';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import NoteAddOutlinedIcon from '@mui/icons-material/NoteAddOutlined';
import LocalOfferOutlinedIcon from '@mui/icons-material/LocalOfferOutlined';
import LightbulbOutlinedIcon from '@mui/icons-material/LightbulbOutlined';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import AdminLayout from '../../components/AdminLayout';
import { adminDb } from '../../lib/adminDb';
import { useAdminAuth } from '../../contexts/AdminAuthContext';

interface ProfileData {
  user_id: string;
  full_name: string | null;
  role: string | null;
  tier: string | null;
  lead_score: number;
  lifecycle_stage: string | null;
  user_status: string | null;
  last_login_at: string | null;
  created_at: string | null;
  login_count: number;
  total_revenue: number;
  iq_score?: number;
}

interface Idea {
  id: string;
  title: string;
  sector: string | null;
  iq_score: number | null;
  in_marketplace: boolean;
  created_at: string;
}

interface CRMNote {
  id: string;
  note: string;
  created_at: string;
  admin_id: string | null;
}

interface Tag {
  id: string;
  name: string;
  color: string;
}

interface ActivityItem {
  id: string;
  action_type: string;
  action_details: Record<string, unknown> | null;
  created_at: string;
}

function daysBetween(date: string | null): number {
  if (!date) return 999;
  return Math.floor((Date.now() - new Date(date).getTime()) / 86400000);
}

function calculateStatus(lastLogin: string | null): string {
  const d = daysBetween(lastLogin);
  if (d <= 7) return 'active';
  if (d <= 30) return 'inactive';
  if (d <= 60) return 'at_risk';
  return 'churned';
}

function calculateLifecycle(user: ProfileData): string {
  const tier = user.tier ?? 'free';
  const status = calculateStatus(user.last_login_at);
  if (tier !== 'free' && status === 'churned') return 'churned';
  if (tier !== 'free') return 'paying';
  if (user.lead_score >= 70) return 'power_user';
  if (user.login_count >= 5) return 'active';
  if (user.login_count >= 2) return 'onboarding';
  return 'new';
}

function calculateLeadScore(user: ProfileData, ideasCount: number): number {
  let score = 0;
  score += Math.min(user.login_count, 20);
  score += Math.min(ideasCount * 5, 10);
  const d = daysBetween(user.last_login_at);
  if (d <= 1) score += 20;
  else if (d <= 3) score += 15;
  else if (d <= 7) score += 10;
  else if (d <= 14) score += 5;
  const tier = user.tier ?? 'free';
  if (tier === 'accelerator' || tier === 'family') score += 10;
  else if (tier === 'growth' || tier === 'launch') score += 8;
  else if (tier === 'pro' || tier === 'builder') score += 6;
  return Math.min(score, 100);
}

const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  active: { label: 'Active', color: '#2A8A52', bg: '#DEEBE2' },
  inactive: { label: 'Inactive', color: '#D08A28', bg: '#F5EAD3' },
  at_risk: { label: 'At Risk', color: '#C0392B', bg: '#F5DDD9' },
  churned: { label: 'Churned', color: '#8A8070', bg: '#F7F3EC' },
};

const LIFECYCLE_MAP: Record<string, { label: string; color: string; bg: string }> = {
  new: { label: 'New', color: '#2A8A52', bg: '#DEEBE2' },
  onboarding: { label: 'Onboarding', color: '#1B6B3E', bg: '#DEEBE2' },
  active: { label: 'Active', color: '#2A8A52', bg: '#DEEBE2' },
  power_user: { label: 'Power User', color: '#D08A28', bg: '#F5EAD3' },
  paying: { label: 'Paying', color: '#1B6B3E', bg: '#F0F5F1' },
  churned: { label: 'Churned', color: '#8A8070', bg: '#F7F3EC' },
};

function fmtDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function fmtDateTime(d: string) {
  return new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
}

function initials(name: string | null): string {
  if (!name) return '?';
  return name.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2);
}

function leadScoreColor(score: number): string {
  if (score >= 70) return '#2A8A52';
  if (score >= 40) return '#D08A28';
  return '#C0392B';
}

export default function AdminCRMUserProfile() {
  const { id } = useParams<{ id: string }>();
  const { sessionToken } = useAdminAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState(0);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [notes, setNotes] = useState<CRMNote[]>([]);
  const [allTags, setAllTags] = useState<Tag[]>([]);
  const [userTags, setUserTags] = useState<Tag[]>([]);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [noteDialog, setNoteDialog] = useState(false);
  const [tagDialog, setTagDialog] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [selectedTagId, setSelectedTagId] = useState('');

  const load = useCallback(async () => {
    if (!id || !sessionToken) return;
    setLoading(true);
    const [pRes, iRes, nRes, tRes, utRes, aRes] = await Promise.all([
      adminDb(sessionToken, 'profiles').select('*', { match: { user_id: id }, single: true }),
      adminDb(sessionToken, 'user_ideas').select('id, title, sector, iq_score, in_marketplace, created_at', { match: { user_id: id }, order: { column: 'created_at', ascending: false } }),
      adminDb(sessionToken, 'admin_crm_notes').select('*', { match: { user_id: id }, order: { column: 'created_at', ascending: false } }),
      adminDb(sessionToken, 'admin_crm_tags').select('*', { order: { column: 'name' } }),
      adminDb(sessionToken, 'admin_user_tags').select('tag_id, admin_crm_tags(id, name, color)', { match: { user_id: id } }),
      adminDb(sessionToken, 'user_activity_log').select('*', { match: { user_id: id }, order: { column: 'created_at', ascending: false }, limit: 50 }),
    ]);

    const p = pRes.data as ProfileData | null;
    const ideasData = (iRes.data ?? []) as Idea[];

    if (p) {
      const computedScore = calculateLeadScore(p, ideasData.length);
      const computedStatus = calculateStatus(p.last_login_at);
      const computedLifecycle = calculateLifecycle({ ...p, lead_score: computedScore });
      await adminDb(sessionToken, 'profiles').update({
        lead_score: computedScore,
        user_status: computedStatus,
        lifecycle_stage: computedLifecycle,
      }, { user_id: id });
      setProfile({ ...p, lead_score: computedScore, user_status: computedStatus, lifecycle_stage: computedLifecycle });
    }

    setIdeas(ideasData);
    setNotes((nRes.data ?? []) as CRMNote[]);
    setAllTags((tRes.data ?? []) as Tag[]);
    setActivity((aRes.data ?? []) as ActivityItem[]);

    const tagRows = (utRes.data ?? []) as unknown as Array<{ tag_id: string; admin_crm_tags: { id: string; name: string; color: string } | null }>;
    setUserTags(tagRows.map(r => r.admin_crm_tags).filter(Boolean) as Tag[]);
    setLoading(false);
  }, [id, sessionToken]);

  useEffect(() => { void load(); }, [load]);

  async function saveNote() {
    if (!newNote.trim() || !id || !sessionToken) return;
    setSavingNote(true);
    await adminDb(sessionToken, 'admin_crm_notes').insert({ user_id: id, note: newNote.trim() });
    setNewNote('');
    setNoteDialog(false);
    setSavingNote(false);
    void load();
  }

  async function assignTag() {
    if (!selectedTagId || !id || !sessionToken) return;
    await adminDb(sessionToken, 'admin_user_tags').upsert({ user_id: id, tag_id: selectedTagId }, { onConflict: 'user_id,tag_id' });
    setSelectedTagId('');
    setTagDialog(false);
    void load();
  }

  async function removeTag(tagId: string) {
    if (!id || !sessionToken) return;
    await adminDb(sessionToken, 'admin_user_tags').delete({ user_id: id, tag_id: tagId });
    void load();
  }

  if (loading) {
    return (
      <AdminLayout>
        <Box sx={{ p: 3 }}>
          <LinearProgress />
        </Box>
      </AdminLayout>
    );
  }

  if (!profile) {
    return (
      <AdminLayout>
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography color="text.secondary">User not found.</Typography>
          <Button onClick={() => navigate('/admin/crm')} sx={{ mt: 2 }}>Back to CRM</Button>
        </Box>
      </AdminLayout>
    );
  }

  const status = profile.user_status ?? calculateStatus(profile.last_login_at);
  const lifecycle = profile.lifecycle_stage ?? calculateLifecycle(profile);
  const statusInfo = STATUS_MAP[status] ?? STATUS_MAP.inactive;
  const lifecycleInfo = LIFECYCLE_MAP[lifecycle] ?? LIFECYCLE_MAP.new;
  const score = profile.lead_score;

  const availableTags = allTags.filter(t => !userTags.some(ut => ut.id === t.id));

  return (
    <AdminLayout>
      <Box sx={{ p: 3, bgcolor: '#FAF8F3', minHeight: '100vh' }}>
        {/* Breadcrumb */}
        <Breadcrumbs sx={{ mb: 2, fontSize: '0.8rem' }}>
          <Link component={RouterLink} to="/admin/crm" underline="hover" color="text.secondary" sx={{ fontSize: '0.8rem' }}>CRM</Link>
          <Typography color="text.primary" sx={{ fontSize: '0.8rem' }}>{profile.full_name ?? 'User'}</Typography>
        </Breadcrumbs>

        <Stack direction="row" spacing={1} sx={{ mb: 2.5 }} alignItems="center">
          <IconButton size="small" onClick={() => navigate('/admin/crm')}>
            <ArrowBackIcon sx={{ fontSize: 18 }} />
          </IconButton>
          <Typography variant="h5" fontWeight={800}>360° User Profile</Typography>
        </Stack>

        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '280px 1fr' }, gap: 3, alignItems: 'start' }}>
          {/* Left Sidebar */}
          <Stack spacing={2}>
            <Card elevation={0} sx={{ border: '1px solid', borderColor: 'grey.200' }}>
              <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ textAlign: 'center', mb: 2 }}>
                  <Avatar sx={{ width: 64, height: 64, bgcolor: '#1B6B3E', fontSize: '1.5rem', fontWeight: 800, mx: 'auto', mb: 1.5 }}>
                    {initials(profile.full_name)}
                  </Avatar>
                  <Typography variant="subtitle1" fontWeight={800}>{profile.full_name ?? 'Unknown'}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {profile.role === 'investor' ? 'Investor' : 'Founder'}
                  </Typography>
                </Box>

                <Divider sx={{ my: 1.5 }} />

                <Stack spacing={1.5}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="caption" color="text.secondary">Plan</Typography>
                    <Chip
                      label={(profile.tier ?? 'free').charAt(0).toUpperCase() + (profile.tier ?? 'free').slice(1)}
                      size="small"
                      sx={{ height: 20, fontSize: '0.7rem', fontWeight: 700, bgcolor: '#F0F5F1', color: '#1B6B3E' }}
                    />
                  </Stack>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="caption" color="text.secondary">Status</Typography>
                    <Chip label={statusInfo.label} size="small" sx={{ height: 20, fontSize: '0.7rem', fontWeight: 700, bgcolor: statusInfo.bg, color: statusInfo.color }} />
                  </Stack>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="caption" color="text.secondary">Lifecycle</Typography>
                    <Chip label={lifecycleInfo.label} size="small" sx={{ height: 20, fontSize: '0.7rem', fontWeight: 700, bgcolor: lifecycleInfo.bg, color: lifecycleInfo.color }} />
                  </Stack>
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="caption" color="text.secondary">Lead Score</Typography>
                    <Stack direction="row" spacing={0.5} alignItems="center">
                      <Typography variant="caption" fontWeight={800} sx={{ color: leadScoreColor(score) }}>{score}/100</Typography>
                    </Stack>
                  </Stack>
                  <Box>
                    <Box sx={{ width: '100%', height: 6, borderRadius: 3, bgcolor: '#E8E4DC', overflow: 'hidden' }}>
                      <Box sx={{ width: `${score}%`, height: '100%', bgcolor: leadScoreColor(score), borderRadius: 3, transition: 'width 0.6s ease' }} />
                    </Box>
                  </Box>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="caption" color="text.secondary">Member since</Typography>
                    <Typography variant="caption" fontWeight={600}>{fmtDate(profile.created_at)}</Typography>
                  </Stack>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="caption" color="text.secondary">Last active</Typography>
                    <Typography variant="caption" fontWeight={600}>
                      {profile.last_login_at ? `${daysBetween(profile.last_login_at)}d ago` : '—'}
                    </Typography>
                  </Stack>
                  <Stack direction="row" justifyContent="space-between">
                    <Typography variant="caption" color="text.secondary">Revenue</Typography>
                    <Typography variant="caption" fontWeight={600}>${(profile.total_revenue ?? 0).toFixed(2)}</Typography>
                  </Stack>
                </Stack>

                <Divider sx={{ my: 1.5 }} />

                {/* Tags */}
                <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ display: 'block', mb: 1 }}>TAGS</Typography>
                <Stack direction="row" flexWrap="wrap" gap={0.5} sx={{ mb: 1 }}>
                  {userTags.map(t => (
                    <Chip
                      key={t.id}
                      label={t.name}
                      size="small"
                      onDelete={() => removeTag(t.id)}
                      sx={{ bgcolor: `${t.color}22`, color: t.color, fontWeight: 700, fontSize: '0.65rem', height: 20 }}
                    />
                  ))}
                  {userTags.length === 0 && (
                    <Typography variant="caption" color="text.disabled">No tags assigned</Typography>
                  )}
                </Stack>

                <Divider sx={{ my: 1.5 }} />

                {/* Quick actions */}
                <Typography variant="caption" color="text.secondary" fontWeight={700} sx={{ display: 'block', mb: 1 }}>QUICK ACTIONS</Typography>
                <Stack spacing={0.75}>
                  <Button
                    size="small" variant="outlined" startIcon={<NoteAddOutlinedIcon sx={{ fontSize: 15 }} />}
                    onClick={() => setNoteDialog(true)}
                    sx={{ justifyContent: 'flex-start', fontSize: '0.75rem', py: 0.5 }}
                  >
                    Add Note
                  </Button>
                  <Button
                    size="small" variant="outlined" startIcon={<LocalOfferOutlinedIcon sx={{ fontSize: 15 }} />}
                    onClick={() => setTagDialog(true)}
                    disabled={availableTags.length === 0}
                    sx={{ justifyContent: 'flex-start', fontSize: '0.75rem', py: 0.5 }}
                  >
                    Add Tag
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          </Stack>

          {/* Main content */}
          <Card elevation={0} sx={{ border: '1px solid', borderColor: 'grey.200' }}>
            <Tabs
              value={tab}
              onChange={(_, v) => setTab(v)}
              sx={{ borderBottom: '1px solid', borderColor: 'divider', px: 2 }}
              variant="scrollable"
              scrollButtons="auto"
            >
              {['Overview', 'Ideas', 'Notes', 'Activity Log'].map((label, i) => (
                <Tab key={label} label={label} value={i} sx={{ fontSize: '0.8125rem', fontWeight: 600, textTransform: 'none', minWidth: 'auto', px: 2 }} />
              ))}
            </Tabs>

            <Box sx={{ p: 2.5 }}>
              {/* Tab 0: Overview */}
              {tab === 0 && (
                <Stack spacing={2.5}>
                  <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 1.5 }}>
                    {[
                      { label: 'Ideas Created', value: ideas.length },
                      { label: 'Login Count', value: profile.login_count ?? 0 },
                      { label: 'IQ Score', value: profile.iq_score ? `${profile.iq_score}/100` : '—' },
                      { label: 'In Marketplace', value: ideas.filter(i => i.in_marketplace).length },
                    ].map(s => (
                      <Card key={s.label} elevation={0} sx={{ bgcolor: '#FAF8F3', border: '1px solid', borderColor: 'grey.100' }}>
                        <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                          <Typography variant="h6" fontWeight={800}>{s.value}</Typography>
                          <Typography variant="caption" color="text.secondary">{s.label}</Typography>
                        </CardContent>
                      </Card>
                    ))}
                  </Box>

                  <Box>
                    <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>Lead Score Breakdown</Typography>
                    <Stack spacing={0.75}>
                      {[
                        { label: 'Engagement (logins)', value: Math.min(profile.login_count ?? 0, 20), max: 20 },
                        { label: 'Idea activity', value: Math.min(ideas.length * 5, 10), max: 10 },
                        { label: 'Recency', value: (() => { const d = daysBetween(profile.last_login_at); if (d <= 1) return 20; if (d <= 3) return 15; if (d <= 7) return 10; if (d <= 14) return 5; return 0; })(), max: 20 },
                        { label: 'Plan tier', value: (() => { const t = profile.tier ?? 'free'; if (t === 'accelerator' || t === 'family') return 10; if (t === 'growth' || t === 'launch') return 8; if (t === 'pro' || t === 'builder') return 6; return 0; })(), max: 10 },
                      ].map(row => (
                        <Stack key={row.label} direction="row" spacing={1.5} alignItems="center">
                          <Typography variant="caption" color="text.secondary" sx={{ minWidth: 160 }}>{row.label}</Typography>
                          <Box sx={{ flex: 1, height: 6, borderRadius: 3, bgcolor: '#E8E4DC', overflow: 'hidden' }}>
                            <Box sx={{ width: `${(row.value / row.max) * 100}%`, height: '100%', bgcolor: '#1B6B3E', borderRadius: 3 }} />
                          </Box>
                          <Typography variant="caption" fontWeight={700} sx={{ minWidth: 40, textAlign: 'right' }}>{row.value}/{row.max}</Typography>
                        </Stack>
                      ))}
                    </Stack>
                  </Box>

                  {activity.length > 0 && (
                    <Box>
                      <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>Recent Activity</Typography>
                      <Stack spacing={0.5}>
                        {activity.slice(0, 10).map(a => (
                          <Stack key={a.id} direction="row" spacing={1.5} alignItems="flex-start" sx={{ py: 0.5 }}>
                            <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#1B6B3E', mt: 0.75, flexShrink: 0 }} />
                            <Box>
                              <Typography variant="body2" fontWeight={500}>{a.action_type.replace(/_/g, ' ')}</Typography>
                              <Typography variant="caption" color="text.secondary">{fmtDateTime(a.created_at)}</Typography>
                            </Box>
                          </Stack>
                        ))}
                      </Stack>
                    </Box>
                  )}
                </Stack>
              )}

              {/* Tab 1: Ideas */}
              {tab === 1 && (
                <Box>
                  {ideas.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 6 }}>
                      <LightbulbOutlinedIcon sx={{ fontSize: 36, color: 'text.disabled', mb: 1 }} />
                      <Typography color="text.secondary">No ideas yet</Typography>
                    </Box>
                  ) : (
                    <Stack spacing={1}>
                      {ideas.map(idea => (
                        <Card key={idea.id} elevation={0} sx={{ border: '1px solid', borderColor: 'grey.200' }}>
                          <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                            <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                              <Box>
                                <Typography variant="body2" fontWeight={700}>{idea.title}</Typography>
                                <Typography variant="caption" color="text.secondary">{idea.sector ?? '—'} · {fmtDate(idea.created_at)}</Typography>
                              </Box>
                              <Stack direction="row" spacing={0.5} alignItems="center">
                                {idea.iq_score != null && (
                                  <Chip label={`IQ ${idea.iq_score}`} size="small" sx={{ height: 20, fontSize: '0.7rem', fontWeight: 700, bgcolor: '#F0F5F1', color: '#1B6B3E' }} />
                                )}
                                {idea.in_marketplace && (
                                  <Chip label="Marketplace" size="small" sx={{ height: 20, fontSize: '0.7rem', fontWeight: 700, bgcolor: '#DEEBE2', color: '#2A8A52' }} />
                                )}
                              </Stack>
                            </Stack>
                          </CardContent>
                        </Card>
                      ))}
                    </Stack>
                  )}
                </Box>
              )}

              {/* Tab 2: Notes */}
              {tab === 2 && (
                <Box>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" fontWeight={700}>Admin Notes</Typography>
                    <Button size="small" variant="contained" startIcon={<NoteAddOutlinedIcon sx={{ fontSize: 15 }} />} onClick={() => setNoteDialog(true)}>
                      Add Note
                    </Button>
                  </Stack>
                  {notes.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 6 }}>
                      <PersonOutlineIcon sx={{ fontSize: 36, color: 'text.disabled', mb: 1 }} />
                      <Typography color="text.secondary">No notes yet</Typography>
                    </Box>
                  ) : (
                    <List disablePadding>
                      {notes.map((n, i) => (
                        <Box key={n.id}>
                          {i > 0 && <Divider />}
                          <ListItem disablePadding sx={{ py: 1.5 }}>
                            <ListItemText
                              primary={<Typography variant="body2">{n.note}</Typography>}
                              secondary={
                                <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mt: 0.5 }}>
                                  <AccessTimeIcon sx={{ fontSize: 12, color: 'text.disabled' }} />
                                  <Typography variant="caption" color="text.secondary">{fmtDateTime(n.created_at)}</Typography>
                                </Stack>
                              }
                            />
                          </ListItem>
                        </Box>
                      ))}
                    </List>
                  )}
                </Box>
              )}

              {/* Tab 3: Activity Log */}
              {tab === 3 && (
                <Box>
                  <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 2 }}>Activity Timeline</Typography>
                  {activity.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 6 }}>
                      <AccessTimeIcon sx={{ fontSize: 36, color: 'text.disabled', mb: 1 }} />
                      <Typography color="text.secondary">No activity recorded yet</Typography>
                    </Box>
                  ) : (
                    <Stack spacing={0}>
                      {activity.map((a, i) => (
                        <Stack key={a.id} direction="row" spacing={2} sx={{ pb: 2, position: 'relative' }}>
                          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', pt: 0.5 }}>
                            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: '#1B6B3E', flexShrink: 0 }} />
                            {i < activity.length - 1 && (
                              <Box sx={{ width: 1, flex: 1, bgcolor: '#E8E4DC', mt: 0.5 }} />
                            )}
                          </Box>
                          <Box sx={{ pb: 0.5 }}>
                            <Typography variant="body2" fontWeight={600}>
                              {a.action_type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                            </Typography>
                            {a.action_details && Object.keys(a.action_details).length > 0 && (
                              <Typography variant="caption" color="text.secondary">
                                {JSON.stringify(a.action_details).slice(0, 80)}
                              </Typography>
                            )}
                            <Typography variant="caption" color="text.disabled" sx={{ display: 'block' }}>
                              {fmtDateTime(a.created_at)}
                            </Typography>
                          </Box>
                        </Stack>
                      ))}
                    </Stack>
                  )}
                </Box>
              )}
            </Box>
          </Card>
        </Box>
      </Box>

      {/* Add Note Dialog */}
      <Dialog open={noteDialog} onClose={() => setNoteDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Admin Note</DialogTitle>
        <DialogContent>
          <TextField
            multiline rows={4} fullWidth autoFocus
            placeholder="Write your note here…"
            value={newNote}
            onChange={e => setNewNote(e.target.value)}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNoteDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={saveNote} disabled={!newNote.trim() || savingNote}>
            Save Note
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Tag Dialog */}
      <Dialog open={tagDialog} onClose={() => setTagDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Assign Tag</DialogTitle>
        <DialogContent>
          <FormControl fullWidth sx={{ mt: 1 }}>
            <InputLabel>Select Tag</InputLabel>
            <Select value={selectedTagId} label="Select Tag" onChange={e => setSelectedTagId(e.target.value)}>
              {availableTags.map(t => (
                <MenuItem key={t.id} value={t.id}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: t.color }} />
                    <Typography variant="body2">{t.name}</Typography>
                  </Stack>
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTagDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={assignTag} disabled={!selectedTagId}>Assign</Button>
        </DialogActions>
      </Dialog>
    </AdminLayout>
  );
}
