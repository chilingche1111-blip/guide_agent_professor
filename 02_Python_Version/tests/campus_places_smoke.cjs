const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
(async () => {
  const root = path.resolve(__dirname, '../..');
  const out = path.join(root, '06_Demo/screenshots/campus-10');
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', args: ['--enable-unsafe-swiftshader'] });
  const context = await browser.newContext({ viewport: { width: 1440, height: 960 }, reducedMotion: 'reduce' });
  const page = await context.newPage(), checks = [], errors = [];
  page.on('pageerror', e => errors.push(e.message));
  const pass = name => { checks.push(name); console.log('PASS', name); };
  const destinations = [ ['dining','吃饭','校园食堂'], ['stadium','跑步','体育场'], ['clinic','门诊','校医院'], ['activities','社团','学生活动中心'], ['market','闲置','二手集市'], ['transit','校车','交通驿站'] ];
  try {
    await page.goto('http://127.0.0.1:7860/');
    await page.waitForFunction(() => document.body.dataset.scene === 'ready');
    assert.equal(await page.locator('#places button').count(), 10);
    assert.equal(await page.locator('#scene-labels button').count(), 10);
    assert.equal(await page.locator('#scene').getAttribute('data-locations'), '10');
    pass('Ten destinations have model geometry, projected labels and directory buttons');
    await page.screenshot({ path: path.join(out, 'desktop.png') });
    await page.locator('#map-expand').click();
    await page.locator('#map-view').click();
    await page.waitForFunction(() => document.getElementById('scene').dataset.view === 'top');
    await page.screenshot({ path: path.join(out, 'overview.png') });
    for (const [key, term, title] of destinations) {
      await page.locator('#map-query').fill(term);
      await page.locator('#map-query').press('Enter');
      assert.equal(await page.locator('#place-title').innerText(), title);
      assert.match(await page.locator('#place-docs').innerText(), /尚未收录/);
      assert.equal(await page.locator('#place-ask').isVisible(), false);
      assert.ok((await page.locator('#place-agent').getAttribute('data-agent-prompt')).length > 10);
      await page.locator('#close-place').click();
    }
    pass('All six new locations support alias search, detail panels and honest availability');
    await page.locator('#places [data-place=stadium]').click();
    await page.screenshot({ path: path.join(out, 'stadium.png') });
    await page.locator('#place-agent').click();
    await page.waitForFunction(() => document.getElementById('agent-root').shadowRoot.getElementById('message-input').value.includes('体育场馆'));
    assert.equal(await page.locator('#knowledge-scope').inputValue(), 'chd_public');
    assert.equal(await page.locator('.message.user').count(), 0);
    pass('New location carries its own question to CHD assistant without automatic submission');
    await page.locator('.campus-return').click();
    await page.locator('#close-place').click();
    await page.locator('#map-query').fill('');
    await page.locator('#light-toggle').click();
    await page.screenshot({ path: path.join(out, 'night.png') });
    await page.locator('#light-toggle').click();
    await page.setViewportSize({ width: 375, height: 900 });
    await page.locator('#map-view').click();
    await page.screenshot({ path: path.join(out, 'mobile.png') });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    for (const [key, , title] of destinations) {
      await page.locator(`#places [data-place=${key}]`).click();
      assert.equal(await page.locator('#place-title').innerText(), title);
      await page.locator('#close-place').click();
    }
    pass('375px directory scrolls to all ten destinations without page overflow');
    await page.locator('#map-query').fill('门诊');
    await page.locator('#map-results button').click();
    await page.screenshot({ path: path.join(out, 'mobile-clinic.png') });
    const fallback = await context.newPage();
    await fallback.route('**/campus-world.js', r => r.abort());
    await fallback.goto('http://127.0.0.1:7860/');
    await fallback.waitForFunction(() => document.body.dataset.scene === 'fallback');
    assert.equal(await fallback.locator('#places button').count(), 10);
    await fallback.locator('#map-query').fill('闲置');
    await fallback.locator('#map-results button').click();
    assert.equal(await fallback.locator('#place-title').innerText(), '二手集市');
    pass('All destination buttons and new search work without WebGL');
    assert.deepEqual(errors, []);
    pass('No uncaught JavaScript errors');
    fs.writeFileSync(path.join(root, '04_Evaluation/campus_10_results.json'), JSON.stringify({ executed_at: new Date().toISOString(), checks, errors, locations: 10, real_geography: false, new_business_integrations: false }, null, 2));
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exit(1); });
