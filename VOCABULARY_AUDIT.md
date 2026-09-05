# Sixth Sense vocabulary audit

Verified: 2026-09-05

## Result

Sixth Sense recognizes **15,232 realistically acceptable six-letter guesses**. **10,187** clueable, answer-safe words are available as puzzles in three ordered tiers.

| Measure | Before | After |
| --- | ---: | ---: |
| Accepted guesses available to the game | 32,068 | 15,232 |
| Puzzle answers | 5,000 | 10,187 |
| Old guesses retained | — | 14,850 |
| Unsupported guesses removed | — | 17,218 |
| Valid guesses previously missing and added | — | 382 |
| Old answers retained | — | 4,782 |
| Answers replaced | — | 218 |

The player-facing answer tiers are **Normal: 4,058**, **Hard: 2,246**, and **Extreme: 3,883**. `coates` is not accepted and cannot be selected as an answer. `raffle`, `rattle`, `brooch`, `napkin`, `pewter`, `tarmac`, and `walrus` meet the Normal usage threshold. `genial` is correctly classified as Hard.

## What “realistically acceptable” means

The accepted-guess bank is the complete six-letter lowercase subset of ENABLE, a public-domain lexicon created for English word games. This removes ordinary personal names, surnames, place names, trademarks, malformed inflections, abbreviations, and corpus noise that entered the previous frequency/dictionary union.

The guess bank intentionally remains broader than the answer pool. It includes legitimate uncommon, technical, archaic, and inflected dictionary words so a knowledgeable player is not told that a real word is invalid.

A puzzle answer must satisfy every guess rule and also:

1. have a usable, non-proper-name WordNet definition for the Sense clue;
2. receive a deterministic familiarity tier using `wordfreq`;
3. not occur in the answer-only safety exclusion set.

Normal contains every eligible answer with an English `wordfreq` Zipf score of at least 2.75; it is no longer filled to a predetermined quota or altered with manual tier rescues. Hard contains the remaining eligible words with a Zipf score from 2.0 through 2.74. Extreme contains the final answer-safe remainder. The audit rejects clues containing the answer itself, broken placeholder text, or proper-name/offensive senses. Carefully reviewed clue overrides may replace an arbitrary dictionary sense; for example, `armory` now reads “A place where weapons and military equipment are stored.”

Solo non-Daily selection begins with Easy. Solved words are stored locally and excluded from fresh selections. Completing all Easy words silently adds Medium; completing Medium silently adds Extreme. Daily remains a shared deterministic Easy puzzle. Multiplayer difficulty selects exactly one tier and does not depend on a player's solo unlock state.

## Reproducibility

### Clue-only release, 2026-09-05

All 10,187 answers were passed through the refreshed clue pipeline. Answer membership, order, and tiers are identical when projected to `[word, tier]`; the 15,232 accepted guesses were not edited. 10,082 clue strings changed: 1,310 changed their definition wording, while the other 8,772 changes add a grammatical label only. There are 143 explicit wording overrides, plus the original hand-written starter clues.

The previous ranking used the largest usage count of *any synonym* in a WordNet sense. It now uses counts attached to the target word (or its morphological root). Common clues such as `dipped`, `entire`, `behind`, `father`, and `jersey` have explicit overrides. Parenthetical answer leaks are cleaned before candidate rejection, rather than penalizing an otherwise useful common sense. Plural nouns, verb forms, and past-tense forms are labeled to distinguish the answer form from a dictionary headword.

`scripts/clue-audit.json` records the full before/after diff against `c055f52`; `scripts/clue_overrides.json` is the version-controlled editorial correction layer. The rest is an **algorithmic refresh, not a claim that all 10,187 definitions were manually reviewed**. WordNet is a dated, sparse sense-frequency source, so rare and ambiguous clues still need editorial judgment. Word-frequency difficulty thresholds do not measure which meaning of a word is familiar.

For subsequent hint fixes, edit the override file and use clue-only refresh (this cannot add/remove answers or change progression):

```powershell
python scripts/build_word_banks.py --refresh-clues --baseline-ref c055f52 --audit scripts/clue-audit.json
npm test
```

Requires the pinned Python dependencies and WordNet data described below. The bank is generated mechanically; do not hand-edit individual generated entries. The server sends current wording only to players who already unlocked Sense; saved solo games also refresh their clue without resetting guesses or purchases.

### Full vocabulary rebuild

The source ENABLE file is verified before use with SHA-256:

`3f16130220645692ed49c7134e24a18504c2ca55b3c012f7290e3e77c63b1a89`

Rebuild dependencies are pinned in `scripts/requirements-word-banks.txt`. Run:

```powershell
python -m venv .word-bank-venv
.\.word-bank-venv\Scripts\python.exe -m pip install -r scripts\requirements-word-banks.txt
.\.word-bank-venv\Scripts\python.exe -m nltk.downloader wordnet omw-1.4
.\.word-bank-venv\Scripts\python.exe scripts\build_word_banks.py --baseline-ref e39ea7f --audit vocabulary-audit.json
node test-core.js
```

The generated runtime files remain dependency-free JavaScript; Python, NLTK, and `wordfreq` are only required to rebuild or audit the banks.
