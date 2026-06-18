import React, { useState, useEffect, useMemo } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  StyleSheet, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useAuth } from '../src/hooks/useAuth';
import { db } from '../src/config/firebase';
import { FoodConfig, DEFAULT_FOOD_CONFIG } from '../src/hooks/useCustomFoods';
import { useColors, useStrings } from '../src/context/PreferencesContext';
import { FF } from '../src/constants/Typography';

export default function ProteinSettingsScreen() {
  const colors = useColors();
  const s = useStrings();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const router = useRouter();
  const { user } = useAuth();
  const [protein, setProtein] = useState<FoodConfig>({ ...DEFAULT_FOOD_CONFIG, servingLabel: '1스쿱' });
  const [chicken, setChicken] = useState<FoodConfig>({ ...DEFAULT_FOOD_CONFIG, servingLabel: '1팩' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    getDoc(doc(db, 'users', user.uid, 'settings', 'customFoods')).then(snap => {
      if (!snap.exists()) return;
      const data = snap.data();
      if (data.protein) setProtein(data.protein);
      if (data.chicken) setChicken(data.chicken);
    });
  }, [user?.uid]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await setDoc(doc(db, 'users', user.uid, 'settings', 'customFoods'), { protein, chicken });
      Alert.alert(s.saveSuccess, s.saveSuccessMsg, [
        { text: s.ok, onPress: () => router.back() },
      ]);
    } catch {
      Alert.alert(s.saveError, s.saveErrorMsg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backArrow}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{s.proteinSettingsTitle}</Text>
        <View style={{ width: 32 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.desc}>{s.proteinSettingsDesc}</Text>

          <FoodSection
            emoji="💪"
            title={s.proteinShakeLabel}
            config={protein}
            onChange={setProtein}
            colors={colors}
            styles={styles}
            s={s}
          />

          <FoodSection
            emoji="🍗"
            title={s.chickenLabel}
            config={chicken}
            onChange={setChicken}
            colors={colors}
            styles={styles}
            s={s}
          />

          <TouchableOpacity
            style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            <Text style={styles.saveBtnText}>{saving ? s.saving : s.save}</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function FoodSection({ emoji, title, config, onChange, colors, styles, s }: {
  emoji: string;
  title: string;
  config: FoodConfig;
  onChange: (c: FoodConfig) => void;
  colors: ReturnType<typeof useColors>;
  styles: ReturnType<typeof makeStyles>;
  s: ReturnType<typeof useStrings>;
}) {
  const set = (key: keyof FoodConfig) => (val: string) => onChange({ ...config, [key]: val });

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionEmoji}>{emoji}</Text>
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>

      <Field label={s.brandLabel} value={config.name} onChangeText={set('name')}
        placeholder="예: 머슬팜 웨이프로틴 초코" colors={colors} styles={styles} />
      <Field label={s.servingSizeLabel} value={config.servingLabel} onChangeText={set('servingLabel')}
        placeholder="예: 1스쿱 (30g)" colors={colors} styles={styles} />

      <View style={styles.macroGrid}>
        <NumField label={s.carbsGLabel} value={config.carbs} onChangeText={set('carbs')} color={colors.carbs} colors={colors} styles={styles} />
        <NumField label={s.proteinGLabel} value={config.protein} onChangeText={set('protein')} color={colors.protein} colors={colors} styles={styles} />
        <NumField label={s.fatGLabel} value={config.fat} onChangeText={set('fat')} color={colors.fat} colors={colors} styles={styles} />
        <NumField label={s.caloriesLabel} value={config.calories} onChangeText={set('calories')} color={colors.accent} colors={colors} styles={styles} />
      </View>
    </View>
  );
}

function Field({ label, value, onChangeText, placeholder, colors, styles }: {
  label: string; value: string; onChangeText: (v: string) => void; placeholder?: string;
  colors: ReturnType<typeof useColors>; styles: ReturnType<typeof makeStyles>;
}) {
  return (
    <View style={styles.fieldRow}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={styles.fieldInput}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textFaint}
      />
    </View>
  );
}

function NumField({ label, value, onChangeText, color, colors, styles }: {
  label: string; value: string; onChangeText: (v: string) => void; color: string;
  colors: ReturnType<typeof useColors>; styles: ReturnType<typeof makeStyles>;
}) {
  return (
    <View style={styles.numField}>
      <Text style={[styles.numLabel, { color }]}>{label}</Text>
      <TextInput
        style={styles.numInput}
        value={value}
        onChangeText={onChangeText}
        keyboardType="decimal-pad"
        placeholder="0"
        placeholderTextColor={colors.textFaint}
      />
    </View>
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
    content: { padding: 20, gap: 24, paddingBottom: 40 },
    desc: {
      fontSize: 12, color: colors.textDim, fontFamily: FF, lineHeight: 18,
      backgroundColor: colors.surface, borderRadius: 12, padding: 14,
      borderWidth: 1, borderColor: colors.border,
    },
    section: {
      backgroundColor: colors.surface, borderRadius: 16,
      borderWidth: 1, borderColor: colors.border, padding: 16, gap: 12,
    },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
    sectionEmoji: { fontSize: 20 },
    sectionTitle: { fontSize: 14, fontWeight: '700', color: colors.text, fontFamily: FF },
    fieldRow: { gap: 6 },
    fieldLabel: { fontSize: 10, color: colors.textFaint, fontFamily: FF, textTransform: 'uppercase', letterSpacing: 0.5 },
    fieldInput: {
      backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border,
      borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9,
      fontSize: 13, color: colors.text, fontFamily: FF,
    },
    macroGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 4 },
    numField: { width: '47%', gap: 6 },
    numLabel: { fontSize: 10, fontFamily: FF, textTransform: 'uppercase', letterSpacing: 0.5 },
    numInput: {
      backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border,
      borderRadius: 10, paddingHorizontal: 12, paddingVertical: 9,
      fontSize: 15, fontWeight: '700', color: colors.text, fontFamily: FF,
      textAlign: 'center',
    },
    saveBtn: {
      backgroundColor: colors.accent, borderRadius: 14,
      paddingVertical: 14, alignItems: 'center',
    },
    saveBtnDisabled: { backgroundColor: colors.accentDim },
    saveBtnText: { fontSize: 14, fontWeight: '700', color: colors.bg, fontFamily: FF },
  });
}
