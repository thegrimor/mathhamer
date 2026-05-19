import type { ModelProfile } from '@/types'

interface Props {
  models: ModelProfile[]
  selectedIndex: number
  onSelectIndex: (i: number) => void
}

function StatCell({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex flex-col items-center border border-rim-bright bg-surface-3 px-2 py-1.5 min-w-[40px]">
      <span className="text-[8px] font-display uppercase tracking-[2px] text-gold leading-none mb-0.5">
        {label}
      </span>
      <span
        className="text-sm font-display font-black text-crimson-bright leading-none"
        style={{ textShadow: '0 0 6px #ff2222' }}
      >
        {value}
      </span>
    </div>
  )
}

export function StatsBar({ models, selectedIndex, onSelectIndex }: Props) {
  if (models.length === 0) return null
  const m = models[selectedIndex] ?? models[0]

  return (
    <div className="p-3 border-b border-rim-bright">
      {models.length > 1 && (
        <div className="flex gap-1 mb-2 flex-wrap">
          {models.map((model, i) => (
            <button
              key={i}
              onClick={() => onSelectIndex(i)}
              className={`text-[9px] font-mono px-2 py-0.5 border transition-colors ${
                i === selectedIndex
                  ? 'border-gold text-gold bg-gold/10'
                  : 'border-rim-bright text-parchment-dim hover:border-gold/50 hover:text-parchment'
              }`}
            >
              {model.name || `Perfil ${i + 1}`}
            </button>
          ))}
        </div>
      )}
      <div className="flex flex-wrap gap-1">
        <StatCell label="M"   value={m.M} />
        <StatCell label="T"   value={m.T} />
        <StatCell label="Sv"  value={m.Sv} />
        {m.invSv && <StatCell label="Inv" value={m.invSv} />}
        <StatCell label="W"   value={m.W} />
        <StatCell label="Ld"  value={m.Ld} />
        <StatCell label="OC"  value={m.OC} />
      </div>
    </div>
  )
}
