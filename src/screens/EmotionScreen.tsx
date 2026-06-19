import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useTranslation } from 'react-i18next';
import { ScreenContainer } from '../components/ScreenContainer';
import { EmotionCard } from '../components/EmotionCard';
import { EMOTIONS } from '../constants/emotions';
import { colors } from '../constants/colors';
import { useDecision } from '../context/DecisionContext';
import { track } from '../services/analytics';
import { lightImpact } from '../services/haptics';
import type { Emotion, RootStackParamList } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Emotion'>;

export function EmotionScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const { setEmotion } = useDecision();

  const handleSelect = async (emotion: Emotion) => {
    await lightImpact();
    setEmotion(emotion);
    track('emotion_selected', { emotion });
    navigation.navigate('Insight');
  };

  return (
    <ScreenContainer neuralMode="converging">
      <View style={styles.header}>
        <Text style={styles.title}>{t('emotion.title')}</Text>
        <Text style={styles.helper}>{t('emotion.helper')}</Text>
      </View>

      <View style={styles.grid}>
        <View style={styles.row}>
          {EMOTIONS.slice(0, 2).map((emotion) => (
            <EmotionCard
              key={emotion.id}
              emoji={emotion.emoji}
              label={t(emotion.labelKey)}
              onPress={() => handleSelect(emotion.id)}
            />
          ))}
        </View>
        <View style={styles.row}>
          {EMOTIONS.slice(2).map((emotion) => (
            <EmotionCard
              key={emotion.id}
              emoji={emotion.emoji}
              label={t(emotion.labelKey)}
              onPress={() => handleSelect(emotion.id)}
            />
          ))}
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    marginBottom: 24,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 12,
  },
  helper: {
    color: colors.textSecondary,
    fontSize: 16,
    lineHeight: 24,
  },
  grid: {
    flex: 1,
    justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
  },
});
