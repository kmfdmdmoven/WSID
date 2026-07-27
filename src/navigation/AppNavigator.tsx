import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../types';
import { WelcomeScreen } from '../screens/WelcomeScreen';
import { QuestionInputScreen } from '../screens/QuestionInputScreen';
import { OptionsScreen } from '../screens/OptionsScreen';
import { RegistrationScreen } from '../screens/RegistrationScreen';
import { RevealAnimationScreen } from '../screens/RevealAnimationScreen';
import { ResultScreen } from '../screens/ResultScreen';
import { AdPlaceholderScreen } from '../screens/AdPlaceholderScreen';
import { ActionHubScreen } from '../screens/ActionHubScreen';
import { HistoryScreen } from '../screens/HistoryScreen';
import { AppHubScreen } from '../screens/AppHubScreen';
import { EarlyAccessScreen } from '../screens/EarlyAccessScreen';
import { SettingsScreen } from '../screens/SettingsScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function AppNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: 'transparent' },
        animation: 'none',
      }}
    >
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="Question" component={QuestionInputScreen} />
      <Stack.Screen name="Options" component={OptionsScreen} />
      <Stack.Screen name="Registration" component={RegistrationScreen} />
      <Stack.Screen name="RevealAnimation" component={RevealAnimationScreen} />
      <Stack.Screen name="Result" component={ResultScreen} />
      <Stack.Screen name="AdPlaceholder" component={AdPlaceholderScreen} />
      <Stack.Screen name="ActionHub" component={ActionHubScreen} />
      <Stack.Screen name="History" component={HistoryScreen} />
      <Stack.Screen name="AppHub" component={AppHubScreen} />
      <Stack.Screen name="EarlyAccess" component={EarlyAccessScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
    </Stack.Navigator>
  );
}
