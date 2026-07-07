import { useState, useCallback, useRef } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import TextField from '@mui/material/TextField';
import Table from '@mui/material/Table';
import TableHead from '@mui/material/TableHead';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';
import Divider from '@mui/material/Divider';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import CircularProgress from '@mui/material/CircularProgress';
import Snackbar from '@mui/material/Snackbar';
import UploadFileOutlinedIcon from '@mui/icons-material/UploadFileOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import AdminLayout from '../../components/AdminLayout';
import { adminDb } from '../../lib/adminDb';
import { useAdminAuth } from '../../contexts/AdminAuthContext';

const STEPS = ['Upload File', 'Map Columns', 'Validate', 'Import'];
const BATCH_SIZE = 500;

const SYSTEM_FIELDS = [
  { key: 'email', label: 'Email *', required: true },
  { key: 'first_name', label: 'First Name', required: false },
  { key: 'last_name', label: 'Last Name', required: false },
  { key: 'full_name', label: 'Full Name', required: false },
  { key: 'phone', label: 'Phone', required: false },
  { key: 'company', label: 'Company', required: false },
  { key: 'role', label: 'Role', required: false },
];

interface RowData { [key: string]: string; }
interface ValidationResult {
  valid: RowData[];
  invalid: Array<{ row: number; data: RowData; errors: string[] }>;
  duplicates: number;
  suppressed: number;
}
interface Toast { open: boolean; message: string; severity: 'success' | 'error' | 'info' }

export default function AdminUploadContacts() {
  const navigate = useNavigate();
  const { sessionToken } = useAdminAuth();
  const fileRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [toast, setToast] = useState<Toast>({ open: false, message: '', severity: 'info' });

  const [filename, setFilename] = useState('');
  const [rawRows, setRawRows] = useState<RowData[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [validating, setValidating] = useState(false);
  const [segmentName, setSegmentName] = useState('');
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<{ segment_id: string; valid: number; invalid: number; suppressed: number } | null>(null);

  function showToast(message: string, severity: Toast['severity']) {
    setToast({ open: true, message, severity });
  }

  function parseFile(file: File) {
    setFilename(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = e.target?.result;
      if (!data) return;
      const wb = XLSX.read(data, { type: 'binary' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json<RowData>(ws, { defval: '' });
      if (json.length > 0) {
        const cols = Object.keys(json[0]);
        setHeaders(cols);
        setRawRows(json);
        const autoMap: Record<string, string> = {};
        SYSTEM_FIELDS.forEach(sf => {
          const match = cols.find(c => c.toLowerCase().replace(/[^a-z]/g, '') === sf.key.replace(/_/g, ''));
          if (match) autoMap[sf.key] = match;
        });
        setMapping(autoMap);
        setStep(1);
      } else {
        showToast('No rows found in this file.', 'error');
      }
    };
    reader.onerror = () => showToast('Failed to read file.', 'error');
    reader.readAsBinaryString(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) parseFile(file);
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) parseFile(file);
  }

  const validate = useCallback(async () => {
    setValidating(true);
    const emailCol = mapping['email'];
    if (!emailCol || !sessionToken) { setValidating(false); return; }

    const { data: suppData } = await adminDb(sessionToken, 'email_suppression_list').select('email');
    const suppressedSet = new Set((suppData ?? []).map((s: { email: string }) => s.email.toLowerCase()));

    const seen = new Set<string>();
    const valid: RowData[] = [];
    const invalid: Array<{ row: number; data: RowData; errors: string[] }> = [];
    let dupCount = 0;
    let suppCount = 0;

    rawRows.forEach((row, idx) => {
      const email = (row[emailCol] ?? '').trim().toLowerCase();
      const errors: string[] = [];

      if (!email) errors.push('Missing email');
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push('Invalid email format');

      if (errors.length === 0) {
        if (suppressedSet.has(email)) { suppCount++; return; }
        if (seen.has(email)) { dupCount++; return; }
        seen.add(email);
        const mapped: RowData = { email };
        SYSTEM_FIELDS.forEach(sf => {
          if (sf.key !== 'email' && mapping[sf.key]) mapped[sf.key] = (row[mapping[sf.key]] ?? '').trim();
        });
        valid.push(mapped);
      } else {
        invalid.push({ row: idx + 2, data: row, errors });
      }
    });

    setValidation({ valid, invalid, duplicates: dupCount, suppressed: suppCount });
    setValidating(false);
    setStep(2);
  }, [mapping, rawRows, sessionToken]);

  async function handleImport() {
    if (!validation || !segmentName.trim() || !sessionToken) return;
    setImporting(true);

    try {
      // 1. Create segment
      const { data: seg, error: segErr } = await adminDb(sessionToken, 'marketing_segments')
        .insert({
          name: segmentName.trim(),
          type: 'manual',
          rules: [],
          user_count: validation.valid.length,
        }, { returning: 'id', single: true });

      if (segErr || !seg) {
        console.error('Segment insert error:', segErr);
        showToast(`Failed to create segment: ${segErr ?? 'Unknown error'}`, 'error');
        setImporting(false);
        return;
      }

      // 2. Record the upload metadata (non-fatal if fails)
      const { data: upload, error: uploadErr } = await adminDb(sessionToken, 'marketing_uploads')
        .insert({
          filename,
          total_rows: rawRows.length,
          valid_rows: validation.valid.length,
          invalid_rows: validation.invalid.length,
          duplicate_rows: validation.duplicates,
          suppressed_rows: validation.suppressed,
          status: 'complete',
          segment_id: seg.id,
          segment_name: segmentName.trim(),
        }, { returning: 'id', single: true });

      if (uploadErr) console.error('Upload record error (non-fatal):', uploadErr);
      const uploadId = upload?.id ?? null;

      // 3. Batch-insert contacts into crm_contacts (upsert to handle re-uploads)
      const contactRows = validation.valid.map(c => ({
        email: c.email,
        first_name: c.first_name || null,
        last_name: c.last_name || null,
        full_name: c.full_name || null,
        phone: c.phone || null,
        company: c.company || null,
        role: c.role || null,
        segment_id: seg.id,
        upload_id: uploadId,
      }));

      for (let i = 0; i < contactRows.length; i += BATCH_SIZE) {
        const batch = contactRows.slice(i, i + BATCH_SIZE);
        const { error: batchErr } = await adminDb(sessionToken, 'crm_contacts')
          .upsert(batch, { onConflict: 'email,segment_id', ignoreDuplicates: true });

        if (batchErr) {
          console.error(`Batch ${Math.floor(i / BATCH_SIZE) + 1} insert error:`, batchErr);
          showToast(`Import failed: ${batchErr}`, 'error');
          setImporting(false);
          return;
        }
      }

      setImportResult({
        segment_id: seg.id,
        valid: validation.valid.length,
        invalid: validation.invalid.length,
        suppressed: validation.suppressed,
      });
      showToast(`Successfully imported ${validation.valid.length} contacts!`, 'success');
      setImporting(false);
      setStep(3);
    } catch (err) {
      console.error('Import exception:', err);
      showToast('An unexpected error occurred during import.', 'error');
      setImporting(false);
    }
  }

  return (
    <AdminLayout>
      <Box sx={{ p: 3, bgcolor: '#FAF8F3', minHeight: '100vh' }}>
        <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 3 }}>
          <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/admin/marketing/campaigns')} size="small" sx={{ color: 'text.secondary' }}>Back</Button>
          <Typography variant="h5" fontWeight={800}>Upload Contacts</Typography>
        </Stack>

        <Stepper activeStep={step} sx={{ mb: 4, maxWidth: 600 }}>
          {STEPS.map(l => <Step key={l}><StepLabel>{l}</StepLabel></Step>)}
        </Stepper>

        <Card elevation={0} sx={{ border: '1px solid', borderColor: 'grey.200', p: 3, maxWidth: 800 }}>
          {/* STEP 0 — Upload */}
          {step === 0 && (
            <Stack spacing={2} alignItems="center">
              <Typography variant="h6" fontWeight={700}>Upload Excel or CSV File</Typography>
              <Box
                onDragOver={e => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileRef.current?.click()}
                sx={{
                  width: '100%', border: '2px dashed', borderColor: dragging ? '#1B6B3E' : 'grey.300',
                  borderRadius: 2, p: 6, textAlign: 'center', cursor: 'pointer',
                  bgcolor: dragging ? '#F0F5F1' : '#FAF8F3', transition: 'all 0.15s',
                  '&:hover': { borderColor: '#1B6B3E', bgcolor: '#F0F5F1' },
                }}
              >
                <UploadFileOutlinedIcon sx={{ fontSize: 48, color: dragging ? '#1B6B3E' : '#B5AE9F', mb: 1 }} />
                <Typography variant="body1" fontWeight={600}>Drop your file here, or click to browse</Typography>
                <Typography variant="caption" color="text.secondary">Supports .xlsx, .xls, .csv — max 10,000 rows</Typography>
              </Box>
              <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" style={{ display: 'none' }} onChange={handleFileInput} />
            </Stack>
          )}

          {/* STEP 1 — Map Columns */}
          {step === 1 && (
            <Stack spacing={2.5}>
              <Typography variant="h6" fontWeight={700}>Map Columns</Typography>
              <Typography variant="body2" color="text.secondary">
                File: <strong>{filename}</strong> — {rawRows.length} rows detected
              </Typography>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ bgcolor: '#FAF8F3' }}>
                    {['System Field', 'Your Column', 'Preview'].map(h => (
                      <TableCell key={h} sx={{ fontWeight: 700, fontSize: '0.75rem', color: '#8A8070' }}>{h}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {SYSTEM_FIELDS.map(sf => (
                    <TableRow key={sf.key}>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>{sf.label}</Typography>
                      </TableCell>
                      <TableCell>
                        <FormControl size="small" sx={{ minWidth: 200 }}>
                          <Select value={mapping[sf.key] ?? ''} onChange={e => setMapping(m => ({ ...m, [sf.key]: e.target.value }))} displayEmpty>
                            <MenuItem value=""><em>— Skip —</em></MenuItem>
                            {headers.map(h => <MenuItem key={h} value={h}>{h}</MenuItem>)}
                          </Select>
                        </FormControl>
                      </TableCell>
                      <TableCell>
                        <Typography variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                          {mapping[sf.key] && rawRows[0] ? String(rawRows[0][mapping[sf.key]] ?? '').slice(0, 30) : '—'}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Stack>
          )}

          {/* STEP 2 — Validate */}
          {step === 2 && validation && (
            <Stack spacing={2.5}>
              <Typography variant="h6" fontWeight={700}>Validation Results</Typography>
              <Stack direction="row" spacing={2} flexWrap="wrap">
                {[
                  { label: 'Valid', value: validation.valid.length, color: '#2A8A52' },
                  { label: 'Invalid', value: validation.invalid.length, color: '#C0392B' },
                  { label: 'Duplicates', value: validation.duplicates, color: '#D08A28' },
                  { label: 'Suppressed', value: validation.suppressed, color: '#8A8070' },
                ].map(s => (
                  <Card key={s.label} elevation={0} sx={{ border: '1px solid', borderColor: 'grey.200', p: 1.5, minWidth: 110, flex: '1 1 auto', borderRadius: 1.5 }}>
                    <Typography variant="caption" color="text.secondary" fontWeight={600}>{s.label}</Typography>
                    <Typography variant="h6" fontWeight={800} sx={{ color: s.color }}>{s.value}</Typography>
                  </Card>
                ))}
              </Stack>

              {validation.valid.length > 0 && (
                <Alert severity="success" icon={<CheckCircleOutlineIcon />}>
                  {validation.valid.length} contacts are ready to import.
                </Alert>
              )}

              {validation.invalid.length > 0 && (
                <>
                  <Alert severity="error" icon={<ErrorOutlineIcon />}>
                    {validation.invalid.length} rows have errors and will be skipped.
                  </Alert>
                  <Box sx={{ maxHeight: 200, overflow: 'auto', border: '1px solid', borderColor: 'grey.200', borderRadius: 1 }}>
                    <Table size="small">
                      <TableHead><TableRow sx={{ bgcolor: '#FAF0EE' }}>
                        <TableCell sx={{ fontWeight: 700, fontSize: '0.7rem' }}>Row</TableCell>
                        <TableCell sx={{ fontWeight: 700, fontSize: '0.7rem' }}>Error</TableCell>
                      </TableRow></TableHead>
                      <TableBody>
                        {validation.invalid.slice(0, 20).map(({ row, errors }) => (
                          <TableRow key={row}><TableCell>{row}</TableCell><TableCell>{errors.join(', ')}</TableCell></TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </Box>
                </>
              )}

              <Divider />
              <Typography variant="subtitle2" fontWeight={700}>Create Segment</Typography>
              <TextField
                label="Segment Name"
                size="small"
                fullWidth
                value={segmentName}
                onChange={e => setSegmentName(e.target.value)}
                placeholder="e.g. Uploaded Contacts - June 2026"
                helperText="A new segment will be created containing all valid contacts."
              />
            </Stack>
          )}

          {/* STEP 3 — Done */}
          {step === 3 && importResult && (
            <Stack spacing={2.5} alignItems="center" sx={{ py: 3 }}>
              <CheckCircleOutlineIcon sx={{ fontSize: 56, color: '#2A8A52' }} />
              <Typography variant="h6" fontWeight={800}>Import Complete!</Typography>
              <Typography color="text.secondary" textAlign="center">
                {importResult.valid} contacts imported into <strong>{segmentName}</strong>.
                {importResult.invalid > 0 && ` ${importResult.invalid} skipped.`}
                {importResult.suppressed > 0 && ` ${importResult.suppressed} suppressed.`}
              </Typography>
              <Stack direction="row" spacing={1.5}>
                <Button variant="outlined" onClick={() => navigate('/admin/crm/segments')}>View Segment</Button>
                <Button variant="contained" onClick={() => navigate('/admin/marketing/campaigns/new')}>Create Campaign</Button>
              </Stack>
            </Stack>
          )}

          {/* Navigation */}
          {step < 3 && (
            <Stack direction="row" justifyContent="space-between" sx={{ mt: 4 }}>
              <Button onClick={() => setStep(s => s - 1)} disabled={step === 0} startIcon={<ArrowBackIcon />}>Back</Button>
              {step === 1 && (
                <Button
                  variant="contained"
                  onClick={validate}
                  disabled={!mapping['email'] || validating}
                  endIcon={validating ? <CircularProgress size={16} color="inherit" /> : <ArrowForwardIcon />}
                >
                  {validating ? 'Validating...' : 'Validate'}
                </Button>
              )}
              {step === 2 && (
                <Button
                  variant="contained"
                  color="success"
                  onClick={handleImport}
                  disabled={!validation || validation.valid.length === 0 || !segmentName.trim() || importing}
                  startIcon={importing ? <CircularProgress size={16} color="inherit" /> : undefined}
                >
                  {importing ? 'Importing...' : `Import ${validation?.valid.length ?? 0} Contacts`}
                </Button>
              )}
            </Stack>
          )}
        </Card>
      </Box>

      <Snackbar
        open={toast.open}
        autoHideDuration={5000}
        onClose={() => setToast(t => ({ ...t, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={toast.severity}
          onClose={() => setToast(t => ({ ...t, open: false }))}
          sx={{ width: '100%' }}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </AdminLayout>
  );
}
