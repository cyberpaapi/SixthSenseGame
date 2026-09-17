# Sixth Sense background music brief

Status: the user supplied **Tea and Tangrams** on September 10, 2026. The prepared local track now replaces the procedural background score. Recorded result effects remain separate from the Music toggle.

## Current recording and preparation

- Input: `C:/Users/Aryan/Downloads/Tea_and_Tangrams.mp3`, 2,549,564 bytes, 44.1 kHz stereo, approximately 105.979 seconds. Original file preserved.
- Input SHA-256: `d80e422506a5118347ecffc91bd8b7bf94159673b861619a2ab97325258381f6`.
- Runtime asset: `assets/audio/tea-and-tangrams-loop.mp3`, 1,684,654 bytes, 88 seconds, VBR MP3 with a Xing seek/duration header. On September 16 the user specified 1:28 as the repeat point: playback now uses the original 0:00–1:28 section in its original order.
- Preparation with FFmpeg: trim the original to 88 seconds, apply -4 dB gain and 5 ms fades at each endpoint to reduce clicks, and encode using `libmp3lame -q:a 4 -write_xing 1`. The former 102.05-second crossfaded edit is replaced. Reproduction options: `-t 88 -af "volume=-4dB,afade=t=in:d=0.005,afade=t=out:st=87.995:d=0.005" -c:a libmp3lame -q:a 4 -write_xing 1 -metadata title="Tea and Tangrams"`. The app loops the prepared file; no claim of beat-aligned recomposition is made.
- Playback streams through one HTML audio element and the existing Web Audio music gain/compressor. It starts after a gesture, pauses in the background/during reward ads, resumes its position, obeys Music independently of Sound effects, and ducks during result sounds. Missing media fails quietly; there is no procedural music fallback.
- Provenance is user-supplied. No public-domain/CC0 license is asserted for this track; retain the creation/export and commercial-use rights record with the release paperwork. The links and original brief below are historical guidance, not verification of this recording's license.

## Suno prompt

Instrumental background music for a cozy, colorful word-puzzle game. Warm felt piano, mellow marimba, delicate pizzicato strings, rounded upright bass, and very soft brushed percussion. 92 BPM, relaxed lightly swung 4/4, natural human timing and expressive dynamics. Curious, sunny, gently magical, playful and intelligent. A simple memorable motif with plenty of breathing room and subtle variations, comfortable beneath several minutes of focused thinking. Organic acoustic textures and intimate studio warmth. Keep the energy and volume even. No vocals, chants, whistling, robotic synths, chiptune, harsh bells, heavy drums, dramatic builds, drops, or abrupt transitions. Aim for 2–3 minutes with a loop-friendly opening and ending, no long intro or final flourish.

## Delivery and integration

- Choose instrumental output. Send the approved downloaded WAV or MP3.
- Generate and download the track under a Suno plan granting commercial use for the intended ad-supported game; retain the track link and relevant rights record. [Suno commercial-use guidance](https://help.suno.com/en/articles/9601665), [September 2026 download-policy update](https://suno.com/blog/suno-updates-tos).
- Treat loop-friendly composition as a request, not a guarantee. On receipt, inspect the waveform, prepare a clean loop or crossfade, normalize and compress for mobile, bundle locally, and connect Music mute, app backgrounding, and result-audio ducking.
- Keep victory applause, the short party blower, and the loss crowd reaction out of the music file; the game plays them independently at the correct moment.
