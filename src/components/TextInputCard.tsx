import React from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { colors } from '../constants/colors';

type DotColor = 'gold' | 'blue';

interface TextInputCardProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  dotColor?: DotColor;
  multiline?: boolean;
}

export function TextInputCard({
  label,
  value,
  onChangeText,
  placeholder,
  dotColor = 'gold',
  multiline = false,
}: TextInputCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.labelRow}>
        <View
          style={[
            styles.dot,
            dotColor === 'gold' ? styles.dotGold : styles.dotBlue,
          ]}
        />
        <Text style={styles.label}>{label}</Text>
      </View>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        multiline={multiline}
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
  dotGold: {
    backgroundColor: colors.accentGold,
  },
  dotBlue: {
    backgroundColor: colors.rationalBlue,
  },
  label: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '500',
  },
  input: {
    color: colors.textPrimary,
    fontSize: 18,
    fontWeight: '500',
    padding: 0,
  },
  inputMultiline: {
    minHeight: 56,
    textAlignVertical: 'top',
  },
});
