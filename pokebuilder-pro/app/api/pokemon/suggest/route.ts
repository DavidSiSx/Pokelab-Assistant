/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║  app/api/pokemon/suggest/route.ts — CON DEBUG + VALIDACIÓN      ║
 * ║                                                                  ║
 * ║  Cambios vs original:                                            ║
 * ║  1. Logger estructurado en cada paso                             ║
 * ║  2. Validación de respuesta AI (selection + report)             ║
 * ║  3. Reintento automático si la validación falla (máx 2 veces)  ║
 * ║  4. Alertas claras en response.warnings                         ║
 * ║  5. Timing detallado por fase                                   ║
 * ╚══════════════════════════════════════════════════════════════════╝
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
import { deduplicateById, normalizeConfig } from "./_lib/filters";
import { checkRateLimit } from "@/lib/rateLimit";
import {
  Logger,
  validateSelectionResponse,
  validateReportResponse,
} from "@/lib/debug-logger";

// ─── Constantes de reintentos ─────────────────────────────────────
const MAX_SELECTION_RETRIES = 2;
const MAX_REPORT_RETRIES    = 1;

// ─── Tipos auxiliares ─────────────────────────────────────────────
interface ParsedBody extends SuggestRequest {
  swapCount?: number;
}

export async function POST(req: NextRequest): Promise<NextResponse<SuggestResponse>> {
  const sessionId = req.headers.get("x-session-id") || "anonymous";
  const logger = new Logger("suggest");
  logger.start(sessionId, { url: req.url, method: req.method });

  const warnings: string[] = [];

  try {
    // ── 1. Rate limit ────────────────────────────────────────────
    const closeRateLimit = logger.step("rate-limit", { sessionId });
    const limit = checkRateLimit(sessionId, "suggest");
    closeRateLimit();

    if (!limit.allowed) {
      logger.warn("rate-limit", limit.message);
      logger.end({ success: false, warnings: [limit.message] });
      return NextResponse.json(
        {
          success: false, suggestions: [], report: {} as any, meta: {} as any,
          warnings: [limit.message],
        },
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
      logger.error("request-parse", e);
      return NextResponse.json(
        { success: false, suggestions: [], report: {} as any, meta: {} as any,
          warnings: ["Request body inválido — no es JSON"] },
        { status: 400 }
      );
    }
    closeReqParse();

    const { lockedTeam, config, slotIndex, swapCount } = body;

    // ── 3. Validación de entrada ─────────────────────────────────
    const closeValidate = logger.step("validation", { slotIndex, hasConfig: !!config });
    const inputErrors: string[] = [];
    if (!config) inputErrors.push("config es requerido");
    if (slotIndex == null) inputErrors.push("slotIndex es requerido");
    else if (slotIndex < 0 || slotIndex > 5) inputErrors.push(`slotIndex inválido: ${slotIndex}`);
    closeValidate(inputErrors.length ? "error" : "ok");

    if (inputErrors.length > 0) {
      logger.end({ success: false, warnings: inputErrors });
      return NextResponse.json(
        { success: false, suggestions: [], report: {} as any, meta: {} as any,
          warnings: inputErrors },
        { status: 400 }
      );
    }

    // ── 4. Normalizar config ─────────────────────────────────────
    const closeNorm = logger.step("config-normalize");
    const normalizedConfig = normalizeConfig(config);
    const hasItemClause = normalizedConfig.clauses?.some(
      (c: string) => c.toLowerCase().includes("item clause")
    ) ?? false;
    closeNorm("ok", { format: normalizedConfig.format, isMonotype: normalizedConfig.isMonotype });

    // ── 5. Derivar equipo ────────────────────────────────────────
    const team        = lockedTeam || [];
    const leader      = team[0] ?? null;
    const leaderId    = leader?.id ?? null;
    const leaderName  = leader?.nombre ?? null;
    const lockedIds   = team.slice(1).map((p) => p.id);
    const lockedNames = team.slice(1).map((p) => p.nombre);
    const slotsNeeded = swapCount != null ? swapCount : Math.max(1, 6 - team.length);

    logger.step("pool-build", { leaderId, lockedCount: lockedIds.length, slotsNeeded });

    // ── 6. Construir pool ────────────────────────────────────────
    let poolArray: any[], isDynamicMode: boolean, detectedCombos: any[], comboItemOverrides: Record<string, string>;
    try {
      const poolResult = await buildCandidatePool(
        {
          leaderId,
          lockedIds,
          ignoredIds: [],
          blacklist: normalizedConfig.blacklist || [],
          config: normalizedConfig,
        },
        slotsNeeded,
        false,
        leaderName,
        lockedNames
      );
      poolArray = poolResult.candidatePool;
      isDynamicMode = poolResult.isDynamicMode;
      detectedCombos = poolResult.detectedCombos;
      comboItemOverrides = poolResult.comboItemOverrides;
    } catch (e) {
      logger.error("pool-build", e, { leaderId, slotsNeeded });
      logger.end({ success: false });
      return NextResponse.json(
        { success: false, suggestions: [], report: {} as any, meta: {} as any,
          warnings: [`Error construyendo el pool: ${e instanceof Error ? e.message : e}`] },
        { status: 500 }
      );
    }

    if (poolArray.length < slotsNeeded) {
      logger.warn("pool-build", `Pool insuficiente: ${poolArray.length} candidatos para ${slotsNeeded} slots`);
      warnings.push(`Pool reducido: solo ${poolArray.length} candidatos disponibles`);
    }

    logger.step("pool-stratify", { poolSize: poolArray.length, combos: detectedCombos.length });

    // ── 7. Construir strings de prompt ───────────────────────────
    const closePromptBuild = logger.step("prompt-build");
    const candidatesString = buildCandidateString(poolArray, normalizedConfig);
    const lockedString = team.slice(1)
      .map((p) => `[ID: ${p.id}] ${p.nombre} (${p.tipo1}${p.tipo2 ? "/" + p.tipo2 : ""})`)
      .join("\n");
    const modeModifiers    = buildModeModifiers(normalizedConfig);
    const experiencePrompt = buildExperiencePrompt(normalizedConfig.experienceLevel ?? "experto");
    const itemClauseRule   = buildItemClauseRule(normalizedConfig);
    const comboContext     = buildComboPrompt(detectedCombos, comboItemOverrides);
    const leaderConstraints = leaderName
      ? ` El equipo debe complementar a ${leaderName} como pieza central.`
      : "";

    const selectionPrompt = buildSelectionPrompt(
      candidatesString, lockedString, leaderName, leaderConstraints,
      slotsNeeded, normalizedConfig, modeModifiers, experiencePrompt, itemClauseRule, comboContext,
    );
    closePromptBuild("ok", { selectionPromptChars: selectionPrompt.length });

    // ── 8. Llamada AI — Selección (con reintentos) ───────────────
    let selectionsRaw: AISelectionResponse | null = null;
    let selectionValidationErrors: string[] = [];

    for (let attempt = 1; attempt <= MAX_SELECTION_RETRIES + 1; attempt++) {
      const aiStartMs = Date.now();
      const closeAI = logger.step("ai-selection", { attempt });

      logger.aiCall("selection", selectionPrompt.length, "gemini", attempt);

      try {
        selectionsRaw = await generateSelection(selectionPrompt, sessionId);
      } catch (e) {
        logger.error("ai-selection", e, { attempt });
        if (attempt > MAX_SELECTION_RETRIES) throw e;
        logger.aiRetry("selection", attempt + 1, e instanceof Error ? e.message : String(e));
        closeAI("error");
        continue;
      }

      const aiDurationMs = Date.now() - aiStartMs;
      const rawStr = JSON.stringify(selectionsRaw);

      // Validar respuesta
      const poolIds = poolArray.map((p: any) => Number(p.id));
      const validation = validateSelectionResponse(
        selectionsRaw,
        poolIds,
        slotsNeeded,
        { itemClause: hasItemClause, isMonotype: normalizedConfig.isMonotype, monoTypeSelected: normalizedConfig.monoTypeSelected }
      );

      logger.aiResult("selection", rawStr.length, validation.errors, aiDurationMs, "gemini", attempt);

      if (validation.warnings.length > 0) {
        validation.warnings.forEach(w => { logger.warn("ai-selection", w); warnings.push(w); });
      }

      if (validation.valid) {
        closeAI("ok");
        selectionValidationErrors = [];
        break;
      }

      selectionValidationErrors = validation.errors;
      logger.warn("ai-selection", `Validación falló en attempt ${attempt}: ${validation.errors.join(" | ")}`);

      if (attempt <= MAX_SELECTION_RETRIES) {
        logger.aiRetry("selection", attempt + 1, `Corrección: ${validation.errors.join(", ")}`);
        closeAI("warn");
        // En reintentos reales modificaríamos el prompt para corregir los errores
        // Por ahora simplemente reintentamos — el ai-client ya tiene su propio fallback chain
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
      // Formato A
      suggestions = selectionsRaw.selected_ids.map((id: number) => {
        const build = selectionsRaw!.builds![String(id)];
        const poke  = poolArray.find((p: any) => Number(p.id) === Number(id));
        if (!poke || !build) {
          logger.warn("sanitize", `ID ${id} no en pool o sin build — omitiendo`);
          return null;
        }
        return {
          id: Number(id), name: poke.nombre, tier: poke.tier || "Unranked",
          tipo1: poke.tipo1, tipo2: poke.tipo2 ?? null,
          ability: build.ability || "", nature: build.nature || "", item: build.item || "",
          moves: Array.isArray(build.moves) ? build.moves : [],
          ev_hp: build.ev_hp ?? 0, ev_atk: build.ev_atk ?? 0, ev_def: build.ev_def ?? 0,
          ev_spa: build.ev_spa ?? 0, ev_spd: build.ev_spd ?? 0, ev_spe: build.ev_spe ?? 0,
          iv_atk: build.iv_atk, teraType: build.teraType, megaStone: build.megaStone,
          role: build.role || "", reasoning: build.reasoning || "", synergies: build.synergies || [],
        };
      }).filter(Boolean);
    } else if (Array.isArray(selectionsRaw.suggestions)) {
      // Formato B (legacy)
      suggestions = selectionsRaw.suggestions.filter(Boolean);
    } else {
      logger.warn("sanitize", "Formato de respuesta AI desconocido — usando array vacío");
      warnings.push("La IA devolvió un formato inesperado");
    }

    // Sanitizar builds (mega, tera, etc.)
    const buildsRecord: Record<string, any> = {};
    suggestions.forEach((sug: any, idx: number) => {
      const key = String(sug.id ?? idx);
      buildsRecord[key] = sug;
    });
    const sanitizedRecord = sanitizeBuilds(buildsRecord, normalizedConfig, poolArray, comboItemOverrides);
    suggestions = Object.values(sanitizedRecord);
    closeSanitize("ok", { count: suggestions.length });

    // Equipo confirmado para prompts de reporte
    const leaderEntry = leader
      ? [{ nombre: leader.nombre, tipo1: leader.tipo1, tipo2: leader.tipo2 ?? null }]
      : [];
    const confirmedTeam = [
      ...leaderEntry,
      ...suggestions.map((s: any) => ({ nombre: s.name || s.nombre || "", tipo1: s.tipo1 || "", tipo2: s.tipo2 || null })),
    ];
    const buildsJson = JSON.stringify(sanitizedRecord, null, 2);

    // ── 10. Llamadas AI paralelas — Reportes ─────────────────────
    const closeReports = logger.step("ai-report-p1", { confirmedTeamSize: confirmedTeam.length });
    logger.aiCall("report-p1", buildReportPromptPart1(confirmedTeam, buildsJson, normalizedConfig, modeModifiers, experiencePrompt).length, "gemini");
    logger.aiCall("report-p2", buildReportPromptPart2(confirmedTeam, buildsJson, normalizedConfig, experiencePrompt).length, "gemini");

    let reportPart1: any, reportPart2: any;
    const reportStartMs = Date.now();
    try {
      [reportPart1, reportPart2] = await Promise.all([
        generateReport(
          buildReportPromptPart1(confirmedTeam, buildsJson, normalizedConfig, modeModifiers, experiencePrompt),
          sessionId
        ),
        generateReport(
          buildReportPromptPart2(confirmedTeam, buildsJson, normalizedConfig, experiencePrompt),
          sessionId
        ),
      ]);
    } catch (e) {
      logger.error("ai-report", e);
      warnings.push("Error generando reporte — usando valores vacíos");
      reportPart1 = {};
      reportPart2 = {};
    }

    const reportDurationMs = Date.now() - reportStartMs;
    const reportValidation = validateReportResponse(reportPart1);
    logger.aiResult("report-p1", JSON.stringify(reportPart1).length, reportValidation.errors, reportDurationMs);

    if (!reportValidation.valid) {
      logger.warn("ai-report-p1", `Reporte inválido: ${reportValidation.errors.join(" | ")}`);
      warnings.push(`Reporte parcialmente incompleto: ${reportValidation.errors.join(", ")}`);
    }
    closeReports();

    // ── 11. Construir respuesta final ────────────────────────────
    const closeResponseBuild = logger.step("response-build");
    const configHash = hashConfig(normalizedConfig as Record<string, unknown>);

    const reportRaw: AIReportResponse = {
      teamComposition: reportPart1.teamComposition || reportPart1.estrategia  || "",
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
          id:           String(sug.id   || sug.dex_id || ""),
          name:         sug.name || sug.nombre || "",
          tier:         sug.tier || "",
          tipo1:        sug.tipo1 || poolPoke?.tipo1 || "",
          tipo2:        sug.tipo2 || poolPoke?.tipo2 || null,
          sprite_url:   sug.sprite_url || poolPoke?.sprite_url || null,
          national_dex: sug.national_dex || poolPoke?.national_dex || poolPoke?.id || null,
          build: {
            ability:   sug.ability  || "",
            nature:    sug.nature   || "",
            evSpread:  sug.evSpread || [
              sug.ev_hp  ? `${sug.ev_hp} HP`   : "",
              sug.ev_atk ? `${sug.ev_atk} Atk` : "",
              sug.ev_def ? `${sug.ev_def} Def` : "",
              sug.ev_spa ? `${sug.ev_spa} SpA` : "",
              sug.ev_spd ? `${sug.ev_spd} SpD` : "",
              sug.ev_spe ? `${sug.ev_spe} Spe` : "",
            ].filter(Boolean).join(" / "),
            ivSpread:  sug.ivSpread  || (sug.iv_atk === 0 ? "0 Atk" : undefined),
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

    // ── 12. Log final ────────────────────────────────────────────
    logger.end(response);

    return NextResponse.json(response);

  } catch (error) {
    logger.error("unhandled", error);
    logger.end({ success: false });

    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("❌ /api/pokemon/suggest unhandled error:", error);

    return NextResponse.json(
      {
        success:     false,
        suggestions: [],
        report: {
          teamComposition: "",
          typesCoverage:   "",
          speedControl:    "",
          synergySummary:  "",
          weaknesses:      [errorMessage],
          strengths:       [],
          recommendation:  "Failed to generate suggestions. Try again.",
        },
        meta: {
          timestamp:                Date.now(),
          configHash:               "error",
          detectedCombos:           [],
          isDynamicMode:            false,
          totalCandidatesEvaluated: 0,
        },
        warnings: [
          `Error interno: ${errorMessage}`,
          "Si el problema persiste, intenta con una configuración diferente.",
        ],
      } as SuggestResponse,
      { status: 500 }
    );
  }
}