'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAdminAuth } from '@/lib/admin-auth-context';

export default function AdminLoginPage() {
  const { admin, loading, login } = useAdminAuth();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If already logged in as admin, skip straight to the dashboard
  useEffect(() => {
    if (!loading && admin) {
      router.replace('/admin');
    }
  }, [loading, admin, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      router.replace('/admin');
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? 'بيانات الدخول غير صحيحة، أو ليس لديك صلاحية الوصول.'
          : 'حدث خطأ غير متوقع.'
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div
        dir="rtl"
        className="min-h-screen flex items-center justify-center"
        style={{ background: '#0F3D24', fontFamily: "'Noto Kufi Arabic', sans-serif" }}
      >
        <div className="w-10 h-10 border-2 border-[#D4A653] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div
      dir="rtl"
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: '#0F3D24', fontFamily: "'Noto Kufi Arabic', sans-serif" }}
    >
      <div className="w-full max-w-sm">
        {/* Logo / brand mark */}
        <div className="flex flex-col items-center mb-8">
          <div
            className="w-14 h-14 rounded-xl flex items-center justify-center font-bold text-xl mb-3"
            style={{ background: '#D4A653', color: '#0F3D24' }}
          >
            ب
          </div>
          <h1 className="text-xl font-bold" style={{ color: '#D4A653' }}>بذرة</h1>
          <p className="text-xs tracking-wide mt-1" style={{ color: 'rgba(212,166,83,0.6)' }}>
            ADMIN PANEL
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl p-6 space-y-4"
          style={{ background: '#1B6B3E' }}
        >
          <div>
            <label className="block text-sm font-medium text-white/80 mb-1.5 text-right">
              البريد الإلكتروني
            </label>
            <input
              type="email"
              required
              dir="ltr"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg text-sm bg-white/95 text-right outline-none focus:ring-2"
              style={{ direction: 'ltr', textAlign: 'left' }}
              placeholder="admin@bethrh.co"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/80 mb-1.5 text-right">
              كلمة المرور
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg text-sm bg-white/95 outline-none focus:ring-2"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="text-sm text-red-300 text-right bg-red-500/10 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 rounded-lg text-sm font-bold transition-opacity disabled:opacity-60"
            style={{ background: '#D4A653', color: '#0F3D24' }}
          >
            {submitting ? 'جارٍ الدخول...' : 'تسجيل الدخول'}
          </button>
        </form>

        <p className="text-center text-xs mt-6" style={{ color: 'rgba(255,255,255,0.3)' }}>
          © ٢٠٢٦ Life Easy LLC
        </p>
      </div>
    </div>
  );
}
