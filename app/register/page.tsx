'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, Mail, Lock, User, Loader as Loader2, Sprout } from 'lucide-react';
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

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.205c0-.639-.057-1.252-.164-1.841H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  );
}

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

export default function RegisterPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [role, setRole] = useState<'founder' | 'investor'>('founder');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.replace('/dashboard');
      else setChecking(false);
    });
  }, [router]);

  function validate() {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'يرجى إدخال اسمك الكامل';
    if (!email.includes('@') || !email.includes('.')) errs.email = 'يرجى إدخال بريد إلكتروني صحيح';
    if (password.length < 8) errs.password = 'كلمة المرور يجب أن تكون ٨ أحرف على الأقل';
    if (password !== confirm) errs.confirm = 'كلمتا المرور غير متطابقتين';
    if (!agreed) errs.agreed = 'يجب الموافقة على الشروط والأحكام';
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setError('');

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, role },
      },
    });

    if (signUpError) {
      const msg = signUpError.message.includes('already registered')
        ? 'هذا البريد مسجّل بالفعل. جرّب تسجيل الدخول'
        : 'حدث خطأ. يرجى المحاولة مرة أخرى';
      setError(msg);
      setLoading(false);
    } else {
      router.replace('/profile?onboard=1');
    }
  }

  async function handleGoogle() {
    setGoogleLoading(true);
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/dashboard` },
    });
    setGoogleLoading(false);
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: BG }}>
        <Loader2 className="w-7 h-7 animate-spin" style={{ color: PRIMARY }} />
      </div>
    );
  }

  const canSubmit = name.trim() && email.trim() && password.trim() && confirm.trim() && agreed && !loading;

  const inputBase = {
    borderColor: BORDER,
    fontFamily: "'Noto Kufi Arabic', sans-serif",
    color: TEXT_MAIN,
  };

  function inputFocus(e: React.FocusEvent<HTMLInputElement>) {
    e.target.style.borderColor = 'var(--green-brand)';
    e.target.style.boxShadow = `0 0 0 3px rgba(27,107,62,0.12)`;
  }
  function inputBlur(e: React.FocusEvent<HTMLInputElement>, hasError?: boolean) {
    e.target.style.borderColor = hasError ? 'hsl(0,60%,60%)' : BORDER;
    e.target.style.boxShadow = 'none';
  }

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
            <div className="flex flex-col items-center mb-7">
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

            {/* Title */}
            <h1 className="text-center font-bold text-2xl mb-2" style={{ fontFamily: "'Noto Kufi Arabic', sans-serif", color: TEXT_MAIN }}>
              إنشاء حساب جديد
            </h1>
            <p className="text-center text-sm mb-7" style={{ fontFamily: "'Noto Kufi Arabic', sans-serif", color: TEXT_MUTED }}>
              ابدأ رحلتك الريادية مع بذرة 🌱
            </p>

            {/* Global error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-5 px-4 py-3 rounded-lg text-sm text-right"
                  style={{ background: 'hsl(0,80%,97%)', border: '1px solid hsl(0,60%,85%)', color: 'hsl(0,60%,40%)', fontFamily: "'Noto Kufi Arabic', sans-serif" }}
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit} noValidate className="space-y-5">

              {/* Role selector */}
              <div>
                <label className="block text-sm font-medium mb-2 text-right" style={{ fontFamily: "'Noto Kufi Arabic', sans-serif", color: TEXT_MAIN }}>
                  أنا:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'founder', icon: '🚀', label: 'ريادي (صاحب فكرة)' },
                    { value: 'investor', icon: '💰', label: 'مستثمر' },
                  ].map(r => (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => setRole(r.value as 'founder' | 'investor')}
                      className="flex items-center justify-center gap-2 h-11 rounded-lg text-sm font-medium transition-all border"
                      style={{
                        fontFamily: "'Noto Kufi Arabic', sans-serif",
                        background: role === r.value ? PRIMARY : 'hsl(42,25%,97%)',
                        borderColor: role === r.value ? PRIMARY : BORDER,
                        color: role === r.value ? 'white' : TEXT_MAIN,
                      }}
                    >
                      <span>{r.icon}</span>
                      <span>{r.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="block text-sm font-medium mb-1.5 text-right" style={{ fontFamily: "'Noto Kufi Arabic', sans-serif", color: TEXT_MAIN }}>
                  الاسم الكامل
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={name}
                    onChange={e => { setName(e.target.value); setFieldErrors(p => ({ ...p, name: '' })); }}
                    placeholder="محمد العمري"
                    className="w-full h-12 pr-10 pl-4 rounded-lg border text-sm outline-none transition-all"
                    style={{ ...inputBase, borderColor: fieldErrors.name ? 'hsl(0,60%,60%)' : BORDER }}
                    onFocus={inputFocus}
                    onBlur={e => inputBlur(e, !!fieldErrors.name)}
                  />
                  <User className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: TEXT_MUTED }} />
                </div>
                {fieldErrors.name && <p className="mt-1 text-xs text-right" style={{ color: 'hsl(0,60%,45%)', fontFamily: "'Noto Kufi Arabic', sans-serif" }}>{fieldErrors.name}</p>}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium mb-1.5 text-right" style={{ fontFamily: "'Noto Kufi Arabic', sans-serif", color: TEXT_MAIN }}>
                  البريد الإلكتروني
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={e => { setEmail(e.target.value); setFieldErrors(p => ({ ...p, email: '' })); }}
                    dir="ltr"
                    placeholder="example@email.com"
                    className="w-full h-12 pr-10 pl-4 rounded-lg border text-sm outline-none transition-all"
                    style={{ ...inputBase, fontFamily: "'Noto Sans', sans-serif", borderColor: fieldErrors.email ? 'hsl(0,60%,60%)' : BORDER }}
                    onFocus={inputFocus}
                    onBlur={e => inputBlur(e, !!fieldErrors.email)}
                  />
                  <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: TEXT_MUTED }} />
                </div>
                {fieldErrors.email && <p className="mt-1 text-xs text-right" style={{ color: 'hsl(0,60%,45%)', fontFamily: "'Noto Kufi Arabic', sans-serif" }}>{fieldErrors.email}</p>}
              </div>

              {/* Password */}
              <div>
                <label className="block text-sm font-medium mb-1.5 text-right" style={{ fontFamily: "'Noto Kufi Arabic', sans-serif", color: TEXT_MAIN }}>
                  كلمة المرور
                </label>
                <div className="relative">
                  <input
                    type={showPass ? 'text' : 'password'}
                    value={password}
                    onChange={e => { setPassword(e.target.value); setFieldErrors(p => ({ ...p, password: '' })); }}
                    placeholder="••••••••"
                    className="w-full h-12 pr-10 pl-10 rounded-lg border text-sm outline-none transition-all"
                    style={{ ...inputBase, fontFamily: "'Noto Sans', sans-serif", borderColor: fieldErrors.password ? 'hsl(0,60%,60%)' : BORDER }}
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
                    onChange={e => { setConfirm(e.target.value); setFieldErrors(p => ({ ...p, confirm: '' })); }}
                    placeholder="••••••••"
                    className="w-full h-12 pr-10 pl-10 rounded-lg border text-sm outline-none transition-all"
                    style={{ ...inputBase, fontFamily: "'Noto Sans', sans-serif", borderColor: fieldErrors.confirm ? 'hsl(0,60%,60%)' : BORDER }}
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

              {/* Terms */}
              <div>
                <div className="flex items-start gap-2 flex-row-reverse">
                  <input
                    id="terms"
                    type="checkbox"
                    checked={agreed}
                    onChange={e => { setAgreed(e.target.checked); setFieldErrors(p => ({ ...p, agreed: '' })); }}
                    className="mt-0.5 w-4 h-4 rounded cursor-pointer shrink-0"
                    style={{ accentColor: PRIMARY }}
                  />
                  <label htmlFor="terms" className="text-sm leading-relaxed cursor-pointer select-none text-right" style={{ fontFamily: "'Noto Kufi Arabic', sans-serif", color: TEXT_MUTED }}>
                    أوافق على{' '}
                    <Link href="/terms" className="hover:underline" style={{ color: PRIMARY }}>الشروط والأحكام</Link>
                    {' '}و{' '}
                    <Link href="/privacy" className="hover:underline" style={{ color: PRIMARY }}>سياسة الخصوصية</Link>
                  </label>
                </div>
                {fieldErrors.agreed && <p className="mt-1 text-xs text-right" style={{ color: 'hsl(0,60%,45%)', fontFamily: "'Noto Kufi Arabic', sans-serif" }}>{fieldErrors.agreed}</p>}
              </div>

              {/* Submit */}
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
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'إنشاء حساب'}
              </motion.button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-3 my-6">
              <div className="flex-1 h-px" style={{ background: BORDER }} />
              <span className="text-sm" style={{ fontFamily: "'Noto Kufi Arabic', sans-serif", color: TEXT_MUTED }}>أو</span>
              <div className="flex-1 h-px" style={{ background: BORDER }} />
            </div>

            {/* Google */}
            <motion.button
              type="button"
              onClick={handleGoogle}
              disabled={googleLoading}
              whileTap={{ scale: 0.98 }}
              className="w-full h-12 rounded-lg border flex items-center justify-center gap-3 text-sm font-medium transition-all hover:bg-gray-50"
              style={{ fontFamily: "'Noto Kufi Arabic', sans-serif", borderColor: BORDER, color: TEXT_MAIN, background: 'white' }}
            >
              {googleLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <GoogleIcon />}
              التسجيل بـ Google
            </motion.button>

            {/* Login link */}
            <p className="mt-5 text-center text-sm" style={{ fontFamily: "'Noto Kufi Arabic', sans-serif", color: TEXT_MUTED }}>
              لديك حساب؟{' '}
              <Link href="/login" className="font-semibold hover:underline" style={{ color: PRIMARY }}>
                سجّل دخولك
              </Link>
            </p>
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
