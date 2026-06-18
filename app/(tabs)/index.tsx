import React, { useState, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Alert, Modal, TextInput, Platform, KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useAuth } from '../../src/hooks/useAuth';
import { useNutritionLogs } from '../../src/hooks/useNutritionLogs';
import { useCustomFoods } from '../../src/hooks/useCustomFoods';
import { analyzeDiet, analyzeDietFromAudio } from '../../src/services/gemini';
import { useColors, useStrings } from '../../src/context/PreferencesContext';
import DonutChart from '../../components/DonutChart';
import FoodItem from '../../components/FoodItem';
import VoiceInputBar from '../../components/VoiceInputBar';
import StatsModal from '../../components/StatsModal';
import { FF } from '../../src/constants/Typography';

function confirmAlert(title: string, message: string, onConfirm?: () => void) {
  if (Platform.OS === 'web') {
    if (onConfirm) {
      if (window.confirm(`${title}\n\n${message}`)) onConfirm();
    } else {
      window.alert(`${title}\n\n${message}`);
    }
  } else {
    const buttons = onConfirm
      ? [
          { text: '취소', style: 'cancel' as const },
          { text: '영구 삭제', style: 'destructive' as const, onPress: onConfirm },
        ]
      : [{ text: '확인' }];
    Alert.alert(title, message, buttons);
  }
}

function getDateString(offset: number) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().split('T')[0];
}

export default function DashboardScreen() {
  const router = useRouter();
  const colors = useColors();
  const s = useStrings();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const { user, signOut } = useAuth();
  const customFoodsPrompt = useCustomFoods(user?.uid ?? null);
  const [date, setDate] = useState(getDateString(0));
  const [pendingCount, setPendingCount] = useState(0);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [headerHeight, setHeaderHeight] = useState(56);

  const formatDate = (dateStr: string) => {
    const today = getDateString(0);
    const yesterday = getDateString(-1);
    const tomorrow = getDateString(1);
    if (dateStr === today) return `${s.today}, ${dateStr}`;
    if (dateStr === yesterday) return `${s.yesterday}, ${dateStr}`;
    if (dateStr === tomorrow) return `${s.tomorrow}, ${dateStr}`;
    const d = new Date(dateStr);
    return `${dateStr} (${s.days[d.getDay()]})`;
  };

  const handleDeleteAccount = () => {
    setShowSettings(false);
    const doDelete = async () => {
      try { await user?.delete(); }
      catch { confirmAlert(s.deleteError, s.loginRetryError); }
    };
    confirmAlert(s.deleteAccountTitle, s.deleteAccountMsg, doDelete);
  };

  const { logs, addItems, deleteItem, clearDay } = useNutritionLogs(user?.uid ?? null, date);

  const totalCarbs = logs.reduce((sum, i) => sum + i.carbs, 0);
  const totalProtein = logs.reduce((sum, i) => sum + i.protein, 0);
  const totalFat = logs.reduce((sum, i) => sum + i.fat, 0);

  const changeDate = (offset: number) => {
    const d = new Date(date);
    d.setDate(d.getDate() + offset);
    setDate(d.toISOString().split('T')[0]);
  };

  const handleSubmit = (text: string) => {
    setPendingCount(c => c + 1);
    analyzeDiet(text, customFoodsPrompt)
      .then(items => { if (items.length > 0) return addItems(items); })
      .catch(() => {})
      .finally(() => setPendingCount(c => c - 1));
  };

  const handleAudioSubmit = (base64: string, mimeType: string) => {
    setPendingCount(c => c + 1);
    analyzeDietFromAudio(base64, mimeType, customFoodsPrompt)
      .then(items => { if (items.length > 0) return addItems(items); })
      .catch(() => {})
      .finally(() => setPendingCount(c => c - 1));
  };

  const swipeGesture = Gesture.Pan()
    .activeOffsetX([-20, 20])
    .failOffsetY([-20, 20])
    .onEnd((e) => {
      'worklet';
      if (e.translationX < -50) runOnJS(changeDate)(1);
      else if (e.translationX > 50) runOnJS(changeDate)(-1);
    });

  const handleClearDay = () => {
    confirmAlert(s.clearDayTitle, s.clearDayMsg, clearDay);
  };

  return (
    <SafeAreaView style={styles.root}>
      {/* 헤더 */}
      <View style={styles.header} onLayout={e => setHeaderHeight(e.nativeEvent.layout.height)}>
        <View style={styles.headerLeft}>
          <View style={styles.pulse} />
          <Text style={styles.headerTitle}>say eat</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={() => setShowStats(true)} style={styles.calBtn}>
            <Text style={styles.calIcon}>📊</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowCalendar(true)} style={styles.calBtn}>
            <Text style={styles.calIcon}>📅</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowSettings(v => !v)} style={styles.calBtn}>
            <Text style={styles.calIcon}>⚙️</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 통계 모달 */}
      <StatsModal
        visible={showStats}
        userId={user?.uid ?? null}
        onClose={() => setShowStats(false)}
      />

      {/* 캘린더 모달 */}
      <CalendarModal
        visible={showCalendar}
        currentDate={date}
        s={s}
        colors={colors}
        styles={styles}
        onSelect={(d) => { setDate(d); setShowCalendar(false); }}
        onClose={() => setShowCalendar(false)}
      />

      <GestureDetector gesture={swipeGesture}>
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            {/* 날짜 네비게이터 */}
            <View style={styles.dateNav}>
              <TouchableOpacity onPress={() => changeDate(-1)} style={styles.navBtn}>
                <Text style={styles.navArrow}>‹</Text>
              </TouchableOpacity>
              <Text style={styles.dateText}>{formatDate(date)}</Text>
              <TouchableOpacity onPress={() => changeDate(1)} style={styles.navBtn}>
                <Text style={styles.navArrow}>›</Text>
              </TouchableOpacity>
            </View>

            {/* 도넛 차트 */}
            <View style={styles.chartSection}>
              <DonutChart carbs={totalCarbs} protein={totalProtein} fat={totalFat} />
            </View>

            {/* 매크로 요약 바 */}
            <View style={styles.macroBar}>
              <View style={styles.macroItem}>
                <Text style={styles.macroLabel}>{s.carbs}</Text>
                <Text style={[styles.macroValue, { color: colors.carbs }]}>{totalCarbs}g</Text>
              </View>
              <View style={[styles.macroItem, styles.macroItemBorder]}>
                <Text style={styles.macroLabel}>{s.protein}</Text>
                <Text style={[styles.macroValue, { color: colors.protein }]}>{totalProtein}g</Text>
              </View>
              <View style={styles.macroItem}>
                <Text style={styles.macroLabel}>{s.fat}</Text>
                <Text style={[styles.macroValue, { color: colors.fat }]}>{totalFat}g</Text>
              </View>
            </View>

            {/* 식단 목록 */}
            <View style={styles.listSection}>
              <View style={styles.listHeader}>
                <Text style={styles.listTitle}>{s.todayMeals(logs.length)}</Text>
                {logs.length > 0 && (
                  <TouchableOpacity onPress={handleClearDay}>
                    <Text style={styles.clearBtn}>{s.clearAll}</Text>
                  </TouchableOpacity>
                )}
              </View>

              {logs.length === 0 ? (
                <View style={styles.empty}>
                  <Text style={styles.emptyIcon}>🍽</Text>
                  <Text style={styles.emptyText}>{s.emptyMeals}</Text>
                  <Text style={styles.emptyHint}>{s.emptyMealsHint}</Text>
                </View>
              ) : (
                logs.map(item => (
                  <FoodItem key={item.id} item={item} onDelete={() => deleteItem(item.id)} />
                ))
              )}
            </View>
          </ScrollView>

          {/* 하단 입력 */}
          <View style={styles.inputContainer}>
            <VoiceInputBar onSubmit={handleSubmit} onAudioSubmit={handleAudioSubmit} isLoading={pendingCount > 0} />
          </View>
        </KeyboardAvoidingView>
      </GestureDetector>

      {/* 설정 드롭다운 */}
      {showSettings && (
        <>
          <TouchableOpacity style={styles.settingsOverlay} activeOpacity={1} onPress={() => setShowSettings(false)} />
          <View style={[styles.dropdown, { top: headerHeight }]}>
            <TouchableOpacity style={styles.dropdownItem} onPress={() => { setShowSettings(false); router.push('/protein-settings'); }}>
              <Text style={styles.dropdownText}>{s.settingsProtein}</Text>
            </TouchableOpacity>
            <View style={styles.dropdownDivider} />
            <TouchableOpacity style={styles.dropdownItem} onPress={() => { setShowSettings(false); router.push('/preferences'); }}>
              <Text style={styles.dropdownText}>{s.settingsPreferences}</Text>
            </TouchableOpacity>
            <View style={styles.dropdownDivider} />
            <TouchableOpacity style={styles.dropdownItem} onPress={() => { setShowSettings(false); signOut(); }}>
              <Text style={styles.dropdownText}>{s.settingsLogout}</Text>
            </TouchableOpacity>
            <View style={styles.dropdownDivider} />
            <TouchableOpacity style={styles.dropdownItem} onPress={handleDeleteAccount}>
              <Text style={[styles.dropdownText, styles.dropdownDanger]}>{s.settingsDeleteAccount}</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </SafeAreaView>
  );
}

// ─── 캘린더 모달 ────────────────────────────────────────────────────────────
function CalendarModal({ visible, currentDate, onSelect, onClose, s, colors, styles }: {
  visible: boolean;
  currentDate: string;
  onSelect: (date: string) => void;
  onClose: () => void;
  s: ReturnType<typeof useStrings>;
  colors: ReturnType<typeof useColors>;
  styles: ReturnType<typeof makeStyles>;
}) {
  const [inputVal, setInputVal] = useState(currentDate);

  const quickSelect = (offset: number) => {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    onSelect(d.toISOString().split('T')[0]);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={styles.modalBox}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{s.calendarTitle}</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.modalClose}>{s.close}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.quickBtns}>
            <TouchableOpacity style={styles.quickBtn} onPress={() => quickSelect(-1)}>
              <Text style={styles.quickBtnText}>{s.yesterdayMeal}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.quickBtn, styles.quickBtnToday]} onPress={() => quickSelect(0)}>
              <Text style={[styles.quickBtnText, styles.quickBtnTodayText]}>{s.todayMeal}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.quickBtn} onPress={() => quickSelect(1)}>
              <Text style={styles.quickBtnText}>{s.tomorrowMeal}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.modalDivider} />
          <Text style={styles.modalInputLabel}>{s.dateInputLabel}</Text>
          {Platform.OS === 'web' ? (
            <input
              type="date"
              value={inputVal}
              onChange={(e) => {
                setInputVal(e.target.value);
                if (e.target.value) onSelect(e.target.value);
              }}
              style={{
                width: '100%', background: colors.bg, border: `1px solid ${colors.border}`,
                borderRadius: 12, padding: '8px 12px', color: colors.text,
                fontSize: 13, outline: 'none', boxSizing: 'border-box',
              } as any}
            />
          ) : (
            <TextInput
              style={styles.dateInput}
              value={inputVal}
              onChangeText={setInputVal}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.textFaint}
              onSubmitEditing={() => { if (/^\d{4}-\d{2}-\d{2}$/.test(inputVal)) onSelect(inputVal); }}
            />
          )}
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
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
    headerLeft: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
    headerRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    pulse: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accent, marginTop: 4 },
    headerTitle: { fontSize: 20, fontWeight: '800', color: colors.textMuted, letterSpacing: 3, fontFamily: FF },
    calBtn: { padding: 4 },
    calIcon: { fontSize: 18 },
    settingsOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
    dropdown: {
      position: 'absolute', right: 20,
      backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border,
      borderRadius: 12, overflow: 'hidden', minWidth: 130,
    },
    dropdownItem: { paddingHorizontal: 16, paddingVertical: 11 },
    dropdownText: { fontSize: 12, color: colors.textMuted, fontFamily: FF },
    dropdownDanger: { color: colors.error },
    dropdownDivider: { height: 1, backgroundColor: colors.border },
    flex: { flex: 1 },
    scroll: { flex: 1 },
    scrollContent: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 24 },
    dateNav: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      marginBottom: 12,
    },
    navBtn: { padding: 8 },
    navArrow: { fontSize: 24, color: colors.textMuted, fontFamily: FF },
    dateText: { fontSize: 12, fontWeight: '600', color: colors.textMuted, fontFamily: FF },
    chartSection: { alignItems: 'center', marginBottom: 8 },
    macroBar: {
      flexDirection: 'row', backgroundColor: colors.surface + '50',
      borderWidth: 1, borderColor: colors.border, borderRadius: 14,
      paddingVertical: 12, marginBottom: 24,
    },
    macroItem: { flex: 1, alignItems: 'center' },
    macroItemBorder: { borderLeftWidth: 1, borderRightWidth: 1, borderColor: colors.border },
    macroLabel: { fontSize: 10, color: colors.textFaint, marginBottom: 2, fontFamily: FF },
    macroValue: { fontSize: 16, fontWeight: '700', fontFamily: FF },
    listSection: { gap: 4 },
    listHeader: {
      flexDirection: 'row', justifyContent: 'space-between',
      alignItems: 'center', marginBottom: 8,
    },
    listTitle: {
      fontSize: 11, fontWeight: '700', color: colors.textDim,
      textTransform: 'uppercase', letterSpacing: 1, fontFamily: FF,
    },
    clearBtn: { fontSize: 10, color: colors.textFaint, fontFamily: FF },
    empty: {
      borderWidth: 1, borderStyle: 'dashed', borderColor: colors.border,
      borderRadius: 16, padding: 40, alignItems: 'center',
    },
    emptyIcon: { fontSize: 32, marginBottom: 8 },
    emptyText: { fontSize: 13, color: colors.textDim, fontWeight: '500', fontFamily: FF },
    emptyHint: { fontSize: 11, color: colors.textFaint, marginTop: 4, fontFamily: FF },
    inputContainer: {
      backgroundColor: colors.bg,
      borderTopWidth: 1, borderTopColor: colors.border,
      paddingTop: 8, paddingBottom: 8,
    },
    // 모달
    modalOverlay: {
      flex: 1, backgroundColor: 'rgba(0,0,0,0.6)',
      alignItems: 'center', justifyContent: 'flex-start',
      paddingTop: 80,
    },
    modalBox: {
      width: 300, backgroundColor: colors.surface,
      borderWidth: 1, borderColor: colors.border,
      borderRadius: 20, padding: 16,
    },
    modalHeader: {
      flexDirection: 'row', justifyContent: 'space-between',
      alignItems: 'center', marginBottom: 12,
    },
    modalTitle: { fontSize: 12, fontWeight: '600', color: colors.textMuted, fontFamily: FF },
    modalClose: { fontSize: 11, color: colors.textDim, fontFamily: FF },
    quickBtns: { flexDirection: 'row', gap: 8, marginBottom: 12 },
    quickBtn: {
      flex: 1, paddingVertical: 10,
      backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border,
      borderRadius: 12, alignItems: 'center',
    },
    quickBtnToday: { borderColor: colors.accentDim, backgroundColor: colors.accentDim + '40' },
    quickBtnText: { fontSize: 11, color: colors.textMuted, fontFamily: FF },
    quickBtnTodayText: { color: colors.accent, fontWeight: '600', fontFamily: FF },
    modalDivider: { height: 1, backgroundColor: colors.border, marginBottom: 10 },
    modalInputLabel: { fontSize: 10, color: colors.textFaint, marginBottom: 6, fontFamily: FF },
    dateInput: {
      backgroundColor: colors.bg, borderWidth: 1, borderColor: colors.border,
      borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8,
      fontSize: 13, color: colors.text, fontFamily: FF,
    },
  });
}
