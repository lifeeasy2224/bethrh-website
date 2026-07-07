import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { supabase, type UserIdea } from '../supabase';
import { useAuth } from './AuthContext';

const STORAGE_KEY = 'bethra_selected_idea_id';

interface IdeaContextType {
  ideas: UserIdea[];
  selectedIdea: UserIdea | null;
  selectedIdeaId: string | null;
  setSelectedIdeaId: (id: string | null) => void;
  loading: boolean;
  refreshIdeas: () => Promise<void>;
}

const IdeaContext = createContext<IdeaContextType | null>(null);

export function IdeaProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [ideas, setIdeas] = useState<UserIdea[]>([]);
  const [selectedIdeaId, setSelectedIdeaIdState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchIdeas = useCallback(async () => {
    if (!user) { setIdeas([]); setLoading(false); return; }
    setLoading(true);
    const { data } = await supabase
      .from('user_ideas')
      .select('*')
      .eq('user_id', user.id)
      .eq('in_marketplace', false)
      .order('created_at', { ascending: false });
    const list = (data ?? []) as UserIdea[];
    setIdeas(list);

    // Auto-select: restore from localStorage, or default to first idea
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && list.find(i => i.id === stored)) {
      setSelectedIdeaIdState(stored);
    } else if (list.length > 0) {
      setSelectedIdeaIdState(list[0].id);
      localStorage.setItem(STORAGE_KEY, list[0].id);
    } else {
      setSelectedIdeaIdState(null);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchIdeas(); }, [fetchIdeas]);

  function setSelectedIdeaId(id: string | null) {
    setSelectedIdeaIdState(id);
    if (id) localStorage.setItem(STORAGE_KEY, id);
    else localStorage.removeItem(STORAGE_KEY);
  }

  const selectedIdea = ideas.find(i => i.id === selectedIdeaId) ?? null;

  return (
    <IdeaContext.Provider value={{ ideas, selectedIdea, selectedIdeaId, setSelectedIdeaId, loading, refreshIdeas: fetchIdeas }}>
      {children}
    </IdeaContext.Provider>
  );
}

export function useIdea() {
  const ctx = useContext(IdeaContext);
  if (!ctx) throw new Error('useIdea must be used within IdeaProvider');
  return ctx;
}
