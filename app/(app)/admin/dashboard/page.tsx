'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

export default function AdminDashboardPage() {
  const router = useRouter();
  const supabase = createClientComponentClient();

  useEffect(() => {
    const checkAdminAccess = async () => {
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        router.replace('/admin/login');
        return;
      }

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();

      if (error || !profile || profile.role !== 'admin') {
        await supabase.auth.signOut();
        router.replace('/admin/login');
        return;
      }

      // ✅ Redirect to the real admin dashboard
      router.replace('/admin');
    };

    checkAdminAccess();
  }, [router, supabase]);

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-[#0F3D24] flex items-center justify-center"
      style={{ fontFamily: "'Noto Kufi Arabic', sans-serif" }}
    >
      <div className="text-center">
        <div className="w-14 h-14 border-2 border-[#D4A653] border-t-transparent rounded-full animate-spin mx-auto mb-6" />
        <p className="text-[#D4A653] text-lg font-bold mb-2">جارٍ التحقق من الصلاحيات...</p>
        <p className="text-white/40 text-sm">يُرجى الانتظار</p>
      </div>
    </div>
  );
}
