# Sixth Sense Android monetization

Approved September 21, 2026. Implemented in source version 1.0.3 / code 4; external setup and Play license testing are still required. This is Android-only. The browser game does not load AdMob or offer fake web checkout.

## Approved catalog

| Play product ID | Product | India customer price | Contents | Repeatable |
| --- | --- | ---: | --- | --- |
| `remove_banner_ads` | Remove Ads | ₹799 | Permanent removal of banners and automatic interstitials; optional rewarded ads remain | No |
| `coins_500` | Coin Pouch | ₹99 | 500 coins | Yes |
| `coins_1500` | Coin Stash | ₹249 | 1,500 coins | Yes |
| `coins_3500` | Coin Chest | ₹499 | 3,500 coins | Yes |
| `lifeline_kit` | Lifeline Kit | ₹149 | 5 Sense, 3 Peek, 3 Clear | Yes |
| `complete_pack` | Complete Pack | ₹999 | Permanent Remove Ads + 1,500 coins + 10 Sense, 5 Peek, 5 Clear, supplies once | No |

`store-catalog.js` is the shared quantity/description allowlist. INR amounts are setup guidance, not hardcoded checkout prices. The shop displays Google's formatted regional price. Complete Pack is a separate purchase: an existing Remove Ads purchase is not automatically credited toward it. No subscription, randomized reward or cash redemption.

## Google Play setup

1. Complete the developer **payments profile**. On September 21 Play Console explicitly showed “To monetize this app, set up a merchant account”; the Payments profile page showed “Create a payments profile to get started.” The owner must handle this financial-account setup. No products or prices have been created in this session.
2. In Sixth Sense → Monetize with Play → Products → One-time products, create the six exact IDs above. Use the catalog titles and descriptions. Each has one standard **Buy** purchase option (not rental or subscription); enable backward compatibility for the option if shown. Keep multi-quantity purchases disabled. Consumable behavior is implemented by the app/backend, not by making these subscriptions.
3. Set each India's final customer price to the table amount, checking the tax-inclusive preview. Generate other regions' local prices, then review/override countries individually. Google applies conversion and local price conventions; this is not automatic income-based pricing. The app uses the offer price returned for the customer's Play region, without IP detection or currency arithmetic. Keep only supported/approved regions active. The present Alpha track targets India.
4. Activate purchase options/products when ready for license tests. Add designated license testers and install the signed build through the Play testing track. A sideloaded debug build and mocked browser tests do not establish working real payments.
5. Enable Android Publisher API and grant a service account the minimum app/order permissions needed for verification, acknowledgement and consumption. Keep its JSON privately in Vercel's `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON`; also set `ANDROID_PACKAGE_NAME=com.sensei.sixthsense` and retain `DATABASE_URL`. Do not put credentials in the repo, browser bundle, APK or chat.
6. Verify `/api/play-store` readiness and actual license-test transactions. Readiness only checks environment presence, not Google permissions. Legacy `/api/play-purchase` remains for earlier builds. Keep purchases unavailable until verification works.

## Automatic ad placements

- An interstitial opportunity occurs after a **whole multiplayer match** finishes, before its result card. It is not triggered after each word or VS round.
- Adventure has an opportunity after every **three new levels advanced** through a solve or paid Skip. Replays, losses, Daily and merely reopening results do not count. Native counters and event IDs survive restart and deduplicate room/level completion.
- Ads are preloaded. If no current ad is ready, the app is backgrounded, consent is unavailable, or another full-screen flow is running, the opportunity is skipped and the result continues. No delayed surprise ad is queued.
- Remove Ads and Complete Pack suppress both banners and automatic interstitials. Optional reward-card 3× coins and Last Chance ads retain their existing earned-only rewards.
- Audio pauses during ads; native ad activity is excluded from multiplayer screen-away notifications. Existing age eligibility and UMP requirements remain.

Create a standard Android **Interstitial** unit in the existing Sixth Sense AdMob app, without partner bidding. Add its public unit ID as `interstitialAdId` in ignored `android/release.properties`. A new ID has not been supplied. Debug/internal releases use Google's sample `ca-app-pub-3940256099942544/1033173712`. Production validation rejects missing or sample IDs. AdMob currently opens under the Play account rather than the owner's separate AdMob account, so no duplicate account was created.

## Delivery, restoration and limitations

Google verifies each allowlisted product/token before any benefit is granted. Permanent products are acknowledged and cached natively with seven days' offline grace; successful inactive/refund checks revoke them earlier. The client cannot create paid ad-removal ownership with a localStorage flag.

The backend binds supply delivery to a random native installation identifier passed through Google Play's obfuscated account field. Neon stores only a purchase-token hash, product, installation ID and delivery status/timestamps. It does not store raw purchase tokens. Native pending tokens stay in private SharedPreferences until completion; JavaScript receives only sanitized quantities and a hash receipt ID. The wallet, inventory and applied-receipt ledger are saved atomically before consumption is requested. Repeat callbacks/retries cannot grant the same receipt twice. Consumable tokens are consumed only after durable delivery; permanent Complete Pack is never consumed. Native recovery retains interrupted deliveries. A full 99,999-coin wallet defers the complete pack instead of truncating paid coins, and the shop blocks purchases with insufficient space. Wallets with paid receipts are excluded from test coin resets.

**Coins and lifelines remain installation-local.** They are not a server wallet, cannot transfer with username recovery, and do not restore after reinstalling or clearing app data. This is stated in the shop and privacy policy. Permanent ad removal restores through the same Google Play account. Complete Pack supplies grant once on the original installation; restoring its ad-removal benefit elsewhere does not reissue them. Unresolved delivery needs receipt-based support. Cloud save is a separate future feature.

The wallet is not tamper-proof. There are no real-time developer notifications or automatic clawbacks for refunded, already-consumed supplies. Permanent ownership is rechecked on launch/foreground/restore, subject to offline grace. Real Play pending/cancel/refund and native process-death scenarios remain release checks. Do not describe fixture tests as live-payment acceptance.

## Art and verification

Six generated transparent 512×512 WebP illustrations are in `assets/shop/`; `PROMPTS.md` records exact prompts and sources. The native coin wallet opens the shop in Settings. Prices and descriptions are live text; no prices are baked into art. Store listing screenshots must remain ad-free per the owner's request.

Run `npm.cmd run test:store`, `npm.cmd run test:purchases`, `npm.cmd run test:mobile`, `npm.cmd run test:last-chance`, and `node test-banner-layout.js` against the local server. Native cadence checks: `gradlew.bat :app:testDebugUnitTest`; compile/lint: `:app:assembleDebug :app:lintDebug`. Run `npm.cmd run android:sync` before the final build.

Before sales, test all six products via Play: purchase/cancel/pending, both permanent restores, repeatable consumption, duplicate callbacks, storage failure, wallet capacity, interrupted delivery, refund/revocation and verification outages. Verify actual sample interstitials on every multiplayer family and each third Adventure advancement, including no-fill, dismissal, restart and owned-ad suppression. These live SDK/Play cases have not yet been accepted.

## Official references checked September 21, 2026

- [One-time products and regional purchase options](https://support.google.com/googleplay/android-developer/answer/16430488?hl=en)
- [Local prices and conversion conventions](https://support.google.com/googleplay/android-developer/answer/16526148?hl=en-GB)
- [Billing integration, pending purchases and consumption](https://developer.android.com/google/play/billing/integrate)
- [Server verification and purchase security](https://developer.android.com/google/play/billing/security)
