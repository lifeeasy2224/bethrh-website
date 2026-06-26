'use client'

import { FileText, Zap, Download, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

const canvasBlocks = [
  { title: 'القيمة المقترحة', desc: 'وجبات صحية توصل في 30 دقيقة' },
  { title: 'شرائح العملاء', desc: 'موظفين + طلاب مهتمين بالصحة' },
  { title: 'القنوات', desc: 'تطبيق موبايل + انستقرام' },
  { title: 'مصادر الدخل', desc: 'اشتراكات شهرية + رسوم توصيل' },
]

export default function BusinessCanvas() {
  return (
    <section className="py-16 md:py-24 bg-white" dir="rtl">
      <div className="max-w-7xl mx-auto px-4">

        <div className="grid lg:grid-cols-2 gap-12 items-center">

          {/* النص */}
          <div>
            <div className="inline-flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Zap className="w-4 h-4" />
              من فكرة إلى نموذج العمل التجاري في دقائق
            </div>

            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              Canvas (نموذج العمل التجاري) كامل...
              <span className="text-green-600"> بدون ما تكتب سطر</span>
            </h2>

            <p className="text-gray-600 text-lg mb-8 leading-relaxed">
              احكي لـ Bazra عن فكرتك. هو يسألك الأسئلة الصح، ويعبي لك الـ 9 مربعات
              بمحتوى حقيقي مبني على فكرتك والسوق. لا Miro ولا قوالب فاضية.
            </p>

            <div className="space-y-4 mb-8">
              {[
                { title: 'محتوى ذكي، مو قوالب', desc: 'كل مربع ينكتب مخصوص لفكرتك' },
                { title: 'جاهز للعرض فوراً', desc: 'PDF احترافي ترسله للمستثمرين' },
                { title: 'يكمل معك للنهاية', desc: 'يحوله لعرض للتمويل ومشوار الـ 90 يوم' },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3 justify-end">
                  <div>
                    <p className="font-semibold text-gray-900">{item.title}</p>
                    <p className="text-gray-600 text-sm">{item.desc}</p>
                  </div>
                  <div className="w-2 h-2 bg-green-600 rounded-full mt-2 flex-shrink-0" />
                </div>
              ))}
            </div>

            <Link
              href="/canvas"
              className="group bg-gray-900 text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-800 transition-all flex items-center gap-2 w-fit"
            >
              جرب تكوين Canvas مجاناً — بدون تسجيل
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            </Link>
          </div>

          {/* صورة الـ Canvas */}
          <div className="relative">
            <div className="bg-gray-50 rounded-2xl p-6 md:p-8 shadow-[0_8px_24px_rgba(0,0,0,0.08)] border border-gray-200">

              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-green-600" />
                  <p className="font-bold text-gray-900">Canvas — نموذج العمل التجاري</p>
                </div>
                <div className="flex items-center gap-1 text-xs text-gray-700 bg-white px-3 py-1 rounded-full border">
                  <Download className="w-3 h-3" />
                  PDF
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {canvasBlocks.map((block, i) => (
                  <div key={i} className="bg-white p-4 rounded-lg border border-gray-200">
                    <p className="text-sm font-semibold text-green-600 mb-1">{block.title}</p>
                    <p className="text-sm text-gray-700">{block.desc}</p>
                  </div>
                ))}
              </div>

              <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                <p className="text-sm text-green-700 font-medium">
                  + 5 مربعات أخرى جاهزة للتحميل
                </p>
              </div>
            </div>

            {/* Badge */}
            <div className="absolute -top-4 -left-4 bg-white shadow-lg rounded-xl px-4 py-2 border border-gray-200 animate-bounce">
              <p className="text-xs text-gray-700">تم الإنشاء في</p>
              <p className="font-bold text-green-600">47 ثانية</p>
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
