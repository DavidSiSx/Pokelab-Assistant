/**
 * ARCHIVO TEMPORAL DE DEBUG: app/api/pokemon/debug-ai/route.ts
 * Uso: GET /api/pokemon/debug-ai
 */

import { NextRequest, NextResponse } from "next/server";

const GEMINI_MODELS_TO_TEST = [
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite",
  "gemini-2.0-flash",
];

const OPENROUTER_MODELS_TO_TEST = [
  "qwen/qwen3-coder:free",
  "openai/gpt-oss-20b:free",
  "mistralai/mistral-small-3.1-24b-instruct:free",
];

async function testGemini(apiKey: string, model: string): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: 'Reply with ONLY valid JSON: {"ok":true}' }] }],
      generationConfig: {
        maxOutputTokens: 20,
        responseMimeType: "application/json",
      },
    }),
    signal: AbortSignal.timeout(15_000),
  });
  const data = await r.json();
  if (!r.ok) throw new Error(`HTTP ${r.status}: ${data.error?.message ?? r.statusText}`);
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("No text in response");
  return text.trim();
}

async function testOpenRouter(apiKey: string, model: string): Promise<string> {
  const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "http://localhost:3000",
    },
    body: JSON.stringify({
      model,
      messages: [{ role: "user", content: 'Reply with ONLY valid JSON: {"ok":true}' }],
      max_tokens: 20,
    }),
    signal: AbortSignal.timeout(20_000),
  });
  const data = await r.json();
  if (!r.ok) throw new Error(`HTTP ${r.status}: ${data.error?.message ?? r.statusText}`);
  const text = data.choices?.[0]?.message?.content;
  if (!text) throw new Error("No text in response");
  return text.trim();
}

export async function GET(req: NextRequest) {
  const results: Record<string, any> = {};

  const key1  = process.env.GOOGLE_AI_KEY_1;
  const key2  = process.env.GOOGLE_AI_KEY_2;
  const orKey = process.env.OPENROUTER_API_KEY;

  // ── 1. Env vars ───────────────────────────────────────────────
  results.env = {
    GOOGLE_AI_KEY_1:    key1  ? `✅ SET (${key1.slice(0, 8)}...)` : "❌ NOT SET",
    GOOGLE_AI_KEY_2:    key2  ? `✅ SET (${key2.slice(0, 8)}...)` : "❌ NOT SET",
    OPENROUTER_API_KEY: orKey ? `✅ SET (${orKey.slice(0, 8)}...)` : "❌ NOT SET",
  };

  // ── 2. Gemini — testear todos los modelos con KEY_1 ───────────
  results.gemini_key1 = {};
  if (key1) {
    for (const model of GEMINI_MODELS_TO_TEST) {
      const t0 = Date.now();
      try {
        const text = await testGemini(key1, model);
        results.gemini_key1[model] = `✅ OK (${Date.now() - t0}ms) — ${text}`;
      } catch (e: any) {
        results.gemini_key1[model] = `❌ ${e.message} (${Date.now() - t0}ms)`;
      }
    }
  } else {
    results.gemini_key1 = "⏭ SKIPPED";
  }

  // ── 3. Gemini — testear todos los modelos con KEY_2 ───────────
  results.gemini_key2 = {};
  if (key2) {
    for (const model of GEMINI_MODELS_TO_TEST) {
      const t0 = Date.now();
      try {
        const text = await testGemini(key2, model);
        results.gemini_key2[model] = `✅ OK (${Date.now() - t0}ms) — ${text}`;
      } catch (e: any) {
        results.gemini_key2[model] = `❌ ${e.message} (${Date.now() - t0}ms)`;
      }
    }
  } else {
    results.gemini_key2 = "⏭ SKIPPED";
  }

  // ── 4. OpenRouter — testear completion real con varios modelos ─
  results.openrouter = {};
  if (orKey) {
    for (const model of OPENROUTER_MODELS_TO_TEST) {
      const t0 = Date.now();
      try {
        const text = await testOpenRouter(orKey, model);
        results.openrouter[model] = `✅ OK (${Date.now() - t0}ms) — ${text}`;
      } catch (e: any) {
        results.openrouter[model] = `❌ ${e.message} (${Date.now() - t0}ms)`;
      }
    }
  } else {
    results.openrouter = "⏭ SKIPPED";
  }

  // ── 5. Resumen: qué usar ───────────────────────────────────────
  const workingGemini = Object.entries({
    ...results.gemini_key1,
    ...results.gemini_key2,
  }).filter(([, v]) => String(v).startsWith("✅")).map(([k]) => k);

  const workingOR = Object.entries(results.openrouter)
    .filter(([, v]) => String(v).startsWith("✅"))
    .map(([k]) => k);

  results.summary = {
    workingGeminiModels: [...new Set(workingGemini)],
    workingOpenRouterModels: workingOR,
    recommendation:
      workingGemini.length > 0
        ? `✅ Usa Gemini: ${workingGemini[0]}`
        : workingOR.length > 0
        ? `⚠️ Gemini sin quota — usa OpenRouter: ${workingOR[0]}`
        : "❌ NINGÚN servicio funciona — revisa las API keys y cuotas",
  };

  return NextResponse.json(results, { status: 200 });
}