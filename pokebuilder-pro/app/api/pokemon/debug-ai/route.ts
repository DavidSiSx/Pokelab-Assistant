/**
 * ARCHIVO TEMPORAL DE DEBUG: app/api/pokemon/debug-ai/route.ts
 * Eliminar después de diagnosticar el problema
 * Uso: GET /api/pokemon/debug-ai
 */

import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const results: Record<string, any> = {};

  // ── 1. Verificar variables de entorno ──────────────────────────
  const key1 = process.env.GOOGLE_AI_KEY_1;
  const key2 = process.env.GOOGLE_AI_KEY_2;
  const orKey = process.env.OPENROUTER_API_KEY;

  results.env = {
    GOOGLE_AI_KEY_1:    key1  ? `✅ SET (${key1.slice(0,8)}...)` : "❌ NOT SET",
    GOOGLE_AI_KEY_2:    key2  ? `✅ SET (${key2.slice(0,8)}...)` : "❌ NOT SET",
    OPENROUTER_API_KEY: orKey ? `✅ SET (${orKey.slice(0,8)}...)` : "❌ NOT SET",
  };

  // ── 2. Test Gemini KEY_1 ───────────────────────────────────────
  if (key1) {
    try {
      const r = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key1}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: "Reply with just the word: OK" }] }],
            generationConfig: { maxOutputTokens: 10 },
          }),
        }
      );
      const data = await r.json();
      if (r.ok) {
        results.gemini_key1 = `✅ OK — response: ${data.candidates?.[0]?.content?.parts?.[0]?.text}`;
      } else {
        results.gemini_key1 = `❌ HTTP ${r.status}: ${data.error?.message}`;
      }
    } catch (e: any) {
      results.gemini_key1 = `❌ EXCEPTION: ${e.message}`;
    }
  } else {
    results.gemini_key1 = "⏭ SKIPPED (key not set)";
  }

  // ── 3. Test Gemini KEY_2 ───────────────────────────────────────
  if (key2) {
    try {
      const r = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key2}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: "Reply with just the word: OK" }] }],
            generationConfig: { maxOutputTokens: 10 },
          }),
        }
      );
      const data = await r.json();
      if (r.ok) {
        results.gemini_key2 = `✅ OK — response: ${data.candidates?.[0]?.content?.parts?.[0]?.text}`;
      } else {
        results.gemini_key2 = `❌ HTTP ${r.status}: ${data.error?.message}`;
      }
    } catch (e: any) {
      results.gemini_key2 = `❌ EXCEPTION: ${e.message}`;
    }
  } else {
    results.gemini_key2 = "⏭ SKIPPED (key not set)";
  }

  // ── 4. Test OpenRouter — listar modelos disponibles ───────────
  if (orKey) {
    try {
      const r = await fetch("https://openrouter.ai/api/v1/models", {
        headers: { Authorization: `Bearer ${orKey}` },
      });
      const data = await r.json();
      if (r.ok) {
        // Filtrar solo los free
        const freeModels = (data.data as any[])
          ?.filter(m => m.id.endsWith(":free"))
          .map(m => m.id)
          .slice(0, 20);
        results.openrouter_models_free = freeModels ?? [];
        results.openrouter_status = `✅ OK — ${data.data?.length} modelos totales`;
      } else {
        results.openrouter_status = `❌ HTTP ${r.status}: ${JSON.stringify(data)}`;
      }
    } catch (e: any) {
      results.openrouter_status = `❌ EXCEPTION: ${e.message}`;
    }
  } else {
    results.openrouter_status = "⏭ SKIPPED (key not set)";
  }

  return NextResponse.json(results, { status: 200 });
}