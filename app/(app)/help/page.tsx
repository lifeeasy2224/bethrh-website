'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CircleHelp as HelpCircle, ChevronDown, ChevronUp, MessageSquare, Lightbulb, ChartBar as BarChart2, Users, CircleUser as UserCircle, Sprout, Mail, ExternalLink, LayoutGrid, ArrowLeft, Star, TrendingUp, Leaf } from 'lucide-react';

type FaqItem = { q: string; a: string | React.ReactNode };
type FaqSection = { title: string; emoji: string; items: FaqItem[] };

const ValuePropositionAnswer = () => (
  <div className="space-y-6 text-right" dir="rtl">
    {/* التعريف */}
    <div>
      <h4 className="font-semibold text-foreground mb-2">١. التعريف</h4>
      <p className="text-sm text-muted-foreground leading-relaxed">
        القيمة المقترحة هي <span className="font-semibold text-foreground">جملة واحدة واضحة</span> تجعل العميل يُدرك على الفور أنّ هذا المنتج أو الخدمة مُصمَّم خصيصاً له، وأنّه يحلّ مشكلةً يعانيها فعلاً.
      </p>
    </div>

    {/* الجدول */}
    <div>
      <h4 className="font-semibold text-foreground mb-3">٢. الأسئلة الأربعة لصياغتها</h4>
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-secondary/60 border-b border-border">
              <th className="px-4 py-2.5 text-right font-semibold text-foreground">السؤال</th>
              <th className="px-4 py-2.5 text-right font-semibold text-foreground">مثال</th>
            </tr>
          </thead>
          <tbody>
            {[
              { q: 'لمن؟', ex: 'موظفون في المكاتب يعملون ٨ ساعات أو أكثر' },
              { q: 'ما المشكلة؟', ex: 'لا يجدون وقتاً لتحضير قهوة جيدة أثناء العمل' },
              { q: 'ما الحل؟', ex: 'توصيل قهوة مختصة طازجة مباشرةً إلى مكتبهم' },
              { q: 'ما الميزة؟', ex: 'خلال ١٥ دقيقة، بسعر أقل من المقاهي المجاورة' },
            ].map((row, i) => (
              <tr key={i} className={i % 2 === 0 ? 'bg-card' : 'bg-secondary/20'}>
                <td className="px-4 py-2.5 font-medium text-primary">{row.q}</td>
                <td className="px-4 py-2.5 text-muted-foreground">{row.ex}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>

    {/* مثال مجمع */}
    <div>
      <h4 className="font-semibold text-foreground mb-2">٣. مثال كامل — مشروع القهوة</h4>
      <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
        <p className="text-sm leading-relaxed text-foreground">
          <span className="font-bold text-primary">الجملة الكاملة:</span>{' '}
          &ldquo;نوصّل قهوةً مختصة طازجة إلى موظفي المكاتب في الرياض خلال ١٥ دقيقة، بسعر يبدأ من $٤، دون الحاجة إلى مغادرة المبنى.&rdquo;
        </p>
      </div>
    </div>

    {/* أين تُدخَل في بذرة */}
    <div>
      <h4 className="font-semibold text-foreground mb-2">٤. أين يتم إدخالها في بذرة؟</h4>
      <div className="flex items-start gap-3 p-4 rounded-xl border border-teal-200 bg-teal-50 flex-row-reverse">
        <div className="w-9 h-9 rounded-lg bg-teal-100 flex items-center justify-center shrink-0">
          <LayoutGrid className="w-4 h-4 text-teal-700" />
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold text-teal-800 mb-1">المربع الأول — النموذج (Canvas)</p>
          <p className="text-sm text-teal-700 leading-relaxed">
            عند إنشاء نموذج العمل التجاري في صفحة <strong>النموذج</strong>، يظهر مربع &ldquo;القيمة المقترحة&rdquo; أولاً وبحجم أكبر من باقي المربعات، لأنّه الأساس الذي تُبنى عليه بقية عناصر النموذج.
          </p>
        </div>
      </div>
    </div>

    {/* أمثلة تطبيقية */}
    <div>
      <h4 className="font-semibold text-foreground mb-3">٥. أمثلة تطبيقية</h4>
      <div className="space-y-3">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs font-bold text-primary mb-1">مشروع ١ — منصة دروس برمجة</p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            &ldquo;نساعد الخريجين الباحثين عن عمل في تعلّم البرمجة عبر مسارات عملية مُدارة، للحصول على وظيفتهم الأولى خلال ٩٠ يوماً، بدلاً من إضاعة سنوات في الجامعات أو الكورسات العشوائية.&rdquo;
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs font-bold text-primary mb-1">مشروع ٢ — خدمة تنظيف منازل</p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            &ldquo;نوفّر لعائلات المدن المشغولة فريقَ تنظيف موثوقاً ومُؤمَّناً يصل إلى المنزل خلال ساعتين من الحجز، مع ضمان رضا كامل أو الإعادة مجاناً.&rdquo;
          </p>
        </div>
      </div>
    </div>

    {/* زر الإجراء */}
    <Link
      href="/canvas"
      className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm transition-all text-white"
      style={{ background: 'var(--text-dark)' }}
    >
      ابدأ بكتابة القيمة المقترحة
      <ArrowLeft className="w-4 h-4" />
    </Link>
  </div>
);

const ScoreSystemAnswer = () => (
  <div className="space-y-5 text-right" dir="rtl">
    <p className="text-sm text-muted-foreground leading-relaxed">
      في بذرة نستخدم <span className="font-semibold text-foreground">&ldquo;تقويم البذرة&rdquo;</span> مكوّن من ٣ طبقات:
    </p>

    {/* الطبقات الثلاث */}
    <div className="space-y-3">
      {[
        {
          num: '١', title: 'اختبار البذرة',
          body: 'أول ما تدخل فكرتك، الذكاء الاصطناعي يحلل: هل المشكلة حقيقية؟ هل السوق موجود؟ ٧٠٪ من الأفكار تحتاج تطويراً إضافياً في هذه المرحلة — وهذا طبيعي تماماً.',
          color: 'border-amber-200 bg-amber-50', badge: 'bg-amber-100 text-amber-700',
        },
        {
          num: '٢', title: 'رحلة النمو',
          body: 'تمر بـ ٤ مراحل — بذرة 🌱 ← إنبات 🌿 ← جذور 🌾 ← ساق 🌳. كل مرحلة لها مهام + اختبارات.',
          color: 'border-green-200 bg-green-50', badge: 'bg-green-100 text-green-700',
        },
        {
          num: '٣', title: 'تقويم البذرة',
          body: 'تقويم البذرة يمنحك نتيجة من ١٠٠ بناءً على ٦ معايير ريادية موزونة، مع مقارنة بمعيار قطاعك وتوصيات مخصصة.',
          color: 'border-blue-200 bg-blue-50', badge: 'bg-blue-100 text-blue-700',
        },
      ].map(({ num, title, body, color, badge }) => (
        <div key={num} className={`flex items-start gap-3 p-4 rounded-xl border ${color} flex-row-reverse`}>
          <div className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center shrink-0 ${badge}`}>{num}</div>
          <div className="flex-1 text-right">
            <p className="font-semibold text-sm mb-0.5 text-foreground">{title}</p>
            <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
          </div>
        </div>
      ))}
    </div>

    {/* المعايير */}
    <div>
      <h4 className="font-semibold text-foreground mb-3">المعايير الستة وأوزانها</h4>
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-secondary/60 border-b border-border">
              <th className="px-4 py-2.5 text-right font-semibold">المعيار</th>
              <th className="px-4 py-2.5 text-right font-semibold">الوزن</th>
              <th className="px-4 py-2.5 text-right font-semibold">كيف يُحسب؟</th>
            </tr>
          </thead>
          <tbody>
            {[
              { m: 'القيمة المقدمة',  w: '٢٠/١٠٠', how: 'وضوح وعمق وصف المشكلة والحل' },
              { m: 'حجم السوق',       w: '٢٠/١٠٠', how: 'نقاط التحقق المسجّلة' },
              { m: 'التحقق الميداني', w: '٢٠/١٠٠', how: 'المقابلات + التسجيلات + الطلبات المسبقة' },
              { m: 'قابلية التنفيذ',  w: '٢٠/١٠٠', how: 'نسبة إكمال مهام الـ ٩٠ يوم' },
              { m: 'جودة العرض',      w: '١٠/١٠٠', how: 'وضوح وبنية العرض التقديمي' },
              { m: 'المشوار المكتمل', w: '١٠/١٠٠', how: 'مدى اكتمال خارطة رحلة الريادي' },
            ].map((r, i) => (
              <tr key={i} className={i % 2 === 0 ? 'bg-card' : 'bg-secondary/20'}>
                <td className="px-4 py-2.5 font-medium text-primary">{r.m}</td>
                <td className="px-4 py-2.5 font-bold tabular-nums">{r.w}</td>
                <td className="px-4 py-2.5 text-muted-foreground">{r.how}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>

    {/* شروط الوصول */}
    <div>
      <h4 className="font-semibold text-foreground mb-2">متى يمكنني الوصول إلى التقويم؟</h4>
      <div className="space-y-2">
        {[
          { step: '١', label: 'مرحلة البذرة',  cond: 'أضف فكرتك الأولى' },
          { step: '٢', label: 'مرحلة الإنبات', cond: 'احصل على نقاط تحقق ٧٥ أو أكثر' },
          { step: '٣', label: 'مرحلة التجذر',  cond: 'أكمل ٨٠٪ من مهام مشوار الـ ٩٠ يوم' },
        ].map(({ step, label, cond }) => (
          <div key={step} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card flex-row-reverse">
            <div className="w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0">{step}</div>
            <div className="flex-1 text-right">
              <span className="font-medium text-sm">{label}</span>
              <span className="text-muted-foreground text-sm"> — {cond}</span>
            </div>
          </div>
        ))}
      </div>
    </div>

    {/* النتيجة */}
    <div>
      <h4 className="font-semibold text-foreground mb-2">النتيجة النهائية</h4>
      <p className="text-sm text-muted-foreground mb-3">تقويم البذرة يمنحك نتيجة من ١٠٠ تُحدد مستوى فكرتك وجاهزيتها للتمويل.</p>
      <h4 className="font-semibold text-foreground mb-2">ماذا تعني النتيجة؟</h4>
      <div className="space-y-2">
        {[
          { range: '٨٠+',        emoji: '🍎', label: 'مثمر',       sub: 'ممتاز جاهز للتمويل — يدخل المشتل 🪴', color: 'bg-green-50 border-green-200 text-green-800' },
          { range: '٥٠–٧٩',     emoji: '🌿', label: 'متجذر',      sub: 'جيد جداً - يحتاج تطوير إضافي',        color: 'bg-amber-50 border-amber-200 text-amber-800' },
          { range: 'أقل من ٥٠', emoji: '🌱', label: 'بذرة ضعيفة', sub: 'مبكر - واصل البناء',                  color: 'bg-red-50 border-red-200 text-red-800' },
        ].map(r => (
          <div key={r.range} className={`flex items-center gap-3 p-3 rounded-xl border flex-row-reverse ${r.color}`}>
            <span className="text-xl shrink-0">{r.emoji}</span>
            <div className="flex-1 text-right">
              <span className="font-bold text-sm">{r.range}</span>
              <span className="font-semibold text-sm"> — {r.label}: </span>
              <span className="text-sm opacity-80">{r.sub}</span>
            </div>
          </div>
        ))}
      </div>
    </div>

    <div className="rounded-xl p-4 flex items-start gap-3 flex-row-reverse bg-primary/5 border border-primary/20">
      <span className="text-lg shrink-0">🪴</span>
      <p className="text-sm leading-relaxed" style={{ color: 'var(--green-brand)' }}>
        المثمر 🍎 يظهر للمستثمرين: <strong>اسم البراند + القطاع + العائد المتوقع على الاستثمار (IRO) + نقطة التعادل</strong> فقط.
        باقي التفاصيل تُكشف بعد موافقتك على التواصل.
      </p>
    </div>

    <div className="flex items-start gap-3 p-4 rounded-xl border border-amber-200 bg-amber-50 flex-row-reverse">
      <Star className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
      <p className="text-sm text-amber-800">
        يمكنك <strong>إعادة التقييم</strong> في أي وقت بعد تعديل بيانات الفكرة. كل إعادة تقييم تُخزَّن بإصدار جديد حتى تتابع تطورك.
      </p>
    </div>

    <Link
      href="/ideas"
      className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm transition-all text-white"
      style={{ background: 'var(--green-brand)' }}
    >
      ابدأ تقويم فكرتك
      <ArrowLeft className="w-4 h-4" />
    </Link>
  </div>
);

const InvestorContactAnswer = () => (
  <div className="space-y-5 text-right" dir="rtl">
    <p className="text-sm text-muted-foreground leading-relaxed">
      التواصل في المشتل يتم بـ <span className="font-semibold text-foreground">٣ خطوات</span> لحماية الطرفين:
    </p>

    <div className="space-y-3">
      {[
        {
          num: '١', title: 'تصفّح البذور',
          body: 'ادخل المشتل واستعرض بطاقات البذور المثمرة 🍎. كل بطاقة تعرض: اسم المشروع، القطاع، العائد المتوقع على الاستثمار (IRO)، ونقطة التعادل.',
          color: 'border-green-200 bg-green-50',
          badge: 'bg-green-100 text-green-700',
        },
        {
          num: '٢', title: 'طلب التواصل',
          body: 'اضغط "طلب التواصل مع المؤسس" على البذرة التي تهمّك.',
          color: 'border-blue-200 bg-blue-50',
          badge: 'bg-blue-100 text-blue-700',
        },
        {
          num: '٣', title: 'موافقة المؤسس',
          body: 'يصل طلبك للمؤسس. إذا وافق، تتم ثلاثة أمور:',
          color: 'border-amber-200 bg-amber-50',
          badge: 'bg-amber-100 text-amber-700',
          bullets: [
            'تُفتح محادثة خاصة داخل المنصة',
            'يُرسل إليك ملف البذرة الكامل',
            'تُتاح بيانات التواصل المباشر',
          ],
        },
      ].map(({ num, title, body, color, badge, bullets }) => (
        <div key={num} className={`flex items-start gap-3 p-4 rounded-xl border ${color} flex-row-reverse`}>
          <div className={`w-7 h-7 rounded-full text-xs font-bold flex items-center justify-center shrink-0 ${badge}`}>{num}</div>
          <div className="flex-1 text-right">
            <p className="font-semibold text-sm mb-0.5 text-foreground">{title}</p>
            <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
            {bullets && (
              <ul className="mt-2 space-y-1">
                {bullets.map(b => (
                  <li key={b} className="text-sm text-muted-foreground flex items-center gap-2 flex-row-reverse justify-end">
                    <span>✅</span>{b}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ))}
    </div>

    <div className="rounded-xl p-4 flex items-start gap-3 flex-row-reverse bg-yellow-100/20 border border-yellow-300/30">
      <span className="text-lg shrink-0">⚖️</span>
      <div className="text-right">
        <p className="font-semibold text-sm mb-1" style={{ color: 'var(--gold)' }}>ملاحظة مهمة</p>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--gray-mid)' }}>
          بذرة لا تتدخل في أي صفقة ولا تأخذ عمولة. دورنا يقتصر على ربط المؤسس بالمستثمر المناسب.
          لأصحاب <strong>اشتراك المستثمر المميز</strong>: طلباتكم تُعرض على المؤسس أولاً، مع التزام بالرد خلال ٤٨ ساعة.
        </p>
      </div>
    </div>

    <Link
      href="/greenhouse"
      className="inline-flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-sm transition-all text-white"
      style={{ background: 'var(--green-brand)' }}
    >
      <span>🪴</span>
      تصفح المشتل
    </Link>
  </div>
);

const faqSections: FaqSection[] = [
  {
    title: 'أسئلة رواد الأعمال',
    emoji: '🌱',
    items: [
      { q: 'ما هي منصة بذرة؟', a: 'بذرة هي منصة تسريع أعمال مبنية لرواد الأعمال الناطقين بالعربية في كل مكان. تساعدك على التحقق من فكرتك التجارية بالسرعة التي تناسبك، متابعة تقدمك، الحصول على تدريب بالذكاء الاصطناعي، والبقاء محاسباً مع زملائك.' },
      { q: 'ما هي مراحل الشركة الناشئة؟', a: 'تستخدم بذرة ٥ مراحل: الفكرة (استكشاف الفكرة)، التحقق (إثبات الطلب)، البناء (إنشاء المنتج/الخدمة)، الإطلاق (أول عملاء حقيقيين)، والنمو (التوسع). انقل أفكارك عبر المراحل كلما تقدمت.' },
      { q: 'كيف أضيف فكرة مشروع؟', a: 'اذهب إلى "أفكاري" في القائمة وانقر على "فكرة جديدة". أدخل العنوان والوصف والقطاع (التقنية، التجارة، الصحة، التعليم، الغذاء، الخدمات، وغيرها) والمرحلة. يمكنك تعديل أو حذف الأفكار في أي وقت.' },
      { q: 'ما هي القيمة المقترحة وكيف يمكن صياغتها؟', a: <ValuePropositionAnswer /> },
      { q: 'ما هو التحقق وكيف أتتبعه؟', a: 'التحقق هو عملية إثبات أن فكرتك تلبي طلباً حقيقياً قبل الاستثمار الكبير في بنائها. في متتبع التحقق، تسجّل مقابلات العملاء والتسجيلات الإلكترونية والطلبات المسبقة لكل فكرة. استهدف ١٠ مقابلات على الأقل و٣ طلبات مسبقة قبل الانتقال إلى مرحلة البناء.' },
      { q: 'ما هي مجموعة المساءلة؟', a: (
        <div className="space-y-4 text-right" dir="rtl">
          <p className="text-sm leading-relaxed text-muted-foreground">
            مجموعة المساءلة هي حلقة دعم مصغّرة تضم من ٣ إلى ٥ رواد أعمال من مستخدمي بذرة. يهدف أعضاء المجموعة إلى متابعة التقدم اليومي لبعضهم البعض عبر خاصية &ldquo;سلسلة الأيام المتتالية&rdquo;.
          </p>
          <div>
            <h4 className="font-semibold text-sm text-foreground mb-3">كيف تعمل؟</h4>
            <div className="space-y-2">
              {[
                'تنشئ مجموعة وتحصل على رابط دعوة فريد.',
                'تدعو ٢–٤ رواد أعمال تثق بهم للانضمام.',
                'النظام يظهر سلسلة أيام كل عضو للمجموعة لخلق دافع للالتزام.',
              ].map((step, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg border border-border bg-card flex-row-reverse">
                  <div className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{i + 1}</div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{step}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="flex items-start gap-3 p-4 rounded-xl border border-green-200 bg-green-50 flex-row-reverse">
            <span className="text-lg shrink-0">📊</span>
            <p className="text-sm text-green-800 leading-relaxed">
              <strong>الفائدة الأساسية:</strong> الدراسات تشير إلى أن رواد الأعمال الذين يعملون ضمن مجموعات مساءلة نسبة استمرارهم أعلى بـ ٦٥٪ من الذين يعملون بمفردهم.
            </p>
          </div>
        </div>
      ) },
      { q: 'كيف يعمل تقويم البذرة؟', a: <ScoreSystemAnswer /> },
      { q: 'من هو المدرب الذكي في بذرة؟', a: (
        <div className="space-y-4 text-right" dir="rtl">
          <p className="text-sm leading-relaxed text-muted-foreground">
            المدرب الذكي هو رفيقك الاستشاري المتخصص في السوق السوري. اطرح عليه استفساراتك حول:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {[
              'اختبار فكرتك',
              'اكتشاف عملائك الأوائل',
              'تحديد السعر المناسب',
              'وضع خطة تسويق فعالة',
              'بناء نموذج عمل مربح',
            ].map((item) => (
              <div key={item} className="flex items-center gap-2 p-2.5 rounded-lg border border-border bg-card flex-row-reverse">
                <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                <span className="text-sm text-foreground">{item}</span>
              </div>
            ))}
          </div>
          <div className="flex items-start gap-3 p-4 rounded-xl border border-green-200 bg-green-50 flex-row-reverse">
            <span className="text-lg shrink-0">🤖</span>
            <p className="text-sm text-green-800 leading-relaxed">
              يتحدث العربية بطلاقة، وخبرته مصممة خصيصاً لمساعدة رواد الأعمال على النجاح رغم تحديات الموارد والميزانيات المحدودة.
            </p>
          </div>
        </div>
      ) },
      { q: 'هل بياناتي خاصة وآمنة؟', a: 'نعم. بياناتك مشفّرة ومحمية بأعلى معايير الأمان. أفكارك ومحادثاتك وبيانات التحقق مرئية لك وحدك — حتى فريقنا لا يمكنه الاطلاع على أفكارك. بيانات المجموعة تُشارك فقط مع أعضاء مجموعتك. لا نبيع بياناتك أبداً.' },
    ],
  },
  {
    title: 'أسئلة المستثمرين',
    emoji: '🪴',
    items: [
      { q: 'كيف أتواصل مع المؤسس؟', a: <InvestorContactAnswer /> },
      { q: 'كيف أتصفح المشاريع المتاحة؟', a: 'بعد تسجيل الدخول كمستثمر، توجّه إلى صفحة "معرض البذور". ستجد بطاقات المشاريع مرتبة حسب القطاع والتقييم. يمكنك التصفية حسب القطاع، العائد المتوقع، ونقطة التعادل.' },
      { q: 'ما المعلومات التي أراها قبل التواصل؟', a: 'قبل موافقة المؤسس على التواصل، تظهر لك: اسم البراند، القطاع، العائد المتوقع على الاستثمار (IRO)، ونقطة التعادل فقط. باقي التفاصيل تُكشف بعد الموافقة المتبادلة.' },
      { q: 'هل هناك رسوم على المستثمرين؟', a: 'التصفح والتواصل الأساسي مجاني. اشتراك المستثمر المميز يمنحك أولوية الرد خلال ٤٨ ساعة وإمكانية الوصول المبكر لأفضل الفرص قبل نشرها للعموم.' },
      { q: 'ما معايير اختيار المشاريع المعروضة في المشتل؟', a: 'لا يُعرض في المشتل إلا المشاريع التي حصلت على تقويم بذرة ٨٠ نقطة أو أكثر من ١٠٠، وأكملت مشوار النمو، وأبدى صاحبها موافقته الصريحة على العرض للمستثمرين. هذا يضمن أن كل فرصة أمامك قد اجتازت اختبارات صارمة.' },
    ],
  },
];

const sections = [
  { icon: Lightbulb, title: 'أفكاري', href: '/ideas', desc: 'أضف وتتبع وأدر أفكار شركتك الناشئة' },
  { icon: BarChart2, title: 'التحقق', href: '/validation', desc: 'سجّل المقابلات والتسجيلات والطلبات المسبقة' },
  { icon: MessageSquare, title: 'المدرب الذكي', href: '/chat', desc: 'احصل على توجيه متخصص بالعربية' },
  { icon: Users, title: 'مجموعات المساءلة', href: '/pods', desc: 'بنِ عادات المساءلة مع زملائك' },
];

export default function HelpPage() {
  const router = useRouter();
  const [openFaq, setOpenFaq] = useState<string | null>(null);

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-8" dir="rtl">
      {/* Header */}
      <div className="flex flex-col items-end gap-3">
        <div className="flex items-center gap-3 flex-row-reverse">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <HelpCircle className="w-5 h-5 text-primary" />
          </div>
          <div className="text-right">
            <h1 className="text-2xl font-bold">مركز المساعدة</h1>
            <p className="text-muted-foreground text-sm">كل ما تحتاج لمعرفته عن منصة بذرة</p>
          </div>
        </div>
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-lg border border-border hover:bg-secondary transition-colors text-muted-foreground shrink-0 flex-row-reverse"
        >
          <ArrowLeft className="w-4 h-4 rotate-180" />
          العودة للخلف
        </button>
      </div>

      {/* Quick links */}
      <div>
        <h2 className="text-base font-semibold mb-3 text-right">روابط سريعة</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {sections.map(({ icon: Icon, title, href, desc }) => (
            <Link
              key={href}
              href={href}
              className="flex items-start gap-3 p-4 bg-card rounded-xl border border-border hover:border-primary/40 hover:shadow-sm transition-all group flex-row-reverse text-right"
            >
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Icon className="text-primary" style={{ width: 18, height: 18 }} />
              </div>
              <div>
                <div className="font-medium text-sm group-hover:text-primary transition-colors">{title}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{desc}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* FAQ — sectioned */}
      <div className="space-y-6">
        <h2 className="text-base font-semibold text-right">الأسئلة الشائعة</h2>
        {faqSections.map((section) => (
          <div key={section.title}>
            {/* Section header */}
            <div className="flex items-center gap-2 flex-row-reverse mb-3">
              <span className="text-lg">{section.emoji}</span>
              <h3 className="text-sm font-bold" style={{ color: 'var(--text-dark)' }}>{section.title}</h3>
              <div className="flex-1 h-px" style={{ background: 'var(--gray-light)' }} />
            </div>
            <div className="space-y-2">
              {section.items.map((faq, i) => {
                const key = `${section.title}-${i}`;
                const isOpen = openFaq === key;
                const isRich = typeof faq.a !== 'string';
                return (
                  <div key={key} className="bg-card rounded-xl border border-border overflow-hidden">
                    <button
                      onClick={() => setOpenFaq(isOpen ? null : key)}
                      className="w-full flex items-center justify-between gap-3 p-4 hover:bg-secondary/40 transition-colors flex-row-reverse"
                    >
                      <span className="font-medium text-sm text-right">{faq.q}</span>
                      {isOpen
                        ? <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" />
                        : <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                      }
                    </button>
                    {isOpen && (
                      <div className={`border-t border-border ${isRich ? 'px-5 pt-5 pb-6' : 'px-4 pb-4 pt-3'} text-sm text-muted-foreground leading-relaxed text-right`}>
                        {faq.a}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Contact */}
      <div className="bg-primary/5 border border-primary/20 rounded-xl p-5">
        <div className="flex items-start gap-3 flex-row-reverse">
          <Mail className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <div className="text-right">
            <h3 className="font-semibold text-sm mb-1">هل تحتاج مزيداً من المساعدة؟</h3>
            <p className="text-sm text-muted-foreground mb-3">تواصل مع فريق Life Easy LLC وسنرد خلال ٢٤ ساعة.</p>
            <a
              href="mailto:lifeeasy2224@gmail.com"
              className="inline-flex items-center gap-1.5 text-sm text-primary font-medium hover:underline"
            >
              lifeeasy2224@gmail.com
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>

      <p className="text-center text-xs text-muted-foreground pb-2">
        © ٢٠٢٦ Life Easy LLC — جميع الحقوق محفوظة
      </p>
    </div>
  );
}
