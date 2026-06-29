// 📁 FILE: app/admin/login/page.tsx
// 🔐 Separate admin login — completely independent from user auth
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Shield, Lock, Mail, Loader as Loader2, Eye, EyeOff } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Step 1: Sign in with Supabase
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError('بيانات الدخول غير صحيحة');
        setLoading(false);
        return;
      }

      // Step 2: Verify admin role in app_metadata
      const role = data.user?.app_metadata?.role;
      if (role !== 'admin') {
        // Sign out immediately — not an admin
        await supabase.auth.signOut();
        setError('ليس لديك صلاحية الوصول للوحة الإدارة');
        setLoading(false);
        return;
      }

      // Step 3: Admin confirmed — redirect to admin dashboard
      router.replace('/admin/dashboard');

    } catch {
      setError('حدث خطأ. حاول مرة أخرى.');
      setLoading(false);
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
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

      <div className="relative w-full max-w-sm">

        {/* Card */}
        <div
          className="rounded-2xl p-8"
          style={{
            background: 'rgba(255,255,255,0.05)',
            border: '1px solid rgba(212,166,83,0.25)',
            backdropFilter: 'blur(10px)',
          }}
        >
          {/* Shield icon */}
          <div className="flex justify-center mb-6">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{ background: 'rgba(212,166,83,0.15)', border: '1px solid rgba(212,166,83,0.3)' }}
            >
              <Shield className="w-8 h-8" style={{ color: 'var(--gold)' }} />
            </div>
          </div>

          <h1 className="text-center font-bold text-xl mb-1 text-white">
            لوحة الإدارة
          </h1>
          <p className="text-center text-sm mb-8" style={{ color: 'rgba(247,243,236,0.5)' }}>
            بذرة · Life Easy LLC
          </p>

          {/* Error */}
          {error && (
            <div
              className="mb-5 px-4 py-3 rounded-lg text-sm text-center"
              style={{
                background: 'rgba(220,38,38,0.15)',
                border: '1px solid rgba(220,38,38,0.3)',
                color: '#fca5a5',
              }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium mb-1.5 text-right" style={{ color: 'rgba(247,243,236,0.7)' }}>
                البريد الإلكتروني
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  dir="ltr"
                  placeholder="admin@bethra.co"
                  className="w-full h-11 pr-10 pl-4 rounded-lg text-sm outline-none transition-all"
                  style={{
                    background: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(212,166,83,0.2)',
                    color: 'white',
                  }}
                  onFocus={e => e.target.style.borderColor = 'rgba(212,166,83,0.6)'}
                  onBlur={e => e.target.style.borderColor = 'rgba(212,166,83,0.2)'}
                />
                <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'rgba(212,166,83,0.5)' }} />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium mb-1.5 text-right" style={{ color: 'rgba(247,243,236,0.7)' }}>
                كلمة المرور
              </label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full h-11 pr-10 pl-10 rounded-lg text-sm outline-none transition-all"
                  style={{
                    background: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(212,166,83,0.2)',
                    color: 'white',
                  }}
                  onFocus={e => e.target.style.borderColor = 'rgba(212,166,83,0.6)'}
                  onBlur={e => e.target.style.borderColor = 'rgba(212,166,83,0.2)'}
                />
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'rgba(212,166,83,0.5)' }} />
                <button
                  type="button"
                  onClick={() => setShowPass(v => !v)}
                  className="absolute left-3 top-1/2 -translate-y-1/2"
                  style={{ color: 'rgba(212,166,83,0.5)' }}
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !email || !password}
              className="w-full h-11 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2 mt-2"
              style={{
                background: loading || !email || !password
                  ? 'rgba(212,166,83,0.3)'
                  : 'var(--gold)',
                color: 'var(--green-deep)',
                cursor: loading || !email || !password ? 'not-allowed' : 'pointer',
              }}
              onMouseEnter={e => { if (!loading && email && password) e.currentTarget.style.background = 'var(--gold-light)'; }}
              onMouseLeave={e => { if (!loading && email && password) e.currentTarget.style.background = 'var(--gold)'; }}
            >
              {loading
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <><Shield className="w-4 h-4" />دخول الإدارة</>
              }
            </button>
          </form>

          <p className="text-center text-xs mt-6" style={{ color: 'rgba(247,243,236,0.25)' }}>
            هذه الصفحة للمسؤولين فقط
          </p>
        </div>

        <p className="text-center text-xs mt-4" style={{ color: 'rgba(247,243,236,0.2)' }}>
          © ٢٠٢٦ Life Easy LLC
        </p>
      </div>
    </div>
  );
}
