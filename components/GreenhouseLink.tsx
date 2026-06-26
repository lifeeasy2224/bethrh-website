'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

interface Props {
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}

export default function GreenhouseLink({ className, style, children }: Props) {
  const [href, setHref] = useState('/investor');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setHref('/greenhouse');
    });
  }, []);

  return (
    <Link href={href} className={className} style={style}>
      {children}
    </Link>
  );
}
