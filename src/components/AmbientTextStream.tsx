import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, Text } from 'react-native';
import { colors } from '../constants/colors';

export interface AmbientTextStreamProps {
  pool: string[];
  intervalMs?: number;
  fadeMs?: number;
}

export function AmbientTextStream({ pool, intervalMs = 4500, fadeMs = 800 }: AmbientTextStreamProps) {
  const opacity   = useRef(new Animated.Value(0)).current;
  const indexRef  = useRef(0);
  const [lineIndex, setLineIndex] = useState(0);

  useEffect(() => {
    if (!pool.length) return;
    indexRef.current = 0;
    setLineIndex(0);
    opacity.setValue(0);

    let cancelled = false;
    const holdMs = Math.max(0, intervalMs - fadeMs * 2);

    const cycle = () => {
      if (cancelled) return;
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: fadeMs, useNativeDriver: true }),
        Animated.delay(holdMs),
        Animated.timing(opacity, { toValue: 0, duration: fadeMs, useNativeDriver: true }),
      ]).start(({ finished }) => {
        if (finished && !cancelled) {
          indexRef.current = (indexRef.current + 1) % pool.length;
          setLineIndex(indexRef.current);
          cycle();
        }
      });
    };

    cycle();
    return () => {
      cancelled = true;
      opacity.stopAnimation();
    };
  }, [pool, intervalMs, fadeMs]);

  return (
    <Animated.View style={[styles.container, { opacity }]}>
      <Text style={styles.text}>{pool[lineIndex] ?? ''}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  // Fixed slot: height never depends on the phrase — no jumps between lines
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    minHeight: 56,
  },
  // Guidance role (design spec): readable over the brightest canvas zone.
  // Local text shadow only — full-screen scrims are forbidden by the product bible.
  text: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 16,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: 26,
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 8,
  },
});
