import React from 'react';

interface SafeMessageProps {
  text: string;
  className?: string;
  dir?: string;
}

function parseSegments(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*.*?\*\*|\n)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    if (part === '\n') {
      return <br key={i} />;
    }
    return part;
  });
}

export default function SafeMessage({ text, className, dir }: SafeMessageProps) {
  return (
    <span className={className} dir={dir}>
      {parseSegments(text)}
    </span>
  );
}
