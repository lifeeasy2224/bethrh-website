// 📁 FILE: components/BethrhWordmark.tsx
// Simple inline wordmark for header — no shield, just the بذرة text logo
'use client';

import React from 'react';

interface BethrhWordmarkProps {
  color?: string; // color of the بذرة text
}

const BethrhWordmark: React.FC<BethrhWordmarkProps> = ({
  color = '#1B6B3E', // green for light backgrounds (header)
}) => {
  return (
    <div className="flex items-center gap-2 flex-row-reverse">
      {/* Dot accent */}
      <div
        className="w-2 h-2 rounded-full shrink-0"
        style={{ background: '#D4A653' }}
      />
      {/* بذرة wordmark */}
      <span
        style={{
          fontFamily: "'Noto Kufi Arabic', sans-serif",
          fontWeight: 700,
          fontSize: '1.375rem',
          color: color,
          lineHeight: 1,
          letterSpacing: '-0.01em',
        }}
      >
        بذرة
      </span>
    </div>
  );
};

export default BethrhWordmark;
