# Third-party data and audio notices

## Bundled fonts and native dependencies

DM Sans and Nunito are redistributed under the SIL Open Font License 1.1. Full copyright/license notices are in `assets/fonts/dmsans-OFL.txt` and `assets/fonts/nunito-OFL.txt`. `scripts/vendor-fonts.js` records retrieval from Google Fonts for offline use. Capacitor is MIT-licensed; native Google Ads, UMP and Play Billing SDKs are subject to their Google SDK terms. Lockfiles pin JavaScript dependencies.

## User-supplied background music

**Tea and Tangrams** was supplied by the project owner on September 10, 2026. The game bundles a trimmed, gain-adjusted 88-second MP3 with short endpoint fades as `assets/audio/tea-and-tangrams-loop.mp3`; the original recording and SHA-256 are documented in `AUDIO_BRIEF.md`. This track is not covered by the CC0 notices for the sound effects below. No independent license verification or third-party authorship claim is made here; retain the owner's source/export and commercial-use rights records for publishing.

## Result sound effects

The following Freesound recordings are released under [CC0 1.0 Universal](https://creativecommons.org/publicdomain/zero/1.0/), permitting commercial use and modification. Source descriptions and licenses were checked on 2026-09-09. The locally bundled files are the public high-quality MP3 encodings; playback gain and short fades are applied in the game. No remote audio service is required at runtime.

| Local file | Recording / creator | Source | Downloaded encoding |
| --- | --- | --- | --- |
| `assets/audio/win-applause.mp3` | Small applause / Breviceps | https://freesound.org/people/Breviceps/sounds/462362/ | https://cdn.freesound.org/previews/462/462362_9159316-hq.mp3 |
| `assets/audio/loss-crowd-aww.mp3` | aww.wav / phmiller42 | https://freesound.org/people/phmiller42/sounds/124996/ | https://cdn.freesound.org/previews/124/124996_687791-hq.mp3 |
| `assets/audio/win-party-blower.mp3` | Party horn.wav / audiosmedia | https://freesound.org/people/audiosmedia/sounds/170583/ | https://cdn.freesound.org/previews/170/170583_1146698-hq.mp3 |

The loss source is described by its creator as a small audience pity moan. The three clips total approximately 186 KB. Credits are retained voluntarily despite CC0 not requiring attribution.

## ENABLE word list

The accepted-guess vocabulary is the six-letter subset of the [Enhanced North American Benchmark Lexicon (ENABLE)](https://github.com/dolph/dictionary/blob/master/enable1.txt). The ENABLE master word list was released into the public domain for unrestricted use and distribution, including incorporation into word games. Sixth Sense credits the ENABLE authors and preserves the source list's public-domain status.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

## wordfreq

The three answer tiers are frequency-ranked using [wordfreq](https://github.com/rspeer/wordfreq), distributed under the Apache License 2.0. The build-time package is not bundled with the game.

Copyright 2015–2023 Luminoso Technologies, Inc., Robyn Speer, and contributors.

Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at https://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.

## Princeton WordNet 3.0

Sense clues for expanded answers are derived from [Princeton WordNet 3.0](https://wordnet.princeton.edu/).

WordNet 3.0 Copyright 2006 by Princeton University. All rights reserved.

Permission to use, copy, modify and distribute this software and database and its documentation for any purpose and without fee or royalty is granted, provided that the copyright notice and disclaimer are preserved. The software and database are provided "AS IS" without representations or warranties, express or implied. The name of Princeton University or Princeton may not be used in advertising or publicity pertaining to distribution of the software or database.
