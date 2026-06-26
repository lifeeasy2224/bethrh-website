'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Tag, Users, CircleCheck as CheckCircle, Trash2, Copy, RefreshCw, Calendar, Plus, X } from 'lucide-react';

type PromoCode = {
  id: string;
  code: string;
  discount_percent: number;
  description: string | null;
  max_uses: number | null;
  times_used: number;
  is_active: boolean;
  expires_at: string | null;
  created_by_email: string | null;
  created_at: string;
};

const DISCOUNT_OPTIONS = [
  { value: 100, label: '100%', sub: '100% Off', desc: 'Completely Free', color: 'text-orange-500' },
  { value: 75,  label: '75%',  sub: '75% Off',  desc: '3/4 Discount',    color: 'text-teal-500' },
  { value: 50,  label: '50%',  sub: '50% Off',  desc: 'Half Price',      color: 'text-cyan-500' },
  { value: 25,  label: '25%',  sub: '25% Off',  desc: 'Quarter Off',     color: 'text-emerald-600' },
];

const PREFIXES: Record<number, string> = { 100: 'FREE', 75: 'DEAL75', 50: 'HALF', 25: 'DEAL25' };

function generateCode(discount: number): string {
  const prefix = PREFIXES[discount] ?? 'PROMO';
  const suffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${prefix}-${suffix}`;
}

export default function AdminPromoCodesPage() {
  const [codes, setCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [discount, setDiscount] = useState(50);
  const [code, setCode] = useState(() => generateCode(50));
  const [description, setDescription] = useState('');
  const [maxUses, setMaxUses] = useState('');
  const [expiresAt, setExpiresAt] = useState('');

  const refreshCode = useCallback((d = discount) => {
    setCode(generateCode(d));
  }, [discount]);

  function selectDiscount(d: number) {
    setDiscount(d);
    setCode(generateCode(d));
  }

  useEffect(() => { loadCodes(); }, []);

  async function loadCodes() {
    const { data } = await supabase
      .from('promo_codes')
      .select('*')
      .order('created_at', { ascending: false });
    setCodes(data ?? []);
    setLoading(false);
  }

  async function handleCreate() {
    if (!code.trim()) return;
    setSubmitting(true);
    const { data: { user } } = await supabase.auth.getUser();

    await supabase.from('promo_codes').insert({
      code: code.trim().toUpperCase(),
      discount_percent: discount,
      description: description.trim() || null,
      max_uses: maxUses ? Number(maxUses) : null,
      expires_at: expiresAt || null,
      is_active: true,
      is_used: false,
      times_used: 0,
      created_by: user?.id ?? null,
      created_by_email: user?.email ?? '',
    });

    setShowModal(false);
    resetForm();
    await loadCodes();
    setSubmitting(false);
  }

  function resetForm() {
    setDiscount(50);
    setCode(generateCode(50));
    setDescription('');
    setMaxUses('');
    setExpiresAt('');
  }

  function openModal() { resetForm(); setShowModal(true); }
  function closeModal() { setShowModal(false); resetForm(); }

  async function toggleActive(id: string, current: boolean) {
    await supabase.from('promo_codes').update({ is_active: !current }).eq('id', id);
    setCodes(p => p.map(c => c.id === id ? { ...c, is_active: !current } : c));
  }

  async function deleteCode(id: string) {
    if (!confirm('Delete this promo code?')) return;
    await supabase.from('promo_codes').delete().eq('id', id);
    setCodes(p => p.filter(c => c.id !== id));
  }

  async function copyCode(c: string) {
    await navigator.clipboard.writeText(c);
    setCopied(c);
    setTimeout(() => setCopied(null), 1500);
  }

  const totalCodes      = codes.length;
  const activeCodes     = codes.filter(c => c.is_active).length;
  const totalRedemptions = codes.reduce((s, c) => s + (c.times_used ?? 0), 0);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center">
            <Tag className="w-4 h-4 text-slate-600" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900">Promo Codes</h1>
            <p className="text-slate-500 text-sm">Generate discount codes for users</p>
          </div>
        </div>
        <button
          onClick={openModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 text-white rounded-lg text-sm font-medium hover:bg-slate-900 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Generate Code
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { icon: Tag,          label: 'Total Codes',       value: totalCodes,       iconBg: 'bg-slate-100',   iconColor: 'text-slate-600' },
          { icon: CheckCircle,  label: 'Active Codes',      value: activeCodes,      iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600' },
          { icon: Users,        label: 'Total Redemptions', value: totalRedemptions, iconBg: 'bg-slate-100',   iconColor: 'text-slate-600' },
        ].map(({ icon: Icon, label, value, iconBg, iconColor }) => (
          <div key={label} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 flex items-center gap-4">
            <div className={`w-10 h-10 rounded-lg ${iconBg} flex items-center justify-center shrink-0`}>
              <Icon className={`w-5 h-5 ${iconColor}`} />
            </div>
            <div>
              <div className="text-2xl font-bold text-slate-900">{value}</div>
              <div className="text-sm text-slate-500">{label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-7 h-7 border-2 border-t-transparent rounded-full animate-spin border-[var(--green-brand)]" />
          </div>
        ) : codes.length === 0 ? (
          <div className="text-center py-16">
            <Tag className="w-8 h-8 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500 text-sm">No promo codes yet.</p>
            <button onClick={openModal} className="mt-3 text-sm text-slate-600 underline underline-offset-2">
              Generate your first code
            </button>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                {['Code', 'Discount', 'Description', 'Uses', 'Expires', 'Created By', 'Active', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider first:pl-5">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {codes.map(c => (
                <tr key={c.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="pl-5 pr-4 py-3.5">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-900 tracking-wide">{c.code}</span>
                      <button
                        onClick={() => copyCode(c.code)}
                        className="text-slate-400 hover:text-slate-600 transition-colors"
                        title="Copy"
                      >
                        {copied === c.code
                          ? <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                          : <Copy className="w-3.5 h-3.5" />
                        }
                      </button>
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 font-semibold border border-emerald-200">
                      {c.discount_percent}% off
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-sm text-slate-500 max-w-[180px] truncate">
                    {c.description || <span className="text-slate-300">—</span>}
                  </td>
                  <td className="px-4 py-3.5 text-sm text-slate-700">
                    {c.times_used ?? 0}{c.max_uses ? `/${c.max_uses}` : ''}
                  </td>
                  <td className="px-4 py-3.5 text-xs text-slate-500">
                    {c.expires_at ? (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(c.expires_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </span>
                    ) : (
                      <span className="text-slate-300">No limit</span>
                    )}
                  </td>
                  <td className="px-4 py-3.5 text-xs text-slate-500">
                    {c.created_by_email || <span className="text-slate-300">—</span>}
                  </td>
                  <td className="px-4 py-3.5">
                    <button
                      onClick={() => toggleActive(c.id, c.is_active ?? true)}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${
                        c.is_active ? 'bg-emerald-500' : 'bg-slate-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${
                          c.is_active ? 'translate-x-4' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </td>
                  <td className="px-4 py-3.5">
                    <button
                      onClick={() => deleteCode(c.id)}
                      className="p-1.5 rounded hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Generate Code Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeModal} />
          <div
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal header */}
            <div className="flex items-start gap-3 px-6 pt-6 pb-4 border-b border-slate-100">
              <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
                <Tag className="w-4 h-4 text-slate-600" />
              </div>
              <div className="flex-1">
                <h2 className="text-base font-bold text-slate-900">Generate Promo Code</h2>
                <p className="text-sm text-slate-500">Choose a discount level and customize</p>
              </div>
              <button
                onClick={closeModal}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-5">
              {/* Discount level */}
              <div>
                <p className="text-sm font-semibold text-slate-800 mb-3">Discount Level</p>
                <div className="grid grid-cols-2 gap-3">
                  {DISCOUNT_OPTIONS.map(opt => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => selectDiscount(opt.value)}
                      className={`rounded-xl border-2 p-4 text-center transition-all ${
                        discount === opt.value
                          ? 'border-cyan-400 bg-cyan-50'
                          : 'border-slate-200 bg-white hover:border-slate-300'
                      }`}
                    >
                      <div className={`text-2xl font-extrabold ${opt.color}`}>{opt.label}</div>
                      <div className={`text-sm font-semibold ${opt.color}`}>{opt.sub}</div>
                      <div className="text-xs text-slate-400 mt-0.5">{opt.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Code field */}
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1.5 tracking-wide uppercase">
                  Promo Code
                </label>
                <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-slate-300">
                  <input
                    type="text"
                    value={code}
                    onChange={e => setCode(e.target.value.toUpperCase())}
                    className="flex-1 px-3.5 py-2.5 text-sm font-mono font-bold text-slate-900 bg-white outline-none"
                    placeholder="CODE"
                  />
                  <button
                    type="button"
                    onClick={() => refreshCode(discount)}
                    className="px-3 py-2.5 text-slate-400 hover:text-slate-700 hover:bg-slate-50 transition-colors"
                    title="Regenerate"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Description */}
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Description (optional)"
                rows={2}
                className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-slate-300 resize-none"
              />

              {/* Max uses + Expires */}
              <div className="grid grid-cols-2 gap-3">
                <div className="relative">
                  <input
                    type="number"
                    value={maxUses}
                    onChange={e => setMaxUses(e.target.value)}
                    placeholder="Max Uses"
                    min="1"
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-slate-300"
                  />
                </div>
                <div className="relative">
                  <label className="absolute -top-2 left-3 text-[10px] font-medium text-slate-400 bg-white px-1 uppercase tracking-wide">
                    Expires
                  </label>
                  <input
                    type="date"
                    value={expiresAt}
                    onChange={e => setExpiresAt(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-700 outline-none focus:ring-2 focus:ring-slate-300"
                  />
                </div>
              </div>
            </div>

            {/* Modal footer */}
            <div className="flex items-center justify-end gap-3 px-6 pb-6">
              <button
                onClick={closeModal}
                className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={submitting || !code.trim()}
                className="flex items-center gap-2 px-5 py-2.5 bg-slate-800 text-white text-sm font-semibold rounded-xl hover:bg-slate-900 disabled:opacity-50 transition-colors"
              >
                <Tag className="w-4 h-4" />
                {submitting ? 'Creating...' : 'Create Code'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
