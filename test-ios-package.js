"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const read = p => fs.readFileSync(path.join(__dirname,p),"utf8");
const html = read("www/index.html");
assert.match(html,/data-multiplayer-api="https:\/\/sixth-sense-game\.vercel\.app"/);
assert.match(html,/capacitor-runtime\.js/);
assert.match(html,/account-delete\.js/);
for (const file of ["index.html","account-delete.js","privacy.html","delete-account.html","daily-streak.js","bollywood-solo.js"]) {
  assert.equal(read(`www/${file}`),read(`ios/App/App/public/${file}`),`${file} must be synchronized`);
}
for (const forbidden of ["api","data","lib","android","native","node_modules","GAME_KNOWLEDGE.md","IOS_RELEASE.md"]) assert.equal(fs.existsSync(path.join(__dirname,"www",forbidden)),false);
function check(dir) {
  for (const entry of fs.readdirSync(dir,{withFileTypes:true})) {
    const file=path.join(dir,entry.name);
    assert.equal(entry.isSymbolicLink(),false);
    if(entry.isDirectory()) check(file);
    else assert.doesNotMatch(file,/\.(p8|p12|mobileprovision|keystore|jks|xlsx)$/i);
  }
}
check(path.join(__dirname,"www"));
const config=JSON.parse(read("ios/App/App/capacitor.config.json"));
assert.equal(config.appId,"com.sensei.sixthsense");
assert.match(read("ios/App/CapApp-SPM/Package.swift"),/native\/sensei-ios/);
console.log("iOS synchronized public-client packaging, deletion UI, native plugin and API origin checks passed.");
