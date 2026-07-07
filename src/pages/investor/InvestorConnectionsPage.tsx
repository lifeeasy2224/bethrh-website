import { useEffect, useState } from 'react';
import type React from 'react';
import { useTheme } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import AppBar from '@mui/material/AppBar';
import Avatar from '@mui/material/Avatar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Container from '@mui/material/Container';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Grid from '@mui/material/Grid';
import IconButton from '@mui/material/IconButton';
import LinearProgress from '@mui/material/LinearProgress';
import Tab from '@mui/material/Tab';
import Tabs from '@mui/material/Tabs';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import HandshakeOutlinedIcon from '@mui/icons-material/HandshakeOutlined';
import MenuIcon from '@mui/icons-material/Menu';
import PersonIcon from '@mui/icons-material/Person';
import LockIcon from '@mui/icons-material/Lock';
import NotificationsIcon from '@mui/icons-material/Notifications';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../supabase';
import InvestorSidebar from '../../components/InvestorSidebar';

interface ConnectionRequest {
  id: string;
  investor_id: string;
  founder_id: string;
  idea_id: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired' | 'cancelled';
  requested_at: string;
  responded_at: string | null;
  declined_at: string | null;
}

interface Connection {
  id: string;
  investor_id: string;
  founder_id: string;
  idea_id: string;
  status: 'active' | 'ended';
  connected_at: string | null;
  created_at: string;
  ended_at: string | null;
  ended_by: string | null;
  end_reason: string | null;
}

interface UserIdea {
  id: string;
  title: string;
  sector: string;
}

interface Message {
  id: string;
  connection_id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

interface ConnectionWithIdea extends Connection {
  idea?: UserIdea;
  iq_score?: number;
  last_message?: Message;
}

interface ConnectionRequestWithIdea extends ConnectionRequest {
  idea?: UserIdea;
}

export default function InvestorConnectionsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeConnections, setActiveConnections] = useState<ConnectionWithIdea[]>([]);
  const [pendingRequests, setPendingRequests] = useState<ConnectionRequestWithIdea[]>([]);
  const [declinedRequests, setDeclinedRequests] = useState<ConnectionRequestWithIdea[]>([]);

  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [cancelingRequestId, setCancelingRequestId] = useState<string | null>(null);

  const loadData = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      setError(null);

      // Fetch all connection_requests where investor_id=user.id
      const { data: requestsData, error: requestsError } = await supabase
        .from('connection_requests')
        .select('*')
        .eq('investor_id', user.id);

      if (requestsError) throw requestsError;

      // Fetch all connections where investor_id=user.id
      const { data: connectionsData, error: connectionsError } = await supabase
        .from('connections')
        .select('*')
        .eq('investor_id', user.id)
        .eq('status', 'active');

      if (connectionsError) throw connectionsError;

      // Collect all unique idea_ids
      const ideaIds = new Set<string>();
      requestsData?.forEach((req) => ideaIds.add(req.idea_id));
      connectionsData?.forEach((conn) => ideaIds.add(conn.idea_id));

      // Fetch all related ideas
      const ideasMap = new Map<string, UserIdea>();
      if (ideaIds.size > 0) {
        const { data: ideasData, error: ideasError } = await supabase
          .from('user_ideas')
          .select('id, title, sector')
          .in('id', Array.from(ideaIds));

        if (ideasError) throw ideasError;
        ideasData?.forEach((idea) => ideasMap.set(idea.id, idea));
      }

      // Fetch last message per active connection
      const messagesMap = new Map<string, Message>();
      if (connectionsData && connectionsData.length > 0) {
        for (const conn of connectionsData) {
          const { data: msgData, error: msgError } = await supabase
            .from('messages')
            .select('*')
            .eq('connection_id', conn.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          if (!msgError && msgData) {
            messagesMap.set(conn.id, msgData);
          }
        }
      }

      // Merge connections with ideas and messages
      const activeConn: ConnectionWithIdea[] =
        connectionsData?.map((conn) => ({
          ...conn,
          idea: ideasMap.get(conn.idea_id),
          iq_score: 7.5, // Placeholder IQ score
          last_message: messagesMap.get(conn.id),
        })) || [];

      // Separate requests by status
      const pending: ConnectionRequestWithIdea[] = [];
      const declined: ConnectionRequestWithIdea[] = [];

      requestsData?.forEach((req) => {
        const reqWithIdea = {
          ...req,
          idea: ideasMap.get(req.idea_id),
        };

        if (req.status === 'pending') {
          pending.push(reqWithIdea);
        } else if (req.status === 'declined' || req.status === 'expired') {
          declined.push(reqWithIdea);
        }
      });

      setActiveConnections(activeConn);
      setPendingRequests(pending);
      setDeclinedRequests(declined);
    } catch (err) {
      console.error('Error loading connections:', err);
      setError('تعذّر تحميل التواصلات. حاول مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user?.id]);

  const handleCancelRequest = async () => {
    if (!cancelingRequestId) return;

    try {
      const { error } = await supabase
        .from('connection_requests')
        .update({ status: 'cancelled' })
        .eq('id', cancelingRequestId);

      if (error) throw error;

      setPendingRequests((prev) =>
        prev.filter((req) => req.id !== cancelingRequestId)
      );
      setCancelDialogOpen(false);
      setCancelingRequestId(null);
    } catch (err) {
      console.error('Error canceling request:', err);
      setError('تعذّر إلغاء الطلب.');
    }
  };

  const calculateDaysUntilReRequest = (declinedAt: string) => {
    const declined = new Date(declinedAt);
    const reRequestDate = new Date(declined.getTime() + 30 * 24 * 60 * 60 * 1000);
    const now = new Date();
    const daysRemaining = Math.ceil(
      (reRequestDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)
    );
    return Math.max(0, daysRemaining);
  };

  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      <InvestorSidebar open={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />

      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <AppBar position="static" sx={{ background: theme.palette.background.paper }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              padding: '12px 24px',
              color: theme.palette.text.primary,
            }}
          >
            <IconButton size="small" sx={{ mr: 2 }}>
              <MenuIcon />
            </IconButton>
            <HandshakeOutlinedIcon sx={{ mr: 1 }} />
            <Typography variant="h6" sx={{ flex: 1 }}>
              تواصلاتي
            </Typography>
            <IconButton size="small" sx={{ mr: 2 }}>
              <NotificationsIcon />
            </IconButton>
            <Avatar sx={{ width: 32, height: 32 }}>
              {user?.email?.charAt(0).toUpperCase()}
            </Avatar>
          </Box>
        </AppBar>

        <Container maxWidth="lg" sx={{ py: 4, flex: 1, overflowY: 'auto' }}>
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {loading && <LinearProgress />}

          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tabs
              value={tabValue}
              onChange={(_: React.SyntheticEvent, value: number) => setTabValue(value)}
              aria-label="connection tabs"
            >
              <Tab
                label={`النشطة (${activeConnections.length})`}
                value={0}
              />
              <Tab
                label={`المعلّقة (${pendingRequests.length})`}
                value={1}
              />
              <Tab
                label={`المرفوضة (${declinedRequests.length})`}
                value={2}
              />
            </Tabs>
          </Box>

          {tabValue === 0 && (
            <Box>
              {activeConnections.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                  <Typography variant="body1" color="textSecondary">
                    لا تواصلات نشطة بعد. استكشف الأفكار في السوق لتبدأ.
                  </Typography>
                </Box>
              ) : (
                <Grid container spacing={2}>
                  {activeConnections.map((conn) => (
                    <Grid size={{ xs: 12, md: 6 }} key={conn.id}>
                      <Card>
                        <CardContent>
                          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>
                            <Avatar sx={{ bgcolor: theme.palette.action.hover }}>
                              <PersonIcon />
                            </Avatar>
                            <Box sx={{ flex: 1 }}>
                              <Typography variant="subtitle1">
                                رائد أعمال متصل
                              </Typography>
                              <Typography variant="h6" sx={{ mt: 0.5 }}>
                                {conn.idea?.title || 'فكرة بلا عنوان'}
                              </Typography>
                              <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
                                {conn.idea?.sector && (
                                  <Chip
                                    label={conn.idea.sector}
                                    size="small"
                                    variant="outlined"
                                  />
                                )}
                                <Chip
                                  label={`الدرجة: ${conn.iq_score}`}
                                  size="small"
                                  variant="filled"
                                />
                              </Box>
                            </Box>
                          </Box>

                          <Typography
                            variant="caption"
                            color="textSecondary"
                            sx={{ display: 'block', mb: 2 }}
                          >
                            تم التواصل {new Date(conn.created_at).toLocaleDateString('ar')}
                          </Typography>

                          <Button
                            variant="contained"
                            size="small"
                            endIcon={<ArrowForwardIcon />}
                            onClick={() => navigate(`/investor/connections/${conn.id}`)}
                            fullWidth
                          >
                            افتح المحادثة
                          </Button>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )}
            </Box>
          )}

          {tabValue === 1 && (
            <Box>
              {pendingRequests.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                  <Typography variant="body1" color="textSecondary">
                    لا طلبات تواصل معلّقة.
                  </Typography>
                </Box>
              ) : (
                <Grid container spacing={2}>
                  {pendingRequests.map((req) => (
                    <Grid size={{ xs: 12, md: 6 }} key={req.id}>
                      <Card>
                        <CardContent>
                          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, mb: 2 }}>
                            <LockIcon sx={{ color: 'action.disabled', mt: 0.5 }} />
                            <Box sx={{ flex: 1 }}>
                              <Typography variant="h6">
                                {req.idea?.title || 'فكرة بلا عنوان'}
                              </Typography>
                              {req.idea?.sector && (
                                <Chip
                                  label={req.idea.sector}
                                  size="small"
                                  variant="outlined"
                                  sx={{ mt: 1 }}
                                />
                              )}
                            </Box>
                          </Box>

                          <Typography
                            variant="caption"
                            color="textSecondary"
                            sx={{ display: 'block', mb: 1 }}
                          >
                            طُلب {new Date(req.requested_at).toLocaleDateString('ar')}
                          </Typography>

                          <Typography
                            variant="caption"
                            color="error"
                            sx={{ display: 'block', mb: 2 }}
                          >
                            ينتهي: {new Date(new Date(req.requested_at).getTime() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString('ar')}
                          </Typography>

                          <Button
                            variant="outlined"
                            color="error"
                            size="small"
                            onClick={() => {
                              setCancelingRequestId(req.id);
                              setCancelDialogOpen(true);
                            }}
                            fullWidth
                          >
                            ألغِ الطلب
                          </Button>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )}
            </Box>
          )}

          {tabValue === 2 && (
            <Box>
              {declinedRequests.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                  <Typography variant="body1" color="textSecondary">
                    لا طلبات مرفوضة.
                  </Typography>
                </Box>
              ) : (
                <Grid container spacing={2}>
                  {declinedRequests.map((req) => {
                    const daysRemaining = req.declined_at
                      ? calculateDaysUntilReRequest(req.declined_at)
                      : 30;
                    const canReRequest = daysRemaining === 0;

                    return (
                      <Grid size={{ xs: 12, md: 6 }} key={req.id}>
                        <Card>
                          <CardContent>
                            <Typography variant="h6" sx={{ mb: 1 }}>
                              {req.idea?.title || 'فكرة بلا عنوان'}
                            </Typography>

                            {req.idea?.sector && (
                              <Chip
                                label={req.idea.sector}
                                size="small"
                                variant="outlined"
                                sx={{ mb: 2 }}
                              />
                            )}

                            <Typography
                              variant="caption"
                              color="textSecondary"
                              sx={{ display: 'block', mb: 1 }}
                            >
                              {req.status === 'declined' ? 'رُفض' : 'انتهت صلاحيته'}{' '}
                              {req.declined_at
                                ? new Date(req.declined_at).toLocaleDateString()
                                : '—'}
                            </Typography>

                            <Typography
                              variant="caption"
                              sx={{
                                display: 'block',
                                mb: 2,
                                color: canReRequest ? 'success.main' : 'warning.main',
                              }}
                            >
                              {canReRequest
                                ? 'يمكنك إعادة الطلب الآن'
                                : `يمكنك إعادة الطلب بعد ${daysRemaining} ${daysRemaining !== 1 ? 'أيام' : 'يوم'}`}
                            </Typography>

                            <Button
                              variant="contained"
                              size="small"
                              disabled={!canReRequest}
                              fullWidth
                            >
                              أعد الطلب
                            </Button>
                          </CardContent>
                        </Card>
                      </Grid>
                    );
                  })}
                </Grid>
              )}
            </Box>
          )}
        </Container>
      </Box>

      <Dialog open={cancelDialogOpen} onClose={() => setCancelDialogOpen(false)}>
        <DialogTitle>إلغاء طلب التواصل؟</DialogTitle>
        <DialogContent>
          <Typography>
            هل أنت متأكد من إلغاء طلب التواصل؟ يمكنك الطلب مجدداً بعد ٣٠ يوماً.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelDialogOpen(false)}>أبقِ الطلب</Button>
          <Button
            onClick={handleCancelRequest}
            variant="contained"
            color="error"
          >
            ألغِ الطلب
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
