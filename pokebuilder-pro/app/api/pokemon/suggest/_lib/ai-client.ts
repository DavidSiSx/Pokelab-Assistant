/**
 * ARCHIVO: app/api/pokemon/suggest/_lib/ai-client.ts
 *
 * Fixes aplicados:
 * - Gemini: gemini-2.0-flash → gemini-2.5-flash (único con quota activa)
 * - OpenRouter: modelos actualizados según los realmente disponibles en la cuenta
 * - maxOutputTokens: 2048 → 8192 (evita JSON truncado)
 * - parseAIResponse: robusto, intenta recuperar JSON truncado en 3 pasos
 */

import type { AISelectionResponse, AIReportResponse, AIError } from "./types";

interface GeminiResponse {
  candidates?: Array<{ content?: { parts?: Array<{ text: string }> } }>;
  error?: { message: string; code: string };
}

interface OpenRouterResponse {
  choices?: Array<{ message?: { content: string } }>;
  error?: { message: string };
}

const GEMINI_ENDPOINT     = "https://generativelanguage.googleapis.com/v1beta/models";
const OPENROUTER_ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";

// ✅ Modelos confirmados disponibles en tu cuenta OpenRouter
const OPENROUTER_MODELS = [
  "qwen/qwen3-coder:free",
  "mistralai/mistral-small-3.1-24b-instruct:free",
  "openai/gpt-oss-120b:free",
  "openai/gpt-oss-20b:free",
  "cognitivecomputations/dolphin-mistral-24b-venice-edition:free",
];

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_PER_MINUTE = 10;

function checkRateLimit(key: string): boolean {
  const now   = Date.now();
  const limit = rateLimitMap.get(key);
  if (!limit || now > limit.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + 60000 });
    return true;
  }
  if (limit.count >= RATE_LIMIT_PER_MINUTE) return false;
  limit.count++;
  return true;
}

// ─────────────────────────────────────────────────────────────────
// PARSER ROBUSTO — 3 niveles de recuperación
// ─────────────────────────────────────────────────────────────────
function parseAIResponse<T>(raw: string): T {
  // Paso 1: limpiar markdown agresivamente
  let cleaned = raw
    .replace(/^[\s\S]*?```(?:json)?\s*/i, "")
    .replace(/\s*```[\s\S]*$/i, "")
    .trim();
  // If still starts with ```, strip all code fences
  if (cleaned.includes("```")) {
    cleaned = cleaned.replace(/```(?:json)?/gi, "").trim();
  }

  // Paso 2: parse directo
  try {
    return JSON.parse(cleaned) as T;
  } catch (_) {}

  // Paso 3: extraer primer JSON completo por balance de llaves
  try {
    const start = cleaned.indexOf("{");
    if (start !== -1) {
      let depth = 0, inString = false, escape = false, end = -1;
      for (let i = start; i < cleaned.length; i++) {
        const ch = cleaned[i];
        if (escape)                  { escape = false; continue; }
        if (ch === "\\" && inString) { escape = true;  continue; }
        if (ch === '"')              { inString = !inString; continue; }
        if (inString)                continue;
        if (ch === "{") depth++;
        if (ch === "}") { depth--; if (depth === 0) { end = i; break; } }
      }
      if (end !== -1) return JSON.parse(cleaned.slice(start, end + 1)) as T;
    }
  } catch (_) {}

  // Paso 4: JSON truncado — cerrar llaves/corchetes pendientes
  try {
    const start = cleaned.indexOf("{");
    if (start !== -1) {
      let fragment = cleaned.slice(start);
      let braces = 0, brackets = 0, inStr = false, esc = false;
      for (const ch of fragment) {
        if (esc)               { esc = false; continue; }
        if (ch === "\\" && inStr) { esc = true; continue; }
        if (ch === '"')        { inStr = !inStr; continue; }
        if (inStr)             continue;
        if (ch === "{") braces++;
        if (ch === "}") braces--;
        if (ch === "[") brackets++;
        if (ch === "]") brackets--;
      }
      // Eliminar propiedad o coma incompleta al final
      fragment = fragment
        .replace(/,\s*"[^"]*"\s*:\s*[^,{[\]}"]*$/, "")
        .replace(/,\s*$/, "");
      fragment += "]".repeat(Math.max(0, brackets));
      fragment += "}".repeat(Math.max(0, braces));
      return JSON.parse(fragment) as T;
    }
  } catch (_) {}

  throw {
    code:    "PARSE_ERROR",
    message: "Failed to parse AI response: JSON malformed or truncated beyond recovery",
    details: { raw: raw.substring(0, 300) },
  };
}

// ─────────────────────────────────────────────────────────────────
// GEMINI
// ─────────────────────────────────────────────────────────────────
async function callGemini(
  prompt: string,
  apiKey: string,
  attemptNum: number
): Promise<string> {
  // ✅ gemini-2.5-flash — tiene quota activa (gemini-2.0-flash tiene 0/0)
  const model = "gemini-2.5-flash";
  const url   = `${GEMINI_ENDPOINT}/${model}:generateContent?key=${apiKey}`;

  const payload = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      temperature:     0.7,
      topK:            40,
      topP:            0.95,
      maxOutputTokens: 16384,
      responseMimeType: "application/json",
    },
  };

  try {
    const response = await fetch(url, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = (await response.json()) as GeminiResponse;
      throw new Error(
        `Gemini error (attempt ${attemptNum}): ${error.error?.message || response.statusText}`
      );
    }

    const data = (await response.json()) as GeminiResponse;
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error(`No text in Gemini response (attempt ${attemptNum})`);
    return text;
  } catch (err) {
    throw {
      code:       "GEMINI_ERROR",
      message:    err instanceof Error ? err.message : "Unknown Gemini error",
      attemptNum,
    };
  }
}

// ─────────────────────────────────────────────────────────────────
// OPENROUTER
// ─────────────────────────────────────────────────────────────────
async function callOpenRouter(
  prompt: string,
  model: string,
  attemptNum: number
): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw { code: "OPENROUTER_ERROR", message: "Missing OPENROUTER_API_KEY", attemptNum };
  }

  const payload = {
    model,
    messages:    [{ role: "user", content: prompt }],
    temperature: 0.7,
    top_p:       0.95,
    max_tokens:  16384,
  };

  try {
    const response = await fetch(OPENROUTER_ENDPOINT, {
      method:  "POST",
      headers: {
        Authorization:  `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://pokebuilder.pro",
        "X-Title":      "PokeBuilder Pro v2.0",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = (await response.json()) as OpenRouterResponse;
      throw new Error(
        `OpenRouter error (attempt ${attemptNum}): ${error.error?.message || response.statusText}`
      );
    }

    const data = (await response.json()) as OpenRouterResponse;
    const text = data.choices?.[0]?.message?.content;
    if (!text) throw new Error(`No text in OpenRouter response (attempt ${attemptNum})`);
    return text;
  } catch (err) {
    throw {
      code:       "OPENROUTER_ERROR",
      message:    err instanceof Error ? err.message : "Unknown OpenRouter error",
      attemptNum,
    };
  }
}

// ─────────────────────────────────────────────────────────────────
// FALLBACK CHAIN
// ─────────────────────────────────────────────────────────────────
export async function generateWithFallback(
  prompt: string,
  rateLimitKey?: string
): Promise<string> {
  if (rateLimitKey && !checkRateLimit(rateLimitKey)) {
    throw {
      code:    "VALIDATION_ERROR",
      message: "Rate limit exceeded. Try again in 1 minute.",
      details: { rateLimitKey },
    };
  }

  const key1 = process.env.GOOGLE_AI_KEY_1;
  const key2 = process.env.GOOGLE_AI_KEY_2;

  const attempts: Array<() => Promise<string>> = [
    key1
      ? () => callGemini(prompt, key1, 1)
      : () => Promise.reject({ code: "GEMINI_ERROR", message: "Missing GOOGLE_AI_KEY_1", attemptNum: 1 }),
    key2
      ? () => callGemini(prompt, key2, 2)
      : () => Promise.reject({ code: "GEMINI_ERROR", message: "Missing GOOGLE_AI_KEY_2", attemptNum: 2 }),
    ...OPENROUTER_MODELS.map((model, idx) =>
      () => callOpenRouter(prompt, model, 3 + idx)
    ),
  ];

  let lastError: unknown;

  for (let i = 0; i < attempts.length; i++) {
    try {
      const result = await attempts[i]();
      console.log(`✅ AI generation succeeded on attempt ${i + 1}/${attempts.length}`);
      return result;
    } catch (err) {
      lastError = err;
      try {
        console.warn(
          `⚠️ Attempt ${i + 1}/${attempts.length} failed:`,
          err instanceof Error ? err.message : JSON.stringify(err)
        );
      } catch (e) {
        console.warn(`⚠️ Attempt ${i + 1}/${attempts.length} failed: (unserializable error)`);
      }
    }
  }

  const error: AIError = new Error(
    `All AI generation attempts failed after ${attempts.length} tries`
  ) as AIError;
  error.code          = "GEMINI_ERROR";
  // Attach a serializable summary of lastError to help debugging
  try {
    error.details = { lastError: typeof lastError === 'object' ? JSON.parse(JSON.stringify(lastError)) : String(lastError), totalAttempts: attempts.length };
  } catch {
    error.details = { lastError: String(lastError), totalAttempts: attempts.length };
  }
  error.attemptedKeys = attempts.length;
  throw error;
}

export async function generateSelection(
  prompt: string,
  rateLimitKey?: string
): Promise<AISelectionResponse> {
  const raw = await generateWithFallback(prompt, rateLimitKey);
  return parseAIResponse<AISelectionResponse>(raw);
}

export async function generateReport(
  prompt: string,
  rateLimitKey?: string
): Promise<AIReportResponse> {
  const raw = await generateWithFallback(prompt, rateLimitKey);
  return parseAIResponse<AIReportResponse>(raw);
}

export function hashConfig(config: Record<string, unknown>): string {
  const str = JSON.stringify(config);
  let hash  = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}
