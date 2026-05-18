import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { PlantStatus, EntertainmentBuff, ItemStock, PlantStage } from '../types';

function calcStage(growth: number, health: number): PlantStage {
  if (health <= 50) return 'withered';
  if (growth >= 5000) return 'blooming';
  if (growth >= 3000) return 'young';
  if (growth >= 1500) return 'sapling';
  if (growth >= 500)  return 'seedling';
  return 'chiju';
}

export function useGameState() {
  const [plantStatus, setPlantStatus] = useState<PlantStatus>({
    growthValue: 0,
    healthValue: 100,
    mentalValue: 100,
    stage: 'chiju',
    lastOpenedAt: new Date().toISOString(),
  });
  const [buff, setBuff] = useState<EntertainmentBuff>({ buffValue: 1.0, buffCount: 0 });
  const [items, setItems] = useState<ItemStock[]>([]);

  useEffect(() => {
    loadState();
  }, []);

  async function loadState() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const [statusRes, buffRes, itemsRes] = await Promise.all([
      supabase.from('plant_status').select('*').eq('user_id', user.id).order('changed_at', { ascending: false }).limit(1).single(),
      supabase.from('entertainment_buff').select('*').eq('user_id', user.id).single(),
      supabase.from('item_stock').select('*').eq('user_id', user.id).order('acquired_at', { ascending: true }),
    ]);

    if (statusRes.data) {
      const d = statusRes.data;
      setPlantStatus({
        growthValue: d.growth_value,
        healthValue: d.health_value,
        mentalValue: d.mental_value,
        stage: calcStage(d.growth_value, d.health_value),
        lastOpenedAt: d.changed_at,
      });
    }
    if (buffRes.data) {
      setBuff({ buffValue: buffRes.data.buff_value, buffCount: buffRes.data.buff_count });
    }
    if (itemsRes.data) {
      setItems(itemsRes.data.map((d) => ({
        id: d.id,
        userId: d.user_id,
        itemName: d.item_name,
        category: d.category,
        storedGrowthValue: d.stored_growth_value,
        healthEffect: d.health_effect,
        mentalEffect: d.mental_effect,
        acquiredAt: d.acquired_at,
      })));
    }
  }

  const useItem = useCallback(async (item: ItemStock) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // 使用時バフ計算（仕様書: 最大×1.5）
    const healthBuff = plantStatus.healthValue >= 100
      ? (plantStatus.healthValue - 100) * 0.005
      : 0;
    const mentalBuff = plantStatus.mentalValue * 0.005 - 0.5;
    const useTimeMult = Math.min(1 + healthBuff + mentalBuff, 1.5);
    const growthGain = Math.round(item.storedGrowthValue * useTimeMult);

    const newGrowth = plantStatus.growthValue + growthGain;
    const newHealth = Math.max(0, Math.min(150, plantStatus.healthValue + item.healthEffect));
    const newMental = Math.max(0, Math.min(150, plantStatus.mentalValue + item.mentalEffect));

    setPlantStatus((prev) => ({
      ...prev,
      growthValue: newGrowth,
      healthValue: newHealth,
      mentalValue: newMental,
      stage: calcStage(newGrowth, newHealth),
    }));
    setItems((prev) => prev.filter((i) => i.id !== item.id));

    await Promise.all([
      supabase.from('plant_status').insert({
        user_id: user.id,
        growth_value: newGrowth,
        health_value: newHealth,
        mental_value: newMental,
        trigger_type: 'item_use',
      }),
      supabase.from('item_stock').delete().eq('id', item.id),
    ]);
  }, [plantStatus]);

  function debugSet(patch: Partial<Pick<PlantStatus, 'growthValue' | 'healthValue' | 'mentalValue'>>) {
    setPlantStatus((prev) => {
      const next = { ...prev, ...patch };
      return { ...next, stage: calcStage(next.growthValue, next.healthValue) };
    });
  }

  const addDummyItems = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const dummies = [
      { user_id: user.id, item_name: 'ブロッコリー', category: 'food_healthy',         stored_growth_value: 40, health_effect: 20,  mental_effect: 0  },
      { user_id: user.id, item_name: 'ポテチ',       category: 'food_junk',             stored_growth_value: 30, health_effect: -20, mental_effect: 0  },
      { user_id: user.id, item_name: '洗剤',         category: 'daily_consumable',      stored_growth_value: 10, health_effect: 3,   mental_effect: 6  },
      { user_id: user.id, item_name: '映画チケット', category: 'entertainment_light',   stored_growth_value: 0,  health_effect: -6,  mental_effect: 10 },
      { user_id: user.id, item_name: 'ソファ',       category: 'daily_furniture',       stored_growth_value: 15, health_effect: 3,   mental_effect: 22 },
    ];

    const { data } = await supabase.from('item_stock').insert(dummies).select();
    if (data) {
      setItems((prev) => [
        ...prev,
        ...data.map((d: any) => ({
          id: d.id,
          userId: d.user_id,
          itemName: d.item_name,
          category: d.category,
          storedGrowthValue: d.stored_growth_value,
          healthEffect: d.health_effect,
          mentalEffect: d.mental_effect,
          acquiredAt: d.acquired_at,
        })),
      ]);
    }
  }, []);

  return { plantStatus, buff, items, useItem, debugSet, addDummyItems, reload: loadState };
}
