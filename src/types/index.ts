export type Emotion = 'loveIt' | 'feelsRight' | 'doesntFeelRight' | 'disappointed';

export type NeuralMode =
  | 'idle'
  | 'thinking'
  | 'activating'
  | 'converging'
  | 'result'
  | 'emotionPositive'
  | 'emotionNegative'
  | 'discovery';

export type Language = 'en' | 'uk';

export interface DecisionSession {
  question: string;
  optionA: string;
  optionB: string;
  selectedOption: string;
  alternativeOption: string;
  emotion: Emotion | null;
  insightOption: string;
}

export interface AppSettings {
  language: Language;
  soundEnabled: boolean;
  hapticsEnabled: boolean;
}

export type RootStackParamList = {
  Welcome: undefined;
  Auth: undefined;
  Question: undefined;
  RevealAnimation: undefined;
  Result: undefined;
  Insight: undefined;
  AdPlaceholder: undefined;
  ActionHub: undefined;
  AppHub: undefined;
  EarlyAccess: undefined;
  Settings: undefined;
};
