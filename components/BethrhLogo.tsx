// 📁 FILE: components/BethrhLogo.tsx
'use client';

import React from 'react';

type LogoSize = 'xs' | 'sm' | 'md' | 'lg';
type LogoVariant = 'full' | 'compact'; // full = with wealth bars, compact = clean shield only

interface BethrhLogoProps {
  size?: LogoSize;
  color?: string;
  variant?: LogoVariant;
}

const BethrhLogo: React.FC<BethrhLogoProps> = ({
  size = 'md',
  color = '#D4A653',
  variant = 'full',
}) => {
  // Compact variant: shield + بذرة + BETHRH (used in header, footer, small spaces)
  if (variant === 'compact') {
    const widths: Record<LogoSize, number> = { xs: 60, sm: 100, md: 160, lg: 240 };
    const heights: Record<LogoSize, number> = { xs: 23, sm: 38, md: 60, lg: 90 };
    return (
      <svg
        width={widths[size]}
        height={heights[size]}
        viewBox="0 0 320 240"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-label="بذرة Bethrh Logo"
      >
        {/* Open-top shield */}
        <line x1="52" y1="10" x2="52" y2="140" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
        <line x1="268" y1="10" x2="268" y2="140" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
        <path d="M52,140 Q52,200 160,220 Q268,200 268,140" fill="none" stroke={color} strokeWidth="2.5" />
        {/* Anchor dots */}
        <circle cx="52" cy="140" r="5" fill={color} />
        <circle cx="268" cy="140" r="5" fill={color} />
        <circle cx="160" cy="220" r="5" fill={color} />
        {/* بذرة wordmark */}
        <text
          x="160" y="108"
          textAnchor="middle"
          fontFamily="'Noto Kufi Arabic', sans-serif"
          fontSize="86"
          fontWeight="700"
          fill={color}
        >
          بذرة
        </text>
        {/* BETHRH */}
        <text
          x="160" y="158"
          textAnchor="middle"
          fontFamily="'Montserrat', sans-serif"
          fontSize="13"
          fontWeight="800"
          letterSpacing="5"
          fill={`${color}72`}
        >
          BETHRH
        </text>
      </svg>
    );
  }

  // Full variant: shield + بذرة + wealth bars + diamonds (used in sidebar, large displays)
  const widths: Record<LogoSize, number> = { xs: 70, sm: 140, md: 200, lg: 320 };
  const heights: Record<LogoSize, number> = { xs: 74, sm: 148, md: 212, lg: 340 };
  return (
    <svg
      width={widths[size]}
      height={heights[size]}
      viewBox="0 0 320 340"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="بذرة Bethrh Logo"
    >
      {/* Open-top shield */}
      <line x1="52" y1="20" x2="52" y2="188" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <line x1="268" y1="20" x2="268" y2="188" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <path d="M52,188 Q52,280 160,310 Q268,280 268,188" fill="rgba(212,166,83,0.04)" stroke={color} strokeWidth="2" />
      {/* Inner shield */}
      <line x1="68" y1="20" x2="68" y2="185" stroke={`${color}30`} strokeWidth="0.8" />
      <line x1="252" y1="20" x2="252" y2="185" stroke={`${color}30`} strokeWidth="0.8" />
      <path d="M68,185 Q68,260 160,288 Q252,260 252,185" fill="none" stroke={`${color}28`} strokeWidth="0.8" />
      {/* Anchor dots */}
      <circle cx="52" cy="188" r="5" fill={color} />
      <circle cx="268" cy="188" r="5" fill={color} />
      <circle cx="160" cy="310" r="5.5" fill={color} />
      <line x1="88" y1="52" x2="232" y2="52" stroke={`${color}30`} strokeWidth="0.8" />
      {/* بذرة wordmark */}
      <text x="160" y="148" textAnchor="middle" fontFamily="'Noto Kufi Arabic', sans-serif" fontSize="110" fontWeight="700" fill={color}>بذرة</text>
      <line x1="88" y1="168" x2="232" y2="168" stroke={`${color}30`} strokeWidth="0.8" />
      {/* Rising bars */}
      <rect x="118" y="178" width="10" height="14" rx="2" fill={color} opacity="0.35" />
      <rect x="131" y="172" width="10" height="20" rx="2" fill={color} opacity="0.52" />
      <rect x="144" y="166" width="10" height="26" rx="2" fill={color} opacity="0.70" />
      <rect x="157" y="160" width="10" height="32" rx="2" fill={color} opacity="0.87" />
      <rect x="170" y="154" width="10" height="38" rx="2" fill={color} />
      <polygon points="175,151 179,155 183,151" fill={color} />
      {/* Coin stack */}
      <line x1="184" y1="175" x2="202" y2="175" stroke={color} strokeWidth="2.2" strokeLinecap="round" />
      <line x1="184" y1="181" x2="198" y2="181" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
      <line x1="184" y1="186" x2="194" y2="186" stroke={color} strokeWidth="1.1" strokeLinecap="round" />
      {/* BETHRH */}
      <text x="160" y="228" textAnchor="middle" fontFamily="'Montserrat', sans-serif" fontSize="17" fontWeight="800" letterSpacing="6" fill={`${color}80`}>BETHRH</text>
      {/* Diamonds */}
      <polygon points="160,248 164,252 160,256 156,252" fill={`${color}88`} />
      <polygon points="145,248 149,252 145,256 141,252" fill={`${color}50`} />
      <polygon points="175,248 179,252 175,256 171,252" fill={`${color}50`} />
    </svg>
  );
};

export default BethrhLogo;
