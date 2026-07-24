import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { DecisionSession, Emotion } from '../types';
import { pickRandomOption, resolveInsightOption } from '../utils/decisionLogic';

export interface RevealPick {
  selected: string;
  alternative: string;
  revealedOption: 'a' | 'b';
}

interface DecisionContextValue {
  session: DecisionSession;
  sessionId: string | null;
  setSessionId: (id: string | null) => void;
  setQuestion: (question: string) => void;
  setOptionA: (optionA: string) => void;
  setOptionB: (optionB: string) => void;
  runReveal: () => RevealPick;
  setEmotion: (emotion: Emotion) => void;
  resetSession: () => void;
}

const initialSession = (): DecisionSession => ({
  question: '',
  optionA: '',
  optionB: '',
  selectedOption: '',
  alternativeOption: '',
  emotion: null,
  insightOption: '',
});

const DecisionContext = createContext<DecisionContextValue | null>(null);

export function DecisionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<DecisionSession>(initialSession);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const setQuestion = useCallback((question: string) => {
    setSession((prev) => ({ ...prev, question }));
  }, []);

  const setOptionA = useCallback((optionA: string) => {
    setSession((prev) => ({ ...prev, optionA }));
  }, []);

  const setOptionB = useCallback((optionB: string) => {
    setSession((prev) => ({ ...prev, optionB }));
  }, []);

  const runReveal = useCallback((): RevealPick => {
    const { selected, alternative } = pickRandomOption(session.optionA, session.optionB);
    setSession((prev) => ({
      ...prev,
      selectedOption: selected,
      alternativeOption: alternative,
      emotion: null,
      insightOption: '',
    }));
    return {
      selected,
      alternative,
      revealedOption: selected === session.optionA ? 'a' : 'b',
    };
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
    setSessionId(null);
  }, []);

  const value = useMemo(
    () => ({
      session,
      sessionId,
      setSessionId,
      setQuestion,
      setOptionA,
      setOptionB,
      runReveal,
      setEmotion,
      resetSession,
    }),
    [session, sessionId, setQuestion, setOptionA, setOptionB, runReveal, setEmotion, resetSession],
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
