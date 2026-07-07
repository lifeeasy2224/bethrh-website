import { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Avatar from '@mui/material/Avatar';
import Chip from '@mui/material/Chip';
import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import CircularProgress from '@mui/material/CircularProgress';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import Switch from '@mui/material/Switch';
import Divider from '@mui/material/Divider';
import PersonOutlinedIcon from '@mui/icons-material/PersonOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import RocketLaunchOutlinedIcon from '@mui/icons-material/RocketLaunchOutlined';
import NotificationsNoneOutlinedIcon from '@mui/icons-material/NotificationsNoneOutlined';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import MenuIcon from '@mui/icons-material/Menu';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase, PLAN_LABELS } from '../supabase';
import FounderSidebar from '../components/FounderSidebar';
import InvestorSidebar from '../components/InvestorSidebar';

interface PasswordForm {
  current: string;
  next: string;
  confirm: string;
}

interface NotifPrefs {
  email_digest_enabled: boolean;
  inspiration_enabled: boolean;
  investor_match_alerts: boolean;
  message_notifications: boolean;
  validation_notifications: boolean;
}

export default function SettingsPage() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [fullName, setFullName] = useState(profile?.full_name ?? '');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [pwForm, setPwForm] = useState<PasswordForm>({ current: '', next: '', confirm: '' });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwSuccess, setPwSuccess] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);
  const [notifPrefs, setNotifPrefs] = useState<NotifPrefs>({
    email_digest_enabled: true,
    inspiration_enabled: true,
    investor_match_alerts: true,
    message_notifications: true,
    validation_notifications: true,
  });
  const [notifSaving, setNotifSaving] = useState(false);
  const [notifSuccess, setNotifSuccess] = useState(false);

  useEffect(() => {
    if (profile?.full_name) setFullName(profile.full_name);
  }, [profile?.full_name]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('profiles')
      .select('email_digest_enabled, inspiration_enabled, investor_match_alerts, message_notifications, validation_notifications')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setNotifPrefs({
            email_digest_enabled: data.email_digest_enabled ?? true,
            inspiration_enabled: data.inspiration_enabled ?? true,
            investor_match_alerts: data.investor_match_alerts ?? true,
            message_notifications: data.message_notifications ?? true,
            validation_notifications: data.validation_notifications ?? true,
          });
        }
      });
  }, [user]);

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!fullName.trim()) return;
    setProfileSaving(true);
    setProfileError(null);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: fullName.trim(), updated_at: new Date().toISOString() })
        .eq('user_id', user!.id);
      if (error) throw error;
      setProfileSuccess(true);
    } catch {
      setProfileError('تعذّر حفظ الملف الشخصي. حاول مرة أخرى.');
    } finally {
      setProfileSaving(false);
    }
  }

  async function handleSaveNotifications() {
    setNotifSaving(true);
    try {
      await supabase
        .from('profiles')
        .update(notifPrefs)
        .eq('user_id', user!.id);
      setNotifSuccess(true);
    } finally {
      setNotifSaving(false);
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (pwForm.next !== pwForm.confirm) {
      setPwError('كلمتا المرور الجديدتان غير متطابقتين.');
      return;
    }
    if (pwForm.next.length < 8) {
      setPwError('يجب ألا تقل كلمة المرور عن ٨ أحرف.');
      return;
    }
    setPwSaving(true);
    setPwError(null);
    try {
      const { error } = await supabase.auth.updateUser({ password: pwForm.next });
      if (error) throw error;
      setPwSuccess(true);
      setPwForm({ current: '', next: '', confirm: '' });
    } catch (err: unknown) {
      setPwError(err instanceof Error ? err.message : 'تعذّر تحديث كلمة المرور.');
    } finally {
      setPwSaving(false);
    }
  }

  const planLabel = profile?.plan ? PLAN_LABELS[profile.plan] ?? profile.plan : 'مجاني';
  const isFreePlan = profile?.plan === 'free';
  const isFounder = profile?.role === 'founder';

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'grey.50' }}>
      {isFounder
        ? <FounderSidebar open={sidebarOpen} onToggle={() => setSidebarOpen(o => !o)} mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />
        : <InvestorSidebar open={sidebarOpen} onToggle={() => setSidebarOpen(o => !o)} mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />
      }

      <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <AppBar position="sticky" elevation={0} sx={{ bgcolor: 'white', borderBottom: '1px solid', borderColor: 'divider' }}>
          <Toolbar sx={{ gap: 1 }}>
            <IconButton sx={{ display: { lg: 'none' } }} onClick={() => setMobileOpen(true)} size="small">
              <MenuIcon />
            </IconButton>
            <IconButton size="small" onClick={() => navigate(-1)} sx={{ color: 'text.secondary' }}>
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h6" fontWeight={700} sx={{ flex: 1 }}>الإعدادات</Typography>
          </Toolbar>
        </AppBar>

        <Box sx={{ flex: 1, py: 4 }}>
          <Container maxWidth="md">
            <Stack spacing={3}>
              {/* Profile section */}
              <Card>
                <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                  <Stack direction="row" spacing={2} alignItems="center" mb={3}>
                    <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: 'primary.light', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <PersonOutlinedIcon sx={{ color: 'primary.main', fontSize: 20 }} />
                    </Box>
                    <Typography variant="h6" fontWeight={700}>معلومات الملف الشخصي</Typography>
                  </Stack>

                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={3} alignItems={{ sm: 'center' }} mb={3}>
                    <Avatar
                      sx={{
                        width: 72, height: 72,
                        bgcolor: 'primary.main',
                        background: 'linear-gradient(135deg, #1B6B3E, #0F3D24)',
                        fontSize: '1.5rem',
                        fontWeight: 700,
                        flexShrink: 0,
                      }}
                    >
                      {fullName?.[0]?.toUpperCase() ?? '?'}
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle1" fontWeight={600}>{fullName || 'اسمك'}</Typography>
                      <Typography variant="body2" color="text.secondary">{user?.email}</Typography>
                      <Stack direction="row" spacing={1} mt={0.75}>
                        <Chip label={profile?.role === 'investor' ? 'مستثمر' : 'رائد أعمال'} size="small" sx={{ bgcolor: 'grey.100' }} />
                        <Chip label={planLabel} size="small" color="primary" variant="outlined" />
                      </Stack>
                    </Box>
                  </Stack>

                  <Box component="form" onSubmit={handleSaveProfile}>
                    <Stack spacing={2.5}>
                      <TextField
                        label="الاسم الكامل"
                        value={fullName}
                        onChange={e => setFullName(e.target.value)}
                        fullWidth
                        required
                      />
                      <TextField
                        label="البريد الإلكتروني"
                        value={user?.email ?? ''}
                        fullWidth
                        disabled
                        helperText="لا يمكن تغيير البريد من هنا. تواصل مع الدعم إن لزم."
                      />
                      {profileError && <Alert severity="error">{profileError}</Alert>}
                      <Box>
                        <Button
                          type="submit"
                          variant="contained"
                          disabled={profileSaving}
                          startIcon={profileSaving ? <CircularProgress size={16} color="inherit" /> : undefined}
                        >
                          {profileSaving ? 'جارٍ الحفظ…' : 'احفظ التغييرات'}
                        </Button>
                      </Box>
                    </Stack>
                  </Box>
                </CardContent>
              </Card>

              {/* Password section */}
              <Card>
                <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                  <Stack direction="row" spacing={2} alignItems="center" mb={3}>
                    <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: 'warning.light', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <LockOutlinedIcon sx={{ color: 'warning.dark', fontSize: 20 }} />
                    </Box>
                    <Typography variant="h6" fontWeight={700}>تغيير كلمة المرور</Typography>
                  </Stack>

                  <Box component="form" onSubmit={handleChangePassword}>
                    <Stack spacing={2.5}>
                      <TextField
                        label="كلمة المرور الجديدة"
                        type="password"
                        value={pwForm.next}
                        onChange={e => setPwForm(p => ({ ...p, next: e.target.value }))}
                        fullWidth
                        required
                        helperText="٨ أحرف على الأقل"
                      />
                      <TextField
                        label="تأكيد كلمة المرور الجديدة"
                        type="password"
                        value={pwForm.confirm}
                        onChange={e => setPwForm(p => ({ ...p, confirm: e.target.value }))}
                        fullWidth
                        required
                      />
                      {pwError && <Alert severity="error">{pwError}</Alert>}
                      <Box>
                        <Button
                          type="submit"
                          variant="outlined"
                          disabled={pwSaving || !pwForm.next || !pwForm.confirm}
                          startIcon={pwSaving ? <CircularProgress size={16} color="inherit" /> : undefined}
                        >
                          {pwSaving ? 'جارٍ التحديث…' : 'حدّث كلمة المرور'}
                        </Button>
                      </Box>
                    </Stack>
                  </Box>
                </CardContent>
              </Card>

              {/* Notifications section */}
              <Card>
                <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                  <Stack direction="row" spacing={2} alignItems="center" mb={3}>
                    <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: 'info.light', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <NotificationsNoneOutlinedIcon sx={{ color: 'info.dark', fontSize: 20 }} />
                    </Box>
                    <Box>
                      <Typography variant="h6" fontWeight={700}>إشعارات البريد الإلكتروني</Typography>
                      <Typography variant="body2" color="text.secondary">اختر الرسائل التي تصلك من بذرة</Typography>
                    </Box>
                  </Stack>

                  <Stack divider={<Divider />}>
                    {([
                      { key: 'email_digest_enabled', label: 'الملخص الأسبوعي', description: 'إحصاءاتك وسلاسلك وأبرز أحداثك كل أسبوع' },
                      { key: 'inspiration_enabled', label: 'الإلهام الأسبوعي', description: 'نصائح وتحفيز لروّاد الأعمال كل أربعاء' },
                      { key: 'investor_match_alerts', label: 'تنبيهات توافق المستثمرين', description: 'عندما يتوافق مستثمرون مع فكرتك' },
                      { key: 'message_notifications', label: 'إشعارات الرسائل', description: 'عند وصول رسالة جديدة' },
                      { key: 'validation_notifications', label: 'نتائج التحقق', description: 'عند اكتمال اختبار فكرتك الذكي' },
                    ] as Array<{ key: keyof NotifPrefs; label: string; description: string }>).map(item => (
                      <Stack key={item.key} direction="row" alignItems="center" justifyContent="space-between" py={1.5}>
                        <Box>
                          <Typography variant="body2" fontWeight={600}>{item.label}</Typography>
                          <Typography variant="caption" color="text.secondary">{item.description}</Typography>
                        </Box>
                        <Switch
                          checked={notifPrefs[item.key]}
                          onChange={e => setNotifPrefs(p => ({ ...p, [item.key]: e.target.checked }))}
                          size="small"
                        />
                      </Stack>
                    ))}
                  </Stack>

                  <Box mt={3}>
                    <Button
                      variant="contained"
                      onClick={handleSaveNotifications}
                      disabled={notifSaving}
                      startIcon={notifSaving ? <CircularProgress size={16} color="inherit" /> : undefined}
                    >
                      {notifSaving ? 'جارٍ الحفظ…' : 'احفظ التفضيلات'}
                    </Button>
                  </Box>
                </CardContent>
              </Card>

              {/* Plan section */}
              <Card>
                <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                  <Stack direction="row" spacing={2} alignItems="center" mb={3}>
                    <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: 'success.light', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <RocketLaunchOutlinedIcon sx={{ color: 'success.dark', fontSize: 20 }} />
                    </Box>
                    <Typography variant="h6" fontWeight={700}>خطتك</Typography>
                  </Stack>

                  <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} spacing={2}>
                    <Box>
                      <Typography variant="subtitle1" fontWeight={700}>خطة {planLabel}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {isFreePlan
                          ? 'أنت على الخطة المجانية. رقِّ لفتح كل المزايا.'
                          : 'شكراً لكونك مشتركاً عزيزاً.'}
                      </Typography>
                    </Box>
                    {isFreePlan && (
                      <Button
                        component={Link}
                        to="/pricing"
                        variant="contained"
                        sx={{ flexShrink: 0 }}
                      >
                        رقِّ خطتك
                      </Button>
                    )}
                  </Stack>
                </CardContent>
              </Card>
            </Stack>
          </Container>
        </Box>
      </Box>

      <Snackbar open={profileSuccess} autoHideDuration={3000} onClose={() => setProfileSuccess(false)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity="success" variant="filled">حُفظ الملف الشخصي بنجاح.</Alert>
      </Snackbar>
      <Snackbar open={pwSuccess} autoHideDuration={3000} onClose={() => setPwSuccess(false)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity="success" variant="filled">حُدّثت كلمة المرور بنجاح.</Alert>
      </Snackbar>
      <Snackbar open={notifSuccess} autoHideDuration={3000} onClose={() => setNotifSuccess(false)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity="success" variant="filled">حُفظت تفضيلات الإشعارات.</Alert>
      </Snackbar>
    </Box>
  );
}
