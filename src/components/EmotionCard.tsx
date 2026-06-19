import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors } from '../constants/colors';

interface EmotionCardProps {
  icon: string;
  label: string;
  onPress: () => void;
}

export function EmotionCard({ icon, label, onPress }: EmotionCardProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      {({ pressed }) => (
        <>
          <Feather
            name={icon as React.ComponentProps<typeof Feather>['name']}
            size={24}
            color={pressed ? colors.accentGold : colors.textSecondary}
            style={styles.icon}
          />
          <Text style={styles.label}>{label}</Text>
        </>
      )}
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
    backgroundColor: 'rgba(234,179,8,0.08)',
  },
  icon: {
    marginBottom: 10,
  },
  label: {
    color: colors.textPrimary,
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
});
