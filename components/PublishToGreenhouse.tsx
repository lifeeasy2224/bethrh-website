'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { X, Loader as Loader2, BadgeCheck, ExternalLink } from 'lucide-react';
import Link from 'next/link';

type Props = {
  ideaId: string;
  ideaScore: number;
  ideaTitle: string | null;
  onClose?: () => void;
  // if true, renders as inline trigger instead of auto-popup
  manualTrigger?: boolean;
};

type ExistingListing = {
  id: string;
  brand_name: string;
  status: string;
};

export default function PublishToGreenhouse({ ideaId, ideaScore, ideaTitle, onClose, manualTrigger = false }: Props) {
  const [open, setOpen] = useState(!manualTrigger);
  const [brandName, setBrandName] = useState(ideaTitle ?? '');
  const [logo, setLogo] = useState('');
  const [tagline, setTagline] = useState('');
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished] = useState(false);
  const [existing, setExisting] = useState<ExistingListing | null>(null);
  const [loadingExisting, setLoadingExisting] = useState(true);

  const meetsThreshold = ideaScore >= 75;

  const checkExisting = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setLoadingExisting(false); return; }
    const res = await fetch(`/api/greenhouse/publish?ideaId=${ideaId}`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    if (res.ok) {
      const data = await res.json();
      if (data?.id) setExisting(data);
    }
    setLoadingExisting(false);
  }, [ideaId]);

  useEffect(() => { checkExisting(); }, [checkExisting]);

  async function handlePublish() {
    if (!brandName.trim()) return;
    setPublishing(true);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { setPublishing(false); return; }

    const res = await fetch('/api/greenhouse/publish', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ ideaId, brandName, logo, tagline }),
    });

    setPublishing(false);
    if (res.ok) {
      const data = await res.json();
      setPublished(true);
      setExisting(data);
    }
  }

  function close() {
    setOpen(false);
    onClose?.();
  }

  // If already published, show badge instead of modal
  if (!loadingExisting && existing && !manualTrigger) {
    return (
      <div className="flex items-center gap-2 p-3 rounded-xl flex-row-reverse" style={{ background: 'hsl(144,58%,95%)', border: '1px solid hsl(144,40%,80%)' }}>
        <div className="flex-1 text-right">
          <p className="font-bold text-sm" style={{ color: 'var(--green-deep)' }}>
            🪴 بذرتك منشورة في المشتل
          </p>
          <p className="text-xs" style={{ color: 'var(--green-brand)' }}>&ldquo;{existing.brand_name}&rdquo; مرئية للمستثمرين الآن</p>
        </div>
        <Link
          href="/greenhouse"
          className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg transition-all"
          style={{ background: 'var(--green-deep)', color: 'var(--white)' }}
        >
          عرض <ExternalLink className="w-3 h-3" />
        </Link>
      </div>
    );
  }

  // Manual trigger button
  if (manualTrigger && !open) {
    if (!meetsThreshold) return null;
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-sm transition-all flex-row-reverse"
        style={{ background: 'var(--green-deep)', color: 'var(--white)' }}
      >
        <span>🪴</span>
        انشر في المشتل
      </button>
    );
  }

  if (!open) return null;
  if (!meetsThreshold && !manualTrigger) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.55)' }} dir="rtl">
      <div className="w-full max-w-lg rounded-2xl overflow-hidden" style={{ background: 'var(--white)' }}>
        {/* Header */}
        <div
          className="px-6 py-5 flex items-center justify-between flex-row-reverse"
          style={{ background: 'var(--green-deep)' }}
        >
          <div className="text-right">
            <div className="flex items-center gap-2 flex-row-reverse mb-0.5">
              <span className="text-2xl">🪴</span>
              <p className="font-extrabold text-lg text-white">بذرتك جاهزة للمشتل!</p>
            </div>
            <p className="text-xs" style={{ color: 'hsl(144,58%,78%)' }}>نقاطك {ideaScore}/100 — تجاوزت حاجز ٧٥ للنشر</p>
          </div>
          <button onClick={close} aria-label="إغلاق" className="w-11 h-11 flex items-center justify-center rounded-lg transition-colors" style={{ background: 'hsl(0,0%,100%,0.12)' }}>
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        <div className="px-6 py-6">
          {published ? (
            <div className="text-center py-4">
              <div className="text-5xl mb-4">🪴</div>
              <p className="font-bold text-lg mb-2" style={{ color: 'var(--text-dark)' }}>تم النشر في المشتل!</p>
              <p className="text-sm mb-5" style={{ color: 'var(--gray-mid)' }}>
                فكرتك مرئية الآن للمستثمرين. ستُبلَّغ عند كل طلب تواصل.
              </p>
              <div className="flex gap-3 justify-center">
                <Link
                  href="/greenhouse"
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl font-bold text-sm"
                  style={{ background: 'var(--green-deep)', color: 'var(--white)' }}
                >
                  <ExternalLink className="w-4 h-4" /> شاهد المشتل
                </Link>
                <button onClick={close} className="px-5 py-2.5 rounded-xl text-sm border transition-colors" style={{ borderColor: 'var(--gray-light)', color: 'var(--gray-mid)' }}>
                  إغلاق
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Explanation */}
              <p className="text-sm text-right leading-relaxed" style={{ color: 'var(--gray-mid)' }}>
                بعد النشر، يرى المستثمرون <strong>٤ معلومات فقط</strong>: الاسم، القطاع، العائد على الاستثمار، ونقطة التعادل.
                باقي التفاصيل تُكشف فقط بعد موافقتك على التواصل.
              </p>

              {/* Brand name */}
              <div>
                <label className="block text-sm font-bold mb-1.5 text-right" style={{ color: 'var(--text-dark)' }}>
                  اسم بذرتك للمستثمرين <span style={{ color: 'hsl(0,60%,50%)' }}>*</span>
                </label>
                <input
                  value={brandName}
                  onChange={e => setBrandName(e.target.value)}
                  placeholder="مثال: GreenBox، سلة، حصاد..."
                  maxLength={50}
                  className="w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 text-right"
                  style={{ borderColor: 'var(--gray-light)', background: 'var(--off-white)' }}
                  dir="rtl"
                />
              </div>

              {/* Logo */}
              <div>
                <label className="block text-sm font-bold mb-1.5 text-right" style={{ color: 'var(--text-dark)' }}>
                  الشعار <span className="font-normal text-xs" style={{ color: 'var(--gray-mid)' }}>(اختياري — رمز تعبيري أو رابط صورة)</span>
                </label>
                <input
                  value={logo}
                  onChange={e => setLogo(e.target.value)}
                  placeholder="🌿 أو https://..."
                  className="w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 text-right"
                  style={{ borderColor: 'var(--gray-light)', background: 'var(--off-white)' }}
                  dir="ltr"
                />
              </div>

              {/* Tagline */}
              <div>
                <div className="flex items-center justify-between mb-1.5 flex-row-reverse">
                  <label className="text-sm font-bold" style={{ color: 'var(--text-dark)' }}>
                    وصف من سطر <span className="font-normal text-xs" style={{ color: 'var(--gray-mid)' }}>(اختياري)</span>
                  </label>
                  <span className="text-xs" style={{ color: tagline.length > 50 ? 'var(--gold)' : 'var(--gray-mid)' }}>
                    {tagline.length}/60
                  </span>
                </div>
                <input
                  value={tagline}
                  onChange={e => setTagline(e.target.value.slice(0, 60))}
                  placeholder="جملة واحدة تشرح فكرتك للمستثمر..."
                  className="w-full px-3.5 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 text-right"
                  style={{ borderColor: 'var(--gray-light)', background: 'var(--off-white)' }}
                  dir="rtl"
                />
              </div>

              {/* Privacy note */}
              <div className="rounded-xl p-3.5 flex items-start gap-2.5 flex-row-reverse" style={{ background: 'hsl(43,85%,96%)', border: '1px solid var(--gray-light)' }}>
                <BadgeCheck className="w-4 h-4 shrink-0 mt-0.5" style={{ color: 'var(--gold)' }} />
                <p className="text-xs text-right leading-relaxed" style={{ color: 'hsl(43,60%,30%)' }}>
                  سيظهر للمستثمرين: الاسم، القطاع، العائد على الاستثمار، ونقطة التعادل فقط.
                  باقي البيانات تبقى خاصة حتى تأذن بالكشف.
                </p>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-1">
                <button
                  onClick={handlePublish}
                  disabled={!brandName.trim() || publishing}
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm transition-all"
                  style={{
                    background: brandName.trim() && !publishing ? 'var(--green-deep)' : 'var(--gray-light)',
                    color: brandName.trim() && !publishing ? 'var(--white)' : 'var(--gray-mid)',
                  }}
                >
                  {publishing ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> جاري النشر...</>
                  ) : (
                    <><span>🪴</span> انشر في المشتل</>
                  )}
                </button>
                <button
                  onClick={close}
                  className="px-4 py-3 rounded-xl text-sm border font-medium transition-colors"
                  style={{ borderColor: 'var(--gray-light)', color: 'var(--gray-mid)' }}
                >
                  لاحقاً
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
