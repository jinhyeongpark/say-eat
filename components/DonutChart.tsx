import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useColors, useStrings } from '../src/context/PreferencesContext';
import { FF } from '../src/constants/Typography';

interface Props {
  carbs: number;
  protein: number;
  fat: number;
}

const RADIUS = 90;
const STROKE_WIDTH = 12;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;
const SIZE = 260;
const CENTER = SIZE / 2;

export default function DonutChart({ carbs, protein, fat }: Props) {
  const colors = useColors();
  const s = useStrings();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const carbCal = carbs * 4;
  const proteinCal = protein * 4;
  const fatCal = fat * 9;
  const total = carbCal + proteinCal + fatCal;

  const carbLen = total > 0 ? CIRCUMFERENCE * (carbCal / total) : 0;
  const proteinLen = total > 0 ? CIRCUMFERENCE * (proteinCal / total) : 0;
  const fatLen = total > 0 ? CIRCUMFERENCE * (fatCal / total) : 0;

  return (
    <View style={styles.container}>
      <View style={StyleSheet.absoluteFillObject}>
        <Svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} style={{ transform: [{ rotate: '-90deg' }] }}>
          <Circle cx={CENTER} cy={CENTER} r={RADIUS} stroke={colors.surface} strokeWidth={STROKE_WIDTH} fill="none" />
          {total > 0 && (
            <>
              {carbLen > 0 && (
                <Circle
                  cx={CENTER} cy={CENTER} r={RADIUS}
                  stroke={colors.carbs} strokeWidth={STROKE_WIDTH} fill="none"
                  strokeDasharray={`${carbLen} ${CIRCUMFERENCE}`}
                  strokeDashoffset={0}
                  strokeLinecap="round"
                />
              )}
              {proteinLen > 0 && (
                <Circle
                  cx={CENTER} cy={CENTER} r={RADIUS}
                  stroke={colors.protein} strokeWidth={STROKE_WIDTH} fill="none"
                  strokeDasharray={`${proteinLen} ${CIRCUMFERENCE}`}
                  strokeDashoffset={-carbLen}
                  strokeLinecap="round"
                />
              )}
              {fatLen > 0 && (
                <Circle
                  cx={CENTER} cy={CENTER} r={RADIUS}
                  stroke={colors.fat} strokeWidth={STROKE_WIDTH} fill="none"
                  strokeDasharray={`${fatLen} ${CIRCUMFERENCE}`}
                  strokeDashoffset={-(carbLen + proteinLen)}
                  strokeLinecap="round"
                />
              )}
            </>
          )}
        </Svg>
      </View>

      <View style={styles.center}>
        <Text style={styles.totalLabel}>TOTAL</Text>
        <View style={styles.totalRow}>
          <Text style={styles.totalNum}>{total}</Text>
          <Text style={styles.totalUnit}>kcal</Text>
        </View>
        <View style={styles.legend}>
          <LegendRow color={colors.carbs} label={s.donutCarbs} value={carbCal} />
          <LegendRow color={colors.protein} label={s.donutProtein} value={proteinCal} />
          <LegendRow color={colors.fat} label={s.donutFat} value={fatCal} />
        </View>
      </View>
    </View>
  );
}

function LegendRow({ color, label, value }: { color: string; label: string; value: number }) {
  const colors = useColors();
  const styles = useMemo(() => makeLegendStyles(colors), [colors]);

  return (
    <View style={styles.legendRow}>
      <View style={styles.legendLeft}>
        <View style={[styles.dot, { backgroundColor: color }]} />
        <Text style={styles.legendLabel}>{label}</Text>
      </View>
      <Text style={styles.legendValue}>{value}<Text style={styles.legendUnit}>kcal</Text></Text>
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    container: {
      width: SIZE,
      height: SIZE,
      alignItems: 'center',
      justifyContent: 'center',
    },
    center: {
      alignItems: 'center',
      justifyContent: 'center',
      width: (RADIUS - STROKE_WIDTH) * 2 - 4,
    },
    totalLabel: { fontSize: 9, color: colors.textFaint, letterSpacing: 1.5, fontWeight: '600', fontFamily: FF },
    totalRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 2, marginTop: 2 },
    totalNum: { fontSize: 22, fontWeight: '800', color: colors.text, fontFamily: FF },
    totalUnit: { fontSize: 9, color: colors.textMuted, fontWeight: '700', marginBottom: 2, fontFamily: FF },
    legend: {
      marginTop: 6,
      paddingTop: 6,
      borderTopWidth: 1,
      borderTopColor: colors.border,
      width: 100,
      gap: 3,
    },
  });
}

function makeLegendStyles(colors: ReturnType<typeof useColors>) {
  return StyleSheet.create({
    legendRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    legendLeft: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    dot: { width: 5, height: 5, borderRadius: 3 },
    legendLabel: { fontSize: 9, color: colors.textDim, fontFamily: FF },
    legendValue: { fontSize: 9, fontWeight: '600', color: colors.text, fontFamily: FF },
    legendUnit: { fontSize: 7, color: colors.textFaint, fontWeight: '400', fontFamily: FF },
  });
}
