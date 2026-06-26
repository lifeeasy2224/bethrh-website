'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, CircleCheck as CheckCircle, Sprout } from 'lucide-react';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';

const features = [
  'إطار تحقق منظّم',
  'تدريب بالذكاء الاصطناعي بالعربية',
  'مجموعات مساءلة مع الأقران',
  'تتبع التقدم أسبوعاً بأسبوع',
];

export default function SignupPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'signin' | 'signup'>('signup');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div dir="rtl" className="min-h-screen flex flex-col bg-background">
      <SiteHeader />
      <div className="flex flex-1 pt-16">
      {/* Decorative panel */}
      <div
        className="hidden lg:flex flex-col justify-between w-1/2 p-12 relative overflow-hidden order-last"
        style={{ background: 'linear-gradient(145deg, var(--green-deep) 0%, var(--green-brand) 55%, var(--gold) 100%)' }}
      >
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }} />
        <div className="flex items-center gap-2.5 relative flex-row-reverse">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center relative shrink-0"
            style={{ background: 'rgba(212,166,83,0.15)' }}
          >
            <Sprout className="w-8 h-8 absolute" style={{ color: 'var(--gold)', opacity: 0.45 }} />
            <span className="relative font-bold text-xl" style={{ color: 'var(--gold)', fontFamily: "'Nunito Sans', sans-serif" }}>$</span>
          </div>
          <span className="font-kufam font-bold text-4xl text-white">بذرة</span>
        </div>
        <div className="relative">
          <h1 className="text-white text-4xl font-bold leading-tight mb-6 text-right">
            نمِّ شركتك الناشئة<br />من سوريا إلى العالم
          </h1>
          <p className="text-white/80 text-lg mb-10 text-right">
            حاضنة المشروعات الريادية، تحقق حلمك في ١٢ أسبوعاً: من الفكرة، إيجاد الزبائن وحتى تبني مشروعاً حقيقياً وحقق أحلامك
          </p>
          <div className="space-y-4" dir="rtl">
            {features.map(item => (
              <div key={item} className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-white/90 shrink-0" />
                <span className="text-white/90">{item}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="text-white/50 text-sm text-right">مبني لرواد الأعمال السوريين حول العالم</div>
      </div>

      {/* Form panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2.5 mb-10 flex-row-reverse">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center relative shrink-0"
              style={{ background: 'var(--green-deep)' }}
            >
              <Sprout className="w-7 h-7 absolute" style={{ color: 'var(--gold)', opacity: 0.45 }} />
              <span className="relative font-bold text-lg" style={{ color: 'var(--gold)', fontFamily: "'Nunito Sans', sans-serif" }}>$</span>
            </div>
            <span className="font-kufam font-bold text-3xl" style={{ color: 'var(--green-deep)' }}>بذرة</span>
          </div>

          <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors">
            <ArrowLeft className="w-4 h-4 rotate-180" />
            العودة للرئيسية
          </Link>

          <h2 className="text-2xl font-bold mb-1 text-right">
            {mode === 'signin' ? 'أهلاً بعودتك' : 'ابدأ رحلتك'}
          </h2>
          <p className="text-muted-foreground mb-8 text-right">
            {mode === 'signin' ? 'سجّل دخولك إلى حسابك' : 'أنشئ حسابك المجاني'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5 text-right">البريد الإلكتروني</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                dir="ltr"
                placeholder="you@example.com"
                className="w-full px-3.5 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring transition text-left"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5 text-right">كلمة المرور</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                dir="ltr"
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring transition text-left"
              />
            </div>

            {error && (
              <div className="px-3.5 py-2.5 rounded-lg bg-destructive/10 text-destructive text-sm text-right">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-2.5 rounded-lg font-medium text-sm hover:bg-primary/90 transition disabled:opacity-60"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  {mode === 'signin' ? 'تسجيل الدخول' : 'إنشاء حساب'}
                  <ArrowLeft className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            {mode === 'signin' ? 'ليس لديك حساب؟' : 'لديك حساب بالفعل؟'}{' '}
            <button
              onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(''); }}
              className="text-primary font-medium hover:underline"
            >
              {mode === 'signin' ? 'سجّل الآن' : 'سجّل دخولك'}
            </button>
          </p>
        </div>
      </div>
      </div>
      <SiteFooter />
    </div>
  );
}
