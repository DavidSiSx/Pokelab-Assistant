import { GoogleGenerativeAI } from "@google/generative-ai";

// ── Google Keys ──────────────────────────────────────────
const GOOGLE_KEYS = [
  process.env.GOOGLE_AI_KEY_1!,
  process.env.GOOGLE_AI_KEY_2!,
].filter(Boolean);

let currentKeyIndex = 0;

function getNextGoogleClient(): GoogleGenerativeAI {
  const key = GOOGLE_KEYS[currentKeyIndex % GOOGLE_KEYS.length];
  currentKeyIndex++;
  return new GoogleGenerativeAI(key);
}

export const GOOGLE_MODELS = [
  "gemini-2.5-flash-lite",
  "gemini-2.5-flash",
];

// ── OpenRouter Fallback ───────────────────────────────────
const OPENROUTER_MODELS = [
  "google/gemini-2.0-flash-exp:free",
  "meta-llama/llama-3.3-70b-instruct:free",
];

async function generateWithOpenRouter(prompt: string): Promise<string> {
  const errors: string[] = [];

  for (const model of OPENROUTER_MODELS) {
    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
        },
        body: JSON.stringify({
          model,
          messages: [{ role: "user", content: prompt }],
        }),
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json();
      return data.choices[0].message.content as string;
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      errors.push(`[OpenRouter/${model}]: ${msg}`);
      console.warn(`OpenRouter falló con ${model}:`, msg);
    }
  }

  throw new Error(`OpenRouter falló:\n${errors.join("\n")}`);
}

// ── Main: Google primero, OpenRouter como último recurso ──
export async function generateWithFallback(prompt: string): Promise<string> {
  const errors: string[] = [];

  // Intenta Google (todos los modelos × todas las keys)
  for (const modelName of GOOGLE_MODELS) {
    for (let keyAttempt = 0; keyAttempt < GOOGLE_KEYS.length; keyAttempt++) {
      try {
        const client = getNextGoogleClient();
        const model = client.getGenerativeModel({ model: modelName });
        const result = await model.generateContent(prompt);
        return result.response.text();
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : String(error);
        errors.push(`[Google/${modelName}/key${keyAttempt + 1}]: ${msg}`);
        console.warn(`Google falló: ${modelName} key${keyAttempt + 1}`);
      }
    }
  }

  // Último recurso: OpenRouter
  console.warn("Google agotado, usando OpenRouter...");
  try {
    return await generateWithOpenRouter(prompt);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    errors.push(msg);
  }

  throw new Error(`Todos los servicios fallaron:\n${errors.join("\n")}`);
}