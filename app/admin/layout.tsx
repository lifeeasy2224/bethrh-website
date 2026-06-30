'use client';

import { usePathname } from 'next/navigation';
import { AdminAuthProvider, useAdminAuth } from '@/lib/admin-auth-context';
import AdminLayout from '@/components/AdminLayout';

function AdminGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { admin, loading } = useAdminAuth();

  // Login page renders standalone — no sidebar, no auth gate
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  // Still checking session
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

  // Not an admin — render nothing (the page itself can redirect, or we show a simple message)
  if (!admin) {
    return (
      <div
        dir="rtl"
        className="min-h-screen flex items-center justify-center px-4 text-center"
        style={{ background: '#0F3D24', fontFamily: "'Noto Kufi Arabic', sans-serif" }}
      >
        <div>
          <p className="text-white/70 mb-4">ليست لديك صلاحية الوصول لهذه الصفحة</p>
          <a
            href="/admin/login"
            className="inline-block px-5 py-2 rounded-lg text-sm font-bold"
            style={{ background: '#D4A653', color: '#0F3D24' }}
          >
            تسجيل الدخول
          </a>
        </div>
      </div>
    );
  }

  // ✅ Authenticated admin — wrap in the isolated AdminLayout
  return <AdminLayout>{children}</AdminLayout>;
}

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminAuthProvider>
      <AdminGate>{children}</AdminGate>
    </AdminAuthProvider>
  );
}
