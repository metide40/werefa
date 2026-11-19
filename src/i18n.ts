import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './i18n/locales/en.json';
import am from './i18n/locales/am.json';
import om from './i18n/locales/om.json';

const savedLang = typeof window !== 'undefined' ? localStorage.getItem('werfa_lang') : null;

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      am: { translation: am },
      om: { translation: om },
    },
    lng: savedLang || 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
