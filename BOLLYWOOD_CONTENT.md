# Bollywood Race content audit

Reviewed 2026-09-18. `data/bollywood-answers.json` is the source of truth for new races. The room API loads it; the client never downloads it.

## Owner-approved scope

- **579 distinct answers**, each 5–7 lowercase ASCII letters: **58 complete hit-film titles and 521 actors' first names**, including one-name performers such as Kajol and Govinda.
- **567 recent entries** anchored to Hindi film credits/releases from 2000–2025; **12 pre-2000 classics**, including Sholay. The older section remains below the requested maximum of 100.
- The owner refined the approximate 1,000-answer request to **complete titles and first names only**, then explicitly chose the strong verified pool over adding less familiar actors merely to reach 1,000.
- No title fragments, surnames, middle-name fragments, songs, locations, invented abbreviations or arbitrary substrings. Spaces/punctuation are omitted for complete titles such as New York, No Entry, Hum Tum and Ra.One; titles requiring digits are excluded.
- Film answers use Hit-or-better verdicts from Box Office India/Bollywood Hungama, plus the requested Sholay classic. A performer's supporting credit need not itself be a hit: the categories are hit films **or actors/actresses**.
- A name's era is its cited acting credit, not the performer's birth/debut year. Established actors appearing after 2000 qualify. Re-release-only credits such as Sholay 3D and the delayed 1970s production Love in Bombay were excluded as recent evidence.

## Sources and editing

Each record retains a source URL and year. Film records retain the title, verdict and, where needed, cast-credit source. Performer records retain the full credited name, film and person-page URL. Clues are newly written from factual references, not copied article descriptions.

Research used Box Office India's [2000s](https://www.boxofficeindia.com/hit-down.php?txtYearlyData=2000-2009), [2010s](https://www.boxofficeindia.com/hit-down.php?txtYearlyData=2010-2019), [2020s](https://www.boxofficeindia.com/hit-down.php?txtYearlyData=2020-2029) and [1990s](https://www.boxofficeindia.com/hit-down.php?txtYearlyData=1990-1999) tables; Bollywood Hungama's [2023](https://www.bollywoodhungama.com/box-office-collections/filterbycountry/IND/2023/) and [2025](https://www.bollywoodhungama.com/box-office-collections/filterbycountry/IND/2025/) verdicts; and Wikipedia contributors' annual Hindi film cast indexes for 2000–2025, cross-referenced with its Hindi actor/actress indexes. Exact annual/person links remain per record. The BOI decade pages stop early in the 2020s and are not treated as a complete current catalogue.

Credits were ranked by repeat Hindi-film appearances and actor-index membership. The pool includes supporting performers as well as stars; not every name is a household name. Obvious spelling variants such as Tushar/Tusshar, Jhanvi/Janhvi, Tripti/Triptii and Javed/Jaaved were merged to one screen-name spelling. Parsed footnotes, genre links and malformed names were removed. Shared first names have one answer record and one specific clue.

## Validation and compatibility

`node test-bollywood.js` checks the exact count, uniqueness, complete-title/first-name categories, length, era cutoff/cap, metadata, unwanted spellings, clue leakage and authoritative gameplay. `node test-bollywood-browser.js` checks variable columns and phone input/layout. `node test-production-bollywood.js` tests real rooms on a supplied public origin. Sources and editorial cleanup reduce errors but are not an independent fact-check of every credit.

`data/bollywood-legacy-20260918.json` retains the earlier 1,000-entry launch pool solely for clue lookup in rooms created before the owner's refinement arrived. **It never selects new answers.** Existing rooms expire after 24 hours; preserving clues avoids breaking an in-progress race. The current pool takes precedence for overlapping words.

Unassisted snapshots send only the active answer's length and generic kind. Sense returns its clue after unlocking; Peek returns one authorized position. The full bank and route are not sent to players. The data folder is omitted from the allow-listed Vercel/Pages/mobile static bundle. Public repository readers can inspect vocabulary, but the random active route remains server-side. No posters, studio logos, likenesses or soundtrack media were copied; the launcher is an original generic clapperboard SVG.
