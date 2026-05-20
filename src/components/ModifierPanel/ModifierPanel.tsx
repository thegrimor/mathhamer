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
      className={`text-left px-2 py-1.5 border transition-colors ${
        active
          ? 'border-gold bg-gold/20 text-gold-bright'
          : 'border-rim-bright text-parchment hover:border-gold/50 hover:text-parchment'
      }`}
    >
      <div className="text-xs font-mono leading-snug">
        <span className="mr-1.5">{active ? '▶' : '○'}</span>
        {rule.label}{cpLabel}
      </div>
      {rule.isStratagem && rule.description && (
        <div className="text-[10px] font-mono leading-snug mt-0.5 pl-4 opacity-70">
          {rule.description}
        </div>
      )}
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
          <div className="px-3 py-2 text-xs font-display uppercase tracking-wide text-gold border-b border-t border-rim-bright bg-surface-2">
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
          <div className="px-3 py-2 text-xs font-display uppercase tracking-wide text-crimson border-b border-t border-rim-bright bg-surface-2">
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
