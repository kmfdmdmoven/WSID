import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import { getSavedLanguage } from '../services/storage';
import type { Language } from '../types';
import en from './en.json';
import uk from './uk.json';

const resources = {
  en: { translation: en },
  uk: { translation: uk },
};

function getDeviceLanguage(): Language {
  const locale = Localization.getLocales()[0]?.languageCode ?? 'en';
  return locale === 'uk' ? 'uk' : 'en';
}

export async function initI18n(): Promise<void> {
  const saved = await getSavedLanguage();
  const lng = saved ?? getDeviceLanguage();

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
