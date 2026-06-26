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

type WeeklySignup = {
  week: string;
  count: number;
};

type RoleData = {
  name: string;
  value: number;
};

const COLORS = ['#10b981', '#3b82f6', '#f59e0b'];

export default function AdminUsersAnalyticsPage() {
  const [weeklyData, setWeeklyData] = useState<WeeklySignup[]>([]);
  const [roleData, setRoleData] = useState<RoleData[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [founderCount, setFounderCount] = useState(0);
  const [investorCount, setInvestorCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAnalytics() {
      const { data: users } = await supabase.from('users').select('role,created_at');

      if (users) {
        // Calculate weekly signups
        const now = new Date();
        const weeklyMap = new Map<string, number>();

        for (let i = 7; i >= 0; i--) {
          const date = new Date(now);
          date.setDate(date.getDate() - i * 7);
          const weekStr = `Week ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
          weeklyMap.set(weekStr, 0);
        }

        users.forEach((user: { role: string; created_at: string }) => {
          const userDate = new Date(user.created_at);
          const weekAgo = Math.floor((now.getTime() - userDate.getTime()) / (7 * 24 * 60 * 60 * 1000));
          const weekIndex = Math.min(Math.floor(weekAgo), 7);
          const date = new Date(now);
          date.setDate(date.getDate() - weekIndex * 7);
          const weekStr = `Week ${date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;

          if (weeklyMap.has(weekStr)) {
            weeklyMap.set(weekStr, (weeklyMap.get(weekStr) ?? 0) + 1);
          }
        });

        setWeeklyData(
          Array.from(weeklyMap.entries()).map(([week, count]) => ({ week, count }))
        );

        // Role distribution
        const roleCounts = { founders: 0, investors: 0, admins: 0 };

        users.forEach((user: { role: string }) => {
          if (user.role === 'founder') roleCounts.founders += 1;
          else if (user.role === 'investor') roleCounts.investors += 1;
          else if (user.role === 'admin') roleCounts.admins += 1;
        });

        setFounderCount(roleCounts.founders);
        setInvestorCount(roleCounts.investors);
        setTotalUsers(users.length);
        setRoleData([
          { name: 'Founders', value: roleCounts.founders },
          { name: 'Investors', value: roleCounts.investors },
          { name: 'Admins', value: roleCounts.admins },
        ]);
      }

      setLoading(false);
    }

    loadAnalytics();
  }, []);

  const stats = [
    { label: 'Total Users', value: totalUsers.toLocaleString() },
    { label: 'Founders', value: founderCount.toLocaleString() },
    { label: 'Investors', value: investorCount.toLocaleString() },
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
        <h1 className="text-xl font-bold text-foreground">User Analytics</h1>
        <p className="text-muted-foreground text-sm mt-0.5">User signups and role distribution</p>
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
          <h2 className="text-lg font-semibold text-foreground mb-4">Weekly Signups</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="week" stroke="hsl(var(--muted-foreground))" style={{ fontSize: '11px' }} />
              <YAxis stroke="hsl(var(--muted-foreground))" style={{ fontSize: '12px' }} />
              <Tooltip
                contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))' }}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
              />
              <Bar dataKey="count" fill="var(--green-brand)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-card rounded-xl border border-border shadow-sm p-6">
          <h2 className="text-lg font-semibold text-foreground mb-4">Role Distribution</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={roleData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name}: ${value}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {roleData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
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
