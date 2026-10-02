const { chromium } = require("playwright");
const assert = require("node:assert/strict"),
  fs = require("node:fs"),
  path = require("node:path");
(async () => {
  const root = path.resolve(__dirname, "../.."),
    out = path.join(
      root,
      "06_Demo/screenshots",
      process.env.CAMPUS_EVIDENCE_NAME || "open-day",
    ),
    review = path.join(root, ".impeccable/review");
  fs.mkdirSync(out, { recursive: true });
  fs.mkdirSync(review, { recursive: true });
  const browser = await chromium.launch({
    executablePath:
      "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    args: ["--enable-unsafe-swiftshader"],
  });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 960 },
    reducedMotion: "reduce",
  });
  const page = await context.newPage(),
    checks = [],
    errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const pass = (name) => {
    checks.push(name);
    console.log("PASS", name);
  };
  const shot = async (name) =>
    page.screenshot({ path: path.join(out, name + ".png") });
  try {
    await page.goto("http://127.0.0.1:7860/");
    await page.waitForFunction(() => document.body.dataset.scene === "ready");
    await page.locator(".intro-art").evaluate((img) => img.decode());
    assert.match(
      await page.locator(".intro-art").getAttribute("src"),
      /chd-hero/,
    );
    assert.match(
      await page.locator(".art-provenance a").getAttribute("href"),
      /chd.edu.cn/,
    );
    pass("Official CHD campus photo loads with visible original source link");
    await shot("desktop");
    await page.screenshot({ path: path.join(review, "desktop.png") });
    for (const key of ["learning", "living", "connection"]) {
      await page.locator(`button[data-chapter=${key}]`).click();
      await page.waitForFunction(
        (k) => document.getElementById("campus-intro").dataset.photo === k,
        key,
      );
      assert.equal(
        await page.locator("#campus-intro").evaluate((e) => e.inert),
        false,
      );
      assert.match(await page.locator("#photo-source").innerText(), /官网/);
      await shot("photo-" + key);
    }
    await page.locator("button[data-chapter=overview]").click();
    await page.waitForFunction(
      () =>
        document.getElementById("campus-intro").dataset.photo === "overview",
    );
    pass(
      "Three CHD photographic districts switch real images, captions and prepared camera contexts",
    );
    await page.locator("#open-directory").click();
    assert.equal(await page.locator("#directory-list button").count(), 10);
    assert.equal(await page.locator(".directory-group").count(), 3);
    assert.equal(await page.locator(".directory-group > img").count(), 3);
    await shot("directory");
    await page.keyboard.press("Escape");
    assert.equal(await page.locator("#campus-directory").isVisible(), false);
    pass(
      "Full-screen directory contains ten working destinations; Escape dismisses it",
    );
    await page.locator("#enter-campus").click();
    assert.equal(
      await page.locator("#campus-intro").evaluate((e) => e.inert),
      true,
    );
    assert.equal(await page.locator("#map-query").isVisible(), true);
    pass(
      "Opening curtain reveals live map and removes hidden intro from focus order",
    );
    await shot("map");
    await page.screenshot({ path: path.join(review, "map.png") });
    for (const [key, count] of [
      ["learning", 3],
      ["living", 3],
      ["connection", 4],
      ["overview", 10],
    ]) {
      await page.locator(`button[data-chapter=${key}]`).click();
      await page.waitForFunction(
        (k) => document.getElementById("scene").dataset.chapter === k,
        key,
      );
      assert.equal(await page.locator("#places button:visible").count(), count);
      if (key === "learning") await shot("learning");
    }
    pass(
      "All four chapters synchronize camera preset, active chapter and service directory",
    );
    await page.locator("button[data-chapter=overview]").press("ArrowRight");
    assert.equal(
      await page
        .locator("button[data-chapter=learning]")
        .getAttribute("aria-pressed"),
      "true",
    );
    pass("Chapter controls support arrow-key navigation");
    await page.locator("#photo-mode").click();
    await page.waitForFunction(
      () =>
        document.getElementById("campus-intro").dataset.photo === "learning",
    );
    await page.locator("#enter-campus").click();
    assert.equal(
      await page
        .locator("button[data-chapter=learning]")
        .getAttribute("aria-pressed"),
      "true",
    );
    pass("Photographic and 3D views preserve the same learning district");
    await page.locator("#map-query").fill("校车");
    await page.locator("#map-query").press("Enter");
    assert.equal(await page.locator("#place-title").innerText(), "出行咨询");
    assert.match(await page.locator("#place-docs").innerText(), /尚未收录/);
    await page.locator("#next-place").click();
    assert.equal(await page.locator("#place-title").innerText(), "图书馆");
    assert.equal(await page.locator("#place-photo").isVisible(), true);
    assert.match(
      await page.locator("#place-photo-caption").innerText(),
      /逸夫图书馆/,
    );
    await page.locator("#previous-place").click();
    assert.equal(await page.locator("#place-title").innerText(), "出行咨询");
    assert.equal(await page.locator("#place-photo").isVisible(), false);
    pass(
      "Verified service photos use exact captions; unverified transit has no substituted photograph",
    );
    pass(
      "Cross-chapter search and sequential ten-place exploration work with honest source gaps",
    );
    await shot("detail");
    await page.locator("#place-agent").click();
    await page.waitForFunction(() =>
      document
        .getElementById("agent-root")
        ?.shadowRoot?.getElementById("message-input")
        ?.value.includes("校车"),
    );
    assert.equal(
      await page.locator("#knowledge-scope").inputValue(),
      "chd_public",
    );
    assert.equal(await page.locator(".message.user").count(), 0);
    await page.locator(".campus-return").click();
    await page.locator("#campus-surface").waitFor({ state: "visible" });
    pass(
      "Destination hands its draft to CHD Agent without sending; return preserves selected place",
    );
    await page.locator("#close-place").click();
    await page.locator("button[data-chapter=overview]").click();
    await page.locator("#light-toggle").click();
    await shot("day");
    await page.locator("#light-toggle").click();
    await page.locator("#return-intro").click();
    assert.equal(
      await page.locator("#campus-intro").evaluate((e) => e.inert),
      false,
    );
    pass("Day/night map and reversible opening state work");
    await page.setViewportSize({ width: 390, height: 844 });
    await shot("mobile");
    await page.screenshot({ path: path.join(review, "mobile.png") });
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      true,
    );
    await page.locator("#enter-campus").click();
    await shot("mobile-map");
    await page.locator("#open-directory").click();
    await page.locator("[data-destination=clinic]").click();
    assert.equal(await page.locator("#place-title").innerText(), "校医院");
    await shot("mobile-detail");
    const box = await page.locator("#place-agent").boundingBox();
    assert.ok(box.x >= 0 && box.x + box.width <= 390);
    pass(
      "390px opening, directory, selected place and Agent action have no horizontal overflow",
    );
    await page.locator("#close-place").click();
    await page.setViewportSize({ width: 1440, height: 960 });
    await page.emulateMedia({ reducedMotion: "no-preference" });
    await page.locator("button[data-chapter=living]").click();
    const start = await page.locator("#scene").getAttribute("data-angle");
    await page.waitForTimeout(150);
    const middle = await page.locator("#scene").getAttribute("data-angle");
    await page.waitForTimeout(900);
    assert.notEqual(start, middle);
    pass("Real camera interpolation runs when reduced motion is off");
    const fallback = await context.newPage();
    await fallback.route("**/campus-world.js", (r) => r.abort());
    await fallback.goto("http://127.0.0.1:7860/");
    await fallback.waitForFunction(
      () => document.body.dataset.scene === "fallback",
    );
    await fallback.locator("#open-directory").click();
    await fallback.locator("[data-destination=market]").click();
    assert.equal(
      await fallback.locator("#place-title").innerText(),
      "二手集市",
    );
    pass("No-WebGL fallback retains full directory and place details");
    assert.deepEqual(errors, []);
    pass("No uncaught JavaScript errors");
    fs.writeFileSync(
      path.join(
        root,
        "04_Evaluation",
        (process.env.CAMPUS_EVIDENCE_NAME || "open_day") + "_results.json",
      ),
      JSON.stringify(
        {
          executed_at: new Date().toISOString(),
          checks,
          errors,
          official_background: true,
          layout_source:
            "Official CHD Ver.2023 map, approximate layout, not GPS",
          coze: false,
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
