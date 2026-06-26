// 📁 FILE: app/signup/page.tsx
// 📋 ACTION: REPLACE existing file
// ─────────────────────────────────
// FIXED: Removed old Sprout+$ logo → BethrhLogo SVG
//        Removed duplicate SiteHeader + SiteFooter
//        Removed "سوريا" reference → MENA general
//        Updated decorative panel with BethrhLogo
//        Kept all auth logic unchanged
// ─────────────────────────────────
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, CircleCheck as CheckCircle, Loader as Loader2 } from 'lucide-react';
import BethrhLogo from '@/components/BethrhLogo';

const features = [
  'إطار تحقق منظّم خطوة بخطوة',
  'مدرب ذكاء اصطناعي بالعربية',
  'مجموعات مساءلة مع رواد أعمال',
  'تتبع التقدم أسبوعاً بأسبوع',
  'ربط مباشر مع المستثمرين',
];

export default function SignupPage() {
  const router = useRouter();
  const [checking, setChecking]   = useState(true);
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [mode, setMode]           = useState<'signin' | 'signup'>('signup');
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.replace('/dashboard');
      else setChecking(false);
    });
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (mode === 'signup') {
      const { error: signUpError } = await supabase.auth.signUp({ email, password });
      if (signUpError) { setError(signUpError.message); setLoading(false); return; }
      router.replace('/profile?onboard=1');
    } else {
      const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) { setError(signInError.message); setLoading(false); return; }
      router.replace('/dashboard');
    }
    setLoading(false);
  }

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--off-white)' }}>
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--green-brand)' }} />
      </div>
    );
  }

  return (
    <div dir="rtl" className="min-h-screen flex" style={{ background: 'var(--off-white)' }}>

      {/* ── Decorative panel (desktop only, right side in RTL) ── */}
      <div
        className="hidden lg:flex flex-col justify-between w-1/2 p-12 relative overflow-hidden order-last"
        style={{ background: 'var(--green-deep)' }}
      >
        {/* Subtle pattern */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: `repeating-linear-gradient(
              -45deg, transparent, transparent 40px,
              rgba(255,255,255,0.02) 40px, rgba(255,255,255,0.02) 41px
            )`,
          }}
        />
        {/* Gold top border */}
        <div
          className="absolute top-0 left-0 right-0 h-1"
          style={{ background: 'linear-gradient(90deg, var(--gold), var(--gold-light), var(--gold))' }}
        />

        {/* Logo */}
        <div className="relative">
          <BethrhLogo size="md" color="#D4A653" />
        </div>

        {/* Content */}
        <div className="relative">
          <h1
            className="text-white text-4xl font-bold leading-tight mb-6 text-right font-arabic"
            style={{ lineHeight: 1.4 }}
          >
            انطلق بفكرتك
            <br />
            <span style={{ color: 'var(--gold)' }}>اصنع مستقبلك</span>
          </h1>
          <p className="text-white/70 text-lg mb-10 text-right font-arabic leading-relaxed">
            منصة بذرة تأخذك من الفكرة إلى مشروع ناجح — تحليلاً وتصميماً وتمويلاً.
          </p>
          <div className="space-y-4" dir="rtl">
            {features.map(item => (
              <div key={item} className="flex items-center gap-3 flex-row-reverse">
                <CheckCircle className="w-5 h-5 shrink-0" style={{ color: 'var(--gold)' }} />
                <span className="text-white/85 font-arabic">{item}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="text-white/35 text-sm text-right font-arabic relative">
          © ٢٠٢٦ Life Easy LLC · bethra.co
        </p>
      </div>

      {/* ── Form panel ── */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">

          {/* Mobile logo */}
          <div className="lg:hidden flex justify-center mb-10">
            <BethrhLogo size="sm" color="#1B6B3E" />
          </div>

          {/* Back link */}
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm mb-8 transition-colors font-arabic"
            style={{ color: 'var(--gray-mid)' }}
            onMouseEnter={e => (e.currentTarget.style.color = 'var(--green-brand)')}
            onMouseLeave={e => (e.currentTarget.style.color = 'var(--gray-mid)')}
          >
            <ArrowLeft className="w-4 h-4 rotate-180" />
            العودة للرئيسية
          </Link>

          {/* Title */}
          <h2 className="text-2xl font-bold mb-1 text-right font-arabic" style={{ color: 'var(--text-dark)' }}>
            {mode === 'signin' ? 'أهلاً بعودتك' : 'ابدأ رحلتك'}
          </h2>
          <p className="mb-8 text-right font-arabic" style={{ color: 'var(--gray-mid)' }}>
            {mode === 'signin' ? 'سجّل دخولك إلى حسابك' : 'أنشئ حسابك المجاني — بدون بطاقة ائتمان'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label
                className="block text-sm font-medium mb-1.5 text-right font-arabic"
                style={{ color: 'var(--text-dark)' }}
              >
                البريد الإلكتروني
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                dir="ltr"
                placeholder="you@example.com"
                className="w-full px-3.5 py-2.5 rounded-lg border text-sm outline-none transition-all"
                style={{ borderColor: 'var(--gray-light)', color: 'var(--text-dark)', background: 'white' }}
                onFocus={e => { e.target.style.borderColor = 'var(--green-brand)'; e.target.style.boxShadow = '0 0 0 3px rgba(27,107,62,0.12)'; }}
                onBlur={e => { e.target.style.borderColor = 'var(--gray-light)'; e.target.style.boxShadow = 'none'; }}
              />
            </div>

            {/* Password */}
            <div>
              <label
                className="block text-sm font-medium mb-1.5 text-right font-arabic"
                style={{ color: 'var(--text-dark)' }}
              >
                كلمة المرور
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                dir="ltr"
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 rounded-lg border text-sm outline-none transition-all"
                style={{ borderColor: 'var(--gray-light)', color: 'var(--text-dark)', background: 'white' }}
                onFocus={e => { e.target.style.borderColor = 'var(--green-brand)'; e.target.style.boxShadow = '0 0 0 3px rgba(27,107,62,0.12)'; }}
                onBlur={e => { e.target.style.borderColor = 'var(--gray-light)'; e.target.style.boxShadow = 'none'; }}
              />
            </div>

            {/* Error */}
            {error && (
              <div
                className="px-3.5 py-2.5 rounded-lg text-sm text-right font-arabic"
                style={{ background: 'hsl(0,80%,97%)', border: '1px solid hsl(0,60%,85%)', color: 'hsl(0,60%,40%)' }}
              >
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg font-medium text-sm transition-all font-arabic"
              style={{
                background: 'var(--green-brand)',
                color: 'white',
                opacity: loading ? 0.7 : 1,
              }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.background = 'var(--green-mid)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--green-brand)'; }}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  {mode === 'signin' ? 'تسجيل الدخول' : 'إنشاء حساب مجاني'}
                  <ArrowLeft className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Toggle mode */}
          <p className="text-center text-sm mt-6 font-arabic" style={{ color: 'var(--gray-mid)' }}>
            {mode === 'signin' ? 'ليس لديك حساب؟' : 'لديك حساب بالفعل؟'}{' '}
            <button
              onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(''); }}
              className="font-semibold hover:underline transition-colors font-arabic"
              style={{ color: 'var(--green-brand)' }}
            >
              {mode === 'signin' ? 'سجّل الآن' : 'سجّل دخولك'}
            </button>
          </p>

          {/* Links to full register/login */}
          <div className="mt-4 text-center">
            <Link
              href="/register"
              className="text-xs hover:underline font-arabic"
              style={{ color: 'var(--gray-mid)' }}
            >
              إنشاء حساب كامل مع اختيار الدور →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
