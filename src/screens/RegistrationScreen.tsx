import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { BackButton } from '../components/BackButton';
import { ScreenContainer } from '../components/ScreenContainer';
import { SceneText } from '../components/SceneText';
import { PrimaryButton } from '../components/PrimaryButton';
import { useNeural } from '../context/NeuralContext';
import { track } from '../services/analytics';
import { signInWithApple, signInWithGoogle, RegistrationResult } from '../services/auth';
import { colors } from '../constants/colors';
import type { RootStackParamList } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Registration'>;

// Registration via link flow (Cowork contract 2026-07-15): the anonymous
// user's OAuth identity is attached to the SAME user_id — history survives.
export function RegistrationScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const { setNeuralMode } = useNeural();
  const [busy, setBusy] = useState<'apple' | 'google' | null>(null);
  const [errorText, setErrorText] = useState('');

  useFocusEffect(useCallback(() => { setNeuralMode('thinking'); }, [setNeuralMode]));

  useEffect(() => {
    track('registration_screen_opened');
  }, []);

  const handleResult = (result: RegistrationResult) => {
    setBusy(null);
    if (result.ok) {
      // Back into the ritual where the gate stopped the user
      navigation.navigate('Question');
      return;
    }
    if (result.cancelled) return; // quiet: user changed their mind, no error UI
    setErrorText(t('registration.error'));
  };

  const handleApple = async () => {
    setErrorText('');
    setBusy('apple');
    handleResult(await signInWithApple());
  };

  const handleGoogle = async () => {
    setErrorText('');
    setBusy('google');
    handleResult(await signInWithGoogle());
  };

  return (
    <ScreenContainer>
      <View style={styles.backSlot}>
        <BackButton onPress={() => navigation.goBack()} />
      </View>
      <View style={styles.body}>
        <SceneText
          overline={t('registration.overline')}
          heading={t('registration.title')}
          guidance={t('registration.guidance')}
          delay={200}
        />
        <View style={styles.actions}>
          <PrimaryButton
            label={t('registration.apple')}
            variant="primary"
            loading={busy === 'apple'}
            disabled={busy !== null}
            onPress={handleApple}
          />
          <PrimaryButton
            label={t('registration.google')}
            variant="secondary"
            loading={busy === 'google'}
            disabled={busy !== null}
            onPress={handleGoogle}
          />
          {errorText ? <Text style={styles.error}>{errorText}</Text> : null}
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  backSlot: {
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  body: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  actions: {
    marginTop: 32,
    gap: 16,
  },
  error: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: 4,
  },
});
