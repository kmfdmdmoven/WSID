import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { BackButton } from '../components/BackButton';
import { ScreenContainer } from '../components/ScreenContainer';
import { colors } from '../constants/colors';
import { useNeural } from '../context/NeuralContext';
import { track } from '../services/analytics';
import { listSessions, DecisionRow } from '../services/sessions';
import type { RootStackParamList } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'History'>;

const EMOJI: Record<string, string> = {
  loveIt: '🤩', feelsRight: '😌', doesntFeelRight: '😕', disappointed: '😞',
};

export function HistoryScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const { setNeuralMode } = useNeural();
  const [rows, setRows] = useState<DecisionRow[] | null>(null);

  useFocusEffect(useCallback(() => { setNeuralMode('idle', 0.4); }, [setNeuralMode]));

  useEffect(() => {
    track('history_opened');
    listSessions().then((r) => setRows(r.ok ? r.rows : []));
  }, []);

  const renderItem = ({ item }: { item: DecisionRow }) => {
    const chosen = item.revealed_option === 'a' ? item.option_a : item.option_b;
    return (
      <View style={styles.card}>
        <Text style={styles.question} numberOfLines={2}>{item.question}</Text>
        <View style={styles.choiceRow}>
          <Text style={styles.choice} numberOfLines={1}>{chosen}</Text>
          {item.emotion ? <Text style={styles.emoji}>{EMOJI[item.emotion] ?? ''}</Text> : null}
        </View>
      </View>
    );
  };

  return (
    <ScreenContainer>
      <View style={styles.backSlot}>
        <BackButton onPress={() => navigation.goBack()} />
      </View>
      <Text style={styles.title}>{t('history.title')}</Text>

      {rows === null ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.accentGold} />
        </View>
      ) : rows.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.empty}>{t('history.empty')}</Text>
        </View>
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(r) => r.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  backSlot: { marginBottom: 8, alignSelf: 'flex-start' },
  title: {
    color: colors.textPrimary,
    fontSize: 28,
    fontWeight: '600',
    marginBottom: 24,
  },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: {
    color: colors.textSecondary,
    fontSize: 16,
    fontStyle: 'italic',
    textAlign: 'center',
    paddingHorizontal: 32,
    lineHeight: 24,
  },
  list: { paddingBottom: 24, gap: 12 },
  card: {
    backgroundColor: colors.cardBackground,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    borderRadius: 20,
    padding: 16,
  },
  question: {
    color: colors.textSecondary,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 8,
  },
  choiceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  choice: {
    color: colors.buttonPrimaryGoldText,
    fontSize: 18,
    fontWeight: '500',
    flex: 1,
  },
  emoji: { fontSize: 22 },
});
