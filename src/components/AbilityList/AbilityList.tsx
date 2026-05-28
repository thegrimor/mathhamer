import { useState } from 'react'
import type { Ability, DetachmentAbility, ModifierRule } from '@/types'

interface Props {
  abilities: Ability[]
  detachmentAbilities: DetachmentAbility[]
  relatedRules?: ModifierRule[]
  activeModifierIds?: Set<string>
  onModifierToggle?: (id: string) => void
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

function norm(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, ' ').trim()
}

function findMatchingRules(abilityName: string, rules: ModifierRule[]): ModifierRule[] {
  const a = norm(abilityName)
  if (!a) return []
  return rules.filter(rule => {
    const base = norm(rule.label.split(' — ')[0])
    return base.includes(a) || a.includes(base)
  })
}

function ModifierBadge({
  rules,
  activeIds,
  onToggle,
}: {
  rules: ModifierRule[]
  activeIds?: Set<string>
  onToggle?: (id: string) => void
}) {
  return (
    <span className="inline-flex items-center gap-1 ml-2">
      {rules.map(rule => {
        const active = activeIds?.has(rule.id) ?? false
        return (
          <button
            key={rule.id}
            onClick={e => { e.stopPropagation(); onToggle?.(rule.id) }}
            title={rule.label}
            className={`text-[8px] font-mono px-1 py-0.5 border transition-colors ${
              active
                ? 'border-gold bg-gold/20 text-gold-bright'
                : 'border-rim-bright text-parchment-dim hover:border-gold/50 hover:text-parchment'
            }`}
          >
            {active ? '▶' : '○'} MOD
          </button>
        )
      })}
    </span>
  )
}

export function AbilityList({ abilities, detachmentAbilities, relatedRules = [], activeModifierIds, onModifierToggle }: Props) {
  const [open, setOpen] = useState(false)
  const total = abilities.length + detachmentAbilities.length
  if (total === 0) return null

  return (
    <div className="border-b border-rim-bright">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-3 py-2 text-[9px] font-display uppercase tracking-widest text-gold hover:text-gold-bright transition-colors"
      >
        <span>Habilidades ({total})</span>
        <span>{open ? '▴' : '▾'}</span>
      </button>

      {open && (
        <div className="px-3 pb-3 space-y-2">
          {detachmentAbilities.map(da => {
            const matched = findMatchingRules(da.name, relatedRules)
            return (
              <div key={da.id} className="border border-gold/30 bg-gold/5 p-2">
                <p className="text-[9px] font-display uppercase tracking-widest text-gold mb-1 flex items-center flex-wrap">
                  ◆ {da.name}
                  {matched.length > 0 && (
                    <ModifierBadge rules={matched} activeIds={activeModifierIds} onToggle={onModifierToggle} />
                  )}
                </p>
                <p className="text-[10px] font-mono text-parchment-dim leading-relaxed">
                  {stripHtml(da.description)}
                </p>
              </div>
            )
          })}

          {abilities.map((ab, i) => {
            const matched = findMatchingRules(ab.name, relatedRules)
            return (
              <div key={i} className="border-l-2 border-l-rim-bright pl-2">
                <p className="text-[9px] font-display uppercase tracking-widest text-parchment mb-0.5 flex items-center flex-wrap">
                  {ab.name}
                  {ab.model && (
                    <span className="text-parchment-dim normal-case tracking-normal font-mono ml-1">
                      ({ab.model})
                    </span>
                  )}
                  {matched.length > 0 && (
                    <ModifierBadge rules={matched} activeIds={activeModifierIds} onToggle={onModifierToggle} />
                  )}
                </p>
                <p className="text-[10px] font-mono text-parchment-dim leading-relaxed">
                  {stripHtml(ab.description)}
                </p>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
