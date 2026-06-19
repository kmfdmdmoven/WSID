import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { ScreenContainer } from '../components/ScreenContainer';
import { colors } from '../constants/colors';
import { track } from '../services/analytics';
import { lightImpact, selectionChanged, successNotification } from '../services/haptics';
import { playRevealStart, playRevealConverge, playRevealResult } from '../services/sound';
import type { NeuralMode, RootStackParamList } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'RevealAnimation'>;

// Stage timings (ms from mount)
// Stage 1 – idle:       0   → 500   calm ambient drift
// Stage 2 – activating: 500 → 1400  nodes brighten, connections pulse
// Stage 3 – converging: 1400→ 2100  pull to center, bright layer
// Stage 4 – result:     2100→ 2500  center glow, calm
// Navigate: 2500

const T_ACTIVATING = 500;
const T_CONVERGING = 1400;
const T_RESULT = 2100;
const T_NAVIGATE = 2500;

type Stage = 'idle' | 'activating' | 'converging' | 'result';

const STAGE_MODE: Record<Stage, NeuralMode> = {
  idle: 'idle',
  activating: 'activating',
  converging: 'converging',
  result: 'result',
};

export function RevealAnimationScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const [stage, setStage] = useState<Stage>('idle');

  useEffect(() => {
    // Kick off immediately: reveal start haptic + sound
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
    <ScreenContainer neuralMode={STAGE_MODE[stage]} neuralIntensity={1.1} showNeural>
      <View style={styles.overlay}>
        <Text style={styles.subtitle}>{t('reveal.subtitle')}</Text>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: colors.textPrimary,
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 16,
    textAlign: 'center',
  },
});
