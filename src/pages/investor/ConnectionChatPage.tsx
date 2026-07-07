// FILE: /tmp/cc-agent/67420917/project/src/pages/investor/ConnectionChatPage.tsx

import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  LinearProgress,
  Radio,
  RadioGroup,
  TextField,
  Typography,
  useTheme,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SendIcon from '@mui/icons-material/Send';
import NotificationsIcon from '@mui/icons-material/Notifications';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import LogoutIcon from '@mui/icons-material/Logout';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../supabase';
import InvestorSidebar from '../../components/InvestorSidebar';
import { sendEmail } from '../../lib/sendEmail';

interface Connection {
  id: string;
  investor_id: string;
  founder_id: string;
  idea_id: string;
  status: 'active' | 'ended';
  connected_at: string;
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
  sender_id: string | null;
  content: string;
  created_at: string;
  is_system_message?: boolean;
}

export default function ConnectionChatPage() {
  const { id: connectionId } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [connection, setConnection] = useState<Connection | null>(null);
  const [idea, setIdea] = useState<UserIdea | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [inputValue, setInputValue] = useState('');
  const [sending, setSending] = useState(false);

  const [endDialogOpen, setEndDialogOpen] = useState(false);
  const [endReason, setEndReason] = useState<
    'deal_completed' | 'not_fit' | 'no_interest' | 'other'
  >('not_fit');

  if (!connectionId) {
    return <Typography color="error">معرّف تواصل غير صالح</Typography>;
  }

  const loadConnection = async () => {
    if (!connectionId) return;

    try {
      const { data, error: err } = await supabase
        .from('connections')
        .select('*')
        .eq('id', connectionId)
        .maybeSingle();

      if (err) throw err;
      if (!data) {
        setError('التواصل غير موجود');
        return;
      }

      setConnection(data);

      // Load idea
      const { data: ideaData, error: ideaErr } = await supabase
        .from('user_ideas')
        .select('id, title, sector')
        .eq('id', data.idea_id)
        .maybeSingle();

      if (!ideaErr && ideaData) {
        setIdea(ideaData);
      }
    } catch (err) {
      console.error('Error loading connection:', err);
      setError('تعذّر تحميل التواصل.');
    }
  };

  const loadMessages = async () => {
    if (!connectionId) return;

    try {
      const { data, error: err } = await supabase
        .from('messages')
        .select('*')
        .eq('connection_id', connectionId)
        .order('created_at', { ascending: true });

      if (err) throw err;

      setMessages(data || []);

      // Insert system welcome message if empty
      if (!data || data.length === 0) {
        const { error: insertErr } = await supabase.from('messages').insert({
          connection_id: connectionId,
          content: 'بدأ التواصل. يمكنكما الآن تبادل الرسائل.',
          is_system_message: true,
        });

        if (!insertErr) {
          await loadMessages();
        }
      }
    } catch (err) {
      console.error('Error loading messages:', err);
    }
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([loadConnection(), loadMessages()]).finally(() =>
      setLoading(false)
    );
  }, [connectionId]);

  // Poll for new messages every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      loadMessages();
    }, 10000);

    return () => clearInterval(interval);
  }, [connectionId]);

  const handleSendMessage = async () => {
    const trimmedInput = inputValue.trim();
    if (!trimmedInput || !user?.id || !connectionId || connection?.status === 'ended') {
      return;
    }

    try {
      setSending(true);
      const newMessage: Message = {
        id: `temp-${Date.now()}`,
        connection_id: connectionId,
        sender_id: user.id,
        content: trimmedInput,
        created_at: new Date().toISOString(),
      };

      // Optimistically add to messages
      setMessages((prev) => [...prev, newMessage]);
      setInputValue('');

      // Insert to database
      const { error: err } = await supabase.from('messages').insert({
        connection_id: connectionId,
        sender_id: user.id,
        content: trimmedInput,
      });

      if (err) throw err;

      // Email the other party (non-critical)
      void (async () => {
        if (!connection || !user) return;
        const recipientId = connection.investor_id === user.id ? connection.founder_id : connection.investor_id;
        const [{ data: senderProfile }, { data: recipientEmail }, { data: recipientProfile }] = await Promise.all([
          supabase.from('profiles').select('full_name').eq('user_id', user.id).maybeSingle(),
          supabase.rpc('get_user_email', { target_user_id: recipientId }),
          supabase.from('profiles').select('full_name').eq('user_id', recipientId).maybeSingle(),
        ]);
        if (recipientEmail) {
          void sendEmail(recipientEmail as string, 'new-message', {
            recipient_name: recipientProfile?.full_name ?? 'صديقنا',
            sender_name: senderProfile?.full_name ?? 'جهة تواصلك',
            idea_title: idea?.title ?? 'فكرتك',
            message_preview: trimmedInput.slice(0, 200),
            chat_url: `${window.location.origin}/investor/connections/${connectionId}`,
            unsubscribe_url: `${window.location.origin}/settings`,
          });
        }
      })();

      // Reload messages to get the real ID and timestamp
      await loadMessages();
    } catch (err) {
      const sbErr = err as { message?: string; code?: string; details?: string; hint?: string };
      const msg = sbErr?.message ?? JSON.stringify(err);
      console.error('Send message error (full):', JSON.stringify(err, null, 2));
      setError(`تعذّر إرسال الرسالة: ${sbErr?.code ? `[${sbErr.code}] ` : ''}${msg}${sbErr?.hint ? ` — ${sbErr.hint}` : ''}`);
      // Remove optimistic message on error
      setMessages((prev) =>
        prev.filter((msg) => !msg.id.startsWith('temp-'))
      );
    } finally {
      setSending(false);
    }
  };

  const handleEndConnection = async () => {
    if (!connectionId || !user?.id) return;

    try {
      const { error: err } = await supabase
        .from('connections')
        .update({
          status: 'ended',
          ended_at: new Date().toISOString(),
          ended_by: user.id,
          end_reason: endReason,
        })
        .eq('id', connectionId);

      if (err) throw err;

      setConnection((prev) =>
        prev
          ? {
              ...prev,
              status: 'ended',
              ended_at: new Date().toISOString(),
              ended_by: user.id,
              end_reason: endReason,
            }
          : null
      );

      setEndDialogOpen(false);
    } catch (err) {
      console.error('Error ending connection:', err);
      setError('تعذّر إنهاء التواصل.');
    }
  };

  const isConnectionEnded = connection?.status === 'ended';

  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      <InvestorSidebar open={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />

      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* AppBar */}
        <AppBar position="static" sx={{ background: theme.palette.background.paper }}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              padding: '12px 24px',
              color: theme.palette.text.primary,
              gap: 2,
            }}
          >
            <IconButton size="small" onClick={() => navigate('/investor/connections')}>
              <ArrowBackIcon />
            </IconButton>

            <Avatar sx={{ width: 40, height: 40 }}>F</Avatar>

            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle2">رائد الأعمال | {idea?.title || 'فكرة بلا عنوان'}</Typography>
              {idea?.sector && (
                <Chip
                  label={idea.sector}
                  size="small"
                  sx={{ mt: 0.5 }}
                  variant="outlined"
                />
              )}
            </Box>

            {idea && (
              <Button
                variant="text"
                size="small"
                endIcon={<OpenInNewIcon />}
                onClick={() => navigate(`/marketplace/${idea.id}`)}
              >
                اعرض الفكرة
              </Button>
            )}

            <Button
              variant="outlined"
              color="error"
              size="small"
              startIcon={<LogoutIcon />}
              onClick={() => setEndDialogOpen(true)}
              disabled={isConnectionEnded}
            >
              أنهِ التواصل
            </Button>

            <IconButton size="small">
              <NotificationsIcon />
            </IconButton>
          </Box>
        </AppBar>

        {loading && <LinearProgress />}

        {error && (
          <Alert severity="error" sx={{ m: 2 }}>
            {error}
          </Alert>
        )}

        {isConnectionEnded && (
          <Alert severity="info" sx={{ m: 2 }}>
            انتهى هذا التواصل. المحادثة للقراءة فقط.
          </Alert>
        )}

        {/* Messages Area */}
        <Box
          sx={{
            flex: 1,
            overflowY: 'auto',
            p: 3,
            display: 'flex',
            flexDirection: 'column',
            gap: 1.5,
            bgcolor: theme.palette.background.default,
          }}
        >
          {messages.length === 0 && !loading && (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Typography variant="body2" color="textSecondary">
                لا رسائل بعد. ابدأ المحادثة!
              </Typography>
            </Box>
          )}

          {messages.map((msg) => {
            const isUserMessage = msg.sender_id === user?.id;
            const isSystemMessage = msg.is_system_message || !msg.sender_id;

            if (isSystemMessage) {
              return (
                <Box
                  key={msg.id}
                  sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    my: 1,
                  }}
                >
                  <Box
                    sx={{
                      textAlign: 'center',
                      fontStyle: 'italic',
                      color: theme.palette.text.secondary,
                      fontSize: '0.875rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                    }}
                  >
                    <Box
                      sx={{
                        flex: 1,
                        height: 1,
                        borderTop: `1px solid ${theme.palette.divider}`,
                      }}
                    />
                    <Typography variant="caption" color="textSecondary">
                      {msg.content}
                    </Typography>
                    <Box
                      sx={{
                        flex: 1,
                        height: 1,
                        borderTop: `1px solid ${theme.palette.divider}`,
                      }}
                    />
                  </Box>
                </Box>
              );
            }

            return (
              <Box
                key={msg.id}
                sx={{
                  display: 'flex',
                  justifyContent: isUserMessage ? 'flex-end' : 'flex-start',
                  mb: 1,
                }}
              >
                <Box sx={{ maxWidth: '60%' }}>
                  {!isUserMessage && (
                    <Typography
                      variant="caption"
                      sx={{ display: 'block', mb: 0.5, ml: 1 }}
                    >
                      رائد الأعمال
                    </Typography>
                  )}
                  <Card
                    sx={{
                      bgcolor: isUserMessage ? theme.palette.primary.main : 'white',
                      color: isUserMessage ? 'white' : 'inherit',
                      p: 1.5,
                      wordBreak: 'break-word',
                    }}
                  >
                    <Typography variant="body2">{msg.content}</Typography>
                  </Card>
                  <Typography
                    variant="caption"
                    color="textSecondary"
                    sx={{
                      display: 'block',
                      mt: 0.5,
                      textAlign: isUserMessage ? 'right' : 'left',
                      px: 1,
                    }}
                  >
                    {new Date(msg.created_at).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Typography>
                </Box>
              </Box>
            );
          })}

          {false && (
            <Box sx={{ display: 'flex', gap: 0.5, my: 1 }}>
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  bgcolor: 'text.secondary',
                  animation: 'pulse 1.4s infinite',
                }}
              />
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  bgcolor: 'text.secondary',
                  animation: 'pulse 1.4s infinite',
                  animationDelay: '0.2s',
                }}
              />
              <Box
                sx={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  bgcolor: 'text.secondary',
                  animation: 'pulse 1.4s infinite',
                  animationDelay: '0.4s',
                }}
              />
            </Box>
          )}
        </Box>

        {/* Input Area */}
        <Box
          sx={{
            p: 2,
            bgcolor: 'white',
            borderTop: `1px solid ${theme.palette.divider}`,
            display: 'flex',
            gap: 1,
            alignItems: 'flex-end',
          }}
        >
          {isConnectionEnded ? (
            <Alert severity="info" sx={{ flex: 1 }}>
              انتهى هذا التواصل. المحادثة للقراءة فقط.
            </Alert>
          ) : (
            <>
              <TextField
                multiline
                maxRows={4}
                placeholder="اكتب رسالتك..."
                fullWidth
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                disabled={sending || isConnectionEnded}
                size="small"
              />
              <IconButton
                color="primary"
                onClick={handleSendMessage}
                disabled={
                  sending ||
                  !inputValue.trim() ||
                  isConnectionEnded
                }
                sx={{ mb: 0.5 }}
              >
                <SendIcon />
              </IconButton>
            </>
          )}
        </Box>
      </Box>

      {/* End Connection Dialog */}
      <Dialog open={endDialogOpen} onClose={() => setEndDialogOpen(false)}>
        <DialogTitle>إنهاء هذا التواصل؟</DialogTitle>
        <DialogContent>
          <Typography sx={{ mb: 2 }}>
            أخبرنا لماذا تنهي هذا التواصل:
          </Typography>
          <RadioGroup
            value={endReason}
            onChange={(e) =>
              setEndReason(
                e.target.value as
                  | 'deal_completed'
                  | 'not_fit'
                  | 'no_interest'
                  | 'other'
              )
            }
          >
            <FormControlLabel
              value="deal_completed"
              control={<Radio />}
              label="اكتملت الصفقة"
            />
            <FormControlLabel
              value="not_fit"
              control={<Radio />}
              label="غير مناسب"
            />
            <FormControlLabel
              value="no_interest"
              control={<Radio />}
              label="لم أعد مهتماً"
            />
            <FormControlLabel
              value="other"
              control={<Radio />}
              label="غير ذلك"
            />
          </RadioGroup>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEndDialogOpen(false)}>إلغاء</Button>
          <Button
            onClick={handleEndConnection}
            variant="contained"
            color="error"
          >
            أنهِ التواصل
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
