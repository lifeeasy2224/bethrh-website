import { useState, useEffect, useRef, useCallback } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Card from '@mui/material/Card';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Chip from '@mui/material/Chip';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Checkbox from '@mui/material/Checkbox';
import Avatar from '@mui/material/Avatar';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Pagination from '@mui/material/Pagination';
import CircularProgress from '@mui/material/CircularProgress';
import LinearProgress from '@mui/material/LinearProgress';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import InputAdornment from '@mui/material/InputAdornment';
import Divider from '@mui/material/Divider';
import SearchIcon from '@mui/icons-material/Search';
import ReplyIcon from '@mui/icons-material/Reply';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ArchiveOutlinedIcon from '@mui/icons-material/ArchiveOutlined';
import ForumOutlinedIcon from '@mui/icons-material/ForumOutlined';
import SendIcon from '@mui/icons-material/Send';
import { useAdminAuth, ADMIN_API } from '../../contexts/AdminAuthContext';

const TYPE_CONFIG: Record<string, { label: string; color: string; bg: string; emoji: string }> = {
  feedback:        { label: 'Feedback',        color: '#2A8A52', bg: 'rgba(42, 138, 82,0.1)',   emoji: '💬' },
  bug:             { label: 'Bug Report',       color: '#C0392B', bg: 'rgba(192, 57, 43,0.1)',   emoji: '🐛' },
  feature_request: { label: 'Feature Request',  color: '#1B6B3E', bg: 'rgba(27, 107, 62,0.1)', emoji: '✨' },
  comment:         { label: 'Comment',          color: '#8A8070', bg: 'rgba(138, 128, 112,0.1)', emoji: '📝' },
};

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  new:         { label: 'New',         color: '#2A8A52', bg: 'rgba(42, 138, 82,0.1)' },
  in_progress: { label: 'In Progress', color: '#D08A28', bg: 'rgba(208, 138, 40,0.1)' },
  resolved:    { label: 'Resolved',    color: '#2A8A52', bg: 'rgba(42, 138, 82,0.1)' },
  archived:    { label: 'Archived',    color: '#8A8070', bg: 'rgba(138, 128, 112,0.1)' },
};

const PRIORITY_CONFIG: Record<string, { label: string; color: string }> = {
  low:      { label: 'Low',      color: '#8A8070' },
  medium:   { label: 'Medium',   color: '#D08A28' },
  high:     { label: 'High',     color: '#D08A28' },
  critical: { label: 'Critical', color: '#C0392B' },
};

interface FeedbackItem {
  id: string;
  user_id: string | null;
  user_name: string;
  type: string;
  subject: string;
  body: string;
  body_preview: string;
  status: string;
  priority: string;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
}

function initials(name: string) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

export default function AdminCommentsPage() {
  const { sessionToken } = useAdminAuth();

  const [items, setItems] = useState<FeedbackItem[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState('');
  const [bulkLoading, setBulkLoading] = useState(false);

  const [replyItem, setReplyItem] = useState<FeedbackItem | null>(null);
  const [replyBody, setReplyBody] = useState('');
  const [replyStatus, setReplyStatus] = useState('in_progress');
  const [replySending, setReplySending] = useState(false);

  const [snack, setSnack] = useState<{ msg: string; sev: 'success' | 'error' } | null>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const load = useCallback(async (
    p = page, q = search, st = statusFilter, ty = typeFilter, pr = priorityFilter
  ) => {
    if (!sessionToken) return;
    setLoading(true);
    try {
      const res = await fetch(`${ADMIN_API}/feedback-list`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` },
        body: JSON.stringify({ session_token: sessionToken, page: p, limit: 25, search: q, status: st, type: ty, priority: pr }),
      });
      const data = await res.json() as { items: FeedbackItem[]; total: number; total_pages: number };
      setItems(data.items ?? []);
      setTotal(data.total ?? 0);
      setTotalPages(data.total_pages ?? 1);
      setSelected(new Set());
    } catch { setSnack({ msg: 'Failed to load feedback', sev: 'error' }); }
    finally { setLoading(false); }
  }, [sessionToken]);

  useEffect(() => { void load(); }, []);

  function handleSearch(val: string) {
    setSearch(val);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => { setPage(1); void load(1, val, statusFilter, typeFilter, priorityFilter); }, 300);
  }

  function handleFilter(key: string, val: string) {
    const n = { st: statusFilter, ty: typeFilter, pr: priorityFilter };
    if (key === 'status') { n.st = val; setStatusFilter(val); }
    if (key === 'type') { n.ty = val; setTypeFilter(val); }
    if (key === 'priority') { n.pr = val; setPriorityFilter(val); }
    setPage(1);
    void load(1, search, n.st, n.ty, n.pr);
  }

  function handlePage(_: unknown, p: number) { setPage(p); void load(p); }

  function toggleSelect(id: string) {
    setSelected(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });
  }

  const allSelected = items.length > 0 && items.every(i => selected.has(i.id));
  function toggleAll() {
    setSelected(allSelected ? new Set() : new Set(items.map(i => i.id)));
  }

  async function handleBulk() {
    if (!bulkAction || selected.size === 0) return;
    setBulkLoading(true);
    const res = await fetch(`${ADMIN_API}/feedback-bulk`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` },
      body: JSON.stringify({ session_token: sessionToken, bulk_action: bulkAction, feedback_ids: [...selected] }),
    });
    const data = await res.json() as { affected?: number; error?: string };
    setBulkLoading(false);
    if (res.ok) {
      setSnack({ msg: `${data.affected ?? selected.size} items updated`, sev: 'success' });
      setBulkAction('');
      void load();
    } else {
      setSnack({ msg: data.error ?? 'Bulk action failed', sev: 'error' });
    }
  }

  async function handleStatusChange(item: FeedbackItem, newStatus: string) {
    const res = await fetch(`${ADMIN_API}/feedback-update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` },
      body: JSON.stringify({ session_token: sessionToken, feedback_id: item.id, status: newStatus }),
    });
    if (res.ok) {
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, status: newStatus } : i));
      setSnack({ msg: 'Status updated', sev: 'success' });
    }
  }

  async function handleReply() {
    if (!replyItem || !replyBody.trim()) return;
    setReplySending(true);
    const res = await fetch(`${ADMIN_API}/feedback-reply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` },
      body: JSON.stringify({ session_token: sessionToken, feedback_id: replyItem.id, reply_body: replyBody, new_status: replyStatus }),
    });
    setReplySending(false);
    setReplyItem(null);
    setReplyBody('');
    if (res.ok) {
      setSnack({ msg: 'Reply sent via info@bethra.co', sev: 'success' });
      void load();
    } else {
      setSnack({ msg: 'Failed to send reply', sev: 'error' });
    }
  }

  const newCount = items.filter(i => i.status === 'new').length;
  const bugCount = items.filter(i => i.type === 'bug').length;

  return (
    <Box sx={{ bgcolor: 'grey.50', minHeight: '100vh' }}>
      {/* Header */}
      <Box sx={{ bgcolor: 'white', borderBottom: '1px solid', borderColor: 'divider', px: 3, py: 2 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Box sx={{ width: 36, height: 36, borderRadius: '10px', bgcolor: 'rgba(27, 107, 62,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ForumOutlinedIcon sx={{ color: '#1B6B3E', fontSize: 20 }} />
            </Box>
            <Box>
              <Typography variant="h5" fontWeight={800} lineHeight={1}>Comments &amp; Feedback</Typography>
              <Typography variant="caption" color="text.secondary">{total} submissions total</Typography>
            </Box>
          </Stack>
          <Stack direction="row" spacing={1}>
            {newCount > 0 && (
              <Chip label={`${newCount} New`} size="small" sx={{ bgcolor: 'rgba(42, 138, 82,0.1)', color: '#2A8A52', fontWeight: 700 }} />
            )}
            {bugCount > 0 && (
              <Chip label={`${bugCount} Bug Reports`} size="small" sx={{ bgcolor: 'rgba(192, 57, 43,0.1)', color: '#C0392B', fontWeight: 700 }} />
            )}
          </Stack>
        </Stack>
      </Box>

      <Box sx={{ px: 3, py: 3 }}>
        {/* Filters */}
        <Stack direction="row" spacing={2} sx={{ mb: 3 }} flexWrap="wrap" alignItems="center">
          <TextField
            placeholder="Search feedback..."
            value={search}
            onChange={e => handleSearch(e.target.value)}
            size="small" sx={{ width: 240 }}
            slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> } }}
          />
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>Type</InputLabel>
            <Select label="Type" value={typeFilter} onChange={e => handleFilter('type', e.target.value)}>
              <MenuItem value="all">All Types</MenuItem>
              <MenuItem value="feedback">💬 Feedback</MenuItem>
              <MenuItem value="bug">🐛 Bug Report</MenuItem>
              <MenuItem value="feature_request">✨ Feature Request</MenuItem>
              <MenuItem value="comment">📝 Comment</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>Status</InputLabel>
            <Select label="Status" value={statusFilter} onChange={e => handleFilter('status', e.target.value)}>
              <MenuItem value="all">All Status</MenuItem>
              <MenuItem value="new">New</MenuItem>
              <MenuItem value="in_progress">In Progress</MenuItem>
              <MenuItem value="resolved">Resolved</MenuItem>
              <MenuItem value="archived">Archived</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 140 }}>
            <InputLabel>Priority</InputLabel>
            <Select label="Priority" value={priorityFilter} onChange={e => handleFilter('priority', e.target.value)}>
              <MenuItem value="all">All Priority</MenuItem>
              <MenuItem value="critical">Critical</MenuItem>
              <MenuItem value="high">High</MenuItem>
              <MenuItem value="medium">Medium</MenuItem>
              <MenuItem value="low">Low</MenuItem>
            </Select>
          </FormControl>
        </Stack>

        {/* Bulk Bar */}
        {selected.size > 0 && (
          <Card sx={{ mb: 2, p: 2, bgcolor: 'rgba(27, 107, 62,0.04)', border: '1px solid rgba(27, 107, 62,0.2)' }}>
            <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" gap={1}>
              <Typography variant="body2" fontWeight={700} sx={{ color: '#1B6B3E' }}>{selected.size} selected</Typography>
              <FormControl size="small" sx={{ minWidth: 180 }}>
                <InputLabel>Bulk Action</InputLabel>
                <Select label="Bulk Action" value={bulkAction} onChange={e => setBulkAction(e.target.value)}>
                  <MenuItem value="archive">Archive</MenuItem>
                  <MenuItem value="resolve">Mark Resolved</MenuItem>
                  <MenuItem value="mark_in_progress">Mark In Progress</MenuItem>
                </Select>
              </FormControl>
              <Button
                variant="contained" size="small"
                disabled={!bulkAction || bulkLoading}
                onClick={handleBulk}
                sx={{ bgcolor: '#1B6B3E', '&:hover': { bgcolor: '#0F3D24' } }}
              >
                {bulkLoading ? <CircularProgress size={14} color="inherit" /> : 'Apply'}
              </Button>
              <Button size="small" onClick={() => setSelected(new Set())} sx={{ color: 'text.secondary' }}>Clear</Button>
            </Stack>
          </Card>
        )}

        {/* Table */}
        <Card sx={{ overflow: 'hidden' }}>
          {loading && <LinearProgress sx={{ height: 2 }} />}
          <Box sx={{ overflowX: 'auto' }}>
            <Table>
              <TableHead>
                <TableRow sx={{ bgcolor: 'grey.50' }}>
                  <TableCell padding="checkbox">
                    <Checkbox size="small" indeterminate={selected.size > 0 && !allSelected} checked={allSelected} onChange={toggleAll} />
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, minWidth: 160 }}>User</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Type</TableCell>
                  <TableCell sx={{ fontWeight: 700, minWidth: 280 }}>Content</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Priority</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Date</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {!loading && items.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 8 }}>
                      <CheckCircleOutlineIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1, display: 'block', mx: 'auto' }} />
                      <Typography color="text.secondary">No feedback yet</Typography>
                    </TableCell>
                  </TableRow>
                ) : items.map(item => {
                  const typeConf = TYPE_CONFIG[item.type] ?? TYPE_CONFIG.feedback;
                  const priorityConf = PRIORITY_CONFIG[item.priority] ?? PRIORITY_CONFIG.low;
                  return (
                    <TableRow key={item.id} hover selected={selected.has(item.id)} sx={{ '&.Mui-selected': { bgcolor: 'rgba(27, 107, 62,0.04)' } }}>
                      <TableCell padding="checkbox">
                        <Checkbox size="small" checked={selected.has(item.id)} onChange={() => toggleSelect(item.id)} />
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Avatar sx={{ width: 28, height: 28, fontSize: '0.65rem', bgcolor: '#1B6B3E', fontWeight: 700 }}>
                            {initials(item.user_name)}
                          </Avatar>
                          <Typography variant="body2" fontWeight={600}>{item.user_name}</Typography>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={`${typeConf.emoji} ${typeConf.label}`}
                          size="small"
                          sx={{ bgcolor: typeConf.bg, color: typeConf.color, fontWeight: 700, height: 22, fontSize: '0.7rem' }}
                        />
                      </TableCell>
                      <TableCell sx={{ maxWidth: 300 }}>
                        {item.subject && (
                          <Typography variant="body2" fontWeight={600} noWrap>{item.subject}</Typography>
                        )}
                        <Typography variant="caption" color="text.secondary" noWrap sx={{ display: 'block', maxWidth: 280 }}>
                          {item.body_preview}{item.body_preview.length >= 100 ? '…' : ''}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={item.status}
                          size="small"
                          onChange={e => void handleStatusChange(item, e.target.value)}
                          sx={{ height: 28, fontSize: '0.75rem', '& .MuiSelect-select': { py: 0.5, px: 1 } }}
                          renderValue={v => (
                            <Chip
                              label={STATUS_CONFIG[v as string]?.label ?? v}
                              size="small"
                              sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700, bgcolor: STATUS_CONFIG[v as string]?.bg, color: STATUS_CONFIG[v as string]?.color, pointerEvents: 'none' }}
                            />
                          )}
                        >
                          {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                            <MenuItem key={k} value={k} sx={{ fontSize: '0.8125rem' }}>
                              <Chip label={v.label} size="small" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700, bgcolor: v.bg, color: v.color, mr: 1 }} />
                            </MenuItem>
                          ))}
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" fontWeight={700} sx={{ color: priorityConf.color }}>
                          {priorityConf.label}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" color="text.secondary">
                          {new Date(item.created_at).toLocaleDateString()}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Stack direction="row" spacing={0.25} justifyContent="flex-end">
                          <Tooltip title="Reply">
                            <IconButton size="small" onClick={() => { setReplyItem(item); setReplyBody(''); setReplyStatus('in_progress'); }}>
                              <ReplyIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Resolve">
                            <IconButton size="small" color="success" onClick={() => void handleStatusChange(item, 'resolved')}>
                              <CheckCircleOutlineIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Archive">
                            <IconButton size="small" onClick={() => void handleStatusChange(item, 'archived')}>
                              <ArchiveOutlinedIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </Box>
          {totalPages > 1 && (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 2, borderTop: '1px solid', borderColor: 'divider' }}>
              <Pagination count={totalPages} page={page} onChange={handlePage} color="primary" size="small" />
            </Box>
          )}
        </Card>
      </Box>

      {/* Reply Dialog */}
      <Dialog open={!!replyItem} onClose={() => setReplyItem(null)} maxWidth="sm" fullWidth>
        {replyItem && (
          <>
            <DialogTitle>
              <Typography variant="h6" fontWeight={700}>Reply to Feedback</Typography>
              <Typography variant="caption" color="text.secondary">
                Reply will be sent from info@bethra.co to {replyItem.user_name}
              </Typography>
            </DialogTitle>
            <DialogContent dividers>
              <Box sx={{ bgcolor: 'grey.50', borderRadius: 1.5, p: 2, mb: 2 }}>
                <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Original Message
                </Typography>
                {replyItem.subject && (
                  <Typography variant="body2" fontWeight={600} sx={{ mt: 0.5 }}>{replyItem.subject}</Typography>
                )}
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                  {replyItem.body}
                </Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />
              <TextField
                label="Your reply *"
                multiline rows={5} fullWidth
                value={replyBody}
                onChange={e => setReplyBody(e.target.value)}
                placeholder="Write your response here..."
                sx={{ mb: 2 }}
              />
              <FormControl fullWidth size="small">
                <InputLabel>Update Status</InputLabel>
                <Select label="Update Status" value={replyStatus} onChange={e => setReplyStatus(e.target.value)}>
                  {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                    <MenuItem key={k} value={k}>{v.label}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 2 }}>
              <Button onClick={() => setReplyItem(null)}>Cancel</Button>
              <Button
                variant="contained"
                endIcon={replySending ? <CircularProgress size={14} color="inherit" /> : <SendIcon fontSize="small" />}
                disabled={replySending || !replyBody.trim()}
                onClick={() => void handleReply()}
                sx={{ bgcolor: '#1B6B3E', '&:hover': { bgcolor: '#0F3D24' }, fontWeight: 700 }}
              >
                {replySending ? 'Sending…' : 'Send Reply'}
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      <Snackbar open={!!snack} autoHideDuration={4000} onClose={() => setSnack(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={snack?.sev ?? 'success'} onClose={() => setSnack(null)}>{snack?.msg}</Alert>
      </Snackbar>
    </Box>
  );
}
