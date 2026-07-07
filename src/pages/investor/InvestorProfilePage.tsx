// FILE: /tmp/cc-agent/67420917/project/src/pages/investor/InvestorProfilePage.tsx

import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Stack,
  Card,
  CardContent,
  Button,
  TextField,
  Select,
  MenuItem,
  Grid,
  Checkbox,
  FormControlLabel,
  Divider,
  Avatar,
  Chip,
  Link,
  Typography,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  AppBar,
  Toolbar,
  IconButton,
  Badge,
} from '@mui/material';
import {
  Menu as MenuIcon,
  PersonOutlined as PersonOutlinedIcon,
  NotificationsOutlined as NotificationsIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../supabase';
import InvestorSidebar from '../../components/InvestorSidebar';
import { SECTORS } from '../../supabase';

interface InvestorProfile {
  id: string;
  user_id: string;
  investor_type: string;
  sectors_of_interest: string[];
  check_size: string;
  is_verified: boolean;
  city: string;
  state: string;
  bio: string;
  linkedin_url: string;
  value_add: string;
  created_at: string;
  updated_at: string;
}

export default function InvestorProfilePage() {
  const { user, profile } = useAuth();
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [investorProfile, setInvestorProfile] = useState<InvestorProfile | null>(null);
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || '',
    investor_type: '',
    city: '',
    state: '',
    sectors_of_interest: [] as string[],
    check_size: '',
    value_add: '',
    linkedin_url: '',
  });
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    loadInvestorProfile();
  }, [user?.id]);

  const loadInvestorProfile = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('investor_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setInvestorProfile(data);
        setFormData({
          full_name: profile?.full_name || '',
          investor_type: data.investor_type || '',
          city: data.city || '',
          state: data.state || '',
          sectors_of_interest: data.sectors_of_interest || [],
          check_size: data.check_size || '',
          value_add: data.value_add || '',
          linkedin_url: data.linkedin_url || '',
        });
      } else {
        setFormData({
          full_name: profile?.full_name || '',
          investor_type: '',
          city: '',
          state: '',
          sectors_of_interest: [],
          check_size: '',
          value_add: '',
          linkedin_url: '',
        });
        setEditMode(true);
      }
    } catch (err) {
      console.error('Error loading profile:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateProfileCompleteness = () => {
    let score = 0;
    const missing: string[] = [];

    if (profile?.full_name) score += 10;
    else missing.push('الاسم الكامل');

    if (formData.investor_type) score += 10;
    else missing.push('نوع المستثمر');

    if (formData.city) score += 10;
    else missing.push('المدينة');

    if (formData.sectors_of_interest.length >= 1) score += 15;
    else missing.push('القطاعات المهتم بها');

    if (formData.check_size) score += 15;
    else missing.push('حجم الاستثمار');

    if (formData.value_add && formData.value_add.length >= 50) score += 20;
    else missing.push('ما أقدمه (٥٠ حرفاً على الأقل)');

    if (formData.linkedin_url) score += 10;
    else missing.push('رابط LinkedIn');

    if (formData.value_add && formData.value_add.length >= 20) score += 10;
    else missing.push('نبذة / ما أقدمه (٢٠ حرفاً على الأقل)');

    return { score, missing };
  };

  const handleSaveProfile = async () => {
    if (!user?.id) return;

    try {
      const upsertData = {
        user_id: user.id,
        investor_type: formData.investor_type,
        city: formData.city,
        state: formData.state,
        sectors_of_interest: formData.sectors_of_interest,
        check_size: formData.check_size,
        value_add: formData.value_add,
        linkedin_url: formData.linkedin_url,
        updated_at: new Date().toISOString(),
      };

      const { error: profileError } = await supabase
        .from('investor_profiles')
        .upsert(upsertData, { onConflict: 'user_id' });

      if (profileError) throw profileError;

      if (formData.full_name !== profile?.full_name) {
        const { error: nameError } = await supabase
          .from('profiles')
          .update({ full_name: formData.full_name })
          .eq('id', user.id);

        if (nameError) throw nameError;
      }

      setEditMode(false);
      loadInvestorProfile();
    } catch (err) {
      console.error('Error saving profile:', err);
    }
  };

  const handleSectorToggle = (sector: string) => {
    setFormData((prev) => {
      const current = prev.sectors_of_interest;
      if (current.includes(sector)) {
        return {
          ...prev,
          sectors_of_interest: current.filter((s) => s !== sector),
        };
      } else if (current.length < 4) {
        return {
          ...prev,
          sectors_of_interest: [...current, sector],
        };
      }
      return prev;
    });
  };

  const { score, missing } = calculateProfileCompleteness();

  const getInitial = () => {
    return (profile?.full_name || 'U')[0].toUpperCase();
  };

  if (loading) {
    return <Typography>جارٍ التحميل...</Typography>;
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <InvestorSidebar open={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <AppBar position="static">
          <Toolbar>
            <IconButton
              edge="start"
              color="inherit"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              sx={{ mr: 2 }}
            >
              <MenuIcon />
            </IconButton>
            <PersonOutlinedIcon sx={{ mr: 1 }} />
            <Typography variant="h6" sx={{ flex: 1 }}>
              ملفي الشخصي
            </Typography>
            <IconButton color="inherit">
              <Badge badgeContent={0} color="error">
                <NotificationsIcon />
              </Badge>
            </IconButton>
            <Avatar sx={{ ml: 2, width: 40, height: 40 }}>
              {getInitial()}
            </Avatar>
          </Toolbar>
        </AppBar>

        <Container maxWidth="md" sx={{ py: 4, flex: 1 }}>
          {!editMode ? (
            <Stack spacing={3}>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>
                  ملفي الاستثماري
                </Typography>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                  هذا ما يراه المؤسسون عندما تطلب التواصل.
                </Typography>
                <Button
                  variant="outlined"
                  onClick={() => setEditMode(true)}
                >
                  عدّل الملف
                </Button>
              </Box>

              <Card>
                <CardContent>
                  <Stack spacing={2}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar
                        sx={{
                          width: 80,
                          height: 80,
                          bgcolor: 'secondary.main',
                          fontSize: '1.5rem',
                        }}
                      >
                        {getInitial()}
                      </Avatar>
                      <Box>
                        <Typography variant="h6">
                          {profile?.full_name || 'بدون اسم'}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          {formData.investor_type && formData.city
                            ? `${formData.investor_type} • ${formData.city}, ${formData.state}`
                            : 'الملف غير مكتمل'}
                        </Typography>
                      </Box>
                    </Box>

                    <Divider />

                    {formData.sectors_of_interest.length > 0 && (
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                          القطاعات المهتم بها
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                          {formData.sectors_of_interest.map((sector) => {
                            const meta = SECTORS.find((x) => x.key === sector);
                            return <Chip key={sector} label={meta ? `${meta.emoji} ${meta.label}` : sector} size="small" />;
                          })}
                        </Box>
                      </Box>
                    )}

                    {formData.check_size && (
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          حجم الاستثمار
                        </Typography>
                        <Typography variant="body2">{formData.check_size}</Typography>
                      </Box>
                    )}

                    {formData.value_add && (
                      <Box>
                        <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>
                          ما أقدمه
                        </Typography>
                        <Typography variant="body2">{formData.value_add}</Typography>
                      </Box>
                    )}

                    {formData.linkedin_url && (
                      <Box>
                        <Link
                          href={formData.linkedin_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          variant="body2"
                        >
                          LinkedIn
                        </Link>
                      </Box>
                    )}

                    {investorProfile?.created_at && (
                      <Box>
                        <Typography variant="body2" color="textSecondary">
                          عضو منذ {new Date(investorProfile.created_at).toLocaleDateString('ar')}
                        </Typography>
                      </Box>
                    )}
                  </Stack>
                </CardContent>
              </Card>

              <Card>
                <CardContent>
                  <Typography variant="h6" sx={{ mb: 1 }}>
                    اكتمال الملف: ٪{score}
                  </Typography>
                  <LinearProgress variant="determinate" value={score} sx={{ mb: 2 }} />
                  {missing.length > 0 && (
                    <List dense>
                      {missing.map((item) => (
                        <ListItem key={item}>
                          <ListItemText primary={`• ${item}`} />
                        </ListItem>
                      ))}
                    </List>
                  )}
                </CardContent>
              </Card>
            </Stack>
          ) : (
            <Stack spacing={2.5}>
              <Typography variant="h5" sx={{ fontWeight: 800 }}>
                تعديل الملف
              </Typography>

              <TextField
                fullWidth
                label="الاسم الكامل"
                value={formData.full_name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, full_name: e.target.value }))
                }
              />

              <Select
                fullWidth
                value={formData.investor_type}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, investor_type: e.target.value }))
                }
                displayEmpty
              >
                <MenuItem value="">اختر نوع المستثمر</MenuItem>
                <MenuItem value="Angel Investor">مستثمر ملاك</MenuItem>
                <MenuItem value="VC / Fund">صندوق رأس مال جريء</MenuItem>
                <MenuItem value="Family Office">مكتب عائلي</MenuItem>
                <MenuItem value="Curious">مستكشف</MenuItem>
              </Select>

              <TextField
                fullWidth
                label="المدينة"
                value={formData.city}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, city: e.target.value }))
                }
              />

              <TextField
                fullWidth
                label="المنطقة / الدولة"
                value={formData.state}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, state: e.target.value }))
                }
              />

              <Box>
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                  القطاعات المهتم بها (٤ كحد أقصى)
                </Typography>
                <Grid container spacing={1}>
                  {SECTORS.map((sector) => (
                    <Grid key={sector.key} size={{ xs: 6, md: 3 }}>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={formData.sectors_of_interest.includes(sector.key)}
                            onChange={() => handleSectorToggle(sector.key)}
                          />
                        }
                        label={`${sector.emoji} ${sector.label}`}
                      />
                    </Grid>
                  ))}
                </Grid>
              </Box>

              <Select
                fullWidth
                value={formData.check_size}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, check_size: e.target.value }))
                }
                displayEmpty
              >
                <MenuItem value="">اختر حجم الاستثمار</MenuItem>
                <MenuItem value="< $10K">{"< $10K"}</MenuItem>
                <MenuItem value="$10K-$50K">$10K-$50K</MenuItem>
                <MenuItem value="$50K-$250K">$50K-$250K</MenuItem>
                <MenuItem value="$250K+">$250K+</MenuItem>
              </Select>

              <TextField
                fullWidth
                label="ما أقدمه"
                multiline
                rows={3}
                value={formData.value_add}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, value_add: e.target.value }))
                }
                helperText={`${formData.value_add.length}/50 حرفاً كحد أدنى. المؤسسون يهتمون بأكثر من المال.`}
                error={formData.value_add.length > 0 && formData.value_add.length < 50}
              />

              <TextField
                fullWidth
                label="رابط LinkedIn"
                value={formData.linkedin_url}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, linkedin_url: e.target.value }))
                }
              />

              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button
                  variant="outlined"
                  onClick={() => {
                    setEditMode(false);
                    loadInvestorProfile();
                  }}
                >
                  إلغاء
                </Button>
                <Button
                  variant="contained"
                  onClick={handleSaveProfile}
                  disabled={!formData.investor_type || !formData.city}
                >
                  احفظ الملف
                </Button>
              </Box>
            </Stack>
          )}
        </Container>
      </Box>
    </Box>
  );
}
