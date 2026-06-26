'use client';

import { useEffect, useState } from 'react';
import { Cookie, X, Check } from 'lucide-react';

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;
const CONSENT_KEY = 'cookie_consent';

function loadGA() {
  if (!GA_ID || typeof window === 'undefined') return;
  if (document.getElementById('ga-script')) return;

  const script1 = document.createElement('script');
  script1.id = 'ga-script';
  script1.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  script1.async = true;
  document.head.appendChild(script1);

  window.dataLayer = window.dataLayer || [];
  window.gtag = function (...args: unknown[]) { window.dataLayer!.push(args); };
  window.gtag('js', new Date());
  window.gtag('config', GA_ID, { anonymize_ip: true });
}

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(CONSENT_KEY);
    if (!saved) {
      setVisible(true);
    } else if (saved === 'accepted') {
      loadGA();
    }
  }, []);

  function accept() {
    localStorage.setItem(CONSENT_KEY, 'accepted');
    loadGA();
    setVisible(false);
  }

  function decline() {
    localStorage.setItem(CONSENT_KEY, 'declined');
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-card border border-border rounded-2xl shadow-2xl p-5 w-full max-w-md">
        <div className="flex items-start gap-3 mb-4">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
            <Cookie className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-sm mb-1">We use cookies</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              We use essential cookies for login sessions and, with your consent, Google Analytics to improve the platform. No advertising cookies. See our{' '}
              <a href="/privacy" className="text-primary hover:underline">Privacy Policy</a>.
            </p>
          </div>
          <button
            onClick={decline}
            className="shrink-0 w-11 h-11 rounded-md hover:bg-secondary flex items-center justify-center transition"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
        <div className="flex gap-2 justify-end">
          <button
            onClick={decline}
            className="px-3.5 py-1.5 text-xs rounded-lg border border-border hover:bg-secondary transition font-medium"
          >
            Decline analytics
          </button>
          <button
            onClick={accept}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition font-medium"
          >
            <Check className="w-3 h-3" />
            Accept all
          </button>
        </div>
      </div>
    </div>
  );
}
