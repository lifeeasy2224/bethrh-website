'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { Loader as Loader2, X, BadgeCheck, Send, Bookmark, Filter } from 'lucide-react';
import ReviewModal, { wasReviewShown } from '@/components/ReviewModal';

type Listing = {
  id: string;
  brand_name: string;
  logo: string | null;
  tagline: string | null;
  sector: string;
  country?: string;
  iro: number;
  breakeven_months: number;
  score: number;
  mrr?: number;
  asking?: number;
  level: 'متجذر' | 'مثمر';
  contact_requests: number;
  published_at: string;
  has_paying_customer?: boolean;
};

const SECTOR_OPTIONS = [
  { value: 'all',       label: 'القطاع: الكل' },
  { value: 'Agri-Tech', label: 'تقنية زراعية' },
  { value: 'Agri-Food', label: 'مطاعم وغذاء' },
  { value: 'Services',  label: 'خدمات' },
  { value: 'FinTech',   label: 'Fintech' },
  { value: 'SaaS',      label: 'B2B SaaS' },
];

const IRO_OPTIONS = [
  { value: 'all',  label: 'العائد المتوقع (IRO): الكل' },
  { value: '400',  label: 'العائد: 400%+' },
  { value: '300',  label: 'العائد: 300–400%' },
  { value: '200',  label: 'العائد: 200–300%' },
];

const BREAKEVEN_OPTIONS = [
  { value: 'all', label: 'نقطة التعادل: الكل' },
  { value: '12',  label: 'أقل من 12 شهر' },
  { value: '18',  label: '12–18 شهر' },
];

const COUNTRY_OPTIONS = [
  { value: 'all', label: 'الدولة: الكل' },
  { value: 'SA',  label: 'السعودية' },
  { value: 'AE',  label: 'الإمارات' },
  { value: 'EG',  label: 'مصر' },
  { value: 'TR',  label: 'تركيا' },
  { value: 'PK',  label: 'باكستان' },
];

const LEVEL_OPTIONS = [
  { value: 'all',    label: 'المستوى: الكل' },
  { value: 'مثمر',  label: 'مثمر 🍎' },
  { value: 'متجذر', label: 'متجذر 🫚' },
];

const SORT_OPTIONS = [
  { value: 'iro',       label: 'ترتيب: الأعلى عائداً' },
  { value: 'breakeven', label: 'الأسرع تعادلاً' },
  { value: 'score',     label: 'الأعلى تقويماً' },
];

const SECTOR_LABELS: Record<string, string> = {
  'Agri-Food': 'مطاعم وغذاء',
  'Agri-Tech': 'تقنية زراعية',
  'Services':  'خدمات',
  'Export':    'تصدير',
  'FinTech':   'Fintech',
  'SaaS':      'B2B SaaS',
};

function ContactModal({ listing, onClose, onSuccess }: { listing: Listing; onClose: () => void; onSuccess: () => void }) {
  const { supaUser } = useAuth();
  const router = useRouter();
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);

  async function handleContact() {
    if (!supaUser) { router.push('/signup'); return; }
    setSending(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) { router.push('/signup'); return; }
    await fetch('/api/greenhouse/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ listingId: listing.id }),
    });
    setSending(false);
    setDone(true);
    // Show investor review after short delay
    setTimeout(() => {
      if (!wasReviewShown('greenhouse_contact_investor', listing.id)) {
        setReviewOpen(true);
      } else {
        onSuccess(); onClose();
      }
    }, 1800);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.5)' }} dir="rtl">
      <div className="w-full max-w-md rounded-2xl overflow-hidden bg-white">
        <div className="px-6 py-5 border-b flex items-center justify-between flex-row-reverse" style={{ borderColor: 'var(--gray-light)' }}>
          <p className="font-bold text-base text-gray-900">طلب التواصل مع المؤسس</p>
          <button onClick={onClose} aria-label="إغلاق" className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="px-6 py-6 space-y-4">
          {done ? (
            <div className="text-center py-4">
              <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3 bg-[rgba(27,107,62,0.1)]">
                <BadgeCheck className="w-8 h-8 text-[var(--green-brand)]" />
              </div>
              <p className="font-bold text-base mb-1 text-gray-900">تم إرسال طلبك!</p>
              <p className="text-sm text-gray-600">سيُبلَّغ المؤسس بطلبك. بياناتك تُكشف فقط بعد موافقته.</p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 p-3 rounded-xl flex-row-reverse bg-[rgba(27,107,62,0.08)] border border-[rgba(27,107,62,0.2)]">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0 bg-[rgba(27,107,62,0.1)]">
                  {listing.logo || '🪴'}
                </div>
                <div className="text-right">
                  <p className="font-bold text-sm text-gray-900">{listing.brand_name}</p>
                  <p className="text-xs text-gray-500">{SECTOR_LABELS[listing.sector] ?? listing.sector}</p>
                </div>
              </div>
              <div className="rounded-xl p-3.5 text-sm text-right leading-relaxed bg-[rgba(212,166,83,0.08)] border border-[rgba(212,166,83,0.3)] text-[#8B6B47]">
                <p className="font-bold mb-0.5">بذرة لا تتدخل في الصفقة</p>
                <p className="text-xs text-[#9E8B6F]">بياناتك الشخصية لن تُكشف للمؤسس إلا بعد موافقته على التواصل.</p>
              </div>
              <button
                onClick={handleContact}
                disabled={sending}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-sm bg-[var(--green-brand)] hover:bg-[#1a5a35] text-white transition-all"
              >
                {sending ? <><Loader2 className="w-4 h-4 animate-spin" /> جاري الإرسال...</> : <><Send className="w-4 h-4" /> أرسل طلب التواصل</>}
              </button>
            </>
          )}
        </div>
      </div>

      <ReviewModal
        open={reviewOpen}
        trigger="greenhouse_contact_investor"
        triggerContext={listing.brand_name}
        userRole="investor"
        onClose={() => { setReviewOpen(false); onSuccess(); onClose(); }}
      />
    </div>
  );
}

function SeedCard({ listing, onContact }: { listing: Listing; onContact: (l: Listing) => void }) {
  const isFruit = listing.level === 'مثمر';

  return (
    <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-200 flex flex-col" dir="rtl">
      {/* Card header */}
      <div className="p-6 border-b border-gray-100" style={{ background: `linear-gradient(135deg, rgba(27,107,62,0.05), #ffffff)` }}>
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1 text-right pr-2">
            <h3 className="text-xl font-bold text-gray-900">{listing.brand_name}</h3>
            <p className="text-sm text-gray-500 mt-0.5">
              {SECTOR_LABELS[listing.sector] ?? listing.sector}
              {listing.country && ` | ${listing.country}`}
            </p>
          </div>
          <span className={`shrink-0 px-3 py-1 rounded-full text-sm font-bold ${isFruit ? 'bg-[var(--green-brand)] text-white' : 'bg-[rgba(212,166,83,0.15)] text-[#8B6B47]'}`}>
            {isFruit ? 'مثمر 🍎' : 'متجذر 🫚'}
          </span>
        </div>
        {listing.tagline && <p className="text-sm text-gray-600 text-right line-clamp-2 mb-3">{listing.tagline}</p>}
        <div className="bg-white inline-block px-3 py-1 rounded-lg border border-gray-100">
          <span className="text-sm text-gray-500">تقويم البذرة: </span>
          <span className="font-bold text-[var(--green-brand)]">{listing.score}/100</span>
        </div>
      </div>

      {/* Metrics grid */}
      <div className="p-6 flex-1">
        <div className="grid grid-cols-2 gap-3 mb-5">
          <div className="bg-gray-50 p-3 rounded-xl text-right">
            <p className="text-xs text-gray-500 mb-1">العائد المتوقع (IRO)</p>
            <p className="text-2xl font-bold text-gray-900">{listing.iro > 0 ? `${listing.iro}%` : '—'}</p>
          </div>
          <div className="bg-gray-50 p-3 rounded-xl text-right">
            <p className="text-xs text-gray-500 mb-1">نقطة التعادل</p>
            <p className="text-2xl font-bold text-gray-900">{listing.breakeven_months > 0 ? `${listing.breakeven_months} أشهر` : '—'}</p>
          </div>
          {listing.mrr !== undefined && (
            <div className="bg-gray-50 p-3 rounded-xl text-right">
              <p className="text-xs text-gray-500 mb-1">MRR الحالي</p>
              <p className="text-2xl font-bold text-gray-900">${listing.mrr.toLocaleString()}</p>
            </div>
          )}
          {listing.asking !== undefined && (
            <div className="bg-gray-50 p-3 rounded-xl text-right">
              <p className="text-xs text-gray-500 mb-1">يطلب تمويل</p>
              <p className="text-2xl font-bold text-gray-900">${listing.asking.toLocaleString()}</p>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => onContact(listing)}
            className="flex-1 bg-[var(--green-brand)] hover:bg-[#1a5a35] text-white font-bold py-3 rounded-xl text-sm transition-all"
          >
            اطلب مقابلة المؤسس
          </button>
          <button
            aria-label="احفظ البذرة"
            className="px-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
          >
            <Bookmark className="w-5 h-5 text-gray-500" />
          </button>
        </div>
      </div>
    </div>
  );
}

function applyFilters(listings: Listing[], filters: {
  sector: string; iro: string; breakeven: string; country: string; level: string; sort: string;
}): Listing[] {
  let result = [...listings];

  if (filters.sector !== 'all') result = result.filter(l => l.sector === filters.sector);
  if (filters.level !== 'all')  result = result.filter(l => l.level === filters.level);
  if (filters.country !== 'all') result = result.filter(l => l.country === filters.country);

  if (filters.iro === '400') result = result.filter(l => l.iro >= 400);
  else if (filters.iro === '300') result = result.filter(l => l.iro >= 300 && l.iro < 400);
  else if (filters.iro === '200') result = result.filter(l => l.iro >= 200 && l.iro < 300);

  if (filters.breakeven === '12') result = result.filter(l => l.breakeven_months < 12);
  else if (filters.breakeven === '18') result = result.filter(l => l.breakeven_months >= 12 && l.breakeven_months <= 18);

  if (filters.sort === 'iro')       result.sort((a, b) => b.iro - a.iro);
  else if (filters.sort === 'breakeven') result.sort((a, b) => a.breakeven_months - b.breakeven_months);
  else if (filters.sort === 'score') result.sort((a, b) => b.score - a.score);

  return result;
}

export default function GreenhousePage() {
  const { supaUser, loading: authLoading } = useAuth();
  const router = useRouter();
  const [allListings, setAllListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [contactTarget, setContactTarget] = useState<Listing | null>(null);
  const [filters, setFilters] = useState({
    sector: 'all', iro: 'all', breakeven: 'all', country: 'all', level: 'all', sort: 'iro',
  });

  useEffect(() => {
    if (!authLoading && supaUser === null) router.replace('/investor');
  }, [authLoading, supaUser, router]);

  const loadListings = useCallback(async () => {
    setLoading(true);
    const res = await fetch('/api/greenhouse/ideas');
    if (res.ok) setAllListings(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { loadListings(); }, [loadListings]);

  function setFilter(key: keyof typeof filters, value: string) {
    setFilters(prev => ({ ...prev, [key]: value }));
  }

  const filtered = applyFilters(allListings, filters);

  if (authLoading || supaUser === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[rgba(27,107,62,0.05)]">
        <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin border-[var(--green-brand)]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-8">
        <div className="max-w-6xl mx-auto text-right">
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-2">
            المشتل 🌱 | معرض البذور الناجحة
          </h1>
          <p className="text-base text-gray-600 mb-5">
            كل بذرة هنا اجتازت ٣ مراحل فلترة صارمة + تقويم البذرة ٨٠+ + لديها عميل دافع
          </p>
          {/* Status banner */}
          <div className="bg-[rgba(27,107,62,0.08)] border border-[var(--green-brand)] p-4 rounded-xl text-center">
            <p className="text-gray-800">
              {loading ? (
                <span className="font-bold text-[var(--green-brand)]">جارٍ التحميل...</span>
              ) : allListings.length === 0 ? (
                <span className="font-bold text-[var(--green-brand)]">قريباً — أول البذور في طريقها 🌱</span>
              ) : (
                <span className="font-bold text-[var(--green-brand)]">{allListings.length} بذرة نشطة</span>
              )}
              {' | '}محدث يومياً
              {' '}
              <Link href="/investor-assistant" className="text-[var(--green-brand)] font-bold mr-2 hover:underline">
                كيف نفلتر؟
              </Link>
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Filter bar */}
        <div className="bg-white p-4 rounded-xl shadow-sm mb-8 border border-gray-100">
          <div className="flex items-center gap-2 mb-3 flex-row-reverse">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-semibold text-gray-700">فلترة وترتيب</span>
          </div>
          <div className="flex flex-wrap gap-3">
            {([
              ['sector',    SECTOR_OPTIONS],
              ['iro',       IRO_OPTIONS],
              ['breakeven', BREAKEVEN_OPTIONS],
              ['country',   COUNTRY_OPTIONS],
              ['level',     LEVEL_OPTIONS],
              ['sort',      SORT_OPTIONS],
            ] as const).map(([key, options]) => (
              <select
                key={key}
                value={filters[key]}
                onChange={e => setFilter(key, e.target.value)}
                className="border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-[var(--green-brand)]"
              >
                {(options as readonly {value: string; label: string}[]).map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            ))}
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-[var(--green-brand)]" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🌱</div>
            <h3 className="text-2xl font-bold mb-2 text-gray-900">لا توجد بذور مطابقة حالياً</h3>
            <p className="text-gray-600">
              عدل الفلاتر أو{' '}
              <Link href="/investor-assistant" className="text-[var(--green-brand)] font-bold hover:underline">
                اقرأ دليل المستثمر
              </Link>{' '}
              لتفهم معاييرنا
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(listing => (
              <SeedCard key={listing.id} listing={listing} onContact={l => setContactTarget(l)} />
            ))}
          </div>
        )}

        {/* Disclaimer */}
        <div className="mt-14 text-center">
          <p className="text-xs text-gray-400">
            بذرة تعمل كمنصة للتعريف فقط ولا تتدخل في شروط أي صفقة استثمارية.
            جميع المعلومات المالية تقديرية وتستند إلى نموذج العمل المُدخَل من المؤسس.
          </p>
        </div>
      </div>

      {contactTarget && (
        <ContactModal
          listing={contactTarget}
          onClose={() => setContactTarget(null)}
          onSuccess={loadListings}
        />
      )}
    </div>
  );
}
