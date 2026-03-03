'use client';

import { useState, useRef, useEffect } from 'react';
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
}

export function LeaderSearch({
  onSelect,
  onClear,
  selected,
  placeholder = 'Buscar Pokémon líder...',
}: LeaderSearchProps) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const { results, loading, search, clear } = usePokemonSearch();
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    search(query);
  }, [query, search]);

  // Close on outside click
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  function handleSelect(r: SearchResult) {
    const member: TeamMember = {
      id: r.id,
      nombre: r.nombre,
      tipo1: r.tipo1 ?? '',
      tipo2: r.tipo2 ?? null,
      sprite_url: r.sprite_url,
    };
    onSelect(member);
    setQuery('');
    setOpen(false);
    clear();
  }

  if (selected) {
    return (
      <div className='glass-card p-4 flex items-center gap-4 animate-bounce-in border border-accent/50'>
        <PokemonSprite
          name={selected.nombre}
          spriteUrl={selected.sprite_url}
          size={48}
          animate
        />
        <div className='flex flex-col gap-1.5 flex-1 min-w-0'>
          <span className='font-bold capitalize text-sm text-foreground'>
            {selected.nombre}
          </span>
          <div className='flex gap-1.5'>
            {selected.tipo1 && <TypeBadge type={selected.tipo1} size='sm' />}
            {selected.tipo2 && <TypeBadge type={selected.tipo2} size='sm' />}
          </div>
        </div>
        <div className='flex items-center gap-2'>
          <span className='px-2.5 py-1 bg-accent/20 border border-accent/40 rounded-full text-xs font-bold text-accent'>
            Líder
          </span>
          <button
            onClick={onClear}
            className='p-2 hover:bg-bg-card-hover rounded-lg transition-colors text-muted-foreground hover:text-foreground flex-shrink-0'
            aria-label='Quitar líder'
          >
            <X className='w-4 h-4' />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className='relative'>
      <div className='relative'>
        <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none' />
        <input
          ref={inputRef}
          className='w-full pl-9 pr-9 py-2.5 bg-bg-input border border-border/50 rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/50 transition-colors'
          placeholder={placeholder}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => query.length >= 2 && setOpen(true)}
          aria-label='Buscar pokémon líder'
          aria-autocomplete='list'
          aria-expanded={open}
        />
        {query && (
          <button
            onClick={() => {
              setQuery('');
              clear();
              setOpen(false);
            }}
            className='absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-bg-card-hover rounded transition-colors text-muted-foreground'
            aria-label='Limpiar búsqueda'
          >
            <X className='w-4 h-4' />
          </button>
        )}
      </div>

      {open && (results.length > 0 || loading) && (
        <div
          ref={dropdownRef}
          className='absolute top-full left-0 right-0 z-20 mt-2 rounded-lg overflow-hidden glass-card border border-border/30 animate-bounce-in'
          style={{
            maxHeight: 320,
            overflowY: 'auto',
          }}
          role='listbox'
        >
          {loading && (
            <div className='p-4 text-sm text-center text-muted-foreground flex items-center justify-center gap-2'>
              <div className='w-3 h-3 border-2 border-accent/30 border-t-accent rounded-full animate-spin' />
              Buscando Pokémon...
            </div>
          )}
          {results.map((r, idx) => (
            <button
              key={r.id}
              className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors duration-100 hover:bg-bg-card-hover ${
                idx !== results.length - 1 ? 'border-b border-border/20' : ''
              }`}
              onClick={() => handleSelect(r)}
              role='option'
              aria-selected={false}
            >
              <PokemonSprite name={r.nombre} spriteUrl={r.sprite_url} size={40} />
              <div className='flex flex-col gap-1 flex-1 min-w-0'>
                <span className='text-sm font-semibold capitalize text-foreground'>
                  {r.nombre}
                </span>
                <div className='flex gap-1'>
                  {r.tipo1 && <TypeBadge type={r.tipo1} size='sm' />}
                  {r.tipo2 && <TypeBadge type={r.tipo2} size='sm' />}
                </div>
              </div>
              {r.tier && (
                <span className='px-2 py-1 bg-accent/20 border border-accent/30 rounded text-xs font-bold text-accent flex-shrink-0'>
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
