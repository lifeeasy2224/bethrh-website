import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Chip from '@mui/material/Chip';
import Table from '@mui/material/Table';
import TableHead from '@mui/material/TableHead';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';
import Switch from '@mui/material/Switch';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import AddIcon from '@mui/icons-material/Add';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import ContentCopyOutlinedIcon from '@mui/icons-material/ContentCopyOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import BoltOutlinedIcon from '@mui/icons-material/BoltOutlined';
import PauseCircleOutlineIcon from '@mui/icons-material/PauseCircleOutline';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import AdminLayout from '../../components/AdminLayout';
import { adminDb } from '../../lib/adminDb';
import { useAdminAuth } from '../../contexts/AdminAuthContext';

const TRIGGER_LABELS: Record<string, string> = {
  signup:                     'New user signup',
  inactive_7_days:            'Inactive 7 days',
  inactive_14_days:           'Inactive 14 days',
  inactive_30_days:           'Inactive 30 days',
  milestone_completed:        'Milestone completed',
  limit_hit:                  'Plan limit reached',
  pricing_page_visited:       'Visited pricing page',
  plan_upgraded:              'Plan upgraded',
  plan_cancelled:             'Plan cancelled',
  first_idea_created:         'First idea created',
  stress_test_completed:      'Stress test completed',
  canvas_completed:           'Canvas completed',
  investor_no_action_7_days:  'Investor inactive 7 days',
  review_request:             'Review request (30+ days)',
};

interface Automation {
  id: string;
  name: string;
  trigger_type: string;
  delay_hours: number;
  template_id: string | null;
  segment_id: string | null;
  frequency_cap: number;
  status: 'active' | 'paused';
  times_triggered: number;
  last_triggered_at: string | null;
  created_at: string;
  marketing_templates: { name: string } | null;
}

function formatDelay(hours: number): string {
  if (hours === 0) return 'Immediately';
  if (hours < 24) return `${hours}h delay`;
  return `${Math.round(hours / 24)}d delay`;
}

function formatRelative(iso: string | null): string {
  if (!iso) return '—';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function AdminAutomationsPage() {
  const navigate = useNavigate();
  const { sessionToken } = useAdminAuth();
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!sessionToken) return;
    setLoading(true);
    const { data } = await adminDb(sessionToken, 'marketing_automations')
      .select('*, marketing_templates(name)', { order: { column: 'created_at', ascending: true } });
    setAutomations((data ?? []) as Automation[]);
    setLoading(false);
  }, [sessionToken]);

  useEffect(() => { load(); }, [load]);

  async function toggleStatus(a: Automation) {
    if (!sessionToken) return;
    setToggling(a.id);
    const newStatus = a.status === 'active' ? 'paused' : 'active';
    await adminDb(sessionToken, 'marketing_automations')
      .update({ status: newStatus, updated_at: new Date().toISOString() }, { id: a.id });
    setAutomations(prev => prev.map(x => x.id === a.id ? { ...x, status: newStatus } : x));
    setToggling(null);
  }

  async function duplicate(a: Automation) {
    if (!sessionToken) return;
    const { data } = await adminDb(sessionToken, 'marketing_automations')
      .insert({
        name: `${a.name} (Copy)`,
        trigger_type: a.trigger_type,
        delay_hours: a.delay_hours,
        template_id: a.template_id,
        segment_id: a.segment_id,
        frequency_cap: a.frequency_cap,
        status: 'paused',
      }, { returning: '*, marketing_templates(name)', single: true });
    if (data) setAutomations(prev => [...prev, data as Automation]);
  }

  async function confirmDelete() {
    if (!deleteId || !sessionToken) return;
    await adminDb(sessionToken, 'marketing_automations').delete({ id: deleteId });
    setAutomations(prev => prev.filter(a => a.id !== deleteId));
    setDeleteId(null);
  }

  const filtered = automations.filter(a =>
    filter === 'all' || a.status === filter
  );

  const activeCount = automations.filter(a => a.status === 'active').length;
  const pausedCount = automations.filter(a => a.status === 'paused').length;
  const totalSent = automations.reduce((s, a) => s + a.times_triggered, 0);

  const STAT_CARDS = [
    { label: 'Total', value: automations.length, icon: <BoltOutlinedIcon />, color: '#1B6B3E', bg: '#F0F5F1' },
    { label: 'Active', value: activeCount, icon: <CheckCircleOutlineIcon />, color: '#2A8A52', bg: '#F0F5F1' },
    { label: 'Paused', value: pausedCount, icon: <PauseCircleOutlineIcon />, color: '#D08A28', bg: '#F5EAD3' },
    { label: 'Emails Sent', value: totalSent.toLocaleString(), icon: <BoltOutlinedIcon />, color: '#2A8A52', bg: '#F0F5F1' },
  ];

  return (
    <AdminLayout>
      <Box sx={{ p: 3, bgcolor: '#FAF8F3', minHeight: '100vh' }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
          <Box>
            <Typography variant="h5" fontWeight={800}>Automations</Typography>
            <Typography variant="body2" color="text.secondary">Trigger-based email sequences</Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/admin/marketing/automations/new')}
            sx={{ bgcolor: '#1B6B3E', '&:hover': { bgcolor: '#0F3D24' } }}
          >
            Create Automation
          </Button>
        </Stack>

        {/* Stat cards */}
        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 2, mb: 3 }}>
          {STAT_CARDS.map(s => (
            <Card key={s.label} elevation={0} sx={{ border: '1px solid', borderColor: 'grey.200', borderRadius: 2, p: 2 }}>
              <Stack direction="row" alignItems="center" gap={1.5}>
                <Box sx={{ width: 36, height: 36, borderRadius: 1.5, bgcolor: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color, '& svg': { fontSize: 20 } }}>
                  {s.icon}
                </Box>
                <Box>
                  <Typography variant="h6" fontWeight={800} sx={{ lineHeight: 1.1 }}>{s.value}</Typography>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>{s.label}</Typography>
                </Box>
              </Stack>
            </Card>
          ))}
        </Box>

        {/* Filter + table */}
        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'grey.200', borderRadius: 2 }}>
          <CardContent>
            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
              <FormControl size="small" sx={{ minWidth: 140 }}>
                <InputLabel>Filter</InputLabel>
                <Select value={filter} label="Filter" onChange={e => setFilter(e.target.value)}>
                  <MenuItem value="all">All</MenuItem>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="paused">Paused</MenuItem>
                </Select>
              </FormControl>
              <Typography variant="caption" color="text.secondary">
                {filtered.length} automation{filtered.length !== 1 ? 's' : ''}
              </Typography>
            </Stack>

            <Table size="small">
              <TableHead>
                <TableRow sx={{ '& th': { fontWeight: 600, bgcolor: '#FAF8F3', fontSize: '0.75rem' } }}>
                  <TableCell>Name</TableCell>
                  <TableCell>Trigger</TableCell>
                  <TableCell>Delay</TableCell>
                  <TableCell>Template</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Times Sent</TableCell>
                  <TableCell>Last Sent</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {!loading && filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 5, color: 'text.secondary' }}>
                      No automations found
                    </TableCell>
                  </TableRow>
                )}
                {filtered.map(a => (
                  <TableRow key={a.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight={600}>{a.name}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={TRIGGER_LABELS[a.trigger_type] ?? a.trigger_type}
                        size="small"
                        sx={{ bgcolor: '#F0F5F1', color: '#1B6B3E', fontWeight: 600, fontSize: '0.7rem' }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.8rem' }}>
                        {formatDelay(a.delay_hours)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ color: a.marketing_templates ? 'text.primary' : 'text.disabled', fontSize: '0.8rem' }}>
                        {a.marketing_templates?.name ?? 'No template'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" alignItems="center" gap={0.5}>
                        <Switch
                          size="small"
                          checked={a.status === 'active'}
                          disabled={toggling === a.id}
                          onChange={() => toggleStatus(a)}
                          sx={{
                            '& .MuiSwitch-switchBase.Mui-checked': { color: '#2A8A52' },
                            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: '#2A8A52' },
                          }}
                        />
                        <Typography variant="caption" sx={{ color: a.status === 'active' ? '#2A8A52' : 'text.disabled', fontWeight: 600 }}>
                          {a.status === 'active' ? 'Active' : 'Paused'}
                        </Typography>
                      </Stack>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight={600}>{a.times_triggered.toLocaleString()}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.8rem' }}>
                        {formatRelative(a.last_triggered_at)}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Stack direction="row" justifyContent="center">
                        <Tooltip title="Edit">
                          <IconButton size="small" onClick={() => navigate(`/admin/marketing/automations/${a.id}/edit`)}>
                            <EditOutlinedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Duplicate">
                          <IconButton size="small" onClick={() => duplicate(a)}>
                            <ContentCopyOutlinedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton size="small" onClick={() => setDeleteId(a.id)} sx={{ color: 'error.main' }}>
                            <DeleteOutlineIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Delete dialog */}
        <Dialog open={!!deleteId} onClose={() => setDeleteId(null)} maxWidth="xs" fullWidth>
          <DialogTitle>Delete Automation</DialogTitle>
          <DialogContent>
            <DialogContentText>
              This will permanently delete the automation and all its send logs. This cannot be undone.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteId(null)}>Cancel</Button>
            <Button onClick={confirmDelete} color="error" variant="contained">Delete</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </AdminLayout>
  );
}
