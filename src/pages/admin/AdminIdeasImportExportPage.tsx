import { useRef, useState } from 'react';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Chip from '@mui/material/Chip';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import FileUploadOutlinedIcon from '@mui/icons-material/FileUploadOutlined';
import { useAdminAuth, ADMIN_API } from '../../contexts/AdminAuthContext';

// Same lightweight CSV parser used by the Ideas Library page.
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

function normalizeRows(rows: Record<string, string>[]): Record<string, string>[] {
  return rows.map(r => {
    const n: Record<string, string> = {};
    Object.entries(r).forEach(([k, v]) => { n[k.toLowerCase().replace(/ /g, '_')] = v; });
    return n;
  });
}

export default function AdminIdeasImportExportPage() {
  const { sessionToken } = useAdminAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<Record<string, string>[]>([]);
  const [rowCount, setRowCount] = useState(0);
  const [importError, setImportError] = useState('');
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [snack, setSnack] = useState<{ msg: string; severity: 'success' | 'error' } | null>(null);

  async function handleExport() {
    if (!sessionToken) return;
    setExporting(true);
    try {
      const res = await fetch(`${ADMIN_API}/ideas-export-csv`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` },
        body: JSON.stringify({ session_token: sessionToken }),
      });
      if (!res.ok) { setSnack({ msg: 'Export failed', severity: 'error' }); return; }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ideas-library-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      setSnack({ msg: 'Export downloaded.', severity: 'success' });
    } finally {
      setExporting(false);
    }
  }

  function handleFile(f: File | null) {
    setFile(f);
    setImportError('');
    setPreview([]);
    setRowCount(0);
    if (!f) return;
    const reader = new FileReader();
    reader.onload = e => {
      const rows = parseCSV(e.target?.result as string);
      if (rows.length === 0) { setImportError('Could not parse CSV. Ensure it has a header row and at least one data row.'); return; }
      if (rows.every(r => !r.title && !r.Title)) { setImportError('No "title" column found in the CSV.'); return; }
      const normalized = normalizeRows(rows);
      setRowCount(normalized.length);
      setPreview(normalized.slice(0, 5));
    };
    reader.readAsText(f);
  }

  async function handleImport() {
    if (!file || !sessionToken) return;
    setImporting(true);
    const reader = new FileReader();
    reader.onload = async e => {
      try {
        const rows = normalizeRows(parseCSV(e.target?.result as string));
        const res = await fetch(`${ADMIN_API}/ideas-import-csv`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` },
          body: JSON.stringify({ session_token: sessionToken, rows }),
        });
        const data = await res.json() as { inserted?: number; error?: string };
        if (res.ok) {
          setSnack({ msg: `${data.inserted ?? rows.length} ideas imported.`, severity: 'success' });
          setFile(null); setPreview([]); setRowCount(0);
          if (fileInputRef.current) fileInputRef.current.value = '';
        } else {
          setSnack({ msg: data.error ?? 'Import failed', severity: 'error' });
        }
      } finally {
        setImporting(false);
      }
    };
    reader.readAsText(file);
  }

  const previewCols = preview.length ? Object.keys(preview[0]).slice(0, 6) : [];

  return (
    <Box sx={{ py: 4 }}>
      <Container maxWidth="lg">
        <Typography variant="h5" fontWeight={800} mb={0.5}>Import / Export</Typography>
        <Typography color="text.secondary" mb={3}>
          Bulk export the library to CSV, or import ideas from a CSV file.
        </Typography>

        <Stack spacing={3}>
          {/* Export */}
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="subtitle1" fontWeight={700} mb={0.5}>Export</Typography>
              <Typography variant="body2" color="text.secondary" mb={2}>
                Download every Library idea as a CSV. This same file is the template for importing —
                export once to see the exact columns.
              </Typography>
              <Button variant="contained" startIcon={<FileDownloadOutlinedIcon />} onClick={handleExport} disabled={exporting}>
                {exporting ? 'Exporting…' : 'Download CSV'}
              </Button>
            </CardContent>
          </Card>

          {/* Import */}
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="subtitle1" fontWeight={700} mb={0.5}>Import</Typography>
              <Typography variant="body2" color="text.secondary" mb={2}>
                Upload a CSV to add ideas in bulk. A <strong>title</strong> column is required; other
                columns (sector, problem, solution, tagline, difficulty, spots_total, …) are optional and
                matched by header name. Tip: export first and edit that file to guarantee matching columns.
              </Typography>

              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,text/csv"
                hidden
                onChange={e => handleFile(e.target.files?.[0] ?? null)}
              />
              <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap">
                <Button variant="outlined" startIcon={<FileUploadOutlinedIcon />} onClick={() => fileInputRef.current?.click()}>
                  Choose CSV
                </Button>
                {file && <Chip label={file.name} onDelete={() => handleFile(null)} />}
                {rowCount > 0 && <Typography variant="body2" color="text.secondary">{rowCount} rows</Typography>}
              </Stack>

              {importError && <Alert severity="error" sx={{ mt: 2 }}>{importError}</Alert>}

              {preview.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="caption" color="text.secondary">Preview (first {preview.length} of {rowCount})</Typography>
                  <Box sx={{ overflowX: 'auto', border: '1px solid', borderColor: 'divider', borderRadius: 1, mt: 0.5 }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          {previewCols.map(c => <TableCell key={c} sx={{ fontWeight: 700, fontSize: '0.72rem' }}>{c}</TableCell>)}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {preview.map((r, i) => (
                          <TableRow key={i}>
                            {previewCols.map(c => <TableCell key={c} sx={{ fontSize: '0.72rem', maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r[c]}</TableCell>)}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </Box>
                  <Button variant="contained" sx={{ mt: 2 }} startIcon={<FileUploadOutlinedIcon />} onClick={handleImport} disabled={importing || !!importError}>
                    {importing ? 'Importing…' : `Import ${rowCount} idea${rowCount === 1 ? '' : 's'}`}
                  </Button>
                </Box>
              )}
            </CardContent>
          </Card>
        </Stack>
      </Container>

      <Snackbar open={!!snack} autoHideDuration={4000} onClose={() => setSnack(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={snack?.severity} variant="filled" onClose={() => setSnack(null)}>{snack?.msg}</Alert>
      </Snackbar>
    </Box>
  );
}
