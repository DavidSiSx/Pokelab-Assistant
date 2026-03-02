import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { requireAuth } from "@/lib/supabase/apiAuth";
import { checkRateLimit } from "@/lib/rateLimit";

const API_KEY = process.env.GOOGLE_AI_KEY_1 || process.env.GOOGLE_AI_KEY_2 || "";
const genAI   = new GoogleGenerativeAI(API_KEY);

// Modelos existentes en orden de preferencia
const MODEL_PRIORITY = ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-flash-8b"];

async function generateWithFallback(prompt: string) {
  let lastError: unknown;
  for (const modelName of MODEL_PRIORITY) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      return await model.generateContent(prompt);
    } catch (error: any) {
      lastError = error;
      if (error.status === 429 || error.status === 404) continue;
      throw error;
    }
  }
  throw lastError;
}

const ELITE_COMPETITIVE_RULES = `
  CRITERIOS DE PENALIZACIÓN SEVERA (RESTA PUNTOS SI EL USUARIO FALLA AQUÍ):
  - REGLA CHOICE / ASSAULT VEST: Si un Pokémon lleva "Choice Band/Specs/Scarf" o "Assault Vest",
    SUS 4 MOVIMIENTOS DEBEN SER DE DAÑO DIRECTO. Si tienen Protect o moves de estado con estos objetos,
    asume que el usuario es novato y penalízalo.
  - EVIOLITE: Pre-evoluciones viables (Porygon2, Dusclops, Clefairy) sin Eviolite son un error táctico crítico.
  - OBJETOS EXCLUSIVOS: Pikachu sin Light Ball, o Marowak sin Thick Club, es un fallo garrafal.
  - SINERGIAS DE CLIMA/TERRENO: Si hay un setter (Drizzle/Drought) pero no hay abusadores
    (Swift Swim/Chlorophyll), el clima está desperdiciado.
  - CONTROL DE VELOCIDAD: Equipos sin Tailwind, Trick Room, Icy Wind o Choice Scarf
    son presa fácil en el meta moderno.
`;

export async function POST(request: Request) {
  try {
    // Auth
    const { user, error: authError } = await requireAuth();
    if (authError) return authError;

    // Rate limit centralizado
    const limit = checkRateLimit(user!.id, "review");
    if (!limit.allowed) {
      return NextResponse.json(
        { error: "RATE_LIMITED", message: limit.message },
        { status: 429 }
      );
    }

    const { team, format, mechanics } = await request.json();

    if (!API_KEY) {
      return NextResponse.json({ error: "Falta API Key de Gemini" }, { status: 500 });
    }

    if (!team || !Array.isArray(team) || team.length === 0 || team.length > 6) {
      return NextResponse.json(
        { error: "Equipo inválido. Debe tener entre 1 y 6 Pokémon." },
        { status: 400 }
      );
    }

    const teamDescription = team.map((p: any, i: number) => `
${i + 1}. ${p.name}
   - Item: ${p.item || "Ninguno"}
   - Ability: ${p.ability || "No especificada"}
   - Nature: ${p.nature || "No especificada"}
   - Tera Type: ${p.teraType || "No especificado"}
   - Moves: ${(p.moves || []).filter(Boolean).join(", ") || "No especificados"}
   - EVs: ${p.evs || "No especificados"}
   - Mechanic: ${p.mechanic || "Ninguna"}`
    ).join("\n");

    const mechanicsNote = mechanics
      ? `Mecánicas habilitadas: ${Object.entries(mechanics).filter(([_, v]) => v).map(([k]) => k).join(", ")}`
      : "";

    const prompt = `
Eres el Juez Principal y Head Coach de un campeonato mundial de Pokémon.
FORMATO: ${format || "VGC Doubles"}
${mechanicsNote}

EQUIPO PROPUESTO:
${teamDescription}

${ELITE_COMPETITIVE_RULES}

DEVUELVE SOLO JSON con este formato exacto (TODAS LAS PUNTUACIONES SON SOBRE 100):
{
  "score": 74,
  "grade": "B+",
  "categories": {
    "sinergia":      { "score": 80, "label": "Sinergia de Equipo",   "desc": "Evaluación de la sinergia" },
    "cobertura":     { "score": 70, "label": "Cobertura Ofensiva",   "desc": "Evaluación de cobertura de tipos" },
    "speedControl":  { "score": 60, "label": "Control de Velocidad", "desc": "Tailwind/Trick Room/Scarf presentes o no" },
    "matchupSpread": { "score": 75, "label": "Spread de Matchups",   "desc": "Respuesta a amenazas del meta" },
    "itemsOptim":    { "score": 85, "label": "Optimización Items",   "desc": "Objetos correctos o no" },
    "consistencia":  { "score": 65, "label": "Consistencia",         "desc": "Fiabilidad del plan de juego" },
    "originalidad":  { "score": 55, "label": "Factor Sorpresa",      "desc": "Predictibilidad en el meta" }
  },
  "analysis": "2-3 párrafos sobre Win Conditions y viabilidad en el meta actual.",
  "weakPoints": ["Debilidad crítica 1", "Debilidad 2", "Debilidad 3"],
  "suggestions": ["Sugerencia concreta 1", "Sugerencia 2", "Sugerencia 3"],
  "pokemonRatings": {
    "NombrePokemon": { "score": 82, "comment": "Comentario agresivo pero útil sobre la build..." }
  },
  "metaVerdict": "Una frase corta y contundente. Máx 15 palabras."
}

REGLAS:
- score general: promedio ponderado de las 7 categorías, número entero.
- grade: A+ A A- B+ B B- C+ C D F (90+=A+, 85+=A, 80+=A-, 75+=B+, 70+=B, 65+=B-, 60+=C+, 55+=C, 45+=D, <45=F).
- Cada categoría: score entero 0-100.
- Sé HONESTO y BRUTAL: un equipo sin Protect en Doubles merece speedControl < 40.
    `.trim();

    const result = await generateWithFallback(prompt);
    const text = result.response.text();

    // Extrae el JSON aunque venga envuelto en ```json ... ```
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error("JSON inválido en respuesta de IA");

    const reviewData = JSON.parse(jsonMatch[0]);
    return NextResponse.json(reviewData);

  } catch (error: any) {
    if (error.status === 429) {
      return NextResponse.json(
        { error: "CUOTA_AGOTADA", message: "Cuota de Gemini excedida. Espera un minuto." },
        { status: 429 }
      );
    }
    console.error("Error en /api/pokemon/review:", error);
    return NextResponse.json({ error: "Fallo en la evaluación del equipo." }, { status: 500 });
  }
}