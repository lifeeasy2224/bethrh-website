'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

type SectorData = {
  label: string;
  emoji: string;
  count: number;
};

export default function AdminSectorsPage() {
  const [sectors, setSectors] = useState<SectorData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('seeds')
      .select('sector_label,sector_emoji')
      .then(({ data }) => {
        if (data) {
          const sectorMap = new Map<string, { emoji: string; count: number }>();

          data.forEach((seed: { sector_label: string; sector_emoji: string }) => {
            if (!sectorMap.has(seed.sector_label)) {
              sectorMap.set(seed.sector_label, { emoji: seed.sector_emoji, count: 0 });
            }
            const sector = sectorMap.get(seed.sector_label);
            if (sector) {
              sector.count += 1;
            }
          });

          const result = Array.from(sectorMap.entries()).map(([label, data]) => ({
            label,
            emoji: data.emoji,
            count: data.count,
          }));

          setSectors(result.sort((a, b) => b.count - a.count));
        }
        setLoading(false);
      });
  }, []);

  const totalSeeds = sectors.reduce((sum, s) => sum + s.count, 0);

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Sector Distribution</h1>
        <p className="text-slate-500 text-sm mt-0.5">{sectors.length} sectors</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-7 h-7 border-2 border-t-transparent rounded-full animate-spin border-[var(--green-brand)]" />
          </div>
        ) : sectors.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-slate-500 text-sm">No sectors yet.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50">
                <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Sector
                </th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Count
                </th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Distribution
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sectors.map((sector: SectorData) => {
                const percentage = totalSeeds > 0 ? (sector.count / totalSeeds) * 100 : 0;
                return (
                  <tr key={sector.label} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{sector.emoji}</span>
                        <span className="font-medium text-slate-800">{sector.label}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-right text-sm font-semibold text-slate-900">
                      {sector.count}
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-emerald-500 h-full transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="text-xs text-slate-500 w-8 text-right">
                          {percentage.toFixed(0)}%
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
        <p className="text-sm text-slate-600">
          Total seeds: <span className="font-semibold text-slate-900">{totalSeeds}</span>
        </p>
      </div>
    </div>
  );
}
