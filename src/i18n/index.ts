import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { translations } from './translations';

const LANGUAGE_KEY = 'app_language';

// Get saved language or default to browser language
const getSavedLanguage = (): string => {
  const saved = localStorage.getItem(LANGUAGE_KEY);
  if (saved && ['en', 'es'].includes(saved)) {
    return saved;
  }
  
  // Detect browser language
  const browserLang = navigator.language.split('-')[0];
  return ['en', 'es'].includes(browserLang) ? browserLang : 'en';
};

i18n
  .use(initReactI18next)
  .init({
    resources: translations,
    lng: getSavedLanguage(),
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

// Save language preference when changed
i18n.on('languageChanged', (lng) => {
  localStorage.setItem(LANGUAGE_KEY, lng);
});

export default i18n;
