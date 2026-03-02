/**
 * lib/rateLimit.ts
 * Rate limiter centralizado en memoria para todos los endpoints de IA.
 * ⚠️  En memoria: se reinicia con el proceso. Para producción a escala usar Upstash Redis.
 */

type Endpoint = "suggest" | "review" | "moves";

interface LimitConfig {
  maxRequests: number;
  windowMs:    number;
}

const LIMITS: Record<Endpoint, LimitConfig> = {
  suggest: { maxRequests: 10, windowMs: 60_000      }, // 10/min  — 2 llamadas IA por request
  review:  { maxRequests: 10, windowMs: 3_600_000   }, // 10/hora — 1 llamada IA por request
  moves:   { maxRequests: 60, windowMs: 60_000      }, // 60/min  — solo PokeAPI
};

interface BucketEntry {
  timestamps: number[];
}

const store = new Map<string, BucketEntry>();

// Limpieza periódica para evitar memory leaks
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    const maxWindow = Math.max(...Object.values(LIMITS).map(l => l.windowMs));
    for (const [key, entry] of store.entries()) {
      entry.timestamps = entry.timestamps.filter(t => t > now - maxWindow);
      if (entry.timestamps.length === 0) store.delete(key);
    }
  }, 10 * 60_000);
}

export interface RateLimitResult {
  allowed:   boolean;
  remaining: number;
  resetInMs: number;
  message:   string;
}

export function checkRateLimit(userId: string, endpoint: Endpoint): RateLimitResult {
  const config      = LIMITS[endpoint];
  const key         = `${userId}:${endpoint}`;
  const now         = Date.now();
  const windowStart = now - config.windowMs;

  const entry = store.get(key) ?? { timestamps: [] };
  entry.timestamps = entry.timestamps.filter(t => t > windowStart);

  if (entry.timestamps.length >= config.maxRequests) {
    const oldest   = entry.timestamps[0];
    const resetInMs = (oldest + config.windowMs) - now;
    store.set(key, entry);
    return { allowed: false, remaining: 0, resetInMs, message: formatMessage(endpoint, config, resetInMs) };
  }

  entry.timestamps.push(now);
  store.set(key, entry);

  return {
    allowed:   true,
    remaining: config.maxRequests - entry.timestamps.length,
    resetInMs: config.windowMs,
    message:   "",
  };
}

function formatMessage(endpoint: Endpoint, config: LimitConfig, resetInMs: number): string {
  const seconds = Math.ceil(resetInMs / 1000);
  const minutes = Math.ceil(seconds / 60);

  const windowLabel =
    config.windowMs >= 3_600_000 ? `${config.windowMs / 3_600_000}h`       :
    config.windowMs >= 60_000    ? `${config.windowMs / 60_000}min`         :
                                   `${config.windowMs / 1000}s`;

  const waitLabel = seconds < 60
    ? `${seconds} segundos`
    : `${minutes} minuto${minutes > 1 ? "s" : ""}`;

  return `Límite de ${config.maxRequests} peticiones por ${windowLabel} para ${endpoint}. Espera ${waitLabel}.`;
}