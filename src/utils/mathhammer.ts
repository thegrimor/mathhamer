import type { Weapon, ModelProfile, DamageBreakdown, CombatModifiers, ModifierRule } from '@/types'

export function parseDiceAverage(expr: string): number {
  const s = expr.trim().toUpperCase()
  const match = s.match(/^(\d*)D(\d+)([+-]\d+)?$/)
  if (match) {
    const coeff = match[1] ? parseInt(match[1]) : 1
    const faces = parseInt(match[2])
    const bonus = match[3] ? parseInt(match[3]) : 0
    return coeff * ((1 + faces) / 2) + bonus
  }
  const fixed = parseFloat(s)
  return isNaN(fixed) ? 1 : fixed
}

export function parseStat(stat: string): number | null {
  if (!stat || stat.trim() === '' || stat.trim() === '-') return null
  const match = stat.trim().match(/^(\d+)\+?$/)
  return match ? parseInt(match[1]) : null
}

export function hitProbabilityWithMods(bsWs: string, mods: CombatModifiers): number {
  if (bsWs.trim() === '*') return 1
  const val = parseStat(bsWs)
  if (val === null) return 0
  const effectiveBs = val - mods.hitMod
  const baseP = Math.min(5 / 6, Math.max(1 / 6, (7 - effectiveBs) / 6))
  if (mods.rerollAllHits)  return baseP + (1 - baseP) * baseP
  if (mods.rerollHitsOf1)  return baseP + (1 / 6) * baseP
  return baseP
}

export function woundProbability(S: number, T: number): number {
  if (S >= T * 2) return 5 / 6
  if (S > T)      return 4 / 6
  if (S === T)    return 3 / 6
  if (S * 2 <= T) return 1 / 6
  return 2 / 6
}

export function woundProbabilityWithMods(S: number, T: number, mods: CombatModifiers): number {
  const effectiveS = S + mods.strengthMod + mods.woundMod
  const baseP = woundProbability(effectiveS, T)
  if (mods.rerollAllWounds)  return baseP + (1 - baseP) * baseP
  if (mods.rerollWoundsOf1)  return baseP + (1 / 6) * baseP
  return baseP
}

export function saveFailProbability(svRaw: string, invSvRaw: string, AP: number): number {
  const svVal = parseStat(svRaw)
  const invSvVal = invSvRaw ? parseStat(invSvRaw) : null
  const degradedSv = svVal !== null ? svVal - AP : null
  let bestThreshold: number | null = null
  if (degradedSv !== null && degradedSv <= 6) bestThreshold = degradedSv
  if (invSvVal !== null && invSvVal <= 6) {
    if (bestThreshold === null || invSvVal < bestThreshold) bestThreshold = invSvVal
  }
  if (bestThreshold === null || bestThreshold > 6) return 1.0
  return Math.min(1, Math.max(1 / 6, (bestThreshold - 1) / 6))
}

export const DEFAULT_MODS: CombatModifiers = {
  hitMod: 0,
  rerollHitsOf1: false,
  rerollAllHits: false,
  strengthMod: 0,
  woundMod: 0,
  rerollWoundsOf1: false,
  rerollAllWounds: false,
  lethalHitsBonus: false,
  sustainedHitsBonus: 0,
  apMod: 0,
  saveMod: 0,
  damageMod: 0,
  damageReduction: 0,
  feelNoPainThreshold: null,
}

export function resolveModifiers(activeIds: string[], rules: ModifierRule[]): CombatModifiers {
  const result = { ...DEFAULT_MODS }
  for (const id of activeIds) {
    const rule = rules.find(r => r.id === id)
    if (!rule) continue
    const e = rule.effects
    if (e.hitMod)              result.hitMod              += e.hitMod
    if (e.woundMod)            result.woundMod            += e.woundMod
    if (e.apMod)               result.apMod               += e.apMod
    if (e.saveMod)             result.saveMod             += e.saveMod
    if (e.strengthMod)         result.strengthMod         += e.strengthMod
    if (e.damageMod)           result.damageMod           += e.damageMod
    if (e.damageReduction)     result.damageReduction     += e.damageReduction
    if (e.rerollHitsOf1)       result.rerollHitsOf1        = true
    if (e.rerollAllHits)       result.rerollAllHits        = true
    if (e.rerollWoundsOf1)     result.rerollWoundsOf1      = true
    if (e.rerollAllWounds)     result.rerollAllWounds      = true
    if (e.lethalHitsBonus)     result.lethalHitsBonus      = true
    if (e.sustainedHitsBonus)  result.sustainedHitsBonus   = Math.max(result.sustainedHitsBonus, e.sustainedHitsBonus)
    if (e.feelNoPainThreshold != null) {
      result.feelNoPainThreshold = result.feelNoPainThreshold === null
        ? e.feelNoPainThreshold
        : Math.min(result.feelNoPainThreshold, e.feelNoPainThreshold)
    }
  }
  return result
}

export function mergeMods(
  base: CombatModifiers,
  attackerRuleMods: CombatModifiers,
  defenderRuleMods: CombatModifiers,
): CombatModifiers {
  return {
    hitMod:             base.hitMod             + attackerRuleMods.hitMod             + defenderRuleMods.hitMod,
    woundMod:           base.woundMod           + attackerRuleMods.woundMod           + defenderRuleMods.woundMod,
    apMod:              base.apMod              + attackerRuleMods.apMod              + defenderRuleMods.apMod,
    saveMod:            base.saveMod            + attackerRuleMods.saveMod            + defenderRuleMods.saveMod,
    strengthMod:        base.strengthMod        + attackerRuleMods.strengthMod        + defenderRuleMods.strengthMod,
    damageMod:          base.damageMod          + attackerRuleMods.damageMod          + defenderRuleMods.damageMod,
    damageReduction:    base.damageReduction    + attackerRuleMods.damageReduction    + defenderRuleMods.damageReduction,
    rerollHitsOf1:      base.rerollHitsOf1      || attackerRuleMods.rerollHitsOf1,
    rerollAllHits:      base.rerollAllHits      || attackerRuleMods.rerollAllHits,
    rerollWoundsOf1:    base.rerollWoundsOf1    || attackerRuleMods.rerollWoundsOf1,
    rerollAllWounds:    base.rerollAllWounds    || attackerRuleMods.rerollAllWounds,
    lethalHitsBonus:    base.lethalHitsBonus    || attackerRuleMods.lethalHitsBonus,
    sustainedHitsBonus: Math.max(base.sustainedHitsBonus, attackerRuleMods.sustainedHitsBonus),
    feelNoPainThreshold:
      defenderRuleMods.feelNoPainThreshold !== null
        ? defenderRuleMods.feelNoPainThreshold
        : base.feelNoPainThreshold,
  }
}

export function calculateDamage(
  weapon: Weapon,
  defenderModel: ModelProfile,
  mods: CombatModifiers = DEFAULT_MODS,
): DamageBreakdown {
  const avgAttacks  = parseDiceAverage(weapon.A)
  const pHit        = weapon.isTorrent ? 1 : hitProbabilityWithMods(weapon.bsWs, mods)
  const pWound      = woundProbabilityWithMods(weapon.S, defenderModel.T, mods)
  const effectiveAP = weapon.AP + mods.apMod + mods.saveMod
  const pFailSave   = saveFailProbability(defenderModel.Sv, defenderModel.invSv, effectiveAP)

  const CRIT       = 1 / 6
  const isLethal   = weapon.isLethalHits || mods.lethalHitsBonus
  const sustainedX = weapon.sustainedHitsValue + mods.sustainedHitsBonus
  const sustainedExtraHits = sustainedX > 0 ? avgAttacks * CRIT * sustainedX : 0

  let expectedHits: number
  let expectedWounds: number
  let autoWoundsFromCrits: number

  if (isLethal) {
    autoWoundsFromCrits  = avgAttacks * CRIT
    const normalHits     = avgAttacks * Math.max(0, pHit - CRIT) + sustainedExtraHits
    expectedHits         = avgAttacks * pHit + sustainedExtraHits
    expectedWounds       = autoWoundsFromCrits + normalHits * pWound
  } else {
    autoWoundsFromCrits  = 0
    expectedHits         = avgAttacks * pHit + sustainedExtraHits
    expectedWounds       = expectedHits * pWound
  }

  const expectedFailedSaves = expectedWounds * pFailSave
  const rawDmg        = parseDiceAverage(weapon.D) + mods.damageMod
  const avgDmgPerWound = mods.damageReduction > 0
    ? Math.max(rawDmg - mods.damageReduction, 1)
    : rawDmg
  const fnpP = mods.feelNoPainThreshold !== null
    ? Math.max(1 / 6, Math.min(5 / 6, (7 - mods.feelNoPainThreshold) / 6))
    : 0
  const expectedTotalDamage = expectedFailedSaves * avgDmgPerWound * (1 - fnpP)

  return {
    weaponName: weapon.name,
    avgAttacks,
    hitProbability: pHit,
    expectedHits,
    sustainedExtraHits,
    woundProbability: pWound,
    expectedWounds,
    autoWoundsFromCrits,
    saveFailProbability: pFailSave,
    expectedFailedSaves,
    avgDamagePerWound: avgDmgPerWound,
    expectedTotalDamage,
  }
}
