# DvaTipa — Правила та команди співпраці

## Run / Launch

**Skill:** `expo-ios-launch` (user-level, `~/.claude/skills/expo-ios-launch/SKILL.md`)

| Key | Value |
|---|---|
| BUILD_DIR | `/Users/kmfdmdm/APP_DvaTipa/WSID/DvaTipa-WhatShouldIDo` |
| Native modules | `@shopify/react-native-skia`, `react-native-reanimated` |
| Runtime | Expo SDK ~56, RN 0.85.3 |

```bash
pkill -f metro; pkill -f expo; true
cd /Users/kmfdmdm/APP_DvaTipa/WSID/DvaTipa-WhatShouldIDo
npx expo run:ios
```

> **Why not Expo Go?** `@shopify/react-native-skia` requires a native build. `expo run:ios` only.
>
> **Why not Expo Go?** `@shopify/react-native-skia` requires a native build. `expo run:ios` only.

---

## Правила перед зміною бібліотек

Перед будь-якою заміною API або методу бібліотеки — обов'язково:

1. **Перевірити що метод існує у встановленій версії:**
   ```bash
   grep -r "НазваМетоду" node_modules/<lib>/src 2>/dev/null | head -5
   grep -r "НазваМетоду" node_modules/<lib>/lib 2>/dev/null | head -5
   ```

2. **Перевірити контекст виклику** (JS thread vs worklet/UI thread):
   - `useDerivedValue` — worklet context (UI thread)
   - Skia factory calls (`Skia.Path.Make()`) — підтримуються в worklet
   - `Skia.PathBuilder.Make()` — НЕ підтримується в worklet (досвід з цього проекту)

3. **Deprecation warning ≠ broken** — якщо старий метод працює, не міняти поки не підтверджено що новий теж працює в тому ж контексті.

---

## Урок #1 — PathBuilder crash (Jun 2026)

**Що сталось:** Замінили `Skia.Path.Make()` → `Skia.PathBuilder.Make()` за підказкою deprecation warning.
**Результат:** Чорний екран — PathBuilder не підтримується в worklet context.
**Фікс:** Повернули `Skia.Path.Make()`, залишили `'worklet'` директиву на `computePositions`.

---

## Структура проекту

```
src/
  navigation/   AppNavigator (12 екранів)
  screens/      Welcome → Auth → Question → RevealAnimation → Result
                → Emotion → Insight → AdPlaceholder → ActionHub
                → AppHub / EarlyAccess / Settings
  components/   NeuralThoughtNetwork (Skia), ScreenContainer, PrimaryButton,
                TextInputCard, EmotionCard
  context/      DecisionContext
  i18n/         en.json, uk.json
  services/     analytics, auth, storage, haptics, ads, sound
  constants/    colors, emotions, copy
  utils/        decisionLogic, reflectionPhrases
  types/        index.ts
```

---

## Відомі проблеми та обмеження (v1)

- Firebase auth — guest flow, офлайн
- AdMob — placeholder
- Share — "Coming Soon"
- Sound — toggle є, playback не реалізовано
