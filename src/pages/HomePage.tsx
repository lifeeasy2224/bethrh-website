import { useState, useEffect, useRef } from 'react';
import GlobalStyles from '@mui/material/GlobalStyles';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Stack from '@mui/material/Stack';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CheckIcon from '@mui/icons-material/Check';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import SmartToyOutlinedIcon from '@mui/icons-material/SmartToyOutlined';
import CalendarMonthOutlinedIcon from '@mui/icons-material/CalendarMonthOutlined';
import AccountTreeOutlinedIcon from '@mui/icons-material/AccountTreeOutlined';
import FactCheckOutlinedIcon from '@mui/icons-material/FactCheckOutlined';
import AutoGraphIcon from '@mui/icons-material/AutoGraph';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';
import LightbulbOutlinedIcon from '@mui/icons-material/LightbulbOutlined';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import RocketLaunchOutlinedIcon from '@mui/icons-material/RocketLaunchOutlined';
import AccountBalanceOutlinedIcon from '@mui/icons-material/AccountBalanceOutlined';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import HandshakeOutlinedIcon from '@mui/icons-material/HandshakeOutlined';
import ForumOutlinedIcon from '@mui/icons-material/ForumOutlined';
import BusinessCenterOutlinedIcon from '@mui/icons-material/BusinessCenterOutlined';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AgricultureOutlinedIcon from '@mui/icons-material/AgricultureOutlined';
import ComputerOutlinedIcon from '@mui/icons-material/ComputerOutlined';
import ShoppingCartOutlinedIcon from '@mui/icons-material/ShoppingCartOutlined';
import LocalHospitalOutlinedIcon from '@mui/icons-material/LocalHospitalOutlined';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import { Link } from 'react-router-dom';
import NavBar from '../components/NavBar';
import Footer from '../components/Footer';
import TestimonialsSection from '../components/TestimonialsSection';
import { useSiteContent } from '../hooks/useSiteContent';
import { useSEO } from '../hooks/useSEO';

const HERO_BG = '#0F3D24';
const GOLD = '#D4A653';
const NAVY = '#0F3D24';

const FEATURES = [
  { icon: <SmartToyOutlinedIcon sx={{ fontSize: 28 }} />, title: 'المدرّب الذكي', desc: 'مستشارك الريادي على مدار الساعة. اسأل عن أي شيء — التسعير، التحقق، المنافسين، تغيير الاتجاه.', color: '#D08A28', bg: '#FAF5E9' },
  { icon: <CalendarMonthOutlinedIcon sx={{ fontSize: 28 }} />, title: 'رحلة الـ ٩٠ يوماً', desc: 'خطة تنفيذ أسبوعاً بأسبوع — من أول مقابلة عميل حتى أول دولار.', color: '#1B6B3E', bg: '#DEEBE2' },
  { icon: <AccountTreeOutlinedIcon sx={{ fontSize: 28 }} />, title: 'مخطط نموذج العمل', desc: 'ابنِ نموذج عملك بصرياً مع حسابات مالية تلقائية.', color: '#1B6B3E', bg: '#DEEBE2' },
  { icon: <FactCheckOutlinedIcon sx={{ fontSize: 28 }} />, title: 'متتبّع التحقق', desc: 'سجّل المقابلات والتسجيلات والطلبات المسبقة. ابنِ دليلاً على أن الناس يريدون فكرتك.', color: '#2A8A52', bg: '#DEEBE2' },
  { icon: <AutoGraphIcon sx={{ fontSize: 28 }} />, title: 'درجة بذرة', desc: 'درجة بالذكاء الاصطناعي (٠–١٠٠) تخبرك أنت والمستثمرين بمدى جاهزية فكرتك.', color: '#D08A28', bg: '#F5EAD3' },
  { icon: <StorefrontOutlinedIcon sx={{ fontSize: 28 }} />, title: 'سوق المستثمرين', desc: 'حيث تلتقي الأفكار المتحقَّق منها بمستثمرين موثّقين. مصنّفة، مقيّمة، محمية.', color: '#C0392B', bg: '#F5DDD9' },
  { icon: <LightbulbOutlinedIcon sx={{ fontSize: 28 }} />, title: 'مكتبة الأفكار', desc: 'ليست لديك فكرة؟ تصفّح أكثر من ٢٠ فكرة مدروسة مسبقاً. احجز واحدة وانطلق.', color: '#2A8A52', bg: '#DEEBE2' },
  { icon: <GroupsOutlinedIcon sx={{ fontSize: 28 }} />, title: 'مجموعات الالتزام', desc: 'انضم إلى ٣–٥ روّاد في نفس الرحلة. متابعة أسبوعية. بلا أعذار.', color: '#96271B', bg: '#F5DDD9' },
];

const FOUNDER_STEPS = [
  { num: 1, icon: <LightbulbOutlinedIcon />, title: 'ازرع فكرتك', desc: 'احكِ لنا فكرتك بلغة بسيطة. لا حاجة لعرض تقديمي — فقط المشكلة والحل ولمن هي.' },
  { num: 2, icon: <FactCheckOutlinedIcon />, title: 'تحقق منها', desc: 'مدرّبنا الذكي يرشدك عبر مقابلات العملاء وبحث السوق والانطلاقة الأولى. تابع كل شيء في لوحة التحقق.' },
  { num: 3, icon: <BusinessCenterOutlinedIcon />, title: 'ابنِ نموذجك', desc: 'استخدم مخطط نموذج العمل لرسم الإيرادات والتكاليف والقنوات والشركاء. شاهد نقطة التعادل والعوائد المتوقعة — محسوبة تلقائياً.' },
  { num: 4, icon: <TrendingUpIcon />, title: 'ليكتشفك المستثمرون', desc: 'حين تبلغ درجتك ٨٠+، تُعرض فكرتك في سوق المستثمرين. المستثمرون يجدونك — بلا رسائل باردة، بلا استجداء.' },
];

const INVESTOR_STEPS = [
  { num: 1, icon: <SearchOutlinedIcon />, title: 'تصفّح السوق', desc: 'صفِّ حسب القطاع والعائد المتوقع ونقطة التعادل ودرجة بذرة. كل فكرة معروضة تم التحقق منها مسبقاً.' },
  { num: 2, icon: <HandshakeOutlinedIcon />, title: 'اطلب التواصل', desc: 'مهتم؟ اطلب التواصل. المؤسس يراجع ملفك ويقرر.' },
  { num: 3, icon: <ForumOutlinedIcon />, title: 'ابدأ الحوار', desc: 'باتفاق الطرفين تُفتح قناة خاصة. تفاوضا مباشرة — بذرة ليست طرفاً في الصفقة أبداً.' },
];

const SECTORS = [
  { label: 'الغذاء', icon: <AgricultureOutlinedIcon sx={{ fontSize: 16 }} />, color: '#2A8A52', bg: '#DEEBE2' },
  { label: 'البرمجيات', icon: <ComputerOutlinedIcon sx={{ fontSize: 16 }} />, color: '#1B6B3E', bg: '#DEEBE2' },
  { label: 'تجارة إلكترونية', icon: <ShoppingCartOutlinedIcon sx={{ fontSize: 16 }} />, color: '#2A8A52', bg: '#DEEBE2' },
  { label: 'تقنية مالية', icon: <AccountBalanceOutlinedIcon sx={{ fontSize: 16 }} />, color: '#2A8A52', bg: '#DEEBE2' },
  { label: 'تقنية التعليم', icon: <LightbulbOutlinedIcon sx={{ fontSize: 16 }} />, color: '#D08A28', bg: '#FAF5E9' },
  { label: 'الصحة', icon: <LocalHospitalOutlinedIcon sx={{ fontSize: 16 }} />, color: '#C0392B', bg: '#F5DDD9' },
  { label: 'اللوجستيات', icon: <LocalShippingOutlinedIcon sx={{ fontSize: 16 }} />, color: '#D08A28', bg: '#F5EAD3' },
  { label: 'الخدمات', icon: <HandshakeOutlinedIcon sx={{ fontSize: 16 }} />, color: '#8A8070', bg: '#F7F3EC' },
];

const SCORE_LEVELS = [
  { range: '٠–٤٩', level: 'بذرة', desc: 'مرحلة مبكرة — واصل التحقق', color: '#8A8070', bg: '#F7F3EC' },
  { range: '٥٠–٧٩', level: 'تنمو', desc: 'تتقدّم — ابنِ نموذجك', color: '#D08A28', bg: '#F5EAD3' },
  { range: '٨٠–١٠٠', level: 'جاهزة', desc: 'جاهزة للمستثمرين — انطلق!', color: '#1B6B3E', bg: '#DEEBE2' },
];

const FAQ_ITEMS = [
  { q: 'هل بذرة منصة استثمارية؟', a: 'لا. نحن سوق يربط المؤسسين بالمستثمرين. لا نتعامل مع الأموال، ولا نأخذ حصصاً، ولا نشارك في الصفقات أبداً.' },
  { q: 'هل أحتاج خطة عمل لأبدأ؟', a: 'إطلاقاً. تكفي فكرة — حتى لو غير مكتملة. سنساعدك على صياغتها.' },
  { q: 'ما الفرق بين بذرة ومسرّعات الأعمال؟', a: 'المسرّعات تأخذ حصة من شركتك وتسير على جدولها هي. بذرة تسير بإيقاعك أنت، وتُبقي القرار بيدك، وتكلّف جزءاً يسيراً مما كنت ستتنازل عنه من حصص.' },
  { q: 'هل يستطيع فريقي استخدام حساب واحد؟', a: 'نعم! خطة نمو تتيح حتى ٣ أعضاء يتعاونون على الأفكار معاً.' },
  { q: 'هل فكرتي محمية؟', a: 'نعم. كل فكرة تحصل على تاريخ إنشاء مسجّل وبياناتك مشفّرة ولا تُشارك أبداً دون موافقتك الصريحة. اطّلع على سياسة حماية الملكية الفكرية.' },
  { q: 'ماذا لو لم تكن لديّ فكرة؟', a: 'تصفّح مكتبة الأفكار — أكثر من ٢٠ فكرة مدروسة مسبقاً يمكنك حجزها وتخصيصها.' },
];

function StepCard({ num, icon, title, desc }: { num: number; icon: React.ReactNode; title: string; desc: string }) {
  return (
    <Box sx={{ display: 'flex', gap: 2.5, alignItems: 'flex-start' }}>
      <Box sx={{
        width: 48, height: 48, borderRadius: '50%', flexShrink: 0,
        background: 'linear-gradient(135deg, #1B6B3E, #D4A653)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800,
        fontSize: '1.125rem', fontFamily: '"Noto Kufi Arabic", "Nunito Sans", sans-serif',
      }}>
        {num}
      </Box>
      <Box>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
          <Box sx={{ color: 'primary.main', display: 'flex' }}>{icon}</Box>
          <Typography variant="h6" fontWeight={700}>{title}</Typography>
        </Stack>
        <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.7 }}>{desc}</Typography>
      </Box>
    </Box>
  );
}

function FounderSection({ t }: { t: (key: string) => string }) {
  const visible = t('home.founder.visible') !== 'false';
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { el.style.opacity = '1'; el.style.transform = 'translateY(0)'; } },
      { threshold: 0.15 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  if (!visible) return null;

  const photoUrl = t('home.founder.photo_url');
  const quote = t('home.founder.quote');
  const body = t('home.founder.body');
  const highlight = t('home.founder.highlight');
  const name = t('home.founder.name');
  const title = t('home.founder.title');

  return (
    <Box
      id="founder"
      sx={{
        bgcolor: '#0F3D24',
        borderTop: '1px solid #D4A653',
        borderBottom: '1px solid #D4A653',
        py: { xs: '60px', md: '60px' },
      }}
    >
      <Container maxWidth="lg" sx={{ maxWidth: '900px !important' }}>
        <Box
          ref={sectionRef}
          sx={{
            opacity: 0,
            transform: 'translateY(30px)',
            transition: 'opacity 0.5s ease, transform 0.5s ease',
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            alignItems: { xs: 'center', md: 'flex-start' },
            gap: { xs: 4, md: 6 },
          }}
        >
          {/* Photo */}
          <Box sx={{ flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Box
              sx={{
                width: { xs: 100, md: 140 },
                height: { xs: 100, md: 140 },
                borderRadius: '50%',
                border: '3px solid #D4A653',
                boxShadow: '0 0 18px rgba(212,166,83,0.35)',
                overflow: 'hidden',
                bgcolor: 'rgba(212,166,83,0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {photoUrl ? (
                <Box component="img" src={photoUrl} alt={name} sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <Typography sx={{ fontSize: { xs: '2.5rem', md: '3.5rem' } }}>👤</Typography>
              )}
            </Box>
          </Box>

          {/* Text */}
          <Box sx={{ textAlign: { xs: 'center', md: 'left' } }}>
            {/* Quote */}
            <Typography
              sx={{
                fontFamily: '"Noto Kufi Arabic", "Nunito Sans", sans-serif',
                fontStyle: 'italic',
                fontWeight: 500,
                fontSize: { xs: '1.05rem', md: '1.2rem' },
                color: '#D4A653',
                lineHeight: 1.6,
                mb: 2.5,
              }}
            >
              &ldquo;{quote}&rdquo;
            </Typography>

            {/* Body */}
            <Typography
              sx={{
                fontFamily: '"Noto Kufi Arabic", "Nunito Sans", sans-serif',
                fontWeight: 400,
                fontSize: { xs: '0.95rem', md: '1rem' },
                color: 'rgba(255,255,255,0.82)',
                lineHeight: 1.75,
                mb: 2.5,
              }}
            >
              {body}
            </Typography>

            {/* Highlighted line */}
            <Typography
              sx={{
                fontFamily: '"Noto Kufi Arabic", "Nunito Sans", sans-serif',
                fontWeight: 600,
                fontSize: { xs: '0.95rem', md: '1rem' },
                color: '#D4A653',
                lineHeight: 1.7,
                mb: 3,
              }}
            >
              {highlight}
            </Typography>

            {/* Name + Title */}
            <Box>
              <Typography
                sx={{
                  fontFamily: '"Noto Kufi Arabic", "Nunito Sans", sans-serif',
                  fontWeight: 700,
                  fontSize: { xs: '1rem', md: '1.05rem' },
                  color: 'white',
                  lineHeight: 1.3,
                }}
              >
                {name}
              </Typography>
              <Typography
                sx={{
                  fontFamily: '"Noto Kufi Arabic", "Nunito Sans", sans-serif',
                  fontWeight: 400,
                  fontSize: { xs: '0.85rem', md: '0.9rem' },
                  color: 'rgba(255,255,255,0.55)',
                  mt: 0.25,
                }}
              >
                {title}
              </Typography>
            </Box>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}

export default function HomePage() {
  const [howTab, setHowTab] = useState(0);
  const [faqOpen, setFaqOpen] = useState<string | false>(false);
  const { t } = useSiteContent();

  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (!hash) return;
    const el = document.getElementById(hash);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    el.classList.add('pulse-highlight');
    const timer = setTimeout(() => el.classList.remove('pulse-highlight'), 1200);
    return () => clearTimeout(timer);
  }, []);
  useSEO({
    title: 'بذرة — تحقق من فكرتك، ابنِ مشروعك، وموّله',
    description: 'اكتشف وتحقق من أفكار المشاريع بتحليل الذكاء الاصطناعي. ابنِ خطة إطلاق ٩٠ يوماً وتواصل مع المستثمرين — في مكان واحد.',
    canonicalPath: '/',
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'Bethra',
        url: 'https://bethra.co',
        potentialAction: {
          '@type': 'SearchAction',
          target: { '@type': 'EntryPoint', urlTemplate: 'https://bethra.co/ideas-library?search={search_term_string}' },
          'query-input': 'required name=search_term_string',
        },
      },
      {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: 'Bethra',
        url: 'https://bethra.co',
        logo: 'https://bethra.co/favicon.svg',
        sameAs: [],
        contactPoint: { '@type': 'ContactPoint', contactType: 'customer support', url: 'https://bethra.co/contact' },
      },
      {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: FAQ_ITEMS.map(item => ({
          '@type': 'Question',
          name: item.q,
          acceptedAnswer: { '@type': 'Answer', text: item.a },
        })),
      },
    ],
  });

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <GlobalStyles styles={{
        '@keyframes milestoneRing': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(212,166,83,0.55), 0 0 0 8px rgba(212,166,83,0.2)' },
          '50%': { boxShadow: '0 0 0 8px rgba(212,166,83,0.28), 0 0 0 16px rgba(212,166,83,0)' },
        },
      }} />
      <NavBar />

      {/* Hero */}
      <Box sx={{ bgcolor: HERO_BG, pt: { xs: 7, md: 9 }, pb: { xs: 6, md: 8 }, textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <Box sx={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(ellipse at 30% 50%, rgba(212,166,83,0.07) 0%, transparent 60%), radial-gradient(ellipse at 70% 20%, rgba(212,166,83,0.05) 0%, transparent 50%)', pointerEvents: 'none' }} />
        <Container maxWidth="md" sx={{ position: 'relative' }}>
          <Typography variant="h1" sx={{ color: 'white', fontWeight: 800, fontSize: { xs: '2.25rem', sm: '3rem', md: '3.5rem' }, lineHeight: 1.1, mb: 2, letterSpacing: '-0.02em' }}>
            {t('home.hero.title')}
          </Typography>
          <Typography variant="h5" sx={{ color: 'rgba(255,255,255,0.75)', mb: 4, maxWidth: 580, mx: 'auto', fontWeight: 400, lineHeight: 1.65, fontSize: { xs: '1rem', md: '1.125rem' } }}>
            {t('home.hero.subtitle')}
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center" sx={{ mb: 2.5 }}>
            <Button component={Link} to="/signup" variant="contained" size="large"
              sx={{ bgcolor: GOLD, color: NAVY, fontWeight: 700, px: 4, fontSize: '1rem', fontFamily: '"Noto Kufi Arabic", "Nunito Sans", sans-serif', boxShadow: 'none', '&:hover': { bgcolor: '#A07830', boxShadow: 'none' } }}>
              {t('home.hero.cta_founder')}
            </Button>
            <Button component={Link} to="/signup" variant="outlined" size="large"
              sx={{ borderColor: 'rgba(212,166,83,0.55)', color: 'rgba(255,255,255,0.90)', px: 4, fontSize: '1rem', fontFamily: '"Noto Kufi Arabic", "Nunito Sans", sans-serif', '&:hover': { borderColor: GOLD, bgcolor: 'rgba(212,166,83,0.08)' } }}>
              {t('home.hero.cta_investor')}
            </Button>
          </Stack>
          <Typography sx={{ color: 'rgba(255,255,255,0.50)', fontWeight: 300, fontSize: { xs: '0.8rem', sm: '0.8125rem' }, fontFamily: '"Noto Kufi Arabic", "Nunito Sans", sans-serif', mb: 4, letterSpacing: '0.01em' }}>
            {t('home.hero.supporting_line')}
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={0} justifyContent="center" alignItems="center" divider={<Box sx={{ mx: 2, color: 'rgba(255,255,255,0.2)', display: { xs: 'none', sm: 'block' } }}>|</Box>}>
            {[t('home.stats.ready')].map(stat => (
              <Typography key={stat} variant="body2" sx={{ color: 'rgba(255,255,255,0.60)', fontWeight: 500 }}>{stat}</Typography>
            ))}
          </Stack>
        </Container>
      </Box>

      {/* What is Bethra */}
      <Box sx={{ py: { xs: 8, md: 12 }, bgcolor: 'white' }}>
        <Container maxWidth="md">
          <Typography variant="h2" fontWeight={800} textAlign="center" gutterBottom sx={{ mb: 2 }}>
            {t('home.whatisit.heading')}
          </Typography>
          <Typography color="text.secondary" textAlign="center" sx={{ mb: 5, fontSize: '1.1rem', lineHeight: 1.7 }}>
            {t('home.whatisit.body')}
          </Typography>
          <Typography variant="h5" fontWeight={700} sx={{ mb: 3 }}>كيف؟</Typography>
          <Stack spacing={2.5} sx={{ mb: 5 }}>
            {[
              'نرشدك خلال التحقق من فكرتك (كي لا تهدر سنوات على شيء لا يريده أحد)',
              'نقيّم فكرتك بالذكاء الاصطناعي (ليجد المستثمرون الأفضل)',
              'نصلك بمستثمرين يناسبون قطاعك ومرحلتك',
            ].map(item => (
              <Stack key={item} direction="row" spacing={2} alignItems="flex-start">
                <CheckCircleIcon sx={{ color: 'success.main', mt: 0.25, flexShrink: 0 }} />
                <Typography sx={{ lineHeight: 1.7 }}>{item}</Typography>
              </Stack>
            ))}
          </Stack>
          <Box sx={{ textAlign: 'center', bgcolor: 'grey.50', borderRadius: 3, py: 4, px: 3, border: '1px solid', borderColor: 'divider' }}>
            <Typography variant="h5" fontWeight={700} sx={{ color: 'primary.main' }}>
              {t('home.whatisit.callout')}
            </Typography>
          </Box>
        </Container>
      </Box>

      {/* Who is it for */}
      <Box sx={{ py: { xs: 8, md: 12 }, bgcolor: '#0F3D24' }}>
        <Container maxWidth="lg">
          <Typography variant="h2" fontWeight={800} textAlign="center" sx={{ mb: 6, color: 'white', fontFamily: '"Noto Kufi Arabic", "Nunito Sans", sans-serif' }}>لمن صُنعت بذرة؟</Typography>
          <Grid container spacing={3}>
            {/* Founders */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Box sx={{ height: '100%', bgcolor: '#0F3D24', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                <Box sx={{ bgcolor: 'rgba(212,166,83,0.10)', borderBottom: '1px solid rgba(212,166,83,0.20)', p: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ width: 48, height: 48, borderRadius: 2, bgcolor: 'rgba(212,166,83,0.15)', border: '1px solid rgba(212,166,83,0.30)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <RocketLaunchOutlinedIcon sx={{ color: '#D4A653', fontSize: 24 }} />
                  </Box>
                  <Typography variant="h5" fontWeight={700} sx={{ color: 'white', fontFamily: '"Noto Kufi Arabic", "Nunito Sans", sans-serif' }}>لروّاد الأعمال</Typography>
                </Box>
                <Box sx={{ p: 3 }}>
                  <Typography sx={{ color: 'rgba(255,255,255,0.65)', mb: 2.5, lineHeight: 1.7, fontSize: '0.9375rem' }}>
                    لديك فكرة — ربما تسكن رأسك منذ شهور، أو خطرت لك اليوم. في الحالتين، تحتاج إلى:
                  </Typography>
                  <Stack spacing={1.5} sx={{ mb: 3 }}>
                    {[
                      'مسار واضح من الفكرة ← التحقق ← النموذج ← التمويل',
                      'مدرّب ذكاء اصطناعي يفهم الشركات الناشئة فعلاً',
                      'التزام ومتابعة',
                      'وصول إلى المستثمرين عندما تصبح جاهزاً',
                    ].map(item => (
                      <Stack key={item} direction="row" spacing={1.5} alignItems="flex-start">
                        <CheckIcon sx={{ color: '#D4A653', mt: 0.2, fontSize: 18, flexShrink: 0 }} />
                        <Typography variant="body2" sx={{ lineHeight: 1.6, color: 'rgba(255,255,255,0.80)' }}>{item}</Typography>
                      </Stack>
                    ))}
                  </Stack>
                  <Button component={Link} to="/signup" variant="contained" endIcon={<ArrowForwardIcon />}
                    sx={{ bgcolor: '#D4A653', color: '#0F3D24', fontFamily: '"Noto Kufi Arabic", "Nunito Sans", sans-serif', fontWeight: 700, textTransform: 'none', boxShadow: 'none', '&:hover': { bgcolor: '#A07830', boxShadow: 'none' } }}>
                    ابدأ البناء
                  </Button>
                </Box>
              </Box>
            </Grid>
            {/* Investors */}
            <Grid size={{ xs: 12, md: 6 }}>
              <Box sx={{ height: '100%', bgcolor: '#0F3D24', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                <Box sx={{ bgcolor: 'rgba(212,166,83,0.10)', borderBottom: '1px solid rgba(212,166,83,0.20)', p: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ width: 48, height: 48, borderRadius: 2, bgcolor: 'rgba(212,166,83,0.15)', border: '1px solid rgba(212,166,83,0.30)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <AccountBalanceOutlinedIcon sx={{ color: '#D4A653', fontSize: 24 }} />
                  </Box>
                  <Typography variant="h5" fontWeight={700} sx={{ color: 'white', fontFamily: '"Noto Kufi Arabic", "Nunito Sans", sans-serif' }}>للمستثمرين</Typography>
                </Box>
                <Box sx={{ p: 3 }}>
                  <Typography sx={{ color: 'rgba(255,255,255,0.65)', mb: 2.5, lineHeight: 1.7, fontSize: '0.9375rem' }}>
                    تبحث عن الفرصة الكبيرة القادمة — لكنك سئمت من:
                  </Typography>
                  <Stack spacing={1.5} sx={{ mb: 3 }}>
                    {[
                      'عروض تقديمية بلا أي تحقق',
                      'مؤسسين لم يكلّموا عميلاً واحداً',
                      'مئة صفقة سيئة لتجد واحدة جيدة',
                    ].map(item => (
                      <Stack key={item} direction="row" spacing={1.5} alignItems="flex-start">
                        <CheckIcon sx={{ color: '#D4A653', mt: 0.2, fontSize: 18, flexShrink: 0 }} />
                        <Typography variant="body2" sx={{ lineHeight: 1.6, color: 'rgba(255,255,255,0.80)' }}>{item}</Typography>
                      </Stack>
                    ))}
                  </Stack>
                  <Typography sx={{ color: 'white', fontWeight: 600, mb: 3, lineHeight: 1.7, fontSize: '0.9375rem' }}>
                    بذرة تتحقق من الأفكار مسبقاً قبل أن تراها أصلاً.
                  </Typography>
                  <Button component={Link} to="/signup" variant="outlined" endIcon={<ArrowForwardIcon />}
                    sx={{ borderColor: 'rgba(212,166,83,0.55)', color: '#D4A653', fontFamily: '"Noto Kufi Arabic", "Nunito Sans", sans-serif', fontWeight: 700, textTransform: 'none', '&:hover': { borderColor: '#D4A653', bgcolor: 'rgba(212,166,83,0.08)' } }}>
                    تصفّح الفرص
                  </Button>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Built for Founders Like You */}
      <Box id="built-for-founders" sx={{ py: { xs: 10, md: 12 }, bgcolor: '#0F3D24' }}>
        <Container maxWidth="lg">
          <Typography
            variant="h2"
            fontWeight={700}
            textAlign="center"
            sx={{ color: 'white', fontFamily: '"Noto Kufi Arabic", "Nunito Sans", sans-serif', mb: 2, fontSize: { xs: '1.875rem', md: '2.375rem' } }}
          >
            صُنعت لروّاد أعمال مثلك
          </Typography>
          <Typography
            textAlign="center"
            sx={{
              color: 'rgba(255,255,255,0.70)',
              fontFamily: '"Noto Kufi Arabic", "Nunito Sans", sans-serif',
              fontWeight: 400,
              fontSize: { xs: '0.9375rem', md: '1.0625rem' },
              mb: { xs: 6, md: 7 },
              maxWidth: 560,
              mx: 'auto',
              lineHeight: 1.7,
            }}
          >
            بذرة مصممة لروّاد الأعمال العرب في الشرق الأوسط وشمال أفريقيا.
          </Typography>
          <Grid container spacing={3} alignItems="stretch">
            {[
              {
                id: 'side-hustlers',
                emoji: '🌙',
                headline: 'تحقق قبل أن تستقيل',
                body: 'لديك وظيفة وفكرة. اختبرها في ٥ دقائق، وابنِ خطتك خلال ٤٨ ساعة، واحتفظ براتبك حتى يقف مشروعك على قدميه.',
                link: 'ابدأ التحقق ←',
              },
              {
                id: 'underrepresented-founders',
                emoji: '🤝',
                headline: 'بلا واسطة؟ لا مشكلة',
                body: 'موارد مركّزة على المنطقة، وذكاء سوق محلي، ومسار واضح نحو أول إيراد — لروّاد يبنون بلا علاقات ولا رأس مال عائلي.',
                link: 'ابدأ رحلتك ←',
              },
              {
                id: 'career-changers',
                emoji: '🔄',
                headline: 'مشروعك الأول لا يجب أن يكون تخميناً',
                body: 'خرّيج جديد أو تغيّر مسارك المهني؟ انتقل من «لديّ فكرة» إلى «لديّ خطة» في جلسة واحدة — بإرشاد ذكاء اصطناعي مضبوط على الأسواق العربية.',
                link: 'ابدأ الآن ←',
              },
            ].map((card) => (
              <Grid size={{ xs: 12, md: 4 }} key={card.headline}>
                <Box
                  id={card.id}
                  sx={{
                    height: '100%',
                    bgcolor: '#1B6B3E',
                    border: '1px solid rgba(212,166,83,0.2)',
                    borderRadius: '12px',
                    p: 4,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2,
                    transition: 'border-color 200ms ease, box-shadow 200ms ease, transform 200ms ease',
                    scrollMarginTop: '80px',
                    '&:hover': {
                      borderColor: '#D4A653',
                      boxShadow: '0 8px 32px rgba(212,166,83,0.15)',
                      transform: 'translateY(-4px)',
                    },
                    '@keyframes goldPulse': {
                      '0%': { boxShadow: '0 0 0 0 rgba(212,166,83,0.7)', borderColor: '#D4A653' },
                      '70%': { boxShadow: '0 0 0 10px rgba(212,166,83,0)', borderColor: '#D4A653' },
                      '100%': { boxShadow: '0 0 0 0 rgba(212,166,83,0)', borderColor: 'rgba(212,166,83,0.2)' },
                    },
                    '&.pulse-highlight': {
                      animation: 'goldPulse 1s ease-out forwards',
                    },
                  }}
                >
                  <Box sx={{ fontSize: '2rem', lineHeight: 1 }}>{card.emoji}</Box>
                  <Typography
                    sx={{
                      color: 'white',
                      fontFamily: '"Noto Kufi Arabic", "Nunito Sans", sans-serif',
                      fontWeight: 700,
                      fontSize: '1.125rem',
                      lineHeight: 1.4,
                    }}
                  >
                    {card.headline}
                  </Typography>
                  <Typography
                    sx={{
                      color: 'rgba(255,255,255,0.80)',
                      fontFamily: '"Noto Kufi Arabic", "Nunito Sans", sans-serif',
                      fontWeight: 400,
                      fontSize: '0.875rem',
                      lineHeight: 1.7,
                      flexGrow: 1,
                    }}
                  >
                    {card.body}
                  </Typography>
                  <Box
                    component={Link}
                    to="/validate"
                    sx={{
                      color: '#D4A653',
                      fontFamily: '"Noto Kufi Arabic", "Nunito Sans", sans-serif',
                      fontWeight: 700,
                      fontSize: '0.875rem',
                      textDecoration: 'none',
                      mt: 'auto',
                      '&:hover': { textDecoration: 'underline' },
                    }}
                  >
                    {card.link}
                  </Box>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* How It Works */}
      <Box sx={{ py: { xs: 8, md: 12 }, bgcolor: 'white' }}>
        <Container maxWidth="lg">
          <Typography variant="h2" fontWeight={800} textAlign="center" sx={{ mb: 6 }}>كيف تعمل بذرة</Typography>
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 6 }}>
            <Tabs value={howTab} onChange={(_, v) => setHowTab(v)} centered
              sx={{ '& .MuiTab-root': { fontSize: '1rem', fontWeight: 600, px: 4 } }}>
              <Tab label="لروّاد الأعمال" />
              <Tab label="للمستثمرين" />
            </Tabs>
          </Box>

          {howTab === 0 && (
            <Grid container spacing={4}>
              {FOUNDER_STEPS.map(step => (
                <Grid size={{ xs: 12, sm: 6 }} key={step.num}>
                  <StepCard {...step} />
                </Grid>
              ))}
            </Grid>
          )}
          {howTab === 1 && (
            <Grid container spacing={4} justifyContent="center">
              {INVESTOR_STEPS.map(step => (
                <Grid size={{ xs: 12, sm: 6, md: 4 }} key={step.num}>
                  <StepCard {...step} />
                </Grid>
              ))}
            </Grid>
          )}
        </Container>
      </Box>

      {/* Path to First $ — Milestone Progress */}
      <Box sx={{ py: { xs: 10, md: 12 }, bgcolor: '#0F3D24', textAlign: 'center' }}>
        <Container maxWidth="md">
          <Typography
            variant="h2"
            fontWeight={700}
            sx={{ color: 'white', fontFamily: '"Noto Kufi Arabic", "Nunito Sans", sans-serif', mb: 2, fontSize: { xs: '1.875rem', md: '2.5rem' } }}
          >
            مسارك نحو أول دولار
          </Typography>
          <Typography
            sx={{
              color: 'rgba(255,255,255,0.70)',
              fontFamily: '"Noto Kufi Arabic", "Nunito Sans", sans-serif',
              fontWeight: 400,
              fontSize: { xs: '0.9375rem', md: '1.0625rem' },
              mb: { xs: 7, md: 8 },
              maxWidth: 580,
              mx: 'auto',
              lineHeight: 1.7,
            }}
          >
            كل جلسة تدفعك خطوة للأمام. تابع تقدمك حتى أول دولار تكسبه.
          </Typography>

          {/* Desktop progress bar */}
          <Box sx={{ display: { xs: 'none', md: 'block' }, maxWidth: 900, mx: 'auto', mb: 6 }}>
            <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              {/* Connecting lines */}
              {/* Solid gold: node 1 → 2 */}
              <Box sx={{ position: 'absolute', top: 24, left: 'calc(10% + 24px)', width: 'calc(20% - 24px)', height: 3, bgcolor: '#D4A653', zIndex: 0 }} />
              {/* Dashed gold: node 2 → 3 */}
              <Box sx={{ position: 'absolute', top: 24, left: 'calc(30% + 24px)', width: 'calc(20% - 24px)', height: 3, zIndex: 0,
                backgroundImage: 'repeating-linear-gradient(90deg, #D4A653 0px, #D4A653 10px, transparent 10px, transparent 18px)' }} />
              {/* Dashed grey: node 3 → 4 */}
              <Box sx={{ position: 'absolute', top: 24, left: 'calc(50% + 24px)', width: 'calc(20% - 24px)', height: 3, zIndex: 0,
                backgroundImage: 'repeating-linear-gradient(90deg, #8A8070 0px, #8A8070 10px, transparent 10px, transparent 18px)' }} />
              {/* Dashed grey: node 4 → 5 */}
              <Box sx={{ position: 'absolute', top: 24, left: 'calc(70% + 24px)', width: 'calc(20% - 24px)', height: 3, zIndex: 0,
                backgroundImage: 'repeating-linear-gradient(90deg, #8A8070 0px, #8A8070 10px, transparent 10px, transparent 18px)' }} />

              {/* Nodes */}
              {[
                { emoji: '💡', label: 'الفكرة', caption: '٣ دقائق', state: 'done' },
                { emoji: '✅', label: 'تم التحقق', caption: '٥ دقائق', state: 'done' },
                { emoji: '📋', label: 'أول عرض', caption: '٤٨ ساعة', state: 'current' },
                { emoji: '👤', label: 'أول عميل', caption: 'الأسبوع ١–٢', state: 'upcoming' },
                { emoji: '💰', label: 'أول دولار', caption: 'الأسبوع ٢–٤', state: 'upcoming' },
              ].map((node) => (
                <Box key={node.label} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '20%', position: 'relative', zIndex: 1 }}>
                  <Box sx={{
                    width: 48, height: 48, borderRadius: '50%',
                    bgcolor: node.state === 'done' ? '#D4A653' : '#8A8070',
                    border: node.state === 'current' ? '2px solid #D4A653' : node.state === 'upcoming' ? '2px dashed #8A8070' : 'none',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.375rem',
                    animation: node.state === 'current' ? 'milestoneRing 2s ease-in-out infinite' : 'none',
                    flexShrink: 0,
                  }}>
                    {node.emoji}
                  </Box>
                  <Typography sx={{ color: 'white', fontFamily: '"Noto Kufi Arabic", "Nunito Sans", sans-serif', fontWeight: 600, fontSize: '0.8125rem', mt: 1.5, lineHeight: 1.2 }}>
                    {node.label}
                  </Typography>
                  <Typography sx={{ color: 'rgba(255,255,255,0.50)', fontFamily: '"Noto Kufi Arabic", "Nunito Sans", sans-serif', fontWeight: 300, fontSize: '0.75rem', mt: 0.5 }}>
                    {node.caption}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>

          {/* Mobile progress bar (vertical) */}
          <Box sx={{ display: { xs: 'flex', md: 'none' }, flexDirection: 'column', alignItems: 'flex-start', maxWidth: 260, mx: 'auto', mb: 6, position: 'relative' }}>
            {/* Vertical connector lines */}
            {/* solid gold: 1→2 */}
            <Box sx={{ position: 'absolute', left: 23, top: 48, height: 56, width: 3, bgcolor: '#D4A653', zIndex: 0 }} />
            {/* dashed gold: 2→3 */}
            <Box sx={{ position: 'absolute', left: 23, top: 152, height: 56, width: 3, zIndex: 0,
              backgroundImage: 'repeating-linear-gradient(180deg, #D4A653 0px, #D4A653 8px, transparent 8px, transparent 14px)' }} />
            {/* dashed grey: 3→4 */}
            <Box sx={{ position: 'absolute', left: 23, top: 256, height: 56, width: 3, zIndex: 0,
              backgroundImage: 'repeating-linear-gradient(180deg, #8A8070 0px, #8A8070 8px, transparent 8px, transparent 14px)' }} />
            {/* dashed grey: 4→5 */}
            <Box sx={{ position: 'absolute', left: 23, top: 360, height: 56, width: 3, zIndex: 0,
              backgroundImage: 'repeating-linear-gradient(180deg, #8A8070 0px, #8A8070 8px, transparent 8px, transparent 14px)' }} />

            {[
              { emoji: '💡', label: 'الفكرة', caption: '٣ دقائق', state: 'done' },
              { emoji: '✅', label: 'تم التحقق', caption: '٥ دقائق', state: 'done' },
              { emoji: '📋', label: 'أول عرض', caption: '٤٨ ساعة', state: 'current' },
              { emoji: '👤', label: 'أول عميل', caption: 'الأسبوع ١–٢', state: 'upcoming' },
              { emoji: '💰', label: 'أول دولار', caption: 'الأسبوع ٢–٤', state: 'upcoming' },
            ].map((node) => (
              <Box key={node.label} sx={{ display: 'flex', alignItems: 'center', gap: 2.5, mb: 2.5, position: 'relative', zIndex: 1 }}>
                <Box sx={{
                  width: 48, height: 48, borderRadius: '50%', flexShrink: 0,
                  bgcolor: node.state === 'done' ? '#D4A653' : '#8A8070',
                  border: node.state === 'current' ? '2px solid #D4A653' : node.state === 'upcoming' ? '2px dashed #8A8070' : 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.375rem',
                  animation: node.state === 'current' ? 'milestoneRing 2s ease-in-out infinite' : 'none',
                }}>
                  {node.emoji}
                </Box>
                <Box sx={{ textAlign: 'left' }}>
                  <Typography sx={{ color: 'white', fontFamily: '"Noto Kufi Arabic", "Nunito Sans", sans-serif', fontWeight: 600, fontSize: '0.875rem', lineHeight: 1.2 }}>
                    {node.label}
                  </Typography>
                  <Typography sx={{ color: 'rgba(255,255,255,0.50)', fontFamily: '"Noto Kufi Arabic", "Nunito Sans", sans-serif', fontWeight: 300, fontSize: '0.75rem', mt: 0.25 }}>
                    {node.caption}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>

          <Typography
            sx={{
              color: 'rgba(255,255,255,0.60)',
              fontFamily: '"Noto Kufi Arabic", "Nunito Sans", sans-serif',
              fontWeight: 300,
              fontStyle: 'italic',
              fontSize: { xs: '0.8125rem', md: '0.875rem' },
              mb: 4,
            }}
          >
            مسار مصمَّم يقودك نحو أول دولار.
          </Typography>

          <Button
            component={Link}
            to="/signup"
            size="large"
            sx={{
              bgcolor: '#D4A653',
              color: '#0F3D24',
              fontFamily: '"Noto Kufi Arabic", "Nunito Sans", sans-serif',
              fontWeight: 700,
              fontSize: '1rem',
              textTransform: 'none',
              px: 4,
              py: 1.5,
              borderRadius: 2,
              '&:hover': { bgcolor: '#A07830' },
            }}
          >
            ابدأ رحلتك ←
          </Button>
        </Container>
      </Box>

      {/* Features */}
      <Box sx={{ py: { xs: 8, md: 12 }, bgcolor: 'grey.50' }}>
        <Container maxWidth="lg">
          <Typography variant="h2" fontWeight={800} textAlign="center" sx={{ mb: 2 }}>{t('home.features.title')}</Typography>
          <Typography color="text.secondary" textAlign="center" sx={{ mb: 6 }}>{t('home.features.subtitle')}</Typography>
          <Grid container spacing={3}>
            {FEATURES.map(f => (
              <Grid size={{ xs: 12, sm: 6, md: 3 }} key={f.title}>
                <Card sx={{ height: '100%', transition: 'all 200ms ease', '&:hover': { transform: 'translateY(-3px)', boxShadow: 6, borderColor: 'primary.light' } }}>
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ width: 52, height: 52, borderRadius: 2.5, bgcolor: f.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: f.color, mb: 2 }}>
                      {f.icon}
                    </Box>
                    <Typography variant="h6" fontWeight={700} gutterBottom sx={{ fontSize: '1rem' }}>{f.title}</Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.65 }}>{f.desc}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>

      {/* Ideas Library Teaser */}
      <Box sx={{ py: { xs: 8, md: 10 }, bgcolor: 'white', textAlign: 'center' }}>
        <Container maxWidth="md">
          <LightbulbOutlinedIcon sx={{ fontSize: 48, color: '#D08A28', mb: 2 }} />
          <Typography variant="h2" fontWeight={800} sx={{ mb: 2 }}>
            {t('home.library.title')}
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 5, fontSize: '1.1rem' }}>
            {t('home.library.subtitle')}
          </Typography>
          <Stack direction="row" spacing={1} justifyContent="center" flexWrap="wrap" sx={{ gap: 1.5, mb: 5 }}>
            {SECTORS.map(s => (
              <Chip
                key={s.label}
                icon={<Box sx={{ color: `${s.color} !important`, display: 'flex' }}>{s.icon}</Box>}
                label={s.label}
                sx={{ bgcolor: s.bg, color: s.color, fontWeight: 600, border: `1px solid ${s.bg}`, fontSize: '0.8125rem', height: 32 }}
              />
            ))}
          </Stack>
          <Button component={Link} to="/ideas-library" variant="contained" size="large" endIcon={<ArrowForwardIcon />}>
            استكشف مكتبة الأفكار
          </Button>
        </Container>
      </Box>

      {/* IQ Score Explainer */}
      <Box sx={{ py: { xs: 8, md: 10 }, bgcolor: '#0F3D24' }}>
        <Container maxWidth="lg">
          <Grid container spacing={6} alignItems="center">
            <Grid size={{ xs: 12, md: 6 }}>
              <Typography variant="h2" fontWeight={800} sx={{ mb: 3, color: 'white', fontFamily: '"Noto Kufi Arabic", "Nunito Sans", sans-serif' }}>{t('home.score.title')}</Typography>
              <Typography sx={{ color: 'rgba(255,255,255,0.65)', mb: 4, lineHeight: 1.7, fontSize: '1.05rem' }}>
                {t('home.score.body')}
              </Typography>
              <Stack spacing={2} sx={{ mb: 4 }}>
                {SCORE_LEVELS.map(level => (
                  <Box key={level.range} sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 2, bgcolor: '#0F3D24', borderRadius: 2, border: '1px solid rgba(255,255,255,0.07)' }}>
                    <Box sx={{ width: 64, height: 36, borderRadius: 1.5, bgcolor: level.color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Typography sx={{ color: 'white', fontWeight: 700, fontSize: '0.75rem' }}>{level.range}</Typography>
                    </Box>
                    <Box>
                      <Typography fontWeight={700} sx={{ color: level.color, fontSize: '0.875rem' }}>{level.level}</Typography>
                      <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.55)' }}>{level.desc}</Typography>
                    </Box>
                  </Box>
                ))}
              </Stack>
              <Typography variant="h6" fontWeight={700} sx={{ mb: 2, color: 'white', fontFamily: '"Noto Kufi Arabic", "Nunito Sans", sans-serif' }}>ما الذي يؤثر على درجتك:</Typography>
              <Stack spacing={1}>
                {['التحقق من العملاء (مقابلات، تسجيلات، طلبات مسبقة)', 'اكتمال نموذج العمل', 'جودة التوقعات المالية', 'التقدم في رحلة الـ ٩٠ يوماً', 'تقييم المدرّب الذكي'].map(item => (
                  <Stack key={item} direction="row" spacing={1.5} alignItems="center">
                    <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#D4A653', flexShrink: 0 }} />
                    <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.65)' }}>{item}</Typography>
                  </Stack>
                ))}
              </Stack>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }} sx={{ display: 'flex', justifyContent: 'center' }}>
              <Box sx={{ position: 'relative', width: 280, height: 280 }}>
                <Box sx={{ width: 280, height: 280, borderRadius: '50%', background: 'linear-gradient(135deg, #0F3D24, #1B6B3E, #D4A653)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', boxShadow: '0 20px 60px rgba(212,166,83,0.20)' }}>
                  <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.875rem', fontWeight: 500, mb: 0.5 }}>درجة بذرة</Typography>
                  <Typography sx={{ color: 'white', fontSize: '5rem', fontWeight: 800, lineHeight: 1, fontFamily: '"Noto Kufi Arabic", "Nunito Sans", sans-serif' }}>88</Typography>
                  <Box sx={{ bgcolor: 'rgba(212,166,83,0.15)', border: '1px solid rgba(212,166,83,0.40)', borderRadius: 10, px: 2, py: 0.5, mt: 1 }}>
                    <Typography sx={{ color: '#D4A653', fontWeight: 700, fontSize: '0.8125rem' }}>جاهزة للعرض</Typography>
                  </Box>
                </Box>
              </Box>
            </Grid>
          </Grid>
        </Container>
      </Box>

      {/* Testimonials — real, curated, DB-backed (§1e). No hardcoded personas. */}
      <TestimonialsSection />

      {/* Why Founders Choose Bethra — Comparison Table */}
      <Box sx={{ py: { xs: 10, md: 12 }, bgcolor: '#0F3D24' }}>
        <Container maxWidth="md">
          <Typography
            variant="h2"
            fontWeight={700}
            textAlign="center"
            sx={{
              color: 'white',
              fontFamily: '"Noto Kufi Arabic", "Nunito Sans", sans-serif',
              fontSize: { xs: '1.875rem', md: '2.375rem' },
              mb: 6,
            }}
          >
            لماذا يختار الروّاد بذرة
          </Typography>

          <Box sx={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)' }}>
            {/* Header row */}
            <Box sx={{
              display: 'grid',
              gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr',
              bgcolor: '#0A2A19',
            }}>
              {['الميزة', 'بذرة', 'LivePlan', 'ChatGPT', 'Notion'].map((col, i) => (
                <Box key={col} sx={{
                  px: 2, py: 1.75,
                  borderRight: i < 4 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                  ...(i === 1 && { bgcolor: 'rgba(212,166,83,0.08)', borderLeft: '2px solid #D4A653' }),
                }}>
                  <Typography sx={{
                    fontFamily: '"Noto Kufi Arabic", "Nunito Sans", sans-serif',
                    fontWeight: 700,
                    fontSize: '0.8125rem',
                    color: i === 1 ? '#D4A653' : 'rgba(255,255,255,0.85)',
                    textAlign: i === 0 ? 'left' : 'center',
                  }}>
                    {col}
                  </Typography>
                </Box>
              ))}
            </Box>

            {/* Data rows */}
            {[
              { feature: 'التحقق من الفكرة في ٥ دقائق', ideaiq: '✓', liveplan: '✗', chatgpt: '✗', notion: '✗' },
              { feature: 'مسار نحو أول دولار', ideaiq: '✓', liveplan: '✗', chatgpt: '✗', notion: '✗' },
              { feature: 'تتبّع الإنجازات', ideaiq: '✓', liveplan: '✗', chatgpt: '✗', notion: '✗' },
              { feature: 'قوائم مهام أسبوعية', ideaiq: '✓', liveplan: '✗', chatgpt: '✗', notion: '✗' },
              { feature: 'بيانات أسواق المنطقة العربية', ideaiq: '✓', liveplan: 'جزئي', chatgpt: '✗', notion: '✗' },
              { feature: 'مدرّب ذكاء اصطناعي للشركات الناشئة', ideaiq: '✓', liveplan: '✗', chatgpt: 'عام', notion: '✗' },
              { feature: 'مصمم لروّاد الأعمال الأفراد', ideaiq: '✓', liveplan: '✗', chatgpt: '✗', notion: '✗' },
            ].map((row, rowIdx) => (
              <Box
                key={row.feature}
                sx={{
                  display: 'grid',
                  gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr',
                  bgcolor: rowIdx % 2 === 0 ? '#0F3D24' : 'rgba(15, 61, 36,0.6)',
                  borderTop: '1px solid rgba(255,255,255,0.05)',
                }}
              >
                {[row.feature, row.ideaiq, row.liveplan, row.chatgpt, row.notion].map((cell, colIdx) => {
                  const isBethra = colIdx === 1;
                  const isCheck = cell === '✓';
                  const isCross = cell === '✗';
                  const isPartial = cell === 'جزئي' || cell === 'عام';
                  return (
                    <Box key={colIdx} sx={{
                      px: 2, py: 1.5,
                      borderRight: colIdx < 4 ? '1px solid rgba(255,255,255,0.05)' : 'none',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: colIdx === 0 ? 'flex-start' : 'center',
                      ...(isBethra && { bgcolor: 'rgba(212,166,83,0.07)', borderLeft: '2px solid #D4A653' }),
                    }}>
                      <Typography sx={{
                        fontFamily: '"Noto Kufi Arabic", "Nunito Sans", sans-serif',
                        fontSize: '0.875rem',
                        color: isBethra && isCheck
                          ? '#D4A653'
                          : isCross
                            ? '#8A8070'
                            : isPartial
                              ? '#8A8070'
                              : 'rgba(255,255,255,0.85)',
                        fontStyle: isPartial ? 'italic' : 'normal',
                        fontWeight: isBethra && isCheck ? 700 : 400,
                      }}>
                        {cell}
                      </Typography>
                    </Box>
                  );
                })}
              </Box>
            ))}
          </Box>

          <Typography
            textAlign="center"
            sx={{
              mt: 5,
              mb: 3.5,
              color: 'rgba(255,255,255,0.80)',
              fontFamily: '"Noto Kufi Arabic", "Nunito Sans", sans-serif',
              fontWeight: 400,
              fontSize: { xs: '0.9375rem', md: '1.0625rem' },
              fontStyle: 'italic',
              lineHeight: 1.7,
            }}
          >
            بذرة هي المنصة الوحيدة التي تأخذك من فكرة خام إلى أول عميل يدفع.
          </Typography>

          <Box sx={{ display: 'flex', justifyContent: 'center' }}>
            <Button
              component={Link}
              to="/signup"
              variant="contained"
              size="large"
              sx={{
                bgcolor: '#D4A653',
                color: '#0F3D24',
                fontFamily: '"Noto Kufi Arabic", "Nunito Sans", sans-serif',
                fontWeight: 700,
                px: 4,
                py: 1.5,
                borderRadius: 2,
                '&:hover': { bgcolor: '#A07830' },
              }}
            >
              ابدأ مجاناً — بلا بطاقة ائتمان
            </Button>
          </Box>
        </Container>
      </Box>

      {/* FAQ */}
      <Box sx={{ py: { xs: 8, md: 10 }, bgcolor: 'white' }}>
        <Container maxWidth="md">
          <Typography variant="h2" fontWeight={800} textAlign="center" sx={{ mb: 6 }}>الأسئلة الشائعة</Typography>
          <Stack spacing={1.5}>
            {FAQ_ITEMS.map(item => (
              <Accordion
                key={item.q}
                expanded={faqOpen === item.q}
                onChange={(_, exp) => setFaqOpen(exp ? item.q : false)}
                sx={{ border: '1px solid', borderColor: 'divider', '&.Mui-expanded': { boxShadow: 2 } }}
              >
                <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ py: 0.5 }}>
                  <Typography fontWeight={600} sx={{ fontSize: '1rem' }}>{item.q}</Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography color="text.secondary" sx={{ lineHeight: 1.75 }}>{item.a}</Typography>
                </AccordionDetails>
              </Accordion>
            ))}
          </Stack>
        </Container>
      </Box>

      {/* Final CTA */}
      <Box sx={{ bgcolor: HERO_BG, py: { xs: 8, md: 10 }, textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <Box sx={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(ellipse at 50% 0%, rgba(212,166,83,0.06) 0%, transparent 60%)', pointerEvents: 'none' }} />
        <Container maxWidth="sm" sx={{ position: 'relative' }}>
          <Typography variant="h2" fontWeight={800} color="white" gutterBottom sx={{ mb: 5 }}>{t('home.cta.title')}</Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} justifyContent="center">
            <Button component={Link} to="/signup" variant="contained" size="large"
              sx={{ bgcolor: GOLD, color: NAVY, fontWeight: 700, px: 4, fontFamily: '"Noto Kufi Arabic", "Nunito Sans", sans-serif', boxShadow: 'none', '&:hover': { bgcolor: '#A07830', boxShadow: 'none' } }}>
              {t('home.cta.btn1')}
            </Button>
            <Button component={Link} to="/#how-it-works" variant="outlined" size="large"
              sx={{ borderColor: 'rgba(212,166,83,0.55)', color: 'rgba(255,255,255,0.90)', px: 4, fontFamily: '"Noto Kufi Arabic", "Nunito Sans", sans-serif', '&:hover': { borderColor: GOLD, bgcolor: 'rgba(212,166,83,0.08)' } }}
              onClick={e => { e.preventDefault(); document.querySelector('#how-it-works')?.scrollIntoView({ behavior: 'smooth' }); }}>
              {t('home.cta.btn2')}
            </Button>
          </Stack>
        </Container>
      </Box>

      <FounderSection t={t} />

      <Footer />
    </Box>
  );
}
