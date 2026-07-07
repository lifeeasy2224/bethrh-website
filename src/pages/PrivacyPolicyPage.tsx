import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import NavBar from '../components/NavBar';
import Footer from '../components/Footer';
import { useSEO } from '../hooks/useSEO';

export default function PrivacyPolicyPage() {
  useSEO({ title: 'سياسة الخصوصية — بذرة', description: 'اقرأ سياسة خصوصية بذرة لتفهم كيف نجمع بياناتك الشخصية ونستخدمها ونحميها.', canonicalPath: '/privacy' });
  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <NavBar />
      <Box sx={{ pt: { xs: 10, md: 12 }, pb: 8, flex: 1 }}>
        <Container maxWidth="md">
          <Typography variant="h2" fontWeight={800} gutterBottom sx={{ fontFamily: '"Noto Kufi Arabic", "Nunito Sans", sans-serif' }}>سياسة الخصوصية</Typography>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 4, display: 'block' }}>آخر تحديث: ٢ يونيو ٢٠٢٦</Typography>
          {[
            { h: 'المعلومات التي نجمعها', p: 'نجمع المعلومات التي تقدمها مباشرة (الاسم، البريد الإلكتروني، الدور)، وبيانات الاستخدام (الصفحات المزارة، المزايا المستخدمة)، والبيانات التقنية (عنوان IP، نوع المتصفح). لا نبيع معلوماتك الشخصية أبداً.' },
            { h: 'كيف نستخدم معلوماتك', p: 'نستخدم بياناتك لتقديم منصة بذرة وتحسينها، وتخصيص تجربتك، وإرسال المراسلات المتعلقة بحسابك، والامتثال للالتزامات القانونية.' },
            { h: 'تخزين البيانات وأمانها', p: 'تُخزَّن بياناتك بأمان على بنية Supabase التحتية المستضافة في الولايات المتحدة. نستخدم تشفيراً بمعايير الصناعة (TLS) للبيانات أثناء النقل والتخزين.' },
            { h: 'ملفات تعريف الارتباط', p: 'نستخدم ملفات تعريف ارتباط أساسية لتسجيل الدخول وإدارة الجلسة. لا نستخدم ملفات تتبع لأغراض إعلانية.' },
            { h: 'حقوقك', p: 'يمكنك طلب الاطلاع على بياناتك الشخصية أو تصحيحها أو حذفها في أي وقت عبر مراسلة hello@bethra.co. سنرد خلال ٣٠ يوماً.' },
            { h: 'التواصل', p: 'Life Easy LLC · 44887 W Bahia Dr · Maricopa AZ 85139 · hello@bethra.co · +1 (480) 447-6256' },
          ].map(s => (
            <Box key={s.h} sx={{ mb: 3 }}>
              <Typography variant="h5" fontWeight={700} gutterBottom>{s.h}</Typography>
              <Typography color="text.secondary" sx={{ lineHeight: 1.8 }}>{s.p}</Typography>
            </Box>
          ))}
        </Container>
      </Box>
      <Footer />
    </Box>
  );
}
