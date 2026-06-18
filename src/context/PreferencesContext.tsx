import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DarkColors, LightColors } from '../constants/Colors';
import { strings } from '../i18n';

export type Theme = 'dark' | 'light';
export type Language = 'ko' | 'en';

interface Preferences {
  theme: Theme;
  language: Language;
  setTheme: (t: Theme) => void;
  setLanguage: (l: Language) => void;
}

const PreferencesContext = createContext<Preferences>({
  theme: 'dark',
  language: 'ko',
  setTheme: () => {},
  setLanguage: () => {},
});

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('dark');
  const [language, setLanguageState] = useState<Language>('ko');

  useEffect(() => {
    AsyncStorage.multiGet(['theme', 'language']).then(pairs => {
      const t = pairs[0][1];
      const l = pairs[1][1];
      if (t === 'light' || t === 'dark') setThemeState(t);
      if (l === 'ko' || l === 'en') setLanguageState(l as Language);
    });
  }, []);

  const setTheme = (t: Theme) => {
    setThemeState(t);
    AsyncStorage.setItem('theme', t);
  };

  const setLanguage = (l: Language) => {
    setLanguageState(l);
    AsyncStorage.setItem('language', l);
  };

  return (
    <PreferencesContext.Provider value={{ theme, language, setTheme, setLanguage }}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  return useContext(PreferencesContext);
}

export function useColors() {
  const { theme } = usePreferences();
  return theme === 'dark' ? DarkColors : LightColors;
}

export function useStrings() {
  const { language } = usePreferences();
  return strings[language];
}
