const { chromium } = require("playwright"),
  assert = require("node:assert/strict"),
  fs = require("node:fs"),
  path = require("node:path");
(async () => {
  const browser = await chromium.launch({
      executablePath:
        "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      args: ["--enable-unsafe-swiftshader"],
    }),
    checks = [];
  const root = path.resolve(__dirname, "../.."),
    out = path.join(root, "06_Demo/screenshots/ion-assistant");
  const pass = (s) => {
    checks.push(s);
    console.log("PASS", s);
  };
  try {
    const p = await browser.newPage({
      viewport: { width: 1440, height: 960 },
      reducedMotion: "reduce",
    });
    await p.goto("http://127.0.0.1:7860/#agent");
    await p.waitForFunction(
      () =>
        document
          .getElementById("agent-root")
          .shadowRoot?.getElementById("ion-stage").dataset.renderer === "webgl",
    );
    await p.locator("#ion-field canvas").evaluate((c) => {
      window.ionLoss = c
        .getContext("webgl2")
        .getExtension("WEBGL_lose_context");
      window.ionLoss.loseContext();
    });
    await p.waitForFunction(
      () =>
        document
          .getElementById("agent-root")
          .shadowRoot.getElementById("ion-stage").dataset.renderer ===
        "fallback",
    );
    assert.equal(await p.locator("#ion-reset").isVisible(), false);
    assert.equal(await p.locator("#ion-field").getAttribute("tabindex"), "-1");
    assert.equal(await p.locator("#message-input").isEnabled(), true);
    await p.screenshot({ path: path.join(out, "context-lost.png") });
    await p.waitForTimeout(300);
    await p.evaluate(() => window.ionLoss.restoreContext());
    await p.waitForFunction(
      () =>
        document
          .getElementById("agent-root")
          .shadowRoot.getElementById("ion-stage").dataset.renderer === "webgl",
    );
    assert.equal(await p.locator("#ion-reset").isVisible(), true);
    assert.equal(await p.locator("#ion-field").getAttribute("tabindex"), "0");
    assert.match(await p.locator("#ion-hint").innerText(), /拖动探索/);
    await p.screenshot({ path: path.join(out, "context-restored.png") });
    pass(
      "Real WebGL context loss disables rotation affordances; restoration recovers controls and normal hint",
    );
    await p.close();
    for (const mode of ["no-webgl", "module-failed"]) {
      const f = await browser.newPage({
        viewport: { width: 1440, height: 960 },
      });
      if (mode === "no-webgl")
        await f.addInitScript(() => {
          const original = HTMLCanvasElement.prototype.getContext;
          HTMLCanvasElement.prototype.getContext = function (t, ...args) {
            return /webgl/.test(t) ? null : original.call(this, t, ...args);
          };
        });
      else await f.route("**/ion-assistant.js", (r) => r.abort());
      await f.route("**/api/chat", async (r) => {
        await new Promise((done) => setTimeout(done, 650));
        await r.continue();
      });
      await f.goto("http://127.0.0.1:7860/static/workbench.html");
      await f.locator("#knowledge-scope").selectOption("simulation");
      await f.waitForFunction(
        () => document.getElementById("ion-motion").hidden,
      );
      await f.locator("#message-input").fill("图书馆几点开放？");
      await f.locator("#send-button").click();
      await f.waitForFunction(
        () =>
          document.getElementById("ion-stage").dataset.state === "processing",
      );
      assert.match(await f.locator("#ion-state").innerText(), /正在处理/);
      await f.locator(".message.assistant").waitFor();
      await f.waitForFunction(
        () => document.getElementById("ion-stage").dataset.state === "ready",
      );
      await f.screenshot({ path: path.join(out, mode + "-answer.png") });
      await f.close();
      pass(mode + " preserves processing/ready status and completes real RAG");
    }
    fs.writeFileSync(
      path.join(root, "04_Evaluation/ion_recovery_results.json"),
      JSON.stringify(
        {
          executed_at: new Date().toISOString(),
          checks,
          scope:
            "Synthetic context-loss, initialization and module-load failure recovery",
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
