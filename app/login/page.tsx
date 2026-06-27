// 📁 FILE: app/login/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Mail, Lock, Loader as Loader2 } from 'lucide-react';
import BethrhLogo from '@/components/BethrhLogo';

export default function LoginPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        // Check role and redirect accordingly
        const { data: profile } = await supabase
          .from('users').select('role').eq('id', session.user.id).maybeSingle();
        router.replace(profile?.role === 'investor' ? '/greenhouse' : '/founder-dashboard');
      } else {
        setChecking(false);
      }
    });
  }, [router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    const { data, error: err } = await supabase.auth.signInWithPassword({ email, password });

    if (err) {
      setError('البريد أو كلمة المرور غير صحيحة');
      setLoading(false);
      return;
    }

    // Check if profile exists
    const { data: profile } = await supabase
      .from('users').select('role').eq('id', data.user.id).maybeSingle();

    if (!profile) {
      // No profile yet → onboarding
      router.replace('/profile?onboard=1');
    } else if (profile.role === 'investor') {
      router.replace('/greenhouse');
    } else {
      router.replace('/founder-dashboard');
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
    <div dir="rtl" className="min-h-screen flex items-center justify-center px-4 py-20"
      style={{ background: 'var(--off-white)' }}>

      <div className="w-full" style={{ maxWidth: 420 }}>
        <div className="rounded-2xl bg-white px-10 py-10"
          style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>

          {/* Logo */}
          <div className="flex justify-center mb-7">
            <BethrhLogo size="sm" color="#1B6B3E" />
          </div>

          <h1 className="text-center font-bold text-2xl mb-2 font-arabic"
            style={{ color: 'var(--text-dark)' }}>
            أهلاً بعودتك
          </h1>
          <p className="text-center text-sm mb-7 font-arabic" style={{ color: 'var(--gray-mid)' }}>
            سجّل دخولك لمتابعة رحلتك 🌱
          </p>

          {error && (
            <div className="mb-5 px-4 py-3 rounded-lg text-sm text-right font-arabic"
              style={{ background: 'hsl(0,80%,97%)', border: '1px solid hsl(0,60%,85%)', color: 'hsl(0,60%,40%)' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-1.5 text-right font-arabic"
                style={{ color: 'var(--text-dark)' }}>
                البريد الإلكتروني
              </label>
              <div className="relative">
                <input
                  type="email" value={email} onChange={e => setEmail(e.target.value)}
                  required dir="ltr" placeholder="example@email.com"
                  className="w-full h-12 pr-10 pl-4 rounded-lg border text-sm outline-none transition-all"
                  style={{ borderColor: 'var(--gray-light)', color: 'var(--text-dark)' }}
                  onFocus={e => { e.target.style.borderColor = 'var(--green-brand)'; e.target.style.boxShadow = '0 0 0 3px rgba(27,107,62,0.12)'; }}
                  onBlur={e => { e.target.style.borderColor = 'var(--gray-light)'; e.target.style.boxShadow = 'none'; }}
                />
                <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                  style={{ color: 'var(--gray-mid)' }} />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <Link href="/forgot-password"
                  className="text-xs hover:underline font-arabic"
                  style={{ color: 'var(--green-brand)' }}>
                  نسيت كلمة المرور؟
                </Link>
                <label className="text-sm font-medium font-arabic" style={{ color: 'var(--text-dark)' }}>
                  كلمة المرور
                </label>
              </div>
              <div className="relative">
                <input
                  type="password" value={password} onChange={e => setPassword(e.target.value)}
                  required placeholder="••••••••"
                  className="w-full h-12 pr-10 pl-4 rounded-lg border text-sm outline-none transition-all"
                  style={{ borderColor: 'var(--gray-light)', color: 'var(--text-dark)' }}
                  onFocus={e => { e.target.style.borderColor = 'var(--green-brand)'; e.target.style.boxShadow = '0 0 0 3px rgba(27,107,62,0.12)'; }}
                  onBlur={e => { e.target.style.borderColor = 'var(--gray-light)'; e.target.style.boxShadow = 'none'; }}
                />
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none"
                  style={{ color: 'var(--gray-mid)' }} />
              </div>
            </div>

            <button
              type="submit" disabled={loading || !email || !password}
              className="w-full h-12 rounded-lg font-semibold text-base text-white flex items-center justify-center gap-2 transition-all font-arabic"
              style={{
                background: loading || !email || !password ? 'rgba(27,107,62,0.4)' : 'var(--green-brand)',
                cursor: loading || !email || !password ? 'not-allowed' : 'pointer',
              }}
              onMouseEnter={e => { if (!loading && email && password) e.currentTarget.style.background = 'var(--green-mid)'; }}
              onMouseLeave={e => { if (!loading && email && password) e.currentTarget.style.background = 'var(--green-brand)'; }}
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                <><ArrowLeft className="w-4 h-4" />تسجيل الدخول</>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-sm font-arabic" style={{ color: 'var(--gray-mid)' }}>
            ليس لديك حساب؟{' '}
            <Link href="/register" className="font-semibold hover:underline font-arabic"
              style={{ color: 'var(--green-brand)' }}>
              سجّل الآن
            </Link>
          </p>
        </div>

        <p className="mt-8 text-center text-xs font-arabic" style={{ color: 'var(--gray-mid)', fontWeight: 300 }}>
          © ٢٠٢٦ Life Easy LLC — جميع الحقوق محفوظة
        </p>
      </div>
    </div>
  );
}
