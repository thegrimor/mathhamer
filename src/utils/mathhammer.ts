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

  if (mods.rerollAllHits)  return baseP + (1 - baseP) * baseP  // p + miss*p
  if (mods.rerollHitsOf1)  return baseP + (1 / 6) * baseP      // p + (1/6)*p
  return baseP
}

// S vs T comparison — order matters: check S*2<=T before S<T
export function woundProbability(S: number, T: number): number {
  if (S >= T * 2) return 5 / 6   // 2+
  if (S > T)      return 4 / 6   // 3+
  if (S === T)    return 3 / 6   // 4+
  if (S * 2 <= T) return 1 / 6   // 6+ — must precede S < T
  return 2 / 6                   // 5+
}

// AP is stored as negative (e.g. -1). effectiveSv = svValue - AP
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

const DEFAULT_MODS: CombatModifiers = { hitMod: 0, rerollHitsOf1: false, rerollAllHits: false }

export function calculateDamage(
  weapon: Weapon,
  defenderModel: ModelProfile,
  mods: CombatModifiers = DEFAULT_MODS,
): DamageBreakdown {
  const avgAttacks      = parseDiceAverage(weapon.A)
  const pHit            = weapon.isTorrent ? 1 : hitProbabilityWithMods(weapon.bsWs, mods)
  const pWound          = woundProbability(weapon.S, defenderModel.T)
  const pFailSave       = saveFailProbability(defenderModel.Sv, defenderModel.invSv, weapon.AP)
  const avgDmgPerWound  = parseDiceAverage(weapon.D)

  const CRIT = 1 / 6  // P(natural 6) per attack — always crits
  const sustainedX = weapon.sustainedHitsValue

  // Sustained Hits: each crit generates X extra hits
  const sustainedExtraHits = sustainedX > 0 ? avgAttacks * CRIT * sustainedX : 0

  let expectedHits: number
  let expectedWounds: number
  let autoWoundsFromCrits: number

  if (weapon.isLethalHits) {
    // Crits (natural 6) auto-wound; non-crit hits + sustained extras use wound roll
    autoWoundsFromCrits = avgAttacks * CRIT
    const normalHitAttempts = avgAttacks * Math.max(0, pHit - CRIT) + sustainedExtraHits
    expectedHits   = avgAttacks * pHit + sustainedExtraHits
    expectedWounds = autoWoundsFromCrits + normalHitAttempts * pWound
  } else {
    autoWoundsFromCrits = 0
    expectedHits   = avgAttacks * pHit + sustainedExtraHits
    expectedWounds = expectedHits * pWound
  }

  const expectedFailedSaves  = expectedWounds * pFailSave
  const expectedTotalDamage  = expectedFailedSaves * avgDmgPerWound

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
