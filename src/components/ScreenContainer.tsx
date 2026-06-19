import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../constants/colors';
import type { NeuralMode } from '../types';
import { NeuralThoughtNetwork } from './NeuralThoughtNetwork';

interface ScreenContainerProps {
  children: React.ReactNode;
  neuralMode?: NeuralMode;
  showNeural?: boolean;
  neuralIntensity?: number;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
}

export function ScreenContainer({
  children,
  neuralMode = 'idle',
  showNeural = true,
  neuralIntensity = 1,
  style,
  contentStyle,
}: ScreenContainerProps) {
  return (
    <SafeAreaView style={[styles.safeArea, style]}>
      {showNeural ? (
        <NeuralThoughtNetwork mode={neuralMode} intensity={neuralIntensity} style={styles.neural} />
      ) : null}
      <View style={[styles.content, contentStyle]}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  neural: {
    ...StyleSheet.absoluteFill,
    zIndex: 0,
    opacity: 0.9,
  },
  content: {
    flex: 1,
    zIndex: 1,
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
});
