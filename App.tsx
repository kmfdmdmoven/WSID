import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StatusBar, StyleSheet, View } from 'react-native';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { I18nextProvider } from 'react-i18next';
import { DecisionProvider } from './src/context/DecisionContext';
import { NeuralProvider, useNeural } from './src/context/NeuralContext';
import { NeuralThoughtNetwork } from './src/components/NeuralThoughtNetwork';
import { AppNavigator } from './src/navigation/AppNavigator';
import i18n, { initI18n } from './src/i18n';
import { continueAsGuest } from './src/services/auth';
import { colors } from './src/constants/colors';

const navigationTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: 'transparent',
    card: colors.background,
    text: colors.textPrimary,
    border: colors.cardBorder,
    primary: colors.accentGold,
  },
};

function PersistentCanvas() {
  const { neuralMode, neuralIntensity } = useNeural();
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <NeuralThoughtNetwork
        mode={neuralMode}
        intensity={neuralIntensity}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}

export default function App() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    initI18n().finally(() => setReady(true));
    // Silent anonymous bootstrap: persistence is best effort, the ritual
    // must start regardless of network state.
    continueAsGuest().then((result) => {
      if (!result.ok) {
        console.log('[auth] Bootstrap failed, continuing offline', result.error.description);
      }
    });
  }, []);

  if (!ready) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.accentGold} size="large" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <I18nextProvider i18n={i18n}>
        <DecisionProvider>
          <NeuralProvider>
            <View style={styles.root}>
              <PersistentCanvas />
              <NavigationContainer theme={navigationTheme}>
                <StatusBar barStyle="light-content" />
                <AppNavigator />
              </NavigationContainer>
            </View>
          </NeuralProvider>
        </DecisionProvider>
      </I18nextProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loading: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
