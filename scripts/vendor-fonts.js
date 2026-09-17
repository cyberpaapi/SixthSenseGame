"use strict";
const fs = require("node:fs/promises");
const path = require("node:path");
(async () => {
  const destination = path.join(__dirname, "../assets/fonts");
  await fs.mkdir(destination, { recursive: true });
  const response = await fetch("https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Nunito:wght@700;800;900&display=swap", { headers: { "User-Agent": "Mozilla/5.0 Chrome/140.0.0.0 Safari/537.36" } });
  if (!response.ok) throw new Error("Font stylesheet unavailable");
  let css = await response.text();
  const urls = [...new Set([...css.matchAll(/url\((https:\/\/fonts.gstatic.com\/[^)]+)\)/g)].map(match => match[1]))];
  for (let index = 0; index < urls.length; index++) {
    const font = await fetch(urls[index]);
    if (!font.ok) throw new Error("Font download failed");
    const bytes = Buffer.from(await font.arrayBuffer());
    const name = `font-${index}.${bytes.subarray(0, 4).toString() === "wOF2" ? "woff2" : "ttf"}`;
    await fs.writeFile(path.join(destination, name), bytes);
    css = css.replaceAll(urls[index], name);
  }
  await fs.writeFile(path.join(destination, "fonts.css"), css);
  for (const family of ["dmsans", "nunito"]) {
    const license = await fetch(`https://raw.githubusercontent.com/google/fonts/main/ofl/${family}/OFL.txt`);
    if (!license.ok) throw new Error("Font license unavailable");
    await fs.writeFile(path.join(destination, `${family}-OFL.txt`), await license.text());
  }
  console.log(`Vendored ${urls.length} font files and both SIL Open Font Licenses.`);
})().catch(error => { console.error(error.message); process.exitCode = 1; });
