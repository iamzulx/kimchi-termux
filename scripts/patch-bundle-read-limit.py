#!/usr/bin/env python3
"""Apply read-tool description patch to built kimchi-bundle.mjs (post-build)."""
import sys

BUNDLE = sys.argv[1] if len(sys.argv) > 1 else "/data/data/com.termux/files/home/kimchi/dist/kimchi-bundle.mjs"

with open(BUNDLE, "r", encoding="utf-8") as f:
    s = f.read()

replacements = [
    (
        "When you need the full file, continue with offset until complete.",
        "By default, read the FULL file without limit. Only use offset+limit for files over 2000 lines.",
    ),
    (
        "Maximum number of lines to read (omit this parameter to read the full file - the system handles truncation)",
        "Maximum number of lines to read. Omit this param to read the full file — the system handles truncation at 2000 lines.",
    ),
]

changed = 0
for old, new in replacements:
    if old in s:
        s = s.replace(old, new, 1)
        changed += 1

if changed == 0 and "By default, read the FULL file" in s:
    print("already patched:", BUNDLE)
    sys.exit(0)

if "By default, read the FULL file" not in s and changed == 0:
    print("ERROR: no patterns matched — bundle layout may have changed", file=sys.stderr)
    sys.exit(1)

with open(BUNDLE, "w", encoding="utf-8") as f:
    f.write(s)
print(f"patched {changed} pattern(s) in {BUNDLE}")