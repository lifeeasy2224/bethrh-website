'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Bold, Italic, List, ListOrdered, Link as LinkIcon } from 'lucide-react';

type FormData = {
  name: string;
  slug: string;
  emoji: string;
  sector_label: string;
  difficulty: string;
  spots_total: number;
  short_description: string;
  is_published: boolean;
  is_featured: boolean;
  problem: string;
  solution: string;
  target_customer: string;
  revenue_model: string;
  min_investment: number;
  max_investment: number;
  roi_estimate: number;
  break_even_months: number;
};

const EMOJIS = ['💡', '🚀', '🌱', '🔧', '📱', '🏪', '🌍', '🎯', '⚡', '🔬', '🤖', '🎨'];
const SECTORS = [
  { label: 'SaaS/البرمجيات كخدمة', emoji: '☁️' },
  { label: 'Ecommerce/التجارة الإلكترونية', emoji: '🛍️' },
  { label: 'Fintech/التقنية المالية', emoji: '💳' },
  { label: 'EdTech/تقنية التعليم', emoji: '📚' },
  { label: 'Food/الأغذية والزراعة', emoji: '🍽️' },
  { label: 'Health/الرعاية الصحية', emoji: '⚕️' },
  { label: 'Logistics/اللوجستيات', emoji: '📦' },
  { label: 'Sustainability/الاستدامة', emoji: '🌿' },
];
const DIFFICULTIES = ['easy', 'medium', 'hard'];

export default function NewSeedPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<FormData>({
    name: '',
    slug: '',
    emoji: EMOJIS[0],
    sector_label: SECTORS[0].label,
    difficulty: 'medium',
    spots_total: 10,
    short_description: '',
    is_published: false,
    is_featured: false,
    problem: '',
    solution: '',
    target_customer: '',
    revenue_model: '',
    min_investment: 0,
    max_investment: 0,
    roi_estimate: 0,
    break_even_months: 0,
  });

  const updateSlug = (name: string) => {
    const slug = name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-');
    setForm((p) => ({ ...p, slug }));
  };

  const handleNameChange = (value: string) => {
    setForm((p) => ({ ...p, name: value }));
    updateSlug(value);
  };

  const insertFormatting = (field: keyof FormData, before: string, after: string = '') => {
    if (field === 'problem' || field === 'solution' || field === 'target_customer' || field === 'revenue_model') {
      const textarea = document.querySelector(`textarea[name="${field}"]`) as HTMLTextAreaElement;
      if (textarea) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = form[field] as string;
        const selected = text.substring(start, end);
        const newText =
          text.substring(0, start) + before + selected + after + text.substring(end);
        setForm((p) => ({ ...p, [field]: newText }));
      }
    }
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const sector = SECTORS.find((s) => s.label === form.sector_label);

    await supabase.from('seeds').insert({
      name: form.name,
      slug: form.slug,
      emoji: form.emoji,
      sector_label: form.sector_label,
      sector_emoji: sector?.emoji,
      difficulty: form.difficulty,
      max_spots: form.spots_total,
      short_description: form.short_description,
      is_published: form.is_published,
      is_featured: form.is_featured,
      problem: form.problem,
      solution: form.solution,
      target_customer: form.target_customer,
      revenue_model: form.revenue_model,
      min_investment: form.min_investment,
      max_investment: form.max_investment,
      roi_estimate: form.roi_estimate,
      break_even_months: form.break_even_months,
      views: 0,
      grabs: 0,
      spots_taken: 0,
    });

    router.push('/admin/seeds');
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="p-1.5 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="text-sm text-slate-500">Seeds Library</div>
            <h1 className="text-xl font-bold text-slate-900">Create New Seed</h1>
          </div>
        </div>
        <button
          onClick={handleSubmit}
          disabled={loading || !form.name || !form.slug}
          className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Creating...' : 'Create Seed'}
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Info */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Basic Info</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Title *
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  placeholder="e.g., AI Coach Platform"
                  required
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Slug *
                </label>
                <input
                  type="text"
                  value={form.slug}
                  onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value }))}
                  placeholder="auto-generated"
                  required
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Emoji
                </label>
                <div className="flex flex-wrap gap-2">
                  {EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setForm((p) => ({ ...p, emoji }))}
                      className={`text-2xl p-2 rounded-lg transition-colors ${
                        form.emoji === emoji
                          ? 'bg-emerald-100 ring-2 ring-emerald-500'
                          : 'hover:bg-slate-100'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Sector
                </label>
                <select
                  value={form.sector_label}
                  onChange={(e) => setForm((p) => ({ ...p, sector_label: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 appearance-none"
                >
                  {SECTORS.map((sector) => (
                    <option key={sector.label} value={sector.label}>
                      {sector.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Difficulty
                </label>
                <select
                  value={form.difficulty}
                  onChange={(e) => setForm((p) => ({ ...p, difficulty: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 appearance-none"
                >
                  {DIFFICULTIES.map((d) => (
                    <option key={d} value={d}>
                      {d.charAt(0).toUpperCase() + d.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Max Spots
                </label>
                <input
                  type="number"
                  value={form.spots_total}
                  onChange={(e) => setForm((p) => ({ ...p, spots_total: Number(e.target.value) }))}
                  min="1"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Tagline
                </label>
                <input
                  type="text"
                  value={form.short_description}
                  onChange={(e) => setForm((p) => ({ ...p, short_description: e.target.value }))}
                  placeholder="Short description"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="flex gap-4 pt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.is_published}
                  onChange={(e) => setForm((p) => ({ ...p, is_published: e.target.checked }))}
                  className="rounded border-slate-300"
                />
                <span className="text-sm text-slate-700">Published</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.is_featured}
                  onChange={(e) => setForm((p) => ({ ...p, is_featured: e.target.checked }))}
                  className="rounded border-slate-300"
                />
                <span className="text-sm text-slate-700">Featured</span>
              </label>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Content</h2>
          <div className="space-y-4">
            {(['problem', 'solution', 'target_customer', 'revenue_model'] as const).map((field) => (
              <div key={field}>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-slate-700 capitalize">
                    {field.replace(/_/g, ' ')}
                  </label>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => insertFormatting(field, '**', '**')}
                      className="p-1 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors"
                      title="Bold"
                    >
                      <Bold className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertFormatting(field, '*', '*')}
                      className="p-1 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors"
                      title="Italic"
                    >
                      <Italic className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertFormatting(field, '• ')}
                      className="p-1 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors"
                      title="Bullet"
                    >
                      <List className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertFormatting(field, '1. ')}
                      className="p-1 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors"
                      title="Numbered"
                    >
                      <ListOrdered className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => insertFormatting(field, '[', '](url)')}
                      className="p-1 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors"
                      title="Link"
                    >
                      <LinkIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <textarea
                  name={field}
                  value={form[field]}
                  onChange={(e) => setForm((p) => ({ ...p, [field]: e.target.value }))}
                  placeholder={`Enter ${field.replace(/_/g, ' ')}...`}
                  rows={3}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Financials */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Financials</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Min Investment ($)
              </label>
              <input
                type="number"
                value={form.min_investment}
                onChange={(e) => setForm((p) => ({ ...p, min_investment: Number(e.target.value) }))}
                min="0"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Max Investment ($)
              </label>
              <input
                type="number"
                value={form.max_investment}
                onChange={(e) => setForm((p) => ({ ...p, max_investment: Number(e.target.value) }))}
                min="0"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                ROI Estimate (%)
              </label>
              <input
                type="number"
                value={form.roi_estimate}
                onChange={(e) => setForm((p) => ({ ...p, roi_estimate: Number(e.target.value) }))}
                min="0"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Break-even Months
              </label>
              <input
                type="number"
                value={form.break_even_months}
                onChange={(e) => setForm((p) => ({ ...p, break_even_months: Number(e.target.value) }))}
                min="0"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
