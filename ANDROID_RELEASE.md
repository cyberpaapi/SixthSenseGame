# Sixth Sense Android release

Play Console developer: **AlphaCodeAI**; existing in-app publisher copy: **Sensei**. Support: **aryanchandwani@gmail.com**. Audience: **13+**.

September 16 account setup: the owner reports Play Console verification complete (`silversabre9@gmail.com`) and an AdMob account created (`aryanchandwani@gmail.com`). The following public identifiers are saved in the local, git-ignored `android/release.properties`; debug continues using Google sample IDs. Production ad serving has not been tested or approved by this configuration change.

| Release setting | Supplied value |
| --- | --- |
| `admobAppId` | `ca-app-pub-2917215510689928~6202702379` |
| `bannerAdId` | `ca-app-pub-2917215510689928/9942249790` |
| `rewardedAdId` | `ca-app-pub-2917215510689928/3865769915` |
| `interstitialAdId` | `ca-app-pub-2917215510689928/3575067827` |

All four public IDs are configured. The interstitial was created October 14 in the existing AdMob app. AdMob still requires store linking and app review; real serving is unverified. The rewarded unit is reused for clearly labelled rewards: 3× solve coins on the victory card, or one extra try on Last Chance. Each is granted only after the earned-reward callback. `releaseChannel=internal` builds use Google sample ads while retaining release optimization and upload signing. `releaseChecklistApproved=false` blocks production builds, not signed internal-test builds. Gradle cannot control which Play track receives a file: upload this internal build only to testing and rebuild for production after acceptance.

Music update (`20260916.1`): **Tea and Tangrams** now loops the original 0:00–1:28 section, replacing the earlier 102-second edit. It keeps position through mute/app pauses and ducks for result sounds. Browser playback/loop/lifecycle checks pass for the 88-second asset; Android local-media playback was previously checked on September 10. Source and processing details are in `AUDIO_BRIEF.md`. The original download is preserved.

The Android source is in `android/`, built with Capacitor 8, Java 21 and target/compile SDK 36. Package ID: `com.sensei.sixthsense` (check availability before the first Play upload; the uploaded package ID cannot later be changed). Solo gameplay, artwork, sound effects and fonts are bundled. Multiplayer uses the existing Vercel/Neon authority over HTTPS. No Cloudflare integration is required. A custom domain/Cloudflare DNS is optional; do not migrate the working room service just to package Android.

## Current source — version 1.0.4 (versionCode 5)

October 14: production access is granted. The production draft is saved as **1.0.4 - Bollywood Solo**, with launch notes but no uploaded bundle. Current country targeting is 178 regions including India; this was observed, not changed. The updated default en-US description is saved but not sent for review; exact full copy is in `store-assets/play-description-en-US.txt`.

Bollywood Solo adds offline play from the approved 125 movies/characters, variable 5–7-letter boards, ordinary rewards/trio/mastery, Sense 75, Peek 50, Clear 40, Skip 60, and six tries plus optional Last Chance. It saves unfinished play and offers Next word after results.

**Owner launch decision: free game first; activate purchases later.** Release builds default to `purchasesEnabled=false`, which hides product offers and blocks new native checkout while retaining restoration for existing ownership. Debug retains purchase QA. Merchant profile, six-product setup, service credentials and real license transactions are deferred until a later update; they do not block a free launch. Keep purchase promotion out of the published description.

Real AdMob app/banner/reward/interstitial IDs are configured in ignored `release.properties` with `releaseChannel=production`; `releaseChecklistApproved=false` remains until native release acceptance. AdMob reports Requires review and cannot yet find the public listing by package. Link after publication, verify the developer-site app-ads.txt and consent configuration, and complete AdMob review. Creating an ID is not proof of live serving.

Verified: core/identity/content, full browser, mobile/onboarding, Bollywood Solo/catalog/server and Last Chance suites; Android sync, debug assembly/lint/JUnit. A genuine 390×844 seven-letter Solo capture was visually inspected. Test artifact: `release/SixthSense-v1.0.4-bollywood-solo-debug.apk`, SHA-256 `7937bc2416019248b62bbfb9ee1bb5c139bc489363b03ce0f2b586b36b92f6cb`. This sample-ad, debug-signed APK is not uploadable to Play. No physical device is connected at this checkpoint.

Production signing still requires the existing upload key; do not create a replacement. Studio previously used privately saved credentials. There is no CLI keystore configuration. Complete native release acceptance, approve the launch checklist, then use Build > Generate Signed App Bundle or APK > Android App Bundle > existing upload key > release. Upload the resulting code-5 AAB to the saved production draft, review the pre-launch report and submit the listing and release together. No signed production artifact or submission is claimed here.

## Submitted closed Alpha — version 1.0.2 (versionCode 3)

September 21: latest web client synchronized with the reviewed teen-content cleanup (81 answers removed; 62 clues rewritten; 10,106 answers remain), movie/character Bollywood modes, global usernames, current lifeline prices, economy generation 10, 88-second music loop and immersive display. The age question is neutral and does not advertise under-13 ad exemptions. The age/privacy behavior is retained.

`npm test`, Bollywood server suites, safety check, Android sync, debug APK/AAB assembly and lint passed. Packaged answer-bank equality and age-prompt text were checked in both archives. No full browser rerun or physical-device acceptance for this build. Artifacts:

- `release/SixthSense-v1.0.2-debug.apk`: 36,653,316 bytes; SHA-256 `7b26aa48de2c9c16a368e0de314dd5ac2383e37a9590a6300cdeaf0958143fe9`.
- `release/SixthSense-v1.0.2-debug-NOT-FOR-PLAY.aab`: 35,358,678 bytes; SHA-256 `2721b7e601194f8f12ac9d6b9823777672226922cb16980f179f853ae3c54ba9`.

These debug-signed QA artifacts are **not Play-uploadable releases**.

The signed release was subsequently generated in Android Studio on September 21 using the existing saved upload key:

- **Upload file:** `release/SixthSense-v1.0.2-closed-test.aab` (identical to `android/app/release/app-release.aab`).
- Version 1.0.2 / code 3; 33,032,313 bytes; SHA-256 `9914768d0f42f899d870ecd1301d9c86658b5d4a0df0206f1006d11646cb022a`.
- Studio: BUILD SUCCESSFUL in 27s, 150 tasks (47 executed, 103 up-to-date). Jarsigner verified the archive and its non-debug certificate matches the original uploaded version-1 bundle. It emitted self-signed/no-timestamp and ZIP stream-order warnings; Play subsequently accepted the signed version 3 upload.
- ZIP integrity, packaged source equality (answer bank, app, multiplayer, music), neutral age prompt and exclusion of signing/server-only configuration passed. Release manifest is code 3 and the archive contains version 1.0.2 and the Google sample AdMob app ID.

This signed bundle is for internal/closed testing, with sample ads. It has **been accepted by Play and submitted for closed Alpha review on September 22**. `android/keystore.properties` remains absent; Studio used its saved passwords without extracting them.

The corresponding web/backend commit `bafcf58` deployed successfully to Vercel and GitHub Pages on September 21. Both public bank/app files match the cleaned source. Existing old rooms may retain removed answer words until their 24-hour expiry.

### Play Console and tester group

September 24 follow-up: Alpha is active and available to selected testers, India is targeted and the expected Google Group is selected. Enrolled the owner account using the official web opt-in and followed its download link: the page says You are a tester and the correct Play listing shows an enabled Install button. No device installation was performed; the owner remains enrolled. Refreshed Group membership is two including the owner, with no pending members. Other testers' Item not found reports are still under diagnosis. The owner confirms matching accounts and an affected OnePlus 13 on latest Android. After explicitly authorized acceptance of Device catalog Terms of Service, verified OnePlus 13 OP5D55L1 is supported in all active release tracks, including India variant CPH2649 on Android 16. No exclusion rules changed. Follow-up after the owner privately signed into the affected account: directly reproduced You are a tester on its opt-in page followed by Not found from both the generated download link and canonical Store URL. Its Play storefront shows India and its device library contains OnePlus CPH2649. The account is absent from the current internal tester list. With explicit owner authorization, submitted the Google Play support report under App releases > App publishing > Other, stating multiple testers are affected and distinguishing the directly reproduced account from other reports. After the automated suggestion, selected No, create support ticket. Console confirmed Ticket submitted and a Pending App publishing case, with Case ID pending; replies are sent by email. The acknowledgement displays a response window of up to 15 days. The automated suggestion mentions membership propagation up to 24 hours, but this is not a verified root cause or a guaranteed resolution deadline. No tester was opted out, and no release/distribution settings were changed. All affected accounts are in India according to the owner. The earlier dashboard zero-opt-in observation below predates this enrollment; no qualifying testing period is claimed.

September 24 confirmed status: Console reports the app update published September 22, app status Closed testing, and the closed-release publication task complete. The dashboard still shows zero opted-in testers; no qualifying 14-day period is claimed. The Group's member-only visibility was found to conflict with its public self-join setting and was changed to Anyone on the web. Google confirmed the save and warned it may take time to propagate. Conversations/member-list privacy remains unchanged; independent nonmember joining/installing has not yet been verified. The September 22 submission checkpoint below is historical and superseded by this publication status.

September 22: Alpha is configured for India and `sixthsense-alphacode-testers@googlegroups.com`. Share https://groups.google.com/g/sixthsense-alphacode-testers so testers can join themselves, then https://play.google.com/apps/testing/com.sensei.sixthsense to opt in and install once approved/available. Use the same Google account throughout. Existing internal testers must leave the internal test before enrolling in the closed test.

The selected fox icon, matching feature graphic and three genuine 1080x1920 ad-free screenshots are now uploaded and added to the saved default English listing. Generated icon/feature art is declared with the Console AI labels; the screenshot files are actual unretouched native captures. Existing descriptions remain accurate for code 3. Required listing validation passed; the release preview showed Ready to release, code 3 (1.0.2), target SDK 36 and a 30.6 MB install download.

At the owner's request, all **15 changes were sent for review**, including `1.0.2 - Closed Alpha` full rollout, India, Group testers, listing, content rating, audience, privacy, Ads and Data safety. Publishing overview confirmed **Changes in review** and **15 changes sent for review**, with automated quick checks still running (up to 14 minutes shown). **Managed publishing is off**, so approved changes publish automatically. This is not Google approval or verified closed-test installation. The last dashboard showed zero closed opt-ins; no 14-day clock is claimed.

Previously saved reviewer access, Advertising ID, government/financial/health declarations and Word category/support remain. IARC terms were accepted earlier with explicit owner approval; preview ratings and truthful content declarations are documented in GAME_KNOWLEDGE.md. Public deletion requests use https://sixth-sense-game.vercel.app/delete-account.html . Reviewer credentials remain only in Console. Code 3 uses sample ads and its older launcher; code 4's fox launcher, shop and automatic interstitials need a separate signed update and external activation/acceptance. Merchant profile/catalog setup is not required for this free gameplay closed test and was not changed.

## Previous update — version 1.0.1 (versionCode 2)

Includes GitHub dark-tile fix f799897, six standard tries plus one Last Chance, 125-coin pricing, round coin rendering, rewarded extra-try receipts, neutral age-screen wording and immersive Android display. The neutral age question remains to configure teen privacy protections; the under-13 ad-exemption message was removed. UMP and eligibility protections remain. Existing saved guesses and already-purchased extra attempts are retained.

Historical September 17 status: the debug APK also includes darker dark-theme backgrounds and runtime 20260917.1, with the correct 88-second Tea and Tangrams loop. `release/SixthSense-v1.0.1-debug.apk` (also copied to `release/SixthSense-debug.apk`) is 36,289,797 bytes, SHA-256 `B03DDD551EF61095EB0E02F387DE32C0F6DCE7A2E852DE24DA80AC141ACBDDB7`; Android sync, assembly and lint passed. The debug APK is for device QA. At that time the signed app-release.aab was still versionCode 1. This is superseded by the signed versionCode 3 above; upload that current file. Android Studio was closed during this update; no signing credentials were extracted or recreated.

The matching multiplayer backend/client was deployed to Vercel on September 17. New server snapshots advertise the six-try limit and reward capability; clients retain compatibility with legacy seven-try servers. Existing rooms keep their original seven-try contract via the migrated max_guesses column; newly created rooms use six. Extra tries remain server-authorized, with native earned callbacks and room/round/batch-scoped retries. There is still no AdMob SSV or tamper-proof wallet. The public privacy page and purchase endpoint are deployed; purchase readiness correctly returns unavailable until Play server credentials are configured.

## Implemented

- Anchored adaptive banner on home and below the lifelines in solo/multiplayer games, with reserved native space and an 8 dp separator. Banners hide during maps and dialogs. Native boards resize to the available WebView height; keys/lifeline buttons stay 44 px high. Landscape uses side-by-side board and controls.
- Optional reward-card ad: a 100-coin solve earns 200 additional coins after Google's earned-reward callback, for 300 solve coins total. Points, trio and streak bonuses do not multiply. The wallet still caps at 99,999. Losses, skips, Adventure replays and duplicate claims cannot claim this offer. Declining/closing an unfinished ad leaves the original reward intact.
- Native durable pending reward receipt plus an atomic wallet/receipt ledger; interrupted delivery recovers on next launch. This is device-local virtual currency, not an account-backed or tamper-proof economy. Paid coin/lifeline packs now have a separate verified purchase-receipt flow; no transfer or cash redemption is offered. AdMob server-side verification is not implemented; reward completion uses Google's native earned-reward callback.
- Non-consumable Google Play products `remove_banner_ads` (India ₹799) and `complete_pack` (₹999 with one-time supplies): permanent banner and automatic-interstitial removal, localized Play price, pending/cancel/error handling, restore and foreground recheck. Repeatable 500/1,500/3,500 coin packs and the Lifeline Kit use server verification and consumption after atomic device delivery. Optional rewarded ads remain. Native ownership comes from a server-verified Play purchase, never a JavaScript/localStorage purchase flag. A previously verified benefit has seven days of offline grace; a successful Play query or verification revokes an inactive purchase earlier. No subscription.
- Preloaded automatic interstitial opportunities after full multiplayer matches and every three new Adventure advancements; failures/no-fill do not block results. Durable native deduplication/counters prevent replay ads. Replays, losses and Daily do not count.
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
4. **Paid products:** complete the missing merchant payments profile, then create the six exact products and standard Buy options in `MONETIZATION.md`. Use approved India customer prices and reviewed regional equivalents; keep multi-quantity disabled. The app displays Play prices. Remove Ads covers banners and automatic ads; Complete Pack also grants supplies once. License-test before sales.
5. **Server verification:** enable Android Publisher API in your Google Cloud project, create a least-privilege service account and grant it the required Play app permissions to read purchases, acknowledge permanent orders and consume repeatable products. Configure Vercel server environment values below. Deploy `/api/play-store` and retain legacy `/api/play-purchase`; test all products on a Play testing track before allowing live purchases. Never put a service-account JSON file/private key into the APK, `www`, public assets or git.
6. **Signing:** reuse the existing upload key through Android Studio, enroll in Play App Signing, store the upload key and passwords securely and back them up. The signing wizard supplies the key directly; for CLI builds, copy `android/keystore.properties.example` to ignored `keystore.properties` and fill it locally. Never send passwords in chat.
7. The local ignored `android/release.properties` contains all four real AdMob IDs and `releaseChannel=production`. `purchasesEnabled` defaults to false for the authorized free launch. After native acceptance, set `releaseChecklistApproved=true`, then sign a new code-5 bundle. The build safeguard is not Google approval. Preserve the original upload key and never expose passwords in chat.

Vercel-only environment:

| Name | Value |
| --- | --- |
| `DATABASE_URL` | Existing Neon connection, kept server-side |
| `ANDROID_PACKAGE_NAME` | `com.sensei.sixthsense` after confirming it |
| `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON` | Service-account JSON, set securely in Vercel, never in client files |

The current verification service allowlists six products and verifies tokens through Google. Neon retains hashed tokens, product/installation IDs and delivery timestamps; raw tokens are private native pending data. Permanent products are acknowledged; repeatable products are consumed after the atomic device wallet/receipt write. `MONETIZATION.md` details replay handling, cross-installation permanent restore and installation-local supply limitations. There is no RTDN or automatic consumed-supply refund clawback. Legacy ad-removal records remain separate for older builds.

Checkout requires the verification endpoint to return `{ "available": true }` before opening Play payment. Readiness checks whether required server environment variables exist; it does not prove service-account permissions. New catalog requests are rate limited to 40 per minute (legacy endpoint 15) using keyed connection buckets in Neon, removed on subsequent requests after one day. Android backups/device transfer exclude local progress and receipts; Play restore restores permanent ad removal, not the game wallet or delivered supplies.

## Release acceptance checklist

For the authorized free launch, paid-product/license-test and service-account items below are deferred while `purchasesEnabled=false`; they remain mandatory before enabling sales in a later signed update. App-ads.txt/store-link verification follows public listing availability. Other unverified native checks remain open; do not mark them passed based only on browser mocks.

- [ ] Real Android device/emulator: cold start, offline solo game, all eight home modes, rotation, system Back, app backgrounding, process restart, notch/gesture navigation, dark mode, TalkBack, reduced motion, low storage and poor connectivity.
- [ ] Native banners load only in intended home and below-lifelines placements, never over navigation/keyboard; paid owners retain removal after restart and restore.
- [ ] Native test rewarded ads: earn once, close early, failed load/show, no fill, repeated tap, app death after earned callback, receipt recovery, full wallet, Daily reopen, and unchanged bonus/point accounting.
- [ ] Native test interstitials: each full multiplayer match and each third new Adventure advancement; no replay/Daily/round ads, no-fill/error continuation, restart deduplication, foreground/consent guards, owned-ad suppression and audio recovery.
- [ ] All six Play products: exact contents/prices, pending/cancel, both permanent restores, repeatable consumption, duplicate callback, storage failure, full-wallet deferral, process-death recovery and refund/revocation.
- [ ] UMP: EEA/UK/Switzerland test geography, consent accept/decline, privacy choices re-open, minors' request flags, missing/offline consent response. Review target-audience declarations against actual marketing and artwork.
- [ ] Play license testers: successful purchase, pending payment, cancellation, already owned, restore after reinstall, refund/revocation and temporarily unavailable verification server. Confirm server acknowledgement in Play within Google's deadline.
- [ ] Backend and privacy page deployed; app-ads.txt verified; service-account permissions tested; signing/upload key backed up.
- [ ] Store graphics, phone screenshots, feature graphic, short/full descriptions and contact links completed. Party sprite replacements remain pending creative work; current runtime still uses the earlier CSS party accessories. Tea and Tangrams is now bundled as the background music; retain its source/export and commercial-use rights record with the release paperwork.
- [ ] Signed AAB, target API 36, increasing versionCode, Play pre-launch report, SDK/Data safety disclosures, 16 KB page-size compatibility check and policy review pass.
- [ ] If the Play account is a qualifying new personal account, complete the required closed test (currently at least 12 opted-in testers for 14 continuous days) and apply for production access. Google controls review/approval; building the app does not bypass this.

## Saved store copy

Short description: **Daily word puzzles, Bollywood clues and multiplayer word races with friends.**

Full copy: `store-assets/play-description-en-US.txt`. Saved October 14 as a listing draft for code 5, not submitted. It describes Bollywood Solo and omits unavailable purchase offers.

## Official references checked September 10, 2026

- [Target API requirements](https://support.google.com/googleplay/android-developer/answer/11926878): new submissions now require API 36.
- [Capacitor Android](https://capacitorjs.com/docs/android)
- [AdMob SDK setup](https://developers.google.com/admob/android/quick-start), [rewarded ads](https://developers.google.com/admob/android/rewarded), [UMP](https://developers.google.com/admob/android/privacy)
- [Play Billing integration](https://developer.android.com/google/play/billing/integrate), [purchase verification and acknowledgement](https://developer.android.com/google/play/billing/security)
- [AdMob app verification](https://support.google.com/admob/answer/14538460)
- [AdMob Data safety disclosure](https://developers.google.com/admob/android/privacy/play-data-disclosure), [Android 16 KB page sizes](https://developer.android.com/guide/practices/page-sizes)
- [Personal-account testing requirements](https://support.google.com/googleplay/android-developer/answer/14151465)
