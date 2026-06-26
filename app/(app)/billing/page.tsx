'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CreditCard, ArrowLeft, Check, TriangleAlert as AlertTriangle, Calendar, ChevronDown, ChevronUp, Receipt } from 'lucide-react';

const PRIMARY = 'var(--green-brand)';
const TEXT_MAIN = 'var(--text-dark)';
const TEXT_MUTED = 'var(--gray-mid)';
const BORDER = 'var(--gray-light)';

/* Mock data — replace with real Supabase/Stripe data */
const MOCK_SUBSCRIPTION = {
  plan: 'growth',
  planName: 'نمو',
  planIcon: '🌿',
  status: 'active',
  billingCycle: 'monthly',
  price: 9,
  nextBillingDate: '٣ يوليو ٢٠٢٦',
  trialEndsAt: null,
  card: { brand: 'Visa', last4: '4242' },
  invoices: [
    { id: 'INV-001', date: '٣ يونيو ٢٠٢٦', amount: 9, status: 'paid' },
    { id: 'INV-002', date: '٣ مايو ٢٠٢٦', amount: 9, status: 'paid' },
  ],
};

export default function BillingPage() {
  const router = useRouter();
  const sub = MOCK_SUBSCRIPTION;
  const [showCancel, setShowCancel] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [showInvoices, setShowInvoices] = useState(false);

  async function handleCancel() {
    setCancelling(true);
    // Stripe cancellation goes here
    await new Promise(r => setTimeout(r, 1200));
    setCancelling(false);
    setShowCancel(false);
    alert('تم إلغاء الاشتراك. يبقى حسابك نشطاً حتى نهاية الفترة المدفوعة.');
  }

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">

        {/* Back */}
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors flex-row-reverse"
        >
          <ArrowLeft className="w-4 h-4 rotate-180" />
          العودة
        </button>

        <div>
          <h1 className="text-2xl font-bold text-right" style={{ color: TEXT_MAIN }}>الفوترة والاشتراك</h1>
          <p className="text-sm text-muted-foreground text-right mt-1">إدارة اشتراكك وطريقة الدفع وفواتيرك</p>
        </div>

        {/* Current plan */}
        <div className="bg-card rounded-2xl border border-border p-6">
          <h2 className="font-semibold text-sm mb-4 text-right" style={{ color: TEXT_MAIN }}>الباقة الحالية</h2>
          <div className="flex items-center gap-4 flex-row-reverse mb-5">
            <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center text-2xl shrink-0">
              {sub.planIcon}
            </div>
            <div className="text-right">
              <div className="font-bold text-foreground">باقة {sub.planName}</div>
              <div className="text-sm text-muted-foreground">
                ${sub.price}/شهر · {sub.billingCycle === 'monthly' ? 'شهري' : 'سنوي'}
              </div>
              <div className="flex items-center gap-1.5 mt-1">
                <span
                  className="inline-block w-2 h-2 rounded-full"
                  style={{ background: 'var(--green-brand)' }}
                />
                <span className="text-xs text-foreground font-medium">نشط</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-row-reverse text-sm text-muted-foreground border-t border-border pt-4 mb-4">
            <Calendar className="w-4 h-4 shrink-0" />
            <span>تجديد تلقائي بتاريخ: <strong style={{ color: TEXT_MAIN }}>{sub.nextBillingDate}</strong></span>
          </div>

          <div className="flex flex-wrap gap-3 flex-row-reverse">
            <Link
              href="/pricing"
              className="px-4 py-2 rounded-lg text-sm font-medium text-white transition-all hover:opacity-90"
              style={{ background: PRIMARY }}
            >
              ترقية الباقة
            </Link>
            <Link
              href="/pricing"
              className="px-4 py-2 rounded-lg text-sm font-medium border border-border hover:bg-secondary transition-colors"
              style={{ color: TEXT_MAIN }}
            >
              تغيير الباقة
            </Link>
          </div>
        </div>

        {/* Payment method */}
        <div className="bg-card rounded-2xl border border-border p-6">
          <h2 className="font-semibold text-sm mb-4 text-right" style={{ color: TEXT_MAIN }}>طريقة الدفع</h2>
          <div className="flex items-center gap-3 flex-row-reverse mb-4">
            <div
              className="w-11 h-7 rounded-md flex items-center justify-center shrink-0 bg-primary"
            >
              <span className="text-white text-[10px] font-bold">{sub.card.brand}</span>
            </div>
            <div className="text-right">
              <div className="text-sm font-medium" style={{ color: TEXT_MAIN }}>
                •••• •••• •••• {sub.card.last4}
              </div>
              <div className="text-xs text-muted-foreground">البطاقة الافتراضية</div>
            </div>
          </div>
          <button
            className="inline-flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-lg border border-border hover:bg-secondary transition-colors flex-row-reverse"
            style={{ color: TEXT_MAIN }}
            onClick={() => alert('ستُضاف إمكانية تحديث طريقة الدفع عبر Stripe')}
          >
            <CreditCard className="w-4 h-4" />
            تحديث طريقة الدفع
          </button>
        </div>

        {/* Invoices */}
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <button
            onClick={() => setShowInvoices(v => !v)}
            className="w-full flex items-center justify-between p-6 hover:bg-secondary/30 transition-colors flex-row-reverse"
          >
            <div className="flex items-center gap-2 flex-row-reverse">
              <Receipt className="w-4 h-4 text-primary" />
              <h2 className="font-semibold text-sm text-right" style={{ color: TEXT_MAIN }}>الفواتير السابقة</h2>
            </div>
            {showInvoices
              ? <ChevronUp className="w-4 h-4 text-muted-foreground" />
              : <ChevronDown className="w-4 h-4 text-muted-foreground" />
            }
          </button>
          {showInvoices && (
            <div className="border-t border-border divide-y divide-border">
              {sub.invoices.map(inv => (
                <div key={inv.id} className="flex items-center justify-between px-6 py-3 flex-row-reverse">
                  <div className="text-right">
                    <div className="text-sm font-medium" style={{ color: TEXT_MAIN }}>{inv.id}</div>
                    <div className="text-xs text-muted-foreground">{inv.date}</div>
                  </div>
                  <div className="flex items-center gap-3 flex-row-reverse">
                    <span className="text-sm font-semibold" style={{ color: TEXT_MAIN }}>${inv.amount}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-foreground font-medium">مدفوعة</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Cancel subscription */}
        <div className="bg-card rounded-2xl border border-border p-6">
          <h2 className="font-semibold text-sm mb-2 text-right" style={{ color: TEXT_MAIN }}>إلغاء الاشتراك</h2>
          <p className="text-xs text-muted-foreground text-right mb-4 leading-relaxed">
            يمكنك الإلغاء في أي وقت. بعد الإلغاء، يبقى حسابك نشطاً حتى نهاية الفترة المدفوعة الحالية.
          </p>
          {!showCancel ? (
            <button
              onClick={() => setShowCancel(true)}
              className="text-sm font-medium px-4 py-2 rounded-lg border border-border transition-colors hover:bg-secondary"
              style={{ color: 'var(--text-dark)' }}
            >
              إلغاء الاشتراك
            </button>
          ) : (
            <div
              className="rounded-xl p-4 space-y-3 bg-secondary border border-border"
            >
              <div className="flex items-start gap-2 flex-row-reverse">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-destructive" />
                <p className="text-sm font-medium text-right text-destructive" style={{ opacity: 0.9 }}>
                  هل أنت متأكد من إلغاء الاشتراك؟
                </p>
              </div>
              <p className="text-xs text-muted-foreground text-right">
                ستفقد الوصول لكل ميزات باقة {sub.planName} بعد تاريخ {sub.nextBillingDate}.
              </p>
              <div className="flex gap-3 flex-row-reverse">
                <button
                  onClick={handleCancel}
                  disabled={cancelling}
                  className="px-4 py-2 rounded-lg text-sm font-medium text-white transition-all bg-destructive"
                >
                  {cancelling ? 'جارٍ الإلغاء...' : 'نعم، ألغِ الاشتراك'}
                </button>
                <button
                  onClick={() => setShowCancel(false)}
                  className="px-4 py-2 rounded-lg text-sm font-medium border border-border hover:bg-secondary transition-colors"
                  style={{ color: TEXT_MAIN }}
                >
                  تراجع
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
