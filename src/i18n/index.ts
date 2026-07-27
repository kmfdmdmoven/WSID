import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getSavedLanguage } from '../services/storage';
import type { Language } from '../types';
import en from './en.json';
import uk from './uk.json';

const resources = {
  en: { translation: en },
  uk: { translation: uk },
};

export async function initI18n(): Promise<void> {
  // Default to English until the user picks otherwise (ignore device locale).
  const saved = await getSavedLanguage();
  const lng: Language = saved ?? 'en';

  await i18n.use(initReactI18next).init({
    resources,
    lng,
    fallbackLng: 'en',
    interpolation: { escapeValue: false },
  });
}

export async function changeLanguage(language: Language): Promise<void> {
  await i18n.changeLanguage(language);
}

export default i18n;
