'use client';

import Link from 'next/link';
import { Shield, Lock, FileText, Trash2, Scale, Eye, Mail, ArrowRight } from 'lucide-react';

const sections = [
  {
    icon: Lock,
    title: '١. ملكيتك الكاملة ١٠٠٪',
    content: [
      { heading: '١.١ فكرتك ملكك وحدك', body: 'جميع الأفكار ونماذج الأعمال والمحتوى الذي تُنشئه على منصة بذرة هي ملكيتك الفكرية الحصرية. لا تنقل بذرة أو Life Easy LLC أي حقوق ملكية لهذه المواد بأي شكل من الأشكال.' },
      { heading: '١.٢ الترخيص المحدود', body: 'بقبولك هذه الاتفاقية، تمنح بذرة ترخيصاً محدوداً وغير حصري لمعالجة بياناتك بالقدر اللازم فقط لتقديم الخدمة. هذا الترخيص ينتهي تلقائياً عند حذف بياناتك أو إغلاق حسابك.' },
    ],
  },
  {
    icon: Shield,
    title: '٢. التزاماتنا القانونية',
    content: [
      { heading: '٢.١ عدم الاستخدام', body: 'نلتزم قانونياً بعدم استخدام أفكارك أو تطويرها أو الاستفادة منها تجارياً بأي طريقة خارج نطاق تقديم الخدمة لك مباشرة.' },
      { heading: '٢.٢ عدم النسخ', body: 'لن ننسخ أو نعيد إنتاج أو نوزع أيًا من أفكارك أو نماذج أعمالك لأي طرف ثالث تحت أي ظرف.' },
      { heading: '٢.٣ عدم المشاركة', body: 'بياناتك وأفكارك محمية بموجب سياسة صارمة للسرية. لا يحق لأي موظف أو متعاقد مع بذرة الاطلاع عليها أو مناقشتها خارج نطاق الدعم التقني الضروري — باستثناء المعلومات التي توافق صراحةً على عرضها في المشتل (اسم المشروع والقطاع والعائد المتوقع ونقطة التعادل فقط).' },
    ],
  },
  {
    icon: Lock,
    title: '٣. الحماية التقنية',
    content: [
      { heading: '٣.١ التشفير الكامل', body: 'جميع الأفكار والبيانات مشفرة أثناء النقل وأثناء التخزين. نستخدم معايير تشفير AES-256 لحماية بياناتك.' },
      { heading: '٣.٢ عزل البيانات', body: 'بياناتك معزولة تقنياً عن بيانات المستخدمين الآخرين. كل مستخدم لا يصل إلا إلى بياناته المصرح له بها فقط.' },
      { heading: '٣.٣ وصول محدود', body: 'حتى فريقنا الهندسي لا يملك وصولاً مباشراً لمحتوى أفكارك. الوصول مقيد بالحد الأدنى الضروري للصيانة التقنية فقط.' },
    ],
  },
  {
    icon: Eye,
    title: '٤. الشفافية الكاملة',
    content: [
      { heading: '٤.١ لا نستخدم أفكارك لتدريب الذكاء الاصطناعي', body: 'لن نستخدم أفكارك أو بيانات مشروعك لتدريب أي نموذج ذكاء اصطناعي سواء الخاص بنا أو أي طرف ثالث. عند استخدام المدرب الذكي، تُرسل استفساراتك فقط (وليس بيانات فكرتك) إلى مزود الذكاء الاصطناعي لمعالجتها آنياً. لا تُخزَّن هذه البيانات لدى المزود ولا تُستخدم لتدريب نماذجه وفقاً لاتفاقية معالجة البيانات المبرمة معه.' },
      { heading: '٤.٢ الإفصاح عن مزودي الخدمة', body: 'نستخدم Supabase لتخزين البيانات وهم ملتزمون بمعايير SOC 2 Type II للأمان. لا يملكون أي حقوق على محتوى بياناتك.' },
    ],
  },
  {
    icon: Trash2,
    title: '٥. حقك في الحذف الكامل',
    content: [
      { heading: '٥.١ حذف فوري', body: 'يمكنك حذف أي فكرة أو مشروع نهائياً من المنصة بضغطة زر واحدة. يُحذف المحتوى فوراً من قاعدة البيانات.' },
      { heading: '٥.٢ حذف الحساب الكامل', body: 'يمكنك حذف حسابك وجميع بياناتك نهائياً مباشرة من صفحة الخصوصية بضغطة زر — لا حاجة لمراسلة البريد الإلكتروني. سيُعالَج الطلب فوراً.' },
      { heading: '٥.٣ لا نسخ احتياطية دائمة', body: 'بعد حذف حسابك، تُحذف بياناتك من النسخ الاحتياطية خلال ٣٠ يوماً.' },
    ],
  },
  {
    icon: Scale,
    title: '٦. الإطار القانوني',
    content: [
      { heading: '٦.١ القانون المطبق', body: 'تخضع هذه الاتفاقية لقوانين الملكية الفكرية في الولايات المتحدة الأمريكية وولاية أريزونا تحديداً. في حال وجود نزاع يتعلق بالملكية الفكرية، يحق لك اتخاذ الإجراءات القانونية المناسبة.' },
      { heading: '٦.٢ الأدلة الرقمية', body: 'نحتفظ بسجلات زمنية موثقة لإنشاء أفكارك على المنصة، يمكن استخدامها كدليل قانوني على أسبقيتك في تسجيل الفكرة عند الحاجة.' },
    ],
  },
  {
    icon: FileText,
    title: '٧. الإجابة على السؤال الأهم',
    content: [
      { heading: 'هل يمكنكم سرقة فكرتي؟', body: 'مستحيل. تقنياً: البيانات مشفرة ولا نصل إليها. قانونياً: نوافق على عدم الاستخدام. عملياً: نموذج عملنا يعتمد على ثقتك — لو سرقنا فكرة واحدة نخسر كل المنصة. فكرتك لك وحدك.' },
    ],
  },
];

export default function IPPolicyPage() {
  return (
    <div className="min-h-screen bg-background">
    <div className="p-6 max-w-3xl mx-auto space-y-8 pb-12" dir="rtl">
      {/* Back link */}
      <div className="flex justify-end">
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          العودة للرئيسية
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
      {/* Header */}
      <div className="flex items-center gap-3 flex-row-reverse">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Shield className="w-5 h-5 text-primary" />
        </div>
        <div className="text-right">
          <h1 className="text-2xl font-bold">سياسة حماية الملكية الفكرية</h1>
          <p className="text-muted-foreground text-sm">آخر تحديث: مايو ٢٠٢٦ · Life Easy LLC · بذرة</p>
        </div>
      </div>

      {/* Intro */}
      <div className="bg-primary/5 border border-primary/20 rounded-xl p-5 text-sm leading-relaxed text-right">
        في بذرة، نؤمن بمبدأ واحد لا نحيد عنه: <strong>فكرتك ملكك وحدك، دائماً وأبداً.</strong> هذه السياسة تشرح بالتفصيل كيف نحمي ملكيتك الفكرية من الناحيتين التقنية والقانونية.
      </div>

      {/* Sections */}
      {sections.map(({ icon: Icon, title, content }) => (
        <div key={title} className="bg-card rounded-xl border border-border p-5 space-y-4">
          <div className="flex items-center gap-2.5 flex-row-reverse">
            <Icon className="text-primary shrink-0" style={{ width: 18, height: 18 }} />
            <h2 className="font-semibold">{title}</h2>
          </div>
          <div className="space-y-3">
            {content.map(({ heading, body }) => (
              <div key={heading} className="text-right">
                <div className="text-sm font-medium mb-0.5">{heading}</div>
                <div className="text-sm text-muted-foreground leading-relaxed">{body}</div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* Contact */}
      <div className="bg-primary/5 border border-primary/20 rounded-xl p-5">
        <div className="flex items-start gap-3 flex-row-reverse">
          <Mail className="w-5 h-5 text-primary shrink-0 mt-0.5" />
          <div className="text-right">
            <h3 className="font-semibold text-sm mb-1">تواصل معنا</h3>
            <p className="text-sm text-muted-foreground mb-2">لأي أسئلة تتعلق بحماية ملكيتك الفكرية:</p>
            <a href="mailto:lifeeasy2224@gmail.com" className="text-sm text-primary font-medium hover:underline">
              lifeeasy2224@gmail.com
            </a>
          </div>
        </div>
      </div>

      <div className="text-center text-xs text-muted-foreground pb-2">
        © ٢٠٢٦ Life Easy LLC — جميع الحقوق محفوظة · بذرة™ علامة تجارية لشركة Life Easy LLC
      </div>
    </div>
    </div>
  );
}
