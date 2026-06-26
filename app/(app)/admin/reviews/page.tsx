'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Star, Search, ChevronDown } from 'lucide-react';

type Review = {
  id: string;
  user_id: string | null;
  user_role: string;
  trigger_type: string;
  trigger_context: string;
  rating: number;
  feedback: string;
  photo_url: string;
  created_at: string;
};

const TRIGGER_LABELS: Record<string, string> = {
  stage_complete:                  'Stage Complete',
  high_score:                      'High Score (80+)',
  greenhouse_contact_founder:      'Investor Contacted Founder',
  greenhouse_contact_investor:     'Investor Sent Contact',
};

const TRIGGER_COLORS: Record<string, string> = {
  stage_complete:              'bg-blue-100 text-blue-700',
  high_score:                  'bg-amber-100 text-amber-700',
  greenhouse_contact_founder:  'bg-emerald-100 text-emerald-700',
  greenhouse_contact_investor: 'bg-teal-100 text-teal-700',
};

const ROLE_COLORS: Record<string, string> = {
  founder:  'bg-secondary text-foreground',
  investor: 'bg-blue-100 text-blue-700',
};

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1,2,3,4,5].map(i => (
        <Star key={i} className={`w-3.5 h-3.5 ${i <= rating ? 'fill-amber-400 text-amber-400' : 'text-muted'}`} strokeWidth={1.5} />
      ))}
    </div>
  );
}

export default function AdminReviewsPage() {
  const [reviews, setReviews]     = useState<Review[]>([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [triggerFilter, setTriggerFilter] = useState('all');
  const [roleFilter, setRoleFilter]       = useState('all');
  const [minRating, setMinRating]         = useState(0);
  const [preview, setPreview]     = useState('');

  useEffect(() => {
    supabase.from('reviews').select('*').order('created_at', { ascending: false })
      .then(({ data }) => { setReviews(data ?? []); setLoading(false); });
  }, []);

  const avg = reviews.length
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : '–';

  const filtered = reviews.filter(r => {
    const q = search.toLowerCase();
    const matchSearch = r.feedback?.toLowerCase().includes(q) || r.trigger_context?.toLowerCase().includes(q);
    const matchTrigger = triggerFilter === 'all' || r.trigger_type === triggerFilter;
    const matchRole    = roleFilter   === 'all' || r.user_role === roleFilter;
    const matchRating  = r.rating >= minRating;
    return matchSearch && matchTrigger && matchRole && matchRating;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Reviews</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {reviews.length} total — avg rating: <span className="font-semibold text-amber-500">{avg} ★</span>
          </p>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total Reviews', value: reviews.length },
          { label: 'Avg Rating',    value: `${avg} ★` },
          { label: '5-Star Reviews',value: reviews.filter(r => r.rating === 5).length },
          { label: 'With Photo',    value: reviews.filter(r => r.photo_url).length },
        ].map(s => (
          <div key={s.label} className="bg-card rounded-xl border border-border p-4 shadow-sm">
            <p className="text-xs text-muted-foreground font-semibold uppercase tracking-wider mb-1">{s.label}</p>
            <p className="text-2xl font-bold text-foreground">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search reviews…"
            className="pl-9 pr-4 py-2 rounded-lg border border-border text-sm outline-none focus:ring-2 focus:ring-[var(--green-brand)]/30 bg-card w-48"
          />
        </div>
        <FilterSelect value={triggerFilter} onChange={setTriggerFilter} options={[
          { value: 'all',                           label: 'All Triggers' },
          { value: 'stage_complete',                label: 'Stage Complete' },
          { value: 'high_score',                    label: 'High Score' },
          { value: 'greenhouse_contact_founder',    label: 'Founder Contact' },
          { value: 'greenhouse_contact_investor',   label: 'Investor Contact' },
        ]} />
        <FilterSelect value={roleFilter} onChange={setRoleFilter} options={[
          { value: 'all',      label: 'All Roles' },
          { value: 'founder',  label: 'Founders' },
          { value: 'investor', label: 'Investors' },
        ]} />
        <FilterSelect value={String(minRating)} onChange={v => setMinRating(Number(v))} options={[
          { value: '0', label: 'All Ratings' },
          { value: '4', label: '4+ Stars' },
          { value: '5', label: '5 Stars Only' },
        ]} />
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-7 h-7 border-2 border-t-transparent rounded-full animate-spin border-[var(--green-brand)]" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[900px]">
              <thead>
                <tr className="border-b border-border bg-secondary">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">User</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Trigger</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Context</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Rating</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Feedback</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Photo</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-muted-foreground text-sm">No reviews found</td>
                  </tr>
                ) : filtered.map(r => (
                  <tr key={r.id} className="hover:bg-secondary/30 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0" style={{ background: 'var(--green-brand)' }}>
                          {r.user_id ? r.user_id.slice(0, 2).toUpperCase() : '?'}
                        </div>
                        <div>
                          <div className="text-xs font-mono text-muted-foreground">{r.user_id ? r.user_id.slice(0, 8) + '…' : 'anon'}</div>
                          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${ROLE_COLORS[r.user_role] ?? 'bg-secondary text-foreground'}`}>
                            {r.user_role}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`text-xs font-semibold px-2 py-1 rounded-md ${TRIGGER_COLORS[r.trigger_type] ?? 'bg-secondary text-foreground'}`}>
                        {TRIGGER_LABELS[r.trigger_type] ?? r.trigger_type}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-xs text-muted-foreground max-w-[160px] truncate">{r.trigger_context || '—'}</td>
                    <td className="px-4 py-3.5">
                      <div className="space-y-0.5">
                        <StarRow rating={r.rating} />
                        <span className="text-xs text-muted-foreground">{r.rating}/5</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 max-w-[200px]">
                      {r.feedback ? (
                        <p className="text-xs text-foreground line-clamp-2">{r.feedback}</p>
                      ) : (
                        <span className="text-xs text-muted">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5">
                      {r.photo_url ? (
                        <button onClick={() => setPreview(r.photo_url)} className="w-10 h-10 rounded-lg overflow-hidden border border-border hover:ring-2 hover:ring-[var(--green-brand)] transition-all shrink-0">
                          <img src={r.photo_url} alt="review" className="w-full h-full object-cover" />
                        </button>
                      ) : (
                        <span className="text-xs text-muted">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3.5 text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(r.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Photo Preview Lightbox */}
      {preview && (
        <div className="fixed inset-0 z-[9999] bg-black/80 flex items-center justify-center p-4" onClick={() => setPreview('')}>
          <img src={preview} alt="review photo" className="max-w-2xl max-h-[80vh] rounded-xl shadow-2xl object-contain" />
        </div>
      )}
    </div>
  );
}

function FilterSelect({ value, onChange, options }: {
  value: string; onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="appearance-none pl-3 pr-8 py-2 rounded-lg border border-border text-sm outline-none focus:ring-2 focus:ring-[var(--green-brand)]/30 bg-card text-foreground cursor-pointer"
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
    </div>
  );
}
