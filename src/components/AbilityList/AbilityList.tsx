import { useState } from 'react'
import type { Ability, DetachmentAbility } from '@/types'

interface Props {
  abilities: Ability[]
  detachmentAbilities: DetachmentAbility[]
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

export function AbilityList({ abilities, detachmentAbilities }: Props) {
  const [open, setOpen] = useState(false)
  const total = abilities.length + detachmentAbilities.length
  if (total === 0) return null

  return (
    <div className="border-b border-rim-bright">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-3 py-2 text-[9px] font-display uppercase tracking-widest text-gold hover:text-gold-bright transition-colors"
      >
        <span>Habilidades ({total})</span>
        <span>{open ? '▴' : '▾'}</span>
      </button>

      {open && (
        <div className="px-3 pb-3 space-y-2">
          {detachmentAbilities.map(da => (
            <div key={da.id} className="border border-gold/30 bg-gold/5 p-2">
              <p className="text-[9px] font-display uppercase tracking-widest text-gold mb-1">
                ◆ {da.name}
              </p>
              <p className="text-[10px] font-mono text-parchment-dim leading-relaxed">
                {stripHtml(da.description)}
              </p>
            </div>
          ))}

          {abilities.map((ab, i) => (
            <div key={i} className="border-l-2 border-l-rim-bright pl-2">
              <p className="text-[9px] font-display uppercase tracking-widest text-parchment mb-0.5">
                {ab.name}
                {ab.model && (
                  <span className="text-parchment-dim normal-case tracking-normal font-mono ml-1">
                    ({ab.model})
                  </span>
                )}
              </p>
              <p className="text-[10px] font-mono text-parchment-dim leading-relaxed">
                {stripHtml(ab.description)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
