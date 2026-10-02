"use strict";
import { mountExplorer } from "./explore.js";
export function mountWorkbench(root = document) {
  const $ = (id) => root.getElementById(id);
  const themeRoot = root.host || document.documentElement;
  const scrollRoot = root.host || window;
  const paths = {
    cpu: "M7 7h10v10H7zM10 10h4v4h-4zM8 2v5M16 2v5M8 17v5M16 17v5M2 8h5M2 16h5M17 8h5M17 16h5",
    sprout:
      "M12 22V12M12 16C5 16 3 11 3 6c6 0 9 3 9 8M12 12c0-6 4-10 10-10 0 6-3 10-10 10",
    plus: "M12 5v14M5 12h14",
    message:
      "M21 11.5a8.5 8.5 0 0 1-8.5 8.5H4l-2 2V11.5A8.5 8.5 0 0 1 10.5 3H13a8 8 0 0 1 8 8.5Z",
    book: "M12 5v16M12 5C8 2 4 3 2 4v15c4-1 7-1 10 2 3-3 6-3 10-2V4c-2-1-6-2-10 1Z",
    grid: "M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z",
    clock: "M12 8v5l3 2M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0Z",
    sliders:
      "M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 10h6M9 12h6M17 16h6",
    "arrow-up-right": "M6 18 18 6M6 6h12v12",
    "arrow-right": "M4 12h16m-6-6 6 6-6 6",
    "arrow-up": "M12 20V4m-6 6 6-6 6 6",
    moon: "M21 13A9 9 0 0 1 11 3a9 9 0 1 0 10 10Z",
    menu: "M3 6h18M3 12h18M3 18h18",
    "chevron-down": "m6 9 6 6 6-6",
    download: "M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5",
    panel: "M3 3h18v18H3zM15 3v18",
    sparkles: "m12 3 3 6 6 3-6 3-3 6-3-6-6-3 6-3Z",
    globe:
      "M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0ZM2 12h20M12 2c5 5 5 15 0 20-5-5-5-15 0-20Z",
    shield: "M12 3 3 7v5c0 5 5 8 9 10 4-2 9-5 9-10V7l-9-4ZM8 12l3 3 5-5",
    card: "M3 5h18v14H3zM3 9h18M7 15h3",
    list: "M9 6h12M9 12h12M9 18h12M3 6h1M3 12h1M3 18h1",
    paperclip: "m8 12 6-6a3 3 0 0 1 4 4l-8 8a5 5 0 0 1-7-7l9-9",
    stop: "M6 6h12v12H6z",
    search: "M21 21l-6-6M17 10A7 7 0 1 1 3 10a7 7 0 0 1 14 0Z",
    x: "M6 6l12 12M18 6 6 18",
    lock: "M5 10h14v11H5zM8 10V6a4 4 0 0 1 8 0v4",
    copy: "M8 8h13v13H8zM16 8V3H3v13h5",
    refresh:
      "M20 7v5h-5M4 17v-5h5M5 7a8 8 0 0 1 14-1l1 6M4 12l1 6a8 8 0 0 0 14-1",
    trash: "M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7",
    edit: "m4 16-1 5 5-1L21 7l-4-4L4 16ZM14 6l4 4",
    home: "m3 11 9-8 9 8v10H3V11ZM9 21v-8h6v8",
    heart: "M20 5c-3-3-6-1-8 1-2-2-5-4-8-1-6 6 8 16 8 16S26 11 20 5Z",
  };
  function icon(name) {
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.55" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${paths[name] || paths.message}"/></svg>`;
  }
  function icons(scope = root) {
    scope
      .querySelectorAll("[data-icon]")
      .forEach((el) => (el.innerHTML = icon(el.dataset.icon)));
  }
  const state = {
    id: null,
    messages: [],
    busy: false,
    web: false,
    config: null,
    documents: [],
    latest: null,
    knowledgeScope: "chd_public",
  };
  // Keep UI status truthful even if the optional WebGL module fails to load.
  root.addEventListener("assistant-state", () => {
    $("ion-stage").dataset.state = state.busy ? "processing" : "ready";
    $("ion-state").textContent = state.busy
      ? "正在处理你的问题"
      : "知行，准备就绪";
    $("ion-model").textContent = state.config?.enabled
      ? "模型已配置 · 以实际请求结果为准"
      : "本地知识模式 · 可在模型与连接中配置 API";
  });
  function syncKnowledgeScope() {
    $("knowledge-scope").value = state.knowledgeScope;
    $("scope-notice").textContent =
      state.knowledgeScope === "chd_public"
        ? "长安大学官方网页摘要，非实时政策；非校方官方服务。业务查询与工单为模拟。"
        : "课程模拟规则与个人上传，不代表长安大学规定。切换范围将开启新对话。";
    for (const id of ["upload-document", "attach-document"])
      $(id).disabled = state.busy || state.knowledgeScope === "chd_public";
    const firstStarter = $("starters").querySelector("button");
    firstStarter.dataset.prompt =
      state.knowledgeScope === "chd_public"
        ? "长安大学校外如何访问图书馆数据库？"
        : "图书馆几点开放？可以借几本书？";
    firstStarter.querySelector("strong").textContent =
      state.knowledgeScope === "chd_public" ? "查图书馆资源" : "去图书馆";
    firstStarter.querySelectorAll("span")[1].textContent =
      state.knowledgeScope === "chd_public"
        ? "校外数据库访问指引"
        : "开放时间、借阅与续借";
    root.dispatchEvent(new Event("knowledge-scope-updated"));
  }
  function toast(text) {
    $("toast").textContent = text;
    $("toast").hidden = false;
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => ($("toast").hidden = true), 4500);
  }
  async function api(path, options = {}) {
    const response = await fetch(path, {
      ...options,
      headers: {
        ...(options.body instanceof FormData
          ? { "X-Campus-Request": "1" }
          : { "Content-Type": "application/json" }),
        ...options.headers,
      },
    });
    let data;
    try {
      data = await response.json();
    } catch {
      throw Error("服务未返回有效响应，请检查本地服务是否正在运行。");
    }
    if (!response.ok)
      throw Error(data.error || `请求失败（${response.status}）`);
    return data;
  }
  const post = (url, data = {}) =>
    api(url, { method: "POST", body: JSON.stringify(data) });
  function safe(action) {
    return async (...args) => {
      try {
        await action(...args);
      } catch (e) {
        toast(e.message);
      }
    };
  }
  function syncMobileNav() {
    const hidden =
      matchMedia("(max-width:760px)").matches &&
      !$("sidebar").classList.contains("open");
    $("sidebar").inert = hidden;
    $("sidebar").setAttribute("aria-hidden", String(hidden));
  }
  function closeMenu() {
    $("sidebar").classList.remove("open");
    $("sidebar-scrim").hidden = true;
    $("menu-toggle").setAttribute("aria-expanded", "false");
    syncMobileNav();
  }
  function showView(view) {
    ["chat", "knowledge", "services"].forEach(
      (v) => ($(v + "-view").hidden = v !== view),
    );
    root
      .querySelectorAll("[data-view]")
      .forEach((b) => b.classList.toggle("active", b.dataset.view === view));
    $("view-title").textContent = {
      chat: "智能助手",
      knowledge: "知识空间",
      services: "校园服务",
    }[view];
    closeMenu();
    if (view === "knowledge") loadKnowledge().catch((e) => toast(e.message));
  }
  function syncWelcome() {
    const has = state.messages.length > 0 || $("messages").children.length > 0;
    ["welcome", "starters", "starter-heading"].forEach(
      (id) => ($(id).hidden = has),
    );
    $("chat-view").classList.toggle("has-messages", has);
  }
  async function loadHistory() {
    const data = await api("/api/conversations");
    $("history").replaceChildren();
    if (!data.items.length) {
      const p = document.createElement("p");
      p.className = "muted small";
      p.textContent = "第一段对话，从这里开始。";
      $("history").append(p);
    }
    for (const c of data.items) {
      const row = document.createElement("div");
      row.className = "history-row" + (c.id === state.id ? " active" : "");
      const open = document.createElement("button");
      open.className = "history-open";
      open.textContent = c.title;
      open.title = c.title;
      open.onclick = safe(() => openConversation(c.id));
      const actions = document.createElement("div");
      actions.className = "history-actions";
      for (const [name, label, action] of [
        [
          "edit",
          "重命名",
          async () => {
            const title = await confirmAction(
              "重命名会话",
              "给这段对话一个好记的名字。",
              c.title,
            );
            if (title !== null && title.trim()) {
              await api("/api/conversations/" + c.id, {
                method: "PATCH",
                body: JSON.stringify({ title }),
              });
              await loadHistory();
            }
          },
        ],
        [
          "trash",
          "删除会话",
          async () => {
            if (
              await confirmAction(
                "删除这段对话？",
                "此操作将删除本地会话和消息，无法恢复。",
              )
            ) {
              await api("/api/conversations/" + c.id, {
                method: "DELETE",
                body: "{}",
              });
              if (state.id === c.id) newChat();
              await loadHistory();
            }
          },
        ],
      ]) {
        const b = document.createElement("button");
        b.className = "icon-button";
        b.setAttribute("aria-label", label + "：" + c.title);
        b.innerHTML = icon(name);
        b.onclick = safe(action);
        actions.append(b);
      }
      row.append(open, actions);
      $("history").append(row);
    }
  }
  function newChat() {
    if (state.busy) {
      toast("请先停止当前回答。");
      return;
    }
    state.id = null;
    state.messages = [];
    state.latest = null;
    localStorage.removeItem("campus-current");
    $("messages").replaceChildren();
    $("message-input").value = "";
    $("message-input").style.height = "";
    $("toast").hidden = true;
    renderSources({});
    syncWelcome();
    showView("chat");
    $("sources-panel").hidden = true;
    loadHistory().catch((e) => toast(e.message));
    $("message-input").focus();
    scrollRoot.scrollTo(0, 0);
  }
  async function openConversation(id) {
    if (state.busy) {
      toast("请先等待或停止当前回答。");
      return;
    }
    const data = await api("/api/conversations/" + id);
    state.id = id;
    state.messages = data.messages;
    localStorage.setItem("campus-current", id);
    $("messages").replaceChildren();
    let lastQuestion = "";
    for (const m of data.messages) {
      if (m.role === "user") lastQuestion = m.content;
      renderMessage(m.role, m.content, m.data, lastQuestion);
    }
    state.latest =
      [...data.messages].reverse().find((m) => m.role === "assistant")?.data ||
      null;
    state.knowledgeScope = state.latest?.knowledge_scope || "simulation";
    syncKnowledgeScope();
    await loadKnowledge();
    syncWelcome();
    showView("chat");
    await loadHistory();
    if (state.latest) renderSources(state.latest);
  }
  // Deliberately small Markdown renderer: every model/document string is inserted as text.
  // No HTML parsing, external images, or unsafe link schemes are accepted.
  function inline(parent, text, result) {
    const regex =
      /(\*\*([^*]+)\*\*|`([^`]+)`|\[((?:D|U|W)[A-Z0-9]+)(?: [^\]]+)?\]|\[([^\]]+)\]\((https?:\/\/[^\s)]+)\))/g;
    let end = 0;
    for (const match of text.matchAll(regex)) {
      parent.append(document.createTextNode(text.slice(end, match.index)));
      let el;
      if (match[2]) {
        el = document.createElement("strong");
        el.textContent = match[2];
      } else if (match[3]) {
        el = document.createElement("code");
        el.textContent = match[3];
      } else if (match[4]) {
        el = document.createElement("button");
        el.className = "cite-button";
        el.textContent = match[4];
        el.onclick = () => {
          renderSources(result);
          $("sources-panel").hidden = false;
        };
      } else {
        el = document.createElement("a");
        el.textContent = match[5];
        el.href = match[6];
        el.target = "_blank";
        el.rel = "noopener noreferrer";
      }
      parent.append(el);
      end = match.index + match[0].length;
    }
    parent.append(document.createTextNode(text.slice(end)));
  }
  function markdown(parent, text, result) {
    let code = false,
      pre = null,
      list = null;
    for (const line of text.split("\n")) {
      if (line.startsWith("```")) {
        code = !code;
        if (code) {
          pre = document.createElement("pre");
          parent.append(pre);
        }
        continue;
      }
      if (code) {
        pre.textContent += line + "\n";
        continue;
      }
      if (!line.trim()) {
        list = null;
        continue;
      }
      let el;
      const bullet = line.match(/^\s*(?:[-*]|\d+\.)\s+(.+)/);
      if (bullet) {
        if (!list) {
          list = document.createElement("ul");
          parent.append(list);
        }
        el = document.createElement("li");
        inline(el, bullet[1], result);
        list.append(el);
      } else {
        list = null;
        el = document.createElement(/^#{1,6}\s/.test(line) ? "h3" : "p");
        inline(el, line.replace(/^#{1,6}\s/, ""), result);
        parent.append(el);
      }
    }
  }
  function renderMessage(role, text, result = {}, question = "") {
    const article = document.createElement("article");
    article.className = "message " + role;
    if (role === "user") {
      article.textContent = text;
    } else {
      const heading = document.createElement("div");
      heading.className = "assistant-heading";
      heading.innerHTML = `<span class="mini-mark">${icon("sprout")}</span><span>知行</span>`;
      const answer = document.createElement("div");
      answer.className = "answer";
      markdown(answer, text, result);
      const actions = document.createElement("div");
      actions.className = "message-actions";
      const sources = document.createElement("button");
      sources.className = "sources-button";
      sources.innerHTML = icon("book");
      sources.append(
        document.createTextNode(
          `${new Set((result.citations || []).map((s) => s.source_id)).size} 个引用 · 查看记录`,
        ),
      );
      sources.onclick = () => {
        renderSources(result);
        $("sources-panel").hidden = false;
      };
      const copy = document.createElement("button");
      copy.className = "icon-button";
      copy.innerHTML = icon("copy");
      copy.setAttribute("aria-label", "复制回答");
      copy.onclick = safe(async () => {
        await navigator.clipboard.writeText(text);
        toast("回答已复制");
      });
      const retry = document.createElement("button");
      retry.className = "icon-button";
      retry.innerHTML = icon("refresh");
      retry.setAttribute("aria-label", "重新提问");
      retry.onclick = () => {
        if (state.busy) return;
        $("message-input").value = question;
        toast("问题已放回输入框，可编辑后重新发送。");
        $("message-input").focus();
      };
      const tag = document.createElement("span");
      tag.className = "mode-tag";
      tag.textContent =
        (result.mode === "api" ? result.model : "离线演示") +
        " · " +
        ((result.latency_ms || 0) / 1000).toFixed(2) +
        "s";
      actions.append(sources, copy, retry, tag);
      article.append(heading, answer, actions);
    }
    $("messages").append(article);
    return article;
  }
  function renderSources(result) {
    const root = $("source-content");
    root.replaceChildren();
    const records = result.retrieval?.length
      ? result.retrieval
      : result.citations || [];
    if (!records.length) {
      const p = document.createElement("p");
      p.className = "small muted";
      p.textContent =
        "本轮未引用知识文档或网页。业务工具结果请见下方执行记录。";
      root.append(p);
    }
    const seen = new Set();
    for (const s of records) {
      const id = s.chunk_id || s.source_id;
      if (seen.has(id)) continue;
      seen.add(id);
      const card = document.createElement("div");
      card.className = "source-card";
      const label = document.createElement("span");
      label.className = "source-label";
      const cited = (result.citations || []).some((c) =>
        c.chunk_id ? c.chunk_id === s.chunk_id : c.source_id === s.source_id,
      );
      label.textContent = `${s.source_id} · ${s.source_type === "web" ? "网页摘要" : s.school ? s.school + "官方摘要" : "知识资料"} · ${cited ? "已引用" : "检索候选"}`;
      const title = document.createElement("h3");
      title.textContent = s.title;
      const body = document.createElement("p");
      body.textContent = s.text || s.section || "可在知识空间查看全文。";
      card.append(label, title, body);
      if (s.url && /^https?:\/\//.test(s.url)) {
        const link = document.createElement("a");
        link.href = s.url;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.textContent = "打开原始网页 ↗";
        card.append(link);
        const time = document.createElement("p");
        time.textContent = s.school
          ? `${s.school} · 来源日期：${s.source_date === "unknown" ? "未标注" : s.source_date} · 整理日期：${s.retrieved_at}`
          : `${s.provider || "公开搜索"} · 检索时间：${s.retrieved_at || "未知"}`;
        card.append(time);
      }
      root.append(card);
    }
    const details = document.createElement("details");
    details.className = "trace-block";
    details.open = true;
    const summary = document.createElement("summary");
    summary.textContent = "执行记录 · " + (result.trace || []).length + " 步";
    details.append(summary);
    for (const t of result.trace || []) {
      const item = document.createElement("div");
      item.className = "trace-step";
      item.textContent = `${t.step || "•"} · ${t.tool || t.action}`;
      if (t.arguments || t.result) {
        const pre = document.createElement("p");
        const data = t.result || t.arguments;
        pre.textContent = JSON.stringify(data, null, 2);
        item.append(pre);
      }
      details.append(item);
    }
    root.append(details);
  }
  function setBusy(busy) {
    state.busy = busy;
    root.dispatchEvent(new Event("assistant-state"));
    $("send-button").hidden = busy;
    $("stop-button").hidden = !busy;
    $("progress").hidden = !busy;
    $("message-input").disabled = busy;
    for (const id of ["web-toggle", "attach-document", "new-chat"])
      $(id).disabled = busy;
    $("knowledge-scope").disabled = busy;
    syncKnowledgeScope();
  }
  async function send() {
    const question = $("message-input").value.trim();
    if (!question || state.busy) return;
    showView("chat");
    setBusy(true);
    $("progress").textContent = "正在准备会话";
    let userNode;
    try {
      if (!state.id) {
        const created = await post("/api/conversations");
        state.id = created.id;
        localStorage.setItem("campus-current", state.id);
      }
      userNode = renderMessage("user", question);
      syncWelcome();
      $("message-input").value = "";
      $("message-input").style.height = "";
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream",
        },
        body: JSON.stringify({
          question,
          session_id: state.id,
          web: state.web,
          knowledge_scope: state.knowledgeScope,
        }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw Error(data.error || "无法发送消息。");
      }
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "",
        completed = false;
      while (true) {
        const { value, done } = await reader.read();
        buffer += decoder.decode(value || new Uint8Array(), { stream: !done });
        let boundary;
        while ((boundary = buffer.indexOf("\n\n")) >= 0) {
          const packet = buffer.slice(0, boundary);
          buffer = buffer.slice(boundary + 2);
          if (!packet.startsWith("data: ")) continue;
          const event = JSON.parse(packet.slice(6));
          if (event.event === "status")
            $("progress").textContent = event.message;
          if (event.event === "error") throw Error(event.message);
          if (event.event === "done") {
            completed = true;
            state.latest = event.data;
            state.messages.push(
              { role: "user", content: question, data: {} },
              {
                role: "assistant",
                content: event.data.answer,
                data: event.data,
              },
            );
            renderMessage("assistant", event.data.answer, event.data, question);
            renderSources(event.data);
          }
        }
        if (done) break;
      }
      if (!completed) throw Error("连接中断，未收到完整回答。请重试。");
      await loadHistory();
    } catch (e) {
      const err = document.createElement("div");
      err.className = "error-message";
      err.textContent = e.message;
      const retry = document.createElement("button");
      retry.textContent = "编辑问题后重试";
      retry.onclick = () => {
        $("message-input").value = question;
        err.remove();
        if (userNode) userNode.remove();
        syncWelcome();
        $("message-input").focus();
      };
      err.append(retry);
      $("messages").append(err);
      toast(e.message);
    } finally {
      setBusy(false);
      syncWelcome();
      $("message-input").focus();
      $("composer-anchor")?.scrollIntoView();
      scrollRoot.scrollTo({
        top: root.host?.scrollHeight || document.body.scrollHeight,
        behavior: "instant",
      });
    }
  }
  function confirmAction(title, message, value) {
    return new Promise((resolve) => {
      const dialog = $("confirm-dialog");
      $("confirm-title").textContent = title;
      $("confirm-message").textContent = message;
      $("confirm-input").hidden = value === undefined;
      $("confirm-input").value = value || "";
      let settled = false;
      const finish = (v) => {
        if (settled) return;
        settled = true;
        dialog.close();
        resolve(v);
      };
      $("confirm-ok").onclick = () =>
        finish(value === undefined ? true : $("confirm-input").value);
      $("confirm-cancel").onclick = () =>
        finish(value === undefined ? false : null);
      dialog.oncancel = () => finish(value === undefined ? false : null);
      dialog.showModal();
      (value === undefined ? $("confirm-cancel") : $("confirm-input")).focus();
    });
  }
  async function loadKnowledge() {
    const requestedScope = state.knowledgeScope;
    const data = await api("/api/knowledge?scope=" + requestedScope);
    if (requestedScope !== state.knowledgeScope) return;
    state.documents = data.items;
    $("doc-count").textContent = data.items.length;
    renderKnowledge();
  }
  function renderKnowledge() {
    const query = $("knowledge-search").value.toLowerCase();
    const items = state.documents.filter((d) =>
      (d.title + d.text + d.topic).toLowerCase().includes(query),
    );
    const root = $("knowledge-grid");
    root.replaceChildren();
    if (!items.length) {
      root.innerHTML =
        '<div class="empty-state">' +
        icon("search") +
        "<h3>还没有找到相关资料</h3><p>换一个关键词，或上传你自己的校园文档。</p></div>";
      return;
    }
    for (const d of items) {
      const b = document.createElement("button");
      b.className = "knowledge-card";
      const top = document.createElement("div");
      top.className = "card-top";
      top.innerHTML = icon("book");
      const tag = document.createElement("span");
      tag.textContent = d.topic;
      top.append(tag);
      const title = document.createElement("h3");
      title.textContent = d.title;
      const p = document.createElement("p");
      p.textContent = d.text.replace(/[#*\n]/g, " ").slice(0, 65) + "…";
      const bottom = document.createElement("div");
      bottom.className = "card-bottom";
      bottom.textContent = `${d.id} · ${d.characters} 字符 · ${d.uploaded ? "我的上传" : d.school ? d.school + "官方摘要" : "模拟资料"}`;
      bottom.insertAdjacentHTML("beforeend", icon("arrow-up-right"));
      b.append(top, title, p, bottom);
      b.onclick = () => openDocument(d);
      root.append(b);
    }
  }
  function openDocument(d) {
    $("document-title").textContent = d.title;
    $("document-meta").textContent = d.id + " · " + d.topic + " · " + d.note;
    $("document-body").textContent = d.text;
    $("document-actions").replaceChildren();
    if (d.url && /^https?:\/\//.test(d.url)) {
      const link = document.createElement("a");
      link.href = d.url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = "打开长安大学官方原文 ↗";
      $("document-actions").append(link);
      $("document-meta").textContent +=
        ` · 来源日期：${d.source_date === "unknown" ? "未标注" : d.source_date} · 整理日期：${d.retrieved_at}`;
    }
    if (d.uploaded) {
      const b = document.createElement("button");
      b.className = "secondary-button";
      b.textContent = "删除这份资料";
      b.onclick = safe(async () => {
        if (
          await confirmAction(
            "删除上传资料？",
            "这份资料将不再参与后续检索。已有对话中的来源快照仍会保留。",
          )
        ) {
          await api("/api/knowledge/" + d.id, { method: "DELETE", body: "{}" });
          $("document-dialog").close();
          await loadKnowledge();
          toast("资料已删除");
        }
      });
      $("document-actions").append(b);
    }
    $("document-dialog").showModal();
  }
  async function uploadFile() {
    if (state.knowledgeScope !== "simulation") {
      toast("请先切换到“模拟校园 + 我的上传”，官方资料不会混入个人上传。");
      return;
    }
    const file = $("file-input").files[0];
    if (!file) return;
    if (file.size > 500000) {
      toast("文档不能超过 500 KB。");
      return;
    }
    const form = new FormData();
    form.append("file", file);
    try {
      await api("/api/knowledge/upload", { method: "POST", body: form });
      await loadKnowledge();
      showView("knowledge");
      toast("资料已上传，可以参与知识库问答。");
    } finally {
      $("file-input").value = "";
    }
  }
  function renderSettings(c) {
    state.config = c;
    root.dispatchEvent(new Event("assistant-state"));
    $("provider-select").replaceChildren();
    for (const preset of c.presets) {
      const o = document.createElement("option");
      o.value = preset.id;
      o.textContent = preset.label;
      $("provider-select").append(o);
    }
    $("provider-select").value = c.provider;
    $("protocol-select").value = c.protocol;
    $("base-url").value = c.base_url;
    $("model-id").value = c.model;
    $("model-enabled").checked = c.enabled;
    for (const id of ["api-key", "search-key"]) $(id).value = "";
    $("clear-key").checked = false;
    $("clear-search-key").checked = false;
    $("key-status").textContent = c.has_api_key
      ? "当前进程已配置密钥；留空保持不变"
      : "尚未配置模型密钥";
    $("search-key-status").textContent = c.has_search_key
      ? "已配置 Tavily"
      : "未配置 · DuckDuckGo / Bing RSS 备用";
    $("model-label").textContent = c.enabled ? c.model : "离线演示";
    $("connection-note").textContent = c.enabled
      ? "模型已启用 · 回答可能产生 API 费用"
      : "离线演示 · 配置模型后可进行开放式智能问答";
  }
  async function openSettings() {
    renderSettings(await api("/api/settings"));
    $("settings-status").textContent = "";
    closeMenu();
    $("settings-dialog").showModal();
  }
  async function saveSettings(test = false) {
    if (!$("settings-form").reportValidity()) return;
    const buttons = $("settings-form").querySelectorAll("button");
    buttons.forEach((b) => (b.disabled = true));
    $("settings-status").textContent = "正在保存设置…";
    try {
      const c = await post("/api/settings", {
        enabled: $("model-enabled").checked,
        provider: $("provider-select").value,
        protocol: $("protocol-select").value,
        base_url: $("base-url").value,
        model: $("model-id").value,
        api_key: $("api-key").value,
        search_key: $("search-key").value,
        clear_key: $("clear-key").checked,
        clear_search_key: $("clear-search-key").checked,
      });
      renderSettings(c);
      if (test) {
        $("settings-status").textContent =
          "正在测试连接（一次小请求，可能产生费用）…";
        const result = await post("/api/settings/test");
        $("settings-status").textContent = result.message;
      } else {
        $("settings-dialog").close();
        toast("模型设置已保存");
      }
    } catch (e) {
      $("settings-status").textContent = e.message;
    } finally {
      buttons.forEach((b) => (b.disabled = false));
    }
  }
  function services() {
    const items = [
      [
        "book",
        "图书馆",
        "开放、借阅与续借",
        "图书馆开放时间和续借规则是什么？",
      ],
      ["card", "校园卡", "挂失、补办与充值", "校园卡丢了怎么办？"],
      ["list", "教务与选课", "课程选择与退补选", "怎么申请退补选课程？"],
      ["home", "宿舍与维修", "住宿、报修与校园生活", "宿舍水管坏了怎么报修？"],
      ["globe", "校园网络", "网络开通与常见故障", "校园网连不上怎么办？"],
      [
        "heart",
        "奖助与关怀",
        "奖助学金、支持与人工咨询",
        "奖助学金申请需要什么材料？",
      ],
      [
        "clock",
        "办理进度",
        "查询本地模拟申请记录",
        "查询申请进度，学号 S1001，申请编号 AP2026001",
      ],
      [
        "message",
        "人工协助",
        "建立本地模拟工单",
        "请转人工客服，我需要咨询特殊情况办理。",
      ],
    ];
    for (const [name, title, description, prompt] of items) {
      const b = document.createElement("button");
      b.className = "service-card";
      b.innerHTML =
        '<div class="card-top">' +
        icon(name) +
        icon("arrow-up-right") +
        "</div>";
      const h = document.createElement("h3");
      h.textContent = title;
      const p = document.createElement("p");
      p.textContent = description;
      b.append(h, p);
      b.onclick = () => {
        showView("chat");
        $("message-input").value = prompt;
        $("message-input").focus();
      };
      $("services-grid").append(b);
    }
  }
  icons();
  services();
  root
    .querySelectorAll("[data-view]")
    .forEach((b) => (b.onclick = () => showView(b.dataset.view)));
  root.querySelectorAll("[data-prompt]").forEach(
    (b) =>
      (b.onclick = () => {
        $("message-input").value = b.dataset.prompt;
        $("message-input").focus();
      }),
  );
  root
    .querySelectorAll("[data-close]")
    .forEach((b) => (b.onclick = () => $(b.dataset.close).close()));
  $("new-chat").onclick = newChat;
  async function setKnowledgeScope(nextScope) {
    if (state.busy) {
      syncKnowledgeScope();
      return;
    }
    if (
      !["chd_public", "simulation"].includes(nextScope) ||
      nextScope === state.knowledgeScope
    )
      return;
    const draft = $("message-input").value;
    newChat();
    state.knowledgeScope = nextScope;
    $("message-input").value = draft;
    syncKnowledgeScope();
    await loadKnowledge();
    toast("已切换资料范围并开启新对话，历史会话保留。");
  }
  $("knowledge-scope").onchange = safe(() =>
    setKnowledgeScope($("knowledge-scope").value),
  );
  syncKnowledgeScope();
  $("chat-form").onsubmit = (e) => {
    e.preventDefault();
    send();
  };
  $("message-input").onkeydown = (e) => {
    if (e.key === "Enter" && !e.shiftKey && !e.isComposing) {
      e.preventDefault();
      send();
    }
  };
  $("message-input").oninput = () => {
    $("message-input").style.height = "auto";
    $("message-input").style.height =
      Math.min($("message-input").scrollHeight, 170) + "px";
  };
  $("stop-button").onclick = safe(async () => {
    await post("/api/cancel", { session_id: state.id });
    $("progress").textContent =
      "停止请求已发送；正在等待当前网络请求结束（最多约 30 秒）。";
  });
  $("web-toggle").onclick = () => {
    state.web = !state.web;
    $("web-toggle").setAttribute("aria-pressed", String(state.web));
    $("context-hint").textContent = state.web
      ? "允许搜索公开网页"
      : "基于校园知识库回答";
    if (state.web)
      toast("已开启联网；搜索词会发送到搜索服务，请勿包含隐私信息。");
  };
  $("open-settings").onclick = safe(openSettings);
  $("model-badge").onclick = safe(openSettings);
  $("settings-form").onsubmit = (e) => {
    e.preventDefault();
    saveSettings();
  };
  $("test-connection").onclick = () => saveSettings(true);
  $("provider-select").onchange = () => {
    const p = state.config.presets.find(
      (p) => p.id === $("provider-select").value,
    );
    $("base-url").value = p.base_url;
    $("model-id").value = p.model;
    $("protocol-select").value = p.protocol;
    $("api-key").value = "";
    $("key-status").textContent = "切换接口地址或协议会清除原模型密钥";
  };
  $("theme-toggle").onclick = () => {
    const theme = themeRoot.dataset.theme === "dark" ? "light" : "dark";
    themeRoot.dataset.theme = theme;
    localStorage.setItem("campus-theme", theme);
  };
  themeRoot.dataset.theme = localStorage.getItem("campus-theme") || "light";
  $("menu-toggle").onclick = () => {
    $("sidebar").classList.add("open");
    $("sidebar-scrim").hidden = false;
    $("menu-toggle").setAttribute("aria-expanded", "true");
    syncMobileNav();
    $("new-chat").focus();
  };
  $("sidebar-scrim").onclick = () => {
    closeMenu();
    $("menu-toggle").focus();
  };
  matchMedia("(max-width:760px)").addEventListener("change", () => {
    closeMenu();
    syncMobileNav();
  });
  syncMobileNav();
  $("toggle-sources").onclick = () => {
    $("sources-panel").hidden = !$("sources-panel").hidden;
  };
  $("close-sources").onclick = () => ($("sources-panel").hidden = true);
  $("knowledge-search").oninput = renderKnowledge;
  for (const id of ["attach-document", "upload-document"])
    $(id).onclick = () => $("file-input").click();
  $("file-input").onchange = safe(uploadFile);
  $("export-chat").onclick = () => {
    if (!state.messages.length) {
      toast("先开始一段对话，再导出记录。");
      return;
    }
    const text =
      "# 长安知行对话记录\n\n" +
      state.messages
        .map(
          (m) =>
            "## " +
            (m.role === "user" ? "我" : "知行") +
            "\n\n" +
            m.content +
            "\n\n" +
            (m.data?.citations || [])
              .map(
                (s) =>
                  "- " +
                  s.source_id +
                  " " +
                  s.title +
                  (s.url ? " " + s.url : ""),
              )
              .join("\n"),
        )
        .join("\n\n");
    const url = URL.createObjectURL(
      new Blob([text], { type: "text/markdown;charset=utf-8" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "长安知行对话-" + new Date().toISOString().slice(0, 10) + ".md";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  document.addEventListener("keydown", (e) => {
    if (root.host?.hidden) return;
    if (e.key === "Escape") closeMenu();
    if (
      e.key.toLowerCase() === "n" &&
      !e.metaKey &&
      !e.ctrlKey &&
      !e.altKey &&
      !root.querySelector("dialog[open]") &&
      !["INPUT", "TEXTAREA", "SELECT"].includes(
        (root.activeElement || document.activeElement)?.tagName,
      )
    ) {
      e.preventDefault();
      newChat();
    }
  });
  const ready = (async () => {
    try {
      await Promise.all([
        api("/api/settings").then(renderSettings),
        loadHistory(),
        loadKnowledge(),
      ]);
      const id = localStorage.getItem("campus-current");
      if (id) {
        try {
          await openConversation(id);
        } catch {
          localStorage.removeItem("campus-current");
        }
      }
    } catch (e) {
      toast(e.message);
    }
  })();
  mountExplorer(root, { $, state, toast });
  import("./ion-assistant.js")
    .then(({ mountIonAssistant }) => mountIonAssistant(root, state))
    .catch(() => {
      $("ion-hint").textContent = "三维效果暂不可用，仍可正常输入问题";
      $("ion-motion").hidden = true;
      $("ion-reset").hidden = true;
      $("ion-field").tabIndex = -1;
      $("ion-field").setAttribute("aria-label", "静态核心示意，三维模块不可用");
    });
  return {
    ready,
    state,
    showView,
    loadHistory,
    openConversation,
    setKnowledgeScope,
    closeMenu,
    async refresh() {
      if (state.busy) return;
      await Promise.all([
        loadHistory(),
        api("/api/settings").then(renderSettings),
      ]);
      const id = localStorage.getItem("campus-current");
      if (id) {
        try {
          await openConversation(id);
        } catch {
          /* Preserve existing draft on unavailable history. */
        }
      }
    },
  };
}
