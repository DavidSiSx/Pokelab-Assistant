/**
 * ARCHIVO: app/api/pokemon/suggest/route.ts
 *
 * Fixes aplicados:
 * ① Reintentos de selección con prompt diferente — los errores de validación
 *    se pasan a buildSelectionPrompt en cada reintento, haciendo cada intento único.
 * ② Promise.allSettled para reportes — si falla el reporte 2, el reporte 1
 *    se conserva en lugar de descartarse junto con él.
 * ③ Prompts de reporte construidos UNA sola vez — buildReportPromptPart1/2
 *    se llamaban 2-3 veces cada uno (una para medir chars, otra en generateReport).
 * ④ confirmedTeam con tipos reales — se obtienen de poolArray para evitar
 *    tipos vacíos en el reporte (sanitizeBuilds no preserva tipo1/tipo2).
 * ⑤ sessionId anónimo con sufijo aleatorio — evita que todas las sesiones
 *    sin header compartan el mismo bucket de rate limit en ai-client.
 */

import { NextRequest, NextResponse } from "next/server";
import type {
  SuggestRequest,
  SuggestResponse,
  AISelectionResponse,
  AIReportResponse,
} from "./_lib/types";
import { generateSelection, generateReport, hashConfig } from "./_lib/ai-client";
import { buildCandidatePool } from "./_lib/pool-builder";
import {
  buildSelectionPrompt,
  buildReportPromptPart1,
  buildReportPromptPart2,
  buildComboPrompt,
  buildModeModifiers,
  buildCandidateString,
  buildItemClauseRule,
  buildExperiencePrompt,
} from "./_lib/prompt-builder";
import { sanitizeBuilds } from "./_lib/mega-validator";
import { normalizeConfig } from "./_lib/filters";
import { checkRateLimit } from "@/lib/rateLimit";
import {
  Logger,
  validateSelectionResponse,
  validateReportResponse,
} from "@/lib/debug-logger";

// ─── Constantes ───────────────────────────────────────────────────
const MAX_SELECTION_RETRIES = 2; // total intentos = 3

interface ParsedBody extends SuggestRequest {
  swapCount?: number;
}

export async function POST(req: NextRequest): Promise<NextResponse<SuggestResponse>> {
  // Fix ⑤: sufijo aleatorio para anonimos — evita colisión de rate limit entre usuarios
  const rawSession  = req.headers.get("x-session-id");
  const sessionId   = rawSession ?? `anon-${Math.random().toString(36).slice(2, 9)}`;
  const logger      = new Logger("suggest");
  logger.start(sessionId, { url: req.url });

  const warnings: string[] = [];

  try {
    // ── 1. Rate limit ────────────────────────────────────────────
    const closeRL = logger.step("rate-limit", { sessionId });
    const limit   = checkRateLimit(sessionId, "suggest");
    closeRL();

    if (!limit.allowed) {
      logger.warn("rate-limit", limit.message);
      logger.end({ success: false, warnings: [limit.message] });
      return NextResponse.json(
        { success: false, suggestions: [], report: {} as any, meta: {} as any, warnings: [limit.message] },
        { status: 429 }
      );
    }

    // ── 2. Parsear body ──────────────────────────────────────────
    const closeReqParse = logger.step("request-parse");
    let body: ParsedBody;
    try {
      body = (await req.json()) as ParsedBody;
    } catch (e) {
      closeReqParse("error");
      return NextResponse.json(
        { success: false, suggestions: [], report: {} as any, meta: {} as any, warnings: ["Body inválido"] },
        { status: 400 }
      );
    }
    closeReqParse();

    const { lockedTeam, config, slotIndex, swapCount } = body;

    // ── 3. Validación de entrada ─────────────────────────────────
    const closeVal = logger.step("validation", { slotIndex, hasConfig: !!config });
    const inputErrors: string[] = [];
    if (!config)                              inputErrors.push("config es requerido");
    if (slotIndex == null)                    inputErrors.push("slotIndex es requerido");
    else if (slotIndex < 0 || slotIndex > 5) inputErrors.push(`slotIndex inválido: ${slotIndex}`);
    closeVal(inputErrors.length ? "error" : "ok");

    if (inputErrors.length > 0) {
      logger.end({ success: false, warnings: inputErrors });
      return NextResponse.json(
        { success: false, suggestions: [], report: {} as any, meta: {} as any, warnings: inputErrors },
        { status: 400 }
      );
    }

    // ── 4. Normalizar config ─────────────────────────────────────
    const closeNorm      = logger.step("config-normalize");
    const normalizedConfig = normalizeConfig(config);
    const hasItemClause  = normalizedConfig.clauses?.some(
      (c: string) => c.toLowerCase().includes("item clause")
    ) ?? false;
    closeNorm("ok", { format: normalizedConfig.format });

    // ── 5. Derivar equipo ────────────────────────────────────────
    const team       = lockedTeam || [];
    const leader     = team[0] ?? null;
    const leaderId   = leader?.id ?? null;
    const leaderName = leader?.nombre ?? null;
    const lockedIds  = team.slice(1).map((p) => p.id);
    const lockedNames= team.slice(1).map((p) => p.nombre);
    const slotsNeeded= swapCount != null ? swapCount : Math.max(1, 6 - team.length);

    // ── 6. Construir pool ────────────────────────────────────────
    logger.step("pool-build", { leaderId, slotsNeeded });
    let poolArray: any[], isDynamicMode: boolean, detectedCombos: any[], comboItemOverrides: Record<string, string>;
    try {
      const poolResult = await buildCandidatePool(
        { leaderId, lockedIds, ignoredIds: [], blacklist: normalizedConfig.blacklist || [], config: normalizedConfig },
        slotsNeeded, false, leaderName, lockedNames
      );
      poolArray         = poolResult.candidatePool;
      isDynamicMode     = poolResult.isDynamicMode;
      detectedCombos    = poolResult.detectedCombos;
      comboItemOverrides= poolResult.comboItemOverrides;
    } catch (e) {
      logger.error("pool-build", e);
      logger.end({ success: false });
      return NextResponse.json(
        { success: false, suggestions: [], report: {} as any, meta: {} as any,
          warnings: [`Error construyendo el pool: ${e instanceof Error ? e.message : e}`] },
        { status: 500 }
      );
    }

    if (poolArray.length < slotsNeeded) {
      warnings.push(`Pool reducido: solo ${poolArray.length} candidatos disponibles`);
    }

    // ── 7. Construir partes del prompt (una sola vez) ────────────
    const closePromptBuild   = logger.step("prompt-build");
    const candidatesString   = buildCandidateString(poolArray, normalizedConfig);
    const lockedString       = team.slice(1)
      .map((p) => `[ID:${p.id}] ${p.nombre} (${p.tipo1}${p.tipo2 ? "/" + p.tipo2 : ""})`)
      .join("\n");
    const modeModifiers      = buildModeModifiers(normalizedConfig);
    const experiencePrompt   = buildExperiencePrompt(normalizedConfig.experienceLevel ?? "experto");
    const itemClauseRule     = buildItemClauseRule(normalizedConfig);
    const comboContext       = buildComboPrompt(detectedCombos, comboItemOverrides);
    const leaderConstraints  = leaderName
      ? ` El equipo debe complementar a ${leaderName} como pieza central.`
      : "";
    // Fix ⑦: IDs válidos como array de números para el prompt
    const validPoolIds: number[] = poolArray.map((p: any) => Number(p.id));

    closePromptBuild("ok", { candidateCount: poolArray.length });

    // ── 8. Selección AI con reintentos ───────────────────────────
    let selectionsRaw: AISelectionResponse | null = null;
    let prevErrors: string[] = []; // Fix ①: acumular errores para el siguiente intento

    for (let attempt = 1; attempt <= MAX_SELECTION_RETRIES + 1; attempt++) {
      const aiStartMs = Date.now();
      const closeAI   = logger.step("ai-selection", { attempt });

      // Fix ①: reconstruir prompt con errores previos en cada reintento
      const selectionPrompt = buildSelectionPrompt(
        candidatesString, lockedString, leaderName, leaderConstraints,
        slotsNeeded, normalizedConfig, modeModifiers, experiencePrompt,
        itemClauseRule, comboContext,
        validPoolIds,  // Fix ⑦
        prevErrors,    // Fix ①
      );

      logger.aiCall("selection", selectionPrompt.length, "gemini", attempt);

      try {
        selectionsRaw = await generateSelection(selectionPrompt, sessionId);
      } catch (e) {
        logger.error("ai-selection", e, { attempt });
        if (attempt > MAX_SELECTION_RETRIES) throw e;
        prevErrors = [`Error de conexión: ${e instanceof Error ? e.message : String(e)}`];
        closeAI("error");
        continue;
      }

      const aiDurationMs = Date.now() - aiStartMs;
      const validation   = validateSelectionResponse(
        selectionsRaw, validPoolIds, slotsNeeded,
        { itemClause: hasItemClause, isMonotype: normalizedConfig.isMonotype, monoTypeSelected: normalizedConfig.monoTypeSelected }
      );

      logger.aiResult("selection", JSON.stringify(selectionsRaw).length, validation.errors, aiDurationMs, "gemini", attempt);

      if (validation.warnings.length > 0) {
        validation.warnings.forEach(w => warnings.push(w));
      }

      if (validation.valid) {
        closeAI("ok");
        prevErrors = [];
        break;
      }

      // Fix ①: guardar errores para inyectar en el siguiente intento
      prevErrors = validation.errors;
      logger.warn("ai-selection", `Attempt ${attempt} inválido: ${validation.errors.join(" | ")}`);

      if (attempt <= MAX_SELECTION_RETRIES) {
        logger.aiRetry("selection", attempt + 1, validation.errors.join(", "));
        closeAI("warn");
      } else {
        closeAI("warn");
        warnings.push(`⚠️ La IA no respetó todas las reglas: ${validation.errors.join(" | ")}`);
      }
    }

    if (!selectionsRaw) {
      logger.end({ success: false });
      return NextResponse.json(
        { success: false, suggestions: [], report: {} as any, meta: {} as any,
          warnings: ["La IA no devolvió respuesta válida tras todos los intentos"] },
        { status: 500 }
      );
    }

    // ── 9. Normalizar selecciones ────────────────────────────────
    const closeSanitize = logger.step("sanitize");
    let suggestions: any[] = [];

    if (Array.isArray(selectionsRaw.selected_ids) && selectionsRaw.builds) {
      suggestions = selectionsRaw.selected_ids.map((id: number) => {
        const build = selectionsRaw!.builds![String(id)];
        const poke  = poolArray.find((p: any) => Number(p.id) === Number(id));
        if (!poke || !build) {
          logger.warn("sanitize", `ID ${id} no en pool o sin build — omitiendo`);
          return null;
        }
        return {
          id: Number(id), name: poke.nombre, tier: poke.tier || "Unranked",
          tipo1: poke.tipo1, tipo2: poke.tipo2 ?? null, // Fix ④: tipos del pool, no del build
          ability: build.ability || "", nature: build.nature || "", item: build.item || "",
          moves: Array.isArray(build.moves) ? build.moves : [],
          ev_hp: build.ev_hp ?? 0, ev_atk: build.ev_atk ?? 0, ev_def: build.ev_def ?? 0,
          ev_spa: build.ev_spa ?? 0, ev_spd: build.ev_spd ?? 0, ev_spe: build.ev_spe ?? 0,
          iv_atk: build.iv_atk, teraType: build.teraType, megaStone: build.megaStone,
          role: build.role || "", reasoning: build.reasoning || "", synergies: build.synergies || [],
        };
      }).filter(Boolean);
    } else if (Array.isArray(selectionsRaw.suggestions)) {
      suggestions = selectionsRaw.suggestions.filter(Boolean);
    } else {
      warnings.push("La IA devolvió un formato inesperado");
    }

    const buildsRecord: Record<string, any> = {};
    suggestions.forEach((sug: any, idx: number) => {
      buildsRecord[String(sug.id ?? idx)] = sug;
    });
    const sanitizedRecord = sanitizeBuilds(buildsRecord, normalizedConfig, poolArray, comboItemOverrides);
    suggestions = Object.values(sanitizedRecord);
    closeSanitize("ok", { count: suggestions.length });

    // Fix ④: confirmedTeam toma tipos de poolArray, no de sanitizedRecord
    // sanitizeBuilds no preserva tipo1/tipo2 — hay que recuperarlos del pool original.
    const leaderEntry = leader
      ? [{ nombre: leader.nombre, tipo1: leader.tipo1, tipo2: leader.tipo2 ?? null }]
      : [];
    const confirmedTeam = [
      ...leaderEntry,
      ...suggestions.map((s: any) => {
        const poolPoke = poolArray.find((p: any) => Number(p.id) === Number(s.id));
        return {
          nombre: s.name || s.nombre || "",
          tipo1:  poolPoke?.tipo1 || s.tipo1 || "",  // Fix ④
          tipo2:  poolPoke?.tipo2 ?? s.tipo2 ?? null, // Fix ④
        };
      }),
    ];

    // Fix ③: construir strings de reporte UNA SOLA VEZ
    const buildsJson     = JSON.stringify(sanitizedRecord, null, 2);
    const reportPrompt1  = buildReportPromptPart1(confirmedTeam, buildsJson, normalizedConfig, modeModifiers, experiencePrompt);
    const reportPrompt2  = buildReportPromptPart2(confirmedTeam, buildsJson, normalizedConfig, experiencePrompt);

    // ── 10. Reportes en paralelo ─────────────────────────────────
    const closeReports  = logger.step("ai-report", { teamSize: confirmedTeam.length });
    logger.aiCall("report-p1", reportPrompt1.length, "gemini");
    logger.aiCall("report-p2", reportPrompt2.length, "gemini");

    const reportStartMs = Date.now();

    // Fix ②: Promise.allSettled — si falla uno, el otro se conserva
    const [r1Result, r2Result] = await Promise.allSettled([
      generateReport(reportPrompt1, sessionId),
      generateReport(reportPrompt2, sessionId),
    ]);

    let reportPart1: any = {};
    let reportPart2: any = {};

    if (r1Result.status === "fulfilled") {
      reportPart1 = r1Result.value;
    } else {
      logger.error("ai-report-p1", r1Result.reason);
      warnings.push("Error generando reporte general — usando valores vacíos");
    }

    if (r2Result.status === "fulfilled") {
      reportPart2 = r2Result.value;
    } else {
      logger.error("ai-report-p2", r2Result.reason);
      warnings.push("Error generando análisis individual — usando valores vacíos");
    }

    const reportDurationMs = Date.now() - reportStartMs;
    const reportValidation = validateReportResponse(reportPart1);
    logger.aiResult("report-p1", JSON.stringify(reportPart1).length, reportValidation.errors, reportDurationMs);

    if (!reportValidation.valid) {
      warnings.push(`Reporte parcialmente incompleto: ${reportValidation.errors.join(", ")}`);
    }
    closeReports();

    // ── 11. Construir respuesta ──────────────────────────────────
    const closeResponseBuild = logger.step("response-build");
    const configHash = hashConfig(normalizedConfig as Record<string, unknown>);

    const reportRaw: AIReportResponse = {
      teamComposition: reportPart1.teamComposition || reportPart1.estrategia || "",
      typesCoverage:   reportPart1.typesCoverage   || "",
      speedControl:    reportPart1.speedControl    || "",
      synergySummary:  reportPart1.synergySummary  || "",
      strengths:       reportPart1.strengths       || reportPart1.ventajas    || [],
      weaknesses:      reportPart1.weaknesses      || reportPart1.debilidades || [],
      recommendation:  reportPart1.recommendation  || "",
      formatSpecific:  reportPart1.formatSpecific,
      typeChart:       reportPart1.typeChart,
      perPokemon:      reportPart2?.perPokemon      || [],
    };

    const response: SuggestResponse = {
      success: true,
      suggestions: suggestions.map((sug: any) => {
        const poolPoke = poolArray.find((p: any) => Number(p.id) === Number(sug.id));
        return {
          id:           String(sug.id || sug.dex_id || ""),
          name:         sug.name || sug.nombre || "",
          tier:         sug.tier || "",
          tipo1:        poolPoke?.tipo1 || sug.tipo1 || "",
          tipo2:        poolPoke?.tipo2 ?? sug.tipo2 ?? null,
          sprite_url:   sug.sprite_url || poolPoke?.sprite_url || null,
          national_dex: sug.national_dex || poolPoke?.national_dex || poolPoke?.id || null,
          build: {
            ability:  sug.ability  || "",
            nature:   sug.nature   || "",
            evSpread: sug.evSpread || [
              sug.ev_hp  ? `${sug.ev_hp} HP`   : "",
              sug.ev_atk ? `${sug.ev_atk} Atk` : "",
              sug.ev_def ? `${sug.ev_def} Def`  : "",
              sug.ev_spa ? `${sug.ev_spa} SpA`  : "",
              sug.ev_spd ? `${sug.ev_spd} SpD`  : "",
              sug.ev_spe ? `${sug.ev_spe} Spe`  : "",
            ].filter(Boolean).join(" / "),
            ivSpread:  sug.ivSpread || (sug.iv_atk === 0 ? "0 Atk" : undefined),
            item:      sug.item      || "",
            moves:     Array.isArray(sug.moves) ? sug.moves : [],
            teraType:  sug.teraType  || sug.tera_type,
            megaStone: sug.megaStone || sug.mega_stone,
          },
          synergies: Array.isArray(sug.synergies) ? sug.synergies : [],
          role:      sug.role      || "",
          reasoning: sug.reasoning || "",
        };
      }),
      report: {
        teamComposition: reportRaw.teamComposition || "",
        typesCoverage:   reportRaw.typesCoverage   || "",
        speedControl:    reportRaw.speedControl    || "",
        synergySummary:  reportRaw.synergySummary  || "",
        weaknesses:      reportRaw.weaknesses      || [],
        strengths:       reportRaw.strengths       || [],
        recommendation:  reportRaw.recommendation  || "",
        formatSpecific:  reportRaw.formatSpecific,
        typeChart:       reportRaw.typeChart,
        perPokemon:      reportRaw.perPokemon       || [],
      },
      meta: {
        timestamp:                Date.now(),
        configHash,
        detectedCombos,
        isDynamicMode,
        totalCandidatesEvaluated: poolArray.length,
      },
      warnings: warnings.length > 0 ? warnings : undefined,
    };

    closeResponseBuild("ok", { suggestionsCount: response.suggestions.length });
    logger.end(response);
    return NextResponse.json(response);

  } catch (error) {
    logger.error("unhandled", error);
    logger.end({ success: false });

    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("❌ /api/pokemon/suggest unhandled error:", error);

    return NextResponse.json(
      {
        success: false, suggestions: [],
        report: {
          teamComposition: "", typesCoverage: "", speedControl: "",
          synergySummary: "", weaknesses: [errorMessage], strengths: [],
          recommendation: "Failed to generate suggestions. Try again.",
        },
        meta: {
          timestamp: Date.now(), configHash: "error",
          detectedCombos: [], isDynamicMode: false, totalCandidatesEvaluated: 0,
        },
        warnings: [`Error interno: ${errorMessage}`, "Si el problema persiste, intenta con una configuración diferente."],
      } as SuggestResponse,
      { status: 500 }
    );
  }
}