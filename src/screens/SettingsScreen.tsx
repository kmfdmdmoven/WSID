import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { BackButton } from '../components/BackButton';
import { ScreenContainer } from '../components/ScreenContainer';
import { useDecision } from '../context/DecisionContext';
import { useNeural } from '../context/NeuralContext';
import { colors } from '../constants/colors';
import { changeLanguage } from '../i18n';
import { getSettings, saveSettings } from '../services/storage';
import { deleteAccount } from '../services/auth';
import type { AppSettings, Language, RootStackParamList } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Settings'>;

export function SettingsScreen({ navigation }: Props) {
  const { t, i18n } = useTranslation();
  const [settings, setSettings] = useState<AppSettings>({
    language: 'en',
    soundEnabled: true,
    hapticsEnabled: true,
  });

  const { setNeuralMode } = useNeural();
  const { resetSession } = useDecision();

  useFocusEffect(useCallback(() => { setNeuralMode('idle', 0.4); }, [setNeuralMode]));

  useEffect(() => {
    getSettings().then(setSettings);
  }, []);

  const updateSettings = async (partial: Partial<AppSettings>) => {
    const updated = await saveSettings(partial);
    setSettings(updated);
  };

  const toggleLanguage = async (language: Language) => {
    await changeLanguage(language);
    await updateSettings({ language });
  };

  const [deleting, setDeleting] = useState(false);

  const runDelete = async () => {
    setDeleting(true);
    let result: Awaited<ReturnType<typeof deleteAccount>>;
    try {
      result = await deleteAccount();
    } finally {
      setDeleting(false);
    }
    if (result.ok) {
      console.log('[settings] delete ok, resetting to Welcome');
      // GDPR: the account is gone — the in-memory draft (question/options)
      // must not leak to the next anonymous user on this device
      resetSession();
      navigation.reset({ index: 0, routes: [{ name: 'Welcome' }] });
      return;
    }
    Alert.alert(
      t('settings.deleteErrorTitle'),
      result.error.description,
      result.error.isRetryable
        ? [
            { text: t('settings.deleteCancel'), style: 'cancel' },
            { text: t('settings.deleteRetry'), onPress: runDelete },
          ]
        : [{ text: t('settings.deleteCancel'), style: 'cancel' }],
    );
  };

  const confirmDelete = () => {
    Alert.alert(t('settings.deleteTitle'), t('settings.deleteMessage'), [
      { text: t('settings.deleteCancel'), style: 'cancel' },
      { text: t('settings.deleteConfirm'), style: 'destructive', onPress: runDelete },
    ]);
  };

  return (
    <ScreenContainer>
      <View style={styles.backSlot}>
        <BackButton onPress={() => navigation.goBack()} />
      </View>

      <Text style={styles.title}>{t('settings.title')}</Text>

      <View style={styles.card}>
        <View style={styles.cardSection}>
          <Text style={styles.sectionTitle}>{t('settings.language')}</Text>
          <View style={styles.row}>
            <Pressable
              onPress={() => toggleLanguage('en')}
              style={[styles.langButton, i18n.language === 'en' && styles.langActive]}
            >
              <Text style={styles.langText}>{t('common.english')}</Text>
            </Pressable>
            <Pressable
              onPress={() => toggleLanguage('uk')}
              style={[styles.langButton, i18n.language === 'uk' && styles.langActive]}
            >
              <Text style={styles.langText}>{t('common.ukrainian')}</Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={[styles.cardSection, styles.toggleRow]}>
          {/* Sound playback not implemented yet — deliberate "coming soon", not a broken toggle */}
          <Text style={[styles.sectionTitle, styles.soonTitle]}>{t('settings.sound')}</Text>
          <View style={styles.soonBadge}>
            <Text style={styles.soonText}>{t('common.comingSoon')}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={[styles.cardSection, styles.toggleRow]}>
          <Text style={styles.sectionTitle}>{t('settings.haptics')}</Text>
          <Switch
            value={settings.hapticsEnabled}
            onValueChange={(hapticsEnabled) => updateSettings({ hapticsEnabled })}
            trackColor={{ false: colors.cardBorder, true: colors.accentGold }}
            thumbColor={colors.textPrimary}
          />
        </View>
      </View>

      <View style={styles.dangerZone}>
        <Pressable onPress={confirmDelete} disabled={deleting} hitSlop={8} style={styles.deleteRow}>
          {deleting ? (
            <ActivityIndicator color={colors.error} size="small" />
          ) : (
            <Text style={styles.deleteText}>{t('settings.deleteAccount')}</Text>
          )}
        </Pressable>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  backSlot: {
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  title: {
    color: colors.textPrimary,
    fontSize: 28,
    fontWeight: '600',
    marginBottom: 24,
  },
  card: {
    backgroundColor: colors.cardBackground,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: 20,
    paddingHorizontal: 16,
  },
  cardSection: {
    paddingVertical: 16,
  },
  divider: {
    height: 1,
    backgroundColor: colors.cardBorder,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '500',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  langButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
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
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  soonTitle: {
    color: colors.disabledText,
  },
  soonBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  soonText: {
    color: colors.disabledText,
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  dangerZone: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingBottom: 24,
  },
  // DS destructive: pill like PrimaryButton secondary, error-tinted, no fill
  deleteRow: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 28,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255,69,58,0.45)',
    backgroundColor: 'rgba(255,69,58,0.08)',
  },
  deleteText: {
    color: colors.error,
    fontSize: 16,
    fontWeight: '500',
  },
});
