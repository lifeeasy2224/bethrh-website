import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import LinearProgress from '@mui/material/LinearProgress';

interface IQScoreBadgeProps {
  score: number;
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
}

function getScoreColor(score: number) {
  if (score >= 80) return '#2A8A52';
  if (score >= 50) return '#1B6B3E';
  if (score >= 1) return '#D4A653';
  return '#B5AE9F';
}

function getScoreLabel(score: number) {
  if (score >= 80) return 'جاهزة';
  if (score >= 50) return 'تنمو';
  if (score > 0) return 'بذرة';
  return 'لم تبدأ';
}

export function IQScoreBadge({ score, size = 'medium', showLabel = false }: IQScoreBadgeProps) {
  const color = getScoreColor(score);
  const sizes = {
    small: { w: 40, h: 40, fs: '0.75rem' },
    medium: { w: 56, h: 56, fs: '1rem' },
    large: { w: 80, h: 80, fs: '1.4rem' },
  };
  const s = sizes[size];

  return (
    <Box sx={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
      <Box sx={{
        width: s.w, height: s.h, borderRadius: '50%',
        border: `3px solid ${color}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        bgcolor: `${color}18`,
      }}>
        <Typography sx={{ fontWeight: 700, fontSize: s.fs, color, lineHeight: 1 }}>{score}</Typography>
      </Box>
      {showLabel && (
        <Typography variant="caption" sx={{ color, fontWeight: 600 }}>{getScoreLabel(score)}</Typography>
      )}
    </Box>
  );
}

const SECTOR_COLORS: Record<string, { bg: string; color: string }> = {
  'Food & Agriculture': { bg: '#FAF0EE', color: '#C0392B' },
  'B2B SaaS': { bg: '#F0F5F1', color: '#1B6B3E' },
  'E-commerce': { bg: '#FAF5E9', color: '#D08A28' },
  'Fintech': { bg: '#FAF5E9', color: '#D08A28' },
  'EdTech': { bg: '#F0F5F1', color: '#2A8A52' },
  'HealthTech': { bg: '#F0F5F1', color: '#1B6B3E' },
  'Logistics': { bg: '#F0F5F1', color: '#0F3D24' },
  'Services': { bg: '#FAF0EE', color: '#96271B' },
};

export function SectorChip({ sector, emoji, size = 'small' }: { sector: string; emoji?: string; size?: 'small' | 'medium' }) {
  const colors = SECTOR_COLORS[sector] ?? { bg: '#F7F3EC', color: '#3E382E' };
  return (
    <Chip
      label={`${emoji ?? ''} ${sector}`.trim()}
      size={size}
      sx={{ bgcolor: colors.bg, color: colors.color, fontWeight: 600, border: 'none', '& .MuiChip-label': { px: 1.5 } }}
    />
  );
}

export function ScoreProgress({ score, label }: { score: number; label?: string }) {
  const color = getScoreColor(score);
  return (
    <Box>
      {label && (
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
          <Typography variant="caption" color="text.secondary">{label}</Typography>
          <Typography variant="caption" sx={{ fontWeight: 700, color }}>{score}/100</Typography>
        </Box>
      )}
      <LinearProgress variant="determinate" value={score} sx={{ bgcolor: 'grey.100', '& .MuiLinearProgress-bar': { bgcolor: color } }} />
    </Box>
  );
}

export function StageChip({ stage }: { stage: string }) {
  const info = {
    seed: { label: '🌱 Seed', bg: '#F0F5F1', color: '#123F27' },
    growing: { label: '🌿 Growing', bg: '#F0F5F1', color: '#0F3D24' },
    ready: { label: '🍎 Ready', bg: '#FAF5E9', color: '#A07830' },
  }[stage] ?? { label: '🌱 Seed', bg: '#F0F5F1', color: '#123F27' };

  return <Chip label={info.label} size="small" sx={{ bgcolor: info.bg, color: info.color, fontWeight: 600, border: 'none' }} />;
}
