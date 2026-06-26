'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CircleCheck, Sparkles, ArrowLeft } from 'lucide-react';

const PLAN_NAMES: Record<string, string> = {
  growth: 'نمو',
  launch: 'إطلاق',
  family: 'عائلي',
};

const PRIMARY = 'var(--green-brand)';
const TEXT_MAIN = 'var(--text-dark)';
const TEXT_MUTED = 'var(--gray-mid)';

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams();
  const planId = searchParams.get('plan') ?? 'growth';
  const planName = PLAN_NAMES[planId] ?? 'نمو';

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4" dir="rtl">
      <div className="max-w-md w-full text-center space-y-6">

        {/* Icon */}
        <div className="flex justify-center">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center bg-primary/10"
          >
            <CircleCheck className="w-10 h-10" style={{ color: PRIMARY }} />
          </div>
        </div>

        {/* Message */}
        <div>
          <h1 className="text-2xl font-bold mb-2" style={{ color: TEXT_MAIN }}>
            أهلاً بك في باقة {planName}!
          </h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            تم تفعيل اشتراكك بنجاح. تجربتك المجانية لمدة ١٤ يوماً بدأت الآن. لن تُحاسَب قبل انتهاء التجربة.
          </p>
        </div>

        {/* Highlights */}
        <div
          className="rounded-2xl p-5 text-right space-y-3 bg-primary/5 border border-primary/20"
        >
          <div className="flex items-center gap-2 flex-row-reverse">
            <Sparkles className="w-4 h-4 shrink-0" style={{ color: PRIMARY }} />
            <span className="text-sm font-medium" style={{ color: PRIMARY }}>ما الذي يمكنك فعله الآن؟</span>
          </div>
          {[
            'أضف فكرتك الأولى أو استعرض أفكارك الحالية',
            'تحدث مع المدرب الذكي بلا حدود',
            'ابنِ نموذج عملك على Canvas',
            'انضم لمجموعة مساءلة مع رواد أعمال آخرين',
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-2 flex-row-reverse">
              <div className="w-1.5 h-1.5 rounded-full shrink-0 mt-2" style={{ background: PRIMARY }} />
              <p className="text-sm text-muted-foreground">{item}</p>
            </div>
          ))}
        </div>

        {/* CTAs */}
        <div className="flex flex-col gap-3">
          <Link
            href="/founder-dashboard"
            className="w-full py-3 rounded-xl font-bold text-sm text-white text-center transition-all hover:opacity-90 bg-primary"
            style={{ boxShadow: `0 2px 16px rgba(27, 107, 62, 0.3)` }}
          >
            ابدأ رحلتك الآن
          </Link>
          <Link
            href="/ideas"
            className="w-full py-3 rounded-xl font-medium text-sm text-center border border-border hover:bg-secondary transition-colors"
            style={{ color: TEXT_MAIN }}
          >
            إضافة فكرة جديدة
          </Link>
        </div>

        <p className="text-xs text-muted-foreground">
          ستصلك رسالة تأكيد على بريدك الإلكتروني. للمساعدة:{' '}
          <Link href="/help" className="underline hover:text-foreground transition-colors">
            مركز المساعدة
          </Link>
        </p>
      </div>
    </div>
  );
}
