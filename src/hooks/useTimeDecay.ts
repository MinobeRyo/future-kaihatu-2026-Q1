import { useEffect } from 'react';
import { AppState } from 'react-native';
import { supabase } from '../lib/supabase';

// 仕様書: 精神値は24時間で-12（アプリを開いたときに前回開いた時間から計算）
const MENTAL_DECAY_PER_HOUR = 12 / 24;

export function useTimeDecay() {
  useEffect(() => {
    applyDecay();

    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') applyDecay();
    });
    return () => sub.remove();
  }, []);
}

async function applyDecay() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const { data } = await supabase
    .from('plant_status')
    .select('*')
    .eq('user_id', user.id)
    .order('changed_at', { ascending: false })
    .limit(1)
    .single();

  if (!data) return;

  const lastAt = new Date(data.changed_at).getTime();
  const now = Date.now();
  const hoursElapsed = (now - lastAt) / (1000 * 60 * 60);
  if (hoursElapsed < 0.1) return;

  const mentalDecay = Math.floor(hoursElapsed * MENTAL_DECAY_PER_HOUR);
  if (mentalDecay === 0) return;

  const newMental = Math.max(0, data.mental_value - mentalDecay);
  await supabase.from('plant_status').insert({
    user_id: user.id,
    growth_value: data.growth_value,
    health_value: data.health_value,
    mental_value: newMental,
    trigger_type: 'time_decay',
  });
}
