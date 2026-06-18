import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LogEntry } from '../src/hooks/useNutritionLogs';
import { useColors, useStrings } from '../src/context/PreferencesContext';
import { FF } from '../src/constants/Typography';

interface Props {
  item: LogEntry;
  onDelete: () => void;
}

export default function FoodItem({ item, onDelete }: Props) {
  const colors = useColors();
  const s = useStrings();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <View style={styles.card}>
      <View style={styles.info}>
        <View style={styles.topRow}>
          <Text style={styles.name}>{item.name}</Text>
          <Text style={styles.calories}>{item.calories} kcal</Text>
        </View>
        <View style={styles.macros}>
          <Text style={styles.macroText}>{s.carbsShort} <Text style={[styles.macroVal, { color: colors.carbs }]}>{item.carbs}g</Text></Text>
          <Text style={styles.macroText}>{s.proteinShort} <Text style={[styles.macroVal, { color: colors.protein }]}>{item.protein}g</Text></Text>
          <Text style={styles.macroText}>{s.fatShort} <Text style={[styles.macroVal, { color: colors.fat }]}>{item.fat}g</Text></Text>
        </View>
        {item.tags?.length > 0 && (
          <View style={styles.tags}>
            {item.tags.map((tag, i) => (
              <View key={i} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
      <TouchableOpacity onPress={onDelete} style={styles.deleteBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
        <Text style={styles.deleteIcon}>✕</Text>
      </TouchableOpacity>
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    card: {
      flexDirection: 'row', alignItems: 'center',
      backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
      borderRadius: 16, padding: 16, marginBottom: 10,
    },
    info: { flex: 1, paddingRight: 12 },
    topRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
    name: { fontSize: 14, fontWeight: '600', color: colors.text, flex: 1, fontFamily: FF },
    calories: { fontSize: 11, fontWeight: '700', color: colors.textMuted, fontFamily: FF },
    macros: { flexDirection: 'row', gap: 10, marginTop: 4 },
    macroText: { fontSize: 10, color: colors.textDim, fontFamily: FF },
    macroVal: { fontWeight: '700', fontFamily: FF },
    tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
    tag: {
      paddingHorizontal: 8, paddingVertical: 2,
      backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border,
      borderRadius: 999,
    },
    tagText: { fontSize: 9, color: colors.textDim, fontWeight: '500', fontFamily: FF },
    deleteBtn: { padding: 4 },
    deleteIcon: { fontSize: 12, color: colors.textFaint },
  });
}
