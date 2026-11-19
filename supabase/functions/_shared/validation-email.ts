// "AI first read" results email (Arabic RTL, Bethra brand). Sent by idea-stress-test to a
// signed-in founder with the real analysis. Kept in its own file, self-contained, so a change
// here deploys only the functions that import it (not every email function via templates.ts).
//
// Placeholders: founder_name, idea_name, score, score_color, score_bg, verdict,
// strength_1..3, weakness_1..3, suggestion_1..3, next_url, unsubscribe_url.
// Everything substituted into it must already be HTML-escaped (see escapeHtml).

const FONT_STACK = `'Noto Kufi Arabic','Segoe UI',Tahoma,Arial,sans-serif`;

export function escapeHtml(s: unknown): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

const row = (mark: string, color: string, text: string) =>
  `<div style="color:#3E382E;font-size:14px;padding:4px 0;"><span style="color:${color};font-weight:700;">${mark}</span> ${text}</div>`;

const step = (n: string) =>
  `<span style="background:#DEEBE2;color:#0F3D24;font-weight:700;font-size:11px;padding:2px 6px;border-radius:4px;margin-left:6px;">${n}</span>`;

export const VALIDATION_FIRST_READ_TEMPLATE = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link href="https://fonts.googleapis.com/css2?family=Noto+Kufi+Arabic:wght@400;600;700&display=swap" rel="stylesheet"></head>
<body style="margin:0;padding:0;background:#F7F3EC;font-family:${FONT_STACK};" dir="rtl">
  <table width="100%" cellpadding="0" cellspacing="0" dir="rtl"><tr><td align="center" style="padding:40px 16px;">
    <table width="580" cellpadding="0" cellspacing="0" dir="rtl" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,0.08);">
      <tr><td style="background:linear-gradient(135deg,#0F3D24 0%,#1B6B3E 100%);padding:40px;text-align:center;">
        <img src="https://bethra.co/email-logo.png?v=2" alt="بذرة" width="160" style="display:block;margin:0 auto;border:0;outline:none;text-decoration:none;" />
        <div style="font-size:20px;margin-top:12px;">🤖</div>
        <div style="font-size:22px;font-weight:700;color:#fff;margin-top:8px;">قراءتك الأولى بالذكاء الاصطناعي</div>
      </td></tr>
      <tr><td style="padding:36px 40px;text-align:right;">
        <h2 style="margin:0 0 10px;font-size:21px;font-weight:700;color:#0F3D24;text-align:right;">أهلاً {{founder_name}}، قراءتك الأولى جاهزة</h2>
        <p style="color:#8A8070;font-size:15px;line-height:1.9;margin:0 0 18px;text-align:right;">هذه قراءة أولى لفكرتك <strong>«{{idea_name}}»</strong> — رأيٌ من الذكاء الاصطناعي يساعدك على تحديد ما تختبره أولاً، وليست تحققاً ولا دليلاً من عملاء حقيقيين.</p>
        <div style="background:{{score_bg}};border-radius:10px;padding:24px;text-align:center;margin:0 0 24px;">
          <div style="font-size:52px;font-weight:900;color:{{score_color}};">{{score}}/10</div>
          <div style="font-weight:700;color:#8A8070;font-size:12px;margin-top:12px;">أكبر خطر عليك اختباره أولاً مع عملاء حقيقيين</div>
          <div style="font-weight:700;color:{{score_color}};font-size:15px;margin-top:4px;line-height:1.7;">{{verdict}}</div>
        </div>
        <div style="margin:0 0 16px;text-align:right;">
          <div style="font-weight:700;color:#0F3D24;font-size:14px;margin-bottom:8px;">ما يبدو واعداً</div>
          ${row('✓', '#2A8A52', '{{strength_1}}')}
          ${row('✓', '#2A8A52', '{{strength_2}}')}
          ${row('✓', '#2A8A52', '{{strength_3}}')}
        </div>
        <div style="margin:0 0 16px;text-align:right;">
          <div style="font-weight:700;color:#0F3D24;font-size:14px;margin-bottom:8px;">أهم المخاطر</div>
          ${row('•', '#D08A28', '{{weakness_1}}')}
          ${row('•', '#D08A28', '{{weakness_2}}')}
          ${row('•', '#D08A28', '{{weakness_3}}')}
        </div>
        <div style="margin:0 0 24px;text-align:right;">
          <div style="font-weight:700;color:#0F3D24;font-size:14px;margin-bottom:8px;">الخطوات التالية</div>
          ${row(step('١'), '#0F3D24', '{{suggestion_1}}')}
          ${row(step('٢'), '#0F3D24', '{{suggestion_2}}')}
          ${row(step('٣'), '#0F3D24', '{{suggestion_3}}')}
        </div>
        <div style="text-align:center;margin:28px 0 8px;">
          <a href="{{next_url}}" style="display:inline-block;background:#0F3D24;color:#F7F3EC;font-weight:700;font-size:15px;padding:14px 34px;border-radius:8px;text-decoration:none;">سجّل أول دليل من عميل حقيقي ←</a>
        </div>
      </td></tr>
      <tr><td style="background:#F7F3EC;padding:20px 40px;text-align:center;border-top:1px solid #E8E4DC;">
        <p style="color:#8A8070;font-size:12px;margin:0;">© ٢٠٢٦ بذرة &nbsp;·&nbsp;
          <a href="{{unsubscribe_url}}" style="color:#8A8070;text-decoration:underline;">إلغاء الاشتراك</a>
        </p>
      </td></tr>
    </table>
  </td></tr></table>
</body>
</html>`;
