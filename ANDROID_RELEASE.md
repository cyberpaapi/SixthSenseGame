# Sixth Sense Android release

Play Console developer: **AlphaCodeAI**; existing in-app publisher copy: **Sensei**. Support: **aryanchandwani@gmail.com**. Audience: **13+**.

September 16 account setup: the owner reports Play Console verification complete (`silversabre9@gmail.com`) and an AdMob account created (`aryanchandwani@gmail.com`). The following public identifiers are saved in the local, git-ignored `android/release.properties`; debug continues using Google sample IDs. Production ad serving has not been tested or approved by this configuration change.

| Release setting | Supplied value |
| --- | --- |
| `admobAppId` | `ca-app-pub-2917215510689928~6202702379` |
| `bannerAdId` | `ca-app-pub-2917215510689928/9942249790` |
| `rewardedAdId` | `ca-app-pub-2917215510689928/3865769915` |

All three AdMob IDs are now supplied. The rewarded unit is reused for clearly labelled rewards: 3× solve coins on the victory card, or one extra try on Last Chance. Each is granted only after the earned-reward callback. Local `releaseChannel=internal` builds use Google sample ads while retaining release optimization and upload signing. `releaseChecklistApproved=false` blocks production builds, not signed internal-test builds. Gradle cannot control which Play track receives a file: upload this internal build only to testing and rebuild for production after acceptance.

Music update (`20260916.1`): **Tea and Tangrams** now loops the original 0:00–1:28 section, replacing the earlier 102-second edit. It keeps position through mute/app pauses and ducks for result sounds. Browser playback/loop/lifecycle checks pass for the 88-second asset; Android local-media playback was previously checked on September 10. Source and processing details are in `AUDIO_BRIEF.md`. The original download is preserved.

The Android source is in `android/`, built with Capacitor 8, Java 21 and target/compile SDK 36. Package ID: `com.sensei.sixthsense` (check availability before the first Play upload; the uploaded package ID cannot later be changed). Solo gameplay, artwork, sound effects and fonts are bundled. Multiplayer uses the existing Vercel/Neon authority over HTTPS. No Cloudflare integration is required. A custom domain/Cloudflare DNS is optional; do not migrate the working room service just to package Android.

## Current update — version 1.0.2 (versionCode 3)

September 21: latest web client synchronized with the reviewed teen-content cleanup (81 answers removed; 62 clues rewritten; 10,106 answers remain), movie/character Bollywood modes, global usernames, current lifeline prices, economy generation 10, 88-second music loop and immersive display. The age question is neutral and does not advertise under-13 ad exemptions. The age/privacy behavior is retained.

`npm test`, Bollywood server suites, safety check, Android sync, debug APK/AAB assembly and lint passed. Packaged answer-bank equality and age-prompt text were checked in both archives. No full browser rerun or physical-device acceptance for this build. Artifacts:

- `release/SixthSense-v1.0.2-debug.apk`: 36,653,316 bytes; SHA-256 `7b26aa48de2c9c16a368e0de314dd5ac2383e37a9590a6300cdeaf0958143fe9`.
- `release/SixthSense-v1.0.2-debug-NOT-FOR-PLAY.aab`: 35,358,678 bytes; SHA-256 `2721b7e601194f8f12ac9d6b9823777672226922cb16980f179f853ae3c54ba9`.

These are debug-signed QA artifacts, **not Play-uploadable releases**. The existing upload-key-signed `android/app/release/app-release.aab` is still version 1. Generate a new **release** App Bundle in Studio using the existing upload key and private passwords; version 3 is configured and synced. `android/keystore.properties` is absent, and no signing passwords were extracted or fabricated.

The corresponding web/backend commit `bafcf58` deployed successfully to Vercel and GitHub Pages on September 21. Both public bank/app files match the cleaned source. Existing old rooms may retain removed answer words until their 24-hour expiry.

### Play Console and tester group

Alpha is configured for India and `sixthsense-alphacode-testers@googlegroups.com`. Share https://groups.google.com/g/sixthsense-alphacode-testers so testers can join themselves. The draft `1.0.0 - Closed Alpha` contains the old version 1 bundle. Replace it with the signed version 3 before review. The future opt-in URL is https://play.google.com/apps/testing/com.sensei.sixthsense ; it is not currently an active installation path.

Privacy URL, Ads=Yes, no government/financial/health features, Word category and support contact were saved; dashboard showed 6/11 completed. IARC terms were explicitly approved by the owner; the revised questionnaire/summary for the cleaned release is saved to Publishing overview, pending review. Preview: IARC Generic 3+, ESRB Everyone 10+, PEGI 3; other regions differ. Textual violence and rare medical/alcohol/tobacco references are declared, plus digital purchases with no random paid items. Gambling imagery/activity and native communication features are absent. Short/full listing copy for version 1.0.2 is saved as a draft. Sign-in details, target audience (intended 13+), Data safety and listing graphics remain. No closed release was submitted, and zero closed testers were opted in. Internal testers must leave the internal test before enrolling in the closed test. No 14-day clock has started.

## Previous update — version 1.0.1 (versionCode 2)

Includes GitHub dark-tile fix f799897, six standard tries plus one Last Chance, 125-coin pricing, round coin rendering, rewarded extra-try receipts, neutral age-screen wording and immersive Android display. The neutral age question remains to configure teen privacy protections; the under-13 ad-exemption message was removed. UMP and eligibility protections remain. Existing saved guesses and already-purchased extra attempts are retained.

The September 17 debug APK also includes darker dark-theme backgrounds and runtime 20260917.1, with the correct 88-second Tea and Tangrams loop. `release/SixthSense-v1.0.1-debug.apk` (also copied to `release/SixthSense-debug.apk`) is 36,289,797 bytes, SHA-256 `B03DDD551EF61095EB0E02F387DE32C0F6DCE7A2E852DE24DA80AC141ACBDDB7`; Android sync, assembly and lint passed. The debug APK is for device QA. **The existing signed app-release.aab is still versionCode 1 and does not contain this update.** Regenerate a signed internal bundle using the existing upload key, then upload versionCode 2 to the testing track. Android Studio was closed during this update; no signing credentials were extracted or recreated.

The matching multiplayer backend/client was deployed to Vercel on September 17. New server snapshots advertise the six-try limit and reward capability; clients retain compatibility with legacy seven-try servers. Existing rooms keep their original seven-try contract via the migrated max_guesses column; newly created rooms use six. Extra tries remain server-authorized, with native earned callbacks and room/round/batch-scoped retries. There is still no AdMob SSV or tamper-proof wallet. The public privacy page and purchase endpoint are deployed; purchase readiness correctly returns unavailable until Play server credentials are configured.

## Implemented

- Anchored adaptive banner on home and below the lifelines in solo/multiplayer games, with reserved native space and an 8 dp separator. Banners hide during maps and dialogs. Native boards resize to the available WebView height; keys/lifeline buttons stay 44 px high. Landscape uses side-by-side board and controls.
- Optional reward-card ad: a 100-coin solve earns 200 additional coins after Google's earned-reward callback, for 300 solve coins total. Points, trio and streak bonuses do not multiply. The wallet still caps at 99,999. Losses, skips, Adventure replays and duplicate claims cannot claim this offer. Declining/closing an unfinished ad leaves the original reward intact.
- Native durable pending reward receipt plus an atomic wallet/receipt ledger; interrupted delivery recovers on next launch. This is device-local virtual currency, not an account-backed or tamper-proof economy. No paid coins, transfer or cash redemption is offered. AdMob server-side verification is not implemented; reward completion uses Google's native earned-reward callback.
- Non-consumable Google Play product `remove_banner_ads`: one-time banner removal, localized Play price, pending/cancel/error handling, restore and foreground recheck. Optional rewarded ads remain. Native ownership comes from a server-verified Play purchase, never a JavaScript/localStorage purchase flag. A previously verified benefit has seven days of offline grace; a successful Play query or verification revokes an inactive purchase earlier. No subscription.
- UMP consent before requesting ads, privacy-options entry when required, locally saved age group, under-age-of-consent settings for under-18s, no ad/billing initialization for under-13 selections, PG maximum ad content rating. No DOB is collected.
- Native Back integration, pause/resume audio handling, immersive fullscreen with swipe-reveal system bars, camera-safe header controls and keyboard insets, offline privacy policy and Sensei support link.
- Google sample ad IDs in debug and internal-test releases. Production uses the supplied real IDs and requires checklist approval. Both release channels validate configured IDs/HTTPS and require signing; Android Studio wizard signing or local keystore properties are supported.

## Build and test

September 16 internal bundle: Android Studio's signed `:app:bundleRelease` retry succeeded, including R8 optimization and release lint. Output: `android/app/release/app-release.aab` (32,608,151 bytes), SHA-256 `1f179802e60b1669b280c68c60b3207295d8c987c7667329514813873617ffed`. Jarsigner verified the signature and the certificate is not Android Debug. The user's wizard supplied signing without exporting passwords into a properties file. This sample-ad bundle is for Play testing only; no store upload, Play approval or minified-build device acceptance is claimed.

Guard verification: reproduced the old checklist failure with internal mode and Studio-style signing inputs, then verified that configuration passes after the fix. Production with an incomplete checklist, internal without signing, and an unknown release channel each fail with the appropriate error. Generated release BuildConfig/manifest use Google sample ad IDs. Debug assembly and lint also pass. Existing Gradle deprecation/flatDir warnings remain; they did not cause the failure. Gradle 9 migration is not part of this fix.

### Open in Android Studio on this PC

Use File > Open and select `C:\Users\Aryan\Downloads\SixthSense\android`. In the Windows file picker, enter that full path in **File name**, press Enter to navigate into it, then click **Select Folder**. The breadcrumb must show Downloads > SixthSense > android; `C:\Users\Aryan` and `C:\Users\Aryan\.android` are not the game project.

If Studio says Gradle 8.14.3 is incompatible with JVM 25, choose **Use JVM 21**. This PC has `C:\Program Files\Zulu\zulu-21` installed. Wait for Gradle sync before using Build > Generate Signed App Bundle or APK. Importing the project does not satisfy the signing and release checklist below.

September 16 Studio verification: imported the correct folder, selected Java 21, completed Gradle sync, and ran Build > Assemble 'app' Run Configuration successfully (91 actionable tasks). The signed App Bundle wizard opens with module `android.app`; upload key setup and release validation remain incomplete. Studio still displayed an Android 36 compile-target notification despite the installed platform and successful Gradle assembly; IDE SDK recognition has not been independently repaired.

In PowerShell with script execution disabled, use `npm.cmd` in place of `npm`; this avoids the blocked `npm.ps1` launcher without changing execution policy.

```powershell
npm ci
npm run android:sync
npm run android:open
# Or, from the android directory with Java 21 and an Android SDK configured:
.\gradlew.bat :app:assembleDebug :app:lintDebug
```

The debug APK is `android/app/build/outputs/apk/debug/app-debug.apk`. It is for direct testing, not a Play upload. For Play internal testing, set `releaseChannel=internal` in ignored `android/release.properties`, then use Android Studio's signed App Bundle wizard with the upload key. No separate `keystore.properties` is required when the wizard supplies signing. CLI builds need that ignored file. Missing signing or an invalid channel fails validation. An omitted channel defaults to production. `-PreleaseChannel=production` overrides the local setting and requires `releaseChecklistApproved=true`; do not set approval until the production checks pass. Rebuild for production with real ads rather than promoting the sample-ad internal bundle. Run `npm.cmd run android:sync` after every web-client/asset change before building. The generator allow-lists public client files rather than copying the repository or backend credentials.

Browser checks: set `CHROME_BIN` to installed Chrome and `SIXTH_SENSE_URL` to the local HTTP server, then run `npm test`, `npm run test:browser`, `npm run test:engagement`, and `npm run test:mobile`. Browser mobile checks use an explicit test-only native bridge; they do not prove real ad delivery or Play purchases.

Verified locally September 10, 2026: debug APK compilation, Android lint, Node/game/purchase-server tests, full browser/engagement tests and mobile bridge tests pass; npm audit reports zero vulnerabilities. The isolated Pixel 6/API 36 emulator installed and launched the APK, displayed a Google sample banner, and completed a real Google sample rewarded ad: 120 solve coins + 240 bonus = 360, with points unchanged. Offline process restart preserved the wallet without repeating the credit, and Android Back opened the leave confirmation. This verifies sample ad delivery, not production AdMob approval or a real Play payment. Physical-device checks, the full UMP/Play purchase matrix, and process death during an unacknowledged reward remain outstanding. Debug-only WebView inspection is enabled for QA. The APK contains no native `.so` libraries; include final 16 KB compatibility review in release testing.

## Account configuration that remains

The September 10 below-lifelines update (`20260910.2`) also passes reserved-space portrait/landscape layout checks for solo, VS, Race and Co-op. Solo seven/eight-row boards, dialog hiding, paid banner removal and 44 px-high controls are covered. The Pixel 6/API 36 emulator displayed Google's sample banner below the actual lifelines with no overlap. Run `node test-banner-layout.js` alongside the browser checks after future layout changes. This does not replace live multiplayer or physical-device release testing.

1. **Play Console:** create/check the Sixth Sense listing under Sensei, confirm package ID, choose Word game category, complete content rating and the 13–15, 16–17 and 18+ audience declarations accurately. Set Ads = Yes, including after optional banner removal. Complete Data safety from actual SDK/backend behavior, not just the visible UI.
2. **AdMob:** app, banner and rewarded IDs have been supplied and configured locally (table above). Configure Privacy & messaging (UMP) and finish app/store verification. Reward settings: amount `1`, item `Triple coin boost`, matching the variable in-game 3× total solve-coin offer. Keep test devices configured during validation; never tap your own live ads.
3. **Developer website:** publish `privacy.html` on the existing Vercel site and link it in Play. Add the exact AdMob-provided `app-ads.txt` line at the root of the developer website used in the listing and request AdMob verification. Do not publish the example publisher ID. Cloudflare is optional for a custom domain.
4. **Paid product:** create and activate the one-time, non-consumable product `remove_banner_ads` in Play Console, select a price/countries and an appropriate purchase option. The app displays the localized Play price. Description: “Remove banner ads permanently. Optional ads for extra rewards remain available.”
5. **Server verification:** enable Android Publisher API in your Google Cloud project, create a least-privilege service account and grant it the required Play app permissions to read purchases and acknowledge orders. Configure Vercel server environment values below. Deploy `/api/play-purchase` and test it on a Play testing track before allowing live purchases. Never put a service-account JSON file/private key into the APK, `www`, public assets or git.
6. **Signing:** create an upload key through Android Studio, enroll in Play App Signing, store the upload key and passwords securely and back them up. The signing wizard supplies the key directly; for CLI builds, copy `android/keystore.properties.example` to ignored `keystore.properties` and fill it locally. Never send passwords in chat.
7. The local ignored `android/release.properties` contains all three supplied AdMob IDs and `releaseChannel=internal`. Verify the HTTPS purchase URL. After acceptance, set `releaseChannel=production` and `releaseChecklistApproved=true`, then build a new bundle with a higher versionCode for Play. For a fresh checkout, copy the example and restore the public IDs above. This is a developer build safeguard, not Google approval.

Vercel-only environment:

| Name | Value |
| --- | --- |
| `DATABASE_URL` | Existing Neon connection, kept server-side |
| `ANDROID_PACKAGE_NAME` | `com.sensei.sixthsense` after confirming it |
| `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON` | Service-account JSON, set securely in Vercel, never in client files |

The verification service stores the hash of a purchase token, product, owned state and last verification time. It verifies with Google's fixed package/product endpoint and acknowledges only a purchased, unconsumed non-consumable. Acknowledgement is idempotent. Play queries on launch/restore handle pending purchases, reinstall and refunds; a server outage cannot create a paid entitlement. Real-time developer notifications are not configured, so revocations are detected on subsequent checks, subject to offline grace.

Checkout requires the verification endpoint to return `{ "available": true }` before opening Play payment. Readiness checks whether required server environment variables exist; it does not prove service-account permissions. Requests are rate limited to 15 per minute using keyed connection buckets in Neon, removed on subsequent requests after one day. Android backups/device transfer exclude local progress and receipts; Play restore restores the banner-removal purchase, not the game wallet.

## Release acceptance checklist

- [ ] Real Android device/emulator: cold start, offline solo game, all nine modes, rotation, system Back, app backgrounding, process restart, notch/gesture navigation, dark mode, TalkBack, reduced motion, low storage and poor connectivity.
- [ ] Native banners load only in intended home and below-lifelines placements, never over navigation/keyboard; paid owners retain removal after restart and restore.
- [ ] Native test rewarded ads: earn once, close early, failed load/show, no fill, repeated tap, app death after earned callback, receipt recovery, full wallet, Daily reopen, and unchanged bonus/point accounting.
- [ ] UMP: EEA/UK/Switzerland test geography, consent accept/decline, privacy choices re-open, minors' request flags, missing/offline consent response. Review target-audience declarations against actual marketing and artwork.
- [ ] Play license testers: successful purchase, pending payment, cancellation, already owned, restore after reinstall, refund/revocation and temporarily unavailable verification server. Confirm server acknowledgement in Play within Google's deadline.
- [ ] Backend and privacy page deployed; app-ads.txt verified; service-account permissions tested; signing/upload key backed up.
- [ ] Store graphics, phone screenshots, feature graphic, short/full descriptions and contact links completed. Party sprite replacements remain pending creative work; current runtime still uses the earlier CSS party accessories. Tea and Tangrams is now bundled as the background music; retain its source/export and commercial-use rights record with the release paperwork.
- [ ] Signed AAB, target API 36, increasing versionCode, Play pre-launch report, SDK/Data safety disclosures, 16 KB page-size compatibility check and policy review pass.
- [ ] If the Play account is a qualifying new personal account, complete the required closed test (currently at least 12 opted-in testers for 14 continuous days) and apply for production access. Google controls review/approval; building the app does not bypass this.

## Store copy draft

Name: **Sixth Sense**

Short description: **Find the six-letter word. Follow the clues. Trust your Sixth Sense.**

Full description: Solve original six-letter word puzzles in six tries, with one optional Last Chance. Read the feedback, use clues when you need them and grow your word-solving skills. Explore Daily, Adventure, Practice, Time Tackle, Insight and Streak, or invite friends into private Race, VS and Co-op rooms. Choose a playful animal avatar and earn coins through play. Solo puzzles work offline; multiplayer and ads require a connection. Optional reward ads can triple your puzzle-solve coins. A one-time purchase removes banner ads while keeping optional rewarded ads available. Designed for players ages 13 and up.

## Official references checked September 10, 2026

- [Target API requirements](https://support.google.com/googleplay/android-developer/answer/11926878): new submissions now require API 36.
- [Capacitor Android](https://capacitorjs.com/docs/android)
- [AdMob SDK setup](https://developers.google.com/admob/android/quick-start), [rewarded ads](https://developers.google.com/admob/android/rewarded), [UMP](https://developers.google.com/admob/android/privacy)
- [Play Billing integration](https://developer.android.com/google/play/billing/integrate), [purchase verification and acknowledgement](https://developer.android.com/google/play/billing/security)
- [AdMob app verification](https://support.google.com/admob/answer/14538460)
- [AdMob Data safety disclosure](https://developers.google.com/admob/android/privacy/play-data-disclosure), [Android 16 KB page sizes](https://developer.android.com/guide/practices/page-sizes)
- [Personal-account testing requirements](https://support.google.com/googleplay/android-developer/answer/14151465)
