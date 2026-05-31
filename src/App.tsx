import { useState, useEffect, useMemo } from 'react'
import { useGameData } from '@/hooks/useGameData'
import { usePanelState } from '@/hooks/usePanelState'
import { useTheme } from '@/hooks/useTheme'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { UnitPanel } from '@/components/UnitPanel/UnitPanel'
import { DamageCalculator } from '@/components/DamageCalculator/DamageCalculator'
import { ThemePicker } from '@/components/ThemePicker/ThemePicker'
import { resolveModifiers } from '@/utils/mathhammer'
import { MODIFIER_RULES } from '@/data/modifiers'
import type { Weapon, ModelProfile, CombatType } from '@/types'

type MobileTab = 'attacker' | 'result' | 'defender'

export default function App() {
  const [currentTheme, setTheme, themes] = useTheme()
  const gameData = useGameData()
  const leftPanel = usePanelState(gameData, 'mathhammer-left-panel')
  const rightPanel = usePanelState(gameData, 'mathhammer-right-panel')

  const [selectedWeapons, setSelectedWeapons] = useState<Weapon[]>([])
  const [weaponQuantities, setWeaponQuantities] = useState<Record<string, number>>({})
  const [defenderModel, setDefenderModel] = useState<ModelProfile | null>(null)
  const [mobileTab, setMobileTab] = useState<MobileTab>('attacker')
  const [combatType, setCombatType] = useLocalStorage<CombatType>('mathhammer-combat-type', 'ranged')
  const [attackerIdsArr, setAttackerIdsArr] = useState<string[]>([])
  const [defenderIdsArr, setDefenderIdsArr] = useState<string[]>([])
  const [meltaActive, setMeltaActive] = useState(false)
  const [overwatchActive, setOverwatchActive] = useState(false)

  function handleQuantityChange(key: string, qty: number) {
    setWeaponQuantities(prev => ({ ...prev, [key]: qty }))
  }

  function handleClearWeapons() {
    setSelectedWeapons([])
    setWeaponQuantities({})
  }

  const attackerActiveIds = useMemo(() => new Set(attackerIdsArr), [attackerIdsArr])
  const defenderActiveIds = useMemo(() => new Set(defenderIdsArr), [defenderIdsArr])

  // Derive combatType from first selected weapon
  useEffect(() => {
    if (selectedWeapons.length > 0) {
      const isRanged = selectedWeapons[0].range !== 'Melee'
      setCombatType(isRanged ? 'ranged' : 'melee')
      if (!isRanged) setOverwatchActive(false)
    }
  }, [selectedWeapons])

  // Save all attacker unit-state together under a per-unit key
  // (datasheetId excluded from deps intentionally — we read it at call time to avoid
  //  saving stale weapons from the previous unit when the key changes)
  useEffect(() => {
    const id = leftPanel.selection.datasheetId
    if (!id) return
    try {
      localStorage.setItem(`mathhammer-attacker-${id}`, JSON.stringify({
        weaponLines: selectedWeapons.map(w => w.line),
        activeModIds: attackerIdsArr,
        meltaActive,
        overwatchActive,
        weaponQuantities,
      }))
    } catch {}
  }, [selectedWeapons, attackerIdsArr, meltaActive, overwatchActive, weaponQuantities]) // eslint-disable-line react-hooks/exhaustive-deps

  // Restore attacker state when the selected unit resolves (page load or unit change)
  useEffect(() => {
    if (!leftPanel.selectedUnit || !leftPanel.selection.datasheetId) return

    function fillMissingQtys(
      qty: Record<string, number>,
      weapons: Weapon[],
    ): Record<string, number> {
      const result = { ...qty }
      const defaultNames = new Set(leftPanel.selectedUnit!.defaultWeaponNames)
      const unitMin = leftPanel.selectedUnit!.modelCountMin
      for (const w of weapons) {
        const key = `${w.line}:${w.name}`
        if (!(key in result)) {
          result[key] = defaultNames.has(w.name.toLowerCase()) ? unitMin : 1
        }
      }
      return result
    }

    try {
      const raw = localStorage.getItem(`mathhammer-attacker-${leftPanel.selection.datasheetId}`)
      if (raw) {
        const saved = JSON.parse(raw)
        const restoredWeapons = leftPanel.selectedUnit.weapons.filter(w => (saved.weaponLines ?? []).includes(w.line))
        setSelectedWeapons(restoredWeapons)
        setAttackerIdsArr(saved.activeModIds ?? [])
        setMeltaActive(saved.meltaActive ?? false)
        setOverwatchActive(saved.overwatchActive ?? false)
        setWeaponQuantities(fillMissingQtys(saved.weaponQuantities ?? {}, restoredWeapons))
      } else {
        setSelectedWeapons([])
        setAttackerIdsArr([])
        setMeltaActive(false)
        setOverwatchActive(false)
        setWeaponQuantities({})
      }
    } catch {
      setSelectedWeapons([])
      setAttackerIdsArr([])
      setMeltaActive(false)
      setOverwatchActive(false)
      setWeaponQuantities({})
    }
  }, [leftPanel.selectedUnit, leftPanel.selection.datasheetId])

  // Save defender modifier IDs per unit
  useEffect(() => {
    const id = rightPanel.selection.datasheetId
    if (!id) return
    try {
      localStorage.setItem(`mathhammer-defender-${id}`, JSON.stringify({ activeModIds: defenderIdsArr }))
    } catch {}
  }, [defenderIdsArr]) // eslint-disable-line react-hooks/exhaustive-deps

  // Restore defender modifier IDs when defender unit resolves
  useEffect(() => {
    if (!rightPanel.selectedUnit || !rightPanel.selection.datasheetId) return
    try {
      const raw = localStorage.getItem(`mathhammer-defender-${rightPanel.selection.datasheetId}`)
      if (raw) {
        const saved = JSON.parse(raw)
        setDefenderIdsArr(saved.activeModIds ?? [])
      } else {
        setDefenderIdsArr([])
      }
    } catch {
      setDefenderIdsArr([])
    }
  }, [rightPanel.selectedUnit, rightPanel.selection.datasheetId])

  function toggleAttackerModifier(id: string) {
    setAttackerIdsArr(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return Array.from(next)
    })
  }

  function toggleDefenderModifier(id: string) {
    setDefenderIdsArr(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return Array.from(next)
    })
  }

  const attackerMods = resolveModifiers(Array.from(attackerActiveIds), MODIFIER_RULES)
  const defenderMods = resolveModifiers(Array.from(defenderActiveIds), MODIFIER_RULES)

  // Merge: defender contributes penalty modifiers into the attacker's calculation
  const mods = {
    ...attackerMods,
    hitMod:              attackerMods.hitMod + defenderMods.hitMod,
    woundMod:            attackerMods.woundMod + defenderMods.woundMod,
    apMod:               attackerMods.apMod + defenderMods.apMod,
    saveMod:             attackerMods.saveMod + defenderMods.saveMod,
    damageReduction:     attackerMods.damageReduction + defenderMods.damageReduction,
    feelNoPainThreshold:
      defenderMods.feelNoPainThreshold !== null
        ? defenderMods.feelNoPainThreshold
        : attackerMods.feelNoPainThreshold,
    overwatchHit: overwatchActive,
  }

  const effectiveDefenderModel = defenderModel ?? rightPanel.selectedUnit?.models[0] ?? null
  const attackerName = leftPanel.selectedUnit?.name ?? ''
  const defenderName = rightPanel.selectedUnit?.name ?? ''

  const defenderKeywords: string[] = rightPanel.selectedUnit
    ? [...rightPanel.selectedUnit.keywords, ...rightPanel.selectedUnit.factionKeywords]
    : []
  const selectedWeaponAntiKeywords: string[] = selectedWeapons.flatMap(w =>
    w.antiEntries.map(e => e.keyword)
  )

  if (gameData.loading) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="scanline" />
        <div className="text-center space-y-3">
          <p
            className="font-display text-sm uppercase tracking-[6px] text-crimson-bright animate-pulse-mech"
            style={{ textShadow: '0 0 10px #ff2222' }}
          >
            Cogitador
          </p>
          <p className="font-display text-[10px] uppercase tracking-[4px] text-gold animate-pulse-mech">
            Cargando registros del Omnissiah...
          </p>
        </div>
      </div>
    )
  }

  if (gameData.error) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-4">
        <div className="border border-crimson p-4 max-w-md">
          <p className="font-display text-xs uppercase tracking-widest text-crimson mb-2">
            Error al cargar datos
          </p>
          <p className="font-mono text-xs text-parchment-dim break-all">{gameData.error}</p>
          <p className="font-mono text-[9px] text-parchment-dim mt-3">
            Asegúrate de que los archivos CSV están en <code>public/data/</code>
          </p>
        </div>
      </div>
    )
  }

  const mobileTabs: { id: MobileTab; label: string }[] = [
    { id: 'attacker', label: 'Atacante' },
    { id: 'result',   label: 'Resultado' },
    { id: 'defender', label: 'Defensor' },
  ]

  return (
    <div className="relative min-h-screen bg-surface text-parchment overflow-x-hidden">
      <div className="scanline" />

      {/* App header */}
      <header className="border-b-2 border-crimson bg-surface-2 px-4 py-2.5 sticky top-0 z-20">
        <div className="flex items-center gap-3">
          <h1
            className="font-display text-sm uppercase tracking-[5px] text-crimson-bright"
            style={{ textShadow: `0 0 10px ${currentTheme.colors.crimsonBright}` }}
          >
            Cogitador
          </h1>
          <span className="font-display text-sm uppercase tracking-[5px] text-gold">Mathhammer</span>
          <span className="font-mono text-[9px] text-parchment-dim uppercase tracking-widest hidden sm:inline">
            WH40K · 10ª Ed.
          </span>
          <ThemePicker
            currentTheme={currentTheme}
            themes={themes}
            onSelect={setTheme}
          />
        </div>
      </header>

      {/* Mobile tab bar */}
      <div className="md:hidden flex border-b border-rim-bright bg-surface-2 sticky top-[45px] z-10">
        {mobileTabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setMobileTab(tab.id)}
            className={`flex-1 py-2 text-[9px] font-display uppercase tracking-widest transition-colors ${
              mobileTab === tab.id
                ? 'text-gold border-b-2 border-gold'
                : 'text-parchment-dim hover:text-parchment'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Mobile content */}
      <div className="md:hidden">
        {mobileTab === 'attacker' && (
          <UnitPanel
            gameData={gameData}
            panel={leftPanel}
            side="left"
            onWeaponsChange={setSelectedWeapons}
            selectedWeapons={selectedWeapons}
            weaponQuantities={weaponQuantities}
            onQuantityChange={handleQuantityChange}
            onClearWeapons={handleClearWeapons}
            combatType={combatType}
            activeModifierIds={attackerActiveIds}
            onModifierToggle={toggleAttackerModifier}
            weaponAntiKeywords={selectedWeaponAntiKeywords}
            defenderKeywords={defenderKeywords}
            meltaActive={meltaActive}
            onMeltaToggle={() => setMeltaActive(v => !v)}
          />
        )}
        {mobileTab === 'result' && (
          <DamageCalculator
            weapons={selectedWeapons}
            weaponQuantities={weaponQuantities}
            defenderModel={effectiveDefenderModel}
            defenderKeywords={defenderKeywords}
            attackerName={attackerName}
            defenderName={defenderName}
            mods={mods}
            combatType={combatType}
            onCombatTypeChange={setCombatType}
            unitMin={leftPanel.selectedUnit?.modelCountMin}
            unitMax={leftPanel.selectedUnit?.modelCountMax}
            meltaActive={meltaActive}
            defenderMin={rightPanel.selectedUnit?.modelCountMin}
            defenderMax={rightPanel.selectedUnit?.modelCountMax}
            overwatchActive={overwatchActive}
            onOverwatchToggle={() => setOverwatchActive(v => !v)}
          />
        )}
        {mobileTab === 'defender' && (
          <UnitPanel
            gameData={gameData}
            panel={rightPanel}
            side="right"
            onModelChange={setDefenderModel}
            combatType={combatType}
            activeModifierIds={defenderActiveIds}
            onModifierToggle={toggleDefenderModifier}
          />
        )}
      </div>

      {/* Desktop 3-column layout */}
      <div className="hidden md:grid md:grid-cols-[1fr_280px_1fr] min-h-[calc(100vh-45px)]">
        <div className="border-r border-rim-bright overflow-y-auto">
          <UnitPanel
            gameData={gameData}
            panel={leftPanel}
            side="left"
            onWeaponsChange={setSelectedWeapons}
            selectedWeapons={selectedWeapons}
            weaponQuantities={weaponQuantities}
            onQuantityChange={handleQuantityChange}
            onClearWeapons={handleClearWeapons}
            combatType={combatType}
            activeModifierIds={attackerActiveIds}
            onModifierToggle={toggleAttackerModifier}
            weaponAntiKeywords={selectedWeaponAntiKeywords}
            defenderKeywords={defenderKeywords}
            meltaActive={meltaActive}
            onMeltaToggle={() => setMeltaActive(v => !v)}
          />
        </div>
        <div className="border-r border-rim-bright overflow-y-auto bg-surface-2 sticky-col">
          <div className="sticky top-[45px] max-h-[calc(100vh-45px)] overflow-y-auto">
            <DamageCalculator
              weapons={selectedWeapons}
              weaponQuantities={weaponQuantities}
              defenderModel={effectiveDefenderModel}
              defenderKeywords={defenderKeywords}
              attackerName={attackerName}
              defenderName={defenderName}
              mods={mods}
              combatType={combatType}
              onCombatTypeChange={setCombatType}
              unitMin={leftPanel.selectedUnit?.modelCountMin}
              unitMax={leftPanel.selectedUnit?.modelCountMax}
              meltaActive={meltaActive}
              defenderMin={rightPanel.selectedUnit?.modelCountMin}
              defenderMax={rightPanel.selectedUnit?.modelCountMax}
              overwatchActive={overwatchActive}
              onOverwatchToggle={() => setOverwatchActive(v => !v)}
            />
          </div>
        </div>
        <div className="overflow-y-auto">
          <UnitPanel
            gameData={gameData}
            panel={rightPanel}
            side="right"
            onModelChange={setDefenderModel}
            combatType={combatType}
            activeModifierIds={defenderActiveIds}
            onModifierToggle={toggleDefenderModifier}
          />
        </div>
      </div>
    </div>
  )
}
