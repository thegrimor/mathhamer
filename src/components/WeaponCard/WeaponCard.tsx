import { parseDiceAverage } from '@/utils/mathhammer'
import type { Weapon } from '@/types'

interface Props {
  weapon: Weapon
  isSelected: boolean
  onSelect: (w: Weapon) => void
}

function Badge({ label }: { label: string }) {
  return (
    <span className="text-[7px] uppercase font-mono px-1 py-0.5 bg-crimson/20 border border-crimson/40 text-crimson-bright leading-none">
      {label}
    </span>
  )
}

export function WeaponCard({ weapon, isSelected, onSelect }: Props) {
  const avgD = parseDiceAverage(weapon.D)
  const avgA = parseDiceAverage(weapon.A)
  const dFixed = parseFloat(weapon.D)
  const aFixed = parseFloat(weapon.A)

  const hasBadges = weapon.isTorrent || weapon.isBlast || weapon.isDevastatingWounds ||
    weapon.isLethalHits || weapon.isHeavy || weapon.sustainedHitsValue > 0

  return (
    <button
      onClick={() => onSelect(weapon)}
      className={`w-full text-left p-2 border-b border-rim-bright transition-colors hover:bg-surface-3 ${
        isSelected
          ? 'border-l-2 border-l-gold bg-gold/5'
          : 'border-l-2 border-l-transparent'
      }`}
    >
      <div className="flex items-baseline justify-between gap-2">
        <span className={`text-xs font-mono font-bold truncate ${isSelected ? 'text-gold' : 'text-parchment'}`}>
          {weapon.name}
        </span>
        <span className="text-[9px] text-parchment-dim font-mono shrink-0">{weapon.range}</span>
      </div>

      <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1 text-[10px] font-mono text-parchment-dim">
        <span title="Ataques">
          A:{weapon.A}{!isNaN(aFixed) && avgA !== aFixed ? ` (≈${avgA.toFixed(1)})` : ''}
        </span>
        <span title="Impacto/Habilidad de combate">{weapon.range === 'Melee' ? 'WS' : 'BS'}:{weapon.bsWs}</span>
        <span title="Fuerza">F:{weapon.S}</span>
        <span title="Penetración de armadura">AP:{weapon.AP}</span>
        <span title="Daño">
          D:{weapon.D}{!isNaN(dFixed) && avgD !== dFixed ? ` (≈${avgD.toFixed(1)})` : ''}
        </span>
      </div>

      {hasBadges && (
        <div className="flex gap-1 mt-1 flex-wrap">
          {weapon.isTorrent           && <Badge label="Torrent" />}
          {weapon.isBlast             && <Badge label="Blast" />}
          {weapon.isDevastatingWounds && <Badge label="Dev. Wounds" />}
          {weapon.isLethalHits        && <Badge label="Lethal Hits" />}
          {weapon.isHeavy             && <Badge label="Heavy" />}
          {weapon.sustainedHitsValue > 0 && <Badge label={`Sustained ${weapon.sustainedHitsValue}`} />}
        </div>
      )}
    </button>
  )
}
