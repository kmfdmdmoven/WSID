import React, { useEffect } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { ScreenContainer } from '../components/ScreenContainer';
import { PrimaryButton } from '../components/PrimaryButton';
import { colors } from '../constants/colors';
import { useDecision } from '../context/DecisionContext';
import { track } from '../services/analytics';
import type { RootStackParamList } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'ActionHub'>;

export function ActionHubScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const { resetSession } = useDecision();

  useEffect(() => {
    track('action_hub_opened');
  }, []);

  const handleTryAnother = () => {
    resetSession();
    track('try_another_clicked');
    navigation.navigate('Question');
  };

  const handleRateApp = () => {
    track('rate_app_clicked');
    Linking.openURL('https://apps.apple.com').catch(() => undefined);
  };

  const handleShare = () => {
    track('share_clicked');
  };

  return (
    <ScreenContainer neuralMode="idle">
      <View style={styles.headerRow}>
        <Text style={styles.title}>{t('actionHub.title')}</Text>
        <Pressable onPress={() => navigation.navigate('Settings')}>
          <Text style={styles.settingsLink}>{t('common.settings')}</Text>
        </Pressable>
      </View>

      <View style={styles.body}>
        <PrimaryButton label={t('actionHub.tryAnother')} onPress={handleTryAnother} />
        <PrimaryButton
          label={t('actionHub.exploreApps')}
          variant="secondary"
          onPress={() => {
            track('app_hub_opened');
            navigation.navigate('AppHub');
          }}
          style={styles.button}
        />
        <PrimaryButton
          label={t('actionHub.earlyAccess')}
          variant="secondary"
          onPress={() => navigation.navigate('EarlyAccess')}
          style={styles.button}
        />
        <PrimaryButton
          label={`${t('actionHub.share')} (${t('common.comingSoon')})`}
          variant="ghost"
          disabled
          onPress={handleShare}
          style={styles.button}
        />
        <PrimaryButton
          label={t('actionHub.rateApp')}
          variant="ghost"
          onPress={handleRateApp}
          style={styles.button}
        />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 28,
    fontWeight: '700',
    flex: 1,
  },
  settingsLink: {
    color: colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  body: {
    flex: 1,
    justifyContent: 'center',
  },
  button: {
    marginTop: 12,
  },
});
