import type { Emotion } from '../types';
import { getInsightTone } from '../constants/emotions';

export function getInsightKeys(emotion: Emotion): {
  headline: string;
  body: string;
  footer: string;
} {
  const tone = getInsightTone(emotion);
  return {
    headline: `insight.${tone}.headline`,
    body: `insight.${tone}.body`,
    footer: `insight.${tone}.footer`,
  };
}
