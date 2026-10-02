/* Run with NODE_PATH pointing to Playwright, or npm install --no-save playwright.
 * Uses an isolated browser context; never reads an existing browser profile. */
const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "../..");
const evidenceName = process.env.CAMPUS_EVIDENCE_NAME || 'v2';
const out = path.join(root, '06_Demo/screenshots', evidenceName);
const reportPath = path.join(root, '04_Evaluation', evidenceName, 'browser_results.json');
const base = process.env.CAMPUS_URL || "http://127.0.0.1:7860";
const checks = [];
function pass(name) {
  checks.push({ name, passed: true });
  console.log("PASS", name);
}
(async () => {
  fs.mkdirSync(out, { recursive: true });
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  const executablePath =
    process.env.CHROME_PATH ||
    (process.platform === "darwin"
      ? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
      : undefined);
  const browser = await chromium.launch({ executablePath });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
    reducedMotion: "reduce",
  });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  try {
    await page.goto(base + '/static/workbench.html');
    await page.waitForSelector(".knowledge-card", { state: "attached" });
    await page.locator("#knowledge-scope").selectOption("simulation");
    await page.waitForFunction(() => document.querySelectorAll('.knowledge-card').length === 12);
    assert.equal(await page.locator(".knowledge-card").count(), 12);
    pass("12 built-in knowledge documents loaded");
    await page.screenshot({
      path: path.join(out, "01_home_desktop.png"),
      fullPage: true,
    });
    await page.locator("[data-prompt]").first().click();
    await page.locator("#send-button").click();
    await page.waitForSelector(".message.assistant");
    assert.match(await page.locator(".answer").innerText(), /图书馆|开馆/);
    pass("SSE chat completes with grounded answer");
    await page.locator(".sources-button").click();
    await page.waitForSelector(".source-card");
    assert.ok(await page.locator(".trace-step").count());
    pass("Citations and tool trace panel");
    await page.screenshot({
      path: path.join(out, "02_answer_sources.png"),
      fullPage: true,
    });
    await page.locator("#close-sources").click();
    await page.reload();
    await page.waitForSelector(".message.assistant");
    pass("Conversation restored after page reload");
    await page.locator(".history-row").hover();
    await page.locator(".history-actions button").first().click();
    await page.locator("#confirm-input").fill("浏览器验收对话");
    await page.locator("#confirm-ok").click();
    await page
      .getByRole("button", { name: "浏览器验收对话", exact: true })
      .waitFor();
    pass("Conversation rename");
    const download = page.waitForEvent("download");
    await page.locator("#export-chat").click();
    assert.match((await download).suggestedFilename(), /\.md$/);
    pass("Markdown export");
    await page.locator("#new-chat").click();
    for (const q of ["查询申请进度", "S1001", "AP2026001"]) {
      const n = await page.locator(".message.assistant").count();
      await page.locator("#message-input").fill(q);
      await page.locator("#send-button").click();
      await page.waitForFunction(
        (n) => document.querySelectorAll(".message.assistant").length > n,
        n,
      );
      await page.locator("#send-button").waitFor({ state: "visible" });
    }
    assert.match(
      await page.locator(".answer").last().innerText(),
      /审核中|学院复审/,
    );
    pass("Status tool arguments remembered across three turns");
    await page.locator("[data-view=knowledge]").click();
    await page.locator("#knowledge-search").fill("不存在的资料测试");
    assert.equal(await page.locator(".knowledge-card").count(), 0);
    assert.match(await page.locator("#knowledge-grid").innerText(), /没有找到/);
    await page.locator("#knowledge-search").fill("");
    pass("Knowledge full-text filtering and empty state");
    await page
      .locator("#file-input")
      .setInputFiles({
        name: "验收读书会.md",
        mimeType: "text/markdown",
        buffer: Buffer.from(
          "# 验收读书会\n验收读书会每周六在青松楼举行。\n<script>alert(1)</script>",
        ),
      });
    await page
      .getByRole("heading", { name: "验收读书会.md", exact: true })
      .waitFor();
    await page
      .getByRole("heading", { name: "验收读书会.md", exact: true })
      .click();
    await page.locator("#document-dialog").waitFor();
    assert.match(await page.locator("#document-body").innerText(), /<script>/);
    assert.equal(await page.locator("#document-body script").count(), 0);
    pass("Knowledge upload and XSS-safe document viewer");
    await page
      .getByRole("button", { name: "删除这份资料", exact: true })
      .click();
    await page.locator("#confirm-ok").click();
    await page.locator("#document-dialog").waitFor({ state: "hidden" });
    pass("User upload deletion");
    await page.screenshot({
      path: path.join(out, "03_knowledge.png"),
      fullPage: true,
    });
    await page.locator("#open-settings").click();
    await page.locator("#provider-select").selectOption("ollama");
    assert.match(await page.locator("#base-url").inputValue(), /11434/);
    await page.locator("#provider-select").selectOption("anthropic");
    assert.equal(
      await page.locator("#protocol-select").inputValue(),
      "anthropic",
    );
    pass("Provider presets and protocol fields");
    await page.locator("#provider-select").selectOption("openai");
    await page.screenshot({
      path: path.join(out, "04_model_settings.png"),
      fullPage: false,
    });
    await page.locator("[data-close=settings-dialog]").click();
    await page.locator("[data-view=services]").click();
    assert.equal(await page.locator(".service-card").count(), 8);
    await page.locator(".service-card").first().click();
    assert.match(await page.locator("#message-input").inputValue(), /图书馆/);
    pass("Eight working service shortcuts");
    await page.locator("#new-chat").click();
    await page.locator("#theme-toggle").click();
    assert.equal(await page.locator("html").getAttribute("data-theme"), "dark");
    await page.screenshot({
      path: path.join(out, "05_home_dark.png"),
      fullPage: true,
    });
    await page.locator("#theme-toggle").click();
    pass("Dark theme");
    for (const width of [375, 768, 1024, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.evaluate(
        () =>
          new Promise((resolve) =>
            requestAnimationFrame(() => requestAnimationFrame(resolve)),
          ),
      );
      const sizes = await page.evaluate(() => ({
        page: document.documentElement.scrollWidth,
        view: innerWidth,
      }));
      assert.ok(sizes.page <= sizes.view, JSON.stringify(sizes));
      pass("No horizontal overflow at " + width + "px");
      if (width === 375) {
        await page.screenshot({
          path: path.join(out, "06_home_mobile.png"),
          fullPage: true,
        });
        await page.locator("#menu-toggle").click();
        await page.locator("#open-settings").click();
        await page.locator("#settings-dialog").waitFor({ state: "visible" });
        await page.keyboard.press("Escape");
        await page.locator("#settings-dialog").waitFor({ state: "hidden" });
        pass("Mobile navigation and Escape dialog dismissal");
      }
    }
    if (process.env.CAMPUS_LIVE_WEB === "1") {
      await page.locator("#new-chat").click();
      await page.locator("#web-toggle").click();
      await page.locator("#message-input").fill("Python official documentation");
      await page.locator("#send-button").click();
      await page.locator(".message.assistant").waitFor({ timeout: 45000 });
      assert.match(await page.locator(".answer").innerText(), /联网检索摘要/);
      await page.locator(".sources-button").click();
      assert.ok(await page.locator('.source-card a[href^="https://"]').count());
      await page.screenshot({path: path.join(out, "07_live_web.png"), fullPage: false});
      pass("Live web query returns real linked sources through the UI");
    }
    assert.deepEqual(errors, []);
    pass("No uncaught browser JavaScript errors");
  } finally {
    // Remove only records created by this isolated test browser.
    const conversations = await (
      await context.request.get(base + "/api/conversations")
    ).json();
    for (const c of conversations.items || [])
      await context.request.delete(base + "/api/conversations/" + c.id, {
        data: {},
      });
    const docs = await (
      await context.request.get(base + "/api/knowledge")
    ).json();
    for (const d of docs.items || [])
      if (d.uploaded)
        await context.request.delete(base + "/api/knowledge/" + d.id, {
          data: {},
        });
    fs.writeFileSync(
      reportPath,
      JSON.stringify(
        {
          executed_at: new Date().toISOString(),
          scope: "Isolated Playwright browser; no live LLM credentials",
          live_web_requested: process.env.CAMPUS_LIVE_WEB === "1",
          checks,
          errors,
        },
        null,
        2,
      ),
    );
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
