"use client";

import { useState, useRef, useEffect } from "react";
import type { TeamMember } from "@/types/pokemon";
import type { SearchResult } from "@/types/api";
import { usePokemonSearch } from "@/hooks/usePokemonSearch";
import { PokemonSprite } from "@/components/pokemon/PokemonSprite";
import { TypeBadge } from "@/components/ui/TypeBadge";

interface LeaderSearchProps {
  onSelect: (pokemon: TeamMember) => void;
  onClear: () => void;
  selected: TeamMember | null;
  placeholder?: string;
}

export function LeaderSearch({
  onSelect,
  onClear,
  selected,
  placeholder = "Buscar Pokémon líder...",
}: LeaderSearchProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const { results, loading, search, clear } = usePokemonSearch();
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    search(query);
  }, [query, search]);

  // Close on outside click
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        !inputRef.current?.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  function handleSelect(r: SearchResult) {
    const member: TeamMember = {
      id: r.id,
      nombre: r.nombre,
      tipo1: r.tipo1 ?? "",
      tipo2: r.tipo2 ?? null,
      sprite_url: r.sprite_url,
    };
    onSelect(member);
    setQuery("");
    setOpen(false);
    clear();
  }

  if (selected) {
    return (
      <div
        className="card p-3 flex items-center gap-3 animate-fade-in"
        style={{ borderColor: "var(--accent)", boxShadow: "0 0 0 1px var(--accent-glow)" }}
      >
        <PokemonSprite name={selected.nombre} spriteUrl={selected.sprite_url} size={48} animate />
        <div className="flex flex-col gap-1 flex-1 min-w-0">
          <span className="font-bold capitalize text-sm" style={{ color: "var(--text-primary)" }}>
            {selected.nombre}
          </span>
          <div className="flex gap-1">
            {selected.tipo1 && <TypeBadge type={selected.tipo1} size="sm" />}
            {selected.tipo2 && <TypeBadge type={selected.tipo2} size="sm" />}
          </div>
        </div>
        <span
          className="badge badge-accent"
          style={{ fontSize: "0.6rem" }}
        >
          Líder
        </span>
        <button
          className="btn-ghost"
          style={{ padding: "4px 8px", color: "var(--text-muted)", flexShrink: 0 }}
          onClick={onClear}
          aria-label="Quitar líder"
        >
          ✕
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      <input
        ref={inputRef}
        className="input"
        placeholder={placeholder}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => query.length >= 2 && setOpen(true)}
        aria-label="Buscar pokemon líder"
        aria-autocomplete="list"
        aria-expanded={open}
      />

      {open && (results.length > 0 || loading) && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 z-20 mt-1 rounded-xl overflow-hidden animate-fade-in-scale"
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
            maxHeight: 280,
            overflowY: "auto",
          }}
          role="listbox"
        >
          {loading && (
            <div className="p-3 text-sm text-center" style={{ color: "var(--text-muted)" }}>
              Buscando...
            </div>
          )}
          {results.map((r) => (
            <button
              key={r.id}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors duration-100"
              style={{ background: "transparent", border: "none", cursor: "pointer" }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLElement).style.background = "var(--bg-card-hover)")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLElement).style.background = "transparent")}
              onClick={() => handleSelect(r)}
              role="option"
              aria-selected={false}
            >
              <PokemonSprite name={r.nombre} spriteUrl={r.sprite_url} size={36} />
              <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                <span className="text-sm font-medium capitalize" style={{ color: "var(--text-primary)" }}>
                  {r.nombre}
                </span>
                <div className="flex gap-1">
                  {r.tipo1 && <TypeBadge type={r.tipo1} size="sm" />}
                  {r.tipo2 && <TypeBadge type={r.tipo2} size="sm" />}
                </div>
              </div>
              {r.tier && (
                <span
                  className="text-xs font-bold"
                  style={{ color: "var(--accent)", flexShrink: 0 }}
                >
                  {r.tier}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
