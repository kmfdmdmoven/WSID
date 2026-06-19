import * as Haptics from 'expo-haptics';
import { getSettings } from './storage';

async function isEnabled(): Promise<boolean> {
  const settings = await getSettings();
  return settings.hapticsEnabled;
}

export async function lightImpact(): Promise<void> {
  if (!(await isEnabled())) {
    return;
  }
  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}

export async function selectionChanged(): Promise<void> {
  if (!(await isEnabled())) {
    return;
  }
  await Haptics.selectionAsync();
}

export async function successNotification(): Promise<void> {
  if (!(await isEnabled())) {
    return;
  }
  await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
}
