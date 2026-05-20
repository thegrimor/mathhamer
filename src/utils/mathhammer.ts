import { MODIFIER_RULES } from '@/data/modifiers'
import type { Weapon, ModelProfile, DamageBreakdown, CombatModifiers } from '@/types'

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

// CSV stores BS_WS and inv_sv as plain numbers ("3") or "3+" — accept both
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
  // Clamp: natural 6 always hits (min 1/6), natural 1 always misses (max 5/6)
  const baseP = Math.min(5 / 6, Math.max(1 / 6, (7 - effectiveBs) / 6))

  if (mods.rerollAllHits)  return baseP + (1 - baseP) * baseP
  if (mods.rerollHitsOf1)  return baseP + (1 / 6) * baseP
  return baseP
}

// S vs T comparison — order matters: check S*2<=T before S<T
export function woundProbability(S: number, T: number): number {
  if (S >= T * 2) return 5 / 6   // 2+
  if (S > T)      return 4 / 6   // 3+
  if (S === T)    return 3 / 6   // 4+
  if (S * 2 <= T) return 1 / 6   // 6+
  return 2 / 6                   // 5+
}

// apMod: 1 = "+1 AP" = effectiveAP more negative = harder save.
// saveMod: positive = harder to save (Rattlejoint); negative = easier (cover).
export function saveFailProbability(
  svRaw: string,
  invSvRaw: string,
  AP: number,
  apMod = 0,
  saveMod = 0,
): number {
  const svVal = parseStat(svRaw)
  const invSvVal = invSvRaw ? parseStat(invSvRaw) : null

  const effectiveAP = AP - apMod
  const degradedSv = svVal !== null ? svVal - effectiveAP : null

  let bestThreshold: number | null = null
  if (degradedSv !== null && degradedSv <= 6) bestThreshold = degradedSv
  if (invSvVal !== null && invSvVal <= 6) {
    if (bestThreshold === null || invSvVal < bestThreshold) bestThreshold = invSvVal
  }

  if (bestThreshold === null) return 1.0
  const finalThreshold = bestThreshold + saveMod
  if (finalThreshold > 6) return 1.0
  return Math.min(1, Math.max(1 / 6, (finalThreshold - 1) / 6))
}

export const DEFAULT_MODS: CombatModifiers = {
  hitMod: 0,
  rerollHitsOf1: false,
  rerollAllHits: false,
  critThreshold: 6,
  sustainedHitsBonus: 0,
  lethalHitsBonus: false,
  strengthMod: 0,
  rerollWoundsOf1: false,
  rerollAllWounds: false,
  woundMod: 0,
  apMod: 0,
  saveMod: 0,
  damageReduction: 0,
  feelNoPainThreshold: null,
}

export function resolveModifiers(
  activeIds: Set<string>,
  weapon: Weapon | null,
  factionId: string | null,
  detachmentId: string | null,
): CombatModifiers {
  const result = { ...DEFAULT_MODS }

  for (const rule of MODIFIER_RULES) {
    if (!activeIds.has(rule.id)) continue
    if (rule.factionId && rule.factionId !== factionId) continue
    if (rule.detachmentId && rule.detachmentId !== detachmentId) continue

    const e = rule.effects
    if (e.hitMod !== undefined)             result.hitMod += e.hitMod
    if (e.rerollHitsOf1)                    result.rerollHitsOf1 = true
    if (e.rerollAllHits)                    result.rerollAllHits = true
    if (e.critThreshold !== undefined)      result.critThreshold = Math.min(result.critThreshold, e.critThreshold)
    if (e.sustainedHitsBonus !== undefined) result.sustainedHitsBonus += e.sustainedHitsBonus
    if (e.lethalHitsBonus)                  result.lethalHitsBonus = true
    if (e.strengthMod !== undefined)        result.strengthMod += e.strengthMod
    if (e.rerollWoundsOf1)                  result.rerollWoundsOf1 = true
    if (e.rerollAllWounds)                  result.rerollAllWounds = true
    if (e.woundMod !== undefined)           result.woundMod += e.woundMod
    if (e.apMod !== undefined)              result.apMod += e.apMod
    if (e.saveMod !== undefined)            result.saveMod += e.saveMod
    if (e.damageReduction !== undefined)    result.damageReduction += e.damageReduction
    if (e.feelNoPainThreshold != null) {
      result.feelNoPainThreshold = result.feelNoPainThreshold === null
        ? e.feelNoPainThreshold
        : Math.min(result.feelNoPainThreshold, e.feelNoPainThreshold)
    }
  }

  return result
}

export function calculateDamage(
  weapon: Weapon,
  defenderModel: ModelProfile,
  mods: CombatModifiers = DEFAULT_MODS,
): DamageBreakdown {
  const avgAttacks = parseDiceAverage(weapon.A)
  const CRIT_P = Math.min(5 / 6, Math.max(1 / 6, (7 - mods.critThreshold) / 6))

  const pHit = weapon.isTorrent ? 1 : hitProbabilityWithMods(weapon.bsWs, mods)

  const effectiveSustained = weapon.sustainedHitsValue + mods.sustainedHitsBonus
  const hasLethalHits = weapon.isLethalHits || mods.lethalHitsBonus

  const effectiveS = weapon.S + mods.strengthMod + mods.woundMod
  const pWoundBase = woundProbability(effectiveS, defenderModel.T)

  let pWound: number
  if (mods.rerollAllWounds)      pWound = pWoundBase + (1 - pWoundBase) * pWoundBase
  else if (mods.rerollWoundsOf1) pWound = pWoundBase + (1 / 6) * pWoundBase
  else                           pWound = pWoundBase

  const pFailSave = saveFailProbability(
    defenderModel.Sv, defenderModel.invSv, weapon.AP, mods.apMod, mods.saveMod,
  )

  const rawDmg = parseDiceAverage(weapon.D)
  const avgDmgPerWound = mods.damageReduction > 0
    ? Math.max(rawDmg - mods.damageReduction, 1)
    : rawDmg

  const fnpP = mods.feelNoPainThreshold !== null
    ? Math.max(1 / 6, Math.min(5 / 6, (7 - mods.feelNoPainThreshold) / 6))
    : 0

  const sustainedExtraHits = effectiveSustained > 0 ? avgAttacks * CRIT_P * effectiveSustained : 0

  let expectedHits: number
  let expectedWounds: number
  let autoWoundsFromCrits: number

  if (hasLethalHits) {
    autoWoundsFromCrits = avgAttacks * CRIT_P
    const normalHitAttempts = avgAttacks * Math.max(0, pHit - CRIT_P) + sustainedExtraHits
    expectedHits   = avgAttacks * pHit + sustainedExtraHits
    expectedWounds = autoWoundsFromCrits + normalHitAttempts * pWound
  } else {
    autoWoundsFromCrits = 0
    expectedHits   = avgAttacks * pHit + sustainedExtraHits
    expectedWounds = expectedHits * pWound
  }

  const expectedFailedSaves = expectedWounds * pFailSave
  const expectedTotalDamage  = expectedFailedSaves * avgDmgPerWound * (1 - fnpP)

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
