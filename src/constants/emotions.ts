import type { Emotion } from '../types';

export interface EmotionDefinition {
  id: Emotion;
  icon: string; // Feather icon name
  labelKey: string;
  isPositive: boolean;
}

export const EMOTIONS: EmotionDefinition[] = [
  { id: 'loveIt',           icon: 'heart',  labelKey: 'emotions.loveIt',           isPositive: true },
  { id: 'feelsRight',       icon: 'smile',  labelKey: 'emotions.feelsRight',       isPositive: true },
  { id: 'doesntFeelRight',  icon: 'meh',    labelKey: 'emotions.doesntFeelRight',  isPositive: false },
  { id: 'disappointed',     icon: 'frown',  labelKey: 'emotions.disappointed',     isPositive: false },
];

export function isPositiveEmotion(emotion: Emotion): boolean {
  return EMOTIONS.find((e) => e.id === emotion)?.isPositive ?? false;
}

export function getInsightTone(emotion: Emotion): 'feelsRight' | 'notSure' | 'disappointed' {
  if (emotion === 'loveIt' || emotion === 'feelsRight') return 'feelsRight';
  if (emotion === 'disappointed') return 'disappointed';
  return 'notSure';
}
