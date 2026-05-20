#!/usr/bin/env python3
"""
Generate src/data/modifiers.ts from CSV data.
ALL factions, ALL detachments, stratagems + detachment abilities.
"""

import csv, re, sys
from collections import defaultdict

DATA_DIR = '/home/user/mathhamer/public/data'

# ─── CSV loaders ──────────────────────────────────────────────────────────────

def load_csv(filename):
    rows = []
    with open(f'{DATA_DIR}/{filename}', encoding='utf-8-sig') as f:
        for row in csv.DictReader(f, delimiter='|'):
            rows.append(row)
    return rows

def strip_html(s):
    s = re.sub(r'<[^>]+>', ' ', s or '')
    s = s.replace('&lt;', '<').replace('&gt;', '>').replace('&amp;', '&').replace('\xa0', ' ')
    return re.sub(r' +', ' ', s).strip()

def get_effect_text(desc_raw):
    """Return the EFFECT: section, or full text as fallback."""
    text = strip_html(desc_raw)
    m = re.search(r'EFFECT\s*:\s*(.*?)(?:RESULT\s*:|$)', text, re.DOTALL | re.IGNORECASE)
    return m.group(1).strip() if m else text

# ─── Effect detection ─────────────────────────────────────────────────────────

# Precompile patterns for speed
_re_hit_plus         = re.compile(r'add 1 to (the )?[Hh]it rolls?')
_re_hit_minus        = re.compile(r'(subtract 1 from|−1 to|-1 to) (the )?[Hh]it rolls?')
_re_reroll_all_hits  = re.compile(r're-roll (all |the |its |each )?[Hh]it rolls?(?! of 1)')
_re_reroll_hits_1    = re.compile(r're-roll (a |an |all )?[Hh]it rolls? of 1')
_re_crit5            = re.compile(r'unmodified [Hh]it roll of 5\+? scores? a [Cc]ritical [Hh]it'
                                   r'|unmodified [Hh]it roll (?:is|of) 5\+'
                                   r'|[Cc]ritical [Hh]it is scored on an unmodified [Hh]it roll of 5')
_re_wound_plus       = re.compile(r'add 1 to (the )?[Ww]ound rolls?')
_re_wound_minus      = re.compile(r'(subtract 1 from|−1 to|-1 to) (the )?[Ww]ound rolls?')
_re_reroll_all_wnds  = re.compile(r're-roll (all |the |its |each )?[Ww]ound rolls?(?! of 1)')
_re_reroll_wnds_1    = re.compile(r're-roll (a |an |all )?[Ww]ound rolls? of 1')
_re_ap_improve       = re.compile(r'[Ii]mprove the [Aa]rmour [Pp]enetration'
                                   r'|[Aa]rmour [Pp]enetration characteristic[^.]*?by 1(?! as well| instead)'
                                   r'|[Aa]rmour [Pp]enetration characteristics[^.]*?by 1')
_re_ap_improve2      = re.compile(r'[Aa]rmour [Pp]enetration characteristic[^.]*?by 2')
_re_ap_worsen        = re.compile(r'worsen the [Aa]rmour [Pp]enetration')
_re_lethal_gain      = re.compile(r'(?:weapons?|unit|models?).{0,50}(?:have|gain|has).{0,20}\[LETHAL HITS\]'
                                   r'|\[LETHAL HITS\].{0,50}(?:ability|are)')
_re_sustained1_gain  = re.compile(r'(?:weapons?|unit|models?).{0,50}(?:have|gain|has).{0,20}\[SUSTAINED HITS 1\]'
                                   r'|\[SUSTAINED HITS 1\].{0,50}(?:ability|are)')
_re_sustained2_gain  = re.compile(r'(?:weapons?|unit|models?).{0,50}(?:have|gain|has).{0,20}\[SUSTAINED HITS 2\]'
                                   r'|\[SUSTAINED HITS 2\].{0,50}(?:ability|are)')
_re_dmg_reduce       = re.compile(r'subtract 1 from the [Dd]amage characteristic'
                                   r'|[Dd]amage characteristic[^.]*?reduced by 1')
_re_dmg_plus         = re.compile(r'add 1 to the [Dd]amage characteristic'
                                   r'|[Ii]ncrease[^.]*?[Dd]amage characteristic[^.]*?by 1')
_re_str_plus1_ranged = re.compile(r'add 1 to the [Ss]trength characteristic of (?:ranged )?weapons'
                                   r'|add 1 to the [Ss]trength characteristic of that attack')
_re_str_plus2_ranged = re.compile(r'add 2 to the [Ss]trength characteristic of (?:ranged )?weapons'
                                   r'|add 2 to the [Ss]trength characteristic of that attack')
_re_str_plus1_melee  = re.compile(r'add 1 to the [Ss]trength characteristic of melee weapons')
_re_str_plus2_melee  = re.compile(r'add 2 to the [Ss]trength characteristic of melee weapons')
_re_save_plus        = re.compile(r'add 1 to (the )?saving throws?')


def detect_effects(effect_text, full_text=''):
    e = effect_text
    effects = {}

    # Hit roll modifier
    if _re_hit_plus.search(e):
        effects['hitMod'] = 1
    elif _re_hit_minus.search(e):
        effects['hitMod'] = -1

    # Reroll hits — check for "of 1" first to avoid overlap
    if _re_reroll_hits_1.search(e):
        effects['rerollHitsOf1'] = True
    elif _re_reroll_all_hits.search(e):
        effects['rerollAllHits'] = True

    # Crit threshold
    if _re_crit5.search(e):
        effects['critThreshold'] = 5

    # Wound roll modifier
    if _re_wound_plus.search(e):
        effects['woundMod'] = 1
    elif _re_wound_minus.search(e):
        effects['woundMod'] = -1

    # Reroll wounds — check "of 1" first
    if _re_reroll_wnds_1.search(e):
        effects['rerollWoundsOf1'] = True
    elif _re_reroll_all_wnds.search(e):
        effects['rerollAllWounds'] = True

    # AP
    if _re_ap_worsen.search(e):
        effects['apMod'] = -1
    elif _re_ap_improve2.search(e):
        effects['apMod'] = 2
    elif _re_ap_improve.search(e):
        effects['apMod'] = 1

    # Lethal Hits
    if _re_lethal_gain.search(e):
        effects['lethalHitsBonus'] = True

    # Sustained Hits
    if _re_sustained2_gain.search(e):
        effects['sustainedHitsBonus'] = 2
    elif _re_sustained1_gain.search(e):
        effects['sustainedHitsBonus'] = 1

    # Feel No Pain — skip mortal wound / psychic only variants
    fnp_text = e
    # Remove "against mortal wounds" clauses to avoid false positives
    fnp_text = re.sub(r'[Ff]eel [Nn]o [Pp]ain \d\+.{0,60}(mortal wounds?|psychic attack)', '', fnp_text)
    fnp_m = re.search(r'[Ff]eel [Nn]o [Pp]ain (\d)\+', fnp_text)
    if fnp_m:
        threshold = int(fnp_m.group(1))
        # Only accept 4–6 range
        if 4 <= threshold <= 6:
            effects['feelNoPainThreshold'] = threshold

    # Damage reduction
    if _re_dmg_reduce.search(e):
        effects['damageReduction'] = 1

    # Damage bonus
    if _re_dmg_plus.search(e):
        effects['damageMod'] = 1

    # Strength bonus (detect highest applicable bonus, ranged wins for mixed)
    if _re_str_plus2_melee.search(e):
        effects['strengthMod'] = 2
        if 'meleeOnly_str' not in effects:
            effects['_meleeOnlyStr'] = True
    elif _re_str_plus1_melee.search(e):
        effects['strengthMod'] = 1
        effects['_meleeOnlyStr'] = True
    if _re_str_plus2_ranged.search(e):
        effects['strengthMod'] = 2
        effects.pop('_meleeOnlyStr', None)
    elif _re_str_plus1_ranged.search(e) and 'strengthMod' not in effects:
        effects['strengthMod'] = 1

    # Cover/save bonus
    if _re_save_plus.search(e):
        effects['saveMod'] = -1

    # Clean up internal markers
    effects.pop('_meleeOnlyStr', None)

    return effects


# ─── Combat type detection ────────────────────────────────────────────────────

def detect_combat_type(phase, effect_text):
    """Return 'ranged', 'melee', or None (any)."""
    pl = (phase or '').lower()
    el = effect_text.lower()

    has_shoot = 'shooting' in pl
    has_fight = 'fight' in pl

    if has_shoot and not has_fight:
        return 'ranged'
    if has_fight and not has_shoot:
        return 'melee'

    # From effect text keywords
    if re.search(r'\branged weapons?\b', el):
        return 'ranged'
    if re.search(r'\bmelee weapons?\b', el):
        return 'melee'

    return None


def detect_target(effect_text):
    """Return 'attacker' or 'defender'."""
    el = effect_text.lower()

    # Defender indicators
    if re.search(r'subtract 1 from the damage characteristic', el):
        return 'defender'
    if re.search(r'worsen the armour penetration', el):
        return 'defender'
    if re.search(r'\bfeel no pain\b', el):
        return 'defender'
    if re.search(r'add 1 to (the )?saving throws?', el):
        return 'defender'
    if re.search(r'(each time|when) an attack (targets|is allocated to|is made against)', el):
        return 'defender'
    if re.search(r'attacks (that target|targeting) (your|this) unit', el):
        return 'defender'

    return 'attacker'


# ─── "Choose either A or B" splitting ────────────────────────────────────────

def is_choice_strat(effect_text):
    """True if the stratagem gives a choice between LETHAL HITS and SUSTAINED HITS."""
    e = effect_text
    if re.search(r'[Ss]elect (?:either|one of the following)', e) and \
       re.search(r'\[LETHAL HITS\]', e) and re.search(r'\[SUSTAINED HITS', e):
        return True
    return False


# ─── ID generation ────────────────────────────────────────────────────────────

def slugify(s):
    return re.sub(r'[^a-z0-9]+', '_', s.lower()).strip('_')[:40]

def make_base_id(faction_id, name):
    fid = slugify(faction_id)
    return f"{fid}_{slugify(name)}"


# ─── Phase filtering ──────────────────────────────────────────────────────────

SKIP_PHASES = {
    'movement phase', 'command phase', 'charge phase',
    'movement or charge phase', 'charge or fight phase',
    'command or fight phase',
}

def is_combat_phase(phase):
    return (phase or '').lower() not in SKIP_PHASES


# ─── Human-readable label ─────────────────────────────────────────────────────

def effects_label(effects, combat_type):
    parts = []
    if effects.get('hitMod', 0) > 0:
        parts.append(f"+{effects['hitMod']} impactar")
    elif effects.get('hitMod', 0) < 0:
        parts.append(f"{effects['hitMod']} impactar")
    if effects.get('rerollAllHits'):
        parts.append("repetir impactos")
    if effects.get('rerollHitsOf1'):
        parts.append("repetir impactos 1")
    if effects.get('critThreshold') == 5:
        parts.append("crítico 5+")
    if effects.get('woundMod', 0) > 0:
        parts.append(f"+{effects['woundMod']} herir")
    elif effects.get('woundMod', 0) < 0:
        parts.append(f"{effects['woundMod']} herir")
    if effects.get('rerollAllWounds'):
        parts.append("repetir heridas")
    if effects.get('rerollWoundsOf1'):
        parts.append("repetir heridas 1")
    ap = effects.get('apMod', 0)
    if ap > 0:
        parts.append(f"+{ap} PA")
    elif ap < 0:
        parts.append("empeora PA atacante")
    if effects.get('lethalHitsBonus'):
        parts.append("Lethal Hits")
    sh = effects.get('sustainedHitsBonus', 0)
    if sh > 0:
        parts.append(f"Sustained Hits {sh}")
    fnp = effects.get('feelNoPainThreshold')
    if fnp:
        parts.append(f"FNP {fnp}+")
    dr = effects.get('damageReduction', 0)
    if dr > 0:
        parts.append(f"−{dr} daño")
    dm = effects.get('damageMod', 0)
    if dm > 0:
        parts.append(f"+{dm} daño")
    sm = effects.get('strengthMod', 0)
    if sm > 0:
        parts.append(f"+{sm} F")
    if effects.get('saveMod', 0) < 0:
        parts.append("+1 salvación")
    if combat_type == 'ranged':
        parts.append('disparo')
    elif combat_type == 'melee':
        parts.append('CàC')
    return ', '.join(parts) if parts else 'modificador'


# ─── Main builder ─────────────────────────────────────────────────────────────

def build_rules():
    stratagems = load_csv('Stratagems.csv')
    det_abilities = load_csv('Detachment_abilities.csv')

    rules = []
    seen_ids = set()

    def unique_id(base):
        rid = base
        n = 2
        while rid in seen_ids:
            rid = f"{base}_{n}"
            n += 1
        seen_ids.add(rid)
        return rid

    # ── 1. Universal ──────────────────────────────────────────────────────────
    rules += [
        {
            'id': 'cover',
            'label': 'Cobertura (+1 Sv defensor)',
            'description': 'El defensor está en cobertura: +1 a las tiradas de salvación contra ataques de disparo.',
            'combatType': 'ranged',
            'target': 'defender',
            'effects': {'saveMod': -1},
        },
        {
            'id': 'weapon_heavy',
            'label': 'Arma Pesada (Heavy) — se movió este turno (−1 impactar)',
            'description': 'El portador de un arma con la regla [HEAVY] se ha movido este turno: −1 a impactar.',
            'combatType': 'ranged',
            'target': 'attacker',
            'effects': {'hitMod': -1},
        },
    ]

    # ── 2. Detachment abilities ───────────────────────────────────────────────
    for da in det_abilities:
        fid = da['faction_id']
        if not fid:
            continue
        full_text = strip_html(da['description'])
        effects = detect_effects(full_text, full_text)
        if not effects:
            continue

        combat_type = detect_combat_type('', full_text)
        target = detect_target(full_text)
        det_id = da['detachment_id'] or ''

        base = make_base_id(fid, da['name'])
        rule_id = unique_id(base)
        lbl = f"{da['name']} — {effects_label(effects, combat_type)}"
        desc = full_text[:300]

        rule = {
            'id': rule_id, 'label': lbl, 'description': desc,
            'factionId': fid, 'target': target, 'effects': effects,
        }
        if det_id:
            rule['detachmentId'] = det_id
        if combat_type:
            rule['combatType'] = combat_type
        rules.append(rule)

    # ── 3. Stratagems ─────────────────────────────────────────────────────────
    for s in stratagems:
        fid = s['faction_id']
        if not fid or fid in ('', 'rapid elimination. '):
            continue
        phase = s['phase'] or ''
        if not is_combat_phase(phase):
            continue

        desc_raw = s['description'] or ''
        eff_text = get_effect_text(desc_raw)
        cp_cost = int(s['cp_cost']) if (s['cp_cost'] or '').strip().isdigit() else 1
        det_id = s['detachment_id'] or ''
        det_name = s['detachment'] or ''
        strat_name = s['name'] or ''

        combat_type = detect_combat_type(phase, eff_text)
        target = detect_target(eff_text)
        base = make_base_id(fid, strat_name)

        # Handle "choose either LETHAL HITS or SUSTAINED HITS" stratagems
        if is_choice_strat(eff_text):
            base_effects = detect_effects(eff_text)
            base_effects.pop('lethalHitsBonus', None)
            base_effects.pop('sustainedHitsBonus', None)
            for sfx, lbl_sfx, extra in [
                ('_lh', '[Lethal Hits]', {'lethalHitsBonus': True}),
                ('_sh', '[Sustained Hits 1]', {'sustainedHitsBonus': 1}),
            ]:
                combined = {**base_effects, **extra}
                rule_id = unique_id(base + sfx)
                rule = {
                    'id': rule_id,
                    'label': f"{strat_name} {lbl_sfx} ({cp_cost}CP)",
                    'description': (f"{det_name}: " if det_name else '') + eff_text[:250],
                    'factionId': fid, 'isStratagem': True, 'cpCost': cp_cost,
                    'target': target, 'effects': combined,
                }
                if det_id: rule['detachmentId'] = det_id
                if combat_type: rule['combatType'] = combat_type
                rules.append(rule)
            continue

        effects = detect_effects(eff_text)
        if not effects:
            continue

        rule_id = unique_id(base)
        lbl = f"{strat_name} — {effects_label(effects, combat_type)} ({cp_cost}CP)"
        desc = (f"{det_name}: " if det_name else '') + eff_text[:250]

        rule = {
            'id': rule_id, 'label': lbl, 'description': desc,
            'factionId': fid, 'isStratagem': True, 'cpCost': cp_cost,
            'target': target, 'effects': effects,
        }
        if det_id: rule['detachmentId'] = det_id
        if combat_type: rule['combatType'] = combat_type
        rules.append(rule)

    return rules


# ─── TypeScript emitter ───────────────────────────────────────────────────────

def ts_str(s):
    if s is None:
        return 'undefined'
    s = str(s).replace('\\', '\\\\').replace("'", "\\'")
    s = re.sub(r'[\n\r]+', ' ', s).strip()
    return f"'{s}'"

def emit_effects(effects):
    INT_FIELDS = ['hitMod', 'woundMod', 'apMod', 'saveMod', 'strengthMod',
                  'damageMod', 'damageReduction', 'sustainedHitsBonus',
                  'critThreshold', 'feelNoPainThreshold']
    BOOL_FIELDS = ['rerollHitsOf1', 'rerollAllHits', 'rerollWoundsOf1',
                   'rerollAllWounds', 'lethalHitsBonus']
    parts = []
    for f in INT_FIELDS:
        if f in effects:
            parts.append(f'    {f}: {effects[f]}')
    for f in BOOL_FIELDS:
        if f in effects:
            parts.append(f'    {f}: {str(effects[f]).lower()}')
    return '{\n' + ',\n'.join(parts) + ',\n  }'

def emit_rule(r):
    lines = ['  {']
    lines.append(f"    id: {ts_str(r['id'])},")
    lines.append(f"    label: {ts_str(r['label'])},")
    if r.get('description'):
        lines.append(f"    description: {ts_str(r['description'])},")
    if r.get('factionId'):
        lines.append(f"    factionId: {ts_str(r['factionId'])},")
    if r.get('detachmentId'):
        lines.append(f"    detachmentId: {ts_str(r['detachmentId'])},")
    if r.get('combatType'):
        lines.append(f"    combatType: {ts_str(r['combatType'])},")
    if r.get('target') and r['target'] != 'attacker':
        lines.append(f"    target: {ts_str(r['target'])},")
    if r.get('isStratagem'):
        lines.append('    isStratagem: true,')
    if r.get('cpCost'):
        lines.append(f"    cpCost: {r['cpCost']},")
    lines.append(f"    effects: {emit_effects(r['effects'])},")
    lines.append('  }')
    return '\n'.join(lines)

def generate_ts(rules):
    by_faction = defaultdict(list)
    universal = []
    for r in rules:
        (by_faction[r['factionId']] if r.get('factionId') else universal).append(r)

    lines = ["import type { ModifierRule } from '@/types'\n",
             "export const MODIFIER_RULES: ModifierRule[] = [",
             "  // ═══ Universal ═══"]
    for r in universal:
        lines.append(emit_rule(r) + ',')
    for fid in sorted(by_faction):
        lines.append(f"\n  // ═══ {fid} ═══")
        for r in by_faction[fid]:
            lines.append(emit_rule(r) + ',')
    lines.append("]\n")
    return '\n'.join(lines)


# ─── Entry point ─────────────────────────────────────────────────────────────

if __name__ == '__main__':
    rules = build_rules()
    ts = generate_ts(rules)
    out = '/home/user/mathhamer/src/data/modifiers.ts'
    with open(out, 'w', encoding='utf-8') as f:
        f.write(ts)
    print(f"Generated {len(rules)} rules → {out}", file=sys.stderr)

    from collections import Counter
    factions = Counter(r.get('factionId', 'universal') for r in rules)
    for fid, cnt in sorted(factions.items()):
        print(f"  {fid}: {cnt}", file=sys.stderr)
