"use client";

import { useState, useCallback, useRef } from "react";
import type { SearchResult } from "@/types/api";

export function usePokemonSearch() {
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = useCallback((query: string, excludeIds: number[] = []) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!query || query.length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);

    debounceRef.current = setTimeout(async () => {
      try {
        const params = new URLSearchParams({ q: query, limit: "12" });
        if (excludeIds.length > 0) params.set("exclude", excludeIds.join(","));

        const res = await fetch(`/api/pokemon/search?${params}`);
        if (!res.ok) throw new Error("Error al buscar");

        const data: SearchResult[] = await res.json();
        setResults(Array.isArray(data) ? data : []);
        setError(null);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error de búsqueda");
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 280);
  }, []);

  const clear = useCallback(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setResults([]);
    setError(null);
  }, []);

  return { results, loading, error, search, clear };
}
