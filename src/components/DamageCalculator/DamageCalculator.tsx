import { useState } from 'react'
import { calculateDamage } from '@/utils/mathhammer'
import type { Weapon, ModelProfile, CombatModifiers, CombatType } from '@/types'

interface Props {
  weapon: Weapon | null
  defenderModel: ModelProfile | null
  attackerName: string
  defenderName: string
  mods: CombatModifiers
  combatType: CombatType
  onCombatTypeChange: (t: CombatType) => void
}

function Row({ label, value, detail, highlight }: { label: string; value: string; detail?: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-rim-bright last:border-0 gap-2">
      <span className={`text-xs font-display uppercase tracking-wide shrink-0 ${highlight ? 'text-crimson-bright' : 'text-gold'}`}>
        {label}
      </span>
      <div className="text-right">
        <span className={`text-sm font-mono font-bold ${highlight ? 'text-crimson-bright' : 'text-parchment'}`}>{value}</span>
        {detail && <span className="text-xs font-mono text-parchment-dim ml-2">{detail}</span>}
      </div>
    </div>
  )
}

function pct(n: number): string {
  return `${(n * 100).toFixed(0)}%`
}

function fmt(n: number): string {
  return n.toFixed(2)
}

function CombatTypeSelector({
  combatType, onChange, locked,
}: {
  combatType: CombatType
  onChange: (t: CombatType) => void
  locked: boolean
}) {
  return (
    <div className="flex items-center justify-center gap-2">
      {(['ranged', 'melee'] as const).map(t => (
        <button
          key={t}
          onClick={() => !locked && onChange(t)}
          disabled={locked}
          className={`px-4 py-1 text-xs font-display uppercase tracking-wide border transition-colors ${
            combatType === t
              ? 'border-gold bg-gold/20 text-gold-bright'
              : 'border-rim-bright text-parchment-dim hover:border-parchment-dim hover:text-parchment'
          } ${locked ? 'opacity-60 cursor-default' : ''}`}
        >
          {t === 'ranged' ? 'Disparo' : 'CàC'}
        </button>
      ))}
      {locked && <span className="text-xs font-mono text-parchment-dim ml-1">⊙ auto</span>}
    </div>
  )
}

export function DamageCalculator({
  weapon, defenderModel, attackerName, defenderName, mods, combatType, onCombatTypeChange,
}: Props) {
  const [numModels, setNumModels] = useState(1)

  const hasActiveMods =
    mods.hitMod !== 0 || mods.rerollHitsOf1 || mods.rerollAllHits ||
    mods.critThreshold !== 6 || mods.sustainedHitsBonus !== 0 || mods.lethalHitsBonus ||
    mods.strengthMod !== 0 || mods.rerollWoundsOf1 || mods.rerollAllWounds ||
    mods.woundMod !== 0 || mods.apMod !== 0 || mods.saveMod !== 0

  const weaponLocked = !!weapon

  if (!weapon || !defenderModel) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] p-6 gap-4">
        <div className="w-px h-12 bg-gradient-to-b from-transparent via-crimson-dim to-transparent" />
        <CombatTypeSelector combatType={combatType} onChange={onCombatTypeChange} locked={weaponLocked} />
        <p className="text-crimson-dim font-display text-xs uppercase tracking-[4px] text-center leading-loose">
          {!weapon ? '// selecciona arma\ndel atacante' : '// selecciona\ndefensor'}
        </p>
        <div className="w-px h-12 bg-gradient-to-b from-crimson-dim via-transparent to-transparent" />
      </div>
    )
  }

  const calc = calculateDamage(weapon, defenderModel, mods)
  const totalDamage = calc.expectedTotalDamage * numModels

  return (
    <div className="p-4 flex flex-col gap-4">
      {/* Combat type selector */}
      <CombatTypeSelector combatType={combatType} onChange={onCombatTypeChange} locked={weaponLocked} />

      {/* Header */}
      <div className="text-center border-b border-rim-bright pb-3">
        <p className="text-xs font-mono text-parchment-dim">
          <span className="text-crimson">{attackerName || '—'}</span>
          <span className="mx-2 text-rim-bright">▶</span>
          <span className="text-gold">{defenderName || '—'}</span>
        </p>
        <p className="text-sm font-display uppercase tracking-wide text-parchment mt-1">
          {weapon.name}
        </p>
      </div>

      {/* Models input */}
      <div className="flex items-center justify-between bg-surface-3 border border-rim-bright px-3 py-2 rounded-sm">
        <span className="text-xs font-display uppercase tracking-wide text-gold">Modelos atacantes</span>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setNumModels(n => Math.max(1, n - 1))}
            className="w-8 h-8 border border-rim-bright text-parchment hover:border-gold hover:text-gold font-mono text-lg flex items-center justify-center transition-colors"
          >−</button>
          <span className="text-xl font-mono font-bold text-parchment w-8 text-center">{numModels}</span>
          <button
            onClick={() => setNumModels(n => n + 1)}
            className="w-8 h-8 border border-rim-bright text-parchment hover:border-gold hover:text-gold font-mono text-lg flex items-center justify-center transition-colors"
          >+</button>
        </div>
      </div>

      {/* Big number */}
      <div className="flex flex-col items-center py-2">
        <span className="text-xs font-display uppercase tracking-[3px] text-gold-bright mb-1">
          Daño esperado{numModels > 1 ? ` · ×${numModels} modelos` : ''}
        </span>
        <span
          className="text-6xl font-display font-black text-crimson-bright leading-none"
          style={{ textShadow: '0 0 20px #ff2222, 0 0 50px #c41e1e' }}
        >
          {fmt(totalDamage)}
        </span>
        {numModels > 1 && (
          <span className="text-xs font-mono text-parchment-dim mt-2">
            {fmt(calc.expectedTotalDamage)} por modelo
          </span>
        )}
        {hasActiveMods && (
          <span className="text-xs font-mono text-gold mt-1 uppercase tracking-wider">
            con modificadores
          </span>
        )}
      </div>

      {/* Breakdown */}
      <div className="border border-rim-bright bg-surface-2 px-3 py-2">
        <p className="text-xs font-display uppercase tracking-wide text-gold-bright mb-1">
          Desglose
        </p>
        <Row label="Ataques" value={fmt(calc.avgAttacks)} />
        <Row
          label="Impactos"
          value={fmt(calc.expectedHits)}
          detail={`${fmt(calc.avgAttacks)} × ${pct(calc.hitProbability)}`}
        />
        {calc.sustainedExtraHits > 0 && (
          <Row label="↳ Extra (Sustained)" value={`+${fmt(calc.sustainedExtraHits)}`} highlight />
        )}
        {calc.autoWoundsFromCrits > 0 && (
          <Row label="↳ Auto (Lethal Hits)" value={`+${fmt(calc.autoWoundsFromCrits)}`} highlight />
        )}
        <Row
          label="Heridas"
          value={fmt(calc.expectedWounds)}
          detail={calc.autoWoundsFromCrits > 0
            ? `+${fmt(calc.autoWoundsFromCrits)} auto`
            : `${fmt(calc.expectedHits)} × ${pct(calc.woundProbability)}`}
        />
        <Row
          label="Salv. fallidas"
          value={fmt(calc.expectedFailedSaves)}
          detail={`${fmt(calc.expectedWounds)} × ${pct(calc.saveFailProbability)}`}
        />
        <Row label="Daño/herida" value={fmt(calc.avgDamagePerWound)} detail={weapon.D} />
      </div>

      {/* Context */}
      <div className="text-xs font-mono text-parchment-dim border border-rim-bright p-3 space-y-1 leading-relaxed">
        <p>
          <span className="text-gold">Atacante</span>
          {' '}— F:{weapon.S}
          {mods.strengthMod !== 0 || mods.woundMod !== 0
            ? ` (ef.${weapon.S + mods.strengthMod + mods.woundMod})`
            : ''}
          {' '}AP:{weapon.AP}
          {(mods.apMod !== 0 || mods.saveMod !== 0)
            ? ` (ef.${Math.min(0, weapon.AP - mods.apMod) - mods.saveMod})`
            : ''}
          {weapon.isTorrent && ' [Torrent]'}
          {(weapon.isLethalHits || mods.lethalHitsBonus) && ' [Lethal Hits]'}
          {(weapon.sustainedHitsValue + mods.sustainedHitsBonus) > 0
            && ` [Sustained ${weapon.sustainedHitsValue + mods.sustainedHitsBonus}]`}
          {weapon.isHeavy && ' [Heavy]'}
        </p>
        <p>
          <span className="text-gold">Defensor</span> — T:{defenderModel.T}
          {' '}Sv:{defenderModel.Sv}
          {defenderModel.invSv && ` Inv:${defenderModel.invSv}`}
          {mods.saveMod < 0 && ' [Cobertura]'}
        </p>
        {defenderModel.invSv && (
          <p className="text-parchment-dim/60">* Se aplica la mejor salvación disponible.</p>
        )}
      </div>
    </div>
  )
}
