'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Boxes, Plus, X, Pencil, Trash2, CircleCheck as CheckCircle, Clock, Zap, TriangleAlert as AlertTriangle, Users, Shield, DollarSign, Globe, Layers } from 'lucide-react';

type Feature = {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: Category;
  status: Status;
  is_enabled: boolean;
  available_to: string[];
  notes: string;
  created_at: string;
  updated_at: string;
};

type Category = 'core' | 'founder' | 'investor' | 'admin' | 'monetization' | 'community';
type Status   = 'live' | 'beta' | 'coming_soon' | 'deprecated';

const CATEGORIES: { value: Category; label: string; icon: React.ElementType; color: string; bg: string }[] = [
  { value: 'core',         label: 'Core',         icon: Globe,       color: 'text-slate-600',   bg: 'bg-slate-100' },
  { value: 'founder',      label: 'Founder',      icon: Zap,         color: 'text-blue-600',    bg: 'bg-blue-50' },
  { value: 'investor',     label: 'Investor',     icon: DollarSign,  color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { value: 'admin',        label: 'Admin',        icon: Shield,      color: 'text-violet-600',  bg: 'bg-violet-50' },
  { value: 'monetization', label: 'Monetization', icon: DollarSign,  color: 'text-amber-600',   bg: 'bg-amber-50' },
  { value: 'community',    label: 'Community',    icon: Users,       color: 'text-pink-600',    bg: 'bg-pink-50' },
];

const STATUS_CONFIG: Record<Status, { label: string; icon: React.ElementType; color: string; bg: string; border: string }> = {
  live:         { label: 'Live',         icon: CheckCircle,   color: 'text-emerald-700', bg: 'bg-emerald-50',  border: 'border-emerald-200' },
  beta:         { label: 'Beta',         icon: Zap,           color: 'text-blue-700',    bg: 'bg-blue-50',     border: 'border-blue-200' },
  coming_soon:  { label: 'Coming Soon',  icon: Clock,         color: 'text-amber-700',   bg: 'bg-amber-50',    border: 'border-amber-200' },
  deprecated:   { label: 'Deprecated',   icon: AlertTriangle, color: 'text-red-600',     bg: 'bg-red-50',      border: 'border-red-200' },
};

const ALL_ROLES = ['founder', 'investor', 'admin'];

const EMPTY_FORM = {
  slug: '', name: '', description: '', category: 'core' as Category,
  status: 'live' as Status, is_enabled: true, available_to: ['founder', 'investor'] as string[],
  notes: '',
};

export default function FeaturesInventoryPage() {
  const [features, setFeatures] = useState<Feature[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [filterCat, setFilterCat] = useState<Category | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<Status | 'all'>('all');

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing]     = useState<Feature | null>(null);
  const [form, setForm]           = useState({ ...EMPTY_FORM });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { load(); }, []);

  async function load() {
    const { data } = await supabase
      .from('features_inventory')
      .select('*')
      .order('category')
      .order('name');
    setFeatures(data ?? []);
    setLoading(false);
  }

  function openCreate() {
    setEditing(null);
    setForm({ ...EMPTY_FORM });
    setShowModal(true);
  }

  function openEdit(f: Feature) {
    setEditing(f);
    setForm({
      slug: f.slug, name: f.name, description: f.description,
      category: f.category, status: f.status, is_enabled: f.is_enabled,
      available_to: f.available_to, notes: f.notes,
    });
    setShowModal(true);
  }

  function closeModal() { setShowModal(false); setEditing(null); }

  async function handleSave() {
    if (!form.name.trim() || !form.slug.trim()) return;
    setSubmitting(true);
    const payload = {
      slug: form.slug.trim().toLowerCase(),
      name: form.name.trim(),
      description: form.description.trim(),
      category: form.category,
      status: form.status,
      is_enabled: form.is_enabled,
      available_to: form.available_to,
      notes: form.notes.trim(),
      updated_at: new Date().toISOString(),
    };
    if (editing) {
      await supabase.from('features_inventory').update(payload).eq('id', editing.id);
    } else {
      await supabase.from('features_inventory').insert(payload);
    }
    await load();
    closeModal();
    setSubmitting(false);
  }

  async function toggleEnabled(f: Feature) {
    await supabase.from('features_inventory')
      .update({ is_enabled: !f.is_enabled, updated_at: new Date().toISOString() })
      .eq('id', f.id);
    setFeatures(p => p.map(x => x.id === f.id ? { ...x, is_enabled: !f.is_enabled } : x));
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this feature?')) return;
    await supabase.from('features_inventory').delete().eq('id', id);
    setFeatures(p => p.filter(x => x.id !== id));
  }

  function toggleRole(role: string) {
    setForm(p => ({
      ...p,
      available_to: p.available_to.includes(role)
        ? p.available_to.filter(r => r !== role)
        : [...p.available_to, role],
    }));
  }

  const filtered = features.filter(f => {
    if (filterCat !== 'all' && f.category !== filterCat) return false;
    if (filterStatus !== 'all' && f.status !== filterStatus) return false;
    if (search && !f.name.toLowerCase().includes(search.toLowerCase()) &&
        !f.slug.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const totalEnabled  = features.filter(f => f.is_enabled).length;
  const totalLive     = features.filter(f => f.status === 'live').length;
  const totalSoon     = features.filter(f => f.status === 'coming_soon').length;
  const totalBeta     = features.filter(f => f.status === 'beta').length;

  function getCatConfig(cat: Category) {
    return CATEGORIES.find(c => c.value === cat) ?? CATEGORIES[0];
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center">
            <Boxes className="w-4 h-4 text-slate-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Features Inventory</h1>
            <p className="text-slate-500 text-sm">Track, manage, and toggle all platform features</p>
          </div>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 text-white rounded-lg text-sm font-medium hover:bg-slate-900 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Add Feature
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total Features', value: features.length, icon: Layers,        bg: 'bg-slate-100',   ic: 'text-slate-600' },
          { label: 'Enabled',        value: totalEnabled,    icon: CheckCircle,    bg: 'bg-emerald-100', ic: 'text-emerald-600' },
          { label: 'Live',           value: totalLive,        icon: Zap,           bg: 'bg-blue-100',    ic: 'text-blue-600' },
          { label: 'Coming Soon',    value: totalSoon + totalBeta, icon: Clock,    bg: 'bg-amber-100',   ic: 'text-amber-600' },
        ].map(({ label, value, icon: Icon, bg, ic }) => (
          <div key={label} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex items-center gap-4">
            <div className={`w-10 h-10 rounded-lg ${bg} flex items-center justify-center shrink-0`}>
              <Icon className={`w-5 h-5 ${ic}`} />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900">{value}</div>
              <div className="text-sm text-slate-500">{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search features..."
          className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-300 w-52"
        />
        <select
          value={filterCat}
          onChange={e => setFilterCat(e.target.value as Category | 'all')}
          className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-300 appearance-none bg-white"
        >
          <option value="all">All Categories</option>
          {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
        <select
          value={filterStatus}
          onChange={e => setFilterStatus(e.target.value as Status | 'all')}
          className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-300 appearance-none bg-white"
        >
          <option value="all">All Statuses</option>
          <option value="live">Live</option>
          <option value="beta">Beta</option>
          <option value="coming_soon">Coming Soon</option>
          <option value="deprecated">Deprecated</option>
        </select>
        {(filterCat !== 'all' || filterStatus !== 'all' || search) && (
          <button
            onClick={() => { setFilterCat('all'); setFilterStatus('all'); setSearch(''); }}
            className="px-3 py-2 text-sm text-slate-500 hover:text-slate-800 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-7 h-7 border-2 border-t-transparent rounded-full animate-spin border-[var(--green-brand)]" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <Boxes className="w-10 h-10 text-slate-200 mx-auto mb-3" />
            <p className="text-slate-500 text-sm font-medium">
              {features.length === 0 ? 'No features yet — add your first feature above.' : 'No features match your filters.'}
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                {['Feature', 'Category', 'Status', 'Available To', 'Enabled', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider first:pl-5">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map(f => {
                const st  = STATUS_CONFIG[f.status];
                const cat = getCatConfig(f.category);
                const StatusIcon = st.icon;
                const CatIcon    = cat.icon;
                return (
                  <tr key={f.id} className="hover:bg-slate-50/60 transition-colors">
                    {/* Feature name */}
                    <td className="pl-5 pr-4 py-3.5 max-w-[260px]">
                      <div className="font-semibold text-slate-900 truncate">{f.name}</div>
                      <div className="text-xs text-slate-400 font-mono mt-0.5 truncate">{f.slug}</div>
                      {f.description && (
                        <div className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">{f.description}</div>
                      )}
                    </td>

                    {/* Category */}
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${cat.bg} ${cat.color}`}>
                        <CatIcon className="w-3 h-3" />
                        {cat.label}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full border ${st.bg} ${st.color} ${st.border}`}>
                        <StatusIcon className="w-3 h-3" />
                        {st.label}
                      </span>
                    </td>

                    {/* Available to */}
                    <td className="px-4 py-3.5">
                      <div className="flex flex-wrap gap-1">
                        {f.available_to.map(role => (
                          <span key={role} className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-medium capitalize">
                            {role}
                          </span>
                        ))}
                      </div>
                    </td>

                    {/* Toggle */}
                    <td className="px-4 py-3.5">
                      <button
                        onClick={() => toggleEnabled(f)}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${
                          f.is_enabled ? 'bg-emerald-500' : 'bg-slate-200'
                        }`}
                      >
                        <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                          f.is_enabled ? 'translate-x-4' : 'translate-x-1'
                        }`} />
                      </button>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => openEdit(f)}
                          className="p-1.5 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
                          title="Edit"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(f.id)}
                          className="p-1.5 rounded hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeModal} />
          <div
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-start gap-3 px-6 pt-6 pb-4 border-b border-slate-100 sticky top-0 bg-white z-10">
              <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                <Boxes className="w-4 h-4 text-slate-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-base font-bold text-slate-900">
                  {editing ? 'Edit Feature' : 'Add Feature'}
                </h2>
                <p className="text-sm text-slate-500">
                  {editing ? `Editing: ${editing.name}` : 'Register a new platform feature'}
                </p>
              </div>
              <button onClick={closeModal} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              {/* Name + Slug */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Name *</label>
                  <input
                    value={form.name}
                    onChange={e => {
                      const name = e.target.value;
                      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
                      setForm(p => ({ ...p, name, slug: editing ? p.slug : slug }));
                    }}
                    placeholder="Idea Validation"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-300"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Slug *</label>
                  <input
                    value={form.slug}
                    onChange={e => setForm(p => ({ ...p, slug: e.target.value.toLowerCase() }))}
                    placeholder="idea-validation"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm font-mono focus:outline-none focus:ring-2 focus:ring-slate-300"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Description</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  rows={2}
                  placeholder="What does this feature do?"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-300 resize-none"
                />
              </div>

              {/* Category + Status */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Category</label>
                  <select
                    value={form.category}
                    onChange={e => setForm(p => ({ ...p, category: e.target.value as Category }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-300 appearance-none bg-white"
                  >
                    {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Status</label>
                  <select
                    value={form.status}
                    onChange={e => setForm(p => ({ ...p, status: e.target.value as Status }))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-300 appearance-none bg-white"
                  >
                    <option value="live">Live</option>
                    <option value="beta">Beta</option>
                    <option value="coming_soon">Coming Soon</option>
                    <option value="deprecated">Deprecated</option>
                  </select>
                </div>
              </div>

              {/* Available to */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-2 uppercase tracking-wide">Available To</label>
                <div className="flex gap-2">
                  {ALL_ROLES.map(role => (
                    <button
                      key={role}
                      type="button"
                      onClick={() => toggleRole(role)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all capitalize ${
                        form.available_to.includes(role)
                          ? 'bg-slate-800 text-white border-slate-800'
                          : 'bg-white text-slate-500 border-slate-200 hover:border-slate-400'
                      }`}
                    >
                      {role}
                    </button>
                  ))}
                </div>
              </div>

              {/* Enabled toggle */}
              <div className="flex items-center justify-between py-1">
                <div>
                  <p className="text-sm font-semibold text-slate-800">Enabled</p>
                  <p className="text-xs text-slate-500">Feature is active and accessible to users</p>
                </div>
                <button
                  type="button"
                  onClick={() => setForm(p => ({ ...p, is_enabled: !p.is_enabled }))}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    form.is_enabled ? 'bg-emerald-500' : 'bg-slate-200'
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                    form.is_enabled ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">
                  Notes <span className="font-normal text-slate-400 normal-case">(internal)</span>
                </label>
                <textarea
                  value={form.notes}
                  onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                  rows={2}
                  placeholder="Internal notes, links to PRs, known issues..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-slate-300 resize-none"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 pb-6">
              <button
                onClick={closeModal}
                className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={submitting || !form.name.trim() || !form.slug.trim()}
                className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 text-white text-sm font-semibold rounded-xl hover:bg-slate-900 disabled:opacity-50 transition-colors"
              >
                <Boxes className="w-4 h-4" />
                {submitting ? 'Saving...' : editing ? 'Save Changes' : 'Add Feature'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
