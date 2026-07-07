import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import NavBar from '../components/NavBar';
import Footer from '../components/Footer';
import { useSEO } from '../hooks/useSEO';

export default function CookiePolicyPage() {
  useSEO({ title: 'سياسة ملفات الارتباط — بذرة', description: 'تعرّف كيف تستخدم بذرة ملفات تعريف الارتباط والتقنيات المشابهة لتحسين تجربتك وتحليل حركة الموقع.', canonicalPath: '/cookies' });
  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <NavBar />
      <Box sx={{ pt: { xs: 10, md: 12 }, pb: 8, flex: 1 }}>
        <Container maxWidth="md">
          <Typography variant="h2" fontWeight={800} gutterBottom sx={{ fontFamily: '"Noto Kufi Arabic", "Nunito Sans", sans-serif' }}>سياسة ملفات الارتباط</Typography>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 4, display: 'block' }}>آخر تحديث: ٢ يونيو ٢٠٢٦</Typography>
          {[
            { h: 'ما هي ملفات تعريف الارتباط', p: 'ملفات تعريف الارتباط ملفات نصية صغيرة تُوضع على جهازك عند زيارة موقع ما. تساعد المواقع على العمل بشكل صحيح وتذكّر تفضيلاتك.' },
            { h: 'الملفات الأساسية', p: 'نستخدم ملفات أساسية لتسجيل الدخول (إبقاؤك مسجّلاً)، وإدارة الجلسة، والأمان. لا يمكن تعطيلها لأنها ضرورية لعمل المنصة.' },
            { h: 'لا ملفات إعلانية', p: 'لا نستخدم ملفات تعريف الارتباط للإعلان أو التتبع عبر المواقع أو التنميط السلوكي، ولا نشارك بياناتها مع معلنين خارجيين.' },
            { h: 'التحليلات', p: 'نستخدم تحليلات مجهولة الهوية لفهم كيفية استخدام المزايا وتحسين المنصة. لا تتضمن بيانات التحليلات أي معلومات تعريف شخصية.' },
            { h: 'إدارة الملفات', p: 'يمكنك التحكم بملفات تعريف الارتباط من إعدادات متصفحك. تعطيل الملفات الأساسية سيمنع تسجيل الدخول وعمل المنصة.' },
            { h: 'التواصل', p: 'لديك سؤال عن استخدامنا لملفات الارتباط؟ راسلنا على hello@bethra.co.' },
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
