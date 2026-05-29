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
  onWeaponsChange?: (ws: Weapon[]) => void
  onModelChange?: (m: ModelProfile | null) => void
  selectedWeapons?: Weapon[]
  combatType?: CombatType
  activeModifierIds?: Set<string>
  onModifierToggle?: (id: string) => void
}

export function UnitPanel({
  gameData, panel, side, onWeaponsChange, onModelChange, selectedWeapons = [],
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
    if (!isAttacker || !onWeaponsChange) return
    const exists = selectedWeapons.some(x => x.name === w.name && x.line === w.line)
    onWeaponsChange(
      exists
        ? selectedWeapons.filter(x => !(x.name === w.name && x.line === w.line))
        : [...selectedWeapons, w],
    )
  }

  const anySelectedHeavy = selectedWeapons.some(w => w.isHeavy)
  const heavyModActive = activeModifierIds?.has('weapon_heavy') ?? false

  function handleHeavyToggle() {
    onModifierToggle?.('weapon_heavy')
  }

  const visibleRules = useMemo(() => {
    const { factionId, detachmentId, datasheetId } = panel.selection
    return MODIFIER_RULES.filter(rule => {
      const ruleTarget = rule.target ?? 'attacker'
      if (isAttacker && ruleTarget === 'defender') return false
      if (!isAttacker && ruleTarget === 'attacker') return false
      if (rule.factionId && rule.factionId !== factionId) return false
      if (rule.detachmentId && rule.detachmentId !== detachmentId) return false
      if (rule.datasheetId && rule.datasheetId !== datasheetId) return false
      if (rule.leaderDatasheetId && rule.leaderDatasheetId !== panel.selection.characterId) return false
      if (rule.combatType && rule.combatType !== combatType) return false
      if (rule.id === 'weapon_heavy' && !anySelectedHeavy) return false
      return true
    })
  }, [isAttacker, panel.selection, combatType, anySelectedHeavy])

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

          {/* Weapons section — attacker only */}
          {isAttacker && (
            <div>
              <div className="px-3 py-2 text-xs font-display uppercase tracking-wide text-gold border-b border-rim-bright bg-surface-2">
                Armamento
                <span className="text-parchment-dim normal-case tracking-normal font-mono ml-2">
                  (multiselección permitida)
                </span>
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
                    isSelected={selectedWeapons.some(x => x.name === w.name && x.line === w.line)}
                    onSelect={handleWeaponSelect}
                    heavyModActive={w.isHeavy ? heavyModActive : undefined}
                    onHeavyToggle={w.isHeavy ? handleHeavyToggle : undefined}
                  />
                ))
              )}
            </div>
          )}

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
            relatedRules={visibleRules}
            activeModifierIds={activeModifierIds}
            onModifierToggle={onModifierToggle}
          />
          <StratList stratagems={applicableStratagems} />
        </>
      )}
    </div>
  )
}
