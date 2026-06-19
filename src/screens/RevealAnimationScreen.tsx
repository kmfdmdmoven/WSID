import React, { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { ScreenContainer } from '../components/ScreenContainer';
import { ProgressiveReveal } from '../components/ProgressiveReveal';
import { GuidedReflection } from '../components/GuidedReflection';
import { pickReflectionLines } from '../constants/reflectionPool';
import { useNeural } from '../context/NeuralContext';
import { colors } from '../constants/colors';
import { track } from '../services/analytics';
import { lightImpact, selectionChanged, successNotification } from '../services/haptics';
import { playRevealStart, playRevealConverge, playRevealResult } from '../services/sound';
import type { NeuralMode, RootStackParamList } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'RevealAnimation'>;

// Stage timings (ms from mount)
// Stage 1 – idle:       0    → 600   calm ambient drift
// Stage 2 – activating: 600  → 1600  nodes brighten, connections pulse
// Stage 3 – converging: 1600 → 2400  pull to center, bright layer
// Stage 4 – result:     2400 → 16000 center glow, reflection lines cycle (3×5s), calm
// Navigate: 16000

const T_ACTIVATING = 600;
const T_CONVERGING = 1600;
const T_RESULT = 2400;
const T_NAVIGATE = 16000;

type Stage = 'idle' | 'activating' | 'converging' | 'result';

const STAGE_MODE: Record<Stage, NeuralMode> = {
  idle: 'idle',
  activating: 'activating',
  converging: 'converging',
  result: 'result',
};

export function RevealAnimationScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const { setNeuralMode } = useNeural();
  const [stage, setStage] = useState<Stage>('idle');

  // Picked once per mount — stable across re-renders, resets on screen refocus
  const reflectionLines = useRef(pickReflectionLines());

  useFocusEffect(useCallback(() => {
    setNeuralMode('idle', 1.1);
    setStage('idle');
    reflectionLines.current = pickReflectionLines(); // fresh pick each visit
  }, [setNeuralMode]));

  useEffect(() => {
    setNeuralMode(STAGE_MODE[stage], 1.1);
  }, [stage, setNeuralMode]);

  useEffect(() => {
    lightImpact();
    playRevealStart();

    const t1 = setTimeout(() => {
      setStage('activating');
      lightImpact();
      playRevealConverge();
    }, T_ACTIVATING);

    const t2 = setTimeout(() => {
      setStage('converging');
      selectionChanged();
    }, T_CONVERGING);

    const t3 = setTimeout(() => {
      setStage('result');
      successNotification();
      playRevealResult();
    }, T_RESULT);

    const t4 = setTimeout(() => {
      track('reveal_completed');
      navigation.replace('Result');
    }, T_NAVIGATE);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [navigation]);

  return (
    <ScreenContainer>
      <View style={styles.overlay}>
        {stage !== 'idle' && (
          <ProgressiveReveal key="title" delay={0} cadence={0}>
            <Text style={styles.title}>{t('reveal.title')}</Text>
          </ProgressiveReveal>
        )}
        <GuidedReflection
          active={stage !== 'idle'}
          lines={reflectionLines.current}
          lineDuration={5000}
          fadeMs={600}
        />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 22,
    fontWeight: '600',
    textAlign: 'center',
  },
});
