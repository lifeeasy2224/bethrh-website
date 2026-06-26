'use client';

import { useState, useRef, useCallback } from 'react';
import { Star, X, Camera, Upload, CircleCheck as CheckCircle, Loader as Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export type ReviewTrigger =
  | 'stage_complete'
  | 'high_score'
  | 'greenhouse_contact_founder'
  | 'greenhouse_contact_investor';

interface Props {
  open: boolean;
  trigger: ReviewTrigger;
  triggerContext?: string;
  userRole?: 'founder' | 'investor';
  onClose: () => void;
}

const TRIGGER_COPY: Record<ReviewTrigger, { title: string; subtitle: string; emoji: string }> = {
  stage_complete: {
    emoji: '🎉',
    title: 'أكملت مرحلة!',
    subtitle: 'كيف كانت تجربتك في هذه المرحلة؟',
  },
  high_score: {
    emoji: '🏆',
    title: 'تقييم ممتاز!',
    subtitle: 'حصلت على تقييم عالٍ — شاركنا رأيك في المنصة',
  },
  greenhouse_contact_founder: {
    emoji: '🤝',
    title: 'تواصل مستثمر معك!',
    subtitle: 'كيف كانت تجربتك مع المشتل حتى الآن؟',
  },
  greenhouse_contact_investor: {
    emoji: '🌱',
    title: 'طلب التواصل أُرسل!',
    subtitle: 'كيف تقيّم منصتنا لربط المستثمرين بالمؤسسين؟',
  },
};

const STAR_LABELS = ['', 'ضعيف', 'مقبول', 'جيد', 'ممتاز', 'رائع!'];

function localKey(trigger: ReviewTrigger, ctx: string) {
  return `review_shown_${trigger}_${ctx}`;
}

export function markReviewShown(trigger: ReviewTrigger, ctx = '') {
  try { localStorage.setItem(localKey(trigger, ctx), '1'); } catch {}
}

export function wasReviewShown(trigger: ReviewTrigger, ctx = '') {
  try { return !!localStorage.getItem(localKey(trigger, ctx)); } catch { return false; }
}

export default function ReviewModal({ open, trigger, triggerContext = '', userRole = 'founder', onClose }: Props) {
  const [rating, setRating]     = useState(0);
  const [hovered, setHovered]   = useState(0);
  const [feedback, setFeedback] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone]         = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) return;
    setPhotoFile(file);
    const reader = new FileReader();
    reader.onload = e => setPhotoPreview(e.target?.result as string);
    reader.readAsDataURL(file);
  }, []);

  async function handleSubmit() {
    if (!rating) return;
    setSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      let photoUrl = '';

      if (photoFile && user) {
        const ext = photoFile.name.split('.').pop() ?? 'jpg';
        const path = `${user.id}/${Date.now()}.${ext}`;
        const { data: up } = await supabase.storage.from('review-photos').upload(path, photoFile, { upsert: true });
        if (up) {
          const { data: pub } = supabase.storage.from('review-photos').getPublicUrl(up.path);
          photoUrl = pub.publicUrl;
        }
      }

      await supabase.from('reviews').insert({
        user_id:         user?.id ?? null,
        user_role:       userRole,
        trigger_type:    trigger,
        trigger_context: triggerContext,
        rating,
        feedback:        feedback.trim(),
        photo_url:       photoUrl,
      });

      markReviewShown(trigger, triggerContext);
      setDone(true);
      setTimeout(() => { setDone(false); reset(); onClose(); }, 2000);
    } catch {
      setSubmitting(false);
    }
  }

  function reset() {
    setRating(0); setHovered(0); setFeedback(''); setPhotoFile(null);
    setPhotoPreview(''); setSubmitting(false);
  }

  function handleClose() { reset(); onClose(); }

  const copy = TRIGGER_COPY[trigger];
  const display = hovered || rating;

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />

      {/* Card */}
      <div
        className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 fade-in duration-300"
        dir="rtl"
        onClick={e => e.stopPropagation()}
      >
        {/* Close */}
        <button onClick={handleClose} className="absolute top-4 left-4 p-1.5 rounded-full transition-colors z-10" style={{ color: 'var(--gray-mid)' }} onMouseEnter={e => (e.currentTarget.style.background = 'var(--gray-light)')} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
          <X className="w-4 h-4" />
        </button>

        {done ? (
          <div className="flex flex-col items-center justify-center py-14 px-6 text-center">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4" style={{ background: 'rgba(27,107,62,0.1)' }}>
              <CheckCircle className="w-8 h-8" style={{ color: 'var(--green-brand)' }} />
            </div>
            <h3 className="text-lg font-bold mb-1" style={{ color: 'var(--text-dark)' }}>شكراً جزيلاً!</h3>
            <p className="text-sm" style={{ color: 'var(--gray-mid)' }}>رأيك يساعدنا على التحسين المستمر</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="px-6 pt-8 pb-10 text-center text-white" style={{ background: 'linear-gradient(135deg, var(--green-deep) 0%, var(--green-brand) 100%)' }}>
              <div className="text-4xl mb-2">{copy.emoji}</div>
              <h2 className="text-xl font-bold mb-1">{copy.title}</h2>
              <p className="text-white/80 text-sm">{copy.subtitle}</p>
              {triggerContext && (
                <div className="mt-2 inline-block bg-white/20 text-white text-xs font-medium px-3 py-1 rounded-full">
                  {triggerContext}
                </div>
              )}
            </div>

            {/* Body */}
            <div className="-mt-5 bg-white rounded-t-2xl px-6 pt-6 pb-6 space-y-5">
              {/* Stars */}
              <div className="flex flex-col items-center gap-2">
                <p className="text-sm font-semibold mb-1.5" style={{ color: 'var(--text-dark)' }}>تقييمك العام</p>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map(i => (
                    <button
                      key={i}
                      onMouseEnter={() => setHovered(i)}
                      onMouseLeave={() => setHovered(0)}
                      onClick={() => setRating(i)}
                      className="transition-transform hover:scale-110 active:scale-95"
                    >
                      <Star
                        className={`w-9 h-9 transition-colors ${i <= display ? 'fill-[var(--gold)] text-[var(--gold)]' : 'text-[var(--gray-light)]'}`}
                        strokeWidth={1.5}
                      />
                    </button>
                  ))}
                </div>
                {display > 0 && (
                  <p className="text-sm font-medium" style={{ color: 'var(--gold)' }}>{STAR_LABELS[display]}</p>
                )}
              </div>

              {/* Feedback */}
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text-dark)' }}>
                  رأيك <span className="font-normal" style={{ color: 'var(--gray-mid)' }}>(اختياري)</span>
                </label>
                <textarea
                  value={feedback}
                  onChange={e => setFeedback(e.target.value)}
                  placeholder="شاركنا تجربتك وأي اقتراحات للتحسين…"
                  rows={3}
                  className="w-full px-3 py-2.5 rounded-xl border text-sm outline-none focus:ring-2 resize-none"
                  style={{ borderColor: 'var(--gray-light)', color: 'var(--text-dark)', '--tw-ring-color': 'rgba(27,107,62,0.2)' } as React.CSSProperties}
                />
              </div>

              {/* Photo Upload */}
              <div>
                <label className="block text-sm font-semibold mb-1.5" style={{ color: 'var(--text-dark)' }}>
                  صورة <span className="font-normal" style={{ color: 'var(--gray-mid)' }}>(اختياري)</span>
                </label>
                {photoPreview ? (
                  <div className="relative w-full h-28 rounded-xl overflow-hidden border" style={{ borderColor: 'var(--gray-light)' }}>
                    <img src={photoPreview} alt="preview" className="w-full h-full object-cover" />
                    <button
                      onClick={() => { setPhotoFile(null); setPhotoPreview(''); }}
                      className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white rounded-full p-1 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    onDragOver={e => e.preventDefault()}
                    onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
                    className="w-full h-20 rounded-xl border-2 border-dashed transition-colors flex flex-col items-center justify-center gap-1"
                    style={{ borderColor: 'var(--gray-light)', color: 'var(--gray-mid)' }}
                    onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--green-brand)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--green-brand)'; (e.currentTarget as HTMLButtonElement).style.background = 'rgba(27,107,62,0.04)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--gray-light)'; (e.currentTarget as HTMLButtonElement).style.color = 'var(--gray-mid)'; (e.currentTarget as HTMLButtonElement).style.background = ''; }}
                  >
                    <Camera className="w-5 h-5" />
                    <span className="text-xs">اسحب صورة أو اضغط للرفع</span>
                  </button>
                )}
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={handleClose}
                  className="flex-1 py-2.5 rounded-xl border text-sm font-medium transition-colors"
                  style={{ borderColor: 'var(--gray-light)', color: 'var(--gray-mid)' }}
                >
                  تخطي
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!rating || submitting}
                  className="flex-2 flex-1 py-2.5 rounded-xl text-white text-sm font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  style={{ background: rating ? 'var(--green-brand)' : 'var(--gray-mid)' }}
                >
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  {submitting ? 'جاري الإرسال…' : 'إرسال التقييم'}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
