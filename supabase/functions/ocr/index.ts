import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const VISION_API_KEY = Deno.env.get('GOOGLE_VISION_API_KEY')!;
const VISION_URL = `https://vision.googleapis.com/v1/images:annotate?key=${VISION_API_KEY}`;

export interface OcrResult {
  fullText: string;
}

serve(async (req) => {
  const { image } = await req.json() as { image: string };

  const res = await fetch(VISION_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      requests: [{
        image: { content: image },
        features: [{ type: 'TEXT_DETECTION' }],
      }],
    }),
  });

  const json = await res.json();
  const fullText: string = json.responses?.[0]?.fullTextAnnotation?.text ?? '';

  return new Response(JSON.stringify({ fullText } satisfies OcrResult), {
    headers: { 'Content-Type': 'application/json' },
  });
});
