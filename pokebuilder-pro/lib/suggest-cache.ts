/**
 * lib/suggest-cache.ts
 *
 * Caché en memoria para respuestas de /api/pokemon/suggest.
 * Misma filosofía que lib/rateLimit.ts (ya existente): in-memory, sin infra extra.
 * Para producción a escala reemplazar con Upstash Redis usando la misma API pública.
 *
 * Clave:  configHash (del hashConfig() de ai-client.ts) + leaderId + slotsNeeded
 * TTL:    10 minutos — suficiente para que el mismo usuario regenere sin esperar.
 * Máx:    50 entradas. LRU por inserción para evitar memory leaks.
 *
 * Qué se cachea:
 *   ✅ Respuestas completas con suggestions + report
 *   ✅ Config sin customStrategy ni blacklist (campos que hacen el request único)
 *   ❌ Requests con swapCount > 0  — swap necesita variedad intencional
 *   ❌ Requests con customStrategy — estrategia personalizada debe ser fresh
 *
 * USO en route.ts (añadir antes del pool-build):
 *
 *   import { suggestCache } from "@/lib/suggest-cache";
 *
 *   // Comprobar caché
 *   const cacheKey = suggestCache.key(normalizedConfig, leaderId, slotsNeeded);
 *   const cached   = suggestCache.get(cacheKey);
 *   if (cached) {
 *     logger.cacheHit(cacheKey);
 *     return NextResponse.json({ ...cached, meta: { ...cached.meta, fromCache: true } });
 *   }
 *
 *   // ... generar respuesta normalmente ...
 *
 *   // Guardar en caché (solo si no es swap y no tiene customStrategy)
 *   if (!swapCount && !normalizedConfig.customStrategy) {
 *     suggestCache.set(cacheKey, response);
 *   }
 */

import { hashConfig } from "@/app/api/pokemon/suggest/_lib/ai-client";
import type { SuggestResponse }  from "@/app/api/pokemon/suggest/_lib/types";

// ─── Configuración ────────────────────────────────────────────────
const TTL_MS   = 10 * 60 * 1000; // 10 minutos
const MAX_SIZE = 50;

interface CacheEntry {
  value:     SuggestResponse;
  expiresAt: number;
  createdAt: number;
  hits:      number;
}

// ─── Clase principal ──────────────────────────────────────────────
class SuggestCache {
  private store = new Map<string, CacheEntry>();

  /**
   * Construye la clave de caché.
   * Excluye customStrategy y blacklist para maximizar hit rate.
   * Excluye generationMode porque no afecta el pool de candidatos.
   */
  key(
    config:      Record<string, unknown>,
    leaderId:    number | null,
    slotsNeeded: number
  ): string {
    const stable = { ...config };
    delete stable.customStrategy;
    delete stable.blacklist;
    delete stable.generationMode;
    return `s:${hashConfig(stable)}:l${leaderId ?? "x"}:n${slotsNeeded}`;
  }

  /**
   * Devuelve la entrada si existe y no ha expirado.
   * Baraja suggestions para que distintos usuarios con el mismo config
   * no vean siempre el mismo orden — da sensación de variedad.
   */
  get(key: string): SuggestResponse | null {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    entry.hits++;
    // Shuffle superficial — no reordenar slots 0 (líder)
    const shuffled = [...entry.value.suggestions].sort(() => Math.random() - 0.5);
    return { ...entry.value, suggestions: shuffled };
  }

  /**
   * Almacena una respuesta en caché.
   * No cachea respuestas vacías o fallidas.
   */
  set(key: string, value: SuggestResponse): void {
    if (!value.success || !value.suggestions?.length) return;

    // LRU simplificado: si está lleno eliminar la entrada más antigua
    if (this.store.size >= MAX_SIZE) {
      let oldestKey: string | undefined;
      let oldestTime = Infinity;
      for (const [k, e] of this.store.entries()) {
        if (e.createdAt < oldestTime) { oldestTime = e.createdAt; oldestKey = k; }
      }
      if (oldestKey) this.store.delete(oldestKey);
    }

    this.store.set(key, {
      value,
      expiresAt: Date.now() + TTL_MS,
      createdAt: Date.now(),
      hits: 0,
    });
  }

  /** Invalida una clave específica (útil si el usuario da feedback negativo). */
  invalidate(key: string): void {
    this.store.delete(key);
  }

  /** Vacía todo el caché (útil para tests o reset de datos). */
  clear(): void {
    this.store.clear();
  }

  /** Estadísticas para logging/debug. */
  stats(): { size: number; totalHits: number; oldestEntryMs: number | null } {
    let totalHits = 0;
    let oldest: number | null = null;
    const now = Date.now();
    for (const e of this.store.values()) {
      if (now <= e.expiresAt) {
        totalHits += e.hits;
        if (oldest === null || e.createdAt < oldest) oldest = e.createdAt;
      }
    }
    return { size: this.store.size, totalHits, oldestEntryMs: oldest ? now - oldest : null };
  }
}

// Singleton compartido por todos los requests del mismo proceso Node
export const suggestCache = new SuggestCache();