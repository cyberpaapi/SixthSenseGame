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

Sixth Sense is an original, mobile-first word deduction game with solo and private-room multiplayer. Every puzzle answer has six letters. The player has seven guesses. Feedback is presented through both color and symbols:

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

The home screen exposes eight modes:

| Mode | Current behavior |
| --- | --- |
| Daily | One deterministic UTC puzzle per day. Daily completion updates played, win rate, guess distribution, and daily streak. Every seventh consecutive Daily win adds a visible 30-coin streak reward. |
| Adventure | A persistent 10,187-level solo journey through every answer exactly once. Each device receives a seeded randomized order inside each tier: all 4,309 Normal levels first, then 1,995 Hard, then 3,883 Extreme. Those totals and difficulty names remain off the newcomer-facing map. The dedicated map loads only the current zone and uses a generated endless ladder built directly into the scene. Every image window carries exactly eight consecutive overlaid level markers: normally three previous, the current level, and four upcoming; the opening window is levels 1–8. After either a solve or a paid Skip, the app returns automatically to the map, advances exactly one rung, and animates the selected animal to its new position. |
| Practice | Unlimited randomly selected puzzles. A Skip starts a fresh Practice puzzle. |
| Time Tackle | A Practice-style puzzle with a ten-minute deadline. Its internal key and storage key remain `sprint` for save compatibility. A zero timer ends the puzzle as a loss. |
| Insight | Starts with the clue unlocked and one deterministic answer position revealed. |
| Streak | Consecutive wins grow a separate mode streak; a loss or Skip resets that run. |
| Race | A room-code match for 2–8 players. The host chooses Normal, Hard, or Extreme and a 3-word Sprint, 5-word Normal, or 10-word Marathon. Everyone receives the same ordered words; the first player to solve the full route wins. A shared thin green course places each avatar at live proportional progress and ends at a black-and-white checkered finish. |
| VS | A two-player point duel with host-selected 3-round Quick, 5-round Classic, 9-round Epic, or Endless play. Both players receive the same word each round and see each other's name, score, and feedback patterns in real time, but never the opponent's letters. The first correct guess wins one point and advances both screens to the next shared word. Exhausting seven attempts or using Skip forfeits that round and gives the opponent its point. Finite matches end after the selected number of rounds; Endless continues until either player uses the explicit Leave game control. |

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
| Skip | 6 | Can be stocked, consumed, purchased again, and reused. Solo use asks for confirmation. Daily counts as a loss; Streak counts as a loss and resets the run; Practice, Time Tackle, and Insight begin a fresh puzzle. Adventure reveals the current answer, advances one rung, and returns to the map. Race advances only that player without counting a solve; VS forfeits the point and advances both players. |

Inventory and coins persist in `localStorage`. The bottom dock appears in solo and multiplayer play and shows only icons. If stock is zero, the price appears below the icon. If stock exists, the price disappears and a stock count appears on the icon. Redundant zero stock is never shown. Buying and using are deliberately separate taps so a purchase is not consumed accidentally. Multiplayer Sense/Peek/Clear effects are resolved by the authoritative API so the client receives only the purchased clue result, never the answer.

## Current experience and visual system

- Visual direction: vibrant claymorphism with purple, pink, cyan, yellow, and orange depth lighting.
- Home: generated observatory hero art, a seven-day streak progress rail with a 30-coin reward icon, a Daily call-to-action, a major Adventure launcher, generated Race/VS launchers, and the compact four-mode solo launcher. Play Together now appears above Game Modes. The two redundant section subtitles were removed, and Race/VS use newly generated independent clay scenes. On phones, the Daily and Adventure feature cards each occupy approximately half of the small viewport.
- Adventure: three original generated portrait environments—Sky Garden, Ember Canopy, and Cosmic Prism—each contain a monumental endless golden ladder as part of the raster artwork. The old winding-road scenes are no longer referenced, and no CSS rails or rung elements duplicate the illustrated ladder. Only the active zone asset is loaded at runtime; exactly eight semantic level markers align to eight evenly spaced painted-rung positions. A one-level win animates the animal upward from the completed rung; reduced-motion players receive the settled state immediately. It is original genre-inspired progression presentation and does not use Candy Crush art, characters, candy motifs, branded copy, or copied level UI.
- Game screen: visible Sixth Sense branding, a compact game-mode line, coin count at top right, seven-row letter grid, color-state keyboard, and an evenly spaced bottom lifeline dock.
- The selected animal avatar appears as a clean circular header icon with no square pedestal, so identity is visible on home, solo, and online screens. It is also the entry point to a personal profile sheet showing unique words solved, total solves, best attempt count, fastest word/time, best streak, general Adventure status, and coins. Beside it, the chosen generated wordmark uses two compact rows of glossy sculpted blocks spelling `SIXTH` and `SENSE`.
- Identity Studio contains nine free generated animals plus nine generated premium animals—red panda, capybara, raccoon, snow leopard, phoenix, dragon, unicorn, otter, and chameleon—unlockable for 45–65 coins. Four generated premium avatar frames—Aurora, Sunburst, Prism, and Champion—cost 30–45 coins. Purchases persist locally, equip immediately on the header/profile/Adventure token, and synchronize into an active room. Eight free highlight colors and the editable username remain. The top-left profile now links directly to these controls.
- Online play has a persistent visible Leave game control and the same four coin-powered lifelines as solo play. Race uses a shared thin green course with moving avatar tokens and a checkered finish. VS keeps both names and point totals above the board, shows finite point-progress bars, and renders each opponent attempt as six color/symbol-state pips without exposing letters. A synchronized centered transition announces the point winner and new word on both clients whenever the authoritative round number advances.
- Controls: generated image assets are used for major home, settings, help, stats, sound, and lifeline actions instead of generic black buttons. Visible icon art is intentionally compact inside touch targets that remain at least 44px on phones.
- The generated house control has an optical-centering correction wherever it appears, compensating for asymmetrical transparent weight without shrinking or shifting its 44px-or-larger touch target.
- The Daily action, mode cards, modal-title art, and decorative streak/lifeline imagery use a compact scale so controls support the game rather than dominating it.
- The game screen is locked to one dynamic viewport and must not create page-level horizontal or vertical scrolling, including during screen-entry animation. Its footer no longer exposes an 8px maroon background gap, and phone layouts preserve the cost chip below every lifeline.
- Purposeful motion includes letter entry pop, row rejection shake, tile reveal, Peek reveal, Clear key removal, lifeline purchase/use/unavailable states, wallet spend/denial, screen entry, result sheet timing, and win confetti.
- All optional motion collapses under `prefers-reduced-motion`.
- Audio uses an original procedural Web Audio system with two independent persistent controls: Music runs a low-volume 32-step “aurora claybeat” of soft pads, bass pulses, and pentatonic plucks; Sound effects covers letters, deletion, the three tile states, invalid actions, coins, each lifeline, room actions, wins, and losses. It works without downloaded audio files and begins only after the first user gesture, as required by mobile browser autoplay rules.
- Dark and high-contrast modes are available. Dark mode preserves four visually distinct keyboard treatments: untested purple, Aligned green, Echoing orange, and Quiet charcoal, with the `●`, `◆`, and `×` markers retained.
- The UI supplies visible keyboard color states, color-independent symbols, semantic buttons, ARIA labels, focus styles, first-visit help, and a skip-to-content link.
- The Settings sheet remains touch/wheel scrollable but hides its visual scrollbar for a cleaner popup edge.

## Intentional removals and simplifications

The following items were removed because they made the interface feel crowded or derivative:

- The old home statistics strip showing day streak, puzzles, and solved percentage. Streak is now communicated by the top progress rail.
- The game-card heading block containing puzzle number, “Sense the six,” and the Daily/Practice switch.
- The verbose “Read the signs / Every color speaks” marketing section and the genre disclaimer from the home content.
- Text labels around the lifeline dock. Meaning is carried by original icons, accessible names, prices, stock badges, and the help modal.
- Temporary “tries left” bubbles after valid guesses.
- Visible Adventure difficulty and current-level hints on the launcher, map chrome, puzzle status, and profile. Numbered ladder rungs retain progression clarity, while semantic level labels remain available to assistive technology.

## Architecture and file map

This is a framework-free browser client with a small Vercel serverless multiplayer API. Solo play remains fully local and works without the API. Online rooms require a Postgres-compatible `DATABASE_URL`; Neon is the intended Vercel integration. There is no account system.

| File or directory | Responsibility |
| --- | --- |
| `index.html` | Semantic home/game screens, modal content, settings, stats, icon dock, and script loading order. |
| `styles.css` | Responsive claymorphic presentation, phone viewport fitting, dark/high-contrast themes, keyboard states, modal styling, and all motion. |
| `game-core.js` | Environment-neutral rules: constants, answer/guess loading, repeated-letter scoring, hard-mode validation, daily/practice selection, deterministic seeded Adventure shuffling/progress, and coin rewards. It exports to both browser globals and CommonJS tests. |
| `app.js` | Browser state, rendering, input, modes, Adventure map/progress, persistence, inventory/economy, streak rewards, cosmetic unlocks, modals, animations, the procedural soundtrack/effects engine, sharing, and statistics. It exposes `window.SixthSenseAudio` and a narrow `window.SixthSenseEconomy` interface so multiplayer shares the same sound and wallet state. |
| `multiplayer.js` | Room create/join/leave flows, resume-token session state, polling/reconnect, online board/keyboard/lifeline rendering, the shared Race course, VS series progress, attempt patterns, and live identity synchronization. |
| `api/multiplayer.js` | Vercel serverless authority for codes, seats, room lifecycle, answer selection, guess validation/scoring, lifeline effects, identity updates, CAS revisions, idempotency, results, and redacted snapshots. It creates and migrates its Postgres tables idempotently after a database is connected. |
| `answer-bank.js` | 10,187 answer objects with a six-letter `word`, `clue`, and `tier`. Loaded before `game-core.js` in the browser and required by the server. |
| `word-bank.js` | Expanded accepted-guess vocabulary. Loaded before `game-core.js` in the browser. |
| `scripts/build_word_banks.py` | Deterministically audits and regenerates both banks from a hash-verified ENABLE lexicon, pinned `wordfreq`, and WordNet. |
| `scripts/requirements-word-banks.txt` | Pinned build-time Python dependencies for vocabulary regeneration. |
| `VOCABULARY_AUDIT.md` | Acceptance criteria, before/after counts, source hash, and reproducible audit instructions. |
| `assets/` | Generated logo, hero, three separate Adventure zone maps, mode, control, and supporting icon artwork. WebP is preferred for scene imagery; transparent PNG/WebP assets are used for controls. |
| `package.json` / `package-lock.json` | Reproducible Node dependencies plus explicit static build and test scripts. The runtime dependency is the Neon serverless Postgres driver. |
| `vercel.json` | Explicit repository-root static output, Vercel function duration, and no-store API headers. |
| `manifest.webmanifest` | Installable web-app metadata and default logo icon. |
| `favicon.svg` | Fallback favicon; the fixed primary brand logo remains the runtime favicon. |
| `.nojekyll` | Tells GitHub Pages to publish the repository as a plain static site without Jekyll processing. |
| `.github/workflows/pages.yml` | Builds and deploys the static repository to GitHub Pages on each push to `main` or a manual dispatch. |
| `.gitignore` | Excludes Vercel's local project link, pulled environment files, installed Node dependencies, and Python cache files created during vocabulary regeneration. |
| `test-core.js` | Node assertions for data shape/counts, RATTLE/RAFFLE coverage, scoring, hard mode, dates, attempts, costs, and rewards. |
| `test-browser.js` | Playwright end-to-end QA for onboarding, modes, lifelines, coins, repeated use, keyboard states, solving, logo settings, themes, screenshots, and overflow. |
| `test-production-multiplayer.js` | Public-URL Playwright acceptance test using two isolated browser contexts for create/join/start, opponent attempt visibility, and synchronized VS round advancement. |
| `THIRD_PARTY_LICENSES.md` | Attribution and licenses for dictionary, frequency-ranking, and clue source data. |
| `README.md` | Concise setup and feature overview. |
| `AGENTS.md` | Mandatory instructions for AI contributors, including this document’s update rule. |
| `GAME_KNOWLEDGE.md` | This canonical living context and change record. |

Keep the script order in `index.html`: `answer-bank.js`, `word-bank.js`, `game-core.js`, `app.js`, then `multiplayer.js`.

## Data and selection

- Answer pool: exactly 10,187 unique, clueable, answer-safe six-letter words.
- Player-facing difficulty names are Normal, Hard, and Extreme. For backward-compatible data, API, and saved-state stability, their internal keys remain `easy`, `medium`, and `extreme` respectively.
- Normal (`easy`): exactly 4,309 familiar primary answers. Hard (`medium`): 1,995 less-common answers with remaining Zipf frequency at least 2.0. Extreme: 3,883 final rare, specialist, archaic, or unusual answers.
- Accepted guesses: exactly 15,232 unique six-letter words from the proper-name-safe ENABLE word-game lexicon, including every answer.
- `raffle` and `rattle` are both accepted guesses and possible puzzle answers.
- Every answer has a Sense clue.
- The accepted vocabulary includes legitimate uncommon, technical, archaic, and inflected word-game entries, while excluding ordinary names, places, trademarks, malformed inflections, abbreviations, and corpus noise.
- All clueable eligible guesses with a usable non-proper WordNet clue and no answer-only safety exclusion are answers. The Easy tier is frequency-ranked to exactly 4,309 with explicit familiar-word rescues. Medium uses the remaining Zipf ≥2.0 words; Extreme contains the remainder.
- The 2026-08-27 full audit retained 14,850 old guesses, removed 17,218 unsupported entries, added 382 valid omissions, retained 4,782 old answers, and replaced 218 answers.
- Sense clues may not contain their own answer, broken placeholder/example text, proper-name definitions, or offensive senses. The audit preserved 4,633 clean existing clues, repaired 149 retained clues, and generated clues for 218 new answers.
- `coates` is excluded from both banks because it entered as a surname/malformed inflection with the clue for `coat`.
- Source notices are preserved in `THIRD_PARTY_LICENSES.md`.

Do not casually regenerate either bank. Any regeneration must preserve format, licenses, six-letter filtering, uniqueness, all-answer inclusion, clue completeness, required common words, and automated counts.

## Runtime state and persistence

Solo state is local to the browser. There is no login or cross-device synchronization. Online room state is durable in Postgres for 24 hours, and each browser seat is protected by a random resume token whose SHA-256 hash is stored server-side.

Current `localStorage` keys:

- `sixth-sense.daily.v1`
- `sixth-sense.practice.v1`
- `sixth-sense.sprint.v1`
- `sixth-sense.insight.v1`
- `sixth-sense.streak-mode.v1`
- `sixth-sense.adventure.v1`
- `sixth-sense.stats.v1`
- `sixth-sense.settings.v1`
- `sixth-sense.visited.v1`
- `sixth-sense.online.identity.v1`

Game records include answer/clue, mode, date, puzzle number, guesses, current status, clue state, Peek positions/use count, cleared letters/use count, skip state, solve/streak reward and stat-recording guards, solve-start time, the backward-compatible Time Tackle deadline, and Adventure level/seed when relevant. The current game schema uses `version: 3`.

Statistics include Daily play/win/streak fields, the last rewarded seven-day milestone, seven-slot guess distribution, wallet, persistent lifeline inventory, Streak-mode run, best Streak-mode run, an Adventure seed/current level, the unique solved-answer list used for silent tier progression, total solves, best attempt count, and the fastest timed word. New fields use backward-compatible defaults. Settings include hard mode, contrast, dark mode, independently stored music/effects, selected animal and color, selected avatar decoration, and locally unlocked premium avatars/decorations. The former single `sound` preference still migrates safely.

Online room rules and security:

- Codes are generated by the server and omit visually ambiguous characters.
- Race capacity is 8; VS capacity is 2. A match needs at least 2 players and only the host can start.
- Usernames persist per device and are case-insensitively unique within an online room. Global username reservation is not claimed because the game has no account system.
- All players receive the same server-selected sequence from the room's explicit difficulty tier. Personal solo unlock state is irrelevant.
- The API validates accepted guesses and scores them server-side. Snapshots never include answer words. Opponents receive score patterns only; the current player receives their own submitted letters and scores.
- Multiplayer lifelines are authoritative: the API stores private per-player clue/Peek/Clear state, returns only the purchased effect to that seat, clears assistance on round/word advancement, and treats a VS Skip as a server-resolved forfeit. Wallet ownership remains device-local until account-backed monetization exists.
- Avatar, accent, decoration, and username updates are accepted from an authenticated room seat and broadcast through subsequent snapshots; duplicate room usernames remain rejected.
- Mutations use player/room revisions for compare-and-set protection plus UUID action IDs for retry idempotency.
- The client uses 900ms bounded polling, persists one opaque active-room seat credential in site-scoped local storage, automatically restores that seat after refresh/reopen, catches up immediately after foreground/online recovery, and renders temporary connection errors without destroying room state.
- Race players who exhaust seven attempts restart that same word with a recorded failed batch. They do not advance until solving it. In VS, seven misses forfeit only the current point; both players then advance to the next word.

When changing stored shapes, add a safe migration or backward-compatible defaults. Never assume old players have every new field.

## Non-negotiable quality rules

- Preserve six-letter answers and seven chances unless the user explicitly changes the product.
- Preserve correct duplicate-letter scoring.
- Keep Easy at exactly 4,309 and preserve all clueable answer-safe words in the complete tiered answer bank unless an explicit product decision changes the target.
- Do not narrow accepted guesses in a way that rejects common words such as `raffle` or `rattle`.
- Keep the puzzle screen within 360×800 and 390×844 portrait viewports without page scrolling or horizontal overflow. Also keep 430×932 and representative desktop/landscape layouts usable.
- Keep the Adventure map within the same phone viewport without page-level scrolling; virtualize its route rather than creating thousands of level controls.
- Keep touch targets practical, keyboard navigation functional, browser zoom enabled, and focus visible.
- Never make color the only carrier of tile meaning.
- Preserve reduced-motion behavior when adding animations.
- Never make animation timing decide game legality or permanently block input.
- Keep lifeline prices, badges, wallet deductions, and saved inventory consistent.
- Do not commit secrets or add a client-side key.
- Never describe online rooms as production-ready unless a durable database is connected and two independent production browser sessions pass create/join/start/guess/reconnect tests.

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
node --check multiplayer.js
node --check api/multiplayer.js
node test-core.js
```

Browser checks require Playwright, Chrome/Chromium, and a running local server:

```powershell
$env:CHROME_BIN='C:\Program Files\Google\Chrome\Application\chrome.exe'
node test-browser.js
```

Current verified result on 2026-08-27:

- JavaScript syntax: passed.
- Core rules/data: passed — 10,187 answers across player-facing Normal 4,309 / Hard 1,995 / Extreme 3,883 and 15,232 accepted guesses; all answers are guessable; progression and named familiar-word regressions pass.
- Vocabulary audit: passed — hash-verified source, deterministic bank output, no duplicate/invalid-length entries, and no clue answer leaks, broken placeholders, proper-name senses, or offensive senses.
- Browser QA: passed — 390×844 and 360×800 no-scroll puzzle HUD with all four prices visible and no bottom color gap; solve/Skip Adventure auto-return and one-rung movement; seven-day coin reward; Time Tackle; immediate free/premium avatar and decoration selection; profile-to-identity navigation; hidden-but-functional Settings scroll; generated Play Together art/order; explicit multiplayer leave control; four multiplayer lifelines; thin green Race course with avatar token/checkered finish; VS score/pattern/new-round synchronization; audio, dark-theme feedback, desktop layout, and overflow checks.
- Local server: HTTP 200 at `http://127.0.0.1:4173/`.
- Vercel production: Ready and HTTP 200 at `https://sixth-sense-game.vercel.app/`; runtime `20260827.14`, core CSS, JavaScript, answer data, manifest, artwork, and the serverless multiplayer API are live.
- GitHub Pages: built with HTTPS at `https://cyberpaapi.github.io/SixthSenseGame/`; the latest completed deployment workflow passed.
- Multiplayer production: activated through the Vercel Neon integration on its free plan with `DATABASE_URL` connected to Production, Preview, and Development. A public-URL acceptance test passed create/join/start with two isolated browser contexts, same-seat refresh rejoin, opponent attempt visibility in 1,967ms, server-hidden answers, and synchronized VS round advancement.
- The bundled broad project validator now reports three marker gaps: polling rather than WebSocket/SSE, its expected literal reconnect+snapshot marker is absent even though refresh/reopen seat restoration is implemented and production-tested, and there is no Force End/Play Again room lifecycle. The explicit static build now passes.

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

Vercel project `aryanchandwani-gmailcoms-projects/sixth-sense-game` is connected to the GitHub repository and is the primary production route. Vercel installs the small server dependency set, deploys the static client from the repository root, and assigns the stable production alias `https://sixth-sense-game.vercel.app/`. Local `.vercel` linkage metadata is intentionally ignored rather than committed.

GitHub Pages is active as a secondary route through `.github/workflows/pages.yml` at `https://cyberpaapi.github.io/SixthSenseGame/`. Its initial publication was delayed by the GitHub Actions and Pages incident active on 2026-08-26, but GitHub now reports the site as built and the latest completed deployment as successful. The repository remains public because the account plan does not support Pages for private repositories.

## Known limitations

- Solo progress, wallet, inventory, settings, and statistics are device/browser-local and can be cleared with site storage.
- The game does not provide accounts, cloud saves, or leaderboards.
- Production multiplayer uses 900ms bounded polling rather than WebSockets/SSE. It is playable and production-tested, but is not yet a push-realtime architecture.
- Online rooms expire after 24 hours and currently have no Force End or Play Again command. Players can leave and create a new room instead.
- Planned monetization is intentionally not active: the first three multiplayer match starts per player should be free, after which starting another match should require coins or an optional rewarded ad. This needs account/server-authoritative entitlement counters, ad-provider integration, consent/privacy handling, and abuse protection before implementation; do not enforce it from local storage.
- Premium cosmetic ownership and the coin wallet are currently device-local. Before real-money monetization, both must move to authenticated server-side ownership and purchase validation.
- The dictionary is deliberately broad but is not a promise to contain every historical, regional, inflected, or specialist six-letter form.
- Generated raster assets make the repository larger than a code-only static game; preserve optimized WebP versions where they exist.
- Google Fonts are imported from the network; system fallbacks remain available if that request fails.
- Browsers block audible playback before interaction, so the soundtrack intentionally starts on the first tap or key press rather than during page load. Automated QA verifies scheduling and settings state, but perceived loudness still depends on the device and its media volume.

## Change log and rationale

### 2026-08-27 — Adventure flow, multiplayer assistance, Time Tackle, rewards, and premium identity

- Changed Adventure completion and paid Skip to return directly to the map, advance exactly one rung, and animate the avatar to its new block. Removed the obsolete result-sheet detour and the old “Skip stays here” behavior.
- Renamed the solo Sprint surface to Time Tackle and expanded its deadline from 90 seconds to ten minutes while preserving the internal `sprint` save key. Added a seven-day Daily reward of 30 coins with a visible Champion icon in the home rail and earned-results state.
- Fixed the phone puzzle footer so lifeline costs remain visible inside the locked viewport, removed the exposed maroon bottom gap, and retained equal icon spacing and 44px touch targets.
- Added a clear Leave game control and authoritative Sense/Peek/Clear/Skip lifelines to Race and VS. Added server-migrated private lifeline state, idempotent effects, VS Skip forfeits, Race Skip advancement, and authenticated live identity updates without sending answer words to the browser.
- Replaced the Race progress cards on phones with a thin green shared course, live avatar tokens, and a black-and-white checkered finish. Play Together now precedes Game Modes, its redundant subtitle and the Game Modes subtitle are gone, and newly generated `multiplayer-race-v2.webp` / `multiplayer-vs-v2.webp` scenes replace the old shared sheet.
- Generated and optimized nine premium animal avatars plus four transparent premium frames. Coin purchases apply immediately, persist locally, appear on Adventure/profile/online avatars, and can be reached from the top-left profile. Recorded the future “first three multiplayer matches free, then coins or rewarded ad” model as planned—not active—because safe enforcement requires accounts and a server-side entitlement system.
- Extended Node and installed-Chrome Playwright coverage for the new behavior, including Adventure solve/Skip return, streak reward, premium purchases, explicit exit, multiplayer lifelines, Race geometry, mobile costs/no-scroll, dark mode, and two-client VS transitions. Versioned static runtime files as `20260827.15`.

### 2026-08-27 — Live Vercel/Neon multiplayer activation

- Published the complete current build from GitHub `main`, fixed Vercel's repository-root output configuration, and verified the stable production alias serves runtime `20260827.14`.
- Provisioned the Vercel Neon `sixth-sense-db` resource on the free plan and connected its managed `DATABASE_URL` to Production, Preview, and Development. The API initialized its durable schema on the first production room request; no database credentials enter the repository or client bundle.
- Added persistent active-seat restoration after refresh/reopen plus foreground/online catch-up, and added a reusable public-URL Playwright acceptance test.
- Production QA passed with two isolated browser contexts: create, join, host start, same-seat refresh rejoin, live opponent attempt patterns at 1,967ms observer latency, hidden answers, and synchronized round advancement.

### 2026-08-27 — Normal / Hard / Extreme difficulty labels

- Renamed every player-facing multiplayer difficulty from Easy / Medium / Extreme to Normal / Hard / Extreme and applied the same terminology to public-facing progression documentation.
- Preserved the internal `easy`, `medium`, and `extreme` keys so existing rooms, saves, answer-bank data, and progression logic remain fully compatible. Versioned static runtime files as `20260827.14`.

### 2026-08-27 — Point-based 3/5/9/Endless VS and persistent usernames

- Replaced route-race VS with authoritative shared rounds: the first correct solve earns one point, a seven-miss board awards the opponent the point, and a compare-and-set room update ensures only one result can resolve a round. Both players' boards reset together and a synchronized transition announces the point winner and new word.
- Replaced VS Marathon 10 with Epic 9 and added Endless. Race remains unchanged at 3/5/10. Finite VS ends after exactly 3, 5, or 9 points have been contested; Endless appends a fresh tier-correct answer after every round and does not auto-finish.
- Added persistent first-open username onboarding, username editing inside Identity Studio, profile name display, read-only reuse in room lobbies, and case-insensitive duplicate-name rejection inside each room. Global uniqueness still requires a future account service.
- Added visible two-player names/scores above the VS board, point-based progress cards, and server helper tests plus mocked two-client browser coverage for simultaneous round transitions. Versioned static runtime files as `20260827.13`.

### 2026-08-27 — Selectable 3/5/10-word VS matches (superseded)

- Exposed the shared Sprint (3), Normal (5), and Marathon (10) game-length control in the one-on-one VS lobby and sends the chosen length in the authoritative room-creation request.
- Removed the backend's forced one-word VS override. Both players now advance through the same selected route; first to complete it wins, while exhausting seven guesses on any word retains the existing immediate-concession rule.
- Added per-player VS series bars and combined word/attempt labels while preserving live color-pattern visibility. Added server normalization tests and browser coverage for five-word VS creation, room rendering, series progress, and opponent attempt patterns. Versioned static runtime files as `20260827.12`.

### 2026-08-27 — Half-screen Daily and Adventure cards

- Reduced the oversized phone Daily hero and normalized both primary home modes to `50svh`, bounded to 390–470px for the supported portrait range. Daily and Adventure now carry equal visual weight at roughly half a screen each.
- Preserved the generated artwork, copy, 48px primary actions, rounded clay surfaces, and desktop sizing. Added 390×844 browser assertions for exact half-viewport sizing and equal card heights. Versioned static runtime files as `20260827.11`.

### 2026-08-27 — Eight evenly spaced Adventure levels per image

- Expanded every Adventure image window to exactly eight consecutive levels. The standard window now shows three completed levels, the current avatar, and four upcoming levels; new players see levels 1–8 without loading the wider journey.
- Reused eight fixed painted-rung positions across all three generated zone scenes, preserving even vertical spacing, header/footer clearance, and the existing one-rung avatar climb.
- Added browser assertions for the eight-marker opening, post-win, and established-player windows plus minimum and consistent rung spacing. Versioned static runtime files as `20260827.10`.

### 2026-08-27 — Infinite ladder rebuilt into original Adventure art

- Replaced the earlier winding-road zone backgrounds with three completely new generated worlds whose endless golden ladder is part of the scene itself: Sky Garden (`adventure-zone-sky-ladder-v1.webp`, 216,222 bytes), Ember Canopy (`adventure-zone-ember-ladder-v1.webp`, 245,806 bytes), and Cosmic Prism (`adventure-zone-cosmic-ladder-v1.webp`, 224,590 bytes).
- Removed the CSS rail pseudo-elements, generated rung DOM, and rung-arrival styling. The runtime now overlays only the interactive level markers and selected animal on seven fixed painted-rung positions, avoiding the doubled, artificial-looking ladder treatment.
- Preserved the virtualized four-to-seven-marker window, one-rung climb animation, reduced-motion behavior, label-free map chrome, active-zone switching, and semantic level labels. Browser coverage now verifies the new assets, fixed rung spacing, and absence of a CSS/DOM ladder. Versioned static runtime files as `20260827.9`.

### 2026-08-27 — Label-free Adventure progression

- Removed visible `Easy`, zone-difficulty, and `Level N` hints from the Adventure home launcher, map header/footer, active puzzle status, and player profile. The map action now reads simply `Play`.
- Kept numbered ladder rungs as the sole visible progression cue and retained specific current-level text in ARIA labels, so the simplified visual design does not reduce screen-reader clarity.
- Updated browser coverage to reject difficulty/current-level copy across Adventure surfaces while verifying that the current rung still advances from 1 to 2. Versioned static runtime files as `20260827.8`.

### 2026-08-27 — House control optical alignment

- Corrected the visible house artwork by 2px left and 3px upward in both Adventure and online leave controls. The source PNG’s alpha-weighted artwork sits right and low inside its nominal square, so geometric centering alone appeared misaligned.
- Preserved the existing 44–48px semantic button boxes and added a browser assertion that calculates the rendered asset’s optical center while guarding the minimum touch target. Versioned static runtime files as `20260827.7`.

### 2026-08-27 — Endless Adventure ladder and climbing token

- Replaced the scattered Adventure nodes with one centered vertical clay ladder. Continuous gold rails extend and fade beyond the map viewport, while each virtualized nearby level receives a matching rung, creating an endless route without loading additional levels or artwork.
- Kept the newcomer-friendly window unchanged: Level 1 shows four rungs, and established players see no more than three previous, the current level, and three next levels.
- Added a real progression transition: when exactly one Adventure level is gained, the selected animal enters from the completed rung below, climbs the full distance to the new current rung, and settles with a short rung glow. Reloads, losses, skips, and multi-level storage changes do not fake the climb.
- Disabled the climb under `prefers-reduced-motion` and preserved the existing phone viewport, touch target, keyboard, semantic-current-level, zone asset, and no-scroll behavior.
- Added browser assertions for continuous ladder rails, centered rung geometry, one-rung climb distance, and animated progression evidence. Versioned all static runtime files as `20260827.6` to avoid stale mixed builds.

### 2026-08-27 — Welcoming Adventure window and player profile

- Removed all full-route and per-tier word totals from the Adventure launcher, map header, map footer, and active-puzzle detail. The complete 10,187-answer route still exists unchanged internally, but new players now see only their current zone and level.
- Reduced the virtualized map from 13 nearby nodes to a maximum of seven: up to three previous levels, the current avatar level, and up to three next levels. Level 1 intentionally exposes only levels 1–4, while established players retain enough backward context without loading the whole map.
- Generated three separate 900×1350 zone backgrounds—Easy Valley (236,790 bytes), Medium Skies (194,520 bytes), and Hard Summit (225,872 bytes)—and changed runtime rendering to reference only the current zone asset instead of the earlier combined world illustration.
- Made the clean circular header avatar a profile trigger. Its new sheet displays unique words solved, total solves, best attempt count, fastest word/time, best streak, current Adventure location, and wallet balance; new statistics migrate with safe defaults and wins are guarded against double-recording.
- Added browser regression coverage for the count-free newcomer experience, four/seven-node windows, medium-zone asset switch, personal-record persistence, pedestal-free avatar trigger, and phone overflow. Versioned all static runtime files as `20260827.5` to avoid stale mixed builds.

### 2026-08-27 — Complete Adventure signal trail

- Added Adventure as the major solo mode above the smaller mode shelf. Its saved per-device seed shuffles every tier independently while enforcing the complete sequence of 4,309 Easy, 1,995 Medium, and 3,883 user-facing Hard answers; the route contains all 10,187 answers exactly once.
- Generated and optimized the original 900×1350 WebP signal-trail environment (237,712 bytes): cyan beginner valley, coral middle sky, violet crystal summit, floating clay islands, observatories, and beacons. It deliberately avoids candy, copied characters, branded map language, and copied level UI.
- Added a dedicated full-height Adventure map with 13 virtualized nearby nodes, current-avatar placement, completed/current/locked states, region and total progress, and a direct current-level action. The map and its entry animation remain inside 390×844 and 360×800 without page scrolling.
- Adventure wins advance exactly one level and return to the trail; losses and Skip reveal the word but preserve the required level. The game record schema moved to version 3, while old records continue to merge with safe defaults.
- Hid the visual scrollbar only on the Settings sheet while preserving `overflow-y: auto`, touch scrolling, wheel scrolling, and keyboard access.
- Added deterministic route, uniqueness, exact tier-boundary, alternate-seed, map-order, advancement, responsive overflow, generated-art, and hidden-scrollbar browser regression coverage. Versioned the stylesheet and all runtime scripts together as `20260827.4` to prevent stale mixed builds.

### 2026-08-27 — Original music and tactile sound-effects suite

- Replaced the small collection of isolated sine beeps with an original, dependency-free Web Audio sound system. The background score is a gently evolving 32-step “aurora claybeat” built from soft chord pads, bass pulses, and alternating pentatonic plucks, so no licensed or downloaded music is required.
- Added purpose-specific effects for letter entry, deletion, Aligned/Echoing/Quiet reveals, invalid and denied actions, coin purchases, Sense, Peek, Clear, Skip, room entry/start, wins, and losses. Solo and multiplayer share the same audio service.
- Split the previous Sound setting into independent Music and Sound effects toggles. Both persist locally, react immediately, pause the music while the page is hidden, and migrate the former single preference without unexpectedly unmuting existing players.
- Respected browser autoplay policy by unlocking audio only from a user gesture, and added browser assertions for defaults, independent persistence, soundtrack scheduling, effects dispatch, and continued phone overflow safety.
- Versioned the five static runtime script URLs together so an ordinary refresh cannot combine the new settings markup with an older cached audio engine.

### 2026-08-27 — Selected clay wordmark applied

- Applied the user's chosen first option from the generated 2×2 logo study as the visible header wordmark on home, solo, and online screens.
- Extracted the two-row `SIXTH` / `SENSE` block design to genuine alpha transparency, corrected a baked checkerboard during validation, and optimized the final asset to 640×256 pixels (338,837 bytes).
- Replaced the temporary live-text wordmark while preserving the selected animal as an independent circular identity mark with no raised square pedestal.
- Added browser regression coverage for the exact image asset, compact phone sizing, persistent avatar switching, and the pedestal-free avatar treatment.

### 2026-08-27 — Tiered progression, animal identity, and private-room multiplayer foundation

- Expanded the puzzle-answer base from 5,000 to all 10,187 clueable, answer-safe candidates and assigned deterministic Easy (4,309), Medium (1,995), and Extreme (3,883) tiers. Solo non-Daily selection silently unlocks the next tier only after every word in the current tier has been solved; accepted guesses remain 15,232.
- Kept `raffle`, `rattle`, `brooch`, `napkin`, `pewter`, `tarmac`, `walrus`, `alcove`, `gopher`, and `magpie` in Easy because everyday familiarity is not perfectly represented by written-corpus frequency.
- Replaced the logo chooser with a generated nine-animal avatar sheet and eight highlight colors. The fixed app logo preserves branding while player identity now has a playful multiplayer purpose.
- Added generated Race/VS launcher art, a private-room lobby, difficulty and 3/5/10-word route controls, a desktop right-side/mobile compact progress track, and live VS color-pattern attempts.
- Added a Vercel serverless Postgres authority with server-created room codes, durable 24-hour rooms, unique resume-token seats, capacity enforcement, host-only starts, server-side answer selection/guess validation, redacted snapshots, CAS revisions, action idempotency, and bounded polling reconnects.
- Added Node package metadata, Neon serverless driver, Vercel function configuration, tier/progression tests, avatar/accent persistence tests, and a mocked two-player VS browser test. Production multiplayer remains intentionally marked inactive until the user connects the required database resource and the two-browser production test passes.

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
