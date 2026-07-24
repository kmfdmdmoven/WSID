import React, { useEffect } from 'react';
import { Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { lightImpact } from '../services/haptics';
import { colors } from '../constants/colors';
import { ripple } from '../services/neuralFx';

export interface ReactionOrbProps {
  emoji: string;
  rgb: string; // ring color "r,g,b"
  label: string;
  delay: number;
  dimmed?: boolean;
  selected?: boolean;
  onPress: () => void;
}

const ORB_BASE = 54;
const ORB_SELECTED = 66;
const EMOJI_BASE = 32;
const EMOJI_SELECTED = 40;
const ENTRANCE_DURATION = 300;

export function ReactionOrb({ emoji, rgb, label, delay, dimmed = false, selected = false, onPress }: ReactionOrbProps) {
  const staggerMs = delay * 90;

  const entScale  = useSharedValue(0.82);
  const entOp     = useSharedValue(0.0);
  const floatY    = useSharedValue(0);
  const pressScale = useSharedValue(1.0);
  const dimOp     = useSharedValue(1.0);
  const selectSV  = useSharedValue(0); // 0 → base, 1 → selected (size/glow)

  useEffect(() => {
    entOp.value = withDelay(staggerMs, withTiming(1.0, { duration: ENTRANCE_DURATION }));
    entScale.value = withDelay(
      staggerMs,
      withTiming(1.0, { duration: ENTRANCE_DURATION, easing: Easing.out(Easing.back(1.05)) }),
    );
    // Idle float — each orb drifts on its own phase (design: floatY, staggered)
    const floatDur = 2600 + delay * 300;
    floatY.value = withDelay(
      staggerMs + ENTRANCE_DURATION,
      withRepeat(
        withSequence(
          withTiming(-8, { duration: floatDur, easing: Easing.inOut(Easing.sin) }),
          withTiming(0,  { duration: floatDur, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        false,
      ),
    );
  }, []);

  useEffect(() => {
    dimOp.value = withTiming(dimmed ? 0.4 : 1.0, { duration: 300 });
  }, [dimmed]);

  useEffect(() => {
    selectSV.value = withSpring(selected ? 1 : 0, { damping: 12, stiffness: 180 });
  }, [selected]);

  const handlePressIn = () => {
    // Physical bounce on touch-down (design: press 0.82 → spring back)
    pressScale.value = withSpring(0.82, { damping: 20, stiffness: 500 });
  };

  const handlePress = () => {
    pressScale.value = withSequence(
      withSpring(1.06, { damping: 12, stiffness: 200 }),
      withSpring(1.0,  { damping: 15, stiffness: 300 }),
    );
    lightImpact();
    setTimeout(onPress, 280);
  };

  const wrapStyle = useAnimatedStyle(() => ({
    opacity: entOp.value * dimOp.value,
    transform: [
      { translateY: floatY.value },
      { scale: entScale.value * pressScale.value },
    ],
  }));

  const orbStyle = useAnimatedStyle(() => {
    const size = ORB_BASE + (ORB_SELECTED - ORB_BASE) * selectSV.value;
    return {
      width: size,
      height: size,
      borderRadius: size / 2,
      backgroundColor: `rgba(${rgb},0.13)`,
      borderColor: `rgba(${rgb},${0.45 + 0.45 * selectSV.value})`,
      shadowColor: `rgb(${rgb})`,
      shadowOpacity: 0.45 + 0.45 * selectSV.value,
      shadowRadius: 12 + 20 * selectSV.value,
      transform: [{ scale: 1 + 0.06 * selectSV.value }],
    };
  });

  const emojiStyle = useAnimatedStyle(() => ({
    fontSize: EMOJI_BASE + (EMOJI_SELECTED - EMOJI_BASE) * selectSV.value,
  }));

  const labelStyle = useAnimatedStyle(() => ({
    color: selectSV.value > 0.5 ? colors.textPrimary : colors.buttonSecondaryText,
  }));

  return (
    <Pressable
      onPressIn={(e) => {
        const { width, height } = Dimensions.get('window');
        ripple(e.nativeEvent.pageX / width, e.nativeEvent.pageY / height);
        handlePressIn();
      }}
      onPress={handlePress}
      style={styles.pressable}
    >
      <Animated.View style={[styles.wrap, wrapStyle]}>
        <Animated.View style={[styles.orb, orbStyle]}>
          <Animated.Text style={emojiStyle}>{emoji}</Animated.Text>
        </Animated.View>
        <Animated.Text style={[styles.label, labelStyle]}>{label}</Animated.Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressable: {
    flex: 1,
    alignItems: 'center',
  },
  wrap: {
    alignItems: 'center',
  },
  orb: {
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 0 },
  },
  label: {
    fontSize: 13.5,
    fontWeight: '500',
    textAlign: 'center',
    marginTop: 11,
    lineHeight: 18,
  },
});
