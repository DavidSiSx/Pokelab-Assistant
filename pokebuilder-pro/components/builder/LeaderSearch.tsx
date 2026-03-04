'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Search, X } from 'lucide-react';
import type { TeamMember } from '@/types/pokemon';
import type { SearchResult } from '@/types/api';
import { usePokemonSearch } from '@/hooks/usePokemonSearch';
import { PokemonSprite } from '@/components/pokemon/PokemonSprite';
import { TypeBadge } from '@/components/ui/TypeBadge';

interface LeaderSearchProps {
  onSelect: (pokemon: TeamMember) => void;
  onClear: () => void;
  selected: TeamMember | null;
  placeholder?: string;
  disabled?: boolean;
}

export function LeaderSearch({
  onSelect,
  onClear,
  selected,
  placeholder = 'Buscar Pokémon líder...',
  disabled = false,
}: LeaderSearchProps) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  const { results, loading, search, clear } = usePokemonSearch();
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => { search(query); }, [query, search]);

  function updateDropdownPosition() {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setDropdownStyle({
      position: 'fixed',
      top: rect.bottom + 6,
      left: rect.left,
      width: rect.width,
      zIndex: 9999,
    });
  }

  useEffect(() => {
    if (open) updateDropdownPosition();
  }, [open, results]);

  useEffect(() => {
    if (!open) return;
    const onScroll = () => updateDropdownPosition();
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onScroll);
    };
  }, [open]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      const target = e.target as Node;
      if (containerRef.current && !containerRef.current.contains(target)) {
        const portal = document.getElementById('leader-search-portal');
        if (portal && portal.contains(target)) return;
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  function handleSelect(r: SearchResult) {
    onSelect({
      id: r.id,
      nombre: r.nombre,
      tipo1: r.tipo1 ?? '',
      tipo2: r.tipo2 ?? null,
      sprite_url: r.sprite_url,
    });
    setQuery('');
    setOpen(false);
    clear();
  }

  // ── Selected state ────────────────────────────────────────────
  if (selected) {
    return (
      <div
        className="animate-bounce-in"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          padding: '10px 14px',
          background: 'var(--bg-card)',
          border: '1px solid var(--accent)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: '0 0 0 1px var(--accent-glow)',
        }}
      >
        <PokemonSprite name={selected.nombre} spriteUrl={selected.sprite_url} size={44} animate />
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-primary)', textTransform: 'capitalize' }}>
            {selected.nombre}
          </span>
          <div style={{ display: 'flex', gap: 4 }}>
            {selected.tipo1 && <TypeBadge type={selected.tipo1} size="sm" />}
            {selected.tipo2 && <TypeBadge type={selected.tipo2} size="sm" />}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          <span style={{
            padding: '2px 8px',
            background: 'var(--accent-glow)',
            border: '1px solid var(--accent)',
            borderRadius: 99,
            fontSize: '0.65rem',
            fontWeight: 700,
            color: 'var(--accent-light)',
          }}>
            Líder
          </span>
          <button
            onClick={disabled ? undefined : onClear}
            style={{
              padding: 6,
              background: 'transparent',
              border: 'none',
              cursor: disabled ? 'not-allowed' : 'pointer',
              opacity: disabled ? 0.4 : 1,
              color: 'var(--text-muted)',
              borderRadius: 'var(--radius-sm)',
              display: 'flex',
              alignItems: 'center',
            }}
            aria-label="Quitar líder"
          >
            <X size={15} />
          </button>
        </div>
      </div>
    );
  }

  // ── Search state ──────────────────────────────────────────────
  const showDropdown = open && (results.length > 0 || loading);

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <div style={{ position: 'relative' }}>
        <Search
          size={15}
          style={{
            position: 'absolute',
            left: 12,
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--text-muted)',
            pointerEvents: 'none',
          }}
        />
        <input
          ref={inputRef}
          className="input"
          style={{
            paddingLeft: 36,
            paddingRight: query ? 36 : 12,
            opacity: disabled ? 0.5 : 1,
            cursor: disabled ? 'not-allowed' : 'text',
          }}
          placeholder={placeholder}
          value={query}
          disabled={disabled}
          onChange={(e) => { if (!disabled) { setQuery(e.target.value); setOpen(true); } }}
          onFocus={() => { if (!disabled && query.length >= 1) setOpen(true); }}
          aria-label="Buscar Pokémon"
          aria-autocomplete="list"
          aria-expanded={open}
        />
        {query && !disabled && (
          <button
            onClick={() => { setQuery(''); clear(); setOpen(false); }}
            style={{
              position: 'absolute',
              right: 8,
              top: '50%',
              transform: 'translateY(-50%)',
              padding: 4,
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
            }}
            aria-label="Limpiar búsqueda"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Dropdown portal */}
      {showDropdown && typeof document !== 'undefined' && createPortal(
        <div
          id="leader-search-portal"
          style={{
            ...dropdownStyle,
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            overflow: 'hidden',
            maxHeight: 320,
            overflowY: 'auto',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          }}
          role="listbox"
        >
          {loading && (
            <div style={{
              padding: '12px 16px',
              fontSize: '0.8rem',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}>
              <div style={{
                width: 12, height: 12,
                border: '2px solid var(--accent)',
                borderTopColor: 'transparent',
                borderRadius: '50%',
                animation: 'spin-slow 0.7s linear infinite',
              }} />
              Buscando Pokémon...
            </div>
          )}

          {results.map((r, idx) => (
            <button
              key={r.id}
              onClick={() => handleSelect(r)}
              role="option"
              aria-selected={false}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '10px 14px',
                background: 'transparent',
                border: 'none',
                borderBottom: idx !== results.length - 1 ? '1px solid var(--border)' : 'none',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'background 0.15s',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-card-hover)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <PokemonSprite name={r.nombre} spriteUrl={r.sprite_url} size={36} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-primary)', textTransform: 'capitalize' }}>
                    {r.nombre}
                  </span>
                  {r.tier && r.tier !== 'Unranked' && (
                    <span style={{
                      fontSize: '0.6rem', fontWeight: 700,
                      padding: '1px 6px', borderRadius: 99,
                      background: 'var(--accent-glow)',
                      color: 'var(--accent-light)',
                      border: '1px solid var(--accent)',
                      flexShrink: 0,
                    }}>
                      {r.tier}
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 4, marginTop: 3 }}>
                  {r.tipo1 && <TypeBadge type={r.tipo1} size="sm" />}
                  {r.tipo2 && <TypeBadge type={r.tipo2} size="sm" />}
                </div>
              </div>
            </button>
          ))}
        </div>,
        document.body
      )}
    </div>
  );
}