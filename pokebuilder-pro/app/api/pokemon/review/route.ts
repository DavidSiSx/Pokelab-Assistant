import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/supabase/apiAuth";
import { checkRateLimit } from "@/lib/rateLimit";

// ── Modelos válidos en orden de preferencia ──────────────────────
const GEMINI_MODELS = [
  "gemini-2.5-flash",
  "gemini-2.0-flash",
  "gemini-1.5-flash",
];

async function callGemini(prompt: string, apiKey: string, model: string): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.5,
        maxOutputTokens: 8192, // FIX: era 4096 — el JSON del review puede superar 4096 tokens con pokemonRatings
        responseMimeType: "application/json",
      },
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw Object.assign(new Error(err?.error?.message ?? res.statusText), { status: res.status });
  }
  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("No text in Gemini response");
  return text;
}

async function generateWithFallback(prompt: string): Promise<string> {
  const keys = [process.env.GOOGLE_AI_KEY_1, process.env.GOOGLE_AI_KEY_2].filter(Boolean) as string[];
  if (!keys.length) throw new Error("No Gemini API key configured");

  const attempts: Array<{ key: string; model: string }> = [];
  for (const model of GEMINI_MODELS) {
    for (const key of keys) {
      attempts.push({ key, model });
    }
  }

  let lastError: unknown;
  for (const { key, model } of attempts) {
    try {
      const result = await callGemini(prompt, key, model);
      console.log(`✅ Review AI succeeded with ${model}`);
      return result;
    } catch (err: any) {
      lastError = err;
      const status = err?.status ?? 0;
      if (status !== 429 && status !== 404 && status !== 503) throw err;
      console.warn(`⚠️ Review ${model} failed (${status}), trying next...`);
    }
  }
  throw lastError;
}

// FIX: parser robusto — igual al de ai-client.ts pero inline para no crear dependencia circular
// El problema original: raw.replace(/^```.../) solo quita fences al inicio/fin pero
// gemini-2.5-flash a veces devuelve JSON con texto ANTES del bloque, lo que deja
// el string truncado y causa SyntaxError en JSON.parse.
function parseReviewResponse(raw: string): Record<string, unknown> {
  // Paso 1: limpiar markdown agresivamente desde cualquier posición
  let cleaned = raw
    .replace(/^[\s\S]*?```(?:json)?\s*/i, "")  // texto antes del fence + fence inicial
    .replace(/\s*```[\s\S]*$/i, "")             // fence final + texto después
    .trim();

  if (cleaned.includes("```")) {
    cleaned = cleaned.replace(/```(?:json)?/gi, "").trim();
  }

  // Paso 2: parse directo
  try {
    return JSON.parse(cleaned);
  } catch (_) {}

  // Paso 3: extraer primer JSON completo por balance de llaves
  try {
    const start = cleaned.indexOf("{");
    if (start !== -1) {
      let depth = 0, inString = false, escape = false, end = -1;
      for (let i = start; i < cleaned.length; i++) {
        const ch = cleaned[i];
        if (escape)                    { escape = false; continue; }
        if (ch === "\\" && inString)   { escape = true;  continue; }
        if (ch === '"')                { inString = !inString; continue; }
        if (inString)                  continue;
        if (ch === "{") depth++;
        if (ch === "}") { depth--; if (depth === 0) { end = i; break; } }
      }
      if (end !== -1) return JSON.parse(cleaned.slice(start, end + 1));
    }
  } catch (_) {}

  // Paso 4: JSON truncado — cerrar llaves/corchetes pendientes
  try {
    const start = cleaned.indexOf("{");
    if (start !== -1) {
      let fragment = cleaned.slice(start);
      let braces = 0, brackets = 0, inStr = false, esc = false;
      for (const ch of fragment) {
        if (esc)                  { esc = false; continue; }
        if (ch === "\\" && inStr) { esc = true;  continue; }
        if (ch === '"')           { inStr = !inStr; continue; }
        if (inStr)                continue;
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
      return JSON.parse(fragment);
    }
  } catch (_) {}

  throw new Error(`parseReviewResponse: JSON malformed. Raw preview: ${raw.slice(0, 200)}`);
}

const REVIEW_PROMPT = (teamDesc: string, format: string) => `
Eres analista de Pokémon competitivo nivel Campeonato Mundial. Sé directo y específico.
Formato: ${format}

EQUIPO:
${teamDesc}

REGLAS DE PENALIZACIÓN:
- Choice item + moves de estado/Protect = error grave
- Setter de clima sin abusadores = clima desperdiciado
- Sin control de velocidad (Tailwind/TR/Scarf/Icy Wind) = debilidad grave
- Doble debilidad x4 a un tipo común = fallo de cobertura

RESPONDE SOLO JSON VÁLIDO, sin texto extra:
{
  "score": 72,
  "grade": "B+",
  "analysis": "Análisis directo. Máx 2 frases.",
  "weakPoints": ["Debilidad específica 1", "Debilidad 2", "Debilidad 3"],
  "suggestions": ["Mejora accionable 1", "Mejora 2", "Mejora 3"],
  "metaVerdict": "Veredicto meta. Máx 1 frase.",
  "categories": {
    "offensiveCoverage": { "score": 80, "label": "Cobertura Ofensiva", "desc": "Breve." },
    "defensiveSynergy":  { "score": 65, "label": "Sinergia Defensiva", "desc": "Breve." },
    "speedControl":      { "score": 70, "label": "Control Velocidad",  "desc": "Breve." },
    "leadsAndCore":      { "score": 75, "label": "Leads y Core",       "desc": "Breve." },
    "itemSynergy":       { "score": 80, "label": "Sinergia de Items",  "desc": "Breve." },
    "consistency":       { "score": 70, "label": "Consistencia",       "desc": "Breve." },
    "metaViability":     { "score": 65, "label": "Viabilidad Meta",    "desc": "Breve." }
  },
  "pokemonRatings": {
    "NombrePokemon": { "score": 75, "comment": "Rol claro. Máx 10 palabras." }
  }
}`.trim();

export async function POST(request: NextRequest) {
  try {
    const { user, error: authError } = await requireAuth(request);
    if (authError) return authError;

    const limit = checkRateLimit(user!.id, "review");
    if (!limit.allowed) {
      return NextResponse.json({ error: "RATE_LIMITED", message: limit.message }, { status: 429 });
    }

    const body = await request.json();
    const { team, format } = body;

    if (!team || !Array.isArray(team) || team.length === 0 || team.length > 6) {
      return NextResponse.json({ error: "Equipo inválido (1-6 Pokémon)." }, { status: 400 });
    }

    const teamDesc = team.map((p: any, i: number) =>
      `${i + 1}. ${p.name || p.nombre} @ ${p.item || "—"} | Ability: ${p.ability || "—"} | Nature: ${p.nature || "—"} | Tera: ${p.teraType || "—"} | Moves: ${(p.moves ?? []).join(", ") || "—"}`
    ).join("\n");

    const raw = await generateWithFallback(REVIEW_PROMPT(teamDesc, format || "VGC 2025 Reg H"));

    // FIX: usar parseReviewResponse robusto en lugar de JSON.parse directo
    const reviewData = parseReviewResponse(raw);

    return NextResponse.json(reviewData);

  } catch (err: any) {
    if (err?.status === 429) {
      return NextResponse.json({ error: "CUOTA_AGOTADA", message: "Gemini quota excedida. Espera un momento." }, { status: 429 });
    }
    console.error("Error en /api/pokemon/review:", err);
    return NextResponse.json({ error: "Fallo en la evaluación. Intenta de nuevo." }, { status: 500 });
  }
}