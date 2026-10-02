const { chromium } = require("playwright"),
  assert = require("node:assert/strict"),
  fs = require("node:fs"),
  path = require("node:path");
(async () => {
  const root = path.resolve(__dirname, "../.."),
    out = path.join(root, "06_Demo/screenshots/college-film");
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch({
    executablePath:
      "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    args: ["--enable-unsafe-swiftshader"],
  });
  const page = await browser.newPage({
      viewport: { width: 1440, height: 960 },
      reducedMotion: "no-preference",
    }),
    checks = [],
    errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const pass = (n) => {
    checks.push(n);
    console.log("PASS", n);
  };
  const ready = () =>
    page.waitForFunction(
      () => document.getElementById("landmark-scene").dataset.state === "ready",
    );
  const back = async () => {
    await page.locator("#landmark-back").click();
    await page.waitForFunction(
      () => document.getElementById("landmark-scene").hidden,
    );
    await page.waitForTimeout(450);
  };
  try {
    await page.goto("http://127.0.0.1:7860/");
    await page.waitForFunction(() => document.body.dataset.scene === "ready");
    await page.locator("#enter-campus").click();
    await page.waitForTimeout(700);
    assert.equal(await page.locator("#places button").count(), 7);
    assert.equal(await page.locator("#directory-list button").count(), 7);
    assert.equal(await page.locator(".map-label").count(), 7);
    for (const key of [
      "network",
      "dining",
      "stadium",
      "clinic",
      "market",
      "transit",
    ])
      assert.equal(
        await page.locator(`#places [data-place=${key}]`).count(),
        0,
      );
    pass(
      "Seven photo-backed destinations populate map, rail and directory; unpictured services remain outside the map",
    );
    await page.screenshot({ path: path.join(out, "map.png") });
    await page.locator("#open-directory").click();
    assert.equal(await page.locator(".directory-group").count(), 3);
    await page
      .locator("#campus-directory")
      .evaluate((e) =>
        Promise.all(e.getAnimations().map((a) => a.finished.catch(() => {}))),
      );
    await page.screenshot({ path: path.join(out, "directory.png") });
    await page.keyboard.press("Escape");
    assert.equal(await page.locator("#campus-directory").isVisible(), false);
    pass(
      "Seven-landmark directory separates academic clusters and retains keyboard dismissal",
    );
    await page.locator("#rotate-left").click();
    await page.waitForTimeout(750);
    const angle = Number(
        await page.locator("#scene").getAttribute("data-angle"),
      ),
      zoom = Number(await page.locator("#scene").getAttribute("data-zoom"));
    await page.locator(".map-label[data-place=library]").click();
    await page.waitForFunction(
      () =>
        [...document.querySelectorAll(".landmark-image")].some((e) => {
          const opacity = Number(getComputedStyle(e).opacity);
          return opacity > 0 && opacity < 1;
        }),
      undefined,
      { timeout: 3000 },
    );
    assert.equal(
      await page.locator("#landmark-scene").getAttribute("data-state"),
      "entering",
    );
    await page.screenshot({ path: path.join(out, "transition.png") });
    await ready();
    const box = await page.locator("#landmark-scene").boundingBox();
    assert.equal(box.width, 1440);
    assert.ok(box.height >= 950);
    assert.equal(await page.locator("#place-photo").isVisible(), false);
    assert.equal(await page.locator("#map-query").isVisible(), false);
    assert.ok(
      Number(await page.locator("#scene").getAttribute("data-zoom")) < zoom,
    );
    await page.screenshot({ path: path.join(out, "library.png") });
    pass(
      "Clicking a map landmark pushes the camera and crossfades the correct photo into a full-surface background",
    );
    await back();
    assert.ok(
      Math.abs(
        Number(await page.locator("#scene").getAttribute("data-angle")) - angle,
      ) < 0.02,
    );
    assert.ok(
      Math.abs(
        Number(await page.locator("#scene").getAttribute("data-zoom")) - zoom,
      ) < 0.05,
    );
    pass(
      "Reverse cut restores the previous rotated map camera rather than resetting the chapter",
    );
    for (const [key, photo] of [
      ["study", "chd-learning"],
      ["life", "chd-living"],
      ["activities", "chd-activities"],
      ["highway", "chd-highway"],
      ["materials", "chd-materials"],
      ["information", "chd-information"],
    ]) {
      await page.locator(`#places [data-place=${key}]`).click();
      await ready();
      const src = await page
        .locator(".landmark-image")
        .evaluateAll((imgs) =>
          imgs
            .filter((e) => Number(getComputedStyle(e).opacity) > 0.9)
            .map((e) => e.src),
        );
      assert.ok(src.some((s) => s.includes(photo)));
      if (["highway", "materials", "information"].includes(key)) {
        const source = await page
          .locator("#landmark-credit")
          .getAttribute("href");
        assert.match(
          source,
          key === "information" ? /ticvse\.chd\.edu\.cn/ : /jjc\.chd\.edu\.cn/,
        );
      }
      await page.screenshot({ path: path.join(out, key + ".png") });
      await back();
    }
    pass(
      "All seven landmarks use matching real photographs; college credits link to their specific official articles",
    );
    await page.locator("#places [data-place=library]").click();
    await page.waitForTimeout(150);
    await page.locator("#landmark-back").click();
    await page.waitForTimeout(650);
    assert.equal(await page.locator("#landmark-scene").isVisible(), false);
    assert.equal(
      await page
        .locator("#map-query")
        .evaluate((e) => e.closest(".map-toolbar").inert),
      false,
    );
    await page.locator("#places [data-place=library]").click();
    await page.locator("#next-place").evaluate((e) => e.click());
    await page.locator("#next-place").evaluate((e) => e.click());
    await ready();
    assert.equal(
      await page.locator("#landmark-scene").getAttribute("data-place"),
      "life",
    );
    pass(
      "Early back and rapid successive selections cancel stale animation/image completions",
    );
    await page.locator("#place-agent").click();
    await page.waitForFunction(() =>
      document.body.classList.contains("agent-mode"),
    );
    await page.waitForTimeout(450);
    assert.equal(
      await page.locator("#knowledge-scope").inputValue(),
      "chd_public",
    );
    assert.match(await page.locator("#message-input").inputValue(), /校园卡/);
    assert.equal(await page.locator(".message.user").count(), 0);
    await page.locator(".campus-return").click();
    await page.waitForFunction(
      () => !document.body.classList.contains("agent-mode"),
    );
    assert.equal(
      await page.locator("#landmark-scene").getAttribute("data-place"),
      "life",
    );
    pass(
      "Photo scene hands an unsent draft to the existing Agent and survives the return",
    );
    await back();
    await page.setViewportSize({ width: 390, height: 844 });
    await page.locator("#places [data-place=library]").click();
    await ready();
    await page.screenshot({ path: path.join(out, "mobile-library.png") });
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    );
    await page.locator("#place-agent").scrollIntoViewIfNeeded();
    const action = await page.locator("#place-agent").boundingBox();
    assert.ok(action.x >= 0 && action.x + action.width <= 390);
    pass(
      "390px full-photo scene preserves readable copy, return and Agent actions without horizontal overflow",
    );
    await back();
    await page.locator("#map-query").fill("材料");
    await page.locator("#map-results button").click();
    await ready();
    assert.equal(
      await page.locator("#landmark-scene").getAttribute("data-place"),
      "materials",
    );
    assert.match(await page.locator("#place-description").innerText(), /中庭/);
    await page.screenshot({ path: path.join(out, "mobile-materials.png") });
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    );
    await back();
    await page.locator("#map-query").fill("");
    pass(
      "College search opens the correct real interior on mobile without overflow",
    );
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.locator("#places [data-place=study]").click();
    await ready();
    assert.equal(
      await page
        .locator("#landmark-scene")
        .evaluate(
          (e) =>
            e
              .getAnimations({ subtree: true })
              .filter((a) => a.playState === "running").length,
        ),
      0,
    );
    pass(
      "Reduced motion shows the same photo/content state without spatial animation",
    );
    const broken = await browser.newPage({
      viewport: { width: 1280, height: 800 },
      reducedMotion: "reduce",
    });
    await broken.route("**/chd-learning-web.jpg", (r) => r.abort());
    await broken.goto("http://127.0.0.1:7860/");
    await broken.waitForFunction(() => document.body.dataset.scene === "ready");
    await broken.locator("#enter-campus").click();
    await broken.locator("#places [data-place=study]").click();
    await broken.waitForFunction(() =>
      document
        .getElementById("chapter-status")
        .textContent.includes("实景照片暂时无法加载"),
    );
    assert.equal(await broken.locator("#landmark-scene").isVisible(), false);
    assert.equal(await broken.locator("#place-panel").isVisible(), true);
    await broken.close();
    pass(
      "A failed photo keeps a usable map/service fallback rather than a blank full-screen scene",
    );
    const fallback = await browser.newPage({ reducedMotion: "reduce" });
    await fallback.route("**/campus-world.js", (r) => r.abort());
    await fallback.goto("http://127.0.0.1:7860/");
    await fallback.waitForFunction(
      () => document.body.dataset.scene === "fallback",
    );
    await fallback.locator("#open-directory").click();
    await fallback.locator("[data-destination=activities]").click();
    await fallback.waitForFunction(
      () => document.getElementById("landmark-scene").dataset.state === "ready",
    );
    assert.match(
      await fallback.locator("#landmark-credit").innerText(),
      /文化艺术中心/,
    );
    await fallback.close();
    pass(
      "No-WebGL fallback retains the full-photo destination route and Agent entry",
    );
    assert.deepEqual(errors, []);
    pass("No uncaught browser errors");
    fs.writeFileSync(
      path.join(root, "04_Evaluation/college_film_results.json"),
      JSON.stringify(
        {
          executed_at: new Date().toISOString(),
          checks,
          errors,
          interactive_landmarks: 7,
          scope:
            "Synthetic headless browser functional/motion checks, not physical-device FPS",
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
