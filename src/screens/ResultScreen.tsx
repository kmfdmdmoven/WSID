import React, { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { ThoughtObject, ThoughtObjectHandle } from '../components/ThoughtObject';
import { ReactionOrb } from '../components/ReactionOrb';
import { SceneText } from '../components/SceneText';
import { PrimaryButton } from '../components/PrimaryButton';
import { EMOTIONS, isPositiveEmotion } from '../constants/emotions';
import { useNeural } from '../context/NeuralContext';
import { useDecision } from '../context/DecisionContext';
import { colors } from '../constants/colors';
import { selectText } from '../utils/phraseSelector';
import { track } from '../services/analytics';
import { markAlternativeRevealed, updateEmotion } from '../services/sessions';
import { pulse } from '../services/neuralFx';
import { lightImpact } from '../services/haptics';
import { playEmotionTap } from '../services/sound';
import type { Emotion, RootStackParamList } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Result'>;
type ScenePhase = 'idle' | 'reacting' | 'fadingOrbs' | 'positiveResult' | 'negativeResult';

const POSITIVE_PAUSE_MS = 1800;
const NEGATIVE_PAUSE_MS = 3500;

const ORB_LABELS: Record<string, string> = {
  loveIt:          'Love it',
  feelsRight:      'Feels right',
  doesntFeelRight: "Doesn't feel right",
  disappointed:    'Disappointed',
};

export function ResultScreen({ navigation }: Props) {
  const { session, setEmotion, sessionId } = useDecision();
  const { setNeuralMode } = useNeural();
  const insets = useSafeAreaInsets();

  const [phase, setPhase] = useState<ScenePhase>('idle');
  const [selectedEmotionId, setSelectedEmotionId] = useState<string | null>(null);
  const [showContinue, setShowContinue] = useState(false);
  const [reactionPhrase, setReactionPhrase] = useState('');

  // Picked once per session mount — not re-picked on re-render
  const revealQuestion = useRef(selectText('reveal_question', 'What did you feel first?')).current;
  const revealMicroline = useRef(selectText('reveal_microline', 'Trust yourself.')).current;

  const thoughtRef = useRef<ThoughtObjectHandle>(null);

  // Tray entrance animation
  const trayTransY  = useSharedValue(24);
  const trayOpacity = useSharedValue(0);
  // Tray exit animation (multiplied with entrance opacity)
  const trayExitOp  = useSharedValue(1);
  // Result content fade-in
  const resultOp    = useSharedValue(0);

  const trayStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: trayTransY.value }],
    opacity:   trayOpacity.value * trayExitOp.value,
  }));

  const resultContentStyle = useAnimatedStyle(() => ({ opacity: resultOp.value }));

  const ctaOp    = useSharedValue(0);
  const ctaStyle = useAnimatedStyle(() => ({ opacity: ctaOp.value }));

  useFocusEffect(
    useCallback(() => {
      setNeuralMode('result');
      setPhase('idle');
      setSelectedEmotionId(null);
      setShowContinue(false);

      trayTransY.value  = 24;
      trayOpacity.value = 0;
      trayExitOp.value  = 1;
      resultOp.value    = 0;

      trayTransY.value  = withTiming(0, { duration: 640, easing: Easing.out(Easing.cubic) });
      trayOpacity.value = withTiming(1, { duration: 500 });
    }, [setNeuralMode]),
  );

  useEffect(() => {
    // resetSession() clears selectedOption while this screen is still in the
    // nav stack — an empty value here means "reset", not "result shown"
    if (!session.selectedOption) return;
    track('result_shown', { selectedOption: session.selectedOption });
  }, [session.selectedOption]);

  const handleEmotion = (emotion: Emotion) => {
    if (phase !== 'idle') return;

    const positive = isPositiveEmotion(emotion);
    setSelectedEmotionId(emotion);
    setPhase('reacting');
    setNeuralMode(positive ? 'emotionPositive' : 'emotionNegative');
    pulse();
    lightImpact();
    playEmotionTap();

    const pause = positive ? POSITIVE_PAUSE_MS : NEGATIVE_PAUSE_MS;

    setTimeout(() => {
      setPhase('fadingOrbs');
      trayExitOp.value = withTiming(0, { duration: 400 });

      setTimeout(() => {
        setEmotion(emotion);
        track('emotion_selected', { emotion });
        if (sessionId) {
          updateEmotion(sessionId, emotion);
        }

        if (positive) {
          setPhase('positiveResult');
          setReactionPhrase(selectText('reaction_positive', 'Your reaction helped reveal it.', { emotion }));
          thoughtRef.current?.amplifyGlow();
        } else {
          setPhase('negativeResult');
          setReactionPhrase(selectText('reaction_negative', 'What pulled you to the other one?', { emotion }));
          setNeuralMode('discovery');
          track('alternative_option_revealed', { alternativeOption: session.alternativeOption });
          if (sessionId) {
            markAlternativeRevealed(sessionId);
          }
          thoughtRef.current?.flipTo(
            session.alternativeOption || '',
            'WHAT YOU MAY HAVE WANTED',
          );
        }

        resultOp.value = withTiming(1, { duration: 600 });

        setTimeout(() => {
          setShowContinue(true);
          ctaOp.value = withTiming(1, { duration: 400, easing: Easing.out(Easing.cubic) });
        }, 1800);
      }, 500);
    }, pause);
  };

  const inResultPhase = phase === 'positiveResult' || phase === 'negativeResult';
  const showTray = !inResultPhase;

  return (
    <View style={styles.root}>
      {/* Center — ThoughtObject + contextual text */}
      {/* Card: top-anchored — position never changes when text/CTA appear */}
      <View style={[styles.center, { paddingTop: insets.top + 140 }]}>
        {/* Fixed-height card slot: scene geometry is invariant to text length */}
        <View style={styles.cardSlot}>
          <ThoughtObject
            key={session.selectedOption || 'card'}
            ref={thoughtRef}
            text={session.selectedOption || 'Your choice'}
            label="YOUR CHOICE"
            variant="answer"
          />
        </View>

        {/* Text zone: fixed minHeight — card above never shifts when content changes */}
        <View style={styles.textZone}>
          {(phase === 'idle' || phase === 'reacting') && (
            <SceneText
              overline={revealQuestion}
              guidance={revealMicroline}
              delay={500}
            />
          )}

          {phase === 'positiveResult' && (
            <Animated.View style={[{ width: '100%' }, resultContentStyle]}>
              <SceneText
                lines={[revealMicroline]}
                guidance={reactionPhrase}
                delay={200}
              />
            </Animated.View>
          )}

          {phase === 'negativeResult' && (
            <Animated.View style={[{ width: '100%' }, resultContentStyle]}>
              <SceneText
                guidance={reactionPhrase}
                delay={400}
              />
            </Animated.View>
          )}
        </View>
      </View>

      {/* Tray (idle / reacting / fadingOrbs) */}
      {showTray && (
        <Animated.View
          style={[styles.tray, { paddingBottom: insets.bottom + 24 }, trayStyle]}
          pointerEvents={phase === 'idle' ? 'auto' : 'none'}
        >
          <View style={styles.orbRow}>
            {EMOTIONS.slice(0, 2).map((e, i) => (
              <ReactionOrb
                key={e.id}
                emoji={e.emoji}
                rgb={e.rgb}
                label={ORB_LABELS[e.id]}
                delay={i}
                dimmed={phase === 'reacting' && selectedEmotionId !== e.id}
                selected={phase === 'reacting' && selectedEmotionId === e.id}
                onPress={() => handleEmotion(e.id)}
              />
            ))}
          </View>
          <View style={styles.orbRow}>
            {EMOTIONS.slice(2).map((e, i) => (
              <ReactionOrb
                key={e.id}
                emoji={e.emoji}
                rgb={e.rgb}
                label={ORB_LABELS[e.id]}
                delay={i + 2}
                dimmed={phase === 'reacting' && selectedEmotionId !== e.id}
                selected={phase === 'reacting' && selectedEmotionId === e.id}
                onPress={() => handleEmotion(e.id)}
              />
            ))}
          </View>
        </Animated.View>
      )}

      {/* CTA: always in DOM, opacity 0→1 — appears without shifting the card */}
      <Animated.View
        style={[styles.buttonArea, ctaStyle, { paddingBottom: insets.bottom + 16 }]}
        pointerEvents={showContinue ? 'auto' : 'none'}
      >
        <PrimaryButton
          label="Continue"
          onPress={() => navigation.navigate('ActionHub')}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  cardSlot: {
    height: 170,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  textZone: {
    width: '100%',
    minHeight: 150,
    marginTop: 32,
  },
  tray: {
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 18,
    flexShrink: 0,
  },
  orbRow: {
    flexDirection: 'row',
    gap: 10,
    height: 104,
    alignItems: 'flex-start',
  },
  // Overlay: CTA must not reserve layout space while invisible —
  // otherwise the tray floats above a dead zone.
  buttonArea: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 24,
    paddingTop: 8,
    gap: 12,
  },
});
