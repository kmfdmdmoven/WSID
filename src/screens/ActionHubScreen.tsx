import React, { useCallback, useEffect } from 'react';
import { Linking, Pressable, Share, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { Feather } from '@expo/vector-icons';
import { ScreenContainer } from '../components/ScreenContainer';
import { useNeural } from '../context/NeuralContext';
import { PrimaryButton } from '../components/PrimaryButton';
import { colors } from '../constants/colors';
import { useDecision } from '../context/DecisionContext';
import { track } from '../services/analytics';
import type { RootStackParamList } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'ActionHub'>;

export function ActionHubScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const { resetSession } = useDecision();
  const { setNeuralMode } = useNeural();

  useFocusEffect(useCallback(() => { setNeuralMode('idle'); }, [setNeuralMode]));

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

  const handleShare = async () => {
    track('share_clicked');
    try {
      await Share.share({ message: t('actionHub.shareMessage') });
    } catch {
      // user dismissed the share sheet — nothing to do
    }
  };

  return (
    <ScreenContainer>
      <View style={styles.headerRow}>
        <Text style={styles.title}>{t('actionHub.title')}</Text>
        <Pressable
          accessibilityLabel={t('common.settings')}
          onPress={() => navigation.navigate('Settings')}
          hitSlop={12}
        >
          <Feather name="settings" size={22} color={colors.textSecondary} />
        </Pressable>
      </View>

      <View style={styles.body}>
        <PrimaryButton label={t('actionHub.tryAnother')} onPress={handleTryAnother} />
        <PrimaryButton
          label={t('actionHub.history')}
          variant="secondary"
          icon="clock"
          onPress={() => navigation.navigate('History')}
        />
        <PrimaryButton
          label={t('actionHub.exploreApps')}
          variant="secondary"
          icon="grid"
          onPress={() => {
            track('app_hub_opened');
            navigation.navigate('AppHub');
          }}
        />
        <PrimaryButton
          label={t('actionHub.earlyAccess')}
          variant="secondary"
          icon="mail"
          onPress={() => navigation.navigate('EarlyAccess')}
        />
        <PrimaryButton
          label={t('actionHub.share')}
          variant="ghost"
          icon="share"
          onPress={handleShare}
        />
        <PrimaryButton
          label={t('actionHub.rateApp')}
          variant="ghost"
          icon="star"
          onPress={handleRateApp}
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
  body: {
    flex: 1,
    justifyContent: 'center',
    gap: 12,
  },
});
