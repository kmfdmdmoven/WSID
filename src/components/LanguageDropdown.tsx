import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { colors } from '../constants/colors';
import { changeLanguage } from '../i18n';
import { track } from '../services/analytics';
import { saveSettings } from '../services/storage';
import type { Language } from '../types';

const OPTIONS: { code: Language; label: string }[] = [
  { code: 'en', label: 'EN' },
  { code: 'uk', label: 'UA' },
];

export function LanguageDropdown() {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);

  const current = i18n.language === 'uk' ? 'UA' : 'EN';

  const select = async (language: Language) => {
    setOpen(false);
    if (language === i18n.language) return;
    await changeLanguage(language);
    await saveSettings({ language });
    track('language_selected', { language });
  };

  return (
    <View style={styles.wrap}>
      {/* Backdrop catches outside taps to close (only while open) */}
      {open ? (
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)} />
      ) : null}

      <Pressable style={styles.pill} onPress={() => setOpen((o) => !o)} hitSlop={8}>
        <Text style={styles.pillText}>{current}</Text>
        <Feather
          name={open ? 'chevron-up' : 'chevron-down'}
          size={14}
          color={colors.textSecondary}
          style={styles.chevron}
        />
      </Pressable>

      {open ? (
        <View style={styles.menu}>
          {OPTIONS.map((o) => {
            const active = i18n.language === o.code;
            return (
              <Pressable key={o.code} style={styles.item} onPress={() => select(o.code)}>
                <Text style={[styles.itemText, active && styles.itemActive]}>{o.label}</Text>
                {active ? <Feather name="check" size={14} color={colors.accentGold} /> : null}
              </Pressable>
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignSelf: 'flex-end',
  },
  // Full-screen tap catcher rendered relative to the app root area
  backdrop: {
    position: 'absolute',
    top: -1000,
    left: -1000,
    right: -1000,
    bottom: -1000,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: colors.cardBackground,
  },
  pillText: {
    color: colors.textPrimary,
    fontWeight: '600',
    fontSize: 14,
  },
  chevron: {
    marginLeft: 6,
  },
  menu: {
    position: 'absolute',
    top: 44,
    right: 0,
    minWidth: 96,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: '#141414',
    overflow: 'hidden',
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  itemText: {
    color: colors.buttonSecondaryText,
    fontSize: 15,
    fontWeight: '500',
  },
  itemActive: {
    color: colors.accentGold,
  },
});
