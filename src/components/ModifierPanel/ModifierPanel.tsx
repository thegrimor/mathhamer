import type { ModifierRule } from '@/types'

interface Props {
  rules: ModifierRule[]
  activeIds: Set<string>
  onToggle: (id: string) => void
}

function RuleButton({ rule, active, onToggle }: { rule: ModifierRule; active: boolean; onToggle: (id: string) => void }) {
  const cpLabel = rule.cpCost ? ` [${rule.cpCost}PC]` : ''
  return (
    <button
      onClick={() => onToggle(rule.id)}
      title={rule.description}
      className={`text-left px-2 py-1 border transition-colors text-[8px] font-display uppercase tracking-wider leading-snug ${
        active
          ? 'border-gold bg-gold/20 text-gold-bright'
          : 'border-rim-bright text-parchment-dim hover:border-parchment-dim hover:text-parchment'
      }`}
    >
      <span className="mr-1.5 font-mono">{active ? '▶' : '○'}</span>
      {rule.label}{cpLabel}
    </button>
  )
}

export function ModifierPanel({ rules, activeIds, onToggle }: Props) {
  const armyRules = rules.filter(r => !r.isStratagem)
  const stratagems = rules.filter(r => r.isStratagem)

  if (rules.length === 0) return null

  return (
    <div>
      {armyRules.length > 0 && (
        <>
          <div className="px-3 py-1.5 text-[9px] font-display uppercase tracking-widest text-gold border-b border-t border-rim-bright bg-surface-2">
            Reglas de Ejército
          </div>
          <div className="px-3 py-2 flex flex-col gap-1.5">
            {armyRules.map(rule => (
              <RuleButton key={rule.id} rule={rule} active={activeIds.has(rule.id)} onToggle={onToggle} />
            ))}
          </div>
        </>
      )}
      {stratagems.length > 0 && (
        <>
          <div className="px-3 py-1.5 text-[9px] font-display uppercase tracking-widest text-crimson border-b border-t border-rim-bright bg-surface-2">
            Estratagemas
          </div>
          <div className="px-3 py-2 flex flex-col gap-1.5">
            {stratagems.map(rule => (
              <RuleButton key={rule.id} rule={rule} active={activeIds.has(rule.id)} onToggle={onToggle} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
