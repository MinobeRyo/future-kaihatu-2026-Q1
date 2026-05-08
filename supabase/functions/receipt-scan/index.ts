import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import type { ClassifyResult } from '../classify/index.ts';

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
);

// ── カテゴリごとの効果値 ──────────────────────────────────────
const EFFECTS: Record<string, { health: [number, number]; mental: [number, number]; growth: [number, number] }> = {
  food_healthy:       { health: [15, 25],  mental: [0, 0],   growth: [30, 50] },
  food_junk:          { health: [-25, -15], mental: [0, 0],   growth: [10, 20] },
  food_other:         { health: [5, 8],    mental: [0, 0],   growth: [10, 20] },
  daily_consumable:   { health: [1, 5],    mental: [5, 8],   growth: [10, 10] },
  daily_stationery:   { health: [1, 5],    mental: [5, 8],   growth: [10, 10] },
  daily_furniture:    { health: [1, 5],    mental: [20, 25], growth: [15, 15] },
  daily_clothing:     { health: [1, 5],    mental: [10, 15], growth: [10, 10] },
  entertainment_light:  { health: [-8, -5],  mental: [5, 15],  growth: [0, 0] },
  entertainment_medium: { health: [-15, -10], mental: [10, 15], growth: [0, 0] },
  entertainment_heavy:  { health: [-25, -20], mental: [20, 25], growth: [0, 0] },
};

const BUFF_COUNTS: Record<string, number> = {
  entertainment_light: 2,
  entertainment_medium: 3,
  entertainment_heavy: 4,
};

const BUFF_VALUES: Record<string, [number, number]> = {
  entertainment_light: [1.1, 1.2],
  entertainment_medium: [1.25, 1.35],
  entertainment_heavy: [1.35, 1.5],
};

function rand(min: number, max: number) {
  return Math.round(min + Math.random() * (max - min));
}

function calcRatios(items: ClassifyResult['items']) {
  const counts: Record<string, number> = {};
  for (const item of items) {
    counts[item.category] = (counts[item.category] ?? 0) + 1;
  }
  const total = items.length || 1;
  const get = (prefix: string) =>
    Object.entries(counts).filter(([k]) => k.startsWith(prefix)).reduce((s, [, v]) => s + v, 0) / total;

  return {
    foodHealthy: get('food_healthy'),
    foodJunk: get('food_junk'),
    foodOther: get('food_other'),
    dailyGoods: get('daily_'),
    entertainment: get('entertainment_'),
  };
}

serve(async (req) => {
  const authHeader = req.headers.get('Authorization');
  const token = authHeader?.replace('Bearer ', '') ?? '';
  const { data: { user } } = await supabase.auth.getUser(token);
  if (!user) return new Response('Unauthorized', { status: 401 });

  const { image } = await req.json() as { image: string };

  // 1. OCR
  const ocrRes = await supabase.functions.invoke('ocr', { body: { image } });
  if (ocrRes.error) return new Response('OCR failed', { status: 500 });
  const { fullText } = ocrRes.data as { fullText: string };

  // 2. 分類
  const classifyRes = await supabase.functions.invoke('classify', { body: { text: fullText } });
  if (classifyRes.error) return new Response('Classify failed', { status: 500 });
  const classified = classifyRes.data as ClassifyResult;

  // 3. 重複チェック（日付＋店名＋合計金額）
  const { data: dup } = await supabase
    .from('receipts')
    .select('id')
    .eq('user_id', user.id)
    .eq('store_name', classified.storeName)
    .eq('receipt_date', classified.receiptDate)
    .eq('total_amount', classified.totalAmount)
    .maybeSingle();

  if (dup) {
    return new Response(JSON.stringify({ duplicate: true }), { headers: { 'Content-Type': 'application/json' } });
  }

  // 4. 現在のステータス取得
  const { data: status } = await supabase
    .from('plant_status')
    .select('*')
    .eq('user_id', user.id)
    .order('changed_at', { ascending: false })
    .limit(1)
    .single();

  const currentStatus = status ?? { growth_value: 0, health_value: 100, mental_value: 100 };

  // 5. 現在の娯楽バフ
  const { data: buffRow } = await supabase
    .from('entertainment_buff')
    .select('*')
    .eq('user_id', user.id)
    .single();

  let currentBuffValue: number = buffRow?.buff_value ?? 1.0;
  let currentBuffCount: number = buffRow?.buff_count ?? 0;

  // 6. ステータスデルタ計算
  let healthDelta = 0;
  let mentalDelta = 0;
  let growthDelta = 0;
  let isEntertainment = false;
  let entertainmentCategory = '';

  for (const item of classified.items) {
    const effect = EFFECTS[item.category];
    if (!effect) continue;
    healthDelta += rand(...effect.health);
    mentalDelta += rand(...effect.mental);
    growthDelta += rand(...effect.growth);

    if (item.category.startsWith('entertainment_')) {
      isEntertainment = true;
      entertainmentCategory = item.category;
    }
  }

  // ジャンク品の個数ボーナス
  const junkCount = classified.items.filter((i) => i.category === 'food_junk').length;
  if (junkCount > 0) {
    growthDelta += rand(10, Math.min(10 + junkCount * 2, 20));
  }

  // 7. 娯楽バフ処理
  let appliedBuff = 1.0;
  if (isEntertainment) {
    const [bMin, bMax] = BUFF_VALUES[entertainmentCategory] ?? [1.1, 1.2];
    const newBuff = rand(bMin * 100, bMax * 100) / 100;
    currentBuffValue = Math.min(1.5, currentBuffValue + (newBuff - 1));
    currentBuffCount += BUFF_COUNTS[entertainmentCategory] ?? 2;
  } else if (currentBuffCount > 0) {
    appliedBuff = currentBuffValue;
    currentBuffCount -= 1;
    if (currentBuffCount === 0) {
      currentBuffValue = 1.0;
    }
  }

  // 8. 精神値倍率
  const mentalMult = 0.5 + (currentStatus.mental_value / 150) * 0.75;

  // 9. 最終成長値計算（スキャン時確定）
  const finalGrowth = Math.round(growthDelta * appliedBuff);

  // 10. アイテム在庫チェック
  const { count: stockCount } = await supabase
    .from('item_stock')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id);

  const canAcquireItem = !isEntertainment && (stockCount ?? 0) < 10;

  // 11. 全データをDBに保存
  const ratios = calcRatios(classified.items);
  const newHealth = Math.max(0, Math.min(150, currentStatus.health_value + healthDelta));
  const newMental = Math.max(0, Math.min(150, currentStatus.mental_value + mentalDelta));
  const newGrowth = currentStatus.growth_value + (isEntertainment ? 0 : finalGrowth);

  const { data: receipt } = await supabase.from('receipts').insert({
    user_id: user.id,
    store_name: classified.storeName,
    receipt_date: classified.receiptDate,
    total_amount: classified.totalAmount,
    is_duplicate: false,
    entertainment_intensity: classified.entertainmentIntensity,
    food_healthy_ratio: ratios.foodHealthy,
    food_junk_ratio: ratios.foodJunk,
    food_other_ratio: ratios.foodOther,
    daily_goods_ratio: ratios.dailyGoods,
    entertainment_ratio: ratios.entertainment,
  }).select().single();

  if (receipt) {
    await supabase.from('receipt_items').insert(
      classified.items.map((item) => ({
        receipt_id: receipt.id,
        item_name: item.name,
        category: item.category,
        quantity: item.quantity,
        price: item.price,
      }))
    );
  }

  await supabase.from('plant_status').insert({
    user_id: user.id,
    growth_value: newGrowth,
    health_value: newHealth,
    mental_value: newMental,
    trigger_type: 'receipt_scan',
  });

  await supabase.from('entertainment_buff').upsert({
    user_id: user.id,
    buff_value: currentBuffValue,
    buff_count: currentBuffCount,
  });

  let acquiredItem = null;
  if (canAcquireItem && receipt) {
    const dominated = classified.items[0];
    if (dominated) {
      const effect = EFFECTS[dominated.category] ?? EFFECTS.food_other;
      const { data: item } = await supabase.from('item_stock').insert({
        user_id: user.id,
        item_name: dominated.name,
        category: dominated.category,
        stored_growth_value: finalGrowth,
        health_effect: rand(...effect.health),
        mental_effect: rand(...effect.mental),
      }).select().single();
      acquiredItem = item;
    }
  }

  return new Response(JSON.stringify({
    receipt,
    statusDelta: { growthDelta: isEntertainment ? 0 : finalGrowth, healthDelta, mentalDelta },
    acquiredItem,
    buffApplied: appliedBuff,
    duplicate: false,
  }), { headers: { 'Content-Type': 'application/json' } });
});
