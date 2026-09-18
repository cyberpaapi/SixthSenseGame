# Bollywood Race content audit

Reviewed 2026-09-18. The committed `data/bollywood-answers.json` is the curated source of truth; it is loaded by the room API, not downloaded by the game client.

## Scope

- 1,000 distinct lowercase answers, each 5–7 ASCII letters.
- 988 recent entries anchored to a Hindi film credit/release from 2000–2025; 12 pre-2000 classics including the explicitly requested Sholay. The older section stays below the requested maximum of 100; it is not padded to that maximum.
- 50 complete film titles, 94 complete words from longer hit titles, 494 performer first names, 335 surnames, and 27 screen names. Spellings are never truncated to fit.
- Film answers use Hit-or-better commercial verdicts from Box Office India or Bollywood Hungama, plus Sholay as the requested classic. A performer's supporting credit need not itself be a hit: the allowed categories are hit films **or actors/actresses**.
- First/surname and title-word answers keep the requested length range usable. No songs, locations, directors without acting credits, character names, invented abbreviations, or arbitrary substrings are used.
- A name's era is its cited acting credit, not the performer's birth/debut year. Established actors appearing after 2000 qualify. Re-release credits such as Sholay 3D and the long-delayed 1970s production Love in Bombay were excluded as recent evidence.

## Sources and editing

Each record retains a source URL and year. Film records also retain the title, verdict and (where needed) cast-credit source. Performer records retain the full credited name, film, and person-page URL. Sources are factual references; clues are newly written rather than copied article descriptions.

Research used Box Office India's [2000s](https://www.boxofficeindia.com/hit-down.php?txtYearlyData=2000-2009), [2010s](https://www.boxofficeindia.com/hit-down.php?txtYearlyData=2010-2019), [2020s](https://www.boxofficeindia.com/hit-down.php?txtYearlyData=2020-2029) and [1990s](https://www.boxofficeindia.com/hit-down.php?txtYearlyData=1990-1999) tables; Bollywood Hungama's [2023](https://www.bollywoodhungama.com/box-office-collections/filterbycountry/IND/2023/) and [2025](https://www.bollywoodhungama.com/box-office-collections/filterbycountry/IND/2025/) verdicts; and cast listings from Wikipedia's annual Hindi film indexes for 2000–2025, cross-referenced with its Hindi actor/actress indexes. Exact annual and person links are retained per record. The older BOI decade pages stop early in the 2020s and are not treated as a complete current hit catalogue.

Credits were ranked by repeat Hindi-film appearances and actor-index membership. The pool includes supporting and less familiar performers as well as major stars; 1,000 distinct short answers should not be advertised as 1,000 household names. Spelling variants such as Tushar/Tusshar, Jhanvi/Janhvi, Tripti/Triptii, Javed/Jaaved and Devgan/Devgn were merged to one chosen screen-name spelling. Parsed footnotes, genre links, middle-name-only fragments and malformed names were removed. Names shared by several actors or titles have one answer record and one specific clue.

## Validation and limits

`node test-bollywood.js` checks the exact count, uniqueness, length, era cap/cutoff, source metadata, known unwanted spellings, clue completeness/no answer leakage, selection and authoritative gameplay. `node test-bollywood-browser.js` checks changing columns and phone input/layout. Sources and the editorial audit reduce errors but are not an independent film-credit fact check of every record. Future corrections should edit records with source evidence and retain these invariants.

Only the current answer's length and generic kind are sent in an unassisted room snapshot. Sense returns its clue after unlocking; Peek returns one authorized position. The full bank and active route are not sent to players. The public source repository can be inspected, so this is not secrecy against source-code readers; the random active route remains server-side.

No film posters, studio logos, likenesses, soundtracks or other media were copied. The launcher uses an original generic clapperboard SVG.
