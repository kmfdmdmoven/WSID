import type { Emotion } from '../types';

export interface EmotionDefinition {
  id: Emotion;
  emoji: string;
  rgb: string; // ring color as "r,g,b" for rgba() glow
  labelKey: string;
  isPositive: boolean;
}

export const EMOTIONS: EmotionDefinition[] = [
  { id: 'loveIt',           emoji: '🤩', rgb: '234,179,8',  labelKey: 'emotions.loveIt',           isPositive: true },
  { id: 'feelsRight',       emoji: '😌', rgb: '74,144,226', labelKey: 'emotions.feelsRight',       isPositive: true },
  { id: 'doesntFeelRight',  emoji: '😕', rgb: '139,92,246', labelKey: 'emotions.doesntFeelRight',  isPositive: false },
  { id: 'disappointed',     emoji: '😞', rgb: '226,88,88',  labelKey: 'emotions.disappointed',     isPositive: false },
];

export function isPositiveEmotion(emotion: Emotion): boolean {
  return EMOTIONS.find((e) => e.id === emotion)?.isPositive ?? false;
}

export function getInsightTone(emotion: Emotion): 'feelsRight' | 'notSure' | 'disappointed' {
  if (emotion === 'loveIt' || emotion === 'feelsRight') return 'feelsRight';
  if (emotion === 'disappointed') return 'disappointed';
  return 'notSure';
}
