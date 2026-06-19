import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { ScreenContainer } from '../components/ScreenContainer';
import { EmotionCard } from '../components/EmotionCard';
import { ProgressiveReveal } from '../components/ProgressiveReveal';
import { EMOTIONS, isPositiveEmotion } from '../constants/emotions';
import { useNeural } from '../context/NeuralContext';
import { colors } from '../constants/colors';
import { useDecision } from '../context/DecisionContext';
import { track } from '../services/analytics';
import { lightImpact } from '../services/haptics';
import { playEmotionTap } from '../services/sound';
import type { Emotion, RootStackParamList } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Result'>;

// Pause durations before navigation — gives the network time to visually react
// Positive: 1.8s — gold settles, user registers warmth before text
// Negative: 3.5s — burgundy fully spreads (matches 2.8s transitionDuration + 0.7s buffer)
const POSITIVE_PAUSE_MS = 1800;
const NEGATIVE_PAUSE_MS = 3500;

// Anchor appears 800ms after focus — after the screen fades in (~280ms), user reads the
// result text, then anchor fades in as a separate reveal beat (design-system §11)
const ANCHOR_DELAY_MS = 800;

export function ResultScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const { session, setEmotion } = useDecision();
  const { setNeuralMode } = useNeural();
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [anchorVisible, setAnchorVisible] = useState(false);

  useFocusEffect(useCallback(() => {
    setNeuralMode('result');
    setIsTransitioning(false);
    setAnchorVisible(false);

    const timer = setTimeout(() => setAnchorVisible(true), ANCHOR_DELAY_MS);
    return () => clearTimeout(timer);
  }, [setNeuralMode]));

  useEffect(() => {
    track('result_shown', { selectedOption: session.selectedOption });
  }, [session.selectedOption]);

  const handleEmotion = async (emotion: Emotion) => {
    if (isTransitioning) return;
    setIsTransitioning(true);

    // 1. Immediately shift the network palette to reflect the emotional reaction
    const positive = isPositiveEmotion(emotion);
    setNeuralMode(positive ? 'emotionPositive' : 'emotionNegative');

    // 2. Haptic + sound fire immediately
    lightImpact();
    playEmotionTap();

    // 3. Let the animation play — user sees the network react BEFORE any text
    const pause = positive ? POSITIVE_PAUSE_MS : NEGATIVE_PAUSE_MS;
    await new Promise<void>((resolve) => setTimeout(resolve, pause));

    // 4. Commit state and navigate
    setEmotion(emotion);
    track('emotion_selected', { emotion });
    navigation.navigate('Insight');
  };

  return (
    <ScreenContainer>
      <View style={styles.reveal}>
        <Text style={styles.label}>{t('result.label')}</Text>
        <Text style={styles.result}>{session.selectedOption}</Text>
        <Text style={styles.subtitle}>{t('result.subtitle')}</Text>

        {anchorVisible && (
          <ProgressiveReveal key="anchor" delay={0} cadence={0}>
            <Text style={styles.anchor}>{t('result.anchor')}</Text>
          </ProgressiveReveal>
        )}
      </View>

      <View
        style={[styles.emotionSection, isTransitioning && styles.locked]}
        pointerEvents={isTransitioning ? 'none' : 'auto'}
      >
        <Text style={styles.emotionTitle}>{t('emotion.title')}</Text>
        <Text style={styles.emotionHelper}>{t('emotion.helper')}</Text>
        <View style={styles.emotionRow}>
          {EMOTIONS.slice(0, 2).map((emotion) => (
            <EmotionCard
              key={emotion.id}
              icon={emotion.icon}
              label={t(emotion.labelKey)}
              onPress={() => handleEmotion(emotion.id)}
            />
          ))}
        </View>
        <View style={styles.emotionRow}>
          {EMOTIONS.slice(2).map((emotion) => (
            <EmotionCard
              key={emotion.id}
              icon={emotion.icon}
              label={t(emotion.labelKey)}
              onPress={() => handleEmotion(emotion.id)}
            />
          ))}
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  reveal: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  label: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 16,
  },
  result: {
    color: colors.textPrimary,
    fontSize: 32,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitle: {
    color: colors.textMuted,
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 16,
  },
  anchor: {
    color: colors.buttonPrimaryGoldText,
    fontSize: 19,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 28,
    fontWeight: '400',
    lineHeight: 28,
  },
  emotionSection: {
    paddingBottom: 8,
  },
  locked: {
    opacity: 0.4,
  },
  emotionTitle: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 6,
  },
  emotionHelper: {
    color: colors.textSecondary,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  emotionRow: {
    flexDirection: 'row',
  },
});
