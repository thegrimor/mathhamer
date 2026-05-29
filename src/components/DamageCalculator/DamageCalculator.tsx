import { useState, useEffect } from 'react'
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
  unitMin?: number
  unitMax?: number
  meltaActive?: boolean
  defenderMin?: number
  defenderMax?: number
  overwatchActive?: boolean
  onOverwatchToggle?: () => void
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

function wKey(w: Weapon): string {
  return `${w.line}:${w.name}`
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

function WeaponBreakdown({ weapon, defenderModel, mods, qty, onQtyChange, blastTargetModels, defenderKeywords, meltaActive }: {
  weapon: Weapon
  defenderModel: ModelProfile
  mods: CombatModifiers
  qty: number
  onQtyChange: (delta: number) => void
  blastTargetModels: number
  defenderKeywords?: string[]
  meltaActive?: boolean
}) {
  const [open, setOpen] = useState(false)
  const effectiveMods = (meltaActive && weapon.isMelta)
    ? { ...mods, damageMod: mods.damageMod + weapon.meltaValue }
    : mods
  const calc = calculateDamage(weapon, defenderModel, effectiveMods, defenderKeywords ?? [], blastTargetModels)
  const total = calc.expectedTotalDamage * qty

  return (
    <div className="border border-rim-bright bg-surface-2">
      <div className="flex items-center gap-2 px-3 py-2 hover:bg-surface-3 transition-colors">
        <button
          onClick={() => setOpen(o => !o)}
          className="flex-1 min-w-0 text-left"
        >
          <span className="text-xs font-mono text-parchment truncate block">{weapon.name}</span>
        </button>
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1">
            <button
              onClick={() => onQtyChange(-1)}
              className="w-5 h-5 border border-rim-bright text-parchment hover:border-gold hover:text-gold font-mono text-xs flex items-center justify-center transition-colors"
            >−</button>
            <span className="text-xs font-mono text-gold-bright w-5 text-center">×{qty}</span>
            <button
              onClick={() => onQtyChange(+1)}
              className="w-5 h-5 border border-rim-bright text-parchment hover:border-gold hover:text-gold font-mono text-xs flex items-center justify-center transition-colors"
            >+</button>
          </div>
          <span className="text-sm font-mono font-bold text-crimson-bright w-12 text-right">{fmt(total)}</span>
          <button onClick={() => setOpen(o => !o)} className="text-parchment-dim text-xs w-4">
            {open ? '▲' : '▼'}
          </button>
        </div>
      </div>
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
          <Row label="Bajas esperadas" value={fmt(calc.expectedKills * qty)} detail={`/${defenderModel.W}H · ×${qty}`} highlight />
        </div>
      )}
    </div>
  )
}

export function DamageCalculator({
  weapons, defenderModel, defenderKeywords = [], attackerName, defenderName, mods, combatType, onCombatTypeChange,
  unitMin, unitMax, defenderMin, defenderMax, meltaActive, overwatchActive = false, onOverwatchToggle,
}: Props) {
  const [weaponQuantities, setWeaponQuantities] = useState<Record<string, number>>({})
  const [defenderModels, setDefenderModels] = useState(defenderMin ?? 1)

  useEffect(() => {
    setDefenderModels(defenderMin ?? 1)
  }, [defenderMin])

  function getQty(w: Weapon): number {
    return weaponQuantities[wKey(w)] ?? (unitMin ?? 1)
  }

  function adjustQty(w: Weapon, delta: number) {
    const current = getQty(w)
    const next = current + delta
    const bounded = Math.max(1, unitMax !== undefined ? Math.min(unitMax, next) : next)
    setWeaponQuantities(prev => ({ ...prev, [wKey(w)]: bounded }))
  }

  // Clean up stale weapon quantities when selection changes
  useEffect(() => {
    setWeaponQuantities(prev => {
      if (Object.keys(prev).length === 0) return prev
      const activeKeys = new Set(weapons.map(wKey))
      const next: Record<string, number> = {}
      for (const [k, v] of Object.entries(prev)) {
        if (activeKeys.has(k)) next[k] = v
      }
      return Object.keys(next).length === Object.keys(prev).length ? prev : next
    })
  }, [weapons])

  const hasBlastWeapons = weapons.some(w => w.isBlast)

  const hasActiveMods =
    mods.hitMod !== 0 || mods.rerollHitsOf1 || mods.rerollAllHits ||
    mods.critThreshold !== 6 || mods.sustainedHitsBonus !== 0 || mods.lethalHitsBonus ||
    mods.strengthMod !== 0 || mods.rerollWoundsOf1 || mods.rerollAllWounds ||
    mods.woundMod !== 0 || mods.apMod !== 0 || mods.saveMod !== 0 ||
    mods.attacksMod !== 0 || mods.rerollDamageOf1 || mods.rerollAllDamage

  const weaponLocked = weapons.length > 0

  const compText = unitMin === undefined ? '' :
    unitMin === unitMax
      ? `${unitMin} modelo${unitMin !== 1 ? 's' : ''}`
      : `${unitMin}–${unitMax} modelos`

  const canOverwatch = combatType === 'ranged'

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

  const breakdowns = weapons.map(w => {
    const wMods = (meltaActive && w.isMelta)
      ? { ...mods, damageMod: mods.damageMod + w.meltaValue }
      : mods
    return calculateDamage(w, defenderModel, wMods, defenderKeywords, defenderModels)
  })
  const totalDamage = breakdowns.reduce((s, b, i) => s + b.expectedTotalDamage * getQty(weapons[i]), 0)
  const totalKills = breakdowns.reduce((s, b, i) => s + b.expectedKills * getQty(weapons[i]), 0)

  const isSingle = weapons.length === 1
  const calc = breakdowns[0]
  const singleQty = getQty(weapons[0])

  return (
    <div className="p-4 flex flex-col gap-4">
      {/* Combat type selector */}
      <CombatTypeSelector combatType={combatType} onChange={onCombatTypeChange} locked={weaponLocked} />

      {/* Overwatch toggle */}
      {canOverwatch && onOverwatchToggle && (
        <div className="flex items-center justify-center">
          <button
            onClick={onOverwatchToggle}
            className={`flex items-center gap-2 px-4 py-1.5 text-xs font-display uppercase tracking-wide border transition-colors ${
              overwatchActive
                ? 'border-crimson bg-crimson/20 text-crimson-bright'
                : 'border-rim-bright text-parchment-dim hover:border-crimson-dim hover:text-parchment'
            }`}
          >
            <span className="text-[10px]">⚡</span>
            Overwatch
            {overwatchActive && <span className="font-mono normal-case tracking-normal text-[9px] text-crimson-bright ml-1">6+</span>}
          </button>
        </div>
      )}

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

      {/* Attacker models / weapon quantity (single weapon) */}
      {isSingle && (
        <div className="flex items-center justify-between bg-surface-3 border border-rim-bright px-3 py-2 rounded-sm">
          <div>
            <span className="text-xs font-display uppercase tracking-wide text-gold">Modelos atacantes</span>
            {compText && (
              <span className="block text-[9px] font-mono text-parchment-dim mt-0.5">
                Composición: {compText}
              </span>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => adjustQty(weapons[0], -1)}
              className="w-8 h-8 border border-rim-bright text-parchment hover:border-gold hover:text-gold font-mono text-lg flex items-center justify-center transition-colors"
            >−</button>
            <span className="text-xl font-mono font-bold text-parchment w-8 text-center">{singleQty}</span>
            <button
              onClick={() => adjustQty(weapons[0], +1)}
              className="w-8 h-8 border border-rim-bright text-parchment hover:border-gold hover:text-gold font-mono text-lg flex items-center justify-center transition-colors"
            >+</button>
          </div>
        </div>
      )}

      {/* Composition info (multi-weapon) */}
      {!isSingle && compText && (
        <div className="flex items-center justify-between bg-surface-3 border border-rim-bright px-3 py-1.5 rounded-sm">
          <span className="text-xs font-display uppercase tracking-wide text-parchment-dim">Composición</span>
          <span className="text-xs font-mono text-gold">{compText}</span>
        </div>
      )}

      {/* Defender models counter */}
      <div className="flex items-center justify-between bg-surface-3 border border-gold/40 px-3 py-2 rounded-sm">
        <div>
          <span className="text-xs font-display uppercase tracking-wide text-gold">Modelos en objetivo</span>
          {defenderMin !== undefined && (
            <span className="block text-[9px] font-mono text-parchment-dim mt-0.5">
              Composición: {defenderMin === defenderMax ? `${defenderMin} modelo${defenderMin !== 1 ? 's' : ''}` : `${defenderMin}–${defenderMax} modelos`}
            </span>
          )}
          {hasBlastWeapons && (
            <span className="block text-[9px] font-mono text-crimson-bright mt-0.5">
              Blast: +{getBlastBonusAttacks(defenderModels)}A extra (+1A cada 5 modelos)
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setDefenderModels(n => Math.max(1, defenderMax !== undefined ? Math.min(defenderMax, n - 1) : n - 1))}
            className="w-8 h-8 border border-gold/40 text-parchment hover:border-gold hover:text-gold font-mono text-lg flex items-center justify-center transition-colors"
          >−</button>
          <span className="text-xl font-mono font-bold text-parchment w-8 text-center">{defenderModels}</span>
          <button
            onClick={() => setDefenderModels(n => defenderMax !== undefined ? Math.min(defenderMax, n + 1) : n + 1)}
            className="w-8 h-8 border border-gold/40 text-parchment hover:border-gold hover:text-gold font-mono text-lg flex items-center justify-center transition-colors"
          >+</button>
        </div>
      </div>

      {/* Big number */}
      <div className="flex flex-col items-center py-2">
        <span className="text-xs font-display uppercase tracking-[3px] text-gold-bright mb-1">
          {isSingle
            ? `Daño esperado · ×${singleQty} modelo${singleQty !== 1 ? 's' : ''}`
            : 'Daño esperado total'
          }
        </span>
        <span
          className="text-6xl font-display font-black text-crimson-bright leading-none"
          style={{ textShadow: '0 0 20px #ff2222, 0 0 50px #c41e1e' }}
        >
          {fmt(totalDamage)}
        </span>
        <span className="text-xs font-mono text-gold mt-2">
          ≈ {fmt(totalKills)} bajas{defenderModels > 1 ? ` de ${defenderModels}` : ''}
        </span>
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
          <Row label="Bajas esperadas" value={fmt(calc.expectedKills * singleQty)} detail={`/${defenderModel.W}H por modelo`} highlight />
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
            <span className="normal-case tracking-normal font-mono text-parchment-dim ml-2 text-[9px]">
              · ajusta ×cantidad por arma
            </span>
          </p>
          {weapons.map((w, i) => (
            <WeaponBreakdown
              key={`${w.name}-${i}`}
              weapon={w}
              defenderModel={defenderModel}
              mods={mods}
              qty={getQty(w)}
              onQtyChange={(delta) => adjustQty(w, delta)}
              blastTargetModels={defenderModels}
              defenderKeywords={defenderKeywords}
              meltaActive={meltaActive}
            />
          ))}
        </div>
      )}

      {/* Overwatch notice */}
      {overwatchActive && (
        <div className="border border-crimson/60 bg-crimson/10 px-3 py-2 text-[10px] font-mono text-crimson-bright leading-relaxed">
          <span className="font-display uppercase tracking-wide">Overwatch activo</span>
          {' '}— impactos a 6+ (tirada sin modificar).
          Las reglas que mejoran Overwatch (ej. Adeptus Astartes 5+) se aplican con el modificador de impacto correspondiente.
          Armas Torrent siguen impactando automáticamente.
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
            {weapons[0].isMelta && meltaActive && ` [Melta ½ dist. +${weapons[0].meltaValue}D]`}
            {mods.attacksMod !== 0 && ` [+${mods.attacksMod}A]`}
            {(mods.rerollDamageOf1 || mods.rerollAllDamage) && ' [RR Daño]'}
            {overwatchActive && ' [Overwatch 6+]'}
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
