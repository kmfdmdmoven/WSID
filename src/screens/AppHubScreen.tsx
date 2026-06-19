import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { ScreenContainer } from '../components/ScreenContainer';
import { colors } from '../constants/colors';
import type { RootStackParamList } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'AppHub'>;

export function AppHubScreen({ navigation }: Props) {
  const { t } = useTranslation();

  const cards = [
    { title: t('appHub.movenbit'), desc: t('appHub.movenbitDesc') },
    { title: t('appHub.reading'), desc: t('appHub.readingDesc') },
    { title: t('appHub.comingSoonTitle'), desc: t('appHub.comingSoonDesc') },
  ];

  return (
    <ScreenContainer neuralMode="idle" neuralIntensity={0.6}>
      <Pressable onPress={() => navigation.goBack()} style={styles.back}>
        <Text style={styles.backText}>{t('common.back')}</Text>
      </Pressable>

      <Text style={styles.title}>{t('appHub.title')}</Text>

      <ScrollView contentContainerStyle={styles.list}>
        {cards.map((card) => (
          <View key={card.title} style={styles.card}>
            <Text style={styles.cardTitle}>{card.title}</Text>
            <Text style={styles.cardDesc}>{card.desc}</Text>
          </View>
        ))}
      </ScrollView>
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
    marginBottom: 24,
  },
  list: {
    paddingBottom: 24,
  },
  card: {
    backgroundColor: colors.cardBackground,
    borderColor: colors.cardBorder,
    borderWidth: 1,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
  },
  cardTitle: {
    color: colors.textPrimary,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  cardDesc: {
    color: colors.textSecondary,
    fontSize: 15,
    lineHeight: 22,
  },
});
