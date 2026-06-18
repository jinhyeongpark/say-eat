import React, { useState, useEffect, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView,
} from 'react-native';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../src/config/firebase';
import { useAuth } from '../../src/hooks/useAuth';
import { useColors, useStrings } from '../../src/context/PreferencesContext';
import { LogEntry } from '../../src/hooks/useNutritionLogs';

interface DaySummary {
  date: string;
  totalCal: number;
  totalCarbs: number;
  totalProtein: number;
  totalFat: number;
  itemCount: number;
}

export default function HistoryScreen() {
  const colors = useColors();
  const s = useStrings();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const { user } = useAuth();
  const [history, setHistory] = useState<DaySummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    loadHistory();
  }, [user]);

  const loadHistory = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const logsRef = collection(db, 'users', user.uid, 'logs');
      const logsSnap = await getDocs(logsRef);

      const summaries: DaySummary[] = [];
      for (const dateDoc of logsSnap.docs) {
        const date = dateDoc.id;
        const itemsRef = collection(db, 'users', user.uid, 'logs', date, 'items');
        const itemsSnap = await getDocs(query(itemsRef, orderBy('createdAt')));
        const items = itemsSnap.docs.map(d => d.data() as LogEntry);

        if (items.length === 0) continue;

        const totalCarbs = items.reduce((sum, i) => sum + i.carbs, 0);
        const totalProtein = items.reduce((sum, i) => sum + i.protein, 0);
        const totalFat = items.reduce((sum, i) => sum + i.fat, 0);

        summaries.push({
          date,
          totalCal: totalCarbs * 4 + totalProtein * 4 + totalFat * 9,
          totalCarbs, totalProtein, totalFat,
          itemCount: items.length,
        });
      }

      summaries.sort((a, b) => b.date.localeCompare(a.date));
      setHistory(summaries);
    } finally {
      setLoading(false);
    }
  };

  const getCalorieColor = (cal: number) => {
    if (cal < 1200) return colors.protein;
    if (cal <= 2200) return colors.accent;
    return colors.fat;
  };

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.pulse} />
          <Text style={styles.headerTitle}>{s.historyTitle}</Text>
        </View>
        <TouchableOpacity onPress={loadHistory}>
          <Text style={styles.refreshBtn}>{s.refresh}</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {loading ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>{s.loading}</Text>
          </View>
        ) : history.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyText}>{s.historyEmpty}</Text>
            <Text style={styles.emptyHint}>{s.historyEmptyHint}</Text>
          </View>
        ) : (
          history.map(day => (
            <View key={day.date} style={styles.card}>
              <View style={styles.cardTop}>
                <Text style={styles.cardDate}>{day.date}</Text>
                <View style={[styles.calBadge, { borderColor: getCalorieColor(day.totalCal) }]}>
                  <Text style={[styles.calText, { color: getCalorieColor(day.totalCal) }]}>
                    {day.totalCal} kcal
                  </Text>
                </View>
              </View>
              <View style={styles.cardMacros}>
                <Text style={styles.macroTag}>{s.historyCarbs} <Text style={{ color: colors.carbs }}>{day.totalCarbs}g</Text></Text>
                <Text style={styles.macroTag}>{s.historyProtein} <Text style={{ color: colors.protein }}>{day.totalProtein}g</Text></Text>
                <Text style={styles.macroTag}>{s.historyFat} <Text style={{ color: colors.fat }}>{day.totalFat}g</Text></Text>
                <Text style={styles.itemCount}>{s.historyMeals(day.itemCount)}</Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function makeStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.bg },
    header: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingHorizontal: 20, paddingVertical: 14,
      borderBottomWidth: 1, borderBottomColor: colors.border,
    },
    headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    pulse: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accent },
    headerTitle: { fontSize: 14, fontWeight: '800', color: colors.textMuted, letterSpacing: 2 },
    refreshBtn: { fontSize: 11, color: colors.textDim },
    content: { padding: 20, gap: 10 },
    card: {
      backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
      borderRadius: 16, padding: 16,
    },
    cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
    cardDate: { fontSize: 14, fontWeight: '700', color: colors.text },
    calBadge: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 },
    calText: { fontSize: 12, fontWeight: '700' },
    cardMacros: { flexDirection: 'row', gap: 12, alignItems: 'center' },
    macroTag: { fontSize: 11, color: colors.textDim },
    itemCount: { fontSize: 10, color: colors.textFaint, marginLeft: 'auto' },
    empty: { alignItems: 'center', paddingTop: 80, gap: 8 },
    emptyIcon: { fontSize: 40 },
    emptyText: { fontSize: 14, color: colors.textDim },
    emptyHint: { fontSize: 11, color: colors.textFaint },
  });
}
