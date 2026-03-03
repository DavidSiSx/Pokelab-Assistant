"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";

export type Theme = "pokeball" | "midnight" | "forest" | "plasma" | "ultra";

export const THEMES: { value: Theme; label: string; accent: string }[] = [
  { value: "pokeball", label: "Pokeball",  accent: "#e53e3e" },
  { value: "midnight", label: "Midnight",  accent: "#4c6ef5" },
  { value: "forest",   label: "Forest",    accent: "#40c057" },
  { value: "plasma",   label: "Plasma",    accent: "#cc5de8" },
  { value: "ultra",    label: "Ultra",     accent: "#f59f00" },
];

const STORAGE_KEY = "plab-theme";

interface ThemeContextValue {
  theme: Theme;
  setTheme: (t: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "pokeball",
  setTheme: () => {},
});

export function ThemeProvider({
  children,
  initialTheme,
}: {
  children: ReactNode;
  initialTheme?: Theme;
}) {
  const [theme, setThemeState] = useState<Theme>(initialTheme ?? "pokeball");

  // On mount: read localStorage (client priority over server initial)
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as Theme | null;
    if (stored && THEMES.find((t) => t.value === stored)) {
      setThemeState(stored);
      document.documentElement.setAttribute("data-theme", stored);
    } else if (initialTheme) {
      document.documentElement.setAttribute("data-theme", initialTheme);
    }
  }, [initialTheme]);

  const setTheme = useCallback(
    (t: Theme) => {
      setThemeState(t);
      document.documentElement.setAttribute("data-theme", t);
      localStorage.setItem(STORAGE_KEY, t);

      // Persist to Supabase if user is logged in (fire-and-forget)
      fetch("/api/user/preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ theme: t }),
      }).catch(() => {});
    },
    []
  );

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
