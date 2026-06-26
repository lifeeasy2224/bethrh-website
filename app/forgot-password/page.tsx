'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, ArrowRight, Loader as Loader2, CircleCheck, Sprout } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';

const PRIMARY = 'var(--green-brand)';
const PRIMARY_HOVER = 'var(--green-mid)';
const TEXT_MAIN = 'var(--text-dark)';
const TEXT_MUTED = 'var(--gray-mid)';
const BORDER = 'var(--gray-light)';
const BG = 'var(--off-white)';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [countdown, setCountdown] = useState(0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || loading) return;
    setLoading(true);
    setError('');

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (resetError) {
      setError('حدث خطأ. يرجى التحقق من البريد الإلكتروني والمحاولة مجدداً');
      setLoading(false);
    } else {
      setSent(true);
      setLoading(false);
      startCountdown();
    }
  }

  function startCountdown() {
    setCountdown(60);
    const interval = setInterval(() => {
      setCountdown(c => {
        if (c <= 1) { clearInterval(interval); return 0; }
        return c - 1;
      });
    }, 1000);
  }

  async function handleResend() {
    if (countdown > 0 || loading) return;
    setLoading(true);
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setLoading(false);
    startCountdown();
  }

  const canSubmit = email.includes('@') && email.includes('.') && !loading;

  return (
    <div dir="rtl" className="min-h-screen flex flex-col" style={{ background: BG }}>
      <SiteHeader />

      <main className="flex-1 flex items-center justify-center px-4 py-20">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="w-full"
          style={{ maxWidth: 420 }}
        >
          <div className="rounded-2xl bg-white px-10 py-10" style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>

            {/* Logo */}
            <div className="flex justify-center mb-7">
              <div className="flex items-center gap-2.5 flex-row-reverse">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center relative shrink-0"
                  style={{ background: 'var(--green-deep)' }}
                >
                  <Sprout className="w-5 h-5 absolute" style={{ color: 'var(--gold)', opacity: 0.45 }} />
                  <span className="relative font-bold text-sm" style={{ color: 'var(--gold)', fontFamily: "'Nunito Sans', sans-serif" }}>$</span>
                </div>
                <span className="font-bold text-2xl" style={{ fontFamily: "'Noto Kufi Arabic', sans-serif", color: 'var(--green-deep)' }}>بذرة</span>
              </div>
            </div>

            <AnimatePresence mode="wait">
              {!sent ? (
                <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <h1 className="text-center font-bold text-2xl mb-2" style={{ fontFamily: "'Noto Kufi Arabic', sans-serif", color: TEXT_MAIN }}>
                    استعادة كلمة المرور
                  </h1>
                  <p className="text-center text-sm mb-8" style={{ fontFamily: "'Noto Kufi Arabic', sans-serif", color: TEXT_MUTED }}>
                    أدخل بريدك وسنرسل لك رابط إعادة التعيين
                  </p>

                  {error && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="mb-5 px-4 py-3 rounded-lg text-sm text-right"
                      style={{ background: 'hsl(0,80%,97%)', border: '1px solid hsl(0,60%,85%)', color: 'hsl(0,60%,40%)', fontFamily: "'Noto Kufi Arabic', sans-serif" }}
                    >
                      {error}
                    </motion.div>
                  )}

                  <form onSubmit={handleSubmit} noValidate className="space-y-5">
                    <div>
                      <label className="block text-sm font-medium mb-1.5 text-right" style={{ fontFamily: "'Noto Kufi Arabic', sans-serif", color: TEXT_MAIN }}>
                        البريد الإلكتروني
                      </label>
                      <div className="relative">
                        <input
                          type="email"
                          value={email}
                          onChange={e => setEmail(e.target.value)}
                          dir="ltr"
                          placeholder="example@email.com"
                          className="w-full h-12 pr-10 pl-4 rounded-lg border text-sm outline-none transition-all"
                          style={{ borderColor: BORDER, fontFamily: "'Noto Sans', sans-serif", color: TEXT_MAIN }}
                          onFocus={e => { e.target.style.borderColor = 'var(--green-brand)'; e.target.style.boxShadow = `0 0 0 3px rgba(27,107,62,0.12)`; }}
                          onBlur={e => { e.target.style.borderColor = BORDER; e.target.style.boxShadow = 'none'; }}
                        />
                        <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: TEXT_MUTED }} />
                      </div>
                    </div>

                    <motion.button
                      type="submit"
                      disabled={!canSubmit}
                      whileTap={{ scale: 0.98 }}
                      className="w-full h-12 rounded-lg font-semibold text-base text-white flex items-center justify-center gap-2 transition-all"
                      style={{
                        fontFamily: "'Noto Kufi Arabic', sans-serif",
                        background: canSubmit ? PRIMARY : 'rgba(27,107,62,0.4)',
                        boxShadow: canSubmit ? `0 2px 12px rgba(27,107,62,0.3)` : 'none',
                        cursor: canSubmit ? 'pointer' : 'not-allowed',
                      }}
                      onMouseEnter={e => { if (canSubmit) (e.currentTarget as HTMLButtonElement).style.background = PRIMARY_HOVER; }}
                      onMouseLeave={e => { if (canSubmit) (e.currentTarget as HTMLButtonElement).style.background = PRIMARY; }}
                    >
                      {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'إرسال رابط التعيين'}
                    </motion.button>
                  </form>

                  <div className="mt-6 text-center">
                    <Link href="/login" className="inline-flex items-center gap-1.5 text-sm transition-colors hover:underline flex-row-reverse" style={{ fontFamily: "'Noto Kufi Arabic', sans-serif", color: PRIMARY }}>
                      <ArrowRight className="w-4 h-4" />
                      تذكرت كلمة المرور؟ عودة لتسجيل الدخول
                    </Link>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center"
                >
                  <div className="flex justify-center mb-5">
                    <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: 'rgba(27,107,62,0.08)' }}>
                      <CircleCheck className="w-8 h-8" style={{ color: PRIMARY }} />
                    </div>
                  </div>
                  <h2 className="font-bold text-xl mb-3" style={{ fontFamily: "'Noto Kufi Arabic', sans-serif", color: TEXT_MAIN }}>
                    تم الإرسال!
                  </h2>
                  <p className="text-sm leading-relaxed mb-6" style={{ fontFamily: "'Noto Kufi Arabic', sans-serif", color: TEXT_MUTED }}>
                    تحقق من بريدك الإلكتروني.<br />
                    أرسلنا رابط إعادة تعيين كلمة المرور.
                  </p>

                  <button
                    onClick={handleResend}
                    disabled={countdown > 0 || loading}
                    className="text-sm font-medium transition-all hover:underline"
                    style={{
                      fontFamily: "'Noto Kufi Arabic', sans-serif",
                      color: countdown > 0 ? TEXT_MUTED : PRIMARY,
                      cursor: countdown > 0 ? 'default' : 'pointer',
                    }}
                  >
                    {loading ? (
                      <span className="flex items-center gap-1 justify-center"><Loader2 className="w-4 h-4 animate-spin" /> جارٍ الإرسال...</span>
                    ) : countdown > 0 ? (
                      `لم يصلك؟ إعادة الإرسال بعد ${countdown}ث`
                    ) : (
                      'لم يصلك؟ إعادة الإرسال'
                    )}
                  </button>

                  <div className="mt-6">
                    <Link href="/login" className="inline-flex items-center gap-1.5 text-sm hover:underline flex-row-reverse" style={{ fontFamily: "'Noto Kufi Arabic', sans-serif", color: PRIMARY }}>
                      <ArrowRight className="w-4 h-4" />
                      العودة لتسجيل الدخول
                    </Link>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <p className="mt-8 text-center text-xs" style={{ fontFamily: "'Noto Kufi Arabic', sans-serif", color: 'var(--gray-mid)', fontWeight: 300 }}>
            © ٢٠٢٦ Life Easy LLC — جميع الحقوق محفوظة
          </p>
        </motion.div>
      </main>

      <SiteFooter />
    </div>
  );
}
