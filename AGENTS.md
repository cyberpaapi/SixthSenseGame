# Instructions for AI contributors

Before inspecting or changing this project, read `GAME_KNOWLEDGE.md` in full. It is the canonical handoff and product context for Sixth Sense.

Every change to code, copy, rules, data, assets, tests, configuration, publishing, or documented behavior must update `GAME_KNOWLEDGE.md` in the same commit. A change is not complete until the knowledge file accurately reflects the resulting build.

At minimum, after a change:

1. Update the relevant current-behavior, architecture, data, UI, test, or deployment section.
2. Append a dated entry to the change log explaining what changed and why.
3. Update the “Last verified” line and verification results after running checks.
4. Record unresolved limitations honestly; never describe a planned feature as implemented.

Preserve these product invariants unless the user explicitly changes them:

- The game uses six-letter words and seven chances.
- The visual identity, artwork, terminology, copy, and layout remain original and must not imitate Wordle branding.
- The answer pool contains exactly 5,000 common six-letter words with clues; accepted guesses remain substantially broader.
- The game screen must not page-scroll or overflow at supported phone sizes.
- Sense is unlocked once per puzzle and can then be reopened freely. Peek, Clear, and Skip use persistent inventory and can be purchased and used repeatedly while useful.
- Accessibility, keyboard input, touch targets, color-independent markers, and reduced-motion behavior must be preserved.

Use GitHub repository `cyberpaapi/SixthSenseGame` as the source of truth. Preserve unrelated user work, run the documented checks, commit only intended files, and keep secrets out of the static client.
