"use client";

import { useState } from "react";
import { useTheme, THEMES } from "@/providers/ThemeProvider";
import { Palette, Moon, Sun, Check } from "lucide-react";

interface ThemeSwitcherProps {
  compact?: boolean;
}

export function ThemeSwitcher({ compact = false }: ThemeSwitcherProps) {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);

  const current = THEMES.find((t) => t.value === theme);
  const darkThemes  = THEMES.filter((t) => t.dark);
  const lightThemes = THEMES.filter((t) => !t.dark);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 px-2.5 py-2 rounded-lg transition-all"
        style={{
          background: open ? "var(--bg-card)" : "transparent",
          border: `1px solid ${open ? "var(--border)" : "transparent"}`,
          color: "var(--text-secondary)",
        }}
        aria-label="Cambiar tema"
        aria-expanded={open}
      >
        {/* Color dot */}
        <span
          className="w-4 h-4 rounded-full flex-shrink-0"
          style={{
            background: current?.accent ?? "var(--accent)",
            boxShadow: `0 0 6px ${current?.accent ?? "var(--accent)"}88`,
          }}
        />
        {!compact && (
          <span className="hidden sm:inline text-xs font-medium">
            {current?.label ?? "Tema"}
          </span>
        )}
        <Palette size={13} />
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div
            className="absolute right-0 top-full mt-2 z-50 animate-bounce-in p-3 flex flex-col gap-2"
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-lg)",
              boxShadow: "0 12px 40px rgba(0,0,0,0.45)",
              minWidth: 220,
            }}
            role="menu"
          >
            {/* Dark themes */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1.5 px-2 pb-1">
                <Moon size={10} style={{ color: "var(--text-muted)" }} />
                <span className="text-[0.58rem] font-bold uppercase tracking-widest"
                  style={{ color: "var(--text-muted)" }}>
                  Oscuro
                </span>
              </div>
              {darkThemes.map((t) => (
                <ThemeRow
                  key={t.value}
                  theme={t}
                  active={theme === t.value}
                  onSelect={() => { setTheme(t.value); setOpen(false); }}
                />
              ))}
            </div>

            <div style={{ height: 1, background: "var(--border)" }} />

            {/* Light themes */}
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1.5 px-2 pb-1">
                <Sun size={10} style={{ color: "var(--text-muted)" }} />
                <span className="text-[0.58rem] font-bold uppercase tracking-widest"
                  style={{ color: "var(--text-muted)" }}>
                  Claro
                </span>
              </div>
              {lightThemes.map((t) => (
                <ThemeRow
                  key={t.value}
                  theme={t}
                  active={theme === t.value}
                  onSelect={() => { setTheme(t.value); setOpen(false); }}
                />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function ThemeRow({
  theme: t,
  active,
  onSelect,
}: {
  theme: { value: string; label: string; accent: string };
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      onClick={onSelect}
      className="flex items-center gap-3 px-2 py-2 rounded-lg w-full text-left transition-all"
      style={{
        background: active ? `${t.accent}20` : "transparent",
        border: `1px solid ${active ? t.accent + "55" : "transparent"}`,
        cursor: "pointer",
      }}
      role="menuitem"
    >
      <span
        className="w-5 h-5 rounded-full flex-shrink-0"
        style={{
          background: t.accent,
          boxShadow: active ? `0 0 8px ${t.accent}88` : "none",
        }}
      />
      <span
        className="text-sm font-medium flex-1"
        style={{ color: active ? t.accent : "var(--text-primary)" }}
      >
        {t.label}
      </span>
      {active && <Check size={13} style={{ color: t.accent, flexShrink: 0 }} />}
    </button>
  );
}