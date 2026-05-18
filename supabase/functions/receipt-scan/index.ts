import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

const EFFECTS: Record<string, { health: [number, number]; mental: [number, number]; growth: [number, number] }> = {
  food_healthy:         { health: [15, 25],   mental: [0, 0],   growth: [30, 50] },
  food_junk:            { health: [-25, -15], mental: [0, 0],   growth: [10, 20] },
  food_other:           { health: [5, 8],     mental: [0, 0],   growth: [10, 20] },
  daily_consumable:     { health: [1, 5],     mental: [5, 8],   growth: [10, 10] },
  daily_stationery:     { health: [1, 5],     mental: [5, 8],   growth: [10, 10] },
  daily_furniture:      { health: [1, 5],     mental: [20, 25], growth: [15, 15] },
  daily_clothing:       { health: [1, 5],     mental: [10, 15], growth: [10, 10] },
  entertainment_light:  { health: [-8, -5],   mental: [5, 15],  growth: [0, 0] },
  entertainment_medium: { health: [-15, -10], mental: [10, 15], growth: [0, 0] },
  entertainment_heavy:  { health: [-25, -20], mental: [20, 25], growth: [0, 0] },
};

const BUFF_COUNTS: Record<string, number> = {
  entertainment_light: 2,
  entertainment_medium: 3,
  entertainment_heavy: 4,
};

const BUFF_VALUES: Record<string, [number, number]> = {
  entertainment_light:  [1.1, 1.2],
  entertainment_medium: [1.25, 1.35],
  entertainment_heavy:  [1.35, 1.5],
};

function rand(min: number, max: number) {
  return Math.round(min + Math.random() * (max - min));
}

// weight=0〜1: 高いほど上限寄りの値が出やすくなる
function randWeighted(min: number, max: number, weight: number) {
  const clampedWeight = Math.max(0, Math.min(1, weight));
  const adjustedMin = min + (max - min) * clampedWeight * 0.6;
  return Math.round(adjustedMin + Math.random() * (max - adjustedMin));
}

function calcRatios(items: { category: string }[]) {
  const counts: Record<string, number> = {};
  for (const item of items) {
    counts[item.category] = (counts[item.category] ?? 0) + 1;
  }
  const total = items.length || 1;
  const get = (prefix: string) =>
    Object.entries(counts).filter(([k]) => k.startsWith(prefix)).reduce((s, [, v]) => s + v, 0) / total;

  return {
    foodHealthy:   get('food_healthy'),
    foodJunk:      get('food_junk'),
    foodOther:     get('food_other'),
    dailyGoods:    get('daily_'),
    entertainment: get('entertainment_'),
  };
}

async function callFunction(name: string, body: unknown) {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/${name}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${name} error ${res.status}: ${text}`);
  }
  return res.json();
}

const CORS = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' };

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });

  const authHeader = req.headers.get('Authorization');
  const token = authHeader?.replace('Bearer ', '') ?? '';
  const { data: { user } } = await supabase.auth.getUser(token);
  if (!user) return new Response('Unauthorized', { status: 401 });

  const { image } = await req.json() as { image: string };

  // 1. OCR
  const { fullText } = await callFunction('ocr', { image }) as { fullText: string };
  if (!fullText || fullText.trim().length < 15) {
    return new Response(JSON.stringify({ error: 'ocr_failed' }), { status: 422, headers: CORS });
  }

  // 2. 分類
  const raw = await callFunction('classify', { text: fullText });
  const classified = {
    storeName:               typeof raw?.storeName === 'string' ? raw.storeName : '不明な店舗',
    receiptDate:             typeof raw?.receiptDate === 'string' ? raw.receiptDate : new Date().toISOString().slice(0, 10),
    totalAmount:             typeof raw?.totalAmount === 'number' ? raw.totalAmount : 0,
    items:                   Array.isArray(raw?.items) ? raw.items : [],
    entertainmentIntensity:  raw?.entertainmentIntensity ?? null,
  };

  if (classified.storeName === '不明な店舗' && classified.totalAmount === 0) {
    return new Response(JSON.stringify({ error: 'ocr_failed' }), { status: 422, headers: CORS });
  }

  // 3. 重複チェック
  const { data: dup } = await supabase
    .from('receipts')
    .select('id')
    .eq('user_id', user.id)
    .eq('store_name', classified.storeName)
    .eq('receipt_date', classified.receiptDate)
    .eq('total_amount', classified.totalAmount)
    .maybeSingle();

  if (dup) {
    return new Response(JSON.stringify({ duplicate: true }), { headers: CORS });
  }

  // 4. 娯楽バフ取得
  const { data: buffRow } = await supabase
    .from('entertainment_buff')
    .select('*')
    .eq('user_id', user.id)
    .single();

  let currentBuffValue: number = buffRow?.buff_value ?? 1.0;
  let currentBuffCount: number = buffRow?.buff_count ?? 0;

  // 5. アイテム効果値計算（スキャン時に保存する値）
  let growthDelta = 0;
  let isEntertainment = false;
  let entertainmentCategory = '';

  for (const item of classified.items) {
    const effect = EFFECTS[item.category];
    if (!effect) continue;
    growthDelta += rand(...effect.growth);
    if (item.category.startsWith('entertainment_')) {
      isEntertainment = true;
      entertainmentCategory = item.category;
    }
  }

  // ジャンクボーナス
  const junkCount = classified.items.filter((i) => i.category === 'food_junk').length;
  if (junkCount > 0) {
    growthDelta += rand(10, Math.min(10 + junkCount * 2, 20));
  }

  // 6. 娯楽バフ処理
  let appliedBuff = 1.0;
  let buffCountDelta = 0;

  if (isEntertainment) {
    const [bMin, bMax] = BUFF_VALUES[entertainmentCategory] ?? [1.1, 1.2];
    const addedBuff = rand(bMin * 100, bMax * 100) / 100 - 1;
    currentBuffValue = Math.min(1.5, currentBuffValue + addedBuff);
    buffCountDelta = BUFF_COUNTS[entertainmentCategory] ?? 2;
    currentBuffCount += buffCountDelta;
  } else if (currentBuffCount > 0) {
    appliedBuff = currentBuffValue;
    buffCountDelta = -1;
    currentBuffCount -= 1;
    if (currentBuffCount === 0) currentBuffValue = 1.0;
  }

  // 7. アイテム保存成長値（娯楽バフ適用済み）
  const finalGrowth = Math.round(growthDelta * appliedBuff);

  // 8. ストック空き確認
  const { count: stockCount } = await supabase
    .from('item_stock')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id);

  const canAcquireItem = (stockCount ?? 0) < 10;

  // 9. レシート・品目を保存
  const ratios = calcRatios(classified.items);

  const { data: receipt } = await supabase.from('receipts').insert({
    user_id:              user.id,
    store_name:           classified.storeName,
    receipt_date:         classified.receiptDate,
    total_amount:         classified.totalAmount,
    is_duplicate:         false,
    entertainment_intensity: classified.entertainmentIntensity,
    food_healthy_ratio:   ratios.foodHealthy,
    food_junk_ratio:      ratios.foodJunk,
    food_other_ratio:     ratios.foodOther,
    daily_goods_ratio:    ratios.dailyGoods,
    entertainment_ratio:  ratios.entertainment,
  }).select().single();

  if (receipt) {
    await supabase.from('receipt_items').insert(
      classified.items.map((item) => ({
        receipt_id: receipt.id,
        item_name:  item.name,
        category:   item.category,
        quantity:   item.quantity,
        price:      item.price,
      }))
    );
  }

  // 10. 娯楽バフ更新
  await supabase.from('entertainment_buff').upsert({
    user_id:    user.id,
    buff_value: currentBuffValue,
    buff_count: currentBuffCount,
  });

  // 11. アイテム生成（ストック満杯でなければ全レシートで生成）
  let acquiredItem = null;
  if (canAcquireItem && receipt && classified.items.length > 0) {
    // 価格合計が最大のカテゴリを支配カテゴリとする
    const priceByCategory: Record<string, number> = {};
    for (const item of classified.items) {
      priceByCategory[item.category] = (priceByCategory[item.category] ?? 0) + (item.price ?? 0);
    }
    const dominantCategory = Object.entries(priceByCategory).sort((a, b) => b[1] - a[1])[0][0];
    const dominantName = classified.items.find((i) => i.category === dominantCategory)?.name ?? classified.items[0].name;

    // 価格比率（0〜1）：支配カテゴリの価格が全体に占める割合
    const totalPrice = Object.values(priceByCategory).reduce((s, v) => s + v, 0) || 1;
    const dominanceRatio = (priceByCategory[dominantCategory] ?? 0) / totalPrice;

    // 支配カテゴリの効果値（比率が高いほど上限寄り）
    const domEffect = EFFECTS[dominantCategory] ?? EFFECTS.food_other;
    let healthEff = randWeighted(domEffect.health[0], domEffect.health[1], dominanceRatio);
    let mentalEff = randWeighted(domEffect.mental[0], domEffect.mental[1], dominanceRatio);

    // ジャンク品が混在する場合は別途加算（支配カテゴリがジャンク以外の場合のみ）
    const junkPrice = priceByCategory['food_junk'] ?? 0;
    const junkRatio = junkPrice / totalPrice;
    if (junkRatio > 0 && dominantCategory !== 'food_junk') {
      healthEff += randWeighted(EFFECTS.food_junk.health[0], EFFECTS.food_junk.health[1], junkRatio);
      mentalEff += randWeighted(EFFECTS.food_junk.mental[0], EFFECTS.food_junk.mental[1], junkRatio);
    }

    const { data: item } = await supabase.from('item_stock').insert({
      user_id:             user.id,
      item_name:           dominantName,
      category:            dominantCategory,
      stored_growth_value: finalGrowth,
      health_effect:       healthEff,
      mental_effect:       mentalEff,
    }).select().single();
    if (item) {
      acquiredItem = {
        itemName:          item.item_name,
        category:          item.category,
        storedGrowthValue: item.stored_growth_value,
        healthEffect:      item.health_effect,
        mentalEffect:      item.mental_effect,
      };
    }
  }

  const responseItems = classified.items.map((i) => ({
    itemName:  i.name,
    category:  i.category,
    quantity:  i.quantity,
    price:     i.price,
  }));

  return new Response(JSON.stringify({
    duplicate: false,
    receipt: {
      storeName:              classified.storeName,
      receiptDate:            classified.receiptDate,
      totalAmount:            classified.totalAmount,
      isDuplicate:            false,
      entertainmentIntensity: classified.entertainmentIntensity,
      foodHealthyRatio:       ratios.foodHealthy,
      foodJunkRatio:          ratios.foodJunk,
      foodOtherRatio:         ratios.foodOther,
      dailyGoodsRatio:        ratios.dailyGoods,
      entertainmentRatio:     ratios.entertainment,
    },
    items: responseItems,
    acquiredItem,
    buffApplied:    appliedBuff,
    buffCountDelta,
  }), { headers: CORS });
});
