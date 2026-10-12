# Sixth Sense iOS release

Updated October 12, 2026. Implementation is on `codex/ios-app`; the native app compiled on GitHub's macOS runner with Xcode 26.3 (run 38221491911). Simulator UI acceptance and physical-device acceptance are pending. The owner has an iPhone and has not yet enrolled in the Apple Developer Program. No signed IPA, TestFlight upload or App Store approval is claimed.

## Implemented source

- Capacitor 8.5.1, iPhone/iOS 15+, bundled offline client and original selected-fox 1024px icon. Existing Vercel/Neon multiplayer and all game rules remain shared.
- Local Swift package `native/sensei-ios`: native banner below the WebView, UMP before ad requests, age eligibility, contextual ad requests without ATT/IDFA permission, sample iOS ad IDs for testing, optional earned-only 3x rewards and Last Chance, durable receipts, whole-match and every-third-new-Adventure interstitial cadence. Missing automatic ads never delay results.
- StoreKit 2: six approved products, localized Apple prices, cancellation/pending handling, verified current permanent entitlements, transaction updates and restore. No Android purchase cross-restore. Supplies are installation-local, not a cloud wallet.
- `/api/apple-store`: Apple's official signature verifier plus a fresh App Store Server API transaction lookup, separate Production/Sandbox validation, product/type/quantity/revocation checks, appAccountToken installation binding, hashed transaction IDs and idempotent Neon supply grants. Native finishes transactions after durable client delivery. Complete Pack supplies are one-time on the original installation; ad removal restores separately.
- GitHub `iOS build and TestFlight`: unsigned macOS simulator build without credentials, plus a manual signed upload job restricted to main and the `ios-release` environment. Signing files live only on the ephemeral runner and are removed even after failure. Build artifacts exclude credentials.

## What the owner needs to do

1. Enroll at https://developer.apple.com/programs/enroll/ . An individual account displays the legal seller name. To display a company as seller, enroll the eligible legal entity as an organization (including Apple's D-U-N-S and authority requirements). Do not send account passwords here.
2. After activation, register `com.sensei.sixthsense`, create its App Store Connect record and share the public Team ID and numeric Apple app ID. Confirm the iPhone model/iOS version for final testing.
3. Complete Apple's paid-app agreement, banking and tax setup privately. Create the six products below. Choose India as the base storefront and use Apple's regional price equalization, reviewing local price points/taxes before saving.
4. Create a separate iOS app in the existing AdMob account and its banner, rewarded and interstitial units. Android IDs cannot be reused. Configure UMP privacy messages and app verification. Send only the public IDs.
5. Install the first signed beta through TestFlight and complete the device checklist below. Public App Review follows separately.

## Catalog

| Product ID | Apple type | India target | Contents |
|---|---|---:|---|
| remove_banner_ads | Non-consumable | INR 799 | Permanent banner/automatic-ad removal; optional rewarded ads remain |
| coins_500 | Consumable | INR 99 | 500 coins |
| coins_1500 | Consumable | INR 249 | 1,500 coins |
| coins_3500 | Consumable | INR 499 | 3,500 coins |
| lifeline_kit | Consumable | INR 149 | 5 Sense, 3 Peek, 3 Clear |
| complete_pack | Non-consumable | INR 999 | Permanent ad removal plus 1,500 coins, 10 Sense, 5 Peek, 5 Clear once |

Apple's available price points may differ from exact INR targets. The app always displays `Product.displayPrice`; it never hardcodes a converted charge. Existing Remove Ads ownership does not discount Complete Pack. No subscription or family sharing is configured.

## Cloud setup after enrollment

GitHub environment `ios-release` is created and restricted to the `main` branch, with `IOS_RELEASE_APPROVED=false`. Configure the missing signing inputs through GitHub's secret UI, never chat or tracked files. Add owner review if desired before the first production upload.

Environment variables:
- `APPLE_TEAM_ID`
- `IOS_ADMOB_APP_ID`, `IOS_BANNER_AD_ID`, `IOS_REWARDED_AD_ID`, `IOS_INTERSTITIAL_AD_ID`
- `IOS_RELEASE_APPROVED=true` only after real purchase/ad/privacy/device acceptance. Testing builds use sample IDs regardless.

Environment secrets:
- `APPLE_CERTIFICATE_BASE64`: base64 Apple Distribution certificate including private key (.p12).
- `APPLE_CERTIFICATE_PASSWORD`: .p12 password.
- `APPLE_PROFILE_BASE64`: base64 App Store distribution provisioning profile for this bundle/team.
- `APP_STORE_CONNECT_KEY_ID`, `APP_STORE_CONNECT_ISSUER_ID`, `APP_STORE_CONNECT_PRIVATE_KEY`: appropriate App Store Connect upload API credentials (.p8).

The upload API key does not replace the distribution certificate/private key. The distribution key can be generated using a CSR from this PC; no Mac purchase is necessary. Obtain its issued certificate/profile from Apple after membership activates. Do not create a new Android upload key.

Backend-only Vercel configuration:
- `APPLE_APP_ID`: numeric App Store Connect app ID.
- `APPLE_IAP_KEY_ID`, `APPLE_IAP_ISSUER_ID`, `APPLE_IAP_PRIVATE_KEY`: Apple's In-App Purchase API key with transaction-read access.
- Existing `DATABASE_URL`.

Deploy the endpoint and verify GET readiness; readiness checks environment presence, not actual Apple permissions. Native purchase buttons stay unavailable while readiness fails. Sandbox transactions still require Apple-signed receipts; Xcode unsigned local StoreKit transactions cannot grant supplies through the production service.

Run workflow manually on main, select `upload_testflight=true`, initially `channel=testing`. Build number uses the workflow run number. A successful upload still needs App Store Connect processing and possibly external beta review. Do not submit a sample-ad beta binary as the final public release.

## Local preparation on Windows

```powershell
npm.cmd ci
npm.cmd test
npm.cmd run test:apple-store
npm.cmd run ios:sync
python scripts/configure-ios.py
```

`ios:sync` preserves the local Swift package. Xcode compilation runs on macOS. The standard public-repository runner is used, with bounded jobs and seven-day simulator artifact retention; no paid larger runner is selected.

## Acceptance before production

- Compile the exact commit on macOS; inspect the selected fox icon and real simulator screenshots.
- Test iPhone launch/onboarding, notch/home indicator, portrait/landscape, six/seven-row boards, lifelines, keyboard single taps, music background/resume and all multiplayer variants against the real authority.
- Exercise UMP regional states, minor/ad eligibility, sample banner space, reward cancel/fail/earn/restart, no duplicate grant, ad away-alert suppression, interstitial cadence and paid ad removal.
- Sandbox purchase each product; cancel, pending approval, restore, revoke/refund, offline/reconnect, storage failure, full wallet, interrupted delivery and reinstall. Check one-time Complete Pack supplies and cross-device permanent restore.
- Confirm current SDK privacy manifests, actual data collection and App Store privacy answers. No ATT prompt means no authorized cross-app tracking; keep contextual requests and review AdMob settings accordingly. Add required SKAdNetwork buyer IDs if enabling additional demand.
- Review content rating from actual word clues/Bollywood references, rights to supplied music and generated art, privacy/support URLs and an in-app account deletion route acceptable to App Review. Current email-based username deletion needs Apple review assessment.
- Supply actual iPhone store screenshots with no ad creative; Android captures must not be represented as iOS captures.
- Configure public app-ads.txt/store association, then real iOS IDs and production release approval. Complete public App Review separately.

## Known limitations

No server-side ad reward verification, cloud wallet, cross-platform purchases, App Store server-notification ingestion or automatic clawback of refunded consumed supplies. StoreKit verified current entitlements handles permanent revocation when it receives updated Apple state; offline cached StoreKit state can lag. Paid supply records remain installation-bound; clearing data/reinstall can lose supplies. No physical iPhone or real sandbox purchase has been tested yet.

## References

- https://capacitorjs.com/docs/ios
- https://developers.google.com/admob/ios/quick-start
- https://developers.google.com/admob/ios/privacy
- https://github.com/apple/app-store-server-library-node
- https://developer.apple.com/programs/enroll/
- https://docs.github.com/en/actions/how-tos/deploy/deploy-to-third-party-platforms/sign-xcode-applications
