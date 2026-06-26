'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Trash2, CircleCheck as CheckCircle2, ChevronDown } from 'lucide-react';

type Ticket = {
  id: string; user_id: string | null; subject: string;
  description: string; status: string; priority: string; created_at: string;
};

const STATUS_CONFIG: Record<string, string> = {
  open:        'border-blue-300 text-blue-700 bg-blue-50',
  in_progress: 'border-amber-300 text-amber-700 bg-amber-50',
  resolved:    'border-emerald-300 text-emerald-700 bg-emerald-50',
  closed:      'border-slate-300 text-slate-500 bg-slate-50',
};
const PRIORITY_COLORS: Record<string, string> = {
  high: 'text-red-600 font-semibold', medium: 'text-amber-600 font-medium', low: 'text-slate-500',
};

export default function AdminTicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from('support_tickets').select('*').order('created_at', { ascending: false })
      .then(({ data }) => { setTickets(data ?? []); setLoading(false); });
  }, []);

  async function updateStatus(id: string, status: string) {
    await supabase.from('support_tickets').update({ status, updated_at: new Date().toISOString() }).eq('id', id);
    setTickets(p => p.map(t => t.id === id ? { ...t, status } : t));
  }

  async function del(id: string) {
    if (!confirm('Delete this ticket?')) return;
    await supabase.from('support_tickets').delete().eq('id', id);
    setTickets(p => p.filter(t => t.id !== id));
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Support Tickets</h1>
        <p className="text-slate-500 text-sm mt-0.5">{tickets.length} tickets total</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-7 h-7 border-2 border-t-transparent rounded-full animate-spin border-[var(--green-brand)]" />
          </div>
        ) : tickets.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-slate-500 text-sm">No support tickets yet.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Subject</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Priority</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Date</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tickets.map(t => (
                <tr key={t.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="font-medium text-slate-800">{t.subject}</div>
                    <div className="text-xs text-slate-400 mt-0.5 truncate max-w-[320px]">{t.description}</div>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="relative">
                      <select
                        value={t.status}
                        onChange={e => updateStatus(t.id, e.target.value)}
                        className={`appearance-none text-xs pl-2.5 pr-6 py-1 rounded-md border font-medium cursor-pointer outline-none ${STATUS_CONFIG[t.status] ?? STATUS_CONFIG.open}`}
                      >
                        <option value="open">Open</option>
                        <option value="in_progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                        <option value="closed">Closed</option>
                      </select>
                      <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none opacity-60" />
                    </div>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className={`text-xs capitalize ${PRIORITY_COLORS[t.priority] ?? ''}`}>
                      {t.priority.charAt(0).toUpperCase() + t.priority.slice(1)}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-xs text-slate-400">
                    {new Date(t.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2">
                      <button onClick={() => updateStatus(t.id, 'resolved')} className="p-1.5 rounded hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 transition-colors" title="Resolve">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => del(t.id)} className="p-1.5 rounded hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors" title="Delete">
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
