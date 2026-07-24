import React, { useCallback, useEffect } from 'react';
import { KeyboardAvoidingView, Platform, StyleSheet, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { ScreenContainer } from '../components/ScreenContainer';
import { SceneText } from '../components/SceneText';
import { PrimaryButton } from '../components/PrimaryButton';
import { TextInputCard } from '../components/TextInputCard';
import { useNeural } from '../context/NeuralContext';
import { useDecision } from '../context/DecisionContext';
import { track } from '../services/analytics';
import { withTypingShimmer } from '../services/neuralFx';
import type { RootStackParamList } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Question'>;

// Step 1 of the ritual: one screen = one act — only the question lives here.
// Options are named on the next screen (contract TASKS-question-flow.md).
export function QuestionInputScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const { session, setQuestion } = useDecision();
  const { setNeuralMode } = useNeural();

  useFocusEffect(useCallback(() => { setNeuralMode('thinking', 1.2); }, [setNeuralMode]));

  useEffect(() => {
    track('question_screen_opened');
  }, []);

  return (
    <ScreenContainer>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.body}>
          <SceneText
            heading={t('question.title')}
            guidance={t('question.guidance')}
            align="left"
            delay={0}
          />
          <TextInputCard
            label={t('question.questionLabel')}
            value={session.question}
            onChangeText={withTypingShimmer(setQuestion)}
            placeholder={t('question.placeholder')}
            dotColor="gold"
            multiline
            autoFocus
          />
        </View>
        <PrimaryButton
          label={t('question.next')}
          disabled={!session.question.trim()}
          onPress={() => navigation.navigate('Options')}
        />
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  body: {
    flex: 1,
    gap: 4,
  },
});
