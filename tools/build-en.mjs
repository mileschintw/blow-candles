// Builds the English page, en/index.html, from index.html.
//
// The app is the same file; only what a search engine or a link preview reads before any script runs changes:
// the <html lang>, the search and share metadata between the seo:start/seo:end comments, the manifest, and the
// visible text of every element with data-t / data-t-html (taken from the English strings in index.html).
//
//   node tools/build-en.mjs           write en/index.html
//   node tools/build-en.mjs --check   exit 1 if en/index.html is missing or out of date
//
// Run it after every change to index.html, before uploading.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import vm from 'node:vm';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(ROOT, 'index.html'), OUT = join(ROOT, 'en', 'index.html');
const SITE = 'https://blow-candles.netlify.app/';

const EN_HEAD = `<!-- seo:start (tools/build-en.mjs swaps this block for the English page) -->
<title>Blow Candles – Blow Out Birthday Candles Online with Your Phone</title>
<meta name="description" content="A free online birthday cake, no app to download: open the page and blow into your phone's microphone to blow out the birthday candles. Number candles, a 3D cake, Happy Birthday, fireworks and confetti. Installable to your home screen.">
<link rel="canonical" href="${SITE}en/">
<link rel="alternate" hreflang="zh-Hant" href="${SITE}">
<link rel="alternate" hreflang="en" href="${SITE}en/">
<link rel="alternate" hreflang="x-default" href="${SITE}en/">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Blow Candles">
<meta property="og:title" content="Blow Candles – blow at your phone to put out the birthday candles">
<meta property="og:description" content="A free birthday cake in your browser, no app to download. Number candles, a 3D cake, Happy Birthday and confetti.">
<meta property="og:url" content="${SITE}en/">
<meta property="og:image" content="${SITE}social/og-en.jpg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="A 3D birthday cake on a phone with a lit number 18 candle">
<meta property="og:locale" content="en_US">
<meta name="twitter:card" content="summary_large_image">
<script type="application/ld+json">
{"@context":"https://schema.org","@type":"WebApplication",
 "name":"Blow Candles","alternateName":["吹蠟燭","Blow the Candles"],
 "url":"${SITE}en/","inLanguage":"en",
 "description":"A free online birthday cake: blow into your phone's microphone to blow out the birthday candles.",
 "applicationCategory":"EntertainmentApplication","operatingSystem":"Android, iOS, Windows, macOS",
 "browserRequirements":"A modern browser with microphone access; without a microphone, tap the candles instead",
 "isAccessibleForFree":true,"offers":{"@type":"Offer","price":"0","priceCurrency":"USD"},
 "image":"${SITE}social/og-en.jpg",
 "screenshot":["${SITE}screenshots/lit-en.jpg","${SITE}screenshots/party-en.jpg"],
 "featureList":["Blow into the microphone to put the candles out","Number candles and regular candles","3D and 2D birthday cakes","Happy Birthday, fireworks and confetti","Installable, works offline"]}
</script>
<!-- seo:end -->`;

const esc = t => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
function swap(s, from, to, what) {
  const n = s.split(from).length - 1;
  if (n !== 1) throw new Error(`build-en: expected one ${what} in index.html, found ${n}`);
  return s.replace(from, () => to);
}

export function build() {
  let s = readFileSync(SRC, 'utf8');
  const strMatch = s.match(/const STR = (\{[\s\S]*?\n\});\nconst DEFAULT_MSGS/);
  if (!strMatch) throw new Error('build-en: could not find the STR strings in index.html');
  const EN = vm.runInNewContext('(' + strMatch[1] + ')').en;
  const en = k => { const v = EN[k]; if (typeof v !== 'string') throw new Error('build-en: no English string for ' + k); return v; };

  s = swap(s, '<html lang="zh-Hant" data-page-lang="zh">', '<html lang="en" data-page-lang="en">', '<html> tag');
  // the page lives one folder down; every relative address (manifest, icons, sw.js, the language link) stays root-relative
  s = swap(s, '<meta charset="utf-8">\n', '<meta charset="utf-8">\n<base href="../">\n', 'charset meta');
  s = s.replace(/^<!doctype html>\n/i, m => m + '<!-- Generated from index.html by tools/build-en.mjs. Edit index.html, then run: node tools/build-en.mjs -->\n');
  const head = s.match(/<!-- seo:start[\s\S]*?<!-- seo:end -->/);
  if (!head) throw new Error('build-en: no seo:start/seo:end block in index.html');
  s = s.replace(head[0], () => EN_HEAD);
  s = swap(s, '<link rel="manifest" href="manifest.webmanifest">', '<link rel="manifest" href="manifest.en.webmanifest">', 'manifest link');
  s = swap(s, '<a id="langLink" href="en/" hreflang="en" lang="en">English</a>', '<a id="langLink" href="./" hreflang="zh-Hant" lang="zh-Hant">繁體中文</a>', 'language link');

  // visible text: only the markup before the first <script> in <body>
  const bodyStart = s.indexOf('<body'), scriptStart = s.indexOf('<script>', bodyStart);
  let body = s.slice(bodyStart, scriptStart);
  body = body.replace(/(<(\w+)\b[^>]*\sdata-t="(\w+)"[^>]*>)([^<]*)(<\/\2>)/g, (m, open, tag, k, text, close) => open + esc(en(k)) + close);
  body = body.replace(/(<(\w+)\b[^>]*\sdata-t-html="(\w+)"[^>]*>)([\s\S]*?)(<\/\2>)/g, (m, open, tag, k, html, close) => open + en(k) + close);
  body = body.replace(/(<[^>]*\sdata-t-aria="(\w+)"[^>]*>)/g, (m, open, k) => open.replace(/aria-label="[^"]*"/, `aria-label="${esc(en(k))}"`));
  body = body.replace(/(<[^>]*\sdata-t-ph="(\w+)"[^>]*>)/g, (m, open, k) => open.replace(/placeholder="[^"]*"/, `placeholder="${esc(en(k))}"`));
  return s.slice(0, bodyStart) + body + s.slice(scriptStart);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const out = build();
  if (process.argv.includes('--check')) {
    const cur = existsSync(OUT) ? readFileSync(OUT, 'utf8') : '';
    if (cur !== out) { console.error('en/index.html is out of date. Run: node tools/build-en.mjs'); process.exit(1); }
    console.log('en/index.html is up to date');
  } else {
    mkdirSync(dirname(OUT), { recursive: true });
    writeFileSync(OUT, out);
    console.log('wrote en/index.html');
  }
}
