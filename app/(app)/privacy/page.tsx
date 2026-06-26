'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Shield, Lock, FileText, Database, Trash2, Scale, Eye, Mail, Download, ArrowRight, TriangleAlert as AlertTriangle, Bot } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';

function ExportDataButton() {
  const { supaUser } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  async function handleExport() {
    if (!supaUser) return;
    setLoading(true);
    try {
      const [{ data: ideas }, { data: tasks }] = await Promise.all([
        supabase.from('ideas').select('*').eq('user_id', supaUser.id),
        supabase.from('tasks').select('*').eq('user_id', supaUser.id),
      ]);

      const payload = {
        exported_at: new Date().toISOString(),
        user_id: supaUser.id,
        email: supaUser.email,
        ideas: ideas ?? [],
        tasks: tasks ?? [],
      };

      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bethrh-data-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: 'تم تصدير البيانات بنجاح' });
    } catch {
      toast({ title: 'فشل تصدير البيانات', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleExport}
      disabled={loading}
      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-secondary text-secondary-foreground text-sm font-medium hover:bg-secondary/80 transition disabled:opacity-60"
    >
      {loading ? (
        <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
      ) : (
        <Download className="w-4 h-4" />
      )}
      Export Data (JSON)
    </button>
  );
}

function DeleteAccountButton() {
  const { supaUser } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const [confirm, setConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    if (!supaUser) return;
    setLoading(true);
    try {
      await supabase.from('ideas').delete().eq('user_id', supaUser.id);
      await supabase.from('tasks').delete().eq('user_id', supaUser.id);
      await supabase.from('users').delete().eq('id', supaUser.id);
      await supabase.auth.signOut();
      router.replace('/');
    } catch {
      toast({ title: 'فشل حذف الحساب. راسل lifeeasy2224@gmail.com', variant: 'destructive' });
      setLoading(false);
    }
  }

  if (!confirm) {
    return (
      <button
        onClick={() => setConfirm(true)}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-destructive/40 text-destructive text-sm font-medium hover:bg-destructive/5 transition"
      >
        <Trash2 className="w-4 h-4" />
        حذف حسابي نهائياً
      </button>
    );
  }

  return (
    <div className="bg-destructive/5 border border-destructive/30 rounded-xl p-4 space-y-3">
      <div className="flex items-start gap-2 flex-row-reverse">
        <AlertTriangle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
        <p className="text-sm text-destructive font-medium text-right">
          سيتم حذف جميع أفكارك ومهامك وبيانات حسابك بشكل دائم. لا يمكن التراجع عن هذا الإجراء.
        </p>
      </div>
      <div className="flex gap-2 justify-end">
        <button
          onClick={() => setConfirm(false)}
          className="px-3 py-1.5 text-sm rounded-lg border border-border hover:bg-secondary transition"
        >
          إلغاء
        </button>
        <button
          onClick={handleDelete}
          disabled={loading}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90 transition disabled:opacity-60"
        >
          {loading ? (
            <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : (
            <Trash2 className="w-3.5 h-3.5" />
          )}
          نعم، احذف كل شيء
        </button>
      </div>
    </div>
  );
}

const arabicSections = [
  {
    icon: Shield,
    title: '١. مبدأ الخصوصية الأساسي',
    content: [
      {
        heading: 'أفكارك ملكك وحدك',
        body: 'أفكارك ونتائج تحليلها ومحتوى مسوداتك خاصة بك وحدك. لا يمكن لأي مستخدم آخر على المنصة الاطلاع عليها أو الوصول إليها تحت أي ظرف.',
      },
      {
        heading: 'حماية على مستوى قاعدة البيانات',
        body: 'نستخدم نظام حماية متقدماً يضمن عزل بيانات كل مستخدم عن الآخرين بشكل كامل — بياناتك معزولة تقنياً ولا يصل إليها إلا أنت.',
      },
    ],
  },
  {
    icon: Eye,
    title: '٢. نطاق وصول فريق بذرة',
    content: [
      {
        heading: 'الدعم الفني',
        body: 'عند تواصلك مع فريق الدعم وطلبك المساعدة بشكل صريح لحل مشكلة تقنية في حسابك أو في إحدى أفكارك.',
      },
      {
        heading: 'تحسين الخدمة وتطويرها',
        body: 'لغرض تطوير خوارزميات التقييم والتحليل. يتم ذلك على بيانات مجمعة ومجهولة المصدر دون ربط أي فكرة بهوية صاحبها.',
      },
      {
        heading: 'الأمان ومنع إساءة الاستخدام',
        body: 'للتحقق من الالتزام بشروط الاستخدام ومنع المحتوى غير القانوني، وذلك بعد تلقي بلاغ موثوق.',
      },
      {
        heading: 'الصيانة التقنية',
        body: 'لأغراض إدارة قواعد البيانات والنسخ الاحتياطي الدوري وضمان استقرار وأمان المنصة.',
      },
    ],
  },
  {
    icon: Lock,
    title: '٣. تعهداتنا الصارمة والملزمة',
    content: [
      {
        heading: 'لا للبيع أو المشاركة',
        body: 'نتعهد قانونياً بعدم بيع أفكارك أو تأجيرها أو مشاركتها مع أي طرف ثالث لأغراض تسويقية أو تجارية أو بحثية.',
      },
      {
        heading: 'لا للاستخدام العلني',
        body: 'لن نستخدم محتوى أفكارك التفصيلي في تدريب نماذج الذكاء الاصطناعي العامة، أو في مواد تسويقية، أو دراسات حالة، دون موافقتك الخطية الصريحة.',
      },
      {
        heading: 'المدرب الذكي والذكاء الاصطناعي',
        body: 'عند استخدام المدرب الذكي، تُرسل استفساراتك فقط (وليس بيانات فكرتك الكاملة) إلى مزود الذكاء الاصطناعي لمعالجتها آنياً. لا تُخزَّن هذه البيانات لدى المزود ولا تُستخدم لتدريب نماذجه وفقاً لاتفاقية معالجة البيانات المبرمة معه.',
      },
      {
        heading: 'لا للوصول غير المبرر',
        body: 'جميع عمليات وصول الفريق التقني لبيانات المستخدمين تُسجَّل في سجل تدقيق آمن. يمكنك طلب نسخة منه في أي وقت.',
      },
    ],
  },
  {
    icon: Database,
    title: '٤. حماية البيانات والتشفير',
    content: [
      {
        heading: 'التشفير أثناء النقل',
        body: 'جميع البيانات المنقولة بين جهازك وخوادمنا مشفرة باستخدام بروتوكول TLS 1.3.',
      },
      {
        heading: 'التشفير أثناء التخزين',
        body: 'يتم تشفير جميع البيانات المخزنة باستخدام معيار AES-256.',
      },
      {
        heading: 'عزل البيانات',
        body: 'نطبق سياسات أمان على مستوى قاعدة البيانات تضمن أن كل مستخدم لا يصل إلا إلى بياناته المصرح له بها فقط.',
      },
      {
        heading: 'النسخ الاحتياطي',
        body: 'يتم عمل نسخ احتياطية مشفرة بشكل يومي لضمان عدم فقدان بياناتك.',
      },
    ],
  },
  {
    icon: Scale,
    title: '٥. حقك في الوصول والتصدير',
    content: [
      {
        heading: 'الوصول',
        body: 'يمكنك طلب نسخة كاملة من جميع بياناتك المخزنة لدينا في أي وقت.',
      },
      {
        heading: 'التصدير',
        body: 'تصدير جميع أفكارك ونتائجها بصيغة JSON باستخدام زر "تصدير البيانات" أدناه.',
      },
    ],
  },
  {
    icon: Trash2,
    title: '٦. حق الحذف — بضغطة زر',
    content: [
      {
        heading: 'حذف الحساب الكامل',
        body: 'يمكنك حذف حسابك وجميع بياناتك نهائياً بضغطة زر مباشرة من هذه الصفحة. لا حاجة لمراسلة البريد الإلكتروني.',
      },
      {
        heading: 'مدة المعالجة',
        body: 'تُحذف بياناتك فوراً من قاعدة البيانات، وتُحذف من النسخ الاحتياطية خلال ٣٠ يوماً.',
      },
    ],
  },
  {
    icon: Shield,
    title: '٧. ملفات تعريف الارتباط (كوكيز)',
    content: [
      {
        heading: 'الكوكيز الضرورية',
        body: 'نستخدم كوكيز جلسة تسجيل الدخول الضرورية لعمل المنصة. لا يمكن إيقافها لأنها أساسية للخدمة.',
      },
      {
        heading: 'كوكيز التحليل (Google Analytics)',
        body: 'نستخدم Google Analytics لفهم كيفية استخدام المنصة. تُفعَّل هذه الكوكيز فقط بعد موافقتك الصريحة عبر شريط الموافقة. البيانات مجهولة الهوية ولا تُستخدم لأغراض إعلانية.',
      },
      {
        heading: 'إدارة الكوكيز',
        body: 'يمكنك تغيير تفضيلاتك في أي وقت من صفحة إدارة الكوكيز، أو من إعدادات متصفحك.',
      },
    ],
  },
  {
    icon: FileText,
    title: '٨. الحد الأدنى للعمر والأطفال',
    content: [
      {
        heading: 'العمر المطلوب',
        body: 'المنصة مخصصة للمستخدمين الذين تجاوزوا ١٦ عاماً. لا نجمع عمداً بيانات من الأطفال دون هذا السن.',
      },
    ],
  },
  {
    icon: FileText,
    title: '٩. التعديلات على سياسة الخصوصية',
    content: [
      {
        heading: 'الإشعار المسبق',
        body: 'قد نُحدِّث هذه السياسة من وقت لآخر. سنُشعرك بأي تغييرات جوهرية عبر البريد الإلكتروني أو إشعار داخل المنصة قبل ٣٠ يوماً من سريان التعديل.',
      },
    ],
  },
];

export default function PrivacyPage() {
  return (
    <div className="p-6 max-w-3xl mx-auto space-y-10 pb-16">

      {/* Back link */}
      <div className="flex justify-end">
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          العودة للرئيسية
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* ── English Section (GDPR) ── */}
      <div className="space-y-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Privacy Policy</h1>
            <p className="text-muted-foreground text-sm">Last updated: May 21, 2026 · bethrh.co</p>
          </div>
        </div>

        <div className="bg-primary/5 border border-primary/20 rounded-xl p-5 text-sm leading-relaxed space-y-1">
          <p><strong>Data Controller:</strong> Life Easy LLC, operating bethrh.co</p>
          <p><strong>Contact:</strong>{' '}
            <a href="mailto:lifeeasy2224@gmail.com" className="text-primary hover:underline">lifeeasy2224@gmail.com</a>
          </p>
          <p><strong>Jurisdiction:</strong> Life Easy LLC is registered in the United States. We serve users globally (MENA, EU, US). For US users, we comply with applicable state privacy laws including CCPA. For EU users, we comply with GDPR.</p>
        </div>

        {/* Section 1 */}
        <div className="bg-card rounded-xl border border-border p-5 space-y-4">
          <div className="flex items-center gap-2.5">
            <Eye className="text-primary shrink-0" style={{ width: 18, height: 18 }} />
            <h2 className="font-semibold">1. What Data We Collect</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-border rounded-lg overflow-hidden">
              <thead>
                <tr className="bg-muted/50">
                  <th className="text-right px-3 py-2 border-b border-border font-medium">Data</th>
                  <th className="text-right px-3 py-2 border-b border-border font-medium">Purpose</th>
                  <th className="text-right px-3 py-2 border-b border-border font-medium">Legal Basis (GDPR Art.6)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <tr>
                  <td className="px-3 py-2 text-muted-foreground">Email address</td>
                  <td className="px-3 py-2 text-muted-foreground">Account creation, login, support</td>
                  <td className="px-3 py-2 text-muted-foreground">Art. 6.1(b) — Contract</td>
                </tr>
                <tr>
                  <td className="px-3 py-2 text-muted-foreground">Ideas & Tasks content</td>
                  <td className="px-3 py-2 text-muted-foreground">Core app functionality</td>
                  <td className="px-3 py-2 text-muted-foreground">Art. 6.1(b) — Contract</td>
                </tr>
                <tr>
                  <td className="px-3 py-2 text-muted-foreground">AI Coach queries</td>
                  <td className="px-3 py-2 text-muted-foreground">Real-time AI coaching (query only, not stored)</td>
                  <td className="px-3 py-2 text-muted-foreground">Art. 6.1(b) — Contract</td>
                </tr>
                <tr>
                  <td className="px-3 py-2 text-muted-foreground">Usage logs, IP address</td>
                  <td className="px-3 py-2 text-muted-foreground">Security, abuse prevention</td>
                  <td className="px-3 py-2 text-muted-foreground">Art. 6.1(f) — Legitimate Interest</td>
                </tr>
                <tr>
                  <td className="px-3 py-2 text-muted-foreground">Analytics (Google)</td>
                  <td className="px-3 py-2 text-muted-foreground">Usage improvement</td>
                  <td className="px-3 py-2 text-muted-foreground">Art. 6.1(a) — Consent</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-sm text-muted-foreground">We do not collect special category data. We do not use your ideas to train AI models.</p>
        </div>

        {/* Section 2 */}
        <div className="bg-card rounded-xl border border-border p-5 space-y-3">
          <div className="flex items-center gap-2.5">
            <Lock style={{ width: 18, height: 18 }} className="text-primary shrink-0" />
            <h2 className="font-semibold">2. How We Protect Your Data</h2>
          </div>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p><strong className="text-foreground">Encryption:</strong> All data is encrypted in transit (TLS 1.3) and at rest (AES-256).</p>
            <p><strong className="text-foreground">Data Isolation:</strong> Every database query is filtered by user identity at database level. No user or employee can access your ideas through the app interface.</p>
            <p><strong className="text-foreground">Access Control:</strong> Full database access requires the service-role key, restricted to system administrators for emergency maintenance only.</p>
            <p><strong className="text-foreground">AI Coach:</strong> Only your current query is sent to the AI provider for real-time processing. Your idea content is not transmitted. The provider does not store or train on these queries per our data processing agreement.</p>
          </div>
        </div>

        {/* Section 3 */}
        <div className="bg-card rounded-xl border border-border p-5 space-y-4">
          <div className="flex items-center gap-2.5">
            <FileText style={{ width: 18, height: 18 }} className="text-primary shrink-0" />
            <h2 className="font-semibold">3. Data Sharing & Sub-Processors</h2>
          </div>
          <p className="text-sm text-muted-foreground">We do not sell your data. Sub-processors:</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border border-border rounded-lg overflow-hidden">
              <thead>
                <tr className="bg-muted/50">
                  <th className="text-right px-3 py-2 border-b border-border font-medium">Processor</th>
                  <th className="text-right px-3 py-2 border-b border-border font-medium">Purpose</th>
                  <th className="text-right px-3 py-2 border-b border-border font-medium">Location</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <tr>
                  <td className="px-3 py-2 text-muted-foreground">Supabase Inc.</td>
                  <td className="px-3 py-2 text-muted-foreground">Database, auth, hosting</td>
                  <td className="px-3 py-2 text-muted-foreground">USA — EU SCCs in place</td>
                </tr>
                <tr>
                  <td className="px-3 py-2 text-muted-foreground">Google LLC</td>
                  <td className="px-3 py-2 text-muted-foreground">Analytics (consent-gated)</td>
                  <td className="px-3 py-2 text-muted-foreground">USA — EU SCCs in place</td>
                </tr>
                <tr>
                  <td className="px-3 py-2 text-muted-foreground">Netlify Inc.</td>
                  <td className="px-3 py-2 text-muted-foreground">CDN & hosting</td>
                  <td className="px-3 py-2 text-muted-foreground">USA — EU SCCs in place</td>
                </tr>
                <tr>
                  <td className="px-3 py-2 text-muted-foreground">AI Provider (LLM)</td>
                  <td className="px-3 py-2 text-muted-foreground">AI Coach real-time query processing</td>
                  <td className="px-3 py-2 text-muted-foreground">USA — DPA in place</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-sm text-muted-foreground">International transfers rely on Standard Contractual Clauses approved by the EU Commission.</p>
        </div>

        {/* Section 4 — Rights + action buttons */}
        <div className="bg-card rounded-xl border border-border p-5 space-y-4">
          <div className="flex items-center gap-2.5">
            <Scale style={{ width: 18, height: 18 }} className="text-primary shrink-0" />
            <h2 className="font-semibold">4. Your Rights Under GDPR / CCPA</h2>
          </div>
          <ul className="space-y-1.5 text-sm text-muted-foreground list-none">
            {[
              ['Access', 'Request a copy of your data — available in your profile at any time.'],
              ['Rectification', 'Correct inaccurate data via the Profile page.'],
              ['Erasure', 'Delete your account and all data permanently — self-service button below.'],
              ['Portability', 'Export your data as JSON using the button below.'],
              ['Object', 'Object to processing based on legitimate interest — email us.'],
              ['Restrict', 'Request restriction of processing — email us.'],
              ['CCPA (US)', 'California residents may request disclosure of data sold or shared. We do not sell personal data.'],
            ].map(([right, desc]) => (
              <li key={right} className="flex gap-2">
                <span className="font-medium text-foreground w-28 shrink-0">{right}</span>
                <span>{desc}</span>
              </li>
            ))}
          </ul>
          <p className="text-sm text-muted-foreground">
            To exercise rights, email{' '}
            <a href="mailto:lifeeasy2224@gmail.com" className="text-primary hover:underline font-medium">lifeeasy2224@gmail.com</a>.
            We respond within 30 days. You have the right to lodge a complaint with your local supervisory authority.
          </p>
          <div className="flex flex-wrap gap-3 pt-1">
            <ExportDataButton />
            <DeleteAccountButton />
          </div>
        </div>

        {/* Section 5 — Retention */}
        <div className="bg-card rounded-xl border border-border p-5 space-y-3">
          <div className="flex items-center gap-2.5">
            <Database style={{ width: 18, height: 18 }} className="text-primary shrink-0" />
            <h2 className="font-semibold">5. Data Retention</h2>
          </div>
          <p className="text-sm text-muted-foreground">Data is kept while your account is active. Upon deletion, all data is permanently removed within 30 days from backups.</p>
        </div>

        {/* Section 6 — Cookies */}
        <div className="bg-card rounded-xl border border-border p-5 space-y-3">
          <div className="flex items-center gap-2.5">
            <Shield style={{ width: 18, height: 18 }} className="text-primary shrink-0" />
            <h2 className="font-semibold">6. Cookies</h2>
          </div>
          <p className="text-sm text-muted-foreground">We use essential session cookies via Supabase Auth. Analytics cookies (Google) are loaded only after your explicit consent via the cookie banner. See our <Link href="/cookies" className="text-primary hover:underline">Cookie Policy</Link> for the full cookie table.</p>
        </div>

        {/* Section 7 — Children */}
        <div className="bg-card rounded-xl border border-border p-5 space-y-3">
          <div className="flex items-center gap-2.5">
            <Shield style={{ width: 18, height: 18 }} className="text-primary shrink-0" />
            <h2 className="font-semibold">7. Children</h2>
          </div>
          <p className="text-sm text-muted-foreground">Our service is not for users under 16. We do not knowingly collect data from children. If you believe a child has provided data, contact us for immediate removal.</p>
        </div>

        {/* Section 8 — Changes */}
        <div className="bg-card rounded-xl border border-border p-5 space-y-3">
          <div className="flex items-center gap-2.5">
            <FileText style={{ width: 18, height: 18 }} className="text-primary shrink-0" />
            <h2 className="font-semibold">8. Changes to This Policy</h2>
          </div>
          <p className="text-sm text-muted-foreground">We will notify you by email of any material changes at least 30 days before they take effect. Continued use after changes constitutes acceptance.</p>
        </div>

        <div className="bg-primary/5 border border-primary/20 rounded-xl p-5">
          <div className="flex items-start gap-3">
            <Mail className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-sm mb-1">Contact / DPO</h3>
              <p className="text-sm text-muted-foreground mb-2">Questions about privacy or data requests:</p>
              <a href="mailto:lifeeasy2224@gmail.com" className="text-sm text-primary font-medium hover:underline">
                lifeeasy2224@gmail.com
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* ── Arabic Section ── */}
      <div className="space-y-8 border-t border-border pt-10" dir="rtl">
          <div className="flex items-center gap-3 flex-row-reverse">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Shield className="w-5 h-5 text-primary" />
          </div>
          <div className="text-right">
            <h2 className="text-2xl font-bold">سياسة الخصوصية — منصة بذرة</h2>
            <p className="text-muted-foreground text-sm">آخر تحديث: مايو ٢٠٢٦ · Life Easy LLC</p>
          </div>
        </div>

        <div className="bg-primary/5 border border-primary/20 rounded-xl p-5 text-sm leading-relaxed text-right">
          نحن في بذرة ندرك أن أفكاركم هي أصولكم الأكثر قيمة. لذلك نلتزم بحمايتها وفق أعلى المعايير التقنية والأخلاقية.
        </div>

        {arabicSections.map(({ icon: Icon, title, content }) => (
          <div key={title} className="bg-card rounded-xl border border-border p-5 space-y-4">
            <div className="flex items-center gap-2.5 flex-row-reverse">
              <Icon className="text-primary shrink-0" style={{ width: 18, height: 18 }} />
              <h3 className="font-semibold">{title}</h3>
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

        <div className="bg-card rounded-xl border border-border p-5 space-y-3">
          <h3 className="font-semibold text-right text-sm">إجراءات الحذف والتصدير</h3>
          <p className="text-sm text-muted-foreground text-right">يمكنك تصدير بياناتك أو حذف حسابك نهائياً بضغطة زر:</p>
          <div className="flex flex-wrap gap-3">
            <ExportDataButton />
            <DeleteAccountButton />
          </div>
        </div>

        <div className="bg-primary/5 border border-primary/20 rounded-xl p-5">
          <div className="flex items-start gap-3 flex-row-reverse">
            <Mail className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div className="text-right">
              <h3 className="font-semibold text-sm mb-1">تواصل معنا</h3>
              <p className="text-sm text-muted-foreground mb-2">لأي استفسار يتعلق بالخصوصية أو طلبات الحذف:</p>
              <a href="mailto:lifeeasy2224@gmail.com" className="text-sm text-primary font-medium hover:underline">
                lifeeasy2224@gmail.com
              </a>
            </div>
          </div>
        </div>

        <div className="text-center text-xs text-muted-foreground pb-2">
          © ٢٠٢٦ Life Easy LLC — جميع الحقوق محفوظة
        </div>
      </div>
    </div>
  );
}
