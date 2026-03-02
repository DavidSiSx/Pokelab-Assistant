/**
 * ARCHIVO: app/api/pokemon/suggest/route.ts
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
  buildReportPrompt,
  buildComboPrompt,
  buildModeModifiers,
  buildCandidateString,
  buildItemClauseRule,
  buildExperiencePrompt,
} from "./_lib/prompt-builder";
import { sanitizeBuilds } from "./_lib/mega-validator";
import { deduplicateById, normalizeConfig } from "./_lib/filters";
import { checkRateLimit } from "@/lib/rateLimit";

export async function POST(req: NextRequest): Promise<NextResponse<SuggestResponse>> {
  try {
    // 1. Rate limit por session
    const sessionId = req.headers.get("x-session-id") || "anonymous";
    const limit = checkRateLimit(sessionId, "suggest");
    if (!limit.allowed) {
      return NextResponse.json(
        { success: false, suggestions: [], report: {} as any, meta: {} as any, warnings: [limit.message] },
        { status: 429 }
      );
    }

    // 2. Parsear request
    const body = (await req.json()) as SuggestRequest;
    const { lockedTeam, config, slotIndex } = body;

    if (!config) {
      return NextResponse.json(
        { success: false, suggestions: [], report: {} as any, meta: {} as any },
        { status: 400 }
      );
    }

    if (slotIndex < 0 || slotIndex > 5) {
      return NextResponse.json(
        { success: false, suggestions: [], report: {} as any, meta: {} as any },
        { status: 400 }
      );
    }

    // 3. Normalizar config
    const normalizedConfig = normalizeConfig(config);

    // 4. Derivar equipo, líder y slots necesarios
    const team        = lockedTeam || [];
    const leader      = team[0] ?? null;
    const leaderId    = leader?.id ?? null;
    const leaderName  = leader?.nombre ?? null;
    const lockedIds   = team.slice(1).map((p) => p.id);
    const lockedNames = team.slice(1).map((p) => p.nombre);
    const slotsNeeded = Math.max(1, 6 - team.length);

    // 5. Construir pool de candidatos
    const { candidatePool: poolArray, isDynamicMode, detectedCombos, comboItemOverrides } =
      await buildCandidatePool(
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

    // 6. Convertir pool → string para el prompt
    const candidatesString = buildCandidateString(poolArray, normalizedConfig);

    // 7. String del equipo fijado
    const lockedString = team
      .slice(1)
      .map((p) => `[ID: ${p.id}] ${p.nombre} (${p.tipo1}${p.tipo2 ? "/" + p.tipo2 : ""})`)
      .join("\n");

    // 8. Compilar prompts
    const modeModifiers    = buildModeModifiers(normalizedConfig);
    const experiencePrompt = buildExperiencePrompt(normalizedConfig.experienceLevel ?? "experto");
    const itemClauseRule   = buildItemClauseRule(normalizedConfig);
    const comboContext     = buildComboPrompt(detectedCombos, comboItemOverrides);
    const leaderConstraints = leaderName
      ? ` El equipo debe complementar a ${leaderName} como pieza central.`
      : "";

    const selectionPrompt = buildSelectionPrompt(
      candidatesString,
      lockedString,
      leaderName,
      leaderConstraints,
      slotsNeeded,
      normalizedConfig,
      modeModifiers,
      experiencePrompt,
      itemClauseRule,
      comboContext,
    );

    // 9. Llamada 1: Selecciones
    console.log(`🎲 Calling AI for suggestions (slot ${slotIndex})...`);
    const selectionsRaw: AISelectionResponse = await generateSelection(selectionPrompt, sessionId);

    // 10. Sanitizar builds
    let suggestions = selectionsRaw.suggestions || [];
    suggestions     = deduplicateById(suggestions);

    const buildsRecord: Record<string, any> = {};
    suggestions.forEach((sug, i) => { buildsRecord[String(i)] = sug; });

    const sanitizedRecord = sanitizeBuilds(
      buildsRecord,
      normalizedConfig,
      poolArray,
      comboItemOverrides
    );

    suggestions = Object.values(sanitizedRecord);

    // 11. Llamada 2: Reporte
    console.log("📊 Calling AI for report...");
    const reportPrompt = buildReportPrompt(
      team,
      JSON.stringify(sanitizedRecord, null, 2),
      normalizedConfig,
      modeModifiers,
      experiencePrompt,
    );
    const reportRaw: AIReportResponse = await generateReport(reportPrompt, sessionId);

    // 12. Respuesta final
    const configHash = hashConfig(normalizedConfig as Record<string, unknown>);

    const response: SuggestResponse = {
      success: true,
      suggestions: suggestions.map((sug: any) => ({
        id:   sug.name || sug.dex_id || "",
        name: sug.name || "",
        tier: sug.tier || "",
        build: {
          ability:   sug.ability   || "",
          nature:    sug.nature    || "",
          evSpread:  sug.evSpread  || "",
          ivSpread:  sug.ivSpread,
          item:      sug.item      || "",
          moves:     Array.isArray(sug.moves) ? sug.moves : [],
          teraType:  sug.teraType,
          megaStone: sug.megaStone,
        },
        synergies: Array.isArray(sug.synergies) ? sug.synergies : [],
        role:      sug.role      || "",
        reasoning: sug.reasoning || "",
      })),
      report: {
        teamComposition: reportRaw.teamComposition || "",
        typesCoverage:   reportRaw.typesCoverage   || "",
        speedControl:    reportRaw.speedControl    || "",
        synergySummary:  reportRaw.synergySummary  || "",
        weaknesses:      reportRaw.weaknesses      || [],
        strengths:       reportRaw.strengths       || [],
        recommendation:  reportRaw.recommendation  || "",
        formatSpecific:  reportRaw.formatSpecific,
      },
      meta: {
        timestamp:                Date.now(),
        configHash,
        detectedCombos,
        isDynamicMode,
        totalCandidatesEvaluated: poolArray.length,
      },
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error("❌ /api/pokemon/suggest error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";

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
        warnings: [errorMessage],
      } as SuggestResponse,
      { status: 500 }
    );
  }
}