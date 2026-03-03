"use client";

interface FeedbackPanelProps {
  feedback: string;
  blacklist: string[];
  onFeedbackChange: (v: string) => void;
  onRegenerate: () => void;
  onClearBlacklist: () => void;
  loading: boolean;
  hasTeam: boolean;
}

const SUGGESTIONS = [
  "Cambia el Wall por uno más ofensivo",
  "No me gusta el Sweeper, ponle otro",
  "Quiero que use sol",
  "Prioriza el Stall",
  "Agrega control de velocidad",
  "Necesito mejor cobertura de tipo",
];

export function FeedbackPanel({
  feedback,
  blacklist,
  onFeedbackChange,
  onRegenerate,
  onClearBlacklist,
  loading,
  hasTeam,
}: FeedbackPanelProps) {
  if (!hasTeam) return null;

  return (
    <div className="card p-4 flex flex-col gap-3 animate-slide-up">
      <div className="flex items-center gap-2">
        <span style={{ color: "var(--accent)", fontSize: "1rem" }}>↺</span>
        <h3
          className="text-sm font-bold uppercase tracking-wider"
          style={{ color: "var(--text-secondary)" }}
        >
          Feedback al Equipo
        </h3>
      </div>

      <textarea
        className="input"
        placeholder="Ej: No me gusta Garchomp, usa otro Dragon. Quiero más Stall..."
        rows={3}
        style={{ resize: "none", fontFamily: "inherit" }}
        value={feedback}
        onChange={(e) => onFeedbackChange(e.target.value)}
      />

      {/* Quick suggestions */}
      <div className="flex flex-wrap gap-1.5">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            className="text-xs px-2.5 py-1 rounded-full transition-all duration-150"
            style={{
              background: "var(--bg-input)",
              color: "var(--text-muted)",
              border: "1px solid var(--border)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--accent)";
              (e.currentTarget as HTMLButtonElement).style.color = "var(--accent-light)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border)";
              (e.currentTarget as HTMLButtonElement).style.color = "var(--text-muted)";
            }}
            onClick={() => onFeedbackChange(s)}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Blacklist */}
      {blacklist.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span
              className="text-xs uppercase tracking-wider font-semibold"
              style={{ color: "var(--text-muted)" }}
            >
              Excluidos
            </span>
            <button
              className="btn-ghost"
              style={{ fontSize: "0.7rem", padding: "2px 8px", color: "var(--danger)" }}
              onClick={onClearBlacklist}
            >
              Limpiar
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {blacklist.map((name) => (
              <span
                key={name}
                className="text-xs px-2 py-0.5 rounded-full capitalize"
                style={{
                  background: "rgba(239,68,68,0.1)",
                  color: "var(--danger)",
                  border: "1px solid rgba(239,68,68,0.25)",
                }}
              >
                ✕ {name}
              </span>
            ))}
          </div>
        </div>
      )}

      <button
        className="btn-primary w-full"
        onClick={onRegenerate}
        disabled={loading}
      >
        {loading ? "Regenerando..." : "Regenerar con Feedback"}
      </button>
    </div>
  );
}
