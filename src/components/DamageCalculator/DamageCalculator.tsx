import { useState } from 'react'
import { calculateDamage, getBlastBonusAttacks } from '@/utils/mathhammer'
import type { Weapon, ModelProfile, CombatModifiers, CombatType } from '@/types'

interface Props {
  weapons: Weapon[]
  defenderModel: ModelProfile | null
  defenderKeywords?: string[]
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

function WeaponBreakdown({ weapon, defenderModel, mods, numModels, blastTargetModels, defenderKeywords }: {
  weapon: Weapon
  defenderModel: ModelProfile
  mods: CombatModifiers
  numModels: number
  blastTargetModels: number
  defenderKeywords?: string[]
}) {
  const [open, setOpen] = useState(false)
  const calc = calculateDamage(weapon, defenderModel, mods, defenderKeywords ?? [], blastTargetModels)
  const total = calc.expectedTotalDamage * numModels

  return (
    <div className="border border-rim-bright bg-surface-2">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-3 py-2 hover:bg-surface-3 transition-colors"
      >
        <span className="text-xs font-mono text-parchment truncate">{weapon.name}</span>
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-sm font-mono font-bold text-crimson-bright">{fmt(total)}</span>
          <span className="text-parchment-dim text-xs">{open ? '▲' : '▼'}</span>
        </div>
      </button>
      {open && (
        <div className="px-3 py-2 border-t border-rim-bright">
          {calc.blastBonusAttacks != null && (
            <Row label="↳ Blast bonus" value={`+${calc.blastBonusAttacks}A`} highlight />
          )}
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
          {calc.antiCritWounds > 0 && (
            <Row label="↳ Crit herida (ANTI)" value={`${fmt(calc.antiCritWounds)}`} highlight />
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
          <Row label="Bajas esperadas" value={fmt(calc.expectedKills)} detail={`/${defenderModel.W}H`} />
        </div>
      )}
    </div>
  )
}

export function DamageCalculator({
  weapons, defenderModel, defenderKeywords = [], attackerName, defenderName, mods, combatType, onCombatTypeChange,
}: Props) {
  const [numModels, setNumModels] = useState(1)
  const [blastTargetModels, setBlastTargetModels] = useState(1)

  const hasBlastWeapons = weapons.some(w => w.isBlast)

  const hasActiveMods =
    mods.hitMod !== 0 || mods.rerollHitsOf1 || mods.rerollAllHits ||
    mods.critThreshold !== 6 || mods.sustainedHitsBonus !== 0 || mods.lethalHitsBonus ||
    mods.strengthMod !== 0 || mods.rerollWoundsOf1 || mods.rerollAllWounds ||
    mods.woundMod !== 0 || mods.apMod !== 0 || mods.saveMod !== 0 ||
    mods.attacksMod !== 0 || mods.rerollDamageOf1 || mods.rerollAllDamage

  const weaponLocked = weapons.length > 0

  if (weapons.length === 0 || !defenderModel) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] p-6 gap-4">
        <div className="w-px h-12 bg-gradient-to-b from-transparent via-crimson-dim to-transparent" />
        <CombatTypeSelector combatType={combatType} onChange={onCombatTypeChange} locked={weaponLocked} />
        <p className="text-crimson-dim font-display text-xs uppercase tracking-[4px] text-center leading-loose">
          {weapons.length === 0 ? '// selecciona arma\ndel atacante' : '// selecciona\ndefensor'}
        </p>
        <div className="w-px h-12 bg-gradient-to-b from-crimson-dim via-transparent to-transparent" />
      </div>
    )
  }

  const breakdowns = weapons.map(w => calculateDamage(w, defenderModel, mods, defenderKeywords, blastTargetModels))
  const totalDamagePerModel = breakdowns.reduce((s, b) => s + b.expectedTotalDamage, 0)
  const totalDamage = totalDamagePerModel * numModels
  const totalKills = breakdowns.reduce((s, b) => s + b.expectedKills, 0) * numModels

  // Combined stats for single-weapon display
  const isSingle = weapons.length === 1
  const calc = breakdowns[0]

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
          {isSingle ? weapons[0].name : `${weapons.length} armas`}
        </p>
      </div>

      {/* Attacker models input */}
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

      {/* Blast target models input */}
      {hasBlastWeapons && (
        <div className="flex items-center justify-between bg-surface-3 border border-crimson/40 px-3 py-2 rounded-sm">
          <div>
            <span className="text-xs font-display uppercase tracking-wide text-crimson-bright">
              Modelos en objetivo
            </span>
            <span className="block text-[9px] font-mono text-parchment-dim mt-0.5">
              Blast: +{getBlastBonusAttacks(blastTargetModels)}A extra (+1A cada 5 modelos)
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setBlastTargetModels(n => Math.max(1, n - 1))}
              className="w-8 h-8 border border-crimson/40 text-parchment hover:border-crimson hover:text-crimson font-mono text-lg flex items-center justify-center transition-colors"
            >−</button>
            <span className="text-xl font-mono font-bold text-parchment w-8 text-center">{blastTargetModels}</span>
            <button
              onClick={() => setBlastTargetModels(n => n + 1)}
              className="w-8 h-8 border border-crimson/40 text-parchment hover:border-crimson hover:text-crimson font-mono text-lg flex items-center justify-center transition-colors"
            >+</button>
          </div>
        </div>
      )}

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
        <span className="text-xs font-mono text-gold mt-2">
          ≈ {fmt(totalKills)} bajas
        </span>
        {numModels > 1 && (
          <span className="text-xs font-mono text-parchment-dim mt-1">
            {fmt(totalDamagePerModel)} daño por modelo
          </span>
        )}
        {hasActiveMods && (
          <span className="text-xs font-mono text-gold mt-1 uppercase tracking-wider">
            con modificadores
          </span>
        )}
      </div>

      {/* Single weapon breakdown */}
      {isSingle && (
        <div className="border border-rim-bright bg-surface-2 px-3 py-2">
          <p className="text-xs font-display uppercase tracking-wide text-gold-bright mb-1">
            Desglose
          </p>
          {calc.blastBonusAttacks != null && (
            <Row label="↳ Blast bonus" value={`+${calc.blastBonusAttacks}A`} highlight />
          )}
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
          {calc.antiCritWounds > 0 && (
            <Row label="↳ Crit herida (ANTI)" value={`${fmt(calc.antiCritWounds)}`} highlight />
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
          <Row label="Daño/herida" value={fmt(calc.avgDamagePerWound)} detail={weapons[0].D} />
          <Row label="Bajas esperadas" value={fmt(calc.expectedKills * numModels)} detail={`/${defenderModel.W}H por modelo`} highlight />
          {calc.autoWoundsFromCrits > 0 && calc.expectedWounds > 0 && (
            <Row
              label="Contribución críticos"
              value={pct(calc.autoWoundsFromCrits / calc.expectedWounds)}
              detail="heridas auto / total"
            />
          )}
        </div>
      )}

      {/* Multi-weapon breakdown */}
      {!isSingle && (
        <div className="flex flex-col gap-2">
          <p className="text-xs font-display uppercase tracking-wide text-gold-bright">
            Desglose por arma
          </p>
          {weapons.map((w, i) => (
            <WeaponBreakdown
              key={`${w.name}-${i}`}
              weapon={w}
              defenderModel={defenderModel}
              mods={mods}
              numModels={numModels}
              blastTargetModels={blastTargetModels}
              defenderKeywords={defenderKeywords}
            />
          ))}
        </div>
      )}

      {/* Context */}
      <div className="text-xs font-mono text-parchment-dim border border-rim-bright p-3 space-y-1 leading-relaxed">
        {isSingle && (
          <p>
            <span className="text-gold">Atacante</span>
            {' '}— F:{weapons[0].S}
            {mods.strengthMod !== 0 || mods.woundMod !== 0
              ? ` (ef.${weapons[0].S + mods.strengthMod + mods.woundMod})`
              : ''}
            {' '}AP:{weapons[0].AP}
            {(mods.apMod !== 0 || mods.saveMod !== 0)
              ? ` (PA ef.${calc.effectiveAP})`
              : ''}
            {weapons[0].isTorrent && ' [Torrent]'}
            {(weapons[0].isLethalHits || mods.lethalHitsBonus) && ' [Lethal Hits]'}
            {(weapons[0].sustainedHitsValue + mods.sustainedHitsBonus) > 0
              && ` [Sustained ${weapons[0].sustainedHitsValue + mods.sustainedHitsBonus}]`}
            {weapons[0].isHeavy && ' [Heavy]'}
            {mods.attacksMod !== 0 && ` [+${mods.attacksMod}A]`}
            {(mods.rerollDamageOf1 || mods.rerollAllDamage) && ' [RR Daño]'}
          </p>
        )}
        <p>
          <span className="text-gold">Defensor</span> — T:{defenderModel.T}
          {' '}Sv:{defenderModel.Sv}
          {defenderModel.invSv && ` Inv:${defenderModel.invSv}`}
          {mods.saveMod < 0 && ' [Cobertura]'}
          {mods.feelNoPainThreshold !== null && ` FNP:${mods.feelNoPainThreshold}+`}
        </p>
        {defenderModel.invSv && (
          <p className="text-parchment-dim/60">* Se aplica la mejor salvación disponible.</p>
        )}
      </div>
    </div>
  )
}
