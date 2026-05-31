import { useState, useMemo } from 'react'
import { UnitSelector } from '@/components/UnitSelector/UnitSelector'
import { StatsBar } from '@/components/StatsBar/StatsBar'
import { WeaponCard } from '@/components/WeaponCard/WeaponCard'
import { AbilityList } from '@/components/AbilityList/AbilityList'
import { StratList } from '@/components/StratList/StratList'
import { ModifierPanel } from '@/components/ModifierPanel/ModifierPanel'
import { MODIFIER_RULES } from '@/data/modifiers'
import { parseBcpList } from '@/utils/parseBcpList'
import type { GameData, Weapon, ModelProfile, CombatType, Datasheet } from '@/types'
import type { PanelState } from '@/hooks/usePanelState'

function wKey(w: Weapon): string {
  return `${w.line}:${w.name}`
}

interface Props {
  gameData: GameData
  panel: PanelState
  side: 'left' | 'right'
  onWeaponsChange?: (ws: Weapon[]) => void
  onModelChange?: (m: ModelProfile | null) => void
  selectedWeapons?: Weapon[]
  weaponQuantities?: Record<string, number>
  onQuantityChange?: (key: string, qty: number) => void
  combatType?: CombatType
  activeModifierIds?: Set<string>
  onModifierToggle?: (id: string) => void
  weaponAntiKeywords?: string[]
  defenderKeywords?: string[]
  meltaActive?: boolean
  onMeltaToggle?: () => void
}

export function UnitPanel({
  gameData, panel, side, onWeaponsChange, onModelChange, selectedWeapons = [],
  weaponQuantities = {}, onQuantityChange,
  combatType = 'ranged', activeModifierIds, onModifierToggle,
  weaponAntiKeywords = [], defenderKeywords = [],
  meltaActive, onMeltaToggle,
}: Props) {
  const [modelIdx, setModelIdx] = useState(0)
  const [showImport, setShowImport] = useState(false)
  const [importText, setImportText] = useState('')
  const [importError, setImportError] = useState<string | null>(null)
  const { selectedUnit, detachmentAbilities, applicableStratagems } = panel
  const isAttacker = side === 'left'

  function handleImport() {
    const parsed = parseBcpList(importText)
    if (!parsed) { setImportError('Formato no reconocido'); return }

    const faction = gameData.factions.find(
      f => f.name.toLowerCase() === parsed.factionName.toLowerCase()
    )
    if (!faction) { setImportError(`Ejército no encontrado: "${parsed.factionName}"`); return }

    const detachment = gameData.detachments.find(
      d => d.factionId === faction.id &&
           d.name.toLowerCase() === parsed.detachmentName.toLowerCase()
    )

    const matchedIds = parsed.unitNames
      .map(name => gameData.datasheets.find(
        (ds: Datasheet) => ds.factionId === faction.id &&
              ds.name.toLowerCase() === name.toLowerCase()
      ))
      .filter((ds): ds is Datasheet => ds !== undefined)
      .map((ds: Datasheet) => ds.id)

    panel.selectFaction(faction.id)
    if (detachment) panel.selectDetachment(detachment.id)
    panel.setRosterIds(matchedIds)
    setShowImport(false)
    setImportError(null)
    setImportText('')
  }

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

  const anySelectedMelta = selectedWeapons.some(w => w.isMelta)

  const characterDatasheet = useMemo(
    () => panel.selection.characterId
      ? gameData.datasheets.find(ds => ds.id === panel.selection.characterId) ?? null
      : null,
    [gameData.datasheets, panel.selection.characterId],
  )

  const unitMax = selectedUnit?.modelCountMax
  const unitMin = selectedUnit?.modelCountMin

  const defaultWeaponNamesSet = useMemo(
    () => new Set(selectedUnit?.defaultWeaponNames ?? []),
    [selectedUnit],
  )

  function defaultQtyFor(w: Weapon): number {
    return defaultWeaponNamesSet.has(w.name.toLowerCase()) ? (unitMin ?? 1) : 1
  }

  function getQty(w: Weapon): number {
    return weaponQuantities[wKey(w)] ?? defaultQtyFor(w)
  }

  function adjustQty(w: Weapon, delta: number, maxQty: number) {
    if (!onQuantityChange) return
    const current = getQty(w)
    const next = Math.max(1, Math.min(maxQty, current + delta))
    onQuantityChange(wKey(w), next)
  }

  const attackerKeywords = useMemo(
    () => selectedUnit
      ? [...selectedUnit.keywords, ...selectedUnit.factionKeywords].map(k => k.toLowerCase())
      : [],
    [selectedUnit],
  )

  const visibleRules = useMemo(() => {
    const { factionId, detachmentId, datasheetId } = panel.selection
    const defKwLower = defenderKeywords.map(k => k.toLowerCase())
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
      if (rule.requiresAntiKeyword && !weaponAntiKeywords.includes(rule.requiresAntiKeyword)) return false
      if (rule.requiresTargetKeyword && !defKwLower.includes(rule.requiresTargetKeyword.toLowerCase())) return false
      if (rule.requiresAttackerKeyword && !attackerKeywords.includes(rule.requiresAttackerKeyword.toLowerCase())) return false
      if (rule.sourceDatasheetId && panel.rosterIds !== null && !panel.rosterIds.includes(rule.sourceDatasheetId)) return false
      return true
    })
  }, [isAttacker, panel.selection, combatType, anySelectedHeavy, weaponAntiKeywords, defenderKeywords, attackerKeywords])

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

      {/* Importar lista BCP */}
      <div className="border-b border-rim-bright">
        <div className="flex items-center gap-2 px-3 py-1.5">
          <button
            onClick={() => setShowImport(v => !v)}
            className="flex-1 flex items-center justify-between text-[9px] font-display uppercase tracking-widest text-parchment-dim hover:text-parchment transition-colors"
          >
            <span>Lista BCP</span>
            <span>{showImport ? '▴' : '▾'}</span>
          </button>
          {panel.rosterIds !== null && (
            <>
              <span className="text-[8px] font-mono bg-gold/20 text-gold-bright px-1.5 border border-gold/40">
                {panel.rosterIds.length} uds.
              </span>
              <button
                onClick={() => panel.setRosterIds(null)}
                className="text-[9px] font-display uppercase tracking-widest text-parchment-dim hover:text-crimson transition-colors px-1"
              >
                Limpiar
              </button>
            </>
          )}
        </div>
        {showImport && (
          <div className="px-3 pb-3 flex flex-col gap-2">
            <textarea
              value={importText}
              onChange={e => setImportText(e.target.value)}
              placeholder="Pega aquí tu lista BCP..."
              rows={6}
              className="w-full bg-surface-2 border border-rim-bright text-parchment font-mono text-[10px] px-2 py-1.5 outline-none focus:border-gold resize-none"
            />
            {importError && (
              <p className="text-[9px] font-mono text-crimson-bright">{importError}</p>
            )}
            <button
              onClick={handleImport}
              className="self-start px-3 py-1 text-[9px] font-display uppercase tracking-widest border border-gold/50 text-gold hover:bg-gold/10 transition-colors"
            >
              Importar
            </button>
          </div>
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
                selectedUnit.weapons.map((w, i) => {
                  const isSelected = selectedWeapons.some(x => x.name === w.name && x.line === w.line)
                  const maxQty = unitMax ?? 99
                  const qty = getQty(w)
                  return (
                    <div key={`${w.name}-${i}`}>
                      <WeaponCard
                        weapon={w}
                        isSelected={isSelected}
                        onSelect={handleWeaponSelect}
                        heavyModActive={w.isHeavy ? heavyModActive : undefined}
                        onHeavyToggle={w.isHeavy ? handleHeavyToggle : undefined}
                        meltaModActive={w.isMelta && anySelectedMelta ? meltaActive : undefined}
                        onMeltaToggle={w.isMelta ? onMeltaToggle : undefined}
                      />
                      {isSelected && onQuantityChange && (
                        <div className="flex items-center justify-between px-3 py-1.5 bg-surface-3 border-b border-rim-bright">
                          <span className="text-[9px] font-display uppercase tracking-wide text-gold">Atacantes</span>
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => adjustQty(w, -1, maxQty)}
                              className="w-5 h-5 border border-rim-bright text-parchment hover:border-gold hover:text-gold font-mono text-xs flex items-center justify-center transition-colors"
                            >−</button>
                            <span className="text-xs font-mono font-bold text-parchment w-6 text-center">×{qty}</span>
                            <button
                              onClick={() => adjustQty(w, +1, maxQty)}
                              className="w-5 h-5 border border-rim-bright text-parchment hover:border-gold hover:text-gold font-mono text-xs flex items-center justify-center transition-colors"
                            >+</button>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })
              )}

              {/* Character weapons section */}
              {characterDatasheet && characterDatasheet.weapons.length > 0 && (
                <>
                  <div className="px-3 py-2 text-xs font-display uppercase tracking-wide text-crimson border-b border-rim-bright bg-surface-2 mt-1">
                    {characterDatasheet.name}
                    <span className="text-parchment-dim normal-case tracking-normal font-mono ml-2 text-[9px]">
                      personaje adjunto
                    </span>
                  </div>
                  {characterDatasheet.weapons.map((w, i) => {
                    const isSelected = selectedWeapons.some(x => x.name === w.name && x.line === w.line)
                    const qty = getQty(w)
                    return (
                      <div key={`char-${w.name}-${i}`}>
                        <WeaponCard
                          weapon={w}
                          isSelected={isSelected}
                          onSelect={handleWeaponSelect}
                          heavyModActive={w.isHeavy ? heavyModActive : undefined}
                          onHeavyToggle={w.isHeavy ? handleHeavyToggle : undefined}
                          meltaModActive={w.isMelta && anySelectedMelta ? meltaActive : undefined}
                          onMeltaToggle={w.isMelta ? onMeltaToggle : undefined}
                        />
                        {isSelected && onQuantityChange && (
                          <div className="flex items-center justify-between px-3 py-1.5 bg-surface-3 border-b border-rim-bright">
                            <span className="text-[9px] font-display uppercase tracking-wide text-crimson">Atacantes</span>
                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => adjustQty(w, -1, 99)}
                                className="w-5 h-5 border border-rim-bright text-parchment hover:border-crimson hover:text-crimson font-mono text-xs flex items-center justify-center transition-colors"
                              >−</button>
                              <span className="text-xs font-mono font-bold text-parchment w-6 text-center">×{qty}</span>
                              <button
                                onClick={() => adjustQty(w, +1, 99)}
                                className="w-5 h-5 border border-rim-bright text-parchment hover:border-crimson hover:text-crimson font-mono text-xs flex items-center justify-center transition-colors"
                              >+</button>
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </>
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
