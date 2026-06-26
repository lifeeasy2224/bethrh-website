'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Search, Users, ArrowLeft, Sprout,
  TrendingUp, Clock, DollarSign, ChevronLeft,
} from 'lucide-react';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';

type SeedCard = {
  id: string;
  slug: string;
  name: string;
  sector_id: string;
  sector_emoji: string;
  sector_label: string;
  short_description: string | null;
  investment_min: number;
  investment_max: number;
  roi_estimate: number;
  break_even_months: number;
  max_spots: number;
  spots_taken: number;
};

const SECTORS = [
  { id: 'all',              emoji: '🌱',  label: 'الكل' },
  { id: 'food',             emoji: '🍕',  label: 'الأغذية والزراعة' },
  { id: 'saas',             emoji: '💻',  label: 'البرمجيات كخدمة' },
  { id: 'ecommerce',        emoji: '🛒',  label: 'التجارة الإلكترونية' },
  { id: 'fintech',          emoji: '💰',  label: 'التقنية المالية' },
  { id: 'edtech',           emoji: '📚',  label: 'تقنية التعليم' },
  { id: 'health',           emoji: '🏥',  label: 'الصحة والعافية' },
  { id: 'home-services',    emoji: '🏠',  label: 'الخدمات المنزلية' },
  { id: 'sustainability',   emoji: '♻️',  label: 'الاستدامة والبيئة' },
  { id: 'logistics',        emoji: '🚚',  label: 'اللوجستيات والتوصيل' },
];


function formatUSD(n: number) {
  return n.toLocaleString('en-US');
}

function SeedCard({ seed }: { seed: SeedCard }) {
  const spotsLeft = seed.max_spots - seed.spots_taken;
  const isFull = spotsLeft <= 0;

  return (
    <Link
      href={`/ideas-library/${seed.slug}`}
      className="group flex flex-col rounded-2xl border overflow-hidden transition-all hover:-translate-y-0.5 hover:shadow-lg"
      style={{ background: 'white', borderColor: 'hsl(42,25%,86%)' }}
    >
      {/* Sector header */}
      <div className="px-5 pt-5 pb-3">
        <div className="flex items-center justify-between flex-row-reverse mb-3">
          <span
            className="text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1.5 shrink-0"
            style={{ background: 'hsl(144,58%,93%)', color: 'var(--green-deep)' }}
          >
            <span>{seed.sector_emoji}</span>
            {seed.sector_label}
          </span>
          <span
            className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border font-medium shrink-0"
            style={isFull
              ? { background: 'hsl(0,80%,97%)', borderColor: 'hsl(0,60%,82%)', color: 'hsl(0,60%,42%)' }
              : { background: 'hsl(144,30%,96%)', borderColor: 'hsl(144,40%,78%)', color: 'hsl(144,48%,28%)' }
            }
          >
            <Users className="w-3 h-3" />
            {isFull ? 'مكتملة' : `${spotsLeft} مقاعد متبقية`}
          </span>
        </div>

        <h3 className="font-bold text-base leading-snug mb-2 transition-colors group-hover:opacity-80" style={{ color: 'var(--text-dark)' }}>
          {seed.name}
        </h3>

        {seed.short_description && (
          <p className="text-xs leading-relaxed line-clamp-3" style={{ color: 'var(--gray-mid)' }}>
            {seed.short_description}
          </p>
        )}
      </div>

      {/* Metrics */}
      <div className="mx-5 mb-4 grid grid-cols-3 gap-2">
        <div className="rounded-xl p-2.5 text-center" style={{ background: 'hsl(42,30%,96%)' }}>
          <DollarSign className="w-3 h-3 mx-auto mb-0.5" style={{ color: 'hsl(42,55%,35%)' }} />
          <div className="text-xs font-bold leading-tight" style={{ color: 'hsl(42,55%,28%)' }}>
            ${formatUSD(seed.investment_min)}+
          </div>
          <div className="text-[10px] mt-0.5 text-muted-foreground">USD</div>
        </div>
        <div className="rounded-xl p-2.5 text-center" style={{ background: 'hsl(144,50%,96%)' }}>
          <TrendingUp className="w-3 h-3 mx-auto mb-0.5" style={{ color: 'var(--green-brand)' }} />
          <div className="text-xs font-bold" style={{ color: 'var(--green-brand)' }}>{seed.roi_estimate}٪</div>
          <div className="text-[10px] mt-0.5 text-muted-foreground">العائد</div>
        </div>
        <div className="rounded-xl p-2.5 text-center" style={{ background: 'hsl(210,50%,97%)' }}>
          <Clock className="w-3 h-3 mx-auto mb-0.5" style={{ color: 'hsl(210,55%,35%)' }} />
          <div className="text-xs font-bold" style={{ color: 'hsl(210,55%,30%)' }}>{seed.break_even_months}م</div>
          <div className="text-[10px] mt-0.5 text-muted-foreground">التعادل</div>
        </div>
      </div>

      {/* CTA */}
      <div className="px-5 pb-5 mt-auto">
        <div
          className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold transition-all flex-row-reverse"
          style={isFull
            ? { background: 'hsl(0,0%,94%)', color: 'hsl(0,0%,50%)' }
            : { background: 'hsl(144,58%,22%)', color: 'white' }
          }
        >
          {isFull
            ? 'مكتملة'
            : <><Sprout className="w-3.5 h-3.5" />اعرف أكثر <ChevronLeft className="w-3.5 h-3.5" /></>
          }
        </div>
      </div>
    </Link>
  );
}

export default function IdeasLibraryPage() {
  const [seeds, setSeeds] = useState<SeedCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSector, setActiveSector] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/api/seeds')
      .then(r => r.json())
      .then(data => { setSeeds(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = seeds.filter(s => {
    const matchSector = activeSector === 'all' || s.sector_id === activeSector;
    const q = search.trim();
    const matchSearch = !q
      || s.name.includes(q)
      || s.sector_label.includes(q)
      || s.short_description?.includes(q);
    return matchSector && matchSearch;
  });

  const countBySector = (id: string) =>
    id === 'all' ? seeds.length : seeds.filter(s => s.sector_id === id).length;

  return (
    <div dir="rtl" className="min-h-screen" style={{ background: 'hsl(42,25%,97%)' }}>

      <SiteHeader />
      <div className="h-16" />

      {/* ── Hero ── */}
      <section className="pt-14 pb-10 text-center px-6">
        <span className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full mb-5"
          style={{ background: 'hsl(144,58%,92%)', color: 'hsl(144,58%,26%)' }}>
          <Sprout className="w-3.5 h-3.5" />
          بذور جاهزة للزراعة
        </span>
        <h1 className="text-4xl md:text-5xl font-extrabold mb-4" style={{ color: 'hsl(158,30%,14%)' }}>
          مكتبة الأفكار 🌱
        </h1>
        <p className="text-lg max-w-lg mx-auto mb-2" style={{ color: 'hsl(158,20%,30%)' }}>
          أفكار مدروسة جاهزة للتنفيذ — اختر فكرتك وابدأ رحلتك
        </p>
        <p className="text-sm max-w-sm mx-auto mb-8" style={{ color: 'hsl(158,20%,44%)' }}>
          تصفّح مجاناً — سجّل لالتقاط فكرة وإضافتها لمشروعك
        </p>
        <div className="flex flex-wrap justify-center gap-6 text-sm" style={{ color: 'hsl(158,20%,36%)' }}>
          <span className="flex items-center gap-1.5"><Sprout className="w-4 h-4" />{seeds.length > 0 ? `${seeds.length}+ فكرة` : 'أفكار متعددة'}</span>
          <span className="flex items-center gap-1.5"><TrendingUp className="w-4 h-4" />٩ قطاعات</span>
          <span className="flex items-center gap-1.5"><Users className="w-4 h-4" />حتى ٣ مؤسسين/فكرة</span>
          <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" />محدّثة Q2-2026</span>
        </div>
      </section>

      {/* ── Filters ── */}
      <div className="max-w-6xl mx-auto px-6 pb-8 space-y-4">
        <div className="relative max-w-md">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="ابحث عن فكرة..."
            className="w-full pr-10 pl-4 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2"
            style={{ borderColor: 'var(--gray-light)', background: 'var(--white)' }}
            dir="rtl"
          />
        </div>

        <div className="flex gap-2 flex-wrap flex-row-reverse">
          {SECTORS.map(s => {
            const count = countBySector(s.id);
            if (s.id !== 'all' && count === 0) return null;
            const isActive = activeSector === s.id;
            return (
              <button
                key={s.id}
                onClick={() => setActiveSector(s.id)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
                style={isActive
                  ? { background: 'hsl(144,58%,22%)', color: 'white' }
                  : { background: 'white', border: '1px solid hsl(42,25%,84%)', color: 'hsl(158,20%,32%)' }
                }
              >
                <span>{s.emoji}</span>
                <span>{s.label}</span>
                <span
                  className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold"
                  style={isActive
                    ? { background: 'hsl(144,58%,36%)', color: 'white' }
                    : { background: 'hsl(42,25%,92%)', color: 'hsl(158,20%,36%)' }
                  }
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {!loading && (
          <p className="text-xs text-muted-foreground text-right">{filtered.length} فكرة</p>
        )}
      </div>

      {/* ── Grid ── */}
      <div className="max-w-6xl mx-auto px-6 pb-20">
        {loading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-72 rounded-2xl animate-pulse" style={{ background: 'hsl(42,25%,92%)' }} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed p-16 text-center" style={{ borderColor: 'var(--gray-light)', background: 'var(--white)' }}>
            <Sprout className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="font-medium mb-1">لا توجد أفكار مطابقة</p>
            <p className="text-sm text-muted-foreground">جرّب قطاعاً آخر أو امسح البحث</p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map(seed => <SeedCard key={seed.id} seed={seed} />)}
          </div>
        )}
      </div>

      {/* ── CTA ── */}
      <section className="py-16 text-center px-6" style={{ background: 'var(--green-deep)', color: 'var(--white)' }}>
        <h2 className="text-2xl font-extrabold mb-3">جاهز تبدأ؟</h2>
        <p className="text-sm mb-6 max-w-xs mx-auto" style={{ color: 'var(--gold)' }}>
          سجّل مجاناً، التقط فكرة، وابدأ رحلتك الريادية اليوم.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/signup"
            className="inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl text-sm font-bold shadow-md hover:opacity-90 transition-all flex-row-reverse"
            style={{ background: 'var(--gold)', color: 'var(--green-deep)' }}
          >
            ابدأ مجاناً <ArrowLeft className="w-4 h-4" />
          </Link>
          <Link
            href="/pricing"
            className="inline-flex items-center justify-center px-8 py-3.5 rounded-xl text-sm font-semibold border transition-all hover:bg-white/10"
            style={{ borderColor: 'var(--green-brand)', color: 'var(--green-brand)' }}
          >
            شاهد الباقات
          </Link>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
