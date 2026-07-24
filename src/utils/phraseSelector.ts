import i18n from '../i18n';
import type { Emotion } from '../types';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const LIBRARY = require('../data/phrase-library.json') as {
  phrases: PhraseRecord[];
};

export type Stage =
  | 'priming'
  | 'reveal_question'
  | 'reveal_microline'
  | 'reaction_positive'
  | 'reaction_negative'
  | 'closing';

interface PhraseRecord {
  id: string;
  stage: string;
  text: { en: string; ua: string };
  priority: number;
  weight: number;
  conditions: {
    emotion: string[] | null;
    show_if: string;
    no_repeat_within: number;
  };
}

export interface PhraseError {
  errorCategory: 'validation' | 'not_found';
  isRetryable: boolean;
  description: string;
}

export type PhraseResult =
  | { ok: true; text: string; id: string }
  | { ok: false; error: PhraseError };

// JSON emotion ids → app Emotion type
const EMOTION_TO_JSON: Record<Emotion, string> = {
  loveIt:          'love_it',
  feelsRight:      'feels_right',
  doesntFeelRight: 'doesnt_feel_right',
  disappointed:    'disappointed',
};

// In-memory no-repeat, keyed by stage
const seen = new Map<Stage, Set<string>>();
function seenSet(stage: Stage): Set<string> {
  if (!seen.has(stage)) seen.set(stage, new Set());
  return seen.get(stage)!;
}

// Validate on module load — Principle 1: programmatic enforcement
let _validationError: string | null = null;
try {
  if (!Array.isArray(LIBRARY.phrases)) {
    _validationError = 'phrase-library.json: phrases is not an array';
  } else {
    for (const p of LIBRARY.phrases) {
      if (!p.id || !p.stage || !p.text?.en) {
        _validationError = `phrase-library.json: phrase ${p.id ?? '?'} missing id/stage/text.en`;
        break;
      }
    }
  }
} catch (e) {
  _validationError = String(e);
}

function locale(): 'en' | 'ua' {
  return i18n.language === 'uk' ? 'ua' : 'en';
}

function getText(p: PhraseRecord): string {
  const l = locale();
  return (l === 'ua' ? p.text.ua : undefined) ?? p.text.en;
}

function candidates(stage: Stage, emotion?: Emotion): PhraseRecord[] {
  if (_validationError) return [];
  const jsonEmotion = emotion ? EMOTION_TO_JSON[emotion] : undefined;
  return LIBRARY.phrases.filter((p) => {
    if (p.stage !== stage) return false;
    if (p.conditions.show_if !== 'default') return false;
    if (p.conditions.emotion !== null) {
      if (!jsonEmotion || !p.conditions.emotion.includes(jsonEmotion)) return false;
    }
    return true;
  });
}

function pickWeighted(pool: PhraseRecord[], s: Set<string>): PhraseRecord | null {
  let eligible = pool.filter((p) => !s.has(p.id));
  if (eligible.length === 0) {
    s.clear();
    eligible = pool;
  }
  if (eligible.length === 0) return null;

  const total = eligible.reduce((sum, p) => sum + p.weight, 0);
  let rand = Math.random() * total;
  for (const p of eligible) {
    rand -= p.weight;
    if (rand <= 0) return p;
  }
  return eligible[eligible.length - 1];
}

export function select(stage: Stage, opts?: { emotion?: Emotion }): PhraseResult {
  if (_validationError) {
    return { ok: false, error: { errorCategory: 'validation', isRetryable: false, description: _validationError } };
  }
  const pool = candidates(stage, opts?.emotion);
  if (pool.length === 0) {
    return {
      ok: false,
      error: { errorCategory: 'not_found', isRetryable: false, description: `no phrases for stage=${stage} emotion=${opts?.emotion ?? 'any'}` },
    };
  }
  const phrase = pickWeighted(pool, seenSet(stage));
  if (!phrase) {
    return { ok: false, error: { errorCategory: 'not_found', isRetryable: false, description: `pickWeighted returned null for stage=${stage}` } };
  }
  seenSet(stage).add(phrase.id);
  return { ok: true, text: getText(phrase), id: phrase.id };
}

// Convenience for components that want a string with a hardcoded fallback
export function selectText(stage: Stage, fallback: string, opts?: { emotion?: Emotion }): string {
  const result = select(stage, opts);
  return result.ok ? result.text : fallback;
}

// Full pool for AmbientTextStream (all eligible phrases, no no-repeat tracking)
export function selectPool(stage: Stage, opts?: { emotion?: Emotion }): string[] {
  if (_validationError) return [];
  return candidates(stage, opts?.emotion).map(getText);
}
