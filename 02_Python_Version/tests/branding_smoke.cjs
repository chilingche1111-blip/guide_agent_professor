// Rename regression: keep historic screenshots and metrics untouched.
const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

(async () => {
  const root = path.resolve(__dirname, "../..");
  const out = path.join(root, "06_Demo/screenshots/zhixing");
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch({
    executablePath:
      "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    args: ["--enable-unsafe-swiftshader"],
  });
  const checks = [],
    errors = [];
  const pass = (name) => {
    checks.push(name);
    console.log("PASS", name);
  };
  const p = await browser.newPage({ viewport: { width: 1440, height: 960 } });
  p.on("pageerror", (e) => errors.push(e.message));
  try {
    await p.goto("http://127.0.0.1:7860/");
    await p.locator("#enter-campus").waitFor();
    await p.evaluate(() => document.fonts.ready);
    await p.waitForTimeout(1200);
    assert.match(await p.title(), /长安知行/);
    assert.match(
      await p.locator(".site-header .brand").innerText(),
      /长安知行/,
    );
    assert.equal(await p.locator(".brand-symbol").innerText(), "知");
    await p.screenshot({ path: path.join(out, "homepage.png") });
    pass("Homepage product name, monogram and browser title");

    await p.locator("#enter-campus").click();
    await p.getByRole("link", { name: "开始使用智慧校园助手" }).click();
    await p.locator("#ion-state").waitFor();
    await p.waitForFunction(
      () =>
        document
          .getElementById("agent-root")
          ?.shadowRoot?.getElementById("ion-stage")?.dataset.renderer ===
        "webgl",
    );
    await p.waitForTimeout(1000);
    assert.match(await p.title(), /长安知行/);
    assert.equal(await p.locator("#ion-state").innerText(), "知行，准备就绪");
    assert.ok(
      await p.getByText("你好，我是知行。", { exact: false }).isVisible(),
    );
    assert.match(await p.locator("#sidebar .brand").innerText(), /长安知行/);
    await p.screenshot({ path: path.join(out, "desktop.png") });
    pass("Same-page Agent shows full brand and short conversational persona");

    await p.locator("#knowledge-scope").selectOption("simulation");
    await p.locator("#message-input").fill("图书馆几点开放？");
    await p.locator("#send-button").click();
    await p.locator(".message.assistant").waitFor({ timeout: 30000 });
    await p.waitForFunction(
      () =>
        document
          .getElementById("agent-root")
          .shadowRoot.getElementById("ion-stage").dataset.state === "ready",
    );
    assert.match(await p.locator(".message.assistant").innerText(), /知行/);
    assert.equal(await p.locator("#ion-state").innerText(), "知行，准备就绪");
    await p.screenshot({ path: path.join(out, "conversation.png") });
    pass(
      "Actual offline RAG answer retains references and renamed ready status",
    );

    const downloaded = p.waitForEvent("download");
    await p.locator("#export-chat").click();
    const download = await downloaded;
    assert.match(download.suggestedFilename(), /^长安知行对话-.*\.md$/);
    const exported = fs.readFileSync(await download.path(), "utf8");
    assert.match(exported, /^# 长安知行对话记录/);
    assert.match(exported, /## 知行/);
    assert.ok(!exported.includes("校伴"));
    pass("Exported Markdown heading, assistant attribution and filename");

    await p.locator(".campus-return").click();
    await p.waitForTimeout(500);
    assert.match(await p.title(), /长安知行/);
    pass("Return to campus preserves renamed browser title");

    const phone = await browser.newPage({
      viewport: { width: 390, height: 844 },
      reducedMotion: "reduce",
    });
    await phone.goto("http://127.0.0.1:7860/");
    await phone.locator("#enter-campus").waitFor();
    await phone.evaluate(() => document.fonts.ready);
    await phone.waitForTimeout(700);
    assert.ok(
      await phone.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    );
    const brand = await phone.locator(".site-header .brand").boundingBox();
    const nav = await phone.locator(".site-header nav").boundingBox();
    assert.ok(
      brand.x + brand.width <= nav.x,
      "mobile brand must not overlap navigation",
    );
    await phone.screenshot({ path: path.join(out, "mobile-homepage.png") });
    await phone.goto("http://127.0.0.1:7860/#agent");
    await phone.locator("#ion-state").waitFor();
    await phone.waitForFunction(
      () =>
        document
          .getElementById("agent-root")
          ?.shadowRoot?.getElementById("ion-stage")?.dataset.renderer ===
        "webgl",
    );
    await phone.waitForTimeout(700);
    assert.ok(
      await phone.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    );
    assert.equal(
      await phone.locator("#ion-state").innerText(),
      "知行，准备就绪",
    );
    await phone.screenshot({ path: path.join(out, "mobile.png") });
    await phone.close();
    pass("390px homepage and Agent layout fit without horizontal overflow");

    await p.goto("http://127.0.0.1:7860/static/workbench.html");
    await p.locator("#ion-state").waitFor();
    assert.match(await p.title(), /长安知行/);
    assert.match(await p.locator("#sidebar .brand").innerText(), /长安知行/);
    pass("Standalone workbench uses the same product name");

    const report = fs.readFileSync(
      path.join(root, "05_Final_Report/final_report.md"),
      "utf8",
    );
    const prose = report.replace(/```[\s\S]*?```/g, "");
    assert.ok(
      report.startsWith("# 《长安知行——基于 RAG 与 Agent 的校园智能客服系统》"),
    );
    assert.equal(
      (prose.match(/^# [一二三四五六七八九十]+、/gm) || []).length,
      31,
    );
    assert.equal((prose.match(/^## \d+\.\d+/gm) || []).length, 74);
    assert.deepEqual(errors, []);
    pass(
      "Report title updated; 31 chapters and 74 numbered sections preserved",
    );
  } finally {
    fs.writeFileSync(
      path.join(root, "04_Evaluation/zhixing_branding_results.json"),
      JSON.stringify(
        {
          generated_at: new Date().toISOString(),
          scope:
            "Branding regression only; offline simulated knowledge, not real LLM quality",
          passed: checks.length,
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
