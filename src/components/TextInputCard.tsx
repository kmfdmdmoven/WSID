import React, { useRef, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { colors } from '../constants/colors';

type DotColor = 'gold' | 'blue' | 'violet';

interface TextInputCardProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  dotColor?: DotColor;
  multiline?: boolean;
  maxLength?: number;
  autoFocus?: boolean;
  dimmed?: boolean; // sibling card is focused — recede (options screen pattern)
  onFocus?: () => void;
  onBlur?: () => void;
}

const DOT_STYLE: Record<DotColor, { backgroundColor: string }> = {
  gold:   { backgroundColor: colors.accentGold },
  blue:   { backgroundColor: colors.rationalBlue },
  violet: { backgroundColor: colors.uncertaintyViolet },
};

export function TextInputCard({
  label,
  value,
  onChangeText,
  placeholder,
  dotColor = 'gold',
  multiline = false,
  maxLength,
  autoFocus = false,
  dimmed = false,
  onFocus,
  onBlur,
}: TextInputCardProps) {
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);

  return (
    <View
      style={[
        styles.card,
        focused && styles.cardFocused,
        dimmed && !focused && styles.cardDimmed,
      ]}
    >
      <View style={styles.labelRow}>
        <View style={[styles.dot, DOT_STYLE[dotColor]]} />
        <Text style={styles.label}>{label}</Text>
      </View>
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        multiline={multiline}
        maxLength={maxLength}
        autoFocus={autoFocus}
        onFocus={() => { setFocused(true); onFocus?.(); }}
        onBlur={() => { setFocused(false); onBlur?.(); }}
        style={[styles.input, multiline && styles.inputMultiline]}
        selectionColor={colors.accentGold}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.cardBackground,
    borderColor: colors.cardBorder,
    borderWidth: 1,
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
  },
  cardFocused: {
    borderColor: colors.buttonPrimaryBorder,
  },
  cardDimmed: {
    opacity: 0.6,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  label: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  input: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '400',
    padding: 0,
  },
  inputMultiline: {
    minHeight: 56,
    textAlignVertical: 'top',
  },
});
