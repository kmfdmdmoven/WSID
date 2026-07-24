import React, { Children, useEffect, useRef } from 'react';
import { AccessibilityInfo, Animated, Easing } from 'react-native';

interface Props {
  children: React.ReactNode;
  cadence?: number; // ms between each child appearing
  delay?: number;   // ms before the first child
}

export function ProgressiveReveal({ children, cadence = 350, delay = 0 }: Props) {
  const childArray = Children.toArray(children);
  const count = childArray.length;

  const opacities = useRef(
    Array.from({ length: count }, () => new Animated.Value(0))
  ).current;

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then((reduced) => {
      if (reduced) {
        opacities.forEach((op) => op.setValue(1));
        return;
      }

      opacities.forEach((opacity, i) => {
        Animated.timing(opacity, {
          toValue: 1,
          duration: 700,
          delay: delay + i * cadence,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }).start();
      });
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      {childArray.map((child, i) => (
        <Animated.View key={i} style={{ opacity: opacities[i] }}>
          {child}
        </Animated.View>
      ))}
    </>
  );
}
