'use client';

// Public unsubscribe landing (Arabic / RTL). Reached from the footer link in
// every بذرة email (?email=...&campaign=...). Records the opt-out via the
// record_campaign_unsubscribe SECURITY DEFINER RPC — a direct anon insert into
// email_suppression_list is blocked by RLS, so the RPC is the reliable path.

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CircleCheck, TriangleAlert, Loader as Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

type Status = 'loading' | 'success' | 'error';

export default function UnsubscribePage() {
  const [status, setStatus] = useState<Status>('loading');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const email = params.get('email');
    const campaign = params.get('campaign') ?? '';
    if (!email) {
      setStatus('error');
      return;
    }
    (async () => {
      const { error } = await supabase.rpc('record_campaign_unsubscribe', {
        p_email: email,
        p_campaign: campaign,
      });
      setStatus(error ? 'error' : 'success');
    })();
  }, []);

  return (
    <div
      dir="rtl"
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'var(--off-white)' }}
    >
      <div
        className="w-full max-w-md rounded-2xl border p-8 text-center"
        style={{ background: '#fff', borderColor: 'var(--gray-light)' }}
      >
        <div className="mb-6 flex items-center justify-center gap-1 text-2xl font-extrabold">
          <span style={{ color: 'var(--green-brand)' }}>بذرة</span>
        </div>

        {status === 'loading' && (
          <div className="flex flex-col items-center gap-3 py-6">
            <Loader2 className="h-7 w-7 animate-spin" style={{ color: 'var(--green-brand)' }} />
            <p style={{ color: 'var(--gray-mid)' }}>جارٍ تنفيذ طلبك…</p>
          </div>
        )}

        {status === 'success' && (
          <div className="flex flex-col items-center gap-4">
            <div
              className="flex h-16 w-16 items-center justify-center rounded-full"
              style={{ background: 'rgba(27,107,62,0.12)' }}
            >
              <CircleCheck className="h-9 w-9" style={{ color: 'var(--green-brand)' }} />
            </div>
            <h1 className="text-xl font-bold" style={{ color: 'var(--text-dark)' }}>
              تم إلغاء اشتراكك
            </h1>
            <p style={{ color: 'var(--gray-mid)' }}>
              لن تصلك بعد الآن رسائل بريدية من بذرة. يمكنك العودة في أي وقت من إعدادات حسابك.
            </p>
            <Link
              href="/"
              className="mt-2 inline-block rounded-lg px-5 py-2.5 font-semibold text-white"
              style={{ background: 'var(--green-brand)' }}
            >
              العودة إلى بذرة
            </Link>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center gap-4">
            <div
              className="flex h-16 w-16 items-center justify-center rounded-full"
              style={{ background: 'rgba(212,166,83,0.15)' }}
            >
              <TriangleAlert className="h-9 w-9" style={{ color: 'var(--gold)' }} />
            </div>
            <h1 className="text-xl font-bold" style={{ color: 'var(--text-dark)' }}>
              تعذّر تنفيذ الطلب
            </h1>
            <p style={{ color: 'var(--gray-mid)' }}>
              الرابط غير صالح أو حدث خطأ. يمكنك إدارة تفضيلات البريد من إعدادات حسابك، أو مراسلتنا على
              info@bethra.co.
            </p>
            <Link
              href="/"
              className="mt-2 inline-block rounded-lg px-5 py-2.5 font-semibold text-white"
              style={{ background: 'var(--green-brand)' }}
            >
              العودة إلى بذرة
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
