import { useState, useEffect, useCallback } from 'react';
import {
  collection, doc, setDoc, deleteDoc, onSnapshot, query, orderBy
} from 'firebase/firestore';
import { db } from '../config/firebase';
import { FoodItem } from '../services/gemini';

export interface LogEntry extends FoodItem {
  id: string;
  createdAt: number;
}

export function useNutritionLogs(userId: string | null, date: string) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId || !date) { setLogs([]); return; }

    const q = query(
      collection(db, 'users', userId, 'logs', date, 'items'),
      orderBy('createdAt', 'asc')
    );

    const unsub = onSnapshot(q, (snap) => {
      setLogs(snap.docs.map(d => ({ id: d.id, ...d.data() } as LogEntry)));
    });

    return unsub;
  }, [userId, date]);

  const addItems = useCallback(async (items: FoodItem[]) => {
    if (!userId) return;
    setLoading(true);
    try {
      const now = Date.now();
      for (let i = 0; i < items.length; i++) {
        const id = `${now}_${i}`;
        await setDoc(
          doc(db, 'users', userId, 'logs', date, 'items', id),
          { ...items[i], createdAt: now + i }
        );
      }
    } finally {
      setLoading(false);
    }
  }, [userId, date]);

  const deleteItem = useCallback(async (id: string) => {
    if (!userId) return;
    await deleteDoc(doc(db, 'users', userId, 'logs', date, 'items', id));
  }, [userId, date]);

  const clearDay = useCallback(async () => {
    if (!userId) return;
    await Promise.all(logs.map(l => deleteDoc(doc(db, 'users', userId, 'logs', date, 'items', l.id))));
  }, [userId, date, logs]);

  return { logs, loading, addItems, deleteItem, clearDay };
}
