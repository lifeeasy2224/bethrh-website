import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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
import TableSortLabel from '@mui/material/TableSortLabel';
import Checkbox from '@mui/material/Checkbox';
import Switch from '@mui/material/Switch';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Pagination from '@mui/material/Pagination';
import CircularProgress from '@mui/material/CircularProgress';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import LinearProgress from '@mui/material/LinearProgress';
import InputAdornment from '@mui/material/InputAdornment';
import AddIcon from '@mui/icons-material/Add';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import BarChartIcon from '@mui/icons-material/BarChart';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import FileUploadOutlinedIcon from '@mui/icons-material/FileUploadOutlined';
import SearchIcon from '@mui/icons-material/Search';
import { useAdminAuth, ADMIN_API } from '../../contexts/AdminAuthContext';

const SECTORS = [
  'Food & Agriculture', 'B2B SaaS', 'E-commerce', 'Fintech',
  'EdTech', 'HealthTech', 'Logistics', 'Services',
];

const SECTOR_EMOJI: Record<string, string> = {
  'Food & Agriculture': '🌾', 'B2B SaaS': '💼', 'E-commerce': '🛒',
  'Fintech': '💰', 'EdTech': '📚', 'HealthTech': '🏥',
  'Logistics': '🚚', 'Services': '🔧',
};

const DIFF_COLORS: Record<string, { bg: string; color: string }> = {
  easy: { bg: 'rgba(42, 138, 82,0.1)', color: '#2A8A52' },
  medium: { bg: 'rgba(208, 138, 40,0.1)', color: '#D08A28' },
  hard: { bg: 'rgba(192, 57, 43,0.1)', color: '#C0392B' },
};

interface IdeaRow {
  id: string;
  slug: string;
  title: string;
  sector: string;
  emoji: string;
  difficulty: 'easy' | 'medium' | 'hard';
  is_published: boolean;
  is_featured: boolean;
  view_count: number;
  grab_count: number;
  spots_total: number;
  spots_taken: number;
  created_at: string;
  updated_at: string;
  last_edited_by: string | null;
  last_edited_at: string | null;
  tags: string[];
}

type SortKey = 'title' | 'sector' | 'view_count' | 'grab_count' | 'created_at' | 'updated_at';

export default function AdminIdeasLibraryPage() {
  const navigate = useNavigate();
  const { sessionToken } = useAdminAuth();

  const [ideas, setIdeas] = useState<IdeaRow[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const [search, setSearch] = useState('');
  const [sectorFilter, setSectorFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState<SortKey>('created_at');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkAction, setBulkAction] = useState('');
  const [bulkSector, setBulkSector] = useState('');
  const [bulkLoading, setBulkLoading] = useState(false);

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [importOpen, setImportOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<Record<string, string>[]>([]);
  const [importLoading, setImportLoading] = useState(false);
  const [importError, setImportError] = useState('');

  const [snack, setSnack] = useState<{ msg: string; severity: 'success' | 'error' } | null>(null);

  const searchTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const load = useCallback(async (p = page, q = search, sec = sectorFilter, st = statusFilter, sb = sortBy, sd = sortDir) => {
    if (!sessionToken) return;
    setLoading(true);
    try {
      const res = await fetch(`${ADMIN_API}/ideas-list`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` },
        body: JSON.stringify({ session_token: sessionToken, page: p, limit: 25, search: q, sector: sec, status: st, sort_by: sb, sort_dir: sd }),
      });
      const data = await res.json() as { ideas: IdeaRow[]; total: number; total_pages: number };
      setIdeas(data.ideas ?? []);
      setTotal(data.total ?? 0);
      setTotalPages(data.total_pages ?? 1);
      setSelected(new Set());
    } catch {
      setSnack({ msg: 'Failed to load ideas', severity: 'error' });
    } finally {
      setLoading(false);
    }
  }, [sessionToken]);

  useEffect(() => { void load(); }, []);

  function handleSearch(val: string) {
    setSearch(val);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => { setPage(1); void load(1, val, sectorFilter, statusFilter, sortBy, sortDir); }, 300);
  }

  function handleFilter(key: 'sector' | 'status', val: string) {
    if (key === 'sector') { setSectorFilter(val); setPage(1); void load(1, search, val, statusFilter, sortBy, sortDir); }
    else { setStatusFilter(val); setPage(1); void load(1, search, sectorFilter, val, sortBy, sortDir); }
  }

  function handleSort(col: SortKey) {
    const newDir = sortBy === col && sortDir === 'desc' ? 'asc' : 'desc';
    setSortBy(col); setSortDir(newDir); setPage(1);
    void load(1, search, sectorFilter, statusFilter, col, newDir);
  }

  function handlePage(_: unknown, p: number) { setPage(p); void load(p, search, sectorFilter, statusFilter, sortBy, sortDir); }

  async function togglePublished(idea: IdeaRow) {
    const res = await fetch(`${ADMIN_API}/idea-update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` },
      body: JSON.stringify({ session_token: sessionToken, idea_id: idea.id, idea: { is_published: !idea.is_published } }),
    });
    if (res.ok) setIdeas(prev => prev.map(i => i.id === idea.id ? { ...i, is_published: !i.is_published } : i));
    else setSnack({ msg: 'Failed to update', severity: 'error' });
  }

  async function handleDelete() {
    if (!deleteId) return;
    setDeleteLoading(true);
    const res = await fetch(`${ADMIN_API}/idea-delete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` },
      body: JSON.stringify({ session_token: sessionToken, idea_id: deleteId }),
    });
    setDeleteLoading(false);
    setDeleteId(null);
    if (res.ok) { setSnack({ msg: 'Idea deleted', severity: 'success' }); void load(); }
    else setSnack({ msg: 'Delete failed', severity: 'error' });
  }

  async function handleBulk() {
    if (!bulkAction || selected.size === 0) return;
    setBulkLoading(true);
    const res = await fetch(`${ADMIN_API}/idea-bulk-action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` },
      body: JSON.stringify({ session_token: sessionToken, bulk_action: bulkAction, idea_ids: [...selected], sector: bulkSector }),
    });
    const data = await res.json() as { success?: boolean; affected?: number; error?: string };
    setBulkLoading(false);
    if (res.ok) {
      setSnack({ msg: `${data.affected ?? selected.size} ideas updated`, severity: 'success' });
      setBulkAction(''); setBulkSector(''); void load();
    } else {
      setSnack({ msg: data.error ?? 'Bulk action failed', severity: 'error' });
    }
  }

  async function handleExport() {
    const res = await fetch(`${ADMIN_API}/ideas-export-csv`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` },
      body: JSON.stringify({ session_token: sessionToken }),
    });
    if (!res.ok) { setSnack({ msg: 'Export failed', severity: 'error' }); return; }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `ideas-library-${new Date().toISOString().split('T')[0]}.csv`;
    a.click(); URL.revokeObjectURL(url);
  }

  function parseCSV(text: string): Record<string, string>[] {
    const lines = text.trim().split('\n');
    if (lines.length < 2) return [];
    const headers = lines[0].split(',').map(h => h.replace(/^"|"$/g, '').trim());
    return lines.slice(1).map(line => {
      const vals = line.match(/(".*?"|[^,]+)(?=,|$)/g) ?? [];
      const row: Record<string, string> = {};
      headers.forEach((h, i) => { row[h] = (vals[i] ?? '').replace(/^"|"$/g, ''); });
      return row;
    });
  }

  function handleImportFile(file: File | null) {
    setImportFile(file);
    setImportError('');
    setImportPreview([]);
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
      const rows = parseCSV(e.target?.result as string);
      if (rows.length === 0) { setImportError('Could not parse CSV. Ensure it has a header row.'); return; }
      const invalid = rows.filter(r => !r.title && !r.Title);
      if (invalid.length === rows.length) { setImportError('No "title" column found in CSV.'); return; }
      // Normalize header casing
      const normalized = rows.map(r => {
        const n: Record<string, string> = {};
        Object.entries(r).forEach(([k, v]) => { n[k.toLowerCase().replace(/ /g, '_')] = v; });
        return n;
      });
      setImportPreview(normalized.slice(0, 5));
      setImportFile(file);
    };
    reader.readAsText(file);
  }

  async function handleImportSubmit() {
    if (!importFile) return;
    setImportLoading(true);
    const reader = new FileReader();
    reader.onload = async e => {
      const rows = parseCSV(e.target?.result as string).map(r => {
        const n: Record<string, string> = {};
        Object.entries(r).forEach(([k, v]) => { n[k.toLowerCase().replace(/ /g, '_')] = v; });
        return n;
      });
      const res = await fetch(`${ADMIN_API}/ideas-import-csv`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` },
        body: JSON.stringify({ session_token: sessionToken, rows }),
      });
      const data = await res.json() as { inserted?: number; error?: string };
      setImportLoading(false);
      setImportOpen(false); setImportFile(null); setImportPreview([]);
      if (res.ok) { setSnack({ msg: `${data.inserted ?? rows.length} ideas imported`, severity: 'success' }); void load(); }
      else setSnack({ msg: data.error ?? 'Import failed', severity: 'error' });
    };
    reader.readAsText(importFile);
  }

  const allSelected = ideas.length > 0 && ideas.every(i => selected.has(i.id));
  const someSelected = ideas.some(i => selected.has(i.id));

  function toggleSelect(id: string) {
    setSelected(prev => { const s = new Set(prev); s.has(id) ? s.delete(id) : s.add(id); return s; });
  }

  function toggleAll() {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(ideas.map(i => i.id)));
  }

  return (
    <Box sx={{ bgcolor: 'grey.50', minHeight: '100vh' }}>
      {/* Header */}
      <Box sx={{ bgcolor: 'white', borderBottom: '1px solid', borderColor: 'divider', px: 3, py: 2 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
          <Box>
            <Typography variant="h5" fontWeight={800}>Ideas Library</Typography>
            <Typography variant="body2" color="text.secondary">{total} ideas total</Typography>
          </Box>
          <Stack direction="row" spacing={1.5} flexWrap="wrap">
            <Button variant="outlined" startIcon={<FileDownloadOutlinedIcon />} onClick={handleExport} size="small">
              Export CSV
            </Button>
            <Button variant="outlined" startIcon={<FileUploadOutlinedIcon />} onClick={() => setImportOpen(true)} size="small">
              Import CSV
            </Button>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate('/admin/ideas-library/new')}
              sx={{ bgcolor: '#1B6B3E', '&:hover': { bgcolor: '#0F3D24' }, fontWeight: 700 }}
            >
              New Idea
            </Button>
          </Stack>
        </Stack>
      </Box>

      <Box sx={{ px: 3, py: 3 }}>
        {/* Filters */}
        <Stack direction="row" spacing={2} sx={{ mb: 3 }} flexWrap="wrap" alignItems="center">
          <TextField
            placeholder="Search ideas..."
            value={search}
            onChange={e => handleSearch(e.target.value)}
            size="small"
            sx={{ width: 260 }}
            slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> } }}
          />
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Sector</InputLabel>
            <Select label="Sector" value={sectorFilter} onChange={e => handleFilter('sector', e.target.value)}>
              <MenuItem value="all">All Sectors</MenuItem>
              {SECTORS.map(s => <MenuItem key={s} value={s}>{SECTOR_EMOJI[s]} {s}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl size="small" sx={{ minWidth: 160 }}>
            <InputLabel>Status</InputLabel>
            <Select label="Status" value={statusFilter} onChange={e => handleFilter('status', e.target.value)}>
              <MenuItem value="all">All Status</MenuItem>
              <MenuItem value="published">Published</MenuItem>
              <MenuItem value="unpublished">Unpublished</MenuItem>
              <MenuItem value="featured">Featured</MenuItem>
            </Select>
          </FormControl>
        </Stack>

        {/* Bulk Actions Bar */}
        {selected.size > 0 && (
          <Card sx={{ mb: 2, p: 2, bgcolor: 'rgba(27, 107, 62,0.04)', border: '1px solid', borderColor: 'rgba(27, 107, 62,0.2)' }}>
            <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" gap={1}>
              <Typography variant="body2" fontWeight={700} sx={{ color: '#1B6B3E' }}>
                {selected.size} selected
              </Typography>
              <FormControl size="small" sx={{ minWidth: 180 }}>
                <InputLabel>Bulk Action</InputLabel>
                <Select label="Bulk Action" value={bulkAction} onChange={e => setBulkAction(e.target.value)}>
                  <MenuItem value="publish">Publish</MenuItem>
                  <MenuItem value="unpublish">Unpublish</MenuItem>
                  <MenuItem value="feature">Set Featured</MenuItem>
                  <MenuItem value="unfeature">Remove Featured</MenuItem>
                  <MenuItem value="archive">Archive (Unpublish + Unfeature)</MenuItem>
                  <MenuItem value="change_sector">Change Sector…</MenuItem>
                  <MenuItem value="delete" sx={{ color: 'error.main' }}>Delete (Super Admin)</MenuItem>
                </Select>
              </FormControl>
              {bulkAction === 'change_sector' && (
                <FormControl size="small" sx={{ minWidth: 160 }}>
                  <InputLabel>New Sector</InputLabel>
                  <Select label="New Sector" value={bulkSector} onChange={e => setBulkSector(e.target.value)}>
                    {SECTORS.map(s => <MenuItem key={s} value={s}>{SECTOR_EMOJI[s]} {s}</MenuItem>)}
                  </Select>
                </FormControl>
              )}
              <Button
                variant="contained"
                size="small"
                disabled={!bulkAction || bulkLoading || (bulkAction === 'change_sector' && !bulkSector)}
                onClick={handleBulk}
                sx={{ bgcolor: '#1B6B3E', '&:hover': { bgcolor: '#0F3D24' } }}
              >
                {bulkLoading ? <CircularProgress size={14} color="inherit" /> : 'Apply'}
              </Button>
              <Button size="small" onClick={() => setSelected(new Set())} sx={{ color: 'text.secondary' }}>
                Clear
              </Button>
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
                    <Checkbox
                      size="small"
                      indeterminate={someSelected && !allSelected}
                      checked={allSelected}
                      onChange={toggleAll}
                    />
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700, minWidth: 240 }}>
                    <TableSortLabel active={sortBy === 'title'} direction={sortBy === 'title' ? sortDir : 'asc'} onClick={() => handleSort('title')}>
                      Title
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>
                    <TableSortLabel active={sortBy === 'sector'} direction={sortBy === 'sector' ? sortDir : 'asc'} onClick={() => handleSort('sector')}>
                      Sector
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="right">
                    <TableSortLabel active={sortBy === 'view_count'} direction={sortBy === 'view_count' ? sortDir : 'desc'} onClick={() => handleSort('view_count')}>
                      Views
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="right">
                    <TableSortLabel active={sortBy === 'grab_count'} direction={sortBy === 'grab_count' ? sortDir : 'desc'} onClick={() => handleSort('grab_count')}>
                      Grabs
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Published</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>
                    <TableSortLabel active={sortBy === 'created_at'} direction={sortBy === 'created_at' ? sortDir : 'desc'} onClick={() => handleSort('created_at')}>
                      Created
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {!loading && ideas.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                      No ideas found.
                    </TableCell>
                  </TableRow>
                ) : ideas.map(idea => (
                  <TableRow key={idea.id} hover selected={selected.has(idea.id)} sx={{ '&.Mui-selected': { bgcolor: 'rgba(27, 107, 62,0.04)' } }}>
                    <TableCell padding="checkbox">
                      <Checkbox size="small" checked={selected.has(idea.id)} onChange={() => toggleSelect(idea.id)} />
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <Box sx={{ fontSize: '1.2rem', lineHeight: 1 }}>{idea.emoji}</Box>
                        <Box>
                          <Typography variant="body2" fontWeight={600} sx={{ lineHeight: 1.3 }}>{idea.title}</Typography>
                          <Typography variant="caption" color="text.secondary">{idea.slug}</Typography>
                        </Box>
                      </Stack>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{SECTOR_EMOJI[idea.sector] ?? ''} {idea.sector}</Typography>
                      <Chip
                        label={idea.difficulty}
                        size="small"
                        sx={{
                          mt: 0.5, height: 18, fontSize: '0.65rem', fontWeight: 700,
                          textTransform: 'capitalize',
                          bgcolor: DIFF_COLORS[idea.difficulty]?.bg,
                          color: DIFF_COLORS[idea.difficulty]?.color,
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={0.5}>
                        {idea.is_featured && (
                          <Chip label="Featured" size="small" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700, bgcolor: 'rgba(208, 138, 40,0.1)', color: '#D08A28' }} />
                        )}
                        {!idea.is_published && (
                          <Chip label="Draft" size="small" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 600, bgcolor: 'grey.100', color: 'text.secondary' }} />
                        )}
                      </Stack>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight={600}>{idea.view_count.toLocaleString()}</Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight={600}>{idea.grab_count}</Typography>
                      <Typography variant="caption" color="text.secondary">{idea.spots_taken}/{idea.spots_total}</Typography>
                    </TableCell>
                    <TableCell>
                      <Switch checked={idea.is_published} size="small" onChange={() => void togglePublished(idea)} />
                    </TableCell>
                    <TableCell>
                      <Typography variant="caption" color="text.secondary">
                        {new Date(idea.created_at).toLocaleDateString()}
                      </Typography>
                      {idea.last_edited_by && (
                        <Typography variant="caption" display="block" color="text.disabled" sx={{ fontSize: '0.65rem' }}>
                          Edited by {idea.last_edited_by.split('@')[0]}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell align="right">
                      <Stack direction="row" spacing={0.25} justifyContent="flex-end">
                        <Tooltip title="Analytics">
                          <IconButton size="small" onClick={() => navigate(`/admin/ideas-library/${idea.id}/analytics`)}>
                            <BarChartIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Preview (opens in new tab)">
                          <IconButton size="small" onClick={() => window.open(`/ideas-library/${idea.slug}`, '_blank')}>
                            <VisibilityOutlinedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit">
                          <IconButton size="small" onClick={() => navigate(`/admin/ideas-library/${idea.id}/edit`)}>
                            <EditOutlinedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton size="small" color="error" onClick={() => setDeleteId(idea.id)}>
                            <DeleteOutlineIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
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

      {/* Delete Dialog */}
      <Dialog open={!!deleteId} onClose={() => setDeleteId(null)}>
        <DialogTitle>Delete Idea?</DialogTitle>
        <DialogContent>
          <Typography>This will permanently delete the idea and all associated grabs and views. This cannot be undone.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteId(null)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={() => void handleDelete()} disabled={deleteLoading}>
            {deleteLoading ? <CircularProgress size={16} color="inherit" /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Import CSV Dialog */}
      <Dialog open={importOpen} onClose={() => { setImportOpen(false); setImportFile(null); setImportPreview([]); setImportError(''); }} maxWidth="md" fullWidth>
        <DialogTitle>Import Ideas from CSV</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={3}>
            <Alert severity="info" sx={{ fontSize: '0.8125rem' }}>
              CSV must have a header row. Required columns: <strong>title</strong>, <strong>slug</strong>. All other fields are optional.
            </Alert>

            <Button
              variant="outlined"
              component="label"
              startIcon={<FileUploadOutlinedIcon />}
            >
              {importFile ? importFile.name : 'Choose CSV file'}
              <input type="file" accept=".csv,text/csv" hidden onChange={e => handleImportFile(e.target.files?.[0] ?? null)} />
            </Button>

            {importError && <Alert severity="error">{importError}</Alert>}

            {importPreview.length > 0 && (
              <Box>
                <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                  Preview (first {importPreview.length} rows):
                </Typography>
                <Box sx={{ overflowX: 'auto', border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        {['title', 'slug', 'sector', 'difficulty', 'is_published'].map(h => (
                          <TableCell key={h} sx={{ fontWeight: 700, fontSize: '0.75rem' }}>{h}</TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {importPreview.map((row, i) => (
                        <TableRow key={i}>
                          {['title', 'slug', 'sector', 'difficulty', 'is_published'].map(h => (
                            <TableCell key={h} sx={{ fontSize: '0.75rem', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {row[h] ?? '—'}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Box>
              </Box>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setImportOpen(false); setImportFile(null); setImportPreview([]); setImportError(''); }}>Cancel</Button>
          <Button
            variant="contained"
            disabled={!importFile || !!importError || importLoading}
            onClick={() => void handleImportSubmit()}
            sx={{ bgcolor: '#1B6B3E', '&:hover': { bgcolor: '#0F3D24' } }}
          >
            {importLoading ? <CircularProgress size={16} color="inherit" /> : `Import ${importPreview.length ? `(${importPreview.length}+ rows)` : ''}`}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={!!snack} autoHideDuration={4000} onClose={() => setSnack(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={snack?.severity ?? 'success'} onClose={() => setSnack(null)}>{snack?.msg}</Alert>
      </Snackbar>
    </Box>
  );
}
