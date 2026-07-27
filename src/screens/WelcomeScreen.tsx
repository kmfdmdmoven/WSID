import React, { useCallback, useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { ScreenContainer } from '../components/ScreenContainer';
import { SceneText } from '../components/SceneText';
import { LanguageDropdown } from '../components/LanguageDropdown';
import { useNeural } from '../context/NeuralContext';
import { PrimaryButton } from '../components/PrimaryButton';
import { track } from '../services/analytics';
import type { RootStackParamList } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Welcome'>;

export function WelcomeScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const { setNeuralMode } = useNeural();

  useFocusEffect(useCallback(() => { setNeuralMode('idle'); }, [setNeuralMode]));

  useEffect(() => {
    track('app_opened');
  }, []);

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <LanguageDropdown />
      </View>

      <View style={styles.body}>
        <SceneText
          heading={t('welcome.title')}
          lines={[t('welcome.subtitle'), t('welcome.onboarding')]}
          headingSize={34}
          delay={0}
          cadence={550}
        />
      </View>

      <PrimaryButton label={t('common.start')} onPress={() => navigation.navigate('Question')} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    zIndex: 10,
    marginBottom: 24,
  },
  body: {
    flex: 1,
    justifyContent: 'center',
    paddingBottom: 40,
  },
});
