import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useState,
} from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  interpolateColor,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { colors } from '../constants/colors';

export interface ThoughtObjectHandle {
  flipTo: (newText: string, newLabel?: string) => void;
  amplifyGlow: () => void;
}

export interface ThoughtObjectProps {
  text: string;
  label?: string;
  variant: 'question' | 'option' | 'answer';
  mood?: number;
  breathing?: boolean;
}


const FONT_SIZE: Record<ThoughtObjectProps['variant'], number> = {
  answer:   28,
  option:   22,
  question: 18,
};

export const ThoughtObject = forwardRef<ThoughtObjectHandle, ThoughtObjectProps>(
  function ThoughtObject({ text: initText, label: initLabel, variant, breathing }, ref) {
    const [displayText,  setDisplayText]  = useState(initText);
    const [displayLabel, setDisplayLabel] = useState(initLabel);

    // Sync from prop when parent resets (e.g. new session, different key)
    useEffect(() => { setDisplayText(initText); },  [initText]);
    useEffect(() => { setDisplayLabel(initLabel); }, [initLabel]);

    const shouldBreathe = breathing ?? variant === 'answer';

    const scale   = useSharedValue(variant === 'answer' ? 0.97 : 1.0);
    const driftX  = useSharedValue(0);
    const driftY  = useSharedValue(0);
    const glowOp  = useSharedValue(variant === 'answer' ? 0.08 : 0.0);
    const rotateY = useSharedValue(0);
    // answer variant: living gold border that breathes (prototype "border draw")
    const borderPulse = useSharedValue(0);
    const isGold = variant === 'answer';

    useEffect(() => {
      if (!isGold) return;
      borderPulse.value = withRepeat(
        withSequence(
          withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
          withTiming(0, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        false,
      );
    }, [isGold]);

    useEffect(() => {
      if (!shouldBreathe) return;

      scale.value = withRepeat(
        withSequence(
          withTiming(1.01, { duration: 2800, easing: Easing.inOut(Easing.sin) }),
          withTiming(0.99, { duration: 2400, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        false,
      );
      driftX.value = withRepeat(
        withSequence(
          withTiming( 3, { duration: 3100, easing: Easing.inOut(Easing.sin) }),
          withTiming(-3, { duration: 2900, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        true,
      );
      driftY.value = withRepeat(
        withSequence(
          withTiming(-2, { duration: 3500, easing: Easing.inOut(Easing.sin) }),
          withTiming( 2, { duration: 3000, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        true,
      );
      glowOp.value = withRepeat(
        withSequence(
          withTiming(0.10, { duration: 2800, easing: Easing.inOut(Easing.sin) }),
          withTiming(0.03, { duration: 2400, easing: Easing.inOut(Easing.sin) }),
        ),
        -1,
        false,
      );
    }, [shouldBreathe]);

    useImperativeHandle(ref, () => ({
      flipTo(newText: string, newLabel?: string) {
        const swap = (t: string, l?: string) => {
          setDisplayText(t);
          if (l !== undefined) setDisplayLabel(l);
        };
        rotateY.value = withTiming(
          90,
          { duration: 240, easing: Easing.in(Easing.quad) },
          (finished) => {
            if (finished) {
              runOnJS(swap)(newText, newLabel);
              rotateY.value = withTiming(0, { duration: 240, easing: Easing.out(Easing.quad) });
            }
          },
        );
      },
      amplifyGlow() {
        glowOp.value = withRepeat(
          withSequence(
            withTiming(0.16, { duration: 1800, easing: Easing.inOut(Easing.sin) }),
            withTiming(0.05, { duration: 1600, easing: Easing.inOut(Easing.sin) }),
          ),
          -1,
          false,
        );
      },
    }));

    const cardStyle = useAnimatedStyle(() => ({
      ...(isGold
        ? {
            borderColor: interpolateColor(
              borderPulse.value,
              [0, 1],
              ['rgba(234,179,8,0.28)', 'rgba(234,179,8,0.7)'],
            ),
          }
        : {}),
      transform: [
        { rotateY: `${rotateY.value}deg` },
        { scale:      scale.value },
        { translateX: driftX.value },
        { translateY: driftY.value },
      ],
    }));

    const bloomStyle = useAnimatedStyle(() => ({ opacity: glowOp.value }));

    return (
      <View style={styles.outer}>
        {/* Soft gold halo — concentric circles fake a radial falloff so there's
            no boxy edge and no per-frame native shadow. */}
        <Animated.View style={[styles.bloomWrap, bloomStyle]} pointerEvents="none">
          <View style={styles.bloomOuter} />
          <View style={styles.bloomMid} />
          <View style={styles.bloomInner} />
        </Animated.View>
        {/* Wrapper gives 3D perspective for the rotateY flip */}
        <View style={styles.perspectiveWrap}>
          <Animated.View style={[styles.card, isGold && styles.cardGold, cardStyle]}>
            {displayLabel ? <Text style={styles.label}>{displayLabel}</Text> : null}
            <Text
              style={[
                styles.text,
                { fontSize: FONT_SIZE[variant] },
                variant === 'answer' && { color: colors.textPrimary },
              ]}
              numberOfLines={2}
              adjustsFontSizeToFit
              minimumFontScale={0.65}
            >
              {displayText}
            </Text>
          </Animated.View>
        </View>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  outer: {
    alignItems: 'center',
    maxWidth: 320,
    width: '100%',
  },
  perspectiveWrap: {
    width: '100%',
    transform: [{ perspective: 900 }],
  },
  bloomWrap: {
    position: 'absolute',
    top: -64,
    bottom: -64,
    left: -64,
    right: -64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bloomOuter: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 9999,
    backgroundColor: 'rgba(234,179,8,0.035)',
  },
  bloomMid: {
    position: 'absolute',
    width: '74%',
    height: '74%',
    borderRadius: 9999,
    backgroundColor: 'rgba(234,179,8,0.05)',
  },
  bloomInner: {
    position: 'absolute',
    width: '48%',
    height: '48%',
    borderRadius: 9999,
    backgroundColor: 'rgba(234,179,8,0.07)',
  },
  card: {
    backgroundColor: colors.cardBackground,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: 24,
    paddingHorizontal: 36,
    paddingVertical: 32,
    alignItems: 'center',
    width: '100%',
  },
  // answer variant: gold-tinted card with breathing gold border (prototype).
  // No native shadow here — a large blurred shadow on a continuously
  // scaling/drifting view re-rasterizes every frame (visible stutter). The
  // gold aura comes from the animated `bloom` view behind the card instead.
  cardGold: {
    backgroundColor: 'rgba(234,179,8,0.06)',
  },
  label: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 12,
  },
  text: {
    color: colors.textPrimary,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 36,
  },
});
