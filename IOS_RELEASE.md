# Sixth Sense iOS release preparation

Prepared September 16, 2026. Status: implementation scope and account handoff only. There is no iOS native project, iOS monetization plugin, macOS workflow, signed IPA or TestFlight upload yet. Android remains the implemented native platform. The user authorized an iOS port using GitHub-hosted macOS builds from Windows.

## Owner inputs

1. Apple Developer Program enrollment status. Paid membership is required for TestFlight/App Store distribution. Enroll at https://developer.apple.com/programs/enroll/ . Individuals display their legal name as seller; an organization uses its legal entity name. Sensei branding does not itself establish an organization.
2. Access to an iPhone: model and installed iOS version, for real-device testing. Tester Apple Account addresses will be needed when distributing through TestFlight, not for source preparation.
3. After enrollment: Apple Team ID and confirmation that `com.sensei.sixthsense` can be registered to that team. Keep the existing game name, support email and 13+ product audience; answer Apple's current rating questionnaire from actual content instead of translating the Google age bands directly.
4. Register an iOS app in the existing AdMob account and supply its separate app, banner and rewarded IDs. Partner bidding stays off; rewarded settings are amount 1 / Triple coin boost. Android IDs remain Android-only.
5. Select the price for permanent banner removal. Create an Apple non-consumable `remove_banner_ads`; optional rewarded ads remain. Complete Apple's paid-app agreements and tax/banking setup for purchases.
6. When the macOS build/upload workflow is ready: configure Apple signing and App Store Connect API access through protected GitHub configuration. Private signing keys, `.p8`/`.p12` contents and passwords must not be sent in chat or committed. Document the exact workflow secret names when the workflow exists; none have been created or requested yet. API upload credentials do not replace app-signing credentials.

Start with enrollment status and iPhone access; the remaining items can follow during development.

## Implementation sequence

### 1. iOS application and unsigned cloud validation

- Pin `@capacitor/ios` to the compatible installed Capacitor version and generate a native iOS target using supported tooling. Reuse `scripts/build-mobile.js` and its public-client allow-list.
- Keep the authoritative Vercel/Neon multiplayer service. Preserve six-letter words, six standard chances plus one optional Last Chance, inventory, accessibility, reduced motion and the 88-second music loop.
- Provide an iOS `SenseiMonetization` bridge with the same contract consumed by `mobile.js`, plus Apple-native lifecycle, layout and privacy behavior. Never expose active ad/purchase controls backed by a missing plugin.
- Add a GitHub Actions workflow on a standard macOS runner with a compatible Xcode, read-only default repository permissions and bounded runtime. First validate unsigned simulator builds without account secrets. Keep unsigned checks separate from signing/upload jobs.
- Scope pushes to reviewed project changes; preserve unrelated `G-1-C6.xlsx` and other local user work. The public repository was confirmed as `cyberpaapi/SixthSenseGame`; standard hosted runner compute is free for public repositories under current GitHub pricing. Limit artifact retention and avoid larger runners.

### 2. Ads, consent and native reward recovery

- Integrate the iOS Google Mobile Ads and UMP SDKs using iOS sample IDs in debug. Production configuration requires the three iOS IDs, not the supplied Android IDs.
- Reserve banner space below lifelines and on home; hide for dialogs/maps and paid owners. Test safe areas, keyboard, rotation and no page overflow on actual supported iPhone sizes.
- Keep the optional reward-card offer: an earned native callback persists a receipt before returning to JavaScript; the existing atomic wallet/receipt ledger credits extra 2x base solve coins, giving 3x total. Dismissal/failure must not grant coins; recovery must not double-credit.
- Preserve age eligibility and obtain applicable ad consent before requests. Assess the selected SDK configuration for Apple's tracking definition. Request ATT only where needed; denial cannot block gameplay or the optional reward. Complete privacy manifests and App Store privacy declarations from actual behavior.

### 3. Apple purchase verification

- Implement StoreKit purchase, localized pricing, pending/cancel outcomes, restore, verified transaction updates and revocation handling for `remove_banner_ads`.
- Establish an Apple-specific verified entitlement path. Do not send Apple transactions to `/api/play-purchase`, accept unverified transaction payloads, or allow localStorage to grant ownership. Decide and document the final StoreKit/server verification boundary before implementation.
- Test in Apple's sandbox/TestFlight with purchase, cancellation, pending state, restore after reinstall, refund/revocation and offline behavior. Android purchases do not automatically restore on iOS because this game has no cross-platform account entitlement system.

### 4. Signed TestFlight and App Store release

- Configure distribution signing and protected upload credentials after Apple enrollment; register the bundle ID and App Store Connect record.
- Build/archive/export on macOS and upload to TestFlight. Check installation on an iPhone, not just simulator compilation. External beta testing can require Apple's beta review.
- Prepare actual iPhone screenshots, icon, descriptions, privacy/support URLs, age/content questionnaire and review notes. Publish privacy/app-ads.txt updates and finish AdMob store association/verification.
- Resolve test feedback and submit the public release only when native functionality, purchases, privacy and listing are verified. There is no claimed TestFlight or App Store approval, fixed launch date, or completed iOS port at this preparation stage.

## Acceptance evidence required

- macOS build logs for the exact reviewed commit and dependency versions.
- Device evidence for gameplay, layouts, lifecycle/music, multiplayer, sample ads, one-time 3x delivery and purchase restoration.
- No secrets, native source, drafts or private spreadsheets in bundled web assets.
- Signed export and TestFlight processing success, followed separately by device acceptance and App Review outcome.
- `GAME_KNOWLEDGE.md` updated at every implementation stage, with unverified work described honestly.

## References checked September 16, 2026

- Apple enrollment: https://developer.apple.com/programs/enroll/
- Capacitor iOS: https://capacitorjs.com/docs/ios
- TestFlight: https://developer.apple.com/testflight/
- iOS AdMob: https://developers.google.com/admob/ios/quick-start
- App Store Connect API access: https://developer.apple.com/help/app-store-connect/get-started/app-store-connect-api
- GitHub Actions billing: https://docs.github.com/en/billing/concepts/product-billing/github-actions
