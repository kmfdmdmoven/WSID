import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { ScreenContainer } from '../components/ScreenContainer';
import { PrimaryButton } from '../components/PrimaryButton';
import { colors } from '../constants/colors';
import { track } from '../services/analytics';
import { saveEarlyAccessEmail } from '../services/storage';
import type { RootStackParamList } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'EarlyAccess'>;

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function EarlyAccessScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    const trimmed = email.trim();
    if (!isValidEmail(trimmed)) {
      setError(t('earlyAccess.invalidEmail'));
      return;
    }

    setLoading(true);
    setError('');
    await saveEarlyAccessEmail(trimmed);
    track('early_access_submitted', { email: trimmed });
    setSuccess(true);
    setLoading(false);
  };

  return (
    <ScreenContainer neuralMode="idle">
      <Pressable onPress={() => navigation.goBack()} style={styles.back}>
        <Text style={styles.backText}>{t('common.back')}</Text>
      </Pressable>

      <View style={styles.body}>
        <Text style={styles.title}>{t('earlyAccess.title')}</Text>
        <Text style={styles.subtitle}>{t('earlyAccess.subtitle')}</Text>

        <TextInput
          value={email}
          onChangeText={setEmail}
          placeholder={t('earlyAccess.emailPlaceholder')}
          placeholderTextColor={colors.textMuted}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          style={styles.input}
          selectionColor={colors.accentGold}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}
        {success ? <Text style={styles.success}>{t('earlyAccess.success')}</Text> : null}
      </View>

      <PrimaryButton
        label={t('common.submit')}
        onPress={handleSubmit}
        loading={loading}
        disabled={success}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  back: {
    marginBottom: 16,
  },
  backText: {
    color: colors.textSecondary,
    fontSize: 16,
  },
  body: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    color: colors.textPrimary,
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 12,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 24,
  },
  input: {
    backgroundColor: colors.cardBackground,
    borderColor: colors.cardBorder,
    borderWidth: 1,
    borderRadius: 16,
    color: colors.textPrimary,
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  error: {
    color: colors.error,
    marginTop: 12,
    fontSize: 14,
  },
  success: {
    color: colors.accentGold,
    marginTop: 12,
    fontSize: 14,
  },
});
