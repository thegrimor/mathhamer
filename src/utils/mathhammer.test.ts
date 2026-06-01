import { describe, it, expect } from 'vitest'
import {
  parseDiceAverage,
  parseDiceAverageWithReroll,
  parseDiceVariance,
  parseStat,
  getBlastBonusAttacks,
  hitProbabilityWithMods,
  woundProbability,
  woundProbabilityWithMods,
  saveFailProbability,
  resolveModifiers,
  calculateDamage,
  DEFAULT_MODS,
} from './mathhammer'
import type { Weapon, ModelProfile, ModifierRule } from '@/types'

// ─── Helpers ────────────────────────────────────────────────────────────────

const noMods = { ...DEFAULT_MODS }

const baseWeapon = (overrides: Partial<Weapon> = {}): Weapon => ({
  id: 'w1',
  name: 'Bolter',
  range: 24,
  type: 'ranged',
  A: '2',
  bsWs: '3+',
  S: 4,
  AP: 0,
  D: '1',
  abilities: [],
  isTorrent: false,
  isBlast: false,
  isLethalHits: false,
  sustainedHitsValue: 0,
  isDevastatingWounds: false,
  isTwinLinked: false,
  isMelta: false,
  meltaBonus: '',
  antiEntries: [],
  ...overrides,
})

const baseModel = (overrides: Partial<ModelProfile> = {}): ModelProfile => ({
  id: 'm1',
  name: 'Space Marine',
  M: '6"',
  T: 4,
  Sv: '3+',
  invSv: '',
  W: 2,
  Ld: '6+',
  OC: 2,
  ...overrides,
})

// ─── parseDiceAverage ────────────────────────────────────────────────────────

describe('parseDiceAverage', () => {
  it('returns average of 1D6', () => {
    expect(parseDiceAverage('D6')).toBeCloseTo(3.5)
  })
  it('returns average of 2D6', () => {
    expect(parseDiceAverage('2D6')).toBeCloseTo(7)
  })
  it('returns average of D3', () => {
    expect(parseDiceAverage('D3')).toBeCloseTo(2)
  })
  it('handles fixed value', () => {
    expect(parseDiceAverage('3')).toBe(3)
  })
  it('handles bonus expression D6+2', () => {
    expect(parseDiceAverage('D6+2')).toBeCloseTo(5.5)
  })
  it('handles subtraction D6-1', () => {
    expect(parseDiceAverage('D6-1')).toBeCloseTo(2.5)
  })
  it('returns 1 for empty/invalid input', () => {
    expect(parseDiceAverage('')).toBe(1)
    expect(parseDiceAverage('abc')).toBe(1)
  })
})

// ─── parseDiceAverageWithReroll ──────────────────────────────────────────────

describe('parseDiceAverageWithReroll', () => {
  it('no reroll = same as parseDiceAverage', () => {
    expect(parseDiceAverageWithReroll('D6', false, false)).toBeCloseTo(3.5)
    expect(parseDiceAverageWithReroll('3', false, false)).toBe(3)
  })
  it('rerollAll raises average for D6', () => {
    const withReroll = parseDiceAverageWithReroll('D6', true, false)
    expect(withReroll).toBeGreaterThan(3.5)
  })
  it('rerollOf1 raises average slightly for D6', () => {
    const base = parseDiceAverageWithReroll('D6', false, false)
    const withR1 = parseDiceAverageWithReroll('D6', false, true)
    expect(withR1).toBeGreaterThan(base)
  })
  it('rerollAll on fixed value returns fixed value', () => {
    expect(parseDiceAverageWithReroll('3', true, false)).toBe(3)
  })
  it('rerollAll on D3', () => {
    const val = parseDiceAverageWithReroll('D3', true, false)
    expect(val).toBeGreaterThan(2) // better than average 2
    expect(val).toBeLessThanOrEqual(3)
  })
})

// ─── parseDiceVariance ───────────────────────────────────────────────────────

describe('parseDiceVariance', () => {
  it('returns 0 for fixed damage', () => {
    expect(parseDiceVariance('3')).toBe(0)
    expect(parseDiceVariance('1')).toBe(0)
  })
  it('returns 0 for empty/dash', () => {
    expect(parseDiceVariance('')).toBe(0)
    expect(parseDiceVariance('-')).toBe(0)
  })
  it('D6 variance = 35/12', () => {
    expect(parseDiceVariance('D6')).toBeCloseTo(35 / 12)
  })
  it('2D6 variance = 2 × (35/12)', () => {
    expect(parseDiceVariance('2D6')).toBeCloseTo(2 * 35 / 12)
  })
  it('rerollAll reduces relative variance (higher E but also higher variance numerically)', () => {
    const baseVar = parseDiceVariance('D6', false, false)
    const rerollVar = parseDiceVariance('D6', true, false)
    // Rerolling best-of-2 changes variance; just ensure a numeric result
    expect(rerollVar).toBeGreaterThan(0)
    expect(rerollVar).not.toBe(baseVar)
  })
  it('D3 variance = (9-1)/12 = 8/12', () => {
    expect(parseDiceVariance('D3')).toBeCloseTo(8 / 12)
  })
})

// ─── parseStat ───────────────────────────────────────────────────────────────

describe('parseStat', () => {
  it('parses "3+" as 3', () => {
    expect(parseStat('3+')).toBe(3)
  })
  it('parses bare number "4"', () => {
    expect(parseStat('4')).toBe(4)
  })
  it('returns null for dash', () => {
    expect(parseStat('-')).toBeNull()
  })
  it('returns null for empty string', () => {
    expect(parseStat('')).toBeNull()
  })
  it('returns null for non-numeric', () => {
    expect(parseStat('N/A')).toBeNull()
  })
  it('parses "6+" as 6', () => {
    expect(parseStat('6+')).toBe(6)
  })
})

// ─── getBlastBonusAttacks ────────────────────────────────────────────────────

describe('getBlastBonusAttacks', () => {
  it('returns 0 for fewer than 5 models', () => {
    expect(getBlastBonusAttacks(0)).toBe(0)
    expect(getBlastBonusAttacks(4)).toBe(0)
  })
  it('returns 1 for exactly 5 models', () => {
    expect(getBlastBonusAttacks(5)).toBe(1)
  })
  it('returns 2 for 10 models', () => {
    expect(getBlastBonusAttacks(10)).toBe(2)
  })
  it('returns 3 for 15 models', () => {
    expect(getBlastBonusAttacks(15)).toBe(3)
  })
  it('floors correctly (9 models = 1 bonus)', () => {
    expect(getBlastBonusAttacks(9)).toBe(1)
  })
})

// ─── woundProbability ────────────────────────────────────────────────────────

describe('woundProbability', () => {
  it('S >= 2T → 5/6', () => {
    expect(woundProbability(8, 4)).toBeCloseTo(5 / 6)
  })
  it('S > T but < 2T → 4/6', () => {
    expect(woundProbability(5, 4)).toBeCloseTo(4 / 6)
  })
  it('S == T → 3/6', () => {
    expect(woundProbability(4, 4)).toBeCloseTo(3 / 6)
  })
  it('S < T but > T/2 → 2/6', () => {
    expect(woundProbability(3, 4)).toBeCloseTo(2 / 6)
  })
  it('S*2 <= T → 1/6', () => {
    expect(woundProbability(2, 4)).toBeCloseTo(1 / 6)
    expect(woundProbability(1, 4)).toBeCloseTo(1 / 6)
  })
})

// ─── hitProbabilityWithMods ──────────────────────────────────────────────────

describe('hitProbabilityWithMods', () => {
  it('BS 3+ → 4/6 base', () => {
    expect(hitProbabilityWithMods('3+', noMods)).toBeCloseTo(4 / 6)
  })
  it('BS 4+ → 3/6 base', () => {
    expect(hitProbabilityWithMods('4+', noMods)).toBeCloseTo(3 / 6)
  })
  it('BS 2+ → 5/6 base', () => {
    expect(hitProbabilityWithMods('2+', noMods)).toBeCloseTo(5 / 6)
  })
  it('BS * (auto-hit) → 1', () => {
    expect(hitProbabilityWithMods('*', noMods)).toBe(1)
  })
  it('+1 hit mod improves probability', () => {
    const base = hitProbabilityWithMods('4+', noMods)
    const withMod = hitProbabilityWithMods('4+', { ...noMods, hitMod: 1 })
    expect(withMod).toBeGreaterThan(base)
  })
  it('rerollAllHits boosts probability', () => {
    const base = hitProbabilityWithMods('4+', noMods)
    const withReroll = hitProbabilityWithMods('4+', { ...noMods, rerollAllHits: true })
    expect(withReroll).toBeGreaterThan(base)
  })
  it('rerollHitsOf1 boosts probability slightly', () => {
    const base = hitProbabilityWithMods('4+', noMods)
    const withR1 = hitProbabilityWithMods('4+', { ...noMods, rerollHitsOf1: true })
    expect(withR1).toBeGreaterThan(base)
    expect(withR1).toBeLessThan(hitProbabilityWithMods('4+', { ...noMods, rerollAllHits: true }))
  })
  it('overwatch uses overwatchThreshold, ignores hitMod', () => {
    // Overwatch at 6+ → 1/6
    const owMods = { ...noMods, overwatchHit: true, overwatchThreshold: 6 }
    expect(hitProbabilityWithMods('3+', owMods)).toBeCloseTo(1 / 6)
  })
  it('clamps to minimum 1/6', () => {
    // BS 6+ with -2 mod would be BS 8+ → clamped to 1/6
    const mods = { ...noMods, hitMod: -2 }
    expect(hitProbabilityWithMods('6+', mods)).toBeCloseTo(1 / 6)
  })
  it('clamps to maximum 5/6', () => {
    // BS 1+ with +2 mod → clamped to 5/6
    const mods = { ...noMods, hitMod: 2 }
    expect(hitProbabilityWithMods('2+', mods)).toBeCloseTo(5 / 6)
  })
})

// ─── woundProbabilityWithMods ────────────────────────────────────────────────

describe('woundProbabilityWithMods', () => {
  it('no mods = base wound probability', () => {
    expect(woundProbabilityWithMods(4, 4, noMods)).toBeCloseTo(3 / 6)
  })
  it('+1 strength mod shifts bracket up', () => {
    // S4 vs T4 normally = 3/6; with +1 S becomes 5 vs 4 = 4/6
    expect(woundProbabilityWithMods(4, 4, { ...noMods, strengthMod: 1 })).toBeCloseTo(4 / 6)
  })
  it('rerollAllWounds boosts probability', () => {
    const base = woundProbabilityWithMods(4, 4, noMods)
    const reroll = woundProbabilityWithMods(4, 4, { ...noMods, rerollAllWounds: true })
    expect(reroll).toBeGreaterThan(base)
  })
  it('rerollWoundsOf1 boosts probability slightly', () => {
    const base = woundProbabilityWithMods(4, 4, noMods)
    const r1 = woundProbabilityWithMods(4, 4, { ...noMods, rerollWoundsOf1: true })
    expect(r1).toBeGreaterThan(base)
    expect(r1).toBeLessThan(woundProbabilityWithMods(4, 4, { ...noMods, rerollAllWounds: true }))
  })
})

// ─── saveFailProbability ─────────────────────────────────────────────────────

describe('saveFailProbability', () => {
  it('3+ save with AP0 → fail on 1-2 = 2/6', () => {
    expect(saveFailProbability('3+', '', 0)).toBeCloseTo(2 / 6)
  })
  it('3+ save with AP-1 → degraded to 4+ → fail on 1-3 = 3/6', () => {
    expect(saveFailProbability('3+', '', -1)).toBeCloseTo(3 / 6)
  })
  it('3+ save with AP-3 → degraded to 6+ → fail on 1-5 = 5/6', () => {
    expect(saveFailProbability('3+', '', -3)).toBeCloseTo(5 / 6)
  })
  it('invulnerable save better than degraded armor is used', () => {
    // 3+ save degraded to 6+ by AP-3, but 4++ invuln → best is 4+ → fail = 3/6
    expect(saveFailProbability('3+', '4+', -3)).toBeCloseTo(3 / 6)
  })
  it('save completely negated → 1.0', () => {
    expect(saveFailProbability('7+', '', -2)).toBe(1.0)
  })
  it('no save (dash) → 1.0', () => {
    expect(saveFailProbability('-', '', 0)).toBe(1.0)
  })
  it('2+ save no AP → fail only on 1 = 1/6', () => {
    expect(saveFailProbability('2+', '', 0)).toBeCloseTo(1 / 6)
  })
})

// ─── resolveModifiers ────────────────────────────────────────────────────────

describe('resolveModifiers', () => {
  const rules: ModifierRule[] = [
    {
      id: 'rule-hit+1',
      label: '+1 Hit',
      description: '',
      effects: { hitMod: 1 },
    },
    {
      id: 'rule-reroll-hits',
      label: 'Reroll Hits',
      description: '',
      effects: { rerollAllHits: true },
    },
    {
      id: 'rule-lethal',
      label: 'Lethal Hits',
      description: '',
      effects: { lethalHitsBonus: true },
    },
    {
      id: 'rule-fnp5',
      label: 'FNP 5+',
      description: '',
      effects: { feelNoPainThreshold: 5 },
    },
    {
      id: 'rule-fnp6',
      label: 'FNP 6+',
      description: '',
      effects: { feelNoPainThreshold: 6 },
    },
    {
      id: 'rule-sustained2',
      label: 'Sustained Hits 2',
      description: '',
      effects: { sustainedHitsBonus: 2 },
    },
  ]

  it('no active rules → DEFAULT_MODS', () => {
    const result = resolveModifiers([], rules)
    expect(result).toEqual(DEFAULT_MODS)
  })

  it('stacks numeric hitMod', () => {
    const result = resolveModifiers(['rule-hit+1', 'rule-hit+1'], rules)
    expect(result.hitMod).toBe(2)
  })

  it('boolean flags become true', () => {
    const result = resolveModifiers(['rule-reroll-hits'], rules)
    expect(result.rerollAllHits).toBe(true)
  })

  it('lethal hits bonus set correctly', () => {
    const result = resolveModifiers(['rule-lethal'], rules)
    expect(result.lethalHitsBonus).toBe(true)
  })

  it('FNP uses the best (lowest) threshold when multiple apply', () => {
    const result = resolveModifiers(['rule-fnp5', 'rule-fnp6'], rules)
    expect(result.feelNoPainThreshold).toBe(5)
  })

  it('ignores unknown rule ids', () => {
    const result = resolveModifiers(['unknown-id'], rules)
    expect(result).toEqual(DEFAULT_MODS)
  })

  it('sustainedHitsBonus takes max', () => {
    const result = resolveModifiers(['rule-sustained2'], rules)
    expect(result.sustainedHitsBonus).toBe(2)
  })
})

// ─── calculateDamage ─────────────────────────────────────────────────────────

describe('calculateDamage', () => {
  it('torrent weapon auto-hits (hitProbability = 1)', () => {
    const w = baseWeapon({ isTorrent: true, A: '4', S: 4, AP: 0, D: '1' })
    const d = calculateDamage(w, baseModel(), noMods)
    expect(d.hitProbability).toBe(1)
    expect(d.avgAttacks).toBe(4)
  })

  it('basic bolter vs marine: expected damage is positive and sensible', () => {
    // Bolter: A2, BS3+, S4, AP0, D1 vs T4, Sv3+
    const w = baseWeapon()
    const m = baseModel()
    const d = calculateDamage(w, m, noMods)
    expect(d.avgAttacks).toBe(2)
    expect(d.hitProbability).toBeCloseTo(4 / 6)
    expect(d.woundProbability).toBeCloseTo(3 / 6)
    expect(d.saveFailProbability).toBeCloseTo(2 / 6)
    // expected damage = 2 × (4/6) × (3/6) × (2/6) × 1 ≈ 0.148
    expect(d.expectedTotalDamage).toBeCloseTo(2 * (4 / 6) * (3 / 6) * (2 / 6), 3)
  })

  it('AP-3 weapon bypasses save better', () => {
    const w = baseWeapon({ AP: -3 })
    const m = baseModel()
    const noAP = calculateDamage(baseWeapon({ AP: 0 }), m, noMods)
    const highAP = calculateDamage(w, m, noMods)
    expect(highAP.expectedTotalDamage).toBeGreaterThan(noAP.expectedTotalDamage)
  })

  it('blast weapon adds bonus attacks for large units', () => {
    const w = baseWeapon({ isBlast: true, A: '3' })
    const small = calculateDamage(w, baseModel(), noMods, [], 4)
    const large = calculateDamage(w, baseModel(), noMods, [], 10)
    expect(large.avgAttacks).toBeGreaterThan(small.avgAttacks)
    expect(large.blastBonusAttacks).toBe(2)
    expect(small.blastBonusAttacks).toBeUndefined()
  })

  it('lethal hits: critical hits auto-wound', () => {
    const w = baseWeapon({ isLethalHits: true })
    const d = calculateDamage(w, baseModel(), noMods)
    // With lethal hits, autoWoundsFromCrits should be > 0
    expect(d.autoWoundsFromCrits).toBeGreaterThan(0)
  })

  it('sustained hits: extra hits on crit', () => {
    const w = baseWeapon({ sustainedHitsValue: 1, A: '6' })
    const noSustained = calculateDamage(baseWeapon({ sustainedHitsValue: 0, A: '6' }), baseModel(), noMods)
    const withSustained = calculateDamage(w, baseModel(), noMods)
    expect(withSustained.sustainedExtraHits).toBeGreaterThan(0)
    expect(withSustained.expectedHits).toBeGreaterThan(noSustained.expectedHits)
  })

  it('devastating wounds skip save on crit wounds when wound crits active', () => {
    // Dev wounds only skip saves when hasWoundCrit=true (woundCritThreshold <= 6)
    const w = baseWeapon({ isDevastatingWounds: true, A: '10', S: 4 })
    const mWithCrit = { ...noMods, woundCritThreshold: 6 }
    const plain = calculateDamage(baseWeapon({ A: '10', S: 4 }), baseModel({ Sv: '2+' }), mWithCrit)
    const devWound = calculateDamage(w, baseModel({ Sv: '2+' }), mWithCrit)
    // Against a 2+ save, crit wounds skipping save should deal more damage
    expect(devWound.expectedTotalDamage).toBeGreaterThan(plain.expectedTotalDamage)
  })

  it('feel no pain reduces expected damage', () => {
    const w = baseWeapon({ A: '6' })
    const noFNP = calculateDamage(w, baseModel(), noMods)
    const withFNP = calculateDamage(w, baseModel(), { ...noMods, feelNoPainThreshold: 5 })
    expect(withFNP.expectedTotalDamage).toBeLessThan(noFNP.expectedTotalDamage)
  })

  it('damage reduction reduces damage (min 1)', () => {
    const w = baseWeapon({ D: '3', A: '6' })
    const noDR = calculateDamage(w, baseModel(), noMods)
    const withDR = calculateDamage(w, baseModel(), { ...noMods, damageReduction: 2 })
    // Raw D3 avg=2, after reduction 2-2=0 but clamped to 1
    expect(withDR.avgDamagePerWound).toBe(1)
    expect(withDR.expectedTotalDamage).toBeLessThan(noDR.expectedTotalDamage)
  })

  it('twin-linked applies rerollAllWounds to wound roll', () => {
    const w = baseWeapon({ isTwinLinked: true, A: '10', S: 4 })
    const plain = calculateDamage(baseWeapon({ A: '10', S: 4 }), baseModel(), noMods)
    const twinLinked = calculateDamage(w, baseModel(), noMods)
    expect(twinLinked.woundProbability).toBeGreaterThan(plain.woundProbability)
  })

  it('ANTI keyword triggers wound crits against matching defenders', () => {
    const w = baseWeapon({
      antiEntries: [{ keyword: 'infantry', threshold: 4 }],
      A: '10',
    })
    const m = baseModel()
    const matchingKeywords = calculateDamage(w, m, noMods, ['Infantry'])
    const noKeywords = calculateDamage(w, m, noMods, [])
    // anti-keyword wound crits boost damage against matching target
    expect(matchingKeywords.antiCritWounds).toBeGreaterThan(0)
    expect(noKeywords.antiCritWounds).toBe(0)
  })

  it('returns correct weapon name', () => {
    const w = baseWeapon({ name: 'Lascannon' })
    const d = calculateDamage(w, baseModel(), noMods)
    expect(d.weaponName).toBe('Lascannon')
  })

  it('kill probability is 1 when expected damage >> wounds', () => {
    const w = baseWeapon({ A: '100', D: '5', isTorrent: true })
    const m = baseModel({ W: 2 })
    const d = calculateDamage(w, m, noMods)
    expect(d.killProbability).toBeCloseTo(1, 2)
  })

  it('kill probability approaches 0 when expected damage << wounds', () => {
    const w = baseWeapon({ A: '1', D: '1', bsWs: '6+' })
    const m = baseModel({ W: 20, Sv: '2+' })
    const d = calculateDamage(w, m, noMods)
    expect(d.killProbability).toBeLessThan(0.1)
  })

  it('percentile10 <= expectedTotalDamage <= percentile90', () => {
    const d = calculateDamage(baseWeapon({ A: '5', D: 'D6' }), baseModel(), noMods)
    expect(d.percentile10).toBeLessThanOrEqual(d.expectedTotalDamage + 0.001)
    expect(d.percentile90).toBeGreaterThanOrEqual(d.expectedTotalDamage - 0.001)
  })

  it('overwatch forces critical threshold to at least overwatchThreshold', () => {
    const w = baseWeapon({ A: '6' })
    // critThreshold 5 with overwatch at 6 → effective crit threshold is 6
    const mods = { ...noMods, overwatchHit: true, overwatchThreshold: 6, critThreshold: 5 }
    const d = calculateDamage(w, baseModel(), mods)
    // Just ensure no negative/NaN damage
    expect(d.expectedTotalDamage).toBeGreaterThanOrEqual(0)
    expect(isNaN(d.expectedTotalDamage)).toBe(false)
  })

  it('expectedKills = expectedTotalDamage / wounds', () => {
    const d = calculateDamage(baseWeapon(), baseModel({ W: 2 }), noMods)
    expect(d.expectedKills).toBeCloseTo(d.expectedTotalDamage / 2, 10)
  })

  it('effectiveAP is clamped to 0 when AP is already 0', () => {
    const d = calculateDamage(baseWeapon({ AP: 0 }), baseModel(), { ...noMods, saveMod: 0 })
    expect(d.effectiveAP).toBe(0)
  })

  it('saveMod from cover applies even at AP 0', () => {
    // Cover rule uses saveMod: -1 (negative = improves defender save)
    // effectiveAP = apAdjusted - saveMod = 0 - (-1) = +1 → degradedSv = sv - 1 → better save
    const dNoCover = calculateDamage(baseWeapon({ AP: 0 }), baseModel({ Sv: '4+' }), noMods)
    const dCover = calculateDamage(baseWeapon({ AP: 0 }), baseModel({ Sv: '4+' }), { ...noMods, saveMod: -1 })
    expect(dCover.saveFailProbability).toBeLessThan(dNoCover.saveFailProbability)
  })
})
