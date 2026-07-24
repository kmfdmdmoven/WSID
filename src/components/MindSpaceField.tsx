import React, { useMemo } from 'react';
import { StyleSheet, useWindowDimensions } from 'react-native';
import {
  BlurMask,
  Canvas,
  Circle,
  Fill,
  Path,
  Shader,
  Skia,
} from '@shopify/react-native-skia';
import {
  useDerivedValue,
  useFrameCallback,
  useSharedValue,
} from 'react-native-reanimated';

export interface MindSpaceFieldProps {
  mood?: number;
  intensity?: number;
}

// SkSL domain-warped FBM — stays near black (luminance ≤ 0.10).
// Mood shifts cool↔warm tint; intensity adds ambient lift.
const SKSL = `
uniform float u_time;
uniform float2 u_resolution;
uniform float u_mood;
uniform float u_intensity;

float hash21(float2 p) {
  p = fract(p * float2(234.34, 435.345));
  p += dot(p, p + 34.23);
  return fract(p.x * p.y);
}
float snoise(float2 p) {
  float2 i = floor(p);
  float2 f = fract(p);
  float2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash21(i),                    hash21(i + float2(1.0, 0.0)), u.x),
    mix(hash21(i + float2(0.0, 1.0)), hash21(i + float2(1.0, 1.0)), u.x),
    u.y
  );
}
float fbm(float2 p) {
  float v = 0.0; float a = 0.5;
  v += a * snoise(p); p = p * 2.0 + float2(100.0); a *= 0.5;
  v += a * snoise(p); p = p * 2.0 + float2(100.0); a *= 0.5;
  v += a * snoise(p); p = p * 2.0 + float2(100.0); a *= 0.5;
  v += a * snoise(p);
  return v;
}
half4 main(float2 pos) {
  float2 uv = pos / u_resolution;
  float t = u_time * 0.06;
  float2 q = float2(fbm(uv + t), fbm(uv + float2(5.2, 1.3) + t * 0.8));
  float2 r = float2(
    fbm(uv + 2.0 * q + float2(1.7, 9.2) + 0.12 * t),
    fbm(uv + 2.0 * q + float2(8.3, 2.8) + 0.10 * t)
  );
  float f = fbm(uv + 2.0 * r);
  float3 base      = mix(float3(0.010, 0.010, 0.022), float3(0.022, 0.015, 0.004), u_mood);
  float3 highlight = mix(float3(0.015, 0.020, 0.050), float3(0.040, 0.030, 0.008), u_mood);
  float3 col       = mix(base, highlight, clamp(f * 3.0 - 0.5, 0.0, 1.0));
  col += u_intensity * 0.02;
  col  = clamp(col, 0.0, 0.10);
  return half4(half3(col), 1.0);
}
`;

// 5 nodes: 3 bright + 2 ghost — distinct non-syncing velocities via irrational seeds
const SEEDS = [0.31, 1.23, 2.71, 4.08, 5.83] as const;

export function MindSpaceField({ mood = 0.4, intensity = 0.6 }: MindSpaceFieldProps) {
  const { width: W, height: H } = useWindowDimensions();

  const effect = useMemo(() => Skia.RuntimeEffect.Make(SKSL), []);

  const shaderTime = useSharedValue(0);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const uniforms = useDerivedValue(() => ({
    u_time:       shaderTime.value,
    u_resolution: [W, H],
    u_mood:       mood,
    u_intensity:  intensity,
  })) as any;

  const positions = useSharedValue(
    SEEDS.map((s, i) => ({
      x: W * [0.22, 0.72, 0.48, 0.15, 0.82][i],
      y: H * [0.18, 0.30, 0.60, 0.52, 0.75][i],
    })),
  );

  const x0 = useDerivedValue(() => positions.value[0].x);
  const y0 = useDerivedValue(() => positions.value[0].y);
  const x1 = useDerivedValue(() => positions.value[1].x);
  const y1 = useDerivedValue(() => positions.value[1].y);
  const x2 = useDerivedValue(() => positions.value[2].x);
  const y2 = useDerivedValue(() => positions.value[2].y);
  const x3 = useDerivedValue(() => positions.value[3].x);
  const y3 = useDerivedValue(() => positions.value[3].y);
  const x4 = useDerivedValue(() => positions.value[4].x);
  const y4 = useDerivedValue(() => positions.value[4].y);

  const connPath = useDerivedValue(() => {
    const path = Skia.Path.Make();
    const pts = positions.value;
    for (let i = 0; i < 3; i++) {
      for (let j = i + 1; j < 3; j++) {
        const dx = pts[i].x - pts[j].x;
        const dy = pts[i].y - pts[j].y;
        if (Math.sqrt(dx * dx + dy * dy) < 260) {
          path.moveTo(pts[i].x, pts[i].y);
          path.lineTo(pts[j].x, pts[j].y);
        }
      }
    }
    return path;
  });

  useFrameCallback(({ timeSinceFirstFrame }) => {
    const sec = timeSinceFirstFrame / 1000;
    shaderTime.value = sec;

    const cur = positions.value;
    const dt = 1 / 60;
    const spd = 20;
    const next: { x: number; y: number }[] = [];
    for (let i = 0; i < 5; i++) {
      const s = SEEDS[i];
      const px = cur[i].x;
      const py = cur[i].y;
      const vx = Math.sin(px * 0.004 + sec * (0.11 + s * 0.02)) * Math.cos(py * 0.003 + s) * spd;
      const vy = Math.cos(px * 0.003 + s * 2.0 + sec * (0.09 + s * 0.025)) * Math.sin(py * 0.004 + s * 1.5) * spd;
      let nx = px + vx * dt;
      let ny = py + vy * dt;
      if (nx < 0) nx += W; else if (nx > W) nx -= W;
      if (ny < 0) ny += H; else if (ny > H) ny -= H;
      next.push({ x: nx, y: ny });
    }
    positions.value = next;
  });

  if (!effect) return null;

  return (
    <Canvas style={StyleSheet.absoluteFill}>
      <Fill>
        <Shader source={effect} uniforms={uniforms} />
      </Fill>

      <Circle cx={x0} cy={y0} r={4.5} color="rgba(255,255,255,0.80)">
        <BlurMask blur={10} style="normal" />
      </Circle>
      <Circle cx={x1} cy={y1} r={3.8} color="rgba(255,255,255,0.65)">
        <BlurMask blur={8} style="normal" />
      </Circle>
      <Circle cx={x2} cy={y2} r={4.2} color="rgba(255,255,255,0.72)">
        <BlurMask blur={9} style="normal" />
      </Circle>

      <Circle cx={x3} cy={y3} r={2.0} color="rgba(255,255,255,0.14)" />
      <Circle cx={x4} cy={y4} r={2.0} color="rgba(255,255,255,0.12)" />

      <Path
        path={connPath}
        color="rgba(255,255,255,0.05)"
        style="stroke"
        strokeWidth={0.8}
      />
    </Canvas>
  );
}
