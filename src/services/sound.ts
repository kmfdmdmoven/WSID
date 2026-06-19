import { getSettings } from './storage';

// TODO: add sound assets to assets/sounds/ and import with expo-av:
//   assets/sounds/reveal_start.mp3   – soft ambient pulse
//   assets/sounds/reveal_converge.mp3 – gentle rising tone
//   assets/sounds/reveal_result.mp3  – warm chime / resonance
//   assets/sounds/emotion_tap.mp3    – very short soft tap

async function isEnabled(): Promise<boolean> {
  try {
    const settings = await getSettings();
    return settings.soundEnabled;
  } catch {
    return false;
  }
}

// Safe wrapper: never throws, never blocks UI
async function playSafely(assetName: string): Promise<void> {
  if (!(await isEnabled())) return;
  // TODO: implement with expo-av once assets are added:
  //   const { sound } = await Audio.Sound.createAsync(require(`../../assets/sounds/${assetName}`));
  //   await sound.playAsync();
  //   sound.setOnPlaybackStatusUpdate((s) => { if (s.didJustFinish) sound.unloadAsync(); });
  void assetName; // suppress unused-var warning until implemented
}

// Called at reveal stage 1 — soft ambient pulse
export function playRevealStart(): void {
  playSafely('reveal_start.mp3');
}

// Called at reveal stage 2 (activating) — gentle rising tone
export function playRevealConverge(): void {
  playSafely('reveal_converge.mp3');
}

// Called at reveal stage 4 (result) — warm chime
export function playRevealResult(): void {
  playSafely('reveal_result.mp3');
}

// Called when user taps an emotion card
export function playEmotionTap(): void {
  playSafely('emotion_tap.mp3');
}

// Legacy aliases kept for backward compatibility
export async function playRevealSound(): Promise<void> {
  playRevealStart();
}

export async function playTapSound(): Promise<void> {
  playEmotionTap();
}
