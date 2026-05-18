import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';

const KEY = 'last_watered_at';
const COOLDOWN_HOURS = 6;
const HEALTH_RESTORE = 50;

export function useWatering(
  currentHealth: number,
  onHealthUpdate: (newHealth: number) => void,
) {
  const [lastWateredAt, setLastWateredAt] = useState<number | null>(null);
  const [checked, setChecked] = useState(false);

  const recheck = useCallback(async () => {
    const val = await AsyncStorage.getItem(KEY);
    setLastWateredAt(val ? Number(val) : null);
    setChecked(true);
  }, []);

  const canWater = checked && (
    lastWateredAt === null ||
    Date.now() - lastWateredAt >= COOLDOWN_HOURS * 60 * 60 * 1000
  );

  const remainingMinutes = lastWateredAt
    ? Math.max(0, Math.ceil((COOLDOWN_HOURS * 60 * 60 * 1000 - (Date.now() - lastWateredAt)) / 60000))
    : 0;

  const water = useCallback(async () => {
    if (!canWater) return;

    const newHealth = Math.min(150, currentHealth + HEALTH_RESTORE);
    const now = Date.now();

    await AsyncStorage.setItem(KEY, String(now));
    setLastWateredAt(now);
    onHealthUpdate(newHealth);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: latest } = await supabase
      .from('plant_status')
      .select('*')
      .eq('user_id', user.id)
      .order('changed_at', { ascending: false })
      .limit(1)
      .single();

    if (latest) {
      await supabase.from('plant_status').insert({
        user_id:      user.id,
        growth_value: latest.growth_value,
        health_value: newHealth,
        mental_value: latest.mental_value,
        trigger_type: 'watering',
      });
    }
  }, [canWater, currentHealth, onHealthUpdate]);

  return { canWater, remainingMinutes, water, recheck };
}
