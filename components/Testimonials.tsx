'use client'

import { Quote, Star } from 'lucide-react'
import Image from 'next/image'
import { useRef, useState } from 'react'

type Testimonial = {
  quote: string
  name: string
  role: string
  avatar: string
  rating: number
}

const testimonials: Testimonial[] = [
  {
    quote: "بذرة خلّتني أشوف فكرتي بوضوح لأول مرة. خرجت بخطة واضحة خلال أيام وبدأت التنفيذ فوراً.",
    name: "سامر أحمد",
    role: "رائد أعمال — مرحلة الفكرة",
    avatar: "https://i.pravatar.cc/96?img=11",
    rating: 5,
  },
  {
    quote: "التحليل المالي كان أهم شيء… أخيرًا فهمت أرقامي وعرضتها على المستثمر بثقة كاملة.",
    name: "عبدالرحمن محمد",
    role: "مؤسس — قطاع التقنية",
    avatar: "https://i.pravatar.cc/96?img=52",
    rating: 5,
  },
  {
    quote: "المخرجات كانت جاهزة للعرض على المستثمرين. وفّرت عليّ أشهرًا من التخطيط والتجربة والخطأ.",
    name: "صالح براء",
    role: "مؤسس مشروع ناشئ",
    avatar: "https://i.pravatar.cc/96?img=57",
    rating: 5,
  },
  {
    quote: "اختصرت علي شهور من التخطيط وساعدتني على تركيز أفكاري في مسار واحد واضح ومنظّم.",
    name: "نايا رضا",
    role: "رائدة أعمال — قطاع التعليم",
    avatar: "https://i.pravatar.cc/96?img=25",
    rating: 5,
  },
  {
    quote: "خطوات نموذج العمل التجاري اختصرت عليّ أسابيع من التخطيط وأعطتني رؤية واضحة من البداية.",
    name: "يوسف الخالد",
    role: "رائد أعمال تقني",
    avatar: "https://i.pravatar.cc/96?img=33",
    rating: 5,
  },
  {
    quote: "كنت أشعر أن فكرتي أكبر مني، غير أن بذرة جعلتني أراها بوضوح وأطلقت نموذجاً أولياً خلال أسبوع.",
    name: "يمان حسن",
    role: "رائد أعمال — مرحلة البناء",
    avatar: "https://i.pravatar.cc/96?img=12",
    rating: 5,
  },
  {
    quote: "وفّرت عليّ ثلاثة أشهر من التخطيط وحوّلت أفكاري المبعثرة إلى خطة عمل قابلة للتنفيذ أمام المستثمرين.",
    name: "يارا منير",
    role: "مؤسِّسة مشروع ناشئ",
    avatar: "https://i.pravatar.cc/96?img=5",
    rating: 5,
  },
  {
    quote: "خارطة الطريق كانت جاهزة للعرض على المستثمرين، مما رفع ثقتهم في مشروعي بشكل ملحوظ.",
    name: "لانة العمري",
    role: "بانية شركة ناشئة",
    avatar: "https://i.pravatar.cc/96?img=45",
    rating: 5,
  },
]

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          className="w-3.5 h-3.5"
          style={{
            fill: i < rating ? 'var(--gold)' : 'var(--gray-light)',
            color: i < rating ? 'var(--gold)' : 'var(--gray-light)',
          }}
        />
      ))}
    </div>
  )
}

function TestimonialCard({ quote, name, role, avatar, rating }: Testimonial) {
  return (
    <div
      className="flex flex-col gap-4 p-6 rounded-2xl border h-full transition-all duration-300 hover:-translate-y-1"
      style={{
        background: 'var(--white)',
        borderColor: 'var(--gray-light)',
        boxShadow: '0 2px 8px rgba(15,61,36,0.06)',
      }}
    >
      <div className="flex items-center justify-between">
        <Quote className="w-5 h-5" style={{ color: 'var(--green-brand)', opacity: 0.5 }} />
        <StarRating rating={rating} />
      </div>

      <p className="text-sm leading-relaxed flex-grow text-right" style={{ color: 'var(--text-dark)' }}>
        &ldquo;{quote}&rdquo;
      </p>

      <div
        className="flex items-center gap-3 pt-3 border-t flex-row-reverse"
        style={{ borderColor: 'var(--gray-light)' }}
      >
        <Image
          src={avatar}
          alt={name}
          width={40}
          height={40}
          className="rounded-full shrink-0 object-cover"
          style={{ background: 'var(--gray-light)' }}
        />
        <div className="flex flex-col gap-0.5 text-right">
          <p className="font-semibold text-sm" style={{ color: 'var(--text-dark)' }}>{name}</p>
          <p className="text-xs" style={{ color: 'var(--gray-mid)' }}>{role}</p>
        </div>
      </div>
    </div>
  )
}

export default function Testimonials() {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [activeIndex, setActiveIndex] = useState(0)

  function scrollTo(index: number) {
    const container = scrollRef.current
    if (!container) return
    const child = container.children[index] as HTMLElement
    if (!child) return
    container.scrollTo({ left: child.offsetLeft - 16, behavior: 'smooth' })
    setActiveIndex(index)
  }

  function handleScroll() {
    const container = scrollRef.current
    if (!container) return
    const index = Math.round(container.scrollLeft / (container.offsetWidth * 0.88))
    setActiveIndex(Math.max(0, Math.min(index, testimonials.length - 1)))
  }

  return (
    <section className="py-16 md:py-24" dir="rtl" style={{ background: 'var(--off-white)' }}>
      <div className="max-w-7xl mx-auto px-4">

        <div className="text-center mb-12">
          <span
            className="inline-block text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-4"
            style={{ background: 'rgba(27,107,62,0.08)', color: 'var(--green-brand)' }}
          >
            آراء المستخدمين
          </span>
          <h2
            className="font-extrabold mb-3"
            style={{ color: 'var(--text-dark)', fontSize: 'clamp(1.7rem, 4vw, 2.5rem)' }}
          >
            ماذا يقول رواد الأعمال عن بذرة؟
          </h2>
          <p className="text-base" style={{ color: 'var(--gray-mid)' }}>
            أكثر من ٢٠٠٠ مؤسس حوّلوا أفكارهم إلى مشاريع حقيقية
          </p>
        </div>

        {/* Desktop: 4-column grid */}
        <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-4 gap-5">
          {testimonials.map((t, i) => (
            <div
              key={i}
              className="opacity-0 translate-y-6 animate-[fadeUp_0.5s_ease_forwards]"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              <TestimonialCard {...t} />
            </div>
          ))}
        </div>

        {/* Mobile: snap carousel */}
        <div className="md:hidden">
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="flex gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-4"
            style={{ scrollPaddingRight: '16px' }}
          >
            {testimonials.map((t, i) => (
              <div key={i} className="snap-start shrink-0" style={{ width: 'calc(88vw - 32px)' }}>
                <TestimonialCard {...t} />
              </div>
            ))}
          </div>

          <div className="flex justify-center gap-2 mt-5">
            {testimonials.map((_, i) => (
              <button
                key={i}
                onClick={() => scrollTo(i)}
                aria-label={`Slide ${i + 1}`}
                className="rounded-full transition-all duration-300 min-w-[44px] min-h-[44px] flex items-center justify-center"
              >
                <span
                  className="rounded-full block transition-all duration-300"
                  style={{
                    width: i === activeIndex ? '20px' : '8px',
                    height: '8px',
                    background: i === activeIndex ? 'var(--green-brand)' : 'var(--gray-light)',
                  }}
                />
              </button>
            ))}
          </div>
        </div>

      </div>
    </section>
  )
}
