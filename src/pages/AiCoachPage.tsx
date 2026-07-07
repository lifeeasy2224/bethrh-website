import { useState, useRef, useEffect } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import TextField from '@mui/material/TextField';
import Avatar from '@mui/material/Avatar';
import IconButton from '@mui/material/IconButton';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import Alert from '@mui/material/Alert';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuIcon from '@mui/icons-material/Menu';
import SendIcon from '@mui/icons-material/Send';
import AddIcon from '@mui/icons-material/Add';
import SmartToyOutlinedIcon from '@mui/icons-material/SmartToyOutlined';
import NotificationsOutlinedIcon from '@mui/icons-material/NotificationsOutlined';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { supabase } from '../supabase';
import { useAuth } from '../contexts/AuthContext';
import { useIdea } from '../contexts/IdeaContext';
import FounderSidebar from '../components/FounderSidebar';

const SIDEBAR_WIDTH = 240;
const FREE_DAILY_LIMIT = 10;

const SUGGESTED_PROMPTS = [
  'كيف أتحقق من فكرة مشروعي بسرعة؟',
  'اكتب لي عرضاً لفكرتي في جملة واحدة',
  'ما أكبر المخاطر في قطاعي؟',
  'كيف أجد أول ١٠ عملاء؟',
  'كيف يبدو الـ MVP الجيد؟',
  'ساعدني أفكر في استراتيجية التسعير',
];


interface Conversation {
  id: string;
  title: string;
  user_idea_id: string | null;
  created_at: string;
  updated_at: string;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

export default function AiCoachPage() {
  const { user, profile } = useAuth();
  const { ideas, selectedIdeaId } = useIdea();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [convDrawerOpen, setConvDrawerOpen] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [thinking, setThinking] = useState(false);
  const [todayCount, setTodayCount] = useState(0);
  const [coachIdeaId, setCoachIdeaId] = useState<string>(selectedIdeaId ?? '');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const plan = profile?.plan ?? 'free';
  const atLimit = plan === 'free' && todayCount >= FREE_DAILY_LIMIT;

  useEffect(() => {
    if (user) {
      loadConversations();
      loadTodayCount();
    }
  }, [user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, thinking]);

  useEffect(() => {
    if (selectedIdeaId && !coachIdeaId) setCoachIdeaId(selectedIdeaId);
  }, [selectedIdeaId]);

  async function loadConversations() {
    if (!user) return;
    const { data } = await supabase
      .from('coach_conversations')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });
    const convs = (data ?? []) as Conversation[];
    setConversations(convs);
    if (convs.length > 0 && !activeConvId) {
      selectConversation(convs[0].id);
    }
  }

  async function loadTodayCount() {
    if (!user) return;
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const { count } = await supabase
      .from('coach_messages')
      .select('id', { count: 'exact' })
      .eq('user_id', user.id)
      .eq('role', 'user')
      .gte('created_at', start.toISOString());
    setTodayCount(count ?? 0);
  }

  async function selectConversation(convId: string) {
    setActiveConvId(convId);
    setConvDrawerOpen(false);
    const { data } = await supabase
      .from('coach_messages')
      .select('*')
      .eq('conversation_id', convId)
      .order('created_at', { ascending: true });
    setMessages((data ?? []) as Message[]);
  }

  async function startNewConversation() {
    if (!user) return;
    const { data } = await supabase
      .from('coach_conversations')
      .insert({
        user_id: user.id,
        user_idea_id: coachIdeaId || null,
        title: 'محادثة جديدة',
        updated_at: new Date().toISOString(),
      })
      .select()
      .maybeSingle();
    if (!data) return;
    const conv = data as Conversation;
    setConversations(prev => [conv, ...prev]);
    setActiveConvId(conv.id);
    setMessages([]);
    setConvDrawerOpen(false);
  }

  async function sendMessage(text: string) {
    if (!text.trim() || thinking || atLimit || !user) return;
    const content = text.trim();
    setInput('');

    let convId = activeConvId;
    if (!convId) {
      const { data } = await supabase
        .from('coach_conversations')
        .insert({
          user_id: user.id,
          user_idea_id: coachIdeaId || null,
          title: content.slice(0, 50),
          updated_at: new Date().toISOString(),
        })
        .select()
        .maybeSingle();
      if (!data) return;
      convId = (data as Conversation).id;
      setActiveConvId(convId);
      setConversations(prev => [data as Conversation, ...prev]);
    }

    const { data: userMsg } = await supabase
      .from('coach_messages')
      .insert({ conversation_id: convId, user_id: user.id, role: 'user', content })
      .select()
      .maybeSingle();
    if (userMsg) setMessages(prev => [...prev, userMsg as Message]);
    setTodayCount(c => c + 1);
    setThinking(true);

    // Update conversation title after first message
    if (messages.length === 0) {
      await supabase
        .from('coach_conversations')
        .update({ title: content.slice(0, 50), updated_at: new Date().toISOString() })
        .eq('id', convId);
      setConversations(prev => prev.map(c => c.id === convId ? { ...c, title: content.slice(0, 50) } : c));
    }

    const idea = ideas.find(i => i.id === coachIdeaId);

    // Build conversation history for the API (all prior messages + the new user message)
    const history = [
      ...messages.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })),
      { role: 'user' as const, content },
    ];

    const { data: { session: authSession } } = await supabase.auth.getSession();

    setThinking(false);
    const streamingId = '__streaming__';
    setMessages(prev => [...prev, { id: streamingId, role: 'assistant', content: '', created_at: new Date().toISOString() }]);

    let fullContent = '';

    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-coach`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authSession?.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messages: history,
            idea: idea ? {
              title: idea.title,
              sector: idea.sector,
              problem: idea.problem,
              solution: idea.solution,
              target_customer: idea.target_customer,
              differentiator: idea.differentiator,
              advantage: idea.advantage,
              business_name: idea.business_name,
              stage: idea.stage,
            } : undefined,
          }),
        },
      );

      if (!res.ok || !res.body) {
        const err = await res.json().catch(() => ({ error: '' }));
        throw new Error(
          err.error || (res.status === 429
            ? 'بلغت حد استخدام الذكاء الاصطناعي. حاول لاحقاً.'
            : 'تعذّر الحصول على رد'),
        );
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';
        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const payload = line.slice(6).trim();
          if (payload === '[DONE]') break;
          try {
            const parsed = JSON.parse(payload);
            if (parsed.text) {
              fullContent += parsed.text;
              setMessages(prev => prev.map(m => m.id === streamingId ? { ...m, content: fullContent } : m));
            }
          } catch {
            // ignore malformed chunks
          }
        }
      }
    } catch (err) {
      // Surface a specific message (e.g. the rate-limit 429) instead of the
      // generic fallback; keep the generic text for opaque network failures.
      const msg = (err as Error).message;
      const friendly = msg && msg !== 'Failed to fetch'
        ? msg
        : 'عذراً، واجهت خطأ. حاول مرة أخرى.';
      fullContent = fullContent || friendly;
      setMessages(prev => prev.map(m => m.id === streamingId ? { ...m, content: fullContent } : m));
    }

    // Persist the completed assistant message and replace the streaming placeholder
    const { data: aiMsg } = await supabase
      .from('coach_messages')
      .insert({ conversation_id: convId, user_id: user.id, role: 'assistant', content: fullContent })
      .select()
      .maybeSingle();
    if (aiMsg) {
      setMessages(prev => prev.map(m => m.id === streamingId ? aiMsg as Message : m));
    }

    await supabase
      .from('coach_conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', convId);
  }

  const conversationPanel = (
    <Box sx={{ width: SIDEBAR_WIDTH, display: 'flex', flexDirection: 'column', height: '100%', bgcolor: '#FAF8F3', borderRight: '1px solid', borderColor: 'divider' }}>
      <Box sx={{ p: 2 }}>
        <Button fullWidth variant="outlined" startIcon={<AddIcon />} onClick={startNewConversation} size="small">
          محادثة جديدة
        </Button>
      </Box>
      <Divider />
      <Box sx={{ flex: 1, overflowY: 'auto' }}>
        <List dense disablePadding>
          {conversations.length === 0 ? (
            <Box sx={{ p: 2 }}>
              <Typography variant="caption" color="text.secondary">لا محادثات بعد. ابدأ الدردشة!</Typography>
            </Box>
          ) : conversations.map(conv => (
            <ListItemButton
              key={conv.id}
              selected={conv.id === activeConvId}
              onClick={() => selectConversation(conv.id)}
              sx={{ borderRadius: 1, mx: 1, my: 0.25 }}
            >
              <ChatBubbleOutlineIcon sx={{ fontSize: 14, mr: 1, color: 'text.disabled', flexShrink: 0 }} />
              <ListItemText
                primary={conv.title}
                primaryTypographyProps={{ variant: 'caption', noWrap: true, fontWeight: conv.id === activeConvId ? 700 : 400 }}
                secondary={new Date(conv.updated_at).toLocaleDateString('ar', { month: 'short', day: 'numeric' })}
                secondaryTypographyProps={{ variant: 'caption', sx: { fontSize: '0.65rem' } }}
              />
            </ListItemButton>
          ))}
        </List>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#FAF8F3' }}>
      <FounderSidebar
        open={sidebarOpen}
        onToggle={() => setSidebarOpen(o => !o)}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', height: '100vh' }}>
        <AppBar position="sticky" elevation={0} sx={{ bgcolor: 'white', borderBottom: '1px solid', borderColor: 'divider' }}>
          <Toolbar sx={{ gap: 1 }}>
            <IconButton sx={{ display: { lg: 'none' } }} onClick={() => setMobileOpen(true)} size="small">
              <MenuIcon />
            </IconButton>
            <IconButton size="small" onClick={() => setConvDrawerOpen(true)} sx={{ display: { md: 'none' } }}>
              <ChatBubbleOutlineIcon fontSize="small" />
            </IconButton>
            <SmartToyOutlinedIcon sx={{ color: 'secondary.main', mr: 0.5 }} />
            <Typography variant="h6" fontWeight={700} sx={{ flex: 1 }}>المدرّب الذكي</Typography>
            <Chip label="تجريبي" size="small" sx={{ bgcolor: '#F0F5F1', color: 'primary.main', fontWeight: 700 }} />
            {ideas.length > 0 && (
              <FormControl size="small" sx={{ minWidth: 160, display: { xs: 'none', sm: 'flex' } }}>
                <InputLabel sx={{ fontSize: '0.75rem' }}>التدريب على</InputLabel>
                <Select
                  value={coachIdeaId}
                  label="التدريب على"
                  onChange={e => setCoachIdeaId(e.target.value)}
                  sx={{ fontSize: '0.8rem', height: 32 }}
                >
                  <MenuItem value=""><em>لا فكرة محددة</em></MenuItem>
                  {ideas.map(i => <MenuItem key={i.id} value={i.id} sx={{ fontSize: '0.8rem' }}>{i.title}</MenuItem>)}
                </Select>
              </FormControl>
            )}
            <IconButton size="small"><NotificationsOutlinedIcon /></IconButton>
            <Avatar sx={{ width: 32, height: 32, bgcolor: 'primary.main', fontSize: '0.8rem', fontWeight: 700 }}>
              {profile?.full_name?.[0] ?? 'F'}
            </Avatar>
          </Toolbar>
        </AppBar>

        <Box sx={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {/* Conversation sidebar — desktop */}
          <Box sx={{ display: { xs: 'none', md: 'flex' }, flexDirection: 'column', width: SIDEBAR_WIDTH, flexShrink: 0 }}>
            {conversationPanel}
          </Box>

          {/* Conversation sidebar — mobile drawer */}
          <Drawer anchor="left" open={convDrawerOpen} onClose={() => setConvDrawerOpen(false)} sx={{ display: { md: 'none' } }}>
            {conversationPanel}
          </Drawer>

          {/* Chat area */}
          <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', height: '100%' }}>
            {/* Message limit banner */}
            {plan === 'free' && (
              <Alert
                severity={atLimit ? 'error' : 'info'}
                icon={<WarningAmberIcon fontSize="small" />}
                sx={{ borderRadius: 0, py: 0.5 }}
                action={atLimit ? <Button size="small" href="/pricing" color="inherit">رقِّ</Button> : undefined}
              >
                {atLimit
                  ? `بلغت الحد اليومي (${FREE_DAILY_LIMIT}/${FREE_DAILY_LIMIT}). رقِّ إلى برو لتدريب أوسع.`
                  : `استخدمت ${todayCount}/${FREE_DAILY_LIMIT} رسائل اليوم. رقِّ خطتك لرسائل أكثر.`}
              </Alert>
            )}

            {/* Disclaimer */}
            <Box sx={{ px: 2, py: 0.75, bgcolor: '#FAF5E9', borderBottom: '1px solid', borderColor: 'warning.light' }}>
              <Typography variant="caption" color="warning.dark" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <WarningAmberIcon sx={{ fontSize: 12 }} />
                المدرّب الذكي يقدم إرشاداً ريادياً عاماً — وليس نصيحة مالية أو قانونية أو استثمارية.
              </Typography>
            </Box>

            {/* Messages */}
            <Box sx={{ flex: 1, overflowY: 'auto', p: { xs: 2, sm: 3 }, display: 'flex', flexDirection: 'column', gap: 2 }}>
              {messages.length === 0 && !thinking && (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 3, py: 4 }}>
                  <Box sx={{ width: 64, height: 64, borderRadius: '50%', bgcolor: '#F0F5F1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <SmartToyOutlinedIcon sx={{ fontSize: 32, color: 'primary.main' }} />
                  </Box>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="h6" fontWeight={700} gutterBottom>كيف أساعدك اليوم؟</Typography>
                    <Typography variant="body2" color="text.secondary">اسأل أي شيء عن رحلتك الريادية.</Typography>
                  </Box>
                  <Stack direction="row" flexWrap="wrap" gap={1} justifyContent="center" sx={{ maxWidth: 520 }}>
                    {SUGGESTED_PROMPTS.map(p => (
                      <Chip
                        key={p}
                        label={p}
                        onClick={() => sendMessage(p)}
                        clickable
                        disabled={atLimit}
                        size="small"
                        sx={{ bgcolor: 'white', border: '1px solid', borderColor: 'divider', '&:hover': { bgcolor: 'grey.50' }, fontSize: '0.75rem' }}
                      />
                    ))}
                  </Stack>
                </Box>
              )}

              {messages.map(msg => (
                <Stack
                  key={msg.id}
                  direction="row"
                  spacing={1.5}
                  justifyContent={msg.role === 'user' ? 'flex-end' : 'flex-start'}
                  alignItems="flex-start"
                >
                  {msg.role === 'assistant' && (
                    <Box sx={{ width: 36, height: 36, borderRadius: '50%', bgcolor: '#F0F5F1', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, mt: 0.5 }}>
                      <SmartToyOutlinedIcon sx={{ fontSize: 18, color: 'primary.main' }} />
                    </Box>
                  )}
                  <Card sx={{ maxWidth: '75%', bgcolor: msg.role === 'user' ? 'primary.main' : 'white', boxShadow: 1 }}>
                    <CardContent sx={{ py: '10px !important', px: '14px !important' }}>
                      <Typography variant="body2" sx={{ color: msg.role === 'user' ? 'white' : 'text.primary', lineHeight: 1.7 }}>
                        {msg.content}
                      </Typography>
                    </CardContent>
                  </Card>
                  {msg.role === 'user' && (
                    <Avatar sx={{ width: 36, height: 36, bgcolor: 'primary.main', fontSize: '0.8rem', fontWeight: 700, flexShrink: 0, mt: 0.5 }}>
                      {profile?.full_name?.[0] ?? 'F'}
                    </Avatar>
                  )}
                </Stack>
              ))}

              {thinking && (
                <Stack direction="row" spacing={1.5} alignItems="flex-start">
                  <Box sx={{ width: 36, height: 36, borderRadius: '50%', bgcolor: '#F0F5F1', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <SmartToyOutlinedIcon sx={{ fontSize: 18, color: 'primary.main' }} />
                  </Box>
                  <Card sx={{ bgcolor: 'white', boxShadow: 1 }}>
                    <CardContent sx={{ py: '10px !important', px: '14px !important' }}>
                      <Stack direction="row" spacing={0.5} alignItems="center">
                        {[0, 1, 2].map(i => (
                          <Box key={i} sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'grey.400', animation: 'pulse 1.2s ease-in-out infinite', animationDelay: `${i * 0.2}s`, '@keyframes pulse': { '0%, 100%': { opacity: 0.4, transform: 'scale(0.9)' }, '50%': { opacity: 1, transform: 'scale(1.1)' } } }} />
                        ))}
                      </Stack>
                    </CardContent>
                  </Card>
                </Stack>
              )}

              <div ref={messagesEndRef} />
            </Box>

            {/* Input */}
            <Box sx={{ p: { xs: 2, sm: 3 }, borderTop: '1px solid', borderColor: 'divider', bgcolor: 'white' }}>
              <Stack direction="row" spacing={1}>
                <TextField
                  fullWidth
                  placeholder={atLimit ? 'بلغت الحد اليومي — رقِّ خطتك للمتابعة' : 'اسأل مدرّبك الذكي أي شيء…'}
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
                  disabled={thinking || atLimit}
                  size="small"
                  multiline
                  maxRows={4}
                />
                <IconButton
                  color="primary"
                  onClick={() => sendMessage(input)}
                  disabled={!input.trim() || thinking || atLimit}
                  sx={{ bgcolor: 'primary.main', color: 'white', borderRadius: 2, '&:hover': { bgcolor: 'primary.dark' }, '&:disabled': { bgcolor: 'grey.200', color: 'grey.400' } }}
                >
                  <SendIcon fontSize="small" />
                </IconButton>
              </Stack>
            </Box>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
