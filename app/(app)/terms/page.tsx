'use client';

import Link from 'next/link';
import { Scale, FileText, Shield, TriangleAlert as AlertTriangle, ArrowRight, Mail, Bot, Users, CreditCard, UserX, Gavel, Heart } from 'lucide-react';

const sections = [
  {
    icon: FileText,
    title: '١. قبول الشروط',
    content: [
      { heading: '١.١ الموافقة', body: 'باستخدامك منصة بذرة، فإنك توافق على هذه الشروط والأحكام كاملةً. إن كنت لا توافق على أي بند منها، يرجى عدم استخدام المنصة.' },
      { heading: '١.٢ التعديلات', body: 'تحتفظ بذرة وشركة Life Easy LLC بالحق في تعديل هذه الشروط في أي وقت. سيُشعَر المستخدمون بأي تغييرات جوهرية عبر البريد الإلكتروني أو إشعار داخل المنصة قبل ٣٠ يوماً.' },
    ],
  },
  {
    icon: Shield,
    title: '٢. استخدام الخدمة',
    content: [
      { heading: '٢.١ الاستخدام المسموح به', body: 'تُستخدم المنصة حصراً لأغراض ريادية وتجارية مشروعة. يُحظر استخدامها لأي نشاط مخالف للقانون أو ضار بالآخرين.' },
      { heading: '٢.٢ الحد الأدنى للعمر', body: 'يجب أن يكون عمرك ١٦ عاماً أو أكثر لاستخدام المنصة.' },
      { heading: '٢.٣ مسؤولية الحساب', body: 'أنت مسؤول عن الحفاظ على سرية بيانات حسابك وعن جميع الأنشطة التي تجري تحت حسابك.' },
      { heading: '٢.٤ المحتوى المحظور', body: 'يُحظر نشر أو مشاركة أي محتوى مسيء أو غير قانوني أو ينتهك حقوق الملكية الفكرية للآخرين.' },
    ],
  },
  {
    icon: Scale,
    title: '٣. الملكية الفكرية',
    content: [
      { heading: '٣.١ ملكيتك', body: 'جميع الأفكار والمحتوى الذي تنشئه على المنصة هو ملكيتك الحصرية. راجع سياسة حماية الملكية الفكرية للتفاصيل الكاملة.' },
      { heading: '٣.٢ ملكية المنصة', body: 'التصميم والكود والمحتوى الخاص بمنصة بذرة هو ملك حصري لشركة Life Easy LLC ومحمي بموجب قوانين الملكية الفكرية.' },
    ],
  },
  {
    icon: AlertTriangle,
    title: '٤. إخلاء المسؤولية',
    content: [
      { heading: '٤.١ طبيعة الخدمة', body: 'بذرة أداة مساعدة فقط. لا تضمن الحصول على تمويل، ولا تتحمل مسؤولية أي قرار استثماري أو تجاري يتخذه المستخدم بناءً على مخرجات المنصة. القرارات التجارية النهائية تبقى مسؤوليتك الكاملة.' },
      { heading: '٤.٢ دقة المعلومات', body: 'تسعى بذرة إلى تقديم معلومات دقيقة ومحدّثة، لكنها لا تضمن الدقة المطلقة. استشر متخصصين ماليين وقانونيين قبل اتخاذ قرارات كبرى.' },
    ],
  },
  {
    icon: Users,
    title: '٦. العلاقة بين المستثمر والمؤسس',
    content: [
      { heading: '٦.١ دور بذرة', body: 'بذرة منصة وساطة تقنية فقط. لا تُعدّ طرفاً في أي صفقة أو تفاهم بين المستثمر والمؤسس.' },
      { heading: '٦.٢ عدم الاستشارة المالية', body: 'بذرة ليست مستشاراً مالياً أو وسيطاً مرخصاً. أي معلومات مالية على المنصة هي لأغراض توضيحية فقط ولا تُعدّ توصية استثمارية.' },
      { heading: '٦.٣ عدم ضمان النتائج', body: 'بذرة لا تضمن أي نتائج استثمارية. المستثمر والمؤسس يتحملان كامل المسؤولية عن أي تواصل أو اتفاق ينشأ عبر المنصة.' },
      { heading: '٦.٤ تحمل المخاطر', body: 'يقرّ المستخدم بأنه يتحمل مسؤولية أي قرار مالي أو تجاري يتخذه بناءً على المعلومات المتاحة عبر المنصة.' },
    ],
  },
  {
    icon: CreditCard,
    title: '٧. الاشتراكات والمدفوعات',
    content: [
      { heading: '٧.١ الوضع الحالي', body: 'المنصة مجانية حالياً في مرحلتها التأسيسية. في حال إضافة خدمات مدفوعة، سيتم إشعارك مسبقاً بوضوح قبل ٣٠ يوماً.' },
      { heading: '٧.٢ سياسة الاسترداد', body: 'عند تفعيل الاشتراكات المدفوعة، ستُحدد سياسة استرداد واضحة. لن تُفرض رسوم دون موافقتك الصريحة.' },
      { heading: '٧.٣ الإلغاء', body: 'يمكنك إلغاء اشتراكك في أي وقت من صفحة إعدادات الحساب. يستمر الوصول حتى نهاية فترة الاشتراك المدفوعة.' },
    ],
  },
  {
    icon: AlertTriangle,
    title: '٨. تحديد المسؤولية',
    content: [
      { heading: '٨.١ حد المسؤولية', body: 'في أقصى حد يسمح به القانون، لا تتحمل Life Easy LLC أي مسؤولية عن أضرار مباشرة أو غير مباشرة أو عرضية أو تبعية ناتجة عن استخدام المنصة أو عدم القدرة على استخدامها، بما في ذلك خسائر مالية أو فشل مشاريع.' },
      { heading: '٨.٢ تحمّل المخاطر', body: 'تستخدم المنصة على مسؤوليتك الخاصة. بذرة لا تقدم ضمانات ضمنية أو صريحة بشأن ملاءمة الخدمة لغرض معين.' },
    ],
  },
  {
    icon: UserX,
    title: '٩. إنهاء الحساب',
    content: [
      { heading: '٩.١ حق المنصة', body: 'تحتفظ بذرة بالحق في تعليق أو إنهاء حسابك دون إشعار مسبق في حال انتهاك هذه الشروط أو إساءة استخدام المنصة أو إلحاق الضرر بمستخدمين آخرين.' },
      { heading: '٩.٢ حق المستخدم', body: 'يمكنك حذف حسابك في أي وقت من صفحة الخصوصية. تُحذف بياناتك فوراً.' },
    ],
  },
  {
    icon: Bot,
    title: '١٠. المدرب الذكي (الذكاء الاصطناعي)',
    content: [
      { heading: '١٠.١ طبيعة الخدمة', body: 'المدرب الذكي يقدم إرشادات عامة مبنية على الذكاء الاصطناعي ولا يُعدّ بديلاً عن الاستشارة المهنية المتخصصة القانونية أو المالية أو التسويقية.' },
      { heading: '١٠.٢ معالجة البيانات', body: 'تُرسل استفساراتك فقط إلى مزود الذكاء الاصطناعي لمعالجتها آنياً. لا تُرسل بيانات فكرتك الكاملة. لا يُستخدم ذلك لتدريب نماذج الذكاء الاصطناعي.' },
    ],
  },
  {
    icon: Heart,
    title: '١١. التعويض',
    content: [
      { heading: '١١.١ التزام المستخدم', body: 'توافق على تعويض Life Easy LLC وموظفيها ومديريها عن أي مطالبات أو خسائر أو مصاريف ناشئة عن: (أ) انتهاكك لهذه الشروط، (ب) محتوى تنشره على المنصة، (ج) أي نزاع بينك وبين مستخدم آخر.' },
    ],
  },
  {
    icon: Mail,
    title: '١٢. التواصل والنزاعات',
    content: [
      { heading: '١٢.١ الاستفسارات', body: 'لأي استفسار حول هذه الشروط، تواصل معنا: lifeeasy2224@gmail.com' },
      { heading: '١٢.٢ القانون المنظّم', body: 'تخضع هذه الشروط لقوانين الولايات المتحدة الأمريكية وولاية أريزونا تحديداً.' },
      { heading: '١٢.٣ التحكيم', body: 'أي نزاع يُحسم عبر التحكيم الملزم وفق قواعد جمعية التحكيم الأمريكية (AAA) في ولاية أريزونا. يتنازل الطرفان عن حق رفع دعاوى جماعية (Class Actions).' },
    ],
  },
];

export default function TermsPage() {
  return (
    <div dir="rtl" className="min-h-screen bg-off-white">
      <div className="max-w-3xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-10">
          <Link href="/" className="inline-flex items-center gap-1.5 text-sm mb-8 transition-colors text-muted-foreground hover:text-foreground">
            <ArrowRight className="w-4 h-4" />
            العودة للرئيسية
          </Link>
          <div className="flex items-center gap-3 flex-row-reverse mt-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-primary/10">
              <Scale className="w-6 h-6 text-primary" />
            </div>
            <div className="text-right">
              <h1 className="text-2xl font-extrabold text-white">الشروط والأحكام</h1>
              <p className="text-sm text-muted-foreground">آخر تحديث: مايو ٢٠٢٦ — Life Easy LLC</p>
            </div>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-right" style={{ color: 'var(--gray-mid)' }}>
            يرجى قراءة هذه الشروط بعناية قبل استخدام منصة بذرة. تحدد هذه الشروط حقوقك والتزاماتك كمستخدم للمنصة.
          </p>
        </div>

        {/* Sections */}
        <div className="space-y-6">
          {sections.map(({ icon: Icon, title, content }) => (
            <div key={title} className="bg-white rounded-2xl border p-6 text-right border-gray-light">
              <div className="flex items-center gap-3 flex-row-reverse mb-5">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-primary/10">
                  <Icon className="w-4 h-4 text-primary" />
                </div>
                <h2 className="text-base font-bold" style={{ color: 'var(--text-dark)' }}>{title}</h2>
              </div>
              <div className="space-y-4">
                {content.map(({ heading, body }) => (
                  <div key={heading}>
                    <h3 className="text-sm font-semibold mb-1" style={{ color: 'var(--text-dark)' }}>{heading}</h3>
                    <p className="text-sm leading-relaxed" style={{ color: 'var(--gray-mid)' }}>{body}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-10 pb-4">
          © ٢٠٢٦ Life Easy LLC — جميع الحقوق محفوظة
        </p>
      </div>
    </div>
  );
}
