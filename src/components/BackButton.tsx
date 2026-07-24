import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors } from '../constants/colors';

interface BackButtonProps {
  onPress: () => void;
}

// Apple-style canvas back control: round substrate, icon only, no label.
// hitSlop pads the 40x40 visual up to the 44pt minimum tap target.
export function BackButton({ onPress }: BackButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Back"
      onPress={onPress}
      hitSlop={4}
      style={({ pressed }) => [styles.circle, pressed && styles.pressed]}
    >
      <Feather name="chevron-left" size={22} color={colors.textPrimary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  circle: {
    width: 40,
    height: 40,
    borderRadius: 999,
    backgroundColor: colors.cardBackground,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    borderColor: colors.accentGold,
  },
});
