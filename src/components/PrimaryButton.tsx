import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { colors } from '../constants/colors';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';

interface PrimaryButtonProps {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  soonLabel?: string; // shows a small tag when disabled (e.g. "Незабаром")
  icon?: React.ComponentProps<typeof Feather>['name'];
  style?: ViewStyle;
}

export function PrimaryButton({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  soonLabel,
  icon,
  style,
}: PrimaryButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        isDisabled        ? styles.disabled
          : variant === 'primary'   ? styles.primary
          : variant === 'secondary' ? styles.secondary
          : styles.ghost,
        pressed && !isDisabled && styles.pressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={colors.buttonPrimaryGoldText} />
      ) : (
        <View style={styles.row}>
          {icon ? (
            <Feather
              name={icon}
              size={18}
              color={
                isDisabled        ? colors.disabledText
                  : variant === 'primary'   ? colors.buttonPrimaryGoldText
                  : variant === 'secondary' ? colors.buttonSecondaryText
                  : colors.buttonGhostGoldText
              }
              style={styles.iconLeft}
            />
          ) : null}
          <Text
            style={[
              styles.label,
              isDisabled        ? styles.disabledLabel
                : variant === 'primary'   ? styles.primaryLabel
                : variant === 'secondary' ? styles.secondaryLabel
                : styles.ghostLabel,
            ]}
          >
            {label}
          </Text>
          {isDisabled && soonLabel ? (
            <View style={styles.soonBadge}>
              <Text style={styles.soonText}>{soonLabel}</Text>
            </View>
          ) : null}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 56,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconLeft: {
    marginRight: 8,
  },
  primary: {
    backgroundColor: colors.buttonPrimaryBg,
    borderWidth: 1,
    borderColor: colors.buttonPrimaryBorder,
  },
  secondary: {
    backgroundColor: colors.buttonSecondaryBg,
    borderWidth: 1,
    borderColor: colors.buttonSecondaryBorder,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  disabled: {
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  pressed: {
    opacity: 0.85,
  },
  label: {
    fontSize: 17,
    fontWeight: '500',
  },
  primaryLabel: {
    color: colors.buttonPrimaryGoldText,
  },
  secondaryLabel: {
    color: colors.buttonSecondaryText,
  },
  ghostLabel: {
    color: colors.buttonGhostGoldText,
  },
  disabledLabel: {
    color: colors.disabledText,
  },
  soonBadge: {
    marginLeft: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  soonText: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
});
