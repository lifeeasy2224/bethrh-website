import { useState, useEffect } from 'react';
import { supabase } from '../supabase';

// Hardcoded defaults — pages render instantly with these; DB values override when loaded
export const CONTENT_DEFAULTS: Record<string, string> = {
  'home.hero.title':              'اصنع أول دولارك.',
  'home.hero.subtitle':           'خلال ٣٠ دقيقة، ستحصل على فكرة متحقَّق منها، وخطة إيرادات، ومسار واضح نحو أول عميل يدفع لك.',
  'home.hero.supporting_line':    'بلا خطة عمل من ٤٠ صفحة. بلا تخمين. مسار سريع وموثوق نحو الإيراد.',
  'home.hero.cta_founder':        'ابدأ مجاناً — لديّ فكرة',
  'home.hero.cta_investor':       'أنا مستثمر — أرني الفرص',
  'home.stats.founders':          '+٢٠٠٠ رائد أعمال يبنون الآن',
  'home.stats.validated':         '+٨٥٠ فكرة تم التحقق منها',
  'home.stats.ready':             '+٤٠ فكرة جاهزة للانطلاق',
  'home.whatisit.heading':        'أذكى طريق من «ماذا لو؟» إلى «ما التالي؟»',
  'home.whatisit.body':           'بذرة منصة تربط روّاد الأعمال في بداياتهم بالمستثمرين — لكننا لا نكتفي بالربط، بل نتأكد أنك جاهز فعلاً.',
  'home.whatisit.callout':        'لسنا مسرّعة أعمال. لسنا صندوق استثمار. نحن الجسر.',
  'home.features.title':          'مزايا تساعدك فعلاً',
  'home.features.subtitle':       'كل ما تحتاجه من الفكرة الأولى حتى التمويل.',
  'home.library.title':           'ليست لديك فكرة؟ لدينا أكثر من ٤٠ فكرة جاهزة.',
  'home.library.subtitle':        'تصفّح أفكاراً مدروسة مسبقاً في ٨ قطاعات — احجز فكرتك، خصّصها، وابدأ البناء اليوم.',
  'home.library.cta':             'استكشف مكتبة الأفكار',
  'home.score.title':             'درجة بذرة',
  'home.score.body':              'كل فكرة تحصل على درجة من ٠ إلى ١٠٠. كلما ارتفعت درجتك، اقتربت من جاهزية الاستثمار.',
  'home.cta.title':               'جاهز لتحويل فكرتك إلى دخل؟',
  'home.cta.subtitle':            'انضم إلى أكثر من ٢٠٠٠ رائد أعمال يبنون على بذرة.',
  'home.cta.btn1':                'ابدأ مجاناً — بلا بطاقة ائتمان',
  'home.cta.btn2':                'شاهد كيف تعمل بذرة',
  'home.pricing_teaser.title':    'أسعار بسيطة. بلا مفاجآت.',
  'home.pricing_teaser.subtitle': 'ابدأ مجاناً، وارتقِ عندما تكون جاهزاً.',
  'pricing.hero.title':           'أسعار بسيطة وشفافة',
  'pricing.hero.subtitle':        'ابدأ مجاناً وتوسّع عندما تكون جاهزاً. بلا رسوم خفية، وبلا حصة من شركتك.',
  'pricing.starter.tagline':      'استكشف المنصة واختبر فكرة',
  'pricing.builder.tagline':      'العدّة الكاملة لروّاد الأعمال الجادّين',
  'pricing.launch.tagline':       'كل شيء + الظهور أمام المستثمرين',
  'pricing.family.tagline':       'مزايا البنّاء حتى ٣ أفراد من العائلة',
  'pricing.students.title':       'الطلاب والمعلمون',
  'pricing.students.body':        'الطلاب والمعلمون الموثّقون يحصلون على خصم ٥٠٪ على جميع الخطط المدفوعة. راسلنا على info@bethra.co من بريدك الجامعي.',
  'pricing.investors.title':      'المستثمرون مجاناً دائماً',
  'pricing.investors.body':       'المستثمرون الملائكة وصناديق رأس المال الجريء الموثّقون يستخدمون بذرة بلا مقابل. تصفّح فرصاً متحقَّقاً منها، وتواصل مع المؤسسين، وتابع أفكار محفظتك.',
  'home.founder.visible':         'true',
  'home.founder.photo_url':       '',
  'home.founder.quote':           'قال لي أحدهم يوماً إن فكرتي ليست جاهزة. بدأتُ رغم ذلك — وهذا القرار غيّر حياتي.',
  'home.founder.body':            'هذه المنصة موجودة لأنني أؤمن أن فكرتك — الآن، بشكلها الخام وغير المكتمل — تكفي للبدء. أكثر من ١٥ عاماً من البناء والتعثر والتعلم والنجاح صُبّت في الإطار الذي ستستخدمه اليوم. ليس لتتجنب الأخطاء — بل لترتكب الأخطاء الصحيحة، أسرع.',
  'home.founder.highlight':       'لا يجب أن يُحرم أحد من ريادة الأعمال لأنه لم يُمنح دليل اللعب. أول دولار لك أقرب مما تظن. هيا نذهب إليه.',
  'home.founder.name':            'محمد رضا',
  'home.founder.title':           'المؤسس والرئيس التنفيذي',
};

let cache: Record<string, string> | null = null;
let fetchPromise: Promise<void> | null = null;
// Incremented on invalidation so useEffect deps change and consumers re-fetch
let cacheVersion = 0;
const listeners = new Set<() => void>();

async function fetchContent() {
  const { data } = await supabase
    .from('site_content')
    .select('key, value');
  if (data) {
    cache = {};
    for (const row of data) {
      cache[row.key] = row.value;
    }
  }
}

export function useSiteContent() {
  const [version, setVersion] = useState(cacheVersion);
  const [content, setContent] = useState<Record<string, string>>(cache ?? {});

  useEffect(() => {
    const notify = () => setVersion(v => v + 1);
    listeners.add(notify);
    return () => { listeners.delete(notify); };
  }, []);

  useEffect(() => {
    if (cache) {
      setContent(cache);
      return;
    }
    fetchPromise ??= fetchContent();
    fetchPromise.then(() => {
      if (cache) setContent(cache);
    });
  // re-run when cache is invalidated
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [version]);

  const t = (key: string, fallback?: string): string =>
    content[key] ?? CONTENT_DEFAULTS[key] ?? fallback ?? key;

  return { t };
}

export function invalidateContentCache() {
  cache = null;
  fetchPromise = null;
  cacheVersion += 1;
  listeners.forEach(fn => fn());
}
