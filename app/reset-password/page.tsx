// 📁 FILE: app/reset-password/page.tsx
// 📋 ACTION: REPLACE existing file
// ─────────────────────────────────
// FIXED: Removed old Sprout+$ logo → BethrhLogo
//        Removed duplicate SiteHeader + SiteFooter
//        Removed framer-motion → CSS transitions
//        Kept all reset password logic unchanged
// ─────────────────────────────────
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, Lock, Loader as Loader2, CircleCheck } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import BethrhLogo from '@/components/BethrhLogo';

const PRIMARY       = 'var(--green-brand)';
const PRIMARY_HOVER = 'var(--green-mid)';
const TEXT_MAIN     = 'var(--text-dark)';
const TEXT_MUTED    = 'var(--gray-mid)';
const BORDER        = 'var(--gray-light)';
const BG            = 'var(--off-white)';

function PasswordStrength({ password }: { password: string }) {
  if (!password) return null;
  const score = [
    password.length >= 8,
    /\d/.test(password),
    /[^a-zA-Z0-9]/.test(password),
    /[A-Z]/.test(password),
  ].filter(Boolean).length;

  const levels = [
    { label: 'ضعيفة',  color: 'hsl(0,70%,55%)',    width: '33%'  },
    { label: 'متوسطة', color: 'hsl(43,85%,48%)',   width: '66%'  },
    { label: 'قوية',   color: 'var(--green-brand)', width: '100%' },
  ];
  const { label, color, width } = levels[score <= 1 ? 0 : score <= 2 ? 1 : 2];

  return (
    <div className="mt-2">
      <div className="h-1 rounded-full overflow-hidden" style={{ background: BORDER }}>
        <div className="h-full rounded-full transition-all duration-300" style={{ background: color, width }} />
      </div>
      <p className="text-xs mt-1 text-right font-arabic" style={{ color }}>
        قوة كلمة المرور: {label}
      </p>
    </div>
  );
}

export default function ResetPasswordPage() {
  const router = useRouter();
  const [ready, setReady]         = useState(false);
  const [invalid, setInvalid]     = useState(false);
  const [password, setPassword]   = useState('');
  const [confirm, setConfirm]     = useState('');
  const [showPass, setShowPass]   = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading]     = useState(false);
  const [done, setDone]           = useState(false);
  const [error, setError]         = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ password?: string; confirm?: string }>({});

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY' || event === 'SIGNED_IN') setReady(true);
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true);
      else {
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
    if (password !== confirm) errs.confirm  = 'كلمتا المرور غير متطابقتين';
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
    e.target.style.boxShadow   = '0 0 0 3px rgba(27,107,62,0.12)';
  };
  const inputBlur = (e: React.FocusEvent<HTMLInputElement>, hasErr?: boolean) => {
    e.target.style.borderColor = hasErr ? 'hsl(0,60%,60%)' : BORDER;
    e.target.style.boxShadow   = 'none';
  };

  const canSubmit = password.trim() && confirm.trim() && !loading;

  return (
    <div dir="rtl" className="min-h-screen flex items-center justify-center px-4 py-20"
      style={{ background: BG }}>

      <div className="w-full" style={{ maxWidth: 420 }}>

        {/* ── Card ── */}
        <div className="rounded-2xl bg-white px-10 py-10"
          style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>

          {/* ── Logo ── */}
          <div className="flex justify-center mb-7">
            <BethrhLogo size="sm" color="#1B6B3E" />
          </div>

          {/* ── Loading state ── */}
          {!ready && !invalid && (
            <div className="text-center py-6">
              <Loader2 className="w-7 h-7 animate-spin mx-auto mb-4" style={{ color: PRIMARY }} />
              <p className="text-sm font-arabic" style={{ color: TEXT_MUTED }}>جارٍ التحقق من الرابط...</p>
            </div>
          )}

          {/* ── Invalid link ── */}
          {invalid && (
            <div className="text-center">
              <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ background: 'rgba(220,38,38,0.08)' }}>
                <Lock className="w-7 h-7" style={{ color: 'hsl(0,60%,50%)' }} />
              </div>
              <h2 className="font-bold text-xl mb-2 font-arabic" style={{ color: TEXT_MAIN }}>
                الرابط غير صالح
              </h2>
              <p className="text-sm mb-6 font-arabic" style={{ color: TEXT_MUTED }}>
                انتهت صلاحية هذا الرابط أو تم استخدامه بالفعل.
              </p>
              <Link
                href="/forgot-password"
                className="inline-flex items-center justify-center h-11 px-6 rounded-lg font-semibold text-sm text-white font-arabic"
                style={{ background: PRIMARY }}
              >
                طلب رابط جديد
              </Link>
            </div>
          )}

          {/* ── Success ── */}
          {done && (
            <div className="text-center">
              <div className="flex justify-center mb-5">
                <div className="w-16 h-16 rounded-full flex items-center justify-center"
                  style={{ background: 'rgba(27,107,62,0.08)' }}>
                  <CircleCheck className="w-8 h-8" style={{ color: PRIMARY }} />
                </div>
              </div>
              <h2 className="font-bold text-xl mb-2 font-arabic" style={{ color: TEXT_MAIN }}>
                تم تحديث كلمة المرور!
              </h2>
              <p className="text-sm font-arabic" style={{ color: TEXT_MUTED }}>
                جارٍ تحويلك للوحة التحكم...
              </p>
            </div>
          )}

          {/* ── Form ── */}
          {ready && !done && (
            <div>
              <h1 className="text-center font-bold text-2xl mb-2 font-arabic" style={{ color: TEXT_MAIN }}>
                تعيين كلمة مرور جديدة
              </h1>
              <p className="text-center text-sm mb-8 font-arabic" style={{ color: TEXT_MUTED }}>
                اختر كلمة مرور قوية لحسابك
              </p>

              {error && (
                <div className="mb-5 px-4 py-3 rounded-lg text-sm text-right font-arabic"
                  style={{ background: 'hsl(0,80%,97%)', border: '1px solid hsl(0,60%,85%)', color: 'hsl(0,60%,40%)' }}>
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} noValidate className="space-y-5">

                {/* New password */}
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-right font-arabic" style={{ color: TEXT_MAIN }}>
                    كلمة المرور الجديدة
                  </label>
                  <div className="relative">
                    <input
                      type={showPass ? 'text' : 'password'}
                      value={password}
                      onChange={e => { setPassword(e.target.value); setFieldErrors(p => ({ ...p, password: undefined })); }}
                      placeholder="••••••••"
                      className="w-full h-12 pr-10 pl-10 rounded-lg border text-sm outline-none transition-all"
                      style={{ borderColor: fieldErrors.password ? 'hsl(0,60%,60%)' : BORDER, color: TEXT_MAIN }}
                      onFocus={inputFocus}
                      onBlur={e => inputBlur(e, !!fieldErrors.password)}
                    />
                    <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: TEXT_MUTED }} />
                    <button type="button" onClick={() => setShowPass(v => !v)} tabIndex={-1}
                      className="absolute left-3 top-1/2 -translate-y-1/2 hover:opacity-70 transition-opacity"
                      style={{ color: TEXT_MUTED }}>
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {fieldErrors.password && <p className="mt-1 text-xs text-right font-arabic" style={{ color: 'hsl(0,60%,45%)' }}>{fieldErrors.password}</p>}
                  <PasswordStrength password={password} />
                </div>

                {/* Confirm password */}
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-right font-arabic" style={{ color: TEXT_MAIN }}>
                    تأكيد كلمة المرور
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      value={confirm}
                      onChange={e => { setConfirm(e.target.value); setFieldErrors(p => ({ ...p, confirm: undefined })); }}
                      placeholder="••••••••"
                      className="w-full h-12 pr-10 pl-10 rounded-lg border text-sm outline-none transition-all"
                      style={{ borderColor: fieldErrors.confirm ? 'hsl(0,60%,60%)' : BORDER, color: TEXT_MAIN }}
                      onFocus={inputFocus}
                      onBlur={e => inputBlur(e, !!fieldErrors.confirm)}
                    />
                    <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: TEXT_MUTED }} />
                    <button type="button" onClick={() => setShowConfirm(v => !v)} tabIndex={-1}
                      className="absolute left-3 top-1/2 -translate-y-1/2 hover:opacity-70 transition-opacity"
                      style={{ color: TEXT_MUTED }}>
                      {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {fieldErrors.confirm && <p className="mt-1 text-xs text-right font-arabic" style={{ color: 'hsl(0,60%,45%)' }}>{fieldErrors.confirm}</p>}
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={!canSubmit}
                  className="w-full h-12 rounded-lg font-semibold text-base text-white flex items-center justify-center gap-2 transition-all font-arabic"
                  style={{
                    background: canSubmit ? PRIMARY : 'rgba(27,107,62,0.4)',
                    boxShadow:  canSubmit ? '0 2px 12px rgba(27,107,62,0.3)' : 'none',
                    cursor:     canSubmit ? 'pointer' : 'not-allowed',
                  }}
                  onMouseEnter={e => { if (canSubmit) e.currentTarget.style.background = PRIMARY_HOVER; }}
                  onMouseLeave={e => { if (canSubmit) e.currentTarget.style.background = PRIMARY; }}
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'حفظ كلمة المرور'}
                </button>
              </form>
            </div>
          )}
        </div>

        {/* ── Footer note ── */}
        <p className="mt-8 text-center text-xs font-arabic" style={{ color: 'var(--gray-mid)', fontWeight: 300 }}>
          © ٢٠٢٦ Life Easy LLC — جميع الحقوق محفوظة
        </p>
      </div>
    </div>
  );
}
