import React, { createContext, useContext, useState, useCallback } from 'react';

export type ReviewTrigger = 'stage_complete' | 'high_score' | 'investor_connect';

interface PendingReview {
  triggerType: ReviewTrigger;
  stageName?: string;
  ideaId?: string;
}

interface ReviewContextType {
  triggerReview: (triggerType: ReviewTrigger, stageName?: string, ideaId?: string) => void;
  pending: PendingReview | null;
  clearPending: () => void;
}

const ReviewContext = createContext<ReviewContextType | null>(null);

function reviewKey(userId: string, ideaId: string | undefined, triggerType: ReviewTrigger, stageName?: string) {
  return `bethra_review_${userId}_${ideaId ?? 'none'}_${triggerType}_${stageName ?? ''}`;
}

export function ReviewProvider({ userId, children }: { userId: string | null; children: React.ReactNode }) {
  const [pending, setPending] = useState<PendingReview | null>(null);

  const triggerReview = useCallback((triggerType: ReviewTrigger, stageName?: string, ideaId?: string) => {
    if (!userId) return;
    const key = reviewKey(userId, ideaId, triggerType, stageName);
    if (localStorage.getItem(key)) return;
    localStorage.setItem(key, '1');
    setPending({ triggerType, stageName, ideaId });
  }, [userId]);

  const clearPending = useCallback(() => setPending(null), []);

  return (
    <ReviewContext.Provider value={{ triggerReview, pending, clearPending }}>
      {children}
    </ReviewContext.Provider>
  );
}

export function useReview() {
  const ctx = useContext(ReviewContext);
  if (!ctx) throw new Error('useReview must be used within ReviewProvider');
  return ctx;
}
