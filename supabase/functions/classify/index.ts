import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY') ?? '';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

// ── 起動時チェック ────────────────────────────────────────────
if (!GEMINI_API_KEY) {
  console.error('[classify] ⚠️  gemini_api_key が未設定');
} else {
  console.log(`[classify] ✅ gemini_api_key: ${GEMINI_API_KEY.slice(0, 8)}...`);
  fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${GEMINI_API_KEY}`)
    .then(r => r.json())
    .then(j => {
      const names = (j.models ?? []).map((m: any) => m.name).join(', ');
      console.log('[classify] 利用可能モデル:', names || '取得失敗');
    })
    .catch(e => console.error('[classify] モデル一覧取得失敗:', e));
}

export interface ClassifiedItem {
  name: string;
  category: string;
  quantity: number;
  price: number;
}

export interface ClassifyResult {
  storeName: string;
  receiptDate: string;
  totalAmount: number;
  items: ClassifiedItem[];
  entertainmentIntensity: 'light' | 'medium' | 'heavy' | null;
}

const SYSTEM_PROMPT = `
レシートのOCRテキストを解析し、以下のJSON形式で返してください。
カテゴリは以下から選んでください:
food_healthy(野菜・肉・魚), food_junk(菓子・ジュース・ファストフード), food_other(その他食品),
daily_consumable(消耗品), daily_stationery(文房具), daily_furniture(家具・インテリア), daily_clothing(衣類),
entertainment_light(映画・読書カフェ等), entertainment_medium(カラオケ・ゲーセン等), entertainment_heavy(テーマパーク・スポーツ観戦等)

{
  "storeName": "店名",
  "receiptDate": "YYYY-MM-DD",
  "totalAmount": 合計金額（数値）,
  "items": [{ "name": "品名", "category": "カテゴリ", "quantity": 個数, "price": 価格 }],
  "entertainmentIntensity": "light" | "medium" | "heavy" | null
}
JSON以外は返さないでください。
`.trim();

serve(async (req) => {
  const { text } = await req.json() as { text: string };
  console.log('[classify] 受信 text length:', text?.length ?? 0, '| preview:', text?.slice(0, 80));

  const res = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: `${SYSTEM_PROMPT}\n\n---\n${text}` }] }],
      generationConfig: { responseMimeType: 'application/json' },
    }),
  });

  const json = await res.json();
  console.log('[classify] Gemini raw response:', JSON.stringify(json).slice(0, 600));
  const raw = json.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}';

  let result: ClassifyResult;
  try {
    result = JSON.parse(raw);
  } catch {
    console.error('[classify] JSON parse failed. raw:', raw);
    return new Response(JSON.stringify({ error: 'parse_error', raw }), { status: 422 });
  }

  console.log('[classify] result:', JSON.stringify(result));
  return new Response(JSON.stringify(result), {
    headers: { 'Content-Type': 'application/json' },
  });
});
