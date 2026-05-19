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
    <div className="flex items-baseline justify-between py-1.5 border-b border-rim-bright last:border-0">
      <span className={`text-[8px] font-display uppercase tracking-widest ${highlight ? 'text-crimson-bright' : 'text-gold'}`}>{label}</span>
      <div className="text-right">
        <span className={`text-xs font-mono font-bold ${highlight ? 'text-crimson-bright' : 'text-gold-bright'}`}>{value}</span>
        {detail && <span className="text-[9px] font-mono text-parchment-dim ml-2">{detail}</span>}
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
    <div className="flex items-center justify-center gap-1">
      {(['ranged', 'melee'] as const).map(t => (
        <button
          key={t}
          onClick={() => !locked && onChange(t)}
          disabled={locked}
          className={`px-3 py-0.5 text-[8px] font-display uppercase tracking-widest border transition-colors ${
            combatType === t
              ? 'border-gold bg-gold/20 text-gold-bright'
              : 'border-rim-bright text-parchment-dim hover:border-parchment-dim hover:text-parchment'
          } ${locked ? 'opacity-60 cursor-default' : ''}`}
        >
          {t === 'ranged' ? 'Disparo' : 'CàC'}
        </button>
      ))}
      {locked && <span className="text-[7px] font-mono text-parchment-dim ml-1">⊙ auto</span>}
    </div>
  )
}

export function DamageCalculator({
  weapon, defenderModel, attackerName, defenderName, mods, combatType, onCombatTypeChange,
}: Props) {
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
        <p className="text-crimson-dim font-display text-[10px] uppercase tracking-[4px] text-center leading-loose">
          {!weapon ? '// selecciona arma\ndel atacante' : '// selecciona\ndefensor'}
        </p>
        <div className="w-px h-12 bg-gradient-to-b from-crimson-dim via-transparent to-transparent" />
      </div>
    )
  }

  const calc = calculateDamage(weapon, defenderModel, mods)

  return (
    <div className="p-4 flex flex-col gap-4">
      {/* Combat type selector */}
      <CombatTypeSelector combatType={combatType} onChange={onCombatTypeChange} locked={weaponLocked} />

      {/* Header */}
      <div className="text-center border-b border-rim-bright pb-3">
        <p className="text-[8px] font-mono text-parchment-dim uppercase tracking-widest">
          <span className="text-crimson">{attackerName || '—'}</span>
          <span className="mx-2 text-rim-bright">▶</span>
          <span className="text-gold">{defenderName || '—'}</span>
        </p>
        <p className="text-[9px] font-display uppercase tracking-widest text-parchment mt-1">
          {weapon.name}
        </p>
      </div>

      {/* Big number */}
      <div className="flex flex-col items-center py-2">
        <span className="text-[8px] font-display uppercase tracking-[3px] text-gold-bright mb-1">
          Daño esperado
        </span>
        <span
          className="text-6xl font-display font-black text-crimson-bright"
          style={{ textShadow: '0 0 20px #ff2222, 0 0 50px #c41e1e' }}
        >
          {fmt(calc.expectedTotalDamage)}
        </span>
        <span className="text-[8px] font-mono text-parchment-dim mt-1">por modelo atacante</span>
        {hasActiveMods && (
          <span className="text-[7px] font-mono text-gold mt-0.5 uppercase tracking-wider">
            con modificadores
          </span>
        )}
      </div>

      {/* Breakdown */}
      <div className="border border-rim-bright bg-surface-2 p-3">
        <p className="text-[8px] font-display uppercase tracking-widest text-gold-bright mb-2">
          Desglose
        </p>
        <Row label="Ataques" value={fmt(calc.avgAttacks)} />
        <Row
          label="Impactos"
          value={fmt(calc.expectedHits)}
          detail={`${fmt(calc.avgAttacks)} × ${pct(calc.hitProbability)}`}
        />
        {calc.sustainedExtraHits > 0 && (
          <Row
            label="↳ Impactos extra (Sustained)"
            value={`+${fmt(calc.sustainedExtraHits)}`}
            highlight
          />
        )}
        {calc.autoWoundsFromCrits > 0 && (
          <Row
            label="↳ Heridas auto (Lethal Hits)"
            value={`+${fmt(calc.autoWoundsFromCrits)}`}
            highlight
          />
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
        <Row
          label="Daño/herida"
          value={fmt(calc.avgDamagePerWound)}
          detail={weapon.D}
        />
      </div>

      {/* Context */}
      <div className="text-[8px] font-mono text-parchment-dim border border-rim-bright p-2 space-y-0.5 leading-relaxed">
        <p>
          <span className="text-gold">Atacante</span>
          {' '}— F:{weapon.S}{mods.strengthMod !== 0 || mods.woundMod !== 0
            ? `(ef.${weapon.S + mods.strengthMod + mods.woundMod})`
            : ''}
          {' '}AP:{weapon.AP}{mods.apMod !== 0 ? `(ef.${weapon.AP - mods.apMod})` : ''}
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
          <p className="text-rim-bright">* Se aplica la mejor salvación disponible.</p>
        )}
      </div>
    </div>
  )
}
