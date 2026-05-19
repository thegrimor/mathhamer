import { calculateDamage } from '@/utils/mathhammer'
import type { Weapon, ModelProfile, CombatModifiers } from '@/types'

interface Props {
  weapon: Weapon | null
  defenderModel: ModelProfile | null
  attackerName: string
  defenderName: string
  mods: CombatModifiers
  onModsChange: (m: CombatModifiers) => void
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

function ToggleBtn({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-2 py-0.5 text-[8px] font-display uppercase tracking-wider border transition-colors ${
        active
          ? 'border-gold bg-gold/20 text-gold-bright'
          : 'border-rim-bright text-parchment-dim hover:border-parchment-dim hover:text-parchment'
      }`}
    >
      {children}
    </button>
  )
}

function pct(n: number): string {
  return `${(n * 100).toFixed(0)}%`
}

function fmt(n: number): string {
  return n.toFixed(2)
}

export function DamageCalculator({ weapon, defenderModel, attackerName, defenderName, mods, onModsChange }: Props) {
  function setHitMod(delta: number) {
    const next = Math.max(-2, Math.min(2, mods.hitMod + delta))
    onModsChange({ ...mods, hitMod: next })
  }

  function toggleRerollOf1() {
    onModsChange({ ...mods, rerollHitsOf1: !mods.rerollHitsOf1, rerollAllHits: false })
  }

  function toggleRerollAll() {
    onModsChange({ ...mods, rerollAllHits: !mods.rerollAllHits, rerollHitsOf1: false })
  }

  const hasModifiers = mods.hitMod !== 0 || mods.rerollHitsOf1 || mods.rerollAllHits

  if (!weapon || !defenderModel) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] p-6 gap-4">
        <div className="w-px h-16 bg-gradient-to-b from-transparent via-crimson-dim to-transparent" />
        <p className="text-crimson-dim font-display text-[10px] uppercase tracking-[4px] text-center leading-loose">
          {!weapon ? '// selecciona arma\ndel atacante' : '// selecciona\ndefensor'}
        </p>
        <div className="w-px h-16 bg-gradient-to-b from-crimson-dim via-transparent to-transparent" />
        {/* Modifiers always visible */}
        <div className="w-full mt-2 border border-rim-bright bg-surface-2 p-3">
          <p className="text-[8px] font-display uppercase tracking-widest text-gold-bright mb-2">Modificadores</p>
          <ModifierControls
            mods={mods}
            onHitMod={setHitMod}
            onToggleRerollOf1={toggleRerollOf1}
            onToggleRerollAll={toggleRerollAll}
          />
        </div>
      </div>
    )
  }

  const calc = calculateDamage(weapon, defenderModel, mods)

  return (
    <div className="p-4 flex flex-col gap-4">
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
        {hasModifiers && (
          <span className="text-[7px] font-mono text-gold mt-0.5 uppercase tracking-wider">
            con modificadores
          </span>
        )}
      </div>

      {/* Modifiers */}
      <div className="border border-rim-bright bg-surface-2 p-3">
        <p className="text-[8px] font-display uppercase tracking-widest text-gold-bright mb-2">Modificadores</p>
        <ModifierControls
          mods={mods}
          onHitMod={setHitMod}
          onToggleRerollOf1={toggleRerollOf1}
          onToggleRerollAll={toggleRerollAll}
        />
      </div>

      {/* Breakdown */}
      <div className="border border-rim-bright bg-surface-2 p-3">
        <p className="text-[8px] font-display uppercase tracking-widest text-gold-bright mb-2">
          Desglose
        </p>
        <Row
          label="Ataques"
          value={fmt(calc.avgAttacks)}
        />
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
          <span className="text-gold">Atacante</span> — F:{weapon.S} AP:{weapon.AP}
          {weapon.isTorrent && ' [Torrent]'}
          {weapon.isLethalHits && ' [Lethal Hits]'}
          {weapon.sustainedHitsValue > 0 && ` [Sustained ${weapon.sustainedHitsValue}]`}
        </p>
        <p>
          <span className="text-gold">Defensor</span> — T:{defenderModel.T}
          {' '}Sv:{defenderModel.Sv}
          {defenderModel.invSv && ` Inv:${defenderModel.invSv}`}
        </p>
        {defenderModel.invSv && (
          <p className="text-rim-bright">* Se aplica la mejor salvación disponible.</p>
        )}
      </div>
    </div>
  )
}

function ModifierControls({
  mods,
  onHitMod,
  onToggleRerollOf1,
  onToggleRerollAll,
}: {
  mods: CombatModifiers
  onHitMod: (delta: number) => void
  onToggleRerollOf1: () => void
  onToggleRerollAll: () => void
}) {
  return (
    <div className="flex flex-col gap-2">
      {/* Hit modifier */}
      <div className="flex items-center justify-between">
        <span className="text-[8px] font-display uppercase tracking-wider text-parchment-dim">
          Impactar
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onHitMod(-1)}
            disabled={mods.hitMod <= -2}
            className="w-5 h-5 text-[10px] font-mono border border-rim-bright text-parchment-dim hover:border-parchment hover:text-parchment disabled:opacity-30 disabled:cursor-not-allowed"
          >
            −
          </button>
          <span className={`w-8 text-center text-[9px] font-mono font-bold ${
            mods.hitMod > 0 ? 'text-gold-bright' : mods.hitMod < 0 ? 'text-crimson' : 'text-parchment-dim'
          }`}>
            {mods.hitMod > 0 ? `+${mods.hitMod}` : mods.hitMod === 0 ? '±0' : mods.hitMod}
          </span>
          <button
            onClick={() => onHitMod(+1)}
            disabled={mods.hitMod >= 2}
            className="w-5 h-5 text-[10px] font-mono border border-rim-bright text-parchment-dim hover:border-parchment hover:text-parchment disabled:opacity-30 disabled:cursor-not-allowed"
          >
            +
          </button>
        </div>
      </div>
      {/* Reroll toggles */}
      <div className="flex gap-1.5 flex-wrap">
        <ToggleBtn active={mods.rerollHitsOf1} onClick={onToggleRerollOf1}>
          Repetir 1s
        </ToggleBtn>
        <ToggleBtn active={mods.rerollAllHits} onClick={onToggleRerollAll}>
          Repetir todos
        </ToggleBtn>
      </div>
    </div>
  )
}
