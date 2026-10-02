// Same-document Agent workspace, with CSS/ID isolation and no iframe or eval.
const host = document.getElementById("agent-root"),
  campus = document.getElementById("campus-surface"),
  status = document.getElementById("navigation-status");
let assets,
  mounted,
  app,
  activeMotion = [],
  motionVersion = 0,
  operation = 0,
  campusScroll = 0,
  returnFocus,
  returnURL;
let needsRefresh = false;
const agentRoute = () =>
  /^#agent(?:-knowledge|-services)?$/.test(location.hash);
const viewFromURL = () =>
  location.hash === "#agent-knowledge"
    ? "knowledge"
    : location.hash === "#agent-services"
      ? "services"
      : "chat";
function prepare() {
  if (!assets)
    assets = Promise.all([
      fetch("/static/workbench.html", {
        signal: AbortSignal.timeout(12000),
      }).then((r) => {
        if (!r.ok) throw Error("工作台页面暂不可用");
        return r.text();
      }),
      import("./app.js"),
    ]).catch((e) => {
      assets = null;
      throw e;
    });
  return assets;
}
function ensureMounted() {
  if (mounted) return mounted;
  mounted = (async () => {
    const [html, module] = await prepare(),
      template = new DOMParser().parseFromString(html, "text/html");
    template.querySelectorAll("script").forEach((s) => s.remove());
    const root = host.shadowRoot || host.attachShadow({ mode: "open" });
    root.replaceChildren();
    const styles = [
      ...template.querySelectorAll('head link[rel="stylesheet"]'),
    ].map(
      (source) =>
        new Promise((resolve, reject) => {
          const link = document.createElement("link");
          link.rel = "stylesheet";
          link.href = source.getAttribute("href");
          const timer = setTimeout(
            () => reject(Error("工作台样式加载超时")),
            12000,
          );
          link.onload = () => {
            clearTimeout(timer);
            resolve();
          };
          link.onerror = () => {
            clearTimeout(timer);
            reject(Error("工作台样式加载失败"));
          };
          root.append(link);
        }),
    );
    [...template.body.children].forEach((el) =>
      root.append(document.importNode(el, true)),
    );
    await Promise.all(styles);
    app = module.mountWorkbench(root);
    root.addEventListener("click", (e) => {
      const anchor = e.target.closest('a[href="/"]');
      if (anchor && !e.metaKey && !e.ctrlKey && !e.shiftKey && e.button === 0) {
        e.preventDefault();
        goCampus();
      }
    });
    return app;
  })().catch((e) => {
    mounted = null;
    throw e;
  });
  return mounted;
}
async function transition(update, direction) {
  const version = ++motionVersion;
  const interrupted = activeMotion.length > 0;
  const start = new Map(
    [host, campus].map((el) => {
      const style = getComputedStyle(el);
      return [el, { opacity: style.opacity, transform: style.transform }];
    }),
  );
  activeMotion.forEach((animation) => animation.cancel());
  activeMotion = [];
  document.body.classList.remove("navigation-moving");
  delete host.dataset.transitioning;
  document.documentElement.dataset.navigation = direction;
  update();
  const entering = direction === "agent";
  campus.inert = entering;
  host.inert = !entering;
  if (document.hidden || matchMedia("(prefers-reduced-motion: reduce)").matches)
    return;
  // Animate the existing surfaces, not a screenshot of the WebGL viewport.
  // Both stay painted until the handoff ends; only the destination is interactive.
  campus.hidden = false;
  host.hidden = false;
  document.body.classList.add("navigation-moving");
  host.dataset.transitioning = direction;
  const options = {
    duration: entering ? 300 : 240,
    easing: "cubic-bezier(.22,1,.36,1)",
    fill: "both",
  };
  const hostFrames = entering
    ? [
        { opacity: 0, transform: "translateX(28px)" },
        { opacity: 1, transform: "none" },
      ]
    : [
        { opacity: 1, transform: "none" },
        { opacity: 0, transform: "translateX(28px)" },
      ];
  const campusFrames = entering
    ? [
        { opacity: 1, transform: "none" },
        { opacity: 0.88, transform: "translateX(-10px)" },
      ]
    : [
        { opacity: 0.88, transform: "translateX(-10px)" },
        { opacity: 1, transform: "none" },
      ];
  if (interrupted) {
    hostFrames[0] = start.get(host);
    campusFrames[0] = start.get(campus);
  }
  const animations = [
    host.animate(hostFrames, options),
    campus.animate(campusFrames, options),
  ];
  activeMotion = animations;
  await Promise.all(
    animations.map((animation) => animation.finished.catch(() => {})),
  );
  if (version !== motionVersion) return;
  campus.hidden = entering;
  host.hidden = !entering;
  animations.forEach((animation) => animation.cancel());
  activeMotion = [];
  delete host.dataset.transitioning;
  document.body.classList.remove("navigation-moving");
}
export async function openAgent(
  view = "chat",
  push = true,
  trigger = document.activeElement,
) {
  const request = ++operation,
    wasHidden = !document.body.classList.contains("agent-mode");
  if (wasHidden) {
    campusScroll = scrollY;
    returnFocus = trigger;
    returnURL = agentRoute()
      ? "/"
      : location.pathname + location.search + location.hash;
  }
  status.textContent = "正在准备工作台界面…";
  // Avoid a flashing toast on a warm, near-instant entry.
  const loadingTimer = setTimeout(() => {
    if (request === operation) status.hidden = false;
  }, 180);
  try {
    const instance = await ensureMounted();
    if (request !== operation) return;
    const setHydrating = (busy) => {
      host.shadowRoot
        .querySelectorAll(".view, #sidebar, #model-badge, .topbar-actions")
        .forEach((el) => {
          el.inert = busy;
        });
      if (busy) host.setAttribute("aria-busy", "true");
      else {
        host.removeAttribute("aria-busy");
        instance.closeMenu();
      }
    };
    const pending = instance.ready;
    let dataReady = false;
    pending.then(() => {
      dataReady = true;
    });
    await Promise.resolve();
    if (!dataReady) {
      setHydrating(true);
    }
    const refreshNeeded =
      wasHidden &&
      (needsRefresh ||
        instance.state.id !== localStorage.getItem("campus-current"));
    const hydration = pending.then(async () => {
      if (refreshNeeded) {
        await instance.refresh();
        needsRefresh = false;
      }
    });
    hydration.catch(() => {});
    clearTimeout(loadingTimer);
    if (!dataReady || refreshNeeded) {
      status.textContent = "正在同步模型设置与历史会话…";
      status.hidden = false;
      setHydrating(true);
    }
    if (request !== operation) return;
    instance.showView(view);
    const input = host.shadowRoot.getElementById("message-input"),
      draft = document.getElementById("assistant-question");
    if (draft.value.trim() && !draft.disabled && !instance.state.busy) {
      if (!input.value.includes(draft.value.trim()))
        input.value = input.value.trim()
          ? input.value.trimEnd() + "\n" + draft.value.trim()
          : draft.value;
      draft.value = "";
      input.dispatchEvent(new Event("input", { bubbles: true }));
    }
    if (push)
      history.pushState(
        { campusAgent: true },
        "",
        "#agent" + (view === "chat" ? "" : "-" + view),
      );
    await transition(() => {
      if (request !== operation) return;
      campus.hidden = true;
      host.hidden = false;
      document.body.classList.add("agent-mode");
      document.title = "长安知行 · 智慧校园 Agent";
      if (dataReady && !refreshNeeded) status.hidden = true;
    }, "agent");
    await hydration.finally(() => {
      setHydrating(false);
    });
    if (request !== operation) return;
    const mapPrompt = trigger?.dataset?.agentPrompt;
    if (mapPrompt && !instance.state.busy) {
      await instance.setKnowledgeScope("chd_public");
      if (request !== operation) return;
      const field = host.shadowRoot.getElementById("message-input");
      if (!field.value.includes(mapPrompt)) {
        field.value = field.value.trim()
          ? field.value.trimEnd() + "\n" + mapPrompt
          : mapPrompt;
        field.dispatchEvent(new Event("input", { bubbles: true }));
      }
    }
    status.hidden = true;
    instance.showView(view);
    // Do not summon the phone keyboard merely by navigating.
    if (view === "chat" && matchMedia("(pointer: fine)").matches)
      input.focus({ preventScroll: true });
    else if (view !== "chat")
      host.shadowRoot
        .querySelector(`[data-view="${view}"]`)
        .focus({ preventScroll: true });
    document.dispatchEvent(new CustomEvent("campus-mode", { detail: "agent" }));
  } catch (error) {
    if (request !== operation) return;
    status.hidden = false;
    status.textContent = error.message + "。可通过独立入口重试。";
    const link = document.createElement("a");
    link.href = "/static/workbench.html";
    link.textContent = "打开独立工作台";
    status.append(" ", link);
  } finally {
    clearTimeout(loadingTimer);
  }
}
async function revealCampus() {
  const request = ++operation;
  status.hidden = true;
  if (!document.body.classList.contains("agent-mode")) return;
  host.shadowRoot.querySelectorAll("dialog[open]").forEach((d) => d.close());
  app.closeMenu();
  await transition(() => {
    host.hidden = true;
    campus.hidden = false;
    document.body.classList.remove("agent-mode");
    document.title = "长安知行 · 智慧校园助手";
    window.scrollTo({ top: campusScroll, behavior: "instant" });
    document.dispatchEvent(
      new CustomEvent("campus-mode", { detail: "campus" }),
    );
  }, "campus");
  if (request !== operation) return;
  returnFocus?.focus?.({ preventScroll: true });
}
function goCampus() {
  if (history.state?.campusAgent) history.back();
  else {
    history.replaceState(null, "", returnURL || "/");
    revealCampus();
  }
}
document.addEventListener("click", (e) => {
  const a = e.target.closest('a[href^="/static/workbench.html"]');
  if (
    !a ||
    a.closest("#navigation-status") ||
    e.button !== 0 ||
    e.metaKey ||
    e.ctrlKey ||
    e.shiftKey ||
    e.altKey ||
    a.target === "_blank"
  )
    return;
  e.preventDefault();
  openAgent(a.dataset.agentView || "chat", true, a);
});
for (const event of ["pointerover", "focusin"])
  document.addEventListener(
    event,
    (e) => {
      if (e.target.closest('a[href^="/static/workbench.html"]'))
        ensureMounted().catch(() => {});
    },
    { passive: true },
  );
window.addEventListener("popstate", () => {
  if (agentRoute()) openAgent(viewFromURL(), false);
  else revealCampus();
});
document.addEventListener("campus-conversation-updated", async () => {
  needsRefresh = true;
  if (app && !host.hidden && !app.state.busy) {
    try {
      await app.refresh();
      needsRefresh = false;
    } catch {
      /* Retry on next entry. */
    }
  }
});
if (agentRoute()) openAgent(viewFromURL(), false);
else if ("requestIdleCallback" in window)
  requestIdleCallback(() => ensureMounted().catch(() => {}), { timeout: 2000 });
