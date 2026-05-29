import type { Weapon, ModelProfile, DamageBreakdown, CombatModifiers, ModifierRule } from '@/types'

export function getBlastMinAttacks(targetModels: number): number {
  if (targetModels >= 11) return 6
  if (targetModels >= 5)  return 3
  return 0
}

export function parseDiceAverageBlast(expr: string, minAttacks: number): number {
  if (minAttacks <= 0) return parseDiceAverage(expr)
  const s = expr.trim().toUpperCase()
  const match = s.match(/^(\d*)D(\d+)([+-]\d+)?$/)
  if (!match) {
    const fixed = parseFloat(s)
    return isNaN(fixed) ? Math.max(1, minAttacks) : Math.max(fixed, minAttacks)
  }
  const coeff = match[1] ? parseInt(match[1]) : 1
  const faces = parseInt(match[2])
  const bonus = match[3] ? parseInt(match[3]) : 0
  // DP: dp[k] = number of ways to roll sum k with `coeff` dice of `faces` sides
  let dp: number[] = new Array(coeff * faces + 1).fill(0)
  dp[0] = 1
  for (let d = 0; d < coeff; d++) {
    const next: number[] = new Array(coeff * faces + 1).fill(0)
    for (let s2 = 0; s2 <= coeff * faces; s2++) {
      if (dp[s2] === 0) continue
      for (let face = 1; face <= faces; face++) {
        next[s2 + face] += dp[s2]
      }
    }
    dp = next
  }
  const total = faces ** coeff
  let expected = 0
  for (let k = coeff; k <= coeff * faces; k++) {
    expected += Math.max(k + bonus, minAttacks) * dp[k]
  }
  return expected / total
}

export function parseDiceAverageWithReroll(expr: string, rerollAll: boolean, rerollOf1: boolean): number {
  const base = parseDiceAverage(expr)
  if (!rerollAll && !rerollOf1) return base
  const s = expr.trim().toUpperCase()
  const match = s.match(/^(\d*)D(\d+)([+-]\d+)?$/)
  if (!match) return base  // fixed damage value, reroll irrelevant
  const coeff = match[1] ? parseInt(match[1]) : 1
  const faces = parseInt(match[2])
  const bonus = match[3] ? parseInt(match[3]) : 0
  const baseAvg = (1 + faces) / 2
  // E[max(X,Y)] = (faces+1)*(4*faces-1) / (6*faces)
  if (rerollAll) return coeff * (faces + 1) * (4 * faces - 1) / (6 * faces) + bonus
  // E[X | reroll 1s] = baseAvg + (baseAvg - 1) / faces
  return coeff * (baseAvg + (baseAvg - 1) / faces) + bonus
}

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
  critThreshold: 6,
  strengthMod: 0,
  woundMod: 0,
  rerollWoundsOf1: false,
  rerollAllWounds: false,
  lethalHitsBonus: false,
  sustainedHitsBonus: 0,
  apMod: 0,
  saveMod: 0,
  attacksMod: 0,
  damageMod: 0,
  damageReduction: 0,
  rerollDamageOf1: false,
  rerollAllDamage: false,
  feelNoPainThreshold: null,
  woundCritThreshold: 7,
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
    if (e.attacksMod)          result.attacksMod          += e.attacksMod
    if (e.damageMod)           result.damageMod           += e.damageMod
    if (e.damageReduction)     result.damageReduction     += e.damageReduction
    if (e.rerollHitsOf1)       result.rerollHitsOf1        = true
    if (e.rerollAllHits)       result.rerollAllHits        = true
    if (e.rerollWoundsOf1)     result.rerollWoundsOf1      = true
    if (e.rerollAllWounds)     result.rerollAllWounds      = true
    if (e.rerollDamageOf1)     result.rerollDamageOf1      = true
    if (e.rerollAllDamage)     result.rerollAllDamage      = true
    if (e.lethalHitsBonus)     result.lethalHitsBonus      = true
    if (e.sustainedHitsBonus)  result.sustainedHitsBonus   = Math.max(result.sustainedHitsBonus, e.sustainedHitsBonus)
    if (e.critThreshold != null) result.critThreshold           = Math.min(result.critThreshold, e.critThreshold)
    if (e.woundCritThreshold != null) result.woundCritThreshold = Math.min(result.woundCritThreshold, e.woundCritThreshold)
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
    attacksMod:         base.attacksMod         + attackerRuleMods.attacksMod,
    damageMod:          base.damageMod          + attackerRuleMods.damageMod          + defenderRuleMods.damageMod,
    damageReduction:    base.damageReduction    + attackerRuleMods.damageReduction    + defenderRuleMods.damageReduction,
    rerollHitsOf1:      base.rerollHitsOf1      || attackerRuleMods.rerollHitsOf1,
    rerollAllHits:      base.rerollAllHits      || attackerRuleMods.rerollAllHits,
    rerollWoundsOf1:    base.rerollWoundsOf1    || attackerRuleMods.rerollWoundsOf1,
    rerollAllWounds:    base.rerollAllWounds    || attackerRuleMods.rerollAllWounds,
    rerollDamageOf1:    base.rerollDamageOf1    || attackerRuleMods.rerollDamageOf1,
    rerollAllDamage:    base.rerollAllDamage    || attackerRuleMods.rerollAllDamage,
    lethalHitsBonus:    base.lethalHitsBonus    || attackerRuleMods.lethalHitsBonus,
    sustainedHitsBonus: Math.max(base.sustainedHitsBonus, attackerRuleMods.sustainedHitsBonus),
    critThreshold:      Math.min(base.critThreshold, attackerRuleMods.critThreshold),
    woundCritThreshold: Math.min(base.woundCritThreshold, attackerRuleMods.woundCritThreshold),
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
  defenderKeywords: string[] = [],
  blastTargetModels: number = 0,
): DamageBreakdown {
  const blastMin = weapon.isBlast ? getBlastMinAttacks(blastTargetModels) : 0
  const avgAttacks = (blastMin > 0
    ? parseDiceAverageBlast(weapon.A, blastMin)
    : parseDiceAverage(weapon.A)) + mods.attacksMod
  const pHit        = weapon.isTorrent ? 1 : hitProbabilityWithMods(weapon.bsWs, mods)
  const effectiveMods = weapon.isTwinLinked
    ? { ...mods, rerollAllWounds: true }
    : mods
  const pWound      = woundProbabilityWithMods(weapon.S, defenderModel.T, effectiveMods)
  // apMod > 0 = attacker improves AP (more penetrating), < 0 = defender reduces AP (AoC).
  // Clamp to 0: AP can't become positive (AoC on AP 0 weapon has no further benefit).
  // saveMod (cover) is applied separately — it directly shifts the save threshold,
  // so it works even at AP 0 (cover still helps against non-penetrating attacks).
  const apAdjusted  = Math.min(0, weapon.AP - mods.apMod)
  const effectiveAP = apAdjusted - mods.saveMod
  const pFailSave   = saveFailProbability(defenderModel.Sv, defenderModel.invSv, effectiveAP)

  const CRIT       = (7 - mods.critThreshold) / 6   // 1/6 normally, 2/6 when crits on 5+
  const isLethal   = weapon.isLethalHits || mods.lethalHitsBonus
  const sustainedX = weapon.sustainedHitsValue + mods.sustainedHitsBonus
  const sustainedExtraHits = sustainedX > 0 ? avgAttacks * CRIT * sustainedX : 0

  // Determinar umbral efectivo de herida crítica ANTI:
  // tomar el mínimo entre lo que ofrecen los modificadores y las entradas ANTI del arma vs defensor
  let effectiveWoundCritThreshold = mods.woundCritThreshold
  if (weapon.antiEntries.length > 0 && defenderKeywords.length > 0) {
    const defKwLower = defenderKeywords.map(k => k.toLowerCase())
    for (const entry of weapon.antiEntries) {
      if (defKwLower.includes(entry.keyword)) {
        effectiveWoundCritThreshold = Math.min(effectiveWoundCritThreshold, entry.threshold)
      }
    }
  }
  const hasWoundCrit = effectiveWoundCritThreshold <= 6
  const WOUND_CRIT   = hasWoundCrit
    ? Math.min(5 / 6, Math.max(1 / 6, (7 - effectiveWoundCritThreshold) / 6))
    : 0

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

  // Heridas críticas ANTI: tiradas de herida >= umbral cuentan como críticas.
  // Sin Devastating Wounds: pasan por salvación normalmente (sin impacto en daño esperado).
  // Con Devastating Wounds: esquivan salvación → se cuentan como woundsSkippingSave.
  const antiCritWounds = hasWoundCrit
    ? (isLethal
        ? avgAttacks * Math.max(0, pHit - CRIT) * WOUND_CRIT  // solo hits no-lethal van a tirada de herida
        : expectedHits * WOUND_CRIT)
    : 0

  let expectedFailedSaves: number
  if (weapon.isDevastatingWounds && hasWoundCrit) {
    const woundsSkippingSave = autoWoundsFromCrits + antiCritWounds
    const woundsNeedingSave  = expectedWounds - autoWoundsFromCrits - antiCritWounds
    expectedFailedSaves = woundsSkippingSave + Math.max(0, woundsNeedingSave) * pFailSave
  } else {
    expectedFailedSaves = expectedWounds * pFailSave
  }

  const rawDmg        = parseDiceAverageWithReroll(weapon.D, effectiveMods.rerollAllDamage, effectiveMods.rerollDamageOf1) + effectiveMods.damageMod
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
    blastMinAttacks: blastMin > 0 ? blastMin : undefined,
    hitProbability: pHit,
    expectedHits,
    sustainedExtraHits,
    woundProbability: pWound,
    expectedWounds,
    autoWoundsFromCrits,
    antiCritWounds,
    saveFailProbability: pFailSave,
    expectedFailedSaves,
    avgDamagePerWound: avgDmgPerWound,
    expectedTotalDamage,
    expectedKills: expectedTotalDamage / (defenderModel.W || 1),
    effectiveAP: effectiveAP,
  }
}
