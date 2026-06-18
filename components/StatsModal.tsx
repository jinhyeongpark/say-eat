import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import { useWeeklyStats } from '../src/hooks/useWeeklyStats';
import { useColors, useStrings } from '../src/context/PreferencesContext';
import { FF } from '../src/constants/Typography';

const MAX_BAR_H = 120;

function getToday() {
  return new Date().toISOString().split('T')[0];
}

function getDefaultWeekStart() {
  const d = new Date();
  d.setDate(d.getDate() - 6);
  return d.toISOString().split('T')[0];
}

function shiftWeek(weekStart: string, delta: number) {
  const d = new Date(weekStart);
  d.setDate(d.getDate() + delta);
  return d.toISOString().split('T')[0];
}

function formatWeekLabel(weekStart: string) {
  const start = new Date(weekStart);
  const end = new Date(weekStart);
  end.setDate(end.getDate() + 6);
  const fmt = (d: Date) => `${d.getMonth() + 1}.${String(d.getDate()).padStart(2, '0')}`;
  return `${start.getFullYear()} ${fmt(start)} ~ ${fmt(end)}`;
}

interface Props {
  visible: boolean;
  userId: string | null;
  onClose: () => void;
}

export default function StatsModal({ visible, userId, onClose }: Props) {
  const colors = useColors();
  const s = useStrings();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [weekStart, setWeekStart] = useState(getDefaultWeekStart);
  const today = getToday();
  const canGoNext = shiftWeek(weekStart, 7) <= today;

  const prevWeek = () => setWeekStart(w => shiftWeek(w, -7));
  const nextWeek = () => { if (canGoNext) setWeekStart(w => shiftWeek(w, 7)); };

  const swipeGesture = Gesture.Pan()
    .activeOffsetX([-20, 20])
    .failOffsetY([-20, 20])
    .onEnd((e) => {
      'worklet';
      if (e.translationX < -50) runOnJS(nextWeek)();
      else if (e.translationX > 50) runOnJS(prevWeek)();
    });

  const stats = useWeeklyStats(userId, weekStart);
  const maxCalories = Math.max(...stats.map(st => st.calories), 1);

  const totalCalories = stats.reduce((sum, d) => sum + d.calories, 0);
  const totalCarbs = stats.reduce((sum, d) => sum + d.carbs, 0);
  const totalProtein = stats.reduce((sum, d) => sum + d.protein, 0);
  const totalFat = stats.reduce((sum, d) => sum + d.fat, 0);
  const avgCalories = Math.round(totalCalories / 7);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={styles.box}>

          <View style={styles.weekNav}>
            <TouchableOpacity onPress={prevWeek} style={styles.navBtn}>
              <Text style={styles.navArrow}>‹</Text>
            </TouchableOpacity>
            <Text style={styles.weekLabel}>{formatWeekLabel(weekStart)}</Text>
            <TouchableOpacity onPress={nextWeek} style={styles.navBtn} disabled={!canGoNext}>
              <Text style={[styles.navArrow, !canGoNext && styles.navArrowDisabled]}>›</Text>
            </TouchableOpacity>
          </View>

          <GestureDetector gesture={swipeGesture}>
            <View style={styles.chart}>
              {stats.map(day => {
                const barH = day.calories > 0
                  ? Math.max((day.calories / maxCalories) * MAX_BAR_H, 4)
                  : 0;
                const isToday = day.date === today;
                return (
                  <View key={day.date} style={styles.barCol}>
                    <Text style={styles.calLabel}>
                      {day.calories > 0 ? day.calories : ''}
                    </Text>
                    <View style={styles.barContainer}>
                      <View style={[styles.bar, { height: barH }]}>
                        <View style={{ flex: day.carbs * 4, backgroundColor: colors.carbs }} />
                        <View style={{ flex: day.protein * 4, backgroundColor: colors.protein }} />
                        <View style={{ flex: day.fat * 9, backgroundColor: colors.fat }} />
                      </View>
                    </View>
                    <Text style={[styles.dayLabel, isToday && styles.dayLabelToday]}>
                      {s.days[new Date(day.date).getDay()]}
                    </Text>
                    <Text style={styles.dateLabel}>
                      {day.date.slice(5).replace('-', '.')}
                    </Text>
                  </View>
                );
              })}
            </View>
          </GestureDetector>

          <View style={styles.divider} />
          <View style={styles.summary}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryTitle}>{s.weeklyTotal}</Text>
              <Text style={styles.summaryAvg}>{s.dailyAvg(avgCalories)}</Text>
            </View>
            <View style={styles.macroRow}>
              <MacroChip label={s.statsCarbs} value={`${totalCarbs}g`} color={colors.carbs} />
              <MacroChip label={s.statsProtein} value={`${totalProtein}g`} color={colors.protein} />
              <MacroChip label={s.statsFat} value={`${totalFat}g`} color={colors.fat} />
              <MacroChip label={s.statsCalories} value={`${totalCalories}`} color={colors.accent} />
            </View>
          </View>

        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

function MacroChip({ label, value, color }: { label: string; value: string; color: string }) {
  const colors = useColors();
  const styles = useMemo(() => makeChipStyles(colors), [colors]);

  return (
    <View style={styles.chip}>
      <Text style={[styles.chipValue, { color }]}>{value}</Text>
      <Text style={styles.chipLabel}>{label}</Text>
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    overlay: {
      flex: 1, backgroundColor: 'rgba(0,0,0,0.6)',
      alignItems: 'center', justifyContent: 'center',
    },
    box: {
      width: 340, backgroundColor: colors.surface,
      borderWidth: 1, borderColor: colors.border,
      borderRadius: 20, padding: 16,
    },
    weekNav: {
      flexDirection: 'row', alignItems: 'center',
      justifyContent: 'space-between', marginBottom: 16,
    },
    navBtn: { padding: 4 },
    navArrow: { fontSize: 22, color: colors.textMuted, fontFamily: FF },
    navArrowDisabled: { color: colors.textFaint },
    weekLabel: { fontSize: 12, fontWeight: '600', color: colors.textMuted, fontFamily: FF },
    chart: {
      flexDirection: 'row', justifyContent: 'space-between',
      alignItems: 'flex-end', paddingHorizontal: 4,
    },
    barCol: { alignItems: 'center', flex: 1 },
    calLabel: {
      fontSize: 8, color: colors.textFaint, fontFamily: FF,
      marginBottom: 2, textAlign: 'center',
    },
    barContainer: {
      height: MAX_BAR_H, justifyContent: 'flex-end', alignItems: 'center',
    },
    bar: {
      width: 26, borderRadius: 4, overflow: 'hidden', flexDirection: 'column',
    },
    dayLabel: {
      fontSize: 10, color: colors.textDim, fontFamily: FF, marginTop: 6,
    },
    dayLabelToday: { color: colors.accent, fontWeight: '700' },
    dateLabel: { fontSize: 8, color: colors.textFaint, fontFamily: FF, marginTop: 1 },
    divider: { height: 1, backgroundColor: colors.border, marginVertical: 12 },
    summary: { gap: 8 },
    summaryRow: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    },
    summaryTitle: { fontSize: 11, fontWeight: '700', color: colors.textDim, fontFamily: FF },
    summaryAvg: { fontSize: 11, color: colors.textFaint, fontFamily: FF },
    macroRow: { flexDirection: 'row', justifyContent: 'space-between' },
  });
}

function makeChipStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    chip: { alignItems: 'center', flex: 1 },
    chipValue: { fontSize: 13, fontWeight: '700', fontFamily: FF },
    chipLabel: { fontSize: 9, color: colors.textFaint, marginTop: 2, fontFamily: FF },
  });
}
