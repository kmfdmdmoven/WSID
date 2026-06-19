import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { ScreenContainer } from '../components/ScreenContainer';
import { PrimaryButton } from '../components/PrimaryButton';
import { colors } from '../constants/colors';
import { track } from '../services/analytics';
import { continueAsGuest } from '../services/auth';
import type { RootStackParamList } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Auth'>;

export function AuthScreen({ navigation }: Props) {
  const { t } = useTranslation();

  const handleGuest = async () => {
    await continueAsGuest();
    track('auth_guest_completed');
    navigation.navigate('Question');
  };

  return (
    <ScreenContainer neuralMode="thinking">
      <View style={styles.body}>
        <Text style={styles.title}>{t('auth.title')}</Text>
        <Text style={styles.subtitle}>{t('auth.subtitle')}</Text>
      </View>

      <PrimaryButton label={t('auth.guest')} onPress={handleGuest} />
      <PrimaryButton
        label={t('auth.apple')}
        variant="secondary"
        disabled
        onPress={() => undefined}
        style={styles.button}
      />
      <PrimaryButton
        label={t('auth.google')}
        variant="secondary"
        disabled
        onPress={() => undefined}
        style={styles.button}
      />
      <PrimaryButton
        label={t('auth.email')}
        variant="ghost"
        disabled
        onPress={() => undefined}
        style={styles.button}
      />
      <Text style={styles.hint}>{t('auth.disabledHint')}</Text>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
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
  },
  button: {
    marginTop: 12,
  },
  hint: {
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 16,
    fontSize: 14,
  },
});
