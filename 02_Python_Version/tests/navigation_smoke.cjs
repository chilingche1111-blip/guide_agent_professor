const { chromium } = require("playwright"),
  assert = require("node:assert/strict"),
  fs = require("node:fs"),
  path = require("node:path");
(async () => {
  const root = path.resolve(__dirname, "../.."),
    out = path.join(root, "06_Demo/screenshots", process.env.CAMPUS_EVIDENCE_NAME || "agent-navigation");
  fs.mkdirSync(out, { recursive: true });
  const base = process.env.CAMPUS_URL || "http://127.0.0.1:7860";
  const browser = await chromium.launch({
    executablePath:
      "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    args: ["--enable-unsafe-swiftshader"],
  });
  const context = await browser.newContext({
      viewport: { width: 1440, height: 960 },
    }),
    page = await context.newPage(),
    checks = [],
    errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  const pass = (name) => {
    checks.push(name);
    console.log("PASS", name);
  };
  try {
    await page.goto(base);
    await page.locator("#guide-list details").first().waitFor();
    await page.waitForFunction(() => document.body.dataset.scene === "ready");
    assert.equal(await page.locator("#guide-list details").count(), 3);
    assert.match(await page.locator("#guide-count").innerText(), /12/);
    assert.ok((await page.locator("#guide").boundingBox()).height < 460);
    pass("Compact guide previews3 of12 documents in less than460px");
    await page.evaluate(() => {
      window.initialCanvas = document.querySelector("#scene canvas");
      window.initialTimeOrigin = performance.timeOrigin;
    });
    await page.screenshot({ path: path.join(out, "campus.png") });
    await page.locator("#assistant-launch").click();
    await page.locator("#assistant-question").fill("校园卡丢失需要哪些材料？");
    await page.locator(".workbench-link").click();
    await page.locator("#agent-root").waitFor({ state: "visible" });
    await page.waitForFunction(
      () => !document.body.classList.contains("navigation-moving"),
    );
    assert.equal(
      await page.locator("#message-input").inputValue(),
      "校园卡丢失需要哪些材料？",
    );
    assert.equal(
      await page.evaluate(
        () => performance.timeOrigin === window.initialTimeOrigin,
      ),
      true,
    );
    assert.match(page.url(), /#agent$/);
    pass("Same-document Agent entry transfers draft with no page reload");
    await page.screenshot({ path: path.join(out, "agent.png") });
    await page.locator("#open-settings").click();
    await page.locator("#settings-dialog").waitFor({ state: "visible" });
    assert.ok((await page.locator("#provider-select option").count()) > 3);
    await page.keyboard.press("Escape");
    pass("Full model configuration works inside mounted workspace");
    await page.locator("#message-input").fill("保留这份未发送草稿");
    await page.locator(".campus-return").click();
    await page.locator("#campus-surface").waitFor({ state: "visible" });
    await page.waitForFunction(
      () => !document.body.classList.contains("navigation-moving"),
    );
    assert.equal(
      await page.evaluate(
        () => document.querySelector("#scene canvas") === window.initialCanvas,
      ),
      true,
    );
    await page.locator(".agent-entry").click();
    await page.locator("#agent-root").waitFor({ state: "visible" });
    await page.waitForFunction(
      () => !document.body.classList.contains("navigation-moving"),
    );
    assert.equal(
      await page.locator("#message-input").inputValue(),
      "保留这份未发送草稿",
    );
    pass("Campus canvas and Agent draft survive round trip");
    await page.goBack();
    await page.locator("#campus-surface").waitFor({ state: "visible" });
    await page.goForward();
    await page.locator("#agent-root").waitFor({ state: "visible" });
    pass("Browser back and forward restore correct view");
    await page.locator("#knowledge-scope").selectOption("simulation");
    await page.locator("#doc-count").filter({ hasText: "12" }).waitFor();
    await page.locator("#message-input").fill("图书馆几点开放？");
    await page.locator("#send-button").click();
    await page.locator(".message.assistant").waitFor({ timeout: 30000 });
    assert.match(await page.locator(".answer").innerText(), /图书馆|开馆/);
    pass("Mounted Agent performs real RAG request");
    await page.locator("#theme-toggle").click();
    assert.equal(
      await page.locator("#agent-root").getAttribute("data-theme"),
      "dark",
    );
    await page.locator("#agent-root").evaluate((el) => {
      for (const node of [el, ...el.shadowRoot.querySelectorAll("*")])
        node.getAnimations().forEach((a) => a.finish());
    });
    assert.equal(
      await page
        .locator("#agent-root")
        .evaluate((el) => getComputedStyle(el).backgroundColor),
      "rgb(16, 28, 48)",
    );
    await page.screenshot({ path: path.join(out, "agent-night.png") });
    await page.locator("#theme-toggle").click();
    pass("Isolated Agent theme toggles without corrupting campus styles");
    await page.locator(".campus-return").click();
    await page.locator("#campus-surface").waitFor({ state: "visible" });
    await page.locator("#assistant-messages .chat-entry.assistant").waitFor();
    // The campus becomes visible before asynchronous conversation sync finishes.
    await page.waitForFunction(() =>
      /图书馆|开馆/.test(
        document.getElementById("assistant-messages").textContent,
      ),
    );
    assert.match(
      await page.locator("#assistant-messages").innerText(),
      /图书馆|开馆/,
    );
    pass("Campus assistant syncs the same conversation after return");
    await page.locator("#assistant-close").click();
    await page.locator("#guide").scrollIntoViewIfNeeded();
    await page.screenshot({ path: path.join(out, "quick-guide.png") });
    await page.locator("[data-agent-view=knowledge]").click();
    await page.locator("#knowledge-view").waitFor({ state: "visible" });
    assert.equal(await page.locator(".knowledge-card").count(), 12);
    pass("Compact guide directly opens full12document knowledge space");
    await page.locator(".campus-return").click();
    await page.locator("#campus-surface").waitFor({ state: "visible" });
    await page.setViewportSize({ width: 375, height: 900 });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.evaluate(() => scrollTo({ top: 0, behavior: "instant" }));
    await page.screenshot({ path: path.join(out, "mobile-campus.png") });
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      true,
    );
    await page.locator(".agent-entry").click();
    await page.locator("#agent-root").waitFor({ state: "visible" });
    assert.equal(
      await page
        .locator("#agent-root")
        .evaluate((el) => el.scrollWidth <= el.clientWidth),
      true,
    );
    await page.screenshot({ path: path.join(out, "mobile-agent.png") });
    await page.locator("#menu-toggle").click();
    await page.locator("#open-settings").click();
    await page.locator("#settings-dialog").waitFor({ state: "visible" });
    await page.keyboard.press("Escape");
    pass("Mobile navigation, reduced-motion entry, and settings remain usable");
    await page.reload();
    await page.locator("#agent-root").waitFor({ state: "visible" });
    await page.locator(".message.assistant").waitFor();
    pass("Direct Agent hash reload restores persisted conversation");
    const fallback = await context.newPage();
    await fallback.addInitScript(() => {
      document.startViewTransition = undefined;
    });
    await fallback.goto(base);
    await fallback.locator(".agent-entry").click();
    await fallback.locator("#agent-root").waitFor({ state: "visible" });
    await fallback.close();
    pass("No View Transition API fallback stays functional");
    assert.deepEqual(errors, []);
    pass("No uncaught browser errors");
    fs.writeFileSync(
      path.join(root, "04_Evaluation", process.env.CAMPUS_EVIDENCE_NAME ? process.env.CAMPUS_EVIDENCE_NAME + "_navigation.json" : "agent_navigation_results.json"),
      JSON.stringify(
        { timestamp: new Date().toISOString(), checks, errors },
        null,
        2,
      ),
    );
  } finally {
    const data = await (
      await context.request.get(base + "/api/conversations")
    ).json();
    for (const c of data.items || [])
      await context.request.delete(base + "/api/conversations/" + c.id, {
        data: {},
      });
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
