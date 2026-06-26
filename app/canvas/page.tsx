'use client';

import { useState } from 'react';
import { ArrowLeft, Sparkles, Loader as Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';

const EXAMPLES = ['متجر عبايات أونلاين', 'تطبيق حجز ملاعب كرة', 'منصة كورسات برمجة', 'خدمة تنظيف منازل'];

export default function CanvasPage() {
  const [idea, setIdea] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleGenerate = () => {
    if (!idea.trim()) return;
    setLoading(true);
    setTimeout(() => {
      router.push(`/canvas/result?idea=${encodeURIComponent(idea.trim())}`);
    }, 2000);
  };

  return (
    <div className="min-h-screen" dir="rtl" style={{ background: 'hsl(42,25%,96%)' }}>
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'hsl(42,25%,83%)', background: 'hsl(42,25%,96%)' }}>
        <a href="/" className="flex items-center gap-2 text-sm font-medium" style={{ color: 'var(--text-dark)' }}>
          <ArrowLeft className="w-4 h-4 rotate-180" />
          الرئيسية
        </a>
        <span className="font-bold text-base" style={{ color: 'var(--text-dark)' }}>بذرة</span>
        <a href="/signup" className="text-sm font-medium px-4 py-1.5 rounded-lg transition" style={{ background: 'var(--green-brand)', color: 'var(--white)' }}>
          سجّل حساب
        </a>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-16 md:py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-6" style={{ background: 'hsl(144,58%,92%)', color: 'var(--green-deep)' }}>
            <Sparkles className="w-4 h-4" />
            مجاني — بدون تسجيل
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4" style={{ color: 'var(--text-dark)' }}>
            وش فكرتك؟
          </h1>
          <p className="text-lg" style={{ color: 'var(--gray-mid)' }}>
            اكتب فكرتك بكلمتين أو سطرين. بذرة بيحولها لـ Canvas (نموذج العمل التجاري) كامل في ثوانٍ.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl border p-6 md:p-8"
          style={{ background: 'white', borderColor: 'hsl(42,25%,83%)', boxShadow: '0 8px 24px rgba(0,0,0,0.07)' }}
        >
          <label className="block text-sm font-semibold mb-3" style={{ color: 'var(--text-dark)' }}>
            فكرتك أو مشروعك
          </label>
          <textarea
            value={idea}
            onChange={e => setIdea(e.target.value.slice(0, 500))}
            placeholder="مثال: تطبيق توصيل قهوة مختصة للموظفين في المكاتب..."
            rows={4}
            disabled={loading}
            dir="rtl"
            className="w-full px-4 py-3 rounded-xl border resize-none text-sm transition focus:outline-none focus:ring-2"
            style={{
              borderColor: 'hsl(42,25%,83%)',
              background: 'var(--off-white)',
              color: 'var(--text-dark)',
            }}
          />
          <div className="mt-1.5 text-xs" style={{ color: 'var(--gray-mid)' }}>
            {idea.length} / 500 حرف
          </div>

          <button
            onClick={handleGenerate}
            disabled={!idea.trim() || loading}
            className="mt-5 w-full py-4 rounded-xl font-bold text-base transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: 'var(--text-dark)', color: 'var(--white)' }}
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                جاري تكوين نموذج العمل التجاري...
              </>
            ) : (
              <>
                كوّن الـ Canvas (نموذج العمل التجاري)
                <ArrowLeft className="w-5 h-5" />
              </>
            )}
          </button>
        </motion.div>

        {/* Examples */}
        <div className="mt-8 text-center">
          <p className="text-sm mb-3" style={{ color: 'var(--gray-mid)' }}>أمثلة سريعة:</p>
          <div className="flex flex-wrap gap-2 justify-center">
            {EXAMPLES.map(ex => (
              <button
                key={ex}
                onClick={() => setIdea(ex)}
                className="px-4 py-2 rounded-full text-sm transition-all"
                style={{ background: 'hsl(42,28%,90%)', color: 'var(--text-dark)' }}
              >
                {ex}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
