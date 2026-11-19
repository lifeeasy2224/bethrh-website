// "New idea matches your interests" email sent to investors (Arabic RTL, Bethra brand).
// Self-contained on purpose: it lives outside templates.ts so that changing it redeploys only
// send-investor-match, not every email function that imports templates.ts.
//
// Placeholders: investor_name, match_score, sector, sector_emoji, idea_name, idea_description,
// investment_range, breakeven, match_reasons, idea_url, unsubscribe_url.
// Dynamic text that comes from users (idea_name, idea_description) must be passed through
// escapeHtml before it is rendered into this template.

const FONT_STACK = `'Noto Kufi Arabic','Segoe UI',Tahoma,Arial,sans-serif`;

export function escapeHtml(s: unknown): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

export const INVESTOR_MATCH_TEMPLATE = `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><link href="https://fonts.googleapis.com/css2?family=Noto+Kufi+Arabic:wght@400;600;700&display=swap" rel="stylesheet"></head>
<body style="margin:0;padding:0;background:#F7F3EC;font-family:${FONT_STACK};" dir="rtl">
  <table width="100%" cellpadding="0" cellspacing="0" dir="rtl"><tr><td align="center" style="padding:40px 16px;">
    <table width="580" cellpadding="0" cellspacing="0" dir="rtl" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,0.08);">
      <tr><td style="background:linear-gradient(135deg,#0F3D24 0%,#D4A653 100%);padding:40px;text-align:center;">
        <img src="https://bethra.co/email-logo.png?v=2" alt="بذرة" width="160" style="display:block;margin:0 auto;border:0;outline:none;text-decoration:none;" />
        <div style="font-size:20px;margin-top:12px;">🤝</div>
        <div style="font-size:22px;font-weight:700;color:#fff;margin-top:8px;">فكرة جديدة تطابق اهتماماتك!</div>
      </td></tr>
      <tr><td style="padding:36px 40px;text-align:right;">
        <h2 style="margin:0 0 10px;font-size:21px;font-weight:700;color:#0F3D24;text-align:right;">أهلاً {{investor_name}}، فكرة جديدة تطابق معاييرك</h2>
        <p style="color:#8A8070;font-size:15px;line-height:1.9;margin:0 0 18px;text-align:right;">وجدنا تطابقاً بنسبة <strong>٪{{match_score}}</strong> مع معاييرك الاستثمارية في قطاع <strong>{{sector}}</strong>.</p>
        <div style="background:#FAF5E9;border:1px solid #E8C07A;border-radius:10px;padding:20px;margin:0 0 20px;text-align:right;">
          <div style="margin-bottom:10px;">
            <span style="font-size:22px;">{{sector_emoji}}</span>
            <strong style="font-size:17px;color:#0F3D24;">{{idea_name}}</strong>
          </div>
          <p style="color:#8A8070;font-size:14px;margin:0 0 12px;">{{idea_description}}</p>
          <table width="100%" cellpadding="0" cellspacing="0" dir="rtl">
            <tr>
              <td style="font-size:13px;color:#8A8070;">الاستثمار</td>
              <td style="font-size:13px;color:#8A8070;">نقطة التعادل (تقدير المؤسس)</td>
            </tr>
            <tr>
              <td style="font-weight:700;color:#0F3D24;font-size:14px;">{{investment_range}}</td>
              <td style="font-weight:700;color:#0F3D24;font-size:14px;">{{breakeven}}</td>
            </tr>
          </table>
        </div>
        <div style="background:#F7F3EC;border-radius:8px;padding:14px;margin-bottom:20px;text-align:right;">
          <div style="font-weight:600;color:#3E382E;font-size:13px;margin-bottom:6px;">لماذا تطابقت:</div>
          <div style="color:#8A8070;font-size:14px;">{{match_reasons}}</div>
        </div>
        <div style="text-align:center;margin:28px 0 8px;">
          <a href="{{idea_url}}" style="display:inline-block;background:#A07830;color:#F7F3EC;font-weight:700;font-size:15px;padding:14px 34px;border-radius:8px;text-decoration:none;">اعرض هذه الفكرة ←</a>
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
