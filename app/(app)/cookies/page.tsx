'use client';

import Link from 'next/link';
import { Cookie, Shield, Settings, Info, ArrowRight, Mail, ToggleLeft } from 'lucide-react';

const cookieTable = [
  { name: 'sb-access-token', provider: 'Supabase', purpose: 'جلسة تسجيل الدخول', duration: 'الجلسة', type: 'ضروري' },
  { name: 'sb-refresh-token', provider: 'Supabase', purpose: 'تجديد الجلسة', duration: '٧ أيام', type: 'ضروري' },
  { name: 'cookie_consent', provider: 'بذرة', purpose: 'تذكر اختيار الكوكيز', duration: 'سنة واحدة', type: 'ضروري' },
  { name: 'theme', provider: 'بذرة', purpose: 'تفضيل المظهر (فاتح/داكن)', duration: 'سنة واحدة', type: 'تفضيلات' },
  { name: '_ga', provider: 'Google Analytics', purpose: 'تحليل الاستخدام (بموافقتك)', duration: 'سنتان', type: 'أداء' },
  { name: '_gid', provider: 'Google Analytics', purpose: 'تحليل الاستخدام (بموافقتك)', duration: '٢٤ ساعة', type: 'أداء' },
];

const typeColors: Record<string, string> = {
  'ضروري':   'bg-green-100 text-green-800',
  'تفضيلات': 'bg-blue-100 text-blue-800',
  'أداء':    'bg-amber-100 text-amber-800',
};

export default function CookiesPage() {
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
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center bg-yellow-100/30">
              <Cookie className="w-6 h-6" style={{ color: 'var(--gold)' }} />
            </div>
            <div className="text-right">
              <h1 className="text-2xl font-extrabold" style={{ color: 'var(--text-dark)' }}>إدارة ملفات تعريف الارتباط</h1>
              <p className="text-sm text-muted-foreground">آخر تحديث: مايو ٢٠٢٦ — Life Easy LLC</p>
            </div>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-right" style={{ color: 'var(--gray-mid)' }}>
            نشرح هنا كيف تستخدم بذرة ملفات تعريف الارتباط وكيف يمكنك التحكم فيها بالكامل.
          </p>
        </div>

        <div className="space-y-6">

          {/* Section 1 */}
          <div className="bg-white rounded-2xl border p-6 text-right border-gray-light">
            <div className="flex items-center gap-3 flex-row-reverse mb-5">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-yellow-100/30">
                <Info className="w-4 h-4" style={{ color: 'var(--gold)' }} />
              </div>
              <h2 className="text-base font-bold" style={{ color: 'var(--text-dark)' }}>١. ما هي ملفات تعريف الارتباط؟</h2>
            </div>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--gray-mid)' }}>
              ملفات تعريف الارتباط (Cookies) هي ملفات نصية صغيرة تُخزَّن على جهازك عند زيارة المنصة. تساعد في الحفاظ على جلسة تسجيل دخولك وتذكّر تفضيلاتك.
            </p>
          </div>

          {/* Section 2 */}
          <div className="bg-white rounded-2xl border p-6 text-right border-gray-light">
            <div className="flex items-center gap-3 flex-row-reverse mb-5">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-yellow-100/30">
                <Cookie className="w-4 h-4" style={{ color: 'var(--gold)' }} />
              </div>
              <h2 className="text-base font-bold" style={{ color: 'var(--text-dark)' }}>٢. أنواع الكوكيز التي نستخدمها</h2>
            </div>
            <div className="space-y-4">
              {[
                { heading: 'كوكيز ضرورية', body: 'ضرورية لعمل المنصة الأساسي — تشمل جلسة تسجيل الدخول وإعدادات الأمان. لا يمكن إيقافها.' },
                { heading: 'كوكيز التفضيلات', body: 'تتذكر إعداداتك كاللغة والمظهر الفاتح/الداكن لتوفير تجربة مخصصة.' },
                { heading: 'كوكيز الأداء (Google Analytics)', body: 'نستخدم Google Analytics لفهم كيفية استخدام المنصة وتحسينها. البيانات مجهولة الهوية ولا تُستخدم لأغراض إعلانية. تُفعَّل هذه الكوكيز فقط بعد موافقتك الصريحة.' },
              ].map(({ heading, body }) => (
                <div key={heading}>
                  <h3 className="text-sm font-semibold mb-1" style={{ color: 'var(--text-dark)' }}>{heading}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--gray-mid)' }}>{body}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3 — Cookie Table */}
          <div className="bg-white rounded-2xl border p-6 text-right border-gray-light">
            <div className="flex items-center gap-3 flex-row-reverse mb-5">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-yellow-100/30">
                <Shield className="w-4 h-4" style={{ color: 'var(--gold)' }} />
              </div>
              <h2 className="text-base font-bold" style={{ color: 'var(--text-dark)' }}>٣. جدول الكوكيز المستخدمة</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border border-border rounded-xl overflow-hidden">
                <thead>
                  <tr className="bg-secondary/50 border-b border-border">
                    <th className="text-right px-3 py-2.5 font-semibold text-foreground">اسم الكوكي</th>
                    <th className="text-right px-3 py-2.5 font-semibold text-foreground">المزوّد</th>
                    <th className="text-right px-3 py-2.5 font-semibold text-foreground">الغرض</th>
                    <th className="text-right px-3 py-2.5 font-semibold text-foreground">المدة</th>
                    <th className="text-right px-3 py-2.5 font-semibold text-foreground">النوع</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {cookieTable.map((c, i) => (
                    <tr key={c.name} className={i % 2 === 0 ? 'bg-card' : 'bg-secondary/20'}>
                      <td className="px-3 py-2.5 font-mono text-xs text-muted-foreground">{c.name}</td>
                      <td className="px-3 py-2.5 text-muted-foreground">{c.provider}</td>
                      <td className="px-3 py-2.5 text-muted-foreground">{c.purpose}</td>
                      <td className="px-3 py-2.5 text-muted-foreground">{c.duration}</td>
                      <td className="px-3 py-2.5">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${typeColors[c.type]}`}>{c.type}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 4 — External Cookies */}
          <div className="bg-white rounded-2xl border p-6 text-right border-gray-light">
            <div className="flex items-center gap-3 flex-row-reverse mb-5">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-yellow-100/30">
                <Shield className="w-4 h-4" style={{ color: 'var(--gold)' }} />
              </div>
              <h2 className="text-base font-bold" style={{ color: 'var(--text-dark)' }}>٤. الكوكيز الخارجية</h2>
            </div>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold mb-1" style={{ color: 'var(--text-dark)' }}>Supabase</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--gray-mid)' }}>نستخدم Supabase لإدارة المصادقة. يضع كوكيز خاصة بجلسة تسجيل الدخول وهي ضرورية للخدمة.</p>
              </div>
              <div>
                <h3 className="text-sm font-semibold mb-1" style={{ color: 'var(--text-dark)' }}>Google Analytics</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--gray-mid)' }}>نستخدم Google Analytics لفهم كيفية استخدام المنصة. تُفعَّل هذه الكوكيز فقط بعد موافقتك الصريحة. البيانات مجهولة الهوية ولا تُستخدم لأغراض إعلانية.</p>
              </div>
              <div>
                <h3 className="text-sm font-semibold mb-1" style={{ color: 'var(--text-dark)' }}>لا إعلانات</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--gray-mid)' }}>لا نستخدم أي كوكيز إعلانية أو تتبعية من طرف ثالث لأغراض تسويقية.</p>
              </div>
            </div>
          </div>

          {/* Section 5 — Consent & Control */}
          <div className="bg-white rounded-2xl border p-6 text-right border-gray-light">
            <div className="flex items-center gap-3 flex-row-reverse mb-5">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-yellow-100/30">
                <ToggleLeft className="w-4 h-4" style={{ color: 'var(--gold)' }} />
              </div>
              <h2 className="text-base font-bold" style={{ color: 'var(--text-dark)' }}>٥. موافقتك وتحكمك الكامل</h2>
            </div>
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold mb-1" style={{ color: 'var(--text-dark)' }}>شريط الموافقة عند الزيارة الأولى</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--gray-mid)' }}>عند زيارتك الأولى للمنصة، يظهر شريط موافقة يتيح لك قبول أو رفض كوكيز الأداء غير الضرورية. الكوكيز الضرورية تعمل دائماً لضمان عمل الخدمة.</p>
              </div>
              <div>
                <h3 className="text-sm font-semibold mb-1" style={{ color: 'var(--text-dark)' }}>تغيير اختيارك في أي وقت</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--gray-mid)' }}>يمكنك تغيير تفضيلاتك في أي وقت من هذه الصفحة، أو من إعدادات متصفحك. سيُطبَّق اختيارك فوراً.</p>
              </div>
              <div>
                <h3 className="text-sm font-semibold mb-1" style={{ color: 'var(--text-dark)' }}>إعدادات المتصفح</h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--gray-mid)' }}>يمكنك أيضاً التحكم في الكوكيز من إعدادات متصفحك وحذف جميع الكوكيز المخزنة في أي وقت. تعطيل الكوكيز الضرورية قد يؤثر على عمل المنصة.</p>
              </div>
            </div>
          </div>

          {/* Section 6 — Contact */}
          <div className="bg-white rounded-2xl border p-6 text-right border-gray-light">
            <div className="flex items-center gap-3 flex-row-reverse mb-5">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-yellow-100/30">
                <Mail className="w-4 h-4" style={{ color: 'var(--gold)' }} />
              </div>
              <h2 className="text-base font-bold" style={{ color: 'var(--text-dark)' }}>٦. التواصل</h2>
            </div>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--gray-mid)' }}>
              لأي سؤال حول استخدامنا للكوكيز:{' '}
              <a href="mailto:lifeeasy2224@gmail.com" className="text-primary hover:underline font-medium">lifeeasy2224@gmail.com</a>
            </p>
          </div>

        </div>

        <p className="text-center text-xs text-muted-foreground mt-10 pb-4">
          © ٢٠٢٦ Life Easy LLC — جميع الحقوق محفوظة
        </p>
      </div>
    </div>
  );
}
