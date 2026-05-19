import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const COOLDOWN_MS = 6 * 60 * 60 * 1000;
const HEALTH_RESTORE = 50;

let lastWateredAt: number | null = null;
let initialized = false;

export function useWatering(
  currentHealth: number,
  onHealthUpdate: (newHealth: number) => void,
) {
  const [lastWatered, setLastWatered] = useState<number | null>(lastWateredAt);

  useEffect(() => {
    if (initialized) {
      setLastWatered(lastWateredAt);
      return;
    }
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { initialized = true; return; }
      const { data } = await supabase
        .from('plant_status')
        .select('changed_at')
        .eq('user_id', user.id)
        .eq('trigger_type', 'watering')
        .order('changed_at', { ascending: false })
        .limit(1)
        .single();
      if (data) {
        const ts = new Date(data.changed_at).getTime();
        lastWateredAt = ts;
        setLastWatered(ts);
      }
      initialized = true;
    })();
  }, []);

  const canWater = lastWatered === null || Date.now() - lastWatered >= COOLDOWN_MS;

  const remainingMinutes = lastWatered
    ? Math.max(0, Math.ceil((COOLDOWN_MS - (Date.now() - lastWatered)) / 60000))
    : 0;

  const water = useCallback(async () => {
    if (!canWater) return;

    const now = Date.now();
    lastWateredAt = now;
    setLastWatered(now);

    const newHealth = Math.min(150, currentHealth + HEALTH_RESTORE);
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

  const recheck = useCallback(() => {
    setLastWatered(lastWateredAt);
  }, []);

  const resetCooldown = useCallback(() => {
    lastWateredAt = null;
    setLastWatered(null);
  }, []);

  return { canWater, remainingMinutes, water, recheck, resetCooldown };
}
