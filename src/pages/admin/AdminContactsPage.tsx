import { useState, useEffect, useCallback } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Chip from '@mui/material/Chip';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import LinearProgress from '@mui/material/LinearProgress';
import Alert from '@mui/material/Alert';
import Table from '@mui/material/Table';
import TableHead from '@mui/material/TableHead';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';
import Tooltip from '@mui/material/Tooltip';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import PersonAddAltOutlinedIcon from '@mui/icons-material/PersonAddAltOutlined';
import AdminLayout from '../../components/AdminLayout';
import { adminDb } from '../../lib/adminDb';
import { useAdminAuth } from '../../contexts/AdminAuthContext';

interface Contact {
  id: string;
  email: string;
  full_name: string | null;
  company: string | null;
  created_at: string | null;
}
interface Membership { id: string; contact_id: string; segment_id: string; }
interface Segment { id: string; name: string; }

export default function AdminContactsPage() {
  const { sessionToken } = useAdminAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);

  const [dialog, setDialog] = useState<'add' | 'addSegment' | 'delete' | null>(null);
  const [selected, setSelected] = useState<Contact | null>(null);
  const [saving, setSaving] = useState(false);

  // add-contact form
  const [email, setEmail] = useState('');
  const [fullName, setFullName] = useState('');
  const [company, setCompany] = useState('');
  const [originSegment, setOriginSegment] = useState('');
  // add-to-segment form
  const [addSegmentId, setAddSegmentId] = useState('');

  const segName = useCallback((id: string) => segments.find(s => s.id === id)?.name ?? '(segment)', [segments]);

  const load = useCallback(async () => {
    if (!sessionToken) return;
    setLoading(true);
    const [c, m, s] = await Promise.all([
      adminDb(sessionToken, 'crm_contacts').select('id, email, full_name, company, created_at', { order: { column: 'created_at', ascending: false } }),
      adminDb(sessionToken, 'contact_segments').select('id, contact_id, segment_id'),
      adminDb(sessionToken, 'marketing_segments').select('id, name', { order: { column: 'name' } }),
    ]);
    setContacts((c.data ?? []) as Contact[]);
    setMemberships((m.data ?? []) as Membership[]);
    setSegments((s.data ?? []) as Segment[]);
    setLoading(false);
  }, [sessionToken]);

  useEffect(() => { void load(); }, [load]);

  const membershipsFor = (contactId: string) => memberships.filter(m => m.contact_id === contactId);

  const filtered = contacts.filter(c => {
    if (!search) return true;
    const q = search.toLowerCase();
    return c.email.toLowerCase().includes(q) || (c.full_name ?? '').toLowerCase().includes(q) || (c.company ?? '').toLowerCase().includes(q);
  });

  async function handleAddContact() {
    if (!email.trim() || !sessionToken) return;
    setSaving(true); setError(null);
    const { error: err } = await adminDb(sessionToken, 'crm_contacts').insert({
      email: email.trim().toLowerCase(),
      full_name: fullName.trim() || null,
      company: company.trim() || null,
      segment_id: originSegment || null, // trigger mirrors this into contact_segments
    });
    setSaving(false);
    if (err) { setError(err); return; }
    setDialog(null); setEmail(''); setFullName(''); setCompany(''); setOriginSegment('');
    void load();
  }

  async function handleAddSegment() {
    if (!selected || !addSegmentId || !sessionToken) return;
    setSaving(true); setError(null);
    const { error: err } = await adminDb(sessionToken, 'contact_segments').insert({
      contact_id: selected.id,
      segment_id: addSegmentId,
    });
    setSaving(false);
    if (err) { setError(err); return; }
    setDialog(null); setAddSegmentId('');
    void load();
  }

  async function handleRemoveSegment(membershipId: string) {
    if (!sessionToken) return;
    await adminDb(sessionToken, 'contact_segments').delete({ id: membershipId });
    void load();
  }

  async function handleDeleteContact() {
    if (!selected || !sessionToken) return;
    setSaving(true);
    await adminDb(sessionToken, 'crm_contacts').delete({ id: selected.id }); // FK cascade clears memberships
    setSaving(false);
    setDialog(null);
    void load();
  }

  // Segments this contact is NOT already in (for the add-to-segment picker)
  const availableSegments = selected
    ? segments.filter(s => !membershipsFor(selected.id).some(m => m.segment_id === s.id))
    : [];

  return (
    <AdminLayout>
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Box>
            <Typography variant="h5" fontWeight={800}>Contact Pool</Typography>
            <Typography variant="body2" color="text.secondary">
              Uploaded contacts and their segment memberships. A contact can belong to multiple segments.
            </Typography>
          </Box>
          <Button variant="contained" startIcon={<PersonAddAltOutlinedIcon />} onClick={() => { setError(null); setDialog('add'); }}>
            Add Contact
          </Button>
        </Stack>

        <Card sx={{ p: 2 }}>
          <TextField
            size="small" fullWidth placeholder="Search email, name, or company"
            value={search} onChange={e => setSearch(e.target.value)} sx={{ mb: 2 }}
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 18, color: 'text.disabled' }} /></InputAdornment> }}
          />

          {loading ? <LinearProgress /> : filtered.length === 0 ? (
            <Typography variant="body2" color="text.secondary" sx={{ py: 4, textAlign: 'center' }}>
              No contacts yet. Add one, or upload a CSV from “Upload Contacts”.
            </Typography>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Email</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Company</TableCell>
                  <TableCell>Segments</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.map(contact => (
                  <TableRow key={contact.id} sx={{ '&:last-child td': { border: 0 } }}>
                    <TableCell><Typography variant="body2" fontWeight={600}>{contact.email}</Typography></TableCell>
                    <TableCell><Typography variant="body2" color="text.secondary">{contact.full_name ?? '—'}</Typography></TableCell>
                    <TableCell><Typography variant="body2" color="text.secondary">{contact.company ?? '—'}</Typography></TableCell>
                    <TableCell sx={{ maxWidth: 320 }}>
                      <Stack direction="row" spacing={0.5} sx={{ flexWrap: 'wrap', gap: 0.5, alignItems: 'center' }}>
                        {membershipsFor(contact.id).map(m => (
                          <Chip
                            key={m.id} label={segName(m.segment_id)} size="small"
                            onDelete={() => void handleRemoveSegment(m.id)}
                            sx={{ height: 22, fontSize: '0.7rem', bgcolor: '#F0F5F1', color: '#1B6B3E' }}
                          />
                        ))}
                        {membershipsFor(contact.id).length === 0 && (
                          <Typography variant="caption" color="text.disabled">no segments</Typography>
                        )}
                        <Tooltip title="Add to segment">
                          <IconButton size="small" onClick={() => { setSelected(contact); setAddSegmentId(''); setError(null); setDialog('addSegment'); }}>
                            <AddIcon sx={{ fontSize: 16 }} />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Delete contact">
                        <IconButton size="small" color="error" onClick={() => { setSelected(contact); setDialog('delete'); }}>
                          <DeleteOutlineIcon sx={{ fontSize: 16 }} />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>
      </Box>

      {/* Add contact */}
      <Dialog open={dialog === 'add'} onClose={() => setDialog(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Add Contact</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {error && <Alert severity="error">{error}</Alert>}
            <TextField label="Email" size="small" fullWidth required value={email} onChange={e => setEmail(e.target.value)} />
            <TextField label="Full name" size="small" fullWidth value={fullName} onChange={e => setFullName(e.target.value)} />
            <TextField label="Company" size="small" fullWidth value={company} onChange={e => setCompany(e.target.value)} />
            <FormControl size="small" fullWidth>
              <InputLabel>Origin segment (optional)</InputLabel>
              <Select label="Origin segment (optional)" value={originSegment} onChange={e => setOriginSegment(e.target.value)}>
                <MenuItem value=""><em>None</em></MenuItem>
                {segments.map(s => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialog(null)}>Cancel</Button>
          <Button variant="contained" onClick={handleAddContact} disabled={!email.trim() || saving}>Add</Button>
        </DialogActions>
      </Dialog>

      {/* Add to segment */}
      <Dialog open={dialog === 'addSegment'} onClose={() => setDialog(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Add {selected?.full_name ?? selected?.email} to a segment</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            {error && <Alert severity="error">{error}</Alert>}
            {availableSegments.length === 0 ? (
              <Typography variant="body2" color="text.secondary">Already in every segment.</Typography>
            ) : (
              <FormControl size="small" fullWidth>
                <InputLabel>Segment</InputLabel>
                <Select label="Segment" value={addSegmentId} onChange={e => setAddSegmentId(e.target.value)}>
                  {availableSegments.map(s => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
                </Select>
              </FormControl>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialog(null)}>Cancel</Button>
          <Button variant="contained" onClick={handleAddSegment} disabled={!addSegmentId || saving}>Add</Button>
        </DialogActions>
      </Dialog>

      {/* Delete contact */}
      <Dialog open={dialog === 'delete'} onClose={() => setDialog(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Delete contact?</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Remove <strong>{selected?.email}</strong> and all its segment memberships? This cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialog(null)}>Cancel</Button>
          <Button variant="contained" color="error" onClick={handleDeleteContact} disabled={saving}>Delete</Button>
        </DialogActions>
      </Dialog>
    </AdminLayout>
  );
}
