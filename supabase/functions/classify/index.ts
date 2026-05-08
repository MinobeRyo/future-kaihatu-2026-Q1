import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')!;
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

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

  const res = await fetch(GEMINI_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: `${SYSTEM_PROMPT}\n\n---\n${text}` }] }],
      generationConfig: { responseMimeType: 'application/json' },
    }),
  });

  const json = await res.json();
  const raw = json.candidates?.[0]?.content?.parts?.[0]?.text ?? '{}';

  let result: ClassifyResult;
  try {
    result = JSON.parse(raw);
  } catch {
    return new Response(JSON.stringify({ error: 'parse_error', raw }), { status: 422 });
  }

  return new Response(JSON.stringify(result), {
    headers: { 'Content-Type': 'application/json' },
  });
});
