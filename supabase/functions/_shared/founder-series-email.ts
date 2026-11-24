// Founder welcome series (marketing, opt-in only): subjects, bodies and the email shell.
//
// Self-contained on purpose. It is imported only by send-founder-series, so adding or
// editing it never redeploys the other email functions (they import templates.ts and
// email-helper.ts). Arabic RTL, Bethra brand, same look as the other Bethra emails.
// The admin can override each body in marketing_templates as founder-series-1/2/3.

const FONT_STACK = `'Noto Kufi Arabic','Segoe UI',Tahoma,Arial,sans-serif`;

export function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

const H = (text: string) =>
  `<h2 style="margin:0 0 16px;font-size:22px;line-height:1.5;font-weight:700;color:#0F3D24;text-align:right;">${text}</h2>`;
const P = (text: string) =>
  `<p style="margin:0 0 16px;font-size:15px;line-height:2;color:#3E382E;text-align:right;">${text}</p>`;
const BTN = (href: string, label: string) =>
  `<div style="text-align:center;margin:28px 0 8px;"><a href="${href}" style="display:inline-block;background:#0F3D24;color:#F7F3EC;font-weight:700;font-size:15px;padding:14px 34px;border-radius:8px;text-decoration:none;">${label}</a></div>`;
// Sign-off, right after the button in every email of the series.
const SIGNOFF =
  `<p style="margin:28px 0 0;font-size:15px;line-height:1.8;color:#0F3D24;font-weight:700;text-align:right;">محمد براء رضا — مؤسس بذرة</p>`;
const NOTE =
  `<p style="margin:22px 0 0;font-size:12px;line-height:1.8;color:#8A8070;text-align:right;">وصلتك هذه الرسالة لأنك اخترت استلام نصائح المؤسسين وأخبار بذرة والعروض عند التسجيل.</p>`;

export const FOUNDER_SERIES_SUBJECTS: Record<number, string> = {
  1: 'اعرف رأي الذكاء الاصطناعي في فكرتك، مجاناً',
  2: 'اختبر افتراضاتك قبل أن تبني',
  3: 'رحلتك في ٩٠ يوماً، أسبوعاً بأسبوع',
};

// Placeholders: {{first_name}} (already HTML-escaped), {{validate_url}}, {{tracker_url}}, {{journey_url}}.
export const FOUNDER_SERIES_BODIES: Record<number, string> = {
  1:
    H('اعرف رأي الذكاء الاصطناعي في فكرتك، مجاناً') +
    P('أهلاً {{first_name}}،') +
    P('يكتشف كثير من المؤسسين هل يريد أحدٌ فكرتهم بعد أن يبنوها. أداة التحقق المجانية في بذرة تعطيك قراءة أولى بالذكاء الاصطناعي لفكرتك خلال دقائق، فتعرف ما الذي تختبره أولاً.') +
    P('هي رأي من الذكاء الاصطناعي وليست دليلاً. الدليل يأتي من عملاء حقيقيين، وبذرة تريك كيف تجمعه.') +
    BTN('{{validate_url}}', 'ابدأ قراءتك الأولى') +
    SIGNOFF +
    NOTE,
  2:
    H('اختبر افتراضاتك قبل أن تبني') +
    P('أهلاً {{first_name}}،') +
    P('قراءة الذكاء الاصطناعي ليست دليلاً من العملاء. اختر الافتراض الذي لا تحتمل أن تكون مخطئاً فيه، واختبره هذا الأسبوع مع عدد قليل من الأشخاص الحقيقيين.') +
    P('اسألهم عن آخر مرة واجهوا فيها المشكلة، لا عمّا إذا كانوا سيشترون. ثم سجّل في متتبّع التحقق مع مَن تحدثت، وماذا قالوا، وما خطوتك التالية. الأنشطة التي لا تذكر فيها «مع مَن» لا تُحتسب دليلاً. والمتتبّع مجاني في جميع الخطط.') +
    BTN('{{tracker_url}}', 'افتح متتبّع التحقق') +
    SIGNOFF +
    NOTE,
  3:
    H('رحلتك في ٩٠ يوماً، أسبوعاً بأسبوع') +
    P('أهلاً {{first_name}}،') +
    P('التحقق بداية الطريق. تحوّل بذرة ما تتعلمه إلى خطة من ١٢ أسبوعاً، وفيها بوابتا قرار في الأسبوع ٤ والأسبوع ٨: تقرر عندهما أن تستمر أو تغيّر الاتجاه أو تتوقف، بناءً على ما تعلمته فعلاً من عملائك.') +
    P('مهمة واحدة كل أسبوع، مكتوبة أمامك، فلا تخمّن خطوتك التالية. رحلة الـ ٩٠ يوماً ضمن خطة برو.') +
    BTN('{{journey_url}}', 'شاهد رحلتي') +
    SIGNOFF +
    NOTE,
};

// The email shell: logo header, the body, and the compliant footer (honest reason line,
// one working unsubscribe link, physical mailing address — same footer as send-campaign).
export function founderSeriesShell(innerHtml: string, unsubscribeUrl: string): string {
  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F7F3EC;font-family:${FONT_STACK};" dir="rtl">
  <table width="100%" cellpadding="0" cellspacing="0" dir="rtl"><tr><td align="center" style="padding:40px 16px;">
    <table width="580" cellpadding="0" cellspacing="0" dir="rtl" style="max-width:580px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,0.08);">
      <tr><td style="background:linear-gradient(135deg,#0F3D24 0%,#1B6B3E 100%);padding:32px 40px;text-align:center;">
        <img src="https://bethra.co/email-logo.png?v=2" alt="بذرة" width="140" style="display:block;margin:0 auto;border:0;outline:none;text-decoration:none;" />
      </td></tr>
      <tr><td style="padding:36px 40px;text-align:right;">${innerHtml}</td></tr>
      <tr><td style="background:#F7F3EC;padding:20px 40px;text-align:center;border-top:1px solid #E8E4DC;">
        <p dir="rtl" style="color:#8A8070;font-size:12px;line-height:1.8;margin:0;">
          وصلتك هذه الرسالة من بذرة (Life Easy LLC). إن كنت تفضّل عدم استقبال رسائلنا،
          <a href="${unsubscribeUrl}" style="color:#8A8070;text-decoration:underline;">يمكنك إلغاء الاشتراك من هنا</a>.<br>
          Life Easy LLC · 44887 W Bahia Dr · Maricopa, AZ 85139
        </p>
      </td></tr>
    </table>
  </td></tr></table>
</body>
</html>`;
}

export function renderTemplate(html: string, vars: Record<string, string>): string {
  return html.replace(/\{\{(\w+)\}\}/g, (_, k) => vars[k] ?? '');
}
