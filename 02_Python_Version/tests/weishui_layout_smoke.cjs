const { chromium } = require("playwright"),
  assert = require("node:assert/strict"),
  fs = require("node:fs"),
  path = require("node:path");
(async () => {
  const root = path.resolve(__dirname, "../.."),
    browser = await chromium.launch({
      executablePath:
        "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      args: ["--enable-unsafe-swiftshader"],
    });
  const page = await browser.newPage({
      viewport: { width: 1440, height: 960 },
      reducedMotion: "reduce",
    }),
    checks = [],
    errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const pass = (n) => {
    checks.push(n);
    console.log("PASS", n);
  };
  async function noCollisions() {
    const collisions = await page
      .locator(".map-label:visible")
      .evaluateAll((els) => {
        const boxes = els.map((e) => ({
          name: e.textContent,
          r: e.getBoundingClientRect(),
        }));
        return boxes.flatMap((a, i) =>
          boxes
            .slice(i + 1)
            .filter(
              (b) =>
                a.r.left < b.r.right &&
                a.r.right > b.r.left &&
                a.r.top < b.r.bottom &&
                a.r.bottom > b.r.top,
            )
            .map((b) => [a.name, b.name]),
        );
      });
    assert.deepEqual(collisions, []);
  }
  try {
    await page.goto("http://127.0.0.1:7860/");
    await page.waitForFunction(() => document.body.dataset.scene === "ready");
    const data = await page.evaluate(async () => {
      const { layout, communities, mapLabels } = await import(
        "/static/campus-layout.js"
      );
      return { layout, communities, mapLabels };
    });
    assert.ok(data.layout.study.position[0] < data.layout.library.position[0]);
    assert.ok(data.layout.study.position[2] > data.layout.library.position[2]);
    assert.ok(data.layout.clinic.position[0] > data.layout.library.position[0]);
    assert.ok(data.layout.clinic.position[2] > data.layout.library.position[2]);
    assert.equal(data.communities.length, 3);
    assert.equal(
      data.communities.reduce((n, c) => n + c.blocks.length, 0),
      23,
    );
    assert.equal(data.mapLabels.filter((p) => p.key === "stadium").length, 2);
    pass(
      "Source-relative layout keeps library/teaching/clinic quadrants, two sports grounds and 23 dorm blocks across three communities",
    );
    for (const key of ["market", "network", "transit"]) {
      assert.equal(data.layout[key].virtual, true);
      assert.equal(data.layout[key].position, null);
      assert.equal(
        await page.locator(`.map-label[data-place=${key}]`).count(),
        0,
      );
    }
    assert.match(
      await page.locator("#map-source").getAttribute("href"),
      /xfjy.chd.edu.cn/,
    );
    pass(
      "Three online services have no invented map coordinates and official map source is linked",
    );
    await page.locator("#enter-campus").click();
    await page.waitForTimeout(100);
    await noCollisions();
    await page.locator("#map-view").click();
    await page.waitForTimeout(100);
    assert.equal(await page.locator("#scene").getAttribute("data-view"), "top");
    assert.ok(
      Math.abs(
        Number(await page.locator("#scene").getAttribute("data-angle")),
      ) < 0.01,
    );
    await noCollisions();
    await page.screenshot({
      path: path.join(root, "06_Demo/screenshots/weishui/north-plan.png"),
    });
    pass("North-up plan control and desktop map labels avoid overlap");
    // Exercise the explicit eastern community, independent of which labels collision suppression reveals.
    await page
      .locator(".map-label")
      .filter({ hasText: "东区生活社区" })
      .evaluate((e) => e.click());
    await page.waitForTimeout(100);
    const target = JSON.parse(
      await page.locator("#scene").getAttribute("data-focus-position"),
    );
    assert.ok(target[0] > 0);
    assert.equal(await page.locator("#place-title").innerText(), "生活社区");
    assert.equal(await page.locator("#place-photo").isVisible(), false);
    pass(
      "Eastern dorm cluster retains its clicked position and does not use a western community photo",
    );
    await page.locator("#close-place").click();
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.locator("button[data-chapter=living]").click();
    await page.waitForTimeout(1800);
    const before = await page
      .locator("#scene")
      .getAttribute("data-render-count");
    await page.waitForTimeout(450);
    assert.equal(
      await page.locator("#scene").getAttribute("data-render-count"),
      before,
    );
    pass("Static scene stops rendering after camera settles");
    await page.locator("button[data-chapter=overview]").click();
    await page.setViewportSize({ width: 390, height: 844 });
    await page.waitForTimeout(1000);
    await noCollisions();
    await page.locator("#open-directory").click();
    await page.locator("[data-destination=clinic]").click();
    await page.waitForTimeout(500);
    const panel = await page.locator("#place-panel").boundingBox(),
      source = await page.locator("#map-source").boundingBox();
    assert.ok(panel.y + panel.height < source.y);
    assert.equal(await page.locator("#scene-hint").isVisible(), false);
    await page.locator("#place-agent").scrollIntoViewIfNeeded();
    const cta = await page.locator("#place-agent").boundingBox();
    assert.ok(cta.y >= panel.y && cta.y + cta.height <= panel.y + panel.height);
    pass(
      "390px selected panel does not overlap source/rail and Agent action is reachable",
    );
    await page.locator("#close-place").click();
    await page.locator("#return-intro").click();
    await page.evaluate(() => document.fonts.ready);
    assert.equal(
      await page.evaluate(() => document.fonts.check('600 24px "Campus Noto"')),
      true,
    );
    pass("Self-hosted Chinese display font loads");
    assert.deepEqual(errors, []);
    pass("No uncaught JavaScript errors");
    fs.writeFileSync(
      path.join(root, "04_Evaluation/weishui_layout_results.json"),
      JSON.stringify(
        {
          executed_at: new Date().toISOString(),
          checks,
          errors,
          source: "https://xfjy.chd.edu.cn/info/1024/12168.htm",
          source_map_version: "2023",
          not_gps: true,
        },
        null,
        2,
      ),
    );
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
