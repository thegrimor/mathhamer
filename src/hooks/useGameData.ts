import { useState, useEffect } from 'react'
import Papa from 'papaparse'
import type {
  GameData, Faction, Detachment, DetachmentAbility, Stratagem, Datasheet,
  ModelProfile, Weapon, Ability, AntiEntry,
  RawFaction, RawDatasheet, RawDatasheetModel, RawDatasheetWargear,
  RawDatasheetAbility, RawAbility, RawDetachment, RawDetachmentAbility,
  RawStratagem, RawDatasheetStratagem, RawDatasheetKeyword, RawDatasheetUnitComposition,
} from '@/types'

function parseCsvRaw(text: string): Record<string, string>[] {
  const result = Papa.parse<Record<string, string>>(text, {
    header: true,
    delimiter: '|',
    skipEmptyLines: true,
    dynamicTyping: false,
  })
  return result.data
}

function groupBy<T>(rows: T[], key: keyof T): Record<string, T[]> {
  const map: Record<string, T[]> = {}
  for (const row of rows) {
    const k = String(row[key])
    if (!map[k]) map[k] = []
    map[k].push(row)
  }
  return map
}

function splitIds(raw: string): string[] {
  if (!raw) return []
  return raw.split(',').map(s => s.trim()).filter(Boolean)
}

function parseSustainedHits(desc: string): number {
  // e.g. "sustained hits 2", "sustained hits d3"
  const m = desc.match(/sustained hits (\d+|d\d+)/i)
  if (!m) return 0
  const val = parseInt(m[1])
  if (!isNaN(val)) return val
  // dice expression (rare): D3→2, D6→3.5
  if (m[1].toUpperCase() === 'D3') return 2
  if (m[1].toUpperCase() === 'D6') return 3.5
  return 0
}

function parseAntiEntries(desc: string): AntiEntry[] {
  const RE = /anti-([\w][\w ]*?)\s+(\d)\+/gi
  const entries: AntiEntry[] = []
  let m: RegExpExecArray | null
  while ((m = RE.exec(desc)) !== null) {
    entries.push({ keyword: m[1].toLowerCase().trim(), threshold: parseInt(m[2]) })
  }
  return entries
}

function parseWeapon(raw: RawDatasheetWargear): Weapon {
  const desc = (raw.description ?? '').toLowerCase()
  const type = raw.type ?? ''
  return {
    line: parseInt(raw.line) || 0,
    name: raw.name,
    description: raw.description,
    range: raw.range,
    type: raw.type,
    A: raw.A,
    bsWs: raw.BS_WS,
    S: parseInt(raw.S) || 0,
    AP: parseInt(raw.AP) || 0,
    D: raw.D,
    isTorrent: desc.includes('torrent'),
    isBlast: desc.includes('blast'),
    isDevastatingWounds: desc.includes('devastating wounds'),
    isLethalHits: desc.includes('lethal hits'),
    isHeavy: /\bheavy\b/i.test(type),
    isTwinLinked: desc.includes('twin-linked'),
    sustainedHitsValue: parseSustainedHits(desc),
    antiEntries: parseAntiEntries(desc),
  }
}

function parseModel(raw: RawDatasheetModel): ModelProfile {
  return {
    line: parseInt(raw.line) || 0,
    name: raw.name,
    M: raw.M,
    T: parseInt(raw.T) || 0,
    Sv: raw.Sv,
    invSv: raw.inv_sv || '',
    W: parseInt(raw.W) || 0,
    Ld: raw.Ld,
    OC: parseInt(raw.OC) || 0,
    baseSize: raw.base_size,
  }
}

function resolveAbility(
  row: RawDatasheetAbility,
  abilitiesMap: Record<string, RawAbility>,
): Ability | null {
  const type = row.type as 'Core' | 'Faction' | 'Datasheet'
  if (type === 'Datasheet') {
    if (!row.name) return null
    return { name: row.name, description: row.description, type, model: row.model || undefined }
  }
  const ref = abilitiesMap[row.ability_id]
  if (!ref) return null
  return { name: ref.name, description: ref.description, type }
}

function enrichDatasheet(
  raw: RawDatasheet,
  modelsByDs: Record<string, RawDatasheetModel[]>,
  wargearByDs: Record<string, RawDatasheetWargear[]>,
  abilitiesByDs: Record<string, RawDatasheetAbility[]>,
  keywordsByDs: Record<string, RawDatasheetKeyword[]>,
  compByDs: Record<string, RawDatasheetUnitComposition[]>,
  abilitiesMap: Record<string, RawAbility>,
): Datasheet {
  const models = (modelsByDs[raw.id] ?? [])
    .sort((a, b) => parseInt(a.line) - parseInt(b.line))
    .map(parseModel)

  const weapons = (wargearByDs[raw.id] ?? [])
    .sort((a, b) => parseInt(a.line) - parseInt(b.line))
    .map(parseWeapon)

  const abilities: Ability[] = (abilitiesByDs[raw.id] ?? [])
    .sort((a, b) => parseInt(a.line) - parseInt(b.line))
    .map(row => resolveAbility(row, abilitiesMap))
    .filter((a): a is Ability => a !== null)

  const kwRows = keywordsByDs[raw.id] ?? []
  const keywords = kwRows
    .filter(k => k.is_faction_keyword !== 'true' && k.is_faction_keyword !== '1')
    .map(k => k.keyword)
  const factionKeywords = kwRows
    .filter(k => k.is_faction_keyword === 'true' || k.is_faction_keyword === '1')
    .map(k => k.keyword)

  const unitComposition = (compByDs[raw.id] ?? [])
    .sort((a, b) => parseInt(a.line) - parseInt(b.line))
    .map(c => c.description)

  return {
    id: raw.id,
    name: raw.name,
    factionId: raw.faction_id,
    role: raw.role,
    legend: raw.legend,
    loadout: raw.loadout,
    isVirtual: raw.virtual === 'true' || raw.virtual === '1',
    leaderHead: splitIds(raw.leader_head),
    leaderFooter: splitIds(raw.leader_footer),
    damagedW: parseInt(raw.damaged_w) || 0,
    damagedDescription: raw.damaged_description || '',
    models,
    weapons,
    abilities,
    keywords,
    factionKeywords,
    unitComposition,
  }
}

const CSV_FILES = [
  'Factions',
  'Datasheets',
  'Datasheets_models',
  'Datasheets_wargear',
  'Datasheets_abilities',
  'Abilities',
  'Detachments',
  'Detachment_abilities',
  'Stratagems',
  'Datasheets_stratagems',
  'Datasheets_keywords',
  'Datasheets_unit_composition',
]

export function useGameData(): GameData {
  const [state, setState] = useState<GameData>({
    factions: [],
    datasheets: [],
    detachments: [],
    detachmentAbilities: [],
    stratagems: [],
    datasheetStratagems: {},
    abilitiesMap: {},
    loading: true,
    error: null,
  })

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const texts = await Promise.all(
          CSV_FILES.map(f =>
            fetch(`/data/${f}.csv`).then(r => {
              if (!r.ok) throw new Error(`Error cargando ${f}.csv: ${r.status}`)
              return r.text()
            }),
          ),
        )
        if (cancelled) return

        const rows = texts.map(parseCsvRaw)
        const rawFactions       = rows[0]  as unknown as RawFaction[]
        const rawDatasheets     = rows[1]  as unknown as RawDatasheet[]
        const rawModels         = rows[2]  as unknown as RawDatasheetModel[]
        const rawWargear        = rows[3]  as unknown as RawDatasheetWargear[]
        const rawDsAbilities    = rows[4]  as unknown as RawDatasheetAbility[]
        const rawAbilities      = rows[5]  as unknown as RawAbility[]
        const rawDetachments    = rows[6]  as unknown as RawDetachment[]
        const rawDetachAbils    = rows[7]  as unknown as RawDetachmentAbility[]
        const rawStratagems     = rows[8]  as unknown as RawStratagem[]
        const rawDsStratagems   = rows[9]  as unknown as RawDatasheetStratagem[]
        const rawKeywords       = rows[10] as unknown as RawDatasheetKeyword[]
        const rawCompositions   = rows[11] as unknown as RawDatasheetUnitComposition[]

        const abilitiesMap: Record<string, RawAbility> = {}
        rawAbilities.forEach(a => { abilitiesMap[a.id] = a })

        const modelsByDs   = groupBy(rawModels, 'datasheet_id')
        const wargearByDs  = groupBy(rawWargear, 'datasheet_id')
        const abilsByDs    = groupBy(rawDsAbilities, 'datasheet_id')
        const keywordsByDs = groupBy(rawKeywords, 'datasheet_id')
        const compByDs     = groupBy(rawCompositions, 'datasheet_id')

        const datasheetStratagems: Record<string, string[]> = {}
        rawDsStratagems.forEach(row => {
          if (!datasheetStratagems[row.datasheet_id]) datasheetStratagems[row.datasheet_id] = []
          datasheetStratagems[row.datasheet_id].push(row.stratagem_id)
        })

        const datasheets = rawDatasheets.map(ds =>
          enrichDatasheet(ds, modelsByDs, wargearByDs, abilsByDs, keywordsByDs, compByDs, abilitiesMap),
        )

        const factions: Faction[] = [...rawFactions]
          .sort((a, b) => a.name.localeCompare(b.name))
          .map(f => ({ id: f.id, name: f.name }))

        const detachments: Detachment[] = rawDetachments.map(d => ({
          id: d.id, factionId: d.faction_id, name: d.name, legend: d.legend,
        }))

        const detachmentAbilities: DetachmentAbility[] = rawDetachAbils.map(da => ({
          id: da.id, detachmentId: da.detachment_id, name: da.name,
          description: da.description, legend: da.legend,
        }))

        const stratagems: Stratagem[] = rawStratagems.map(s => ({
          id: s.id, name: s.name, factionId: s.faction_id, detachmentId: s.detachment_id,
          cpCost: parseInt(s.cp_cost) || 1, type: s.type, turn: s.turn,
          phase: s.phase, description: s.description,
        }))

        if (!cancelled) {
          setState({
            factions, datasheets, detachments, detachmentAbilities,
            stratagems, datasheetStratagems, abilitiesMap,
            loading: false, error: null,
          })
        }
      } catch (err) {
        if (!cancelled) setState(s => ({ ...s, loading: false, error: String(err) }))
      }
    }

    load()
    return () => { cancelled = true }
  }, [])

  return state
}
