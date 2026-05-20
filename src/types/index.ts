// ── Raw CSV row types ──────────────────────────────────────────────────────────

export interface RawFaction {
  id: string
  name: string
  link: string
}

export interface RawDatasheet {
  id: string
  name: string
  faction_id: string
  source_id: string
  legend: string
  role: string
  loadout: string
  transport: string
  virtual: string
  leader_head: string
  leader_footer: string
  damaged_w: string
  damaged_description: string
  link: string
}

export interface RawDatasheetModel {
  datasheet_id: string
  line: string
  name: string
  M: string
  T: string
  Sv: string
  inv_sv: string
  inv_sv_descr: string
  W: string
  Ld: string
  OC: string
  base_size: string
  base_size_descr: string
}

export interface RawDatasheetWargear {
  datasheet_id: string
  line: string
  line_in_wargear: string
  dice: string
  name: string
  description: string
  range: string
  type: string
  A: string
  BS_WS: string
  S: string
  AP: string
  D: string
}

export interface RawDatasheetAbility {
  datasheet_id: string
  line: string
  ability_id: string
  model: string
  name: string
  description: string
  type: string
  parameter: string
}

export interface RawAbility {
  id: string
  name: string
  legend: string
  faction_id: string
  description: string
}

export interface RawDetachment {
  id: string
  faction_id: string
  name: string
  legend: string
  type: string
}

export interface RawDetachmentAbility {
  id: string
  faction_id: string
  name: string
  legend: string
  description: string
  detachment: string
  detachment_id: string
}

export interface RawStratagem {
  faction_id: string
  name: string
  id: string
  type: string
  cp_cost: string
  legend: string
  turn: string
  phase: string
  detachment: string
  detachment_id: string
  description: string
}

export interface RawDatasheetStratagem {
  datasheet_id: string
  stratagem_id: string
}

export interface RawDatasheetKeyword {
  datasheet_id: string
  keyword: string
  model: string
  is_faction_keyword: string
}

export interface RawDatasheetUnitComposition {
  datasheet_id: string
  line: string
  description: string
}

// ── Domain types ───────────────────────────────────────────────────────────────

export interface Faction {
  id: string
  name: string
}

export interface Detachment {
  id: string
  factionId: string
  name: string
  legend: string
}

export interface DetachmentAbility {
  id: string
  detachmentId: string
  name: string
  description: string
  legend: string
}

export interface ModelProfile {
  line: number
  name: string
  M: string
  T: number
  Sv: string
  invSv: string
  W: number
  Ld: string
  OC: number
  baseSize: string
}

export interface Weapon {
  line: number
  name: string
  description: string
  range: string
  type: string
  A: string
  bsWs: string
  S: number
  AP: number
  D: string
  isTorrent: boolean
  isBlast: boolean
  isDevastatingWounds: boolean
  isLethalHits: boolean
  isHeavy: boolean
  sustainedHitsValue: number
}

export type CombatType = 'ranged' | 'melee' | 'any'

export interface CombatModifiers {
  hitMod: number
  rerollHitsOf1: boolean
  rerollAllHits: boolean
  critThreshold: number
  strengthMod: number
  woundMod: number
  rerollWoundsOf1: boolean
  rerollAllWounds: boolean
  lethalHitsBonus: boolean
  sustainedHitsBonus: number
  apMod: number
  saveMod: number
  damageMod: number
  damageReduction: number
  feelNoPainThreshold: number | null
}

export interface ModifierRule {
  id: string
  label: string
  description?: string
  factionId?: string
  detachmentId?: string
  datasheetId?: string        // ability de esta unidad concreta
  leaderDatasheetId?: string  // ability de un líder adjunto a la unidad
  sourceDatasheetId?: string  // aura de una unidad de soporte (no adjunta)
  combatType?: CombatType
  target?: 'attacker' | 'defender'
  isStratagem?: boolean
  cpCost?: number
  effects: Partial<CombatModifiers>
}

export interface Ability {
  name: string
  description: string
  type: 'Core' | 'Faction' | 'Datasheet'
  model?: string
}

export interface Stratagem {
  id: string
  name: string
  factionId: string
  detachmentId: string
  cpCost: number
  type: string
  turn: string
  phase: string
  description: string
}

export interface Datasheet {
  id: string
  name: string
  factionId: string
  role: string
  legend: string
  loadout: string
  isVirtual: boolean
  leaderHead: string[]
  leaderFooter: string[]
  damagedW: number
  damagedDescription: string
  models: ModelProfile[]
  weapons: Weapon[]
  abilities: Ability[]
  keywords: string[]
  factionKeywords: string[]
  unitComposition: string[]
}

export interface GameData {
  factions: Faction[]
  datasheets: Datasheet[]
  detachments: Detachment[]
  detachmentAbilities: DetachmentAbility[]
  stratagems: Stratagem[]
  datasheetStratagems: Record<string, string[]>
  abilitiesMap: Record<string, RawAbility>
  loading: boolean
  error: string | null
}

export interface PanelSelection {
  factionId: string | null
  detachmentId: string | null
  datasheetId: string | null
  characterId: string | null
}

export interface DamageBreakdown {
  weaponName: string
  avgAttacks: number
  hitProbability: number
  expectedHits: number
  sustainedExtraHits: number
  woundProbability: number
  expectedWounds: number
  autoWoundsFromCrits: number
  saveFailProbability: number
  expectedFailedSaves: number
  avgDamagePerWound: number
  expectedTotalDamage: number
}
