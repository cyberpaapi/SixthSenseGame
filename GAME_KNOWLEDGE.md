# Sixth Sense — living game knowledge

> Canonical context for humans and AI contributors. Read this file before making changes.

Last updated: 2026-09-18

Last verified: 2026-09-18 (Fresh economy-v9 500-coin reset: core, migration, live-policy/cross-tab/offline, syntax and public packaging checks passed locally; four old public-client pages reset automatically across actual deployment; public migration/earn/reload checks passed on both origins.)

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

Sixth Sense is an original, mobile-first word deduction game with solo and private-room multiplayer. Every puzzle answer has six letters. New puzzles have six standard guesses, followed by one optional Last Chance. Feedback is presented through both color and symbols:

- Aligned: green plus `●` — correct letter in the correct position.
- Echoing: orange plus `◆` — correct letter in a different position.
- Quiet: near-black plus `×` — letter is not used at that point after repeated-letter accounting.

The game is inspired by the broad genre of classic letter-deduction puzzles, but its name, visual system, terminology, copy, artwork, iconography, modes, clue economy, and interface composition are original. Do not add Wordle logos, copied art, copied copy, title treatment, or a deliberately imitative branded layout.

## Current game rules

- Word length: 6 letters.
- Standard guesses: 6; maximum 7 after one optional Last Chance (legacy saves/rooms retain their recorded limit).
- Accepted input: physical keyboard, onscreen keyboard, touch, optional physical Enter, and Backspace/Delete. Entering the sixth letter submits the row immediately in solo, Race, and VS; there is no onscreen Enter key.
- A guess must contain exactly six letters and exist in the accepted-guess dictionary.
- Scoring handles repeated letters correctly: exact positions are allocated first, then remaining answer-letter counts are used for misplaced matches.
- The player has six standard guesses. After six misses, Last Chance offers one seventh and final row for 125 coins or an optional native rewarded ad. Coins are not spent on the ad path; only the earned callback grants the extra row. Plain web has the coin option only.
- A loss reveals the answer.
- Hard mode requires all previously revealed exact positions and minimum known letter counts to be reused.
- The Daily puzzle is deterministic from the UTC date. The puzzle number counts from 2026-01-01.
- A completed result can be shared with original symbols and the dynamic attempt-limit denominator.

## Modes

The home screen exposes nine modes:

| Mode | Current behavior |
| --- | --- |
| Daily | One deterministic UTC puzzle per day. Daily completion updates played, win rate, guess distribution, and daily streak. Every seventh consecutive Daily win adds a visible 300-coin streak reward. A finished Daily always opens its saved completion card when re-entered, and OK returns home. |
| Adventure | A persistent 10,187-level solo journey through every answer exactly once. Each device receives a seeded randomized order inside each tier: all 4,058 Normal levels first, then 2,246 Hard, then 3,883 Extreme. Those totals and difficulty names remain off the newcomer-facing map. The dedicated map loads one eight-level zone page at a time over a generated endless ladder. Completed levels remain selectable for replay, while vertical swipes/up-down controls preview other pages; only the unreached level nodes themselves are chained and disabled, never the full map. After either a solve or paid Skip on the current level, the app advances exactly one rung, shows the shared result card, and returns to the map after OK. |
| Practice | Unlimited randomly selected puzzles. A Skip starts a fresh Practice puzzle. |
| Time Tackle | A Practice-style puzzle with a ten-minute deadline. Its internal key and storage key remain `sprint` for save compatibility. A zero timer ends the puzzle as a loss. |
| Insight | Starts with the clue unlocked and one deterministic answer position revealed. |
| Streak | Consecutive wins grow a separate mode streak; a loss or Skip resets that run. |
| Race | A room-code match for 2–8 players. The host chooses Normal, Hard, or Extreme and a 3-word Sprint, 5-word Normal, or 10-word Marathon. Everyone receives the same ordered words; players can join while the race is running and space remains, starting at word one without resetting existing racers. Finished/expired races cannot be joined. The first player to solve the full route wins. A slim vertical green course beside the board places all avatars at the same bottom baseline initially and moves them upward with completed words to a checkered finish at the top. |
| VS | A two-player point duel with host-selected 3-round Quick, 5-round Classic, 9-round Epic, or Endless play. Both players receive the same word each round and see each other's name, score, and feedback patterns in real time, but never the opponent's letters. The first correct guess wins one point, earns 60% of the equivalent solo coin reward, and advances both screens. Skip is unavailable. In newly created updated-server rooms, after six misses Last Chance can unlock a seventh attempt; declining or missing it awards the opponent the point. |
| Co-op | A 2–4-player shared-word journey with 3, 5, or 10 words. Everyone receives the same route and the first teammate to solve a word advances the entire room. Teammates retain private boards and authoritative lifelines while progress and transitions are shared. |

The app opens on the home screen. Game-adjacent marketing, mode selection, and streak progress live outside the focused puzzle screen.

### Short goals and mastery

- A compact home shelf below Adventure shows Today's trio and a mastery bar, using the existing generated visual language. Trio counts three **different solo answers solved in the current UTC day** and credits a fixed 60-coin bonus once. Skips, losses, Adventure replays, duplicate words on the same day, and reopened result cards do not advance or repay it. A new UTC day begins a new trio without taking away coins or mastery. Completing all three is a natural stopping point, not a forced continuation.
- Mastery is derived from cumulative earned solo points, with a new level every 3,000 points. Titles are Curious mind, Pattern finder, Word explorer, Sharp thinker, Signal seeker, and Sense master; the last title persists while numeric mastery continues. Historical points count immediately. There is no separate mastery currency, extra rank payout, wallet reset, or account requirement.
- Solo win cards show mastery progress, actual personal-best timing/attempt improvements, and trio progress/bonus when relevant. Coin totals include only coins actually credited under the 99,999 cap. Practice, Time Tackle, Insight, and Streak offer optional **Next word** beside the existing green OK. Time Tackle's action explicitly says it starts a fresh ten-minute word. Daily OK still returns home; Adventure OK still returns to its map. No automatic next-word trigger, coercive timer, random reward schedule, energy gate, or new ads were added.
- Confetti, sound settings, and reduced-motion support remain. Recorded applause and a party blower now accompany wins; losses use the recorded crowd reaction described in the audio section. Reduced motion clears animation/transition delays as well as durations so result letters appear promptly. The phone Co-op thumbnail fits its grid-column width.

## Coins, rewards, and lifelines

### iOS port status

On September 16 the user authorized an iOS port with GitHub-hosted standard macOS builds while developing on Windows. `IOS_RELEASE.md` records the owner inputs, staged implementation, verification requirements and current limitations. No iOS native target, monetization bridge, signing workflow or TestFlight upload exists yet. The shared game/backend can be reused; Android native ads and Play purchases require iOS-specific counterparts. Apple membership status, test iPhone access, iOS AdMob IDs, signing and store configuration remain unconfirmed.

### Android ads and purchases

The local Android project uses Capacitor 8.5.1, Java 21 and target/compile API 36, package `com.sensei.sixthsense`, developer Sensei, support `aryanchandwani@gmail.com`, intended audience 13+. Confirm package availability before the first Play upload. The user approved a one-time banner-removal purchase that retains optional rewarded ads. See `ANDROID_RELEASE.md` for remaining account configuration, real-device/Play testing and release gates.

`SenseiMonetizationPlugin.java` integrates Google Mobile Ads 25.4.0, UMP 4.0.0 and Play Billing 8.3.0. Banners occupy reserved native space on home and below the solo/online lifeline docks, with an 8 dp separator, and hide during maps and dialogs. The native WebView shrinks above the ad; six/seven-row boards (legacy puzzles can retain seven/eight rows) fit their available space while keys/lifeline buttons stay 44 px high. Landscape places boards beside controls. Adaptive banners reload on configuration changes; obsolete ad-load callbacks are ignored. Solo success cards offer an extra 2× the original solve coins after the native earned-reward callback, for 3× total solve coins, capped by wallet room. Points, mastery, trio and streak bonuses do not multiply. Losses/skips/replays and already-claimed rewards are excluded. A native pending receipt survives interruption; `stats.rewardedClaims` records actual credited coins in the same atomic localStorage write as the wallet. This remains device-local virtual currency without authenticated cloud progress or AdMob server-side verification.

The non-consumable `remove_banner_ads` product uses Play's localized price. Purchase/restore and foreground queries verify ownership via `/api/play-purchase`, which checks and acknowledges through Android Publisher API and stores token hashes/entitlement state in Neon. Native SharedPreferences cache verified ownership for up to seven days offline; successful inactive/refund checks clear it earlier. No web localStorage flag grants a paid entitlement. Real-time developer notifications are not configured. The owner reports Play Console verification complete and AdMob registration complete. The supplied AdMob app ID `ca-app-pub-2917215510689928~6202702379` and banner ID `ca-app-pub-2917215510689928/9942249790` are saved in local ignored `android/release.properties`; the rewarded ID `ca-app-pub-2917215510689928/3865769915` is also configured, and `releaseChecklistApproved` remains false. Public configuration recovery values and account context are recorded in `ANDROID_RELEASE.md`. AdMob app/store verification and live serving, Play product/pricing, service-account configuration, deployment and real store testing remain incomplete. The owner supplied an upload key through Studio and the first signed internal AAB now exists. Local releaseChannel=internal uses Google sample ad IDs, as does debug; production uses the real IDs and still requires releaseChecklistApproved=true. Both release channels require valid configured IDs/HTTPS and signing, supplied either by the Studio wizard or local properties. An omitted channel defaults to production; unknown values fail. Do not promote the sample-ad internal bundle to public production.

Checkout first requires a JSON readiness response from the verification endpoint. This checks server environment configuration, not the validity of the service account's Play permissions; real-track verification remains mandatory. Purchase requests are limited to 15 per minute per keyed connection bucket, stored in Neon and cleaned after one day on subsequent requests. Raw purchase tokens are never stored. WebView inspection is enabled only in debug builds. Android cloud backup/device transfer excludes local progress and native receipts; restore the paid entitlement through Google Play after reinstalling.

The local age-band screen collects no DOB: under-13 selections skip ad/billing initialization; under-18 selections use under-age-of-consent settings and PG ad content. UMP runs before ads, with privacy options when required. `privacy.html` is available offline from Settings. Native Back retains leave confirmation. Immersive fullscreen hides status/navigation bars, supports transient swipe reveal and returns after ads/resume; the game background extends behind the camera while CSS header padding protects controls. Side/bottom cutout and IME insets remain. The age question is neutral and no longer advertises ad exemptions; UMP does not determine age for the app. Solo assets/audio/fonts are bundled; multiplayer retains the existing HTTPS Vercel/Neon authority. Cloudflare is optional, not a dependency.

Starting wallet: 500 coins. The wallet hard-caps at 99,999 across saved-state loading, solo rewards, Daily streak rewards, multiplayer credits, and refunds; a reward that crosses the ceiling grants only the remaining room. Economy version 9 resets every existing pre-version-9 saved wallet to exactly 500 once on its next load, without changing progress, inventory, cosmetics, or statistics. Solving rewards fewer coins as more attempts are used:

| Attempts | Coins earned |
| ---: | ---: |
| 1 | 140 |
| 2 | 120 |
| 3 | 100 |
| 4 | 80 |
| 5 | 60 |
| 6 | 40 |
| 7 | 20 |

VS solve rewards are exactly 60% of the matching solo reward: 84, 72, 60, 48, 36, 24, or 12 coins for attempts one through seven. Skip never awards coins.

Each successful puzzle also earns visible mastery points from 700 for a first-try solve down to 100 on the seventh try. Puzzle points and cumulative `totalPoints` are distinct from spendable coins.

Lifeline prices and behavior:

| Lifeline | Cost | Current behavior |
| --- | ---: | --- |
| Sense | 30 | If stock is zero, one tap buys and consumes the token immediately and unlocks the clue. Once unlocked, the same clue can be reopened freely for that puzzle. It appears in a centered confirmable popup. |
| Peek | 50 | Can be stocked, consumed, purchased again, and reused. If stock is zero, one tap buys and uses it. Every use reveals a position that is neither green in any earlier guess nor already revealed. Solo and authoritative multiplayer share the same rule; Peek disables when all positions are known, without spending another item or coins. Repeated letters at different unknown positions remain eligible. |
| Clear | 40 | Can be stocked, consumed, purchased again, and reused. If stock is zero, one tap buys and uses it. Every use marks up to three new unique letters that cannot occur in the answer, until no candidates remain. |
| Skip | 60 | Solo only: can be stocked, consumed, purchased and reused. Reveals the answer, awards no coins, advances only after green OK; Adventure advances the current rung. Hidden and server-rejected in VS, Race and Co-op. A multiplayer Skip already pending before this release may complete its existing confirmation so active rooms do not get stuck. |

Inventory, coins, points, and economy version persist in `localStorage`. Coin totals are normalized into the inclusive 0–99,999 range whenever loaded or credited, so malformed/oversized saves and repeated rewards cannot create a sixth digit. The bottom dock appears in solo and multiplayer play and shows only icons. If stock is zero, the price appears below the icon. If stock exists, the price disappears and a stock count appears on the icon. Redundant zero stock is never shown. Zero-stock lifelines buy and use atomically from the player’s perspective; Skip delays the charge until its confirmation. Economy version 9 performs the latest universal reset: every wallet saved under versions 1 through 8 is assigned the same 500-coin baseline once, then ordinary earnings and spending persist normally. Multiplayer Sense/Peek/Clear effects remain authoritative so the client receives only the purchased clue result, never the answer.

Updated web clients also read public `economy.json` on startup, every 30 seconds while visible, and on foreground/online recovery, with cache bypass, an 8-second abort and no duplicate in-flight requests. A higher resetVersion with a matching startingCoins baseline sets the local wallet to exactly 500 once; the compiled version never downgrades an already-applied newer version. Storage events synchronize updated-tab balances and repair a stale pre-reset wallet write from an old tab. Puzzle/progress fields are preserved during policy resets and later earnings/spending remain normal. This is still a device-local, client-editable wallet, not a centrally enumerated/authoritative account ledger: old already-open clients need a refresh to install the latest client (the earlier 250-coin checker rejects a 500-coin policy), offline devices cannot be remotely reached, and bundled Android clients require an app update. Do not claim all users already received a reset based on deployment or synthetic tests alone. The checker is disabled in native builds.

## Current experience and visual system

Developer brand preparation (September 16): the user selected public developer name **AlphaCode**, reports company name **AlphaCodeAI**, and supplied https://www.alphacodeai.com/ . `branding/alphacode/` contains generated developer-profile icon/header pairs. Recommended v2 follows the visually inspected website: gold Greek alpha, cobalt, ivory grid, navy type and orange accents. Final upload exports are `alphacode-developer-icon-upload.png` (512 x 512, 24-bit RGB, 264,775 bytes) and `alphacode-developer-header-upload.jpg` (4096 x 2304, 24-bit RGB JPEG, 772,486 bytes), both non-transparent and under 1 MB. These supersede the earlier 32-bit icon/large PNG header for uploads; generated originals and exact prompts are retained. Header exports are upscaled from 1672 x 941 source images. Monochrome v1 remains an alternative. Neither set is bundled in the game, applied to the website, nor uploaded to Play Console. Existing in-app Sensei/support copy and historical account settings are not silently rewritten; profile rename and app copy alignment remain separate work.

- Visual direction: vibrant claymorphism with purple, pink, cyan, yellow, and orange depth lighting.
- Home: generated observatory hero art, a seven-day streak progress rail with a 300-coin reward icon, a Daily call-to-action, a major Adventure launcher, generated Race/VS/Co-op launchers, and the compact four-mode solo launcher. Play Together appears above Game Modes. Race, VS, and Co-op use original independent clay scenes. On phones, the Daily and Adventure feature cards each occupy approximately half of the small viewport.
- Adventure: three original generated portrait environments—Sky Garden, Ember Canopy, and Cosmic Prism—each contain a monumental endless golden ladder as part of the raster artwork. The old winding-road scenes are no longer referenced, and no CSS rails or rung elements duplicate the illustrated ladder. Only the active zone asset is loaded at runtime; exactly eight semantic level markers align to eight evenly spaced painted-rung positions. Vertical swipes and stacked up/down controls browse virtualized pages. Future pages keep the scenery fully visible and apply chain/disabled treatment only to their individual rungs. A one-level win animates the animal upward from the completed rung; reduced-motion players receive the settled state immediately. It is original genre-inspired progression presentation and does not use Candy Crush art, characters, candy motifs, branded copy, or copied level UI.
- Game screen: visible Sixth Sense branding, a compact game-mode line, a phone-safe five-digit coin count at top right, six-row letter grid plus one optional extra row, a full-width color-state keyboard, and an evenly spaced bottom lifeline dock. The header now keeps only Help and Settings beside the wallet; Statistics is a full-width clay action inside Settings. The three keyboard rows contain 27 controls—26 letters plus Delete—with a proportionally centered final row; the removed Enter key is unnecessary because the sixth letter submits automatically. Status toasts are absolutely contained in a fixed-height message slot, so feedback cannot reflow the board or cover the bottom price chips.
- Every finished solo puzzle, including Adventure, opens the dedicated completion sheet instead of the generic Statistics modal. The sheet leads with the player's selected animal avatar: the original happy portrait for wins and a matching generated sad portrait for losses (including skips). Selected cosmetic frames remain visible. All nine free and nine premium animals are supported; online match result cards use the same avatar renderer and existing match-outcome rules. The former signal crest and halo are no longer rendered on result cards. The animated six-tile answer, attempt-specific copy, coins, points, bonuses, and OK action remain. Losses use calmer recovery copy and no celebration. Adventure returns to its map; the existing mode-specific result exits and optional Next word behavior remain. Re-entering a finished Daily restores its card and current selected avatar.
- The selected animal avatar appears as a clean circular header icon with no square pedestal, so identity is visible on home, solo, and online screens. It is also the entry point to a personal profile sheet showing unique words solved, total solves, best attempt count, fastest word/time, best streak, general Adventure status, and coins. Beside it, the chosen generated wordmark uses two compact rows of glossy sculpted blocks spelling `SIXTH` and `SENSE`.
- Identity Studio contains nine free generated animals plus nine generated premium animals—red panda, capybara, raccoon, snow leopard, phoenix, dragon, unicorn, otter, and chameleon—unlockable for 2,250–3,250 coins. Four generated premium avatar frames—Aurora, Sunburst, Prism, and Champion—cost 1,500–2,250 coins. Purchases persist locally, equip immediately on the header/profile/Adventure token, and synchronize into an active room. Eight free highlight colors and the editable username remain. The top-left profile now links directly to these controls.
- Online play has a persistent red Back control with a mode-aware confirmation. Race, Co-op and VS provide Sense, Peek and Clear from the first playable frame and after every submission; new Skip requests are hidden and rejected server-side in all three modes. Sense always uses the centered dialog and never pushes the fixed-height live-status line. Race uses a vertical course beside the board with avatars climbing from the bottom to the checkered finish. The full-width keyboard and lifeline dock remain below; a compact shared baseline can overlap avatars in a crowded room. Token accessible names/title include player, completed-word count and Away state, the local token is outlined, and Away retains red styling plus a visible label. VS keeps names, point totals, and redacted feedback patterns visible and credits idempotent device-local round rewards at 60% of solo. Co-op advances one authoritative shared round when any teammate solves. Skip and Last Chance use blocking acknowledgement dialogs rather than transient layout messages.
- Controls: generated image assets are used for major home, settings, help, stats, sound, and lifeline actions instead of generic black buttons. Visible icon art is intentionally compact inside touch targets that remain at least 44px on phones.
- The generated house control has an optical-centering correction wherever it appears, compensating for asymmetrical transparent weight without shrinking or shifting its 44px-or-larger touch target.
- Mobile browser Back is mapped onto the in-app screen stack. It closes ordinary dialogs first, returns from a map or finished flow to the prior app surface, and never abandons an active solo puzzle or online room without a confirmation popup. Pinch zoom remains available on navigation/settings surfaces but is suppressed while the active game or online board is onscreen so the playfield behaves like a mobile game.
- The Daily action, mode cards, modal-title art, and decorative streak/lifeline imagery use a compact scale so controls support the game rather than dominating it.
- The game screen is locked to one dynamic viewport and must not create page-level horizontal or vertical scrolling, including during screen-entry animation. Its footer no longer exposes an 8px maroon background gap, and phone layouts preserve the cost chip below every lifeline.
- Purposeful motion includes letter entry pop, row rejection shake, tile reveal, Peek reveal, Clear key removal, combined lifeline purchase/use/unavailable states, wallet spend/denial, screen entry, staged result-word tiles, a full-screen solve burst, and a delayed two-sided confetti cannon. Solo and online success cards add 56 colored confetti pieces falling in four staggered waves, with drift and paper tumbling, lasting up to approximately five seconds. This layer lives inside the dialog so it stays above the backdrop, ignores pointer input, and clears on dismissal, app backgrounding, or enabling reduced motion. Losses do not start it. The completion flow also uses a short optional vibration pattern where supported.
- All optional motion collapses under `prefers-reduced-motion`.
- Audio has two independent persistent controls. Background music is now the user-supplied **Tea and Tangrams**, prepared as an 88-second local MP3 loop (1,684,654 bytes): the original 0:00–1:28 section in its original order, with 5 ms endpoint fades and -4 dB preparation gain. This replaces the earlier 102.05-second crossfaded edit at the user's requested repeat point. A single streaming HTML audio element routes through the Web Audio music gain/compressor, starts after a gesture, loops, and preserves position through mute/background/ad pauses. Normal music gain is .24 and result-ducked gain is .065. The procedural background score is removed; missing media never falls back to it or blocks play. Ordinary gameplay effects remain procedural. Result sounds use three bundled CC0 recordings: approximately 4.5 seconds of small-crowd applause plus a short party horn on wins, and approximately 2 seconds of crowd “awww” on losses. They begin when the initial result card opens, respect Sound effects, lower music while playing, and stop on card close, effects mute, or app backgrounding. Pending loads are cancelled logically to prevent delayed playback after leaving. Cached completed Daily cards do not replay result audio. Online outcomes share these audio paths. Source preparation/provenance are in `AUDIO_BRIEF.md` and `THIRD_PARTY_LICENSES.md`; the supplied music is not asserted to be CC0.
- Dark and high-contrast modes are available. Dark mode preserves four visually distinct keyboard treatments: untested purple, Aligned green, Echoing orange, and Quiet charcoal, with the `●`, `◆`, and `×` markers retained.
- Dark page and panel backgrounds use deeper near-black purple surfaces (`#090612`, `#140d24`, `#201331`) with reduced cyan/pink/yellow lighting. Trio, mastery and result backgrounds are also darker. Light-theme surfaces, artwork and feedback colors retain their prior appearance.
- Empty and unsubmitted letter tiles use a theme-aware clay gradient: pale purple in light mode and dark purple behind white letters in dark mode. This shared solo/online styling leaves scored and Peek tile colors intact.
- The UI supplies visible keyboard color states, color-independent symbols, semantic buttons, ARIA labels, focus styles, first-visit help, and a skip-to-content link. Sense uses a centered popup with a purple outline, black text, a 60%-alpha white surface, and a green 44px-or-larger OK control; the same dialog is reused in multiplayer. The clue is never duplicated in the inline status area, and reopening Sense cannot move the board, keyboard, dock, or remaining lifeline prices.
- The Settings sheet remains touch/wheel scrollable but hides its visual scrollbar for a cleaner popup edge.

## Intentional removals and simplifications

The following items were removed because they made the interface feel crowded or derivative:

- The old home statistics strip showing day streak, puzzles, and solved percentage. Streak is now communicated by the top progress rail.
- The game-card heading block containing puzzle number, “Sense the six,” and the Daily/Practice switch.
- The verbose “Read the signs / Every color speaks” marketing section and the genre disclaimer from the home content.
- Text labels around the lifeline dock. Meaning is carried by original icons, accessible names, prices, stock badges, and the help modal.
- Temporary “tries left” bubbles after valid guesses.
- The onscreen Enter key. Completing all six letter positions now submits automatically, while physical Enter remains as an accessible optional keyboard command.
- Visible Adventure difficulty and current-level hints on the launcher, map chrome, puzzle status, and profile. Numbered ladder rungs retain progression clarity, while semantic level labels remain available to assistive technology.

## Architecture and file map

This is a framework-free browser client with a small Vercel serverless multiplayer API. Solo play remains fully local and works without the API. Online rooms require a Postgres-compatible `DATABASE_URL`; Neon is the intended Vercel integration. There is no account system.

| File or directory | Responsibility |
| --- | --- |
| `index.html` | Semantic home/game screens, dedicated result sheet, modal content, settings, stats, icon dock, and script loading order. |
| `styles.css` | Responsive claymorphic presentation, phone viewport fitting, dark/high-contrast themes, keyboard states, modal styling, and all motion. |
| `game-core.js` | Environment-neutral rules: constants, answer/guess loading, repeated-letter scoring, hard-mode validation, daily/practice selection, deterministic seeded Adventure shuffling/progress, and coin rewards. It exports to both browser globals and CommonJS tests. |
| `progression.js` | Pure, separately tested daily-trio normalization/reward transitions and point-derived mastery levels; loaded before app.js. |
| `app.js` | Browser state, rendering, input, modes, Adventure map/progress, persistence, inventory/economy migration, streak/point rewards, cosmetic unlocks, modal and browser-history navigation, animations, recorded music/procedural gameplay effects, sharing, and statistics. It exposes narrow audio, economy, dialog, celebration, and navigation interfaces so multiplayer shares the same services. |
| `multiplayer.js` | Room create/join/leave flows, resume-token session state, polling/reconnect, online board/keyboard/one-tap lifeline rendering, shared hint and match-result popups, the shared Race course, VS series progress, attempt patterns, and live identity synchronization. |
| `api/multiplayer.js` | Vercel serverless authority for codes, seats, room lifecycle, answer selection, guess validation/scoring, lifeline effects, identity updates, CAS revisions, idempotency, results, and redacted snapshots. It creates and migrates its Postgres tables idempotently after a database is connected. |
| `answer-bank.js` | 10,187 answer objects with a six-letter `word`, `clue`, and `tier`. Loaded before `game-core.js` in the browser and required by the server. |
| `word-bank.js` | Expanded accepted-guess vocabulary. Loaded before `game-core.js` in the browser. |
| `scripts/build_word_banks.py` | Deterministically audits and regenerates both banks from a hash-verified ENABLE lexicon, pinned `wordfreq`, and WordNet. |
| `scripts/clue_overrides.json` / `scripts/clue-audit.json` | 143 explicit editorial clue corrections and a complete before/after clue-only release audit against c055f52. The refresh path preserves all words, tier assignments, and ordering. |
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
| `economy.json` / `test-live-wallet-reset.js` | Public reset generation and explicit browser policy/30-second polling/cross-tab/offline/stale-write tests. The file is included in the public-client allow-list; Vercel serves it with no-store. |
| `test-production-wallet-reset.js` | Pre-deployment check: hold zero/high wallets open on both public origins and verify the real policy resets them automatically without reload. Requires WALLET_RESET_TARGET set to the next unpublished generation; isolated browser saves only. |
| `test-wallet-reset.js` | Browser checks for every legacy economy version, unchanged progress/inventory/cosmetics/claimed ads, current-wallet preservation and actual post-reset earnings across reload. |
| `test-peek.js` / `test-peek-browser.js` | Shared candidate and authoritative VS/Race/Co-op checks plus solo/online UI fixtures for green-position exclusion, exhaustion and single-purchase/inventory consumption. |
| `test-presence.js` / `test-presence-browser.js` | Presence input/authentication checks, all-mode Skip rejection, explicit client fixtures for screen events/ad exclusion/red avatars/return and phone geometry; production coverage lives in test-production-multiplayer.js. |
| `test-room-rejoin-browser.js` | Explicit browser fixtures for active-key migration, transient-error retention, bounded room history use and leave/reload/other-room/rejoin restoration. |
| `test-race-join.js` / `test-production-race-join.js` | Server late-entry rules and live Race join/progress preservation/duplicate-name/concurrent-capacity/browser acceptance. |
| `test-keyboard-touch.js` | Phone touch checks for reported WZXED edge taps, held/moving release, cancellation/drag-away, compatibility-click deduplication, mouse and accessible keyboard activation. |
| `test-race-mobile.js` | Touch-enabled Chromium Race fixtures with two/eight players: lobby input readability, repeated/edge taps, retained targets across polling, equal bottom starts and upward progress, side-course geometry, recovered small-phone tile area, pinch/scale, portrait/landscape fit and normal home zoom. Does not emulate Safari's input-focus zoom heuristic. |
| `test-core.js` | Node assertions for data shape/counts, RATTLE/RAFFLE coverage, scoring, hard mode, dates, attempts, costs, and rewards. |
| `test-browser.js` | Playwright end-to-end QA for onboarding, modes, lifelines, coins, repeated use, keyboard states, solving, logo settings, themes, screenshots, and overflow. |
| `test-tile-contrast.js` | Browser regression for typed/empty tile contrast in both themes, shared solo/online tile styles, and preservation of scored/Peek backgrounds. Run with `npm run test:contrast`. |
| `test-progression.js` / `test-engagement-browser.js` | Pure reward/deduplication/date/rank tests, editorial clue and sequence-hash regressions, plus focused phone saved-clue, free reopening, dock stability, victory, trio, mastery, Next-word, and persistence tests. |
| `test-result-avatars.js` | Browser checks for selected free/premium avatars on actual solo win/loss flows, mood-specific loaded artwork, unchanged rewards, and result-card layout at small phone sizes. Optional screenshots use `SIXTH_SENSE_EVIDENCE`. |
| `test-result-audio.js` | Actual solo result audio decoding/playback, music ducking/restoration, mute/card-close cancellation, stale pending-load cancellation, and missing-file recovery. |
| `test-result-confetti.js` | Actual solo success/loss and reduced-motion checks, measured downward particle movement, click-through/close cleanup, shared online card rendering, timed expiry, and cancellation when reduced motion is enabled. |
| `assets/audio/` / `AUDIO_BRIEF.md` | Three bundled CC0 crowd/party effects, the supplied Tea and Tangrams loop, preparation details and the historical Suno brief. |
| `test-music.js` | Real local soundtrack playback, duration/loop wrap, independent mute and position-preserving lifecycle pauses, single-player protection and missing-file recovery. |
| `assets/avatar-animals-sad-v2.png` / `assets/avatar-exclusive-sad-v1.png` | Generated 3×3 sad-expression sheets matching the existing free/premium happy avatar ordering. Used only on loss result cards. The free sheet has a clean lavender exterior rather than black edging. Generation prompts are in `assets/result-avatar-prompts.md`. |
| `test-production-multiplayer.js` | Public-URL Playwright acceptance test using two isolated browser contexts for create/join/start, opponent attempt visibility, and synchronized VS round advancement. |
| `THIRD_PARTY_LICENSES.md` | Attribution and licenses for dictionary, frequency-ranking, and clue source data. |
| `README.md` | Concise setup and feature overview. |
| `AGENTS.md` | Mandatory instructions for AI contributors, including this document’s update rule. |
| `android/` / `capacitor.config.json` | Native Android project, monetization plugin, signing/release templates, SDK 36 setup and launcher/splash/inset handling. |
| `test-last-chance-mobile.js` / `test-last-chance-online.js` / `test-last-chance-server.js` | Earned/cancelled/failed ad paths, 125-coin purchase, receipt replay, storage/restart recovery, online idempotent retry fixtures, server caps and stale-round rejection. |
| `mobile.js` / `test-mobile.js` | Android-only store/reward/consent/lifecycle UI and browser checks with an explicit mock native bridge. |
| `test-banner-layout.js` | Native-layout browser fixtures reserve system-bar/ad space; check solo six/seven rows, VS/Race/Co-op, portrait/landscape, reachable controls, dialog hiding and paid banner removal. |
| `api/play-purchase.js` | Server-only Android Publisher verification/acknowledgement for banner removal and durable hashed-token records. |
| `scripts/build-mobile.js` | Public-client allow-list for offline Android and safe Pages artifact packaging; excludes backend/native/drafts/private spreadsheets. |
| `ANDROID_RELEASE.md` / `privacy.html` | Release configuration/test checklist, store copy draft, and bundled/public privacy policy. |
| `GAME_KNOWLEDGE.md` | This canonical living context and change record. |

Keep the script order in `index.html`: `answer-bank.js`, `word-bank.js`, `game-core.js`, `progression.js`, `app.js`, then `multiplayer.js`.

### Last Chance reward delivery and server compatibility

Last Chance native receipts carry kind `last-chance` or `last-chance-online` and no coin amount. Solo claim identity and the earned extra-turn flag share one atomic puzzle save before native acknowledgement; an old receipt cannot unlock a different puzzle. Online claim identity is saved at `sixth-sense.last-chance-online.v1`, scoped to room/player/round/failed batch. The existing authoritative unlock API is retried with one action UUID; network failure retains the native receipt without another ad. No local room simulation or answer disclosure is introduced. Server handlers reject guesses while a decision is pending or the attempt limit is exhausted.

The backend migration retains seven as `max_guesses` for existing rooms and inserts six for new rooms. Snapshots expose `maxGuesses` and `lastChanceAds`; clients use legacy seven/no ad when these are absent. The matching client/backend were deployed to Vercel on September 17. Native earned callbacks and the existing device-local wallet remain client-side trust boundaries, with no AdMob server-side verification.

### Multiplayer screen-away signals

During active VS/Race/Co-op matches, updated clients report document visibility/page departure and native app background/foreground events. Authenticated `presence` requests use fetch keepalive; Neon stores per-seat away state, a monotonic sequence and deduplicated departure events/counters. Arrival order cannot let an older departure overwrite a newer return, and a quick away/return still increments the alert counter. Presence writes do not change gameplay revisions. Active peers observe events through the existing approximately 900ms poll, see a 6.5-second accessible notice, red-filtered avatar and visible Away label. Returning restores normal avatar styling. Initial room entry does not replay historical alerts. The game's own rewarded ads, including a 500ms native closing grace, are excluded.

Skip is disabled for every new multiplayer request, including requests from an old tab. Already-pending pre-release Skip confirmations are retained solely to avoid stranding active players. No room, score, puzzle, wallet or inventory reset accompanies this change.

Existing open Vercel/GitHub tabs must refresh to report/show screen status; old clients cannot retroactively detect switches. Existing Android installations require an app update for native detection. Detection is best-effort: OS suspension, offline/closed clients or modified clients can prevent reporting, and an actual switch/call/lock is not proof of cheating. We do not inspect the destination app/site, penalize players or claim to detect second devices. Room-linked presence events cascade away when room/player records are cleaned up; privacy.html describes the data. Phone web multiplayer now shares the fitted-board CSS with native layouts, keeping controls and the non-layout-changing alert within the viewport.

Multiplayer name/room-code inputs explicitly render at 16px instead of inheriting the name label's 11px size. The existing gameplay-only gesture restriction also applies to nested progress-panel/list/course scroll regions, where the body's gesture rule alone is insufficient (see [touch-action gesture boundaries](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/touch-action)). Pan gestures remain available; home/settings browser zoom and the unrestricted viewport meta tag are preserved. This addresses plausible focus/gesture zoom triggers found while investigating the phone Race report; no physical Safari reproduction is claimed.

The onscreen keyboard specifically uses `touch-action:none` and disables text selection; its marker/icon children do not intercept hit testing. Solo and multiplayer build semantic keyboard buttons once and update color/label states in place; online also updates disabled state. Touch/pen uses captured pointer release with an 18px movement tolerance, cancellation and compatibility-click suppression. Mouse and detail-zero semantic/assistive clicks still work. Selection, callouts and tap highlight are disabled directly on keys/children, and key feedback no longer transforms/shrinks the hit area. Multiplayer also guards input while a decision dialog is open. The shared binder is exposed by app.js as SixthSenseKeyboard. Home/settings zoom remains available.

## Data and selection

- Answer pool: exactly 10,187 unique, clueable, answer-safe six-letter words.
- Player-facing difficulty names are Normal, Hard, and Extreme. For backward-compatible data, API, and saved-state stability, their internal keys remain `easy`, `medium`, and `extreme` respectively.
- Normal (`easy`): 4,058 eligible answers at Zipf 2.75 or higher. Hard (`medium`): 2,246 remaining answers at Zipf 2.0–2.74. Extreme: 3,883 final rare, specialist, archaic, or unusual answers.
- Accepted guesses: exactly 15,232 unique six-letter words from the proper-name-safe ENABLE word-game lexicon, including every answer.
- `raffle` and `rattle` are both accepted guesses and possible puzzle answers.
- Every answer has a Sense clue.
- The accepted vocabulary includes legitimate uncommon, technical, archaic, and inflected word-game entries, while excluding ordinary names, places, trademarks, malformed inflections, abbreviations, and corpus noise.
- All clueable eligible guesses with a usable non-proper WordNet clue and no answer-only safety exclusion are answers. Normal is determined only by the Zipf ≥2.75 threshold, without fixed-count padding or manual rescues. Hard uses the remaining Zipf ≥2.0 words; Extreme contains the remainder. Reviewed clue overrides may correct a misleading WordNet sense; `armory` has a specific weapons-storage clue.
- The 2026-08-27 full audit retained 14,850 old guesses, removed 17,218 unsupported entries, added 382 valid omissions, retained 4,782 old answers, and replaced 218 answers.
- Sense clues must not reveal their answer or use broken placeholder text. The September 5 clue-only refresh processed all 10,187 entries: 10,082 strings changed, including 1,310 definition-text changes and 8,772 grammatical-label-only changes. It preserves the old word/tier sequence, verified by SHA-256 in test-progression.js. The earlier August counts in the change log describe historical releases, not this refresh.
- Sense ranking now uses usage counts for the target lemma or its morphological root, not the most frequent unrelated synonym in the sense. Cleaned definitions are checked for answer leakage and flagged proper/offensive patterns. Generated clues label nouns/verbs/adjectives/adverbs and inflected forms; 143 explicit overrides and the starter hand-written clues prefer familiar clear meanings. `dipped` now means briefly lowering something into liquid, not a horse's spine; `entire`, `behind`, `father`, and `jersey` are also corrected.
- This is an algorithmic corpus refresh with an editorial override layer, **not a manual review of every definition or a guarantee of perfect clues**. WordNet sense counts are sparse and dated. Future reported bad senses should become override entries plus tests. Do not blindly preserve old clues based only on syntax, and use `--refresh-clues` for clue-only fixes rather than changing word membership or tiers. See VOCABULARY_AUDIT.md for pinned, reproducible commands.
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
- `sixth-sense.active-room.v1`
- `sixth-sense.room-seats.v1` (up to 32 recent room credentials for same-site/browser rejoin; entries older than 24 hours since last save are ignored and pruned on a subsequent save)
- `sixth-sense.online-rewards.v1`
- `sixth-sense.presence.v1` (last room/seat screen-event sequence; not a cloud wallet)

Game records include answer/clue, mode, date, puzzle number, guesses, current status, clue state, Peek positions/use count, cleared letters/use count, skip state, Last-Chance purchase state, solve/streak coin reward, puzzle points, reward/stat-recording guards, solve-start time, the backward-compatible Time Tackle deadline, and Adventure level/seed/replay state when relevant. The current game schema uses `version: 4` and a per-puzzle `maxGuesses`. Legacy saves retain all submitted guesses and a previously purchased eighth attempt; old six-miss saves without an extra attempt enter Last Chance. New puzzles use six standard tries. Historical distribution buckets and wallet/economy version are preserved.

New win records optionally include `solveTime`, `newBestTime`, `newBestAttempts`, `trioReward`, `trioCompleted`, `trioCount`, `mastery`, and `rankUp`. The existing `personalRecorded` guard controls trio/best updates; older completed records are not awarded retrospective trio bonuses. Statistics optionally include `dailyTrio: {date, words, claimed}`; missing or prior-day values normalize safely. Saved Daily/solo clues are refreshed from the current answer bank after spreading old save fields, so a stale clue cannot override current wording. Multiplayer seat snapshots similarly refresh an already-unlocked current-round clue server-side, without exposing clues to opponents or unpurchased seats.

Statistics include Daily play/win/streak fields, the last rewarded seven-day milestone, persistent guess distribution (including historical seventh/eighth buckets), wallet, economy version, cumulative points, persistent lifeline inventory, Streak-mode run, best Streak-mode run, an Adventure seed/current level, the unique solved-answer list used for silent tier progression, total solves, best attempt count, and the fastest timed word. Economy version 9 assigns all older saved wallets exactly 500 coins once while preserving every other stored field, including the prior rewarded-claim ledger. Version-9 balances then earn/spend and persist normally. The reset applies separately to each site/device when the updated client loads. Already-open older pages must refresh. Bundled Android installations do not download this web release; no Android update or Play upload is included in this web-only reset. New fields use backward-compatible defaults. Settings include hard mode, contrast, dark mode, independently stored music/effects, selected animal and color, selected avatar decoration, and locally unlocked premium avatars/decorations. The former single `sound` preference still migrates safely.

Online room rules and security:

- Codes are generated by the server and omit visually ambiguous characters.
- Race capacity is 8, VS capacity is 2, and Co-op capacity is 4. A match needs at least 2 players and only the host can start. Running Race rooms accept late joins up to eight seats; new seats start at word index 0 on the existing route with empty attempts/lifelines. Waiting rooms remain joinable in every mode; running VS/Co-op and all finished/expired rooms reject new joins. The room-row lock rechecks joinable status at insertion and preserves seat/capacity/duplicate-name checks. This backend change also serves already-open clients.
- Join requests containing a valid room resume token restore that exact existing seat and authoritative progress before new-entry/capacity checks, including full/running rooms or finished-room results. Invalid tokens return 401 and never fall back to username takeover or new-seat creation. On entry/leave, the client remembers credentials by room code; leaving clears only automatic reopening. Entering that code again uses the saved token. Legacy active-only saves migrate before network recovery; transient errors retain them, while 401/404 clears invalid active credentials. Same-browser storage is required, Vercel/Pages have separate origins, and old keys already erased by a prior leave/cleared data cannot be recovered from a name. Submitted guesses, word index, scores and lifelines persist on the server; unsubmitted draft letters are not restored.
- Usernames persist per device and are case-insensitively unique within an online room. Global username reservation is not claimed because the game has no account system.
- All players receive the same server-selected sequence from the room's explicit difficulty tier. Personal solo unlock state is irrelevant.
- The API validates accepted guesses and scores them server-side. Snapshots never include answer words. Opponents receive score patterns only; the current player receives their own submitted letters and scores.
- Multiplayer lifelines are authoritative: the API stores private per-player clue/Peek/Clear/Skip/Last-Chance state, returns only the purchased effect to that seat, and clears assistance on round/word advancement. New Skip requests are rejected in every mode. Pre-release pending Race/Co-op Skip decisions can still advance after authenticated OK. Wallet ownership remains device-local until account-backed monetization exists.
- Avatar, accent, decoration, and username updates are accepted from an authenticated room seat and broadcast through subsequent snapshots; duplicate room usernames remain rejected.
- Mutations use player/room revisions for compare-and-set protection plus UUID action IDs for retry idempotency.
- The client uses 900ms bounded polling, persists an active-room seat credential plus a bounded recent-seat history in site-scoped local storage, automatically restores the active seat after refresh/reopen, catches up immediately after foreground/online recovery, and renders temporary connection errors without destroying room state. It signatures each redacted snapshot and skips DOM work when a poll is unchanged, preventing the board, keyboard, lifelines, player track, scroll position, and avatar tokens from repainting every 900ms. Phone layouts also use scrolling rather than fixed background attachment to avoid mobile compositor flicker at the page boundary.
- New games pause after six misses and offer one seventh attempt for 125 coins or an eligible Android rewarded ad. In VS, declining Last Chance or missing that extra attempt awards the opponent the point. Race and Co-op retain their existing failed-batch/team-continuation behavior after the extra attempt is resolved.

When changing stored shapes, add a safe migration or backward-compatible defaults. Never assume old players have every new field.

## Non-negotiable quality rules

- Preserve six-letter answers and six standard chances plus one optional Last Chance unless the user explicitly changes the product.
- Preserve correct duplicate-letter scoring.
- Keep Normal threshold-based at Zipf 2.75 (currently 4,058 words), Hard at Zipf 2.0–2.74 (currently 2,246), and preserve all clueable answer-safe words in the complete tiered answer bank unless an explicit product decision changes the threshold.
- Do not narrow accepted guesses in a way that rejects common words such as `raffle` or `rattle`.
- Keep the puzzle screen within 360×800 and 390×844 portrait viewports without page scrolling or horizontal overflow. Also keep 430×932 and representative desktop/landscape layouts usable.
- Keep the Adventure map within the same phone viewport without page-level scrolling; virtualize its route rather than creating thousands of level controls.
- Keep touch targets practical, keyboard navigation functional, navigation/settings zoom available, active-play pinch suppression scoped, and focus visible.
- Never make color the only carrier of tile meaning.
- Preserve reduced-motion behavior when adding animations.
- Never make animation timing decide game legality or permanently block input.
- Build engagement through mastery feedback, understandable progress, voluntary social play, and a fast replay path. Do not add coercive countdowns, disguised costs, loss-chasing pressure, or other dark patterns under an “addictive” label.
- Keep lifeline prices, badges, wallet deductions, and saved inventory consistent.
- Do not commit secrets or add a client-side key.
- Never describe online rooms as production-ready unless a durable database is connected and two independent production browser sessions pass create/join/start/guess/reconnect tests.

## Local development

Android Studio setup on this PC: open `C:\Users\Aryan\Downloads\SixthSense\android` as the project, not the user home or `.android` settings folder. In the native file picker, enter the path, press Enter to navigate, then Select Folder. Studio 2026.1.4 initially chose incompatible JVM 25; **Use JVM 21** selects installed Zulu 21. The app modules and signed-bundle wizard are now available. `ANDROID_RELEASE.md` includes these steps and the `npm.cmd` workaround for PowerShell script-policy restrictions.

Serve the project root rather than opening `index.html` directly:

```powershell
python -m http.server 4173 --directory .
```

Open `http://127.0.0.1:4173/`.

The current Codex workspace also runs the project from the folder with an available static server. Do not stop an existing user-visible server unless needed and authorized.

## Verification

September 18 renewed 500-coin reset (app 20260918.11, economy v9): core, focused migration/live-policy/cross-tab/offline, syntax and public-client packaging checks passed locally. Commit `201ad00` deployed successfully to Vercel and GitHub Pages (workflow `35275570862`). Four isolated public pages loaded the previous v8 build before deployment and automatically received the actual v9 policy without reload: 0 and 9,876 both became exactly 500 on each site, with progress/inventory intact. The full migration/earn/reload suite then passed against both public origins, including prior v8 wallets and preservation of subsequent earnings. This distinguishes already-open-client delivery from migration on refresh. Very old clients, offline devices and installed Android limits remain; there is no real-user wallet census.

September 18 touch keyboard/vertical Race course (app/styles/multiplayer/mobile 20260918.10): focused keyboard and two/eight-player Race touch/geometry, presence, native banner layout and core checks passed locally. Visually inspected the 390×844 eight-player side-course screenshot. Full browser, syntax and public-client packaging also passed. Commit `42c7f6a` deployed successfully to Vercel and GitHub Pages (workflow `35275229095`). Both public sites passed the focused keyboard and two/eight-player Race layout suites with explicit UI fixtures. The separate real Vercel API/database Race suite passed running-room phone entry, keyboard input, roster/capacity and full-room same-seat progress recovery. Only isolated QA rooms were created. The pointer path covers held, cancelled, slightly moved and edge touches without duplicate compatibility clicks, and retains mouse/keyboard/assistive activation. Browser emulation does not establish physical Safari acceptance. Wallet generation remains 8/500; no native bundle is rebuilt.

September 18 fresh 500-coin reset (`app.js?v=20260918.9`, economy v8): core/multiplayer/progression, full browser QA, focused legacy-wallet migration and live-policy checks, syntax and public-client packaging passed locally. All pre-v8 wallets (including the previous v7 reset) migrate to exactly 500; v8 balances and later earnings survive reload. Tests retain progress, inventory, cosmetics and reward claims. Commit `c71a683` deployed successfully to Vercel and GitHub Pages (workflow `35274463220`). Both public sites serve app/core 20260918.9 and resetVersion 8/startingCoins 500; the full focused migration/earn/reload browser test passed against both. These isolated saves verify delivery and behavior, not every real player’s device. Older 250-coin clients require refresh to load the new baseline; no native bundle or Play upload is included.

September 18 live wallet reset (`app.js?v=20260918.8`, economy v7): focused migration, `test-live-wallet-reset.js`, full browser, core/multiplayer/progression, syntax and public-client packaging passed locally. Both public sites were confirmed to have the previous v6 release before this change, so deployment alone was not evidence that old open tabs had reloaded. New tests cover a remote policy bump in two already-open updated tabs, exact 250, retained puzzle/progress/inventory, cross-tab earnings synchronization, no second reset after reward/reload, higher-generation preservation, offline retry, repair of a simulated pre-reset tab write, and an actual 30-second periodic policy check. No actual user-wallet census is available. The full browser suite initially sampled the Adventure home button during its entry transform; its geometry baseline now waits for finite Adventure-screen animations to finish before measuring touch targets. Commit `50bab2a` deployed successfully to Vercel and Pages (workflow `35273806722`). Both serve runtime 20260918.8 and resetVersion 7/startingCoins 250. Vercel policy response is no-store; Pages reports max-age=600, with client timestamp query/cache bypass retained. The full focused wallet migration/earn/reload suite passed against both public sites. This verifies the delivered build with isolated browser saves, not every real player’s device.

September 18 room rejoin recovery (`multiplayer.js?v=20260918.7`): server rules cover authenticated restoration across modes/running/finished states, retained attempts/lifelines/identity and rejection of incorrect tokens without mutation. `test-room-rejoin-browser.js` verifies migration from an active-only save before a simulated 503, retention through transient failure, leave/reload/other-room/rejoin and exact seat, word-two, scored row and Clear restoration. Race touch and presence suites, core/multiplayer/progression and syntax pass. The expanded live Race suite passed after commit `8c783c4` deployed to Vercel; Pages workflow `35272633602` also succeeded. The live phone flow left/reloaded/rejoined an eight-seat room with the same player ID, word index, submitted guesses and lifelines, with no additional seat; an incorrect key returned 401. Existing late-entry, duplicate-name and concurrent-capacity checks passed too. No wallet reset or native bundle is included.

September 18 Race late joins: `test-race-join.js`, core/multiplayer/progression and syntax checks passed. Focused fixtures cover the mode/status matrix, first-word entry with no answer disclosure or room mutation, finished/expired/non-Race denial and a room finishing between initial read and insertion. `test-production-race-join.js` adds a real phone-browser late-join flow, unchanged existing progress, roster/input usability, duplicate-name rejection and two concurrent joins competing for the eighth seat; it passed against live Vercel after commit `2140462` deployed successfully. Pages workflow `35271958793` also succeeded; Pages uses the same Vercel room API. The live test confirmed exactly one accepted request and one full-room rejection when two users competed for the eighth seat. Only isolated QA rooms were created. No database migration, room reset, wallet change or native bundle is needed.

September 18 rapid-touch follow-up (`20260918.6` stylesheet/multiplayer): focused Race checks now assert actual input from rapid touchscreen taps (AA and two Deletes), and a press/release across a forced opponent snapshot update. The old build failed the retained-touch-target regression; Chromium still retargeted that particular tap successfully, so no claim is made that it reproduced every reported lost touch. Updated build retains the pressed button and enters R exactly once. Presence fixtures, full browser, core/multiplayer/progression and syntax pass. The new input assertions use Playwright touchscreen events; CDP synthetic gestures alone did not emit compatibility clicks reliably and are used only for zoom/layout assertions. Physical Safari remains unverified. The full browser suite initially measured the solo dock during its entry transform (71.902px instead of the settled 72px height, about 1.32px top offset); its baseline now waits for finite game-screen animations to finish before comparing the Sense dialog layout.

September 18 Race phone zoom correction (`styles.css?v=20260918.5`): `test-race-mobile.js` reproduces the undersized name-input regression against the pre-fix Vercel build and passes locally. Touch-enabled Chromium with explicit two/eight-player API fixtures passes double taps over avatars, tiles and keyboard, a pinch gesture over the progress panel, viewport scale 1, no document overflow and 44px keys at 320×568, 390×844 and 844×360. Home gesture/viewport accessibility assertions pass. Presence browser, native banner-layout and core/multiplayer/progression checks also pass. The reported zoom itself did not reproduce in desktop Chromium's phone simulation; physical iPhone/Safari testing remains outstanding. No economy-version change, room mutation or native bundle is part of this correction.

September 18 second requested web reset (`app.js?v=20260918.4`, economy v6): syntax, core/multiplayer/progression, full browser and focused `test-wallet-reset.js` passed on port 4269. The reset covers missing markers and versions 1–5, including a zero wallet and high balances, and preserves current v6 balances, progression, inventory, cosmetics, statistics, saved puzzles and rewarded-claim history. An actual first-try solve credits 140 coins after migration and survives another reload without a repeated reset. No room/API data or Android bundle is changed. Commit `594faca` subsequently deployed successfully to Vercel and Pages (workflow `35270057394`); the focused wallet suite passed against both public sites.

September 18 presence production verification: commit `c8387e1` deployed successfully to Vercel and GitHub Pages (workflow `35269532877`); both serve `multiplayer.js?v=20260918.3` and the accessible alert element. Two isolated clients on Vercel passed authoritative refresh/seat restoration, free Sense reopening, Reveal candidate checks, six-row VS, synchronized VS advancement, Co-op Skip rejection, shared departure alerts/red avatars/return, quick-switch detection and duplicate/late departure replay with exactly two counted departures (21,329ms total; opponent attempt visibility 1,856ms). Visibility events were simulated in those browsers against the real API/database; this is not a physical-device switching test. Replaced reload `networkidle` waits with DOM-ready plus existing room-UI waits because ongoing multiplayer polling can prevent network silence. Existing rooms, scores and wallets were not reset; only isolated QA rooms were created. Old open tabs still need a refresh and old native installations still need an app update.

September 18 multiplayer presence (`20260918.3` styles/multiplayer/mobile): syntax, core/multiplayer/progression, `test-presence.js`, `test-presence-browser.js`, full browser, mobile, banner layout and all three Last Chance suites passed locally on port 4269. Explicit browser fixtures cover VS/Race/Co-op departure alerts, red avatars and Away labels, return, rewarded-ad/native exclusions, hidden Skip and no overflow with 44px keys at 320×568, 390×844, 844×360 and 866×294. API fixtures validate authentication/input checks and reject new Skip in all modes. The full browser suite passed on rerun after an initial existing 4-second UI wait timed out during parallel checks. New production tests cover actual two-client alerts, quick departures, duplicate/out-of-order delivery and server Skip rejection; live results will be recorded after deployment. No physical-device/native-ad lifecycle acceptance or new APK/AAB is claimed.

September 18 Reveal correction (`20260918.2` core/app/multiplayer): syntax checks, `npm test`, `test-peek.js`, `test-peek-browser.js` and the full browser suite passed on port 4269. Deterministic tests cover greens from earlier rows, previous reveals, unknown duplicate-letter positions, server selection of the only remaining position, and exhausted requests without a database update in VS/Race/Co-op. Browser checks exercise solo and explicit three-mode online fixtures, one 50-coin purchase or one stored Peek, and disabled exhausted controls. The production multiplayer suite now also checks an actual server Peek result against the player's scored history.

September 18 web reset (`app.js?v=20260918.1`): syntax/build, core/multiplayer/progression, full browser and `test-wallet-reset.js` passed on port 4269. The focused browser check covers missing and version-1/2/3/4 economy markers, zero and high balances, exact 250 reset, preservation of version-5 balances, saved puzzle/progress/inventory/cosmetics/statistics/claimed-ad history, a real first-try solve adding 140 coins, and reload without another reset. No backend room mutation or Android bundle change is needed for this web release.

September 17 release preparation (`20260917.1`): core/multiplayer/progression, full browser, engagement, tile contrast, actual 88-second music playback/loop/lifecycle, result audio/avatar/confetti, banner geometry, mobile rewards, mocked purchase verification and all three Last Chance suites passed on port 4269. Updated stale seven-chance home-copy and 42-tile music assertions to the six-row contract. Visually inspected the 390×844 darker game background with readable letters and unclipped controls. Android sync, debug assembly and lint passed; Gradle deprecation/flatDir/SDK-tool warnings remain. Refreshed `release/SixthSense-v1.0.1-debug.apk` and `release/SixthSense-debug.apk`: 36,289,797 bytes, SHA-256 `B03DDD551EF61095EB0E02F387DE32C0F6DCE7A2E852DE24DA80AC141ACBDDB7`. This is a debug APK, not a newly signed Play bundle.

September 17 production verification: source commit `08dff3e` deployed successfully to Vercel and GitHub Pages (workflow `35257375748`). Both serve runtime 20260917.1 and the soundtrack. Vercel audio/sad-avatar/font assets match source hashes; runtime scripts/styles match source after newline normalization. Live music playback/88-second wrap and tile contrast suites passed. Two isolated production clients verified six-row new rooms, hint purchase/free reopening after refresh, guest-seat restoration, 2,060ms opponent-attempt visibility, six-miss Last Chance decline, synchronized VS advancement and Co-op Skip/OK-gated advancement (18,909ms total). The test now waits for each authoritative guess response before attempting the next word; its initial run raced the sixth-guess response. Privacy returns HTTP 200; purchase readiness returns the expected 503/available=false without configured Play credentials. No live paid purchase, production AdMob serving or Play upload is claimed.

September 16 Last Chance native verification: the isolated API 36 emulator loaded a Google sample rewarded ad from Last Chance; its earned callback granted the seventh row without spending coins. The entitlement survived restart/update. Status/navigation bars were hidden again after the ad. The camera-safe fullscreen WebView measured 412×843 with document height 843; the background extended behind the cutout without a white top strip. No AndroidRuntime crash was observed. Online earned-receipt retry/storage-failure scenarios use explicit test fixtures, not live AdMob or a physical device. No new signed AAB or Play upload was performed.

September 16 dark-tile fix: `npm test`, `npm run build`, `npm run test:browser`, and `npm run test:contrast` passed against the local server on port 4267. The focused regression reproduced white-on-pale typed tiles at 1.08:1 before the CSS fix, then passed the 4.5:1 minimum against both gradient endpoints in light/dark themes. It types into the real solo board and checks style fixtures in both solo/online containers; it does not claim a new live multiplayer session test. A 390×844 dark-theme screenshot was visually inspected for readable letters and an unclipped keyboard/lifeline dock. Stylesheet cache version is `20260916.1`; unchanged JavaScript remains `20260905.1`.

September 16 signed internal-test bundle: reproduced the old release-checklist blocker, then verified internal validation with Android Studio-style signing inputs succeeds while unsigned internal, unapproved production and invalid-channel builds are rejected. Generated release BuildConfig/manifest contain Google sample ad IDs. Retried the owner's signed `:app:bundleRelease` in Studio; BUILD SUCCESSFUL in 30s, 150 tasks (41 executed, 109 up-to-date), including R8 and release lint. `android/app/release/app-release.aab` is 32,608,151 bytes, SHA-256 `1f179802e60b1669b280c68c60b3207295d8c987c7667329514813873617ffed`; jarsigner verification passed and its signer is not Android Debug. Subsequent debug assembly/lint passed (165 tasks). No password was extracted from Studio, no local keystore properties were needed, and no Play upload or minified-build device acceptance occurred. Existing Gradle warnings and prior IDE SDK notification remain separate from this fixed release guard.

September 16 Android Studio recovery: observed the incorrect home-folder project, imported the actual Android folder and selected Zulu Java 21. Studio logged completed Gradle sync and its Build Output showed BUILD SUCCESSFUL in 3s, 91 actionable tasks (2 executed, 89 up-to-date). The debug APK was refreshed at 02:50:39 local time, 36,227,272 bytes. Opened the signed App Bundle wizard through the now-enabled Build menu. No upload key, signed AAB, store upload or runtime change was made. An IDE Android 36 compile-target notification remained despite the installed SDK platform and successful Gradle build; IDE SDK recognition remains a separate limitation. Documentation changes were checked for whitespace errors.

September 16 developer upload-format correction: reopened the final PNG/JPEG and asserted exact icon/header dimensions, 24-bit RGB without alpha, and each file at most 1,000,000 bytes. Icon: 264,775 bytes; header: 772,486 bytes at JPEG quality 95. Visually inspected the compressed header. This is encoding-only; no runtime tests or external upload performed.

September 16 developer artwork: inspected both generated pairs and the live AlphaCodeAI homepage. Reopened exported PNG files to verify 512 x 512 / 32-bit icon and 4096 x 2304 / 24-bit no-alpha header formats. Sources and prompts are preserved under branding/alphacode; no application code changed, so game/native tests were not rerun for this artwork-only work. No external upload or account change is claimed.

September 16 iOS preparation: inspected the existing Capacitor configuration, client bundler, Android monetization bridge and Pages workflow to establish the port boundaries. Reviewed the iOS release handoff against implemented Android behavior and current Apple/GitHub guidance; checked documentation whitespace and references locally. No source runtime changes, iOS compilation, Apple account access or upload occurred during this preparation.

September 16 rewarded ID completion: saved and checked the exact supplied rewarded ID. Gradle debug BuildConfig/manifest tasks passed and generated debug ad IDs remain Google samples. Release validation now accepts the configured IDs and HTTPS URL, then fails as intended at the incomplete release checklist. No live ad request, new APK, signed bundle or deployment was performed. Prior configuration verification below describes the earlier partial setup.

September 16 AdMob configuration: verified the exact supplied app/banner IDs and their formats in local release properties. Gradle debug BuildConfig/manifest tasks passed; generated debug constants and merged manifest still contain Google sample IDs. `validateReleaseSettings` failed as intended specifically because `rewardedAdId` is still missing. This verifies configuration and release gating, not live ad serving or account approval. No runtime behavior changed and no new APK/release was produced for this configuration-only step.

September 16 music loop correction (`20260916.1`): the duration regression first failed against the old 102.05-second asset, then `test-music.js` passed with the original 0:00–1:28 section, including real end-to-start playback wrap, gesture start, a single player, mute/resume, lifecycle pause and missing media. Result-audio ducking/cleanup, core/multiplayer/progression, syntax, Android sync, debug build and lint passed. The refreshed `release/SixthSense-debug.apk` contains byte-identical corrected audio and the updated runtime URLs. Original input SHA-256 is unchanged. No new native listening test or deployment was performed; prior device and release limitations below still apply.

September 10 supplied-music update (`20260910.3`): `test-music.js` passed real media playback after a gesture, the 102.05-second prepared loop (MP3 header duration approximately 102.087), end-to-start playback wrap, one player only, mute/resume retaining position, lifecycle pause, and nonblocking missing media. `test-result-audio.js`, `test-mobile.js`, core/multiplayer/progression, full browser, syntax, Android debug build and lint passed. Android 16 WebView loaded the bundled HTTPS-local MP3 with no media error, reached readyState 4 and advanced its playback clock; pressing Android Home paused at 46.419 seconds after lifecycle settlement. The emulator runs without audio output, so this verifies decoding/playback/lifecycle rather than perceived loudness or the artistic quality of the join. Source download is unchanged; prepared MP3 and refreshed APK are local, not deployed. Existing live-account/signing/publishing limitations remain.

September 10 below-lifelines banner update (`20260910.2`): syntax/core/multiplayer/progression, full browser, mobile bridge, `test-banner-layout.js`, Android debug build and lint passed. The focused layout suite tests reduced WebView sizes with ad/system-bar space reserved: solo from 320×454 through 430×808 (seven/eight rows), VS/Race/Co-op from 360×686 through 430×808, and 844×360 / 866×294 landscape. It checks board/keyboard/dock separation, visible 44 px-high keys, no page overflow, hiding during dialogs and paid banner removal. Online checks use explicit API fixtures, not live matches. On the Android 16 Pixel 6 emulator, the Google sample banner loaded below the actual solo lifeline dock: WebView height 770 px, dock bottom 757.5 px, plus native separator/ad outside the WebView. Native solo rotation also fit 866×294, with dock bottom 279.3 px and no page overflow or AndroidRuntime errors. Board sizing uses fractional bounds and a 2 px allowance to avoid rounding overlaps after resize. Prior 3× reward/account release limitations remain unchanged. Updated APK is copied to `release/SixthSense-debug.apk`.

September 10 Android (`20260910.1`): Node core/multiplayer/progression, full browser, engagement and `test-mobile.js` passed. Mobile browser tests cover successful/cancelled/failed rewarded ads, exact 3× solve coins with unchanged points, duplicate receipt prevention, storage-failure recovery, 320×568–430×932 result layouts, banner placement, and verified-owner UI. `test-play-purchase.js` checks verify-before-grant, acknowledgement, restore, pending/refund denial, hashed records, readiness/rate limits and unavailable-provider/configuration errors using mocked Google/Neon services. Debug APK and Android lint pass; the initial local SDK-path escaping issue was corrected. The release gate correctly rejects missing real AdMob configuration. npm audit reports zero vulnerabilities after a compatible uuid override fixes a transitive development-only xcode dependency.

Native smoke verification used an isolated Pixel 6 Android 16/API 36 emulator: installation/cold launch, age/username onboarding, local assets, a real Google sample banner with reserved bottom space, a two-attempt Practice solve, a Google sample rewarded ad's earned callback (120 + 240 = 360 solve coins; wallet 250 → 610; points unchanged at 600), disabled repeat claim, offline process restart retaining 610 coins, and native Back leave confirmation all passed. Game WebView measured 412×842 with document height 842 and no page overflow. AndroidRuntime/Capacitor error logs showed no app crash. The APK declares min SDK 24/target 36 and contains no native `.so` libraries or server/signing/private spreadsheet files; a final Play/16 KB device assessment remains on the checklist. No real purchase, regional UMP decision matrix, native pending-receipt process-death test, physical-device acceptance, production deployment or signed AAB is claimed. Test APK: `release/SixthSense-debug.apk`; detailed remaining steps: `ANDROID_RELEASE.md`.

September 9 falling-confetti update (`20260909.4`): syntax, core/multiplayer/progression, build, full browser, focused confetti and result-avatar checks passed locally on port 4269. Confetti checks measured actual downward motion after a solo solve, verified no shower on losses/reduced motion, tested click-through and dismissal cleanup, and exercised automatic expiry and reduced-motion cancellation on the shared online card surface. Fox victory screenshot inspected; phone result layouts remain usable from 320×568 through 430×932. Online surface coverage is not a live multiplayer match test. No deployment or Android build performed.

September 9 loss-background correction (`20260909.3`): `node test-result-avatars.js` passed on local port 4269, covering base/premium win/loss artwork loading, unchanged rewards, and phone result layouts. Inspected the fox loss-card screenshot and the new nine-animal sheet: the black exterior/rim is gone, replaced by lavender, with dark facial features retained. This is an asset/reference change; no audio/gameplay logic changed and no deployment was performed.

September 9 party/audio follow-up: `npm test`, app/multiplayer syntax, build, full browser suite, engagement suite, `test-result-avatars.js`, and `test-result-audio.js` passed on local port 4269. Verified win-only hat/blower rendering for free and premium avatars, responsive result cards, decoded applause+blower on actual wins and crowd “awww” on actual losses, music duck/restore, effect-mute/card-close cancellation, cancellation while decode is pending, and nonblocking missing-file recovery. Screenshot inspection covered fox and dragon party cards. Browser checks verify scheduling and playback state; final perceived sound balance still needs the user's listening feedback. Current local runtime is `20260909.2`; no deployment or Android build was performed.

September 9 local avatar verification at `http://127.0.0.1:4269`: `npm test`, `node --check app.js`, `node --check multiplayer.js`, `npm run build`, `npm run test:browser`, `npm run test:engagement`, and `node test-result-avatars.js` passed using installed Chrome. Focused checks exercised fox/dragon wins and declined-Last-Chance losses, decoded the selected happy/sad artwork, verified the unchanged 100-coin three-attempt reward, and kept result cards/OK usable at 320×568, 360×800, 390×844, and 430×932. Initial engagement runs sampled transient overflow immediately after viewport resize; both phone geometry tests now wait two animation frames before measuring, and the unchanged engagement assertions pass. Online result avatar integration shares the selected-identity renderer; no new live multiplayer or Android verification is claimed. Runtime cache version is `20260909.1`; changes are local, not published.

September 5 release verification: `npm test`, syntax/build checks, `test-browser.js`, and `test-engagement-browser.js` passed. Re-running the clue pipeline produced identical bank bytes. Focused QA verified corrected saved `dipped`, no second Sense charge, unchanged keyboard position, one 60-coin third-word bonus, persisted 700-coin final test wallet, mastery threshold crossing, personal-best feedback, Next-word state, six immediately visible result letters with reduced motion, and visible OK/no horizontal overflow at 390×844, 360×800, and 320×568. The full suite passed existing phone/desktop, Daily/Adventure result exits, dark keyboard, lifeline, navigation, and multiplayer-mock checks. Local QA for this turn uses `http://127.0.0.1:4267/` because other projects occupy 4173/4174; do not terminate those other servers.

Production runtime `20260905.1` was verified on the primary Vercel URL after GitHub commit `7e2648e`; Vercel reported success and GitHub Pages run `33977677710` passed. The focused engagement suite also passed against the public Vercel URL. The expanded production multiplayer suite passed with two independent browser contexts: current-bank Sense purchase, same-clue free reopening after authoritative refresh, restored seats, 2,340ms opponent-attempt visibility, synchronized VS round advancement, and Co-op Skip reveal/OK-gated shared advancement (31,018ms total). Test saves belong only to isolated QA contexts, not the user's wallet. No full-match lifecycle or WebSocket behavior is claimed by these checks.

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
npm run test:contrast
```

Previously verified production baseline (August 31–September 2):

- JavaScript syntax: passed.
- Core rules/data: passed — 10,187 answers across player-facing Normal 4,058 / Hard 2,246 / Extreme 3,883 and 15,232 accepted guesses; all answers are guessable; frequency threshold, `genial`, familiar-word, and `armory` clue regressions pass.
- Vocabulary audit: passed — hash-verified source, deterministic bank output, no duplicate/invalid-length entries, and no clue answer leaks, broken placeholders, proper-name senses, or offensive senses.
- Browser QA: passed — new-player 250-coin baseline, forced economy-v4 reset of an existing version-3 wallet, 99,999 earning/load cap after migration, five-digit 360px header fit, Statistics-in-Settings navigation, spending/reward persistence, phone playthrough, vertical Adventure paging and individual future-rung locks, replay surfaces, centered non-reflowing hints with visible remaining price chips, one-tap lifelines, paid eighth-row Last Chance and eighth-attempt victory, VS lifeline availability before and after submission, hidden VS Skip, Co-op launcher/lengths, automatic sixth-letter submission, victory-card confetti cannons, procedural hoot/applause scheduling, dark-theme feedback, and overflow checks.
- Local server: HTTP 200 at `http://127.0.0.1:4173/`.
- Vercel production: primary release target at `https://sixth-sense-game.vercel.app/`; runtime `20260902.1` contains the universal 250-coin reset plus the current hint, wallet-cap, Settings, Adventure, and completion releases described above.
- GitHub Pages: built with HTTPS at `https://cyberpaapi.github.io/SixthSenseGame/`; the latest completed deployment workflow passed.
- Multiplayer production: activated through the Vercel Neon integration on its free plan with `DATABASE_URL` connected to Production, Preview, and Development. Runtime `20260831.2` passed two isolated-client VS create/join/start, refresh rejoin, 1,901ms opponent-attempt visibility, immediate lifelines, hidden Skip, Last Chance decline, and synchronized round advancement. The same production suite continued into a Co-op room and passed shared start, six-letter Skip reveal, no advancement before OK, and synchronized word-two advancement after acknowledgement.
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

- The user rejected the CSS party accessories and requested rendered transparent sheets. Four generated sources in `artwork-drafts/party-sheets/` cover all 18 avatars in extended/rolled blower poses, but contain baked checkerboards. Genuine alpha cleanup, cell packing/alignment, and runtime replacement remain pending; a local cleanup permission question is awaiting the user's reply. Exact prompts and source status are recorded in that folder's README.

- Android source, test-ad SDK integration, rewarded solve bonuses and banner-removal billing/verification are implemented. The verification endpoint and privacy page are deployed, but `/api/play-purchase` correctly returns 503/available=false until Play server credentials are configured. Live AdMob serving/verification, Play product/pricing, app-ads.txt verification, store graphics and real-device/account release checks remain outstanding. A signed sample-ad internal-test AAB exists, but this is not yet a production-ready Play release; `ANDROID_RELEASE.md` lists the remaining steps.

- Clue validation catches structural leaks/patterns and the explicit regression list, not every semantic mistake. Rare-word/sense quality still benefits from human editing; the content audit does not claim a complete manual review.
- Trio, mastery, and personal bests currently apply to solo play; multiplayer retains its existing independent coin/round rewards. Local progress is not cheat-resistant and should not be used for real-money entitlements. There is no telemetry or evidence yet that these changes improve retention; they provide clearer short goals and competence feedback, not a promised addiction outcome.

- Solo progress, wallet, inventory, settings, and statistics are device/browser-local and can be cleared with site storage.
- The game does not provide accounts, cloud saves, or leaderboards.
- Production multiplayer uses 900ms bounded polling rather than WebSockets/SSE. It is playable and production-tested, but is not yet a push-realtime architecture.
- Online rooms expire after 24 hours and currently have no Force End or Play Again command. Players can leave and create a new room instead.
- Planned monetization is intentionally not active: the first three multiplayer match starts per player should be free, after which starting another match should require coins or an optional rewarded ad. This needs account/server-authoritative entitlement counters, ad-provider integration, consent/privacy handling, and abuse protection before implementation; do not enforce it from local storage.
- Rewarded Last Chance is implemented for Android with the matching backend deployed. Old servers remain compatible at seven tries with no online ad option. Real production ads, SSV, and physical-device acceptance remain unverified.
- Coins/cosmetics remain device-local and are not sold for money. Before selling them, use authenticated server-side ownership and purchase validation. The separate paid banner-removal entitlement uses server-verified Google Play ownership.
- The dictionary is deliberately broad but is not a promise to contain every historical, regional, inflected, or specialist six-letter form.
- Generated raster assets make the repository larger than a code-only static game; preserve optimized WebP versions where they exist.
- DM Sans and Nunito are bundled under SIL Open Font Licenses in `assets/fonts/`, with system fallbacks. No runtime Google Fonts network import remains.
- Browsers block audible playback before interaction, so the soundtrack intentionally starts on the first tap or key press rather than during page load. Automated QA verifies scheduling and settings state, but perceived loudness still depends on the device and its media volume.

## Change log and rationale

### 2026-09-18 — Reissue 500 coins and verify actual open-page delivery

- Advanced the compiled and public reset generation from 8 to 9 for the renewed owner request. Existing v8 clients already support the same 500 baseline and can apply it on their visible 30-second check/foreground recovery. Updated startup migration and current-version test fixtures.
- Added a real pre-deployment/public-policy check with isolated zero/high wallets left open across publication on both sites, alongside the existing migration and mocked offline/cross-tab tests. Verification results are recorded above. This does not freeze balances at 500 after normal earning/spending, or claim direct access to every player’s device.

### 2026-09-18 — Reliable key touches and vertical Race progress

- Responded to ignored/selected letter taps with a shared captured touch-release handler, explicit key/child selection and callout suppression, stable hit areas, retained solo keys and compatibility-click deduplication. Preserve mouse, physical keyboard and semantic activation; cancel dragged-away/interrupted touches.
- Moved Race progress beside the board on all layouts, with everyone initially at the bottom and completed words moving tokens upward. Keep the keyboard/dock full width, preserve progress/room state and account for the course in web/native tile fitting.
- Added focused touch and Race layout regressions, retained Away labels, and bumped the four affected client asset URLs. Local checks and public delivery/input/layout plus real-room regression results are recorded above; no coin reset or native release accompanies this change.

### 2026-09-18 — Fresh reset and starting balance of 500 coins

- Per the owner’s request, advanced economy/reset version to 8 and changed the starting wallet and public reset policy to 500. Every older saved wallet resets once when the updated client loads, retaining other progress and normal subsequent earnings/spending.
- Bumped both core/app asset URLs and updated current-version QA fixtures and expected balances. Prior open 250-coin clients must refresh; their policy checker intentionally requires a matching starting balance.
- Local core, full browser, migration/live reset, syntax and packaging checks passed. The update and migration/earn/reload checks are verified live on both Vercel and GitHub Pages; real offline/open-old clients cannot be counted or remotely forced to update.

### 2026-09-18 — Fresh 250-coin reset with live policy checks

- Responding to players retaining old balances, issued economy/reset generation 7 and added a cache-bypassed public policy check for updated open web clients, foreground recovery and cross-tab wallet reset synchronization. Added stale old-tab write repair, preserved later earnings, and prevented newer reset generations from being downgraded. Included the policy in Pages packaging and added focused live-policy tests. Old tabs still require one refresh and native/offline limitations are explicit above. Published and verified the fresh reset against both public sites, including existing version-6 wallets.

### 2026-09-18 — Restore returning players to their existing room seats

- Replaced destructive leave-key deletion with recent-room credential history and authenticated join resumption. Preserve the original seat/progress and reject name-only impersonation. Keep the active-room marker separate so leaving stays on home after reload; retain keys on temporary network failure. Updated leave/privacy copy, cache version and recovery regressions. Published and verified same-seat recovery in a full live Race room; results are recorded above.

### 2026-09-18 — Allow players into running Race rooms

- Opened running Race rooms to late entrants at word one of the existing server-selected route. Retained the eight-player cap, unique names, expiry/finished rejection and waiting-only entry for VS/Co-op. Rechecked the same condition within the locked SQL insertion and its error path. Added server rules and production concurrency/UI coverage. Published and passed the live test, including simultaneous requests for the final seat; recorded deployment results in Verification.

### 2026-09-18 — Preserve rapid multiplayer keyboard touches

- Following the clarification that double taps zoomed and letter touches failed, restricted gestures directly on the onscreen keyboards and retained multiplayer key buttons across snapshot updates. Preserved semantic click/keyboard activation, disabled states and color-independent markers. Added repeated-letter/Delete and mid-touch opponent-update assertions; bumped only stylesheet/multiplayer cache URLs.

### 2026-09-18 — Phone Race zoom correction

- Set multiplayer text inputs to 16px and extend gameplay gesture restrictions through the Race panel's nested scroll boundaries. Preserve home/settings zoom, panning, keyboard touch targets, the economy-v6 reset and all multiplayer behavior. Added a focused touch-enabled phone regression and versioned the stylesheet for refreshed web clients.

### 2026-09-18 — Reset current web wallets before continuing

- Per the owner's renewed reset request, advanced economy/reset version from 5 to 6: every older wallet becomes 250 once on updated-client load, with all other progress intact. Updated the application cache URL and current-version test fixtures. Already-open tabs require refresh; this release cannot remotely rewrite a running old client's local wallet.

### 2026-09-18 — Multiplayer away alerts and solo-only Skip

- Published and verified the feature on Vercel and GitHub Pages; hardened the live regression's reload readiness check for continuously polling rooms. Production results are recorded above.

- Added authenticated durable screen-away signals, deduplicated departure counters, ordered status updates and keepalive/retry delivery. All updated room clients display an accessible departure alert, red avatar and Away label; normal styling returns on foreground. Rewarded ads are excluded.
- Disabled new Skip use in VS/Race/Co-op on both UI and server, preserving active rooms and grandfathering only already-pending confirmations. Updated the explicit AGENTS.md product invariant.
- Fixed existing phone-web multiplayer overflow by sharing native board-fit styles and adapting board tile size to available height. Alerts overlay rather than push the board.
- Updated privacy disclosure, regression/live checks and cache URLs to 20260918.3 for CSS/multiplayer/mobile. Existing tabs need refresh; no forced room reset or signed Android/Play release is included.

### 2026-09-18 — Reveal only unknown positions

- Fixed multiplayer Peek selecting an already-green position. Extracted the existing solo exclusion rule into a shared core helper used by solo, the online UI and the authoritative server: all earlier exact positions and previous Peek positions are excluded.
- Disable online Peek and guard its purchase path when nothing useful remains; the server rejects exhausted direct requests without updating lifeline state. Keep duplicate letters eligible at genuinely unknown positions.
- Added deterministic candidate/API coverage, solo and three-mode browser fixtures, and a production Peek assertion. Versioned core/app/multiplayer scripts as 20260918.2. The economy-v5 reset and 50-coin Peek price remain unchanged. Installed Android bundles receive updated UI only in a future app update; the deployed API fixes candidate selection for their online requests too.

### 2026-09-18 — Publish the requested web wallet reset

- Advanced the economy and one-time reset marker from 4 to 5 for the requested GitHub Pages/Vercel release. All older saved wallets reset to 250 when this client first loads, retaining inventory, progress, statistics, cosmetics and claimed-ad history. Later earnings persist normally.
- Versioned app.js as 20260918.1 and updated current-wallet fixtures. Added browser coverage for every legacy version, current and new wallets, preserved non-wallet state, actual solve earnings and repeat reloads. No Android bundle was rebuilt or uploaded for this web release.

### 2026-09-17 — Verify the published build

- Recorded successful Vercel/Pages deployment and live asset/music/theme/multiplayer checks, including new-room six-row assertions. Fixed the production test's asynchronous guess timing without altering deployed gameplay.
- Updated backend and Android release handoffs to distinguish the deployed multiplayer/privacy/purchase endpoint from still-unconfigured paid purchase credentials and the older signed Play bundle.

### 2026-09-17 — Publish the current game and deepen dark backgrounds

- The GitHub/Vercel source still contained the older audio/runtime while the completed Android, supplied music and result updates existed only locally. Prepared the complete current source and required runtime assets for the requested push, preserving remote dark-tile commit f799897 and excluding private configuration, build outputs, unused art drafts and the unrelated spreadsheet.
- Darkened only dark-theme page/panel/progression/result backgrounds and reduced their colored lighting. Kept the readable letter tiles, feedback colors, light theme and artwork. Runtime URLs now use 20260917.1 so browsers refresh the combined build; the correct Tea and Tangrams asset remains the original first 88 seconds.
- Corrected the remaining home heading and board accessibility label to six standard chances, updated corresponding regressions, ignored machine-specific Android IDE state, and refreshed the debug APK. Verification and remaining release limitations are recorded above.

### 2026-09-16 — Six tries, rewarded Last Chance and immersive Android

- Integrated remote dark-theme commit f799897 by fast-forwarding main and restoring local Android/audio/artwork work; resolved package/document conflicts without discarding either feature set. A Git stash safety snapshot remains.
- Changed new games to six standard tries and one extra try, priced Last Chance at 125 coins, and fixed its collapsed inline coin. Preserved per-attempt rewards, historical statistics, existing guesses and bought extra attempts. Updated the explicit product invariant in AGENTS.md.
- Connected Last Chance to the native earned-reward callback, with typed durable receipts, atomic solo entitlement writes, and scoped/idempotent authoritative online retries. Added server pending-decision/attempt-cap guards and legacy-room limit migration. Updated rule/help/test copy and stylesheet/script cache to 20260916.3.
- Added immersive system-bar hiding/restoration and camera-safe header padding over the game background, keeping 44px controls and below-lifelines banners. Removed ad-exemption advertising from the age screen while retaining a neutral age question and UMP/minor protections.
- Bumped Android version to 1.0.1/code 2 and rebuilt debug. The old signed version-1 AAB remains unchanged; signing, Play upload and backend deployment were not performed. Full verification and limitations are recorded above.


### 2026-09-16 — Readable dark-theme letter tiles

- Replaced the hard-coded pale unsubmitted tile background with a theme-aware gradient. Dark mode now uses dark purple squares behind white letters, with theme-aware borders; light mode retains its existing appearance.
- Kept the shared solo/online tile selector and low specificity so Aligned, Echoing, Quiet, and Peek backgrounds continue to override the base surface. No game logic, rewards, wallets, or vocabulary changed.
- Added a regression test that failed on the original low-contrast styling and passes after the fix, reran the full browser/core suites and build, and versioned only the updated stylesheet for cache refresh.

### 2026-09-16 — Signed internal-test builds without production approval

- Added explicit internal/production release channels, with missing channel defaulting to production and unknown values rejected. Local configuration selects internal while preserving false production approval. Internal bundles retain release optimization/signing and use Google sample ads; production requires the checklist and uses configured real ads. The app still calculates rewards identically.
- Accept Android Studio's injected upload-key settings as well as local signing properties; require complete signing and an existing key file. Kept real-ID/HTTPS validation. Retried the user's signed bundle successfully and verified its signature; documented the artifact and remaining Play/account/runtime acceptance work.
- Play track selection is external to Gradle: the sample-ad internal bundle must be uploaded to testing, and a new production bundle/versionCode must be built after the remaining checks. No store deployment or approval is claimed.

### 2026-09-16 — Android Studio project import and Java setup

- Recovered from opening the user's home/settings folders as generic projects by importing the game's actual Android folder. Selected existing Java 21 when Studio rejected its default JVM 25 for Gradle 8.14.3.
- Verified Studio assembly and availability of the signed-bundle wizard; documented the precise file-picker steps, PowerShell npm launcher workaround and remaining signing/IDE notification limitations. No game logic or release-checklist bypass was introduced.

### 2026-09-16 — Developer images fit Console upload requirements

- Applied the user-pasted Console requirements over the older help-page icon specification: re-exported the website-aligned icon as non-transparent 24-bit PNG and the header as quality-95 JPEG.
- Both final upload files are under 1 MB at the exact required dimensions. Preserved prior exports and artwork; no design, app code or profile setting changed.

### 2026-09-16 — AlphaCode developer icon and header

- Created an original monochrome icon/header pair, then a second pair after the user supplied the AlphaCodeAI website, adopting its gold alpha, cobalt, ivory and orange identity. Public wordmark stays AlphaCode as requested.
- Saved source images, exact built-in generation prompts and Google Play-format exports under branding/alphacode. Retained v1 as an alternative and documented the header upscale. Profile uploads, site changes and in-game rebranding were not performed.

### 2026-09-16 — iOS port preparation

- Recorded the authorized Windows-development/macOS-cloud-build approach in `IOS_RELEASE.md`, including Apple membership/device inputs, native iOS ads/reward recovery, separate Apple purchase verification and staged TestFlight/App Store acceptance.
- Kept implementation status explicit: this is an account/implementation handoff, not a completed iOS app or CI workflow. No Android runtime behavior or deployment changed.

### 2026-09-16 — Supplied rewarded ad ID

- Completed the existing release AdMob configuration with the user-provided rewarded unit. The existing earned-callback flow still grants extra 2× solve coins for 3× total; debug retains sample ads.
- Recorded all public configuration values and reward-field guidance in the release document. Verified the release gate now reaches the outstanding checklist rather than a missing ID. Live serving and remaining publishing checks are not complete.

### 2026-09-16 — Supplied AdMob app and banner IDs

- Saved the owner-provided production app/banner IDs in the existing local release configuration path, preserving Google sample IDs for debug and leaving the missing rewarded ID/release checklist blocked. The native SDK and below-lifelines banner implementation already exist.
- Updated account/release documentation with supplied public IDs and reported Play verification/AdMob registration; live ad serving, rewarded setup and publishing are still incomplete. Configuration verification is recorded above.

### 2026-09-16 — Music repeats at 1:28

- Replaced the 102-second edit with the original recording's first 88 seconds, following the user's intended loop point. Short endpoint fades reduce clicks without rearranging the recording.
- Versioned the music/runtime URLs to refresh cached assets, tightened the actual-media duration test and rebuilt the test APK. Playback controls and result ducking retain their existing behavior.
- Updated preparation/provenance and release notes. Verification is recorded above; this is a local correction, not a production release.

### 2026-09-10 — Tea and Tangrams background music

- Replaced the procedural score with the user's supplied MP3, preserving the original download. Prepared a mobile MP3 loop with trailing silence removed, a 1.5-second tail/head crossfade, -4 dB gain and seek/duration metadata.
- Added one streaming audio player to the existing music gain/ducking path. Music keeps its position through mute and app pauses; pending rewarded-ad foreground callbacks cannot resume it before the ad flow finishes. Ordinary gameplay and recorded result effects remain independent.
- Added playback/loop/lifecycle/missing-file coverage, updated audio provenance/release notes and rebuilt the bundled Android app. Runtime `20260910.3`; verification follows above. Rights documentation and final perceived loudness remain release/user review items, not claims of independent licensing or listening approval.

### 2026-09-10 — Banners below game lifelines

- Extended native banners from home to solo and multiplayer play at the user's request, retaining dialog/map hiding and paid removal. Kept the native banner outside the WebView beneath the lifeline dock with its existing 8 dp separator.
- Fit noninteractive boards to remaining height, preserve 44 px-high keyboard/lifeline controls, and use side-by-side board/controls in short landscape. Added a wrapper to the online board without altering the authoritative room API.
- Reload adaptive banners after orientation/configuration changes and ignore callbacks from discarded ad views. Added focused reserved-space geometry checks, updated privacy/release copy and rebuilt the test APK. Verification and outstanding production-account limitations are recorded above.

### 2026-09-10 — Android, ads and banner-removal purchase

- Added Capacitor Android and native AdMob/UMP/Play Billing integration with the user's Sensei developer name, support email and 13+ audience. Retained offline solo play and authoritative Vercel/Neon multiplayer; no Cloudflare migration.
- Added home-only banners, optional 3× solve coins with durable/deduplicated receipts, one-time banner removal/restore with server Google Play verification and acknowledgement, consent/age/privacy and native lifecycle controls. Rewarded ads remain optional after purchase, as requested.
- Added release/signing templates and release gates, offline fonts, launcher/splash reuse, allow-listed mobile/Pages packaging, test-bridge coverage and a release/account checklist. Preserved unrelated `G-1-C6.xlsx` and prior artwork/audio work. Outstanding release/account/native test limitations are recorded above.
- Verified a real Google sample banner and rewarded callback on Android 16, plus offline restart and native Back. Added purchase-readiness/rate-limit coverage and debug-only WebView inspection; retained explicit live-account/signing/testing gates.

### 2026-09-09 — Falling confetti on success cards

- Expanded the short solo cascade into a roughly five-second shower of 56 drifting and tumbling paper pieces, distributed in four waves across the card. Added the same shared effect to online victories so it appears inside the modal instead of behind its backdrop.
- Clear the effect and its timer on card close, backgrounding, reduced-motion changes, or restart. The layer is decorative, does not intercept controls, and does not run on loss cards. Existing rewards, audio, and pending rendered-party artwork work are unchanged.
- Added focused lifecycle/motion coverage and updated the full browser assertion. Runtime cache version is `20260909.4`; checks are recorded in Verification.

### 2026-09-09 — Rendered party sprite source drafts

- Generated and saved base/premium sheets with hats and mouth-held paper blowers in extended and rolled poses, replacing the intended visual direction after the user rejected CSS accessories.
- Inspected all four files: each is 1254×1254 RGB with a baked checkerboard, so none is falsely marked transparent or connected to the game. Saved the exact prompts and outstanding cleanup/alignment requirements with the source drafts. Local background-removal permission is pending; the runtime remains unchanged by this draft-only work.

### 2026-09-09 — Remove black from loss-avatar backgrounds

- Replaced the free sad-avatar sheet with `avatar-animals-sad-v2.png`, whose exterior matches the lavender portrait backdrops instead of producing a black rim on loss cards. Dark facial details remain. The premium sad sheet already uses a colored exterior and is unchanged.
- Rejected an intermediate edit with a baked checkerboard. The selected replacement is opaque lavender; no transparency is claimed. Recorded the final built-in ImageGen prompt in `assets/result-avatar-prompts.md`.
- Updated the runtime reference and avatar regression to recognize versioned sad sheets; local runtime cache version is `20260909.3`. Focused verification is recorded in Verification. No deployment is included.

### 2026-09-09 — Party accessories and recorded crowd reactions

- Added a striped party hat and a paper party blower to every winning avatar, including premium animals and online winners. Accessories are native CSS layers over the existing art, with mouth-height adjustments by animal; they preserve cosmetic frames and never appear on losses. The blower unfurls and recoils once. Reduced-motion uses a static partially extended blower.
- Replaced synthesized victory hoots/applause and descending loss tones with locally bundled CC0 applause, party horn, and crowd “awww” recordings. Sounds start with the initial result card, lower the music, restore it afterward, respect mute, and cancel on dismissal/backgrounding. Optional asset failures do not block gameplay.
- Added result-audio regression coverage and extended avatar checks for win-only accessories. Preserved the user's pending 3× rewarded-ad plan. Added the Suno prompt and delivery brief; the existing background music awaits the user's replacement file.
- Local core, syntax/build, full browser, engagement, avatar, and result-audio checks passed as detailed in Verification. This change is not deployed.

### 2026-09-09 — Player avatars react to results

- Replaced the generic circular signal crest on solo and online result cards with the player's selected avatar and cosmetic frame. Wins use existing happy portraits; losses use two new generated sad-expression sheets, covering all 18 identities without changing their selection or ownership.
- Removed the result halo and loss grayscale effect so the actual expression communicates the outcome. Kept responsive avatar sizing, accessible result copy, reduced motion, existing celebrations, and all reward calculations.
- Updated the existing victory assertion and added `test-result-avatars.js` for free/premium identity, happy/sad artwork loading, unchanged rewards, and phone card geometry. Stabilized resize measurements by waiting for painted frames before asserting existing bounds. All local checks listed in Verification passed. No deployment is included in this local change.

### 2026-09-05 — Fairer clues and a stronger voluntary play loop

- Corrected misleading senses reported by the user, including the horse-related `dipped` clue. Fixed synonym-frequency contamination in the generator, added 143 editorial overrides, made inflected forms explicit, preserved intentional starter clues, and stored a complete clue diff. All 10,187 answer/tier positions and 15,232 guesses remain unchanged; no player route or difficulty migration occurs.
- Refresh saved and already-purchased room clues after content updates, preserving purchases, attempts, and hidden-information boundaries.
- Added a three-distinct-word daily solo goal with a fixed 60-coin completion bonus, point-derived mastery, genuine personal-best feedback, and optional Next word after suitable solo wins. These give immediate goals, visible competence, and convenient voluntary continuation without changing Daily/Adventure exits, punishments for absence, or random payouts. The direction is informed by competence/autonomy principles described in [PENS](https://selfdeterminationtheory.org/player-experience-of-needs-satisfaction-pens/), not an assertion of measured retention gains.
- Reused the existing clay/generated art system, kept controls at thumb-friendly sizes, checked light/dark phone surfaces, removed reduced-motion reveal delays, and corrected a pre-existing Co-op thumbnail/text overlap found during visual QA. Added pure and real-browser regression coverage and this handoff context.
- Published runtime `20260905.1` to Vercel and GitHub Pages; verified the public solo loop and expanded the two-client production test to cover current-bank Sense wording plus free reopening after refresh. The current release leaves every existing version-4 wallet intact.

### 2026-09-02 — Universal wallet reset to 250 coins

- Advanced the economy and wallet-reset version from 3 to 4. On the first load of this release, every existing local wallet from versions 1–3 is set to exactly 250 coins; new players also begin with 250.
- Kept all non-wallet state intact, including Adventure progress, solved words, statistics, lifeline inventory, avatars, decorations, and highlight choices. After the one-time migration, ordinary rewards and purchases persist normally.
- Updated browser fixtures and migration coverage to distinguish pre-reset version-3 wallets from current version-4 wallets. Versioned the static runtime as `20260902.1` so cached devices receive the reset.

### 2026-08-31 — Non-reflowing Sense feedback

- Removed the obsolete purple hint-toast path and stopped duplicating the clue in the inline lifeline announcement. Sense now has one visual presentation: the centered, confirmable white popup with its purple outline.
- Absolutely contained ordinary status toasts in a fixed-height slot, preventing any feedback length from reflowing the seven-row playfield or pushing the keyboard and lifeline prices below the phone viewport.
- Added phone-browser geometry regressions proving the Sense popup leaves the dock in place and keeps the three remaining prices visible. Versioned the static runtime as `20260831.7` so cached phones receive the correction.

### 2026-08-31 — Five-digit wallet cap and Statistics inside Settings

- Added a single exported 99,999 coin ceiling and routed saved-state normalization, solo solve rewards, Daily streak bonuses, multiplayer rewards, and refunds through capped credit logic. Crossing the cap grants only the remaining amount; already-full wallets remain at 99,999.
- Removed the Statistics icon from the global header, leaving more room for five-digit balances on 360px phones. Added a full-width clay Statistics action inside Settings using the existing original stats artwork; closing the nested Statistics sheet returns focus to Settings.
- Added core and browser regressions for existing five-digit balances, partial credit into the cap, credits while full, oversized-save clamping, reload persistence, 360px overflow, header removal, and Settings navigation. Versioned the static runtime as `20260831.6`.

### 2026-08-31 — Universal 250-coin wallet reset

- Raised the new-player starting wallet from 200 to 250 coins.
- Added economy version 3 as a one-time forced migration: every existing version-1/version-2 local wallet is set to exactly 250 on next load, regardless of its prior balance. Adventure progress, solved words, stats, lifeline inventory, and cosmetic ownership remain untouched; after migration, coin earning and spending persist normally.
- Added core and browser regressions for the new baseline, exact old-wallet reset, version marker, purchases, solve rewards, and phone-header fit. Versioned the static runtime as `20260831.5` so cached phones receive the migration code.

### 2026-08-31 — Vertical Adventure paging and individual rung locks

- Removed the translucent full-map lock veil from unreached Adventure pages. The generated scene stays unobstructed, while every future rung retains its own chain treatment, disabled interaction, and locked accessibility label.
- Reoriented page navigation to the ladder: upward swipes reveal the next eight higher levels, downward swipes return to lower levels, horizontal swipes no longer change pages, and the side controls are now stacked up/down arrows.
- Disabled the page-level Play action when a preview contains only locked future nodes, added browser regressions for gesture direction, per-node locking, unobstructed scenery, and phone overflow, and versioned the static runtime as `20260831.4`.

### 2026-08-31 — Victory hoot, card-timed confetti, and applause

- Expanded every initial win celebration with 20 delayed confetti-cannon pieces fired from both lower corners as the victory card appears, while retaining the full-screen burst and card-local cascade. Reduced-motion still removes all optional confetti.
- Reworked the original procedural win sound into a clear sequence: a two-part rising celebratory hoot, the existing bright harmonic flourish, then 18 randomized, low-volume clap clusters behind the card. The applause is synthesized at runtime, stops naturally after roughly 2.5 seconds, and follows the existing Sound-effects toggle and browser gesture unlock.
- Added browser regressions for the cannon count and explicit hoot/applause schedule. Versioned the static runtime as `20260831.3` so refreshed phones cannot mix the new audio engine with stale celebration styling.

### 2026-08-31 — Frequency tiers, multiplayer lifeline repair, Co-op, and Last Chance

- Replaced the fixed 4,309-word primary quota and manual rescues with a Zipf 2.75 Normal threshold. The unchanged 10,187-answer base now divides into Normal 4,058, Hard 2,246, and Extreme 3,883; `genial` moves to Hard while familiar examples including `brooch`, `napkin`, `pewter`, `tarmac`, `walrus`, `raffle`, and `rattle` remain Normal. Added a reviewed `armory` clue override to remove the arbitrary “collection of resources” sense.
- Virtualized Adventure into swipeable eight-level pages. Completed rungs are replayable without rewards or progression; future pages can be previewed through a translucent chain lock but cannot be played, and the current mixed-boundary page keeps its active-zone artwork.
- Fixed the VS lifeline dead-state by explicitly restoring the dock after every guess submission, including when unchanged-snapshot suppression skips a full repaint. Sense/Peek/Clear now work before the first attempt and throughout VS; Sense stays in the centered popup, and Skip is hidden and server-rejected.
- Added server-authoritative 2–4-player Co-op with shared 3/5/10-word routes, original generated team artwork, private boards/lifelines, and synchronized advancement when any teammate solves. Race already used one server-selected route for all seats and continues to do so.
- Added an 80-coin Last Chance decision after seven misses in solo, Race, VS, and Co-op, with a compact eighth row after purchase. The ad alternative is present but disabled for future monetization work. Race/Co-op Skip now reveals the answer and waits for green OK before authoritative progression; VS has no Skip. VS correct solves award device-local coins at exactly 60% of solo rates with per-room/round idempotency.
- Scoped pinch suppression to active solo/online play while preserving zoom on home, settings, and other navigation surfaces. Added server/helper and installed-Chrome regressions for the new tier boundaries, clue, VS lifeline availability before/after guesses, hidden VS Skip, Co-op launcher/lengths, and phone overflow. Versioned the static runtime as `20260831.2`.
- Extended the public Vercel acceptance suite past VS into a fresh two-browser Co-op room, including the server migration, shared start, private Skip reveal, and the rule that both screens remain on word one until the skipper presses OK.

### 2026-08-31 — Completion cards, native-feeling Back, one-tap help, and economy scale

- Unified completion handling across every solo mode. Daily, Practice, Time Tackle, Insight, Streak, and Adventure now show the celebratory result sheet with the six-letter answer, attempts, earned coins, and new 700-to-100 puzzle points. The focused sheet removes the old progress/share clutter and uses one green OK action; Daily and regular solo modes return home, while Adventure returns to the map and performs its rung movement after acknowledgment. Reopening a finished Daily restores its card instead of leaving the player on an inert board.
- Added a match-completion card to Race and VS with victory/recovery copy and match points. Existing synchronized round transitions remain nonblocking during live play.
- Replaced the timed Sense toast with a real centered dialog: purple outline, black clue text, 60%-alpha white surface, and green OK. Sense remains freely reopenable after its first use, including in multiplayer.
- Changed all zero-stock lifelines to buy and use in one tap. Skip still confirms first and only charges on confirmation. Scaled lifeline prices to 30/50/40/60, solve coins to 140–20, and the seven-day reward to 300. Scaled premium cosmetics by 50× to 1,500–3,250 coins and added a one-time economy-v2 migration that multiplies explicit legacy balances by 10.
- Added History API screen states so phone browser Back closes dialogs or navigates within the app rather than abandoning it. Active solo puzzles and online rooms always intercept Back with a confirmation; cancelling preserves the exact game surface.
- Extended core and installed-Chrome Playwright coverage for points, scaled economics, one-tap lifelines, popup visual tokens, completed-Daily recovery, Adventure’s acknowledged map return, mobile browser Back confirmation/cancellation, premium pricing, multiplayer Sense, and phone overflow. Versioned the static runtime as `20260831.1`.

### 2026-08-27 — Automatic six-letter submission and full-width puzzle keyboard

- Removed the onscreen Enter control from solo, Race, and VS. Typing or tapping the sixth letter now immediately runs the same dictionary, hard-mode, scoring, animation, and authoritative multiplayer submission path that Enter previously triggered; physical Enter remains available as a non-required keyboard alternative.
- Fixed the Daily keyboard’s collapsed width by giving the shared keyboard an explicit full play-surface width. The final seven-letter-plus-Delete row is centered at 85% so its keys retain the same visual scale as the ten-key first row instead of stretching unevenly.
- Updated every automated playthrough to solve without Enter and added explicit 27-key, absent-Enter, Daily keyboard-width, multiplayer payload, phone overflow, and result-flow regressions. Versioned the static runtime as `20260827.18`.
- Published the change to Vercel and passed the public two-client VS acceptance flow using only six letter taps for every guess; create, join, Start, refresh rejoin, opponent-attempt visibility, and synchronized round progression remained healthy.

### 2026-08-27 — Confirmed multiplayer Back path and polling flicker repair

- Replaced the multiplayer house/“Leave game” control with a compact red clay Back action and arrow. VS and Race now present a mode-aware confirmation before removing the saved seat; “Stay in game” is the safe first action, “Leave match” is explicitly destructive, and the header brand uses the same confirmation rather than bypassing it.
- Stopped unchanged 900ms multiplayer polls from rebuilding the board, keyboard, lifeline dock, progress cards, and Race avatars. Snapshot signatures now preserve the existing DOM and scroll position until authoritative room data actually changes; joining and host Start completion explicitly refresh transient enabled states instead of relying on a later repaint.
- Changed phone background attachment from fixed to scroll to avoid compositor instability at the bottom boundary. Added 390×844 browser regressions for the red Back treatment, both confirmation choices, persistent board identity across multiple polls, lifeline availability after join, and mobile background behavior. Versioned the static runtime as `20260827.17`.
- Published the repair to Vercel and reran the public two-client VS acceptance flow against the production alias; create, join, host Start, refresh rejoin, live opponent attempts, and synchronized round advancement all passed.

### 2026-08-27 — Focused victory loop and ethical replay momentum

- Replaced the automatic generic Statistics popup after a solo solve with a purpose-built completion sheet. It now foregrounds the six-letter answer, attempt-specific mastery language, coins earned, any seven-day bonus, and one nearby progress goal; Statistics remains available only when the player asks for it.
- Added a clear primary continuation: Daily returns home, while Practice, Time Tackle, Insight, and Streak begin the next clean word in one tap. Adventure intentionally keeps its direct map return and climbing-token payoff.
- Generated and optimized the original transparent `result-signal-crest-v1.webp` victory emblem (95,494 bytes). Added staggered answer tiles, a full-screen ring/burst/fall confetti sequence, a second in-sheet cascade that remains visible above the dialog backdrop, a richer procedural completion chord, and optional vibration. Reduced-motion and Sound effects preferences continue to suppress optional feedback appropriately.
- Applied ethical engagement principles: immediate multimodal feedback, competence recognition, visible but bounded progression, voluntary sharing, and low-friction replay. Explicitly rejected manipulative timers, obscured costs, loss pressure, and other dark patterns.
- Added browser regression coverage for result content, reward arithmetic, confetti layers, audio scheduling, Stats separation, phone overflow, seven-day rewards, Adventure exclusion, exit behavior, and one-tap Practice replay. Versioned the static runtime as `20260827.16`.

### 2026-08-27 — Adventure flow, multiplayer assistance, Time Tackle, rewards, and premium identity

- Changed Adventure completion and paid Skip to return directly to the map, advance exactly one rung, and animate the avatar to its new block. Removed the obsolete result-sheet detour and the old “Skip stays here” behavior.
- Renamed the solo Sprint surface to Time Tackle and expanded its deadline from 90 seconds to ten minutes while preserving the internal `sprint` save key. Added a seven-day Daily reward of 30 coins with a visible Champion icon in the home rail and earned-results state.
- Fixed the phone puzzle footer so lifeline costs remain visible inside the locked viewport, removed the exposed maroon bottom gap, and retained equal icon spacing and 44px touch targets.
- Added a clear Leave game control and authoritative Sense/Peek/Clear/Skip lifelines to Race and VS. Added server-migrated private lifeline state, idempotent effects, VS Skip forfeits, Race Skip advancement, and authenticated live identity updates without sending answer words to the browser.
- Replaced the Race progress cards on phones with a thin green shared course, live avatar tokens, and a black-and-white checkered finish. Play Together now precedes Game Modes, its redundant subtitle and the Game Modes subtitle are gone, and newly generated `multiplayer-race-v2.webp` / `multiplayer-vs-v2.webp` scenes replace the old shared sheet.
- Generated and optimized nine premium animal avatars plus four transparent premium frames. Coin purchases apply immediately, persist locally, appear on Adventure/profile/online avatars, and can be reached from the top-left profile. Recorded the future “first three multiplayer matches free, then coins or rewarded ad” model as planned—not active—because safe enforcement requires accounts and a server-side entitlement system.
- Extended Node and installed-Chrome Playwright coverage for the new behavior, including Adventure solve/Skip return, streak reward, premium purchases, explicit exit, multiplayer lifelines, Race geometry, mobile costs/no-scroll, dark mode, and two-client VS transitions. Production then passed the migrated Sense and premium identity endpoints plus the full two-client room suite. Versioned static runtime files as `20260827.15`.

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
