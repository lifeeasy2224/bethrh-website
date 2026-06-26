'use client';

import { useState } from 'react';
import Link from 'next/link';
import { SquareCheck as CheckSquareIcon, Square, ArrowLeft, Mail } from 'lucide-react';

const checklist = [
  'المشكلة حقيقية؟',
  'السوق > $100M؟',
  'العائد المتوقع (IRO) > 200%؟',
  'نقطة التعادل < 18 شهر؟',
  'شريك مؤسس؟',
  'منافس واحد على الأقل؟',
  'خطة 90 يوم؟',
  'إنفاق على المنتج والمبيعات فقط؟',
  'قيمة مضافة منك؟',
  'تقبّل خسارة 100%؟',
];

function scoreLabel(n: number) {
  if (n >= 9) return { label: 'مثمرة 🍎', color: 'var(--green-brand)' };
  if (n >= 6) return { label: 'متجذرة 🫚', color: 'var(--gold)' };
  return { label: 'ضعيفة 🥀', color: '#DC2626' };
}

export default function InvestorAssistantPage() {
  const [checked, setChecked] = useState<boolean[]>(Array(checklist.length).fill(false));

  function toggle(i: number) {
    setChecked(prev => prev.map((v, idx) => idx === i ? !v : v));
  }

  const score = checked.filter(Boolean).length;
  const { label: resultLabel, color: resultColor } = scoreLabel(score);

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Hero */}
      <div className="bg-white border-b border-gray-200 px-6 py-10">
        <div className="max-w-4xl mx-auto text-right">
          <span className="inline-block text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-4 bg-[rgba(27,107,62,0.1)] text-[var(--green-brand)]">
            مساعد المستثمر الذكي
          </span>
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-2">
            🤖 مساعد المستثمر الذكي
          </h1>
          <h2 className="text-lg font-medium text-gray-600">
            دليلك لاكتشاف الصفقات الرابحة في MENA وتركيا وباكستان
          </h2>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-10 space-y-14">

        {/* ── Section 1: لماذا تفشل 90%؟ ── */}
        <section className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 text-right">
          <h2 className="text-2xl font-extrabold text-gray-900 mb-4">لماذا تفشل 90% من الشركات الناشئة؟</h2>
          <p className="text-gray-700 leading-relaxed">
            الغالبية العظمى من الشركات الناشئة في منطقة الشرق الأوسط وشمال أفريقيا وتركيا وباكستان تغلق قبل عامها الثاني. السبب: فجوة بين الفرص الاقتصادية الهائلة وضعف جاهزية المؤسسين.
          </p>
        </section>

        {/* ── Section 2: ثلاثة أسباب ── */}
        <section className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 text-right">
          <h2 className="text-2xl font-extrabold text-gray-900 mb-6">ثلاثة أسباب رئيسية تقتل أي استثمار</h2>
          <div className="overflow-x-auto mb-6">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-right p-3 font-bold text-gray-700 border border-gray-200 rounded-tl-lg">النتيجة</th>
                  <th className="text-right p-3 font-bold text-gray-700 border border-gray-200">التفسير</th>
                  <th className="text-right p-3 font-bold text-gray-700 border border-gray-200 rounded-tr-lg">السبب</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['استنزاف $50K+ على منتج لا طلب عليه', 'يبني منتجاً لمشكلة متخيّلة', 'المؤسس غير المناسب'],
                  ['الأرقام غير منطقية', 'سوق $1M يطلب تقييم $10M', 'السوق غير المناسب'],
                  ['نفاد السيولة خلال 8 أشهر', 'حرق رأس المال قبل إثبات الطلب', 'الإنفاق غير المناسب'],
                ].map(([result, explain, reason], i) => (
                  <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="p-3 text-gray-600 border border-gray-200">{result}</td>
                    <td className="p-3 text-gray-600 border border-gray-200">{explain}</td>
                    <td className="p-3 font-semibold text-gray-900 border border-gray-200">{reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="bg-[rgba(27,107,62,0.08)] border border-[rgba(27,107,62,0.3)] rounded-xl p-4 text-[var(--green-brand)] font-medium text-sm">
            نقوم بتمرير كل بذرة عبر 3 مراحل فلترة صارمة. هدفنا: رفع نسبة النجاح من 10% إلى 60% عبر الفلترة الصارمة والدعم المستمر للمؤسسين.
          </div>
        </section>

        {/* ── Section 3: علامات الخطر ── */}
        <section className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 text-right">
          <h2 className="text-2xl font-extrabold text-gray-900 mb-5">5 علامات خطر: إذا رأيتها، انسحب فوراً</h2>
          <ol className="space-y-3">
            {[
              'حديث عن سوق ضخم دون أرقام',
              'IRO أقل من 200%',
              'نقطة التعادل بعد 24 شهراً',
              'ادعاء لا يوجد منافسون',
              'مؤسس منفرد',
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-3 flex-row-reverse">
                <span className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-sm shrink-0 bg-red-100 text-red-600">{i + 1}</span>
                <span className="text-gray-800 pt-0.5">{item}</span>
              </li>
            ))}
          </ol>
        </section>

        {/* ── Section 4: بطاقة البذرة ── */}
        <section className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 text-right">
          <h2 className="text-2xl font-extrabold text-gray-900 mb-6">كيف تقرأ بطاقة البذرة خلال 10 ثوانٍ؟</h2>
          <div className="overflow-x-auto mb-6">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-right p-3 font-bold text-gray-700 border border-gray-200">المؤشر</th>
                  <th className="text-center p-3 font-bold text-[var(--green-brand)] border border-gray-200">إيجابي 🟢</th>
                  <th className="text-center p-3 font-bold text-[var(--gold)] border border-gray-200">مقبول 🟡</th>
                  <th className="text-center p-3 font-bold text-red-700 border border-gray-200">سلبي 🔴</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['العائد المتوقع (IRO)', '400%+', '200–400%', 'أقل من 200%'],
                  ['نقطة التعادل', 'أقل من 12 شهر', '12–18 شهر', '18+ شهر'],
                  ['تقويم البذرة', '85+', '75–85', 'أقل من 75'],
                  ['المستوى', 'مثمر 🍎', 'متجذر 🫚', 'بذرة 🌱'],
                ].map(([ind, g, y, r], i) => (
                  <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="p-3 font-semibold text-gray-900 border border-gray-200">{ind}</td>
                    <td className="p-3 text-center text-[var(--green-brand)] border border-gray-200">{g}</td>
                    <td className="p-3 text-center text-[var(--gold)] border border-gray-200">{y}</td>
                    <td className="p-3 text-center text-red-700 border border-gray-200">{r}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="bg-[rgba(212,166,83,0.1)] border border-[rgba(212,166,83,0.3)] rounded-xl p-4">
            <p className="font-bold text-[#8B6B47] mb-1">القاعدة الذهبية:</p>
            <p className="text-[#9E8B6F] text-sm">العائد المتوقع (IRO) &gt; 300% + نقطة التعادل &lt; 12 شهر + مثمر 🍎 = اطلب التواصل فوراً</p>
          </div>
        </section>

        {/* ── Section 5: القطاعات الذهبية ── */}
        <section className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 text-right">
          <h2 className="text-2xl font-extrabold text-gray-900 mb-6">3 قطاعات ذهبية لعام 2026</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { n: '١', region: 'السعودية والخليج', sector: 'B2B SaaS', iro: '450%', be: '9 أشهر' },
              { n: '٢', region: 'مصر وباكستان', sector: 'Fintech', iro: '380%', be: '14 شهراً' },
              { n: '٣', region: 'تركيا', sector: 'E-commerce للخليج', iro: '520%', be: '7 أشهر' },
            ].map(c => (
              <div key={c.n} className="border border-gray-200 rounded-xl p-5 text-right">
                <p className="text-xs font-bold text-[var(--green-brand)] uppercase mb-1">{c.region}</p>
                <p className="font-extrabold text-lg text-gray-900 mb-3">{c.sector}</p>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between flex-row-reverse">
                    <span className="text-gray-500">متوسط IRO</span>
                    <span className="font-bold text-[var(--green-brand)]">{c.iro}</span>
                  </div>
                  <div className="flex justify-between flex-row-reverse">
                    <span className="text-gray-500">نقطة التعادل</span>
                    <span className="font-bold text-gray-900">{c.be}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 text-right mt-3">* أرقام IRO تقديرية بناءً على بيانات السوق العامة — ليست ضماناً للعوائد الفعلية.</p>
        </section>
        <section className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 text-right">
          <h2 className="text-2xl font-extrabold text-gray-900 mb-6">قائمة التحقق للمستثمر الذكي — 10 معايير</h2>
          <div className="rounded-2xl border border-gray-200 overflow-hidden mb-5">
            {checklist.map((item, i) => (
              <button
                key={i}
                onClick={() => toggle(i)}
                className="w-full flex items-center gap-4 px-5 py-4 text-right transition-colors hover:bg-gray-50 flex-row-reverse border-b last:border-b-0 border-gray-100"
              >
                {checked[i]
                  ? <CheckSquareIcon className="w-5 h-5 shrink-0 text-[var(--green-brand)]" />
                  : <Square className="w-5 h-5 shrink-0 text-gray-400" />
                }
                <span className="text-sm font-medium flex-1" style={{ color: checked[i] ? 'var(--green-brand)' : '#374151' }}>
                  {item}
                </span>
              </button>
            ))}
            <div className="px-5 py-3 flex items-center justify-between flex-row-reverse bg-[rgba(27,107,62,0.08)] border-t border-[rgba(27,107,62,0.2)]">
              <span className="text-xs font-bold text-[var(--green-brand)]">{score} / {checklist.length} اكتملت</span>
              <div className="h-1.5 rounded-full w-40 bg-[rgba(27,107,62,0.2)]">
                <div
                  className="h-full rounded-full transition-all duration-300 bg-[var(--green-brand)]"
                  style={{ width: `${(score / checklist.length) * 100}%` }}
                />
              </div>
            </div>
          </div>
          <div className="text-center p-4 rounded-xl border" style={{ borderColor: resultColor, background: `${resultColor}15` }}>
            <p className="text-lg font-extrabold" style={{ color: resultColor }}>{resultLabel}</p>
            <p className="text-sm text-gray-600 mt-1">
              {score >= 9 ? 'فرصة استثمارية ممتازة' : score >= 6 ? 'فرصة مقبولة — راجع النقاط الناقصة' : 'تحتاج مراجعة عميقة قبل الاستثمار'}
            </p>
          </div>
        </section>

        {/* ── Section 7: مقارنة ── */}
        <section className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 text-right">
          <h2 className="text-2xl font-extrabold text-gray-900 mb-6">لماذا يفضل المستثمرون المشتل؟</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-center p-3 font-bold text-[var(--green-brand)] border border-gray-200">المشتل 🌱</th>
                  <th className="text-center p-3 font-bold text-gray-500 border border-gray-200">المنصات التقليدية</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['50 بذرة مفلترة', '1,000 فكرة غير مفلترة'],
                  ['4 أرقام واضحة', 'بلا أرقام'],
                  ['30 دقيقة أسبوعياً', '20 ساعة أسبوعياً'],
                  ['هدفنا: 60% نسبة نجاح *', '10% نسبة نجاح'],
                ].map(([us, them], i) => (
                  <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="p-3 text-center text-[var(--green-brand)] font-semibold border border-gray-200">{us}</td>
                    <td className="p-3 text-center text-gray-500 border border-gray-200">{them}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-gray-400 text-right">* هدف مستهدف غير مضمون — يعتمد على جودة الفلترة ومتابعة المؤسس.</p>
        </section>
        <section className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 text-right">
          <h2 className="text-2xl font-extrabold text-gray-900 mb-1">من بذرة إلى حصاد بعائد 12x</h2>
          <p className="text-xs text-gray-400 mb-5">📌 مثال توضيحي — الأرقام تقديرية ولا تمثل نتائج فعلية مضمونة</p>
          <div className="rounded-2xl p-6 border border-[rgba(212,166,83,0.3)] bg-[rgba(212,166,83,0.08)]">
            <div className="flex items-center gap-4 mb-5 flex-row-reverse">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl bg-[rgba(212,166,83,0.15)] shrink-0">☕</div>
              <div>
                <p className="font-extrabold text-lg text-gray-900">Qahwa Office <span className="text-xs font-normal text-[#9E8B6F]">(مثال توضيحي)</span></p>
                <p className="text-sm text-gray-600">توصيل قهوة مختصة للمكاتب</p>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-3 mb-4">
              {[
                { label: 'تقويم البذرة (يناير)', value: '91/100' },
                { label: 'الإيراد الشهري (بداية)', value: '$530' },
                { label: 'الإيراد الشهري (نوفمبر)', value: '$48K' },
                { label: 'التقييم', value: '$1.6M' },
              ].map(({ label, value }) => (
                <div key={label} className="text-center p-3 rounded-xl bg-white">
                  <p className="text-lg font-extrabold text-[var(--green-brand)]">{value}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{label}</p>
                </div>
              ))}
            </div>
            <p className="text-center font-bold text-[#8B6B47]">عائد 12x — خلال 18 شهراً فقط</p>
          </div>
        </section>

        {/* ── Section 9: Early Harvest Pass ── */}
        <section className="rounded-2xl p-8 text-right" style={{ background: `linear-gradient(145deg, var(--green-deep) 0%, var(--green-brand) 60%, #6B4423 100%)` }}>
          <h2 className="text-2xl font-extrabold text-white mb-2">Early Harvest Pass</h2>
          <p className="text-[rgba(212,166,83,0.8)] text-sm mb-6">لأول 100 مستثمر: اشتراك سنوي مجاني + أولوية 7 أيام + نشرة VIP</p>
          <div className="bg-white/10 rounded-xl p-4 mb-6 inline-block">
            <p className="text-white font-bold">المقاعد المتبقية: <span className="text-[var(--gold)]">73</span> من 100</p>
          </div>
          <div>
            <Link
              href="/profile"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-extrabold text-base transition-all hover:opacity-90 shadow-xl"
              style={{ background: 'var(--gold)', color: '#1C1917' }}
            >
              سجّل اهتمامك — تواصل معنا
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </div>
        </section>

        {/* ── Bottom CTAs ── */}
        <div className="text-center space-y-4 pb-6">
          <Link
            href="/greenhouse"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl font-bold text-base bg-[var(--green-brand)] hover:bg-[#1a5a35] text-white transition-all shadow-lg"
          >
            ارجع للمشتل واستكشف البذور
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center justify-center gap-6 flex-wrap text-sm text-gray-600">
            <a href="mailto:lifeeasy2224@gmail.com" className="flex items-center gap-1 hover:text-[var(--green-brand)] transition-colors">
              <Mail className="w-4 h-4" />
              lifeeasy2224@gmail.com
            </a>
            <a href="https://wa.me/14804476256" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-[var(--green-brand)] transition-colors">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" fill="#25D366"/>
                <path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.978-1.304A9.96 9.96 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18a7.96 7.96 0 01-4.076-1.117l-.292-.174-3.035.795.81-2.96-.19-.304A7.96 7.96 0 014 12c0-4.418 3.582-8 8-8s8 3.582 8 8-3.582 8-8 8z" fill="#25D366"/>
              </svg>
              +1 (480) 447-6256
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
