import { useState } from 'react';
import { useSEO } from '../hooks/useSEO';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Divider from '@mui/material/Divider';
import SearchIcon from '@mui/icons-material/Search';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import LightbulbOutlinedIcon from '@mui/icons-material/LightbulbOutlined';
import FactCheckOutlinedIcon from '@mui/icons-material/FactCheckOutlined';
import SmartToyOutlinedIcon from '@mui/icons-material/SmartToyOutlined';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import EmailIcon from '@mui/icons-material/Email';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import { ArrowForwardIosIcon } from '../components/rtlIcons';
import NavBar from '../components/NavBar';
import Footer from '../components/Footer';

const CATEGORIES = [
  { icon: <LightbulbOutlinedIcon sx={{ fontSize: 28 }} />, title: 'البداية', desc: 'جديد على بذرة؟ ابدأ من هنا', color: '#D08A28', bg: '#F5EAD3' },
  { icon: <FactCheckOutlinedIcon sx={{ fontSize: 28 }} />, title: 'التحقق والاختبار', desc: 'كيف تتحقق من فكرتك', color: '#1B6B3E', bg: '#DEEBE2' },
  { icon: <StorefrontOutlinedIcon sx={{ fontSize: 28 }} />, title: 'السوق والمستثمرون', desc: 'كيف يجدك المستثمرون', color: '#C0392B', bg: '#F5DDD9' },
  { icon: <LightbulbOutlinedIcon sx={{ fontSize: 28 }} />, title: 'مكتبة الأفكار', desc: 'تصفّح واحجز الأفكار', color: '#D08A28', bg: '#F5EAD3' },
  { icon: <SmartToyOutlinedIcon sx={{ fontSize: 28 }} />, title: 'المدرّب الذكي', desc: 'مستشارك على مدار الساعة', color: '#D08A28', bg: '#FAF5E9' },
  { icon: <SettingsOutlinedIcon sx={{ fontSize: 28 }} />, title: 'الحساب والفوترة', desc: 'الخطط والفوترة والإعدادات', color: '#8A8070', bg: '#F7F3EC' },
  { icon: <SettingsOutlinedIcon sx={{ fontSize: 28 }} />, title: 'الخصوصية والأمان', desc: 'سلامة بياناتك وخصوصيتك', color: '#1B6B3E', bg: '#DEEBE2' },
];

interface Article {
  id: string;
  category: string;
  title: string;
  content: string;
}

const ARTICLES: Article[] = [
  // Getting Started
  { id: 'what-is', category: 'getting-started', title: 'ما هي بذرة؟', content: 'بذرة منصة تساعد روّاد الأعمال على اختبار أفكار مشاريعهم مع عملاء حقيقيين، وبناء نماذج أعمالهم، والتواصل مع المستثمرين المسجّلين — في مكان واحد. نجمع بين قراءة أولى بالذكاء الاصطناعي، وأطر عمل منظمة (مخطط نموذج العمل، رحلة الـ ٩٠ يوماً)، وسوق للمستثمرين.' },
  { id: 'who-for', category: 'getting-started', title: 'لمن صُنعت بذرة؟', content: 'روّاد الأعمال لأول مرة، وأصحاب المشاريع الجانبية الذين يختبرون فكرة، والعائلات التي تريد إطلاق مشروع جديد، والمستثمرون الملائكة الباحثون عن فرص مبكرة يسجّل أصحابها أدلة من عملائهم.' },
  { id: 'cost', category: 'getting-started', title: 'كم تكلّف؟', content: 'مجاني ($0): استكشف المنصة، وتصفّح مكتبة الأفكار، والتقط فكرة واحدة، وسجّل أدلة عملائك في متتبّع التحقق. برو ($9/شهر): تفاصيل الأفكار كاملة، والتقاط غير محدود، ومدرب AI حتى ١٥٠ رسالة/يوم، ونموذج الإيرادات، وتتبع الـ ٩٠ يوماً. نمو ($19/شهر): كل ما في برو + Pitch Deck AI، وربط مع المستثمرين. المسرعات: حلول مخصصة — تواصل معنا.' },
  { id: 'accelerator', category: 'getting-started', title: 'هل بذرة مسرّعة أعمال أو حاضنة؟', content: 'لا. لا نأخذ حصصاً من شركتك، ولا ندير دفعات، ولا نتحكم بجدولك الزمني. اعتبرنا عدّة أدواتك الريادية + سوق المستثمرين الخاص بك.' },
  { id: 'how-start', category: 'getting-started', title: 'كيف أبدأ؟', content: 'أنشئ حساباً مجانياً ← أضف فكرتك الأولى ← أكمل ملخص الفكرة (العنوان، القطاع، المشكلة، الحل، العميل المستهدف) ← سجّل أدلة من عملائك الحقيقيين. يرتفع مؤشر الجاهزية كلما سجّلت أدلة وأكملت مخططك وأرقامك المالية ورحلتك.' },
  { id: 'mobile', category: 'getting-started', title: 'هل يوجد تطبيق جوال؟', content: 'بذرة تطبيق ويب متجاوب بالكامل — يعمل ممتازاً على أي متصفح جوال. تطبيق iOS/Android أصلي على خارطة طريقنا.' },

  // Validation & Testing
  { id: 'validation-what', category: 'validation', title: 'ما هو التحقق ولماذا يهم؟', content: 'التحقق هو إثبات أن فكرتك تحل مشكلة حقيقية لأناس حقيقيين قبل أن تنفق المال على بنائها. بذرة لا تتحقق من فكرتك بنفسها: هي تتتبع الأدلة التي تسجّلها أنت — مقابلات العملاء، والملاحظات، وتسجيلات الاهتمام، والطلبات المسبقة — وتحتسبها في مؤشر الجاهزية. القراءة الأولى بالذكاء الاصطناعي رأيٌ من الذكاء الاصطناعي وليست دليلاً من العملاء، ولا تدخل في المؤشر.' },
  { id: 'ai-first-read', category: 'validation', title: 'ما هي «القراءة الأولى بالذكاء الاصطناعي»؟', content: 'نتيجة اختبار الفكرة السريع (٥ أسئلة) هي رأيٌ من الذكاء الاصطناعي يساعدك على معرفة أكبر خطر تبدأ باختباره مع عملاء حقيقيين. هي ليست تحققاً، ولا دليلاً من العملاء، ولا تدخل في مؤشر الجاهزية، وقد تخطئ. ما يرفع مؤشرك فعلاً هو الأدلة التي تجمعها من العملاء.' },
  { id: 'validation-how', category: 'validation', title: 'كيف أسجّل نشاط تحقق؟', content: 'اذهب إلى الرحلة ← التحقق ← «سجّل نشاط تحقق جديد». اختر النوع (مقابلة، ملاحظة، تسجيل اهتمام، طلب مسبق)، واكتب مع مَن تحدّثت (اسماً أو صفة أو جهة) وما تعلمته بكلماتك. متتبّع التحقق مجاني في كل الخطط. استهدف ٥ أدلة عملاء على الأقل، بينها تسجيل اهتمام أو طلب مسبق واحد، قبل توليد عرضك التمويلي.' },
  { id: 'validation-types', category: 'validation', title: 'ما الذي يُحتسب نشاط تحقق؟', content: 'المقابلات والملاحظات (ما قاله الناس)، وتسجيلات الاهتمام والطلبات المسبقة (ما فعله الناس) — كلها تُحتسب في مؤشر الجاهزية. وتُوزن الأفعال بقدر ما يُوزن الكلام. لكل نشاط خانة «مع مَن» (مطلوبة)، ورابط إثبات اختياري للتسجيلات والطلبات المسبقة، وخطوة تالية اختيارية. والأنشطة القديمة التي لا «مع مَن» لها تظهر عليها علامة لإضافتها. كلما كان ما تسجّله أدق وأقرب لسلوك حقيقي، كان أنفع لك.' },
  { id: 'validation-min', category: 'validation', title: 'كم نشاط تحقق أحتاج؟', content: 'تحتاج ٥ أدلة عملاء على الأقل، بينها تسجيل اهتمام أو طلب مسبق واحد، لفتح العرض التمويلي والنشر في السوق (هذه قاعدة مؤقتة قد تتغير). القراءة الأولى بالذكاء الاصطناعي لا تُحتسب ضمنها.' },

  // Marketplace & Investors
  { id: 'marketplace-how', category: 'marketplace', title: 'كيف يعمل سوق المستثمرين؟', content: 'مؤسسو خطة نمو ينشرون عرضهم في السوق. يتصفح المستثمرون المسجّلون أفكاراً سجّل أصحابها أدلة من عملائهم (مؤشر الجاهزية ٨٠ فأكثر)، ويصفّون حسب القطاع والدرجة ويرتّبون بالأعلى درجة أو الأحدث، ثم يطلبون التواصل. إذا وافق المؤسس، تُفتح محادثة خاصة. ما يُعرض من أدلة وأرقام يسجّله أصحاب الأفكار بأنفسهم ولا تتحقق منه بذرة.' },
  { id: 'info-before', category: 'marketplace', title: 'ماذا يرى المستثمرون قبل التواصل؟', content: 'اسم الفكرة واسم المشروع والقطاع والمرحلة والمدينة ومؤشر الجاهزية وتاريخ العرض. بقية التفاصيل — مثل الأدلة التي سجّلها المؤسس ونموذج عمله وبياناته المالية — لا تُكشف إلا بعد قبول الطرفين.' },
  { id: 'cut', category: 'marketplace', title: 'هل تأخذ بذرة نسبة من الصفقات؟', content: 'لا. بذرة منصّة عرض وتواصل فقط؛ لسنا طرفاً في أي صفقة ولا نقدّم استشارة استثمار، ولا نأخذ عمولة على الصفقات. كل الشروط تُتفاوض مباشرة.' },
  { id: 'legitimate', category: 'marketplace', title: 'كيف أعرف أن الأفكار جادة؟', content: 'لا تتحقق بذرة من صحة ما يكتبه المؤسسون، وكل الأدلة والأرقام المعروضة يسجّلها أصحاب الأفكار بأنفسهم. مؤشر الجاهزية يعكس مقدار ما سجّله المؤسس وأنجزه، وليس تقييماً مستقلاً لجودة الفكرة. تحقّق بنفسك قبل أي قرار استثماري.' },
  { id: 'publish-requirements', category: 'marketplace', title: 'ماذا أحتاج للنشر في السوق؟', content: 'تحتاج خطة نمو ($19/شهر)، ومؤشر الجاهزية ٨٠ فأكثر، و٥ أدلة عملاء على الأقل بينها تسجيل اهتمام أو طلب مسبق واحد، وإكمال ٧٠٪ من مخططك، وإدخال توقعاتك المالية. هذه الشروط تضمن أن ما يراه المستثمرون مبني على ما سجّله المؤسس فعلاً، ولا تعني أن بذرة تضمن جودة الفكرة.' },

  // Ideas Library
  { id: 'ideas-library', category: 'ideas-library', title: 'ما هي مكتبة الأفكار؟', content: 'أكثر من ٢٥ فكرة مشروع في قطاعات متعددة. كل فكرة تتضمن: المشكلة، والحل، والسوق المستهدف، ونموذج الإيرادات. احجز فكرة، وخصّصها لسوقك، وابدأ البناء — وسجّل أدلتك من عملائك أنت.' },
  { id: 'ideas-library-use', category: 'ideas-library', title: 'هل يمكنني استخدام فكرة من المكتبة كفكرتي الخاصة؟', content: 'نعم! أفكار المكتبة نقاط انطلاق. عندما تحجز فكرة تُنسخ إلى قسم أفكاري. خصّص كل حقل ليطابق سوقك المحلي وخبرتك ونهجك الفريد.' },
  { id: 'ideas-library-iq', category: 'ideas-library', title: 'هل تأتي أفكار المكتبة بمؤشر جاهزية؟', content: 'لا. أفكار المكتبة نقاط انطلاق ولا تحمل مؤشر جاهزية. يُحسب مؤشرك بعد أن تسجّل أدلة من عملائك وتكمل مخططك وأرقامك المالية ورحلتك.' },

  // AI Coach
  { id: 'ai-coach-use', category: 'ai-coach', title: 'ما هو المدرّب الذكي؟', content: 'مستشارك الريادي على مدار الساعة بالذكاء الاصطناعي. اسأله أي شيء: كيف تسعّر منتجك، وأسئلة مقابلات العملاء، وهل نموذج عملك مستدام، وكيف تصل إلى أول ١٠ عملاء.' },
  { id: 'ai-coach-limitations', category: 'ai-coach', title: 'ما حدود المدرّب الذكي؟', content: 'المدرّب الذكي يقدم إرشاداً ريادياً عاماً — وليس نصيحة مالية أو قانونية أو استثمارية. استشر دائماً مختصاً مؤهلاً في القرارات ذات الأثر القانوني أو المالي.' },
  { id: 'ai-coach-plans', category: 'ai-coach', title: 'أي الخطط تشمل المدرّب الذكي؟', content: 'الخطة المجانية تمنحك ١٠ رسائل/يوم. الخطط المدفوعة تمنحك حتى ١٥٠ رسالة/يوم (و٣٠ رسالة في الساعة) مع نصائح واعية بسياقك (يقرأ مخططك وبيانات تحققك). خطة نمو تضيف تحليل SWOT المتقدم وPitch Deck AI.' },
  { id: 'ai-coach-stress', category: 'ai-coach', title: 'ما هو وضع اختبار الضغط؟', content: 'وضع اختبار الضغط يتحدى فكرتك بأسئلة صعبة — من النوع الذي يسأله المستثمرون فعلاً. يحلل نموذج عملك بحثاً عن نقاط الضعف ويعطيك تقييماً واقعياً للمخاطر. استخدمه قبل أن تعرض على مستثمر.' },

  // Account & Billing
  { id: 'upgrade', category: 'account', title: 'كيف أرقّي خطتي؟', content: 'للترقية افتح صفحة الأسعار واختر الخطة المناسبة، ويبدأ الاشتراك فوراً. لتغيير خطة قائمة أو إلغائها راسل info@bethra.co.' },
  { id: 'cancel', category: 'account', title: 'هل يمكنني الإلغاء في أي وقت؟', content: 'نعم. بلا عقود وبلا رسوم إلغاء. تبقى بياناتك متاحة ٣٠ يوماً بعد الإلغاء.' },
  { id: 'delete', category: 'account', title: 'كيف أحذف حسابي؟', content: 'لحذف حسابك راسل info@bethra.co ونحذف بياناتك خلال ٣٠ يوماً.' },

  // Privacy & Security
  { id: 'data-safe', category: 'privacy', title: 'هل بياناتي آمنة؟', content: 'نعم. تستخدم بذرة تشفيراً أثناء النقل (TLS) وحمايةً للبيانات المخزّنة. لا نبيع بياناتك أبداً، وتُعالَج أفكارك بالذكاء الاصطناعي لتقديم الخدمة فقط، ونولّد إثباتاً زمنياً لحماية ملكيتك الفكرية.' },
  { id: 'idea-protection', category: 'privacy', title: 'من يستطيع رؤية أفكاري؟', content: 'أفكارك خاصة افتراضياً — لا يرى عرضك أحد إلا عند نشره في سوق المستثمرين (يتطلب النشر خطة نمو). يظهر عرضك للمستثمرين المسجّلين عند نشره في السوق؛ تفاصيل التواصل تُتبادل بعد قبول الطلب.' },
  { id: 'investor-identity', category: 'privacy', title: 'هل يعرف المستثمرون هويتي قبل التواصل؟', content: 'لا. يرى المستثمرون فكرتك ومؤشر جاهزيتها قبل التواصل، لكن اسمك وبيانات تواصلك وبياناتك الكاملة تبقى مخفية حتى تقبل طلبهم.' },
  { id: 'data-delete', category: 'privacy', title: 'ماذا يحدث لبياناتي إذا ألغيت؟', content: 'عند إلغاء الاشتراك يعود حسابك إلى الخطة المجانية وتبقى بياناتك محفوظة. لتصدير بياناتك أو حذفها راسل info@bethra.co.' },
];

export default function HelpCenterPage() {
  const [search, setSearch] = useState('');
  const [openArticle, setOpenArticle] = useState<string | false>(false);
  useSEO({
    title: 'مركز المساعدة — بذرة',
    description: 'إجابات عن الأسئلة الشائعة حول بذرة — من البداية وإدارة أفكارك إلى الفوترة والتواصل وإعدادات الحساب.',
    canonicalPath: '/help',
  });

  const filtered = ARTICLES.filter(a =>
    !search || a.title.toLowerCase().includes(search.toLowerCase()) || a.content.toLowerCase().includes(search.toLowerCase())
  );

  const grouped: Record<string, Article[]> = {};
  filtered.forEach(a => {
    if (!grouped[a.category]) grouped[a.category] = [];
    grouped[a.category].push(a);
  });

  const categoryLabels: Record<string, string> = {
    'getting-started': 'البداية',
    validation: 'التحقق والاختبار',
    marketplace: 'السوق والمستثمرون',
    'ideas-library': 'مكتبة الأفكار',
    'ai-coach': 'المدرّب الذكي',
    account: 'الحساب والفوترة',
    privacy: 'الخصوصية والأمان',
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <NavBar />

      <Box sx={{ pt: { xs: 10, md: 13 }, pb: 6, bgcolor: 'grey.50', textAlign: 'center' }}>
        <Container maxWidth="md">
          <Typography variant="h1" fontWeight={800} gutterBottom sx={{ fontSize: { xs: '2rem', md: '3rem' } }}>مركز المساعدة</Typography>
          <Typography color="text.secondary" sx={{ mb: 4, fontSize: '1.1rem' }}>كل ما تحتاج معرفته عن بذرة.</Typography>
          <TextField
            placeholder="ابحث عن إجابة..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            fullWidth
            sx={{ maxWidth: 600, bgcolor: 'white', mx: 'auto', display: 'block', '& .MuiOutlinedInput-root': { borderRadius: 3, fontSize: '1.0625rem' } }}
            slotProps={{
              input: {
                startAdornment: (
                  <InputAdornment position="start"><SearchIcon color="action" /></InputAdornment>
                ),
              },
            }}
          />
        </Container>
      </Box>

      <Box sx={{ py: 6, flex: 1 }}>
        <Container maxWidth="lg">
          {!search && (
            <>
              <Grid container spacing={2.5} sx={{ mb: 7 }}>
                {CATEGORIES.map(cat => (
                  <Grid size={{ xs: 12, sm: 6, md: 4 }} key={cat.title}>
                    <Card sx={{ height: '100%', transition: 'all 150ms ease', '&:hover': { boxShadow: 4, transform: 'translateY(-2px)' } }}>
                      <CardActionArea sx={{ p: 2.5, height: '100%', display: 'flex', alignItems: 'flex-start' }}>
                        <Stack direction="row" spacing={2} alignItems="flex-start" sx={{ width: '100%' }}>
                          <Box sx={{ width: 52, height: 52, borderRadius: 2, bgcolor: cat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: cat.color, flexShrink: 0 }}>
                            {cat.icon}
                          </Box>
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography variant="subtitle1" fontWeight={700}>{cat.title}</Typography>
                            <Typography variant="body2" color="text.secondary">{cat.desc}</Typography>
                          </Box>
                          <ArrowForwardIosIcon sx={{ color: 'text.disabled', fontSize: 14, mt: 0.5, flexShrink: 0 }} />
                        </Stack>
                      </CardActionArea>
                    </Card>
                  </Grid>
                ))}
              </Grid>
              <Divider sx={{ mb: 5 }} />
            </>
          )}

          {Object.entries(grouped).map(([cat, articles]) => (
            <Box key={cat} sx={{ mb: 5 }}>
              <Typography variant="h5" fontWeight={700} sx={{ mb: 2.5 }}>{categoryLabels[cat] ?? cat}</Typography>
              <Stack spacing={1.5}>
                {articles.map(article => (
                  <Accordion key={article.id} expanded={openArticle === article.id}
                    onChange={(_, exp) => setOpenArticle(exp ? article.id : false)}
                    sx={{ border: '1px solid', borderColor: 'divider', '&.Mui-expanded': { boxShadow: 2 } }}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ py: 0.5 }}>
                      <Typography fontWeight={600}>{article.title}</Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Typography color="text.secondary" sx={{ lineHeight: 1.75, mb: 2.5 }}>{article.content}</Typography>
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <Typography variant="body2" color="text.secondary">هل كانت هذه الإجابة مفيدة؟</Typography>
                        <Button size="small" variant="outlined" sx={{ py: 0.25, px: 1.5, minWidth: 0, fontSize: '0.8125rem' }}>نعم</Button>
                        <Button size="small" variant="outlined" sx={{ py: 0.25, px: 1.5, minWidth: 0, fontSize: '0.8125rem' }}>لا</Button>
                      </Stack>
                    </AccordionDetails>
                  </Accordion>
                ))}
              </Stack>
            </Box>
          ))}

          {search && filtered.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Typography color="text.secondary" sx={{ mb: 2 }}>لا نتائج لـ «{search}»</Typography>
              <Button onClick={() => setSearch('')} variant="outlined">امسح البحث</Button>
            </Box>
          )}

          <Divider sx={{ my: 5 }} />
          <Card sx={{ textAlign: 'center', p: 2, bgcolor: 'grey.50' }}>
            <CardContent>
              <Typography variant="h5" fontWeight={700} gutterBottom>ما زلت تحتاج مساعدة؟</Typography>
              <Typography color="text.secondary" sx={{ mb: 3 }}>فريقنا متاح من الأحد إلى الخميس. واتساب أسرع طريقة للوصول إلينا.</Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center" alignItems="center">
                <Button
                  component="a"
                  href="https://wa.me/14804476256"
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="contained"
                  startIcon={<WhatsAppIcon />}
                  sx={{ bgcolor: '#25D366', '&:hover': { bgcolor: '#1ebe5c' }, fontWeight: 700, px: 3 }}
                >
                  تواصل معنا عبر واتساب
                </Button>
                <Stack direction="row" spacing={1} alignItems="center">
                  <EmailIcon sx={{ color: 'primary.main', fontSize: 20 }} />
                  <Typography fontWeight={600} color="primary.main">info@bethra.co</Typography>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Container>
      </Box>

      <Footer />
    </Box>
  );
}
