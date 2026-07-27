import { supabase } from './supabase';
import type { Emotion } from '../types';

export interface SessionError {
  errorCategory: 'transient' | 'validation' | 'permission';
  isRetryable: boolean;
  description: string;
}

export type SessionResult = { ok: true } | { ok: false; error: SessionError };
export type CreateSessionResult = { ok: true; id: string } | { ok: false; error: SessionError };

export interface DecisionRow {
  id: string;
  question: string;
  option_a: string;
  option_b: string;
  revealed_option: 'a' | 'b';
  emotion: Emotion | null;
  alternative_revealed: boolean;
  created_at: string;
}
export type ListSessionsResult =
  | { ok: true; rows: DecisionRow[] }
  | { ok: false; error: SessionError };

// Postgres error codes we care about; anything else is treated as transient
// (network flake, cold start) so the caller may retry.
function toSessionError(code: string | undefined, message: string): SessionError {
  if (code === '23514' || code === '23502' || code === '22P02') {
    return { errorCategory: 'validation', isRetryable: false, description: message };
  }
  if (code === '42501' || code === 'PGRST301') {
    return { errorCategory: 'permission', isRetryable: false, description: message };
  }
  return { errorCategory: 'transient', isRetryable: true, description: message };
}

export async function createSession(
  question: string,
  optionA: string,
  optionB: string,
  revealedOption: 'a' | 'b',
): Promise<CreateSessionResult> {
  const { data: auth } = await supabase.auth.getSession();
  const userId = auth.session?.user.id;
  if (!userId) {
    return {
      ok: false,
      error: {
        errorCategory: 'permission',
        isRetryable: true,
        description: 'No auth session; anonymous bootstrap has not completed yet',
      },
    };
  }

  const { data, error } = await supabase
    .from('decision_sessions')
    .insert({
      user_id: userId,
      question,
      option_a: optionA,
      option_b: optionB,
      revealed_option: revealedOption,
    })
    .select('id')
    .single();

  if (error) {
    console.log('[sessions] createSession failed', error.message);
    return { ok: false, error: toSessionError(error.code, error.message) };
  }

  console.log('[sessions] Session created', data.id);
  return { ok: true, id: data.id };
}

export async function updateEmotion(id: string, emotion: Emotion): Promise<SessionResult> {
  const { error } = await supabase
    .from('decision_sessions')
    .update({ emotion })
    .eq('id', id);

  if (error) {
    console.log('[sessions] updateEmotion failed', error.message);
    return { ok: false, error: toSessionError(error.code, error.message) };
  }

  console.log('[sessions] Emotion saved', id, emotion);
  return { ok: true };
}

export async function markAlternativeRevealed(
  id: string,
  finalEmotion?: Emotion,
): Promise<SessionResult> {
  const { error } = await supabase
    .from('decision_sessions')
    .update({
      alternative_revealed: true,
      ...(finalEmotion ? { final_emotion: finalEmotion } : {}),
    })
    .eq('id', id);

  if (error) {
    console.log('[sessions] markAlternativeRevealed failed', error.message);
    return { ok: false, error: toSessionError(error.code, error.message) };
  }

  console.log('[sessions] Alternative reveal saved', id);
  return { ok: true };
}

// Advisory trial-round gate (Cowork contract 2026-07-06): server counts this
// user's sessions. Network failure must NOT block the ritual — callers treat
// errors as "allowed" and only log.
export async function canStartSession(): Promise<{ allowed: boolean; degraded: boolean }> {
  const { data, error } = await supabase.rpc('can_start_session');
  if (error) {
    console.log('[sessions] can_start_session failed (passing user through)', error.message);
    return { allowed: true, degraded: true };
  }
  return { allowed: data === true, degraded: false };
}

/** Read this user's past rounds, newest first (RLS restricts to own rows). */
export async function listSessions(limit = 50): Promise<ListSessionsResult> {
  const { data, error } = await supabase
    .from('decision_sessions')
    .select('id, question, option_a, option_b, revealed_option, emotion, alternative_revealed, created_at')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error) {
    console.log('[sessions] listSessions failed', error.message);
    return { ok: false, error: toSessionError(error.code, error.message) };
  }
  return { ok: true, rows: (data ?? []) as DecisionRow[] };
}

/** Collect an early-access email server-side. Duplicate email = success
    (idempotent — the unique constraint just means "already joined"). */
export async function submitEarlyAccessEmail(email: string): Promise<SessionResult> {
  const { data: auth } = await supabase.auth.getSession();
  const userId = auth.session?.user.id ?? null;
  const { error } = await supabase.from('early_access').insert({ email, user_id: userId });
  if (error) {
    if (error.code === '23505') return { ok: true }; // unique_violation — already joined
    console.log('[earlyAccess] submit failed', error.message);
    return { ok: false, error: toSessionError(error.code, error.message) };
  }
  console.log('[earlyAccess] email collected');
  return { ok: true };
}
