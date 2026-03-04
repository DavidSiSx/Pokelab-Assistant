import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/supabase/apiAuth";
import { checkRateLimit } from "@/lib/rateLimit";

// ── Modelos válidos en orden de preferencia ─────────────────────────────────
// gemini-1.5-flash-8b fue deprecado; usar 2.5-flash como principal
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
        maxOutputTokens: 4096,
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
      // Only continue on rate-limit or not-found; throw others immediately
      if (status !== 429 && status !== 404 && status !== 503) throw err;
      console.warn(`⚠️ Review ${model} failed (${status}), trying next...`);
    }
  }
  throw lastError;
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

    // Strip possible markdown fences
    const clean = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```\s*$/i, "").trim();
    const reviewData = JSON.parse(clean);

    return NextResponse.json(reviewData);

  } catch (err: any) {
    if (err?.status === 429) {
      return NextResponse.json({ error: "CUOTA_AGOTADA", message: "Gemini quota excedida. Espera un momento." }, { status: 429 });
    }
    console.error("Error en /api/pokemon/review:", err);
    return NextResponse.json({ error: "Fallo en la evaluación. Intenta de nuevo." }, { status: 500 });
  }
}