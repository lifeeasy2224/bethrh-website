'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

type SignupData = {
  date: string;
  count: number;
};

type TopSeed = {
  name: string;
  views: number;
  grabs: number;
};

type StatCard = {
  label: string;
  value: string | number;
  unit?: string;
};

export default function AdminAnalyticsPage() {
  const [signupData, setSignupData] = useState<SignupData[]>([]);
  const [topSeeds, setTopSeeds] = useState<TopSeed[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAnalytics() {
      // Load signups for last 14 days
      const { data: users } = await supabase.from('users').select('created_at');
      if (users) {
        const now = new Date();
        const data14days = new Map<string, number>();

        for (let i = 13; i >= 0; i--) {
          const date = new Date(now);
          date.setDate(date.getDate() - i);
          const dateStr = date.toISOString().split('T')[0];
          data14days.set(dateStr, 0);
        }

        users.forEach((user: { created_at: string }) => {
          const date = user.created_at.split('T')[0];
          if (data14days.has(date)) {
            data14days.set(date, (data14days.get(date) ?? 0) + 1);
          }
        });

        const chartData = Array.from(data14days.entries()).map(([date, count]) => ({
          date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          count,
        }));

        setSignupData(chartData);
      }

      // Load top seeds
      const { data: seeds } = await supabase
        .from('seeds')
        .select('name,views,grabs')
        .order('views', { ascending: false })
        .limit(8);
      setTopSeeds(
        seeds?.map((s: TopSeed) => ({ ...s, views: s.views || 0, grabs: s.grabs || 0 })) ?? []
      );

      // Load total users
      const { count } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });
      setTotalUsers(count ?? 0);

      setLoading(false);
    }

    loadAnalytics();
  }, []);

  const totalViews = topSeeds.reduce((sum, s) => sum + s.views, 0);
  const totalGrabs = topSeeds.reduce((sum, s) => sum + s.grabs, 0);

  const stats: StatCard[] = [
    { label: 'Total Views', value: totalViews.toLocaleString() },
    { label: 'Total Grabs', value: totalGrabs.toLocaleString() },
    { label: 'Registered Users', value: totalUsers.toLocaleString() },
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
        <h1 className="text-xl font-bold text-foreground">Analytics</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Platform traffic and engagement</p>
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
          <h2 className="text-lg font-semibold text-foreground mb-4">Signups (14 days)</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={signupData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" style={{ fontSize: '12px' }} />
              <YAxis stroke="hsl(var(--muted-foreground))" style={{ fontSize: '12px' }} />
              <Tooltip
                contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
              />
              <Line
                type="monotone"
                dataKey="count"
                stroke="var(--green-brand)"
                dot={{ fill: 'var(--green-brand)', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card rounded-xl border border-border shadow-sm p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Top Seeds by Views</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topSeeds.slice(0, 6)}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" style={{ fontSize: '11px' }} />
              <YAxis stroke="hsl(var(--muted-foreground))" style={{ fontSize: '12px' }} />
              <Tooltip
                contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
              />
              <Bar dataKey="views" fill="var(--green-brand)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
