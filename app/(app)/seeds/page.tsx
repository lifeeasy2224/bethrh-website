'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Sprout, Users, Search, TrendingUp, Clock, DollarSign, ChevronLeft } from 'lucide-react';

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
  { id: 'all',            emoji: '🌱', label: 'الكل' },
  { id: 'food',           emoji: '🍕', label: 'الأغذية والزراعة' },
  { id: 'saas',           emoji: '💻', label: 'البرمجيات كخدمة' },
  { id: 'ecommerce',      emoji: '🛒', label: 'التجارة الإلكترونية' },
  { id: 'fintech',        emoji: '💰', label: 'التقنية المالية' },
  { id: 'edtech',         emoji: '📚', label: 'تقنية التعليم' },
  { id: 'health',         emoji: '🏥', label: 'الصحة والعافية' },
  { id: 'home-services',  emoji: '🏠', label: 'الخدمات المنزلية' },
  { id: 'sustainability', emoji: '♻️', label: 'الاستدامة والبيئة' },
  { id: 'logistics',      emoji: '🚚', label: 'اللوجستيات' },
];

function formatUSD(n: number) {
  return n.toLocaleString('en-US');
}

export default function SeedsPage() {
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
    const matchSearch = !q || s.name.includes(q) || s.sector_label.includes(q) || s.short_description?.includes(q);
    return matchSector && matchSearch;
  });

  const countBySector = (id: string) =>
    id === 'all' ? seeds.length : seeds.filter(s => s.sector_id === id).length;

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6" dir="rtl">

      {/* Header */}
      <div className="text-right">
        <div className="flex items-center gap-2 flex-row-reverse mb-1">
          <Sprout className="w-6 h-6 text-primary" />
          <h1 className="text-2xl font-bold">بذور جاهزة للزراعة</h1>
        </div>
        <p className="text-muted-foreground text-sm">
          {seeds.length > 0 ? `${seeds.length}+` : ''} فكرة مدروسة جاهزة للتنفيذ — اختر، التقط، وابدأ رحلتك
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="ابحث عن فكرة..."
          className="w-full pr-10 pl-4 py-2.5 rounded-xl border border-input bg-card text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          dir="rtl"
        />
      </div>

      {/* Sector tabs */}
      <div className="flex gap-2 flex-wrap flex-row-reverse">
        {SECTORS.map(s => {
          const count = countBySector(s.id);
          if (s.id !== 'all' && count === 0) return null;
          return (
            <button
              key={s.id}
              onClick={() => setActiveSector(s.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeSector === s.id
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-secondary'
              }`}
            >
              <span>{s.emoji}</span>
              <span>{s.label}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
                activeSector === s.id ? 'bg-primary/30' : 'bg-secondary'
              }`}>{count}</span>
            </button>
          );
        })}
      </div>

      {/* Grid */}
      {loading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-52 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-card rounded-xl border border-dashed border-border p-14 text-center">
          <Sprout className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="font-medium mb-1">لا توجد أفكار</p>
          <p className="text-sm text-muted-foreground">جرّب قطاعاً آخر أو امسح الفلتر</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(seed => {
            const spotsLeft = seed.max_spots - seed.spots_taken;
            const isFull = spotsLeft <= 0;
            return (
              <Link
                key={seed.id}
                href={`/seeds/${seed.slug}`}
                className={`group bg-card rounded-xl border border-border p-5 flex flex-col gap-3 text-right transition-all hover:-translate-y-0.5 hover:shadow-md ${
                  isFull ? 'opacity-70' : ''
                }`}
              >
                {/* Sector + capacity */}
                <div className="flex items-center justify-between flex-row-reverse">
                  <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-secondary text-secondary-foreground flex items-center gap-1">
                    <span>{seed.sector_emoji}</span>
                    {seed.sector_label}
                  </span>
                  <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-medium ${
                    isFull ? 'text-red-600 bg-[rgba(220,38,38,0.1)] border-red-300' : 'text-[var(--green-brand)] bg-[rgba(27,107,62,0.1)] border-[rgba(27,107,62,0.3)]'
                  }`}>
                    <Users className="w-3 h-3" />
                    {isFull ? 'مكتملة' : `${spotsLeft}/${seed.max_spots}`}
                  </span>
                </div>

                {/* Title */}
                <h3 className="font-semibold text-base leading-snug group-hover:text-primary transition-colors line-clamp-2">
                  {seed.name}
                </h3>

                {seed.short_description && (
                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                    {seed.short_description}
                  </p>
                )}

                {/* Metrics */}
                <div className="flex items-center gap-3 text-xs flex-row-reverse flex-wrap mt-auto pt-2 border-t border-border">
                  <span className="flex items-center gap-1 text-[var(--green-brand)] font-semibold">
                    <TrendingUp className="w-3 h-3" />{seed.roi_estimate}٪
                  </span>
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Clock className="w-3 h-3" />{seed.break_even_months} أشهر
                  </span>
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <DollarSign className="w-3 h-3" />${formatUSD(seed.investment_min)}+
                  </span>
                </div>

                <div className="flex items-center gap-1 text-xs font-medium text-primary flex-row-reverse group-hover:gap-2 transition-all">
                  {isFull
                    ? <span className="text-muted-foreground">مكتملة — جرّب فكرة أخرى</span>
                    : <><span>استكشف الفكرة</span><ChevronLeft className="w-3.5 h-3.5" /></>
                  }
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
