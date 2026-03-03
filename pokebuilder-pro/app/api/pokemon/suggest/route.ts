/**
 * ARCHIVO: app/api/pokemon/suggest/route.ts
 *
 * 3 llamadas AI:
 *   1. Selección de Pokémon + builds
 *   2. Reporte general (teamComposition, typeChart, strengths/weaknesses...)
 *   3. Análisis por Pokémon (perPokemon: counters, threatens, synergyWith)
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

    // 8. Compilar modificadores comunes
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

    // ─────────────────────────────────────────────────────────────
    // LLAMADA 1: Selección de Pokémon + builds
    // ─────────────────────────────────────────────────────────────
    console.log(`🎲 Calling AI for suggestions (slot ${slotIndex})...`);
    const selectionsRaw: AISelectionResponse = await generateSelection(selectionPrompt, sessionId);

    // 10. Normalizar selecciones
    // Acepta formato A: { selected_ids, builds } y formato B: { suggestions: [...] }
    let suggestions: any[] = [];

    if (Array.isArray(selectionsRaw.selected_ids) && selectionsRaw.builds) {
      // Formato A — JOIN selected_ids con pool para obtener datos completos
      suggestions = selectionsRaw.selected_ids.map((id: number) => {
        const build = selectionsRaw.builds![String(id)];
        const poke  = poolArray.find((p: any) => Number(p.id) === Number(id));
        if (!poke || !build) {
          console.warn(`⚠️ ID ${id} not in pool or missing build`);
          return null;
        }
        return {
          id:        Number(id),
          name:      poke.nombre,
          tier:      poke.tier || "Unranked",
          ability:   build.ability   || "",
          nature:    build.nature    || "",
          item:      build.item      || "",
          moves:     Array.isArray(build.moves) ? build.moves : [],
          ev_hp:     build.ev_hp  ?? 0,
          ev_atk:    build.ev_atk ?? 0,
          ev_def:    build.ev_def ?? 0,
          ev_spa:    build.ev_spa ?? 0,
          ev_spd:    build.ev_spd ?? 0,
          ev_spe:    build.ev_spe ?? 0,
          iv_atk:    build.iv_atk,
          teraType:  build.teraType,
          megaStone: build.megaStone,
          role:      build.role      || "",
          reasoning: build.reasoning || "",
          synergies: build.synergies || [],
          tipo1:     poke.tipo1,
          tipo2:     poke.tipo2,
        };
      }).filter(Boolean) as any[];
    } else if (Array.isArray(selectionsRaw.suggestions)) {
      // Formato B (legacy)
      suggestions = selectionsRaw.suggestions;
    }

    suggestions = deduplicateById(suggestions);

    // Construir buildsRecord para sanitizar
    const buildsRecord: Record<string, any> = {};
    suggestions.forEach((sug: any) => {
      const key = String(sug.id ?? Object.keys(buildsRecord).length);
      buildsRecord[key] = sug;
    });

    const sanitizedRecord = sanitizeBuilds(
      buildsRecord,
      normalizedConfig,
      poolArray,
      comboItemOverrides
    );

    suggestions = Object.values(sanitizedRecord);

    // Equipo confirmado = líder + sugerencias (para los prompts de reporte)
    const leaderEntry = leader
      ? [{ nombre: leader.nombre, tipo1: leader.tipo1, tipo2: leader.tipo2 ?? null }]
      : [];
    const confirmedTeam = [
      ...leaderEntry,
      ...suggestions.map((s: any) => ({
        nombre: s.name || s.nombre || "",
        tipo1:  s.tipo1 || "",
        tipo2:  s.tipo2 || null,
      })),
    ];
    const buildsJson = JSON.stringify(sanitizedRecord, null, 2);

    // ─────────────────────────────────────────────────────────────
    // LLAMADA 2: Reporte general — ~600-900 tokens, no trunca
    // ─────────────────────────────────────────────────────────────
    console.log("📊 Calling AI for report part 1 (general analysis)...");
    const reportPart1 = await generateReport(
      buildReportPromptPart1(confirmedTeam, buildsJson, normalizedConfig, modeModifiers, experiencePrompt),
      sessionId
    ) as any;

    // ─────────────────────────────────────────────────────────────
    // LLAMADA 3: Análisis por Pokémon — ~800-1200 tokens, no trunca
    // ─────────────────────────────────────────────────────────────
    console.log("🔍 Calling AI for report part 2 (per-pokemon analysis)...");
    const reportPart2 = await generateReport(
      buildReportPromptPart2(confirmedTeam, buildsJson, normalizedConfig, experiencePrompt),
      sessionId
    ) as any;

    // Merge de los dos reportes en uno completo
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
      perPokemon:      reportPart2.perPokemon       || [],
    };

    // 13. Respuesta final
    const configHash = hashConfig(normalizedConfig as Record<string, unknown>);

    const response: SuggestResponse = {
      success: true,
      suggestions: suggestions.map((sug: any) => ({
        id:   String(sug.id   || sug.dex_id || ""),
        name: sug.name || sug.nombre || "",
        tier: sug.tier || "",
        build: {
          ability:  sug.ability  || "",
          nature:   sug.nature   || "",
          evSpread: sug.evSpread || [
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