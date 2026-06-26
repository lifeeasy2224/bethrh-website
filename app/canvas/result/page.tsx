'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { ArrowLeft, Download, Share2, CreditCard as Edit3, CircleCheck as CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

type CanvasSection = {
  key: string;
  label: string;
  color: string;
  bg: string;
  content: string;
};

function buildCanvas(idea: string): CanvasSection[] {
  const lower = idea.toLowerCase();
  const isFood = lower.includes('قهوة') || lower.includes('توصيل') || lower.includes('وجبة') || lower.includes('مطعم');
  const isEducation = lower.includes('كورس') || lower.includes('تعليم') || lower.includes('برمجة') || lower.includes('دروس');
  const isService = lower.includes('تنظيف') || lower.includes('صيانة') || lower.includes('خدمة');
  const isFashion = lower.includes('عباية') || lower.includes('ملابس') || lower.includes('متجر') || lower.includes('أزياء');

  if (isFood) return [
    { key: 'valueProposition', label: 'عرض القيمة', color: 'hsl(144,58%,26%)', bg: 'hsl(144,58%,96%)', content: `${idea} — سريع، طازج، يوصل لك في 30 دقيقة أو أقل` },
    { key: 'customerSegments', label: 'شرائح العملاء', color: 'hsl(210,80%,40%)', bg: 'hsl(210,80%,96%)', content: 'موظفو الشركات + طلاب الجامعات + العاملون من المنزل' },
    { key: 'channels', label: 'قنوات الوصول', color: 'hsl(38,95%,40%)', bg: 'hsl(38,95%,96%)', content: 'تطبيق موبايل + انستقرام + شراكات مع الشركات' },
    { key: 'revenue', label: 'مصادر الإيراد', color: 'hsl(280,60%,40%)', bg: 'hsl(280,60%,96%)', content: 'اشتراكات شهرية + رسوم توصيل + عمولة على كل طلب' },
    { key: 'keyActivities', label: 'الأنشطة الرئيسية', color: 'hsl(0,70%,40%)', bg: 'hsl(0,70%,96%)', content: 'إدارة الطلبات + شبكة موصّلين + ضمان جودة المنتج' },
    { key: 'keyResources', label: 'الموارد الرئيسية', color: 'hsl(160,60%,30%)', bg: 'hsl(160,60%,96%)', content: 'تطبيق ذكي + موردون موثوقون + فريق توصيل متدرب' },
  ];

  if (isEducation) return [
    { key: 'valueProposition', label: 'عرض القيمة', color: 'hsl(144,58%,26%)', bg: 'hsl(144,58%,96%)', content: `${idea} — تعلّم مهارة عملية واحصل على وظيفة خلال 90 يوم` },
    { key: 'customerSegments', label: 'شرائح العملاء', color: 'hsl(210,80%,40%)', bg: 'hsl(210,80%,96%)', content: 'خريجون يبحثون عن عمل + موظفون يريدون ترقية + طلاب جامعيون' },
    { key: 'channels', label: 'قنوات الوصول', color: 'hsl(38,95%,40%)', bg: 'hsl(38,95%,96%)', content: 'يوتيوب + تيك توك + لينكد إن + مجموعات واتساب' },
    { key: 'revenue', label: 'مصادر الإيراد', color: 'hsl(280,60%,40%)', bg: 'hsl(280,60%,96%)', content: 'اشتراك شهري للكورسات + ورش مدفوعة + برنامج التوظيف المدفوع' },
    { key: 'keyActivities', label: 'الأنشطة الرئيسية', color: 'hsl(0,70%,40%)', bg: 'hsl(0,70%,96%)', content: 'إنتاج محتوى + تحديث المناهج + دعم الطلاب + التواصل مع شركات' },
    { key: 'keyResources', label: 'الموارد الرئيسية', color: 'hsl(160,60%,30%)', bg: 'hsl(160,60%,96%)', content: 'مدربون متخصصون + منصة تعليمية + مجتمع خريجين نشط' },
  ];

  if (isService) return [
    { key: 'valueProposition', label: 'عرض القيمة', color: 'hsl(144,58%,26%)', bg: 'hsl(144,58%,96%)', content: `${idea} — احجز في دقيقة، الفريق عندك خلال ساعتين، نتيجة مضمونة` },
    { key: 'customerSegments', label: 'شرائح العملاء', color: 'hsl(210,80%,40%)', bg: 'hsl(210,80%,96%)', content: 'أسر مشغولة + رجال أعمال + مكاتب وشركات' },
    { key: 'channels', label: 'قنوات الوصول', color: 'hsl(38,95%,40%)', bg: 'hsl(38,95%,96%)', content: 'واتساب + تطبيق حجز + إعلانات سناب + توصيات العملاء' },
    { key: 'revenue', label: 'مصادر الإيراد', color: 'hsl(280,60%,40%)', bg: 'hsl(280,60%,96%)', content: 'دفع لكل زيارة + اشتراك شهري + عقود شركات سنوية' },
    { key: 'keyActivities', label: 'الأنشطة الرئيسية', color: 'hsl(0,70%,40%)', bg: 'hsl(0,70%,96%)', content: 'توظيف وتدريب الفريق + إدارة الجدول + ضمان الجودة' },
    { key: 'keyResources', label: 'الموارد الرئيسية', color: 'hsl(160,60%,30%)', bg: 'hsl(160,60%,96%)', content: 'فريق معتمد ومؤمَّن + منصة حجز + معدات احترافية' },
  ];

  if (isFashion) return [
    { key: 'valueProposition', label: 'عرض القيمة', color: 'hsl(144,58%,26%)', bg: 'hsl(144,58%,96%)', content: `${idea} — تصاميم عصرية بجودة مضمونة وتوصيل سريع لباب بيتك` },
    { key: 'customerSegments', label: 'شرائح العملاء', color: 'hsl(210,80%,40%)', bg: 'hsl(210,80%,96%)', content: 'نساء 18-45 / مهتمات بالموضة + محجبات يبحثن عن تصاميم عصرية' },
    { key: 'channels', label: 'قنوات الوصول', color: 'hsl(38,95%,40%)', bg: 'hsl(38,95%,96%)', content: 'انستقرام + تيك توك + المؤثرات + إعلانات سناب' },
    { key: 'revenue', label: 'مصادر الإيراد', color: 'hsl(280,60%,40%)', bg: 'hsl(280,60%,96%)', content: 'بيع القطع مباشرة + اشتراك صندوق الأزياء الشهري + تصاميم مخصصة' },
    { key: 'keyActivities', label: 'الأنشطة الرئيسية', color: 'hsl(0,70%,40%)', bg: 'hsl(0,70%,96%)', content: 'تصوير وإنتاج المحتوى + إدارة المخزون + خدمة العملاء' },
    { key: 'keyResources', label: 'الموارد الرئيسية', color: 'hsl(160,60%,30%)', bg: 'hsl(160,60%,96%)', content: 'مصمم / مورد موثوق + هوية بصرية قوية + مخزن صغير' },
  ];

  // Generic
  return [
    { key: 'valueProposition', label: 'عرض القيمة', color: 'hsl(144,58%,26%)', bg: 'hsl(144,58%,96%)', content: `${idea} — يوفر حلاً عملياً يوفر الوقت ويحل مشكلة حقيقية` },
    { key: 'customerSegments', label: 'شرائح العملاء', color: 'hsl(210,80%,40%)', bg: 'hsl(210,80%,96%)', content: 'الأفراد الذين يعانون من هذه المشكلة يومياً + الشركات الصغيرة والمتوسطة' },
    { key: 'channels', label: 'قنوات الوصول', color: 'hsl(38,95%,40%)', bg: 'hsl(38,95%,96%)', content: 'واتساب + سوشيال ميديا + مبيعات مباشرة + توصيات العملاء' },
    { key: 'revenue', label: 'مصادر الإيراد', color: 'hsl(280,60%,40%)', bg: 'hsl(280,60%,96%)', content: 'دفع لكل استخدام + اشتراك شهري للمميزات + نموذج freemium' },
    { key: 'keyActivities', label: 'الأنشطة الرئيسية', color: 'hsl(0,70%,40%)', bg: 'hsl(0,70%,96%)', content: 'تطوير المنتج + اكتساب العملاء + دعم ما بعد البيع' },
    { key: 'keyResources', label: 'الموارد الرئيسية', color: 'hsl(160,60%,30%)', bg: 'hsl(160,60%,96%)', content: 'فريق مؤسس متكامل + تمويل أولي + تقنية أو معرفة متخصصة' },
  ];
}

function CanvasResultContent() {
  const searchParams = useSearchParams();
  const idea = searchParams.get('idea') ?? 'فكرتك';
  const sections = buildCanvas(idea);

  return (
    <div className="min-h-screen" dir="rtl" style={{ background: 'hsl(42,25%,96%)' }}>
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: 'hsl(42,25%,83%)', background: 'hsl(42,25%,96%)' }}>
        <a href="/canvas" className="flex items-center gap-2 text-sm font-medium" style={{ color: 'var(--gray-mid)' }}>
          <ArrowLeft className="w-4 h-4 rotate-180" />
          عدّل الفكرة
        </a>
        <span className="font-bold text-base" style={{ color: 'var(--text-dark)' }}>بذرة</span>
        <div className="flex items-center gap-2">
          <button
            className="p-2 rounded-lg border transition hover:bg-white"
            style={{ borderColor: 'hsl(42,25%,83%)' }}
            title="مشاركة"
          >
            <Share2 className="w-4 h-4" style={{ color: 'var(--text-dark)' }} />
          </button>
          <button
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition"
            style={{ background: 'var(--green-brand)', color: 'var(--white)' }}
          >
            <Download className="w-4 h-4" />
            تحميل PDF
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-10 space-y-8">
        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-4" style={{ background: 'hsl(144,58%,92%)', color: 'var(--green-deep)' }}>
            <CheckCircle className="w-4 h-4" />
            Canvas (نموذج العمل التجاري) جاهز
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-2" style={{ color: 'var(--text-dark)' }}>
            نموذج العمل التجاري جاهز
          </h1>
          <p className="text-base max-w-lg mx-auto" style={{ color: 'var(--gray-mid)' }}>
            فكرتك: <span className="font-semibold" style={{ color: 'var(--text-dark)' }}>{idea}</span>
          </p>
        </motion.div>

        {/* Canvas Grid */}
        <div className="space-y-4">
          {/* القيمة المقترحة — full width, highlighted */}
          {sections.filter(s => s.key === 'valueProposition').map((section, i) => (
            <motion.div
              key={section.key}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-2xl border-2 p-7 group relative"
              style={{ background: section.bg, borderColor: section.color }}
            >
              <div className="flex items-start justify-between mb-3">
                <button className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md hover:bg-black/5">
                  <Edit3 className="w-4 h-4" style={{ color: section.color }} />
                </button>
                <div className="text-right">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold mb-2" style={{ background: section.color, color: 'white' }}>
                    ⭐ القيمة المقترحة
                  </span>
                  <p className="text-lg md:text-xl font-bold leading-relaxed text-right" style={{ color: 'var(--text-dark)' }}>
                    {section.content}
                  </p>
                </div>
              </div>
              <p className="text-xs text-right mt-2" style={{ color: section.color }}>
                هذه هي جوهر فكرتك — اللي تقنع به عميلك
              </p>
            </motion.div>
          ))}

          {/* Rest of sections grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {sections.filter(s => s.key !== 'valueProposition').map((section, i) => (
              <motion.div
                key={section.key}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.06 }}
                className="rounded-xl border p-5 group relative"
                style={{ background: section.bg, borderColor: section.color + '33' }}
              >
                <div className="flex items-center justify-between mb-3">
                  <button className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md hover:bg-black/5">
                    <Edit3 className="w-3.5 h-3.5" style={{ color: section.color }} />
                  </button>
                  <p className="text-xs font-bold uppercase tracking-wide text-right" style={{ color: section.color }}>
                    {section.label}
                  </p>
                </div>
                <p className="text-sm leading-relaxed text-right" style={{ color: 'hsl(158,30%,12%)' }}>
                  {section.content}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* CTA — save to account */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="rounded-2xl border p-8 text-center"
          style={{ background: 'hsl(210,80%,97%)', borderColor: 'hsl(210,80%,82%)' }}
        >
          <h2 className="text-xl font-bold mb-2" style={{ color: 'hsl(210,80%,20%)' }}>
            احفظ شغلك واكمل إلى عرض للتمويل
          </h2>
          <p className="text-sm mb-6" style={{ color: 'hsl(210,50%,40%)' }}>
            سجّل حساباً مجانياً عشان تحفظ النموذج وتكمل على عرض للتمويل وتبدأ مشوار الـ 90 يوم.
          </p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-md hover:shadow-lg"
              style={{ background: 'var(--text-dark)', color: 'var(--white)' }}
            >
              إنشاء حساب مجاني
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <Link
              href="/canvas"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-medium text-sm border transition"
              style={{ borderColor: 'hsl(210,80%,70%)', color: 'hsl(210,80%,30%)' }}
            >
              جرّب فكرة ثانية
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default function CanvasResultPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'hsl(42,25%,96%)' }}>
        <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--green-brand)' }} />
      </div>
    }>
      <CanvasResultContent />
    </Suspense>
  );
}
