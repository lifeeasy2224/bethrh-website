import { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import CircularProgress from '@mui/material/CircularProgress';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Avatar from '@mui/material/Avatar';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';
import FolderOutlinedIcon from '@mui/icons-material/FolderOutlined';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined';
import { useAuth } from '../../contexts/AuthContext';
import FounderSidebar from '../../components/FounderSidebar';
import {
  listPublishedResources, groupByCategory, getResourceDownloadUrl,
  type ResourceDocument,
} from '../../lib/resourceDocuments';

function formatSize(bytes: number | null): string {
  if (!bytes || bytes <= 0) return '';
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} كيلوبايت`;
  return `${(bytes / 1024 / 1024).toFixed(1)} ميغابايت`;
}

function ResourceCard({ doc, onDownload, downloading }: {
  doc: ResourceDocument;
  onDownload: (doc: ResourceDocument) => void;
  downloading: boolean;
}) {
  const size = formatSize(doc.size_bytes);
  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', '&:hover': { boxShadow: 3 }, transition: 'box-shadow 150ms ease' }}>
      <CardContent sx={{ p: 2.5, flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Stack direction="row" spacing={1.5} alignItems="flex-start" sx={{ mb: 1.5 }}>
          <Box sx={{ width: 40, height: 40, borderRadius: 2, bgcolor: 'secondary.main', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <DescriptionOutlinedIcon sx={{ color: 'primary.dark', fontSize: 20 }} />
          </Box>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography variant="subtitle1" fontWeight={700} sx={{ lineHeight: 1.3 }}>{doc.title}</Typography>
            <Typography variant="caption" color="text.secondary" noWrap title={doc.file_name}>
              {doc.file_name}{size ? ` · ${size}` : ''}
            </Typography>
          </Box>
        </Stack>
        {doc.description && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
            {doc.description}
          </Typography>
        )}
        <Box sx={{ flex: 1 }} />
        <Button
          variant="outlined"
          size="small"
          startIcon={downloading ? <CircularProgress size={14} color="inherit" /> : <DownloadOutlinedIcon />}
          onClick={() => onDownload(doc)}
          disabled={downloading}
          sx={{ alignSelf: 'flex-start' }}
        >
          {downloading ? 'جارٍ التجهيز…' : 'تحميل'}
        </Button>
      </CardContent>
    </Card>
  );
}

export default function FounderResourcesPage() {
  const { profile } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [docs, setDocs] = useState<ResourceDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; sev: 'success' | 'error' | 'info' } | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      const list = await listPublishedResources();
      if (active) { setDocs(list); setLoading(false); }
    })();
    return () => { active = false; };
  }, []);

  async function handleDownload(doc: ResourceDocument) {
    setDownloadingId(doc.id);
    const res = await getResourceDownloadUrl(doc.id);
    setDownloadingId(null);
    if (!res.ok) { setToast({ msg: res.error, sev: 'error' }); return; }
    window.open(res.url, '_blank', 'noopener,noreferrer');
  }

  const groups = groupByCategory(docs);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#F7F3EC' }}>
      <FounderSidebar
        open={sidebarOpen}
        onToggle={() => setSidebarOpen(o => !o)}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      <Box sx={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <AppBar position="sticky" elevation={0} sx={{ bgcolor: 'white', borderBottom: '1px solid', borderColor: 'divider' }}>
          <Toolbar sx={{ gap: 1 }}>
            <IconButton sx={{ display: { lg: 'none' } }} onClick={() => setMobileOpen(true)} size="small">
              <MenuIcon />
            </IconButton>
            <FolderOutlinedIcon sx={{ color: 'primary.main', ml: 0.5 }} />
            <Typography variant="h6" fontWeight={700} sx={{ flex: 1, color: 'text.primary' }}>موارد الرائد</Typography>
            <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.main', color: 'primary.dark', fontSize: '0.8rem', fontWeight: 700 }}>
              {profile?.full_name?.[0] ?? 'ر'}
            </Avatar>
          </Toolbar>
        </AppBar>

        <Container maxWidth="lg" sx={{ py: 4, flex: 1 }}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h5" fontWeight={800}>موارد الرائد</Typography>
            <Typography variant="body2" color="text.secondary">
              أدلة وقوالب وأدوات اختارها فريق بذرة لمساعدتك على البناء.
            </Typography>
          </Box>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
              <CircularProgress />
            </Box>
          ) : docs.length === 0 ? (
            <Card sx={{ textAlign: 'center', p: 6, border: '2px dashed', borderColor: 'divider', boxShadow: 'none' }}>
              <FolderOutlinedIcon sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
              <Typography variant="h6" fontWeight={700} gutterBottom>لا توجد موارد بعد</Typography>
              <Typography color="text.secondary">
                ستظهر هنا عندما ينشرها الفريق.
              </Typography>
            </Card>
          ) : (
            <Stack spacing={4}>
              {groups.map(group => (
                <Box key={group.category}>
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
                    <Typography variant="subtitle1" fontWeight={800}>{group.category}</Typography>
                    <Chip label={group.docs.length} size="small" sx={{ height: 20, fontWeight: 700 }} />
                  </Stack>
                  <Grid container spacing={3}>
                    {group.docs.map(doc => (
                      <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={doc.id}>
                        <ResourceCard doc={doc} onDownload={handleDownload} downloading={downloadingId === doc.id} />
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              ))}
            </Stack>
          )}
        </Container>
      </Box>

      <Snackbar open={!!toast} autoHideDuration={5000} onClose={() => setToast(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={toast?.sev ?? 'info'} variant="filled" onClose={() => setToast(null)}>{toast?.msg}</Alert>
      </Snackbar>
    </Box>
  );
}
