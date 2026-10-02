/* A small, dependency-free service explorer. Questions are prompts, not policy claims. */
export function mountExplorer(root, { $, state, toast }) {
  const places = {
    library: {
      description: "从借阅规则到续借流程，先找到你关心的事。",
      questions: [
        "图书馆几点开放？可以借几本书？",
        "图书借阅到期了，怎样办理续借？",
        "图书逾期或遗失应该怎么处理？",
      ],
    },
    study: {
      description: "选课、学籍与办事流程，一次问清下一步。",
      questions: [
        "怎么申请退补选课程？",
        "成绩有疑问，怎样申请成绩复核？",
        "在读证明应该如何办理？",
      ],
    },
    life: {
      description: "把生活里的小麻烦，变成明确的办理问题。",
      questions: [
        "校园卡丢了怎么办？",
        "宿舍水管坏了怎么报修？",
        "奖助学金申请需要什么材料？",
      ],
    },
    network: {
      description: "先描述问题，再一起排查校园网络。",
      questions: [
        "校园网连不上怎么办？",
        "校园网账号忘记密码了怎么办？",
        "手机能上网，电脑却连不上，应该怎么排查？",
      ],
    },
  };
  const tabs = [...root.querySelectorAll("[data-place]")];
  const official = {
    library: {
      description: "长安大学官方摘要：先核对校外资源访问入口。",
      questions: [
        "长安大学校外如何访问图书馆数据库？",
        "长安大学图书馆VPN访问有问题找谁咨询？",
      ],
    },
    study: {
      description: "目前收录研究生业务通知，本科流程尚待核验。",
      questions: [
        "长安大学研究生如何打印在读证明？",
        "长安大学研究生如何办理休学或复学？",
      ],
    },
    life: {
      description: "校园卡挂失与电子校园卡，以官方原文为准。",
      questions: ["长安大学校园卡丢了怎么办？", "长安大学电子校园卡怎么使用？"],
    },
    network: {
      description: "VPN、身份认证与正版软件的官方服务指引。",
      questions: [
        "长安大学VPN系统如何使用？",
        "长安大学如何获取正版Office和MATLAB？",
        "长安大学统一身份认证怎么激活？",
      ],
    },
  };
  let currentPlace = "library";
  let selected = "";
  let selectionAnimation;
  function choose(place, focus = false) {
    currentPlace = place;
    const content =
      state.knowledgeScope === "chd_public" ? official[place] : places[place];
    const active = tabs.find((t) => t.dataset.place === place);
    tabs.forEach((t) => {
      const current = t === active;
      t.setAttribute("aria-selected", String(current));
      t.tabIndex = current ? 0 : -1;
    });
    if (focus) active.focus();
    $("explore-panel").setAttribute("aria-labelledby", active.id);
    $("explore-description").textContent = content.description;
    $("explore-questions").replaceChildren();
    content.questions.forEach((question, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = question;
      button.setAttribute("aria-pressed", String(index === 0));
      button.onclick = () => {
        selected = question;
        $("explore-questions")
          .querySelectorAll("button")
          .forEach((b) => b.setAttribute("aria-pressed", String(b === button)));
        $("explore-note").textContent = "已选好问题，点击「带入对话」继续。";
      };
      $("explore-questions").append(button);
    });
    selected = content.questions[0];
    $("explore-note").textContent =
      state.knowledgeScope === "chd_public"
        ? "长安大学官方网页摘要 · 请核对原文时效"
        : "课程模拟场景 · 答案以检索资料为准";
    selectionAnimation?.cancel();
    if (!matchMedia("(prefers-reduced-motion: reduce)").matches) {
      selectionAnimation = $("explore-panel").animate(
        [
          { clipPath: "inset(0 0 12% 0)", opacity: 0.55 },
          { clipPath: "inset(0)", opacity: 1 },
        ],
        { duration: 220, easing: "cubic-bezier(.16,1,.3,1)" },
      );
    }
  }
  tabs.forEach((tab, index) => {
    tab.onclick = () => choose(tab.dataset.place);
    tab.onkeydown = (e) => {
      let next;
      if (e.key === "ArrowRight") next = (index + 1) % tabs.length;
      if (e.key === "ArrowLeft") next = (index + tabs.length - 1) % tabs.length;
      if (e.key === "Home") next = 0;
      if (e.key === "End") next = tabs.length - 1;
      if (next !== undefined) {
        e.preventDefault();
        choose(tabs[next].dataset.place, true);
      }
    };
  });
  $("explore-use").onclick = () => {
    if (state.busy) {
      toast("正在回答，请稍后再选择新问题。");
      return;
    }
    const input = $("message-input");
    // Preserve an unfinished draft; never silently replace the user's words.
    input.value =
      input.value.trim() && input.value.trim() !== selected
        ? input.value.trimEnd() + "\n" + selected
        : selected;
    input.dispatchEvent(new Event("input", { bubbles: true }));
    input.focus();
    $("explore-note").textContent = "问题已放入输入框；可修改后发送。";
    toast("已带入问题，确认内容后发送。");
  };
  root.addEventListener("knowledge-scope-updated", () => choose(currentPlace));
  choose("library");
}
