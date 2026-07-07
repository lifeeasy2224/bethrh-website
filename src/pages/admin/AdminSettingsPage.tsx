import { useEffect, useState, useCallback } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Switch from '@mui/material/Switch';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControlLabel from '@mui/material/FormControlLabel';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import LinearProgress from '@mui/material/LinearProgress';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import TuneOutlinedIcon from '@mui/icons-material/TuneOutlined';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import NotificationsOutlinedIcon from '@mui/icons-material/NotificationsOutlined';
import ShieldIcon from '@mui/icons-material/Shield';
import { useAdminAuth, ADMIN_API } from '../../contexts/AdminAuthContext';

type SystemSetting = {
  id: string;
  key: string;
  value: unknown;
  label: string;
  description: string;
  category: string;
  updated_at: string;
  updated_by: string | null;
};

const CATEGORY_CONFIG: Record<string, { label: string; icon: React.ElementType }> = {
  general:       { label: 'General',       icon: SettingsOutlinedIcon },
  security:      { label: 'Security',       icon: LockOutlinedIcon },
  features:      { label: 'Feature Flags',  icon: TuneOutlinedIcon },
  seo:           { label: 'SEO',            icon: SearchOutlinedIcon },
  email:         { label: 'Email',          icon: EmailOutlinedIcon },
  notifications: { label: 'Notifications',  icon: NotificationsOutlinedIcon },
};

const SELECT_OPTIONS: Record<string, { label: string; value: string }[]> = {
  registration_mode: [
    { label: 'Open', value: 'open' },
    { label: 'Invite Only', value: 'invite_only' },
    { label: 'Closed', value: 'closed' },
  ],
  email_digest_frequency: [
    { label: 'Real-time', value: 'real_time' },
    { label: 'Hourly', value: 'hourly' },
    { label: 'Daily', value: 'daily' },
    { label: 'Off', value: 'off' },
  ],
};

export default function AdminSettingsPage() {
  const { sessionToken, admin } = useAdminAuth();
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [loading, setLoading] = useState(true);
  const [snack, setSnack] = useState<{ msg: string; sev: 'success' | 'error' } | null>(null);
  const [savingKeys, setSavingKeys] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!sessionToken) return;
    setLoading(true);
    fetch(`${ADMIN_API}/settings-get`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` },
      body: JSON.stringify({ session_token: sessionToken }),
    })
      .then(r => r.json())
      .then((d: { settings: SystemSetting[] }) => setSettings(d.settings ?? []))
      .catch(() => setSnack({ msg: 'Failed to load settings', sev: 'error' }))
      .finally(() => setLoading(false));
  }, [sessionToken]);

  const saveSetting = useCallback(async (key: string, value: unknown) => {
    setSavingKeys(prev => new Set(prev).add(key));
    try {
      await fetch(`${ADMIN_API}/settings-update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` },
        body: JSON.stringify({ session_token: sessionToken, key, value }),
      });
      setSnack({ msg: 'Setting saved', sev: 'success' });
      setSettings(prev => prev.map(s => s.key === key ? { ...s, value } : s));
    } catch {
      setSnack({ msg: 'Failed to save setting', sev: 'error' });
    } finally {
      setSavingKeys(prev => { const n = new Set(prev); n.delete(key); return n; });
    }
  }, [sessionToken]);

  const updateLocal = (key: string, value: unknown) => {
    setSettings(prev => prev.map(s => s.key === key ? { ...s, value } : s));
  };

  if (admin?.role !== 'super_admin') {
    return (
      <Box sx={{ p: 4, display: 'flex', justifyContent: 'center' }}>
        <Card sx={{ p: 4, textAlign: 'center', maxWidth: 400 }}>
          <LockOutlinedIcon sx={{ fontSize: 48, color: 'error.main', mb: 2 }} />
          <Typography variant="h5" fontWeight={700} gutterBottom>Access Denied</Typography>
          <Typography color="text.secondary">This page is restricted to Super Admins only.</Typography>
        </Card>
      </Box>
    );
  }

  const grouped = settings.reduce<Record<string, SystemSetting[]>>((acc, s) => {
    acc[s.category] = acc[s.category] ?? [];
    acc[s.category].push(s);
    return acc;
  }, {});

  const renderInput = (s: SystemSetting) => {
    const saving = savingKeys.has(s.key);
    const isNumeric = s.key.startsWith('rate_limit_') || s.key.startsWith('session_timeout_');
    const isBoolean = typeof s.value === 'boolean';

    if (isBoolean) {
      return (
        <FormControlLabel
          control={
            <Switch
              checked={Boolean(s.value)}
              disabled={saving}
              onChange={e => { void saveSetting(s.key, e.target.checked); }}
            />
          }
          label=""
          sx={{ m: 0 }}
        />
      );
    }

    if (s.key in SELECT_OPTIONS) {
      return (
        <Select
          value={String(s.value ?? '')}
          size="small"
          disabled={saving}
          sx={{ minWidth: 180 }}
          onChange={e => { void saveSetting(s.key, e.target.value); }}
        >
          {SELECT_OPTIONS[s.key].map(opt => (
            <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
          ))}
        </Select>
      );
    }

    return (
      <TextField
        type={isNumeric ? 'number' : 'text'}
        value={String(s.value ?? '')}
        size="small"
        disabled={saving}
        sx={{ maxWidth: isNumeric ? 120 : 280 }}
        slotProps={isNumeric ? { htmlInput: { min: 0 } } : {}}
        onChange={e => updateLocal(s.key, e.target.value)}
        onBlur={() => {
          const val = isNumeric ? parseInt(String(s.value), 10) : s.value;
          void saveSetting(s.key, val);
        }}
        onKeyDown={e => {
          if (e.key === 'Enter') {
            const val = isNumeric ? parseInt(String(s.value), 10) : s.value;
            void saveSetting(s.key, val);
          }
        }}
      />
    );
  };

  const renderCategory = (cat: string, items: SystemSetting[]) => {
    const cfg = CATEGORY_CONFIG[cat];
    if (!cfg) return null;
    const Icon = cfg.icon;

    if (cat === 'features') {
      return (
        <Card key={cat} sx={{ mb: 3, borderRadius: 2 }}>
          <CardContent>
            <Stack direction="row" spacing={1.5} alignItems="center" mb={3}>
              <Icon sx={{ color: 'primary.main' }} />
              <Typography variant="h6" fontWeight={700}>{cfg.label}</Typography>
            </Stack>
            <Grid container spacing={2}>
              {items.map(s => (
                <Grid key={s.id} size={{ xs: 12, sm: 6 }}>
                  <Card
                    variant="outlined"
                    sx={{
                      p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      '&:hover': { borderColor: 'primary.main', boxShadow: 1 },
                    }}
                  >
                    <Box sx={{ flex: 1, pr: 2 }}>
                      <Typography variant="body2" fontWeight={600}>{s.label}</Typography>
                      <Typography variant="caption" color="text.secondary">{s.description}</Typography>
                    </Box>
                    {renderInput(s)}
                  </Card>
                </Grid>
              ))}
            </Grid>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card key={cat} sx={{ mb: 3, borderRadius: 2 }}>
        <CardContent>
          <Stack direction="row" spacing={1.5} alignItems="center" mb={2}>
            <Icon sx={{ color: 'primary.main' }} />
            <Typography variant="h6" fontWeight={700}>{cfg.label}</Typography>
          </Stack>
          <Stack spacing={0} divider={<Divider />}>
            {items.map(s => (
              <Box key={s.id} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 2 }}>
                <Box sx={{ flex: 1, mr: 3 }}>
                  <Typography variant="body2" fontWeight={600}>{s.label}</Typography>
                  <Typography variant="caption" color="text.secondary">{s.description}</Typography>
                </Box>
                {renderInput(s)}
              </Box>
            ))}
          </Stack>
        </CardContent>
      </Card>
    );
  };

  return (
    <Box sx={{ bgcolor: '#FAF8F3', minHeight: '100vh', p: 3 }}>
      {loading && <LinearProgress sx={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999 }} />}

      {/* Header */}
      <Stack direction="row" spacing={2} alignItems="center" mb={4}>
        <ShieldIcon sx={{ fontSize: 32, color: 'primary.main' }} />
        <Box sx={{ flex: 1 }}>
          <Typography variant="h5" fontWeight={800}>System Settings</Typography>
          <Typography variant="body2" color="text.secondary">Configure platform-wide settings and feature flags</Typography>
        </Box>
        <Chip label="Super Admin Only" color="error" size="small" sx={{ fontWeight: 700 }} />
      </Stack>

      {/* Category sections */}
      <Box sx={{ maxWidth: 900 }}>
        {['general', 'security', 'features', 'seo', 'email', 'notifications'].map(cat =>
          grouped[cat] ? renderCategory(cat, grouped[cat]) : null
        )}
      </Box>

      <Snackbar open={!!snack} autoHideDuration={3000} onClose={() => setSnack(null)} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
        <Alert severity={snack?.sev ?? 'success'} onClose={() => setSnack(null)}>{snack?.msg}</Alert>
      </Snackbar>
    </Box>
  );
}
