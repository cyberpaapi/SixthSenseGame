// Render promotional framing around unchanged captures of the released game.
const { chromium } = require('../test-browser-runtime');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../store-assets/play-2026-11-06');
const cards = [
  ['01-guess-word','Guess the word.<br>Feel the aha.','Six letters. Six chances.','word-fox','#eee6ff','#c2f6f2'],
  ['02-bollywood-movies','Think you know<br>Bollywood?','Guess iconic movies.','cinema-fox','#fff0d9','#ffd7ea'],
  ['03-bollywood-characters','Name the<br>legend.','Memorable characters. Clever clues.','cinema-fox','#ffe5ef','#e7d6ff'],
  ['04-race-friends','Race your<br>friends.','Same words. First to the finish.','friends-fox','#dcf8f5','#dce2ff'],
  ['05-bollywood-race','Cinema night.<br>Game on.','Bollywood + multiplayer.','friends-fox','#fff1d7','#e6d9ff'],
  ['06-lifelines','A little help.<br>A big aha.','Reveal a letter. Clear the clutter.','word-fox','#e8e7ff','#c8f4e8'],
];
// Owner order: core guessing, multiplayer race, help, then Bollywood.
const order = ['01-guess-word','04-race-friends','06-lifelines','02-bollywood-movies','03-bollywood-characters','05-bollywood-race'];
cards.sort((a,b)=>order.indexOf(a[0])-order.indexOf(b[0]));
const style=`@import url('../../assets/fonts/fonts.css');*{box-sizing:border-box}html,body{margin:0}body{font-family:Nunito,sans-serif;color:#29124e}.card{position:relative;width:1080px;height:1920px;overflow:hidden;background:linear-gradient(155deg,var(--a),#fffaf6 52%,var(--b))}.card:before{content:'';position:absolute;right:-160px;top:-180px;width:660px;height:660px;border-radius:50%;background:#ffffff70}.brand{position:absolute;left:76px;top:48px;font-size:25px;font-weight:900;letter-spacing:5px;color:#744ba4}.headline{position:absolute;left:72px;top:98px;margin:0;font-size:82px;line-height:1.04;letter-spacing:-3px;font-weight:900;z-index:2}.sub{position:absolute;left:76px;top:290px;margin:0;font-size:31px;font-weight:800;color:#654d7c}.mascot{position:absolute;right:36px;top:46px;width:310px;height:310px;object-fit:contain;z-index:1;filter:drop-shadow(0 14px 10px #693e8020)}.game{position:absolute;left:91px;top:404px;width:898px;border:14px solid white;border-radius:45px;box-shadow:0 24px 60px #56306b26;overflow:hidden;background:white}.game img{display:block;width:870px;height:auto}.spark{position:absolute;bottom:22px;left:0;width:100%;text-align:center;font-size:21px;letter-spacing:4px;font-weight:900;color:#76598b}`;
const cardHTML=(c)=>`<article class="card" style="--a:${c[4]};--b:${c[5]}"><div class="brand">SIXTH SENSE</div><h1 class="headline">${c[1]}</h1><p class="sub">${c[2]}</p><img class="mascot" src="art/${c[3]}.png" alt=""><div class="game"><img src="raw/${c[0]}.png" alt="Actual Sixth Sense gameplay"></div><div class="spark">TRUST YOUR SIXTH SENSE</div></article>`;
fs.writeFileSync(path.join(root,'cards.html'),`<!doctype html><meta charset="utf-8"><title>Sixth Sense • Play screenshots</title><style>${style}</style>${cards.map(cardHTML).join('')}`);
(async()=>{
  const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN||'C:/Program Files/Google/Chrome/Application/chrome.exe'});
  try{
    const page=await browser.newPage({viewport:{width:1080,height:1920},deviceScaleFactor:1});
    await page.goto('http://127.0.0.1:4273/store-assets/play-2026-11-06/cards.html');
    await page.evaluate(()=>document.fonts.ready);
    await page.locator('img').evaluateAll(imgs=>Promise.all(imgs.map(i=>i.decode())));
    fs.mkdirSync(path.join(root,'upload'),{recursive:true});
    for(let i=0;i<cards.length;i++)await page.locator('.card').nth(i).screenshot({path:path.join(root,'upload',cards[i][0]+'.jpg'),type:'jpeg',quality:97});
    fs.writeFileSync(path.join(root,'preview.html'),`<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Sixth Sense • New Play screenshots</title><style>@import url('../../assets/fonts/fonts.css');body{margin:36px;background:#f4f0f8;color:#29124e;font-family:Nunito,sans-serif}h1{font-weight:900;font-size:36px;margin-bottom:8px}p{max-width:950px}.grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:22px;max-width:1400px}.grid img{width:100%;border-radius:18px;box-shadow:0 10px 30px #48245720}a{color:inherit}.age{width:300px;max-width:100%;border-radius:20px}@media(max-width:700px){.grid{grid-template-columns:repeat(2,minmax(0,1fr))}}</style><h1>A brighter first impression.</h1><p>Sixth Sense · Six new light-theme screenshots · Released 1.0.4 gameplay with promotional captions and original fox artwork. No ads or Adventure map.</p><div class="grid">${cards.map(c=>`<a href="upload/${c[0]}.jpg"><img src="upload/${c[0]}.jpg" alt="${c[1].replace('<br>',' ')}"></a>`).join('')}</div><h2>Current age screen</h2><p>For your review only; not part of the store gallery.</p><a href="raw/age-screen-light.png"><img class="age" src="raw/age-screen-light.png" alt="Current Before you play age selector"></a>`);
    await page.setViewportSize({width:1260,height:1650});
    await page.goto('http://127.0.0.1:4273/store-assets/play-2026-11-06/preview.html');
    await page.evaluate(()=>document.fonts.ready);
    await page.locator('img').evaluateAll(imgs=>Promise.all(imgs.map(i=>i.decode())));
    await page.screenshot({path:path.join(root,'contact-sheet.jpg'),type:'jpeg',quality:95});
  }finally{await browser.close();}
  console.log('Rendered six 1080×1920 JPEG screenshots and review gallery.');
})().catch(e=>{console.error(e);process.exitCode=1;});
