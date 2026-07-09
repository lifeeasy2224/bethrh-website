import 'jsr:@supabase/functions-js/edge-runtime.d.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Client-Info, Apikey',
};

// ─── Templates (Arabic RTL, Bethra brand) ────────────────────────────────────
// Email clients can't load web fonts reliably; use a system stack that renders
// Arabic well. Variable names must match what client callers already pass.

const FONT = `'Segoe UI',Tahoma,Arial,sans-serif`;

const WRAP = (gradient: string, emoji: string, headerTitle: string, body: string) => `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F7F3EC;font-family:${FONT};" dir="rtl">
  <table width="100%" cellpadding="0" cellspacing="0" dir="rtl"><tr><td align="center" style="padding:40px 16px;">
    <table width="560" cellpadding="0" cellspacing="0" dir="rtl" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,0.08);">
      <tr><td style="background:${gradient};padding:40px 40px 32px;text-align:center;">
        <img src="https://bethra.co/email-logo.png" alt="بذرة" width="160" style="display:block;margin:0 auto;border:0;outline:none;text-decoration:none;" />
        <div style="font-size:20px;margin-top:10px;">${emoji}</div>
        <div style="color:#F7F3EC;font-size:18px;font-weight:700;margin-top:6px;">${headerTitle}</div>
      </td></tr>
      <tr><td style="padding:40px;text-align:right;">${body}</td></tr>
      <tr><td style="background:#F7F3EC;padding:20px 40px;text-align:center;border-top:1px solid #E8E4DC;">
        <p style="color:#8A8070;font-size:12px;margin:0;">© ٢٠٢٦ بذرة · <a href="{{unsubscribe_url}}" style="color:#8A8070;">إلغاء الاشتراك</a></p>
      </td></tr>
    </table>
  </td></tr></table>
</body>
</html>`;

const BTN = (href: string, label: string, color = '#0F3D24') =>
  `<div style="text-align:center;margin:28px 0 8px;">
    <a href="${href}" style="display:inline-block;background:${color};color:#F7F3EC;font-weight:700;font-size:15px;padding:14px 32px;border-radius:8px;text-decoration:none;">${label}</a>
  </div>`;

const GREEN_GRADIENT = 'linear-gradient(135deg,#0F3D24 0%,#1B6B3E 100%)';
const GOLD_GRADIENT = 'linear-gradient(135deg,#0F3D24 0%,#D4A653 100%)';

const TEMPLATES: Record<string, { subject: string; html: string }> = {
  'welcome-email': {
    subject: 'أهلاً بك في بذرة — رحلتك تبدأ من هنا',
    html: WRAP(GREEN_GRADIENT, '🚀', 'تحقق. ابنِ. انطلق.', `
      <h1 style="margin:0 0 8px;font-size:24px;font-weight:700;color:#0F3D24;">أهلاً {{name}}! 🚀</h1>
      <p style="color:#8A8070;font-size:15px;line-height:1.9;margin:0 0 24px;">انضممت بصفة <strong>{{role}}</strong>. رحلتك مع بذرة تبدأ الآن — إليك ما تفعله أولاً:</p>
      <table width="100%" cellpadding="0" cellspacing="0" dir="rtl" style="margin-bottom:28px;">
        <tr>
          <td style="background:#F0F5F1;border-radius:8px;padding:16px;width:48%;text-align:right;">
            <div style="font-size:20px;">✅</div>
            <div style="font-weight:600;color:#1B6B3E;font-size:14px;margin-top:6px;">تحقق من فكرتك</div>
            <div style="color:#8A8070;font-size:13px;margin-top:4px;">جرّب اختبار الفكرة المجاني (٥ أسئلة)</div>
          </td>
          <td width="4%"></td>
          <td style="background:#F5EAD3;border-radius:8px;padding:16px;width:48%;text-align:right;">
            <div style="font-size:20px;">🗺️</div>
            <div style="font-weight:600;color:#A07830;font-size:14px;margin-top:6px;">ابدأ رحلتك</div>
            <div style="color:#8A8070;font-size:13px;margin-top:4px;">خارطة ١٢ أسبوعاً حتى أول إيراد</div>
          </td>
        </tr>
      </table>
      ${BTN('{{dashboard_url}}', 'اذهب إلى لوحة التحكم ←')}
      <p style="color:#8A8070;font-size:13px;text-align:center;margin:0;">لديك سؤال؟ رد على هذه الرسالة — نقرأ كل رسالة.</p>`),
  },

  'investor-match': {
    subject: 'مستثمر تطابق مع فكرتك على بذرة',
    html: WRAP(GOLD_GRADIENT, '🤝', 'تطابق جديد!', `
      <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#0F3D24;">أهلاً {{founder_name}}،</h1>
      <p style="color:#8A8070;font-size:15px;line-height:1.9;margin:0 0 20px;">مستثمر تتطابق معاييره مع فكرتك <strong>«{{idea_title}}»</strong>.</p>
      <div style="background:#FAF5E9;border:1px solid #E8C07A;border-radius:10px;padding:20px;margin:0 0 20px;text-align:right;">
        <div style="font-weight:600;color:#A07830;font-size:14px;margin-bottom:10px;">عن المستثمر:</div>
        <div style="color:#3E382E;font-size:14px;margin-bottom:4px;">النوع: <strong>{{investor_type}}</strong></div>
        <div style="color:#3E382E;font-size:14px;margin-bottom:4px;">حجم الاستثمار: <strong>{{check_size}}</strong></div>
        <div style="color:#3E382E;font-size:14px;">القطاعات: <strong>{{sectors}}</strong></div>
      </div>
      ${BTN('{{connections_url}}', 'اعرض التواصلات ←', '#A07830')}`),
  },

  'investor-interested': {
    subject: 'مستثمر مهتم بفكرتك!',
    html: WRAP(GREEN_GRADIENT, '💸', 'مستثمر مهتم!', `
      <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#0F3D24;">أهلاً {{founder_name}}،</h1>
      <p style="color:#8A8070;font-size:15px;line-height:1.9;margin:0 0 20px;">مستثمر أبدى اهتمامه بفكرتك <strong>«{{idea_title}}»</strong> ويريد التواصل معك.</p>
      <div style="background:#FAF8F3;border-right:4px solid #2A8A52;border-radius:8px 0 0 8px;padding:16px 20px;margin:0 0 20px;text-align:right;">
        <div style="font-weight:600;color:#3E382E;font-size:13px;margin-bottom:4px;">رسالته:</div>
        <div style="color:#8A8070;font-size:14px;font-style:italic;">«{{message}}»</div>
      </div>
      <p style="color:#8A8070;font-size:13px;margin:0 0 20px;">أمامك ١٤ يوماً للرد قبل انتهاء صلاحية الطلب.</p>
      ${BTN('{{connections_url}}', 'ردّ الآن ←', '#2A8A52')}`),
  },

  'new-message': {
    subject: 'رسالة جديدة من {{sender_name}} على بذرة',
    html: WRAP(GREEN_GRADIENT, '💬', 'رسالة جديدة', `
      <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#0F3D24;">أهلاً {{recipient_name}}،</h1>
      <p style="color:#8A8070;font-size:15px;line-height:1.9;margin:0 0 20px;"><strong>{{sender_name}}</strong> أرسل لك رسالة بخصوص <strong>«{{idea_title}}»</strong>:</p>
      <div style="background:#F0F5F1;border-right:4px solid #1B6B3E;border-radius:8px 0 0 8px;padding:16px 20px;margin:0 0 20px;text-align:right;">
        <p style="color:#3E382E;font-size:15px;line-height:1.8;margin:0;">{{message_preview}}</p>
      </div>
      ${BTN('{{chat_url}}', 'ردّ الآن ←', '#1B6B3E')}
      <p style="color:#8A8070;font-size:13px;text-align:center;margin:0;">ردّ سريعاً لتحافظ على تواصلك نشطاً.</p>`),
  },

  'validation-complete': {
    subject: 'نتائج اختبار فكرتك الذكي جاهزة',
    html: WRAP(GREEN_GRADIENT, '🤖', 'اكتمل التحليل', `
      <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#0F3D24;">أهلاً {{name}}، نتائجك جاهزة</h1>
      <p style="color:#8A8070;font-size:15px;line-height:1.9;margin:0 0 20px;">حُلّلت فكرتك <strong>«{{idea_title}}»</strong> بالذكاء الاصطناعي.</p>
      <div style="background:{{score_bg}};border-radius:10px;padding:24px;text-align:center;margin:0 0 24px;">
        <div style="font-size:52px;font-weight:900;color:{{score_color}};">{{score}}/10</div>
        <div style="font-weight:700;color:{{score_color}};font-size:15px;margin-top:4px;">{{verdict}}</div>
      </div>
      <div style="margin:0 0 16px;text-align:right;">
        <div style="font-weight:700;color:#0F3D24;font-size:14px;margin-bottom:8px;">أبرز نقاط القوة</div>
        {{strengths_html}}
      </div>
      <div style="margin:0 0 24px;text-align:right;">
        <div style="font-weight:700;color:#0F3D24;font-size:14px;margin-bottom:8px;">أهم الاقتراحات</div>
        {{suggestions_html}}
      </div>
      ${BTN('{{validate_url}}', 'اعرض التقرير الكامل ←')}`),
  },

  'weekly-digest': {
    subject: 'ملخصك الأسبوعي من بذرة — {{week_date}}',
    html: WRAP(GREEN_GRADIENT, '📊', 'ملخصك الأسبوعي', `
      <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#0F3D24;">صباح الخير يا {{name}}!</h1>
      <p style="color:#8A8070;font-size:15px;line-height:1.9;margin:0 0 20px;">هذا ملخصك من بذرة لأسبوع <strong>{{week_date}}</strong>.</p>
      <div style="background:#F0F5F1;border-radius:10px;padding:4px 0;margin:0 0 24px;">
        <table width="100%" cellpadding="0" cellspacing="0" dir="rtl">
          <tr>
            <td align="center" style="padding:12px;">
              <div style="font-size:30px;font-weight:800;color:#1B6B3E;">{{iq_score}}</div>
              <div style="color:#8A8070;font-size:12px;">درجة بذرة</div>
            </td>
            <td align="center" style="padding:12px;">
              <div style="font-size:30px;font-weight:800;color:#D4A653;">{{streak}}🔥</div>
              <div style="color:#8A8070;font-size:12px;">سلسلة الأيام</div>
            </td>
            <td align="center" style="padding:12px;">
              <div style="font-size:30px;font-weight:800;color:#2A8A52;">٪{{journey_pct}}</div>
              <div style="color:#8A8070;font-size:12px;">الرحلة</div>
            </td>
          </tr>
        </table>
      </div>
      <div style="margin-bottom:24px;text-align:right;">
        <div style="font-weight:700;color:#0F3D24;font-size:15px;margin-bottom:12px;">🎯 تركيز هذا الأسبوع</div>
        {{weekly_tasks_html}}
      </div>
      ${BTN('{{dashboard_url}}', 'افتح لوحة التحكم ←')}`),
  },
};

// ─── Template renderer ────────────────────────────────────────────────────────

function renderTemplate(html: string, variables: Record<string, string>): string {
  return html.replace(/\{\{(\w+)\}\}/g, (_, key) => variables[key] ?? '');
}

// ─── Handler ──────────────────────────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { to, template_name, variables = {} } = await req.json() as {
      to: string;
      template_name: string;
      variables: Record<string, string>;
    };

    if (!to || !template_name) {
      return new Response(JSON.stringify({ error: 'to and template_name are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const template = TEMPLATES[template_name];
    if (!template) {
      return new Response(JSON.stringify({ error: `Unknown template: ${template_name}` }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const apiKey = Deno.env.get('RESEND_API_KEY');
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'RESEND_API_KEY not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const subject = renderTemplate(template.subject, variables);
    const html = renderTemplate(template.html, variables);

    const resendRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'بذرة <info@bethra.co>',
        to: [to],
        subject,
        html,
      }),
    });

    const resendData = await resendRes.json();

    if (!resendRes.ok) {
      return new Response(JSON.stringify({ error: resendData }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ ok: true, id: resendData.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
