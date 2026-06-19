import type { Emotion } from '../types';
import { isPositiveEmotion } from '../constants/emotions';

export interface PickResult {
  selected: string;
  alternative: string;
}

export function pickRandomOption(optionA: string, optionB: string): PickResult {
  const pickA = Math.random() < 0.5;
  return {
    selected: pickA ? optionA : optionB,
    alternative: pickA ? optionB : optionA,
  };
}

export function resolveInsightOption(
  selected: string,
  alternative: string,
  emotion: Emotion,
): string {
  // Positive reaction: show the selected option (reinforces "you felt good about this")
  // Negative/neutral: return empty — showing the alternative highlighted would imply it is correct
  return isPositiveEmotion(emotion) ? selected : '';
}
