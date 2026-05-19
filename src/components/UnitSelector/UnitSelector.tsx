import type { GameData } from '@/types'
import type { PanelState } from '@/hooks/usePanelState'

interface Props {
  gameData: GameData
  panel: PanelState
}

const selectCls =
  'w-full bg-surface-2 border border-rim-bright text-parchment font-mono text-xs ' +
  'px-2 py-1.5 rounded-none outline-none cursor-pointer ' +
  'focus:border-gold transition-colors ' +
  'disabled:opacity-30 disabled:cursor-not-allowed'

export function UnitSelector({ gameData, panel }: Props) {
  const { selection, availableDetachments, availableUnits, availableCharacters } = panel

  return (
    <div className="flex flex-col gap-2 p-3 border-b border-rim-bright">
      <div>
        <label className="block text-[9px] font-display uppercase tracking-widest text-gold mb-1">
          Ejército
        </label>
        <select
          className={selectCls}
          value={selection.factionId ?? ''}
          onChange={e => panel.selectFaction(e.target.value || null)}
        >
          <option value="">— Selecciona Ejército —</option>
          {gameData.factions.map(f => (
            <option key={f.id} value={f.id}>{f.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-[9px] font-display uppercase tracking-widest text-gold mb-1">
          Destacamento
        </label>
        <select
          className={selectCls}
          value={selection.detachmentId ?? ''}
          onChange={e => panel.selectDetachment(e.target.value || null)}
          disabled={!selection.factionId}
        >
          <option value="">— Selecciona Destacamento —</option>
          {availableDetachments.map(d => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-[9px] font-display uppercase tracking-widest text-gold mb-1">
          Unidad
        </label>
        <select
          className={selectCls}
          value={selection.datasheetId ?? ''}
          onChange={e => panel.selectUnit(e.target.value || null)}
          disabled={!selection.factionId}
        >
          <option value="">— Selecciona Unidad —</option>
          {availableUnits.map(u => (
            <option key={u.id} value={u.id}>{u.name}</option>
          ))}
        </select>
      </div>

      {availableCharacters.length > 0 && (
        <div>
          <label className="block text-[9px] font-display uppercase tracking-widest text-gold mb-1">
            Personaje <span className="text-parchment-dim normal-case tracking-normal">(opcional)</span>
          </label>
          <select
            className={selectCls}
            value={selection.characterId ?? ''}
            onChange={e => panel.selectCharacter(e.target.value || null)}
          >
            <option value="">— Sin Personaje —</option>
            {availableCharacters.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      )}
    </div>
  )
}
