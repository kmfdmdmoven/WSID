import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { ScreenContainer } from '../components/ScreenContainer';
import { ProgressiveReveal } from '../components/ProgressiveReveal';
import { PrimaryButton } from '../components/PrimaryButton';
import { isPositiveEmotion } from '../constants/emotions';
import { colors } from '../constants/colors';
import { useDecision } from '../context/DecisionContext';
import { useNeural } from '../context/NeuralContext';
import { track } from '../services/analytics';
import { getInsightKeys } from '../utils/reflectionPhrases';
import type { RootStackParamList } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Insight'>;

// Network state for negative discovery flow
// 'pre'          → emotionNegative, alternative card visible
// 'revealing'    → discovery mode starts, card visible for 600ms
// 'confirmed'    → discovery mode, final reflection visible
type NetworkState = 'pre' | 'revealing' | 'confirmed';

// Discovery: 2.5s matches discovery transitionDuration — gold fully returns before text changes
const DISCOVERY_REVEAL_MS = 2500;

function pickRandom(arr: string[]): string {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function InsightScreen({ navigation }: Props) {
  const { t } = useTranslation();
  const { session } = useDecision();
  const { setNeuralMode } = useNeural();
  const [networkState, setNetworkState] = useState<NetworkState>('pre');

  const isPositive = session.emotion ? isPositiveEmotion(session.emotion) : true;
  const keys = session.emotion ? getInsightKeys(session.emotion) : getInsightKeys('feelsRight');

  const prePhrase = useMemo(() => ({
    headline: pickRandom(t('insight_negative.preHeadlines', { returnObjects: true }) as string[]),
    body: pickRandom(t('insight_negative.preBodies', { returnObjects: true }) as string[]),
  }), []); // eslint-disable-line react-hooks/exhaustive-deps

  const finalPhrase = useMemo(() => ({
    headline: pickRandom(t('insight_negative.finalHeadlines', { returnObjects: true }) as string[]),
    body: pickRandom(t('insight_negative.finalBodies', { returnObjects: true }) as string[]),
    footer: pickRandom(t('insight_negative.finalFooters', { returnObjects: true }) as string[]),
  }), []); // eslint-disable-line react-hooks/exhaustive-deps

  useFocusEffect(useCallback(() => {
    setNetworkState('pre');
  }, []));

  // Sync neural mode with flow state
  useEffect(() => {
    if (isPositive) {
      setNeuralMode('emotionPositive');
    } else if (networkState === 'pre') {
      setNeuralMode('emotionNegative');
    } else {
      setNeuralMode('discovery');
    }
  }, [isPositive, networkState, setNeuralMode]);

  useEffect(() => {
    track('insight_shown', { emotion: session.emotion, insightOption: session.insightOption });
    if (!isPositive) {
      track('alternative_option_shown', { alternativeOption: session.alternativeOption });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (networkState === 'confirmed') {
      track('final_reflection_shown', { alternativeOption: session.alternativeOption });
    }
  }, [networkState]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleAlternativeTap = () => {
    if (networkState !== 'pre') return;
    track('alternative_option_confirmed', { alternativeOption: session.alternativeOption });

    // Network immediately shifts to discovery — user sees color change before content
    setNetworkState('revealing');

    setTimeout(() => {
      setNetworkState('confirmed');
    }, DISCOVERY_REVEAL_MS);
  };

  // ── Positive flow ─────────────────────────────────────────────────────────
  if (isPositive) {
    return (
      <ScreenContainer>
        <View style={styles.body}>
          <ProgressiveReveal cadence={480} delay={300}>
            <Text style={styles.headline}>{t(keys.headline)}</Text>
            {session.insightOption ? (
              <Text style={styles.highlight}>{session.insightOption}</Text>
            ) : <View />}
            <Text style={styles.bodyText}>{t(keys.body)}</Text>
            <View style={styles.footerSpacer} />
            <Text style={styles.footer}>{t(keys.footer)}</Text>
          </ProgressiveReveal>
        </View>
        <PrimaryButton
          label={t('common.continue')}
          onPress={() => navigation.navigate('ActionHub')}
        />
      </ScreenContainer>
    );
  }

  // ── Negative: alternative card as visual center ───────────────────────────
  if (networkState !== 'confirmed') {
    return (
      <ScreenContainer>
        <View style={styles.body}>
          <Text style={styles.preHeadline}>{prePhrase.headline}</Text>

          <Text style={styles.alternativeLabel}>
            {t('insight_negative.alternativeLabel')}
          </Text>
          <Pressable
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.alternativeCard,
              pressed && styles.alternativeCardPressed,
              networkState === 'revealing' && styles.alternativeCardRevealing,
            ]}
            onPress={handleAlternativeTap}
          >
            <Text style={styles.alternativeText}>{session.alternativeOption}</Text>
          </Pressable>

          <Text style={styles.preSubtext}>{prePhrase.body}</Text>
        </View>
      </ScreenContainer>
    );
  }

  // ── Negative: discovery confirmed — final reflection ──────────────────────
  return (
    <ScreenContainer>
      <View style={styles.body}>
        <ProgressiveReveal cadence={520} delay={400}>
          <Text style={styles.highlight}>{session.alternativeOption}</Text>
          <Text style={styles.headline}>{finalPhrase.headline}</Text>
          <Text style={styles.bodyText}>{finalPhrase.body}</Text>
          <View style={styles.footerSpacer} />
          <Text style={styles.footer}>{finalPhrase.footer}</Text>
        </ProgressiveReveal>
      </View>
      <PrimaryButton
        label={t('common.continue')}
        onPress={() => navigation.navigate('ActionHub')}
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  body: {
    flex: 1,
    justifyContent: 'center',
  },
  headline: {
    color: colors.textPrimary,
    fontSize: 24,
    fontWeight: '600',
    lineHeight: 32,
    marginBottom: 12,
  },
  highlight: {
    color: colors.accentGold,
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 24,
  },
  bodyText: {
    color: colors.textSecondary,
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 24,
  },
  footer: {
    color: 'rgba(255,255,255,0.70)',
    fontSize: 17,
    fontStyle: 'italic',
    lineHeight: 26,
  },
  footerSpacer: {
    height: 8,
  },
  preHeadline: {
    color: colors.textSecondary,
    fontSize: 17,
    lineHeight: 26,
    textAlign: 'center',
    marginBottom: 32,
  },
  preSubtext: {
    color: colors.textMuted,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: 24,
    fontStyle: 'italic',
  },
  alternativeLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    textAlign: 'center',
    marginBottom: 16,
  },
  alternativeCard: {
    backgroundColor: colors.cardBackground,
    borderColor: colors.accentGold,
    borderWidth: 1.5,
    borderRadius: 24,
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alternativeCardPressed: {
    backgroundColor: 'rgba(234, 179, 8, 0.10)',
  },
  alternativeCardRevealing: {
    borderColor: colors.accentGold,
    backgroundColor: 'rgba(234, 179, 8, 0.14)',
  },
  alternativeText: {
    color: colors.textPrimary,
    fontSize: 26,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 34,
  },
});
