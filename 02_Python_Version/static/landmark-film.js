// One authored sequence: model push-in -> decoded real photo -> service content.
// Two local image layers avoid blank frames; versioned operations survive interruption.
export function createLandmarkFilm({ getWorld, reduced }) {
  const campus = document.getElementById("campus"),
    scene = document.getElementById("landmark-scene"),
    panel = document.getElementById("place-panel"),
    shade = document.getElementById("landmark-shade"),
    images = [...scene.querySelectorAll(".landmark-image")],
    back = document.getElementById("landmark-back");
  const controls = [
    ...campus.querySelectorAll(
      ".map-toolbar,.experience-actions,.chapter-nav,.world-bottom,.scene-tools,.scene-labels,.hero-copy",
    ),
  ];
  const decoded = new Map();
  let version = 0,
    animations = [],
    active = -1;
  const load = (src) => {
    if (!decoded.has(src)) {
      const image = new Image();
      image.src = src;
      decoded.set(
        src,
        image
          .decode()
          .then(() => image)
          .catch((e) => {
            decoded.delete(src);
            throw e;
          }),
      );
    }
    return decoded.get(src);
  };
  function cancel() {
    for (const a of animations) a.cancel();
    animations = [];
  }
  function animate(el, frames, options) {
    const a = el.animate(frames, { fill: "both", ...options });
    animations.push(a);
    return a.finished.catch(() => {});
  }
  function lock(value) {
    controls.forEach((el) => (el.inert = value));
  }
  function clean() {
    cancel();
    campus.classList.remove("has-landmark", "landmark-loading");
    scene.hidden = true;
    scene.dataset.state = "closed";
    images.forEach((img) => {
      img.style.opacity = "0";
    });
    shade.style.opacity = "0";
    panel.style.opacity = "";
    panel.style.transform = "";
    active = -1;
    lock(false);
  }
  return {
    preload(photos) {
      for (const p of photos) load(p.src).catch(() => {});
    },
    async open(photo, key, push) {
      const ticket = ++version,
        hadPhoto = active >= 0 && !scene.hidden;
      cancel();
      scene.hidden = false;
      scene.dataset.state = "loading";
      campus.classList.add("has-landmark", "landmark-loading");
      lock(true);
      back.inert = false;
      panel.style.opacity = "0";
      document.getElementById("landmark-loading").textContent = "正在接入实景…";
      try {
        await load(photo.src);
      } catch {
        if (ticket !== version) return false;
        clean();
        getWorld()?.active(true);
        document.getElementById("chapter-status").textContent =
          "实景照片暂时无法加载，已保留地图与服务。可以返回后重试。";
        return false;
      }
      if (ticket !== version) return false;
      campus.classList.remove("landmark-loading");
      document.getElementById("landmark-loading").textContent = "";
      const next = active === 0 ? 1 : 0,
        incoming = images[next],
        outgoing = active >= 0 ? images[active] : null;
      incoming.src = photo.src;
      incoming.alt = "长安大学官网实景：" + photo.title;
      incoming.style.zIndex = "2";
      if (outgoing) outgoing.style.zIndex = "1";
      document.getElementById("landmark-credit").textContent =
        photo.title + " · 来源：" + (photo.sourceLabel || "长安大学官网");
      document.getElementById("landmark-credit").href =
        photo.source || "https://www.chd.edu.cn/xxgk/cdyx1/jzdb.htm";
      document.getElementById("landmark-original").href = photo.src;
      scene.dataset.place = key;
      scene.dataset.state = "entering";
      active = next;
      push();
      if (reduced()) {
        incoming.style.opacity = "1";
        incoming.style.transform = "none";
        if (outgoing) outgoing.style.opacity = "0";
        shade.style.opacity = "1";
        panel.style.opacity = "1";
      } else {
        incoming.style.opacity = "1";
        incoming.style.transform = "scale(1.035)";
        shade.style.opacity = "1";
        panel.style.opacity = "1";
        const duration = hadPhoto ? 620 : 760,
          delay = hadPhoto ? 0 : 100;
        const finish = animate(
          incoming,
          [
            { opacity: 0, transform: "scale(1)" },
            { opacity: 1, transform: "scale(1.035)" },
          ],
          { duration, delay, easing: "cubic-bezier(.22,1,.36,1)" },
        );
        if (outgoing)
          animate(
            outgoing,
            [
              { opacity: 1, transform: "scale(1.035)" },
              { opacity: 0, transform: "scale(1.065)" },
            ],
            { duration: 500, easing: "ease-out" },
          );
        animate(shade, [{ opacity: hadPhoto ? 1 : 0 }, { opacity: 1 }], {
          duration: 480,
          delay,
          easing: "ease-out",
        });
        animate(
          panel,
          [
            { opacity: 0, transform: "translateY(18px)" },
            { opacity: 1, transform: "translateY(0)" },
          ],
          {
            duration: 400,
            delay: hadPhoto ? 160 : 320,
            easing: "cubic-bezier(.16,1,.3,1)",
          },
        );
        await finish;
      }
      if (ticket !== version) return false;
      if (outgoing) outgoing.style.opacity = "0";
      cancel();
      scene.dataset.state = "ready";
      getWorld()?.active(false);
      return true;
    },
    async close(restore, immediate = false) {
      const ticket = ++version;
      cancel();
      campus.classList.remove("landmark-loading");
      getWorld()?.active(true);
      restore?.();
      if (scene.hidden || immediate || reduced()) {
        clean();
        return true;
      }
      scene.dataset.state = "leaving";
      panel.style.opacity = "0";
      const leaving = images.filter((img) => img.style.opacity === "1");
      const jobs = leaving.map((img) =>
        animate(
          img,
          [
            { opacity: 1, transform: "scale(1.035)" },
            { opacity: 0, transform: "scale(1)" },
          ],
          { duration: 420, easing: "cubic-bezier(.4,0,.2,1)" },
        ),
      );
      jobs.push(
        animate(shade, [{ opacity: 1 }, { opacity: 0 }], {
          duration: 350,
          easing: "ease-out",
        }),
      );
      await Promise.all(jobs);
      if (ticket !== version) return false;
      clean();
      return true;
    },
  };
}
