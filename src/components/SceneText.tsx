import React, { useEffect, useMemo, useRef } from 'react';
import { AccessibilityInfo, Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { colors } from '../constants/colors';

// Design-spec reveal cadence (type.html "two roles on one frame"):
// overline 0ms -> heading +240ms -> body +900ms (38ms/word)
// -> guidance +2600ms (85ms/word) -> caption +4100ms (22ms/word).
// Word: opacity 0->1, y 6->0, 550ms cubic-bezier(0.22,1,0.36,1).
// Slots are fixed — text only ever changes opacity, never layout.
const WORD_EASE = Easing.bezier(0.22, 1, 0.36, 1);
const CADENCE = {
  headingDelay: 240,
  bodyStart: 900, bodyStep: 38,
  guidanceStart: 2600, guidanceStep: 85,
  captionStart: 4100, captionStep: 22,
};

export interface SceneTextProps {
  overline?: string;
  heading?: string;
  lines?: string[];        // body: 16/400, white 92%
  guidance?: string;       // ritual guidance: 16/400 italic, white 72%
  caption?: string;        // UI caption: 13/400 textSecondary
  headingSize?: number;
  align?: 'center' | 'left';
  delay?: number;          // shifts the whole cadence
  cadence?: number;        // legacy prop — cadence is now fixed per design spec
}

function WordReveal({ text, start, step, style, align, reduceMotion }: {
  text: string;
  start: number;
  step: number;
  style: object;
  align: 'center' | 'left';
  reduceMotion: boolean;
}) {
  const words = useMemo(() => text.split(/\s+/).filter(Boolean), [text]);
  const anims = useMemo(
    () => words.map(() => new Animated.Value(reduceMotion ? 1 : 0)),
    [words, reduceMotion],
  );

  useEffect(() => {
    if (reduceMotion) return;
    const seq = words.map((_, i) =>
      Animated.timing(anims[i], {
        toValue: 1,
        duration: 550,
        delay: start + i * step,
        easing: WORD_EASE,
        useNativeDriver: true,
      }),
    );
    const anim = Animated.parallel(seq);
    anim.start();
    return () => anim.stop();
  }, [anims]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Text style={[style, { textAlign: align }]}>
      {words.map((w, i) => (
        <Animated.Text
          key={i}
          style={{
            opacity: anims[i],
            transform: [{
              translateY: anims[i].interpolate({ inputRange: [0, 1], outputRange: [6, 0] }),
            }],
          }}
        >
          {w}{i < words.length - 1 ? ' ' : ''}
        </Animated.Text>
      ))}
    </Text>
  );
}

export function SceneText({
  overline,
  heading,
  lines = [],
  guidance,
  caption,
  headingSize = 28,
  align = 'center',
  delay = 0,
}: SceneTextProps) {
  const overlineAnim = useRef(new Animated.Value(0)).current;
  const headingAnim  = useRef(new Animated.Value(0)).current;
  const reduceMotionRef = useRef(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then((v) => { reduceMotionRef.current = v; });
    Animated.parallel([
      Animated.timing(overlineAnim, {
        toValue: 1, duration: 500, delay, easing: Easing.out(Easing.ease), useNativeDriver: true,
      }),
      Animated.timing(headingAnim, {
        toValue: 1, duration: 600, delay: delay + CADENCE.headingDelay,
        easing: WORD_EASE, useNativeDriver: true,
      }),
    ]).start();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const lineIn = (anim: Animated.Value) => ({
    opacity: anim,
    transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }],
  });

  const body = lines.join(' ');

  return (
    <View style={styles.root}>
      {/* overline slot — minHeight keeps position independent of heading/body */}
      <Animated.View style={[styles.overlineSlot, lineIn(overlineAnim)]}>
        <Text style={[styles.overline, { textAlign: align }]}>{overline ?? ''}</Text>
      </Animated.View>

      {/* heading slot — position never depends on body length */}
      <Animated.View style={[styles.headingSlot, lineIn(headingAnim)]}>
        <Text
          style={[styles.heading, { fontSize: headingSize, textAlign: align }]}
          numberOfLines={3}
        >
          {heading ?? ''}
        </Text>
      </Animated.View>

      {/* body slot — changes here never shift heading */}
      <View style={styles.bodySlot}>
        {body ? (
          <WordReveal
            text={body}
            start={delay + CADENCE.bodyStart}
            step={CADENCE.bodyStep}
            style={styles.line}
            align={align}
            reduceMotion={reduceMotionRef.current}
          />
        ) : null}
        {guidance ? (
          <WordReveal
            text={guidance}
            start={delay + CADENCE.guidanceStart}
            step={CADENCE.guidanceStep}
            style={styles.guidance}
            align={align}
            reduceMotion={reduceMotionRef.current}
          />
        ) : null}
        {caption ? (
          <WordReveal
            text={caption}
            start={delay + CADENCE.captionStart}
            step={CADENCE.captionStep}
            style={styles.caption}
            align={align}
            reduceMotion={reduceMotionRef.current}
          />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    width: '100%',
  },
  overlineSlot: {
    width: '100%',
    minHeight: 22,
    justifyContent: 'center',
    marginBottom: 2,
  },
  headingSlot: {
    width: '100%',
    minHeight: 48,
    justifyContent: 'center',
    marginBottom: 2,
  },
  bodySlot: {
    width: '100%',
    minHeight: 54,
    justifyContent: 'flex-start',
    paddingTop: 4,
  },
  overline: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 1.8,
  },
  heading: {
    color: colors.textPrimary,
    fontWeight: '600',
    lineHeight: 36,
  },
  line: {
    color: 'rgba(255,255,255,0.92)',
    fontSize: 16,
    lineHeight: 26,
  },
  guidance: {
    color: 'rgba(255,255,255,0.72)',
    fontSize: 16,
    lineHeight: 26,
    fontStyle: 'italic',
    marginTop: 12,
  },
  caption: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 20,
    marginTop: 12,
  },
});
