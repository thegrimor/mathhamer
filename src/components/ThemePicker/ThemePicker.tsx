import { useState, useEffect, useRef } from 'react'
import { GROUP_LABELS } from '@/themes/themes'
import type { Theme, ThemeId, ThemeGroup } from '@/themes/themes'

interface Props {
  currentTheme: Theme
  themes: Theme[]
  onSelect: (id: ThemeId) => void
}

const GROUP_ORDER: ThemeGroup[] = ['imperium', 'chaos', 'xenos', 'otros']

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

  const grouped = GROUP_ORDER.map(g => ({
    group: g,
    label: GROUP_LABELS[g],
    themes: themes.filter(t => t.group === g),
  })).filter(g => g.themes.length > 0)

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
        <div className="absolute right-0 top-full mt-1 w-60 border border-rim-bright bg-surface-2 z-30 shadow-2xl">
          <p className="px-3 py-1.5 text-[8px] font-display uppercase tracking-widest text-gold border-b border-rim-bright">
            Estética del Cogitador
          </p>
          <div className="max-h-[70vh] overflow-y-auto">
            {grouped.map(({ group, label, themes: groupThemes }) => (
              <div key={group}>
                <p className="px-3 pt-2 pb-1 text-[7px] font-display uppercase tracking-[3px] text-parchment-dim opacity-60 select-none">
                  — {label} —
                </p>
                {groupThemes.map(theme => {
                  const isActive = theme.id === currentTheme.id
                  return (
                    <button
                      key={theme.id}
                      onClick={() => { onSelect(theme.id); setIsOpen(false) }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors border-l-2 ${
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
                            className="block w-2.5 h-4 rounded-[1px]"
                            style={{ background: color }}
                          />
                        ))}
                      </span>
                      <span
                        className="text-[8px] font-display uppercase tracking-wide truncate flex-1"
                        style={{ color: isActive ? theme.colors.parchment : theme.colors.parchmentDim }}
                      >
                        {theme.name}
                      </span>
                      <span
                        className="text-[7px] font-mono shrink-0 opacity-50"
                        style={{ color: theme.colors.parchmentDim }}
                      >
                        {theme.faction}
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
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
