#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"
MOBILE="$ROOT/apps/mobile"
IOS_RES="$ROOT/apps/ios/StayPure/Resources"
BLOCKER_ASSETS="$MOBILE/modules/stay-pure-blocker/android/src/main/assets"
DATASOURCES="$MOBILE/src/core/data/datasources"

mkdir -p "$IOS_RES"

cp "$BLOCKER_ASSETS/blocklist.txt" "$IOS_RES/blocklist.txt"
cp "$BLOCKER_ASSETS/blocklist-strict.txt" "$IOS_RES/blocklist-strict.txt"

python3 << PY
import json, re, pathlib

def parse_ts_array(path):
    text = path.read_text()
    entries = []
    blocks = re.split(r"\n  \{\n", text)
    for block in blocks[1:]:
        def grab(key):
            m = re.search(rf"{key}: '((?:\\\\'|[^'])*)'", block)
            return m.group(1).replace("\\\\'", "'") if m else ''
        entries.append({
            'title': grab('title'),
            'author': grab('author'),
            'work': grab('work'),
            'scriptureRef': grab('scriptureRef'),
            'scriptureText': grab('scriptureText'),
            'reflection': grab('reflection'),
            'prayer': grab('prayer'),
        })
    return entries

out = pathlib.Path("$IOS_RES")
purity = parse_ts_array(pathlib.Path("$DATASOURCES/classicPurity.ts"))
spurgeon = parse_ts_array(pathlib.Path("$DATASOURCES/classicSpurgeon.ts"))
(out / 'purity-classics.json').write_text(json.dumps(purity, ensure_ascii=False, indent=2))
(out / 'spurgeon-mornings.json').write_text(json.dumps(spurgeon, ensure_ascii=False, indent=2))

vt = pathlib.Path("$DATASOURCES/InMemoryVerseRepository.ts").read_text()
verses = []
for m in re.finditer(r"\{\s*id: '([^']+)',\s*reference: '([^']+)',\s*text: '((?:\\\\'|[^'])*)',\s*invitation: '((?:\\\\'|[^'])*)',", vt, re.S):
    verses.append({
        'id': m.group(1),
        'reference': m.group(2),
        'text': m.group(3).replace("\\\\'", "'"),
        'invitation': m.group(4).replace("\\\\'", "'"),
    })
(out / 'purity-verses.json').write_text(json.dumps(verses, ensure_ascii=False, indent=2))
print('Synced iOS assets:', len(purity), 'purity,', len(spurgeon), 'spurgeon,', len(verses), 'verses')
PY
