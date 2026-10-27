// Сравнительный замер мобильной загрузки: медленный 4G (RTT 150 мс, 1,6 Мбит/с) + CPU ×4. Запуск: PW_CORE=<путь к playwright-core> PW_EXE=<chromium> node scripts/perf-compare.mjs '["https://…"]'
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PW_CORE);
const urls = JSON.parse(process.argv[2]);

const browser = await chromium.launch({ executablePath: process.env.PW_EXE });
for (const url of urls) {
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 330.0.0.0',
  });
  await ctx.addInitScript(() => {
    window.__lcp = 0; window.__cls = 0;
    new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__lcp = e.startTime; }).observe({ type: 'largest-contentful-paint', buffered: true });
    new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value; }).observe({ type: 'layout-shift', buffered: true });
  });
  const page = await ctx.newPage();
  const cdp = await ctx.newCDPSession(page);
  await cdp.send('Network.enable');
  await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 150, downloadThroughput: (1.6 * 1024 * 1024) / 8, uploadThroughput: (750 * 1024) / 8 });
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  let bytes = 0, reqs = 0; const byType = {};
  const types = new Map();
  cdp.on('Network.responseReceived', (e) => types.set(e.requestId, e.type));
  cdp.on('Network.loadingFinished', (e) => { reqs++; bytes += e.encodedDataLength; const t = types.get(e.requestId) || 'Other'; byType[t] = (byType[t] || 0) + e.encodedDataLength; });
  const t0 = Date.now();
  let err = '';
  try { await page.goto(url, { waitUntil: 'load', timeout: 120000 }); } catch (e) { err = e.message.split('\n')[0]; }
  const loadMs = Date.now() - t0;
  await page.waitForTimeout(4000);
  const m = await page.evaluate(() => ({ lcp: window.__lcp, cls: window.__cls, dcl: performance.getEntriesByType('navigation')[0]?.domContentLoadedEventEnd }));
  const mb = (b) => (b / 1024 / 1024).toFixed(2) + ' MB';
  const top = Object.entries(byType).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([k, v]) => `${k} ${mb(v)}`).join(', ');
  console.log(JSON.stringify({ url, err, loadSec: (loadMs / 1000).toFixed(1), lcpSec: (m.lcp / 1000).toFixed(1), cls: m.cls.toFixed(3), dclSec: ((m.dcl || 0) / 1000).toFixed(1), requests: reqs, transferred: mb(bytes), byType: top }));
  await ctx.close();
}
await browser.close();
