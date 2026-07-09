// Shared HTML email templates — Arabic RTL, Bethra brand. All use {{variable}} placeholders.
// Email clients can't load web fonts reliably, so we use a system stack that
// renders Arabic well (Segoe UI / Tahoma / Arial).

const FONT_STACK = `'Segoe UI',Tahoma,Arial,sans-serif`;

const BASE_HEADER = (accentGradient: string, emoji: string, title: string) => `
  <tr><td style="background:${accentGradient};padding:40px;text-align:center;">
    <img src="https://bethra.co/email-logo.png?v=2" alt="بذرة" width="160" style="display:block;margin:0 auto;border:0;outline:none;text-decoration:none;" />
    <div style="font-size:20px;margin-top:12px;">${emoji}</div>
    <div style="font-size:22px;font-weight:700;color:#fff;margin-top:8px;">${title}</div>
  </td></tr>`;

const BASE_FOOTER = `
  <tr><td style="background:#F7F3EC;padding:20px 40px;text-align:center;border-top:1px solid #E8E4DC;">
    <p style="color:#8A8070;font-size:12px;margin:0;">© ٢٠٢٦ بذرة &nbsp;·&nbsp;
      <a href="{{unsubscribe_url}}" style="color:#8A8070;text-decoration:underline;">إلغاء الاشتراك</a>
    </p>
  </td></tr>`;

const WRAP = (header: string, body: string) => `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F7F3EC;font-family:${FONT_STACK};" dir="rtl">
  <table width="100%" cellpadding="0" cellspacing="0" dir="rtl"><tr><td align="center" style="padding:40px 16px;">
    <table width="580" cellpadding="0" cellspacing="0" dir="rtl" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,0.08);">
      ${header}
      <tr><td style="padding:36px 40px;text-align:right;">${body}</td></tr>
      ${BASE_FOOTER}
    </table>
  </td></tr></table>
</body>
</html>`;

const P = (text: string) =>
  `<p style="color:#8A8070;font-size:15px;line-height:1.9;margin:0 0 18px;text-align:right;">${text}</p>`;
const H2 = (text: string) =>
  `<h2 style="margin:0 0 10px;font-size:21px;font-weight:700;color:#0F3D24;text-align:right;">${text}</h2>`;
const BTN = (href: string, label: string, color = '#0F3D24') =>
  `<div style="text-align:center;margin:28px 0 8px;">
    <a href="${href}" style="display:inline-block;background:${color};color:#F7F3EC;font-weight:700;font-size:15px;padding:14px 34px;border-radius:8px;text-decoration:none;">${label}</a>
  </div>`;
const PILL = (label: string, color: string, bg: string) =>
  `<span style="background:${bg};color:${color};font-size:11px;font-weight:700;padding:3px 10px;border-radius:100px;">${label}</span>`;
const STAT_ROW = (stats: Array<{ label: string; value: string; color: string }>) =>
  `<table width="100%" cellpadding="0" cellspacing="0" dir="rtl" style="margin:20px 0;">
    <tr>${stats.map(s =>
      `<td align="center" style="padding:12px;">
        <div style="font-size:30px;font-weight:800;color:${s.color};">${s.value}</div>
        <div style="color:#8A8070;font-size:12px;margin-top:2px;">${s.label}</div>
      </td>`).join('')}
    </tr>
  </table>`;

// ─── 1. welcome-email ─────────────────────────────────────────────────────────
export const WELCOME_TEMPLATE = WRAP(
  BASE_HEADER('linear-gradient(135deg,#0F3D24 0%,#1B6B3E 100%)', '🚀', 'أهلاً بك في بذرة!'),
  `${H2('أهلاً {{first_name}}، انضممت بنجاح!')}
  ${P('انضممت بصفة <strong>{{role}}</strong>. إليك ما تفعله في أول ٢٤ ساعة:')}
  <table width="100%" cellpadding="0" cellspacing="0" dir="rtl" style="margin:20px 0 24px;">
    <tr>
      <td style="background:#F0F5F1;border-radius:8px;padding:16px;width:48%;vertical-align:top;text-align:right;">
        <div style="font-size:18px;">✅</div>
        <div style="font-weight:600;color:#1B6B3E;font-size:14px;margin-top:6px;">تحقق من فكرتك</div>
        <div style="color:#8A8070;font-size:13px;margin-top:4px;">جرّب اختبار الفكرة الذكي المجاني (٥ أسئلة)</div>
      </td>
      <td width="4%"></td>
      <td style="background:#F5EAD3;border-radius:8px;padding:16px;width:48%;vertical-align:top;text-align:right;">
        <div style="font-size:18px;">🗺️</div>
        <div style="font-weight:600;color:#A07830;font-size:14px;margin-top:6px;">ابدأ الرحلة</div>
        <div style="color:#8A8070;font-size:13px;margin-top:4px;">خارطة ١٢ أسبوعاً حتى أول إيراد لك</div>
      </td>
    </tr>
  </table>
  ${BTN('{{dashboard_url}}', 'افتح لوحة تحكمي ←')}
  ${P('<small style="color:#8A8070;">لديك سؤال؟ رد على هذه الرسالة مباشرة — نقرأ كل رسالة.</small>')}`
);

// ─── 2. investor-match ────────────────────────────────────────────────────────
export const INVESTOR_MATCH_TEMPLATE = WRAP(
  BASE_HEADER('linear-gradient(135deg,#0F3D24 0%,#D4A653 100%)', '🤝', 'فكرة جديدة تطابق اهتماماتك!'),
  `${H2('أهلاً {{investor_name}}، فكرة جديدة تطابق معاييرك')}
  ${P('وجدنا تطابقاً بنسبة <strong>٪{{match_score}}</strong> مع معاييرك الاستثمارية في قطاع <strong>{{sector}}</strong>.')}
  <div style="background:#FAF5E9;border:1px solid #E8C07A;border-radius:10px;padding:20px;margin:0 0 20px;text-align:right;">
    <div style="margin-bottom:10px;">
      <span style="font-size:22px;">{{sector_emoji}}</span>
      <strong style="font-size:17px;color:#0F3D24;">{{idea_name}}</strong>
    </div>
    <p style="color:#8A8070;font-size:14px;margin:0 0 12px;">{{idea_description}}</p>
    <table width="100%" cellpadding="0" cellspacing="0" dir="rtl">
      <tr>
        <td style="font-size:13px;color:#8A8070;">الاستثمار</td>
        <td style="font-size:13px;color:#8A8070;">العائد المتوقع</td>
        <td style="font-size:13px;color:#8A8070;">نقطة التعادل</td>
      </tr>
      <tr>
        <td style="font-weight:700;color:#0F3D24;font-size:14px;">{{investment_range}}</td>
        <td style="font-weight:700;color:#2A8A52;font-size:14px;">{{roi}}</td>
        <td style="font-weight:700;color:#0F3D24;font-size:14px;">{{breakeven}}</td>
      </tr>
    </table>
  </div>
  <div style="background:#F7F3EC;border-radius:8px;padding:14px;margin-bottom:20px;text-align:right;">
    <div style="font-weight:600;color:#3E382E;font-size:13px;margin-bottom:6px;">لماذا تطابقت:</div>
    <div style="color:#8A8070;font-size:14px;">{{match_reasons}}</div>
  </div>
  ${BTN('{{idea_url}}', 'اعرض هذه الفكرة ←', '#A07830')}`
);

// ─── 3. investor-interested ───────────────────────────────────────────────────
export const INVESTOR_INTERESTED_TEMPLATE = WRAP(
  BASE_HEADER('linear-gradient(135deg,#123F27 0%,#2A8A52 100%)', '💸', 'مستثمر مهتم بفكرتك!'),
  `${H2('أهلاً {{founder_name}}، مستثمر يريد التواصل معك')}
  ${P('<strong>{{investor_name}}</strong> أبدى للتو اهتمامه بفكرتك <strong>«{{idea_name}}»</strong>.')}
  <div style="background:#F0F5F1;border:1px solid #DEEBE2;border-radius:10px;padding:20px;margin:0 0 20px;text-align:right;">
    <div style="font-weight:600;color:#123F27;font-size:14px;margin-bottom:10px;">عن المستثمر:</div>
    <div style="color:#3E382E;font-size:14px;margin-bottom:4px;">النوع: <strong>{{investor_type}}</strong></div>
    <div style="color:#3E382E;font-size:14px;margin-bottom:4px;">حجم الاستثمار: <strong>{{check_size}}</strong></div>
    <div style="color:#3E382E;font-size:14px;">القطاعات: <strong>{{investor_sectors}}</strong></div>
  </div>
  <div style="background:#FAF8F3;border-right:4px solid #2A8A52;border-radius:8px 0 0 8px;padding:16px 20px;margin:0 0 20px;text-align:right;">
    <div style="font-weight:600;color:#3E382E;font-size:13px;margin-bottom:4px;">رسالته:</div>
    <div style="color:#8A8070;font-size:14px;font-style:italic;">«{{message}}»</div>
  </div>
  ${P('<small style="color:#8A8070;">أمامك ١٤ يوماً للرد قبل انتهاء صلاحية هذا الاهتمام.</small>')}
  ${BTN('{{connections_url}}', 'ردّ الآن ←', '#2A8A52')}`
);

// ─── 4. new-message ───────────────────────────────────────────────────────────
export const NEW_MESSAGE_TEMPLATE = WRAP(
  BASE_HEADER('linear-gradient(135deg,#0F3D24 0%,#1B6B3E 100%)', '💬', 'رسالة جديدة'),
  `${H2('أهلاً {{recipient_name}}،')}
  ${P('<strong>{{sender_name}}</strong> أرسل لك رسالة بخصوص <strong>«{{idea_name}}»</strong>:')}
  <div style="background:#F0F5F1;border-right:4px solid #1B6B3E;border-radius:8px 0 0 8px;padding:16px 20px;margin:0 0 8px;text-align:right;">
    <p style="color:#3E382E;font-size:15px;line-height:1.8;margin:0;">{{message_preview}}</p>
  </div>
  <p style="color:#8A8070;font-size:12px;margin:0 0 20px;text-align:right;">{{message_time}}</p>
  ${BTN('{{chat_url}}', 'ردّ الآن ←', '#1B6B3E')}
  ${P('<small style="color:#8A8070;">ردّ سريعاً لتحافظ على تواصلك نشطاً.</small>')}`
);

// ─── 5. weekly-digest ─────────────────────────────────────────────────────────
export const WEEKLY_DIGEST_TEMPLATE = WRAP(
  BASE_HEADER('linear-gradient(135deg,#0F3D24 0%,#1B6B3E 100%)', '📊', 'ملخصك الأسبوعي'),
  `${H2('صباح الخير يا {{first_name}}!')}
  ${P('هذا ملخصك من بذرة لأسبوع <strong>{{week_date}}</strong>.')}
  <div style="background:#F0F5F1;border-radius:10px;padding:4px 0;margin:0 0 24px;">
    ${STAT_ROW([
      { label: 'درجة بذرة', value: '{{iq_score}}', color: '#1B6B3E' },
      { label: 'سلسلة الأيام', value: '{{streak}}🔥', color: '#D4A653' },
      { label: 'الرحلة', value: '٪{{journey_pct}}', color: '#2A8A52' },
    ])}
  </div>
  <div style="margin:0 0 24px;text-align:right;">
    <div style="font-weight:700;color:#0F3D24;font-size:15px;margin-bottom:12px;">نشاط هذا الأسبوع</div>
    <table width="100%" cellpadding="0" cellspacing="0" dir="rtl">
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #F7F3EC;">
          <span style="color:#8A8070;font-size:14px;">📚 أفكار جديدة نُشرت</span>
        </td>
        <td align="left" style="padding:8px 0;border-bottom:1px solid #F7F3EC;">
          <strong style="color:#0F3D24;font-size:14px;">{{new_ideas_count}}</strong>
        </td>
      </tr>
      <tr>
        <td style="padding:8px 0;border-bottom:1px solid #F7F3EC;">
          <span style="color:#8A8070;font-size:14px;">🤝 تطابقات جديدة</span>
        </td>
        <td align="left" style="padding:8px 0;border-bottom:1px solid #F7F3EC;">
          <strong style="color:#0F3D24;font-size:14px;">{{matches_count}}</strong>
        </td>
      </tr>
      <tr>
        <td style="padding:8px 0;">
          <span style="color:#8A8070;font-size:14px;">💬 رسائل وصلتك</span>
        </td>
        <td align="left" style="padding:8px 0;">
          <strong style="color:#0F3D24;font-size:14px;">{{messages_count}}</strong>
        </td>
      </tr>
    </table>
  </div>
  <div style="margin:0 0 24px;text-align:right;">
    <div style="font-weight:700;color:#0F3D24;font-size:15px;margin-bottom:12px;">أفضل الأفكار لك</div>
    {{ideas_section}}
  </div>
  ${BTN('{{dashboard_url}}', 'افتح لوحة التحكم ←')}`
);

// ─── 6. validation-complete ───────────────────────────────────────────────────
export const VALIDATION_COMPLETE_TEMPLATE = WRAP(
  BASE_HEADER('linear-gradient(135deg,#0F3D24 0%,#1B6B3E 100%)', '🤖', 'اكتمل تحليل الذكاء الاصطناعي'),
  `${H2('أهلاً {{founder_name}}، نتائجك جاهزة')}
  ${P('حُلّلت فكرتك <strong>«{{idea_name}}»</strong> بالذكاء الاصطناعي.')}
  <div style="background:{{score_bg}};border-radius:10px;padding:24px;text-align:center;margin:0 0 24px;">
    <div style="font-size:52px;font-weight:900;color:{{score_color}};">{{score}}/10</div>
    <div style="font-weight:700;color:{{score_color}};font-size:15px;margin-top:4px;">{{verdict}}</div>
  </div>
  <div style="margin:0 0 16px;text-align:right;">
    <div style="font-weight:700;color:#0F3D24;font-size:14px;margin-bottom:8px;">أبرز نقاط القوة</div>
    <div style="color:#3E382E;font-size:14px;padding:4px 0;"><span style="color:#2A8A52;font-weight:700;">✓</span> {{strength_1}}</div>
    <div style="color:#3E382E;font-size:14px;padding:4px 0;"><span style="color:#2A8A52;font-weight:700;">✓</span> {{strength_2}}</div>
    <div style="color:#3E382E;font-size:14px;padding:4px 0;"><span style="color:#2A8A52;font-weight:700;">✓</span> {{strength_3}}</div>
  </div>
  <div style="margin:0 0 24px;text-align:right;">
    <div style="font-weight:700;color:#0F3D24;font-size:14px;margin-bottom:8px;">أهم الاقتراحات</div>
    <div style="color:#3E382E;font-size:14px;padding:4px 0;"><span style="background:#DEEBE2;color:#0F3D24;font-weight:700;font-size:11px;padding:2px 6px;border-radius:4px;margin-left:6px;">١</span>{{suggestion_1}}</div>
    <div style="color:#3E382E;font-size:14px;padding:4px 0;"><span style="background:#DEEBE2;color:#0F3D24;font-weight:700;font-size:11px;padding:2px 6px;border-radius:4px;margin-left:6px;">٢</span>{{suggestion_2}}</div>
    <div style="color:#3E382E;font-size:14px;padding:4px 0;"><span style="background:#DEEBE2;color:#0F3D24;font-weight:700;font-size:11px;padding:2px 6px;border-radius:4px;margin-left:6px;">٣</span>{{suggestion_3}}</div>
  </div>
  ${BTN('{{validate_url}}', 'اعرض التقرير الكامل ←')}`
);

// ─── 8. inspiration-upgrade ──────────────────────────────────────────────────
export const INSPIRATION_UPGRADE_TEMPLATE = WRAP(
  BASE_HEADER('linear-gradient(135deg,#1B6B3E 0%,#D4A653 100%)', '🚀', 'حافظ على زخمك'),
  `${H2('أهلاً {{first_name}}، رسائل إلهامك الأسبوعية ستتوقف')}
  ${P('أكملت <strong>{{weeks_completed}} أسابيع</strong> من إلهام بذرة وتلقيت <strong>{{tips_received}} نصيحة ريادية</strong>. هذا تقدم حقيقي.')}
  <div style="background:#F5EAD3;border:1px solid #E8C07A;border-radius:10px;padding:24px;margin:0 0 24px;text-align:right;">
    <div style="font-size:13px;font-weight:700;color:#A07830;margin-bottom:12px;">ما حصلت عليه</div>
    ${STAT_ROW([
      { label: 'نصائح وصلتك', value: '{{tips_received}}', color: '#A07830' },
      { label: 'من أصل', value: '{{total_tips}}', color: '#8A8070' },
      { label: 'أسابيع نشطة', value: '{{weeks_completed}}', color: '#1B6B3E' },
    ])}
  </div>
  ${P('رقِّ إلى خطة مدفوعة لتستمر رسائل الإلهام الأسبوعية، وتفتح كل الـ {{total_tips}} نصيحة، وتحصل على وصول كامل لأدوات بذرة.')}
  ${BTN('https://bethra.co/pricing', 'رقِّ لتواصل التقدم ←', '#A07830')}
  ${P('<small style="color:#8A8070;">تقدمك محفوظ — رقِّ في أي وقت وواصل من حيث توقفت.</small>')}`
);

// ─── 7. weekly-inspiration ────────────────────────────────────────────────────
const CATEGORY_COLORS: Record<string, { color: string; bg: string }> = {};
export const WEEKLY_INSPIRATION_TEMPLATE = WRAP(
  BASE_HEADER('linear-gradient(135deg,#0F3D24 0%,#2A8A52 100%)', '💡', 'إلهام الأسبوع'),
  `<div style="margin-bottom:20px;text-align:right;">
    <span style="background:{{category_bg}};color:{{category_color}};font-size:11px;font-weight:700;padding:4px 12px;border-radius:100px;">{{category_label}}</span>
    <span style="color:#8A8070;font-size:12px;margin-right:10px;">النصيحة {{tip_number}} من {{total_tips}} · الأسبوع {{week_number}}</span>
  </div>
  ${H2('{{main_title}}')}
  ${P('أهلاً {{first_name}}،')}
  <div style="color:#3E382E;font-size:15px;line-height:1.9;margin:0 0 24px;text-align:right;">{{main_content}}</div>
  <div style="background:#FAF5E9;border:1px solid #E8C07A;border-radius:10px;padding:20px;margin:0 0 24px;text-align:right;">
    <div style="font-weight:700;color:#A07830;font-size:13px;margin-bottom:8px;">✏️ مهمتك هذا الأسبوع</div>
    <div style="color:#554E41;font-size:14px;line-height:1.8;">{{action_prompt}}</div>
  </div>
  ${BTN('{{dashboard_url}}', 'افتح لوحة التحكم ←', '#2A8A52')}
  ${P('<small style="color:#8A8070;">تصلك هذه الرسالة كجزء من رحلتك الريادية مع بذرة.</small>')}`
);
