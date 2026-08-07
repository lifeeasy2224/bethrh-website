import { useState } from 'react';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Chip from '@mui/material/Chip';
import LinearProgress from '@mui/material/LinearProgress';
import Alert from '@mui/material/Alert';
import CheckIcon from '@mui/icons-material/Check';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../supabase';
import { readPendingIdea, createUserIdea, clearPendingIdea } from '../../lib/pendingIdea';
import BethraLogo from '../../components/BethraLogo';

// label = stored DB value (must match library sector keys); ar = display only
const SECTORS = [
  { label: 'Food & Agriculture', ar: 'الغذاء والزراعة', emoji: '🌾' },
  { label: 'B2B SaaS', ar: 'البرمجيات كخدمة', emoji: '💻' },
  { label: 'E-commerce', ar: 'التجارة الإلكترونية', emoji: '🛒' },
  { label: 'Fintech', ar: 'التقنية المالية', emoji: '💳' },
  { label: 'EdTech', ar: 'تقنية التعليم', emoji: '📚' },
  { label: 'HealthTech', ar: 'التقنية الصحية', emoji: '🏥' },
  { label: 'Logistics', ar: 'اللوجستيات', emoji: '🚚' },
  { label: 'Services', ar: 'الخدمات', emoji: '🤝' },
];

const FOUNDER_TYPES = [
  { value: 'first_time', label: 'رائد أعمال لأول مرة', desc: 'هذا أول مشروع ريادي لي' },
  { value: 'serial', label: 'رائد أعمال متمرّس', desc: 'أسّست شركات من قبل' },
  { value: 'side_project', label: 'مشروع جانبي', desc: 'أعمل عليه بجانب وظيفتي' },
  { value: 'student', label: 'طالب / خريج جديد', desc: 'أبدأ وأنا ما زلت أدرس أو تخرجت حديثاً' },
];

const INVESTOR_TYPES = [
  { value: 'angel', label: 'مستثمر ملاك', desc: 'مستثمر فردي برأس مال شخصي' },
  { value: 'vc', label: 'صندوق رأس مال جريء', desc: 'صندوق محترف يستثمر رأس مال مؤسسي' },
  { value: 'syndicate', label: 'قائد تحالف استثماري', desc: 'أنظّم تحالفات استثمارية' },
  { value: 'scout', label: 'كشّاف / مستشار', desc: 'أرصد الصفقات لصالح آخرين' },
];

const CHECK_SIZES = [
  { value: 'under_25k', label: 'أقل من $25K' },
  { value: '25k_100k', label: '$25K – $100K' },
  { value: '100k_500k', label: '$100K – $500K' },
  { value: '500k_plus', label: 'أكثر من $500K' },
];

function StepDots({ total, current }: { total: number; current: number }) {
  return (
    <Stack direction="row" spacing={1} justifyContent="center" sx={{ mb: 4 }}>
      {Array.from({ length: total }).map((_, i) => (
        <Box
          key={i}
          sx={{
            width: i === current ? 24 : 8,
            height: 8,
            borderRadius: 4,
            bgcolor: i <= current ? 'primary.main' : 'grey.200',
            transition: 'all 300ms ease',
          }}
        />
      ))}
    </Stack>
  );
}

function SelectCard({
  selected,
  onClick,
  label,
  desc,
  emoji,
}: {
  selected: boolean;
  onClick: () => void;
  label: string;
  desc?: string;
  emoji?: string;
}) {
  return (
    <Card
      onClick={onClick}
      sx={{
        cursor: 'pointer',
        border: '2px solid',
        borderColor: selected ? 'primary.main' : 'divider',
        bgcolor: selected ? '#F0F5F1' : 'white',
        transition: 'all 150ms ease',
        '&:hover': { borderColor: 'primary.main', transform: 'translateY(-1px)', boxShadow: 2 },
      }}
    >
      <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: '12px !important' }}>
        {emoji && <Typography sx={{ fontSize: '1.5rem', flexShrink: 0 }}>{emoji}</Typography>}
        <Box sx={{ flex: 1 }}>
          <Typography variant="body2" fontWeight={600}>{label}</Typography>
          {desc && <Typography variant="caption" color="text.secondary">{desc}</Typography>}
        </Box>
        {selected && <CheckIcon sx={{ color: 'primary.main', flexShrink: 0, fontSize: 18 }} />}
      </CardContent>
    </Card>
  );
}

function SectorToggle({ value, selected, onToggle }: { value: string; selected: boolean; onToggle: () => void }) {
  const sec = SECTORS.find(s => s.label === value);
  return (
    <Chip
      label={`${sec?.emoji ?? ''} ${sec?.ar ?? value}`}
      onClick={onToggle}
      sx={{
        cursor: 'pointer',
        bgcolor: selected ? 'primary.main' : 'grey.100',
        color: selected ? 'white' : 'text.secondary',
        fontWeight: selected ? 700 : 500,
        border: '2px solid',
        borderColor: selected ? 'primary.main' : 'transparent',
        '&:hover': { bgcolor: selected ? 'primary.dark' : 'grey.200' },
        transition: 'all 150ms ease',
      }}
    />
  );
}

export default function OnboardingPage() {
  const { user, profile, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const role = profile?.role ?? (user?.user_metadata?.role as 'founder' | 'investor') ?? 'founder';

  const totalSteps = 3;
  const [step, setStep] = useState(0);
  const [founderType, setFounderType] = useState('');
  const [investorType, setInvestorType] = useState('');
  const [sectors, setSectors] = useState<string[]>([]);
  const [hasIdea, setHasIdea] = useState<'yes' | 'no' | ''>('');
  const [checkSize, setCheckSize] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  function toggleSector(s: string) {
    setSectors(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);
  }

  function canAdvance() {
    if (step === 0) return role === 'founder' ? !!founderType : !!investorType;
    if (step === 1) return sectors.length > 0;
    if (step === 2) return role === 'founder' ? !!hasIdea : !!checkSize;
    return false;
  }

  async function handleFinish() {
    if (!user) return;
    setSaving(true);
    setError('');

    if (role === 'founder') {
      const { error: err1 } = await supabase.from('founder_profiles').upsert({
        user_id: user.id,
        founder_type: founderType,
        sectors_of_interest: sectors,
        has_idea: hasIdea === 'yes',
      }, { onConflict: 'user_id' });
      if (err1) { setError(err1.message); setSaving(false); return; }
    } else {
      const { error: err2 } = await supabase.from('investor_profiles').upsert({
        user_id: user.id,
        investor_type: investorType,
        sectors_of_interest: sectors,
        check_size: checkSize,
      }, { onConflict: 'user_id' });
      if (err2) { setError(err2.message); setSaving(false); return; }
    }

    const { error: err3 } = await supabase
      .from('profiles')
      .update({ onboarding_completed: true })
      .eq('user_id', user.id);

    if (err3) { setError(err3.message); setSaving(false); return; }

    await refreshProfile();

    // §4 bridge: if the user validated an idea before signing up, create it now
    // and drop them into the journey instead of the generic dashboard.
    if (role === 'founder') {
      const pending = readPendingIdea();
      if (pending) {
        try {
          await createUserIdea(user.id, pending.payload, pending.results);
          clearPendingIdea();
          navigate('/journey/canvas', { replace: true });
          return;
        } catch {
          clearPendingIdea(); // never trap the user on a bad stash
        }
      }
    }

    navigate(role === 'founder' ? '/dashboard' : '/investor/dashboard', { replace: true });
  }

  const stepLabels = ['خلفيتك', 'القطاعات التي تهمك', role === 'founder' ? 'مرحلة فكرتك' : 'حجم الاستثمار'];
  const progress = ((step + 1) / totalSteps) * 100;

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#FAF8F3', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ py: 2.5, px: 4, borderBottom: '1px solid', borderColor: 'divider', bgcolor: 'white' }}>
        <BethraLogo iconSize={26} fontSize="1.1rem" />
      </Box>

      <Container maxWidth="sm" sx={{ flex: 1, display: 'flex', alignItems: 'center', py: 6 }}>
        <Box sx={{ width: '100%' }}>
          <Box sx={{ mb: 3 }}>
            <LinearProgress
              variant="determinate"
              value={progress}
              sx={{ height: 6, borderRadius: 3, bgcolor: 'grey.200', '& .MuiLinearProgress-bar': { borderRadius: 3 } }}
            />
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
              <Typography variant="caption" color="text.secondary">الخطوة {step + 1} من {totalSteps}</Typography>
              <Typography variant="caption" color="text.secondary">{stepLabels[step]}</Typography>
            </Box>
          </Box>

          <StepDots total={totalSteps} current={step} />

          {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>}

          {/* Step 0 — Background */}
          {step === 0 && (
            <>
              <Box sx={{ textAlign: 'center', mb: 3 }}>
                <Typography variant="h4" fontWeight={700} gutterBottom>
                  {role === 'founder' ? 'أي نوع من روّاد الأعمال أنت؟' : 'كيف تستثمر؟'}
                </Typography>
                <Typography color="text.secondary" variant="body2">
                  هذا يساعدنا على تخصيص تجربتك.
                </Typography>
              </Box>
              <Stack spacing={1.5}>
                {(role === 'founder' ? FOUNDER_TYPES : INVESTOR_TYPES).map(opt => (
                  <SelectCard
                    key={opt.value}
                    selected={role === 'founder' ? founderType === opt.value : investorType === opt.value}
                    onClick={() => role === 'founder' ? setFounderType(opt.value) : setInvestorType(opt.value)}
                    label={opt.label}
                    desc={opt.desc}
                  />
                ))}
              </Stack>
            </>
          )}

          {/* Step 1 — Sectors */}
          {step === 1 && (
            <>
              <Box sx={{ textAlign: 'center', mb: 3 }}>
                <Typography variant="h4" fontWeight={700} gutterBottom>
                  ما القطاعات التي تهمك؟
                </Typography>
                <Typography color="text.secondary" variant="body2">
                  اختر كل ما ينطبق — يمكنك تغييره في أي وقت.
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.25 }}>
                {SECTORS.map(s => (
                  <SectorToggle
                    key={s.label}
                    value={s.label}
                    selected={sectors.includes(s.label)}
                    onToggle={() => toggleSector(s.label)}
                  />
                ))}
              </Box>
              {sectors.length > 0 && (
                <Typography variant="caption" color="primary.main" sx={{ mt: 1.5, display: 'block' }}>
                  تم اختيار {sectors.length} {sectors.length > 1 ? 'قطاعات' : 'قطاع'}
                </Typography>
              )}
            </>
          )}

          {/* Step 2 — Idea stage / check size */}
          {step === 2 && role === 'founder' && (
            <>
              <Box sx={{ textAlign: 'center', mb: 3 }}>
                <Typography variant="h4" fontWeight={700} gutterBottom>هل لديك فكرة بالفعل؟</Typography>
                <Typography color="text.secondary" variant="body2">
                  سواء كانت لديك فكرة أو لا، بذرة تساعدك.
                </Typography>
              </Box>
              <Stack spacing={1.5}>
                <SelectCard
                  selected={hasIdea === 'yes'}
                  onClick={() => setHasIdea('yes')}
                  emoji="💡"
                  label="نعم، لديّ فكرة"
                  desc="أريد التحقق من فكرتي وتطويرها"
                />
                <SelectCard
                  selected={hasIdea === 'no'}
                  onClick={() => setHasIdea('no')}
                  emoji="🔍"
                  label="ليس بعد — ما زلت أستكشف"
                  desc="أريد تصفّح الأفكار والعثور على المناسبة"
                />
              </Stack>
            </>
          )}

          {step === 2 && role === 'investor' && (
            <>
              <Box sx={{ textAlign: 'center', mb: 3 }}>
                <Typography variant="h4" fontWeight={700} gutterBottom>ما حجم استثمارك المعتاد؟</Typography>
                <Typography color="text.secondary" variant="body2">
                  هذا يساعد المؤسسين على إيجاد المستثمر المناسب.
                </Typography>
              </Box>
              <Stack spacing={1.5}>
                {CHECK_SIZES.map(opt => (
                  <SelectCard
                    key={opt.value}
                    selected={checkSize === opt.value}
                    onClick={() => setCheckSize(opt.value)}
                    label={opt.label}
                  />
                ))}
              </Stack>
            </>
          )}

          <Stack direction="row" spacing={2} sx={{ mt: 4 }}>
            {step > 0 && (
              <Button
                variant="outlined"
                fullWidth
                onClick={() => setStep(s => s - 1)}
                disabled={saving}
              >
                رجوع
              </Button>
            )}
            {step < totalSteps - 1 ? (
              <Button
                variant="contained"
                fullWidth
                disabled={!canAdvance()}
                onClick={() => setStep(s => s + 1)}
              >
                متابعة ←
              </Button>
            ) : (
              <Button
                variant="contained"
                fullWidth
                disabled={!canAdvance() || saving}
                onClick={handleFinish}
              >
                {saving ? 'جارٍ الإعداد…' : role === 'founder' ? 'ابدأ الآن ←' : 'ابدأ التصفح ←'}
              </Button>
            )}
          </Stack>
        </Box>
      </Container>
    </Box>
  );
}
