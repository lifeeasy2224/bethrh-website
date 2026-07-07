import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Card,
  Typography,
  Chip,
  Alert,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Avatar,
  AppBar,
  Toolbar,
  IconButton,
  Stack,
  Snackbar,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import NotificationsOutlinedIcon from '@mui/icons-material/NotificationsOutlined';
import LockIcon from '@mui/icons-material/Lock';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import FavoriteIcon from '@mui/icons-material/Favorite';
import MenuIcon from '@mui/icons-material/Menu';
import { useAuth } from '../../contexts/AuthContext';
import { SECTORS, supabase } from '../../supabase';
import InvestorSidebar from '../../components/InvestorSidebar';
import { sendEmail } from '../../lib/sendEmail';

interface Idea {
  id: string;
  title: string;
  sector: string;
  problem: string;
  solution: string;
  target_customer: string;
  stage: string;
  iq_score: number;
  in_marketplace: boolean;
  user_id: string;
  created_at: string;
}

interface Canvas {
  id: string;
  user_idea_id: string;
  monthly_revenue: number | null;
  monthly_costs: number | null;
  break_even_month: number | null;
}

interface Pitch {
  id: string;
  user_idea_id: string;
  investment_amount: number | null;
  use_of_funds: string | null;
}

interface ValidationStats {
  interviews: number;
  signups: number;
  preorders_total: number;
  sentiment_positive: number | null;
}

interface ConnectionRequest {
  id: string;
  status: string;
  created_at: string;
}

interface Connection {
  id: string;
  created_at: string;
}

export default function IdeaDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [toast, setToast] = useState<{ msg: string; severity: 'success' | 'error' } | null>(null);

  const [idea, setIdea] = useState<Idea | null>(null);
  const [canvas, setCanvas] = useState<Canvas | null>(null);
  const [pitch, setPitch] = useState<Pitch | null>(null);
  const [validationStats, setValidationStats] = useState<ValidationStats | null>(null);
  const [myRequest, setMyRequest] = useState<ConnectionRequest | null>(null);
  const [myConnection, setMyConnection] = useState<Connection | null>(null);
  const [isSaved, setIsSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [requestMessage, setRequestMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!id || !user) return;
    loadIdeaDetails();
  }, [id, user]);

  const loadIdeaDetails = async () => {
    if (!user || !id) return;
    const userId = user.id;
    try {
      setLoading(true);

      // Load idea
      const { data: ideaData, error: ideaError } = await supabase
        .from('user_ideas')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (ideaError) throw ideaError;
      if (!ideaData) {
        setToast({ msg: 'الفكرة غير موجودة', severity: 'error' });
        navigate('/marketplace');
        return;
      }

      setIdea(ideaData);

      // Load canvas data
      const { data: canvasData } = await supabase
        .from('canvas_data')
        .select('*')
        .eq('user_idea_id', id)
        .maybeSingle();

      if (canvasData) setCanvas(canvasData);

      // Load pitch data
      const { data: pitchData } = await supabase
        .from('pitch_data')
        .select('*')
        .eq('user_idea_id', id)
        .maybeSingle();

      if (pitchData) setPitch(pitchData);

      // Load validation entries
      const { data: validations } = await supabase
        .from('validation_entries')
        .select('type, count, amount')
        .eq('user_idea_id', id);

      if (validations && validations.length > 0) {
        let interviews = 0;
        let signups = 0;
        let preorders_total = 0;

        validations.forEach((v: any) => {
          if (v.type === 'interview') interviews = v.count || 0;
          if (v.type === 'signup') signups = v.count || 0;
          if (v.type === 'preorder') preorders_total = (v.amount || 0);
        });

        setValidationStats({
          interviews,
          signups,
          preorders_total,
          sentiment_positive: null,
        });
      }

      // Load connection request
      const { data: requestData } = await supabase
        .from('connection_requests')
        .select('id, status, created_at')
        .eq('investor_id', userId)
        .eq('idea_id', id)
        .maybeSingle();

      if (requestData) setMyRequest(requestData);

      // Load connection
      const { data: connectionData } = await supabase
        .from('connections')
        .select('id, created_at')
        .eq('investor_id', userId)
        .eq('idea_id', id)
        .maybeSingle();

      if (connectionData) setMyConnection(connectionData);

      // Check if saved
      const { data: savedData } = await supabase
        .from('saved_ideas')
        .select('id')
        .eq('investor_id', userId)
        .eq('idea_id', id)
        .maybeSingle();

      setIsSaved(!!savedData);
    } catch (error) {
      console.error('Error loading idea details:', error);
      setToast({ msg: 'تعذّر تحميل تفاصيل الفكرة', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveIdea = async () => {
    if (!user || !id) return;

    try {
      setSaving(true);

      if (isSaved) {
        // Remove from saved
        const { error } = await supabase
          .from('saved_ideas')
          .delete()
          .eq('investor_id', user.id)
          .eq('idea_id', id);

        if (error) throw error;
        setIsSaved(false);
        setToast({ msg: 'أُزيلت الفكرة من المحفوظات', severity: 'success' });
      } else {
        // Add to saved
        const { error } = await supabase
          .from('saved_ideas')
          .insert([
            {
              investor_id: user.id,
              idea_id: id,
            },
          ]);

        if (error) throw error;
        setIsSaved(true);
        setToast({ msg: 'حُفظت الفكرة', severity: 'success' });
      }
    } catch (error) {
      console.error('Error saving idea:', error);
      setToast({ msg: 'تعذّر حفظ الفكرة', severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleRequestConnection = async () => {
    if (!user || !idea) return;

    try {
      setSaving(true);

      // Insert connection request — select id back for deep-link
      const { data: insertedRequest, error: requestError } = await supabase
        .from('connection_requests')
        .insert([
          {
            investor_id: user.id,
            founder_id: idea.user_id,
            idea_id: id,
            message: requestMessage || null,
            status: 'pending',
          },
        ])
        .select('id')
        .single();

      if (requestError) throw requestError;

      const requestId = insertedRequest.id;
      const connectionsUrl = `${window.location.origin}/connections?request=${requestId}`;

      // Email founder (non-critical, fire and forget)
      void (async () => {
        const [{ data: founderProfile }, { data: founderEmail }] = await Promise.all([
          supabase.from('profiles').select('full_name').eq('user_id', idea.user_id).maybeSingle(),
          supabase.rpc('get_user_email', { target_user_id: idea.user_id }),
        ]);
        if (founderEmail) {
          void sendEmail(founderEmail as string, 'investor-interested', {
            founder_name: founderProfile?.full_name ?? 'Founder',
            idea_title: idea.title,
            message: requestMessage.trim() || 'بدون رسالة.',
            connections_url: connectionsUrl,
            unsubscribe_url: `${window.location.origin}/unsubscribe`,
          });
        }
      })();

      // Notify founder via the trusted send-notification function
      // (recipient + content are derived server-side from the request).
      void supabase.functions.invoke('send-notification', {
        body: { type: 'connection_request', request_id: requestId },
      });

      // Reload to get the new request
      const { data: newRequest } = await supabase
        .from('connection_requests')
        .select('id, status, created_at')
        .eq('investor_id', user.id)
        .eq('idea_id', id)
        .maybeSingle();

      if (newRequest) setMyRequest(newRequest);

      setRequestModalOpen(false);
      setRequestMessage('');
      setToast({ msg: 'أُرسل طلب التواصل', severity: 'success' });
    } catch (error) {
      console.error('Error requesting connection:', error);
      setToast({ msg: 'تعذّر إرسال طلب التواصل', severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const calculateScoreBreakdown = (totalScore: number) => {
    const maxes = {
      validation: 30,
      businessModel: 20,
      financialProjections: 15,
      execution: 20,
      engagement: 10,
      consistency: 5,
    };

    const totalMax = Object.values(maxes).reduce((a, b) => a + b, 0);
    const ratio = totalScore / totalMax;

    return {
      validation: Math.round(maxes.validation * ratio),
      businessModel: Math.round(maxes.businessModel * ratio),
      financialProjections: Math.round(maxes.financialProjections * ratio),
      execution: Math.round(maxes.execution * ratio),
      engagement: Math.round(maxes.engagement * ratio),
      consistency: Math.round(maxes.consistency * ratio),
    };
  };

  const roi =
    canvas && canvas.monthly_revenue && canvas.monthly_costs
      ? Math.round(
          ((canvas.monthly_revenue - canvas.monthly_costs) / Math.max(canvas.monthly_costs, 1)) * 100
        )
      : null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getFounderYear = (createdAt: string) => {
    return new Date(createdAt).getFullYear();
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!idea) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h6">الفكرة غير موجودة</Typography>
      </Container>
    );
  }

  const isConnected = !!myConnection;
  const solutionDisplay =
    isConnected || !idea.solution
      ? idea.solution
      : idea.solution.substring(0, 100) + '...';

  const breakdown = calculateScoreBreakdown(idea.iq_score);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: '#F7F3EC' }}>
      <InvestorSidebar open={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} mobileOpen={false} onMobileClose={() => {}} />

      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* AppBar */}
        <AppBar position="static" sx={{ backgroundColor: '#fff', color: '#000', boxShadow: 1 }}>
          <Toolbar>
            <IconButton
              edge="start"
              color="inherit"
              sx={{ display: { sm: 'none' } }}
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              <MenuIcon />
            </IconButton>
            <IconButton color="inherit" onClick={() => navigate('/marketplace')}>
              <ArrowBackIcon />
            </IconButton>
            <Typography
              variant="h6"
              sx={{
                flex: 1,
                fontWeight: 600,
                ml: 1,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {idea.title.substring(0, 40)}
            </Typography>
            <IconButton color="inherit">
              <NotificationsOutlinedIcon />
            </IconButton>
            <Avatar sx={{ ml: 1, width: 36, height: 36, bgcolor: 'primary.main' }}>
              {user?.email?.charAt(0).toUpperCase()}
            </Avatar>
          </Toolbar>
        </AppBar>

        {/* Main Content */}
        <Box sx={{ flex: 1, overflow: 'auto' }}>
          <Container maxWidth="lg" sx={{ py: 4 }}>
            <Grid container spacing={3}>
              {/* Header Card */}
              <Grid size={{ xs: 12 }}>
                <Card sx={{ p: 3, backgroundColor: '#fff' }}>
                  <Box sx={{ display: 'flex', alignItems: 'start', gap: 2 }}>
                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Chip label={(SECTORS.find(x => x.key === idea.sector)?.label) ?? idea.sector} size="small" variant="outlined" />
                        <Box
                          sx={{
                            width: 40,
                            height: 40,
                            borderRadius: '50%',
                            backgroundColor: idea.iq_score >= 80 ? 'success.main' : 'grey.300',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#fff',
                            fontWeight: 'bold',
                          }}
                        >
                          {idea.iq_score}
                        </Box>
                      </Box>
                      <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>
                        {idea.title}
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        عُرضت {formatDate(idea.created_at)}
                      </Typography>
                    </Box>
                    <IconButton
                      color={isSaved ? 'error' : 'default'}
                      onClick={handleSaveIdea}
                      disabled={saving}
                    >
                      {isSaved ? <FavoriteIcon /> : <FavoriteBorderIcon />}
                    </IconButton>
                  </Box>
                </Card>
              </Grid>

              {/* The Problem */}
              <Grid size={{ xs: 12 }}>
                <Card sx={{ p: 3, backgroundColor: '#fff', borderLeft: '4px solid #1B6B3E' }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                    المشكلة
                  </Typography>
                  <Typography variant="body1">{idea.problem}</Typography>
                </Card>
              </Grid>

              {/* The Solution */}
              <Grid size={{ xs: 12 }}>
                <Card sx={{ p: 3, backgroundColor: '#fff' }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                    الحل
                  </Typography>
                  {!isConnected && idea.solution && idea.solution.length > 100 && (
                    <Alert severity="info" sx={{ mb: 2 }}>
                      تواصل مع المؤسس لرؤية تفاصيل الحل كاملة
                    </Alert>
                  )}
                  <Typography variant="body1">{solutionDisplay}</Typography>
                </Card>
              </Grid>

              {/* Validation Evidence */}
              {validationStats && (
                <Grid size={{ xs: 12 }}>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <Card sx={{ p: 2, backgroundColor: '#fff', textAlign: 'center' }}>
                        <Typography variant="h5" sx={{ fontWeight: 700, color: 'primary.main' }}>
                          {validationStats.interviews}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          مقابلات
                        </Typography>
                      </Card>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <Card sx={{ p: 2, backgroundColor: '#fff', textAlign: 'center' }}>
                        <Typography variant="h5" sx={{ fontWeight: 700, color: 'primary.main' }}>
                          {validationStats.signups}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          تسجيلات اهتمام
                        </Typography>
                      </Card>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <Card sx={{ p: 2, backgroundColor: '#fff', textAlign: 'center' }}>
                        <Typography variant="h5" sx={{ fontWeight: 700, color: 'primary.main' }}>
                          ${validationStats.preorders_total}
                        </Typography>
                        <Typography variant="body2" color="textSecondary">
                          طلبات مسبقة
                        </Typography>
                      </Card>
                    </Grid>
                  </Grid>
                </Grid>
              )}

              {/* Business Model Overview */}
              <Grid size={{ xs: 12 }}>
                <Card sx={{ p: 3, backgroundColor: '#fff' }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                    نظرة على نموذج العمل
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Typography variant="body2" color="textSecondary">
                        العميل المستهدف
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {isConnected ? idea.target_customer : 'تواصل ليُكشف'}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6 }}>
                      <Typography variant="body2" color="textSecondary">
                        القطاع
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {(SECTORS.find(x => x.key === idea.sector)?.label) ?? idea.sector}
                      </Typography>
                    </Grid>
                  </Grid>
                  {!isConnected && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2, color: 'textSecondary' }}>
                      <LockIcon fontSize="small" />
                      <Typography variant="caption">تفاصيل أكثر تتاح بعد التواصل</Typography>
                    </Box>
                  )}
                </Card>
              </Grid>

              {/* Financial Highlights */}
              <Grid size={{ xs: 12 }}>
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <Card sx={{ p: 2, backgroundColor: '#fff', textAlign: 'center' }}>
                      <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                        العائد المتوقع
                      </Typography>
                      <Typography variant="h5" sx={{ fontWeight: 700, color: roi && roi > 0 ? 'success.main' : 'grey.500' }}>
                        {roi !== null ? `٪${roi}` : '—'}
                      </Typography>
                    </Card>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <Card sx={{ p: 2, backgroundColor: '#fff', textAlign: 'center' }}>
                      <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                        شهر التعادل
                      </Typography>
                      <Typography variant="h5" sx={{ fontWeight: 700 }}>
                        {canvas?.break_even_month !== null && canvas?.break_even_month !== undefined
                          ? `الشهر ${canvas.break_even_month}`
                          : '—'}
                      </Typography>
                    </Card>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <Card sx={{ p: 2, backgroundColor: '#fff', textAlign: 'center' }}>
                      <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                        الاستثمار المطلوب
                      </Typography>
                      <Typography variant="h5" sx={{ fontWeight: 700 }}>
                        ${pitch?.investment_amount ? pitch.investment_amount.toLocaleString() : '0'}
                      </Typography>
                    </Card>
                  </Grid>
                </Grid>

                {canvas && (canvas.monthly_revenue || canvas.monthly_costs) && (
                  <Card sx={{ p: 3, backgroundColor: '#fff', mt: 2 }}>
                    <Typography variant="subtitle2" color="textSecondary" sx={{ mb: 1 }}>
                      البيانات المالية الشهرية
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid size={{ xs: 6 }}>
                        <Typography variant="body2" color="textSecondary">
                          الإيرادات
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 600 }}>
                          ${canvas.monthly_revenue ? canvas.monthly_revenue.toLocaleString() : '—'}
                        </Typography>
                      </Grid>
                      <Grid size={{ xs: 6 }}>
                        <Typography variant="body2" color="textSecondary">
                          التكاليف
                        </Typography>
                        <Typography variant="body1" sx={{ fontWeight: 600 }}>
                          ${canvas.monthly_costs ? canvas.monthly_costs.toLocaleString() : '—'}
                        </Typography>
                      </Grid>
                    </Grid>
                  </Card>
                )}
              </Grid>

              {/* Bethra Score Breakdown */}
              <Grid size={{ xs: 12 }}>
                <Card sx={{ p: 3, backgroundColor: '#fff' }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                    تفصيل درجة بذرة
                  </Typography>
                  <Box sx={{ overflowX: 'auto' }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow sx={{ backgroundColor: '#F7F3EC' }}>
                          <TableCell sx={{ fontWeight: 600 }}>المكوّن</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600 }}>
                            الدرجة
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600 }}>
                            الحد الأقصى
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        <TableRow>
                          <TableCell>التحقق</TableCell>
                          <TableCell align="right">{breakdown.validation}</TableCell>
                          <TableCell align="right">30</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>نموذج العمل</TableCell>
                          <TableCell align="right">{breakdown.businessModel}</TableCell>
                          <TableCell align="right">20</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>التوقعات المالية</TableCell>
                          <TableCell align="right">{breakdown.financialProjections}</TableCell>
                          <TableCell align="right">15</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>التنفيذ</TableCell>
                          <TableCell align="right">{breakdown.execution}</TableCell>
                          <TableCell align="right">20</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>التفاعل</TableCell>
                          <TableCell align="right">{breakdown.engagement}</TableCell>
                          <TableCell align="right">10</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell>الاستمرارية</TableCell>
                          <TableCell align="right">{breakdown.consistency}</TableCell>
                          <TableCell align="right">5</TableCell>
                        </TableRow>
                        <TableRow sx={{ backgroundColor: '#F7F3EC', fontWeight: 600 }}>
                          <TableCell sx={{ fontWeight: 600 }}>الإجمالي</TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600 }}>
                            {idea.iq_score}
                          </TableCell>
                          <TableCell align="right" sx={{ fontWeight: 600 }}>
                            100
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </Box>
                </Card>
              </Grid>

              {/* About the Founder */}
              <Grid size={{ xs: 12 }}>
                <Card sx={{ p: 3, backgroundColor: '#fff' }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                    عن المؤسس
                  </Typography>

                  {isConnected ? (
                    <Alert severity="info" sx={{ mb: 2 }}>
                      كُشفت معلومات المؤسس
                    </Alert>
                  ) : (
                    <Alert
                      icon={<LockIcon />}
                      severity="warning"
                      sx={{ mb: 2 }}
                    >
                      تُكشف هوية المؤسس بعد قبول طلب التواصل
                    </Alert>
                  )}

                  <Grid container spacing={2}>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <Typography variant="body2" color="textSecondary">
                        نوع المؤسس
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        رائد أعمال
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <Typography variant="body2" color="textSecondary">
                        الموقع
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {isConnected ? 'متاح' : 'غير معلن'}
                      </Typography>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }}>
                      <Typography variant="body2" color="textSecondary">
                        نشط منذ
                      </Typography>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        {getFounderYear(idea.created_at)}
                      </Typography>
                    </Grid>
                  </Grid>
                </Card>
              </Grid>

              {/* Connect CTA */}
              <Grid size={{ xs: 12 }}>
                <Card sx={{ p: 3, backgroundColor: '#fff' }}>
                  <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                    {!myRequest && !isConnected && (
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={() => setRequestModalOpen(true)}
                        disabled={saving}
                      >
                        اطلب التواصل
                      </Button>
                    )}

                    {myRequest && myRequest.status === 'pending' && (
                      <Chip
                        label={`الطلب معلّق — أُرسل ${formatDate(myRequest.created_at)}`}
                        disabled
                        variant="outlined"
                      />
                    )}

                    {isConnected && (
                      <Button
                        variant="contained"
                        color="success"
                        onClick={() => navigate(`/investor/connections/${myConnection.id}`)}
                      >
                        افتح المحادثة ←
                      </Button>
                    )}

                    {myRequest && myRequest.status === 'declined' && (
                      <Stack sx={{ flex: 1 }}>
                        <Chip label="رُفض الطلب" disabled />
                        <Typography variant="caption" color="textSecondary" sx={{ mt: 1 }}>
                          يمكنك الطلب مجدداً لاحقاً
                        </Typography>
                      </Stack>
                    )}
                  </Box>
                </Card>
              </Grid>

              {/* Spacer */}
              <Grid size={{ xs: 12 }} sx={{ height: 40 }} />
            </Grid>
          </Container>
        </Box>
      </Box>

      {/* Request Connection Modal */}
      <Dialog
        open={requestModalOpen}
        onClose={() => setRequestModalOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>طلب تواصل</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Typography variant="body2" sx={{ mb: 2 }}>
            تواصل مع مؤسس <strong>{idea.title}</strong>
          </Typography>

          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
            سيرى المؤسس:
          </Typography>
          <ul style={{ margin: '0 0 2rem 0', paddingLeft: 20 }}>
            <li>ملفك الاستثماري</li>
            <li>طلب التواصل هذا</li>
            <li>رسالتك (إن أرفقتها)</li>
          </ul>

          <TextField
            fullWidth
            label="رسالة (اختياري)"
            multiline
            rows={4}
            value={requestMessage}
            onChange={(e) => setRequestMessage(e.target.value.slice(0, 500))}
            placeholder="مثال: مهتم جداً بمنتجكم وأودّ مناقشة فرص الاستثمار."
            sx={{ mb: 1 }}
          />
          <Typography variant="caption" color="textSecondary">
            {requestMessage.length}/500 حرفاً
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRequestModalOpen(false)}>إلغاء</Button>
          <Button
            variant="contained"
            onClick={handleRequestConnection}
            disabled={saving}
          >
            أرسل الطلب
          </Button>
        </DialogActions>
      </Dialog>
      <Snackbar open={!!toast} autoHideDuration={3000} onClose={() => setToast(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={toast?.severity ?? 'success'} variant="filled" onClose={() => setToast(null)}>{toast?.msg}</Alert>
      </Snackbar>
    </Box>
  );
}
