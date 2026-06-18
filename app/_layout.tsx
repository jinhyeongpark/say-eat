import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../src/config/firebase';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PreferencesProvider, useColors, usePreferences } from '../src/context/PreferencesContext';

if (Platform.OS === 'web' && typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `* { scrollbar-width: none; -ms-overflow-style: none; } *::-webkit-scrollbar { display: none; }`;
  document.head.appendChild(style);
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PreferencesProvider>
        <AppShell />
      </PreferencesProvider>
    </GestureHandlerRootView>
  );
}

function AppShell() {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const router = useRouter();
  const segments = useSegments();
  const colors = useColors();
  const { theme } = usePreferences();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => setUser(u));
    return unsub;
  }, []);

  useEffect(() => {
    if (user === undefined) return;
    const inAuth = segments[0] === '(auth)';
    if (!user && !inAuth) {
      router.replace('/(auth)/login');
    } else if (user && inAuth) {
      router.replace('/(tabs)');
    }
  }, [user, segments]);

  const content = (
    <>
      <StatusBar style={theme === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false }} />
    </>
  );

  if (Platform.OS === 'web') {
    return (
      <View style={styles.webRoot}>
        <View style={[styles.webContainer, { backgroundColor: colors.bg }]}>
          {content}
        </View>
      </View>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  webRoot: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh' as any,
  },
  webContainer: {
    width: 430,
    height: '100vh' as any,
    maxHeight: 932,
    overflow: 'hidden',
    borderRadius: 0,
    position: 'relative',
    boxShadow: '0 0 60px rgba(0,0,0,0.8)' as any,
  },
});
