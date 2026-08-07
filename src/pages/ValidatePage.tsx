import { useState, useEffect, useRef } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Container from '@mui/material/Container';
import Divider from '@mui/material/Divider';
import CircularProgress from '@mui/material/CircularProgress';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import TwitterIcon from '@mui/icons-material/X';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import CheckIcon from '@mui/icons-material/Check';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { Link, useNavigate } from 'react-router-dom';
import BethraLogo from '../components/BethraLogo';
import { useSEO } from '../hooks/useSEO';
import { supabase } from '../supabase';
import { useAuth } from '../contexts/AuthContext';
import { sendEmail } from '../lib/sendEmail';
import { buildIdeaPayload, createUserIdea, stashPendingIdea } from '../lib/pendingIdea';

const NAVY = '#0F3D24';
const CARD_BG = '#1B6B3E';
const GOLD = '#D4A653';

const QUESTIONS = [
  {
    step: 1,
    question: 'صِف فكرتك في جملة واحدة',
    helper: 'لا تفكر كثيراً — فقط جوهر الفكرة.',
    type: 'text' as const,
    placeholder: 'مثال: تطبيق يساعد المستقلّين على إيجاد أول عميل لهم...',
    isLast: false,
  },
  {
    step: 2,
    question: 'من سيدفع مقابل هذا؟',
    helper: 'اختر الأقرب لعميلك المستهدف.',
    type: 'single' as const,
    options: ['موظفون ومهنيون', 'طلاب وشباب', 'أصحاب مشاريع صغيرة', 'آباء وعائلات', 'غير ذلك'],
    isLast: false,
  },
  {
    step: 3,
    question: 'كيف ستصل إلى أول ١٠ عملاء؟',
    helper: 'اختر قناتك الأساسية للوصول للعملاء.',
    type: 'single' as const,
    options: ['السوشال ميديا والمحتوى', 'التوصيات وكلام الناس', 'إعلانات مدفوعة', 'المجتمعات والمنتديات (واتساب، تيليغرام)', 'لا أعرف بعد'],
    isLast: false,
  },
  {
    step: 4,
    question: 'هل يمكن أن يدفع لك أحد خلال ٣٠ يوماً؟',
    helper: 'كن صادقاً — هذا يؤثر على درجتك.',
    type: 'grid' as const,
    options: ['بالتأكيد', 'على الأرجح', 'ربما', 'مستبعد'],
    isLast: false,
  },
  {
    step: 5,
    question: 'ما أكبر عائق يواجهك الآن؟',
    helper: 'سنستخدم هذا لتخصيص نتائجك.',
    type: 'single' as const,
    options: ['لا أعرف من أين أبدأ', 'لا وقت لديّ — عندي وظيفة', 'أحتاج تحققاً أولاً', 'أحتاج خطة واضحة', 'الخوف من الفشل'],
    isLast: true,
  },
];

const TOTAL = QUESTIONS.length;

type Answers = Record<number, string>;
type Tier = 'high' | 'mid' | 'low';

interface AIAnalysis {
  score: number;
  verdict: string;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  market_size: string;
}

function computeScore(answers: Answers): { score: number; tier: Tier } {
  let pts = 0;

  // Step 1: word count
  const words = (answers[1] ?? '').trim().split(/\s+/).filter(w => w.length > 0).length;
  if (words > 10) pts += 2;
  else if (words >= 5) pts += 1;

  // Step 2: audience
  if (['موظفون ومهنيون', 'أصحاب مشاريع صغيرة'].includes(answers[2])) pts += 2;
  else if (answers[2]) pts += 1;

  // Step 3: channel
  if (['المجتمعات والمنتديات (واتساب، تيليغرام)', 'التوصيات وكلام الناس'].includes(answers[3])) pts += 2;
  else if (['السوشال ميديا والمحتوى', 'إعلانات مدفوعة'].includes(answers[3])) pts += 1;

  // Step 4: 30-day viability
  if (['بالتأكيد', 'على الأرجح'].includes(answers[4])) pts += 2;
  else if (answers[4] === 'ربما') pts += 1;

  // Step 5: blocker
  if (['أحتاج تحققاً أولاً', 'أحتاج خطة واضحة'].includes(answers[5])) pts += 2;
  else if (['لا أعرف من أين أبدأ', 'لا وقت لديّ — عندي وظيفة'].includes(answers[5])) pts += 1;

  const tier: Tier = pts >= 8 ? 'high' : pts >= 5 ? 'mid' : 'low';
  return { score: pts, tier };
}

const TIER_CONFIG = {
  high: {
    label: '🚀 جاهزة للانطلاق',
    color: GOLD,
    feedback: [
      '✅ فكرتك تملك إمكانات سوقية قوية',
      '✅ لديك مسار واضح للوصول إلى العملاء',
      '✅ أنت جاهز لخطة إيرادات كاملة — هيا نبنيها',
    ],
  },
  mid: {
    label: '🔧 تحتاج صقلاً',
    color: '#FFFFFF',
    feedback: [
      '💡 فكرتك واعدة لكنها تحتاج استهدافاً أدق',
      '💡 فكّر في تضييق جمهورك إلى فئة واحدة محددة',
      '💡 خطة الإيرادات ستساعدك على أسرع مسار نحو أول دولار',
    ],
  },
  low: {
    label: '🔄 فكّر في تغيير الاتجاه',
    color: '#B5AE9F',
    feedback: [
      '🔄 قد تحتاج فكرتك زاوية مختلفة',
      '🔄 جرّب التحدث مع ٥ عملاء محتملين هذا الأسبوع',
      '🔄 تصفّح مكتبة الأفكار لمفاهيم متحقَّق منها يمكنك حجزها',
    ],
  },
};

// ─── Animated number counter ──────────────────────────────────────────────────
function AnimatedNumber({ target, duration, color }: { target: number; duration: number; color: string }) {
  const [current, setCurrent] = useState(0);
  const startTime = useRef<number | null>(null);
  const rafId = useRef<number | null>(null);

  useEffect(() => {
    startTime.current = null;
    const timer = setTimeout(() => {
      const animate = (ts: number) => {
        if (!startTime.current) startTime.current = ts;
        const elapsed = ts - startTime.current;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        setCurrent(Math.round(eased * target));
        if (progress < 1) rafId.current = requestAnimationFrame(animate);
      };
      rafId.current = requestAnimationFrame(animate);
    }, 150);

    return () => {
      clearTimeout(timer);
      if (rafId.current) cancelAnimationFrame(rafId.current);
    };
  }, [target, duration]);

  return (
    <Typography sx={{
      fontFamily: '"Noto Kufi Arabic", "Nunito Sans", sans-serif',
      fontWeight: 900,
      fontSize: '4.5rem',
      color,
      lineHeight: 1,
      letterSpacing: '-0.02em',
    }}>
      {current}
    </Typography>
  );
}

// ─── SVG score gauge ───────────────────────────────────────────────────────────
function ScoreGauge({ score, tier }: { score: number; tier: Tier }) {
  const color = TIER_CONFIG[tier].color;
  const r = 82;
  const circumference = 2 * Math.PI * r;
  const [offset, setOffset] = useState(circumference);

  useEffect(() => {
    const timer = setTimeout(() => {
      setOffset(circumference * (1 - score / 10));
    }, 200);
    return () => clearTimeout(timer);
  }, [score, circumference]);

  return (
    <Box sx={{ position: 'relative', width: 200, height: 200, flexShrink: 0 }}>
      <svg width="200" height="200" viewBox="0 0 200 200" style={{ display: 'block' }}>
        <defs>
          <filter id="gauge-glow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {/* Track */}
        <circle cx="100" cy="100" r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="12" />
        {/* Fill arc */}
        <circle
          cx="100" cy="100" r={r}
          fill="none"
          stroke={color}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 100 100)"
          filter="url(#gauge-glow)"
          style={{ transition: 'stroke-dashoffset 1.5s cubic-bezier(0.4, 0, 0.2, 1)' }}
        />
      </svg>
      {/* Center content */}
      <Box sx={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        gap: 0,
      }}>
        <AnimatedNumber target={score} duration={1500} color={color} />
        <Typography sx={{
          fontFamily: '"Noto Kufi Arabic", "Nunito Sans", sans-serif',
          fontWeight: 300,
          fontSize: '0.875rem',
          color: 'rgba(255,255,255,0.5)',
          mt: -0.25,
        }}>
          / 10
        </Typography>
      </Box>
    </Box>
  );
}

// ─── Share button ──────────────────────────────────────────────────────────────
function ShareButton({ icon, label, onClick }: { icon: React.ReactNode; label: string; onClick: () => void }) {
  return (
    <Box
      onClick={onClick}
      sx={{
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5,
        cursor: 'pointer', flex: 1,
        bgcolor: CARD_BG, borderRadius: 2,
        border: '1px solid rgba(255,255,255,0.1)',
        py: 1.5, px: 1,
        transition: 'all 0.18s',
        '&:hover': { bgcolor: 'rgba(255,255,255,0.07)', borderColor: 'rgba(255,255,255,0.2)', transform: 'translateY(-1px)' },
        userSelect: 'none',
      }}
    >
      <Box sx={{ color: 'rgba(255,255,255,0.8)', display: 'flex', fontSize: 20 }}>{icon}</Box>
      <Typography sx={{ fontFamily: '"Noto Kufi Arabic", "Nunito Sans", sans-serif', fontWeight: 500, fontSize: '0.7rem', color: 'rgba(255,255,255,0.6)' }}>
        {label}
      </Typography>
    </Box>
  );
}

// ─── Journey card ──────────────────────────────────────────────────────────────
function JourneyCard({ num, title, subtitle }: { num: number; title: string; subtitle: string }) {
  return (
    <Box sx={{
      flex: 1, bgcolor: CARD_BG,
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: 2, p: 2,
      display: 'flex', flexDirection: 'column', gap: 0.75,
      minWidth: 0,
    }}>
      <Box sx={{
        width: 28, height: 28, borderRadius: '50%',
        background: `linear-gradient(135deg, ${GOLD} 0%, #A07830 100%)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        <Typography sx={{ fontFamily: '"Noto Kufi Arabic", "Nunito Sans", sans-serif', fontWeight: 900, fontSize: '0.7rem', color: NAVY }}>
          {num}
        </Typography>
      </Box>
      <Typography sx={{ fontFamily: '"Noto Kufi Arabic", "Nunito Sans", sans-serif', fontWeight: 700, fontSize: '0.8rem', color: 'white', lineHeight: 1.3 }}>
        {title}
      </Typography>
      <Typography sx={{ fontFamily: '"Noto Kufi Arabic", "Nunito Sans", sans-serif', fontWeight: 300, fontSize: '0.725rem', color: 'rgba(255,255,255,0.55)', lineHeight: 1.5 }}>
        {subtitle}
      </Typography>
    </Box>
  );
}

// ─── Analyzing loading screen ──────────────────────────────────────────────────
function AnalyzingScreen() {
  const [dots, setDots] = useState('');
  useEffect(() => {
    const t = setInterval(() => setDots(d => d.length >= 3 ? '' : d + '.'), 500);
    return () => clearInterval(t);
  }, []);

  return (
    <Box sx={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      minHeight: 340, gap: 3,
      '@keyframes fadeIn': { from: { opacity: 0 }, to: { opacity: 1 } },
      animation: 'fadeIn 0.4s ease',
    }}>
      <Box sx={{ position: 'relative', width: 80, height: 80 }}>
        <CircularProgress size={80} thickness={2} sx={{ color: GOLD, opacity: 0.2, position: 'absolute', top: 0, left: 0 }} variant="determinate" value={100} />
        <CircularProgress size={80} thickness={2} sx={{ color: GOLD, position: 'absolute', top: 0, left: 0 }} />
        <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.75rem' }}>
          🤖
        </Box>
      </Box>
      <Box sx={{ textAlign: 'center' }}>
        <Typography sx={{ fontFamily: '"Noto Kufi Arabic", "Nunito Sans", sans-serif', fontWeight: 700, fontSize: '1.25rem', color: 'white', mb: 1 }}>
          نحلّل فكرتك{dots}
        </Typography>
        <Typography sx={{ fontFamily: '"Noto Kufi Arabic", "Nunito Sans", sans-serif', fontWeight: 300, fontSize: '0.875rem', color: 'rgba(255,255,255,0.5)' }}>
          الذكاء الاصطناعي يقيّم فكرة مشروعك
        </Typography>
      </Box>
    </Box>
  );
}

// ─── Score color helper ────────────────────────────────────────────────────────
function scoreColor(score: number): string {
  if (score >= 7) return '#2A8A52';
  if (score >= 5) return '#D4A653';
  return '#C0392B';
}

// ─── AI Results view ───────────────────────────────────────────────────────────
function AIResultsView({
  analysis, isPaid, onRetake, onBack, onSave, saving, saveError,
}: {
  analysis: AIAnalysis;
  isPaid: boolean;
  onRetake: () => void;
  onBack: () => void;
  onSave: () => void;
  saving: boolean;
  saveError: string | null;
}) {
  const [copied, setCopied] = useState(false);
  const color = scoreColor(analysis.score);
  const scoreInt = Math.round(analysis.score);
  const shareText = `فكرة مشروعي حصلت على ${analysis.score}/10 في اختبار بذرة الذكي للأفكار! 🚀 اختبر فكرتك مجاناً: bethra.co/validate`;

  const handleTwitter = () => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`, '_blank', 'noopener');
  const handleLinkedIn = () => window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent('https://bethra.co/validate')}`, '_blank', 'noopener');
  const handleCopy = () => {
    navigator.clipboard.writeText(shareText).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  };

  return (
    <Box sx={{
      '@keyframes fadeUp': { from: { transform: 'translateY(24px)', opacity: 0 }, to: { transform: 'translateY(0)', opacity: 1 } },
      animation: 'fadeUp 0.45s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    }}>
      <Box onClick={onBack} sx={{
        display: 'inline-flex', alignItems: 'center', gap: 0.75, mb: 3,
        cursor: 'pointer', color: 'rgba(255,255,255,0.4)',
        '&:hover': { color: 'rgba(255,255,255,0.85)' }, transition: 'color 0.2s',
      }}>
        <ArrowBackIcon sx={{ fontSize: 16 }} />
        <Typography sx={{ fontFamily: '"Noto Kufi Arabic", "Nunito Sans", sans-serif', fontWeight: 400, fontSize: '0.8rem' }}>العودة للأسئلة</Typography>
      </Box>

      {/* Score hero */}
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
        <Box sx={{
          position: 'relative', width: 140, height: 140,
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          '&::before': {
            content: '""', position: 'absolute', inset: 0, borderRadius: '50%',
            background: `radial-gradient(circle, ${color}22 0%, transparent 70%)`,
          },
        }}>
          <Box sx={{ border: `3px solid ${color}`, borderRadius: '50%', width: 130, height: 130, position: 'absolute', boxShadow: `0 0 32px ${color}55` }} />
          <Typography sx={{ fontFamily: '"Noto Kufi Arabic", "Nunito Sans", sans-serif', fontWeight: 900, fontSize: '3.5rem', color, lineHeight: 1, letterSpacing: '-0.03em' }}>
            {analysis.score.toFixed(1)}
          </Typography>
          <Typography sx={{ fontFamily: '"Noto Kufi Arabic", "Nunito Sans", sans-serif', fontWeight: 300, fontSize: '0.8rem', color: 'rgba(255,255,255,0.45)' }}>
            / 10
          </Typography>
        </Box>
        <Box sx={{ mt: 2.5, px: 2.5, py: 0.75, bgcolor: `${color}18`, border: `1.5px solid ${color}55`, borderRadius: 99 }}>
          <Typography sx={{ fontFamily: '"Noto Kufi Arabic", "Nunito Sans", sans-serif', fontWeight: 700, fontSize: '0.875rem', color, letterSpacing: '0.01em' }}>
            {scoreInt >= 7 ? '🚀 إمكانات قوية' : scoreInt >= 5 ? '🔧 تحتاج صقلاً' : '🔄 فكّر في تغيير الاتجاه'}
          </Typography>
        </Box>
      </Box>

      {/* Verdict */}
      <Box sx={{ bgcolor: CARD_BG, borderRadius: 2.5, p: 2.5, mb: 2, border: '1px solid rgba(255,255,255,0.08)' }}>
        <Typography sx={{ fontFamily: '"Noto Kufi Arabic", "Nunito Sans", sans-serif', fontWeight: 700, fontSize: '0.7rem', color: GOLD, letterSpacing: '0.1em', textTransform: 'uppercase', mb: 1 }}>
          حكم الذكاء الاصطناعي
        </Typography>
        <Typography sx={{ fontFamily: '"Noto Kufi Arabic", "Nunito Sans", sans-serif', fontWeight: 600, fontSize: '0.9375rem', color: 'white', lineHeight: 1.6 }}>
          {analysis.verdict}
        </Typography>
      </Box>

      {/* Strengths */}
      <Box sx={{ bgcolor: CARD_BG, borderRadius: 2.5, p: 2.5, mb: 2, border: '1px solid rgba(42, 138, 82,0.2)' }}>
        <Typography sx={{ fontFamily: '"Noto Kufi Arabic", "Nunito Sans", sans-serif', fontWeight: 700, fontSize: '0.7rem', color: '#2A8A52', letterSpacing: '0.1em', textTransform: 'uppercase', mb: 1.5 }}>
          نقاط القوة
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {analysis.strengths.map((s, i) => (
            <Box key={i} sx={{ display: 'flex', gap: 1.25, alignItems: 'flex-start' }}>
              <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#2A8A52', mt: '7px', flexShrink: 0 }} />
              <Typography sx={{ fontFamily: '"Noto Kufi Arabic", "Nunito Sans", sans-serif', fontWeight: 400, fontSize: '0.875rem', color: 'rgba(255,255,255,0.85)', lineHeight: 1.6 }}>{s}</Typography>
            </Box>
          ))}
        </Box>
      </Box>

      {/* Weaknesses */}
      <Box sx={{ bgcolor: CARD_BG, borderRadius: 2.5, p: 2.5, mb: 2, border: '1px solid rgba(212, 166, 83,0.2)' }}>
        <Typography sx={{ fontFamily: '"Noto Kufi Arabic", "Nunito Sans", sans-serif', fontWeight: 700, fontSize: '0.7rem', color: '#D4A653', letterSpacing: '0.1em', textTransform: 'uppercase', mb: 1.5 }}>
          نقاط الضعف
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {analysis.weaknesses.map((w, i) => (
            <Box key={i} sx={{ display: 'flex', gap: 1.25, alignItems: 'flex-start' }}>
              <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#D4A653', mt: '7px', flexShrink: 0 }} />
              <Typography sx={{ fontFamily: '"Noto Kufi Arabic", "Nunito Sans", sans-serif', fontWeight: 400, fontSize: '0.875rem', color: 'rgba(255,255,255,0.85)', lineHeight: 1.6 }}>{w}</Typography>
            </Box>
          ))}
        </Box>
      </Box>

      {/* Suggestions */}
      <Box sx={{ bgcolor: CARD_BG, borderRadius: 2.5, p: 2.5, mb: 2, border: '1px solid rgba(42, 138, 82,0.2)' }}>
        <Typography sx={{ fontFamily: '"Noto Kufi Arabic", "Nunito Sans", sans-serif', fontWeight: 700, fontSize: '0.7rem', color: '#2A8A52', letterSpacing: '0.1em', textTransform: 'uppercase', mb: 1.5 }}>
          الخطوات التالية
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
          {analysis.suggestions.map((s, i) => (
            <Box key={i} sx={{ display: 'flex', gap: 1.25, alignItems: 'flex-start' }}>
              <Box sx={{
                width: 20, height: 20, borderRadius: '50%', bgcolor: '#2A8A5220', border: '1px solid #2A8A5250',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, mt: '2px',
              }}>
                <Typography sx={{ fontFamily: '"Noto Kufi Arabic", "Nunito Sans", sans-serif', fontWeight: 700, fontSize: '0.65rem', color: '#2A8A52' }}>{i + 1}</Typography>
              </Box>
              <Typography sx={{ fontFamily: '"Noto Kufi Arabic", "Nunito Sans", sans-serif', fontWeight: 400, fontSize: '0.875rem', color: 'rgba(255,255,255,0.85)', lineHeight: 1.6 }}>{s}</Typography>
            </Box>
          ))}
        </Box>
      </Box>

      {/* Market size */}
      <Box sx={{ bgcolor: `${GOLD}10`, borderRadius: 2.5, p: 2, mb: 3, border: `1px solid ${GOLD}30`, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Typography sx={{ fontSize: '1.5rem', flexShrink: 0 }}>📊</Typography>
        <Box>
          <Typography sx={{ fontFamily: '"Noto Kufi Arabic", "Nunito Sans", sans-serif', fontWeight: 700, fontSize: '0.7rem', color: GOLD, letterSpacing: '0.1em', textTransform: 'uppercase', mb: 0.25 }}>تقدير حجم السوق</Typography>
          <Typography sx={{ fontFamily: '"Noto Kufi Arabic", "Nunito Sans", sans-serif', fontWeight: 500, fontSize: '0.9rem', color: 'rgba(255,255,255,0.9)' }}>{analysis.market_size}</Typography>
        </Box>
      </Box>

      {/* Paid upsell: Detailed Report */}
      {!isPaid && (
        <Box sx={{ bgcolor: CARD_BG, borderRadius: 2.5, p: 2.5, mb: 3, border: `1.5px dashed ${GOLD}50`, position: 'relative', overflow: 'hidden' }}>
          <Box sx={{ position: 'absolute', inset: 0, bgcolor: 'rgba(15, 61, 36,0.4)', backdropFilter: 'blur(1px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1.5, zIndex: 1 }}>
            <LockOutlinedIcon sx={{ color: GOLD, fontSize: 28 }} />
            <Typography sx={{ fontFamily: '"Noto Kufi Arabic", "Nunito Sans", sans-serif', fontWeight: 700, fontSize: '0.9375rem', color: 'white', textAlign: 'center' }}>
              التقرير المفصّل — خطة برو
            </Typography>
            <Typography sx={{ fontFamily: '"Noto Kufi Arabic", "Nunito Sans", sans-serif', fontWeight: 300, fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', textAlign: 'center', px: 2 }}>
              تحليل المنافسين، وتعمّق في نموذج الإيرادات، وخطة عمل كاملة مولّدة بالذكاء الاصطناعي.
            </Typography>
            <Button component={Link} to="/pricing" sx={{ bgcolor: GOLD, color: NAVY, fontFamily: '"Noto Kufi Arabic", "Nunito Sans", sans-serif', fontWeight: 700, fontSize: '0.875rem', px: 3, py: 1, borderRadius: 2, textTransform: 'none', '&:hover': { bgcolor: '#A07830' } }}>
              افتح التقرير المفصّل ←
            </Button>
          </Box>
          {/* Blurred preview */}
          <Typography sx={{ fontFamily: '"Noto Kufi Arabic", "Nunito Sans", sans-serif', fontWeight: 700, fontSize: '0.7rem', color: '#2A8A52', letterSpacing: '0.1em', textTransform: 'uppercase', mb: 1, filter: 'blur(4px)', userSelect: 'none' }}>تحليل المنافسين</Typography>
          <Typography sx={{ fontFamily: '"Noto Kufi Arabic", "Nunito Sans", sans-serif', fontSize: '0.875rem', color: 'rgba(255,255,255,0.6)', filter: 'blur(4px)', userSelect: 'none' }}>منافسوك الرئيسيون هم... الفجوة التي يمكنك استغلالها هي...</Typography>
        </Box>
      )}

      {/* CTA buttons */}
      {saveError && (
        <Typography sx={{ color: '#F1A9A0', fontFamily: '"Noto Kufi Arabic", "Nunito Sans", sans-serif', fontSize: '0.8rem', textAlign: 'center', mb: 1 }}>
          {saveError}
        </Typography>
      )}
      <Button
        onClick={onSave} disabled={saving} fullWidth
        sx={{
          bgcolor: GOLD, color: NAVY, fontFamily: '"Noto Kufi Arabic", "Nunito Sans", sans-serif', fontWeight: 700,
          fontSize: '0.9375rem', py: 2, borderRadius: 2, textTransform: 'none', letterSpacing: '0.02em',
          boxShadow: `0 4px 24px ${GOLD}55`, mb: 1.25,
          '&:hover': { bgcolor: '#A07830', boxShadow: `0 6px 32px ${GOLD}77` },
          '&.Mui-disabled': { bgcolor: `${GOLD}88`, color: NAVY },
        }}
      >
        {saving ? 'جارٍ الحفظ…' : 'احفظها في رحلتي ←'}
      </Button>

      <Button
        onClick={onRetake} fullWidth variant="outlined"
        sx={{
          borderColor: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.7)',
          fontFamily: '"Noto Kufi Arabic", "Nunito Sans", sans-serif', fontWeight: 600,
          fontSize: '0.875rem', py: 1.75, borderRadius: 2, textTransform: 'none', mb: 3,
          '&:hover': { borderColor: 'rgba(255,255,255,0.35)', bgcolor: 'rgba(255,255,255,0.05)', color: 'white' },
        }}
      >
        أعد الاختبار
      </Button>

      {/* Share */}
      <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)', mb: 2.5 }} />
      <Typography sx={{ fontFamily: '"Noto Kufi Arabic", "Nunito Sans", sans-serif', fontWeight: 400, fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)', mb: 1.5, textAlign: 'center' }}>
        شارك درجتك:
      </Typography>
      <Box sx={{ display: 'flex', gap: 1.25, mb: 3.5 }}>
        <ShareButton icon={<TwitterIcon fontSize="small" />} label="Twitter / X" onClick={handleTwitter} />
        <ShareButton icon={<LinkedInIcon fontSize="small" />} label="LinkedIn" onClick={handleLinkedIn} />
        <ShareButton icon={copied ? <CheckIcon fontSize="small" sx={{ color: '#2A8A52' }} /> : <ContentCopyIcon fontSize="small" />} label={copied ? 'تم النسخ!' : 'انسخ الرابط'} onClick={handleCopy} />
      </Box>

      <Button component={Link} to="/" fullWidth sx={{ color: 'rgba(255,255,255,0.4)', fontFamily: '"Noto Kufi Arabic", "Nunito Sans", sans-serif', fontWeight: 400, fontSize: '0.875rem', py: 1.5, borderRadius: 2, textTransform: 'none', '&:hover': { color: 'white', bgcolor: 'rgba(255,255,255,0.05)' } }}>
        العودة للرئيسية
      </Button>
    </Box>
  );
}

// ─── Results view ──────────────────────────────────────────────────────────────
function ResultsView({ answers, onBack }: { answers: Answers; onBack: () => void }) {
  const { score, tier } = computeScore(answers);
  const config = TIER_CONFIG[tier];
  const [copied, setCopied] = useState(false);

  const shareText = `فكرة مشروعي حصلت على ${score}/10 في اختبار بذرة للأفكار! 🚀 اختبر فكرتك مجاناً: bethra.co/validate`;

  const handleTwitter = () => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`, '_blank', 'noopener');
  const handleLinkedIn = () => window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent('https://bethra.co/validate')}`, '_blank', 'noopener');
  const handleCopy = () => {
    navigator.clipboard.writeText(shareText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <Box sx={{
      '@keyframes fadeUp': {
        from: { transform: 'translateY(28px)', opacity: 0 },
        to: { transform: 'translateY(0)', opacity: 1 },
      },
      animation: 'fadeUp 0.45s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    }}>
      {/* Back link */}
      <Box onClick={onBack} sx={{
        display: 'inline-flex', alignItems: 'center', gap: 0.75, mb: 3,
        cursor: 'pointer', color: 'rgba(255,255,255,0.4)',
        '&:hover': { color: 'rgba(255,255,255,0.85)' },
        transition: 'color 0.2s',
      }}>
        <ArrowBackIcon sx={{ fontSize: 16 }} />
        <Typography sx={{ fontFamily: '"Noto Kufi Arabic", "Nunito Sans", sans-serif', fontWeight: 400, fontSize: '0.8rem' }}>
          العودة للأسئلة
        </Typography>
      </Box>

      {/* ── Top: Gauge + badge ── */}
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 3 }}>
        <ScoreGauge score={score} tier={tier} />
        <Box sx={{
          mt: 2, px: 2.5, py: 0.75,
          bgcolor: tier === 'high' ? 'rgba(212,166,83,0.12)' : tier === 'mid' ? 'rgba(255,255,255,0.07)' : 'rgba(138, 128, 112,0.35)',
          border: `1.5px solid ${tier === 'high' ? GOLD + '60' : tier === 'mid' ? 'rgba(255,255,255,0.2)' : '#8A807060'}`,
          borderRadius: 99,
        }}>
          <Typography sx={{
            fontFamily: '"Noto Kufi Arabic", "Nunito Sans", sans-serif', fontWeight: 700,
            fontSize: '0.9375rem', color: config.color, letterSpacing: '0.01em',
          }}>
            {config.label}
          </Typography>
        </Box>
      </Box>

      {/* ── Feedback section ── */}
      <Box sx={{ bgcolor: CARD_BG, borderRadius: 2.5, p: 2.5, mb: 2.5, border: '1px solid rgba(255,255,255,0.08)' }}>
        <Typography sx={{
          fontFamily: '"Noto Kufi Arabic", "Nunito Sans", sans-serif', fontWeight: 700,
          fontSize: '0.9rem', color: 'white', mb: 2,
        }}>
          هذا ما وجدناه:
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {config.feedback.map((line, i) => (
            <Typography key={i} sx={{
              fontFamily: '"Noto Kufi Arabic", "Nunito Sans", sans-serif', fontWeight: 400,
              fontSize: '0.875rem', color: 'rgba(255,255,255,0.85)', lineHeight: 1.6,
            }}>
              {line}
            </Typography>
          ))}
        </Box>
      </Box>

      {/* ── CTAs ── */}
      <Button
        component={Link}
        to="/signup"
        fullWidth
        sx={{
          bgcolor: GOLD, color: NAVY,
          fontFamily: '"Noto Kufi Arabic", "Nunito Sans", sans-serif', fontWeight: 700,
          fontSize: '0.9375rem', py: 2, borderRadius: 2,
          textTransform: 'none', letterSpacing: '0.02em',
          boxShadow: `0 4px 24px ${GOLD}55`,
          mb: 1.25,
          '&:hover': { bgcolor: '#A07830', boxShadow: `0 6px 32px ${GOLD}77` },
        }}
      >
        احصل على خطة إيراداتي الكاملة ←
      </Button>

      <Button
        component={Link}
        to="/ideas-library"
        fullWidth
        variant="outlined"
        sx={{
          borderColor: `${GOLD}60`, color: GOLD,
          fontFamily: '"Noto Kufi Arabic", "Nunito Sans", sans-serif', fontWeight: 700,
          fontSize: '0.875rem', py: 1.75, borderRadius: 2,
          textTransform: 'none', letterSpacing: '0.02em',
          borderWidth: '1.5px',
          mb: 3,
          '&:hover': { borderColor: GOLD, bgcolor: 'rgba(212,166,83,0.08)', borderWidth: '1.5px' },
        }}
      >
        تصفّح مكتبة الأفكار
      </Button>

      {/* ── Share section ── */}
      <Divider sx={{ borderColor: 'rgba(255,255,255,0.08)', mb: 2.5 }} />
      <Typography sx={{
        fontFamily: '"Noto Kufi Arabic", "Nunito Sans", sans-serif', fontWeight: 400,
        fontSize: '0.8rem', color: 'rgba(255,255,255,0.7)',
        mb: 1.5, textAlign: 'center',
      }}>
        شارك درجتك:
      </Typography>
      <Box sx={{ display: 'flex', gap: 1.25, mb: 3.5 }}>
        <ShareButton
          icon={<TwitterIcon fontSize="small" />}
          label="Twitter / X"
          onClick={handleTwitter}
        />
        <ShareButton
          icon={<LinkedInIcon fontSize="small" />}
          label="LinkedIn"
          onClick={handleLinkedIn}
        />
        <ShareButton
          icon={copied ? <CheckIcon fontSize="small" sx={{ color: '#2A8A52' }} /> : <ContentCopyIcon fontSize="small" />}
          label={copied ? 'تم النسخ!' : 'انسخ الرابط'}
          onClick={handleCopy}
        />
      </Box>

      {/* ── What happens next ── */}
      <Typography sx={{
        fontFamily: '"Noto Kufi Arabic", "Nunito Sans", sans-serif', fontWeight: 700,
        fontSize: '1rem', color: 'white', mb: 1.75,
      }}>
        ماذا بعد؟
      </Typography>
      <Box sx={{ display: 'flex', gap: 1.25, mb: 3.5, alignItems: 'stretch' }}>
        <JourneyCard num={1} title="احصل على خطة الإيرادات" subtitle="الذكاء الاصطناعي يبني خارطة ربحك خلال ٣٠ يوماً" />
        <Box sx={{ display: 'flex', alignItems: 'center', color: 'rgba(255,255,255,0.2)', fontSize: '1.25rem', flexShrink: 0 }}>
          →
        </Box>
        <JourneyCard num={2} title="ابنِ عرضك" subtitle="صُغ التسعير والتغليف وصفحة مبيعاتك الأولى" />
        <Box sx={{ display: 'flex', alignItems: 'center', color: 'rgba(255,255,255,0.2)', fontSize: '1.25rem', flexShrink: 0 }}>
          →
        </Box>
        <JourneyCard num={3} title="اكسب أول دولار" subtitle="أغلق صفقة أول عميل يدفع خلال ٣٠ يوماً" />
      </Box>

      {/* ── Testimonial ── */}
      <Box sx={{
        bgcolor: 'rgba(212,166,83,0.07)',
        border: `1px solid rgba(212,166,83,0.18)`,
        borderRadius: 2.5, p: 2.5, mb: 2,
      }}>
        <Typography sx={{
          fontFamily: '"Noto Kufi Arabic", "Nunito Sans", sans-serif', fontWeight: 300,
          fontSize: '0.9rem', color: 'rgba(255,255,255,0.9)',
          lineHeight: 1.7, fontStyle: 'italic', mb: 1.5,
        }}>
          «ظننت أن فكرتي مجنونة. بذرة أثبتت لي أنها قابلة للتنفيذ — وحققت أول عملية بيع خلال أسبوعين.»
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
          <Box sx={{
            width: 34, height: 34, borderRadius: '50%',
            bgcolor: GOLD, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <Typography sx={{ fontFamily: '"Noto Kufi Arabic", "Nunito Sans", sans-serif', fontWeight: 800, fontSize: '0.8rem', color: NAVY }}>S</Typography>
          </Box>
          <Box>
            <Typography sx={{ fontFamily: '"Noto Kufi Arabic", "Nunito Sans", sans-serif', fontWeight: 700, fontSize: '0.8rem', color: 'white' }}>
              سارة الخالد
            </Typography>
            <Typography sx={{ fontFamily: '"Noto Kufi Arabic", "Nunito Sans", sans-serif', fontWeight: 300, fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)' }}>
              مؤسِّسة — الرياض
            </Typography>
          </Box>
        </Box>
      </Box>

      <Button
        component={Link}
        to="/"
        fullWidth
        sx={{
          color: 'rgba(255,255,255,0.4)',
          fontFamily: '"Noto Kufi Arabic", "Nunito Sans", sans-serif', fontWeight: 400,
          fontSize: '0.875rem', py: 1.5, borderRadius: 2, textTransform: 'none',
          '&:hover': { color: 'white', bgcolor: 'rgba(255,255,255,0.05)' },
        }}
      >
        العودة للرئيسية
      </Button>
    </Box>
  );
}

// ─── Option card ───────────────────────────────────────────────────────────────
function OptionCard({ label, selected, onSelect, centered }: { label: string; selected: boolean; onSelect: () => void; centered?: boolean }) {
  return (
    <Box
      onClick={onSelect}
      sx={{
        bgcolor: selected ? 'rgba(212,166,83,0.12)' : CARD_BG,
        border: `1.5px solid ${selected ? GOLD : 'rgba(255,255,255,0.1)'}`,
        borderRadius: 2,
        px: 2, py: 1.75,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: centered ? 'center' : 'flex-start',
        gap: 1.5,
        transition: 'all 0.18s ease',
        '&:hover': {
          bgcolor: selected ? 'rgba(212,166,83,0.15)' : 'rgba(255,255,255,0.05)',
          borderColor: selected ? GOLD : 'rgba(255,255,255,0.25)',
          transform: 'translateY(-1px)',
        },
        userSelect: 'none',
      }}
    >
      {!centered && (
        <Box sx={{
          width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
          border: `1.5px solid ${selected ? GOLD : 'rgba(255,255,255,0.25)'}`,
          bgcolor: selected ? GOLD : 'transparent',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.18s',
        }}>
          {selected && <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: NAVY }} />}
        </Box>
      )}
      <Typography sx={{
        fontFamily: '"Noto Kufi Arabic", "Nunito Sans", sans-serif',
        fontWeight: selected ? 600 : 400,
        fontSize: { xs: '0.875rem', sm: '0.9rem' },
        color: selected ? 'white' : 'rgba(255,255,255,0.8)',
        lineHeight: 1.4,
        textAlign: centered ? 'center' : 'left',
      }}>
        {label}
      </Typography>
    </Box>
  );
}

// ─── Quiz step ─────────────────────────────────────────────────────────────────
// §3 Layer 1 — client-side garbage gate for the free-text idea field (Q1).
// Cheap heuristics only; the real coherence judgement is server-side in
// idea-stress-test. Thresholds tuned for Arabic: short vowels are usually
// omitted diacritics, so many real Arabic words lack ا/و/ي — the gibberish
// rule only fires on long (>8 char) words with no vowel/long-vowel at all
// (keyboard-mashing like "asdfghjkl"), to avoid blocking real founders.
function isLikelyGarbage(text: string): { garbage: boolean; reason?: string } {
  const trimmed = text.trim();
  if (trimmed.length < 15) {
    return { garbage: true, reason: 'اكتب وصفاً أطول لفكرتك (جملة كاملة على الأقل).' };
  }
  const words = trimmed.split(/\s+/).filter(w => w.length > 0);
  if (words.length < 3) {
    return { garbage: true, reason: 'صف فكرتك بجملة مفهومة (٣ كلمات على الأقل).' };
  }
  const uniqueWords = new Set(words.map(w => w.toLowerCase()));
  if (uniqueWords.size < Math.max(2, Math.floor(words.length / 2))) {
    return { garbage: true, reason: 'يبدو أن النص مكرر. صف فكرتك بوضوح.' };
  }
  const hasNoVowel = (w: string) => !/[اويأإآىaeiouAEIOU]/.test(w);
  const longGibberishWords = words.filter(w => w.length > 8 && hasNoVowel(w));
  if (longGibberishWords.length >= 1) {
    return { garbage: true, reason: 'النص غير واضح. صف فكرتك بكلمات مفهومة.' };
  }
  return { garbage: false };
}

function QuizStep({
  question, stepNum, answers, setAnswers,
  onNext, onBack, direction, canProceed,
}: {
  question: typeof QUESTIONS[0];
  stepNum: number;
  answers: Answers;
  setAnswers: (a: Answers) => void;
  onNext: () => void;
  onBack?: () => void;
  direction: 'forward' | 'back';
  canProceed: boolean;
}) {
  const value = answers[stepNum] ?? '';
  const selectOption = (opt: string) => setAnswers({ ...answers, [stepNum]: opt });

  return (
    <Box sx={{
      '@keyframes slideInRight': {
        from: { transform: 'translateX(56px)', opacity: 0 },
        to: { transform: 'translateX(0)', opacity: 1 },
      },
      '@keyframes slideInLeft': {
        from: { transform: 'translateX(-56px)', opacity: 0 },
        to: { transform: 'translateX(0)', opacity: 1 },
      },
      animation: direction === 'forward'
        ? 'slideInRight 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94)'
        : 'slideInLeft 0.35s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    }}>
      {onBack && (
        <Box onClick={onBack} sx={{
          display: 'inline-flex', alignItems: 'center', gap: 0.75, mb: 3,
          cursor: 'pointer', color: 'rgba(255,255,255,0.45)',
          '&:hover': { color: 'rgba(255,255,255,0.9)' },
          transition: 'color 0.2s',
        }}>
          <ArrowBackIcon sx={{ fontSize: 16 }} />
          <Typography sx={{ fontFamily: '"Noto Kufi Arabic", "Nunito Sans", sans-serif', fontWeight: 400, fontSize: '0.8rem' }}>رجوع</Typography>
        </Box>
      )}

      <Typography sx={{
        fontFamily: '"Noto Kufi Arabic", "Nunito Sans", sans-serif', fontWeight: 600,
        fontSize: '0.7rem', color: GOLD, letterSpacing: '0.12em',
        textTransform: 'uppercase', mb: 1.5,
      }}>
        السؤال {stepNum} من {TOTAL}
      </Typography>

      <Typography sx={{
        fontFamily: '"Noto Kufi Arabic", "Nunito Sans", sans-serif', fontWeight: 700,
        fontSize: { xs: '1.375rem', sm: '1.625rem' },
        color: 'white', lineHeight: 1.3, mb: 1,
      }}>
        {question.question}
      </Typography>

      <Typography sx={{
        fontFamily: '"Noto Kufi Arabic", "Nunito Sans", sans-serif', fontWeight: 300,
        fontSize: '0.875rem', color: 'rgba(255,255,255,0.6)',
        mb: 3.5, lineHeight: 1.65,
      }}>
        {question.helper}
      </Typography>

      {question.type === 'text' && (() => {
        const check = isLikelyGarbage(value);
        // Only surface the reason once the user has actually typed something —
        // an empty field just keeps the Next button disabled, no red error.
        const showError = value.trim().length > 0 && check.garbage;
        return (
        <TextField
          multiline minRows={3} maxRows={6} fullWidth
          placeholder={question.placeholder}
          value={value}
          error={showError}
          helperText={showError ? check.reason : undefined}
          FormHelperTextProps={{ sx: { fontFamily: '"Noto Kufi Arabic", "Nunito Sans", sans-serif', fontSize: '0.8rem', color: '#F1A9A0', mx: 0.5 } }}
          onChange={e => setAnswers({ ...answers, [stepNum]: e.target.value })}
          onKeyDown={e => {
            if (e.key === 'Enter' && !e.shiftKey && canProceed) { e.preventDefault(); onNext(); }
          }}
          sx={{
            mb: 3,
            '& .MuiOutlinedInput-root': {
              bgcolor: CARD_BG, borderRadius: 2,
              '& fieldset': { borderColor: 'rgba(255,255,255,0.12)', borderWidth: '1.5px' },
              '&:hover fieldset': { borderColor: 'rgba(212,166,83,0.45)' },
              '&.Mui-focused fieldset': { borderColor: GOLD, borderWidth: '2px' },
            },
            '& .MuiOutlinedInput-input': {
              color: 'white', fontFamily: '"Noto Kufi Arabic", "Nunito Sans", sans-serif',
              fontWeight: 400, fontSize: '0.9375rem', lineHeight: 1.65,
              '&::placeholder': { color: 'rgba(255,255,255,0.28)', opacity: 1 },
            },
          }}
        />
        );
      })()}

      {question.type === 'single' && (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25, mb: 3 }}>
          {question.options!.map(opt => (
            <OptionCard key={opt} label={opt} selected={value === opt} onSelect={() => selectOption(opt)} />
          ))}
        </Box>
      )}

      {question.type === 'grid' && (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr 1fr', sm: 'repeat(4, 1fr)' }, gap: 1.5, mb: 3 }}>
          {question.options!.map(opt => (
            <OptionCard key={opt} label={opt} selected={value === opt} onSelect={() => selectOption(opt)} centered />
          ))}
        </Box>
      )}

      <Button
        fullWidth onClick={onNext} disabled={!canProceed}
        endIcon={!question.isLast ? <ArrowForwardIcon /> : undefined}
        sx={{
          bgcolor: canProceed ? GOLD : 'rgba(212,166,83,0.15)',
          color: canProceed ? NAVY : 'rgba(255,255,255,0.2)',
          fontFamily: '"Noto Kufi Arabic", "Nunito Sans", sans-serif', fontWeight: 700,
          fontSize: '0.9375rem',
          py: question.isLast ? 2.25 : 1.875,
          borderRadius: 2, textTransform: 'none', letterSpacing: '0.02em',
          transition: 'all 0.2s',
          boxShadow: canProceed ? `0 4px 20px ${GOLD}44` : 'none',
          '&:hover': {
            bgcolor: canProceed ? '#A07830' : undefined,
            boxShadow: canProceed ? `0 6px 28px ${GOLD}60` : undefined,
          },
          '&.Mui-disabled': { bgcolor: 'rgba(212,166,83,0.12)', color: 'rgba(255,255,255,0.18)' },
          ...(question.isLast && canProceed && {
            '@keyframes pulseShadow': {
              '0%, 100%': { boxShadow: `0 4px 20px ${GOLD}44` },
              '50%': { boxShadow: `0 8px 36px ${GOLD}80` },
            },
            animation: 'pulseShadow 2s ease-in-out infinite',
          }),
        }}
      >
        {question.isLast ? 'أرني نتائجي ←' : 'التالي'}
      </Button>
    </Box>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────
export default function ValidatePage() {
  useSEO({
    title: 'اختبار الفكرة — بذرة',
    description: 'أجب عن ٥ أسئلة سريعة واحصل على تقييم صادق لفكرة مشروعك. نتائج فورية بلا مجاملات.',
    canonicalPath: '/validate',
  });

  const { user, profile } = useAuth();
  const isPaid = (profile?.plan ?? 'free') !== 'free';
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState<'forward' | 'back'>('forward');
  const [answers, setAnswers] = useState<Answers>({});
  const [showResults, setShowResults] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // "احفظها في رحلتي" — the core Validate→Save→Journey step.
  // Logged in: create the user_idea now and open the journey on it.
  // Anon: stash the idea + results, then send to signup; OnboardingPage restores it.
  async function handleSaveToJourney() {
    const payload = buildIdeaPayload(answers);
    if (user) {
      setSaving(true); setSaveError(null);
      try {
        await createUserIdea(user.id, payload, aiAnalysis);
        navigate('/journey/canvas');
      } catch {
        setSaving(false);
        setSaveError('فشل حفظ الفكرة. حاول مرة أخرى.');
      }
      return;
    }
    stashPendingIdea({ payload, answers, results: aiAnalysis, stashedAt: new Date().toISOString() });
    navigate('/signup?next=journey');
  }

  const canProceed = (): boolean => {
    const q = QUESTIONS[step - 1];
    // Free-text idea step: block obvious garbage (too short / repeated / mashing).
    if (q.type === 'text') return !isLikelyGarbage(answers[step] ?? '').garbage;
    return !!answers[step];
  };

  const progress = showResults || aiAnalysis
    ? 100
    : analyzing
      ? 100
      : ((step - 1) / TOTAL) * 100 + (canProceed() ? (1 / TOTAL) * 100 : 0);

  async function runAIAnalysis(finalAnswers: Answers) {
    setAnalyzing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`;

      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/idea-stress-test`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          idea: finalAnswers[1] ?? '',
          target_customer: finalAnswers[2] ?? '',
          problem_solved: finalAnswers[3] ?? '',
          revenue_model: finalAnswers[4] ?? '',
          competitors: finalAnswers[5] ?? '',
        }),
      });

      if (!res.ok) throw new Error('Analysis failed');
      const result: AIAnalysis = await res.json();
      setAiAnalysis(result);

      // Email user their results if logged in
      if (session?.user) {
        void (async () => {
          const { data: userEmail } = await supabase.rpc('get_user_email', { target_user_id: session.user.id });
          const { data: profileData } = await supabase.from('profiles').select('full_name').eq('user_id', session.user.id).maybeSingle();
          if (userEmail) {
            const scoreColor = result.score >= 7 ? '#2A8A52' : result.score >= 5 ? '#D08A28' : '#C0392B';
            const scoreBg = result.score >= 7 ? '#F0F5F1' : result.score >= 5 ? '#FAF5E9' : '#FAF0EE';
            const strengthsHtml = (result.strengths ?? []).map((s: string) =>
              `<div style="display:flex;align-items:flex-start;gap:8px;margin-bottom:6px;"><span style="color:#2A8A52;font-weight:700;">✓</span><span style="color:#3E382E;font-size:14px;">${s}</span></div>`
            ).join('');
            const suggestionsHtml = (result.suggestions ?? []).map((s: string, i: number) =>
              `<div style="display:flex;align-items:flex-start;gap:8px;margin-bottom:6px;"><span style="background:#DEEBE2;color:#0F3D24;font-weight:700;font-size:12px;padding:2px 6px;border-radius:4px;">${i + 1}</span><span style="color:#3E382E;font-size:14px;">${s}</span></div>`
            ).join('');
            void sendEmail(userEmail as string, 'validation-complete', {
              name: profileData?.full_name ?? 'رائد الأعمال',
              idea_title: finalAnswers[1] ?? 'فكرتك',
              score: String(result.score),
              verdict: result.verdict,
              score_color: scoreColor,
              score_bg: scoreBg,
              strengths_html: strengthsHtml,
              suggestions_html: suggestionsHtml,
              validate_url: `${window.location.origin}/validate`,
              unsubscribe_url: `${window.location.origin}/settings`,
            });
          }
        })();
      }
      if (session?.user) {
        const ideaId = localStorage.getItem('bethra_selected_idea_id');
        if (ideaId) {
          await supabase.from('validation_entries').insert({
            user_idea_id: ideaId,
            type: 'other',
            notes: `اختبار الفكرة — درجة الذكاء الاصطناعي: ${result.score}/10. ${result.verdict}`,
            amount: 0,
            sentiment: result.score >= 7 ? 'positive' : result.score >= 5 ? 'neutral' : 'negative',
          });
        }
      }
    } catch {
      // Fall back to standard results on error
      setShowResults(true);
    } finally {
      setAnalyzing(false);
    }
  }

  const goNext = () => {
    if (step < TOTAL) {
      setDirection('forward');
      setStep(s => s + 1);
    } else {
      runAIAnalysis(answers);
    }
  };

  const goBack = () => {
    if (aiAnalysis) {
      setAiAnalysis(null);
      setDirection('back');
      return;
    }
    if (showResults) {
      setShowResults(false);
      setDirection('back');
      return;
    }
    if (step > 1) {
      setDirection('back');
      setStep(s => s - 1);
    }
  };

  const handleRetake = () => {
    setAiAnalysis(null);
    setShowResults(false);
    setAnswers({});
    setStep(1);
    setDirection('forward');
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: NAVY, display: 'flex', flexDirection: 'column' }}>

      {/* Fixed header */}
      <Box sx={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        bgcolor: 'rgba(15, 61, 36,0.97)', backdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(255,255,255,0.07)',
        px: { xs: 2.5, sm: 4 }, py: 1.5,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <BethraLogo dark iconSize={26} fontSize="0.9375rem" />
        <Typography sx={{
          fontFamily: '"Noto Kufi Arabic", "Nunito Sans", sans-serif', fontWeight: 700,
          color: 'white', fontSize: { xs: '0.75rem', sm: '0.875rem' }, letterSpacing: '0.02em',
          position: 'absolute', left: '50%', transform: 'translateX(-50%)',
        }}>
          اختبار الفكرة
        </Typography>
        <Typography component={Link} to="/" sx={{
          fontFamily: '"Noto Kufi Arabic", "Nunito Sans", sans-serif', fontWeight: 400,
          color: 'rgba(255,255,255,0.65)', fontSize: '0.8rem',
          textDecoration: 'none', whiteSpace: 'nowrap',
          '&:hover': { color: 'white' }, transition: 'color 0.2s',
        }}>
          العودة للرئيسية
        </Typography>
      </Box>

      {/* Progress bar */}
      <Box sx={{
        position: 'fixed', top: { xs: 54, sm: 58 }, left: 0, right: 0, zIndex: 99,
        height: 3, bgcolor: 'rgba(255,255,255,0.07)',
      }}>
        <Box sx={{
          height: '100%', width: `${progress}%`, bgcolor: GOLD,
          transition: 'width 0.45s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: `0 0 10px ${GOLD}88`,
        }} />
        {[1, 2, 3, 4].map(i => (
          <Box key={i} sx={{
            position: 'absolute', top: 0, bottom: 0,
            left: `${(i / TOTAL) * 100}%`, width: '2px',
            bgcolor: 'rgba(15, 61, 36,0.85)',
          }} />
        ))}
      </Box>

      {/* Main content */}
      <Box sx={{
        flex: 1, display: 'flex', alignItems: (showResults || aiAnalysis || analyzing) ? 'flex-start' : 'center',
        justifyContent: 'center',
        pt: { xs: '80px', sm: '88px' },
        pb: { xs: 4, sm: 6 },
        px: 2,
      }}>
        <Container maxWidth="sm" sx={{ width: '100%' }}>
          {analyzing ? (
            <AnalyzingScreen />
          ) : aiAnalysis ? (
            <AIResultsView analysis={aiAnalysis} isPaid={isPaid} onRetake={handleRetake} onBack={goBack} onSave={handleSaveToJourney} saving={saving} saveError={saveError} />
          ) : showResults ? (
            <ResultsView answers={answers} onBack={goBack} />
          ) : (
            <QuizStep
              key={`${step}-${direction}`}
              question={QUESTIONS[step - 1]}
              stepNum={step}
              answers={answers}
              setAnswers={setAnswers}
              onNext={goNext}
              onBack={step > 1 ? goBack : undefined}
              direction={direction}
              canProceed={canProceed()}
            />
          )}
        </Container>
      </Box>
    </Box>
  );
}
