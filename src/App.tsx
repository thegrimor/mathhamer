import { useState, useEffect } from 'react'
import { useGameData } from '@/hooks/useGameData'
import { usePanelState } from '@/hooks/usePanelState'
import { UnitPanel } from '@/components/UnitPanel/UnitPanel'
import { DamageCalculator } from '@/components/DamageCalculator/DamageCalculator'
import { resolveModifiers } from '@/utils/mathhammer'
import type { Weapon, ModelProfile, CombatType } from '@/types'

type MobileTab = 'attacker' | 'result' | 'defender'

export default function App() {
  const gameData = useGameData()
  const leftPanel = usePanelState(gameData)
  const rightPanel = usePanelState(gameData)

  const [selectedWeapon, setSelectedWeapon] = useState<Weapon | null>(null)
  const [defenderModel, setDefenderModel] = useState<ModelProfile | null>(null)
  const [mobileTab, setMobileTab] = useState<MobileTab>('attacker')
  const [combatType, setCombatType] = useState<CombatType>('ranged')
  const [attackerActiveIds, setAttackerActiveIds] = useState<Set<string>>(new Set())
  const [defenderActiveIds, setDefenderActiveIds] = useState<Set<string>>(new Set())

  // Derive combatType from selected weapon
  useEffect(() => {
    if (selectedWeapon) {
      setCombatType(selectedWeapon.range === 'Melee' ? 'melee' : 'ranged')
    }
  }, [selectedWeapon])

  // Clear modifier selections when faction changes
  useEffect(() => {
    setAttackerActiveIds(new Set())
  }, [leftPanel.selection.factionId])

  useEffect(() => {
    setDefenderActiveIds(new Set())
  }, [rightPanel.selection.factionId])

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

  const attackerMods = resolveModifiers(
    attackerActiveIds,
    selectedWeapon,
    leftPanel.selection.factionId,
    leftPanel.selection.detachmentId,
  )
  const defenderMods = resolveModifiers(
    defenderActiveIds,
    null,
    rightPanel.selection.factionId,
    rightPanel.selection.detachmentId,
  )

  // Merge: defender contributes saveMod (e.g. cover) into the final modifier set
  const mods = {
    ...attackerMods,
    saveMod: attackerMods.saveMod + defenderMods.saveMod,
  }

  const effectiveDefenderModel = defenderModel ?? rightPanel.selectedUnit?.models[0] ?? null
  const attackerName = leftPanel.selectedUnit?.name ?? ''
  const defenderName = rightPanel.selectedUnit?.name ?? ''

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
        <div className="flex items-baseline gap-3">
          <h1
            className="font-display text-sm uppercase tracking-[5px] text-crimson-bright"
            style={{ textShadow: '0 0 10px #ff2222' }}
          >
            Cogitador
          </h1>
          <span className="font-display text-sm uppercase tracking-[5px] text-gold">Mathhammer</span>
          <span className="font-mono text-[9px] text-parchment-dim uppercase tracking-widest hidden sm:inline">
            WH40K · 10ª Ed.
          </span>
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
            onWeaponChange={setSelectedWeapon}
            selectedWeapon={selectedWeapon}
            combatType={combatType}
            activeModifierIds={attackerActiveIds}
            onModifierToggle={toggleAttackerModifier}
          />
        )}
        {mobileTab === 'result' && (
          <DamageCalculator
            weapon={selectedWeapon}
            defenderModel={effectiveDefenderModel}
            attackerName={attackerName}
            defenderName={defenderName}
            mods={mods}
            combatType={combatType}
            onCombatTypeChange={setCombatType}
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
            onWeaponChange={setSelectedWeapon}
            selectedWeapon={selectedWeapon}
            combatType={combatType}
            activeModifierIds={attackerActiveIds}
            onModifierToggle={toggleAttackerModifier}
          />
        </div>
        <div className="border-r border-rim-bright overflow-y-auto bg-surface-2 sticky-col">
          <div className="sticky top-[45px] max-h-[calc(100vh-45px)] overflow-y-auto">
            <DamageCalculator
              weapon={selectedWeapon}
              defenderModel={effectiveDefenderModel}
              attackerName={attackerName}
              defenderName={defenderName}
              mods={mods}
              combatType={combatType}
              onCombatTypeChange={setCombatType}
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
