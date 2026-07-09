import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import NavBar from '../components/NavBar';
import Footer from '../components/Footer';
import { useSEO } from '../hooks/useSEO';

export default function IpProtectionPage() {
  useSEO({ title: 'حماية الملكية الفكرية — بذرة', description: 'افهم كيف تحمي بذرة ملكيتك الفكرية وما الخطوات التي يمكنك اتخاذها لحماية أفكار مشاريعك.', canonicalPath: '/ip-protection' });
  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <NavBar />
      <Box sx={{ pt: { xs: 10, md: 12 }, pb: 8, flex: 1 }}>
        <Container maxWidth="md">
          <Typography variant="h2" fontWeight={800} gutterBottom sx={{ fontFamily: '"Noto Kufi Arabic", "Nunito Sans", sans-serif' }}>سياسة حماية الملكية الفكرية</Typography>
          <Typography variant="caption" color="text.secondary" sx={{ mb: 4, display: 'block' }}>آخر تحديث: ٢ يونيو ٢٠٢٦</Typography>
          {[
            { h: 'أفكارك ملكك', p: 'أي مفهوم تجاري أو عرض أو معلومات خاصة تقدمها إلى بذرة تبقى ملكيتك الفكرية الحصرية. لا ندّعي أي ملكية على أفكارك.' },
            { h: 'سرية ما تقدمه', p: 'الأفكار المقدمة بشكل خاص (لوحتك الشخصية، المسودات، محادثات المدرّب الذكي) لا يصل إليها أحد غيرك. العروض العامة في السوق لا تُعرض إلا بموافقتك الصريحة.' },
            { h: 'أفكار مكتبة بذرة', p: 'أفكار مكتبة الأفكار العامة بحثها فريقنا وانتقاها بشكل مستقل. تُقدَّم كإلهام ونقاط انطلاق، وليست حقوقاً تجارية حصرية.' },
            { h: 'التواصل مع المستثمرين', p: 'عند تفعيل الظهور للمستثمرين، لا يُشارك سوى درجتك وقطاعك وملخص غير سري. مواد العرض التفصيلية لا تُشارك إلا بتوجيهك.' },
            { h: 'سياسة DMCA', p: 'إذا كنت تعتقد أن محتوى على بذرة ينتهك ملكيتك الفكرية، راسل info@bethra.co مع تفاصيل الانتهاك المزعوم.' },
            { h: 'التواصل', p: 'Life Easy LLC · info@bethra.co · +1 (480) 447-6256' },
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
