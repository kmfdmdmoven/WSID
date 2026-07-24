import 'react-native-url-polyfill/auto';
import * as SecureStore from 'expo-secure-store';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Missing EXPO_PUBLIC_SUPABASE_URL / EXPO_PUBLIC_SUPABASE_ANON_KEY in .env');
}

// expo-secure-store caps each value at ~2048 bytes (Keychain/Keystore limit).
// A Supabase session (access + refresh token + user) can exceed that, so we
// shard it across multiple keys instead of storing it as one blob.
const CHUNK_SIZE = 2000;

const chunkedSecureStore = {
  async getItem(key: string): Promise<string | null> {
    const countRaw = await SecureStore.getItemAsync(`${key}_chunks`);
    if (!countRaw) return null;
    const count = Number(countRaw);
    const chunks = await Promise.all(
      Array.from({ length: count }, (_, i) => SecureStore.getItemAsync(`${key}_${i}`)),
    );
    if (chunks.some((chunk) => chunk === null)) return null;
    return chunks.join('');
  },
  async setItem(key: string, value: string): Promise<void> {
    const chunks: string[] = [];
    for (let i = 0; i < value.length; i += CHUNK_SIZE) {
      chunks.push(value.slice(i, i + CHUNK_SIZE));
    }
    await SecureStore.setItemAsync(`${key}_chunks`, String(chunks.length));
    await Promise.all(chunks.map((chunk, i) => SecureStore.setItemAsync(`${key}_${i}`, chunk)));
  },
  async removeItem(key: string): Promise<void> {
    const countRaw = await SecureStore.getItemAsync(`${key}_chunks`);
    const count = countRaw ? Number(countRaw) : 0;
    await Promise.all([
      SecureStore.deleteItemAsync(`${key}_chunks`),
      ...Array.from({ length: count }, (_, i) => SecureStore.deleteItemAsync(`${key}_${i}`)),
    ]);
  },
};

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: chunkedSecureStore,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
