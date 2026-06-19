import React, { useMemo } from 'react';
import { StyleSheet, useWindowDimensions, ViewStyle } from 'react-native';
import { BlurMask, Canvas, Circle, Path, Skia } from '@shopify/react-native-skia';
import { useDerivedValue, useFrameCallback, useSharedValue } from 'react-native-reanimated';
import type { NeuralMode } from '../types';

interface Props {
  mode: NeuralMode;
  intensity?: number;
  style?: ViewStyle;
}

interface Seed {
  bx: number;
  by: number;
  r: number;
  color: string;
  phase: number;
  sx: number;
  sy: number;
  amp: number;
}

const COLORS = ['#4A90E2', '#EAB308', '#8B2942', '#8B5CF6'];
const NODE_COUNT = 50;
const CONN_DIST_SQ = 120 * 120;
const BASE_SPEED = 0.22;

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
    let bx: number;
    let by: number;
    const zone = i % 5;

    if (zone < 2) {
      bx = w * (0.04 + rng() * 0.92);
      by = h * (0.04 + rng() * 0.26);
    } else if (zone === 2) {
      bx = w * (0.04 + rng() * 0.92);
      by = h * (0.72 + rng() * 0.24);
    } else {
      const left = rng() < 0.5;
      bx = left ? w * (0.02 + rng() * 0.14) : w * (0.84 + rng() * 0.14);
      by = h * (0.28 + rng() * 0.46);
    }

    seeds.push({
      bx,
      by,
      r: 2.5 + rng() * 4,
      color: COLORS[i % COLORS.length],
      phase: rng() * Math.PI * 2,
      sx: BASE_SPEED * (0.6 + rng() * 0.8),
      sy: BASE_SPEED * (0.5 + rng() * 0.7),
      amp: 12 + rng() * 18,
    });
  }

  return seeds;
}

// Worklet-safe position helpers
function nx(seed: Seed, t: number): number {
  'worklet';
  return seed.bx + Math.sin(t * seed.sx + seed.phase) * seed.amp;
}

function ny(seed: Seed, t: number): number {
  'worklet';
  return seed.by + Math.cos(t * seed.sy + seed.phase * 1.3) * seed.amp;
}

function AnimatedDot({ seed, time }: { seed: Seed; time: { value: number } }) {
  const cx = useDerivedValue(() => nx(seed, time.value));
  const cy = useDerivedValue(() => ny(seed, time.value));
  return (
    <Circle cx={cx} cy={cy} r={seed.r} color={seed.color}>
      <BlurMask blur={7} style="normal" />
    </Circle>
  );
}

export function NeuralThoughtNetwork({ style }: Props) {
  const { width, height } = useWindowDimensions();

  // Accumulated elapsed seconds — avoids timestamp-drift pushing nodes off screen
  const time = useSharedValue(0);
  const lastTs = useSharedValue(0);

  const seeds = useMemo(() => buildSeeds(width, height), [width, height]);

  useFrameCallback((info) => {
    if (lastTs.value === 0) {
      lastTs.value = info.timestamp;
    }
    const delta = Math.min(info.timestamp - lastTs.value, 100);
    time.value += delta / 1000;
    lastTs.value = info.timestamp;
  });

  // Single derived path for all connections — recomputes every frame in worklet
  const connPath = useDerivedValue(() => {
    'worklet';
    const t = time.value;
    const path = Skia.Path.Make();
    const xs: number[] = [];
    const ys: number[] = [];

    for (let i = 0; i < seeds.length; i++) {
      xs.push(nx(seeds[i], t));
      ys.push(ny(seeds[i], t));
    }

    for (let i = 0; i < seeds.length; i++) {
      for (let j = i + 1; j < seeds.length; j++) {
        const dx = xs[i] - xs[j];
        const dy = ys[i] - ys[j];
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
      <Path
        path={connPath}
        style="stroke"
        strokeWidth={0.5}
        color="rgba(255,255,255,0.12)"
      />
      {seeds.map((seed, i) => (
        <AnimatedDot key={i} seed={seed} time={time} />
      ))}
    </Canvas>
  );
}
