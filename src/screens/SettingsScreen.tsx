import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { ScreenContainer } from '../components/ScreenContainer';
import { colors } from '../constants/colors';
import { changeLanguage } from '../i18n';
import { getSettings, saveSettings } from '../services/storage';
import type { AppSettings, Language, RootStackParamList } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Settings'>;

export function SettingsScreen({ navigation }: Props) {
  const { t, i18n } = useTranslation();
  const [settings, setSettings] = useState<AppSettings>({
    language: 'en',
    soundEnabled: true,
    hapticsEnabled: true,
  });

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

  return (
    <ScreenContainer neuralMode="idle" showNeural={false}>
      <Pressable onPress={() => navigation.goBack()} style={styles.back}>
        <Text style={styles.backText}>{t('common.back')}</Text>
      </Pressable>

      <Text style={styles.title}>{t('settings.title')}</Text>

      <View style={styles.section}>
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

      <View style={styles.section}>
        <View style={styles.toggleRow}>
          <Text style={styles.sectionTitle}>{t('settings.sound')}</Text>
          <Switch
            value={settings.soundEnabled}
            onValueChange={(soundEnabled) => updateSettings({ soundEnabled })}
            trackColor={{ false: colors.cardBorder, true: colors.accentGold }}
            thumbColor={colors.textPrimary}
          />
        </View>
        <Text style={styles.hint}>
          {settings.soundEnabled ? t('settings.on') : t('settings.off')}
        </Text>
      </View>

      <View style={styles.section}>
        <View style={styles.toggleRow}>
          <Text style={styles.sectionTitle}>{t('settings.haptics')}</Text>
          <Switch
            value={settings.hapticsEnabled}
            onValueChange={(hapticsEnabled) => updateSettings({ hapticsEnabled })}
            trackColor={{ false: colors.cardBorder, true: colors.accentGold }}
            thumbColor={colors.textPrimary}
          />
        </View>
        <Text style={styles.hint}>
          {settings.hapticsEnabled ? t('settings.on') : t('settings.off')}
        </Text>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  back: {
    marginBottom: 16,
  },
  backText: {
    color: colors.textSecondary,
    fontSize: 16,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 32,
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    color: colors.textPrimary,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
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
  hint: {
    color: colors.textMuted,
    fontSize: 14,
    marginTop: 8,
  },
});
