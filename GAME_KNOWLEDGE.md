# Sixth Sense — living game knowledge

> Canonical context for humans and AI contributors. Read this file before making changes.

Last updated: 2026-08-27

Last verified: 2026-08-27

Repository: `https://github.com/cyberpaapi/SixthSenseGame`

Current source branch: `main`

Current delivery: static browser game published primarily at `https://sixth-sense-game.vercel.app/` and secondarily at `https://cyberpaapi.github.io/SixthSenseGame/`; local development URL `http://127.0.0.1:4173/`

## Maintenance contract

This document must describe the build that actually exists, not a future plan. Every code, content, rules, data, asset, test, configuration, or deployment change must update this file in the same commit.

For every future change:

1. Read this document before editing.
2. Update all affected current-state sections below.
3. Add a dated change-log entry stating what changed and why.
4. Run the relevant checks and update “Last verified” plus the verification record.
5. Record known limitations honestly. Never call an unimplemented feature complete.

`AGENTS.md` repeats this requirement in a format intended to be discovered automatically by coding agents.

## Product summary

Sixth Sense is an original, mobile-first, single-player word deduction game. Every puzzle answer has six letters. The player has seven guesses. Feedback is presented through both color and symbols:

- Aligned: green plus `●` — correct letter in the correct position.
- Echoing: orange plus `◆` — correct letter in a different position.
- Quiet: near-black plus `×` — letter is not used at that point after repeated-letter accounting.

The game is inspired by the broad genre of classic letter-deduction puzzles, but its name, visual system, terminology, copy, artwork, iconography, modes, clue economy, and interface composition are original. Do not add Wordle logos, copied art, copied copy, title treatment, or a deliberately imitative branded layout.

## Current game rules

- Word length: 6 letters.
- Maximum guesses: 7.
- Accepted input: keyboard, onscreen keyboard, touch, Enter, and Backspace/Delete.
- A guess must contain exactly six letters and exist in the accepted-guess dictionary.
- Scoring handles repeated letters correctly: exact positions are allocated first, then remaining answer-letter counts are used for misplaced matches.
- The player wins by submitting the answer within seven guesses.
- A loss reveals the answer.
- Hard mode requires all previously revealed exact positions and minimum known letter counts to be reused.
- The Daily puzzle is deterministic from the UTC date. The puzzle number counts from 2026-01-01.
- A completed result can be shared with original symbols and the dynamic seven-guess denominator.

## Modes

The home screen exposes five modes:

| Mode | Current behavior |
| --- | --- |
| Daily | One deterministic UTC puzzle per day. Daily completion updates played, win rate, guess distribution, and daily streak. |
| Practice | Unlimited randomly selected puzzles. A Skip starts a fresh Practice puzzle. |
| Sprint | A Practice-style puzzle with a 90-second deadline. A zero timer ends the puzzle as a loss. |
| Insight | Starts with the clue unlocked and one deterministic answer position revealed. |
| Streak | Consecutive wins grow a separate mode streak; a loss or Skip resets that run. |

The app opens on the home screen. Game-adjacent marketing, mode selection, and streak progress live outside the focused puzzle screen.

## Coins, rewards, and lifelines

Starting wallet: 20 coins. Solving rewards fewer coins as more attempts are used:

| Attempts | Coins earned |
| ---: | ---: |
| 1 | 14 |
| 2 | 12 |
| 3 | 10 |
| 4 | 8 |
| 5 | 6 |
| 6 | 4 |
| 7 | 2 |

Lifeline prices and behavior:

| Lifeline | Cost | Current behavior |
| --- | ---: | --- |
| Sense | 3 | First tap with no stock purchases one token; the next tap consumes it and unlocks the puzzle clue. Once unlocked, the same clue can be reopened freely for that puzzle. It appears in a centered bubble for five seconds. |
| Peek | 5 | Can be stocked, consumed, purchased again, and reused. Every use reveals a new unrevealed answer position until no useful positions remain. |
| Clear | 4 | Can be stocked, consumed, purchased again, and reused. Every use marks up to three new unique letters that cannot occur in the answer, until no candidates remain. |
| Skip | 6 | Can be stocked, consumed, purchased again, and reused. It always asks for confirmation. Daily counts as a loss; Streak counts as a loss and resets the run; Practice, Sprint, and Insight begin a fresh puzzle. |

Inventory and coins persist in `localStorage`. The bottom dock shows only icons. If stock is zero, the price appears below the icon. If stock exists, the price disappears and a stock count appears on the icon. Redundant zero stock is never shown. Buying and using are deliberately separate taps so a purchase is not consumed accidentally.

## Current experience and visual system

- Visual direction: vibrant claymorphism with purple, pink, cyan, yellow, and orange depth lighting.
- Home: generated observatory hero art, a seven-day streak progress rail, a Daily call-to-action, and a compact four-mode launcher. The launcher is a small 2×2 grid on phones and a slim four-across row on desktop, with thumbnail art beside concise labels.
- Game screen: visible Sixth Sense branding, a compact game-mode line, coin count at top right, seven-row letter grid, color-state keyboard, and an evenly spaced bottom lifeline dock.
- Default logo: option 1. Settings includes a persistent 3×3 chooser with nine original generated logo marks.
- Controls: generated image assets are used for major home, settings, help, stats, sound, and lifeline actions instead of generic black buttons. Visible icon art is intentionally compact inside touch targets that remain at least 44px on phones.
- The Daily action, mode cards, modal-title art, and decorative streak/lifeline imagery use a compact scale so controls support the game rather than dominating it.
- The game screen is locked to one dynamic viewport and must not create page-level horizontal or vertical scrolling, including during screen-entry animation.
- Purposeful motion includes letter entry pop, row rejection shake, tile reveal, Peek reveal, Clear key removal, lifeline purchase/use/unavailable states, wallet spend/denial, screen entry, result sheet timing, and win confetti.
- All optional motion collapses under `prefers-reduced-motion`.
- Sound uses a small Web Audio tone system and can be disabled.
- Dark and high-contrast modes are available. Dark mode preserves four visually distinct keyboard treatments: untested purple, Aligned green, Echoing orange, and Quiet charcoal, with the `●`, `◆`, and `×` markers retained.
- The UI supplies visible keyboard color states, color-independent symbols, semantic buttons, ARIA labels, focus styles, first-visit help, and a skip-to-content link.

## Intentional removals and simplifications

The following items were removed because they made the interface feel crowded or derivative:

- The old home statistics strip showing day streak, puzzles, and solved percentage. Streak is now communicated by the top progress rail.
- The game-card heading block containing puzzle number, “Sense the six,” and the Daily/Practice switch.
- The verbose “Read the signs / Every color speaks” marketing section and the genre disclaimer from the home content.
- Text labels around the lifeline dock. Meaning is carried by original icons, accessible names, prices, stock badges, and the help modal.
- Temporary “tries left” bubbles after valid guesses.

## Architecture and file map

This is a dependency-light static application: no framework, bundler, package manifest, backend, account system, or remote database is required at runtime.

| File or directory | Responsibility |
| --- | --- |
| `index.html` | Semantic home/game screens, modal content, settings, stats, icon dock, and script loading order. |
| `styles.css` | Responsive claymorphic presentation, phone viewport fitting, dark/high-contrast themes, keyboard states, modal styling, and all motion. |
| `game-core.js` | Environment-neutral rules: constants, answer/guess loading, repeated-letter scoring, hard-mode validation, daily selection, practice selection, and coin rewards. It exports to both browser globals and CommonJS tests. |
| `app.js` | Browser state, rendering, input, modes, persistence, inventory/economy, modals, animations, sound, sharing, and statistics. |
| `answer-bank.js` | Exactly 5,000 answer objects with a six-letter `word` and a `clue`. Loaded before `game-core.js` in the browser. |
| `word-bank.js` | Expanded accepted-guess vocabulary. Loaded before `game-core.js` in the browser. |
| `scripts/build_word_banks.py` | Deterministically audits and regenerates both banks from a hash-verified ENABLE lexicon, pinned `wordfreq`, and WordNet. |
| `scripts/requirements-word-banks.txt` | Pinned build-time Python dependencies for vocabulary regeneration. |
| `VOCABULARY_AUDIT.md` | Acceptance criteria, before/after counts, source hash, and reproducible audit instructions. |
| `assets/` | Generated logo, hero, mode, control, and supporting icon artwork. WebP is preferred for scene imagery; transparent PNG/WebP assets are used for controls. |
| `manifest.webmanifest` | Installable web-app metadata and default logo icon. |
| `favicon.svg` | Fallback favicon; the selected logo is applied dynamically at runtime. |
| `.nojekyll` | Tells GitHub Pages to publish the repository as a plain static site without Jekyll processing. |
| `.github/workflows/pages.yml` | Builds and deploys the static repository to GitHub Pages on each push to `main` or a manual dispatch. |
| `.gitignore` | Excludes Vercel's local project link plus Python cache files created during vocabulary regeneration. |
| `test-core.js` | Node assertions for data shape/counts, RATTLE/RAFFLE coverage, scoring, hard mode, dates, attempts, costs, and rewards. |
| `test-browser.js` | Playwright end-to-end QA for onboarding, modes, lifelines, coins, repeated use, keyboard states, solving, logo settings, themes, screenshots, and overflow. |
| `THIRD_PARTY_LICENSES.md` | Attribution and licenses for dictionary, frequency-ranking, and clue source data. |
| `README.md` | Concise setup and feature overview. |
| `AGENTS.md` | Mandatory instructions for AI contributors, including this document’s update rule. |
| `GAME_KNOWLEDGE.md` | This canonical living context and change record. |

Keep the script order in `index.html`: `answer-bank.js`, `word-bank.js`, `game-core.js`, then `app.js`.

## Data and selection

- Answer pool: exactly 5,000 unique, common, six-letter words.
- Accepted guesses: exactly 15,232 unique six-letter words from the proper-name-safe ENABLE word-game lexicon, including every answer.
- `raffle` and `rattle` are both accepted guesses and possible puzzle answers.
- Every answer has a Sense clue.
- The accepted vocabulary includes legitimate uncommon, technical, archaic, and inflected word-game entries, while excluding ordinary names, places, trademarks, malformed inflections, abbreviations, and corpus noise.
- Answers are the 5,000 highest-frequency eligible guesses with a usable non-proper WordNet clue and no answer-only safety exclusion. There are 10,188 clueable, answer-safe candidates; the selected frequency floor is Zipf 2.44.
- The 2026-08-27 full audit retained 14,850 old guesses, removed 17,218 unsupported entries, added 382 valid omissions, retained 4,782 old answers, and replaced 218 answers.
- Sense clues may not contain their own answer, broken placeholder/example text, proper-name definitions, or offensive senses. The audit preserved 4,633 clean existing clues, repaired 149 retained clues, and generated clues for 218 new answers.
- `coates` is excluded from both banks because it entered as a surname/malformed inflection with the clue for `coat`.
- Source notices are preserved in `THIRD_PARTY_LICENSES.md`.

Do not casually regenerate either bank. Any regeneration must preserve format, licenses, six-letter filtering, uniqueness, all-answer inclusion, clue completeness, required common words, and automated counts.

## Runtime state and persistence

All state is local to the browser. There is no login or cross-device synchronization.

Current `localStorage` keys:

- `sixth-sense.daily.v1`
- `sixth-sense.practice.v1`
- `sixth-sense.sprint.v1`
- `sixth-sense.insight.v1`
- `sixth-sense.streak-mode.v1`
- `sixth-sense.stats.v1`
- `sixth-sense.settings.v1`
- `sixth-sense.visited.v1`

Game records include answer/clue, mode, date, puzzle number, guesses, current status, clue state, Peek positions/use count, cleared letters/use count, skip state, reward/stat-recording guards, and Sprint deadline. The current game schema uses `version: 2`.

Statistics include Daily play/win/streak fields, seven-slot guess distribution, wallet, persistent lifeline inventory, Streak-mode run, and best Streak-mode run. Settings include hard mode, contrast, dark mode, sound, and selected logo.

When changing stored shapes, add a safe migration or backward-compatible defaults. Never assume old players have every new field.

## Non-negotiable quality rules

- Preserve six-letter answers and seven chances unless the user explicitly changes the product.
- Preserve correct duplicate-letter scoring.
- Keep `answer-bank.js` at exactly 5,000 valid clue-bearing answers unless an explicit product decision changes the target.
- Do not narrow accepted guesses in a way that rejects common words such as `raffle` or `rattle`.
- Keep the puzzle screen within 360×800 and 390×844 portrait viewports without page scrolling or horizontal overflow. Also keep 430×932 and representative desktop/landscape layouts usable.
- Keep touch targets practical, keyboard navigation functional, browser zoom enabled, and focus visible.
- Never make color the only carrier of tile meaning.
- Preserve reduced-motion behavior when adding animations.
- Never make animation timing decide game legality or permanently block input.
- Keep lifeline prices, badges, wallet deductions, and saved inventory consistent.
- Do not commit secrets or add a client-side key.
- Do not claim online multiplayer: this is a local single-player static game.

## Local development

Serve the project root rather than opening `index.html` directly:

```powershell
python -m http.server 4173 --directory .
```

Open `http://127.0.0.1:4173/`.

The current Codex workspace also runs the project from the folder with an available static server. Do not stop an existing user-visible server unless needed and authorized.

## Verification

Core checks:

```powershell
node --check app.js
node test-core.js
```

Browser checks require Playwright, Chrome/Chromium, and a running local server:

```powershell
$env:CHROME_BIN='C:\Program Files\Google\Chrome\Application\chrome.exe'
node test-browser.js
```

Current verified result on 2026-08-27:

- JavaScript syntax: passed.
- Core rules/data: passed — 5,000 answers and 15,232 accepted guesses; all answers are guessable; `coates` and representative proper names are rejected; `raffle` and `rattle` remain answers.
- Vocabulary audit: passed — hash-verified source, deterministic bank output, no duplicate/invalid-length entries, and no clue answer leaks, broken placeholders, proper-name senses, or offensive senses.
- Browser QA: passed — phone playthrough, all modes, repeatable lifelines, results, desktop layout, distinct dark-theme keyboard feedback, and overflow checks.
- Local server: HTTP 200 at `http://127.0.0.1:4173/`.
- Vercel production: Ready and HTTP 200 at `https://sixth-sense-game.vercel.app/`; core CSS, JavaScript, answer data, manifest, and hero artwork return HTTP 200.
- GitHub Pages: built with HTTPS at `https://cyberpaapi.github.io/SixthSenseGame/`; the latest completed deployment workflow passed.
- The generic board-game validator reports missing `package.json`/npm build scripts; this is expected for the intentionally dependency-free static architecture. The repository-specific Node and Playwright checks above are the canonical validation path.

When behavior changes, add or update an automated assertion. Do not rely only on visual inspection for game rules or economy state.

## GitHub and release workflow

GitHub repository `cyberpaapi/SixthSenseGame` is the source of truth. The static game is compatible with repository-relative hosting because assets and scripts use relative paths.

Release workflow:

1. Check `git status` and preserve unrelated work.
2. Make the smallest coherent change.
3. Update this document and append a change-log entry.
4. Run syntax, core, and relevant browser checks.
5. Review `git diff`.
6. Commit only intended files with a focused message.
7. Push to `main` or use a feature branch/PR when requested.
8. Verify the remote commit and Vercel production deployment.

Vercel project `aryanchandwani-gmailcoms-projects/sixth-sense-game` is connected to the GitHub repository and is the primary production route. Vercel deploys the dependency-free repository root and assigns the stable production alias `https://sixth-sense-game.vercel.app/`. Local `.vercel` linkage metadata is intentionally ignored rather than committed.

GitHub Pages is active as a secondary route through `.github/workflows/pages.yml` at `https://cyberpaapi.github.io/SixthSenseGame/`. Its initial publication was delayed by the GitHub Actions and Pages incident active on 2026-08-26, but GitHub now reports the site as built and the latest completed deployment as successful. The repository remains public because the account plan does not support Pages for private repositories.

## Known limitations

- Progress, wallet, inventory, settings, and statistics are device/browser-local and can be cleared with site storage.
- The game does not provide accounts, cloud saves, leaderboards, or online multiplayer.
- The dictionary is deliberately broad but is not a promise to contain every historical, regional, inflected, or specialist six-letter form.
- Generated raster assets make the repository larger than a code-only static game; preserve optimized WebP versions where they exist.
- Google Fonts are imported from the network; system fallbacks remain available if that request fails.

## Change log and rationale

### 2026-08-27 — Dark-mode keyboard feedback repair

- Restricted the dark purple keyboard-row treatment to untested keys. Its earlier selector was more specific than the Aligned, Echoing, and Quiet selectors, so it visually painted over all three feedback colors in dark mode even though their state classes and symbols remained correct.
- Added browser regression coverage that toggles dark mode after a scored guess, inspects the computed key backgrounds, and requires Aligned green, Echoing orange, Quiet charcoal, and untested purple to remain four distinct treatments while preserving the `●`, `◆`, and `×` markers.
- Rechecked publishing state during release: GitHub Pages has recovered from the earlier service incident and is now a successful secondary deployment alongside the primary Vercel route.

### 2026-08-27 — Full vocabulary curation audit

- Replaced the permissive 32,068-entry frequency/dictionary union with all 15,232 six-letter ENABLE entries, a public-domain lexicon made for word games. This removed 17,218 names, places, trademarks, malformed forms, abbreviations, and corpus artifacts while adding 382 valid words the old merge missed.
- Rebuilt the 5,000-answer pool from the validated guesses using `wordfreq`, non-proper WordNet clues, and an answer-only safety set. The audit retained 4,782 previous answers and replaced 218; the pool remains exactly 5,000.
- Audited every Sense clue, preserving 4,633 clean clues, repairing 149 retained clues, and generating 218 new clues. Generated clues are rejected if they reveal their answer, contain broken WordNet example fragments, or select proper-name/offensive senses.
- Removed `coates` from guesses and answers. Preserved `raffle` and `rattle` in both banks.
- Added a hash-verified deterministic generator, pinned build dependencies, exact-count and contamination regression tests, updated licensing, and `VOCABULARY_AUDIT.md` so later contributors can reproduce and assess the curation.

### 2026-08-26 — Vercel production deployment

- Published the static game to Vercel at `https://sixth-sense-game.vercel.app/` after GitHub reported a major Actions outage and degraded Pages service during the requested release.
- Connected Vercel project `aryanchandwani-gmailcoms-projects/sixth-sense-game` to `cyberpaapi/SixthSenseGame` so GitHub remains the source of truth and future production updates can follow `main`.
- Verified the production document, stylesheet, application script, 5,000-answer bank, manifest, and home artwork all return HTTP 200, and confirmed Vercel reports the production deployment as Ready.
- Switched the README play link to the stable Vercel alias and ignored local `.vercel` metadata.

### 2026-08-26 — Public GitHub Pages release

- Made `cyberpaapi/SixthSenseGame` public because the current GitHub plan does not support Pages for private repositories and the user approved publishing it.
- Enabled HTTPS GitHub Pages from the root of `main` at `https://cyberpaapi.github.io/SixthSenseGame/` so the current static build has a stable public play link.
- Added `.nojekyll` after GitHub's initial legacy branch build failed, ensuring the dependency-free game is deployed as plain static files.
- Replaced the unreliable generated legacy build with an explicit GitHub Pages Actions workflow using GitHub's official deployment actions.
- Isolated the custom deployment concurrency group from stale legacy Pages jobs so new releases can supersede earlier custom deploys cleanly.
- Added the production play link to `README.md` and verified the repository-relative hosting setup.

### 2026-08-26 — Compact game-mode launcher redesign

- Replaced the large poster-style Practice, Sprint, Insight, and Streak cards with compact horizontal launchers because the previous section felt oversized, repetitive, and visually heavier than the game.
- Reduced the section heading to “Pick your signal,” shortened each mode description, and changed the phone layout to a shallow 2×2 grid with 52px thumbnails. Desktop now uses a slim four-across row.
- Added a browser assertion that keeps the entire phone mode launcher at 250px or less while preserving full-button tap targets and semantic mode labels.

### 2026-08-26 — Compact control and icon scale

- Reduced the visible size of header art, the Daily action, mode-card imagery, modal-title icons, help icons, lifeline art, and standard action buttons because the previous controls felt visually oversized.
- Kept header and lifeline touch targets at least 44px even when their artwork is smaller, preserving reliable phone interaction and accessibility.
- Added browser assertions for compact visible art, shorter home actions, and minimum tap-target sizes so future styling changes do not reintroduce oversized controls or tiny hit areas.

### 2026-08-26 — GitHub source of truth and living AI context

- Connected the existing build to `cyberpaapi/SixthSenseGame` as its GitHub source of truth.
- Added `AGENTS.md` so AI coding tools automatically receive the project invariants and the requirement to maintain this file.
- Added this comprehensive `GAME_KNOWLEDGE.md` covering gameplay, modes, economy, UI, data, architecture, persistence, verification, publishing, decisions, and limitations. This was requested so future AI contributors can continue from current context instead of rediscovering or contradicting prior decisions.
- Corrected shared-result denominators to use `Core.MAX_GUESSES`, ensuring the seven-chance build shares `/7` instead of the earlier hard-coded `/6`.

### 2026-08-26 — Repeatable assistance and motion pass

- Made Peek, Clear, and Skip repurchasable and reusable whenever inventory/effect availability allows. This supports the requested inventory economy instead of permanently exhausting each action after one use.
- Made repeated Peek select distinct unrevealed positions and repeated Clear select unique new impossible letters, so repeat purchases always provide new value.
- Kept Sense as a one-time per-puzzle unlock that can be reopened freely, matching its special clue behavior.
- Added short purchase, use, reveal, removal, wallet, unavailable, screen-entry, and state-change animations. All respect reduced-motion preferences.
- Prevented the game screen from acquiring transient vertical scroll during entry motion.

### 2026-08-26 — Economy and lifeline dock

- Added persistent coins, inventory, per-lifeline prices, purchase/use separation, and attempt-based solve rewards. The economy gives successful play a useful progression loop.
- Moved icon-only lifelines below the keyboard and evenly spaced them for thumb reach and a cleaner puzzle surface.
- Added conditional price and stock presentation: price at zero stock, badge when stocked, and no redundant zero.
- Added a centered, five-second Sense bubble that can show the same clue again after unlock.

### 2026-08-26 — Focused game layout and additional modes

- Moved mode selection and descriptive content to a separate home screen so the play screen stays focused.
- Added Sprint, Insight, and Streak alongside Daily and Practice to provide time pressure, assisted play, and run-based progression.
- Replaced the old game-card heading/switch block with a compact mode-status line under the brand.
- Removed the extra home stat strip and represented Daily streak progress with a top seven-step rail.
- Increased the guess limit from six to seven at the user’s request.
- Locked the phone game screen to one dynamic viewport and fixed grid/keyboard/lifeline spacing to avoid overlap and scroll.

### 2026-08-26 — Vocabulary, feedback, and puzzle quality

- Expanded accepted guesses to a 32,068-word six-letter dictionary so ordinary words are much less likely to be rejected.
- Built a 5,000-word answer pool ranked toward common words, with a clue for every answer.
- Explicitly included `raffle` and `rattle` as accepted guesses and possible answers after they were reported missing.
- Restored persistent keyboard feedback using green, orange, and near-black states so players can see exact, misplaced, and absent letters at a glance.
- Preserved correct repeated-letter scoring and added automated coverage.

### 2026-08-26 — Original vibrant identity

- Shifted the earlier dry palette to a vivid purple/pink/cyan/yellow claymorphic visual system.
- Added original generated home, mode, control, and supporting icon artwork instead of generic stock symbols or black text buttons.
- Added a 3×3 set of nine generated logo choices with persistent selection; logo option 1 is the current default.
- Removed verbose “Read the signs” and genre-disclaimer marketing copy from the visible home experience because the user wanted a cleaner, more visual presentation.
- Kept original terminology, imagery, copy, and layout so the game participates in the letter-deduction genre without infringing Wordle branding.
