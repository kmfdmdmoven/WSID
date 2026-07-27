import React, { useCallback, useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
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

  // Share + Rate are parked until there's a public store link to point at.

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
        {/* Group 1 — your ritual (this app) */}
        <PrimaryButton label={t('actionHub.tryAnother')} onPress={handleTryAnother} />
        <PrimaryButton
          label={t('actionHub.history')}
          variant="secondary"
          icon="clock"
          onPress={() => navigation.navigate('History')}
        />
        <PrimaryButton
          label={t('actionHub.earlyAccess')}
          variant="secondary"
          icon="mail"
          onPress={() => navigation.navigate('EarlyAccess')}
        />

        {/* Group 2 — beyond this app */}
        <Text style={styles.groupLabel}>{t('actionHub.moreLabel')}</Text>
        <PrimaryButton
          label={t('actionHub.exploreApps')}
          variant="secondary"
          icon="grid"
          disabled
          soonLabel={t('common.comingSoon')}
          onPress={() => undefined}
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
  groupLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginTop: 20,
    marginBottom: 4,
    marginLeft: 4,
  },
});
