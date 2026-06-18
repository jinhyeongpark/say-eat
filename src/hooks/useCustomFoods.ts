import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../config/firebase';

export interface FoodConfig {
  name: string;
  servingLabel: string;
  carbs: string;
  protein: string;
  fat: string;
  calories: string;
}

export const DEFAULT_FOOD_CONFIG: FoodConfig = {
  name: '', servingLabel: '', carbs: '', protein: '', fat: '', calories: '',
};

export function useCustomFoods(userId: string | null): string {
  const [prompt, setPrompt] = useState('');

  useEffect(() => {
    if (!userId) return;
    const unsub = onSnapshot(doc(db, 'users', userId, 'settings', 'customFoods'), snap => {
      if (!snap.exists()) { setPrompt(''); return; }
      const { protein, chicken } = snap.data();
      const lines: string[] = [];

      if (protein?.name) {
        lines.push(
          `- ${protein.name} (프로틴 셰이크, ${protein.servingLabel || '1회 제공량'}): ` +
          `탄수화물 ${protein.carbs}g, 단백질 ${protein.protein}g, 지방 ${protein.fat}g, ${protein.calories}kcal`
        );
      }
      if (chicken?.name) {
        lines.push(
          `- ${chicken.name} (닭가슴살, ${chicken.servingLabel || '1회 제공량'}): ` +
          `탄수화물 ${chicken.carbs}g, 단백질 ${chicken.protein}g, 지방 ${chicken.fat}g, ${chicken.calories}kcal`
        );
      }

      setPrompt(lines.length > 0
        ? '[사용자 커스텀 식품]\n아래 식품이 언급되면 반드시 이 수치를 사용하세요:\n' + lines.join('\n')
        : ''
      );
    });
    return unsub;
  }, [userId]);

  return prompt;
}
