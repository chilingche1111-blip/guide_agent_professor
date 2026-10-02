const { chromium } = require("playwright");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
(async () => {
  const root = path.resolve(__dirname, "../.."),
    out = path.join(root, "06_Demo/screenshots/ion-assistant");
  fs.mkdirSync(out, { recursive: true });
  const browser = await chromium.launch({
    executablePath:
      "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    args: ["--enable-unsafe-swiftshader"],
  });
  const p = await browser.newPage({ viewport: { width: 1440, height: 960 } }),
    checks = [],
    errors = [];
  p.on("pageerror", (e) => errors.push(e.message));
  p.on("console", (m) => {
    if (m.type() === "error" && /Shader|VALIDATE|WebGLProgram/.test(m.text()))
      errors.push(m.text());
  });
  const pass = (s) => {
    checks.push(s);
    console.log("PASS", s);
  };
  const stage = p.locator("#ion-stage");
  const frames = async () => Number(await stage.getAttribute("data-frames"));
  try {
    await p.goto("http://127.0.0.1:7860/");
    await p.locator("#enter-campus").click();
    await p.getByRole("link", { name: "开始使用智慧校园助手" }).click();
    await p.waitForFunction(
      () =>
        document
          .getElementById("agent-root")
          .shadowRoot?.getElementById("ion-stage").dataset.renderer === "webgl",
    );
    await p.waitForTimeout(950);
    assert.equal(await stage.getAttribute("data-particles"), "4800");
    assert.ok((await frames()) > 3);
    assert.equal(await p.locator("#message-input").isEnabled(), true);
    await p.screenshot({ path: path.join(out, "desktop.png") });
    pass(
      "Requested campus CTA enters the real WebGL ion assistant without blocking input",
    );
    const box = await p.locator("#ion-field").boundingBox();
    await p.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await p.mouse.down();
    await p.mouse.move(
      box.x + box.width / 2 + 90,
      box.y + box.height / 2 - 30,
      { steps: 8 },
    );
    await p.mouse.up();
    assert.ok(Number(await stage.getAttribute("data-yaw")) > 0.3);
    await p.locator("#ion-field").focus();
    await p.keyboard.press("ArrowLeft");
    assert.ok(Number(await stage.getAttribute("data-yaw")) < 0.63);
    pass("Pointer drag and keyboard arrows rotate the 3D core");
    await p.locator("#ion-motion").click();
    await p.waitForTimeout(100);
    let n = await frames();
    await p.waitForTimeout(300);
    assert.equal(await frames(), n);
    await p.locator("#ion-motion").click();
    await p.waitForTimeout(200);
    assert.ok((await frames()) > n);
    pass("Pause stops the render loop; resume starts it again");
    await p.locator("#message-input").fill("保留三维场景草稿");
    await p.locator(".campus-return").click();
    await p.waitForTimeout(450);
    n = await frames();
    await p.waitForTimeout(250);
    assert.equal(await frames(), n);
    await p.locator(".agent-entry").click();
    await p.waitForTimeout(400);
    assert.equal(
      await p.locator("#message-input").inputValue(),
      "保留三维场景草稿",
    );
    pass(
      "Leaving stops hidden rendering and preserves unsent drafts on return",
    );
    await p.locator("[data-view=knowledge]").click();
    await p.waitForTimeout(100);
    n = await frames();
    await p.waitForTimeout(250);
    assert.equal(await frames(), n);
    await p.locator("[data-view=chat]").click();
    pass("Knowledge view suspends the 3D scene");
    await p.locator("#knowledge-scope").selectOption("simulation");
    await p.route("**/api/chat", async (route) => {
      await new Promise((r) => setTimeout(r, 500));
      await route.continue();
    });
    await p.locator("#message-input").fill("图书馆几点开放？");
    await p.locator("#send-button").click();
    await p.waitForFunction(
      () =>
        document
          .getElementById("agent-root")
          .shadowRoot.getElementById("ion-stage").dataset.state ===
        "processing",
    );
    assert.match(await p.locator("#ion-state").innerText(), /正在处理/);
    await p.locator(".message.assistant").waitFor({ timeout: 30000 });
    await p.waitForFunction(
      () =>
        document
          .getElementById("agent-root")
          .shadowRoot.getElementById("ion-stage").dataset.state === "ready",
    );
    assert.ok((await stage.boundingBox()).height < 200);
    await p.screenshot({ path: path.join(out, "conversation.png") });
    pass(
      "Real RAG request drives processing/ready state and compacts the core beside conversation",
    );
    await p.locator("#new-chat").click();
    await p.emulateMedia({ reducedMotion: "reduce" });
    await p.waitForTimeout(100);
    n = await frames();
    await p.waitForTimeout(250);
    assert.equal(await frames(), n);
    assert.equal(await p.locator("#ion-motion").isDisabled(), true);
    pass("Reduced motion uses a static WebGL pose without an animation loop");
    const phone = await browser.newPage({
      viewport: { width: 390, height: 844 },
      reducedMotion: "reduce",
    });
    await phone.goto("http://127.0.0.1:7860/#agent");
    await phone.waitForFunction(
      () =>
        document
          .getElementById("agent-root")
          .shadowRoot?.getElementById("ion-stage").dataset.renderer === "webgl",
    );
    await phone.locator("#message-input").waitFor();
    assert.equal(
      await phone.locator("#ion-stage").getAttribute("data-particles"),
      "2200",
    );
    assert.ok(
      await phone.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    );
    await phone.screenshot({ path: path.join(out, "mobile.png") });
    await phone.locator("#message-input").scrollIntoViewIfNeeded();
    assert.equal(await phone.locator("#message-input").isEnabled(), true);
    await phone.screenshot({ path: path.join(out, "mobile-composer.png") });
    await phone.close();
    pass(
      "390px mobile reduces particle count, preserves controls and has no horizontal overflow",
    );
    const fallback = await browser.newPage();
    await fallback.addInitScript(() => {
      HTMLCanvasElement.prototype.getContext = function (type, ...args) {
        if (/webgl/.test(type)) return null;
        return null;
      };
    });
    await fallback.goto("http://127.0.0.1:7860/static/workbench.html");
    await fallback.waitForFunction(() =>
      document.getElementById("ion-hint").textContent.includes("静态核心"),
    );
    assert.equal(await fallback.locator("#message-input").isEnabled(), true);
    await fallback.screenshot({ path: path.join(out, "fallback.png") });
    await fallback.close();
    pass(
      "No-WebGL standalone route retains a labelled static core and working composer",
    );
    assert.deepEqual(errors, []);
    pass("No uncaught JavaScript or shader compile errors");
    fs.writeFileSync(
      path.join(root, "04_Evaluation/ion_assistant_results.json"),
      JSON.stringify(
        {
          executed_at: new Date().toISOString(),
          checks,
          errors,
          scope:
            "Headless Chrome functional checks; not a physical-device FPS or live model-quality benchmark",
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
