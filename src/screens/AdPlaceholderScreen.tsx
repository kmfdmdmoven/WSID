import React, { useCallback, useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { ScreenContainer } from '../components/ScreenContainer';
import { useNeural } from '../context/NeuralContext';
import { PrimaryButton } from '../components/PrimaryButton';
import { colors } from '../constants/colors';
import { track } from '../services/analytics';
import type { RootStackParamList } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'AdPlaceholder'>;

export function AdPlaceholderScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const { setNeuralMode } = useNeural();

  useFocusEffect(useCallback(() => { setNeuralMode('idle', 0.5); }, [setNeuralMode]));

  useEffect(() => {
    track('ad_placeholder_shown');
  }, []);

  return (
    <ScreenContainer>
      <View style={styles.body}>
        <View style={styles.adCard}>
          <Text style={styles.adLabel}>Ad</Text>
        </View>
        <Text style={styles.title}>{t('ad.title')}</Text>
        <Text style={styles.subtitle}>{t('ad.subtitle')}</Text>
      </View>

      <PrimaryButton label={t('common.continue')} onPress={() => navigation.navigate('ActionHub')} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  body: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  adCard: {
    width: '100%',
    height: 180,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: colors.cardBorder,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
    backgroundColor: colors.cardBackground,
  },
  adLabel: {
    color: colors.textMuted,
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    color: colors.textPrimary,
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    color: colors.textSecondary,
    fontSize: 16,
    textAlign: 'center',
  },
});
