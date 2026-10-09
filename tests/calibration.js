const { chromium } = require('playwright-core');
const path = require('path');
(async () => {
  for (const wav of ['calib', 'quiet']) {
    const b = await chromium.launch({ executablePath: process.env.CHROME || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true,
      args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream', '--use-file-for-fake-audio-capture=' + path.resolve('wav/' + wav + '.wav')] });
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, permissions: ['microphone'] });
    const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
    await p.goto('http://localhost:8765/?count=5&r=2d'); await p.tap('#btnStart');
    const t0 = Date.now(); const T = () => ((Date.now() - t0) / 1000).toFixed(1);
    await p.waitForTimeout(350);
    await p.tap('#btnSettings'); await p.waitForTimeout(100);
    await p.tap('#btnCalib');
    let last = '';
    while (Date.now() - t0 < 6200) {
      const txt = await p.evaluate(() => candleDebug.calText());
      if (txt !== last) { console.log(wav, T(), txt); last = txt; }
      if (wav === 'calib' && Number(T()) > 3.6 && Number(T()) < 3.8) await p.screenshot({ path: 'calib-blow.png' });
      await p.waitForTimeout(100);
    }
    await p.screenshot({ path: 'calib-' + wav + '-done.png' });
    const st = await p.evaluate(() => candleDebug.state());
    console.log(wav, 'threshold', st.threshold, 'calibrated', st.calibrated, 'lit', st.lit);
    if (wav === 'calib') {
      await p.tap('#calBtn2'); await p.tap('#btnDone');
      let out = null;
      while (Date.now() - t0 < 14000) { const s = await p.evaluate(() => candleDebug.state()); if (s.lit === 0 && !out) out = T(); await p.waitForTimeout(150); }
      console.log('after calibration, all out at', out, '(blow in file loop starts at ~10.6s)');
    }
    console.log('errors', errs); await b.close();
  }
})();
