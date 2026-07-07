// FILE: /tmp/cc-agent/67420917/project/src/pages/founder/FounderConnectionsPage.tsx

import { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Stack,
  Card,
  CardContent,
  Button,
  Tabs,
  Tab,
  Avatar,
  Chip,
  Typography,
  AppBar,
  Toolbar,
  IconButton,
  Badge,
  Alert,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Handshake as HandshakeOutlinedIcon,
  NotificationsOutlined as NotificationsIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../supabase';
import { useNavigate, useSearchParams } from 'react-router-dom';
import FounderSidebar from '../../components/FounderSidebar';
import { useReview } from '../../contexts/ReviewContext';

interface ConnectionRequest {
  id: string;
  founder_id: string;
  investor_id: string;
  idea_id: string;
  status: string;
  message: string;
  created_at: string;
  expires_at: string;
  responded_at?: string;
}

interface Connection {
  id: string;
  founder_id: string;
  investor_id: string;
  idea_id: string;
  request_id: string;
  status: string;
  created_at: string;
  ended_at?: string;
  end_reason?: string;
}

interface InvestorProfile {
  investor_type: string;
  city: string;
  state: string;
  check_size: string;
  sectors_of_interest: string[];
}

interface UserIdea {
  id: string;
  title: string;
  sector: string;
}

interface UserProfile {
  full_name: string;
  avatar_url?: string;
}

export default function FounderConnectionsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { triggerReview } = useReview();
  const [searchParams] = useSearchParams();
  const highlightRequestId = searchParams.get('request');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);

  const [rawRequests, setRawRequests] = useState<ConnectionRequest[]>([]);
  const [requestsData, setRequestsData] = useState<
    Array<{
      request: ConnectionRequest;
      investor?: UserProfile;
      investorProfile?: InvestorProfile;
      idea?: UserIdea;
    }>
  >([]);
  const [connectionsData, setConnectionsData] = useState<
    Array<{
      connection: Connection;
      investor?: UserProfile;
      investorProfile?: InvestorProfile;
      idea?: UserIdea;
    }>
  >([]);

  useEffect(() => {
    loadData();
  }, [user?.id]);

  useEffect(() => {
    if (highlightRequestId) setTabValue(0);
  }, [highlightRequestId]);

  const loadData = async () => {
    if (!user?.id) return;
    setLoading(true);

    try {
      const [requestsRes, connectionsRes] = await Promise.all([
        supabase
          .from('connection_requests')
          .select('*')
          .eq('founder_id', user.id),
        supabase
          .from('connections')
          .select('*')
          .eq('founder_id', user.id)
          .eq('status', 'active'),
      ]);

      if (requestsRes.error) throw requestsRes.error;
      if (connectionsRes.error) throw connectionsRes.error;

      setRawRequests(requestsRes.data || []);

      // Load enriched request data
      const enrichedRequests = await Promise.all(
        (requestsRes.data || [])
          .filter((r) => r.status === 'pending')
          .map(async (request) => {
            const [investorRes, profileRes, ideaRes] = await Promise.all([
              supabase
                .from('profiles')
                .select('full_name, avatar_url')
                .eq('id', request.investor_id)
                .maybeSingle(),
              supabase
                .from('investor_profiles')
                .select('investor_type, city, state, check_size, sectors_of_interest')
                .eq('user_id', request.investor_id)
                .maybeSingle(),
              supabase
                .from('user_ideas')
                .select('id, title, sector')
                .eq('id', request.idea_id)
                .maybeSingle(),
            ]);

            return {
              request,
              investor: investorRes.data ?? undefined,
              investorProfile: profileRes.data ?? undefined,
              idea: ideaRes.data ?? undefined,
            };
          })
      );
      setRequestsData(enrichedRequests);

      // Load enriched connection data
      const enrichedConnections = await Promise.all(
        (connectionsRes.data || []).map(async (connection) => {
          const [investorRes, profileRes, ideaRes] = await Promise.all([
            supabase
              .from('profiles')
              .select('full_name, avatar_url')
              .eq('id', connection.investor_id)
              .maybeSingle(),
            supabase
              .from('investor_profiles')
              .select('investor_type, city, state, check_size, sectors_of_interest')
              .eq('user_id', connection.investor_id)
              .maybeSingle(),
            supabase
              .from('user_ideas')
              .select('id, title, sector')
              .eq('id', connection.idea_id)
              .maybeSingle(),
          ]);

          return {
            connection,
            investor: investorRes.data ?? undefined,
            investorProfile: profileRes.data ?? undefined,
            idea: ideaRes.data ?? undefined,
          };
        })
      );
      setConnectionsData(enrichedConnections);
    } catch (err) {
      console.error('Error loading connections:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (requestId: string, investorId: string, ideaId: string) => {
    try {
      const now = new Date().toISOString();

      // Update request status
      await supabase
        .from('connection_requests')
        .update({ status: 'accepted', responded_at: now })
        .eq('id', requestId);

      // Create connection
      const { data: connectionData } = await supabase
        .from('connections')
        .insert({
          investor_id: investorId,
          founder_id: user?.id,
          idea_id: ideaId,
          request_id: requestId,
          status: 'active',
        })
        .select()
        .single();

      // Insert welcome message
      if (connectionData) {
        await supabase.from('messages').insert({
          connection_id: connectionData.id,
          content: 'أهلاً بكما في محادثة التواصل.',
          is_system_message: true,
        });
      }

      // Notify investor via the trusted send-notification function
      // (recipient + content are derived server-side from the request).
      await supabase.functions.invoke('send-notification', {
        body: { type: 'connection_accepted', request_id: requestId },
      });

      loadData();
      triggerReview('investor_connect', undefined, ideaId);
    } catch (err) {
      console.error('Error accepting request:', err);
    }
  };

  const handleDecline = async (requestId: string) => {
    try {
      const now = new Date().toISOString();

      await supabase
        .from('connection_requests')
        .update({ status: 'declined', responded_at: now })
        .eq('id', requestId);

      // Notify investor via the trusted send-notification function.
      await supabase.functions.invoke('send-notification', {
        body: { type: 'connection_declined', request_id: requestId },
      });

      loadData();
    } catch (err) {
      console.error('Error declining request:', err);
    }
  };

  const handleBlock = async (requestId: string, investorId: string) => {
    try {
      const now = new Date().toISOString();

      await supabase.from('blocked_investors').insert({
        founder_id: user?.id,
        investor_id: investorId,
      });

      await supabase
        .from('connection_requests')
        .update({ status: 'declined', responded_at: now })
        .eq('id', requestId);

      loadData();
    } catch (err) {
      console.error('Error blocking investor:', err);
    }
  };

  const calculateExpiresIn = (expiresAt: string) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const days = Math.floor((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return days;
  };

  const getInitial = (name?: string) => {
    return (name || 'U')[0].toUpperCase();
  };

  const pendingCount = requestsData.length;
  const activeCount = connectionsData.length;
  const endedCount = rawRequests.filter((r) => r.status === 'ended').length;

  if (loading) {
    return <Typography>جارٍ التحميل...</Typography>;
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <FounderSidebar open={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />
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
            <HandshakeOutlinedIcon sx={{ mr: 1 }} />
            <Typography variant="h6" sx={{ mr: 2 }}>
              التواصلات
            </Typography>
            <Badge badgeContent={pendingCount} color="error">
              <Typography variant="body2">الطلبات</Typography>
            </Badge>
            <Box sx={{ flex: 1 }} />
            <IconButton color="inherit">
              <Badge badgeContent={0} color="error">
                <NotificationsIcon />
              </Badge>
            </IconButton>
            <Avatar sx={{ ml: 2, width: 40, height: 40, bgcolor: 'primary.main' }}>
              F
            </Avatar>
          </Toolbar>
        </AppBar>

        <Container maxWidth="lg" sx={{ py: 4, flex: 1 }}>
          <Tabs
            value={tabValue}
            onChange={(_e, newValue) => setTabValue(newValue)}
            sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}
          >
            <Tab label={`الطلبات (${pendingCount})`} />
            <Tab label={`النشطة (${activeCount})`} />
            <Tab label={`المنتهية (${endedCount})`} />
          </Tabs>

          {tabValue === 0 && (
            <Stack spacing={2}>
              {highlightRequestId && requestsData.some(r => r.request.id === highlightRequestId) && (
                <Alert severity="info" sx={{ fontWeight: 600 }}>
                  لديك طلب تواصل جديد من مستثمر بالأسفل — راجعه وردّ عليه.
                </Alert>
              )}
              {requestsData.length === 0 ? (
                <Alert severity="info">لا طلبات تواصل معلّقة.</Alert>
              ) : (
                requestsData.map(({ request, investor, investorProfile, idea }) => (
                  <Card
                    key={request.id}
                    sx={request.id === highlightRequestId ? { border: '2px solid', borderColor: 'success.main', boxShadow: 4 } : undefined}
                  >
                    <CardContent>
                      <Stack spacing={2}>
                        {idea && (
                          <Chip
                            label={idea.title}
                            size="small"
                            variant="outlined"
                          />
                        )}

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar
                            sx={{
                              width: 48,
                              height: 48,
                              bgcolor: 'secondary.main',
                            }}
                          >
                            {getInitial(investor?.full_name)}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {investor?.full_name || 'مستثمر مجهول'}
                            </Typography>
                            {investorProfile && (
                              <Typography variant="body2" color="textSecondary">
                                {investorProfile.investor_type}
                                {investorProfile.city && ` • ${investorProfile.city}`}
                              </Typography>
                            )}
                          </Box>
                        </Box>

                        {investorProfile && (
                          <Box>
                            {investorProfile.check_size && (
                              <Chip
                                label={`حجم الاستثمار: ${investorProfile.check_size}`}
                                size="small"
                                variant="outlined"
                                sx={{ mr: 1, mb: 1 }}
                              />
                            )}
                            {investorProfile.sectors_of_interest?.map((sector) => (
                              <Chip
                                key={sector}
                                label={sector}
                                size="small"
                                sx={{ mr: 1, mb: 1 }}
                              />
                            ))}
                          </Box>
                        )}

                        {request.message && (
                          <Box
                            sx={{
                              bgcolor: 'action.hover',
                              p: 1.5,
                              borderLeft: 3,
                              borderColor: 'primary.main',
                            }}
                          >
                            <Typography variant="body2">{request.message}</Typography>
                          </Box>
                        )}

                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <Typography variant="caption" color="textSecondary">
                            {new Date(request.created_at).toLocaleDateString('ar')} •{' '}
                            ينتهي خلال {calculateExpiresIn(request.expires_at)} أيام
                          </Typography>
                        </Box>

                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Button
                            variant="contained"
                            color="success"
                            size="small"
                            onClick={() =>
                              handleAccept(request.id, request.investor_id, request.idea_id)
                            }
                          >
                            اقبل
                          </Button>
                          <Button
                            variant="outlined"
                            color="error"
                            size="small"
                            onClick={() => handleDecline(request.id)}
                          >
                            ارفض
                          </Button>
                          <Button
                            variant="text"
                            color="error"
                            size="small"
                            onClick={() => handleBlock(request.id, request.investor_id)}
                          >
                            احظر
                          </Button>
                        </Box>
                      </Stack>
                    </CardContent>
                  </Card>
                ))
              )}
            </Stack>
          )}

          {tabValue === 1 && (
            <Stack spacing={2}>
              {connectionsData.length === 0 ? (
                <Alert severity="info">لا تواصلات نشطة بعد.</Alert>
              ) : (
                connectionsData.map(({ connection, investor, investorProfile, idea }) => (
                  <Card key={connection.id}>
                    <CardContent>
                      <Stack spacing={2}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar sx={{ width: 48, height: 48 }}>
                            {getInitial(investor?.full_name)}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {investor?.full_name || 'مستثمر'}
                            </Typography>
                            {investorProfile && (
                              <Typography variant="body2" color="textSecondary">
                                {investorProfile.investor_type}
                                {investorProfile.city && ` • ${investorProfile.city}`}
                              </Typography>
                            )}
                          </Box>
                        </Box>

                        {idea && (
                          <Typography variant="body2">
                            الفكرة: <strong>{idea.title}</strong>
                          </Typography>
                        )}

                        <Typography variant="caption" color="textSecondary">
                          تم التواصل {new Date(connection.created_at).toLocaleDateString('ar')}
                        </Typography>

                        <Button
                          variant="contained"
                          onClick={() => navigate(`/connections/${connection.id}`)}
                        >
                          افتح المحادثة ←
                        </Button>
                      </Stack>
                    </CardContent>
                  </Card>
                ))
              )}
            </Stack>
          )}

          {tabValue === 2 && (
            <Stack spacing={2}>
              {endedCount === 0 ? (
                <Alert severity="info">لا تواصلات منتهية.</Alert>
              ) : (
                <List>
                  {rawRequests
                    .filter((r) => r.status === 'ended')
                    .map((request) => (
                      <ListItem key={request.id}>
                        <ListItemText
                          primary="انتهى التواصل"
                          secondary={new Date(request.created_at).toLocaleDateString('ar')}
                        />
                      </ListItem>
                    ))}
                </List>
              )}
            </Stack>
          )}
        </Container>
      </Box>
    </Box>
  );
}
