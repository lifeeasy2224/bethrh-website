// 📁 FILE: components/BethrhLogo.tsx
// 📋 ACTION: CREATE NEW FILE

interface BethrhLogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg';
  color?: string;
  className?: string;
}

export default function BethrhLogo({
  size = 'md',
  color = '#D4A653',
  className = '',
}: BethrhLogoProps) {
  const dimensions = {
    xs: { w: 80,  h: 55  },
    sm: { w: 130, h: 88  },
    md: { w: 200, h: 136 },
    lg: { w: 300, h: 204 },
  };

  const { w, h } = dimensions[size];

  return (
    <svg
      width={w}
      height={h}
      viewBox="0 0 320 218"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="بذرة"
      role="img"
    >
      <defs>
        <style>{`
          @import url('https://fonts.googleapis.com/css2?family=Noto+Kufi+Arabic:wght@400;600;700&family=Montserrat:wght@800&display=swap');
          .bethrh-ar {
            font-family: 'Noto Kufi Arabic', 'Arabic Typesetting', sans-serif;
            font-weight: 700;
          }
          .bethrh-en {
            font-family: 'Montserrat', 'Helvetica Neue', Arial, sans-serif;
            font-weight: 800;
          }
        `}</style>
      </defs>

      {/* Open-top shield */}
      <line x1="52"  y1="12" x2="52"  y2="118" stroke={color} strokeWidth="2" strokeLinecap="round"/>
      <line x1="268" y1="12" x2="268" y2="118" stroke={color} strokeWidth="2" strokeLinecap="round"/>
      <path d="M52,118 Q52,178 160,196 Q268,178 268,118"
        fill={`${color}08`} stroke={color} strokeWidth="2" strokeLinecap="round"/>

      {/* Inner shield */}
      <line x1="68"  y1="12" x2="68"  y2="115" stroke={`${color}28`} strokeWidth="0.8"/>
      <line x1="252" y1="12" x2="252" y2="115" stroke={`${color}28`} strokeWidth="0.8"/>
      <path d="M68,115 Q68,166 160,182 Q252,166 252,115"
        fill="none" stroke={`${color}22`} strokeWidth="0.8"/>

      {/* Anchor dots */}
      <circle cx="52"  cy="118" r="4.5" fill={color}/>
      <circle cx="268" cy="118" r="4.5" fill={color}/>
      <circle cx="160" cy="196" r="5"   fill={color}/>

      {/* Rules */}
      <line x1="90" y1="32"  x2="230" y2="32"  stroke={`${color}25`} strokeWidth="0.8"/>
      <line x1="90" y1="112" x2="230" y2="112" stroke={`${color}25`} strokeWidth="0.8"/>

      {/* بذرة wordmark */}
      <text x="160" y="98" textAnchor="middle"
        className="bethrh-ar" fontSize="72" fill={color}>
        بذرة
      </text>

      {/* Rising bars */}
      <rect x="118" y="120" width="8" height="10" rx="1.5" fill={color} opacity="0.32"/>
      <rect x="129" y="116" width="8" height="14" rx="1.5" fill={color} opacity="0.50"/>
      <rect x="140" y="112" width="8" height="18" rx="1.5" fill={color} opacity="0.68"/>
      <rect x="151" y="108" width="8" height="22" rx="1.5" fill={color} opacity="0.85"/>
      <rect x="162" y="104" width="8" height="26" rx="1.5" fill={color}/>
      <polygon points="166,101 170,105 174,101" fill={color}/>

      {/* Coin lines */}
      <line x1="174" y1="118" x2="190" y2="118" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
      <line x1="174" y1="123" x2="187" y2="123" stroke={color} strokeWidth="1.3" strokeLinecap="round"/>
      <line x1="174" y1="127" x2="184" y2="127" stroke={color} strokeWidth="0.9" strokeLinecap="round"/>

      {/* BETHRA wordmark */}
      <text x="160" y="158" textAnchor="middle"
        className="bethrh-en" fontSize="12" letterSpacing="5" fill={`${color}70`}>
        BETHRA
      </text>

      {/* Diamond ornaments */}
      <polygon points="160,170 163,173 160,176 157,173" fill={`${color}80`}/>
      <polygon points="149,170 152,173 149,176 146,173" fill={`${color}48`}/>
      <polygon points="171,170 174,173 171,176 168,173" fill={`${color}48`}/>
      <polygon points="138,170 141,173 138,176 135,173" fill={`${color}22`}/>
      <polygon points="182,170 185,173 182,176 179,173" fill={`${color}22`}/>
    </svg>
  );
}
