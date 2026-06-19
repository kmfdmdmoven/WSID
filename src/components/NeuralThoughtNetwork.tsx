import React, { useEffect, useMemo } from 'react';
import { StyleSheet, useWindowDimensions, ViewStyle } from 'react-native';
import { BlurMask, Canvas, Circle, Path, Skia } from '@shopify/react-native-skia';
import {
  useDerivedValue,
  useFrameCallback,
  useSharedValue,
} from 'react-native-reanimated';
import { colors } from '../constants/colors';
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
  // How long this mode takes to fully settle (seconds)
  transitionDuration: number;
}

// ─── Mode configurations ──────────────────────────────────────────────────────

const CONFIGS: Record<NeuralMode, ModeConfig> = {
  idle: {
    speed: 0.22, ampFactor: 1.0, pull: 0,
    connBase: 0.09, connPulseFreq: 0.22, connPulseAmp: 0.025,
    brightBase: 0.06, brightFreq: 0.38, brightPathColor: 'rgba(255,255,255,0.9)',
    centerGlow: 0, centerGlowFreq: 0.4,
    centerNegGlow: 0, centerNegFreq: 0.3,
    goldFactor: 1.0, blueFactor: 1.0, burgundyFactor: 1.0, violetFactor: 1.0,
    dominantBlurScale: 1.0, supportBlurScale: 1.0,
    transitionDuration: 1.2,
  },
  thinking: {
    speed: 0.34, ampFactor: 1.20, pull: 0,
    connBase: 0.13, connPulseFreq: 0.55, connPulseAmp: 0.04,
    brightBase: 0.10, brightFreq: 0.7, brightPathColor: 'rgba(74,144,226,0.85)',
    centerGlow: 0, centerGlowFreq: 0.5,
    centerNegGlow: 0, centerNegFreq: 0.3,
    goldFactor: 1.05, blueFactor: 1.35, burgundyFactor: 0.75, violetFactor: 1.25,
    dominantBlurScale: 1.1, supportBlurScale: 1.1,
    transitionDuration: 1.5,
  },
  activating: {
    speed: 0.42, ampFactor: 1.35, pull: 0.006,
    connBase: 0.16, connPulseFreq: 1.10, connPulseAmp: 0.08,
    brightBase: 0.30, brightFreq: 1.6, brightPathColor: 'rgba(234,179,8,0.9)',
    centerGlow: 0, centerGlowFreq: 1.0,
    centerNegGlow: 0, centerNegFreq: 0.3,
    goldFactor: 1.50, blueFactor: 1.30, burgundyFactor: 0.60, violetFactor: 0.80,
    dominantBlurScale: 1.35, supportBlurScale: 1.3,
    transitionDuration: 0.8,
  },
  converging: {
    speed: 0.32, ampFactor: 0.85, pull: 0.022,
    connBase: 0.19, connPulseFreq: 0.75, connPulseAmp: 0.06,
    brightBase: 0.34, brightFreq: 1.0, brightPathColor: 'rgba(234,179,8,0.9)',
    centerGlow: 0.28, centerGlowFreq: 0.7,
    centerNegGlow: 0, centerNegFreq: 0.3,
    goldFactor: 1.70, blueFactor: 1.15, burgundyFactor: 0.50, violetFactor: 1.0,
    dominantBlurScale: 1.45, supportBlurScale: 1.35,
    transitionDuration: 1.0,
  },
  result: {
    speed: 0.18, ampFactor: 0.60, pull: 0.010,
    connBase: 0.11, connPulseFreq: 0.40, connPulseAmp: 0.03,
    brightBase: 0.16, brightFreq: 0.5, brightPathColor: 'rgba(234,179,8,0.85)',
    centerGlow: 0.62, centerGlowFreq: 0.38,
    centerNegGlow: 0, centerNegFreq: 0.3,
    goldFactor: 1.95, blueFactor: 1.05, burgundyFactor: 0.45, violetFactor: 0.70,
    dominantBlurScale: 1.55, supportBlurScale: 1.25,
    transitionDuration: 1.8,
  },
  emotionPositive: {
    speed: 0.26, ampFactor: 1.10, pull: 0,
    connBase: 0.15, connPulseFreq: 0.50, connPulseAmp: 0.045,
    brightBase: 0.20, brightFreq: 0.6, brightPathColor: 'rgba(234,179,8,1.0)',
    centerGlow: 0.38, centerGlowFreq: 0.45,
    centerNegGlow: 0, centerNegFreq: 0.3,
    goldFactor: 2.20, blueFactor: 1.45, burgundyFactor: 0.18, violetFactor: 0.45,
    dominantBlurScale: 1.7, supportBlurScale: 1.6,
    transitionDuration: 2.0,
  },
  emotionNegative: {
    speed: 0.17, ampFactor: 0.82, pull: 0,
    connBase: 0.06, connPulseFreq: 0.32, connPulseAmp: 0.018,
    brightBase: 0.10, brightFreq: 0.28, brightPathColor: 'rgba(139,41,66,0.9)',
    centerGlow: 0, centerGlowFreq: 0.35,
    centerNegGlow: 0.50, centerNegFreq: 0.28,
    goldFactor: 0.18, blueFactor: 0.48, burgundyFactor: 2.60, violetFactor: 2.10,
    dominantBlurScale: 0.70, supportBlurScale: 0.45,
    transitionDuration: 2.8, // slow — the user must feel resistance settling
  },
  discovery: {
    speed: 0.20, ampFactor: 0.72, pull: 0.010,
    connBase: 0.14, connPulseFreq: 0.34, connPulseAmp: 0.04,
    brightBase: 0.22, brightFreq: 0.44, brightPathColor: 'rgba(234,179,8,1.0)',
    centerGlow: 0.45, centerGlowFreq: 0.36,
    centerNegGlow: 0, centerNegFreq: 0.3,
    goldFactor: 2.05, blueFactor: 1.25, burgundyFactor: 0.22, violetFactor: 0.65,
    dominantBlurScale: 1.55, supportBlurScale: 1.5,
    transitionDuration: 2.5, // gold returns slowly — the feeling of release
  },
};

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

// ─── Seed generation ─────────────────────────────────────────────────────────

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
        case 2: bx = w * (0.15 + rng() * 0.22); by = h * (0.38 + rng() * 0.26); break; // center-left ★
        case 3: bx = w * (0.63 + rng() * 0.22); by = h * (0.38 + rng() * 0.26); break; // center-right ★
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
    });
  }
  return seeds;
}

// ─── Worklet helpers ──────────────────────────────────────────────────────────

// Smooth step easing — slow start, slow end
function smoothstep(t: number): number {
  'worklet';
  const c = Math.max(0, Math.min(1, t));
  return c * c * (3 - 2 * c);
}

// Linear interpolation
function lerp(a: number, b: number, t: number): number {
  'worklet';
  return a + (b - a) * t;
}

function nx(seed: Seed, t: number, w: number, pull: number, ampFactor: number): number {
  'worklet';
  const x = seed.bx + Math.sin(t * seed.sx + seed.phase) * seed.amp * ampFactor;
  return pull > 0 ? x + (w / 2 - x) * pull : x;
}

function ny(seed: Seed, t: number, h: number, pull: number, ampFactor: number): number {
  'worklet';
  const y = seed.by + Math.cos(t * seed.sy + seed.phase * 1.3) * seed.amp * ampFactor;
  return pull > 0 ? y + (h / 2 - y) * pull : y;
}

// ─── AnimatedDot ──────────────────────────────────────────────────────────────

function AnimatedDot({ seed, time, configSV, prevConfigSV, modeProgress, w, h, blur }: {
  seed: Seed;
  time: { value: number };
  configSV: { value: ModeConfig };
  prevConfigSV: { value: ModeConfig };
  modeProgress: { value: number };
  w: number; h: number;
  blur: number;
}) {
  const cx = useDerivedValue(() => {
    const p = modeProgress.value;
    const cfg = configSV.value;
    const prv = prevConfigSV.value;
    const speed = lerp(prv.speed, cfg.speed, p);
    const pull = lerp(prv.pull, cfg.pull, p);
    const ampFactor = lerp(prv.ampFactor, cfg.ampFactor, p);
    return nx(seed, time.value * speed, w, pull, ampFactor);
  });

  const cy = useDerivedValue(() => {
    const p = modeProgress.value;
    const cfg = configSV.value;
    const prv = prevConfigSV.value;
    const speed = lerp(prv.speed, cfg.speed, p);
    const pull = lerp(prv.pull, cfg.pull, p);
    const ampFactor = lerp(prv.ampFactor, cfg.ampFactor, p);
    return ny(seed, time.value * speed, h, pull, ampFactor);
  });

  // Radius: interpolated color factor + dominant breathing
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

    const breathe = seed.tier === 'dominant'
      ? 1 + Math.sin(time.value * 0.62 + seed.phase) * 0.24
      : 1;

    return Math.max(0.4, seed.r * breathe * colorFactor);
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

  // Current target config (where we are going)
  const configSV = useSharedValue<ModeConfig>(config);
  // Previous config (where we came from) — interpolation start point
  const prevConfigSV = useSharedValue<ModeConfig>(config);
  // Interpolation progress 0→1 with smoothstep easing applied
  const modeProgress = useSharedValue(1); // starts fully settled
  // Raw transition time tracking
  const transitionStartSV = useSharedValue(-1);

  useEffect(() => {
    // On mode change: freeze current visual state as the new "from"
    prevConfigSV.value = configSV.value;
    configSV.value = config;
    modeProgress.value = 0;
    transitionStartSV.value = -1; // will be set on next frame
  }, [config]); // eslint-disable-line react-hooks/exhaustive-deps

  const time = useSharedValue(0);
  const lastTs = useSharedValue(0);

  useFrameCallback((info) => {
    // Accumulate elapsed time
    if (lastTs.value === 0) lastTs.value = info.timestamp;
    const delta = Math.min(info.timestamp - lastTs.value, 100);
    time.value += delta / 1000;
    lastTs.value = info.timestamp;

    // Set transition start on first frame after mode change
    if (transitionStartSV.value < 0) {
      transitionStartSV.value = time.value;
    }

    // Advance interpolation with smooth easing
    if (modeProgress.value < 1) {
      const elapsed = time.value - transitionStartSV.value;
      const duration = configSV.value.transitionDuration;
      modeProgress.value = smoothstep(elapsed / duration);
    }
  });

  const seeds = useMemo(() => buildSeeds(width, height), [width, height]);

  // Blur per tier — static per React render, updates when mode changes
  const dominantBlur = 20 * config.dominantBlurScale;
  const supportBlur  = 8  * config.supportBlurScale;
  const backgroundBlur = 3;

  // ── Animated opacity values — all interpolated ─────────────────────────────

  const connOpacity = useDerivedValue(() => {
    const p = modeProgress.value;
    const cfg = configSV.value;
    const prv = prevConfigSV.value;
    const base = lerp(prv.connBase, cfg.connBase, p);
    const amp  = lerp(prv.connPulseAmp, cfg.connPulseAmp, p);
    return Math.max(0.02, base + Math.sin(time.value * cfg.connPulseFreq * TWO_PI) * amp);
  });

  const brightOpacity = useDerivedValue(() => {
    const p = modeProgress.value;
    const cfg = configSV.value;
    const prv = prevConfigSV.value;
    const base = lerp(prv.brightBase, cfg.brightBase, p);
    if (base < 0.005) return 0;
    return Math.max(0, base + Math.sin(time.value * cfg.brightFreq * TWO_PI + Math.PI * 0.5) * 0.09);
  });

  // Gold center glow — interpolated
  const centerOpacity = useDerivedValue(() => {
    const p = modeProgress.value;
    const cfg = configSV.value;
    const prv = prevConfigSV.value;
    const glow = lerp(prv.centerGlow, cfg.centerGlow, p);
    if (glow < 0.005) return 0;
    return Math.max(0, glow * (0.7 + Math.sin(time.value * cfg.centerGlowFreq * TWO_PI) * 0.3));
  });

  // Burgundy center — interpolated
  const centerNegOpacity = useDerivedValue(() => {
    const p = modeProgress.value;
    const cfg = configSV.value;
    const prv = prevConfigSV.value;
    const glow = lerp(prv.centerNegGlow, cfg.centerNegGlow, p);
    if (glow < 0.005) return 0;
    return Math.max(0, glow * (0.6 + Math.sin(time.value * cfg.centerNegFreq * TWO_PI) * 0.4));
  });

  // ── Connection paths — positions interpolated ──────────────────────────────

  const connPath = useDerivedValue(() => {
    'worklet';
    const p = modeProgress.value;
    const cfg = configSV.value;
    const prv = prevConfigSV.value;
    const speed     = lerp(prv.speed, cfg.speed, p);
    const pull      = lerp(prv.pull, cfg.pull, p);
    const ampFactor = lerp(prv.ampFactor, cfg.ampFactor, p);
    const t = time.value * speed;
    const path = Skia.Path.Make();
    const xs: number[] = []; const ys: number[] = [];
    for (let i = 0; i < seeds.length; i++) {
      xs.push(nx(seeds[i], t, width, pull, ampFactor));
      ys.push(ny(seeds[i], t, height, pull, ampFactor));
    }
    for (let i = 0; i < seeds.length; i++) {
      for (let j = i + 1; j < seeds.length; j++) {
        const dx = xs[i] - xs[j]; const dy = ys[i] - ys[j];
        if (dx * dx + dy * dy < CONN_DIST_SQ) {
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
    const speed     = lerp(prv.speed, cfg.speed, p);
    const pull      = lerp(prv.pull, cfg.pull, p);
    const ampFactor = lerp(prv.ampFactor, cfg.ampFactor, p);
    const t = time.value * speed;
    const path = Skia.Path.Make();
    const xs: number[] = []; const ys: number[] = [];
    for (let i = 0; i < seeds.length; i++) {
      xs.push(nx(seeds[i], t, width, pull, ampFactor));
      ys.push(ny(seeds[i], t, height, pull, ampFactor));
    }
    for (let i = 0; i < seeds.length; i++) {
      for (let j = i + 1; j < seeds.length; j++) {
        if ((i * 7 + j * 13) % 5 !== 0) continue;
        const dx = xs[i] - xs[j]; const dy = ys[i] - ys[j];
        if (dx * dx + dy * dy < CONN_DIST_SQ) {
          path.moveTo(xs[i], ys[i]);
          path.lineTo(xs[j], ys[j]);
        }
      }
    }
    return path;
  });

  return (
    <Canvas style={[StyleSheet.absoluteFill, style]}>
      <Path path={connPath} style="stroke" strokeWidth={0.5}
        color="rgba(255,255,255,1)" opacity={connOpacity} />

      <Path path={brightPath} style="stroke" strokeWidth={1.2}
        color={config.brightPathColor} opacity={brightOpacity} />

      <Circle cx={width / 2} cy={height / 2} r={58}
        color={colors.accentGold} opacity={centerOpacity}>
        <BlurMask blur={40} style="normal" />
      </Circle>

      <Circle cx={width / 2} cy={height / 2} r={75}
        color={colors.resistanceBurgundy} opacity={centerNegOpacity}>
        <BlurMask blur={55} style="normal" />
      </Circle>

      {seeds.map((seed, i) => (
        <AnimatedDot
          key={i}
          seed={seed}
          time={time}
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
