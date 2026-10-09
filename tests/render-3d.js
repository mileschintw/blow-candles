const { chromium } = require('playwright-core');
const path = require('path');
const [,, query = '?count=5', out = 'r3', wav = 'quiet', extra = ''] = process.argv;
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true,
    args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream', '--use-file-for-fake-audio-capture=' + path.resolve('wav/' + wav + '.wav'),
      '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, permissions: ['microphone'] });
  const p = await ctx.newPage(); const errs = [];
  p.on('pageerror', e => errs.push('pageerror ' + e.message));
  p.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errs.push(m.type() + ' ' + m.text().slice(0, 300)); });
  await p.goto('http://localhost:8765/' + query);
  await p.tap('#btnStart');
  for (let i = 0; i < 40; i++) { const r = await p.evaluate(() => candleDebug.render()); if (r.r3State !== 'loading' && r.r3State !== 'idle') break; await p.waitForTimeout(250); }
  await p.waitForTimeout(3000);
  console.log('render', JSON.stringify(await p.evaluate(() => candleDebug.render())));
  console.log('overlay', await p.evaluate(() => { const c = document.getElementById('scene'); const g = c.getContext('2d'); return [0.5,0.6,0.7].map(f => g.getImageData(c.width/2, c.height*f, 1, 1).data[3]).join(','); }), 'frame', await p.evaluate(() => new Promise(r => { const t = performance.now(); requestAnimationFrame(() => r((performance.now() - t).toFixed(0) + 'ms')); })));
  await p.screenshot({ path: out + '-lit.png' });
  if (extra.includes('tap')) {
    const pt = await p.evaluate(() => candleDebug.project3D(0));
    console.log('tap at', JSON.stringify(pt));
    await p.touchscreen.tap(pt.x, pt.y); await p.waitForTimeout(400);
    console.log('after tap', JSON.stringify((({ lit, total }) => ({ lit, total }))(await p.evaluate(() => candleDebug.state()))));
    await p.screenshot({ path: out + '-tapped.png' });
  }
  if (extra.includes('blow')) {
    await p.evaluate(() => candleDebug.setLevel(52)); await p.waitForTimeout(250);
    await p.screenshot({ path: out + '-wind.png' });
    await p.evaluate(() => candleDebug.setLevel(95)); await p.waitForTimeout(2500);
    await p.evaluate(() => candleDebug.setLevel(0)); await p.waitForTimeout(600);
    await p.screenshot({ path: out + '-out.png' });
    await p.waitForTimeout(2500);
    await p.screenshot({ path: out + '-celebrate.png' });
    console.log('after blow', JSON.stringify((({ lit, total, celebrateVisible }) => ({ lit, total, celebrateVisible }))(await p.evaluate(() => candleDebug.state()))));
  }
  if (extra.includes('toggle')) {
    await p.tap('#btnRender'); await p.waitForTimeout(500);
    console.log('after toggle', JSON.stringify(await p.evaluate(() => candleDebug.render())));
    await p.screenshot({ path: out + '-2d.png' });
  }
  console.log('errors', errs.length ? errs : 'none');
  await b.close();
})();
