/**
 * ARCHIVO: app/api/pokemon/suggest/_lib/ai-client.ts
 *
 * Fixes aplicados:
 * ① thinkingBudget:0 en gemini-2.5-flash-lite — deshabilita thinking tokens
 *    (ahorra quota y evita JSON corrupto en el thinking block)
 * ② Backoff exponencial en 429: 1s → 2s → 4s antes de reintentar
 * ③ Captura correcta de DOMException (AbortSignal timeout) — no instanceof Error
 * ④ generateReport usa rateLimitKey separado (":report") — no compite con selección
 * ⑤ Extracción de texto robusta: filtra parts thought=true de modelos thinking
 */

import type { AISelectionResponse, AIReportResponse, AIError } from "./types";

interface GeminiPart {
  text?: string;
  thought?: boolean; // bloque de thinking de gemini-2.5-flash-lite
}

interface GeminiResponse {
  candidates?: Array<{ content?: { parts?: GeminiPart[] } }>;
  error?: { message: string; code: string };
}

interface OpenRouterResponse {
  choices?: Array<{ message?: { content: string } }>;
  error?: { message: string };
}

const GEMINI_ENDPOINT     = "https://generativelanguage.googleapis.com/v1beta/models";
const OPENROUTER_ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";

// Orden: mayor quota / más fiable primero.
// gemini-2.5-flash-lite: 30 RPM free, óptimo para JSON corto.
// gemini-2.5-flash: 20 RPM free.
// gemini-2.0-flash: quota 0 en cuentas nuevas — último recurso Gemini.
const GEMINI_MODELS = [
  "gemini-2.5-flash-lite",
  "gemini-2.5-flash",
  "gemini-2.0-flash",
];

// OpenRouter — fallback cuando Gemini agota quota.
// Para desbloquear openai/gpt-oss-*: https://openrouter.ai/settings/privacy
const OPENROUTER_MODELS = [
  "qwen/qwen3-coder:free",
  "cognitivecomputations/dolphin-mistral-24b-venice-edition:free",
  "mistralai/mistral-small-3.1-24b-instruct:free",
  "openai/gpt-oss-120b:free",   // requiere privacy opt-in en OpenRouter
  "openai/gpt-oss-20b:free",    // requiere privacy opt-in en OpenRouter
];

const GEMINI_TIMEOUT_MS     = 45_000;
const OPENROUTER_TIMEOUT_MS = 30_000;

// ─── Rate limit interno (por sesión) ─────────────────────────────
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_PER_MINUTE = 10;

function checkRateLimit(key: string): boolean {
  const now   = Date.now();
  const entry = rateLimitMap.get(key);
  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + 60_000 });
    return true;
  }
  if (entry.count >= RATE_LIMIT_PER_MINUTE) return false;
  entry.count++;
  return true;
}

// Fix ②: backoff antes de reintentar después de 429
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Fix ③: extraer mensaje de cualquier tipo de error, incluyendo DOMException
function extractErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (err && typeof err === "object") {
    const e = err as Record<string, unknown>;
    if (typeof e.message === "string") return e.message;
    if (typeof e.name === "string" && e.name === "TimeoutError") return "Request timed out";
    if (typeof e.name === "string" && e.name === "AbortError")   return "Request aborted";
  }
  return String(err);
}

// ─────────────────────────────────────────────────────────────────
// PARSER ROBUSTO — 4 niveles de recuperación
// ─────────────────────────────────────────────────────────────────
export function parseAIResponse<T>(raw: string): T {
  // Paso 1: limpiar markdown agresivamente
  let cleaned = raw
    .replace(/^[\s\S]*?```(?:json)?\s*/i, "")
    .replace(/\s*```[\s\S]*$/i, "")
    .trim();
  if (cleaned.includes("```")) {
    cleaned = cleaned.replace(/```(?:json)?/gi, "").trim();
  }

  // Paso 2: parse directo
  try { return JSON.parse(cleaned) as T; } catch (_) {}

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
        if (esc)                { esc = false; continue; }
        if (ch === "\\" && inStr) { esc = true; continue; }
        if (ch === '"')         { inStr = !inStr; continue; }
        if (inStr)              continue;
        if (ch === "{") braces++;
        if (ch === "}") braces--;
        if (ch === "[") brackets++;
        if (ch === "]") brackets--;
      }
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
  model: string,
  attemptNum: number
): Promise<string> {
  const url = `${GEMINI_ENDPOINT}/${model}:generateContent?key=${apiKey}`;

  // Fix ①: thinkingBudget:0 desactiva thinking en gemini-2.5-*.
  // Sin esto, 2.5-flash-lite genera un bloque <thinking> que consume quota extra
  // y puede contaminar el JSON de respuesta.
  const isThinkingModel = model.startsWith("gemini-2.5");

  const payload = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: {
      temperature:      0.7,
      topK:             40,
      topP:             0.95,
      maxOutputTokens:  8192,
      responseMimeType: "application/json",
      ...(isThinkingModel ? { thinkingConfig: { thinkingBudget: 0 } } : {}),
    },
  };

  let response: Response;
  try {
    response = await fetch(url, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(payload),
      signal:  AbortSignal.timeout(GEMINI_TIMEOUT_MS),
    });
  } catch (err) {
    throw { code: "GEMINI_ERROR", message: `Gemini ${model} (attempt ${attemptNum}): ${extractErrorMessage(err)}`, attemptNum, is429: false };
  }

  if (!response.ok) {
    let errMsg = response.statusText;
    try { errMsg = ((await response.json()) as GeminiResponse).error?.message ?? errMsg; } catch (_) {}
    throw { code: "GEMINI_ERROR", message: `Gemini ${model} (attempt ${attemptNum}): HTTP ${response.status} — ${errMsg}`, attemptNum, is429: response.status === 429 };
  }

  let data: GeminiResponse;
  try { data = (await response.json()) as GeminiResponse; }
  catch (err) { throw { code: "GEMINI_ERROR", message: `Gemini ${model} (attempt ${attemptNum}): failed to parse response`, attemptNum, is429: false }; }

  // Fix ⑤: filtrar parts con thought=true (bloque de thinking).
  // Con thinkingBudget:0 no deberían aparecer, pero filtramos por seguridad.
  const parts: GeminiPart[] = data.candidates?.[0]?.content?.parts ?? [];
  const text =
    // Prioridad 1: part sin thinking que empiece con JSON
    parts.filter(p => !p.thought && (p.text ?? "").trim().startsWith("{")).map(p => p.text!).at(-1)
    // Prioridad 2: cualquier part sin thinking con texto
    ?? parts.filter(p => !p.thought && (p.text ?? "").length > 0).map(p => p.text!).at(-1)
    // Último recurso: cualquier part con texto
    ?? parts.filter(p => (p.text ?? "").length > 0).map(p => p.text!).at(-1)
    ?? "";

  if (!text) throw { code: "GEMINI_ERROR", message: `Gemini ${model} (attempt ${attemptNum}): response has no usable text`, attemptNum, is429: false };
  return text;
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
  if (!apiKey) throw { code: "OPENROUTER_ERROR", message: "Missing OPENROUTER_API_KEY", attemptNum, is429: false };

  // OpenRouter NO acepta responseMimeType — el JSON se pide en el prompt.
  // max_tokens 4096: límite real de modelos free en OpenRouter.
  const payload = {
    model,
    messages:    [{ role: "user", content: prompt }],
    temperature: 0.7,
    top_p:       0.95,
    max_tokens:  4096,
  };

  let response: Response;
  try {
    response = await fetch(OPENROUTER_ENDPOINT, {
      method:  "POST",
      headers: {
        Authorization:  `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
        "X-Title":      "PokeBuilder Pro",
      },
      body:   JSON.stringify(payload),
      signal: AbortSignal.timeout(OPENROUTER_TIMEOUT_MS),
    });
  } catch (err) {
    throw { code: "OPENROUTER_ERROR", message: `OpenRouter ${model} (attempt ${attemptNum}): ${extractErrorMessage(err)}`, attemptNum, is429: false };
  }

  if (!response.ok) {
    let errMsg = response.statusText;
    try { errMsg = ((await response.json()) as OpenRouterResponse).error?.message ?? errMsg; } catch (_) {}
    throw { code: "OPENROUTER_ERROR", message: `OpenRouter ${model} (attempt ${attemptNum}): HTTP ${response.status} — ${errMsg}`, attemptNum, is429: response.status === 429 };
  }

  let data: OpenRouterResponse;
  try { data = (await response.json()) as OpenRouterResponse; }
  catch (err) { throw { code: "OPENROUTER_ERROR", message: `OpenRouter ${model} (attempt ${attemptNum}): failed to parse response`, attemptNum, is429: false }; }

  const text = data.choices?.[0]?.message?.content ?? "";
  if (!text) throw { code: "OPENROUTER_ERROR", message: `OpenRouter ${model} (attempt ${attemptNum}): response has no content`, attemptNum, is429: false };
  return text;
}

// ─────────────────────────────────────────────────────────────────
// FALLBACK CHAIN
// Orden: gemini-2.5-flash-lite (k1,k2) → gemini-2.5-flash (k1,k2)
//      → gemini-2.0-flash (k1,k2) → openrouter models...
//
// Fix ②: backoff exponencial en 429 — 1s, 2s, 4s máx.
// ─────────────────────────────────────────────────────────────────
export async function generateWithFallback(
  prompt: string,
  rateLimitKey?: string
): Promise<string> {
  if (rateLimitKey && !checkRateLimit(rateLimitKey)) {
    throw { code: "VALIDATION_ERROR", message: "Rate limit exceeded. Try again in 1 minute.", details: { rateLimitKey } };
  }

  const key1 = process.env.GOOGLE_AI_KEY_1;
  const key2 = process.env.GOOGLE_AI_KEY_2;

  type AttemptFn = () => Promise<string>;
  const attempts: AttemptFn[] = [];

  // Gemini: todos los modelos × todas las keys disponibles
  for (const model of GEMINI_MODELS) {
    let n = attempts.length + 1;
    if (key1) attempts.push(() => callGemini(prompt, key1, model, n++));
    if (key2) attempts.push(() => callGemini(prompt, key2, model, n++));
  }

  // OpenRouter
  for (const model of OPENROUTER_MODELS) {
    const n = attempts.length + 1;
    attempts.push(() => callOpenRouter(prompt, model, n));
  }

  let lastError: unknown;
  let consecutive429 = 0;

  for (let i = 0; i < attempts.length; i++) {
    try {
      const result = await attempts[i]();
      console.log(`✅ AI succeeded on attempt ${i + 1}/${attempts.length}`);
      return result;
    } catch (err) {
      lastError = err;
      const is429 = (err as any)?.is429 === true;
      console.warn(`⚠️ Attempt ${i + 1}/${attempts.length} failed: ${(err as any)?.message ?? err}`);

      // Fix ②: backoff en 429
      if (is429) {
        consecutive429++;
        const backoffMs = Math.min(1000 * Math.pow(2, consecutive429 - 1), 4000);
        console.warn(`⏳ 429 — backoff ${backoffMs}ms`);
        await sleep(backoffMs);
      } else {
        consecutive429 = 0;
      }
    }
  }

  const error: AIError = new Error(`All AI generation attempts failed after ${attempts.length} tries`) as AIError;
  error.code = "GEMINI_ERROR";
  try { error.details = { lastError: typeof lastError === "object" ? JSON.parse(JSON.stringify(lastError)) : String(lastError), totalAttempts: attempts.length }; }
  catch { error.details = { lastError: String(lastError), totalAttempts: attempts.length }; }
  error.attemptedKeys = attempts.length;
  throw error;
}

// ─────────────────────────────────────────────────────────────────
// EXPORTS PÚBLICOS
// ─────────────────────────────────────────────────────────────────
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
  // Fix ④: bucket de rate limit separado para reportes
  const reportKey = rateLimitKey ? `${rateLimitKey}:report` : undefined;
  const raw = await generateWithFallback(prompt, reportKey);
  return parseAIResponse<AIReportResponse>(raw);
}

export function hashConfig(config: Record<string, unknown>): string {
  const str = JSON.stringify(config);
  let hash  = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}