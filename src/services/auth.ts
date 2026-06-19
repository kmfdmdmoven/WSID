import AsyncStorage from '@react-native-async-storage/async-storage';

const GUEST_KEY = '@what_should_i_do/guest';

export async function continueAsGuest(): Promise<void> {
  await AsyncStorage.setItem(GUEST_KEY, 'true');
  console.log('[auth] Guest session started');
}

export async function isGuest(): Promise<boolean> {
  const value = await AsyncStorage.getItem(GUEST_KEY);
  return value === 'true';
}

export function signInWithApple(): void {
  console.log('[auth] Apple sign-in is not configured yet');
}

export function signInWithGoogle(): void {
  console.log('[auth] Google sign-in is not configured yet');
}

export function signInWithEmail(): void {
  console.log('[auth] Email sign-in is not configured yet');
}
