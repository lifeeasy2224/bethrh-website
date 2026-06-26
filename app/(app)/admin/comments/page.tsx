'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { Search, CircleCheck as CheckCircle2, Trash2, ChevronDown } from 'lucide-react';

type FeedbackRow = {
  id: string; user_id: string | null; type: string;
  title: string; content: string; status: string;
  priority: string; created_at: string;
};

const TYPE_CONFIG: Record<string, { label: string; color: string }> = {
  bug_report:      { label: 'Bug Report',      color: 'bg-red-100 text-red-700' },
  feature_request: { label: 'Feature Request', color: 'bg-blue-100 text-blue-700' },
  feedback:        { label: 'Feedback',         color: 'bg-green-100 text-green-700' },
  comment:         { label: 'Comment',          color: 'bg-amber-100 text-amber-700' },
};

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  new:         { label: 'New',         color: 'border-blue-300 text-blue-700 bg-blue-50' },
  in_progress: { label: 'In Progress', color: 'border-amber-300 text-amber-700 bg-amber-50' },
  resolved:    { label: 'Resolved',    color: 'border-emerald-300 text-emerald-700 bg-emerald-50' },
  closed:      { label: 'Closed',      color: 'border-slate-300 text-slate-500 bg-slate-50' },
};

const PRIORITY_COLORS: Record<string, string> = {
  high:   'text-red-600 font-semibold',
  medium: 'text-amber-600 font-medium',
  low:    'text-slate-500',
};

function FilterSelect({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <div className="relative">
      <select value={value} onChange={e => onChange(e.target.value)}
        className="appearance-none pl-3 pr-8 py-2 rounded-lg border border-border text-sm outline-none bg-card text-foreground cursor-pointer">
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
    </div>
  );
}

export default function AdminCommentsPage() {
  const [rows, setRows] = useState<FeedbackRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');

  const load = useCallback(async () => {
    const { data } = await supabase.from('feedback').select('*').order('created_at', { ascending: false });
    setRows(data ?? []); setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function updateStatus(id: string, status: string) {
    await supabase.from('feedback').update({ status, updated_at: new Date().toISOString() }).eq('id', id);
    setRows(p => p.map(r => r.id === id ? { ...r, status } : r));
  }

  async function deleteRow(id: string) {
    if (!confirm('Delete this feedback?')) return;
    await supabase.from('feedback').delete().eq('id', id);
    setRows(p => p.filter(r => r.id !== id));
  }

  const filtered = rows.filter(r => {
    const q = search.toLowerCase();
    return (r.title.toLowerCase().includes(q) || r.content.toLowerCase().includes(q)) &&
      (typeFilter === 'all' || r.type === typeFilter) &&
      (statusFilter === 'all' || r.status === statusFilter) &&
      (priorityFilter === 'all' || r.priority === priorityFilter);
  });

  const newCount = rows.filter(r => r.status === 'new').length;
  const bugCount = rows.filter(r => r.type === 'bug_report').length;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-5">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <h1 className="text-xl font-bold text-foreground">Comments & Feedback</h1>
            {newCount > 0 && <span className="text-xs bg-emerald-100 text-emerald-700 font-semibold px-2 py-0.5 rounded-full">{newCount} New</span>}
            {bugCount > 0 && <span className="text-xs bg-destructive/20 text-destructive font-semibold px-2 py-0.5 rounded-full">{bugCount} Bug Reports</span>}
          </div>
          <p className="text-muted-foreground text-sm">{rows.length} submissions total</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search feedback…"
            className="pl-9 pr-4 py-2 rounded-lg border border-border text-sm outline-none focus:ring-2 focus:ring-[var(--green-brand)]/30 bg-card w-52" />
        </div>
        <FilterSelect value={typeFilter} onChange={setTypeFilter} options={[
          { value: 'all', label: 'All Types' }, { value: 'bug_report', label: 'Bug Report' },
          { value: 'feature_request', label: 'Feature Request' }, { value: 'feedback', label: 'Feedback' },
          { value: 'comment', label: 'Comment' },
        ]} />
        <FilterSelect value={statusFilter} onChange={setStatusFilter} options={[
          { value: 'all', label: 'All Status' }, { value: 'new', label: 'New' },
          { value: 'in_progress', label: 'In Progress' }, { value: 'resolved', label: 'Resolved' }, { value: 'closed', label: 'Closed' },
        ]} />
        <FilterSelect value={priorityFilter} onChange={setPriorityFilter} options={[
          { value: 'all', label: 'All Priority' }, { value: 'high', label: 'High' }, { value: 'medium', label: 'Medium' }, { value: 'low', label: 'Low' },
        ]} />
      </div>

      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-7 h-7 border-2 border-t-transparent rounded-full animate-spin border-[var(--green-brand)]" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[800px]">
              <thead>
                <tr className="border-b border-border bg-secondary">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Type</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Content</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Priority</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Date</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-12 text-muted-foreground text-sm">No feedback found</td></tr>
                ) : filtered.map(row => {
                  const typeConf   = TYPE_CONFIG[row.type]   ?? { label: row.type, color: 'bg-secondary text-foreground' };
                  const statusConf = STATUS_CONFIG[row.status] ?? STATUS_CONFIG.new;
                  return (
                    <tr key={row.id} className="hover:bg-secondary/30 transition-colors">
                      <td className="px-4 py-3.5">
                        <span className={`text-xs font-semibold px-2 py-1 rounded-md ${typeConf.color}`}>{typeConf.label}</span>
                      </td>
                      <td className="px-4 py-3.5 max-w-[280px]">
                        <div className="font-medium text-foreground text-sm truncate">{row.title}</div>
                        <div className="text-xs text-muted-foreground mt-0.5 truncate">{row.content}</div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="relative">
                          <select value={row.status} onChange={e => updateStatus(row.id, e.target.value)}
                            className={`appearance-none text-xs pl-2.5 pr-6 py-1 rounded-md border font-medium cursor-pointer outline-none ${statusConf.color}`}>
                            <option value="new">New</option>
                            <option value="in_progress">In Progress</option>
                            <option value="resolved">Resolved</option>
                            <option value="closed">Closed</option>
                          </select>
                          <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 pointer-events-none opacity-60" />
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`text-xs capitalize ${PRIORITY_COLORS[row.priority] ?? ''}`}>
                          {row.priority?.charAt(0).toUpperCase() + row.priority?.slice(1)}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-xs text-muted-foreground">
                        {new Date(row.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-2">
                          <button onClick={() => updateStatus(row.id, 'resolved')} className="p-1.5 rounded hover:bg-emerald-50 text-muted-foreground hover:text-emerald-600 transition-colors">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => deleteRow(row.id)} className="p-1.5 rounded hover:bg-destructive/20 text-muted-foreground hover:text-destructive transition-colors">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
