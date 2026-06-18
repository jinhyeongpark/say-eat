import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useColors, usePreferences, useStrings, Theme, Language } from '../src/context/PreferencesContext';
import { FF } from '../src/constants/Typography';

export default function PreferencesScreen() {
  const router = useRouter();
  const colors = useColors();
  const s = useStrings();
  const { theme, language, setTheme, setLanguage } = usePreferences();

  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backArrow}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{s.prefsTitle}</Text>
        <View style={{ width: 32 }} />
      </View>

      <View style={styles.content}>
        {/* 테마 */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{s.prefsTheme}</Text>
          <View style={styles.toggleRow}>
            <ToggleBtn
              label={s.prefsDark}
              active={theme === 'dark'}
              onPress={() => setTheme('dark')}
              styles={styles}
            />
            <ToggleBtn
              label={s.prefsLight}
              active={theme === 'light'}
              onPress={() => setTheme('light')}
              styles={styles}
            />
          </View>
        </View>

        {/* 언어 */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>{s.prefsLanguage}</Text>
          <View style={styles.toggleRow}>
            <ToggleBtn
              label="한국어"
              active={language === 'ko'}
              onPress={() => setLanguage('ko')}
              styles={styles}
            />
            <ToggleBtn
              label="English"
              active={language === 'en'}
              onPress={() => setLanguage('en')}
              styles={styles}
            />
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

function ToggleBtn({
  label,
  active,
  onPress,
  styles,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  styles: ReturnType<typeof makeStyles>;
}) {
  return (
    <TouchableOpacity
      style={[styles.toggleBtn, active && styles.toggleBtnActive]}
      onPress={onPress}
    >
      <Text style={[styles.toggleBtnText, active && styles.toggleBtnTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function makeStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.bg },
    header: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: 16, paddingVertical: 12,
      borderBottomWidth: 1, borderBottomColor: colors.border,
    },
    backBtn: { width: 32, alignItems: 'flex-start' },
    backArrow: { fontSize: 28, color: colors.textMuted, lineHeight: 32 },
    headerTitle: { fontSize: 15, fontWeight: '700', color: colors.text, fontFamily: FF },
    content: { padding: 20, gap: 16 },
    section: {
      backgroundColor: colors.surface, borderRadius: 16,
      borderWidth: 1, borderColor: colors.border, padding: 16, gap: 12,
    },
    sectionLabel: {
      fontSize: 10, color: colors.textFaint, fontFamily: FF,
      textTransform: 'uppercase', letterSpacing: 0.5,
    },
    toggleRow: { flexDirection: 'row', gap: 10 },
    toggleBtn: {
      flex: 1, paddingVertical: 11, alignItems: 'center',
      backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border,
      borderRadius: 12,
    },
    toggleBtnActive: {
      backgroundColor: colors.accentDim,
      borderColor: colors.accent,
    },
    toggleBtnText: { fontSize: 13, fontWeight: '600', color: colors.textMuted, fontFamily: FF },
    toggleBtnTextActive: { color: colors.accent },
  });
}
