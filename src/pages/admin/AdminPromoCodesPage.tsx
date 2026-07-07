import { useEffect, useState, useCallback } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Chip from '@mui/material/Chip';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import Table from '@mui/material/Table';
import TableHead from '@mui/material/TableHead';
import TableBody from '@mui/material/TableBody';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import LinearProgress from '@mui/material/LinearProgress';
import Switch from '@mui/material/Switch';
import Grid from '@mui/material/Grid';
import InputAdornment from '@mui/material/InputAdornment';
import LocalOfferOutlinedIcon from '@mui/icons-material/LocalOfferOutlined';
import AddIcon from '@mui/icons-material/Add';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import PeopleOutlineIcon from '@mui/icons-material/PeopleOutline';
import { useAdminAuth, ADMIN_API } from '../../contexts/AdminAuthContext';

type PromoCode = {
  id: string;
  code: string;
  discount_pct: 25 | 50 | 75 | 100;
  description: string;
  max_uses: number | null;
  uses_count: number;
  expires_at: string | null;
  is_active: boolean;
  created_by: string;
  created_at: string;
};

const DISCOUNT_OPTIONS = [
  { pct: 100, label: '100% Off', sublabel: 'Completely Free', color: '#D08A28', bg: '#FAF5E9', border: '#D4A653' },
  { pct: 75,  label: '75% Off',  sublabel: '3/4 Discount',   color: '#1B6B3E', bg: '#F0F5F1', border: '#2A8A52' },
  { pct: 50,  label: '50% Off',  sublabel: 'Half Price',     color: '#2A8A52', bg: '#F0F5F1', border: '#2A8A52' },
  { pct: 25,  label: '25% Off',  sublabel: 'Quarter Off',    color: '#1B6B3E', bg: '#F0F5F1', border: '#2A8A52' },
] as const;

function generateCode(pct: number): string {
  const prefix = pct === 100 ? 'FREE' : pct === 75 ? 'SAVE75' : pct === 50 ? 'HALF' : 'DEAL25';
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${prefix}-${rand}`;
}

function formatDate(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function DiscountBadge({ pct }: { pct: number }) {
  const opt = DISCOUNT_OPTIONS.find(o => o.pct === pct);
  if (!opt) return null;
  return (
    <Chip
      label={`${pct}% off`}
      size="small"
      sx={{ bgcolor: opt.bg, color: opt.color, fontWeight: 700, border: `1px solid ${opt.border}33`, fontSize: '0.75rem' }}
    />
  );
}

export default function AdminPromoCodesPage() {
  const { admin, sessionToken } = useAdminAuth();
  const [codes, setCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [snack, setSnack] = useState<{ msg: string; severity: 'success' | 'error' } | null>(null);

  const [selectedPct, setSelectedPct] = useState<25 | 50 | 75 | 100>(50);
  const [codeInput, setCodeInput] = useState('');
  const [description, setDescription] = useState('');
  const [maxUses, setMaxUses] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [saving, setSaving] = useState(false);

  const apiPost = useCallback(async (action: string, payload: Record<string, unknown>) => {
    const res = await fetch(`${ADMIN_API}/${action}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` },
      body: JSON.stringify({ session_token: sessionToken, ...payload }),
    });
    return res.json() as Promise<Record<string, unknown>>;
  }, [sessionToken]);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await apiPost('promo-codes-list', {});
    setCodes((data.codes ?? []) as PromoCode[]);
    setLoading(false);
  }, [apiPost]);

  useEffect(() => { void load(); }, [load]);

  const openDialog = () => {
    setSelectedPct(50);
    setCodeInput(generateCode(50));
    setDescription('');
    setMaxUses('');
    setExpiresAt('');
    setDialogOpen(true);
  };

  const handlePctSelect = (pct: 25 | 50 | 75 | 100) => {
    setSelectedPct(pct);
    setCodeInput(generateCode(pct));
  };

  const handleGenerate = () => { setCodeInput(generateCode(selectedPct)); };

  const handleSave = async () => {
    const trimmed = codeInput.trim().toUpperCase();
    if (!trimmed) { setSnack({ msg: 'Code cannot be empty', severity: 'error' }); return; }
    setSaving(true);
    const data = await apiPost('promo-codes-create', {
      code: trimmed,
      discount_pct: selectedPct,
      description: description.trim(),
      max_uses: maxUses ? parseInt(maxUses, 10) : null,
      expires_at: expiresAt || null,
      created_by: admin?.email ?? admin?.full_name ?? 'admin',
    });
    setSaving(false);
    if (data.error) {
      setSnack({ msg: data.error as string, severity: 'error' });
    } else {
      setSnack({ msg: 'Promo code created', severity: 'success' });
      setDialogOpen(false);
      void load();
    }
  };

  const toggleActive = async (id: string, current: boolean) => {
    await apiPost('promo-codes-update', { id, is_active: !current });
    setCodes(prev => prev.map(c => c.id === id ? { ...c, is_active: !current } : c));
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const data = await apiPost('promo-codes-delete', { id: deleteId });
    if (!data.error) {
      setCodes(prev => prev.filter(c => c.id !== deleteId));
      setSnack({ msg: 'Promo code deleted', severity: 'success' });
    }
    setDeleteId(null);
  };

  const copyCode = (code: string) => {
    void navigator.clipboard.writeText(code);
    setSnack({ msg: `Copied "${code}"`, severity: 'success' });
  };

  const totalActive = codes.filter(c => c.is_active).length;
  const totalUses = codes.reduce((s, c) => s + c.uses_count, 0);

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} spacing={2} sx={{ mb: 3 }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box sx={{ width: 38, height: 38, borderRadius: 2, bgcolor: '#F0F5F1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <LocalOfferOutlinedIcon sx={{ color: '#1B6B3E', fontSize: 20 }} />
          </Box>
          <Box>
            <Typography variant="h5" fontWeight={700}>Promo Codes</Typography>
            <Typography variant="body2" color="text.secondary">Generate discount codes for users</Typography>
          </Box>
        </Stack>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openDialog} sx={{ alignSelf: { xs: 'flex-start', sm: 'auto' } }}>
          Generate Code
        </Button>
      </Stack>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: 'Total Codes', value: codes.length, icon: LocalOfferOutlinedIcon, color: '#1B6B3E', bg: '#F0F5F1' },
          { label: 'Active Codes', value: totalActive, icon: CheckCircleOutlineIcon, color: '#1B6B3E', bg: '#F0F5F1' },
          { label: 'Total Redemptions', value: totalUses, icon: PeopleOutlineIcon, color: '#2A8A52', bg: '#F0F5F1' },
        ].map(stat => (
          <Grid key={stat.label} size={{ xs: 12, sm: 4 }}>
            <Card variant="outlined">
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Stack direction="row" spacing={1.5} alignItems="center">
                  <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: stat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <stat.icon sx={{ color: stat.color, fontSize: 20 }} />
                  </Box>
                  <Box>
                    <Typography variant="h5" fontWeight={800} lineHeight={1}>{stat.value}</Typography>
                    <Typography variant="caption" color="text.secondary">{stat.label}</Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Card variant="outlined">
        {loading && <LinearProgress />}
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ '& th': { fontWeight: 700, fontSize: '0.75rem', color: 'text.secondary', textTransform: 'uppercase', letterSpacing: '0.04em', bgcolor: 'grey.50', py: 1.25 } }}>
                <TableCell>Code</TableCell>
                <TableCell>Discount</TableCell>
                <TableCell>Description</TableCell>
                <TableCell align="center">Uses</TableCell>
                <TableCell>Expires</TableCell>
                <TableCell>Created by</TableCell>
                <TableCell align="center">Active</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {!loading && codes.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                    <LocalOfferOutlinedIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1, display: 'block', mx: 'auto' }} />
                    <Typography color="text.secondary" variant="body2">No promo codes yet. Generate your first one.</Typography>
                  </TableCell>
                </TableRow>
              )}
              {codes.map(row => (
                <TableRow key={row.id} hover sx={{ '& td': { py: 1.25 } }}>
                  <TableCell>
                    <Stack direction="row" spacing={0.75} alignItems="center">
                      <Typography variant="body2" fontWeight={700} sx={{ fontFamily: 'monospace', letterSpacing: '0.05em' }}>{row.code}</Typography>
                      <Tooltip title="Copy">
                        <IconButton size="small" onClick={() => copyCode(row.code)} sx={{ opacity: 0.5, '&:hover': { opacity: 1 } }}>
                          <ContentCopyIcon sx={{ fontSize: 14 }} />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </TableCell>
                  <TableCell><DiscountBadge pct={row.discount_pct} /></TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {row.description || '—'}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Typography variant="body2" fontWeight={600}>{row.uses_count}{row.max_uses ? `/${row.max_uses}` : ''}</Typography>
                  </TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={0.5} alignItems="center">
                      {row.expires_at && <CalendarMonthOutlinedIcon sx={{ fontSize: 14, color: new Date(row.expires_at) < new Date() ? 'error.main' : 'text.disabled' }} />}
                      <Typography variant="body2" color={row.expires_at && new Date(row.expires_at) < new Date() ? 'error.main' : 'text.secondary'}>
                        {formatDate(row.expires_at)}
                      </Typography>
                    </Stack>
                  </TableCell>
                  <TableCell><Typography variant="body2" color="text.secondary">{row.created_by}</Typography></TableCell>
                  <TableCell align="center">
                    <Switch checked={row.is_active} size="small" color="success" onChange={() => void toggleActive(row.id, row.is_active)} />
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Delete">
                      <IconButton size="small" onClick={() => setDeleteId(row.id)} sx={{ color: 'text.disabled', '&:hover': { color: 'error.main' } }}>
                        <DeleteOutlineIcon sx={{ fontSize: 18 }} />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* Generate Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ pb: 1 }}>
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: '#F0F5F1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <LocalOfferOutlinedIcon sx={{ color: '#1B6B3E', fontSize: 18 }} />
            </Box>
            <Box>
              <Typography variant="h6" fontWeight={700}>Generate Promo Code</Typography>
              <Typography variant="caption" color="text.secondary">Choose a discount level and customize</Typography>
            </Box>
          </Stack>
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Stack spacing={3}>
            <Box>
              <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 1.5 }}>Discount Level</Typography>
              <Grid container spacing={1.5}>
                {DISCOUNT_OPTIONS.map(opt => (
                  <Grid key={opt.pct} size={{ xs: 6 }}>
                    <Box
                      onClick={() => handlePctSelect(opt.pct as 25 | 50 | 75 | 100)}
                      sx={{
                        p: 2, borderRadius: 2, cursor: 'pointer', textAlign: 'center',
                        border: `2px solid ${selectedPct === opt.pct ? opt.border : 'transparent'}`,
                        bgcolor: selectedPct === opt.pct ? opt.bg : 'grey.50',
                        transition: 'all 150ms ease',
                        '&:hover': { bgcolor: opt.bg, borderColor: `${opt.border}88` },
                      }}
                    >
                      <Typography variant="h4" fontWeight={800} sx={{ color: opt.color, lineHeight: 1 }}>{opt.pct}%</Typography>
                      <Typography variant="caption" fontWeight={700} sx={{ color: opt.color, display: 'block', mt: 0.25 }}>{opt.label}</Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>{opt.sublabel}</Typography>
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Box>

            <TextField
              label="Promo Code"
              value={codeInput}
              onChange={e => setCodeInput(e.target.value.toUpperCase())}
              fullWidth
              inputProps={{ style: { fontFamily: 'monospace', fontWeight: 700, letterSpacing: '0.06em' } }}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <Tooltip title="Re-generate">
                      <IconButton size="small" onClick={handleGenerate} edge="end">
                        <AutorenewIcon sx={{ fontSize: 18 }} />
                      </IconButton>
                    </Tooltip>
                  </InputAdornment>
                ),
              }}
            />

            <TextField label="Description (optional)" value={description} onChange={e => setDescription(e.target.value)} fullWidth placeholder="e.g. Sent to beta users, Partner deal…" multiline rows={2} />

            <Grid container spacing={2}>
              <Grid size={{ xs: 6 }}>
                <TextField label="Max Uses" value={maxUses} onChange={e => setMaxUses(e.target.value.replace(/\D/g, ''))} fullWidth placeholder="Unlimited" type="number" inputProps={{ min: 1 }} />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <TextField label="Expires" value={expiresAt} onChange={e => setExpiresAt(e.target.value)} fullWidth type="date" slotProps={{ inputLabel: { shrink: true } }} />
              </Grid>
            </Grid>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setDialogOpen(false)} color="inherit">Cancel</Button>
          <Button onClick={handleSave} variant="contained" disabled={saving || !codeInput.trim()} startIcon={<LocalOfferOutlinedIcon />}>
            {saving ? 'Saving…' : 'Create Code'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={!!deleteId} onClose={() => setDeleteId(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Delete Promo Code?</DialogTitle>
        <DialogContent>
          <Typography color="text.secondary">This cannot be undone. The code will stop working immediately.</Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setDeleteId(null)} color="inherit">Cancel</Button>
          <Button onClick={handleDelete} variant="contained" color="error">Delete</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={!!snack} autoHideDuration={3000} onClose={() => setSnack(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert severity={snack?.severity ?? 'success'} onClose={() => setSnack(null)} variant="filled" sx={{ width: '100%' }}>
          {snack?.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
}
