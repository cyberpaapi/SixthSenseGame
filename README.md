# Sixth Sense

An original, mobile-first six-letter word deduction game with a tactile claymorphic interface.

## Play online

[Play Sixth Sense](https://sixth-sense-game.vercel.app/)

## Play locally

Serve this folder with any static server, for example:

```powershell
python -m http.server 4173 --directory .
```

Then open `http://localhost:4173`.

## Included

- Eight modes: Daily, Adventure, Practice, ten-minute Time Tackle, Insight, Streak, private-room Race, and live one-on-one VS
- A persistent 10,187-level Adventure signal trail with a per-device randomized route: all 4,309 Normal words, then 1,995 Hard words, then 3,883 Extreme words
- Separate home and play screens, keeping the puzzle view focused
- 10,187 clueable answers in Normal (4,309), Hard (1,995), and Extreme (3,883) player-facing tiers
- Silent solo progression from Normal into Hard and then Extreme as each tier is completed
- 15,232 independently validated six-letter guesses from a proper-name-safe word-game lexicon
- Correct repeated-letter scoring
- A compact bottom icon dock for coin-powered Sense, Peek, Clear, and Skip lifelines
- Price-under-icon and top-right inventory badges that never show redundant zeroes
- A fixed one-viewport play layout with no page-level game-screen scrolling
- Persistent coin wallet with attempt-based solve rewards (14 coins down to 2)
- A visible 30-coin reward every seven consecutive Daily wins
- Sense clues can be reopened freely after their one-time purchase in each puzzle
- Peek, Clear, and Skip can be stocked, used, repurchased, and used again; each Peek and Clear finds fresh information
- Sense clues appear in a centered five-second bubble and can be reopened anytime
- Purposeful purchase, use, reveal, removal, wallet, and screen-entry motion with reduced-motion support
- Optional hard mode
- Dark and high-contrast themes
- An original generative ambient soundtrack plus tactile gameplay effects, each with its own persistent toggle
- A dedicated victory flow with performance copy, solved-word reveal, earned coins, nearby progression, layered confetti, a richer completion chord, result sharing, and one-tap replay
- Statistics remain a separate, player-opened screen instead of interrupting every successful solve
- Original generated 3D clay control sheet plus nine optimized transparent PNG icons
- Nine free and nine coin-unlockable generated animal avatars, four premium avatar frames, and a persistent highlight-color picker
- Required first-open username setup with editable identity in avatar settings; names are unique inside each online room
- Live Vercel/Neon room-code multiplayer for 2–8-player 3/5/10-word races and two-player point-based 3/5/9/Endless VS with a red confirmed Back action, shared lifelines, stable polling without repeated full-board repaints, thin green avatar race tracks, refresh rejoin, live attempt patterns, and synchronized new-word transitions
- Keyboard, touch, screen-reader labels, non-color symbols, and reduced-motion support

## Verify

```powershell
node test-core.js
node --check app.js
node --check multiplayer.js
node --check api/multiplayer.js
npm run test:production-multiplayer
```

## Maintainer and AI context

Read [GAME_KNOWLEDGE.md](GAME_KNOWLEDGE.md) before changing the game. It is the living source of truth for the product rules, architecture, design decisions, current behavior, verification workflow, and change history. [AGENTS.md](AGENTS.md) requires every future code, content, data, art, configuration, or behavior change to update that knowledge file in the same commit.

No Wordle logos, art, copy, title treatment, or branded color system are used. Sixth Sense has original naming, visual identity, help language, feedback symbols, and interface composition.
