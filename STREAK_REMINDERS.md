# Daily streak reminders

Android 1.0.5 / code 6. Enable **Settings → Save my streak**, then allow notifications if Android asks. Off by default. No notification server, device token or extra hosting cost. Web and iOS reminders are not implemented.

| Time before UTC deadline | Fox | Example notification for a 38-day streak |
| --- | --- | --- |
| 12 hours | Sad | 😟 Your fox misses you — About 12 hours left to save your 38-day streak. Your fox is waiting. Solve today’s Daily to keep it going! |
| 6 hours | Sadder, one tear | 🥺 Don’t let your streak slip away — About 6 hours left to save your 38-day streak. Your fox is getting worried. Come solve today’s Daily! |
| 3 hours | Crying | 😭 Save your streak! — About 3 hours left to save your 38-day streak. Your fox is in tears. One Daily solve keeps it alive! |

Daily resets at midnight UTC (05:30 IST). Indian reminders target 17:30, 23:30 and 02:30. Android uses inexact alarms: battery management may delay/prevent delivery. Late delivery uses actual rounded remaining hours and only the latest due emotion; no notification after expiry. No exact-alarm exemption is requested.

Only the next at-risk Daily is scheduled. Winning schedules the following day and removes the previous reminder. Losing, skipping, disabling reminders or a broken streak cancels alerts. All three stages replace the same notification rather than piling up. Reboot/update/clock-change receivers restore valid future alarms; force-stopping the app prevents delivery until it is reopened. Device-local progress does not synchronize across installations.

Streaks already had no seven-day maximum. The rail now explicitly represents a repeating 300-coin milestone. Missed-day normalization and restarted-run milestone resets are fixed; day 8, 14, 15 and beyond remain valid.

## Artwork provenance

Generated October 14, 2026 with the built-in image-generation tool, referenced against the owner-approved `assets/app-icon-fox-512.png`. Three independent transparent PNGs; originals preserved in the Codex generated_images directory. Runtime decodes sampled portraits for notification large icons. Android's status bar uses the separate monochrome fox vector because colored portraits are not supported as status icons.

Shared prompt: “Use case: stylized-concept. Create one square notification portrait asset of the SAME cute orange fox mascot in the reference. Use the reference for character identity, fluffy fur, brown eyes, white muzzle, 3D game rendering only. Expression: [expression]. Centered front-facing head and upper chest, entire ears visible with generous padding, readable at small size. Transparent background, no blocks, no text, no logo, no extra objects. Clean polished original game illustration. This is the [mood] streak reminder fox.”

- Sad: “slightly sad and hopeful, gently raised inner eyebrows, small closed downturned mouth, no tears” — exec-a6aa6645-34f6-4c2b-a060-df82398e90c3.png.
- Sadder: “very sad and worried, drooping ears, glossy pleading eyes with one small tear” — exec-23d6bec8-f16e-4851-ae8a-a0d312e2099b.png.
- Crying: “crying with two clearly visible teardrops, drooping ears and a little trembling downturned mouth” — exec-2b79afe4-d5c0-4e33-9f5d-102a7c5f7c6f.png.

## Verification

- `npm run test:streak`: Node policy plus browser native bridge fixtures. Local HTTP server defaults to 127.0.0.1:4273; set CHROME_BIN to an installed Chrome if needed.
- `android/gradlew -p android :app:testDebugUnitTest :app:assembleDebug :app:lintDebug`.
- Emulator: `android/gradlew -p android :app:connectedDebugAndroidTest -Pandroid.testInstrumentationRunnerArguments.class=com.sensei.sixthsense.StreakReminderInstrumentedTest`. This grants notification permission only on the test device, posts actual notifications using an injected policy clock, checks content/artwork and cancellation, then disables/clears test reminder preferences. It does not alter game saves.
- Physical-device/OEM battery and long-duration clock/Doze acceptance remain outstanding. Code 6 needs signing and submission; code 5 already in review does not contain reminders.
