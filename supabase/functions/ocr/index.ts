import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const VISION_API_KEY = Deno.env.get('google_vision_api_key') ?? '';
const VISION_URL = `https://vision.googleapis.com/v1/images:annotate?key=${VISION_API_KEY}`;

// ── 起動時チェック ────────────────────────────────────────────
if (!VISION_API_KEY) {
  console.error('[ocr] ⚠️  google_vision_api_key が未設定');
} else {
  console.log(`[ocr] ✅ google_vision_api_key: ${VISION_API_KEY.slice(0, 8)}...`);
  // Vision APIへの疎通確認（1x1白画像で軽量テスト）
  const TINY_PNG = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwADhQGAWjR9awAAAABJRU5ErkJggg==';
  fetch(VISION_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ requests: [{ image: { content: TINY_PNG }, features: [{ type: 'DOCUMENT_TEXT_DETECTION' }] }] }),
  }).then(r => r.json()).then(j => {
    if (j.error) {
      console.error('[ocr] ❌ Vision API接続エラー:', JSON.stringify(j.error));
    } else {
      console.log('[ocr] ✅ Vision API疎通OK');
    }
  }).catch(e => console.error('[ocr] ❌ Vision APIへの接続失敗:', e));
}

export interface OcrResult {
  fullText: string;
}

serve(async (req) => {
  const { image } = await req.json() as { image: string };
  console.log('[ocr] 受信 image base64 length:', image?.length ?? 0);

  const res = await fetch(VISION_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      requests: [{
        image: { content: image },
        features: [{ type: 'DOCUMENT_TEXT_DETECTION', maxResults: 1 }],
        imageContext: { languageHints: ['ja', 'en'] },
      }],
    }),
  });

  const json = await res.json();
  console.log('[ocr] Vision API response:', JSON.stringify(json).slice(0, 300));
  const fullText: string = json.responses?.[0]?.fullTextAnnotation?.text ?? '';
  console.log('[ocr] fullText length:', fullText.length);

  return new Response(JSON.stringify({ fullText } satisfies OcrResult), {
    headers: { 'Content-Type': 'application/json' },
  });
});
