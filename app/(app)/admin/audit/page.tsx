'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Search } from 'lucide-react';

type AuditLog = {
  id: string;
  action: string;
  user_id: string | null;
  resource_type: string;
  created_at: string;
};

export default function AdminAuditPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [filteredLogs, setFilteredLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    supabase
      .from('audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100)
      .then(({ data, error }) => {
        if (error) {
          console.error('Error loading audit logs:', error);
        }
        setLogs(data ?? []);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    let result = logs;

    if (search) {
      const lowerSearch = search.toLowerCase();
      result = result.filter((log: AuditLog) =>
        log.action.toLowerCase().includes(lowerSearch) ||
        log.resource_type.toLowerCase().includes(lowerSearch) ||
        (log.user_id && log.user_id.toLowerCase().includes(lowerSearch))
      );
    }

    setFilteredLogs(result);
  }, [search, logs]);

  const truncateId = (id: string | null) => {
    if (!id) return '-';
    return id.substring(0, 8) + '...';
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Audit Log</h1>
        <p className="text-slate-500 text-sm mt-0.5">Last 100 events</p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Search by action, resource, or user..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-7 h-7 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-slate-500 text-sm">No audit data available.</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-slate-500 text-sm">No matching audit logs.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Action
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Resource
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  User
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Date & Time
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.map((log: AuditLog) => (
                <tr key={log.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-5 py-3.5">
                    <span className="font-medium text-slate-800 capitalize">
                      {log.action.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="text-xs capitalize px-2.5 py-1 bg-slate-100 text-slate-700 rounded-full">
                      {log.resource_type}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-xs text-slate-400 font-mono">
                    {truncateId(log.user_id)}
                  </td>
                  <td className="px-4 py-3.5 text-xs text-slate-400">
                    {new Date(log.created_at).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
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
