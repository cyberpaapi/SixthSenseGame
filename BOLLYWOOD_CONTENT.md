# Bollywood Race and VS content audit

Updated 2026-09-19. `data/bollywood-answers.json` is the server-only source of truth for new Bollywood Race and VS matches, including both Endless advancement paths. It replaces the earlier 579-answer film/actor pool in full.

## Owner-approved scope

- **125 distinct answers: 75 complete movie titles and 50 fictional character names or nicknames.** All contain 5–7 lowercase ASCII letters.
- **98 entries reference films from 2000–2025; 27 reference pre-2000 classics**, below the requested cap of 100 older entries. Character years identify their reference movie, not a performer's career.
- One short, slightly vague **Sense clue** per answer. This remains a word-guessing game, not a trivia question/answer format.
- No actor-name category, title fragments, series, songs, invented abbreviations or digit-requiring answers. Movie titles omit spaces and punctuation only, as in `mrindia`, `humtum`, `newyork` and `raone`.
- Characters use recognisable given names or nicknames, such as `baburao`, `circuit`, `rancho` and `virus`. Names shared with real actors, including `farhan`, `aditya` and `vicky`, refer strictly to the fictional role in the clue/reference. Each answer spelling occurs once.
- The owner approved recognisable hits and enduring classics, including films whose original box-office verdict was not Hit. Do not present this pool as 125 verified blockbusters. Raid 2 and Sitaare Zameen Par are excluded.

## Content reference and provenance

`docs/bollywood-review/bollywood-word-bank.json` records the owner-reviewed wording; its Markdown and standalone HTML counterparts provide readable/searchable reference lists. The runtime test requires the server pool to match these words, kinds and hints exactly. The 53 previously approved movie clues remain, with 22 additional movies and 50 character clues; all actor records have been removed from selection.

Every runtime entry records `word`, `kind`, `era`, `year`, `clue`, `reference`, and `sources`, plus `title` or `character`. `reference` identifies the movie/role. `sources` contains consulted URLs where a direct check was performed and can be empty; it does not imply that every entry received an independent source audit. Selected checks use official studio cast/synopsis pages, streaming listings, IMDb, Wikipedia and film-trade sources. Hints are original paraphrases, not copied dialogue or article passages.

Only the listed canonical spelling solves a word, using the existing exact-letter rules. No transliteration/alias equivalence is implemented. Examples include `jadoo`, `sakeena` and `faizal`; future spelling corrections must consider the displayed length and existing saved routes. This is an owner-approved editorial replacement with structural, selected factual and gameplay checks, not an exhaustive independent fact check. Remaining ambiguity or spelling feedback should be corrected in both the runtime bank and reference list.

## Validation and existing rooms

`node test-bollywood.js` checks the complete replacement against the approved reference, exact category counts, unique 5–7-letter words, reference metadata, era bounds, short non-question clues, answer leakage, absence of actor-only entries from new selection, Character snapshots, Sense/reopened clues, answer redaction, Peek and Last Chance. `node test-bollywood-vs.js` covers movies and characters in VS solve/forfeit and both Endless paths, including exhausted-pool recycling. `node test-bollywood-browser.js` covers the updated copy and Film to Character transitions on 5/6/7-column phone boards; run again with `BOLLYWOOD_VARIANT=vs` for the duel.

The existing `data/bollywood-legacy-20260918.json` remains **lookup-only for routes already stored in ongoing rooms**. It is never used for new answer selection. All words from the replaced bank are covered by the existing lookup; no additional old pool was added. New records take precedence for overlapping words. Existing rooms retain their saved route until expiry (24 hours); newly appended Endless answers use only the 125-word pool. This avoids discarding players' progress when the content release arrives.

Unassisted snapshots expose only the active length and kind. Sense returns the clue only after unlocking; Peek returns one permitted position. Full answers and room routes remain server-side. The packaging allow-list excludes `data/`, `docs/` and source/tests from Vercel, Pages and Android static clients. The public source repository remains reviewable, but the random active room route is not sent to players.

The home artwork is unchanged original game art; no film posters, character likenesses, studio logos or soundtrack media are added by this replacement. No deployment or Android binary is included in this local commit.
