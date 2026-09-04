import React, { useEffect, useMemo } from 'react';
import { StyleSheet, useWindowDimensions, ViewStyle } from 'react-native';
import { BlurMask, Canvas, Circle, Fill, Path, RadialGradient, Shader, Skia, vec } from '@shopify/react-native-skia';
import {
  useDerivedValue,
  useFrameCallback,
  useSharedValue,
} from 'react-native-reanimated';
import { colors } from '../constants/colors';
import { neuralFx } from '../services/neuralFx';
import type { NeuralMode } from '../types';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  mode: NeuralMode;
  intensity?: number;
  style?: ViewStyle;
}

type NodeTier = 'dominant' | 'support' | 'background';

interface Seed {
  bx: number; by: number;
  sx: number; sy: number;
  amp: number; phase: number;
  r: number;
  color: string;
  colorIndex: number;
  tier: NodeTier;
  freqJitter: number; // ±8% per-node variation — organic async drift
  riser: boolean;
  searcher: boolean;
}

interface ModeConfig {
  speed: number;
  ampFactor: number;
  pull: number;
  connBase: number;
  connPulseFreq: number;
  connPulseAmp: number;
  brightBase: number;
  brightFreq: number;
  brightPathColor: string;
  centerGlow: number;
  centerGlowFreq: number;
  centerNegGlow: number;
  centerNegFreq: number;
  goldFactor: number;
  blueFactor: number;
  burgundyFactor: number;
  violetFactor: number;
  dominantBlurScale: number;
  supportBlurScale: number;
  transitionDuration: number;
  beatFreq: number; // BPM/60 — heartbeat frequency for dominant node pulsation
  edgeCut: number;  // 0..1 — fraction of near-focus edges dropped (doubt breaking links)
  mood: number;     // -1 cool .. +1 warm — tints the mindspace shader (Layer 1)
  breathPeriod: number; // seconds per full breath — the emotional signature of a stage
  search: number;   // 0..1 — a few nodes sweep the edges "searching" (activating)
}

// ─── Mode configurations ──────────────────────────────────────────────────────

const CONFIGS: Record<NeuralMode, ModeConfig> = {
  idle: {
    speed: 0.17, ampFactor: 1.0, pull: 0,
    connBase: 0.09, connPulseFreq: 0.12, connPulseAmp: 0.025,
    brightBase: 0.06, brightFreq: 0.14, brightPathColor: 'rgba(255,255,255,0.9)',
    centerGlow: 0, centerGlowFreq: 0.4,
    centerNegGlow: 0, centerNegFreq: 0.3,
    goldFactor: 1.0, blueFactor: 1.0, burgundyFactor: 1.0, violetFactor: 1.0,
    dominantBlurScale: 1.0, supportBlurScale: 1.0,
    transitionDuration: 1.2,
    beatFreq: 72 / 60,
    edgeCut: 0,
    mood: -0.2,
    breathPeriod: 6,
    search: 0,
  },
  thinking: {
    speed: 0.34, ampFactor: 1.20, pull: 0,
    connBase: 0.13, connPulseFreq: 0.22, connPulseAmp: 0.04,
    brightBase: 0.10, brightFreq: 0.26, brightPathColor: 'rgba(74,144,226,0.85)',
    centerGlow: 0, centerGlowFreq: 0.5,
    centerNegGlow: 0, centerNegFreq: 0.3,
    goldFactor: 1.05, blueFactor: 1.35, burgundyFactor: 0.75, violetFactor: 1.25,
    dominantBlurScale: 1.1, supportBlurScale: 1.1,
    transitionDuration: 1.5,
    beatFreq: 80 / 60,
    edgeCut: 0,
    mood: 0.0,
    breathPeriod: 4.5,
    search: 0,
  },
  activating: {
    speed: 0.42, ampFactor: 1.35, pull: 0.006,
    connBase: 0.16, connPulseFreq: 0.60, connPulseAmp: 0.11,
    brightBase: 0.28, brightFreq: 0.40, brightPathColor: 'rgba(234,179,8,0.9)',
    centerGlow: 0.18, centerGlowFreq: 0.5,
    centerNegGlow: 0, centerNegFreq: 0.3,
    goldFactor: 1.50, blueFactor: 1.30, burgundyFactor: 0.60, violetFactor: 0.80,
    dominantBlurScale: 1.35, supportBlurScale: 1.3,
    transitionDuration: 0.8,
    beatFreq: 90 / 60,
    edgeCut: 0,
    mood: 0.0,
    breathPeriod: 3.5,
    search: 1,
  },
  converging: {
    speed: 0.30, ampFactor: 0.85, pull: 0.022,
    connBase: 0.19, connPulseFreq: 0.28, connPulseAmp: 0.06,
    brightBase: 0.32, brightFreq: 0.32, brightPathColor: 'rgba(234,179,8,0.9)',
    centerGlow: 0.45, centerGlowFreq: 0.4,
    centerNegGlow: 0, centerNegFreq: 0.3,
    goldFactor: 1.70, blueFactor: 1.15, burgundyFactor: 0.50, violetFactor: 1.0,
    dominantBlurScale: 1.45, supportBlurScale: 1.35,
    transitionDuration: 1.0,
    beatFreq: 96 / 60,
    edgeCut: 0,
    mood: 0.25,
    breathPeriod: 8,
    search: 0,
  },
  result: {
    speed: 0.20, ampFactor: 0.60, pull: 0.012,
    connBase: 0.11, connPulseFreq: 0.16, connPulseAmp: 0.03,
    brightBase: 0.16, brightFreq: 0.18, brightPathColor: 'rgba(234,179,8,0.85)',
    centerGlow: 0.62, centerGlowFreq: 0.28,
    centerNegGlow: 0, centerNegFreq: 0.3,
    goldFactor: 1.95, blueFactor: 1.05, burgundyFactor: 0.45, violetFactor: 0.70,
    dominantBlurScale: 1.55, supportBlurScale: 1.25,
    transitionDuration: 1.8,
    beatFreq: 76 / 60,
    edgeCut: 0,
    mood: 0.5,
    breathPeriod: 10,
    search: 0,
  },
  emotionPositive: {
    speed: 0.22, ampFactor: 0.70, pull: 0.010,
    connBase: 0.15, connPulseFreq: 0.20, connPulseAmp: 0.045,
    brightBase: 0.20, brightFreq: 0.22, brightPathColor: 'rgba(234,179,8,1.0)',
    centerGlow: 0.62, centerGlowFreq: 0.32,
    centerNegGlow: 0, centerNegFreq: 0.3,
    goldFactor: 2.20, blueFactor: 1.45, burgundyFactor: 0.18, violetFactor: 0.45,
    dominantBlurScale: 1.7, supportBlurScale: 1.6,
    transitionDuration: 2.0,
    beatFreq: 82 / 60,
    edgeCut: 0,
    mood: 0.85,
    breathPeriod: 7,
    search: 0,
  },
  emotionNegative: {
    speed: 0.15, ampFactor: 0.55, pull: 0.004,
    connBase: 0.06, connPulseFreq: 0.14, connPulseAmp: 0.018,
    brightBase: 0.10, brightFreq: 0.13, brightPathColor: 'rgba(139,41,66,0.9)',
    centerGlow: 0, centerGlowFreq: 0.35,
    centerNegGlow: 0.30, centerNegFreq: 0.22,
    goldFactor: 0.18, blueFactor: 0.48, burgundyFactor: 2.60, violetFactor: 2.10,
    dominantBlurScale: 0.70, supportBlurScale: 0.45,
    transitionDuration: 2.8,
    beatFreq: 60 / 60,
    edgeCut: 0.3,
    mood: -0.75,
    breathPeriod: 9,
    search: 0,
  },
  discovery: {
    speed: 0.20, ampFactor: 0.72, pull: 0.010,
    connBase: 0.14, connPulseFreq: 0.16, connPulseAmp: 0.04,
    brightBase: 0.22, brightFreq: 0.18, brightPathColor: 'rgba(234,179,8,1.0)',
    centerGlow: 0.45, centerGlowFreq: 0.28,
    centerNegGlow: 0, centerNegFreq: 0.3,
    goldFactor: 2.05, blueFactor: 1.25, burgundyFactor: 0.22, violetFactor: 0.65,
    dominantBlurScale: 1.55, supportBlurScale: 1.5,
    transitionDuration: 2.5,
    beatFreq: 72 / 60,
    edgeCut: 0,
    mood: 0.4,
    breathPeriod: 8,
    search: 0,
  },
};

// ─── MindSpace shader (Layer 1) ───────────────────────────────────────────────
// Domain-warped FBM field from the design spec (background/wsid-background.js).
// Near-black always: luminance is hard-capped at 0.10. u_mood tints cool<->warm.

const MINDSPACE_SKSL = `
uniform float2 u_res;
uniform float u_time;
uniform float u_mood;

float hash(float2 p) { return fract(sin(dot(p, float2(127.1, 311.7))) * 43758.5453123); }
float noise(float2 p) {
  float2 i = floor(p); float2 f = fract(p);
  float2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + float2(1.0, 0.0)), u.x),
             mix(hash(i + float2(0.0, 1.0)), hash(i + float2(1.0, 1.0)), u.x), u.y);
}
float fbm(float2 p) {
  float v = 0.0; float a = 0.5;
  for (int k = 0; k < 4; k++) { v += a * noise(p); p = p * 2.03 + float2(17.3, 9.1); a *= 0.5; }
  return v;
}
half4 main(float2 xy) {
  float2 uv = xy / u_res.y;
  float t = u_time;
  float big = fbm(uv * 0.55 + float2(t * 0.35, -t * 0.22));
  float2 q = float2(fbm(uv * 1.6 + t), fbm(uv * 1.6 - t * 0.7 + 5.2));
  float n = fbm(uv * 2.0 + q * 1.6);
  float m = (u_mood + 1.0) * 0.5;
  float3 cool = float3(0.039, 0.039, 0.086);
  float3 warm = float3(0.098, 0.070, 0.028);
  float3 base = mix(cool, warm, m);
  float3 col = base * (0.22 + big * 1.1 + n * 0.9);
  float lum = dot(col, float3(0.2126, 0.7152, 0.0722));
  if (lum > 0.10) { col *= 0.10 / lum; }
  return half4(half3(col), 1.0);
}`;

const MINDSPACE_EFFECT = Skia.RuntimeEffect.Make(MINDSPACE_SKSL);

// ─── Constants ────────────────────────────────────────────────────────────────

const NODE_COLORS = [
  colors.rationalBlue,
  colors.accentGold,
  colors.resistanceBurgundy,
  colors.uncertaintyViolet,
];
const NODE_COUNT = 50;
const DOMINANT_COUNT = 6;
const SUPPORT_COUNT = 14;
const CONN_DIST_SQ = 120 * 120;
const TWO_PI = Math.PI * 2;
const DOMINANT_COLOR_INDICES = [1, 2, 1, 2, 3, 0];

// ─── Seed generation ──────────────────────────────────────────────────────────

function makeRng(seed: number) {
  let s = seed;
  return () => {
    s = Math.imul(s ^ (s >>> 16), 0x45d9f3b);
    s = Math.imul(s ^ (s >>> 16), 0x45d9f3b);
    s ^= s >>> 16;
    return (s >>> 0) / 0xffffffff;
  };
}

function buildSeeds(w: number, h: number): Seed[] {
  const rng = makeRng(137);
  const seeds: Seed[] = [];
  for (let i = 0; i < NODE_COUNT; i++) {
    const tier: NodeTier = i < DOMINANT_COUNT ? 'dominant'
      : i < DOMINANT_COUNT + SUPPORT_COUNT ? 'support'
      : 'background';
    const baseR = tier === 'dominant' ? 12 + rng() * 6
      : tier === 'support' ? 3.5 + rng() * 3
      : 1.5 + rng() * 2;
    const colorIndex = tier === 'dominant'
      ? DOMINANT_COLOR_INDICES[i]
      : (i - DOMINANT_COUNT) % 4;
    let bx: number; let by: number;
    if (tier === 'dominant') {
      switch (i) {
        case 0: bx = w * (0.10 + rng() * 0.18); by = h * (0.08 + rng() * 0.14); break;
        case 1: bx = w * (0.68 + rng() * 0.20); by = h * (0.06 + rng() * 0.12); break;
        case 2: bx = w * (0.15 + rng() * 0.22); by = h * (0.38 + rng() * 0.26); break;
        case 3: bx = w * (0.63 + rng() * 0.22); by = h * (0.38 + rng() * 0.26); break;
        case 4: bx = w * (0.12 + rng() * 0.22); by = h * (0.74 + rng() * 0.18); break;
        default: bx = w * (0.66 + rng() * 0.22); by = h * (0.74 + rng() * 0.18); break;
      }
    } else {
      const zone = (i - DOMINANT_COUNT) % 5;
      if (zone < 2) {
        bx = w * (0.04 + rng() * 0.92); by = h * (0.04 + rng() * 0.26);
      } else if (zone === 2) {
        bx = w * (0.04 + rng() * 0.92); by = h * (0.72 + rng() * 0.24);
      } else {
        const left = rng() < 0.5;
        bx = left ? w * (0.02 + rng() * 0.14) : w * (0.84 + rng() * 0.14);
        by = h * (0.28 + rng() * 0.46);
      }
    }
    seeds.push({
      bx, by,
      sx: 0.12 + rng() * 0.20, sy: 0.10 + rng() * 0.18,
      amp: tier === 'dominant' ? 16 + rng() * 14 : 10 + rng() * 18,
      phase: rng() * TWO_PI,
      r: baseR, color: NODE_COLORS[colorIndex],
      colorIndex, tier,
      freqJitter: 0.92 + rng() * 0.16, // 0.92..1.08 — Lissajous async drift
      riser: false, searcher: false,
    });
  }
  // 2 burgundy non-dominant nodes rise in negative mode (doubt floats away)
  seeds.filter((n) => n.colorIndex === 2 && n.tier !== 'dominant').slice(0, 2)
    .forEach((n) => { n.riser = true; });
  // 3 support nodes become edge-searchers in activating
  seeds.filter((n) => n.tier === 'support').slice(0, 3)
    .forEach((n) => { n.searcher = true; });
  return seeds;
}

// ─── Worklet helpers ──────────────────────────────────────────────────────────

function smoothstep(t: number): number {
  'worklet';
  const c = Math.max(0, Math.min(1, t));
  return c * c * (3 - 2 * c);
}

function lerp(a: number, b: number, t: number): number {
  'worklet';
  return a + (b - a) * t;
}

// Overshooting ease for pull transitions: releasing from converging to result
// swings ~10-12% past the target (the network "exhales") before settling.
function easeOutBack(t: number): number {
  'worklet';
  const c1 = 1.70158;
  const c3 = c1 + 1;
  const x = Math.max(0, Math.min(1, t));
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
}

// QRS-shaped heartbeat: fast rise → peak plateau → slow fall → silent rest.
// Returns 0..1. Nodes hold at 0 during rest so base scale (0.76) applies.
function heartbeatPulse(t: number, freq: number): number {
  'worklet';
  const cycle = ((t * freq % 1) + 1) % 1;
  if (cycle < 0.12) return cycle / 0.12;
  if (cycle < 0.28) return 1.0 - ((cycle - 0.12) / 0.16) * 0.35;
  if (cycle < 0.50) return 0.65 * (1.0 - (cycle - 0.28) / 0.22);
  return 0;
}

// Design-spec convergence: pull is a small config number, the rendered
// convergence factor is min(pull*40, 0.9) — converging visibly gathers the
// whole constellation around the focus point, not a 2% nudge.
const FOCUS_X = 0.5;
const FOCUS_Y = 0.42; // where the thought card lives — above geometric center

function cvgOf(pull: number): number {
  'worklet';
  return Math.min(Math.max(pull, -0.05) * 40, 0.9);
}

function hash01(n: number): number {
  'worklet';
  const x = Math.sin(n * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}

// Slowly migrates a "home" coordinate between pseudo-random waypoints across
// the full dimension, on a real-time (not mode-speed-scaled) clock — so a
// fixed bright element (dominant node / ambient blob) doesn't stay glued to
// one spot for the whole session. `identity` desyncs the per-element phase.
function wanderCoord(identity: number, period: number, realTime: number, dim: number, axisSalt: number): number {
  'worklet';
  const segT = realTime / period + identity;
  const seg = Math.floor(segT);
  const frac = smoothstep(segT - seg);
  const margin = dim * 0.12;
  const span = dim - margin * 2;
  const from = margin + hash01(seg * 17.13 + axisSalt + identity * 5.7) * span;
  const to = margin + hash01((seg + 1) * 17.13 + axisSalt + identity * 5.7) * span;
  return lerp(from, to, frac);
}

// Position uses phaseAcc (not time*speed) so speed changes feel like
// acceleration rather than position teleports. realTime (wall-clock seconds,
// unaffected by mode speed) drives the slow home-wander for dominant nodes.
function nx(seed: Seed, t: number, w: number, pull: number, ampFactor: number, realTime: number): number {
  'worklet';
  const base = seed.tier === 'dominant'
    ? wanderCoord(seed.phase, 22 + seed.colorIndex * 4, realTime, w, 11)
    : seed.bx;
  const x = base + Math.sin(t * seed.sx * seed.freqJitter + seed.phase) * seed.amp * ampFactor;
  const cvg = cvgOf(pull);
  return cvg !== 0 ? x + (FOCUS_X * w - x) * cvg : x;
}

function ny(seed: Seed, t: number, h: number, pull: number, ampFactor: number, realTime: number): number {
  'worklet';
  const base = seed.tier === 'dominant'
    ? wanderCoord(seed.phase, 22 + seed.colorIndex * 4, realTime, h, 53)
    : seed.by;
  const y = base + Math.cos(t * seed.sy * seed.freqJitter + seed.phase * 1.3) * seed.amp * ampFactor;
  const cvg = cvgOf(pull);
  return cvg !== 0 ? y + (FOCUS_Y * h - y) * cvg : y;
}

// ─── AmbientBlob ──────────────────────────────────────────────────────────────
// Drifting pools of gold light behind the constellation (design prototype:
// 3 blobs, slow orbit, drawn toward focus with convergence).

const BLOBS = [
  { x: 0.24, y: 0.30, r: 0.34, a: 0.08, sp: 0.05, ph: 0.0 },
  { x: 0.42, y: 0.62, r: 0.42, a: 0.055, sp: 0.04, ph: 2.1 },
  { x: 0.80, y: 0.15, r: 0.22, a: 0.045, sp: 0.06, ph: 4.0 },
] as const;

function AmbientBlob({ blob, blobIndex, time, configSV, prevConfigSV, modeProgress, w, h }: {
  blob: (typeof BLOBS)[number];
  blobIndex: number;
  time: { value: number };
  configSV: { value: ModeConfig };
  prevConfigSV: { value: ModeConfig };
  modeProgress: { value: number };
  w: number; h: number;
}) {
  const cx = useDerivedValue(() => {
    const p = modeProgress.value;
    const cvg = cvgOf(lerp(prevConfigSV.value.pull, configSV.value.pull, p));
    const home = wanderCoord(blobIndex + 0.37, 30 + blobIndex * 6, time.value, w, 7);
    const bx = home + Math.cos(time.value * blob.sp + blob.ph) * 0.03 * w;
    return bx + (FOCUS_X * w - bx) * cvg * 0.6;
  });
  const cy = useDerivedValue(() => {
    const p = modeProgress.value;
    const cvg = cvgOf(lerp(prevConfigSV.value.pull, configSV.value.pull, p));
    const home = wanderCoord(blobIndex + 0.37, 30 + blobIndex * 6, time.value, h, 41);
    const by = home + Math.sin(time.value * blob.sp * 0.7 + blob.ph) * 0.03 * h;
    return by + (FOCUS_Y * h - by) * cvg * 0.6;
  });
  const r = useDerivedValue(() =>
    blob.r * Math.min(w, h) * (1 + 0.08 * Math.sin(time.value * 0.3 + blob.ph)),
  );
  const opacity = useDerivedValue(() => {
    const p = modeProgress.value;
    const cfg = configSV.value;
    const prv = prevConfigSV.value;
    const ampFactor = lerp(prv.ampFactor, cfg.ampFactor, p);
    const cvg = cvgOf(lerp(prv.pull, cfg.pull, p));
    // Slow heartbeat-shaped breathing WITH a genuine rest phase (like the
    // dominant nodes) instead of a nonstop sine — reads as breathing, not a
    // metronome stuck on the same spot.
    const pulse = heartbeatPulse(time.value / 7 + blob.ph, 1);
    const base = blob.a * (0.30 + pulse * 0.70);
    return base * (0.5 + ampFactor * 0.5) * (1 + cvg * 0.9);
  });
  const center = useDerivedValue(() => vec(cx.value, cy.value));
  return (
    <Circle cx={cx} cy={cy} r={r} opacity={opacity}>
      <RadialGradient
        c={center}
        r={r}
        colors={[colors.accentGold, 'rgba(234,179,8,0)']}
      />
    </Circle>
  );
}

// ─── AnimatedDot ──────────────────────────────────────────────────────────────

function AnimatedDot({ seed, index, time, phaseAcc, breathPhase, beatPhase, configSV, prevConfigSV, modeProgress, shimmerStart, pulseStart, walkStart, walkSalt, w, h, blur }: {
  seed: Seed;
  index: number;
  time: { value: number };
  phaseAcc: { value: number };
  breathPhase: { value: number };
  beatPhase: { value: number };
  configSV: { value: ModeConfig };
  prevConfigSV: { value: ModeConfig };
  modeProgress: { value: number };
  shimmerStart: { value: number };
  pulseStart: { value: number };
  walkStart: { value: number };
  walkSalt: { value: number };
  w: number; h: number;
  blur: number;
}) {
  const cx = useDerivedValue(() => {
    const p = modeProgress.value;
    const cfg = configSV.value;
    const prv = prevConfigSV.value;
    // Converging stagger: far nodes start first and slow, near nodes catch up late
    let pp = p;
    if (cfg.pull > prv.pull) {
      const dn = Math.min(1, Math.hypot(seed.bx - FOCUS_X * w, seed.by - FOCUS_Y * h) / (0.6 * Math.min(w, h)));
      const delay = (1 - dn) * 0.35;
      pp = smoothstep((p - delay) / (1 - delay));
    }
    const pull = lerp(prv.pull, cfg.pull, cfg.pull < prv.pull ? easeOutBack(p) : pp);
    const ampFactor = lerp(prv.ampFactor, cfg.ampFactor, p);
    // Global breathing — each stage has its own breath signature (period in s)
    const breathe = 0.78 + 0.22 * Math.sin(breathPhase.value * TWO_PI);
    let x = nx(seed, phaseAcc.value, w, pull, ampFactor * breathe, time.value);
    // Activating: searchers sweep along the screen perimeter
    if (seed.searcher) {
      const search = lerp(prv.search, cfg.search, p);
      if (search > 0.01) {
        const u = (time.value * 0.10 + seed.phase / TWO_PI) % 1;
        const perim = u < 0.5 ? u * 2 * w : (1 - (u - 0.5) * 2) * w;
        x = x + (perim - x) * search * 0.7;
      }
    }
    return x;
  });

  const cy = useDerivedValue(() => {
    const p = modeProgress.value;
    const cfg = configSV.value;
    const prv = prevConfigSV.value;
    let pp = p;
    if (cfg.pull > prv.pull) {
      const dn = Math.min(1, Math.hypot(seed.bx - FOCUS_X * w, seed.by - FOCUS_Y * h) / (0.6 * Math.min(w, h)));
      const delay = (1 - dn) * 0.35;
      pp = smoothstep((p - delay) / (1 - delay));
    }
    const pull = lerp(prv.pull, cfg.pull, cfg.pull < prv.pull ? easeOutBack(p) : pp);
    const ampFactor = lerp(prv.ampFactor, cfg.ampFactor, p);
    const breathe = 0.78 + 0.22 * Math.sin(breathPhase.value * TWO_PI);
    let y = ny(seed, phaseAcc.value, h, pull, ampFactor * breathe, time.value);
    // Negative: risers slowly float upward — the doubt that departs
    if (seed.riser) {
      const cut = lerp(prv.edgeCut, cfg.edgeCut, p);
      if (cut > 0.01) {
        y -= (time.value * 9 + seed.phase * 30) % (h * 0.4) * cut * 3.3;
      }
    }
    // Searchers sweep top/bottom edges in activating
    if (seed.searcher) {
      const search = lerp(prv.search, cfg.search, p);
      if (search > 0.01) {
        const u = (time.value * 0.10 + seed.phase / TWO_PI) % 1;
        const edgeY = u < 0.5 ? h * 0.06 : h * 0.94;
        y = y + (edgeY - y) * search * 0.7;
      }
    }
    return y;
  });

  const r = useDerivedValue(() => {
    const p = modeProgress.value;
    const cfg = configSV.value;
    const prv = prevConfigSV.value;

    let targetFactor: number;
    let prevFactor: number;
    if (seed.colorIndex === 0) {
      prevFactor = prv.blueFactor; targetFactor = cfg.blueFactor;
    } else if (seed.colorIndex === 1) {
      prevFactor = prv.goldFactor; targetFactor = cfg.goldFactor;
    } else if (seed.colorIndex === 2) {
      prevFactor = prv.burgundyFactor; targetFactor = cfg.burgundyFactor;
    } else {
      prevFactor = prv.violetFactor; targetFactor = cfg.violetFactor;
    }
    const colorFactor = lerp(prevFactor, targetFactor, p);

    let scale = 1.0;
    if (seed.tier === 'dominant') {
      // Heartbeat-shaped pulsation — each dominant node offset by its phase
      // so they fire in a staggered organic rhythm, not simultaneously
      const beat = heartbeatPulse(beatPhase.value + seed.phase * 0.22, 1);
      // Choice pulse: one strong extra heartbeat, decays over 0.9s
      const pulseAge = time.value - pulseStart.value;
      const pulseBoost = pulseStart.value > 0 && pulseAge < 0.9 ? (1 - pulseAge / 0.9) : 0;
      scale = 0.60 + beat * 0.95 * (1 + pulseBoost * 1.4); // 0.60 at rest → 1.55 at peak
    } else if (seed.tier === 'support') {
      // Support nodes: gentle sine breathing at their own pace
      scale = 0.90 + Math.sin(time.value * 0.8 * seed.freqJitter + seed.phase) * 0.10;
    }

    // thoughtWalk: 5 nodes flare in sequence — a thought running along a chain
    if (seed.tier !== 'dominant' && walkStart.value > 0) {
      const order = (index * 13 + walkSalt.value) % 44;
      if (order < 5) {
        const age = time.value - walkStart.value - order * 0.35;
        if (age >= 0 && age < 0.6) {
          scale += Math.sin((age / 0.6) * Math.PI) * 0.9;
        }
      }
    }

    // Typing shimmer: a rotating subset of non-dominant nodes flares briefly.
    // Selection hash rotates with each shimmer event (integer ms of start time).
    if (seed.tier !== 'dominant' && shimmerStart.value > 0) {
      const age = time.value - shimmerStart.value;
      if (age >= 0 && age < 0.55) {
        const salt = Math.floor(shimmerStart.value * 1000);
        if (((index * 31 + salt * 17) % 44) < 4) {
          scale += (1 - age / 0.55) * 1.1;
        }
      }
    }

    const cvg = cvgOf(lerp(prv.pull, cfg.pull, p));
    return Math.max(0.4, seed.r * scale * colorFactor * (1 + cvg * 0.5));
  });

  return (
    <Circle cx={cx} cy={cy} r={r} color={seed.color}>
      <BlurMask blur={blur} style="normal" />
    </Circle>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function NeuralThoughtNetwork({ mode, intensity = 1, style }: Props) {
  const { width, height } = useWindowDimensions();

  const config = useMemo<ModeConfig>(() => {
    const base = CONFIGS[mode];
    return { ...base, speed: base.speed * intensity };
  }, [mode, intensity]);

  const configSV = useSharedValue<ModeConfig>(config);
  const prevConfigSV = useSharedValue<ModeConfig>(config);
  const modeProgress = useSharedValue(1);
  const transitionStartSV = useSharedValue(-1);

  useEffect(() => {
    prevConfigSV.value = configSV.value;
    configSV.value = config;
    modeProgress.value = 0;
    transitionStartSV.value = -1;
  }, [config]); // eslint-disable-line react-hooks/exhaustive-deps

  const time = useSharedValue(0);
  const shaderT = useSharedValue(0);
  // Breathing phase accumulator: sin(time/period) would sweep wildly when the
  // period lerps between modes (same class of bug as the speed "stop-kran") —
  // accumulate phase at the current rate instead.
  const breathPhase = useSharedValue(0);
  // Heartbeat phase accumulator — beatFreq lerps between modes, so
  // heartbeatPulse(time * freq) would sweep wildly (same bug class).
  const beatPhase = useSharedValue(0);
  // Worklets can't capture the imported module object — take direct refs
  // to the mutables so the closure captures each SharedValue itself.
  const fxShimmerCount = neuralFx.shimmerCount;
  const fxRippleCount = neuralFx.rippleCount;
  const fxRippleX = neuralFx.rippleX;
  const fxRippleY = neuralFx.rippleY;
  const fxPulseCount = neuralFx.pulseCount;
  // fx event tracking: stamp canvas clock when a counter changes
  const shimmerStart = useSharedValue(0);
  const rippleStart = useSharedValue(0);
  const pulseStart = useSharedValue(0);
  const seenShimmer = useSharedValue(0);
  const seenRipple = useSharedValue(0);
  const seenPulse = useSharedValue(0);
  // thoughtWalk: in long stillness a "thought" runs along a chain of nodes
  const walkStart = useSharedValue(-18); // first walk ~2s after launch would be too eager; offset
  const walkSalt = useSharedValue(0);
  // phaseAcc replaces (time * speed): accumulates at interpolated speed each frame.
  // This decouples position phase from clock time — speed transitions feel like
  // organic acceleration rather than position teleports (the "stop-kran" bug).
  const phaseAcc = useSharedValue(0);
  const lastTs = useSharedValue(0);

  useFrameCallback((info) => {
    if (lastTs.value === 0) lastTs.value = info.timestamp;
    const delta = Math.min(info.timestamp - lastTs.value, 100) / 1000;
    time.value += delta;
    lastTs.value = info.timestamp;

    if (transitionStartSV.value < 0) {
      transitionStartSV.value = time.value;
    }

    if (modeProgress.value < 1) {
      const elapsed = time.value - transitionStartSV.value;
      modeProgress.value = smoothstep(elapsed / configSV.value.transitionDuration);
    }

    // Interpolated speed applied to phaseAcc — smooth acceleration between modes
    const p = modeProgress.value;
    const currentSpeed = lerp(prevConfigSV.value.speed, configSV.value.speed, p);
    phaseAcc.value += delta * currentSpeed;
    // Shader time flows with drift speed (idle = baseline 0.17)
    shaderT.value += delta * 0.06 * (currentSpeed / 0.17);
    const period = lerp(prevConfigSV.value.breathPeriod, configSV.value.breathPeriod, p);
    breathPhase.value += delta / period;
    beatPhase.value += delta * lerp(prevConfigSV.value.beatFreq, configSV.value.beatFreq, p);

    // fx events: counters changed on the JS side -> stamp our clock
    if (fxShimmerCount.value !== seenShimmer.value) {
      seenShimmer.value = fxShimmerCount.value;
      shimmerStart.value = time.value;
    }
    if (fxRippleCount.value !== seenRipple.value) {
      seenRipple.value = fxRippleCount.value;
      rippleStart.value = time.value;
    }
    if (fxPulseCount.value !== seenPulse.value) {
      seenPulse.value = fxPulseCount.value;
      pulseStart.value = time.value;
    }

    // thoughtWalk fires every ~20s of stillness (idle-like modes only)
    if (configSV.value.pull === 0 && configSV.value.centerGlow === 0
        && time.value - walkStart.value > 20) {
      walkStart.value = time.value;
      walkSalt.value = Math.floor(time.value * 7) % 997;
    }
  });

  const seeds = useMemo(() => buildSeeds(width, height), [width, height]);

  const dominantBlur = 20 * config.dominantBlurScale;
  const supportBlur  = 8  * config.supportBlurScale;
  const backgroundBlur = 3;

  // ── Opacity derived values ─────────────────────────────────────────────────

  const connOpacity = useDerivedValue(() => {
    const p = modeProgress.value;
    const cfg = configSV.value;
    const prv = prevConfigSV.value;
    const base = lerp(prv.connBase, cfg.connBase, p);
    const amp  = lerp(prv.connPulseAmp, cfg.connPulseAmp, p);
    const cvgLift = 1 + cvgOf(lerp(prv.pull, cfg.pull, p)) * 1.4;
    // Press ripple briefly lifts the whole web, decaying over 1.4s
    const rippleAge = time.value - rippleStart.value;
    const rippleLift = rippleStart.value > 0 && rippleAge < 1.4 ? (1 - rippleAge / 1.4) * 0.10 : 0;
    return Math.max(0.02, (base + Math.sin(time.value * cfg.connPulseFreq * TWO_PI) * amp) * cvgLift + rippleLift);
  });

  const rippleR = useDerivedValue(() => {
    const age = time.value - rippleStart.value;
    if (rippleStart.value <= 0 || age < 0 || age > 1.4) return 0;
    // wave speed ~0.9 * min(W,H) per second (design spec)
    return age * Math.min(width, height) * 0.9;
  });

  const rippleOpacity = useDerivedValue(() => {
    const age = time.value - rippleStart.value;
    if (rippleStart.value <= 0 || age < 0 || age > 1.4) return 0;
    return 0.16 * (1 - age / 1.4);
  });

  const rippleCx = useDerivedValue(() => fxRippleX.value * width);
  const rippleCy = useDerivedValue(() => fxRippleY.value * height);
  const rippleCenter = useDerivedValue(() => vec(rippleCx.value, rippleCy.value));
  const rippleRForGrad = useDerivedValue(() => Math.max(rippleR.value, 1));

  const brightOpacity = useDerivedValue(() => {
    const p = modeProgress.value;
    const cfg = configSV.value;
    const prv = prevConfigSV.value;
    const base = lerp(prv.brightBase, cfg.brightBase, p);
    if (base < 0.005) return 0;
    return Math.max(0, base + Math.sin(time.value * cfg.brightFreq * TWO_PI + Math.PI * 0.5) * 0.09);
  });

  // Real rest phase (heartbeat-shaped) instead of a nonstop sine that never
  // dims below ~40-70% — the old formula read as a "signal light" beacon
  // sitting behind the revealed thought/option, never actually going quiet.
  const centerOpacity = useDerivedValue(() => {
    const p = modeProgress.value;
    const cfg = configSV.value;
    const prv = prevConfigSV.value;
    const glow = lerp(prv.centerGlow, cfg.centerGlow, p);
    if (glow < 0.005) return 0;
    const pulse = heartbeatPulse(time.value, cfg.centerGlowFreq);
    return Math.max(0, glow * (0.15 + pulse * 0.85) * 0.85);
  });

  const centerNegOpacity = useDerivedValue(() => {
    const p = modeProgress.value;
    const cfg = configSV.value;
    const prv = prevConfigSV.value;
    const glow = lerp(prv.centerNegGlow, cfg.centerNegGlow, p);
    if (glow < 0.005) return 0;
    const pulse = heartbeatPulse(time.value, cfg.centerNegFreq);
    return Math.max(0, glow * (0.15 + pulse * 0.85) * 0.85);
  });

  // ── Connection paths — use phaseAcc for positions ─────────────────────────

  const connPath = useDerivedValue(() => {
    'worklet';
    const p = modeProgress.value;
    const cfg = configSV.value;
    const prv = prevConfigSV.value;
    const pull = lerp(prv.pull, cfg.pull, cfg.pull < prv.pull ? easeOutBack(p) : p);
    const ampFactor = lerp(prv.ampFactor, cfg.ampFactor, p);
    const edgeCut = lerp(prv.edgeCut, cfg.edgeCut, p);
    const breathe = 0.78 + 0.22 * Math.sin(breathPhase.value * TWO_PI);
    const t = phaseAcc.value;
    const cvg = cvgOf(pull);
    const maxD = Math.min(width, height) * (0.30 + cvg * 0.12);
    const maxDSq = maxD * maxD;
    const focusX = FOCUS_X * width; const focusY = FOCUS_Y * height;
    const focusRSq = Math.min(width, height) * 0.4 * (Math.min(width, height) * 0.4);
    const path = Skia.Path.Make();
    const xs: number[] = []; const ys: number[] = [];
    for (let i = 0; i < seeds.length; i++) {
      xs.push(nx(seeds[i], t, width, pull, ampFactor * breathe, time.value));
      ys.push(ny(seeds[i], t, height, pull, ampFactor * breathe, time.value));
    }
    for (let i = 0; i < seeds.length; i++) {
      for (let j = i + 1; j < seeds.length; j++) {
        const dx = xs[i] - xs[j]; const dy = ys[i] - ys[j];
        if (dx * dx + dy * dy < maxDSq) {
          // Doubt breaks links: drop a stable subset of near-focus edges
          if (edgeCut > 0.01) {
            const mx = (xs[i] + xs[j]) / 2 - focusX;
            const my = (ys[i] + ys[j]) / 2 - focusY;
            if (mx * mx + my * my < focusRSq && ((i * 7 + j * 11) % 10) < edgeCut * 10) {
              continue;
            }
          }
          path.moveTo(xs[i], ys[i]);
          path.lineTo(xs[j], ys[j]);
        }
      }
    }
    return path;
  });

  const brightPath = useDerivedValue(() => {
    'worklet';
    const p = modeProgress.value;
    const cfg = configSV.value;
    const prv = prevConfigSV.value;
    const base = lerp(prv.brightBase, cfg.brightBase, p);
    if (base < 0.005) return Skia.Path.Make();
    const pull = lerp(prv.pull, cfg.pull, p);
    const ampFactor = lerp(prv.ampFactor, cfg.ampFactor, p);
    const breathe = 0.78 + 0.22 * Math.sin(breathPhase.value * TWO_PI);
    const t = phaseAcc.value;
    const maxDb = Math.min(width, height) * (0.30 + cvgOf(pull) * 0.12);
    const maxDbSq = maxDb * maxDb;
    const path = Skia.Path.Make();
    const xs: number[] = []; const ys: number[] = [];
    for (let i = 0; i < seeds.length; i++) {
      xs.push(nx(seeds[i], t, width, pull, ampFactor * breathe, time.value));
      ys.push(ny(seeds[i], t, height, pull, ampFactor * breathe, time.value));
    }
    for (let i = 0; i < seeds.length; i++) {
      for (let j = i + 1; j < seeds.length; j++) {
        if ((i * 7 + j * 13) % 5 !== 0) continue;
        const dx = xs[i] - xs[j]; const dy = ys[i] - ys[j];
        if (dx * dx + dy * dy < maxDbSq) {
          path.moveTo(xs[i], ys[i]);
          path.lineTo(xs[j], ys[j]);
        }
      }
    }
    return path;
  });

  const shaderUniforms = useDerivedValue(() => {
    const p = modeProgress.value;
    // mood lead-in: the field starts warming before the rest of the transition lands
    const moodP = smoothstep(Math.min(1, p * 1.35));
    const mood = lerp(prevConfigSV.value.mood, configSV.value.mood, moodP);
    return { u_res: [width, height], u_time: shaderT.value, u_mood: mood };
  });

  return (
    <Canvas style={[StyleSheet.absoluteFill, style]}>
      {MINDSPACE_EFFECT ? (
        <Fill>
          <Shader source={MINDSPACE_EFFECT} uniforms={shaderUniforms} />
        </Fill>
      ) : null}

      {BLOBS.map((blob, i) => (
        <AmbientBlob
          key={`blob-${i}`}
          blob={blob}
          blobIndex={i}
          time={time}
          configSV={configSV}
          prevConfigSV={prevConfigSV}
          modeProgress={modeProgress}
          w={width} h={height}
        />
      ))}

      <Path path={connPath} style="stroke" strokeWidth={0.5}
        color="rgba(255,255,255,1)" opacity={connOpacity} />

      <Path path={brightPath} style="stroke" strokeWidth={1.2}
        color={config.brightPathColor} opacity={brightOpacity} />

      <Circle cx={width * FOCUS_X} cy={height * FOCUS_Y} r={120} opacity={centerOpacity}>
        <RadialGradient
          c={vec(width * FOCUS_X, height * FOCUS_Y)}
          r={120}
          colors={[colors.accentGold, 'rgba(234,179,8,0)']}
        />
      </Circle>

      <Circle cx={width * FOCUS_X} cy={height * FOCUS_Y} r={150} opacity={centerNegOpacity}>
        <RadialGradient
          c={vec(width * FOCUS_X, height * FOCUS_Y)}
          r={150}
          colors={[colors.resistanceBurgundy, 'rgba(139,41,66,0)']}
        />
      </Circle>

      <Circle cx={rippleCx} cy={rippleCy} r={rippleR} opacity={rippleOpacity}>
        <RadialGradient
          c={rippleCenter}
          r={rippleRForGrad}
          colors={['rgba(234,179,8,0)', colors.accentGold, 'rgba(234,179,8,0)']}
          positions={[0, 0.8, 1]}
        />
      </Circle>

      {seeds.map((seed, i) => (
        <AnimatedDot
          key={i}
          seed={seed}
          index={i}
          breathPhase={breathPhase}
          beatPhase={beatPhase}
          shimmerStart={shimmerStart}
          pulseStart={pulseStart}
          walkStart={walkStart}
          walkSalt={walkSalt}
          time={time}
          phaseAcc={phaseAcc}
          configSV={configSV}
          prevConfigSV={prevConfigSV}
          modeProgress={modeProgress}
          w={width} h={height}
          blur={
            seed.tier === 'dominant' ? dominantBlur
              : seed.tier === 'support' ? supportBlur
              : backgroundBlur
          }
        />
      ))}
    </Canvas>
  );
}
