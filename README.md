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

- Five modes: Daily, unlimited Practice, 90-second Sprint, assisted Insight, and persistent Streak runs
- Separate home and play screens, keeping the puzzle view focused
- Exactly 5,000 frequency-ranked common answers, each with a Sense clue
- 15,232 independently validated six-letter guesses from a proper-name-safe word-game lexicon
- Correct repeated-letter scoring
- A compact bottom icon dock for coin-powered Sense, Peek, Clear, and Skip lifelines
- Price-under-icon and top-right inventory badges that never show redundant zeroes
- A fixed one-viewport play layout with no page-level game-screen scrolling
- Persistent coin wallet with attempt-based solve rewards (14 coins down to 2)
- Sense clues can be reopened freely after their one-time purchase in each puzzle
- Peek, Clear, and Skip can be stocked, used, repurchased, and used again; each Peek and Clear finds fresh information
- Sense clues appear in a centered five-second bubble and can be reopened anytime
- Purposeful purchase, use, reveal, removal, wallet, and screen-entry motion with reduced-motion support
- Optional hard mode
- Dark and high-contrast themes
- Sound, statistics, streaks, countdown, and result sharing
- Original generated 3D clay control sheet plus nine optimized transparent PNG icons
- Nine original generated logo marks with an in-app 3×3 persistent logo chooser
- Keyboard, touch, screen-reader labels, non-color symbols, and reduced-motion support

## Verify

```powershell
node test-core.js
node --check app.js
```

## Maintainer and AI context

Read [GAME_KNOWLEDGE.md](GAME_KNOWLEDGE.md) before changing the game. It is the living source of truth for the product rules, architecture, design decisions, current behavior, verification workflow, and change history. [AGENTS.md](AGENTS.md) requires every future code, content, data, art, configuration, or behavior change to update that knowledge file in the same commit.

No Wordle logos, art, copy, title treatment, or branded color system are used. Sixth Sense has original naming, visual identity, help language, feedback symbols, and interface composition.
