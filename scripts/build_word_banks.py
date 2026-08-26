#!/usr/bin/env python3
"""Rebuild Sixth Sense's six-letter guess and answer banks.

The accepted-guess vocabulary is the six-letter subset of ENABLE, a
public-domain word-game lexicon that excludes ordinary proper names. Answers
are the 5,000 highest-frequency accepted words that have a usable WordNet
definition, minus a small answer-only safety list.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import subprocess
import sys
import urllib.request
from pathlib import Path

from nltk.corpus import wordnet as wn
from wordfreq import zipf_frequency


ENABLE_URL = "https://raw.githubusercontent.com/dolph/dictionary/master/enable1.txt"
ENABLE_SHA256 = "3f16130220645692ed49c7134e24a18504c2ca55b3c012f7290e3e77c63b1a89"
ANSWER_COUNT = 5_000
WORD_LENGTH = 6
REQUIRED_ANSWERS = {"raffle", "rattle"}

# These remain valid guesses but are intentionally not selected as puzzles.
ANSWER_ONLY_EXCLUSIONS = {
    "beaner",
    "bimbos",
    "bugger",
    "cialis",
    "coitus",
    "condom",
    "crotch",
    "darkie",
    "dildos",
    "dommes",
    "douche",
    "erotic",
    "escort",
    "eunuch",
    "faggot",
    "feltch",
    "femdom",
    "fetish",
    "fondle",
    "fucked",
    "fucker",
    "fuckin",
    "goddam",
    "goatcx",
    "goatse",
    "gokkun",
    "gringo",
    "hentai",
    "heroin",
    "herpes",
    "honkey",
    "hooker",
    "humvee",
    "inbred",
    "incest",
    "johnny",
    "lolita",
    "molest",
    "nambla",
    "nigger",
    "niggas",
    "nipple",
    "nudity",
    "nutten",
    "nympho",
    "orgasm",
    "orgies",
    "pecker",
    "penile",
    "pissed",
    "pisses",
    "pricks",
    "punany",
    "queers",
    "raping",
    "rapist",
    "rectal",
    "rectum",
    "reefer",
    "retard",
    "rimjob",
    "sadism",
    "sadist",
    "sexcam",
    "sexual",
    "shitty",
    "slutty",
    "snatch",
    "sodomy",
    "spooge",
    "tampon",
    "testes",
    "tosser",
    "tranny",
    "undies",
    "urinal",
    "uterus",
    "vagina",
    "viagra",
    "voyeur",
    "voyuer",
    "whored",
    "whores",
    "whitey",
}

PROPER_CLUE_PATTERNS = (
    r"\btrade name\b",
    r"\bthe music of\b",
    r"\ba native or inhabitant of\b",
    r"\ba native or resident of\b",
    r"\ba resident of\b",
    r"\ba member of the .+? (?:peoples?|nation|tribe)\b",
    r"\bethnic slur\b",
    r"\boffensive term\b",
    r"\bcaucasoid race\b",
)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--project", type=Path, default=Path(__file__).resolve().parents[1])
    parser.add_argument("--enable", type=Path, help="Use a local ENABLE source file")
    parser.add_argument("--audit", type=Path, help="Write the JSON audit to this path")
    parser.add_argument("--baseline-ref", help="Compare against bank files from this Git ref")
    return parser.parse_args()


def load_enable(source: Path | None) -> list[str]:
    raw = source.read_bytes() if source else urllib.request.urlopen(ENABLE_URL, timeout=30).read()
    digest = hashlib.sha256(raw).hexdigest()
    if digest != ENABLE_SHA256:
        raise RuntimeError(f"ENABLE SHA-256 mismatch: expected {ENABLE_SHA256}, got {digest}")
    words = {
        line.strip().lower()
        for line in raw.decode("utf-8").splitlines()
        if re.fullmatch(r"[a-z]{6}", line.strip().lower())
    }
    return sorted(words)


def clue_looks_proper(text: str) -> bool:
    return any(re.search(pattern, text, re.IGNORECASE) for pattern in PROPER_CLUE_PATTERNS)


def contains_answer(text: str, word: str) -> bool:
    return re.search(rf"\b{re.escape(word)}\b", text, re.IGNORECASE) is not None


def ranked_synsets(word: str):
    synsets = [synset for synset in wn.synsets(word) if not synset.instance_hypernyms()]
    return [
        synset
        for _, synset in sorted(
            enumerate(synsets),
            key=lambda item: (
                clue_looks_proper(item[1].definition()),
                contains_answer(item[1].definition(), word),
                -max((lemma.count() for lemma in item[1].lemmas()), default=0),
                item[0],
            ),
        )
    ]


def clue_for(word: str) -> str | None:
    for synset in ranked_synsets(word):
        definition = re.sub(r"\s+", " ", synset.definition()).strip()
        definition = re.split(r";\s*;", definition, maxsplit=1)[0].rstrip(" ;")
        definition = re.sub(
            rf"\s*\([^)]*\b{re.escape(word)}\b[^)]*\)", "", definition, flags=re.IGNORECASE
        ).strip()
        if (
            len(definition) < 8
            or contains_answer(definition, word)
            or clue_looks_proper(definition)
        ):
            continue
        clue = definition[0].upper() + definition[1:]
        if clue[-1] not in ".!?":
            clue += "."
        return clue
    return None


def read_old_banks(project: Path, baseline_ref: str | None) -> tuple[dict[str, str], set[str]]:
    if baseline_ref:
        answer_source = subprocess.check_output(
            ["git", "show", f"{baseline_ref}:answer-bank.js"], cwd=project, text=True
        )
        word_source = subprocess.check_output(
            ["git", "show", f"{baseline_ref}:word-bank.js"], cwd=project, text=True
        )
    else:
        answer_source = (project / "answer-bank.js").read_text(encoding="utf-8")
        word_source = (project / "word-bank.js").read_text(encoding="utf-8")
    old_answers = {
        match.group(1): json.loads(match.group(2))
        for match in re.finditer(r'\{"word": "([a-z]{6})", "clue": ("(?:\\.|[^"\\])*")\}', answer_source)
    }
    match = re.search(r'return "(.*)"\.split\(" "\);', word_source, re.DOTALL)
    old_raw_guesses = set(match.group(1).split()) if match else set()
    return old_answers, old_raw_guesses | set(old_answers)


def reusable_old_clue(clue: str | None, word: str) -> bool:
    if not clue or len(clue) < 8:
        return False
    lowered = clue.lower()
    return (
        "this word" not in lowered
        and re.search(r";\s*;", clue) is None
        and not contains_answer(clue, word)
        and not clue_looks_proper(clue)
    )


def render_answers(entries: list[dict[str, str]]) -> str:
    lines = [
        "/* 5,000 curated six-letter answers ranked with wordfreq and clued with WordNet 3.0. */",
        "(function (root, factory) {",
        "  const answers = factory();",
        '  if (typeof module === "object" && module.exports) module.exports = answers;',
        "  else root.SixthSenseAnswers = answers;",
        '})(typeof globalThis !== "undefined" ? globalThis : this, function () {',
        "  return [",
    ]
    for index, entry in enumerate(entries):
        suffix = "," if index < len(entries) - 1 else ""
        lines.append("    " + json.dumps(entry, ensure_ascii=False) + suffix)
    lines.extend(["  ];", "});", ""])
    return "\n".join(lines)


def render_guesses(words: list[str]) -> str:
    payload = " ".join(words)
    return "\n".join(
        [
            "/* Curated six-letter accepted guesses from the public-domain ENABLE lexicon. */",
            "(function (root, factory) {",
            "  const words = factory();",
            '  if (typeof module === "object" && module.exports) module.exports = words;',
            "  else root.SixthSenseWords = words;",
            '})(typeof globalThis !== "undefined" ? globalThis : this, function () {',
            f'  return "{payload}".split(" ");',
            "});",
            "",
        ]
    )


def main() -> int:
    args = parse_args()
    project = args.project.resolve()
    accepted = load_enable(args.enable)
    old_clues, old_accepted = read_old_banks(project, args.baseline_ref)
    old_answers = set(old_clues)

    clue_map: dict[str, str] = {}
    scored: list[tuple[float, str]] = []
    for word in accepted:
        old_clue = old_clues.get(word)
        clue = old_clue if reusable_old_clue(old_clue, word) else clue_for(word)
        if clue and word not in ANSWER_ONLY_EXCLUSIONS:
            clue_map[word] = clue
            scored.append((zipf_frequency(word, "en"), word))
    scored.sort(key=lambda item: (-item[0], item[1]))

    selected = [word for _, word in scored[:ANSWER_COUNT]]
    for required in sorted(REQUIRED_ANSWERS):
        if required not in selected:
            if required not in clue_map:
                raise RuntimeError(f"Required answer is not clueable: {required}")
            selected[-1] = required
    selected = sorted(set(selected), key=lambda word: (-zipf_frequency(word, "en"), word))
    if len(selected) != ANSWER_COUNT:
        raise RuntimeError(f"Expected {ANSWER_COUNT} unique answers, got {len(selected)}")

    entries = [{"word": word, "clue": clue_map[word]} for word in selected]
    selected_set = set(selected)
    accepted_set = set(accepted)
    if not selected_set <= accepted_set:
        raise RuntimeError("Every answer must also be an accepted guess")

    (project / "answer-bank.js").write_text(render_answers(entries), encoding="utf-8", newline="\n")
    (project / "word-bank.js").write_text(render_guesses(accepted), encoding="utf-8", newline="\n")

    audit = {
        "criteria": {
            "length": WORD_LENGTH,
            "guessLexicon": "ENABLE",
            "enableSha256": ENABLE_SHA256,
            "answers": "Top 5,000 by wordfreq with a non-proper WordNet clue and answer safety exclusions",
        },
        "before": {"accepted": len(old_accepted), "answers": len(old_answers)},
        "after": {"accepted": len(accepted_set), "answers": len(selected_set)},
        "acceptedReview": {
            "retained": len(old_accepted & accepted_set),
            "removed": len(old_accepted - accepted_set),
            "added": len(accepted_set - old_accepted),
        },
        "answerReview": {
            "retained": len(old_answers & selected_set),
            "replaced": len(old_answers - selected_set),
            "new": len(selected_set - old_answers),
            "minimumSelectedZipf": min(zipf_frequency(word, "en") for word in selected_set),
            "clueableCandidates": len(scored),
        },
        "clueReview": {
            "preservedCleanExisting": sum(
                word in old_clues and reusable_old_clue(old_clues[word], word)
                for word in selected_set
            ),
            "regeneratedExisting": sum(
                word in old_clues and not reusable_old_clue(old_clues[word], word) for word in selected_set
            ),
            "generatedForNewAnswers": len(selected_set - old_answers),
        },
        "regressions": {
            "coatesAccepted": "coates" in accepted_set,
            "coatesAnswer": "coates" in selected_set,
            "raffleAccepted": "raffle" in accepted_set,
            "raffleAnswer": "raffle" in selected_set,
            "rattleAccepted": "rattle" in accepted_set,
            "rattleAnswer": "rattle" in selected_set,
        },
    }
    rendered_audit = json.dumps(audit, indent=2, sort_keys=True)
    if args.audit:
        args.audit.write_text(rendered_audit + "\n", encoding="utf-8", newline="\n")
    print(rendered_audit)
    return 0


if __name__ == "__main__":
    sys.exit(main())
