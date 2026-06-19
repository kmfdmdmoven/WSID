import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, StyleSheet, Text, View } from 'react-native';

interface GuidedReflectionProps {
  active: boolean;
  lines: string[];
  // total time per line including fade-in + hold + fade-out
  lineDuration?: number; // default 940ms → 3 lines fit in ~2820ms active window
  fadeMs?: number;       // default 280ms
}

export function GuidedReflection({
  active,
  lines,
  lineDuration = 940,
  fadeMs = 280,
}: GuidedReflectionProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const [displayIndex, setDisplayIndex] = useState(-1);
  const [reduceMotion, setReduceMotion] = useState(false);
  const animRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
  }, []);

  const holdMs = Math.max(0, lineDuration - 2 * fadeMs);

  const animateLine = useCallback(
    (idx: number) => {
      if (idx >= lines.length) return;

      opacity.setValue(0);
      setDisplayIndex(idx);

      const isLast = idx === lines.length - 1;
      const steps: Animated.CompositeAnimation[] = [
        Animated.timing(opacity, { toValue: 1, duration: fadeMs, useNativeDriver: true }),
        Animated.delay(holdMs),
      ];
      if (!isLast) {
        steps.push(
          Animated.timing(opacity, { toValue: 0, duration: fadeMs, useNativeDriver: true }),
        );
      }

      const anim = Animated.sequence(steps);
      animRef.current = anim;
      anim.start(({ finished }) => {
        if (finished && !isLast) {
          animateLine(idx + 1);
        }
      });
    },
    [lines.length, opacity, fadeMs, holdMs],
  );

  useEffect(() => {
    if (!active) return;

    if (reduceMotion) {
      setDisplayIndex(0);
      return;
    }

    animateLine(0);

    return () => {
      animRef.current?.stop();
      opacity.setValue(0);
    };
  }, [active, reduceMotion, animateLine, opacity]);

  if (!active && displayIndex < 0) return null;

  if (reduceMotion) {
    return (
      <View style={styles.container}>
        {lines.map((line, i) => (
          <Text key={i} style={styles.text}>{line}</Text>
        ))}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {displayIndex >= 0 && (
        <Animated.Text style={[styles.text, { opacity }]}>
          {lines[displayIndex]}
        </Animated.Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingHorizontal: 32,
    minHeight: 56,
    justifyContent: 'center',
  },
  text: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 16,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 24,
  },
});
