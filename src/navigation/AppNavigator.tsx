import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { colors } from '../constants/colors';
import type { RootStackParamList } from '../types';
import { WelcomeScreen } from '../screens/WelcomeScreen';
import { AuthScreen } from '../screens/AuthScreen';
import { QuestionScreen } from '../screens/QuestionScreen';
import { RevealAnimationScreen } from '../screens/RevealAnimationScreen';
import { ResultScreen } from '../screens/ResultScreen';
import { InsightScreen } from '../screens/InsightScreen';
import { AdPlaceholderScreen } from '../screens/AdPlaceholderScreen';
import { ActionHubScreen } from '../screens/ActionHubScreen';
import { AppHubScreen } from '../screens/AppHubScreen';
import { EarlyAccessScreen } from '../screens/EarlyAccessScreen';
import { SettingsScreen } from '../screens/SettingsScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function AppNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        animation: 'fade',
      }}
    >
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="Auth" component={AuthScreen} />
      <Stack.Screen name="Question" component={QuestionScreen} />
      <Stack.Screen name="RevealAnimation" component={RevealAnimationScreen} />
      <Stack.Screen name="Result" component={ResultScreen} />
      <Stack.Screen name="Insight" component={InsightScreen} />
      <Stack.Screen name="AdPlaceholder" component={AdPlaceholderScreen} />
      <Stack.Screen name="ActionHub" component={ActionHubScreen} />
      <Stack.Screen name="AppHub" component={AppHubScreen} />
      <Stack.Screen name="EarlyAccess" component={EarlyAccessScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
    </Stack.Navigator>
  );
}
