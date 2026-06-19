# What Should I Do?

A React Native + Expo app that helps users notice their first emotional reaction to a choice — not a random picker, coin flip, or AI assistant.

## Prerequisites

- Node.js 18 or newer
- npm (included with Node)
- [Expo Go](https://expo.dev/go) on a physical device, or iOS Simulator / Android Emulator

## Setup

```bash
npm install
```

## Run

```bash
npx expo start
```

Then:

- Press `i` for iOS Simulator
- Press `a` for Android Emulator
- Scan the QR code with Expo Go on your device

## Main flow

Welcome → Auth → Question → Reveal Animation → Result → Emotion → Insight → Ad Placeholder → Action Hub

From Action Hub you can:

- Try another choice (returns to Question)
- Explore more apps (App Hub)
- Join early access (email saved locally)
- Open Settings (language, sound, haptics)

## Languages

English and Ukrainian — switch on Welcome or in Settings. All UI strings live in `src/i18n/en.json` and `src/i18n/uk.json`.

## Reference screenshots

Visual inspiration only — stored in `/references` (moved from `UI-UX Prototype/`).

## Placeholders (v1)

- Firebase auth — guest flow works offline
- AdMob — dashed placeholder card on ad screen
- Share — disabled with "Coming Soon"
- Sound effects — toggle persisted, playback not implemented

## Project structure

```
src/
  navigation/     AppNavigator
  screens/        12 flow screens
  components/     Shared UI + NeuralThoughtNetwork (Skia)
  context/        DecisionContext
  i18n/           en.json, uk.json
  services/       analytics, auth, storage, haptics, ads, sound
  constants/      colors, emotions, copy
  utils/          decision logic, reflection phrases
  types/          shared TypeScript types
```

## Smoke test checklist

- [ ] App launches to Welcome in dark mode
- [ ] EN ↔ UA switches all screen text
- [ ] Full flow Welcome → Action Hub completes without errors
- [ ] Reveal auto-advances at ~2.5s
- [ ] Emotion selection triggers haptic (on device)
- [ ] Insight flips option on negative emotion
- [ ] Early access email persists after restart
