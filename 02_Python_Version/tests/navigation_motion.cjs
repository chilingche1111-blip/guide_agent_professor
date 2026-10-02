const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

(async () => {
  const browser = await chromium.launch({
    executablePath:
      "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    args: ["--enable-unsafe-swiftshader"],
  });
  const checks = [],
    samples = [],
    errors = [];
  const base = process.env.CAMPUS_URL || "http://127.0.0.1:7860";
  try {
    for (const delay of [0, 800]) {
      const context = await browser.newContext({
        viewport: { width: 1440, height: 960 },
      });
      const page = await context.newPage();
      page.on("pageerror", (e) => errors.push(e.message));
      await page.route("**/api/**", async (route) => {
        if (/settings|conversations|knowledge/.test(route.request().url()))
          await new Promise((resolve) => setTimeout(resolve, delay));
        await route.continue();
      });
      await page.goto(base);
      await page.waitForFunction(() => document.body.dataset.scene === "ready");
      await page.evaluate(() => {
        window.navigationSample = { started: 0, gaps: [] };
        let last = performance.now();
        function frame(time) {
          if (navigationSample.started) navigationSample.gaps.push(time - last);
          last = time;
          requestAnimationFrame(frame);
        }
        requestAnimationFrame(frame);
        document.addEventListener(
          "click",
          (event) => {
            if (event.target.closest(".agent-entry"))
              navigationSample.started = performance.now();
          },
          true,
        );
      });
      await page.locator(".agent-entry").click();
      await page.locator("#agent-root").waitFor({ state: "visible" });
      const clickToVisibleMs = await page.evaluate(
        () => performance.now() - navigationSample.started,
      );
      assert.ok(
        clickToVisibleMs < 600,
        `Workspace shell blocked for ${clickToVisibleMs}ms`,
      );
      if (delay) {
        assert.equal(
          await page.locator("#agent-root").getAttribute("aria-busy"),
          "true",
        );
        assert.equal(
          await page.locator("#chat-view").evaluate((el) => el.inert),
          true,
        );
        assert.equal(
          await page
            .locator(".campus-return")
            .evaluate((el) => Boolean(el.closest("[inert]"))),
          false,
        );
      }
      await page.waitForFunction(
        () => !document.body.classList.contains("navigation-moving"),
      );
      const frameGaps = await page.evaluate(() => navigationSample.gaps);
      samples.push({
        apiDelayMs: delay,
        clickToVisibleMs: Math.round(clickToVisibleMs),
        maxFrameGapMs: Math.round(Math.max(0, ...frameGaps)),
      });
      if (delay) {
        await page.locator(".campus-return").click();
        await page.waitForFunction(
          () =>
            !document.body.classList.contains("navigation-moving") &&
            document.getElementById("agent-root").hidden,
        );
        checks.push(
          "Slow API: immediate shell, protected data controls, return available during hydration",
        );
        await page.locator(".agent-entry").click();
      }
      await page.waitForFunction(
        () => !document.getElementById("agent-root").hasAttribute("aria-busy"),
      );
      // Interrupt an in-flight entrance with history navigation, then enter again.
      await page.goBack();
      await page.waitForFunction(
        () => document.documentElement.dataset.navigation === "campus",
      );
      await page.goForward();
      await page.waitForFunction(
        () => document.documentElement.dataset.navigation === "agent",
      );
      await page.goBack();
      await page.waitForFunction(
        () =>
          document.getElementById("agent-root").hidden &&
          !document.body.classList.contains("navigation-moving"),
      );
      assert.equal(
        await page.locator("#campus-surface").evaluate((el) => el.inert),
        false,
      );
      checks.push(
        `Rapid back/forward settles correctly (${delay}ms API delay)`,
      );
      await context.close();
    }
    const mobile = await browser.newContext({
      viewport: { width: 375, height: 900 },
      isMobile: true,
      hasTouch: true,
      reducedMotion: "reduce",
    });
    const page = await mobile.newPage();
    page.on("pageerror", (e) => errors.push(e.message));
    await page.goto(base);
    await page.locator(".agent-entry").click();
    await page.waitForFunction(
      () =>
        !document.getElementById("agent-root").hidden &&
        !document.getElementById("agent-root").hasAttribute("aria-busy"),
    );
    assert.equal(
      await page.evaluate(() =>
        document.body.classList.contains("navigation-moving"),
      ),
      false,
    );
    assert.notEqual(
      await page.evaluate(
        () =>
          document.getElementById("agent-root").shadowRoot.activeElement?.id,
      ),
      "message-input",
    );
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth > innerWidth,
      ),
      false,
    );
    checks.push(
      "Reduced-motion mobile: no spatial animation, no unsolicited keyboard, no overflow",
    );
    await mobile.close();
    assert.deepEqual(errors, []);
    checks.push("No uncaught errors");
    const report = {
      timestamp: new Date().toISOString(),
      environment:
        "Local headless Chrome /1440x960 /software WebGL. Single-run diagnostics, not device FPS or statistical benchmark.",
      baseline: [
        { apiDelayMs: 0, clickToVisibleMs: 92 },
        { apiDelayMs: 800, clickToVisibleMs: 1298 },
      ],
      samples,
      checks,
      errors,
    };
    fs.writeFileSync(
      path.resolve(
        __dirname,
        "../../04_Evaluation/navigation_motion_results.json",
      ),
      JSON.stringify(report, null, 2),
    );
    console.log(JSON.stringify(report, null, 2));
  } finally {
    await browser.close();
  }
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
