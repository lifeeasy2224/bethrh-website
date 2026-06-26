'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase, Idea, ValidationLog } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { ChartBar as BarChart2, Plus, UserCheck, Target, DollarSign } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import IdeaDropdown, { usePersistedIdeaId } from '@/components/IdeaDropdown';

type LogWithIdea = ValidationLog & { ideas?: { title: string } };

export default function ValidationPage() {
  const { supaUser } = useAuth();
  const searchParams = useSearchParams();
  const urlIdea = searchParams.get('idea');

  const [selectedIdeaId, persistIdeaId] = usePersistedIdeaId(urlIdea ?? '');

  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [logs, setLogs] = useState<LogWithIdea[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    interviews: 0,
    signups: 0,
    preorders_usd: 0,
    notes: '',
  });
  const [saving, setSaving] = useState(false);

  // Sync URL param into persisted selection on mount
  useEffect(() => {
    if (urlIdea) persistIdeaId(urlIdea);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function load() {
    if (!supaUser) return;
    const { data: ideaData } = await supabase
      .from('ideas')
      .select('*')
      .or(`user_id.is.null,user_id.eq.${supaUser.id}`)
      .order('created_at', { ascending: false });

    setIdeas(ideaData ?? []);

    if (ideaData && ideaData.length > 0) {
      const ids = ideaData.map(i => i.id);
      const { data: logData } = await supabase
        .from('validation_logs')
        .select('*, ideas(title)')
        .in('idea_id', ids)
        .order('created_at', { ascending: false });
      setLogs(logData ?? []);
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, [supaUser]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedIdeaId) return;
    setSaving(true);
    await supabase.from('validation_logs').insert({
      idea_id: selectedIdeaId,
      interviews: form.interviews,
      signups: form.signups,
      preorders_usd: form.preorders_usd,
      notes: form.notes || null,
    });
    setForm({ interviews: 0, signups: 0, preorders_usd: 0, notes: '' });
    setShowForm(false);
    setSaving(false);
    load();
  }

  // Filter logs to selected idea when one is picked
  const displayLogs = selectedIdeaId ? logs.filter(l => l.idea_id === selectedIdeaId) : logs;

  const totalInterviews = displayLogs.reduce((s, l) => s + l.interviews, 0);
  const totalSignups = displayLogs.reduce((s, l) => s + l.signups, 0);
  const totalRevenue = displayLogs.reduce((s, l) => s + l.preorders_usd, 0);

  const chartData = displayLogs.slice(0, 7).reverse().map((l, i) => ({
    name: `#${displayLogs.length - i}`,
    'المقابلات': l.interviews,
    'التسجيلات': l.signups,
  }));

  const inputCls = 'w-full px-3.5 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring';

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6" dir="rtl">
      <div className="flex items-center justify-between flex-row-reverse">
        <div className="text-right">
          <h1 className="text-2xl font-bold">متتبع التحقق</h1>
          <p className="text-muted-foreground text-sm mt-1">تتبع مقابلات العملاء والتسجيلات والطلبات المسبقة</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          disabled={!selectedIdeaId}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium flex-row-reverse transition ${
            selectedIdeaId
              ? 'bg-primary text-primary-foreground hover:bg-primary/90'
              : 'bg-muted text-muted-foreground cursor-not-allowed'
          }`}
        >
          <Plus className="w-4 h-4" />
          تسجيل إدخال
        </button>
      </div>

      {/* Shared idea dropdown */}
      <IdeaDropdown
        selectedId={selectedIdeaId}
        onSelect={persistIdeaId}
        label="الفكرة:"
      />

      {/* Disabled hint */}
      {!selectedIdeaId && (
        <div className="bg-secondary/30 rounded-xl border border-dashed border-border p-8 text-center">
          <BarChart2 className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">اختر فكرة من القائمة أعلاه لعرض بيانات التحقق</p>
        </div>
      )}

      {selectedIdeaId && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'إجمالي المقابلات', value: totalInterviews, icon: UserCheck, color: 'text-[var(--green-brand)]', bg: 'bg-[rgba(27,107,62,0.08)]' },
              { label: 'إجمالي التسجيلات', value: totalSignups, icon: Target, color: 'text-primary', bg: 'bg-primary/10' },
              { label: 'إيرادات الطلبات المسبقة', value: `$${totalRevenue}`, icon: DollarSign, color: 'text-[var(--green-brand)]', bg: 'bg-[rgba(27,107,62,0.08)]' },
            ].map(({ label, value, icon: Icon, color, bg }) => (
              <div key={label} className="bg-card rounded-xl border border-border p-4">
                <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center mb-3`}>
                  <Icon className={color} style={{ width: 18, height: 18 }} />
                </div>
                <div className="text-2xl font-bold">{value}</div>
                <div className="text-sm text-muted-foreground mt-0.5 text-right">{label}</div>
              </div>
            ))}
          </div>

          {/* Chart */}
          {chartData.length > 0 && (
            <div className="bg-card rounded-xl border border-border p-5">
              <h2 className="text-sm font-semibold mb-4 text-right">نشاط التحقق الأخير</h2>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={chartData} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} reversed />
                  <YAxis tick={{ fontSize: 12 }} orientation="right" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: 12,
                    }}
                  />
                  <Bar dataKey="المقابلات" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="التسجيلات" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Log form */}
          {showForm && (
            <div className="bg-card rounded-xl border border-border p-5">
              <h3 className="font-semibold mb-4 text-right">إدخال تحقق جديد</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { key: 'interviews' as const, label: 'المقابلات' },
                    { key: 'signups' as const, label: 'التسجيلات' },
                    { key: 'preorders_usd' as const, label: 'الطلبات المسبقة ($)' },
                  ].map(({ key, label }) => (
                    <div key={key}>
                      <label className="block text-sm font-medium mb-1.5 text-right">{label}</label>
                      <input
                        type="number" min={0}
                        value={form[key]}
                        onChange={e => setForm(f => ({ ...f, [key]: parseInt(e.target.value) || 0 }))}
                        className={inputCls}
                      />
                    </div>
                  ))}
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5 text-right">ملاحظات</label>
                  <textarea
                    value={form.notes}
                    onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                    rows={3}
                    placeholder="أبرز ما توصلت إليه اليوم..."
                    className={`${inputCls} resize-none`}
                    dir="rtl"
                  />
                </div>
                <div className="flex gap-3 flex-row-reverse">
                  <button type="submit" disabled={saving} className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition disabled:opacity-60">
                    {saving ? <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" /> : 'حفظ الإدخال'}
                  </button>
                  <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg text-sm font-medium border border-border hover:bg-secondary transition">إلغاء</button>
                </div>
              </form>
            </div>
          )}

          {/* Log history */}
          <div>
            <h2 className="text-base font-semibold mb-3 text-right">سجل التحقق</h2>
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => <div key={i} className="h-20 rounded-xl bg-muted animate-pulse" />)}
              </div>
            ) : displayLogs.length === 0 ? (
              <div className="bg-card rounded-xl border border-dashed border-border p-10 text-center">
                <BarChart2 className="w-9 h-9 text-muted-foreground mx-auto mb-2" />
                <p className="text-muted-foreground text-sm">لا توجد سجلات تحقق لهذه الفكرة بعد. ابدأ بتسجيل مقابلاتك!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {displayLogs.map(log => (
                  <div key={log.id} className="bg-card rounded-xl border border-border p-4">
                    <div className="flex items-center justify-between gap-4 mb-2 flex-row-reverse">
                      <div className="flex items-center gap-2 flex-row-reverse">
                        <span className="text-xs text-muted-foreground">
                          {new Date(log.created_at).toLocaleDateString('ar-SA', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-6 text-sm flex-wrap flex-row-reverse">
                      <div className="flex items-center gap-1.5">
                        <UserCheck className="w-3.5 h-3.5" style={{ color: 'var(--green-brand)' }} />
                        <span className="font-medium">{log.interviews}</span>
                        <span className="text-muted-foreground text-xs">مقابلات</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Target className="w-3.5 h-3.5 text-primary" />
                        <span className="font-medium">{log.signups}</span>
                        <span className="text-muted-foreground text-xs">تسجيلات</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <DollarSign className="w-3.5 h-3.5" style={{ color: 'var(--green-brand)' }} />
                        <span className="font-medium">${log.preorders_usd}</span>
                        <span className="text-muted-foreground text-xs">طلبات مسبقة</span>
                      </div>
                    </div>
                    {log.notes && (
                      <p className="text-xs text-muted-foreground mt-2 leading-relaxed line-clamp-3 border-t border-border pt-2 text-right">
                        {log.notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
