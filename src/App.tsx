import { useState, useEffect } from 'react'
import { useGameData } from '@/hooks/useGameData'
import { usePanelState } from '@/hooks/usePanelState'
import { useTheme } from '@/hooks/useTheme'
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
  const leftPanel = usePanelState(gameData)
  const rightPanel = usePanelState(gameData)

  const [selectedWeapons, setSelectedWeapons] = useState<Weapon[]>([])
  const [defenderModel, setDefenderModel] = useState<ModelProfile | null>(null)
  const [mobileTab, setMobileTab] = useState<MobileTab>('attacker')
  const [combatType, setCombatType] = useState<CombatType>('ranged')
  const [attackerActiveIds, setAttackerActiveIds] = useState<Set<string>>(new Set())
  const [defenderActiveIds, setDefenderActiveIds] = useState<Set<string>>(new Set())
  const [meltaActive, setMeltaActive] = useState(false)

  // Derive combatType from first selected weapon
  useEffect(() => {
    if (selectedWeapons.length > 0) {
      setCombatType(selectedWeapons[0].range === 'Melee' ? 'melee' : 'ranged')
    }
  }, [selectedWeapons])

  // Clear weapon + modifier selections when faction or unit changes
  useEffect(() => {
    setSelectedWeapons([])
    setAttackerActiveIds(new Set())
    setMeltaActive(false)
  }, [leftPanel.selection.factionId, leftPanel.selection.datasheetId])

  useEffect(() => {
    setDefenderActiveIds(new Set())
  }, [rightPanel.selection.factionId, rightPanel.selection.datasheetId])

  function toggleAttackerModifier(id: string) {
    setAttackerActiveIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  function toggleDefenderModifier(id: string) {
    setDefenderActiveIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
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
