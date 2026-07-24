import React, { useCallback, useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { ScreenContainer } from '../components/ScreenContainer';
import { SceneText } from '../components/SceneText';
import { useNeural } from '../context/NeuralContext';
import { PrimaryButton } from '../components/PrimaryButton';
import { colors } from '../constants/colors';
import { changeLanguage } from '../i18n';
import { track } from '../services/analytics';
import { saveSettings } from '../services/storage';
import type { Language, RootStackParamList } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Welcome'>;

export function WelcomeScreen({ navigation }: Props) {
  const { t, i18n } = useTranslation();
  const { setNeuralMode } = useNeural();

  useFocusEffect(useCallback(() => { setNeuralMode('idle'); }, [setNeuralMode]));

  useEffect(() => {
    track('app_opened');
  }, []);

  const switchLanguage = async (language: Language) => {
    await changeLanguage(language);
    await saveSettings({ language });
    track('language_selected', { language });
  };

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <Pressable
          onPress={() => switchLanguage('en')}
          style={[styles.langButton, i18n.language === 'en' && styles.langActive]}
        >
          <Text style={styles.langText}>EN</Text>
        </Pressable>
        <Pressable
          onPress={() => switchLanguage('uk')}
          style={[styles.langButton, i18n.language === 'uk' && styles.langActive]}
        >
          <Text style={styles.langText}>UA</Text>
        </Pressable>
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
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginBottom: 24,
  },
  langButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  langActive: {
    backgroundColor: colors.cardBackground,
    borderColor: colors.accentGold,
  },
  langText: {
    color: colors.textPrimary,
    fontWeight: '600',
  },
  body: {
    flex: 1,
    justifyContent: 'center',
    paddingBottom: 40,
  },
});
