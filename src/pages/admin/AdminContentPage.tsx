import { useEffect, useState, useCallback, useRef } from 'react';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Stack from '@mui/material/Stack';
import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import LinearProgress from '@mui/material/LinearProgress';
import Chip from '@mui/material/Chip';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import EditNoteIcon from '@mui/icons-material/EditNote';
import SaveOutlinedIcon from '@mui/icons-material/SaveOutlined';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import CloudUploadOutlinedIcon from '@mui/icons-material/CloudUploadOutlined';
import { useAdminAuth, ADMIN_API } from '../../contexts/AdminAuthContext';
import { invalidateContentCache } from '../../hooks/useSiteContent';

type ContentItem = {
  id: string;
  key: string;
  value: string;
  label: string;
  category: string;
  type: 'text' | 'textarea';
  sort_order: number;
  updated_at: string;
};

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  'Homepage — Hero':     HomeOutlinedIcon,
  'Homepage — Stats':    HomeOutlinedIcon,
  'Homepage — About':    HomeOutlinedIcon,
  'Homepage — Sections': HomeOutlinedIcon,
  'Homepage — CTA':      HomeOutlinedIcon,
  'Homepage — Founder':  PersonOutlineIcon,
  'Pricing Page':        AttachMoneyIcon,
};

export default function AdminContentPage() {
  const { sessionToken } = useAdminAuth();
  const [items, setItems] = useState<ContentItem[]>([]);
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [snack, setSnack] = useState<{ msg: string; severity: 'success' | 'error' } | null>(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);

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
    const data = await apiPost('content-list', {});
    const loaded = (data.items ?? []) as ContentItem[];
    setItems(loaded);
    const init: Record<string, string> = {};
    for (const item of loaded) init[item.key] = item.value;
    setEdits(init);
    setLoading(false);
  }, [apiPost]);

  useEffect(() => { void load(); }, [load]);

  const handleChange = (key: string, value: string) => {
    setEdits(prev => ({ ...prev, [key]: value }));
  };

  const isDirty = (category: string) =>
    items.filter(i => i.category === category).some(i => edits[i.key] !== i.value);

  const saveCategory = async (category: string) => {
    const categoryItems = items.filter(i => i.category === category);
    const updates = categoryItems
      .filter(i => edits[i.key] !== i.value)
      .map(i => ({ key: i.key, value: edits[i.key] ?? i.value }));
    if (updates.length === 0) return;

    setSaving(category);
    const result = await apiPost('content-update', { updates });
    setSaving(null);

    if (result.error) {
      setSnack({ msg: result.error as string, severity: 'error' });
    } else {
      // Reflect saved values in items
      setItems(prev => prev.map(item =>
        item.category === category
          ? { ...item, value: edits[item.key] ?? item.value }
          : item
      ));
      invalidateContentCache();
      setSnack({ msg: `"${category}" saved successfully`, severity: 'success' });
    }
  };

  const handlePhotoUpload = async (file: File) => {
    setPhotoUploading(true);
    try {
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve((reader.result as string).split(',')[1]);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      const res = await fetch(`${ADMIN_API}/content-photo-upload`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}` },
        body: JSON.stringify({ session_token: sessionToken, filename: file.name, content_type: file.type, base64_data: base64 }),
      });
      const data = await res.json() as Record<string, unknown>;
      if (data.error) { setSnack({ msg: data.error as string, severity: 'error' }); return; }
      const url = data.url as string;
      handleChange('home.founder.photo_url', url);
      // Auto-save the URL
      await apiPost('content-update', { updates: [{ key: 'home.founder.photo_url', value: url }] });
      setItems(prev => prev.map(i => i.key === 'home.founder.photo_url' ? { ...i, value: url } : i));
      invalidateContentCache();
      setSnack({ msg: 'Photo uploaded successfully', severity: 'success' });
    } catch {
      setSnack({ msg: 'Upload failed', severity: 'error' });
    } finally {
      setPhotoUploading(false);
    }
  };

  const categories = [...new Set(items.map(i => i.category))];

  return (
    <Box sx={{ p: { xs: 2, sm: 3 } }}>
      {/* Header */}
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" alignItems={{ sm: 'center' }} spacing={2} sx={{ mb: 3 }}>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Box sx={{ width: 38, height: 38, borderRadius: 2, bgcolor: '#F0F5F1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <EditNoteIcon sx={{ color: '#1B6B3E', fontSize: 20 }} />
          </Box>
          <Box>
            <Typography variant="h5" fontWeight={700}>Site Content</Typography>
            <Typography variant="body2" color="text.secondary">Edit website text without touching code</Typography>
          </Box>
        </Stack>
      </Stack>

      <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
        Changes are saved per section. The live website will reflect your edits immediately after saving.
      </Alert>

      {loading && <LinearProgress sx={{ mb: 2, borderRadius: 1 }} />}

      {/* Sections */}
      <Stack spacing={1.5}>
        {categories.map((category, idx) => {
          const categoryItems = items.filter(i => i.category === category);
          const dirty = isDirty(category);
          const isSaving = saving === category;
          const IconComp = CATEGORY_ICONS[category] ?? EditNoteIcon;

          return (
            <Accordion
              key={category}
              defaultExpanded={idx === 0}
              variant="outlined"
              sx={{ borderRadius: '8px !important', '&:before': { display: 'none' }, overflow: 'hidden' }}
            >
              <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                sx={{ px: 2.5, py: 1, bgcolor: dirty ? 'rgba(27, 107, 62,0.04)' : 'white', '&:hover': { bgcolor: 'grey.50' } }}
              >
                <Stack direction="row" spacing={1.5} alignItems="center" sx={{ flex: 1 }}>
                  <Box sx={{ width: 30, height: 30, borderRadius: 1.5, bgcolor: '#F0F5F1', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <IconComp sx={{ color: '#1B6B3E', fontSize: 16 }} />
                  </Box>
                  <Typography fontWeight={600} fontSize="0.9375rem">{category}</Typography>
                  {dirty && (
                    <Chip label="Unsaved" size="small" sx={{ height: 20, fontSize: '0.7rem', fontWeight: 700, bgcolor: '#F5EAD3', color: '#A07830', border: '1px solid #D4A65344' }} />
                  )}
                  <Typography variant="caption" color="text.disabled" sx={{ ml: 'auto !important', mr: 1 }}>
                    {categoryItems.length} field{categoryItems.length !== 1 ? 's' : ''}
                  </Typography>
                </Stack>
              </AccordionSummary>

              <AccordionDetails sx={{ px: 2.5, py: 2.5, bgcolor: 'white' }}>
                <Stack spacing={2.5}>
                  {categoryItems.map(item => {
                    // Visibility toggle
                    if (item.key === 'home.founder.visible') {
                      const isVisible = (edits[item.key] ?? item.value) !== 'false';
                      return (
                        <Box key={item.key}>
                          <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '0.04em', fontSize: '0.7rem', display: 'block', mb: 0.75 }}>
                            {item.label}
                          </Typography>
                          <FormControlLabel
                            control={
                              <Switch
                                checked={isVisible}
                                onChange={e => handleChange(item.key, e.target.checked ? 'true' : 'false')}
                                color="primary"
                              />
                            }
                            label={isVisible ? 'Section visible on homepage' : 'Section hidden'}
                          />
                        </Box>
                      );
                    }

                    // Photo upload
                    if (item.key === 'home.founder.photo_url') {
                      const url = edits[item.key] ?? item.value;
                      return (
                        <Box key={item.key}>
                          <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '0.04em', fontSize: '0.7rem', display: 'block', mb: 0.75 }}>
                            {item.label}
                          </Typography>
                          <Stack direction="row" spacing={2} alignItems="center">
                            {url && (
                              <Box
                                component="img"
                                src={url}
                                alt="Founder"
                                sx={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', border: '2px solid #D4A653' }}
                              />
                            )}
                            <input
                              ref={photoInputRef}
                              type="file"
                              accept="image/jpeg,image/png,image/webp"
                              style={{ display: 'none' }}
                              onChange={e => { const f = e.target.files?.[0]; if (f) void handlePhotoUpload(f); }}
                            />
                            <Button
                              variant="outlined"
                              size="small"
                              startIcon={<CloudUploadOutlinedIcon />}
                              disabled={photoUploading}
                              onClick={() => photoInputRef.current?.click()}
                            >
                              {photoUploading ? 'Uploading…' : url ? 'Replace Photo' : 'Upload Photo'}
                            </Button>
                            {url && (
                              <Button
                                variant="text"
                                size="small"
                                color="error"
                                onClick={() => handleChange(item.key, '')}
                              >
                                Remove
                              </Button>
                            )}
                          </Stack>
                        </Box>
                      );
                    }

                    return (
                      <Box key={item.key}>
                        <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '0.04em', fontSize: '0.7rem', display: 'block', mb: 0.75 }}>
                          {item.label}
                        </Typography>
                        <TextField
                          fullWidth
                          value={edits[item.key] ?? item.value}
                          onChange={e => handleChange(item.key, e.target.value)}
                          multiline={item.type === 'textarea'}
                          minRows={item.type === 'textarea' ? 3 : undefined}
                          size="small"
                          sx={{
                            '& .MuiOutlinedInput-root': {
                              borderRadius: 1.5,
                              bgcolor: edits[item.key] !== item.value ? 'rgba(27, 107, 62,0.03)' : 'transparent',
                              '& fieldset': { borderColor: edits[item.key] !== item.value ? '#1B6B3E' : undefined },
                            },
                          }}
                        />
                      </Box>
                    );
                  })}

                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', pt: 0.5 }}>
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<SaveOutlinedIcon />}
                      disabled={!dirty || isSaving}
                      onClick={() => void saveCategory(category)}
                      sx={{ minWidth: 120 }}
                    >
                      {isSaving ? 'Saving…' : 'Save Section'}
                    </Button>
                  </Box>
                </Stack>
              </AccordionDetails>
            </Accordion>
          );
        })}
      </Stack>

      {!loading && items.length === 0 && (
        <Card variant="outlined" sx={{ textAlign: 'center', py: 6 }}>
          <CardContent>
            <EditNoteIcon sx={{ fontSize: 40, color: 'text.disabled', mb: 1 }} />
            <Typography color="text.secondary">No content items found.</Typography>
          </CardContent>
        </Card>
      )}

      <Snackbar
        open={!!snack}
        autoHideDuration={3500}
        onClose={() => setSnack(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity={snack?.severity ?? 'success'} onClose={() => setSnack(null)} variant="filled" sx={{ width: '100%' }}>
          {snack?.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
}
