import React, { Children, useEffect, useRef } from 'react';
import { AccessibilityInfo, Animated } from 'react-native';

interface Props {
  children: React.ReactNode;
  cadence?: number; // ms between each child appearing
  delay?: number;   // ms before the first child
}

export function ProgressiveReveal({ children, cadence = 350, delay = 0 }: Props) {
  const childArray = Children.toArray(children);
  const count = childArray.length;

  const animations = useRef(
    Array.from({ length: count }, () => ({
      opacity: new Animated.Value(0),
      translateY: new Animated.Value(10),
    }))
  ).current;

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then((reduced) => {
      if (reduced) {
        animations.forEach(({ opacity, translateY }) => {
          opacity.setValue(1);
          translateY.setValue(0);
        });
        return;
      }

      animations.forEach(({ opacity, translateY }, i) => {
        const startDelay = delay + i * cadence;
        Animated.parallel([
          Animated.timing(opacity, {
            toValue: 1,
            duration: 300,
            delay: startDelay,
            useNativeDriver: true,
          }),
          Animated.timing(translateY, {
            toValue: 0,
            duration: 300,
            delay: startDelay,
            useNativeDriver: true,
          }),
        ]).start();
      });
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <>
      {childArray.map((child, i) => (
        <Animated.View
          key={i}
          style={{
            opacity: animations[i].opacity,
            transform: [{ translateY: animations[i].translateY }],
          }}
        >
          {child}
        </Animated.View>
      ))}
    </>
  );
}
