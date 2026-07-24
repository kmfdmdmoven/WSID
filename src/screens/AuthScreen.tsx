import React, { useCallback } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { ScreenContainer } from '../components/ScreenContainer';
import { SceneText } from '../components/SceneText';
import { useNeural } from '../context/NeuralContext';
import { PrimaryButton } from '../components/PrimaryButton';
import { colors } from '../constants/colors';
import { track } from '../services/analytics';
import { continueAsGuest } from '../services/auth';
import type { RootStackParamList } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Auth'>;

export function AuthScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const { setNeuralMode } = useNeural();

  useFocusEffect(useCallback(() => { setNeuralMode('thinking'); }, [setNeuralMode]));

  const handleGuest = async () => {
    const result = await continueAsGuest();
    if (!result.ok) {
      track('auth_guest_failed', { errorCategory: result.error.errorCategory });
      return;
    }
    track('auth_guest_completed');
    navigation.navigate('Question');
  };

  return (
    <ScreenContainer>
      <View style={styles.body}>
        <SceneText
          heading={t('auth.title')}
          lines={[t('auth.subtitle')]}
          delay={0}
          cadence={500}
        />
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
    paddingBottom: 32,
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
