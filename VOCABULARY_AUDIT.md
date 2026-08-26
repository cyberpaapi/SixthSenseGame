# Sixth Sense vocabulary audit

Verified: 2026-08-27

## Result

Sixth Sense now recognizes **15,232 realistically acceptable six-letter guesses**. Exactly **5,000** of those words are included in the puzzle-answer pool.

| Measure | Before | After |
| --- | ---: | ---: |
| Accepted guesses available to the game | 32,068 | 15,232 |
| Puzzle answers | 5,000 | 5,000 |
| Old guesses retained | — | 14,850 |
| Unsupported guesses removed | — | 17,218 |
| Valid guesses previously missing and added | — | 382 |
| Old answers retained | — | 4,782 |
| Answers replaced | — | 218 |

`coates` is no longer accepted and cannot be selected as an answer. `raffle` and `rattle` remain accepted guesses and possible answers.

## What “realistically acceptable” means

The accepted-guess bank is the complete six-letter lowercase subset of ENABLE, a public-domain lexicon created for English word games. This removes ordinary personal names, surnames, place names, trademarks, malformed inflections, abbreviations, and corpus noise that entered the previous frequency/dictionary union.

The guess bank intentionally remains broader than the answer pool. It includes legitimate uncommon, technical, archaic, and inflected dictionary words so a knowledgeable player is not told that a real word is invalid.

A puzzle answer must satisfy every guess rule and also:

1. have a usable, non-proper-name WordNet definition for the Sense clue;
2. rank within the 5,000 most familiar eligible words using `wordfreq`;
3. not occur in the answer-only safety exclusion set.

The least-frequent selected answer has a `wordfreq` Zipf score of 2.44. The full validated lexicon contains 10,188 clueable, answer-safe candidates, of which the top 5,000 are used as puzzles. The audit also rejects clues containing the answer itself, broken placeholder text, or proper-name/offensive senses; 4,633 clean existing clues were preserved, 149 retained answers received repaired clues, and 218 new answers received new clues.

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
