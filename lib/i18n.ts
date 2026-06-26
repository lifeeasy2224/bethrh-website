'use client';

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      ar: { translation: require('../public/locales/ar/translation.json') },
      en: { translation: require('../public/locales/en/translation.json') },
      es: { translation: require('../public/locales/es/translation.json') },
      fr: { translation: require('../public/locales/fr/translation.json') },
      tr: { translation: require('../public/locales/tr/translation.json') },
    },
    fallbackLng: 'ar',
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
    interpolation: { escapeValue: false },
  });

export default i18n;
