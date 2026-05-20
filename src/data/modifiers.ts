import type { ModifierRule } from '@/types'

export const MODIFIER_RULES: ModifierRule[] = [

  // ══════════════════════════════════════════════════════════════════════════
  // UNIVERSALES
  // ══════════════════════════════════════════════════════════════════════════

  {
    id: 'cover',
    label: 'En cobertura (+1 Sv)',
    description: 'Defensor en cobertura: +1 a la tirada de salvación',
    target: 'defender',
    effects: { saveMod: -1 },
  },
  {
    id: 'weapon_heavy',
    label: 'Estacionario [HEAVY] (+1 a impactar)',
    description: 'Arma [HEAVY]: +1 a impactar si la unidad no se ha movido esta ronda',
    combatType: 'ranged',
    effects: { hitMod: 1 },
  },

  // ══════════════════════════════════════════════════════════════════════════
  // ADEPTUS MECHANICUS — Reglas de Ejército
  // ══════════════════════════════════════════════════════════════════════════

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

  // ── AdM · Eradication Cohort (000001143) ─────────────────────────────────

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

  // ── AdM · Eradication Cohort — Estratagemas ───────────────────────────────

  {
    id: 'adm_strat_eradication_unshackled_sustained',
    label: 'UNSHACKLED WRATH — Sustained Hits 1 (1CP)',
    description: 'Eradication Cohort: armas de disparo Skitarii ganan [SUSTAINED HITS 1] hasta el final de la fase de disparo',
    factionId: 'AdM',
    detachmentId: '000001143',
    combatType: 'ranged',
    isStratagem: true,
    cpCost: 1,
    effects: { sustainedHitsBonus: 1 },
  },
  {
    id: 'adm_strat_eradication_unshackled_lethal',
    label: 'UNSHACKLED WRATH — Lethal Hits (1CP)',
    description: 'Eradication Cohort: armas de disparo Skitarii ganan [LETHAL HITS] hasta el final de la fase de disparo',
    factionId: 'AdM',
    detachmentId: '000001143',
    combatType: 'ranged',
    isStratagem: true,
    cpCost: 1,
    effects: { lethalHitsBonus: true },
  },
  {
    id: 'adm_strat_eradication_servo',
    label: 'SERVO‑DRIVEN CHARGE — [LANCE] CàC (1CP)',
    description: 'Eradication Cohort: armas cuerpo a cuerpo ganan [LANCE] (+1 a herir si cargaste) hasta el final de la fase de lucha',
    factionId: 'AdM',
    detachmentId: '000001143',
    combatType: 'melee',
    isStratagem: true,
    cpCost: 1,
    effects: { woundMod: 1 },
  },

  // ── AdM · Haloscreed Battle Clade (000000984) — Estratagemas ─────────────

  {
    id: 'adm_strat_haloscreed_targeting',
    label: 'TARGETING OVERRIDE — Crítico en 5+ (1CP)',
    description: 'Haloscreed Battle Clade: impacto sin modificar de 5+ cuenta como Golpe Crítico hasta el final de la fase',
    factionId: 'AdM',
    detachmentId: '000000984',
    isStratagem: true,
    cpCost: 1,
    effects: { critThreshold: 5 },
  },
  {
    id: 'adm_strat_haloscreed_protocols',
    label: 'ERADICATION PROTOCOLS — Repetir 1s (1CP)',
    description: 'Haloscreed Battle Clade: repetir tiradas de herida de 1 (y de impacto de 1 si HALO OVERRIDE) hasta el final de la fase',
    factionId: 'AdM',
    detachmentId: '000000984',
    isStratagem: true,
    cpCost: 1,
    effects: { rerollWoundsOf1: true, rerollHitsOf1: true },
  },

  // ── AdM · Skitarii Hunter Cohort (000000820) — Estratagemas ──────────────

  {
    id: 'adm_strat_hunter_binharic',
    label: 'BINHARIC OFFENCE — +1 PA (2CP)',
    description: 'Skitarii Hunter Cohort: mejora la PA de dos unidades Skitarii en 1 hasta el final de la fase (solo contra un objetivo)',
    factionId: 'AdM',
    detachmentId: '000000820',
    isStratagem: true,
    cpCost: 2,
    effects: { apMod: 1 },
  },
  {
    id: 'adm_strat_hunter_isolate',
    label: 'ISOLATE AND DESTROY — +1 a herir (1CP)',
    description: 'Skitarii Hunter Cohort: +1 a herir si no hay otras unidades enemigas a 6" del objetivo',
    factionId: 'AdM',
    detachmentId: '000000820',
    isStratagem: true,
    cpCost: 1,
    effects: { woundMod: 1 },
  },
  {
    id: 'adm_strat_hunter_bionic',
    label: 'BIONIC ENDURANCE — FNP 5+ defensor (1CP)',
    description: 'Skitarii Hunter Cohort: unidades Sicarian/Pteraxii/Sydonian ganan Feel No Pain 5+ hasta el final de la fase (como defensor)',
    factionId: 'AdM',
    detachmentId: '000000820',
    target: 'defender',
    isStratagem: true,
    cpCost: 1,
    effects: { feelNoPainThreshold: 5 },
  },

  // ── AdM · Data-Psalm Conclave (000000821) — Estratagemas ─────────────────

  {
    id: 'adm_strat_datapsalm_chant',
    label: 'CHANT OF THE REMORSELESS FIST — +1 a herir (1CP)',
    description: 'Data-Psalm Conclave: +1 a las tiradas de herida de las armas de lucha CULT MECHANICUS hasta el final de la fase de lucha',
    factionId: 'AdM',
    detachmentId: '000000821',
    combatType: 'melee',
    isStratagem: true,
    cpCost: 1,
    effects: { woundMod: 1 },
  },

  // ── AdM · Electromartyrs (000000912) — Estratagemas ──────────────────────

  {
    id: 'adm_strat_electromartyrs_synchrony',
    label: 'BALLISTIC SYNCHRONY — Lethal Hits (1CP)',
    description: 'Electromartyrs: armas de disparo de la unidad ganan [LETHAL HITS] hasta el final de la fase de disparo',
    factionId: 'AdM',
    detachmentId: '000000912',
    combatType: 'ranged',
    isStratagem: true,
    cpCost: 1,
    effects: { lethalHitsBonus: true },
  },
  {
    id: 'adm_strat_electromartyrs_saviour',
    label: 'SAVIOUR SYSTEMS — −1 a herir defensor (1CP)',
    description: 'Electromartyrs: −1 a las tiradas de herida de los ataques contra esta unidad hasta el final de la fase de disparo (como defensor)',
    factionId: 'AdM',
    detachmentId: '000000912',
    combatType: 'ranged',
    target: 'defender',
    isStratagem: true,
    cpCost: 1,
    effects: { woundMod: -1 },
  },

  // ── AdM · Rad-Zone Corps (000000762) — Estratagemas ──────────────────────

  {
    id: 'adm_strat_radzones_lethal',
    label: 'LETHAL DOSAGE — Lethal Hits (1CP)',
    description: 'Rad-Zone Corps: armas de disparo de la unidad ganan [LETHAL HITS] hasta el final de la fase de disparo',
    factionId: 'AdM',
    detachmentId: '000000762',
    combatType: 'ranged',
    isStratagem: true,
    cpCost: 1,
    effects: { lethalHitsBonus: true },
  },
  {
    id: 'adm_strat_radzones_baleful',
    label: 'BALEFUL HALO — −1 a herir defensor (2CP)',
    description: 'Rad-Zone Corps: −1 a las tiradas de herida de los ataques contra esta unidad hasta el final de la fase de lucha (como defensor)',
    factionId: 'AdM',
    detachmentId: '000000762',
    combatType: 'melee',
    target: 'defender',
    isStratagem: true,
    cpCost: 2,
    effects: { woundMod: -1 },
  },

  // ── AdM · Response Clade (000000913) — Estratagemas ──────────────────────

  {
    id: 'adm_strat_response_firefields',
    label: 'PRECOGNITATED FIREFIELDS — Sustained Hits 1 (1CP)',
    description: 'Response Clade: armas de disparo Skitarii ganan [SUSTAINED HITS 1] (o 2 si BATTLELINE) hasta el final de la fase de disparo',
    factionId: 'AdM',
    detachmentId: '000000913',
    combatType: 'ranged',
    isStratagem: true,
    cpCost: 1,
    effects: { sustainedHitsBonus: 1 },
  },

  // ── AdM · Machine Cult (000000914) — Estratagemas ────────────────────────

  {
    id: 'adm_strat_machine_electro',
    label: 'ELECTROGHEIST VISITATIONS — −1 a impactar defensor (1CP)',
    description: 'Machine Cult: si el modelo atacante está a 6" de la unidad ELECTRO-PRIESTS, los ataques sufren −1 a impactar hasta el final de la fase (como defensor)',
    factionId: 'AdM',
    detachmentId: '000000914',
    target: 'defender',
    isStratagem: true,
    cpCost: 1,
    effects: { hitMod: -1 },
  },

  // ══════════════════════════════════════════════════════════════════════════
  // ADEPTUS CUSTODES — Reglas de Ejército
  // ══════════════════════════════════════════════════════════════════════════

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

  // ── AC · Shield Host (000000765) ──────────────────────────────────────────

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
    label: 'Shield Host — +1 PA (CàC)',
    description: '+1 PA a todas las armas CàC de la unidad',
    factionId: 'AC',
    detachmentId: '000000765',
    combatType: 'melee',
    effects: { apMod: 1 },
  },

  // ── AC · Shield Host (000000765) — Estratagemas ───────────────────────────

  {
    id: 'ac_strat_shield_archeotech_lethal',
    label: 'ARCHEOTECH MUNITIONS — Lethal Hits (1CP)',
    description: 'Shield Host: armas de disparo ganan [LETHAL HITS] hasta el final de la fase de disparo',
    factionId: 'AC',
    detachmentId: '000000765',
    combatType: 'ranged',
    isStratagem: true,
    cpCost: 1,
    effects: { lethalHitsBonus: true },
  },
  {
    id: 'ac_strat_shield_archeotech_sustained',
    label: 'ARCHEOTECH MUNITIONS — Sustained Hits 1 (1CP)',
    description: 'Shield Host: armas de disparo ganan [SUSTAINED HITS 1] hasta el final de la fase de disparo',
    factionId: 'AC',
    detachmentId: '000000765',
    combatType: 'ranged',
    isStratagem: true,
    cpCost: 1,
    effects: { sustainedHitsBonus: 1 },
  },
  {
    id: 'ac_strat_shield_unwavering',
    label: 'UNWAVERING SENTINELS — −1 a impactar defensor (1CP)',
    description: 'Shield Host: en objetivo controlado, los ataques CàC contra esta unidad sufren −1 a impactar hasta el final de la fase',
    factionId: 'AC',
    detachmentId: '000000765',
    combatType: 'melee',
    target: 'defender',
    isStratagem: true,
    cpCost: 1,
    effects: { hitMod: -1 },
  },

  // ── AC · Auric Champions (000000863) — Estratagemas ──────────────────────

  {
    id: 'ac_strat_auric_earning',
    label: 'EARNING OF A NAME — Repetir impacto+herida vs MONSTER/VEHICLE (1CP)',
    description: 'Auric Champions: CHARACTER Custodes repiten impactos y heridas contra MONSTER o VEHICLE hasta el final de la fase de lucha',
    factionId: 'AC',
    detachmentId: '000000863',
    combatType: 'melee',
    isStratagem: true,
    cpCost: 1,
    effects: { rerollAllHits: true, rerollAllWounds: true },
  },
  {
    id: 'ac_strat_auric_slayer',
    label: 'SLAYER OF CHAMPIONS — +1 a herir (1CP)',
    description: 'Auric Champions: tras destruir la unidad objetivo del Command phase, los CHARACTER de tu ejército añaden +1 a herir a esa unidad hasta el siguiente Command phase',
    factionId: 'AC',
    detachmentId: '000000863',
    isStratagem: true,
    cpCost: 1,
    effects: { woundMod: 1 },
  },
  {
    id: 'ac_strat_auric_auspice',
    label: "THE EMPEROR'S AUSPICE — FNP 4+ CHARACTER defensor (1CP)",
    description: 'Auric Champions: modelos CHARACTER en la unidad objetivo ganan Feel No Pain 4+ hasta el final de la fase (como defensor)',
    factionId: 'AC',
    detachmentId: '000000863',
    target: 'defender',
    isStratagem: true,
    cpCost: 1,
    effects: { feelNoPainThreshold: 4 },
  },

  // ── AC · Talons Of The Emperor (000000861) — Estratagemas ─────────────────

  {
    id: 'ac_strat_talons_interlocked',
    label: 'TALONS INTERLOCKED — +1F +1PA disparo (1CP)',
    description: 'Talons Of The Emperor: +1 Fuerza y +1 PA en armas de disparo contra un único objetivo (requiere unidad Anathema Psykana a 6")',
    factionId: 'AC',
    detachmentId: '000000861',
    combatType: 'ranged',
    isStratagem: true,
    cpCost: 1,
    effects: { strengthMod: 1, apMod: 1 },
  },
  {
    id: 'ac_strat_talons_executioners',
    label: "EMPEROR'S EXECUTIONERS — +1 a herir vs diezmados (2CP)",
    description: 'Talons Of The Emperor: +1 a herir contra unidades por debajo de su Starting Strength hasta el final de la fase de lucha',
    factionId: 'AC',
    detachmentId: '000000861',
    combatType: 'melee',
    isStratagem: true,
    cpCost: 2,
    effects: { woundMod: 1 },
  },

  // ── AC · Null Maiden Vigil (000000862) — Estratagemas ─────────────────────

  {
    id: 'ac_strat_null_blademastery',
    label: 'ANATHEMA BLADEMASTERY — Repetir impactos (1CP)',
    description: 'Null Maiden Vigil: Vigilators repiten tiradas de impacto (y de herida contra PSYKER o Battle-shocked) hasta el final de la fase de lucha',
    factionId: 'AC',
    detachmentId: '000000862',
    combatType: 'melee',
    isStratagem: true,
    cpCost: 1,
    effects: { rerollAllHits: true },
  },

  // ── AC · Black Ship Guardians (000000910) — Estratagemas ──────────────────

  {
    id: 'ac_strat_blackship_prosecutors',
    label: 'PUNISHMENT OF THE PROSECUTORS — +1 PA disparo (1CP)',
    description: 'Black Ship Guardians: armas de disparo de PROSECUTORS mejoran PA en 1 (y en 2 en herida crítica) hasta el final de la fase',
    factionId: 'AC',
    detachmentId: '000000910',
    combatType: 'ranged',
    isStratagem: true,
    cpCost: 1,
    effects: { apMod: 1 },
  },
  {
    id: 'ac_strat_blackship_focused',
    label: 'FOCUSED FEAR — Empeora PA atacante (1CP)',
    description: 'Black Ship Guardians: hasta el final de la fase, la PA de los ataques contra esta unidad empeora en 1 (como defensor)',
    factionId: 'AC',
    detachmentId: '000000910',
    target: 'defender',
    isStratagem: true,
    cpCost: 1,
    effects: { apMod: -1 },
  },
  {
    id: 'ac_strat_blackship_blades',
    label: 'BLADES OF THE VIGILATORS — −1 a herir defensor (1CP)',
    description: 'Black Ship Guardians: −1 a las tiradas de herida de los ataques CàC contra esta unidad hasta el final de la fase',
    factionId: 'AC',
    detachmentId: '000000910',
    combatType: 'melee',
    target: 'defender',
    isStratagem: true,
    cpCost: 1,
    effects: { woundMod: -1 },
  },

  // ── AC · Solar Spearhead (000000986) — Estratagemas ──────────────────────

  {
    id: 'ac_strat_solar_flawless',
    label: 'FLAWLESS CONSTRUCTION — −1 a herir defensor si F>R (1CP)',
    description: 'Solar Spearhead: −1 a herir vehículos Custodes si la Fuerza del ataque supera la Resistencia del objetivo (como defensor)',
    factionId: 'AC',
    detachmentId: '000000986',
    target: 'defender',
    isStratagem: true,
    cpCost: 1,
    effects: { woundMod: -1 },
  },

  // ══════════════════════════════════════════════════════════════════════════
  // DEATH GUARD — Reglas de Ejército
  // ══════════════════════════════════════════════════════════════════════════

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

  // ── DG · Champions of Contagion (000001051) — Estratagemas ───────────────

  {
    id: 'dg_strat_champions_blessings',
    label: 'BLESSINGS OF FILTH — Crítico en 5+ (1CP)',
    description: 'Champions of Contagion: impacto sin modificar de 5+ cuenta como Golpe Crítico hasta el final de la fase',
    factionId: 'DG',
    detachmentId: '000001051',
    isStratagem: true,
    cpCost: 1,
    effects: { critThreshold: 5 },
  },
  {
    id: 'dg_strat_champions_malignance',
    label: 'MALIGNANCE MAGNIFIED — Repetir impacto+herida (2CP)',
    description: 'Champions of Contagion: si el objetivo está por debajo de Starting Strength, repetir impactos y heridas hasta el final de la fase',
    factionId: 'DG',
    detachmentId: '000001051',
    isStratagem: true,
    cpCost: 2,
    effects: { rerollAllHits: true, rerollAllWounds: true },
  },
  {
    id: 'dg_strat_champions_grotesque',
    label: 'GROTESQUE FORTITUDE — +2R defensor (1CP)',
    description: 'Champions of Contagion: +2 a la Resistencia de la unidad Attached hasta el final de la fase (como defensor)',
    factionId: 'DG',
    detachmentId: '000001051',
    target: 'defender',
    isStratagem: true,
    cpCost: 1,
    effects: { woundMod: -2 },
  },

  // ── DG · Vectors of Decay (000000930) — Estratagemas ─────────────────────

  {
    id: 'dg_strat_vectors_chinks',
    label: 'CHINKS IN THE ARMOUR — Crítico en 5+ (1CP)',
    description: 'Vectors of Decay: contra objetivos en Contagion Range, impacto de 5+ cuenta como Golpe Crítico hasta el final de la fase',
    factionId: 'DG',
    detachmentId: '000000930',
    isStratagem: true,
    cpCost: 1,
    effects: { critThreshold: 5 },
  },

  // ── DG · Virulent Vectorium (000001049) — Estratagemas ───────────────────

  {
    id: 'dg_strat_virulent_resilient',
    label: 'DISGUSTINGLY RESILIENT — −1 daño defensor (2CP)',
    description: 'Virulent Vectorium: restar 1 al Daño de cada ataque contra esta unidad hasta el final de la fase (como defensor)',
    factionId: 'DG',
    detachmentId: '000001049',
    target: 'defender',
    isStratagem: true,
    cpCost: 2,
    effects: { damageReduction: 1 },
  },
  {
    id: 'dg_strat_virulent_creeping',
    label: 'CREEPING BLIGHT — Repetir impacto+herida vs Afflicted (1CP)',
    description: 'Virulent Vectorium: contra unidades Afflicted, repetir tiradas de impacto y herida hasta el final de la fase de disparo',
    factionId: 'DG',
    detachmentId: '000001049',
    combatType: 'ranged',
    isStratagem: true,
    cpCost: 1,
    effects: { rerollAllHits: true, rerollAllWounds: true },
  },

  // ── DG · Death Lord's Chosen (000001054) — Estratagemas ──────────────────

  {
    id: 'dg_strat_deathlord_grim',
    label: 'GRIM REAPERS — Repetir impactos CàC (1CP)',
    description: "Death Lord's Chosen: Terminators repiten tiradas de impacto vs unidades que no sean MONSTER ni VEHICLE hasta el final de la fase de lucha",
    factionId: 'DG',
    detachmentId: '000001054',
    combatType: 'melee',
    isStratagem: true,
    cpCost: 1,
    effects: { rerollAllHits: true },
  },

  // ── DG · Flyblown Host (000000980) — Estratagemas ────────────────────────

  {
    id: 'dg_strat_flyblown_droning',
    label: 'DRONING HORROR — Repetir impactos de 1 disparo (1CP)',
    description: 'Flyblown Host: repetir tiradas de impacto de 1 en disparo (y tiradas de impacto completas a medio alcance) hasta el final de la fase',
    factionId: 'DG',
    detachmentId: '000000980',
    combatType: 'ranged',
    isStratagem: true,
    cpCost: 1,
    effects: { rerollHitsOf1: true },
  },
  {
    id: 'dg_strat_flyblown_myphitic',
    label: 'MYPHITIC INVIGORATION — −1 a herir defensor (1CP)',
    description: 'Flyblown Host: −1 a herir si la Fuerza del ataque supera la Resistencia de la unidad Death Guard Infantry (junto a Myphitic Blight-hauler) (como defensor)',
    factionId: 'DG',
    detachmentId: '000000980',
    combatType: 'ranged',
    target: 'defender',
    isStratagem: true,
    cpCost: 1,
    effects: { woundMod: -1 },
  },

  // ── DG · Arch-Contaminators (000000932) — Estratagemas ───────────────────

  {
    id: 'dg_strat_arch_cloud',
    label: 'CLOUD OF FLIES — −1 a impactar defensor (1CP)',
    description: 'Arch-Contaminators: −1 a las tiradas de impacto de los ataques contra esta unidad hasta el final del turno (como defensor)',
    factionId: 'DG',
    detachmentId: '000000932',
    target: 'defender',
    isStratagem: true,
    cpCost: 1,
    effects: { hitMod: -1 },
  },

  // ── DG · Tallyband Summoners (000001052) — Estratagemas ──────────────────

  {
    id: 'dg_strat_tallyband_clutching',
    label: 'CLUTCHING CORRUPTION — Repetir impactos CàC (1CP)',
    description: 'Tallyband Summoners: repetir tiradas de impacto contra objetivos en Engagement Range de Plague Legions hasta el final de la fase de lucha',
    factionId: 'DG',
    detachmentId: '000001052',
    combatType: 'melee',
    isStratagem: true,
    cpCost: 1,
    effects: { rerollAllHits: true },
  },

  // ══════════════════════════════════════════════════════════════════════════
  // TYRANIDS — Reglas de Ejército
  // ══════════════════════════════════════════════════════════════════════════

  {
    id: 'tyr_synapse',
    label: 'Rango de Sinapse (+1 F CàC)',
    description: '+1 a la característica de Fuerza en ataques CàC mientras la unidad esté en rango de Sinapse',
    factionId: 'TYR',
    combatType: 'melee',
    effects: { strengthMod: 1 },
  },

  // ── TYR · Crusher Stampede (000000769) — Estratagemas ────────────────────

  {
    id: 'tyr_strat_crusher_rampaging',
    label: 'RAMPAGING MONSTROSITIES — Repetir impactos CàC (1CP)',
    description: 'Crusher Stampede: unidad Monster Tyranids repite todas las tiradas de impacto en CàC hasta el final de la fase de lucha',
    factionId: 'TYR',
    detachmentId: '000000769',
    combatType: 'melee',
    isStratagem: true,
    cpCost: 1,
    effects: { rerollAllHits: true },
  },
  {
    id: 'tyr_strat_crusher_savage',
    label: 'SAVAGE ROAR — −1 a impactar (y herir) defensor (1CP)',
    description: 'Crusher Stampede: los ataques CàC contra el Monster sufren −1 a impactar; si pasan el Battle-shock test, también −1 a herir (como defensor)',
    factionId: 'TYR',
    detachmentId: '000000769',
    combatType: 'melee',
    target: 'defender',
    isStratagem: true,
    cpCost: 1,
    effects: { hitMod: -1, woundMod: -1 },
  },

  // ── TYR · Assimilation Swarm (000000771) — Estratagemas ──────────────────

  {
    id: 'tyr_strat_assimilation_secure',
    label: 'SECURE BIOMASS — Lethal Hits + Crítico 5+ Harvester (1CP)',
    description: 'Assimilation Swarm: armas CàC ganan [LETHAL HITS]; si es Harvester, impacto de 5+ también cuenta como Crítico hasta el final de la fase',
    factionId: 'TYR',
    detachmentId: '000000771',
    combatType: 'melee',
    isStratagem: true,
    cpCost: 1,
    effects: { lethalHitsBonus: true, critThreshold: 5 },
  },
  {
    id: 'tyr_strat_assimilation_carapace',
    label: 'ABLATIVE CARAPACE — FNP 5+ defensor (2CP)',
    description: 'Assimilation Swarm: Harvester gana Feel No Pain 5+ (o 4+ en objetivo controlado) hasta el final de la fase (como defensor)',
    factionId: 'TYR',
    detachmentId: '000000771',
    target: 'defender',
    isStratagem: true,
    cpCost: 2,
    effects: { feelNoPainThreshold: 5 },
  },

  // ── TYR · Invasion Fleet (000000748) — Estratagemas ──────────────────────

  {
    id: 'tyr_strat_invasion_adrenal',
    label: 'ADRENAL SURGE — Crítico en 5+ CàC (2CP)',
    description: 'Invasion Fleet: impacto sin modificar de 5+ cuenta como Crítico para unidades dentro de Rango de Sinapse hasta el final de la fase de lucha',
    factionId: 'TYR',
    detachmentId: '000000748',
    combatType: 'melee',
    isStratagem: true,
    cpCost: 2,
    effects: { critThreshold: 5 },
  },
  {
    id: 'tyr_strat_invasion_rapid',
    label: 'RAPID REGENERATION — FNP 5+ defensor (1CP)',
    description: 'Invasion Fleet: Feel No Pain 5+ si está en rango de Sinapse (6+ fuera) hasta el final de la fase (como defensor)',
    factionId: 'TYR',
    detachmentId: '000000748',
    target: 'defender',
    isStratagem: true,
    cpCost: 1,
    effects: { feelNoPainThreshold: 5 },
  },

  // ── TYR · Synaptic Nexus (000000773) — Estratagemas ──────────────────────

  {
    id: 'tyr_strat_nexus_irresistible',
    label: 'IRRESISTIBLE WILL — Repetir 1s a impactar y herir (1CP)',
    description: 'Synaptic Nexus: modelos a 6" de la Synapse repiten impactos de 1 y heridas de 1 hasta el final de la fase',
    factionId: 'TYR',
    detachmentId: '000000773',
    isStratagem: true,
    cpCost: 1,
    effects: { rerollHitsOf1: true, rerollWoundsOf1: true },
  },
  {
    id: 'tyr_strat_nexus_reinforced',
    label: 'REINFORCED HIVE NODE — Empeora PA atacante (1CP)',
    description: 'Synaptic Nexus: la PA de los ataques contra la unidad Synapse empeora en 1 hasta el final de la fase (como defensor)',
    factionId: 'TYR',
    detachmentId: '000000773',
    target: 'defender',
    isStratagem: true,
    cpCost: 1,
    effects: { apMod: -1 },
  },

  // ── TYR · Tyranid Attack (000000973) — Estratagemas ──────────────────────

  {
    id: 'tyr_strat_tyranidattack_bioacid',
    label: 'BIO-ACID SURGE — Sustained Hits 1 CàC (1CP)',
    description: 'Tyranid Attack: armas CàC de la unidad dentro de Rango de Sinapse ganan [SUSTAINED HITS 1] hasta el final de la fase de lucha',
    factionId: 'TYR',
    detachmentId: '000000973',
    combatType: 'melee',
    isStratagem: true,
    cpCost: 1,
    effects: { sustainedHitsBonus: 1 },
  },

  // ── TYR · Warrior Bioform Onslaught (000000982) — Estratagemas ────────────

  {
    id: 'tyr_strat_warrior_amplification',
    label: 'SYNAPTIC AMPLIFICATION — Repetir 1s a impactar y herir (1CP)',
    description: 'Warrior Bioform Onslaught: Tyranid Warriors repiten impactos de 1 y heridas de 1; Endless Multitude cercanos repiten heridas de 1 hasta el final de la fase',
    factionId: 'TYR',
    detachmentId: '000000982',
    isStratagem: true,
    cpCost: 1,
    effects: { rerollHitsOf1: true, rerollWoundsOf1: true },
  },
  {
    id: 'tyr_strat_warrior_hypercorrosion_ranged',
    label: 'SPONTANEOUS HYPERCORROSION — +2F armas de disparo (1CP)',
    description: 'Warrior Bioform Onslaught: +2 Fuerza a armas de disparo Warriors y +1 Fuerza a armas CàC Warriors/Winged Tyranid Prime hasta el final de la fase',
    factionId: 'TYR',
    detachmentId: '000000982',
    combatType: 'ranged',
    isStratagem: true,
    cpCost: 1,
    effects: { strengthMod: 2 },
  },
  {
    id: 'tyr_strat_warrior_hypercorrosion_melee',
    label: 'SPONTANEOUS HYPERCORROSION — +1F armas CàC (1CP)',
    description: 'Warrior Bioform Onslaught: +1 Fuerza a armas CàC Warriors y Winged Tyranid Prime hasta el final de la fase de lucha',
    factionId: 'TYR',
    detachmentId: '000000982',
    combatType: 'melee',
    isStratagem: true,
    cpCost: 1,
    effects: { strengthMod: 1 },
  },
  {
    id: 'tyr_strat_warrior_shield',
    label: 'SYNAPTIC SHIELD — −1 a herir defensor (1CP)',
    description: 'Warrior Bioform Onslaught: −1 a herir en disparos si la Fuerza del ataque supera la Resistencia de la unidad Tyranid Warriors hasta el final de la fase (como defensor)',
    factionId: 'TYR',
    detachmentId: '000000982',
    combatType: 'ranged',
    target: 'defender',
    isStratagem: true,
    cpCost: 1,
    effects: { woundMod: -1 },
  },

  // ── TYR · Biotide (000000975) — Estratagemas ─────────────────────────────

  {
    id: 'tyr_strat_biotide_swarm',
    label: 'SWARM HUNTERS — Repetir impactos disparo (1CP)',
    description: 'Biotide: Termagants dentro de Rango de Sinapse repiten tiradas de impacto en disparo hasta el final de la fase',
    factionId: 'TYR',
    detachmentId: '000000975',
    combatType: 'ranged',
    isStratagem: true,
    cpCost: 1,
    effects: { rerollAllHits: true },
  },
  {
    id: 'tyr_strat_biotide_onrushing',
    label: 'ONRUSHING HORDE — −1 a impactar defensor (1CP)',
    description: 'Biotide: −1 a las tiradas de impacto de los disparos contra esta unidad hasta el final de la fase de disparo (como defensor)',
    factionId: 'TYR',
    detachmentId: '000000975',
    combatType: 'ranged',
    target: 'defender',
    isStratagem: true,
    cpCost: 1,
    effects: { hitMod: -1 },
  },

  // ── TYR · Unending Swarm (000000770) — Estratagemas ──────────────────────

  {
    id: 'tyr_strat_unending_swarming',
    label: 'SWARMING MASSES — Sustained Hits 1 + Crítico 5+ si 15+ (1CP)',
    description: 'Unending Swarm: Endless Multitude gana [SUSTAINED HITS 1] y, si tiene 15+ modelos, impacto de 5+ también cuenta como Crítico hasta el final de la fase',
    factionId: 'TYR',
    detachmentId: '000000770',
    isStratagem: true,
    cpCost: 1,
    effects: { sustainedHitsBonus: 1, critThreshold: 5 },
  },
  {
    id: 'tyr_strat_unending_teeming',
    label: 'TEEMING MASSES — −1 a impactar defensor (1CP)',
    description: 'Unending Swarm: −1 a las tiradas de impacto de los ataques contra esta unidad Endless Multitude hasta el final de la fase (como defensor)',
    factionId: 'TYR',
    detachmentId: '000000770',
    target: 'defender',
    isStratagem: true,
    cpCost: 1,
    effects: { hitMod: -1 },
  },

  // ── TYR · Vanguard Onslaught (000000772) — Estratagemas ───────────────────

  {
    id: 'tyr_strat_vanguard_surprise',
    label: 'SURPRISE ASSAULT — +1 a impactar (1CP)',
    description: 'Vanguard Onslaught: +1 a impactar contra el objetivo; si el objetivo falla el Battle-shock test, también +1 a herir hasta el final de la fase',
    factionId: 'TYR',
    detachmentId: '000000772',
    isStratagem: true,
    cpCost: 1,
    effects: { hitMod: 1, woundMod: 1 },
  },

]
