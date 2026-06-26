'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

type SectorData = {
  name: string;
  value: number;
};

type PromoData = {
  name: string;
  value: number;
};

const SECTOR_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];
const PROMO_COLORS = ['#10b981', '#ef4444'];

export default function AdminBusinessAnalyticsPage() {
  const [sectorData, setSectorData] = useState<SectorData[]>([]);
  const [promoData, setPromoData] = useState<PromoData[]>([]);
  const [totalSeeds, setTotalSeeds] = useState(0);
  const [totalPromoCodes, setTotalPromoCodes] = useState(0);
  const [codesRedeemed, setCodesRedeemed] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAnalytics() {
      // Load seeds by sector
      const { data: seeds } = await supabase.from('seeds').select('sector_label');
      if (seeds) {
        const sectorMap = new Map<string, number>();

        seeds.forEach((seed: { sector_label: string }) => {
          sectorMap.set(seed.sector_label, (sectorMap.get(seed.sector_label) ?? 0) + 1);
        });

        const result = Array.from(sectorMap.entries())
          .map(([name, value]) => ({ name, value }))
          .sort((a, b) => b.value - a.value);

        setSectorData(result);
        setTotalSeeds(seeds.length);
      }

      // Load promo codes
      const { data: promoCodes } = await supabase.from('promo_codes').select('is_used');
      if (promoCodes) {
        const used = promoCodes.filter((p: { is_used: boolean }) => p.is_used).length;
        setTotalPromoCodes(promoCodes.length);
        setCodesRedeemed(used);
        setPromoData([
          { name: 'Active', value: promoCodes.length - used },
          { name: 'Redeemed', value: used },
        ]);
      }

      setLoading(false);
    }

    loadAnalytics();
  }, []);

  const stats = [
    { label: 'Total Seeds', value: totalSeeds.toLocaleString() },
    { label: 'Promo Codes', value: totalPromoCodes.toLocaleString() },
    { label: 'Codes Redeemed', value: codesRedeemed.toLocaleString() },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-7 h-7 border-2 border-t-transparent rounded-full animate-spin border-[var(--green-brand)]" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-full mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-bold text-foreground">Business Analytics</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Seeds and promo code performance</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-card rounded-xl border border-border shadow-sm p-6"
          >
            <p className="text-sm text-muted-foreground mb-1">{stat.label}</p>
            <p className="text-2xl font-bold text-foreground">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="bg-card rounded-xl border border-border shadow-sm p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Seeds by Sector</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={sectorData}
              layout="vertical"
              margin={{ left: 120 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis type="number" stroke="hsl(var(--muted-foreground))" style={{ fontSize: '12px' }} />
              <YAxis dataKey="name" type="category" width={120} stroke="hsl(var(--muted-foreground))" style={{ fontSize: '11px' }} />
              <Tooltip
                contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
              />
              <Bar dataKey="value" fill="var(--green-brand)" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card rounded-xl border border-border shadow-sm p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Promo Code Status</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={promoData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {promoData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={PROMO_COLORS[index % PROMO_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
