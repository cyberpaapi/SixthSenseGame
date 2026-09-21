"""Apply reviewed answer exclusions/overrides without reordering or retiering survivors.

Run with --check in CI/builds. Unexpected sensitive definitions fail closed for
editorial review; this is a regression screen, not an automatic age rating.
"""
import argparse
import json
import re
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
POLICY = json.loads((ROOT / "scripts/answer_safety.json").read_text(encoding="utf-8"))
EXCLUDED = set(POLICY["excludedAnswers"])


def unsafe_clue(clue):
    return any(re.search(pattern, clue, re.I) for pattern in POLICY["blockedCluePatterns"])


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    path = ROOT / "answer-bank.js"
    source = path.read_text(encoding="utf-8")
    overrides = json.loads((ROOT / "scripts/clue_overrides.json").read_text(encoding="utf-8"))
    entries = [json.loads(raw) for raw in re.findall(r'^\s*(\{.+\}),?$', source, re.M)]
    cleaned, removed, changed, unresolved = [], [], [], []
    for entry in entries:
        word = entry["word"]
        if word in EXCLUDED:
            removed.append(word)
            continue
        clue = overrides.get(word, entry["clue"])
        if unsafe_clue(clue):
            unresolved.append(word)
        if clue != entry["clue"]:
            changed.append(word)
        cleaned.append({**entry, "clue": clue})
    if unresolved:
        raise SystemExit("Editorial review required: " + ", ".join(unresolved))
    if args.check and (removed or changed):
        raise SystemExit("Answer bank is stale; apply the reviewed safety policy")
    if not args.check:
        head = source.split("  return [", 1)[0]
        body = ",\n".join("    " + json.dumps(e, ensure_ascii=False) for e in cleaned)
        path.write_text(head + "  return [\n" + body + "\n  ];\n});\n", encoding="utf-8", newline="\n")
    print(json.dumps({"answers": len(cleaned), "tiers": dict(Counter(e["tier"] for e in cleaned)),
                      "removed": removed, "rewritten": changed}, indent=2))


if __name__ == "__main__":
    main()
