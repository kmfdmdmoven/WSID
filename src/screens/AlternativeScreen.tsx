import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { ScreenContainer } from '../components/ScreenContainer';
import { PrimaryButton } from '../components/PrimaryButton';
import { colors } from '../constants/colors';
import { useDecision } from '../context/DecisionContext';
import { track } from '../services/analytics';
import type { RootStackParamList } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Alternative'>;

export function AlternativeScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const { session } = useDecision();

  useEffect(() => {
    track('alternative_shown', { alternativeOption: session.alternativeOption });
  }, [session.alternativeOption]);

  return (
    <ScreenContainer neuralMode="converging">
      <View style={styles.body}>
        <Text style={styles.headline}>{t('alternative.headline')}</Text>
        <Text style={styles.highlight}>{session.alternativeOption}</Text>
        <Text style={styles.bodyText}>{t('alternative.body')}</Text>
        <Text style={styles.footer}>{t('alternative.footer')}</Text>
      </View>

      <PrimaryButton
        label={t('common.continue')}
        onPress={() => navigation.navigate('AdPlaceholder')}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  body: {
    flex: 1,
    justifyContent: 'center',
  },
  headline: {
    color: colors.textPrimary,
    fontSize: 24,
    fontWeight: '600',
    lineHeight: 32,
    marginBottom: 12,
  },
  highlight: {
    color: colors.accentGold,
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 24,
  },
  bodyText: {
    color: colors.textSecondary,
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 24,
  },
  footer: {
    color: colors.textMuted,
    fontSize: 14,
    fontStyle: 'italic',
  },
});
