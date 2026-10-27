import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../supabase';

const Q1_OPTIONS = [
  { id: 'home', label: 'من المنزل' },
  { id: 'cafe', label: 'مقهى' },
  { id: 'cowork', label: 'مساحة عمل مشتركة' },
  { id: 'office', label: 'مكتب خاص' },
  { id: 'none', label: 'لا يوجد خيار مناسب' },
];

const Q2_OPTIONS = [
  { id: 'internet', label: 'إنترنت سريع وموثوق' },
  { id: 'quiet', label: 'هدوء وتركيز' },
  { id: 'community', label: 'وجود رواد أعمال آخرين' },
  { id: 'location', label: 'موقع مريح ومركزي' },
  { id: 'meeting', label: 'قاعات اجتماعات' },
  { id: 'price', label: 'سعر معقول' },
  { id: 'hours', label: 'ساعات عمل مرنة' },
];

const Q4_OPTIONS = [
  { id: 'under50', label: 'أقل من $50 / شهر' },
  { id: '50_100', label: '$50 – $100 / شهر' },
  { id: '100_200', label: '$100 – $200 / شهر' },
  { id: 'over200', label: 'أكثر من $200 / شهر' },
];

type Step = 1 | 2 | 3 | 4 | 5 | 'done';

export default function SurveyPage() {
  const [params] = useSearchParams();
  const token = params.get('t') ?? '';

  const [step, setStep] = useState<Step>(1);
  const [q1, setQ1] = useState<string[]>([]);
  const [q2, setQ2] = useState<string[]>([]);
  const [q3, setQ3] = useState<boolean | null>(null);
  const [q3details, setQ3details] = useState('');
  const [q4, setQ4] = useState('');
  const [q5, setQ5] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    document.documentElement.dir = 'rtl';
    document.documentElement.lang = 'ar';
    return () => { document.documentElement.dir = 'ltr'; };
  }, []);

  function toggle(arr: string[], val: string) {
    return arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val];
  }

  async function submit() {
    if (!token) { setError('رابط غير صالح'); return; }
    setSaving(true);
    // Saved through a database function that matches the emailed token and
    // reports back if it is unknown — never show "thanks" for an unsaved answer.
    const { data: result, error: err } = await supabase.rpc('submit_survey', {
      p_token: token,
      p_q1: q1,
      p_q2: q2,
      p_q3: q3,
      p_q3_details: q3details || null,
      p_q4: q4,
      p_q5: q5 || null,
    });
    setSaving(false);
    if (err) { setError('حدث خطأ، حاول مرة أخرى'); return; }
    if (result === 'not_found') { setError('هذا الرابط غير صالح. راسلنا على info@bethra.co وسنرسل لك رابطاً جديداً.'); return; }
    setStep('done'); // 'ok' or 'already' (answers were saved earlier)
  }

  const TOTAL = 5;
  const current = step === 'done' ? TOTAL : (step as number);

  return (
    <div style={{
      minHeight: '100vh',
      background: '#F7F3EC',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px 16px',
      fontFamily: "'Noto Kufi Arabic', 'Segoe UI', Arial, sans-serif",
      direction: 'rtl',
    }}>
      <link href="https://fonts.googleapis.com/css2?family=Noto+Kufi+Arabic:wght@400;700&display=swap" rel="stylesheet" />

      <div style={{ width: '100%', maxWidth: 560 }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ color: '#D4A653', fontSize: 32, fontWeight: 700, marginBottom: 4 }}>بذرة</div>
          <div style={{ color: '#555', fontSize: 14 }}>استبيان بيئة العمل</div>
        </div>

        {step !== 'done' && (
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13, color: '#666' }}>
              <span>السؤال {current} من {TOTAL}</span>
            </div>
            <div style={{ height: 6, background: '#e0d8cc', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${(current / TOTAL) * 100}%`, background: '#1B6B3E', borderRadius: 3, transition: 'width 0.3s' }} />
            </div>
          </div>
        )}

        <div style={{ background: '#fff', borderRadius: 16, padding: '32px 28px', boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}>

          {step === 1 && (
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0F3D24', marginBottom: 8 }}>
                ما هي الخيارات المتاحة لك حالياً للعمل خارج المنزل؟
              </h2>
              <p style={{ color: '#666', fontSize: 14, marginBottom: 20 }}>يمكنك اختيار أكثر من إجابة</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {Q1_OPTIONS.map(o => (
                  <button key={o.id} onClick={() => setQ1(toggle(q1, o.id))} style={chipStyle(q1.includes(o.id))}>
                    {o.label}
                  </button>
                ))}
              </div>
              <NextBtn disabled={q1.length === 0} onClick={() => setStep(2)} />
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0F3D24', marginBottom: 8 }}>
                ما أهم 3 عوامل في مساحة العمل المثالية؟
              </h2>
              <p style={{ color: '#666', fontSize: 14, marginBottom: 20 }}>اختر 3 على الأقل</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {Q2_OPTIONS.map(o => (
                  <button key={o.id} onClick={() => setQ2(toggle(q2, o.id))} style={chipStyle(q2.includes(o.id))}>
                    {o.label}
                  </button>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
                <BackBtn onClick={() => setStep(1)} />
                <NextBtn disabled={q2.length < 1} onClick={() => setStep(3)} />
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0F3D24', marginBottom: 8 }}>
                هل سبق أن خسرت فرصة بسبب غياب مكان عمل مناسب؟
              </h2>
              <p style={{ color: '#666', fontSize: 14, marginBottom: 20 }}>(اجتماع، عميل، مشروع...)</p>
              <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
                <button onClick={() => setQ3(true)} style={chipStyle(q3 === true)}>نعم</button>
                <button onClick={() => setQ3(false)} style={chipStyle(q3 === false)}>لا</button>
              </div>
              {q3 === true && (
                <textarea
                  placeholder="أخبرنا ماذا حصل... (اختياري)"
                  value={q3details}
                  onChange={e => setQ3details(e.target.value)}
                  rows={3}
                  style={textareaStyle}
                />
              )}
              <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                <BackBtn onClick={() => setStep(2)} />
                <NextBtn disabled={q3 === null} onClick={() => setStep(4)} />
              </div>
            </div>
          )}

          {step === 4 && (
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0F3D24', marginBottom: 8 }}>
                ما السعر الشهري المناسب لمساحة عمل احترافية؟
              </h2>
              <p style={{ color: '#666', fontSize: 14, marginBottom: 20 }}>بالدولار الأمريكي</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {Q4_OPTIONS.map(o => (
                  <button key={o.id} onClick={() => setQ4(o.id)} style={chipStyle(q4 === o.id)}>
                    {o.label}
                  </button>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
                <BackBtn onClick={() => setStep(3)} />
                <NextBtn disabled={!q4} onClick={() => setStep(5)} />
              </div>
            </div>
          )}

          {step === 5 && (
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 700, color: '#0F3D24', marginBottom: 8 }}>
                أي شيء آخر تريد إضافته؟
              </h2>
              <p style={{ color: '#666', fontSize: 14, marginBottom: 20 }}>اختياري — أي ملاحظة أو اقتراح</p>
              <textarea
                placeholder="اكتب هنا..."
                value={q5}
                onChange={e => setQ5(e.target.value)}
                rows={4}
                style={textareaStyle}
              />
              {error && <p style={{ color: '#c00', fontSize: 13, marginTop: 8 }}>{error}</p>}
              <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                <BackBtn onClick={() => setStep(4)} />
                <button
                  onClick={submit}
                  disabled={saving}
                  style={{ ...nextStyle, opacity: saving ? 0.7 : 1 }}
                >
                  {saving ? 'جاري الإرسال...' : 'إرسال الإجابات'}
                </button>
              </div>
            </div>
          )}

          {step === 'done' && (
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <div style={{ fontSize: 48, marginBottom: 16 }}>🌱</div>
              <h2 style={{ fontSize: 22, fontWeight: 700, color: '#0F3D24', marginBottom: 12 }}>شكراً لك!</h2>
              <p style={{ color: '#555', fontSize: 15, lineHeight: 1.8 }}>
                إجاباتك ستساعدنا على بناء بيئة العمل التي يستحقها رواد الأعمال العرب.
              </p>
              <a href="https://bethra.co" style={{ display: 'inline-block', marginTop: 24, color: '#1B6B3E', fontSize: 14, textDecoration: 'none', fontWeight: 700 }}>
                العودة إلى بذرة ←
              </a>
            </div>
          )}

        </div>

        <p style={{ textAlign: 'center', color: '#999', fontSize: 12, marginTop: 20 }}>
          bethra.co · info@bethra.co
        </p>
      </div>
    </div>
  );
}

function chipStyle(active: boolean): React.CSSProperties {
  return {
    padding: '12px 18px',
    borderRadius: 10,
    border: `2px solid ${active ? '#1B6B3E' : '#e0d8cc'}`,
    background: active ? '#e8f4ed' : '#fafaf8',
    color: active ? '#0F3D24' : '#333',
    fontWeight: active ? 700 : 400,
    fontSize: 15,
    cursor: 'pointer',
    textAlign: 'right',
    transition: 'all 0.15s',
    fontFamily: "'Noto Kufi Arabic', Arial, sans-serif",
  };
}

const nextStyle: React.CSSProperties = {
  flex: 1,
  padding: '13px 0',
  background: '#1B6B3E',
  color: '#fff',
  border: 'none',
  borderRadius: 10,
  fontSize: 15,
  fontWeight: 700,
  cursor: 'pointer',
  fontFamily: "'Noto Kufi Arabic', Arial, sans-serif",
};

const backStyle: React.CSSProperties = {
  padding: '13px 20px',
  background: 'transparent',
  color: '#666',
  border: '2px solid #e0d8cc',
  borderRadius: 10,
  fontSize: 14,
  cursor: 'pointer',
  fontFamily: "'Noto Kufi Arabic', Arial, sans-serif",
};

const textareaStyle: React.CSSProperties = {
  width: '100%',
  padding: 12,
  borderRadius: 10,
  border: '2px solid #e0d8cc',
  fontSize: 14,
  fontFamily: "'Noto Kufi Arabic', Arial, sans-serif",
  resize: 'vertical',
  direction: 'rtl',
  boxSizing: 'border-box',
};

function NextBtn({ onClick, disabled }: { onClick: () => void; disabled: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled} style={{ ...nextStyle, opacity: disabled ? 0.5 : 1, flex: 1 }}>
      التالي ←
    </button>
  );
}

function BackBtn({ onClick }: { onClick: () => void }) {
  return <button onClick={onClick} style={backStyle}>→ رجوع</button>;
}
