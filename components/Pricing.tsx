'use client'

import { Check, Zap, ArrowLeft } from 'lucide-react'

const plans = [
  {
    name: 'المجاني',
    price: '0',
    desc: 'جرب بذرة وشوف السحر',
    features: [
      'Business Canvas واحد',
      '3 أسئلة ذكية للفكرة',
      'تحميل PDF بعلامة مائية',
      'دعم عبر الإيميل',
    ],
    cta: 'ابدأ مجاناً',
    popular: false,
  },
  {
    name: 'Pro',
    price: '49',
    desc: 'لرواد الأعمال الجادين',
    features: [
      'كل شيء في المجاني +',
      'Canvas + Roadmap غير محدود',
      'Wireframes & User Flow',
      'Pitch Deck احترافي 12 سلايد',
      'تحليل منافسين بالذكاء الاصطناعي',
      'تحميل بدون علامة مائية',
      'دعم واتساب أولوية',
    ],
    cta: 'اشترك في Pro',
    popular: true,
  },
  {
    name: 'Teams',
    price: '149',
    desc: 'للحاضنات والمستشارين',
    features: [
      'كل شيء في Pro +',
      '5 مقاعد للمستخدمين',
      'مجلدات مشاريع مشتركة',
      'تصدير Figma & Notion',
      'وايت ليبل: شعارك بدل بذرة',
      'مدير حساب مخصص',
    ],
    cta: 'تواصل مع المبيعات',
    popular: false,
  },
]

export default function Pricing() {
  return (
    <section
      id="pricing"
      dir="rtl"
      className="py-16 md:py-24"
      style={{ background: 'var(--off-white)' }}
    >
      <div className="max-w-7xl mx-auto px-4">

        <div className="text-center mb-12">
          <div
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-4"
            style={{ background: 'rgba(27,107,62,0.08)', color: 'var(--green-brand)' }}
          >
            <Zap className="w-4 h-4" />
            أسعار واضحة. بلا مفاجآت
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: 'var(--text-dark)' }}>
            اختر الخطة اللي تناسب مرحلتك
          </h2>
          <p className="text-lg max-w-2xl mx-auto" style={{ color: 'var(--gray-mid)' }}>
            ابدأ مجاناً. رقّي لما تحتاج مخرجات أكثر. الغِ اشتراكك أي وقت.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto">
          {plans.map((plan, i) => (
            <div
              key={i}
              className="relative rounded-2xl p-6 md:p-8 border-2 bg-white"
              style={{
                borderColor:  plan.popular ? 'var(--gold)' : 'var(--gray-light)',
                boxShadow:    plan.popular
                  ? '0 8px 24px rgba(212,166,83,0.18)'
                  : '0 4px 12px rgba(0,0,0,0.05)',
              }}
            >
              {plan.popular && (
                <div
                  className="absolute -top-4 right-6 text-xs font-bold px-4 py-1 rounded-full"
                  style={{ background: 'var(--gold)', color: 'var(--green-deep)' }}
                >
                  الأكثر طلباً
                </div>
              )}

              <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--text-dark)' }}>{plan.name}</h3>
              <p className="text-sm mb-6" style={{ color: 'var(--gray-mid)' }}>{plan.desc}</p>

              <div className="mb-6">
                <span className="text-4xl font-bold" style={{ color: 'var(--text-dark)' }}>${plan.price}</span>
                <span className="mr-1" style={{ color: 'var(--gray-mid)' }}>/ شهرياً</span>
              </div>

              <button
                className="w-full py-3 rounded-lg font-medium mb-8 transition-all flex items-center justify-center gap-2 text-white"
                style={{
                  background: plan.popular ? 'var(--gold)' : 'var(--green-deep)',
                  color:      plan.popular ? 'var(--green-deep)' : 'white',
                }}
              >
                {plan.cta}
                <ArrowLeft className="w-4 h-4" />
              </button>

              <div className="space-y-3">
                {plan.features.map((feature, idx) => (
                  <div key={idx} className="flex items-start gap-3">
                    <Check className="w-5 h-5 mt-0.5 flex-shrink-0" style={{ color: 'var(--green-brand)' }} />
                    <p className="text-sm" style={{ color: 'var(--text-dark)' }}>{feature}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <p className="text-center text-sm mt-10" style={{ color: 'var(--gray-mid)' }}>
          جميع الخطط تشمل تحديثات مستمرة + ضمان استرجاع 14 يوم
        </p>
      </div>
    </section>
  )
}
