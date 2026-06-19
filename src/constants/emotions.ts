import type { Emotion } from '../types';

export interface EmotionDefinition {
  id: Emotion;
  emoji: string;
  labelKey: string;
  isPositive: boolean;
}

export const EMOTIONS: EmotionDefinition[] = [
  { id: 'loveIt', emoji: '❤️', labelKey: 'emotions.loveIt', isPositive: true },
  { id: 'feelsRight', emoji: '✨', labelKey: 'emotions.feelsRight', isPositive: true },
  { id: 'doesntFeelRight', emoji: '😕', labelKey: 'emotions.doesntFeelRight', isPositive: false },
  { id: 'disappointed', emoji: '😞', labelKey: 'emotions.disappointed', isPositive: false },
];

export function isPositiveEmotion(emotion: Emotion): boolean {
  return EMOTIONS.find((e) => e.id === emotion)?.isPositive ?? false;
}

export function getInsightTone(emotion: Emotion): 'feelsRight' | 'notSure' | 'disappointed' {
  if (emotion === 'loveIt' || emotion === 'feelsRight') return 'feelsRight';
  if (emotion === 'disappointed') return 'disappointed';
  return 'notSure';
}
