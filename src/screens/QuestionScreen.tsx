import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { ScreenContainer } from '../components/ScreenContainer';
import { ProgressiveReveal } from '../components/ProgressiveReveal';
import { useNeural } from '../context/NeuralContext';
import { PrimaryButton } from '../components/PrimaryButton';
import { TextInputCard } from '../components/TextInputCard';
import { colors } from '../constants/colors';
import { useDecision } from '../context/DecisionContext';
import { track } from '../services/analytics';
import type { RootStackParamList } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Question'>;

export function QuestionScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const { session, setQuestion, setOptionA, setOptionB, runReveal } = useDecision();
  const { setNeuralMode } = useNeural();
  const [error, setError] = useState('');

  useFocusEffect(useCallback(() => { setNeuralMode('thinking', 1.2); }, [setNeuralMode]));

  useEffect(() => {
    track('question_screen_opened');
  }, []);

  const handleReveal = () => {
    const question = session.question.trim();
    const optionA = session.optionA.trim();
    const optionB = session.optionB.trim();

    if (!question || !optionA || !optionB) {
      setError(t('question.validationError'));
      return;
    }

    setError('');
    runReveal();
    track('reveal_started');
    navigation.navigate('RevealAnimation');
  };

  return (
    <ScreenContainer>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <ProgressiveReveal cadence={220} delay={120}>
          <Text style={styles.title}>{t('question.title')}</Text>
          <TextInputCard
            label={t('question.questionLabel')}
            value={session.question}
            onChangeText={setQuestion}
            dotColor="gold"
            multiline
          />
          <TextInputCard
            label={t('question.optionALabel')}
            value={session.optionA}
            onChangeText={setOptionA}
            dotColor="blue"
          />
          <TextInputCard
            label={t('question.optionBLabel')}
            value={session.optionB}
            onChangeText={setOptionB}
            dotColor="blue"
          />
        </ProgressiveReveal>

        {error ? <Text style={styles.error}>{error}</Text> : null}
      </ScrollView>

      <PrimaryButton label={t('common.reveal')} onPress={handleReveal} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingBottom: 24,
  },
  title: {
    color: colors.textPrimary,
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 24,
  },
  error: {
    color: colors.error,
    fontSize: 14,
    marginBottom: 8,
  },
});
