import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenContainer } from '../components/ScreenContainer';
import { SceneText } from '../components/SceneText';
import { AmbientTextStream } from '../components/AmbientTextStream';
import { selectPool } from '../utils/phraseSelector';
import { useNeural } from '../context/NeuralContext';
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
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { setNeuralMode } = useNeural();
  const [stage, setStage] = useState<Stage>('idle');

  useFocusEffect(useCallback(() => {
    setNeuralMode('idle', 1.1);
    setStage('idle');
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
          <SceneText
            key="reveal-title"
            heading={t('reveal.title')}
            headingSize={22}
            delay={0}
          />
        )}
      </View>
      {stage !== 'idle' && (
        <View style={[styles.streamSlot, { bottom: insets.bottom + 96 }]}>
          <AmbientTextStream
            pool={selectPool('priming')}
            intervalMs={5000}
            fadeMs={600}
          />
        </View>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  streamSlot: {
    position: 'absolute',
    left: 0,
    right: 0,
  },
  overlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
});
