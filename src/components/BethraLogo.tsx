import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { Link } from 'react-router-dom';

const GOLD = '#D4A653';
const GREEN_DEEP = '#0F3D24';
const GREEN_MID = '#1B6B3E';
const CREAM = '#F7F3EC';

// Official Bethra mark (brand guidelines 05-07-2026, §02–§05): the seed
// (النواة) — two symmetric arcs meeting at pointed top/bottom, with the
// germination-split line on the exact vertical axis. Flat design only: no
// gradients, shadows, or circles/frames behind the mark. At very small sizes
// the inner line is dropped (solid seed) for clarity.
// Color variants per background:
//   dark  (#0F3D24 / #1B6B3E): gold seed  + deep-green line, gold wordmark
//   light (#F7F3EC / white)  : green seed + cream line, deep-green wordmark
function SeedMark({ size = 28, dark = false, solid = false }: { size?: number; dark?: boolean; solid?: boolean }) {
  const h = Math.round(size * 1.2);
  return (
    <svg width={size} height={h} viewBox="0 0 200 240" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M100 24 C 44 78, 44 162, 100 216 C 156 162, 156 78, 100 24 Z" fill={dark ? GOLD : GREEN_MID} />
      {!solid && (
        <path
          d="M100 62 C 82 104, 82 150, 100 188"
          stroke={dark ? GREEN_DEEP : CREAM}
          strokeWidth="9"
          strokeLinecap="round"
        />
      )}
    </svg>
  );
}

interface BethraLogoProps {
  dark?: boolean;
  iconSize?: number;
  fontSize?: string;
  subtitle?: string;
  to?: string;
}

export default function BethraLogo({ dark = false, iconSize = 28, fontSize = '1.375rem', subtitle, to = '/' }: BethraLogoProps) {
  return (
    <Box
      component={Link}
      to={to}
      sx={{ display: 'flex', alignItems: 'center', gap: 1.25, textDecoration: 'none' }}
    >
      {/* Drop the inner split line below ~20px — brand rule for tiny sizes */}
      <SeedMark size={iconSize} dark={dark} solid={iconSize < 20} />
      <Box>
        <Typography
          sx={{
            fontFamily: '"Noto Kufi Arabic", sans-serif',
            fontWeight: 700,
            fontSize,
            color: dark ? GOLD : GREEN_DEEP,
            lineHeight: 1,
          }}
        >
          بذرة
        </Typography>
        {subtitle && (
          <Typography
            variant="caption"
            sx={{
              display: 'block',
              color: dark ? 'rgba(247,243,236,0.6)' : 'text.secondary',
              fontFamily: '"Noto Kufi Arabic", sans-serif',
              fontSize: '0.65rem',
              mt: 0.25,
            }}
          >
            {subtitle}
          </Typography>
        )}
      </Box>
    </Box>
  );
}
