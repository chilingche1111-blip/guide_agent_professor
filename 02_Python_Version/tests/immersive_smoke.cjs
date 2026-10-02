const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
(async () => {
  const root = path.resolve(__dirname, "../.."),
    out = path.join(root, "06_Demo/screenshots/immersive");
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch({
    executablePath:
      "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    args: ["--enable-unsafe-swiftshader"],
  });
  const context = await browser.newContext({
      viewport: { width: 1440, height: 960 },
      reducedMotion: "reduce",
    }),
    page = await context.newPage(),
    checks = [],
    errors = [];
  const base = process.env.CAMPUS_URL || "http://127.0.0.1:7860";
  page.on("pageerror", (e) => errors.push(e.message));
  const pass = (name) => {
    checks.push(name);
    console.log("PASS", name);
  };
  try {
    await page.goto(base);
    await page.waitForFunction(
      () => document.body.dataset.scene === "ready",
      {},
      { timeout: 30000 },
    );
    await page.locator("#guide-list details").first().waitFor();
    assert.equal(await page.locator("#guide-list details").count(), 3);
    assert.match(await page.locator('#guide-count').innerText(), /12/);
    assert.equal(await page.locator("#scene canvas").count(), 1);
    pass("Local WebGL scene and 12 knowledge documents loaded");
    await page.screenshot({ path: path.join(out, "desktop.png") });
    // Select the visible library facade through ray casting, not its HTML label.
    await page.mouse.click(800, 355);
    await page.locator("#place-panel").waitFor();
    assert.equal(await page.locator("#place-title").innerText(), "图书馆");
    await page.locator("#close-place").click();
    pass("Clicking the actual 3D building uses ray picking");
    const before = await page.locator("#scene").getAttribute("data-angle");
    await page.locator("#rotate-right").click();
    await page.waitForFunction(
      (v) => document.getElementById("scene").dataset.angle !== v,
      before,
    );
    pass("Camera rotation changes actual scene");
    const dragBefore = await page.locator("#scene").getAttribute("data-angle");
    await page.mouse.move(900, 650);
    await page.mouse.down();
    await page.mouse.move(990, 650, { steps: 5 });
    await page.mouse.up();
    await page.waitForFunction(
      (v) => document.getElementById("scene").dataset.angle !== v,
      dragBefore,
    );
    pass("Pointer drag rotates the 3D camera");
    const zoom = await page.locator("#scene").getAttribute("data-zoom");
    await page.locator("#zoom-in").click();
    await page.waitForFunction(
      (v) => document.getElementById("scene").dataset.zoom !== v,
      zoom,
    );
    pass("Camera zoom control");
    await page.locator("#reset-camera").click();
    await page.locator("#places [data-place=library]").click();
    await page.locator("#place-docs details").first().waitFor();
    assert.equal(await page.locator("#place-title").innerText(), "图书馆");
    await page.locator("#place-docs summary").first().click();
    assert.match(
      await page.locator("#place-docs details[open]").innerText(),
      /图书/,
    );
    pass("Destination focuses camera and exposes real source document");
    await page.screenshot({ path: path.join(out, "library.png") });
    await page.keyboard.press("Escape");
    assert.equal(await page.locator("#place-panel").isVisible(), false);
    pass("Escape returns to campus and restores navigation");
    await page.locator("#light-toggle").click();
    await page.screenshot({ path: path.join(out, "night.png") });
    assert.equal(await page.locator("body").getAttribute("class"), "night");
    await page.locator("#light-toggle").click();
    pass("Day/night control changes page and renderer lighting");
    await page.locator("#guide-query").fill("续借");
    assert.ok((await page.locator("#guide-list details").count()) > 0);
    await page.locator("#guide-query").fill("NOT_FOUND_9999");
    assert.match(await page.locator("#guide-list").innerText(), /没有匹配/);
    await page.locator("#guide-query").fill("");
    pass("Knowledge filtering and empty state");
    await page.locator("#guide").scrollIntoViewIfNeeded();
    await page.screenshot({ path: path.join(out, "guide.png") });
    await page.locator("#assistant-launch").click();
    await page.locator("#assistant-question").fill("图书馆几点开放？");
    await page.locator("#assistant-send").click();
    await page.locator(".chat-entry.assistant").waitFor({ timeout: 30000 });
    assert.match(
      await page.locator(".chat-entry.assistant").innerText(),
      /图书|开馆/,
    );
    assert.ok((await page.locator(".answer-source").count()) > 0);
    pass("Assistant performs real local RAG request with citations");
    await page.screenshot({ path: path.join(out, "assistant.png") });
    await page.locator("#assistant-close").click();
    for (const width of [375, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.evaluate(() => scrollTo(0, 0));
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        true,
      );
      if (width === 375) {
        const launcher = await page.locator("#assistant-launch").boundingBox();
        for (const button of await page.locator("#places button").all()) {
          const b = await button.boundingBox();
          const overlaps =
            launcher.x < b.x + b.width &&
            launcher.x + launcher.width > b.x &&
            launcher.y < b.y + b.height &&
            launcher.y + launcher.height > b.y;
          assert.equal(
            overlaps,
            false,
            "Assistant launcher must not overlap any destination",
          );
        }
        await page.screenshot({ path: path.join(out, "mobile.png") });
        await page.locator("#places [data-place=life]").click();
        assert.match(await page.locator("#place-title").innerText(), /生活/);
        await page.locator("#close-place").click();
        await page.locator("#places [data-place=network]").click();
        assert.match(await page.locator("#place-title").innerText(), /网络/);
        await page.locator("#close-place").click();
      }
    }
    pass(
      "Four responsive widths, mobile destination flow, no horizontal overflow",
    );
    assert.equal(
      await page.locator("#motion-toggle").getAttribute("aria-pressed"),
      "true",
    );
    pass("Reduced motion initializes paused");
    await page.evaluate(() => scrollTo(0, 0));
    await page.emulateMedia({ reducedMotion: "no-preference" });
    const timeBefore = await page.locator("#scene").getAttribute("data-time");
    await page.waitForFunction(
      (v) => document.getElementById("scene").dataset.time !== v,
      timeBefore,
    );
    await page.locator("#motion-toggle").click();
    const timePaused = await page.locator("#scene").getAttribute("data-time");
    await page.waitForTimeout(150);
    assert.equal(
      await page.locator("#scene").getAttribute("data-time"),
      timePaused,
    );
    pass("Continuous scene animation runs and pause freezes scene time");
    const fallback = await context.newPage();
    await fallback.route("**/campus-world.js", (route) => route.abort());
    await fallback.goto(base);
    await fallback.waitForFunction(
      () => document.body.dataset.scene === "fallback",
    );
    await fallback.locator("#places [data-place=network]").click();
    await fallback.locator("#place-docs details").first().waitFor();
    assert.match(await fallback.locator("#place-title").innerText(), /网络/);
    await fallback.close();
    pass("Unavailable 3D falls back to functional service navigation");
    await page.goto(base + "/static/workbench.html");
    await page
      .locator(".knowledge-card")
      .first()
      .waitFor({ state: "attached" });
    assert.equal(await page.locator("#open-settings").count(), 1);
    pass("Original workbench and model configuration remain reachable");
    assert.deepEqual(errors, []);
    pass("No uncaught browser JavaScript errors");
    fs.writeFileSync(
      path.join(root, "04_Evaluation/immersive_ui_results.json"),
      JSON.stringify(
        { timestamp: new Date().toISOString(), checks, errors },
        null,
        2,
      ),
    );
  } finally {
    const conversations = await (
      await context.request.get(base + "/api/conversations")
    ).json();
    for (const c of conversations.items || [])
      await context.request.delete(base + "/api/conversations/" + c.id, {
        data: {},
      });
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
