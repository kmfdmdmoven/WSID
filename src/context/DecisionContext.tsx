import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import {
  DEFAULT_OPTION_A,
  DEFAULT_OPTION_B,
  DEFAULT_QUESTION,
} from '../constants/copy';
import type { DecisionSession, Emotion } from '../types';
import { pickRandomOption, resolveInsightOption } from '../utils/decisionLogic';

interface DecisionContextValue {
  session: DecisionSession;
  setQuestion: (question: string) => void;
  setOptionA: (optionA: string) => void;
  setOptionB: (optionB: string) => void;
  runReveal: () => void;
  setEmotion: (emotion: Emotion) => void;
  resetSession: () => void;
}

const initialSession = (): DecisionSession => ({
  question: DEFAULT_QUESTION,
  optionA: DEFAULT_OPTION_A,
  optionB: DEFAULT_OPTION_B,
  selectedOption: '',
  alternativeOption: '',
  emotion: null,
  insightOption: '',
});

const DecisionContext = createContext<DecisionContextValue | null>(null);

export function DecisionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<DecisionSession>(initialSession);

  const setQuestion = useCallback((question: string) => {
    setSession((prev) => ({ ...prev, question }));
  }, []);

  const setOptionA = useCallback((optionA: string) => {
    setSession((prev) => ({ ...prev, optionA }));
  }, []);

  const setOptionB = useCallback((optionB: string) => {
    setSession((prev) => ({ ...prev, optionB }));
  }, []);

  const runReveal = useCallback(() => {
    const { selected, alternative } = pickRandomOption(session.optionA, session.optionB);
    setSession((prev) => ({
      ...prev,
      selectedOption: selected,
      alternativeOption: alternative,
      emotion: null,
      insightOption: '',
    }));
  }, [session.optionA, session.optionB]);

  const setEmotion = useCallback(
    (emotion: Emotion) => {
      const insightOption = resolveInsightOption(
        session.selectedOption,
        session.alternativeOption,
        emotion,
      );
      setSession((prev) => ({ ...prev, emotion, insightOption }));
    },
    [session.selectedOption, session.alternativeOption],
  );

  const resetSession = useCallback(() => {
    setSession(initialSession());
  }, []);

  const value = useMemo(
    () => ({
      session,
      setQuestion,
      setOptionA,
      setOptionB,
      runReveal,
      setEmotion,
      resetSession,
    }),
    [session, setQuestion, setOptionA, setOptionB, runReveal, setEmotion, resetSession],
  );

  return <DecisionContext.Provider value={value}>{children}</DecisionContext.Provider>;
}

export function useDecision(): DecisionContextValue {
  const context = useContext(DecisionContext);
  if (!context) {
    throw new Error('useDecision must be used within DecisionProvider');
  }
  return context;
}
