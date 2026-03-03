"use client";

import type { AiReport } from "@/types/api";

interface AiReportPanelProps {
  report: AiReport;
}

export function AiReportPanel({ report }: AiReportPanelProps) {
  return (
    <div className="card p-4 flex flex-col gap-4 animate-slide-up">
      <div className="flex items-center gap-2">
        <span style={{ color: "var(--accent)", fontSize: "1.1rem" }}>★</span>
        <h3
          className="font-bold text-sm uppercase tracking-wider"
          style={{ color: "var(--text-secondary)" }}
        >
          Análisis de IA
        </h3>
      </div>

      {report.estrategia && (
        <div className="flex flex-col gap-1.5">
          <span
            className="text-xs uppercase tracking-wider font-semibold"
            style={{ color: "var(--text-muted)" }}
          >
            Estrategia
          </span>
          <p
            className="text-sm leading-relaxed"
            style={{ color: "var(--text-primary)" }}
          >
            {report.estrategia}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {report.ventajas && report.ventajas.length > 0 && (
          <TagList
            title="Ventajas"
            items={report.ventajas}
            color="var(--success)"
            bg="rgba(34,197,94,0.08)"
          />
        )}
        {report.debilidades && report.debilidades.length > 0 && (
          <TagList
            title="Debilidades"
            items={report.debilidades}
            color="var(--danger)"
            bg="rgba(239,68,68,0.08)"
          />
        )}
      </div>

      {report.leads && report.leads.length > 0 && (
        <TagList
          title="Leads Sugeridos"
          items={report.leads}
          color="var(--info)"
          bg="rgba(59,130,246,0.08)"
        />
      )}
    </div>
  );
}

function TagList({
  title,
  items,
  color,
  bg,
}: {
  title: string;
  items: string[];
  color: string;
  bg: string;
}) {
  return (
    <div className="flex flex-col gap-2">
      <span
        className="text-xs uppercase tracking-wider font-semibold"
        style={{ color: "var(--text-muted)" }}
      >
        {title}
      </span>
      <div className="flex flex-col gap-1.5">
        {items.map((item, i) => (
          <div
            key={i}
            className="flex items-start gap-2 rounded-lg px-3 py-2 text-xs"
            style={{ background: bg, color, border: `1px solid ${color}22` }}
          >
            <span style={{ flexShrink: 0, marginTop: "1px" }}>•</span>
            <span className="leading-relaxed">{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
