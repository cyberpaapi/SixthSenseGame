# App Store submission packet

Draft October 12, 2026. No App Store Connect record or submission has been created.

## Reviewer instructions

Solo play requires no account. Choose an age group, select **Play solo as a guest**,
and open Daily or Adventure. Settings contains the shop, Restore purchases,
privacy document and support contact. Optional rewarded ads are offered on an
eligible victory card and Last Chance. Automatic ads occur only at full-match
completion or every third new Adventure advancement. Remove Ads covers both
banners and automatic ads, with optional rewards retained.

Multiplayer uses a public username/recovery-code profile and private room code.
Provide dedicated reviewer profiles privately in App Store Connect, after
confirming the deployed API; do not paste live recovery credentials into this file.
Two devices can create/join/start a room. An active match displays a best-effort
away indicator if a player backgrounds the game; it does not inspect other apps.

## Store setup

- Free download, with the six in-app products from `IOS_RELEASE.md`.
- Initial intended market India; choose additional countries deliberately.
- Intended audience 13+. Complete Apple's current content questionnaire from
  the actual clues; references include non-graphic violence, medical terms,
  alcohol/tobacco and Bollywood films. Do not copy Google's assigned rating.
- No subscriptions, cash prizes, loot boxes, location sharing, chat or uploaded media.
- Confirm the supplied Tea and Tangrams music rights and publisher/seller display name.
- Paid-app agreement, banking/tax, review contact details and signing are owner inputs.

## Privacy worksheet to verify against the release binary

| Data | Use | Source / remaining review |
|---|---|---|
| Username and profile/recovery identifiers | Multiplayer identity, restoration and security | Durable registry; recovery credential is hashed on server |
| Game actions and room presence | Run private games and reconnect | Temporary room data; not a solo cloud save |
| Purchase identifier, product, installation UUID, delivery times | Verify/deduplicate supply delivery and support | Apple/Neon; no payment-card details |
| Approximate location from IP, device/SDK identifiers, ad interactions, diagnostics | Advertising, measurement and fraud prevention | Confirm Google's exact SDK disclosures and merged privacy report |

The code requests contextual ads, disables personalization and has no ATT prompt.
Do not declare tracking or data collection solely from this worksheet: inspect
the final SDK privacy report, AdMob configuration and Apple's definitions. The
local Swift privacy manifest covers required-reason UserDefaults access; SDK
manifests must be present in the archive. Missing declarations block release.

## Screenshots

The native UI run 38225990851 passed on October 12, 2026. `screenshots/` contains four inspected, unretouched 1320×2868 RGB iPhone captures: home, Adventure, puzzle and clue. `qa/` contains landscape and W/Z/X/E/D touch evidence, not store-listing selections. `capture-provenance.json` records the source commit, run, dimensions and hashes. No images have been uploaded to App Store Connect.

The actual Under 13 eligibility path keeps ads out of the captures; release monetization is unchanged. The successful UI run covers age/guest onboarding, Adventure launch, single letter taps/deletion, Sense, rotation and persisted age after restart. This does not replace physical-device, ads, purchase or multiplayer acceptance.

## Submission gates still requiring acceptance

Apple enrollment and app record; signing and TestFlight processing; iPhone and
sandbox purchase/ad/privacy matrix; actual screenshot inspection; in-app account
deletion initiated in-app (the current support-email-only route still needs
authenticated deletion implementation); final public privacy policy and app-ads.txt;
production ad IDs. Public review and approval are separate from successful upload.
