import { makeMutable } from 'react-native-reanimated';

// Imperative feedback channel UI -> persistent canvas worklets.
// Counters (not booleans) so rapid repeated events never get lost;
// the canvas frame loop detects count changes and stamps its own clock.
export const neuralFx = {
  shimmerCount: makeMutable(0),
  rippleCount: makeMutable(0),
  rippleX: makeMutable(0.5), // normalized 0..1
  rippleY: makeMutable(0.6),
  pulseCount: makeMutable(0),
};

/** Typing feedback: brief sparkle on a few non-dominant nodes. */
export function shimmer(): void {
  neuralFx.shimmerCount.value += 1;
}

/** Press feedback: radial light wave from the touch point (normalized coords). */
export function ripple(x: number, y: number): void {
  neuralFx.rippleX.value = Math.max(0, Math.min(1, x));
  neuralFx.rippleY.value = Math.max(0, Math.min(1, y));
  neuralFx.rippleCount.value += 1;
}

/** Choice feedback: one strong heartbeat on dominant nodes. */
export function pulse(): void {
  neuralFx.pulseCount.value += 1;
}

/** Wrap a text setter: every ~3rd character sparks the network (typing feedback). */
export function withTypingShimmer(setter: (v: string) => void): (v: string) => void {
  return (v: string) => {
    if (v.length % 3 === 0) shimmer();
    setter(v);
  };
}
