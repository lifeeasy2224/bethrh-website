'use client';

import { useEffect, useState } from 'react';
import { supabase, Pod, PodMember } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { Users, Flame, Plus, Trophy, CircleUser as UserCircle } from 'lucide-react';

type PodWithMembers = Pod & {
  pod_members: (PodMember & { users?: { name: string | null; country: string } })[];
};

export default function PodsPage() {
  const { supaUser } = useAuth();
  const [pods, setPods] = useState<PodWithMembers[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [podName, setPodName] = useState('');
  const [creating, setCreating] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState('');

  async function load() {
    if (!supaUser) return;

    const { data: memberData } = await supabase
      .from('pod_members')
      .select('pod_id')
      .eq('user_id', supaUser.id);

    if (!memberData || memberData.length === 0) {
      setPods([]);
      setLoading(false);
      return;
    }

    const podIds = memberData.map(m => m.pod_id);
    const { data: podData } = await supabase
      .from('pods')
      .select('*, pod_members(*, users(name, country))')
      .in('id', podIds);

    setPods((podData as PodWithMembers[]) ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, [supaUser]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!supaUser || !podName.trim()) return;
    setCreating(true);
    setError('');

    const { data: newPod, error: podErr } = await supabase
      .from('pods')
      .insert({ name: podName.trim() })
      .select()
      .maybeSingle();

    if (podErr || !newPod) {
      setError('فشل إنشاء المجموعة.');
      setCreating(false);
      return;
    }

    await supabase.from('pod_members').insert({ pod_id: newPod.id, user_id: supaUser.id, streak: 0 });
    setPodName('');
    setShowCreate(false);
    setCreating(false);
    load();
  }

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    if (!supaUser || !joinCode.trim()) return;
    setJoining(true);
    setError('');

    const { data: pod } = await supabase.from('pods').select('id').eq('id', joinCode.trim()).maybeSingle();

    if (!pod) {
      setError('المجموعة غير موجودة. تحقق من المعرّف وحاول مجدداً.');
      setJoining(false);
      return;
    }

    const { error: joinErr } = await supabase
      .from('pod_members')
      .insert({ pod_id: pod.id, user_id: supaUser.id, streak: 0 });

    if (joinErr) {
      setError('قد تكون عضواً في هذه المجموعة بالفعل.');
      setJoining(false);
      return;
    }

    setJoinCode('');
    setJoining(false);
    load();
  }

  async function incrementStreak(podId: string) {
    if (!supaUser) return;
    const { data: current } = await supabase
      .from('pod_members')
      .select('streak')
      .eq('pod_id', podId)
      .eq('user_id', supaUser.id)
      .maybeSingle();

    await supabase
      .from('pod_members')
      .update({ streak: (current?.streak ?? 0) + 1 })
      .eq('pod_id', podId)
      .eq('user_id', supaUser.id);

    load();
  }

  const inputCls = 'flex-1 px-3.5 py-2.5 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring';

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6" dir="rtl">
      <div className="flex items-center justify-between flex-row-reverse">
        <div className="text-right">
          <h1 className="text-2xl font-bold">مجموعات المساءلة</h1>
          <p className="text-muted-foreground text-sm mt-1">ابنِ مع أقرانك، ابقَ ملتزماً، انمُ معاً</p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition flex-row-reverse"
        >
          <Plus className="w-4 h-4" />
          إنشاء مجموعة
        </button>
      </div>

      {error && (
        <div className="px-4 py-3 rounded-xl bg-destructive/10 text-destructive text-sm flex items-center justify-between flex-row-reverse">
          <span>{error}</span>
          <button onClick={() => setError('')} className="underline text-xs shrink-0">إغلاق</button>
        </div>
      )}

      {/* Create form */}
      {showCreate && (
        <div className="bg-card rounded-xl border border-border p-5">
          <h3 className="font-semibold mb-4 text-right">إنشاء مجموعة جديدة</h3>
          <form onSubmit={handleCreate} className="flex gap-3 flex-row-reverse">
            <input value={podName} onChange={e => setPodName(e.target.value)} required placeholder="مثال: رواد أعمال حلب الزراعيون" className={inputCls} dir="rtl" />
            <button type="submit" disabled={creating} className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/90 transition disabled:opacity-60">
              {creating ? <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" /> : 'إنشاء'}
            </button>
            <button type="button" onClick={() => setShowCreate(false)} className="px-3 py-2 rounded-lg border border-border text-sm hover:bg-secondary transition">إلغاء</button>
          </form>
        </div>
      )}

      {/* Join form */}
      <div className="bg-card rounded-xl border border-border p-5">
        <h3 className="font-semibold mb-1 text-right">الانضمام لمجموعة موجودة</h3>
        <p className="text-xs text-muted-foreground mb-4 text-right">الصق معرّف المجموعة المشترك من زميل</p>
        <form onSubmit={handleJoin} className="flex gap-3 flex-row-reverse">
          <input value={joinCode} onChange={e => setJoinCode(e.target.value)} placeholder="معرّف المجموعة (UUID)" className={`${inputCls} font-mono`} />
          <button type="submit" disabled={joining || !joinCode.trim()} className="bg-secondary text-secondary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:bg-secondary/80 border border-border transition disabled:opacity-60">
            {joining ? <div className="w-4 h-4 border-2 border-foreground border-t-transparent rounded-full animate-spin" /> : 'انضم'}
          </button>
        </form>
      </div>

      {/* Pods list */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2].map(i => <div key={i} className="h-40 rounded-xl bg-muted animate-pulse" />)}
        </div>
      ) : pods.length === 0 ? (
        <div className="bg-card rounded-xl border border-dashed border-border p-12 text-center">
          <Users className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="font-medium mb-1">لا توجد مجموعات بعد</p>
          <p className="text-muted-foreground text-sm">أنشئ مجموعة أو انضم لواحدة للبدء في بناء المساءلة مع الأقران.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {pods.map(pod => {
            const myMembership = pod.pod_members.find(m => m.user_id === supaUser?.id);
            const members = pod.pod_members;
            const topStreak = Math.max(...members.map(m => m.streak));

            return (
              <div key={pod.id} className="bg-card rounded-xl border border-border p-5">
                <div className="flex items-start justify-between gap-4 mb-4 flex-row-reverse">
                  <div className="text-right">
                    <h3 className="font-semibold">{pod.name}</h3>
                    <p className="text-xs text-muted-foreground font-mono mt-0.5 select-all">{pod.id}</p>
                  </div>
                  <div className="flex items-center gap-1.5 text-sm text-muted-foreground flex-row-reverse">
                    <Users className="w-4 h-4" />
                    {members.length} عضو
                  </div>
                </div>

                <div className="space-y-2 mb-4">
                  {members.map(member => {
                    const isMe = member.user_id === supaUser?.id;
                    const isTop = member.streak === topStreak && topStreak > 0;
                    return (
                      <div key={member.user_id} className={`flex items-center gap-3 px-3 py-2.5 rounded-lg ${isMe ? 'bg-primary/5 border border-primary/20' : 'bg-secondary/50'} flex-row-reverse`}>
                        <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                          <UserCircle className="w-4 h-4 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0 text-right">
                          <div className="text-sm font-medium truncate">
                            {member.users?.name ?? 'مجهول'}
                            {isMe && <span className="text-xs text-primary mr-1">(أنت)</span>}
                          </div>
                          <div className="text-xs text-muted-foreground">{member.users?.country ?? 'سوريا'}</div>
                        </div>
                        <div className="flex items-center gap-1 flex-row-reverse">
                          {isTop && <Trophy className="w-3.5 h-3.5 text-[var(--gold)]" />}
                          <Flame className={`w-4 h-4 ${member.streak > 0 ? 'text-[var(--gold)]' : 'text-muted-foreground/40'}`} />
                          <span className={`text-sm font-semibold ${member.streak > 0 ? 'text-[var(--gold)]' : 'text-muted-foreground'}`}>
                            {member.streak}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center gap-3 pt-3 border-t border-border flex-row-reverse">
                  <div className="flex-1 text-right">
                    <div className="text-xs text-muted-foreground">سلسلتي</div>
                    <div className="flex items-center gap-1 mt-0.5 flex-row-reverse justify-end">
                      <Flame className={`w-4 h-4 ${(myMembership?.streak ?? 0) > 0 ? 'text-[var(--gold)]' : 'text-muted-foreground/40'}`} />
                      <span className="font-bold text-lg">{myMembership?.streak ?? 0}</span>
                      <span className="text-xs text-muted-foreground">أيام</span>
                    </div>
                  </div>
                  <button
                    onClick={() => incrementStreak(pod.id)}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[rgba(212,166,83,0.15)] text-[#8B6B47] border border-[rgba(212,166,83,0.3)] text-sm font-medium hover:bg-[rgba(212,166,83,0.25)] transition flex-row-reverse"
                  >
                    <Flame className="w-3.5 h-3.5" />
                    تسجيل حضور اليوم
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
