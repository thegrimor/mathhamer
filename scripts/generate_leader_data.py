#!/usr/bin/env python3
"""
Generate src/data/leaderFollowers.ts and src/data/unitLeaders.ts
from public/data/Datasheets_leader.csv.
"""

import csv
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).parent.parent
DATA_FILE = ROOT / 'public/data/Datasheets_leader.csv'
OUT_LEADER_FOLLOWERS = ROOT / 'src/data/leaderFollowers.ts'
OUT_UNIT_LEADERS = ROOT / 'src/data/unitLeaders.ts'


def load_relations():
    leader_followers: dict[str, set[str]] = defaultdict(set)
    unit_leaders: dict[str, set[str]] = defaultdict(set)

    with open(DATA_FILE, encoding='utf-8-sig') as f:
        for row in csv.DictReader(f, delimiter='|'):
            leader = row['leader_id'].strip()
            unit = row['attached_id'].strip()
            if leader and unit:
                leader_followers[leader].add(unit)
                unit_leaders[unit].add(leader)

    return leader_followers, unit_leaders


def write_ts(path: Path, const_name: str, comment: str, data: dict[str, set[str]]) -> None:
    lines = [
        f'// {comment}',
        f'export const {const_name}: Record<string, string[]> = {{',
    ]
    for key in sorted(data.keys()):
        values = sorted(data[key])
        vals_str = ', '.join(f"'{v}'" for v in values)
        lines.append(f"  '{key}': [{vals_str}],")
    lines.append('}')
    lines.append('')
    path.write_text('\n'.join(lines), encoding='utf-8')


def main():
    leader_followers, unit_leaders = load_relations()

    write_ts(
        OUT_LEADER_FOLLOWERS,
        'LEADER_FOLLOWERS',
        'leader_id → unit IDs this leader can join (generated from Datasheets_leader.csv)',
        leader_followers,
    )
    print(f'Written {len(leader_followers)} leaders → {OUT_LEADER_FOLLOWERS}')

    write_ts(
        OUT_UNIT_LEADERS,
        'UNIT_LEADERS',
        'unit_id → leader IDs that can be attached to this unit (generated from Datasheets_leader.csv)',
        unit_leaders,
    )
    print(f'Written {len(unit_leaders)} units → {OUT_UNIT_LEADERS}')


if __name__ == '__main__':
    main()
