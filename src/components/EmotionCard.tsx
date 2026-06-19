import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { colors } from '../constants/colors';

interface EmotionCardProps {
  emoji: string;
  label: string;
  onPress: () => void;
}

export function EmotionCard({ emoji, label, onPress }: EmotionCardProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <Text style={styles.emoji}>{emoji}</Text>
      <Text style={styles.label}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minHeight: 120,
    backgroundColor: colors.cardBackground,
    borderColor: colors.cardBorder,
    borderWidth: 1,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    margin: 6,
  },
  pressed: {
    borderColor: colors.accentGold,
    backgroundColor: 'rgba(234, 179, 8, 0.08)',
  },
  emoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  label: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
});
