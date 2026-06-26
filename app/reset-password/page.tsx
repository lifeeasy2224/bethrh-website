'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, Lock, Loader as Loader2, CircleCheck, Sprout } from 'lucide-react';
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

function PasswordStrength({ password }: { password: string }) {
  if (!password) return null;
  const hasLength = password.length >= 8;
  const hasNumber = /\d/.test(password);
  const hasSymbol = /[^a-zA-Z0-9]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const score = [hasLength, hasNumber, hasSymbol, hasUpper].filter(Boolean).length;
  const levels = [
    { label: 'ضعيفة', color: 'hsl(0,70%,55%)', width: '33%' },
    { label: 'متوسطة', color: 'hsl(43,85%,48%)', width: '66%' },
    { label: 'قوية', color: 'var(--green-brand)' },
  ];
  const level = score <= 1 ? 0 : score <= 2 ? 1 : 2;
  const { label, color, width } = levels[level];
  return (
    <div className="mt-2">
      <div className="h-1 rounded-full overflow-hidden" style={{ background: BORDER }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width }}
          transition={{ duration: 0.3 }}
          className="h-full rounded-full"
          style={{ background: color }}
        />
      </div>
      <p className="text-xs mt-1 text-right" style={{ color, fontFamily: "'Noto Kufi Arabic', sans-serif" }}>
        قوة كلمة المرور: {label}
      </p>
    </div>
  );
}

export default function ResetPasswordPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [invalid, setInvalid] = useState(false);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ password?: string; confirm?: string }>({});

  useEffect(() => {
    // Supabase sends the token in the URL hash; onAuthStateChange fires with SIGNED_IN
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setReady(true);
      } else if (event === 'SIGNED_IN') {
        setReady(true);
      }
    });

    // Also check if there's already a session (from the email link)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true);
      else {
        // Wait a moment for the hash-based session to resolve
        setTimeout(() => {
          supabase.auth.getSession().then(({ data: { session: s } }) => {
            if (s) setReady(true);
            else setInvalid(true);
          });
        }, 1500);
      }
    });

    return () => { subscription.unsubscribe(); };
  }, []);

  function validate() {
    const errs: { password?: string; confirm?: string } = {};
    if (password.length < 8) errs.password = 'كلمة المرور يجب أن تكون ٨ أحرف على الأقل';
    if (password !== confirm) errs.confirm = 'كلمتا المرور غير متطابقتين';
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setError('');

    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      setError('حدث خطأ أثناء تحديث كلمة المرور. يرجى المحاولة مرة أخرى');
      setLoading(false);
    } else {
      setDone(true);
      setTimeout(() => router.replace('/dashboard'), 2500);
    }
  }

  const inputFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.style.borderColor = PRIMARY;
    e.target.style.boxShadow = `0 0 0 3px rgba(27,107,62,0.12)`;
  };
  const inputBlur = (e: React.FocusEvent<HTMLInputElement>, hasErr?: boolean) => {
    e.target.style.borderColor = hasErr ? 'hsl(0,60%,60%)' : BORDER;
    e.target.style.boxShadow = 'none';
  };

  const canSubmit = password.trim() && confirm.trim() && !loading;

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
              {/* Loading state */}
              {!ready && !invalid && (
                <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-center py-6">
                  <Loader2 className="w-7 h-7 animate-spin mx-auto mb-4" style={{ color: PRIMARY }} />
                  <p className="text-sm" style={{ fontFamily: "'Noto Kufi Arabic', sans-serif", color: TEXT_MUTED }}>جارٍ التحقق من الرابط...</p>
                </motion.div>
              )}

              {/* Invalid link */}
              {invalid && (
                <motion.div key="invalid" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
                  <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(220,38,38,0.08)' }}>
                    <Lock className="w-7 h-7" style={{ color: 'hsl(0,60%,50%)' }} />
                  </div>
                  <h2 className="font-bold text-xl mb-2" style={{ fontFamily: "'Noto Kufi Arabic', sans-serif", color: TEXT_MAIN }}>الرابط غير صالح</h2>
                  <p className="text-sm mb-6" style={{ fontFamily: "'Noto Kufi Arabic', sans-serif", color: TEXT_MUTED }}>
                    انتهت صلاحية هذا الرابط أو تم استخدامه بالفعل.
                  </p>
                  <Link href="/forgot-password" className="inline-flex items-center justify-center h-11 px-6 rounded-lg font-semibold text-sm text-white" style={{ fontFamily: "'Noto Kufi Arabic', sans-serif", background: PRIMARY }}>
                    طلب رابط جديد
                  </Link>
                </motion.div>
              )}

              {/* Success */}
              {done && (
                <motion.div key="done" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
                  <div className="flex justify-center mb-5">
                    <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: 'rgba(27,107,62,0.08)' }}>
                      <CircleCheck className="w-8 h-8" style={{ color: PRIMARY }} />
                    </div>
                  </div>
                  <h2 className="font-bold text-xl mb-2" style={{ fontFamily: "'Noto Kufi Arabic', sans-serif", color: TEXT_MAIN }}>تم تحديث كلمة المرور!</h2>
                  <p className="text-sm" style={{ fontFamily: "'Noto Kufi Arabic', sans-serif", color: TEXT_MUTED }}>جارٍ تحويلك للوحة التحكم...</p>
                </motion.div>
              )}

              {/* Form */}
              {ready && !done && (
                <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <h1 className="text-center font-bold text-2xl mb-2" style={{ fontFamily: "'Noto Kufi Arabic', sans-serif", color: TEXT_MAIN }}>
                    تعيين كلمة مرور جديدة
                  </h1>
                  <p className="text-center text-sm mb-8" style={{ fontFamily: "'Noto Kufi Arabic', sans-serif", color: TEXT_MUTED }}>
                    اختر كلمة مرور قوية لحسابك
                  </p>

                  {error && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                      className="mb-5 px-4 py-3 rounded-lg text-sm text-right"
                      style={{ background: 'hsl(0,80%,97%)', border: '1px solid hsl(0,60%,85%)', color: 'hsl(0,60%,40%)', fontFamily: "'Noto Kufi Arabic', sans-serif" }}>
                      {error}
                    </motion.div>
                  )}

                  <form onSubmit={handleSubmit} noValidate className="space-y-5">
                    {/* New password */}
                    <div>
                      <label className="block text-sm font-medium mb-1.5 text-right" style={{ fontFamily: "'Noto Kufi Arabic', sans-serif", color: TEXT_MAIN }}>
                        كلمة المرور الجديدة
                      </label>
                      <div className="relative">
                        <input
                          type={showPass ? 'text' : 'password'}
                          value={password}
                          onChange={e => { setPassword(e.target.value); setFieldErrors(p => ({ ...p, password: undefined })); }}
                          placeholder="••••••••"
                          className="w-full h-12 pr-10 pl-10 rounded-lg border text-sm outline-none transition-all"
                          style={{ borderColor: fieldErrors.password ? 'hsl(0,60%,60%)' : BORDER, fontFamily: "'Noto Sans', sans-serif", color: TEXT_MAIN }}
                          onFocus={inputFocus}
                          onBlur={e => inputBlur(e, !!fieldErrors.password)}
                        />
                        <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: TEXT_MUTED }} />
                        <button type="button" onClick={() => setShowPass(v => !v)} tabIndex={-1}
                          className="absolute left-3 top-1/2 -translate-y-1/2 hover:opacity-70 transition-opacity" style={{ color: TEXT_MUTED }}>
                          {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {fieldErrors.password && <p className="mt-1 text-xs text-right" style={{ color: 'hsl(0,60%,45%)', fontFamily: "'Noto Kufi Arabic', sans-serif" }}>{fieldErrors.password}</p>}
                      <PasswordStrength password={password} />
                    </div>

                    {/* Confirm */}
                    <div>
                      <label className="block text-sm font-medium mb-1.5 text-right" style={{ fontFamily: "'Noto Kufi Arabic', sans-serif", color: TEXT_MAIN }}>
                        تأكيد كلمة المرور
                      </label>
                      <div className="relative">
                        <input
                          type={showConfirm ? 'text' : 'password'}
                          value={confirm}
                          onChange={e => { setConfirm(e.target.value); setFieldErrors(p => ({ ...p, confirm: undefined })); }}
                          placeholder="••••••••"
                          className="w-full h-12 pr-10 pl-10 rounded-lg border text-sm outline-none transition-all"
                          style={{ borderColor: fieldErrors.confirm ? 'hsl(0,60%,60%)' : BORDER, fontFamily: "'Noto Sans', sans-serif", color: TEXT_MAIN }}
                          onFocus={inputFocus}
                          onBlur={e => inputBlur(e, !!fieldErrors.confirm)}
                        />
                        <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: TEXT_MUTED }} />
                        <button type="button" onClick={() => setShowConfirm(v => !v)} tabIndex={-1}
                          className="absolute left-3 top-1/2 -translate-y-1/2 hover:opacity-70 transition-opacity" style={{ color: TEXT_MUTED }}>
                          {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {fieldErrors.confirm && <p className="mt-1 text-xs text-right" style={{ color: 'hsl(0,60%,45%)', fontFamily: "'Noto Kufi Arabic', sans-serif" }}>{fieldErrors.confirm}</p>}
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
                      {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'حفظ كلمة المرور'}
                    </motion.button>
                  </form>
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
