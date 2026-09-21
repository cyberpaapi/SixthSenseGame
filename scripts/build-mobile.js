"use strict";
const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "..");
const answers = require("../answer-bank");
const safety = require("./answer_safety.json");
const excluded = new Set(safety.excludedAnswers);
const blockedClues = safety.blockedCluePatterns.map(pattern => new RegExp(pattern, "i"));
if (answers.some(entry => excluded.has(entry.word) || blockedClues.some(pattern => pattern.test(entry.clue)))) {
  throw new Error("Answer content requires review before packaging. Run npm test and scripts/apply_answer_safety.py.");
}
const destination = path.join(root, "www");
if (path.dirname(destination) !== root || path.basename(destination) !== "www") throw new Error("Unexpected generated output directory");
if (fs.existsSync(destination) && fs.lstatSync(destination).isSymbolicLink()) throw new Error("Refusing to overwrite a linked output directory");
// This exact generated directory is owned by the builder; remove stale files before the allow-list copy.
fs.rmSync(destination, { recursive: true, force: true });
fs.mkdirSync(destination, { recursive: true });
// Allow-list the shipped client. Never bundle the repository, API, credentials or drafts.
const files = ["index.html", "styles.css", "identity.js", "app.js", "game-core.js", "progression.js", "answer-bank.js", "word-bank.js", "multiplayer.js", "manifest.webmanifest", "favicon.svg", "mobile.js", "store-catalog.js", "privacy.html", "economy.json"];
if (process.argv.includes("--web")) files.push("delete-account.html");
for (const name of files) {
  const source = path.join(root, name);
  if (!fs.existsSync(source)) throw new Error(`Missing client file: ${name}`);
  fs.copyFileSync(source, path.join(destination, name));
}
fs.cpSync(path.join(root, "assets"), path.join(destination, "assets"), { recursive: true, filter: source => !/\.(md|psd|xlsx)$/i.test(source) });
let html = fs.readFileSync(path.join(destination, "index.html"), "utf8");
if (!process.argv.includes("--web") || process.argv.includes("--pages")) {
  html = html.replace('<html lang="en"', '<html lang="en" data-multiplayer-api="https://sixth-sense-game.vercel.app"');
}
if (!process.argv.includes("--web")) {
  html = html.replace('  <script src="answer-bank.js', '  <script src="capacitor-runtime.js"></script>\n  <script src="answer-bank.js');
  fs.copyFileSync(path.join(root, "node_modules/@capacitor/core/dist/capacitor.js"), path.join(destination, "capacitor-runtime.js"));
}
fs.writeFileSync(path.join(destination, "index.html"), html);
console.log("Bundled allow-listed client in www.");
