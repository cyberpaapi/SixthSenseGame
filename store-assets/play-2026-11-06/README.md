# Light-theme Play Store gallery — November 6, 2026

Six 1080×1920 opaque RGB JPEGs in `upload/`, each below 0.5 MB. `preview.html` is the review gallery; `contact-sheet.jpg` is its compact overview. `manifest.json` records final image dimensions, sizes and SHA-256 hashes.

Owner-approved order (filenames retain their capture identifiers):

1. `01-guess-word.jpg` — Guess the word. Feel the aha.
2. `04-race-friends.jpg` — Race your friends.
3. `06-lifelines.jpg` — A little help. A big aha.
4. `02-bollywood-movies.jpg` — Think you know Bollywood?
5. `03-bollywood-characters.jpg` — Name the legend.
6. `05-bollywood-race.jpg` — Cinema night. Game on.

The age selection capture in `raw/age-screen-light.png` is for the owner's review only, not part of the store gallery. No Adventure map, obscuring clue modal or ad creative appears in this set. The original app icon and feature graphic are unchanged.

## Source and honesty of representation

Gameplay is the actual HTML/CSS/JavaScript client extracted from the signed, released Android 1.0.4/code 5 bundle, SHA-256 `32310d0bcb560c85547ad8647495aff83d36ae256f176e525a2d1c5c9ee7ddd5`. It is rendered with Chromium at 390×640 and 3× density; onboarding uses 390×844. These are not physical-phone captures. An isolated native bridge selects the Android layout with ads unavailable. Local demonstration saves and room snapshots supply the displayed puzzle/player state, using the real game's scoring and renderer. No production room, account, wallet or application code was modified. Age is unset only in the separate onboarding capture.

The raw gameplay panels are unchanged images inside deterministic HTML/CSS marketing frames. Generated transparent fox illustrations decorate the header; no AI-generated board or invented gameplay appears. The six composite screenshots must be declared as created/edited using AI in Play Console because they contain generated decorative artwork. Code-6 streak reminders and unlaunched purchases are not advertised.

## Reproduction

The archived `raw/` files are the canonical source captures. With a local HTTP server at repository root on port 4273, run `node scripts/render-play-marketing.cjs` to reproduce the cards, JPEGs and gallery. Fonts are the repository's bundled Nunito family. A fresh capture requires extracting only `base/assets/public/` from the exact code-5 AAB into ignored `release/play-capture-runtime/`, then running `node scripts/capture-play-marketing.cjs`. Daily answers depend on date, so fresh captures on another date will differ. The capture script uses `test-browser-runtime` isolated test identity behavior and intercepts multiplayer locally; it must not be pointed at production.

Verification: both scripts completed; capture page errors were empty; all six exports are RGB 1080×1920 and below 8 MB; every composed image was visually inspected in the contact sheet. No game-source changes, so gameplay/native regression suites were not rerun for this asset-only update.

## Generated supporting artwork

Built-in image generation used `assets/app-icon-fox-512.png` as the character/style reference, with transparent background enabled. Originals remain in the Codex generated-images directory; copies are in `art/`.

Shared prompt: "Use case: ads-marketing. Asset: transparent cutout supporting artwork for Sixth Sense word game Play Store screenshot headers. Reference image is character identity and high quality fluffy 3D style ONLY; do not reproduce the reference logo or background. [Concept below.] Premium polished 3D casual game illustration, orange fur, white muzzle, warm brown eyes, soft studio lighting. Isolated on real transparent background. Generous 8% clear margin all around. No text except the specified question mark if any, no logo, no phone, no UI, no ads. Portrait-ish square composition."

- `word-fox.png`: same happy fluffy orange fox hugging a glossy mint question-mark tile, curious and delighted, small blank amber/violet tiles floating. Original `exec-42f24664-f00b-49a6-a95e-f52ade7791e4.png`.
- `cinema-fox.png`: same fox as playful film director with purple beret, blank clapperboard, gold film reel and stars; no celebrity or movie-character likeness. Original `exec-8ede3e93-d1c9-48fe-8412-1ae97bc785a0.png`.
- `friends-fox.png`: fox and panda celebrating together, checkered flag and blank colorful tiles. Original `exec-7fb84052-838b-4557-805e-ca0e552db87e.png`.

## Publication

Production 1.0.4/code 5 was verified at 100% rollout in Play Console on November 6, published October 14. The India public listing displayed an Install button. This was a signed-in browser check, not proof of availability for every device/country or a guarantee of search ranking. Internal tester enrollment is account-specific and does not mean production is private.

Listing update status is recorded in `GAME_KNOWLEDGE.md` after Console submission.
