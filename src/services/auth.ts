import * as AppleAuthentication from 'expo-apple-authentication';
import { GoogleSignin, statusCodes } from '@react-native-google-signin/google-signin';
import { supabase } from './supabase';
import { track } from './analytics';

export interface AuthError {
  errorCategory: 'transient' | 'validation' | 'permission';
  isRetryable: boolean;
  description: string;
}

export type AuthResult = { ok: true } | { ok: false; error: AuthError };

export async function continueAsGuest(): Promise<AuthResult> {
  const { data: existing } = await supabase.auth.getSession();
  if (existing.session) {
    console.log('[auth] Reusing existing session');
    return { ok: true };
  }

  const { error } = await supabase.auth.signInAnonymously();
  if (error) {
    console.log('[auth] Anonymous sign-in failed', error.message);
    return {
      ok: false,
      error: { errorCategory: 'transient', isRetryable: true, description: error.message },
    };
  }

  console.log('[auth] Guest session started');
  return { ok: true };
}

export async function isGuest(): Promise<boolean> {
  const { data } = await supabase.auth.getSession();
  return data.session?.user.is_anonymous ?? false;
}

export type RegistrationResult =
  | { ok: true; linked: boolean } // linked=false: identity belonged to another account, we signed into it
  | { ok: false; error: AuthError; cancelled?: boolean };

// Link flow (Cowork contract 2026-07-15): the anonymous user is already signed
// in — linkIdentity attaches the OAuth identity to the SAME user_id, so
// decision history survives. If the identity already belongs to another
// account, fall back to signing into that account (linked=false).
async function linkOrSignIn(
  provider: 'apple' | 'google',
  token: string,
  accessToken?: string,
): Promise<RegistrationResult> {
  const credentials = { provider, token, ...(accessToken ? { access_token: accessToken } : {}) };

  const { error: linkError } = await supabase.auth.linkIdentity(credentials);
  let linked = true;

  if (linkError) {
    console.log('[auth] linkIdentity failed, trying plain sign-in', linkError.message);
    const { error: signInError } = await supabase.auth.signInWithIdToken(credentials);
    if (signInError) {
      return {
        ok: false,
        error: {
          errorCategory: 'permission',
          isRetryable: true,
          description: signInError.message,
        },
      };
    }
    linked = false;
  }

  const { data: auth } = await supabase.auth.getSession();
  const userId = auth.session?.user.id;
  if (userId) {
    const { error: profileError } = await supabase
      .from('profiles')
      .update({ is_anonymous: false })
      .eq('id', userId);
    if (profileError) {
      // Non-fatal: the identity is attached; profile flag is best-effort
      console.log('[auth] profiles.is_anonymous update failed', profileError.message);
    }
  }

  track('registration_completed', { provider, linked });
  console.log('[auth] Registration completed', provider, 'linked:', linked);
  return { ok: true, linked };
}

export async function signInWithApple(): Promise<RegistrationResult> {
  try {
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
    });
    if (!credential.identityToken) {
      return {
        ok: false,
        error: {
          errorCategory: 'transient',
          isRetryable: true,
          description: 'Apple returned no identity token',
        },
      };
    }
    return await linkOrSignIn('apple', credential.identityToken);
  } catch (e) {
    const err = e as { code?: string; message?: string };
    if (err.code === 'ERR_REQUEST_CANCELED') {
      return {
        ok: false,
        cancelled: true,
        error: { errorCategory: 'validation', isRetryable: true, description: 'User cancelled' },
      };
    }
    return {
      ok: false,
      error: {
        errorCategory: 'transient',
        isRetryable: true,
        description: err.message ?? 'Apple sign-in failed',
      },
    };
  }
}

export async function signInWithGoogle(): Promise<RegistrationResult> {
  try {
    GoogleSignin.configure({
      webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
      iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    });
    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
    const response = await GoogleSignin.signIn();
    const idToken = response.data?.idToken;
    if (!idToken) {
      return {
        ok: false,
        error: {
          errorCategory: 'transient',
          isRetryable: true,
          description: 'Google returned no id token',
        },
      };
    }
    return await linkOrSignIn('google', idToken);
  } catch (e) {
    const err = e as { code?: string | number; message?: string };
    if (err.code === statusCodes.SIGN_IN_CANCELLED) {
      return {
        ok: false,
        cancelled: true,
        error: { errorCategory: 'validation', isRetryable: true, description: 'User cancelled' },
      };
    }
    return {
      ok: false,
      error: {
        errorCategory: 'transient',
        isRetryable: true,
        description: err.message ?? 'Google sign-in failed',
      },
    };
  }
}

// GDPR / App Store 5.1.1(v): immediate hard delete via Edge Function.
// The function resolves the user from the JWT (no id in body), cascade
// removes profiles + decision_sessions. Works for anonymous users too.
export async function deleteAccount(): Promise<AuthResult> {
  try {
    const { error } = await supabase.functions.invoke('delete-account', { method: 'POST' });
    if (error) {
      console.log('[auth] delete-account failed', error.message);
      // Idempotency: if our session's user no longer exists server-side
      // (a previous delete succeeded but local sign-out didn't), treat this
      // as already-deleted — clear the dead session and move on.
      const { error: userError } = await supabase.auth.getUser();
      if (userError) {
        console.log('[auth] Session user is gone — treating delete as already done');
      } else {
        return {
          ok: false,
          error: { errorCategory: 'transient', isRetryable: true, description: error.message },
        };
      }
    }
    track('account_deleted');
    // scope 'local': the server user is already gone — a global revoke call
    // would fail against the dead session and reject past our control flow.
    await supabase.auth.signOut({ scope: 'local' }).catch((e) => {
      console.log('[auth] local signOut after delete failed (ignored)', String(e));
    });
    console.log('[auth] Account deleted, session cleared');
    // Fresh anonymous session right away — the ritual keeps working without an app restart
    const guest = await continueAsGuest();
    console.log('[auth] Post-delete anon bootstrap:', guest.ok ? 'ok' : guest.error.description);
    return { ok: true };
  } catch (e) {
    console.log('[auth] deleteAccount unexpected failure', String(e));
    return {
      ok: false,
      error: {
        errorCategory: 'transient',
        isRetryable: true,
        description: e instanceof Error ? e.message : 'Unexpected failure',
      },
    };
  }
}
