import { useState, useEffect, useRef } from 'react'
import type { Theme, ThemeId } from '@/themes/themes'

interface Props {
  currentTheme: Theme
  themes: Theme[]
  onSelect: (id: ThemeId) => void
}

export function ThemePicker({ currentTheme, themes, onSelect }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  return (
    <div ref={containerRef} className="relative ml-auto">
      <button
        onClick={() => setIsOpen(o => !o)}
        className="flex items-center gap-1.5 px-2 py-1 border border-rim-bright hover:border-gold transition-colors"
        title="Cambiar tema visual"
        aria-label="Selector de tema visual"
      >
        <span className="inline-grid grid-cols-2 gap-px w-4 h-4 shrink-0">
          <span style={{ background: currentTheme.colors.crimsonBright }} className="block" />
          <span style={{ background: currentTheme.colors.goldBright }} className="block" />
          <span style={{ background: currentTheme.colors.surface4 }} className="block" />
          <span style={{ background: currentTheme.colors.parchment }} className="block" />
        </span>
        <span className="font-display text-[8px] uppercase tracking-widest text-parchment-dim hidden sm:inline select-none">
          Tema
        </span>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 w-56 border border-rim-bright bg-surface-2 z-30 shadow-2xl">
          <p className="px-3 py-1.5 text-[8px] font-display uppercase tracking-widest text-gold border-b border-rim-bright">
            Estética del Cogitador
          </p>
          {themes.map(theme => {
            const isActive = theme.id === currentTheme.id
            return (
              <button
                key={theme.id}
                onClick={() => { onSelect(theme.id); setIsOpen(false) }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors border-l-2 ${
                  isActive ? 'bg-surface-3' : 'hover:bg-surface-3'
                }`}
                style={{ borderLeftColor: isActive ? theme.colors.crimsonBright : 'transparent' }}
              >
                <span className="flex gap-0.5 shrink-0">
                  {[
                    theme.colors.crimsonBright,
                    theme.colors.goldBright,
                    theme.colors.surface3,
                    theme.colors.parchment,
                  ].map((color, i) => (
                    <span
                      key={i}
                      className="block w-3 h-5 rounded-[1px]"
                      style={{ background: color }}
                    />
                  ))}
                </span>
                <span
                  className="text-[9px] font-display uppercase tracking-wide truncate flex-1"
                  style={{ color: isActive ? theme.colors.parchment : theme.colors.parchmentDim }}
                >
                  {theme.name}
                </span>
                {isActive && (
                  <span className="text-[8px] font-mono shrink-0" style={{ color: theme.colors.crimsonBright }}>
                    ▶
                  </span>
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
