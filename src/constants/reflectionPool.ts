// Reflection text pool grounded in reflection-science.md
// Voice: non-prescriptive, satisficing frame, invites noticing — never prescribes a choice
// Guardrails: A (anti-rumination), B (non-prescriptive), C (satisficing), F (notice, not analyse)

import i18n from '../i18n';

const POOL = {
  en: {
    body: [
      "Imagine you've already chosen the first. Stay there for a moment.",
      'Now the second. What does it feel like?',
      "Don't weigh pros and cons. Notice where your breath feels lighter.",
      'Reach toward the one that brings a quiet smile.',
    ],
    coin: [
      'If a coin decided — which side were you secretly hoping for?',
      "That quiet \"please, let it be this\" — listen to it.",
    ],
    release: [
      'Neither option has to be perfect.',
      'Enough is what feels like yours.',
    ],
  },
  uk: {
    body: [
      'Уяви, що вже обрав перше. Поживи там мить.',
      'А тепер — друге. Як це на смак?',
      'Не зважуй за і проти. Поміть, де подих легший.',
      'Потягнись до того, що викликає тиху усмішку.',
    ],
    coin: [
      'Якби це вирішила монетка — на що б ти потай сподівався?',
      'Те тихе "ну будь ласка, хай буде так" — слухай його.',
    ],
    release: [
      'Жоден варіант не мусить бути ідеальним.',
      'Достатньо того, що відчувається твоїм.',
    ],
  },
} as const;

type Lang = keyof typeof POOL;

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function currentPool() {
  const lang: Lang = i18n.language === 'uk' ? 'uk' : 'en';
  return POOL[lang];
}

// Returns [body, coin, release] — one from each set, random per call.
// Language follows i18n.language at call time.
// Call once per session via useRef to avoid re-picking on re-render.
export function pickReflectionLines(): [string, string, string] {
  const pool = currentPool();
  return [pick(pool.body), pick(pool.coin), pick(pool.release)];
}
