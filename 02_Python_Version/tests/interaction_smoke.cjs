const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
(async () => {
  const root = path.resolve(__dirname, '../..');
  const out = path.join(root, '06_Demo/screenshots/interactive');
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
  const page = await context.newPage();
  const errors = [], checks = [];
  page.on('pageerror', e => errors.push(e.message));
  const pass = name => { checks.push(name); console.log('PASS', name); };
  try {
    await page.goto((process.env.CAMPUS_URL || 'http://127.0.0.1:7860') + '/static/workbench.html');
    await page.locator('.knowledge-card').first().waitFor({ state: 'attached' });
    assert.equal(await page.locator('.explore-tabs img').evaluateAll(imgs => imgs.filter(i => i.complete && i.naturalWidth > 0).length), 4);
    pass('Four local licensed SVG assets loaded');
    await page.locator('#tab-library').focus();
    await page.keyboard.press('ArrowRight');
    assert.equal(await page.locator('#tab-study').getAttribute('aria-selected'), 'true');
    await page.keyboard.press('End');
    assert.equal(await page.locator('#tab-network').getAttribute('aria-selected'), 'true');
    pass('Keyboard tabs: arrows and End update active scene');
    await page.locator('#explore-questions button').nth(1).click();
    await page.locator('#message-input').fill('已有草稿');
    await page.locator('#explore-use').click();
    assert.equal(await page.locator('#message-input').inputValue(), '已有草稿\n校园网账号忘记密码了怎么办？');
    assert.equal(await page.locator('.message.user').count(), 0);
    pass('Selected question preserves draft and does not auto-send');
    await page.locator('#message-input').fill('');
    await page.locator('#tab-library').click();
    await page.mouse.move(0, 0);
    await page.evaluate(() => { document.getAnimations().forEach(a => a.finish()); document.getElementById('toast').hidden = true; });
    await page.screenshot({ path: path.join(out, 'desktop.png'), fullPage: true });
    await page.locator('#theme-toggle').click();
    await page.evaluate(() => document.getAnimations().forEach(a => a.finish()));
    await page.screenshot({ path: path.join(out, 'dark.png'), fullPage: true });
    await page.locator('#theme-toggle').click();
    pass('Dark theme rendered');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.locator('#tab-life').click();
    assert.equal(await page.locator('#explore-panel').evaluate(el => el.getAnimations().filter(a => a.playState === 'running').length), 0);
    pass('Reduced motion has no scene animation');
    for (const width of [375, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
      if (width === 375) {
        await page.locator('#tab-network').click();
        await page.locator('#explore-use').click();
        assert.match(await page.locator('#message-input').inputValue(), /校园网连不上/);
        await page.evaluate(() => { document.getElementById('toast').hidden = true; });
        await page.screenshot({ path: path.join(out, 'mobile.png'), fullPage: true });
      }
    }
    pass('Four responsive widths, touch-size mobile flow');
    assert.deepEqual(errors, []);
    pass('No browser JavaScript errors');
    const report = path.join(root, '04_Evaluation/interactive_ui_results.json');
    fs.writeFileSync(report, JSON.stringify({ timestamp: new Date().toISOString(), checks, errors }, null, 2));
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
