import { layout, mapSource } from "./campus-layout.js";
import { createLandmarkFilm } from "./landmark-film.js";
const $ = (id) => document.getElementById(id);
const paths = {
  sun: "M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5M16 12a4 4 0 1 1-8 0 4 4 0 0 1 8 0",
  arrow: "M4 12h16m-6-6 6 6-6 6",
  left: "m15 5-7 7 7 7",
  right: "m9 5 7 7-7 7",
  plus: "M12 4v16M4 12h16",
  minus: "M4 12h16",
  reset: "M20 7v5h-5M5 7a8 8 0 1 1-1 9",
  pause: "M8 5v14M16 5v14",
  play: "m7 4 13 8-13 8Z",
  close: "m5 5 14 14M19 5 5 19",
  chat: "M20 16H9l-6 5V4h18v12Z",
  layers: "m12 3 10 5-10 5L2 8Zm-10 9 10 5 10-5M2 16l10 5 10-5",
  pin: "M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 0 1 14 0ZM15 10a3 3 0 1 1-6 0 3 3 0 0 1 6 0",
  expand: "M8 3H3v5m13-5h5v5M3 16v5h5m13-5v5h-5",
  dining: "M4 3v6m3-6v6M4 6h3M5.5 9v12M17 3v18m0-18c-5 4-5 9 0 9",
  sport:
    "M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0ZM2 12h20M12 2v20M5 5c8 2 6 12 14 14M19 5C11 7 13 17 5 19",
  health: "M4 21V6h16v15H4Zm5 0v-5h6v5M12 8v6m-3-3h6",
  activity: "M3 21V8l9-5 9 5v13H3Zm5-11v7m4-7v7m4-7v7",
  market: "M3 10V5h18v5M3 10l2 3 4-3 3 3 3-3 4 3 2-3M5 13v8h14v-8M9 21v-5h6v5",
  transit: "M5 17V5c0-3 14-3 14 0v12H5Zm0-8h14M8 17v3m8-3v3M7 13h2m6 0h2",
};
function icon(name) {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${paths[name]}"/></svg>`;
}
document
  .querySelectorAll("[data-icon]")
  .forEach((el) => (el.innerHTML = icon(el.dataset.icon)));
export const places = {
  library: {
    name: "逸夫图书馆",
    en: "The Library",
    description:
      "从一座图书馆，走进长大的阅读日常。这里可以查阅借阅、续借与数据库访问资料。",
    match: /图书|借阅|续借/,
    question: "长安大学校外如何访问图书馆数据库？",
  },
  study: {
    name: "修远教学楼",
    en: "Xiuyuan Learning",
    description:
      "从地图上的教学区，走进熟悉的课堂。这里汇总学业与教务咨询，不代表具体业务办理窗口位于这栋楼。",
    match: /选课|教务|奖助|奖学/,
    question: "长安大学研究生如何办理在读证明？",
  },
  life: {
    name: "鸿翔园生活社区",
    en: "Campus Living",
    description:
      "宿舍之间，是长大日常发生的地方。西区住宿组团汇入同一个生活服务入口，咨询校园卡与报修流程。",
    match: /宿舍|报修|校园卡/,
    question: "长安大学校园卡丢失如何挂失？",
  },
  activities: {
    name: "文化艺术中心",
    en: "Campus Arts",
    icon: "activity",
    description:
      "从地图走进长安文化艺术中心。活动、社团与场地相关问题可以带入助手；未核实的日程和预约信息不会编造。",
    match: /活动|社团/,
    question: "长安大学社团活动与文化艺术中心的信息应从哪些官方渠道查询？",
    unverified: true,
  },
  highway: {
    name: "公路学院组团",
    en: "Highway Engineering",
    description:
      "走进公路基础设施创新建设平台。综合楼与道路实验设施合并为一个学院入口，照片来自学校基建处建成实景档案，并非实时影像。",
    match: /公路|道路|桥梁/,
    question: "长安大学公路学院的专业、教学与实验室信息应从哪些官方渠道查询？",
    unverified: true,
  },
  materials: {
    name: "建工·材料学院组团",
    en: "Structures & Materials",
    description:
      "从校园西南角，走进建筑实验中心的中庭。建工、材料学院实验楼与土工、结构实验中心整合展示；图中是建筑内部的真实空间。",
    match: /建工|材料|结构|土工/,
    question:
      "长安大学建工与材料相关学院的教学、实验室与办事信息应从哪些官方渠道查询？",
    unverified: true,
  },
  information: {
    name: "信息·交通学院组团",
    en: "Information & Transport",
    description:
      "实景为信息工程学院大楼。北部科研教学区域合并为信息与交通探索入口；组团位置仅作示意，具体办公室和到访地点请核对学院官网。",
    match: /信息|计算机|交通|智能|电控/,
    question:
      "长安大学信息工程学院与运输工程学院有哪些官方咨询渠道？请区分学院并给出来源。",
    unverified: true,
  },
};
for (const [key, p] of Object.entries(places)) Object.assign(p, layout[key]);
document.getElementById("map-source").href = mapSource;
$("places").replaceChildren();
for (const [key, p] of Object.entries(places)) {
  const button = document.createElement("button"),
    name = document.createElement("span");
  button.dataset.place = key;
  name.textContent = p.name;
  button.append(name);
  $("places").append(button);
}
let documents = [],
  selected = null,
  world = null,
  knowledgeError = false,
  paused = matchMedia("(prefers-reduced-motion: reduce)").matches;
let opener = null,
  sessionId = null,
  busy = false;
async function api(path, options = {}) {
  const r = await fetch(path, {
    ...options,
    headers: { "Content-Type": "application/json", ...options.headers },
  });
  let data;
  try {
    data = await r.json();
  } catch {
    throw Error("服务返回异常，请检查本地服务后重试。");
  }
  if (!r.ok) throw Error(data.error || "请求失败，请稍后重试。");
  return data;
}
function makeDocument(d, full) {
  const details = document.createElement("details"),
    summary = document.createElement("summary");
  const title = document.createElement("span");
  title.textContent = d.title;
  summary.append(title);
  if (full) {
    const meta = document.createElement("small");
    meta.textContent = d.id + " / " + d.topic;
    summary.append(meta);
  }
  const body = document.createElement("div");
  body.className = "document-content";
  body.textContent = d.text;
  const ask = document.createElement("button");
  ask.className = "ask-doc";
  ask.textContent = "请知行解释这份资料";
  ask.onclick = () =>
    openAssistant("请根据《" + d.title + "》说明办理条件和步骤。", ask);
  details.append(summary, body, ask);
  return details;
}
function placeDocs() {
  const root = $("place-docs");
  root.replaceChildren();
  if (places[selected].unverified) {
    root.textContent =
      "尚未收录该场景的长安大学官方业务资料。可带入助手整理问题；实时信息需另行核实，不代表已经接入办理服务。";
    return;
  }
  const items = documents.filter((d) =>
    places[selected].match.test(d.title + " " + d.topic),
  );
  if (!items.length) {
    root.textContent = knowledgeError
      ? "资料加载失败，请刷新重试或进入工作台。"
      : "暂未找到相关资料，可向知行咨询。";
    return;
  }
  items.forEach((d) => root.append(makeDocument(d, false)));
}
let mapReturn = null;
function choosePlace(key, focus = true, anchor = null) {
  if (!places[key]) return;
  enterCampus(false);
  if ($("campus-directory").open) $("campus-directory").close();
  if (!selected) mapReturn = world?.snapshot();
  selected = key;
  const p = places[key];
  $("campus").classList.add("is-selected");
  $("place-panel").hidden = false;
  $("place-title").textContent = p.name;
  $("place-en").textContent = p.virtual
    ? "线上入口 · 不标注实体位置"
    : key === "life"
      ? "多片区生活社区 · 渭水校区"
      : p.mapName + " · 渭水校区";
  $("place-description").textContent = p.description;
  const photo = placePhotos[key];
  $("place-photo").hidden = !photo;
  if (photo) {
    $("place-photo-image").src = photo.src;
    $("place-photo-image").alt = photo.title;
    $("place-photo-open").href = photo.src;
    $("place-photo-caption").textContent =
      photo.title + " · 实景参考，三维模型不复刻该建筑";
  }
  $("place-progress").textContent =
    `${Object.keys(places).indexOf(key) + 1} / ${Object.keys(places).length}`;
  const questions = {
    library: "长安大学校外如何访问图书馆数据库？",
    study: "长安大学研究生如何办理在读证明？",
    life: "长安大学校园卡丢失如何挂失？",
  };
  $("place-agent").dataset.agentPrompt = questions[key] || p.question;
  $("place-ask").hidden = Boolean(p.unverified);
  $("map-results").hidden = true;
  document
    .querySelectorAll("[data-place]")
    .forEach((b) =>
      b.setAttribute("aria-pressed", String(b.dataset.place === key)),
    );
  placeDocs();
  film.open(photo, key, () => world?.focus(key, anchor, true));
  if (focus) $("place-title").focus({ preventScroll: true });
}
function closePlace(immediate = false) {
  const previous = selected;
  selected = null;
  $("campus").classList.remove("is-selected");
  $("place-panel").hidden = true;
  document
    .querySelectorAll("[data-place]")
    .forEach((b) => b.setAttribute("aria-pressed", "false"));
  const restore = mapReturn;
  mapReturn = null;
  film
    .close(
      () =>
        restore ? world?.restore(restore) : world?.chapter(currentChapter),
      immediate,
    )
    .then((done) => {
      if (done && !selected && previous) {
        const previousButton = document.querySelector(
          '#places [data-place="' + previous + '"]',
        );
        (previousButton.hidden
          ? document.querySelector(`button[data-chapter="${currentChapter}"]`)
          : previousButton
        ).focus({ preventScroll: true });
      }
    });
}
document.querySelectorAll("[data-place]").forEach((b) => {
  b.setAttribute("aria-pressed", "false");
  b.onclick = () => choosePlace(b.dataset.place);
});
$("close-place").onclick = () => closePlace();
$("landmark-back").onclick = () => closePlace();
// A chapter is a real camera composition plus a bounded service directory.
const chapters = {
  overview: {
    title: "校园，\n在你手中。",
    copy: "旋转校园，选择一个地点。\n让问题从具体的场景开始。",
    places: Object.keys(places),
  },
  learning: {
    title: "让好奇，\n有处可去。",
    copy: "从阅读、课堂，到学院与实验室。\n选择组团，走进长大的真实空间。",
    places: ["library", "study", "highway", "materials", "information"],
  },
  living: {
    title: "把日常，\n照顾妥当。",
    copy: "走进鸿翔园的校园日常。\n从生活场景开始，找到办理指引。",
    places: ["life"],
  },
  connection: {
    title: "让连接，\n不止在线。",
    copy: "走进文化艺术中心。\n把活动与社团的问题交给助手。",
    places: ["activities"],
  },
};
const photoBase = "/static/assets/campus-open-day/";
const photos = {
  overview: { src: photoBase + "chd-hero.jpg", title: "北校区逸夫图书馆" },
  learning: { src: photoBase + "chd-learning-web.jpg", title: "修远教学楼" },
  living: {
    src: photoBase + "chd-living-web.jpg",
    title: "一站式社区 · 鸿翔园",
  },
  connection: {
    src: photoBase + "chd-activities-web.jpg",
    title: "长安文化艺术中心",
  },
};
const placePhotos = {
  library: photos.overview,
  study: photos.learning,
  life: photos.living,
  activities: photos.connection,
  highway: {
    src: photoBase + "chd-highway-web.jpg",
    title: "公路基础设施创新建设平台 · 建成档案实景",
    source: "https://jjc.chd.edu.cn/2018/1109/c747a52265/page.htm",
    sourceLabel: "长安大学基建处",
  },
  materials: {
    src: photoBase + "chd-materials-web.jpg",
    title: "建筑实验中心 · 中庭实景",
    source: "https://jjc.chd.edu.cn/2018/1109/c747a52266/page.htm",
    sourceLabel: "长安大学基建处",
  },
  information: {
    src: photoBase + "chd-information-web.jpg",
    title: "信息工程学院大楼 · 外观实景",
    source: "https://ticvse.chd.edu.cn/info/1010/1376.htm",
    sourceLabel: "长安大学官方教学中心",
  },
};
const film = createLandmarkFilm({
  getWorld: () => world,
  reduced: () => paused,
});
const warmPhotos = () => film.preload(Object.values(placePhotos));
if ("requestIdleCallback" in window)
  requestIdleCallback(warmPhotos, { timeout: 2500 });
else setTimeout(warmPhotos, 1000);
let photoTicket = 0;
async function updatePhoto(key) {
  const ticket = ++photoTicket,
    photo = photos[key],
    candidate = new Image();
  candidate.src = photo.src;
  try {
    await candidate.decode();
  } catch {
    $("chapter-status").textContent =
      "分区照片暂时无法加载，保留上一张照片；三维服务入口仍可使用。";
    return;
  }
  if (ticket !== photoTicket) return;
  document.querySelector(".intro-art").src = photo.src;
  document.querySelector(".intro-art").alt = "长安大学官网照片：" + photo.title;
  $("photo-source").textContent =
    "长安大学 · " + photo.title + " / 图片来源：学校官网";
  $("intro-title").textContent =
    key === "overview" ? "你的校园，\n自在探索。" : chapters[key].title;
  $("intro-description").textContent =
    key === "overview"
      ? "从一个地点，找到一个答案。\n为长安大学的学习与生活而设计。"
      : photo.title +
        "，长大日常的一帧。\n进入三维教学场景，继续探索本区服务。";
  $("campus-intro").dataset.photo = key;
  if (!paused && !$("campus").classList.contains("has-entered"))
    document.querySelector(".intro-art").animate(
      [
        { opacity: 0.35, transform: "scale(1.045)" },
        { opacity: 1, transform: "scale(1.025)" },
      ],
      { duration: 700, easing: "cubic-bezier(.16,1,.3,1)" },
    );
}
function showPhoto() {
  if (selected) closePlace(true);
  $("campus").classList.remove("has-entered", "map-expanded");
  $("map-expand").setAttribute("aria-pressed", "false");
  $("map-expand-text").textContent = "展开地图";
  document.body.classList.remove("is-exploring");
  $("campus-intro").inert = false;
  world?.active(false);
  updatePhoto(currentChapter);
}
let currentChapter = "overview";
function enterCampus(focus = true) {
  $("campus").classList.add("has-entered");
  document.body.classList.add("is-exploring");
  $("campus-intro").inert = true;
  world?.active(true);
  if (focus)
    document
      .querySelector(`button[data-chapter="${currentChapter}"]`)
      .focus({ preventScroll: true });
}
function chooseChapter(key, keepPhoto = false) {
  if (selected) closePlace(true);
  currentChapter = key;
  enterCampus(false);
  const chapter = chapters[key];
  $("chapter-title").textContent = chapter.title;
  $("chapter-copy").textContent = chapter.copy;
  document
    .querySelectorAll("button[data-chapter]")
    .forEach((b) =>
      b.setAttribute("aria-pressed", String(b.dataset.chapter === key)),
    );
  document
    .querySelectorAll("#places [data-place]")
    .forEach((b) => (b.hidden = !chapter.places.includes(b.dataset.place)));
  $("scene-hint").replaceChildren(
    document.createTextNode(
      `${chapter.places.length} 项服务 · 地标与线上入口联动 `,
    ),
  );
  const note = document.createElement("span");
  note.textContent = "据 2023 版校图整理 · 非测绘导航";
  $("scene-hint").append(note);
  $("chapter-status").textContent =
    `已切换${document.querySelector(`button[data-chapter="${key}"] span`).textContent}，${chapter.places.length}个服务地点`;
  $("map-view").setAttribute("aria-pressed", "false");
  world?.chapter(key);
  updatePhoto(key);
  if (keepPhoto) showPhoto();
  if (!paused)
    $("chapter-title").animate(
      [
        { opacity: 0.2, transform: "translateY(20px)" },
        { opacity: 1, transform: "translateY(0)" },
      ],
      { duration: 650, easing: "cubic-bezier(.16,1,.3,1)" },
    );
}
$("enter-campus").onclick = () => enterCampus();
$("nav-explore").addEventListener("click", () => {
  if (selected) closePlace();
  else enterCampus();
});
$("return-intro").onclick = () => {
  chooseChapter("overview");
  showPhoto();
  $("enter-campus").focus({ preventScroll: true });
};
$("photo-mode").onclick = () => {
  showPhoto();
  $("enter-campus").focus({ preventScroll: true });
};
document.querySelectorAll("button[data-chapter]").forEach((b, i, buttons) => {
  b.onclick = () =>
    chooseChapter(
      b.dataset.chapter,
      !$("campus").classList.contains("has-entered"),
    );
  b.onkeydown = (e) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key)) return;
    e.preventDefault();
    const next =
      e.key === "Home"
        ? 0
        : e.key === "End"
          ? buttons.length - 1
          : (i + (e.key === "ArrowRight" ? 1 : -1) + buttons.length) %
            buttons.length;
    buttons[next].focus();
    buttons[next].click();
  };
});
for (const [id, delta] of [
  ["previous-place", -1],
  ["next-place", 1],
])
  $(id).onclick = () => {
    const keys = Object.keys(places),
      index = keys.indexOf(selected);
    choosePlace(keys[(index + delta + keys.length) % keys.length]);
  };
const directoryGroups = [
  { title: "求知之间", photo: photos.learning, places: ["library", "study"] },
  {
    title: "学院与实验室",
    photo: placePhotos.information,
    places: ["highway", "materials", "information"],
  },
  { title: "生活与文化", photo: photos.living, places: ["life", "activities"] },
];
for (const section of directoryGroups) {
  const group = document.createElement("section"),
    heading = document.createElement("h3"),
    photo = document.createElement("img"),
    caption = document.createElement("p");
  group.className = "directory-group";
  heading.textContent = section.title;
  photo.src = section.photo.src;
  photo.alt = section.photo.title;
  photo.loading = "lazy";
  caption.textContent = section.photo.title + " · 官网实景";
  group.append(photo, heading, caption);
  for (const key of section.places) {
    const p = places[key];
    const b = document.createElement("button"),
      name = document.createElement("span"),
      en = document.createElement("small");
    name.textContent = p.name;
    en.textContent = p.virtual
      ? "线上咨询 · 无实体地标"
      : "渭水校区 · 地标服务";
    b.append(name, en);
    b.dataset.destination = key;
    b.onclick = () => {
      chooseChapter("overview");
      choosePlace(key);
    };
    group.append(b);
  }
  $("directory-list").append(group);
}
$("open-directory").onclick = () => $("campus-directory").showModal();
$("close-directory").onclick = () => $("campus-directory").close();
$("campus-directory").addEventListener("close", () => {
  if (!selected) $("open-directory").focus({ preventScroll: true });
});
$("campus-directory").addEventListener("cancel", (e) => e.stopPropagation());
// Skip link should expose its target before the browser transfers focus.
document
  .querySelector(".skip")
  .addEventListener("click", () => enterCampus(false));
function renderGuide() {
  const q = $("guide-query").value.trim().toLowerCase();
  const items = documents.filter((d) =>
    (d.title + d.text + d.topic).toLowerCase().includes(q),
  );
  $("guide-list").replaceChildren();
  items
    .slice(0, 3)
    .forEach((d) => $("guide-list").append(makeDocument(d, true)));
  $("guide-count").textContent = knowledgeError
    ? "加载失败"
    : `${items.length} 份资料${items.length > 3 ? " · 预览 3 份" : ""}`;
  if (!items.length)
    $("guide-list").textContent = knowledgeError
      ? "暂时无法加载资料，请检查本地服务后刷新。"
      : "没有匹配的资料，换一个关键词试试。";
}
$("guide-query").oninput = renderGuide;
function openAssistant(question = "", trigger = null) {
  opener = trigger || document.activeElement;
  $("assistant-panel").hidden = false;
  $("assistant-launch").hidden = true;
  const input = $("assistant-question");
  if (question && !busy)
    input.value = input.value.trim()
      ? input.value.trimEnd() + "\n" + question
      : question;
  input.focus({ preventScroll: true });
}
function closeAssistant() {
  $("assistant-panel").hidden = true;
  $("assistant-launch").hidden = false;
  (opener?.isConnected ? opener : $("assistant-launch")).focus({
    preventScroll: true,
  });
}
$("assistant-launch").onclick = () => openAssistant();
$("guide-ask").onclick = () => openAssistant();
$("assistant-close").onclick = closeAssistant;
$("place-ask").onclick = () =>
  openAssistant(places[selected].question, $("place-ask"));
document.addEventListener("keydown", (e) => {
  if (document.getElementById("campus-surface").hidden) return;
  if ($("campus-directory").open) return;
  if (e.key === "Escape") {
    if (!$("assistant-panel").hidden) closeAssistant();
    else if (selected) closePlace();
    else if (!$("map-results").hidden) $("map-results").hidden = true;
    else if ($("campus").classList.contains("map-expanded")) toggleMap();
  }
});
function message(text, role, scroll = true) {
  const p = document.createElement("div");
  p.className = "chat-entry " + role;
  p.textContent = text;
  $("assistant-messages").append(p);
  if (scroll) p.scrollIntoView({ block: "nearest" });
  return p;
}
$("assistant-form").onsubmit = async (e) => {
  e.preventDefault();
  if (busy) return;
  const q = $("assistant-question").value.trim();
  if (!q) return;
  busy = true;
  $("assistant-send").disabled = true;
  $("assistant-question").disabled = true;
  $("assistant-status").textContent = "正在检索与处理，请稍候…";
  message(q, "user");
  try {
    if (!sessionId) {
      const c = await api("/api/conversations", { method: "POST", body: "{}" });
      sessionId = c.id;
      localStorage.setItem("campus-current", sessionId);
    }
    const data = await api("/api/chat", {
      method: "POST",
      body: JSON.stringify({
        question: q,
        session_id: sessionId,
        web: $("assistant-web").checked,
      }),
    });
    const p = message(
      data.answer || "未收到回答，请在完整工作台中重试。",
      "assistant",
    );
    for (const c of data.citations || []) {
      const source = document.createElement("span");
      source.className = "answer-source";
      source.textContent = "来源：" + (c.title || c.source_id);
      if (c.url && /^https?:\/\//i.test(c.url)) {
        const a = document.createElement("a");
        a.href = c.url;
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        a.textContent = " · 查看原文";
        source.append(a);
      }
      p.append(source);
    }
    $("assistant-question").value = "";
    $("assistant-status").textContent = "已完成。会话也可在完整工作台中查看。";
    document.dispatchEvent(new CustomEvent("campus-conversation-updated"));
  } catch (error) {
    $("assistant-status").textContent =
      error.message + " 原问题已保留，可重试。";
  } finally {
    busy = false;
    $("assistant-send").disabled = false;
    $("assistant-question").disabled = false;
  }
};
document.addEventListener("campus-mode", async (e) => {
  if (e.detail !== "campus" || busy) return;
  const id = localStorage.getItem("campus-current");
  try {
    const [health, conversation] = await Promise.all([
      api("/api/health"),
      id
        ? api("/api/conversations/" + encodeURIComponent(id))
        : Promise.resolve(null),
    ]);
    if (busy || id !== localStorage.getItem("campus-current")) return;
    const latest = [...(conversation?.messages || [])]
      .reverse()
      .find((m) => m.role === "assistant");
    if (
      latest?.data?.knowledge_scope &&
      latest.data.knowledge_scope !== "simulation"
    ) {
      sessionId = null;
      $("assistant-messages").replaceChildren();
      message(
        "此处为模拟校园轻问答。长安大学官方资料对话已保留，请返回 Agent 工作台继续。",
        "assistant",
        false,
      );
      $("assistant-status").textContent =
        "当前为模拟资料，不会混入长安大学会话。";
      return;
    }
    sessionId = id;
    $("model-status").textContent =
      health.mode === "api"
        ? "模型连接 · " + health.model
        : "离线演示 · 基于校园资料回答";
    $("assistant-messages").replaceChildren();
    if (!conversation?.messages?.length)
      message("你好，今天想了解校园里的哪件事？", "assistant", false);
    for (const item of conversation?.messages || []) {
      const entry = message(item.content, item.role, false);
      for (const citation of item.data?.citations || []) {
        const source = document.createElement("span");
        source.className = "answer-source";
        source.textContent = "来源：" + (citation.title || citation.source_id);
        entry.append(source);
      }
    }
  } catch {
    /* Keep the last readable response if the service is temporarily unavailable. */
  }
});
function motionState() {
  $("motion-toggle").setAttribute("aria-pressed", String(paused));
  $("motion-toggle").setAttribute(
    "aria-label",
    paused ? "恢复场景动态" : "暂停场景动态",
  );
  $("motion-toggle").title = paused ? "恢复动态" : "暂停动态";
  $("motion-toggle").innerHTML = icon(paused ? "play" : "pause");
  world?.pause(paused);
}
$("motion-toggle").onclick = () => {
  paused = !paused;
  motionState();
};
matchMedia("(prefers-reduced-motion: reduce)").addEventListener(
  "change",
  (e) => {
    paused = e.matches;
    motionState();
  },
);
motionState();
function toggleMap() {
  const expanded = $("campus").classList.toggle("map-expanded");
  $("map-expand").setAttribute("aria-pressed", String(expanded));
  $("map-expand-text").textContent = expanded ? "收起地图" : "展开地图";
  $("campus").scrollIntoView({ block: "start", behavior: "instant" });
  $("map-expand").focus({ preventScroll: true });
}
$("map-expand").onclick = toggleMap;
$("map-view").onclick = () => {
  const top = $("map-view").getAttribute("aria-pressed") !== "true";
  $("map-view").setAttribute("aria-pressed", String(top));
  world?.view(top);
};
$("map-labels-toggle").onclick = () => {
  const shown = $("map-labels-toggle").getAttribute("aria-pressed") !== "true";
  $("map-labels-toggle").setAttribute("aria-pressed", String(shown));
  $("scene-labels").hidden = !shown || document.body.dataset.scene !== "ready";
};
const mapAliases = {
  library: "图书馆 借书 还书 续借 阅读 数据库",
  study: "教务 选课 成绩 证明 研究生",
  life: "生活 宿舍 报修 校园卡 挂失 补办",
  activities: "社团 活动 学生中心 演出",
  highway: "道路 桥梁 公路 基础设施 综合楼 学院",
  materials: "建筑 土木 建工 材料 结构 土工 实验中心 学院",
  information: "信息 计算机 运输 交通 电控 智通 学院 智能",
};
$("map-query").oninput = () => {
  const q = $("map-query").value.trim().toLowerCase();
  const results = $("map-results");
  results.replaceChildren();
  results.hidden = !q;
  if (!q) {
    $("map-search-status").textContent = "";
    return;
  }
  const matches = Object.entries(places).filter(([key, place]) =>
    (place.name + mapAliases[key]).toLowerCase().includes(q),
  );
  $("map-search-status").textContent = `找到 ${matches.length} 个服务地点`;
  if (!matches.length) {
    const p = document.createElement("p");
    p.textContent =
      "未找到实景地标。试试“图书馆”“修远”或“鸿翔园”；其他问题可直接进入 Agent 工作台。";
    results.append(p);
  }
  for (const [key, place] of matches) {
    const button = document.createElement("button");
    button.textContent = place.name + " · 定位并查看服务";
    button.onclick = () => choosePlace(key);
    results.append(button);
  }
};
$("map-query").onkeydown = (e) => {
  if (
    (e.key === "Enter" || e.key === "ArrowDown") &&
    !$("map-results").hidden
  ) {
    e.preventDefault();
    const first = $("map-results").querySelector("button");
    if (e.key === "Enter") first?.click();
    else first?.focus();
  }
  if (e.key === "Escape") {
    e.stopPropagation();
    $("map-results").hidden = true;
  }
};
$("light-toggle").onclick = () => {
  const night = document.body.classList.toggle("night");
  $("light-toggle").setAttribute("aria-label", night ? "切换日景" : "切换夜景");
  world?.night(night);
};
for (const [id, action] of [
  ["rotate-left", () => world?.rotate(-0.3)],
  ["rotate-right", () => world?.rotate(0.3)],
  ["zoom-in", () => world?.zoom(-2)],
  ["zoom-out", () => world?.zoom(2)],
  [
    "reset-camera",
    () => {
      if (selected) closePlace();
      else world?.reset();
      $("map-view").setAttribute("aria-pressed", "false");
    },
  ],
])
  $(id).onclick = action;
api("/api/knowledge")
  .then((d) => {
    documents = d.items;
    renderGuide();
    if (selected) placeDocs();
  })
  .catch(() => {
    knowledgeError = true;
    renderGuide();
    if (selected) placeDocs();
  });
api("/api/health")
  .then(
    (d) =>
      ($("model-status").textContent =
        d.mode === "api"
          ? `模型连接 · ${d.model}`
          : "离线演示 · 基于校园资料回答"),
  )
  .catch(
    () => ($("model-status").textContent = "服务暂不可用，请检查本地服务"),
  );
import("./campus-world.js")
  .then(async (module) => {
    world = await module.createWorld(places, choosePlace);
    world.pause(paused);
    world.night(document.body.classList.contains("night"));
    world.view($("map-view").getAttribute("aria-pressed") === "true");
    if (selected) world.focus(selected);
    else world.chapter(currentChapter);
    world.active($("campus").classList.contains("has-entered"));
    $("scene-fallback").hidden = true;
    document.body.dataset.scene = "ready";
  })
  .catch((error) => {
    console.warn("3D scene unavailable:", error.message);
    $("scene-fallback").textContent =
      "此设备未启用三维渲染。下方服务导航、手册与智能助手仍可使用。";
    document.body.dataset.scene = "fallback";
    $("map-view").disabled = true;
    $("map-labels-toggle").disabled = true;
    document
      .querySelectorAll(".scene-tools button")
      .forEach((b) => (b.disabled = true));
  });
