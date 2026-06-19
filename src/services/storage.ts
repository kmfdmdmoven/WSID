import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AppSettings, Language } from '../types';

const SETTINGS_KEY = '@what_should_i_do/settings';
const EARLY_ACCESS_KEY = '@what_should_i_do/early_access_emails';

const DEFAULT_SETTINGS: AppSettings = {
  language: 'en',
  soundEnabled: true,
  hapticsEnabled: true,
};

export async function getSettings(): Promise<AppSettings> {
  const raw = await AsyncStorage.getItem(SETTINGS_KEY);
  if (!raw) {
    return DEFAULT_SETTINGS;
  }
  return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
}

export async function saveSettings(settings: Partial<AppSettings>): Promise<AppSettings> {
  const current = await getSettings();
  const updated = { ...current, ...settings };
  await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
  return updated;
}

export async function getSavedLanguage(): Promise<Language | null> {
  const settings = await getSettings();
  return settings.language;
}

export async function saveEarlyAccessEmail(email: string): Promise<string[]> {
  const raw = await AsyncStorage.getItem(EARLY_ACCESS_KEY);
  const emails: string[] = raw ? JSON.parse(raw) : [];
  if (!emails.includes(email)) {
    emails.push(email);
    await AsyncStorage.setItem(EARLY_ACCESS_KEY, JSON.stringify(emails));
  }
  return emails;
}

export async function getEarlyAccessEmails(): Promise<string[]> {
  const raw = await AsyncStorage.getItem(EARLY_ACCESS_KEY);
  return raw ? JSON.parse(raw) : [];
}
