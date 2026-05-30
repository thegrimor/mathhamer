import { useState, useMemo, useEffect } from 'react'
import type { GameData, PanelSelection, Datasheet, Detachment, DetachmentAbility, Stratagem } from '@/types'
import { MODIFIER_RULES } from '@/data/modifiers'
import { LEADER_FOLLOWERS } from '@/data/leaderFollowers'

const EMPTY_SELECTION: PanelSelection = { factionId: null, detachmentId: null, datasheetId: null, characterId: null }

function readSelection(key: string): PanelSelection {
  try {
    const raw = localStorage.getItem(key)
    if (raw) return JSON.parse(raw) as PanelSelection
  } catch {}
  return EMPTY_SELECTION
}

function readRoster(key: string): string[] | null {
  try {
    const raw = localStorage.getItem(key)
    if (raw !== null) return JSON.parse(raw) as string[] | null
  } catch {}
  return null
}

export interface PanelState {
  selection: PanelSelection
  availableDetachments: Detachment[]
  availableUnits: Datasheet[]
  allUnitsForFaction: Datasheet[]
  selectedUnit: Datasheet | null
  availableCharacters: Datasheet[]
  detachmentAbilities: DetachmentAbility[]
  applicableStratagems: Stratagem[]
  rosterIds: string[] | null
  selectFaction: (id: string | null) => void
  selectDetachment: (id: string | null) => void
  selectUnit: (id: string | null) => void
  selectCharacter: (id: string | null) => void
  setRosterIds: (ids: string[] | null) => void
}

export function usePanelState(gameData: GameData, storageKey: string): PanelState {
  const [selection, setSelection] = useState<PanelSelection>(() => readSelection(storageKey))
  const rosterStorageKey = `${storageKey}-roster`
  const [rosterIds, setRosterIdsState] = useState<string[] | null>(() => readRoster(rosterStorageKey))

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(selection))
    } catch {}
  }, [storageKey, selection])

  useEffect(() => {
    try {
      localStorage.setItem(rosterStorageKey, JSON.stringify(rosterIds))
    } catch {}
  }, [rosterStorageKey, rosterIds])

  const availableDetachments = useMemo(
    () => selection.factionId
      ? gameData.detachments.filter(d => d.factionId === selection.factionId)
      : [],
    [gameData.detachments, selection.factionId],
  )

  const allUnitsForFaction = useMemo(
    () => selection.factionId
      ? gameData.datasheets
          .filter(ds => ds.factionId === selection.factionId && !ds.isVirtual)
          .sort((a, b) => a.name.localeCompare(b.name))
      : [],
    [gameData.datasheets, selection.factionId],
  )

  const availableUnits = useMemo(
    () => rosterIds !== null
      ? allUnitsForFaction.filter(ds => rosterIds.includes(ds.id))
      : allUnitsForFaction,
    [allUnitsForFaction, rosterIds],
  )

  const selectedUnit = useMemo(
    () => selection.datasheetId
      ? gameData.datasheets.find(ds => ds.id === selection.datasheetId) ?? null
      : null,
    [gameData.datasheets, selection.datasheetId],
  )

  const availableCharacters = useMemo(() => {
    if (!selectedUnit) return []
    const factionId = selectedUnit.factionId
    const unitId = selectedUnit.id
    const leaderIds = new Set(
      MODIFIER_RULES
        .filter(r =>
          r.leaderDatasheetId &&
          r.factionId === factionId &&
          (!LEADER_FOLLOWERS[r.leaderDatasheetId] || LEADER_FOLLOWERS[r.leaderDatasheetId].includes(unitId))
        )
        .map(r => r.leaderDatasheetId!)
    )
    return [...leaderIds]
      .map(id => gameData.datasheets.find(ds => ds.id === id))
      .filter((ds): ds is Datasheet => ds !== undefined)
      .filter(ds => rosterIds === null || rosterIds.includes(ds.id))
      .sort((a, b) => a.name.localeCompare(b.name))
  }, [gameData.datasheets, selectedUnit, rosterIds])

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

  const selectFaction = (factionId: string | null) => {
    setSelection({ factionId, detachmentId: null, datasheetId: null, characterId: null })
    setRosterIdsState(null)
  }

  const selectDetachment = (detachmentId: string | null) =>
    setSelection(s => ({ ...s, detachmentId }))

  const selectUnit = (datasheetId: string | null) =>
    setSelection(s => ({ ...s, datasheetId, characterId: null }))

  const selectCharacter = (characterId: string | null) =>
    setSelection(s => ({ ...s, characterId }))

  const setRosterIds = (ids: string[] | null) => setRosterIdsState(ids)

  return {
    selection, availableDetachments, availableUnits, allUnitsForFaction, selectedUnit,
    availableCharacters, detachmentAbilities, applicableStratagems,
    rosterIds,
    selectFaction, selectDetachment, selectUnit, selectCharacter, setRosterIds,
  }
}
