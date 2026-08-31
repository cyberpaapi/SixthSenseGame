# Sixth Sense vocabulary audit

Verified: 2026-08-31

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
