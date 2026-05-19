import { useState, useMemo } from 'react'
import type { GameData, PanelSelection, Datasheet, Detachment, DetachmentAbility, Stratagem } from '@/types'

export interface PanelState {
  selection: PanelSelection
  availableDetachments: Detachment[]
  availableUnits: Datasheet[]
  selectedUnit: Datasheet | null
  availableCharacters: Datasheet[]
  detachmentAbilities: DetachmentAbility[]
  applicableStratagems: Stratagem[]
  selectFaction: (id: string | null) => void
  selectDetachment: (id: string | null) => void
  selectUnit: (id: string | null) => void
  selectCharacter: (id: string | null) => void
}

export function usePanelState(gameData: GameData): PanelState {
  const [selection, setSelection] = useState<PanelSelection>({
    factionId: null, detachmentId: null, datasheetId: null, characterId: null,
  })

  const availableDetachments = useMemo(
    () => selection.factionId
      ? gameData.detachments.filter(d => d.factionId === selection.factionId)
      : [],
    [gameData.detachments, selection.factionId],
  )

  const availableUnits = useMemo(
    () => selection.factionId
      ? gameData.datasheets
          .filter(ds => ds.factionId === selection.factionId && !ds.isVirtual)
          .sort((a, b) => a.name.localeCompare(b.name))
      : [],
    [gameData.datasheets, selection.factionId],
  )

  const selectedUnit = useMemo(
    () => selection.datasheetId
      ? gameData.datasheets.find(ds => ds.id === selection.datasheetId) ?? null
      : null,
    [gameData.datasheets, selection.datasheetId],
  )

  const availableCharacters = useMemo(() => {
    if (!selectedUnit) return []
    return selectedUnit.leaderFooter
      .map(id => gameData.datasheets.find(ds => ds.id === id))
      .filter((ds): ds is Datasheet => ds !== undefined)
  }, [gameData.datasheets, selectedUnit])

  const detachmentAbilities = useMemo(
    () => selection.detachmentId
      ? gameData.detachmentAbilities.filter(da => da.detachmentId === selection.detachmentId)
      : [],
    [gameData.detachmentAbilities, selection.detachmentId],
  )

  const applicableStratagems = useMemo(() => {
    if (!selectedUnit) return []
    const unitStratIds = new Set(gameData.datasheetStratagems[selectedUnit.id] ?? [])
    return gameData.stratagems
      .filter(s =>
        unitStratIds.has(s.id) &&
        (s.detachmentId === '' || s.detachmentId === selection.detachmentId),
      )
      .sort((a, b) => a.cpCost - b.cpCost || a.phase.localeCompare(b.phase))
  }, [gameData.stratagems, gameData.datasheetStratagems, selectedUnit, selection.detachmentId])

  const selectFaction = (factionId: string | null) =>
    setSelection({ factionId, detachmentId: null, datasheetId: null, characterId: null })

  const selectDetachment = (detachmentId: string | null) =>
    setSelection(s => ({ ...s, detachmentId }))

  const selectUnit = (datasheetId: string | null) =>
    setSelection(s => ({ ...s, datasheetId, characterId: null }))

  const selectCharacter = (characterId: string | null) =>
    setSelection(s => ({ ...s, characterId }))

  return {
    selection, availableDetachments, availableUnits, selectedUnit,
    availableCharacters, detachmentAbilities, applicableStratagems,
    selectFaction, selectDetachment, selectUnit, selectCharacter,
  }
}
