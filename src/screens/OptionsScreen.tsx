import React, { useCallback, useEffect, useState } from 'react';
import { Keyboard, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { BackButton } from '../components/BackButton';
import { ScreenContainer } from '../components/ScreenContainer';
import { PrimaryButton } from '../components/PrimaryButton';
import { TextInputCard } from '../components/TextInputCard';
import { colors } from '../constants/colors';
import { useNeural } from '../context/NeuralContext';
import { useDecision } from '../context/DecisionContext';
import { track } from '../services/analytics';
import { canStartSession, createSession } from '../services/sessions';
import { withTypingShimmer } from '../services/neuralFx';
import type { RootStackParamList } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Options'>;

// Step 2 of the ritual: the question stays on the canvas as plain text,
// both options are named inline. The round is spent HERE (gate + INSERT) —
// on the final CTA, not on the question screen.
export function OptionsScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const { session, setOptionA, setOptionB, runReveal, setSessionId } = useDecision();
  const { setNeuralMode } = useNeural();
  const [focusedCard, setFocusedCard] = useState<'a' | 'b' | null>(null);

  // Same ritual stage as the question — the thought is still forming.
  // NOT 'activating' (that belongs to "Look Closer"). Contract §3.1.
  useFocusEffect(useCallback(() => { setNeuralMode('thinking', 1.2); }, [setNeuralMode]));

  useEffect(() => {
    track('options_screen_opened');
  }, []);

  const bothNamed = !!session.optionA.trim() && !!session.optionB.trim();

  const handleReveal = async () => {
    if (!bothNamed) return;

    // Trial-round gate: advisory UX check, a network error never blocks the ritual
    const gate = await canStartSession();
    if (!gate.allowed) {
      track('registration_gate_shown');
      navigation.navigate('Registration');
      return;
    }

    const pick = runReveal();
    track('reveal_started');
    // Best-effort persistence: navigate immediately, store the row id when it lands.
    setSessionId(null);
    createSession(
      session.question.trim(),
      session.optionA.trim(),
      session.optionB.trim(),
      pick.revealedOption,
    ).then((result) => {
      if (result.ok) {
        setSessionId(result.id);
      }
    });
    navigation.navigate('RevealAnimation');
  };

  return (
    <ScreenContainer>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.backSlot}>
          <BackButton onPress={() => navigation.goBack()} />
        </View>

        {/* Tap off the inputs dismisses the keyboard */}
        <Pressable style={styles.flex} onPress={Keyboard.dismiss} accessible={false}>
        {/* The question lives on the canvas — no frames, no pill */}
        <View style={styles.header}>
          <View style={styles.overlineRow}>
            <View style={styles.dot} />
            <Text style={styles.overline}>{t('options.overline')}</Text>
          </View>
          <Text style={styles.question} numberOfLines={3}>
            {session.question}
          </Text>
          <Text style={styles.guidance}>{t('options.guidance')}</Text>
        </View>

        <View style={styles.cards}>
          <TextInputCard
            label={t('options.optionALabel')}
            value={session.optionA}
            onChangeText={withTypingShimmer(setOptionA)}
            placeholder={t('options.placeholder')}
            dotColor={session.optionA.trim() ? 'blue' : 'violet'}
            maxLength={40}
            dimmed={focusedCard === 'b'}
            onFocus={() => setFocusedCard('a')}
            onBlur={() => setFocusedCard(null)}
          />
          <TextInputCard
            label={t('options.optionBLabel')}
            value={session.optionB}
            onChangeText={withTypingShimmer(setOptionB)}
            placeholder={t('options.placeholder')}
            dotColor={session.optionB.trim() ? 'blue' : 'violet'}
            maxLength={40}
            dimmed={focusedCard === 'a'}
            onFocus={() => setFocusedCard('b')}
            onBlur={() => setFocusedCard(null)}
          />
        </View>

        <View style={styles.spacer} />
        <PrimaryButton
          label={t('common.reveal')}
          disabled={!bothNamed}
          onPress={handleReveal}
        />
        </Pressable>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  backSlot: {
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  header: {
    marginBottom: 32,
  },
  overlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.accentGold,
    marginRight: 8,
  },
  overline: {
    color: colors.textSecondary,
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 1.8,
  },
  question: {
    color: colors.textPrimary,
    fontSize: 26,
    fontWeight: '600',
    lineHeight: 33,
  },
  guidance: {
    color: colors.textSecondary,
    fontSize: 15,
    marginTop: 12,
  },
  cards: {
    gap: 4,
  },
  spacer: {
    flex: 1,
  },
});
