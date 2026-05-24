import React, { useState, useEffect, useCallback } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider }       from 'react-native-safe-area-context';
import * as SplashScreen          from 'expo-splash-screen';
import { StyleSheet }             from 'react-native';

import { SettingsProvider } from './src/context/SettingsContext';
import AppNavigator         from './src/navigation/AppNavigator';
import SplashAnimatedScreen from './src/screens/SplashScreen';
import { initAds }          from './src/ads/AdService';
import { registerDailyRefreshTask } from './src/utils/backgroundTasks';

// Keep the native splash visible until we're ready
SplashScreen.preventAutoHideAsync();

export default function App() {
  const [nativeReady,  setNativeReady]  = useState(false);
  const [showAnimated, setShowAnimated] = useState(true);

  /* Hide native splash as soon as fonts / assets are ready */
  const onLayoutRootView = useCallback(async () => {
    if (nativeReady) await SplashScreen.hideAsync();
  }, [nativeReady]);

  useEffect(() => {
    // Fire-and-forget — both self-no-op safely when running in Expo Go
    initAds();
    registerDailyRefreshTask();
    setNativeReady(true);
  }, []);

  return (
    <GestureHandlerRootView style={styles.root} onLayout={onLayoutRootView}>
      <SafeAreaProvider>
        <SettingsProvider>
          {showAnimated
            ? <SplashAnimatedScreen onFinish={() => setShowAnimated(false)} />
            : <AppNavigator />
          }
        </SettingsProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
