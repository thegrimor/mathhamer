import type { ModifierRule } from '@/types'

export const MODIFIER_RULES: ModifierRule[] = [
  // ── Universal — defender ─────────────────────────────────────────────────
  {
    id: 'cover',
    label: 'En cobertura (+1 Sv)',
    description: 'Defensor en cobertura: +1 a la tirada de salvación',
    target: 'defender',
    effects: { saveMod: -1 },
  },
  // ── Universal — attacker ─────────────────────────────────────────────────
  {
    id: 'weapon_heavy',
    label: 'Estacionario [HEAVY] (+1 a impactar)',
    description: 'Arma [HEAVY]: +1 a impactar si la unidad no se ha movido esta ronda',
    combatType: 'ranged',
    effects: { hitMod: 1 },
  },
  // ── Adeptus Mechanicus — Doctrina Imperatives ─────────────────────────────
  {
    id: 'adm_protector',
    label: 'Doctrina Protector (+1 BS)',
    description: 'Protector Imperative: +1 BS a todas las armas de disparo este turno',
    factionId: 'AdM',
    combatType: 'ranged',
    effects: { hitMod: 1 },
  },
  {
    id: 'adm_protector_heavy',
    label: 'Protector + Estacionario [HEAVY] (+1 BS)',
    description: 'Protector Imperative otorga [HEAVY] a todas las armas de disparo; +1 BS adicional si la unidad no se ha movido',
    factionId: 'AdM',
    combatType: 'ranged',
    effects: { hitMod: 1 },
  },
  {
    id: 'adm_conqueror',
    label: 'Doctrina Conqueror (+1 WS)',
    description: 'Conqueror Imperative: +1 WS a todas las armas CàC este turno',
    factionId: 'AdM',
    combatType: 'melee',
    effects: { hitMod: 1 },
  },
  // ── Adeptus Mechanicus — Eradication Cohort (id: 000001143) ──────────────
  {
    id: 'adm_eradication_protector',
    label: 'Eradication + Protector (repetir 1 a impactar)',
    description: 'Eradication Cohort con Protector activo: repetir una tirada de impacto de 1 por ataque',
    factionId: 'AdM',
    detachmentId: '000001143',
    combatType: 'ranged',
    effects: { rerollHitsOf1: true },
  },
  {
    id: 'adm_eradication_conqueror',
    label: 'Eradication + Conqueror (repetir 1 a herir)',
    description: 'Eradication Cohort con Conqueror activo: repetir una tirada de herida de 1 por ataque',
    factionId: 'AdM',
    detachmentId: '000001143',
    combatType: 'melee',
    effects: { rerollWoundsOf1: true },
  },
  // ── Adeptus Custodes — Martial Ka'tah ────────────────────────────────────
  {
    id: 'ac_dacatarai',
    label: "Ka'tah Dacatarai [SUSTAINED HITS 1]",
    description: "Dacatarai Stance: todas las armas CàC de la unidad ganan [SUSTAINED HITS 1] esta fase",
    factionId: 'AC',
    combatType: 'melee',
    effects: { sustainedHitsBonus: 1 },
  },
  {
    id: 'ac_rendax',
    label: "Ka'tah Rendax [LETHAL HITS]",
    description: "Rendax Stance: todas las armas CàC de la unidad ganan [LETHAL HITS] esta fase",
    factionId: 'AC',
    combatType: 'melee',
    effects: { lethalHitsBonus: true },
  },
  // ── Adeptus Custodes — Shield Host (id: 000000765) ────────────────────────
  {
    id: 'ac_shield_crit5',
    label: 'Shield Host — Golpe Crítico en 5+',
    description: 'Impacto sin modificar de 5+ = Golpe Crítico en ataques CàC',
    factionId: 'AC',
    detachmentId: '000000765',
    combatType: 'melee',
    effects: { critThreshold: 5 },
  },
  {
    id: 'ac_shield_ap1',
    label: 'Shield Host — +1 AP (CàC)',
    description: '+1 AP a todas las armas CàC de la unidad',
    factionId: 'AC',
    detachmentId: '000000765',
    combatType: 'melee',
    effects: { apMod: 1 },
  },
  // ── Death Guard — army rules ──────────────────────────────────────────────
  {
    id: 'dg_contagion',
    label: 'Contagion Range (−1 T enemigo)',
    description: "Nurgle's Gift: objetivos dentro de Contagion Range sufren −1 T",
    factionId: 'DG',
    effects: { woundMod: 1 },
  },
  {
    id: 'dg_rattlejoint',
    label: 'Plaga: Rattlejoint Ague (−1 Sv enemigo)',
    description: 'Rattlejoint Ague: empeora la tirada de salvación del objetivo en 1',
    factionId: 'DG',
    effects: { saveMod: 1 },
  },
  // ── Tyranids — army rules ─────────────────────────────────────────────────
  {
    id: 'tyr_synapse',
    label: 'Rango de Sinapse (+1 F CàC)',
    description: '+1 a la característica de Fuerza en ataques CàC mientras la unidad esté en rango de Sinapse',
    factionId: 'TYR',
    combatType: 'melee',
    effects: { strengthMod: 1 },
  },
]
