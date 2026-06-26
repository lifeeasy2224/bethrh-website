'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Eye, CreditCard as Edit2, Trash2, Search, Link as LinkIcon } from 'lucide-react';
import Link from 'next/link';

type Seed = {
  id: string;
  name: string;
  slug: string;
  emoji: string;
  sector_label: string;
  sector_emoji: string;
  difficulty: string;
  is_published: boolean;
  is_featured: boolean;
  views: number;
  grabs: number;
  spots_taken: number;
  max_spots: number;
  created_at: string;
};

export default function AdminSeedsPage() {
  const [seeds, setSeeds] = useState<Seed[]>([]);
  const [filteredSeeds, setFilteredSeeds] = useState<Seed[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sectorFilter, setSectorFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    supabase
      .from('seeds')
      .select(
        'id,name,slug,emoji,sector_label,sector_emoji,difficulty,is_published,is_featured,views,grabs,spots_taken,max_spots,created_at'
      )
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setSeeds(data ?? []);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    let result = seeds;

    if (search) {
      const lowerSearch = search.toLowerCase();
      result = result.filter((s: Seed) =>
        s.name.toLowerCase().includes(lowerSearch) || s.slug.toLowerCase().includes(lowerSearch)
      );
    }

    if (sectorFilter !== 'all') {
      result = result.filter((s: Seed) => s.sector_label === sectorFilter);
    }

    if (statusFilter !== 'all') {
      if (statusFilter === 'featured') {
        result = result.filter((s: Seed) => s.is_featured);
      } else if (statusFilter === 'published') {
        result = result.filter((s: Seed) => s.is_published);
      } else if (statusFilter === 'draft') {
        result = result.filter((s: Seed) => !s.is_published);
      }
    }

    setFilteredSeeds(result);
  }, [search, sectorFilter, statusFilter, seeds]);

  async function togglePublished(id: string, current: boolean) {
    await supabase.from('seeds').update({ is_published: !current }).eq('id', id);
    setSeeds((p) =>
      p.map((s) => (s.id === id ? { ...s, is_published: !current } : s))
    );
  }

  async function deleteSeed(id: string) {
    if (!confirm('Delete this seed?')) return;
    await supabase.from('seeds').delete().eq('id', id);
    setSeeds((p) => p.filter((s) => s.id !== id));
  }

  const uniqueSectors = Array.from(new Set(seeds.map((s: Seed) => s.sector_label)));
  const DIFFICULTY_CONFIG: Record<string, string> = {
    easy: 'text-emerald-600 bg-emerald-50',
    medium: 'text-amber-600 bg-amber-50',
    hard: 'text-red-600 bg-red-50',
  };

  return (
    <div className="p-6 max-w-full mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Seeds Library</h1>
          <p className="text-slate-500 text-sm mt-0.5">{seeds.length} seeds total</p>
        </div>
        <Link
          href="/admin/seeds/new"
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
        >
          <LinkIcon className="w-4 h-4" />
          New Seed
        </Link>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name or slug..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--green-brand)]"
          />
        </div>
        <div className="relative">
          <select
            value={sectorFilter}
            onChange={(e) => setSectorFilter(e.target.value)}
            className="pl-3 pr-8 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--green-brand)] appearance-none cursor-pointer"
          >
            <option value="all">All Sectors</option>
            {uniqueSectors.map((sector) => (
              <option key={sector} value={sector}>
                {sector}
              </option>
            ))}
          </select>
        </div>
        <div className="relative">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="pl-3 pr-8 py-2 border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--green-brand)] appearance-none cursor-pointer"
          >
            <option value="all">All Status</option>
            <option value="featured">Featured</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-7 h-7 border-2 border-t-transparent rounded-full animate-spin border-[var(--green-brand)]" />
          </div>
        ) : filteredSeeds.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-slate-500 text-sm">No seeds found.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Seed
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Sector
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Views
                </th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Grabs
                </th>
                <th className="text-center px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Published
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSeeds.map((seed: Seed) => (
                <tr key={seed.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{seed.emoji}</span>
                      <div>
                        <div className="font-medium text-slate-800">{seed.name}</div>
                        <div className="text-xs text-slate-400">{seed.slug}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm">{seed.sector_emoji}</span>
                      <span className="text-xs text-slate-600">{seed.sector_label}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-1.5">
                      {seed.is_featured && (
                        <span className="text-xs px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full">
                          Featured
                        </span>
                      )}
                      <span
                        className={`text-xs px-2 py-1 rounded-full capitalize ${
                          DIFFICULTY_CONFIG[seed.difficulty] || 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {seed.difficulty}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-right text-sm text-slate-700">
                    {seed.views.toLocaleString()}
                  </td>
                  <td className="px-4 py-3.5 text-right text-sm text-slate-700">
                    {seed.spots_taken}/{seed.max_spots}
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <button
                      onClick={() => togglePublished(seed.id, seed.is_published)}
                      className={`text-xs px-3 py-1 rounded-full font-medium transition-colors ${
                        seed.is_published
                          ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {seed.is_published ? 'Published' : 'Draft'}
                    </button>
                  </td>
                  <td className="px-4 py-3.5 text-xs text-slate-400">
                    {new Date(seed.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2">
                      <button
                        className="p-1.5 rounded hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors"
                        title="View"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <Link
                        href={`/admin/seeds/${seed.id}/edit`}
                        className="p-1.5 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </Link>
                      <button
                        onClick={() => deleteSeed(seed.id)}
                        className="p-1.5 rounded hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
