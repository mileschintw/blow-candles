const { chromium } = require('playwright-core');
const path = require('path');
const files = process.argv[2].split(',');
const query = process.argv[3] || '';
const secs = +(process.argv[4] || 8.5);
async function run(name) {
  const browser = await chromium.launch({ executablePath: process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true,
    args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream',
      '--use-file-for-fake-audio-capture=' + path.resolve('wav/' + name + '.wav')] });
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, permissions: ['microphone'] });
  const page = await ctx.newPage(); const errs = [];
  page.on('pageerror', e => errs.push(e.message));
  await page.goto('http://localhost:8765/' + query);
  await page.tap('#btnStart');
  const t0 = Date.now(); let minLit = 99, maxLvl = 0, outAt = null, samples = [];
  while (Date.now() - t0 < secs * 1000) {
    const s = await page.evaluate(() => candleDebug.state());
    const t = (Date.now() - t0) / 1000;
    if (t > 1.8) { minLit = Math.min(minLit, s.lit + s.pending); maxLvl = Math.max(maxLvl, s.level); }
    if (outAt == null && t > 1.8 && s.lit + s.pending < s.total) outAt = t.toFixed(1);
    if (Math.round(t * 4) % 2 === 0) samples.push(`${t.toFixed(1)}:${s.level}${s.dbg ? '/' + s.dbg : ''}`);
    await page.waitForTimeout(100);
  }
  await browser.close();
  return `${name.padEnd(20)} minLit=${minLit}/5 firstOut=${outAt || '-'} maxLvl=${maxLvl} ${errs.length ? 'ERR ' + errs : ''}` + (process.env.V ? '\n   ' + samples.join(' ') : '');
}
(async () => {
  const out = [];
  for (let i = 0; i < files.length; i += 4) out.push(...await Promise.all(files.slice(i, i + 4).map(run)));
  console.log(out.join('\n'));
})();
