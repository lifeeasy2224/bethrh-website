'use client';

import { useEffect, useState } from 'react';
import { supabase, Idea } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { Lightbulb } from 'lucide-react';
import Link from 'next/link';

const STORAGE_KEY = 'bethrh_selected_idea';

interface Props {
  selectedId: string;
  onSelect: (id: string) => void;
  /** If set, only show ideas with this stage value */
  filterStage?: string;
  label?: string;
  /** Show a hint when no idea is selected */
  showEmptyHint?: boolean;
}

export function usePersistedIdeaId(initial = '') {
  const [id, setId] = useState(initial);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const stored = localStorage.getItem(STORAGE_KEY) ?? '';
    if (stored) setId(stored);
  }, []);

  function persist(newId: string) {
    setId(newId);
    if (typeof window !== 'undefined') {
      if (newId) localStorage.setItem(STORAGE_KEY, newId);
      else localStorage.removeItem(STORAGE_KEY);
    }
  }

  return [id, persist] as const;
}

export default function IdeaDropdown({ selectedId, onSelect, filterStage, label, showEmptyHint = true }: Props) {
  const { supaUser } = useAuth();
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!supaUser) return;
    let query = supabase
      .from('ideas')
      .select('id, title, stage, sector')
      .eq('user_id', supaUser.id)
      .order('created_at', { ascending: false });

    if (filterStage) {
      query = query.eq('stage', filterStage);
    } else {
      query = query.neq('stage', 'committed');
    }

    query.then(({ data }) => {
      const list = data ?? [];
      setIdeas(list as Idea[]);
      // If current selectedId not in list, auto-select first
      if (list.length > 0 && !list.find(i => i.id === selectedId)) {
        const stored = typeof window !== 'undefined' ? localStorage.getItem(STORAGE_KEY) : null;
        const match = stored ? list.find(i => i.id === stored) : null;
        onSelect(match ? match.id : list[0].id);
      }
      setLoaded(true);
    });
  }, [supaUser, filterStage]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!loaded) {
    return <div className="h-12 rounded-xl bg-muted animate-pulse" />;
  }

  if (ideas.length === 0) {
    return (
      <div className="bg-card rounded-xl border border-dashed border-border p-5 text-center">
        <Lightbulb className="w-7 h-7 text-muted-foreground mx-auto mb-2" />
        <p className="text-sm text-muted-foreground mb-3">
          {filterStage === 'committed' ? 'لا توجد أفكار ملتزم بها بعد' : 'لا توجد أفكار بعد'}
        </p>
        <Link href="/ideas" className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition">
          {filterStage === 'committed' ? 'اذهب إلى رحلتي' : 'أضف أول فكرة'}
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl border border-border p-4">
      <div className="flex items-center gap-3 flex-row-reverse flex-wrap">
        <label className="text-sm font-medium shrink-0">{label ?? 'الفكرة:'}</label>
        <select
          value={selectedId}
          onChange={e => {
            onSelect(e.target.value);
            if (typeof window !== 'undefined') localStorage.setItem(STORAGE_KEY, e.target.value);
          }}
          className="flex-1 min-w-[200px] px-3 py-2 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
        >
          {!selectedId && <option value="">اختر فكرة...</option>}
          {ideas.map(i => (
            <option key={i.id} value={i.id}>{i.title ?? 'فكرة بلا عنوان'}</option>
          ))}
        </select>
        {selectedId && ideas.find(i => i.id === selectedId)?.sector && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground shrink-0">
            {ideas.find(i => i.id === selectedId)?.sector}
          </span>
        )}
      </div>
      {showEmptyHint && !selectedId && (
        <p className="text-xs text-muted-foreground mt-2 text-right">اختر فكرة لعرض المحتوى</p>
      )}
    </div>
  );
}
