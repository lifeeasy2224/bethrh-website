import './globals.css';
import type { Metadata } from 'next';
import { Toaster } from '@/components/ui/toaster';
import CookieBanner from '@/components/CookieBanner';
import I18nProvider from '@/components/I18nProvider';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';

export const metadata: Metadata = {
  title: 'بذرة — منصة تسريع الأعمال',
  description: 'تحقق من فكرتك، ابنِ شركتك الناشئة، وتواصل مع رواد الأعمال في منطقة الشرق الأوسط وشمال أفريقيا.',
  keywords: 'بذرة, bethra, ريادة أعمال, مشاريع ناشئة, الشرق الأوسط',
  openGraph: {
    title: 'بذرة — منصة تسريع الأعمال',
    description: 'انطلق بفكرتك — اصنع مستقبلك',
    url: 'https://bethra.co',
    siteName: 'بذرة',
    locale: 'ar_SA',
    type: 'website',
  },
  metadataBase: new URL('https://bethra.co'),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="preload"
          as="style"
          href="https://fonts.googleapis.com/css2?family=Noto+Kufi+Arabic:wght@400;600;700&family=Nunito+Sans:wght@400;600;700;800&family=Montserrat:wght@400;600;700;800&display=swap"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Noto+Kufi+Arabic:wght@400;600;700&family=Nunito+Sans:wght@400;600;700;800&family=Montserrat:wght@400;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <I18nProvider>
          <SiteHeader />
          <main className="pt-16 min-h-screen">
            {children}
          </main>
          <SiteFooter />
        </I18nProvider>
        <Toaster />
        <CookieBanner />
        
          href="https://wa.me/14804476256"
          target="_blank"
          rel="noopener noreferrer"
          aria-label="تواصل واتساب"
          className="fixed bottom-5 left-5 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-110"
          style={{ background: '#25D366' }}
        >
          <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" fill="white"/>
            <path d="M12 2C6.477 2 2 6.477 2 12c0 1.89.525 3.66 1.438 5.168L2 22l4.978-1.304A9.96 9.96 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 12 2zm0 18a7.96 7.96 0 01-4.076-1.117l-.292-.174-3.035.795.81-2.96-.19-.304A7.96 7.96 0 014 12c0-4.418 3.582-8 8-8s8 3.582 8 8-3.582 8-8 8z" fill="white"/>
          </svg>
        </a>
      </body>
    </html>
  );
}
