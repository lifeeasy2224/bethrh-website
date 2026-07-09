import { useState } from 'react';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import MenuItem from '@mui/material/MenuItem';
import EmailIcon from '@mui/icons-material/Email';
import AccessTimeOutlinedIcon from '@mui/icons-material/AccessTimeOutlined';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import NavBar from '../components/NavBar';
import Footer from '../components/Footer';
import { useSEO } from '../hooks/useSEO';

const TOPICS = [
  'سؤال عام',
  'دعم فني',
  'الفوترة والحساب',
  'استفسار مستثمر',
  'شراكة',
  'إعلام / صحافة',
  'غير ذلك',
];

interface FormState {
  name: string;
  email: string;
  topic: string;
  message: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  topic?: string;
  message?: string;
}

export default function ContactPage() {
  const [form, setForm] = useState<FormState>({ name: '', email: '', topic: '', message: '' });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitted, setSubmitted] = useState(false);
  useSEO({
    title: 'تواصل معنا — بذرة',
    description: 'تواصل مع فريق بذرة. نحن هنا لمساعدتك في أسئلة حسابك أو الأسعار أو الشراكات أو أي شيء آخر.',
    canonicalPath: '/contact',
  });
  const [loading, setLoading] = useState(false);

  function validate(): boolean {
    const e: FormErrors = {};
    if (!form.name.trim()) e.name = 'الاسم مطلوب';
    if (!form.email.trim()) e.email = 'البريد الإلكتروني مطلوب';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'أدخل بريداً إلكترونياً صالحاً';
    if (!form.topic) e.topic = 'يرجى اختيار الموضوع';
    if (!form.message.trim()) e.message = 'الرسالة مطلوبة';
    else if (form.message.trim().length < 10) e.message = 'يجب ألا تقل الرسالة عن ١٠ أحرف';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleChange(field: keyof FormState) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm(prev => ({ ...prev, [field]: e.target.value }));
      if (errors[field]) setErrors(prev => ({ ...prev, [field]: undefined }));
    };
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    await new Promise(r => setTimeout(r, 800));
    setLoading(false);
    setSubmitted(true);
    setForm({ name: '', email: '', topic: '', message: '' });
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <NavBar />

      <Box sx={{ pt: { xs: 10, md: 13 }, pb: 6, bgcolor: 'grey.50', textAlign: 'center' }}>
        <Container maxWidth="md">
          <Typography variant="h1" fontWeight={800} gutterBottom sx={{ fontSize: { xs: '2rem', md: '3rem' } }}>
            تواصل معنا
          </Typography>
          <Typography color="text.secondary" sx={{ fontSize: '1.1rem' }}>
            يسعدنا سماعك. فريقنا يرد عادةً خلال يوم عمل واحد.
          </Typography>
        </Container>
      </Box>

      <Box sx={{ py: 6, flex: 1 }}>
        <Container maxWidth="lg">
          <Grid container spacing={5}>
            {/* Contact form */}
            <Grid size={{ xs: 12, md: 7 }}>
              <Card>
                <CardContent sx={{ p: { xs: 3, md: 4 } }}>
                  <Typography variant="h5" fontWeight={700} gutterBottom sx={{ mb: 3 }}>أرسل لنا رسالة</Typography>
                  <Box component="form" onSubmit={handleSubmit} noValidate>
                    <Stack spacing={2.5}>
                      <Grid container spacing={2}>
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <TextField
                            label="اسمك"
                            value={form.name}
                            onChange={handleChange('name')}
                            error={!!errors.name}
                            helperText={errors.name}
                            fullWidth
                            required
                          />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <TextField
                            label="البريد الإلكتروني"
                            type="email"
                            value={form.email}
                            onChange={handleChange('email')}
                            error={!!errors.email}
                            helperText={errors.email}
                            fullWidth
                            required
                          />
                        </Grid>
                      </Grid>
                      <TextField
                        select
                        label="الموضوع"
                        value={form.topic}
                        onChange={handleChange('topic')}
                        error={!!errors.topic}
                        helperText={errors.topic}
                        fullWidth
                        required
                      >
                        {TOPICS.map(t => (
                          <MenuItem key={t} value={t}>{t}</MenuItem>
                        ))}
                      </TextField>
                      <TextField
                        label="الرسالة"
                        value={form.message}
                        onChange={handleChange('message')}
                        error={!!errors.message}
                        helperText={errors.message}
                        fullWidth
                        required
                        multiline
                        rows={5}
                        placeholder="أخبرنا كيف نستطيع مساعدتك..."
                      />
                      <Button type="submit" variant="contained" size="large" disabled={loading} sx={{ alignSelf: 'flex-start', px: 4 }}>
                        {loading ? 'جارٍ الإرسال...' : 'أرسل الرسالة'}
                      </Button>
                    </Stack>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* Contact info */}
            <Grid size={{ xs: 12, md: 5 }}>
              <Stack spacing={3}>
                <Box>
                  <Typography variant="h5" fontWeight={700} gutterBottom>ابقَ على تواصل</Typography>
                  <Typography color="text.secondary" sx={{ lineHeight: 1.8 }}>
                    سواء كان سؤالك عن المزايا أو الأسعار أو وصول المستثمرين أو أي شيء آخر — فريقنا جاهز للمساعدة.
                  </Typography>
                </Box>

                {/* WhatsApp — primary */}
                <Box
                  sx={{
                    border: '2px solid #25D366',
                    borderRadius: 2,
                    p: 2.5,
                    bgcolor: '#F0F5F1',
                  }}
                >
                  <Stack direction="row" spacing={2} alignItems="center" mb={2}>
                    <Box sx={{ width: 44, height: 44, borderRadius: 2, bgcolor: '#25D36618', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#25D366', flexShrink: 0 }}>
                      <WhatsAppIcon sx={{ fontSize: 22 }} />
                    </Box>
                    <Box>
                      <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        واتساب — أسرع استجابة
                      </Typography>
                    </Box>
                  </Stack>
                  <Button
                    component="a"
                    href="https://wa.me/14804476256"
                    target="_blank"
                    rel="noopener noreferrer"
                    variant="contained"
                    startIcon={<WhatsAppIcon />}
                    fullWidth
                    sx={{ bgcolor: '#25D366', '&:hover': { bgcolor: '#1ebe5c' }, fontWeight: 700 }}
                  >
                    راسلنا الآن على واتساب
                  </Button>
                </Box>

                {[
                  { icon: <EmailIcon sx={{ fontSize: 22 }} />, label: 'البريد الإلكتروني', value: 'info@bethra.co', color: '#1B6B3E' },
                  { icon: <AccessTimeOutlinedIcon sx={{ fontSize: 22 }} />, label: 'ساعات العمل', value: 'الأحد–الخميس', color: '#8A8070' },
                ].map(item => (
                  <Stack key={item.label} direction="row" spacing={2} alignItems="flex-start">
                    <Box sx={{ width: 44, height: 44, borderRadius: 2, bgcolor: `${item.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: item.color, flexShrink: 0 }}>
                      {item.icon}
                    </Box>
                    <Box>
                      <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {item.label}
                      </Typography>
                      <Typography variant="body2" sx={{ whiteSpace: 'pre-line', mt: 0.25 }}>{item.value}</Typography>
                    </Box>
                  </Stack>
                ))}

                <Card sx={{ bgcolor: 'primary.main', border: 'none' }}>
                  <CardContent sx={{ p: 3 }}>
                    <Typography variant="subtitle2" fontWeight={700} sx={{ color: 'white', mb: 1 }}>
                      تبحث عن مقالات مركز المساعدة؟
                    </Typography>
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.8)', mb: 2 }}>
                      تصفّح الأسئلة الشائعة والأدلة لإجابات فورية.
                    </Typography>
                    <Button
                      component="a"
                      href="/help"
                      variant="outlined"
                      size="small"
                      sx={{ color: 'white', borderColor: 'rgba(255,255,255,0.5)', '&:hover': { borderColor: 'white', bgcolor: 'rgba(255,255,255,0.1)' } }}
                    >
                      زر مركز المساعدة
                    </Button>
                  </CardContent>
                </Card>
              </Stack>
            </Grid>
          </Grid>
        </Container>
      </Box>

      <Snackbar
        open={submitted}
        autoHideDuration={6000}
        onClose={() => setSubmitted(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setSubmitted(false)} severity="success" variant="filled" sx={{ width: '100%' }}>
          أُرسلت رسالتك! سنرد عليك خلال يوم عمل واحد.
        </Alert>
      </Snackbar>

      <Footer />
    </Box>
  );
}
