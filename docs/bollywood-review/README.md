# Bollywood movie and character content reference

The owner approved this content on September 19, 2026 and requested replacement of the entire existing Bollywood pool: guess a movie or fictional character using one short, slightly vague Sense hint. No trivia questions or actor-name answers.

- `bollywood-word-bank.json`: owner-reviewed records. `test-bollywood.js` requires the runtime words, kinds and hints to match exactly.
- `bollywood-word-bank.md`: complete readable list with reference credits.
- `bollywood-word-bank.html`: standalone searchable reference with movie/character and new-entry filters. Open locally in a browser.

125 unique 5–7-letter words: 75 complete movie titles and 50 recognisable character given names/nicknames. Spaces and punctuation are omitted when entering movie titles. The earlier 53 movie entries remain; 22 movies and 50 characters are marked new relative to the preceding review. Actor entries were removed. FARHAN and VICKY identify fictional roles through their clues and references.

These words now replace `data/bollywood-answers.json` for new Race and VS selections, including Endless. The existing legacy lookup serves only already-created rooms, preserving their saved progress until expiry. These full reference documents and both server banks stay outside published web/native client bundles. The public repository is reviewable; it is not a room-answer endpoint.

Selected sources are linked; this is not an exhaustive independent factual audit. Canonical spellings follow the reference records; alias-equivalent guesses are not implemented. See `BOLLYWOOD_CONTENT.md` for validation, compatibility and editorial limitations. Keep the JSON, Markdown, HTML and runtime bank synchronized when revising clues. No production deployment or new Android binary is included in this commit.
