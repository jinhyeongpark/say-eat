import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';

export interface DayStats {
  date: string;
  calories: number;
  carbs: number;
  protein: number;
  fat: number;
}

export function useWeeklyStats(userId: string | null, weekStart: string): DayStats[] {
  const [stats, setStats] = useState<DayStats[]>([]);

  useEffect(() => {
    if (!userId) return;

    const dates = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(weekStart);
      d.setDate(d.getDate() + i);
      return d.toISOString().split('T')[0];
    });

    const dayData: Record<string, DayStats> = Object.fromEntries(
      dates.map(date => [date, { date, calories: 0, carbs: 0, protein: 0, fat: 0 }])
    );

    const unsubscribers = dates.map(date => {
      const q = query(
        collection(db, 'users', userId, 'logs', date, 'items'),
        orderBy('createdAt', 'asc')
      );
      return onSnapshot(q, snap => {
        const items = snap.docs.map(d => d.data());
        dayData[date] = {
          date,
          calories: items.reduce((s, i) => s + (i.calories ?? 0), 0),
          carbs: items.reduce((s, i) => s + (i.carbs ?? 0), 0),
          protein: items.reduce((s, i) => s + (i.protein ?? 0), 0),
          fat: items.reduce((s, i) => s + (i.fat ?? 0), 0),
        };
        setStats(dates.map(d => ({ ...dayData[d] })));
      });
    });

    return () => unsubscribers.forEach(u => u());
  }, [userId, weekStart]);

  return stats;
}
