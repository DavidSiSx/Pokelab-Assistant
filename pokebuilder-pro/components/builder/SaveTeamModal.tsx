'use client';

import { useState } from 'react';
import { X, Save, AlertCircle, Globe } from 'lucide-react';

interface SaveTeamModalProps {
  onSave: (nombre: string, descripcion: string, isPublic: boolean) => Promise<void>;
  onClose: () => void;
  saving: boolean;
}

export function SaveTeamModal({ onSave, onClose, saving }: SaveTeamModalProps) {
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [error, setError] = useState('');

  async function handleSave() {
    if (!nombre.trim()) {
      setError('El nombre del equipo es obligatorio.');
      return;
    }
    setError('');
    await onSave(nombre.trim(), descripcion.trim(), isPublic);
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className='fixed inset-0 bg-black/50 backdrop-blur-sm z-40'
        onClick={onClose}
      />

      {/* Modal */}
      <div className='fixed inset-0 flex items-center justify-center z-50 p-4'>
        <div
          className='glass-card w-full max-w-md animate-bounce-in'
          onClick={(e) => e.stopPropagation()}
          role='dialog'
          aria-modal='true'
          aria-labelledby='save-modal-title'
        >
          {/* Header */}
          <div className='flex items-center justify-between border-b border-border/30 pb-4 mb-6'>
            <h2 id='save-modal-title' className='text-xl font-bold text-foreground flex items-center gap-2'>
              <Save className='w-5 h-5 text-accent' />
              Guardar Equipo
            </h2>
            <button
              onClick={onClose}
              className='p-1.5 hover:bg-bg-card-hover rounded-lg transition-colors text-muted-foreground hover:text-foreground'
              aria-label='Cerrar modal'
            >
              <X className='w-5 h-5' />
            </button>
          </div>

          <div className='space-y-5'>
            {/* Error */}
            {error && (
              <div className='flex gap-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg items-start'>
                <AlertCircle className='w-5 h-5 text-red-500 flex-shrink-0 mt-0.5' />
                <p className='text-sm text-red-400'>{error}</p>
              </div>
            )}

            {/* Nombre */}
            <div className='flex flex-col gap-2'>
              <label htmlFor='team-name' className='text-sm font-medium text-foreground'>
                Nombre del Equipo <span className='text-accent'>*</span>
              </label>
              <input
                id='team-name'
                type='text'
                placeholder='Mi equipo VGC 2025...'
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                onKeyDown={handleKeyDown}
                maxLength={60}
                autoFocus
                disabled={saving}
                className='px-3 py-2.5 bg-bg-input border border-border/50 rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/50 transition-colors disabled:opacity-50'
              />
              <p className='text-xs text-muted-foreground'>{nombre.length}/60</p>
            </div>

            {/* Descripción */}
            <div className='flex flex-col gap-2'>
              <label htmlFor='team-desc' className='text-sm font-medium text-foreground'>
                Descripción
              </label>
              <textarea
                id='team-desc'
                placeholder='Estrategia, notas, recomendaciones...'
                rows={3}
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                onKeyDown={(e) => e.key === 'Escape' && onClose()}
                maxLength={280}
                disabled={saving}
                className='px-3 py-2.5 bg-bg-input border border-border/50 rounded-lg text-foreground placeholder-muted-foreground focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/50 transition-colors resize-none disabled:opacity-50'
              />
              <p className='text-xs text-muted-foreground'>{descripcion.length}/280</p>
            </div>

            {/* Public Toggle */}
            <label className='flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity'>
              <div className='relative w-10 h-6 flex-shrink-0'>
                <input
                  type='checkbox'
                  checked={isPublic}
                  onChange={(e) => setIsPublic(e.target.checked)}
                  disabled={saving}
                  className='sr-only'
                />
                <div
                  className='w-full h-full rounded-full transition-colors duration-200'
                  style={{
                    background: isPublic ? 'var(--accent)' : 'var(--bg-card-hover)',
                    border: `1px solid ${isPublic ? 'var(--accent)' : 'var(--border)'}`,
                  }}
                />
                <div
                  className='absolute top-1 w-4 h-4 bg-white rounded-full transition-transform duration-200'
                  style={{
                    left: isPublic ? '1.5rem' : '0.25rem',
                  }}
                />
              </div>
              <div className='flex flex-col gap-0.5'>
                <span className='text-sm font-medium text-foreground flex items-center gap-1.5'>
                  <Globe className='w-4 h-4 text-accent' />
                  Equipo Público
                </span>
                <span className='text-xs text-muted-foreground'>
                  Visible en la galería de equipos populares
                </span>
              </div>
            </label>
          </div>

          {/* Actions */}
          <div className='flex gap-3 mt-8 pt-6 border-t border-border/30'>
            <button
              onClick={onClose}
              disabled={saving}
              className='flex-1 px-4 py-2.5 bg-bg-card hover:bg-bg-card-hover text-foreground border border-border/50 rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed'
            >
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !nombre.trim()}
              className='flex-1 px-4 py-2.5 bg-accent hover:bg-accent/90 text-white rounded-lg font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2'
            >
              {saving ? (
                <>
                  <div className='w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin' />
                  Guardando...
                </>
              ) : (
                <>
                  <Save className='w-4 h-4' />
                  Guardar Equipo
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
