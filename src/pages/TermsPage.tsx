import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import NavBar from '../components/NavBar';
import Footer from '../components/Footer';
import { useSEO } from '../hooks/useSEO';

export default function TermsPage() {
  useSEO({ title: 'الشروط والأحكام — بذرة', description: 'راجع شروط استخدام بذرة التي تنظّم استخدامك للمنصة ومزاياها وخطط الاشتراك.', canonicalPath: '/terms' });
  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <NavBar />
      <Box sx={{ pt: { xs: 10, md: 12 }, pb: 8, flex: 1 }}>
        <Container maxWidth="md">
          <Typography variant="h2" fontWeight={800} gutterBottom sx={{ fontFamily: '"Noto Kufi Arabic", "Nunito Sans", sans-serif' }}>الشروط والأحكام</Typography>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 4, display: 'block' }}>آخر تحديث: ٢ يونيو ٢٠٢٦</Typography>
          {[
            { h: 'قبول الشروط', p: 'بإنشائك حساباً أو استخدامك بذرة، فأنت توافق على هذه الشروط والأحكام. إن لم توافق، فلا تستخدم المنصة.' },
            { h: 'استخدام المنصة', p: 'تمنحك بذرة ترخيصاً محدوداً وغير حصري وغير قابل للتحويل لاستخدام المنصة لأغراض مشروعة. لا يجوز لك عكس هندسة الخدمة أو إعادة بيعها أو إساءة استخدامها.' },
            { h: 'محتوى المستخدم', p: 'تحتفظ بملكية المحتوى الذي تنشئه على بذرة. وبنشرك له، تمنحنا ترخيصاً بعرضه وتوزيعه داخل المنصة.' },
            { h: 'الملكية الفكرية', p: 'جميع أكواد المنصة وتصميمها ومحتواها (باستثناء ما يقدمه المستخدمون) مملوكة لشركة Life Easy LLC. الأفكار المقدَّمة تغطيها سياسة حماية الملكية الفكرية المنفصلة.' },
            { h: 'إخلاء المسؤولية', p: 'تقدم بذرة أدوات ومعلومات، وليس نصيحة مالية أو قانونية. نتائج المشاريع غير مضمونة. استخدامك للمنصة على مسؤوليتك الخاصة.' },
            { h: 'حدود المسؤولية', p: 'إلى أقصى حد يسمح به القانون، لا تتحمل Life Easy LLC المسؤولية عن أي أضرار غير مباشرة أو عرضية أو تبعية ناشئة عن استخدام المنصة.' },
            { h: 'القانون الحاكم', p: 'تخضع هذه الشروط لقوانين ولاية أريزونا الأمريكية، وتُحل النزاعات في مقاطعة ماريكوبا، أريزونا.' },
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
