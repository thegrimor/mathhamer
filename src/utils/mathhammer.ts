import type { Weapon, ModelProfile, DamageBreakdown, CombatModifiers, ModifierRule } from '@/types'

// Abramowitz & Stegun approximation, max error < 1.5e-7
function erf(x: number): number {
  const t = 1 / (1 + 0.3275911 * Math.abs(x))
  const poly = t * (0.254829592 + t * (-0.284496736 + t * (1.421413741 + t * (-1.453152027 + t * 1.061405429))))
  const result = 1 - poly * Math.exp(-x * x)
  return x < 0 ? -result : result
}

function normalCDF(z: number): number {
  return (1 + erf(z / Math.sqrt(2))) / 2
}

// Variance of a dice expression, accounting for reroll mode.
// Formula for XdN: coeff × Var[single die]
// Bonus (+B) does not affect variance.
export function parseDiceVariance(expr: string, rerollAll = false, rerollOf1 = false): number {
  const s = expr.trim().toUpperCase()
  if (!s || s === '-') return 0
  const fixed = parseFloat(s)
  if (!isNaN(fixed)) return 0
  const match = s.match(/^(\d*)D(\d+)([+-]\d+)?$/)
  if (!match) return 0
  const coeff = match[1] ? parseInt(match[1]) : 1
  const N = parseInt(match[2])

  let varPerDie: number
  if (rerollAll) {
    // Die is max(X, Y) for X, Y ~ Uniform[1..N]
    // P(max = k) = (2k - 1) / N²
    let e = 0, e2 = 0
    for (let k = 1; k <= N; k++) {
      const p = (2 * k - 1) / (N * N)
      e  += k * p
      e2 += k * k * p
    }
    varPerDie = e2 - e * e
  } else if (rerollOf1) {
    // P(final = 1) = 1/N², P(final = k≥2) = (N+1)/N²
    const p1 = 1 / (N * N)
    const pk = (N + 1) / (N * N)
    let e = p1, e2 = p1
    for (let k = 2; k <= N; k++) {
      e  += k * pk
      e2 += k * k * pk
    }
    varPerDie = e2 - e * e
  } else {
    // Var[Uniform(1..N)] = (N² - 1) / 12
    varPerDie = (N * N - 1) / 12
  }
  return coeff * varPerDie
}

export function getBlastBonusAttacks(targetModels: number): number {
  return Math.floor(targetModels / 5)
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
  // Overwatch: la tirada base es siempre 6+, ignorando la HA/HP de la unidad
  const baseThreshold = mods.overwatchHit ? 6 : val
  const effectiveBs = baseThreshold - mods.hitMod
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
  overwatchHit: false,
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
    overwatchHit:       base.overwatchHit       || attackerRuleMods.overwatchHit,
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
  const blastBonus = weapon.isBlast ? getBlastBonusAttacks(blastTargetModels) : 0
  const avgAttacks = parseDiceAverage(weapon.A) + blastBonus + mods.attacksMod
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

  // ── Statistical spread (Gaussian approximation) ──────────────────────────────
  // Model: K failed saves ~ Binomial(avgAttacks, effectiveP), each dealing D damage.
  // Law of total variance: Var[T] = E[K]·Var[D] + Var[K]·(E[D])²
  const effectiveP = avgAttacks > 0 ? expectedFailedSaves / avgAttacks : 0
  const varK       = avgAttacks * effectiveP * (1 - effectiveP)
  const dVar       = parseDiceVariance(weapon.D, effectiveMods.rerollAllDamage, effectiveMods.rerollDamageOf1)
  const varBeforeFNP = expectedFailedSaves * dVar + varK * (avgDmgPerWound * avgDmgPerWound)
  // FNP applies Binomial thinning: each damage point independently negated with p = fnpP.
  // Var[T'] = E[T_raw]·fnpP·(1-fnpP) + Var[T_raw]·(1-fnpP)²
  const damageBeforeFNP = fnpP > 0 ? expectedTotalDamage / (1 - fnpP) : expectedTotalDamage
  const varFinal    = damageBeforeFNP * fnpP * (1 - fnpP) + varBeforeFNP * (1 - fnpP) * (1 - fnpP)
  const standardDeviation = Math.sqrt(Math.max(0, varFinal))

  const percentile10 = Math.max(0, expectedTotalDamage - 1.2816 * standardDeviation)
  const percentile90 = expectedTotalDamage + 1.2816 * standardDeviation

  // P(deal ≥ W damage to one defending model), with continuity correction
  const W = defenderModel.W || 1
  const killProbability = standardDeviation > 0
    ? 1 - normalCDF((W - 0.5 - expectedTotalDamage) / standardDeviation)
    : (expectedTotalDamage >= W ? 1 : 0)

  return {
    weaponName: weapon.name,
    avgAttacks,
    blastBonusAttacks: blastBonus > 0 ? blastBonus : undefined,
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
    standardDeviation,
    percentile10,
    percentile90,
    killProbability,
  }
}
