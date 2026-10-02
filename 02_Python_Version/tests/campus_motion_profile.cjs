const { chromium } = require("playwright"),
  fs = require("node:fs"),
  path = require("node:path");
(async () => {
  const browser = await chromium.launch({
    executablePath:
      "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    args: ["--enable-unsafe-swiftshader"],
  });
  const page = await browser.newPage({
    viewport: { width: 1440, height: 960 },
    reducedMotion: "no-preference",
  });
  try {
    await page.goto("http://127.0.0.1:7860/");
    await page.waitForFunction(() => document.body.dataset.scene === "ready");
    await page.waitForTimeout(1000);
    const phases = [];
    for (const [name, selector] of [
      ["curtain", "#enter-campus"],
      ["district", "button[data-chapter=living]"],
      ["destination", "#places [data-place=life]"],
      ["agent", ".agent-entry"],
    ]) {
      const result = await page.evaluate(
        async ({ name, selector }) => {
          const gaps = [],
            long = [],
            renderGaps = [],
            begin = performance.now();
          let last = begin,
            handle,
            lastRender = begin,
            count = document.getElementById("scene").dataset.renderCount;
          const observer = new PerformanceObserver((list) =>
            long.push(...list.getEntries().map((e) => e.duration)),
          );
          observer.observe({ type: "longtask" });
          function frame(now) {
            gaps.push(now - last);
            last = now;
            const next = document.getElementById("scene").dataset.renderCount;
            if (next !== count) {
              renderGaps.push(now - lastRender);
              lastRender = now;
              count = next;
            }
            handle = requestAnimationFrame(frame);
          }
          handle = requestAnimationFrame(frame);
          document.querySelector(selector).click();
          await new Promise((r) => setTimeout(r, 1300));
          cancelAnimationFrame(handle);
          observer.disconnect();
          gaps.sort((a, b) => a - b);
          renderGaps.sort((a, b) => a - b);
          return {
            name,
            samples: gaps.length,
            p50_ms: +(gaps[Math.floor(gaps.length * 0.5)] || 0).toFixed(1),
            p95_ms: +(gaps[Math.floor(gaps.length * 0.95)] || 0).toFixed(1),
            max_ms: +(gaps.at(-1) || 0).toFixed(1),
            render_samples: renderGaps.length,
            render_p50_ms: +(
              renderGaps[Math.floor(renderGaps.length * 0.5)] || 0
            ).toFixed(1),
            draw_calls: Number(
              document.getElementById("scene").dataset.drawCalls,
            ),
            frames_over_50ms: gaps.filter((n) => n > 50).length,
            long_tasks: long.length,
            long_task_total_ms: +long.reduce((a, b) => a + b, 0).toFixed(1),
          };
        },
        { name, selector },
      );
      phases.push(result);
      await page.waitForTimeout(250);
    }
    const result = {
      executed_at: new Date().toISOString(),
      environment:
        "Headless Chrome, software WebGL, 1440x960; synthetic single-run rAF intervals, not INP or physical-device FPS",
      phases,
    };
    const name = process.env.MOTION_EVIDENCE || "weishui-motion-after";
    fs.writeFileSync(
      path.resolve(__dirname, "../../04_Evaluation", name + ".json"),
      JSON.stringify(result, null, 2),
    );
    console.log(JSON.stringify(result, null, 2));
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
