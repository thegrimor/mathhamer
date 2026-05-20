import { useState, useMemo } from 'react'
import { UnitSelector } from '@/components/UnitSelector/UnitSelector'
import { StatsBar } from '@/components/StatsBar/StatsBar'
import { WeaponCard } from '@/components/WeaponCard/WeaponCard'
import { AbilityList } from '@/components/AbilityList/AbilityList'
import { StratList } from '@/components/StratList/StratList'
import { ModifierPanel } from '@/components/ModifierPanel/ModifierPanel'
import { MODIFIER_RULES } from '@/data/modifiers'
import type { GameData, Weapon, ModelProfile, CombatType } from '@/types'
import type { PanelState } from '@/hooks/usePanelState'

interface Props {
  gameData: GameData
  panel: PanelState
  side: 'left' | 'right'
  onWeaponChange?: (w: Weapon | null) => void
  onModelChange?: (m: ModelProfile | null) => void
  selectedWeapon?: Weapon | null
  combatType?: CombatType
  activeModifierIds?: Set<string>
  onModifierToggle?: (id: string) => void
}

export function UnitPanel({
  gameData, panel, side, onWeaponChange, onModelChange, selectedWeapon,
  combatType = 'ranged', activeModifierIds, onModifierToggle,
}: Props) {
  const [modelIdx, setModelIdx] = useState(0)
  const { selectedUnit, detachmentAbilities, applicableStratagems } = panel
  const isAttacker = side === 'left'

  function handleModelSelect(i: number) {
    setModelIdx(i)
    onModelChange?.(selectedUnit?.models[i] ?? null)
  }

  function handleWeaponSelect(w: Weapon) {
    if (!isAttacker) return
    const same = selectedWeapon?.name === w.name && selectedWeapon?.line === w.line
    onWeaponChange?.(same ? null : w)
  }

  const visibleRules = useMemo(() => {
    const { factionId, detachmentId } = panel.selection
    return MODIFIER_RULES.filter(rule => {
      const ruleTarget = rule.target ?? 'attacker'
      if (isAttacker && ruleTarget === 'defender') return false
      if (!isAttacker && ruleTarget === 'attacker') return false
      if (rule.factionId && rule.factionId !== factionId) return false
      if (rule.detachmentId && rule.detachmentId !== detachmentId) return false
      if (rule.combatType && rule.combatType !== combatType) return false
      if (rule.id === 'weapon_heavy' && !selectedWeapon?.isHeavy) return false
      return true
    })
  }, [isAttacker, panel.selection, combatType, selectedWeapon])

  const roleLabel = selectedUnit?.role ? ` · ${selectedUnit.role}` : ''

  return (
    <div className="flex flex-col">
      {/* Panel header */}
      <div className={`px-3 py-2 border-b-2 ${isAttacker ? 'border-crimson' : 'border-gold'} bg-surface-2`}>
        <span className={`text-[10px] font-display uppercase tracking-[4px] ${isAttacker ? 'text-crimson' : 'text-gold'}`}>
          {isAttacker ? 'Atacante' : 'Defensor'}
        </span>
        {selectedUnit && (
          <span className="text-[9px] font-mono text-parchment-dim ml-2">{selectedUnit.name}{roleLabel}</span>
        )}
      </div>

      <UnitSelector gameData={gameData} panel={panel} />

      {selectedUnit && (
        <>
          <StatsBar
            models={selectedUnit.models}
            selectedIndex={modelIdx}
            onSelectIndex={handleModelSelect}
          />

          {/* Weapons section */}
          <div>
            <div className="px-3 py-2 text-xs font-display uppercase tracking-wide text-gold border-b border-rim-bright bg-surface-2">
              Armamento
              {isAttacker && (
                <span className="text-parchment-dim normal-case tracking-normal font-mono ml-2">
                  (selecciona para calcular)
                </span>
              )}
            </div>
            {selectedUnit.weapons.length === 0 ? (
              <p className="px-3 py-2 text-[10px] font-mono text-parchment-dim">
                Sin armas registradas.
              </p>
            ) : (
              selectedUnit.weapons.map((w, i) => (
                <WeaponCard
                  key={`${w.name}-${i}`}
                  weapon={w}
                  isSelected={isAttacker && !!selectedWeapon && selectedWeapon.name === w.name && selectedWeapon.line === w.line}
                  onSelect={handleWeaponSelect}
                />
              ))
            )}
          </div>

          {activeModifierIds && onModifierToggle && (
            <ModifierPanel
              rules={visibleRules}
              activeIds={activeModifierIds}
              onToggle={onModifierToggle}
            />
          )}

          <AbilityList
            abilities={selectedUnit.abilities}
            detachmentAbilities={detachmentAbilities}
          />
          <StratList stratagems={applicableStratagems} />
        </>
      )}
    </div>
  )
}
