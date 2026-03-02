/**
 * ARCHIVO: app/api/pokemon/suggest/_lib/ai-client.ts
 * Cliente de IA con estrategia de fallback multi-key
 *
 * Orden de intentos (6 total):
 * 1. Gemini KEY_1
 * 2. Gemini KEY_2
 * 3. OpenRouter (Nous-Hermes-3-Sonnet)
 * 4. OpenRouter (Meta-Llama-3-8B)
 * 5. OpenRouter (Mistral-7B)
 * 6. OpenRouter (Llama-2-7B-Chat)
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

const GEMINI_ENDPOINT    = "https://generativelanguage.googleapis.com/v1beta/models";
const OPENROUTER_ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";

const OPENROUTER_MODELS = [
  "nous-hermes-3-sonnet:free",
  "meta-llama/llama-3-8b-instruct:free",
  "mistralai/mistral-7b-instruct:free",
  "meta-llama/llama-2-7b-chat:free",
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

function parseAIResponse<T>(raw: string): T {
  try {
    const cleaned = raw
      .replace(/^```(?:json)?\n?/, "")
      .replace(/\n?```$/, "")
      .trim();
    return JSON.parse(cleaned) as T;
  } catch (err) {
    throw {
      code: "PARSE_ERROR",
      message: `Failed to parse AI response: ${err instanceof Error ? err.message : "Unknown error"}`,
      details: { raw: raw.substring(0, 200) },
    };
  }
}

async function callGemini(
  prompt: string,
  apiKey: string,
  attemptNum: number
): Promise<string> {
  const model = "gemini-2.0-flash";
  const url   = `${GEMINI_ENDPOINT}/${model}:generateContent?key=${apiKey}`;

  const payload = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      temperature:     0.7,
      topK:            40,
      topP:            0.95,
      maxOutputTokens: 2048,
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
    messages:   [{ role: "user", content: prompt }],
    temperature: 0.7,
    top_p:       0.95,
    max_tokens:  2048,
  };

  try {
    const response = await fetch(OPENROUTER_ENDPOINT, {
      method:  "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
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

  const attempts = [
    key1
      ? async () => callGemini(prompt, key1, 1)
      : async () => { throw { code: "GEMINI_ERROR", message: "Missing GOOGLE_AI_KEY_1", attemptNum: 1 }; },
    key2
      ? async () => callGemini(prompt, key2, 2)
      : async () => { throw { code: "GEMINI_ERROR", message: "Missing GOOGLE_AI_KEY_2", attemptNum: 2 }; },
    ...OPENROUTER_MODELS.map((model, idx) => async () =>
      callOpenRouter(prompt, model, 3 + idx)
    ) as Array<() => Promise<string>>,
  ];

  let lastError: unknown;

  for (let i = 0; i < attempts.length; i++) {
    try {
      const result = await attempts[i]();
      console.log(`✅ AI generation succeeded on attempt ${i + 1}/${attempts.length}`);
      return result;
    } catch (err) {
      lastError = err;
      console.warn(
        `⚠️ Attempt ${i + 1}/${attempts.length} failed:`,
        err instanceof Error ? err.message : err
      );
    }
  }

  const error: AIError = new Error(
    "All AI generation attempts failed after 6 tries"
  ) as AIError;
  error.code            = "GEMINI_ERROR";
  error.details         = { lastError, totalAttempts: attempts.length };
  error.attemptedKeys   = attempts.length;
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