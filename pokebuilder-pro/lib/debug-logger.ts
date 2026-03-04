/**
 * ╔══════════════════════════════════════════════════════════════╗
 * ║  lib/debug-logger.ts — Logger estructurado para todas las   ║
 * ║  API routes de PokeBuilder Pro                              ║
 * ║                                                              ║
 * ║  USO en cualquier route:                                     ║
 * ║    import { Logger } from "@/lib/debug-logger";             ║
 * ║    const logger = new Logger("suggest");                     ║
 * ║    logger.start(sessionId);                                  ║
 * ║    logger.step("pool-build", { size: pool.length });        ║
 * ║    logger.aiCall("selection", prompt.length);               ║
 * ║    logger.aiResult("selection", raw.length, validated);     ║
 * ║    logger.end(response);                                     ║
 * ║    logger.error("pool", err);                               ║
 * ╚══════════════════════════════════════════════════════════════╝
 */

type LogLevel = "debug" | "info" | "warn" | "error";

interface StepMeta {
  [key: string]: unknown;
}

interface Span {
  name: string;
  startMs: number;
  endMs?: number;
  meta?: StepMeta;
  status?: "ok" | "warn" | "error";
  error?: string;
}

interface AICallLog {
  name: string;
  promptTokens: number;
  responseTokens: number;
  durationMs: number;
  attempt: number;
  provider: string;
  validationErrors: string[];
  success: boolean;
}

// Emojis por paso para facilitar lectura en logs
const EMOJI: Record<string, string> = {
  "request-parse":    "📥",
  "rate-limit":       "🚦",
  "config-normalize": "⚙️",
  "pool-build":       "🏊",
  "pool-filter":      "🔍",
  "pool-stratify":    "📊",
  "combo-detect":     "🔗",
  "prompt-build":     "📝",
  "ai-selection":     "🎲",
  "ai-report-p1":     "📋",
  "ai-report-p2":     "🔬",
  "validation":       "✅",
  "response-build":   "📤",
  "sanitize":         "🧹",
  "cache-hit":        "⚡",
  "cache-miss":       "💨",
  "retry":            "🔄",
  default:            "🔷",
};

// ─── LOGGER PRINCIPAL ────────────────────────────────────────────
export class Logger {
  private route: string;
  private sessionId: string = "unknown";
  private startMs: number = 0;
  private spans: Span[] = [];
  private aiCalls: AICallLog[] = [];
  private currentSpan: Span | null = null;
  private warnings: string[] = [];
  private isEnabled: boolean;

  constructor(route: string) {
    this.route = route;
    // Activo si DEBUG=true O en desarrollo
    this.isEnabled =
      process.env.DEBUG === "true" ||
      process.env.NODE_ENV === "development";
  }

  /** Inicia el request. Siempre se llama primero. */
  start(sessionId: string, meta?: StepMeta) {
    this.sessionId = sessionId;
    this.startMs = Date.now();
    this.spans = [];
    this.aiCalls = [];
    this.warnings = [];

    if (this.isEnabled) {
      this._print("info", `▶ START [${this.route}]`, {
        sessionId,
        ...meta,
      });
    }
  }

  /** Marca inicio de un paso */
  step(name: string, meta?: StepMeta): () => void {
    if (this.currentSpan) this._closeSpan("ok");

    this.currentSpan = {
      name,
      startMs: Date.now(),
      meta,
    };

    if (this.isEnabled) {
      const emoji = EMOJI[name] || EMOJI.default;
      this._print("debug", `${emoji} [${name}]`, meta);
    }

    // Retorna una función de "cierre" para usar con try/finally
    return (status: "ok" | "warn" | "error" = "ok", closeMeta?: StepMeta) => {
      this._closeSpan(status, closeMeta);
    };
  }

  /** Registra el inicio de una llamada a la IA */
  aiCall(name: string, promptChars: number, provider = "unknown", attempt = 1) {
    if (this.isEnabled) {
      this._print("info", `🤖 AI CALL [${name}]`, {
        promptChars,
        estimatedTokens: Math.round(promptChars / 4),
        provider,
        attempt,
      });
    }

    // Guard: prompts muy largos (riesgo de truncado)
    if (promptChars > 60_000) {
      this.warn(`ai-call-${name}`, `Prompt muy largo: ${promptChars} chars (~${Math.round(promptChars / 4)} tokens). Riesgo de truncado.`);
    }
  }

  /** Registra el resultado de una llamada a la IA */
  aiResult(
    name: string,
    responseChars: number,
    validationErrors: string[],
    durationMs: number,
    provider = "unknown",
    attempt = 1,
  ) {
    const success = validationErrors.length === 0;
    const logEntry: AICallLog = {
      name,
      promptTokens: 0,
      responseTokens: Math.round(responseChars / 4),
      durationMs,
      attempt,
      provider,
      validationErrors,
      success,
    };
    this.aiCalls.push(logEntry);

    if (this.isEnabled) {
      const level: LogLevel = success ? "info" : "warn";
      this._print(level, `${success ? "✅" : "❌"} AI RESULT [${name}]`, {
        responseChars,
        estimatedTokens: logEntry.responseTokens,
        durationMs: `${durationMs}ms`,
        attempt,
        provider,
        validationErrors: success ? undefined : validationErrors,
      });
    }

    // Alerta si la respuesta es sospechosamente corta (posible truncado)
    if (responseChars < 100) {
      this.warn(`ai-result-${name}`, `Respuesta muy corta: ${responseChars} chars. ¿Truncado?`);
    }
  }

  /** Registra un reintento de la IA */
  aiRetry(name: string, attempt: number, reason: string) {
    this.warn(`retry-${name}`, `Reintento #${attempt}: ${reason}`);
    if (this.isEnabled) {
      this._print("warn", `🔄 AI RETRY [${name}]`, { attempt, reason });
    }
  }

  /** Registra cache hit */
  cacheHit(key: string) {
    if (this.isEnabled) {
      this._print("info", `⚡ CACHE HIT`, { key });
    }
  }

  /** Registra cache miss */
  cacheMiss(key: string) {
    if (this.isEnabled) {
      this._print("debug", `💨 CACHE MISS`, { key });
    }
  }

  /** Registra un warning (no rompe el flujo) */
  warn(context: string, message: string, meta?: StepMeta) {
    const msg = `[${context}] ${message}`;
    this.warnings.push(msg);
    if (this.isEnabled) {
      this._print("warn", `⚠️  WARN`, { context, message, ...meta });
    }
    // Siempre en stderr para que aparezca en logs de producción
    console.warn(`⚠️  [${this.route}/${context}] ${message}`);
  }

  /** Registra un error estructurado */
  error(context: string, err: unknown, meta?: StepMeta) {
    if (this.currentSpan) this._closeSpan("error", { error: String(err) });

    const message = err instanceof Error ? err.message : String(err);
    const stack   = err instanceof Error ? err.stack : undefined;

    console.error(`❌ [${this.route}/${context}] ${message}`);
    if (stack && this.isEnabled) console.error(stack);

    if (meta && this.isEnabled) {
      this._print("error", `❌ ERROR [${context}]`, { message, ...meta });
    }
  }

  /** Finaliza el request con reporte completo */
  end(response: { success: boolean; suggestions?: unknown[]; warnings?: string[] }) {
    if (this.currentSpan) this._closeSpan("ok");

    const totalMs = Date.now() - this.startMs;
    const summary = this._buildSummary(totalMs, response);

    // Siempre imprime el resumen (incluso en producción)
    const status = response.success ? "✅ OK" : "❌ FAIL";
    console.log(
      `${status} [${this.route}] ${totalMs}ms | ` +
      `sugerencias: ${response.suggestions?.length ?? 0} | ` +
      `warnings: ${this.warnings.length} | ` +
      `AI calls: ${this.aiCalls.length}`
    );

    if (this.isEnabled) {
      this._print("info", `◀ END [${this.route}]`, summary);
      this._printSpanTable();
    }

    // Alertas de rendimiento
    if (totalMs > 90_000) {
      console.warn(`🐌 [${this.route}] LENTO: ${totalMs}ms (>90s). Considera caching.`);
    }

    // Retorna el summary por si el caller quiere incluirlo en la respuesta
    return {
      warnings: [...this.warnings, ...(response.warnings || [])],
      debugSummary: process.env.NODE_ENV === "development" ? summary : undefined,
    };
  }

  // ─── Privados ────────────────────────────────────────────────
  private _closeSpan(status: "ok" | "warn" | "error", meta?: StepMeta) {
    if (!this.currentSpan) return;
    const elapsed = Date.now() - this.currentSpan.startMs;
    this.currentSpan.endMs = Date.now();
    this.currentSpan.status = status;
    if (meta) this.currentSpan.meta = { ...this.currentSpan.meta, ...meta };

    if (this.isEnabled) {
      const statusEmoji = { ok: "✓", warn: "⚠", error: "✗" }[status];
      this._print("debug", `  ${statusEmoji} done [${this.currentSpan.name}] ${elapsed}ms`);
    }

    this.spans.push(this.currentSpan);
    this.currentSpan = null;
  }

  private _buildSummary(totalMs: number, response: { success: boolean; suggestions?: unknown[] }) {
    const spanSummary = this.spans.map(s => ({
      name: s.name,
      ms: s.endMs ? s.endMs - s.startMs : "?",
      status: s.status,
    }));

    const aiSummary = this.aiCalls.map(a => ({
      name: a.name,
      ms: a.durationMs,
      tokens: a.responseTokens,
      attempt: a.attempt,
      ok: a.success,
      errors: a.validationErrors.length,
    }));

    const slowestSpan = this.spans.reduce((prev, cur) => {
      const prevMs = prev.endMs ? prev.endMs - prev.startMs : 0;
      const curMs  = cur.endMs  ? cur.endMs  - cur.startMs  : 0;
      return curMs > prevMs ? cur : prev;
    }, this.spans[0]);

    return {
      totalMs,
      sessionId: this.sessionId,
      success: response.success,
      suggestions: response.suggestions?.length ?? 0,
      warnings: this.warnings,
      spans: spanSummary,
      aiCalls: aiSummary,
      slowestStep: slowestSpan
        ? `${slowestSpan.name} (${slowestSpan.endMs ? slowestSpan.endMs - slowestSpan.startMs : "?"}ms)`
        : "n/a",
    };
  }

  private _printSpanTable() {
    if (this.spans.length === 0) return;
    console.log(`\n  ┌─ Spans [${this.route}/${this.sessionId.slice(0,12)}] ─────────`);
    for (const span of this.spans) {
      const ms = span.endMs ? span.endMs - span.startMs : "?";
      const icon = { ok: "✓", warn: "⚠", error: "✗" }[span.status || "ok"];
      const bar = typeof ms === "number" ? "█".repeat(Math.min(Math.ceil(ms / 5000), 20)) : "";
      console.log(`  │ ${icon} ${String(span.name).padEnd(20)} ${String(ms).padStart(6)}ms ${bar}`);
    }
    console.log(`  └─────────────────────────────────────────`);
  }

  private _print(level: LogLevel, message: string, meta?: StepMeta) {
    const prefix = `[${this.route}/${this.sessionId.slice(0, 8)}]`;
    const metaStr = meta ? ` ${JSON.stringify(meta, null, 0)}` : "";
    const output = `${prefix} ${message}${metaStr}`;

    switch (level) {
      case "debug": console.debug(output); break;
      case "info":  console.log(output);   break;
      case "warn":  console.warn(output);  break;
      case "error": console.error(output); break;
    }
  }
}

// ─── SINGLETON FACTORY para uso en route files ───────────────────
const loggerCache = new Map<string, Logger>();

export function getLogger(route: string): Logger {
  if (!loggerCache.has(route)) {
    loggerCache.set(route, new Logger(route));
  }
  return loggerCache.get(route)!;
}

// ─── validateAIResponse — validación reutilizable ────────────────
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateSelectionResponse(
  data: unknown,
  poolIds: number[],
  slotsNeeded: number,
  config: { itemClause?: boolean; isMonotype?: boolean; monoTypeSelected?: string },
): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!data || typeof data !== "object") {
    return { valid: false, errors: ["Respuesta no es un objeto"], warnings };
  }

  const d = data as Record<string, unknown>;

  // Verificar formato A (selected_ids + builds)
  if (Array.isArray(d.selected_ids)) {
    if (d.selected_ids.length !== slotsNeeded) {
      errors.push(`selected_ids.length=${d.selected_ids.length}, esperado=${slotsNeeded}`);
    }

    // Verificar que todos los IDs estén en el pool
    const invalidIds = (d.selected_ids as number[]).filter(id => !poolIds.includes(Number(id)));
    if (invalidIds.length > 0) {
      errors.push(`IDs no encontrados en el pool: ${invalidIds.join(", ")}`);
    }

    // Verificar duplicados
    const idSet = new Set(d.selected_ids as number[]);
    if (idSet.size < (d.selected_ids as number[]).length) {
      errors.push("IDs duplicados en selected_ids");
    }

    // Verificar builds
    if (!d.builds || typeof d.builds !== "object") {
      errors.push("Campo 'builds' ausente o inválido");
    } else {
      for (const id of d.selected_ids as number[]) {
        const build = (d.builds as Record<string, unknown>)[String(id)];
        if (!build) {
          errors.push(`Sin build para ID ${id}`);
          continue;
        }
        const b = build as Record<string, unknown>;
        if (!b.ability) errors.push(`ID ${id}: sin ability`);
        if (!b.nature)  errors.push(`ID ${id}: sin nature`);
        if (!b.item)    errors.push(`ID ${id}: sin item`);
        if (!Array.isArray(b.moves) || (b.moves as unknown[]).length < 4) {
          errors.push(`ID ${id}: moves insuficientes (${Array.isArray(b.moves) ? b.moves.length : 0})`);
        }
      }
    }
  }
  // Verificar formato B (suggestions array)
  else if (Array.isArray(d.suggestions)) {
    if (d.suggestions.length !== slotsNeeded) {
      warnings.push(`suggestions.length=${d.suggestions.length}, esperado=${slotsNeeded}`);
    }
  } else {
    errors.push("Formato desconocido: falta 'selected_ids' o 'suggestions'");
  }

  // Item Clause
  if (config.itemClause) {
    const items: string[] = [];
    if (d.builds && typeof d.builds === "object") {
      for (const build of Object.values(d.builds as object)) {
        const item = (build as Record<string, unknown>).item as string;
        if (item) items.push(item);
      }
    }
    const uniqueItems = new Set(items.map(i => i.toLowerCase()));
    if (uniqueItems.size < items.length) {
      errors.push(`Item Clause violada: items repetidos [${items.join(", ")}]`);
    }
  }

  return { valid: errors.length === 0, errors, warnings };
}

export function validateReportResponse(data: unknown): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!data || typeof data !== "object") {
    return { valid: false, errors: ["Respuesta no es un objeto"], warnings };
  }

  const d = data as Record<string, unknown>;
  const requiredFields = ["teamComposition", "typesCoverage", "speedControl", "synergySummary"];

  for (const field of requiredFields) {
    if (!d[field] || typeof d[field] !== "string" || (d[field] as string).trim() === "") {
      errors.push(`Campo '${field}' ausente o vacío`);
    }
  }

  if (!Array.isArray(d.strengths) || (d.strengths as unknown[]).length === 0) {
    warnings.push("Campo 'strengths' vacío");
  }
  if (!Array.isArray(d.weaknesses)) {
    errors.push("Campo 'weaknesses' debe ser array");
  }

  return { valid: errors.length === 0, errors, warnings };
}