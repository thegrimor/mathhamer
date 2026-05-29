#!/usr/bin/env python3
"""
Fix weapon quantity mismatches in Datasheets_wargear.csv.

When a unit's loadout says "2 X cannons", there should be 2 entries for
"X cannon" in wargear so the calculator shows 2 selectable weapons.
"""

import csv
import re
import unicodedata
from collections import defaultdict

WARGEAR_CSV = "public/data/Datasheets_wargear.csv"

# Mismatches: (datasheet_id, weapon_name_from_loadout_normalized, total_qty_needed)
MISMATCHES = [
    ("000000040", "dread klaws", 2),
    ("000000042", "rokkit launchas", 2),
    ("000000042", "twin big shootas", 2),
    ("000000043", "rokkit launchas", 2),
    ("000000043", "twin big shootas", 2),
    ("000000057", "deffguns", 2),
    ("000000065", "godhammer lascannons", 2),
    ("000000067", "godhammer lascannon", 2),
    ("000000096", "heavy flamers", 2),
    ("000000096", "hunter-killer missiles", 3),
    ("000000113", "twin hellstrike launchers", 2),
    ("000000114", "krakstorm grenade launchers", 2),
    ("000000131", "grav-flux bombards", 2),
    ("000000139", "twin heavy bolters", 4),
    ("000000240", "hurricane bolters", 2),
    ("000000325", "skyhammer missile launchers", 2),
    ("000000407", "high-energy fusion blasters", 2),
    ("000000423", "twin pulse carbines", 2),
    ("000000424", "twin pulse carbines", 2),
    ("000000425", "seeker missiles", 2),
    ("000000426", "seeker missiles", 2),
    ("000000426", "twin ion rifles", 2),
    ("000000430", "twin pulse carbines", 2),
    ("000000432", "twin pulse carbines", 2),
    ("000000434", "twin smart missile system", 2),
    ("000000446", "pulse ordnance drivers", 3),
    ("000000446", "smart missile systems", 4),
    ("000000452", "remora seeker missiles", 2),
    ("000000453", "missile pods", 2),
    ("000000454", "ion cannons", 2),
    ("000000454", "missile pods", 2),
    ("000000455", "missile pods", 2),
    ("000000457", "long-barrelled burst cannon arrays", 2),
    ("000000457", "missile pods", 2),
    ("000000457", "ion cannons", 6),
    ("000000505", "dire bio-cannons", 2),
    ("000000554", "gauss flayer arrays", 2),
    ("000000564", "tesla cannons", 2),
    ("000000625", "twin pulse lasers", 2),
    ("000000626", "twin pulse lasers", 2),
    ("000000663", "macro-scalpels", 2),
    ("000000702", "lascannons", 2),
    ("000000702", "twin heavy flamers", 2),
    ("000000703", "twin heavy flamers", 2),
    ("000000704", "twin heavy flamers", 2),
    ("000000705", "twin heavy flamers", 2),
    ("000000706", "lascannons", 2),
    ("000000706", "twin heavy flamers", 2),
    ("000000707", "twin heavy flamers", 2),
    ("000000708", "lascannons", 2),
    ("000000708", "twin heavy flamers", 2),
    ("000000709", "twin heavy flamers", 2),
    ("000000751", "heavy bolters", 2),
    ("000000752", "heavy bolters", 7),
    ("000000763", "twin heavy bolters", 2),
    ("000000764", "multi-lasers", 7),
    ("000000767", "heavy bolters", 2),
    ("000000768", "twin heavy stubbers", 2),
    ("000000773", "heavy bolters", 2),
    ("000000773", "lascannons", 2),
    ("000000774", "heavy bolters", 2),
    ("000000780", "lascannons", 2),
    ("000000784", "multiple rocket pods", 2),
    ("000000860", "twin magna lascannons", 2),
    ("000000869", "ardex-defensor lascannons", 2),
    ("000000869", "ardex-defensor maulers", 2),
    ("000001099", "twin magna lascannons", 2),
    ("000001175", "heavy bolters", 4),
    ("000001179", "twin heavy bolters", 3),
    ("000001179", "twin lascannons", 4),
    ("000001184", "lascannons", 2),
    ("000001189", "lascannons", 2),
    ("000001197", "twin heavy bolters", 4),
    ("000001237", "hellstrike missiles", 2),
    ("000001321", "twin heavy bolters", 4),
    ("000001388", "twin big shootas", 2),
    ("000001388", "zzap guns", 2),
    ("000001485", "shieldbreaker missile launchers", 2),
    ("000001485", "twin meltaguns", 2),
    ("000001486", "shieldbreaker missile launchers", 2),
    ("000001486", "twin meltaguns", 2),
    ("000001533", "combi-bolters", 2),
    ("000001541", "twin big shootas", 2),
    ("000001564", "spiculus heavy bolt launchers", 2),
    ("000001564", "twin lastrum bolt cannons", 2),
    ("000001607", "twin volkite culverins", 2),
    ("000001609", "twin autocannons", 2),
    ("000001609", "twin hellstrike launchers", 2),
    ("000001651", "cognis heavy stubbers", 3),
    ("000001659", "gheiststrike missile launchers", 2),
    ("000001659", "twin daemonbreath meltaguns", 2),
    ("000001662", "twin conversion beam cannons", 2),
    ("000001664", "twin conversion beam cannons", 2),
    ("000001991", "combi-bolters", 2),
    ("000002077", "ardex-defensor maulers", 3),
    ("000002086", "heavy phosphor blasters", 2),
    ("000002484", "heavy bolters", 3),
    ("000002562", "war dog autocannons", 2),
    ("000002604", "twin bolt cannons", 2),
    ("000002704", "quad lascannons", 2),
    ("000002705", "storm bolters", 2),
    ("000002724", "twin heavy bolters", 4),
    ("000002787", "storm bolters", 2),
    ("000003585", "twin heavy bolters", 4),
    ("000003588", "twin heavy bolters", 4),
    ("000003591", "twin heavy bolters", 4),
    ("000003603", "combi-bolters", 2),
    ("000003604", "combi-bolters", 2),
    ("000003605", "combi-bolters", 2),
    ("000003606", "combi-bolters", 2),
    ("000003607", "twin volkite culverins", 2),
    ("000003608", "twin volkite culverins", 2),
    ("000003609", "twin volkite culverins", 2),
    ("000003610", "twin volkite culverins", 2),
    ("000003615", "twin autocannons", 2),
    ("000003615", "twin hellstrike launchers", 2),
    ("000003616", "twin autocannons", 2),
    ("000003616", "twin hellstrike launchers", 2),
    ("000003617", "twin autocannons", 2),
    ("000003617", "twin hellstrike launchers", 2),
    ("000003618", "twin autocannons", 2),
    ("000003618", "twin hellstrike launchers", 2),
    ("000003631", "heavy bolters", 4),
    ("000003632", "heavy bolters", 4),
    ("000003633", "heavy bolters", 4),
    ("000003634", "heavy bolters", 4),
    ("000003635", "twin heavy bolters", 3),
    ("000003635", "twin lascannons", 4),
    ("000003636", "twin heavy bolters", 3),
    ("000003636", "twin lascannons", 4),
    ("000003637", "twin heavy bolters", 3),
    ("000003637", "twin lascannons", 4),
    ("000003638", "twin heavy bolters", 3),
    ("000003638", "twin lascannons", 4),
    ("000003643", "lascannons", 2),
    ("000003644", "lascannons", 2),
    ("000003645", "lascannons", 2),
    ("000003646", "lascannons", 2),
    ("000003647", "grav-flux bombards", 2),
    ("000003648", "grav-flux bombards", 2),
    ("000003649", "grav-flux bombards", 2),
    ("000003650", "grav-flux bombards", 2),
    ("000003651", "quad lascannons", 2),
    ("000003652", "quad lascannons", 2),
    ("000003653", "quad lascannons", 2),
    ("000003654", "quad lascannons", 2),
    ("000003671", "twin hellstrike launchers", 2),
    ("000003672", "twin hellstrike launchers", 2),
    ("000003673", "twin hellstrike launchers", 2),
    ("000003674", "twin hellstrike launchers", 2),
    ("000003963", "lascannons", 2),
    ("000003963", "twin heavy flamers", 2),
    ("000003964", "twin heavy flamers", 2),
    ("000003965", "twin heavy flamers", 2),
    ("000003971", "twin heavy flamers", 2),
    ("000003973", "lascannons", 2),
    ("000003973", "twin heavy flamers", 2),
    ("000003989", "twin heavy flamers", 2),
    ("000003990", "lascannons", 2),
    ("000003990", "twin heavy flamers", 2),
    ("000003991", "twin heavy flamers", 2),
    ("000003994", "multi-lasers", 7),
    ("000004002", "heavy bolters", 2),
    ("000004006", "twin heavy stubbers", 2),
    ("000004016", "heavy bolters", 2),
    ("000004017", "heavy bolters", 7),
    ("000004029", "twin heavy bolters", 2),
    ("000004217", "prefectus heavy stubbers", 2),
]


def normalize(s: str) -> str:
    """Lowercase, remove punctuation, normalize unicode, collapse spaces."""
    s = unicodedata.normalize("NFC", s)
    s = s.lower().rstrip(".").strip()
    # Remove trailing 's' for simple plurals (cannons -> cannon, etc.)
    return re.sub(r"\s+", " ", s)


def singular(s: str) -> str:
    """Rough singular for matching plurals."""
    if s.endswith("ses"):
        return s[:-2]
    if s.endswith("s") and not s.endswith("ss"):
        return s[:-1]
    return s


def names_match(wargear_name: str, loadout_name: str) -> bool:
    """Check if a wargear weapon name matches a loadout weapon name."""
    wn = normalize(wargear_name)
    ln = normalize(loadout_name)
    if wn == ln:
        return True
    # Try singular forms
    if singular(wn) == singular(ln):
        return True
    # loadout name contained in wargear name (e.g. "lascannon" in "godhammer lascannon")
    if ln in wn or singular(ln) in wn:
        return True
    # Wargear name contained in loadout name
    if wn in ln or singular(wn) in ln:
        return True
    return False


def main():
    # Read full CSV preserving BOM and line endings
    with open(WARGEAR_CSV, "r", encoding="utf-8-sig", newline="") as f:
        raw_lines = f.readlines()

    # Parse into rows (keeping original lines for output)
    header_line = raw_lines[0]
    data_lines = raw_lines[1:]

    # Build index: datasheet_id -> list of (file_index, parsed_fields)
    ds_index: dict[str, list[tuple[int, list[str]]]] = defaultdict(list)
    for i, line in enumerate(data_lines):
        fields = line.rstrip("\n").split("|")
        if fields:
            ds_index[fields[0]].append((i, fields))

    # Build set of mismatches keyed by (ds_id, normalized_name) -> total_qty
    mismatch_map: dict[tuple[str, str], int] = {}
    for ds_id, weapon_norm, qty in MISMATCHES:
        mismatch_map[(ds_id, weapon_norm)] = qty

    # For each mismatch, find the matching wargear row and determine how many
    # copies to add
    new_rows: list[tuple[int, list[str]]] = []  # (insert_after_index, row_fields)
    unmatched: list[tuple[str, str, int]] = []

    for (ds_id, weapon_norm), total_qty in sorted(mismatch_map.items()):
        entries = ds_index.get(ds_id, [])
        # Count existing entries that match this weapon name
        matching = [(i, f) for i, f in entries if names_match(f[4] if len(f) > 4 else "", weapon_norm)]

        if not matching:
            unmatched.append((ds_id, weapon_norm, total_qty))
            continue

        existing_count = len(matching)
        needed = total_qty - existing_count
        if needed <= 0:
            continue  # Already has enough entries

        # Use the first matching entry as the template
        template_idx, template_fields = matching[0]

        # Find the highest existing line number for this datasheet
        max_line = max((int(f[1]) for _, f in entries if len(f) > 1 and f[1].isdigit()), default=0)

        for k in range(needed):
            new_line_num = max_line + k + 1
            new_fields = list(template_fields)
            new_fields[1] = str(new_line_num)
            new_rows.append((template_idx, new_fields))

        # Update max_line in ds_index so subsequent weapons for same ds get higher numbers
        # We do this by updating the "virtual" entries count
        for k in range(needed):
            ds_index[ds_id].append((-1, [ds_id, str(max_line + k + 1)] + template_fields[2:]))

    if unmatched:
        print("\n=== UNMATCHED (could not find weapon in wargear) ===")
        for ds_id, weapon_norm, qty in unmatched:
            print(f"  {ds_id}: '{weapon_norm}' (qty {qty})")

    # Sort new_rows by (datasheet_id, line_num) to insert in order
    # Group by insert position and rebuild the file
    # Strategy: append new rows for each datasheet after the last existing row for that ds

    # Build a map: ds_id -> list of new row lines to append after last existing row
    ds_new_rows: dict[str, list[str]] = defaultdict(list)
    for _, fields in new_rows:
        ds_id = fields[0]
        line = "|".join(fields)
        if not line.endswith("\n"):
            line += "\n"
        ds_new_rows[ds_id].append(line)

    # Find last line index for each datasheet in data_lines
    ds_last_idx: dict[str, int] = {}
    for i, line in enumerate(data_lines):
        fields = line.split("|")
        if fields and fields[0] in ds_new_rows:
            ds_last_idx[fields[0]] = i

    # Insert new rows after each datasheet's last existing line
    # Work backwards to avoid index shifting
    output_lines = list(data_lines)
    for ds_id, rows_to_add in sorted(ds_new_rows.items(), key=lambda x: ds_last_idx.get(x[0], -1), reverse=True):
        insert_after = ds_last_idx.get(ds_id, -1)
        if insert_after == -1:
            print(f"WARNING: no existing lines found for {ds_id}, skipping")
            continue
        for row in reversed(rows_to_add):
            output_lines.insert(insert_after + 1, row)

    # Write back
    with open(WARGEAR_CSV, "w", encoding="utf-8-sig", newline="") as f:
        f.write(header_line)
        f.writelines(output_lines)

    # Summary
    added = sum(len(v) for v in ds_new_rows.values())
    print(f"\n✓ Added {added} weapon entries across {len(ds_new_rows)} datasheets")
    print(f"  Unmatched (manual review needed): {len(unmatched)}")


if __name__ == "__main__":
    main()
