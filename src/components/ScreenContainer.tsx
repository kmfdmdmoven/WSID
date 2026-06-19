import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface ScreenContainerProps {
  children: React.ReactNode;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
}

export function ScreenContainer({ children, style, contentStyle }: ScreenContainerProps) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Wait 2 frames for React layout to fully complete before revealing content.
    // Without this, text reflows mid-animation and the user sees "jump" renders.
    let raf1: ReturnType<typeof requestAnimationFrame>;
    let raf2: ReturnType<typeof requestAnimationFrame>;

    raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        Animated.timing(opacity, {
          toValue: 1,
          duration: 280,
          useNativeDriver: true,
        }).start();
      });
    });

    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
      opacity.setValue(0);
    };
  }, [opacity]);

  return (
    <SafeAreaView style={[styles.safeArea, style]}>
      <Animated.View style={[styles.content, contentStyle, { opacity }]}>
        {children}
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
});
