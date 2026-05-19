import type { ModifierRule } from '@/types'

interface Props {
  rules: ModifierRule[]
  activeIds: Set<string>
  onToggle: (id: string) => void
}

export function ModifierPanel({ rules, activeIds, onToggle }: Props) {
  if (rules.length === 0) return null

  return (
    <div>
      <div className="px-3 py-1.5 text-[9px] font-display uppercase tracking-widest text-gold border-b border-t border-rim-bright bg-surface-2">
        Modificadores
      </div>
      <div className="px-3 py-2 flex flex-col gap-1.5">
        {rules.map(rule => {
          const active = activeIds.has(rule.id)
          return (
            <button
              key={rule.id}
              onClick={() => onToggle(rule.id)}
              title={rule.description}
              className={`text-left px-2 py-1 border transition-colors text-[8px] font-display uppercase tracking-wider leading-snug ${
                active
                  ? 'border-gold bg-gold/20 text-gold-bright'
                  : 'border-rim-bright text-parchment-dim hover:border-parchment-dim hover:text-parchment'
              }`}
            >
              <span className="mr-1.5 font-mono">{active ? '▶' : '○'}</span>
              {rule.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}
