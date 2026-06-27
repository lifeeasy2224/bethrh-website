// 📁 FILE: app/(app)/profile/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { supabase, SKILLS } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import {
  CircleUser as UserCircle, Save, Check, Download,
  Trash2, TriangleAlert as AlertTriangle, TrendingUp,
  Link as LinkIcon, ArrowLeft,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const COUNTRIES = [
  'Syria', 'Saudi Arabia', 'UAE', 'Egypt', 'Jordan', 'Lebanon', 'Iraq', 'Kuwait',
  'Qatar', 'Bahrain', 'Oman', 'Yemen', 'Libya', 'Tunisia', 'Algeria', 'Morocco',
  'Sudan', 'Somalia', 'Mauritania', 'Comoros', 'Djibouti', 'Palestine',
  'Turkey', 'Pakistan', 'Afghanistan', 'Bangladesh', 'India', 'Iran', 'Indonesia',
  'Malaysia', 'Kazakhstan', 'Uzbekistan', 'Azerbaijan', 'Tajikistan', 'Turkmenistan',
  'Kyrgyzstan', 'Germany', 'Sweden', 'Netherlands', 'France', 'UK', 'Austria',
  'Switzerland', 'Belgium', 'Denmark', 'Norway', 'Finland', 'Italy', 'Spain',
  'Greece', 'USA', 'Canada', 'Australia', 'New Zealand', 'Nigeria', 'Kenya',
  'Ethiopia', 'South Africa', 'Ghana', 'Other',
];

const SKILL_LABELS: Record<string, string> = {
  farming: 'الزراعة', sales: 'المبيعات', coding: 'البرمجة',
  marketing: 'التسويق', finance: 'المالية', logistics: 'اللوجستيات',
  manufacturing: 'التصنيع', design: 'التصميم', management: 'الإدارة',
  research: 'البحث', product: 'تطوير المنتجات', ai: 'الذكاء الاصطناعي',
  ecommerce: 'التجارة الإلكترونية',
};

const GOALS = [
  'التحقق من فكرتي مع عملاء حقيقيين',
  'الوصول لأول عميل دافع',
  'إطلاق منتج أولي (MVP)',
  'بناء فريق المؤسسين',
  'جمع تمويل بذرة',
  'التوسع في سوق جديد',
  'أخرى',
];

const SECTORS_AR = [
  'التكنولوجيا المالية', 'التجارة الإلكترونية', 'الصحة والطب', 'التعليم والتدريب',
  'الزراعة والغذاء', 'اللوجستيات', 'العقارات', 'الطاقة المتجددة',
  'التصنيع', 'الإعلام والترفيه', 'التقنية الزراعية', 'الخدمات', 'أخرى',
];

const INVESTOR_SECTORS = [
  'تقنية المعلومات', 'التجارة الإلكترونية', 'الصحة والطب', 'التعليم والتدريب',
  'المال والتقنية المالية', 'الزراعة والغذاء', 'اللوجستيات', 'العقارات',
  'الترفيه والإعلام', 'الطاقة المتجددة', 'التصنيع', 'أخرى',
];

const CHECK_SIZES = ['$5K – $25K', '$25K – $100K', '$100K – $500K', '$500K+'];
const INVESTMENT_STAGES = ['فكرة (Pre-seed)', 'بداية (Seed)', 'نمو (Series A)', 'توسع (Series B+)'];
const VALUE_ADD_OPTIONS = ['شبكة علاقات', 'تمويل متابعة', 'خبرة قطاعية', 'دعم تشغيلي', 'وصول لأسواق'];

export default function ProfilePage() {
  const { supaUser, profile, isInvestor, refreshProfile } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const isOnboard = searchParams.get('onboard') === '1';
  const { toast } = useToast();

  const [form, setForm] = useState({
    name: '', phone: '', country: 'Saudi Arabia',
    skills: [] as string[], bio: '', linkedin_url: '', sector: '', goal: '',
  });
  const [investorPrefs, setInvestorPrefs] = useState({
    preferred_sectors: [] as string[],
    check_size: '', preferred_stage: '', value_add: '',
  });
  const [saving, setSaving]         = useState(false);
  const [saved, setSaved]           = useState(false);
  const [exporting, setExporting]   = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting]     = useState(false);

  useEffect(() => {
    if (profile) {
      setForm({
        name:         profile.name ?? '',
        phone:        profile.phone ?? '',
        country:      profile.country ?? 'Saudi Arabia',
        skills:       profile.skills ?? [],
        bio:          (profile as any).bio ?? '',
        linkedin_url: (profile as any).linkedin_url ?? '',
        sector:       (profile as any).sector ?? '',
        goal:         (profile as any).goal ?? '',
      });
      if (profile.investor_preferences) {
        setInvestorPrefs({
          preferred_sectors: profile.investor_preferences.preferred_sectors ?? [],
          check_size:        profile.investor_preferences.check_size ?? '',
          preferred_stage:   profile.investor_preferences.preferred_stage ?? '',
          value_add:         profile.investor_preferences.value_add ?? '',
        });
      }
    }
  }, [profile]);

  function toggleSkill(skill: string) {
    setForm(f => ({
      ...f,
      skills: f.skills.includes(skill)
        ? f.skills.filter(s => s !== skill)
        : [...f.skills, skill],
    }));
  }

  function toggleSector(sector: string) {
    setInvestorPrefs(p => ({
      ...p,
      preferred_sectors: p.preferred_sectors.includes(sector)
        ? p.preferred_sectors.filter(s => s !== sector)
        : [...p.preferred_sectors, sector],
    }));
  }

  async function handleExport() {
    if (!supaUser) return;
    setExporting(true);
    try {
      const [{ data: ideas }, { data: tasks }] = await Promise.all([
        supabase.from('ideas').select('*').eq('user_id', supaUser.id),
        supabase.from('tasks').select('*').eq('user_id', supaUser.id),
      ]);
      const payload = {
        exported_at: new Date().toISOString(),
        user_id: supaUser.id, email: supaUser.email,
        ideas: ideas ?? [], tasks: tasks ?? [],
      };
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bethra-data-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: 'تم تصدير البيانات بنجاح' });
    } catch {
      toast({ title: 'فشل تصدير البيانات', variant: 'destructive' });
    } finally {
      setExporting(false);
    }
  }

  async function handleDeleteAccount() {
    if (!supaUser) return;
    setDeleting(true);
    try {
      await supabase.from('ideas').delete().eq('user_id', supaUser.id);
      await supabase.from('tasks').delete().eq('user_id', supaUser.id);
      await supabase.from('users').delete().eq('id', supaUser.id);
      await supabase.auth.signOut();
      router.replace('/');
    } catch {
      toast({ title: 'فشل حذف الحساب. راسل info@bethra.co', variant: 'destructive' });
      setDeleting(false);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!supaUser) return;
    if (!form.name.trim()) {
      toast({ title: 'الاسم الكامل مطلوب', variant: 'destructive' });
      return;
    }
    setSaving(true);

    const payload: Record<string, unknown> = {
      id:      supaUser.id,
      name:    form.name,
      phone:   form.phone || null,
      country: form.country,
      skills:  form.skills,
      role:    isInvestor ? 'investor' : 'founder',
    };

    if (!isInvestor) {
      payload.bio          = form.bio || null;
      payload.linkedin_url = form.linkedin_url || null;
      payload.sector       = form.sector || null;
      payload.goal         = form.goal || null;
    }

    if (isInvestor) {
      payload.investor_preferences = investorPrefs;
    }

    const { error } = await supabase.from('users').upsert(payload);

    if (error) {
      toast({ title: 'خطأ في حفظ الملف الشخصي', description: error.message, variant: 'destructive' });
    } else {
      await refreshProfile();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      if (isOnboard) {
        // After onboarding → go directly to the right dashboard
        router.replace(isInvestor ? '/greenhouse' : '/founder-dashboard');
      }
    }
    setSaving(false);
  }

  const inputCls = 'w-full px-3.5 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring';

  return (
    <div className="p-6 max-w-2xl mx-auto" dir="rtl">

      {/* ── Onboarding welcome banner ── */}
      {isOnboard && (
        <div
          className="rounded-xl p-4 mb-6 flex items-start gap-3 flex-row-reverse"
          style={{ background: 'rgba(27,107,62,0.08)', border: '1px solid rgba(27,107,62,0.2)' }}
        >
          <span className="text-2xl shrink-0">🌱</span>
          <div className="text-right">
            <p className="font-semibold text-sm" style={{ color: 'var(--green-brand)' }}>
              أهلاً في بذرة!
            </p>
            <p className="text-sm text-muted-foreground mt-0.5">
              أكمل ملفك الشخصي للحصول على تجربة مخصصة لمشروعك في سوق MENA.
            </p>
          </div>
        </div>
      )}

      {/* ── Header ── */}
      <div className="flex items-center gap-4 mb-8 flex-row-reverse">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center"
          style={{ background: 'rgba(27,107,62,0.1)' }}
        >
          <span className="text-2xl font-bold" style={{ color: 'var(--green-brand)' }}>
            {form.name?.[0]?.toUpperCase() || <UserCircle className="w-8 h-8" />}
          </span>
        </div>
        <div className="text-right">
          <h1 className="text-2xl font-bold">
            {isOnboard ? 'إعداد ملفك الشخصي' : 'الملف الشخصي'}
          </h1>
          <p className="text-muted-foreground text-sm">{supaUser?.email}</p>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6">

        {/* ── Personal info ── */}
        <div className="bg-card rounded-xl border border-border p-5 space-y-4">
          <h2 className="font-semibold text-right">المعلومات الشخصية</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium mb-1.5 text-right">الاسم الكامل *</label>
              <input
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                required placeholder="اسمك الكامل"
                className={inputCls} dir="rtl"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5 text-right">الهاتف (اختياري)</label>
              <input
                value={form.phone}
                onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                placeholder="+966 ..."
                className={inputCls}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5 text-right">البلد *</label>
              <select
                value={form.country}
                onChange={e => setForm(f => ({ ...f, country: e.target.value }))}
                className={inputCls}
              >
                {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* ── Skills ── */}
        <div className="bg-card rounded-xl border border-border p-5">
          <h2 className="font-semibold mb-1 text-right">المهارات</h2>
          <p className="text-xs text-muted-foreground mb-4 text-right">
            اختر كل ما ينطبق — يساعد في مطابقتك مع أعضاء المجموعة المناسبين
          </p>
          <div className="flex flex-wrap gap-2 flex-row-reverse">
            {(SKILLS || Object.keys(SKILL_LABELS)).map(skill => {
              const selected = form.skills.includes(skill);
              return (
                <button
                  key={skill} type="button" onClick={() => toggleSkill(skill)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                    selected
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-secondary text-secondary-foreground border-border hover:border-primary/40'
                  }`}
                >
                  {selected && <Check className="w-3 h-3" />}
                  {SKILL_LABELS[skill] ?? skill}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Founder-only fields ── */}
        {!isInvestor && (
          <div className="bg-card rounded-xl border border-border p-5 space-y-4">
            <h2 className="font-semibold text-right">تفاصيل مشروعك</h2>
            <div>
              <label className="block text-sm font-medium mb-1.5 text-right">نبذة عنك (اختياري)</label>
              <textarea
                value={form.bio}
                onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
                rows={3} placeholder="من أنت؟ ما الذي تبنيه؟ ما خبرتك؟"
                className={`${inputCls} resize-none`} dir="rtl" maxLength={500}
              />
              <p className="text-xs text-muted-foreground mt-1 text-right">{form.bio.length}/500</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5 text-right">القطاع (اختياري)</label>
                <select value={form.sector} onChange={e => setForm(f => ({ ...f, sector: e.target.value }))} className={inputCls}>
                  <option value="">اختر قطاع...</option>
                  {SECTORS_AR.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5 text-right">هدفك الأول (اختياري)</label>
                <select value={form.goal} onChange={e => setForm(f => ({ ...f, goal: e.target.value }))} className={inputCls}>
                  <option value="">اختر هدفك...</option>
                  {GOALS.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5 text-right">رابط LinkedIn (اختياري)</label>
              <div className="relative">
                <LinkIcon className="absolute top-1/2 -translate-y-1/2 right-3 w-4 h-4 text-muted-foreground" />
                <input
                  type="url" value={form.linkedin_url}
                  onChange={e => setForm(f => ({ ...f, linkedin_url: e.target.value }))}
                  placeholder="https://linkedin.com/in/yourname"
                  className={`${inputCls} pr-9`} dir="ltr"
                />
              </div>
            </div>
          </div>
        )}

        {/* ── Investor-only fields ── */}
        {isInvestor && (
          <div className="bg-card rounded-xl border border-border p-5 space-y-5">
            <div className="flex items-center gap-2 flex-row-reverse">
              <TrendingUp className="w-4 h-4 text-primary shrink-0" />
              <h2 className="font-semibold text-right">تفضيلات الاستثمار</h2>
            </div>
            <div>
              <p className="text-sm font-medium mb-2 text-right">القطاعات المفضلة</p>
              <div className="flex flex-wrap gap-2 flex-row-reverse">
                {INVESTOR_SECTORS.map(sector => {
                  const selected = investorPrefs.preferred_sectors.includes(sector);
                  return (
                    <button
                      key={sector} type="button" onClick={() => toggleSector(sector)}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-all ${
                        selected
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-secondary text-secondary-foreground border-border hover:border-primary/40'
                      }`}
                    >
                      {selected && <Check className="w-3 h-3 inline ml-1" />}
                      {sector}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5 text-right">حجم الشيك الاستثماري</label>
                <select value={investorPrefs.check_size} onChange={e => setInvestorPrefs(p => ({ ...p, check_size: e.target.value }))} className={inputCls}>
                  <option value="">اختر...</option>
                  {CHECK_SIZES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5 text-right">المرحلة المفضلة</label>
                <select value={investorPrefs.preferred_stage} onChange={e => setInvestorPrefs(p => ({ ...p, preferred_stage: e.target.value }))} className={inputCls}>
                  <option value="">اختر...</option>
                  {INVESTMENT_STAGES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5 text-right">القيمة المضافة</label>
                <select value={investorPrefs.value_add} onChange={e => setInvestorPrefs(p => ({ ...p, value_add: e.target.value }))} className={inputCls}>
                  <option value="">اختر...</option>
                  {VALUE_ADD_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* ── Save button ── */}
        <button
          type="submit" disabled={saving}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition disabled:opacity-60"
          style={{ background: 'var(--green-brand)', color: 'white' }}
          onMouseEnter={e => { if (!saving) e.currentTarget.style.background = 'var(--green-mid)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'var(--green-brand)'; }}
        >
          {saving ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : saved ? (
            <><Check className="w-4 h-4" /> تم الحفظ!</>
          ) : (
            <><Save className="w-4 h-4" /> {isOnboard ? 'متابعة إلى لوحة التحكم' : 'حفظ الملف الشخصي'}</>
          )}
        </button>

        {/* ── Skip onboarding ── */}
        {isOnboard && (
          <button
            type="button"
            onClick={() => router.replace(isInvestor ? '/greenhouse' : '/founder-dashboard')}
            className="w-full text-center text-sm py-2 font-arabic"
            style={{ color: 'var(--gray-mid)' }}
          >
            تخطي الآن وأكمله لاحقاً ←
          </button>
        )}
      </form>

      {/* ── Account management (non-onboarding only) ── */}
      {!isOnboard && (
        <div className="mt-6 bg-card rounded-xl border border-border p-5 space-y-4">
          <h2 className="font-semibold text-right">الحساب</h2>
          <p className="text-sm text-muted-foreground text-right">
            مسجّل الدخول بـ <span className="font-medium text-foreground">{supaUser?.email}</span>
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleExport} disabled={exporting}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-border bg-secondary text-secondary-foreground text-sm font-medium hover:bg-secondary/80 transition disabled:opacity-60"
            >
              {exporting
                ? <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                : <Download className="w-3.5 h-3.5" />}
              تصدير البيانات (JSON)
            </button>
            <button
              onClick={() => supabase.auth.signOut()}
              className="px-3.5 py-2 text-sm rounded-lg border border-border hover:bg-secondary transition font-medium"
            >
              تسجيل الخروج
            </button>
          </div>

          {!confirmDelete ? (
            <button
              onClick={() => setConfirmDelete(true)}
              className="inline-flex items-center gap-1.5 text-sm text-destructive hover:underline"
            >
              <Trash2 className="w-3.5 h-3.5" />
              حذف الحساب نهائياً
            </button>
          ) : (
            <div className="bg-destructive/5 border border-destructive/30 rounded-xl p-4 space-y-3">
              <div className="flex items-start gap-2 flex-row-reverse">
                <AlertTriangle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                <p className="text-sm text-destructive font-medium text-right">
                  سيتم حذف حسابك وجميع أفكارك ومهامك نهائياً. لا يمكن التراجع عن هذا الإجراء.
                </p>
              </div>
              <div className="flex gap-2 justify-end">
                <button onClick={() => setConfirmDelete(false)} className="px-3 py-1.5 text-sm rounded-lg border border-border hover:bg-secondary transition">
                  إلغاء
                </button>
                <button
                  onClick={handleDeleteAccount} disabled={deleting}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90 transition disabled:opacity-60"
                >
                  {deleting
                    ? <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    : <Trash2 className="w-3.5 h-3.5" />}
                  نعم، احذف كل شيء
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
