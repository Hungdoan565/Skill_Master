import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';

import viCommon from '@/locales/vi/common.json';
import viNavigation from '@/locales/vi/navigation.json';
import viAuth from '@/locales/vi/auth.json';
import enCommon from '@/locales/en/common.json';
import enNavigation from '@/locales/en/navigation.json';
import enAuth from '@/locales/en/auth.json';

const resources = {
  vi: {
    common: viCommon,
    navigation: viNavigation,
    auth: viAuth,
  },
  en: {
    common: enCommon,
    navigation: enNavigation,
    auth: enAuth,
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    lng: 'vi',
    fallbackLng: 'vi',
    defaultNS: 'common',
    ns: ['common', 'navigation', 'auth'],
    detection: {
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'i18nextLng',
      caches: ['localStorage'],
    },
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
