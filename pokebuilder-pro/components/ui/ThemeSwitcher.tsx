"use client";

import { useState } from "react";
import { useTheme, THEMES } from "@/providers/ThemeProvider";
import { Palette } from "lucide-react";

interface ThemeSwitcherProps {
  compact?: boolean;
}

export function ThemeSwitcher({ compact = false }: ThemeSwitcherProps) {
  const { theme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="btn-ghost flex items-center gap-2"
        aria-label="Cambiar tema"
        aria-expanded={open}
      >
        <Palette size={16} />
        {!compact && (
          <span className="hidden sm:inline text-xs font-medium uppercase tracking-wider">
            {THEMES.find((t) => t.value === theme)?.label ?? "Tema"}
          </span>
        )}
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />

          {/* Dropdown */}
          <div
            className="absolute right-0 top-full mt-2 z-50 card animate-fade-in-scale p-2 flex flex-col gap-1 min-w-[160px]"
            role="menu"
          >
            <p
              className="text-[0.65rem] font-bold uppercase tracking-widest px-2 pb-1"
              style={{ color: "var(--text-muted)" }}
            >
              Seleccionar tema
            </p>

            {THEMES.map((t) => (
              <button
                key={t.value}
                onClick={() => {
                  setTheme(t.value);
                  setOpen(false);
                }}
                className="flex items-center gap-3 px-2 py-2 rounded-lg text-left transition-colors w-full"
                style={{
                  background: theme === t.value ? "var(--accent-glow)" : "transparent",
                  color: theme === t.value ? "var(--accent-light)" : "var(--text-primary)",
                }}
                role="menuitem"
              >
                {/* Color dot */}
                <span
                  className="w-4 h-4 rounded-full flex-shrink-0 ring-2"
                  style={{
                    background: t.accent,
                    ringColor: theme === t.value ? t.accent : "transparent",
                    boxShadow: theme === t.value ? `0 0 0 2px ${t.accent}` : "none",
                  }}
                />
                <span className="text-sm font-medium">{t.label}</span>
                {theme === t.value && (
                  <span
                    className="ml-auto text-[0.6rem] font-bold uppercase"
                    style={{ color: "var(--accent)" }}
                  >
                    Activo
                  </span>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
