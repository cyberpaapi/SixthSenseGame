// Store artwork captures from the shipped code-5 WebView client, not painted game UI.
// Isolated demo saves/room snapshots; no player accounts or production rooms are changed.
const { chromium } = require('../test-browser-runtime');
const fs = require('node:fs');
const path = require('node:path');
const Core = require('../release/play-capture-runtime/game-core');
const out = path.resolve(__dirname, '../store-assets/play-2026-11-06/raw');
const base = 'http://127.0.0.1:4273/release/play-capture-runtime/';
const nativeBridge = age => `(() => {
  const state = {ageBand:${JSON.stringify(age)},safeTop:0,eligible:false,purchasesEnabled:false,products:{},pendingPurchases:[],pendingReward:{}};
  const plugin={getState:async()=>state,initialize:async({ageBand})=>({...state,ageBand}),setBanner:async()=>{},addListener:async()=>({remove:async()=>{}})};
  window.Capacitor={isNativePlatform:()=>true,getPlatform:()=>"android",registerPlugin:name=>name==="SenseiMonetization"?plugin:{addListener:async()=>({remove:async()=>{}})}};
})();`;
(async()=>{
  const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN||'C:/Program Files/Google/Chrome/Application/chrome.exe'});
  const errors=[];
  async function pageFor(age='18+',height=640) {
    const page=await browser.newPage({viewport:{width:390,height},deviceScaleFactor:3,isMobile:true,hasTouch:true,reducedMotion:'reduce',colorScheme:'light'});
    page.on('pageerror',e=>errors.push(e.message));
    await page.route('**/capacitor-runtime.js',r=>r.fulfill({contentType:'application/javascript',body:nativeBridge(age)}));
    await page.addInitScript(()=>{
      localStorage.setItem('sixth-sense.visited.v1','yes');
      localStorage.setItem('sixth-sense.online.identity.v1',JSON.stringify({name:'Asha'}));
      localStorage.setItem('sixth-sense.settings.v1',JSON.stringify({dark:false,music:false,effects:false,avatar:'fox'}));
      localStorage.setItem('sixth-sense.stats.v1',JSON.stringify({economyVersion:10,coins:500}));
    });
    await page.goto(base); await page.evaluate(()=>document.fonts.ready);
    return page;
  }
  async function save(page,name){
    await page.waitForTimeout(400);
    if(await page.locator('body.is-dark').count())throw new Error('Dark theme capture rejected');
    await page.screenshot({path:path.join(out,name+'.png'),type:'png'});
    console.log(name);
  }
  try {
    const age=await pageFor('',844); await age.locator('#age-band-modal[open]').waitFor();
    await save(age,'age-screen-light'); await age.close();
    const daily=await pageFor(); await daily.click('[data-start-mode="daily"]');
    for(const guess of ['remote','demote']){await daily.keyboard.type(guess);await daily.waitForTimeout(1100);}
    const answer=await daily.evaluate(()=>window.SixthSenseCore.dailyAnswer().word);
    await daily.keyboard.type(answer.slice(0,5));await save(daily,'01-guess-word'); await daily.close();
    for(const [answer,guesses,name] of [['sholay',['lagaan','dangal'],'02-bollywood-movies'],['gabbar',['sultan','babbar'],'03-bollywood-characters']]){
      const p=await pageFor();
      await p.evaluate(answer=>localStorage.setItem('sixth-sense.bollywood-solo.v1',JSON.stringify({version:4,mode:'bollywood',answer,status:'playing',guesses:[]})),answer);
      await p.click('[data-start-mode="bollywood"]');
      for(const guess of guesses){await p.keyboard.type(guess);await p.waitForTimeout(1100);}
      await p.keyboard.type(answer.slice(0,5));await save(p,name);await p.close();
    }
    for(const [mode,name] of [['race','04-race-friends'],['bollywood','05-bollywood-race']]){
      const p=await pageFor();
      const word=mode==='bollywood'?'sholay':'planet';
      const guesses=mode==='bollywood'?['lagaan','dangal']:['bright','plates'];
      const players=['Asha','Kabir','Meera'].map((name,i)=>({id:'demo'+i,name,avatar:['fox','panda','owl'][i],seat:i+1,currentWordIndex:i,attempts:[],score:0,finished:false}));
      const attempts=guesses.map(guess=>({guess,score:Core.scoreGuess(guess,word)}));
      const snapshot={room:{code:'CINEMA',mode:'race',theme:mode==='bollywood'?'bollywood':'classic',difficulty:'easy',wordCount:5,status:'running',revision:1,maxGuesses:6},me:{...players[0],isHost:true,attempts,wordLength:6,answerKind:mode==='bollywood'?'Film':undefined,lifelines:{}},players};
      await p.route('**/api/multiplayer',r=>r.fulfill({json:{roomCode:'CINEMA',resumeToken:'store-demo',playerId:'demo0',snapshot}}));
      await p.click('[data-open-online="'+mode+'"]');await p.click('#online-create-room');
      await p.locator('#online-board .tile').first().waitFor();
      await p.keyboard.type(word.slice(0,4));await save(p,name);await p.close();
    }
    const help=await pageFor();await help.click('[data-start-mode="daily"]');
    await help.keyboard.type('planet');await help.waitForTimeout(1100);
    await help.click('#peek-button');await help.click('#clear-button');
    await help.waitForTimeout(3000);await save(help,'06-lifelines');await help.close();
    fs.writeFileSync(path.join(out,'capture-metadata.json'),JSON.stringify({source:'Signed Android 1.0.4/code 5 AAB public assets',theme:'light',renderer:'Chromium 390×640 @3x, native layout, simulated ad-unavailable bridge',onboarding:'390×844 @3x; age unset',data:'Isolated demonstration saves and room snapshots with real scoring; no live room or wallet changes',errors},null,2));
    if(errors.length)throw new Error(errors.join('\n'));
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
