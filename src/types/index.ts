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
  Registration: undefined;
  Question: undefined;
  Options: undefined;
  RevealAnimation: undefined;
  Result: undefined;
  ActionHub: undefined;
  History: undefined;
  EarlyAccess: undefined;
  Settings: undefined;
};
