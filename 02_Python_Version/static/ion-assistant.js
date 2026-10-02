import * as THREE from "./vendor/three/three.module.min.js";

// Procedural ion core. Visual response to UI state, not a scientific simulation.
export function mountIonAssistant(root, state) {
  const stage = root.getElementById("ion-stage"),
    surface = root.getElementById("ion-field"),
    toggle = root.getElementById("ion-motion"),
    status = root.getElementById("ion-state"),
    hint = root.getElementById("ion-hint"),
    media = matchMedia("(prefers-reduced-motion: reduce)");
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: false,
      powerPreference: "low-power",
    });
  } catch {
    stage.dataset.renderer = "fallback";
    hint.textContent = "当前设备使用静态核心，问答功能不受影响";
    toggle.hidden = true;
    root.getElementById("ion-reset").hidden = true;
    surface.tabIndex = -1;
    surface.setAttribute("aria-label", "静态核心示意，三维效果不可用");
    return;
  }
  const canvas = renderer.domElement;
  canvas.setAttribute("aria-hidden", "true");
  surface.prepend(canvas);
  renderer.setPixelRatio(
    Math.min(
      devicePixelRatio,
      matchMedia("(max-width:760px)").matches ? 1.2 : 1.5,
    ),
  );
  renderer.setClearColor(0x000000, 0);
  const scene = new THREE.Scene(),
    camera = new THREE.PerspectiveCamera(38, 1, 0.1, 50);
  camera.position.z = 6.8;
  const core = new THREE.Group();
  scene.add(core);
  const count = matchMedia("(max-width:760px)").matches ? 2200 : 4800;
  const positions = new Float32Array(count * 3),
    seeds = new Float32Array(count);
  let seed = 1709;
  const random = () =>
    (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
  for (let i = 0; i < count; i++) {
    const y = 1 - (2 * (i + 0.5)) / count,
      phi = i * Math.PI * (3 - Math.sqrt(5)),
      r = 1.22 + random() * 0.17,
      ring = Math.sqrt(1 - y * y);
    positions.set(
      [Math.cos(phi) * ring * r, y * r, Math.sin(phi) * ring * r],
      i * 3,
    );
    seeds[i] = random();
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
  const uniforms = {
    uTime: { value: 0 },
    uEnergy: { value: 0 },
    uReveal: { value: 0 },
    uPointer: { value: new THREE.Vector2() },
    uPixel: { value: renderer.getPixelRatio() },
  };
  const material = new THREE.ShaderMaterial({
    uniforms,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    vertexShader: `
      attribute float aSeed;
      uniform float uTime, uEnergy, uReveal, uPixel;
      uniform vec2 uPointer;
      varying float vSeed, vLight;
      void main() {
        vSeed = aSeed;
        vec3 p = position;
        float wave = sin(p.y * 7.0 + uTime * 1.2 + aSeed * 4.0);
        p *= 1.0 + wave * (0.045 + uEnergy * .09);
        p += normalize(position) * (1.0-uReveal) * (1.8 + aSeed * 2.0);
        float d = distance(p.xy, uPointer * 1.6);
        p.z += exp(-d*d*2.0) * .24;
        vec4 mv = modelViewMatrix * vec4(p, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = min(7.0, (10.0 + aSeed * 14.0) * uPixel / -mv.z);
        vLight = (.4 + .6 * smoothstep(-1.5,1.5,p.z)) * uReveal;
      }`,
    fragmentShader: `
      uniform float uEnergy;
      varying float vSeed, vLight;
      void main() {
        float d = length(gl_PointCoord-.5)*2.0;
        if(d>1.0) discard;
        vec3 cold = mix(vec3(.12,.48,.82),vec3(.62,.96,1.),vSeed);
        vec3 warm = vec3(1.,.66,.3);
        vec3 color = mix(cold,warm,uEnergy * step(.88,vSeed));
        gl_FragColor = vec4(color, (1.-smoothstep(.25,1.,d))*vLight);
      }`,
  });
  core.add(new THREE.Points(geometry, material));
  const rings = [];
  for (let j = 0; j < 3; j++) {
    const vertices = [];
    for (let i = 0; i <= 160; i++) {
      const a = (i / 160) * Math.PI * (j === 1 ? 1.7 : 2),
        r = 1.65 + j * 0.18;
      vertices.push(new THREE.Vector3(Math.cos(a) * r, Math.sin(a) * r, 0));
    }
    const ring = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints(vertices),
      new THREE.LineBasicMaterial({
        color: j === 1 ? 0x70d9ff : 0x246387,
        transparent: true,
        opacity: 0.58,
      }),
    );
    ring.rotation.set(0.95 + j * 0.7, j * 0.6, j * 1.4);
    core.add(ring);
    rings.push(ring);
  }
  // Quiet depth field: point geometry, no large transparent bloom buffers.
  const stars = new Float32Array(200 * 3);
  for (let i = 0; i < 200; i++)
    stars.set(
      [(random() - 0.5) * 13, (random() - 0.5) * 7, -2 - random() * 5],
      i * 3,
    );
  const starsGeometry = new THREE.BufferGeometry();
  starsGeometry.setAttribute("position", new THREE.BufferAttribute(stars, 3));
  scene.add(
    new THREE.Points(
      starsGeometry,
      new THREE.PointsMaterial({
        color: 0x77b7d3,
        size: 0.012,
        transparent: true,
        opacity: 0.45,
      }),
    ),
  );
  let frame = 0,
    last = 0,
    time = 0,
    reveal = 0,
    active = false,
    visible = false,
    paused = false,
    dragging = false,
    yaw = 0,
    pitch = 0,
    lastX = 0,
    lastY = 0,
    lost = false;
  const desired = new THREE.Vector2();
  const motionOff = () => paused || media.matches;
  function available() {
    return (
      visible &&
      !document.hidden &&
      !root.host?.hidden &&
      !root.getElementById("chat-view").hidden &&
      !lost
    );
  }
  function resize() {
    if (lost) return;
    const rect = surface.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    renderer.setSize(rect.width, rect.height, false);
    camera.aspect = rect.width / rect.height;
    camera.position.z = camera.aspect < 1.15 ? 8.3 : 6.8;
    camera.updateProjectionMatrix();
    draw(0);
  }
  function draw(dt) {
    reveal = motionOff() ? 1 : Math.min(1, reveal + dt / 0.75);
    uniforms.uReveal.value = 1 - Math.pow(1 - reveal, 3);
    uniforms.uTime.value = time;
    uniforms.uEnergy.value +=
      ((state.busy ? 1 : 0) - uniforms.uEnergy.value) *
      (motionOff() ? 1 : 0.08);
    uniforms.uPointer.value.lerp(desired, 0.08);
    core.rotation.y =
      yaw + (motionOff() ? 0.25 : time * 0.065) + desired.x * 0.1;
    core.rotation.x = pitch + desired.y * 0.08;
    rings[1].rotation.z =
      1.4 + (motionOff() ? 0 : time * (state.busy ? 0.24 : 0.08));
    rings[2].rotation.y = 1.2 + (motionOff() ? 0 : time * 0.05);
    renderer.render(scene, camera);
    stage.dataset.frames = String(Number(stage.dataset.frames || 0) + 1);
  }
  function tick(now) {
    frame = 0;
    if (!available() || motionOff()) return;
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    time += dt;
    draw(dt);
    frame = requestAnimationFrame(tick);
  }
  function update() {
    const next = available();
    if (next && !active) {
      reveal = motionOff() ? 1 : 0;
      resize();
    }
    active = next;
    stage.dataset.motion = motionOff()
      ? "paused"
      : active
        ? "running"
        : "inactive";
    stage.dataset.state = state.busy ? "processing" : "ready";
    status.textContent = state.busy ? "正在处理你的问题" : "知行，准备就绪";
    root.getElementById("ion-model").textContent = state.config?.enabled
      ? "模型已配置 · 以实际请求结果为准"
      : "本地知识模式 · 可在模型与连接中配置 API";
    toggle.textContent = media.matches
      ? "减少动画已启用"
      : paused
        ? "继续动态"
        : "暂停动态";
    toggle.setAttribute("aria-pressed", String(motionOff()));
    toggle.disabled = media.matches;
    cancelAnimationFrame(frame);
    frame = 0;
    if (!next) return;
    if (motionOff()) {
      draw(0);
      return;
    }
    last = performance.now();
    frame = requestAnimationFrame(tick);
  }
  toggle.onclick = () => {
    paused = !paused;
    update();
  };
  root.getElementById("ion-reset").onclick = () => {
    yaw = pitch = 0;
    desired.set(0, 0);
    if (motionOff()) draw(0);
  };
  surface.addEventListener("pointerdown", (e) => {
    if (motionOff() || lost) return;
    dragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
    surface.setPointerCapture(e.pointerId);
  });
  surface.addEventListener("pointermove", (e) => {
    if (motionOff() || lost) return;
    const rect = surface.getBoundingClientRect();
    desired.set(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      1 - ((e.clientY - rect.top) / rect.height) * 2,
    );
    if (dragging) {
      yaw += (e.clientX - lastX) * 0.007;
      pitch = THREE.MathUtils.clamp(
        pitch + (e.clientY - lastY) * 0.005,
        -0.7,
        0.7,
      );
      lastX = e.clientX;
      lastY = e.clientY;
    }
    stage.dataset.yaw = yaw.toFixed(3);
  });
  surface.addEventListener("pointerup", () => (dragging = false));
  surface.addEventListener("pointercancel", () => (dragging = false));
  surface.addEventListener("pointerleave", () => {
    if (!dragging) desired.set(0, 0);
  });
  surface.addEventListener("keydown", (e) => {
    if (lost) return;
    if (
      !["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home"].includes(
        e.key,
      )
    )
      return;
    e.preventDefault();
    if (e.key === "Home") yaw = pitch = 0;
    else if (e.key === "ArrowLeft") yaw -= 0.18;
    else if (e.key === "ArrowRight") yaw += 0.18;
    else
      pitch = THREE.MathUtils.clamp(
        pitch + (e.key === "ArrowUp" ? -0.12 : 0.12),
        -0.7,
        0.7,
      );
    stage.dataset.yaw = yaw.toFixed(3);
    if (motionOff()) draw(0);
  });
  canvas.addEventListener("webglcontextlost", (e) => {
    e.preventDefault();
    lost = true;
    // Detach the failed GPU surface: some drivers paint a white error layer
    // despite CSS display:none after context loss. Keep the element for restore.
    canvas.remove();
    update();
    stage.dataset.renderer = "fallback";
    hint.textContent = "三维渲染已暂停，问答功能仍可使用";
    toggle.hidden = true;
    root.getElementById("ion-reset").hidden = true;
    surface.tabIndex = -1;
    surface.setAttribute("aria-label", "静态核心示意，三维渲染已暂停");
    surface.style.cursor = "default";
  });
  canvas.addEventListener("webglcontextrestored", () => {
    lost = false;
    surface.prepend(canvas);
    stage.dataset.renderer = "webgl";
    toggle.hidden = false;
    root.getElementById("ion-reset").hidden = false;
    surface.tabIndex = 0;
    surface.setAttribute(
      "aria-label",
      "三维粒子核心，可拖动旋转；方向键调整，Home复位",
    );
    surface.style.cursor = "";
    hint.textContent = "拖动探索核心 · 方向键调整视角 · 不启用麦克风";
    update();
  });
  new ResizeObserver(resize).observe(surface);
  new IntersectionObserver((entries) => {
    visible = entries[0].isIntersecting;
    update();
  }).observe(stage);
  new MutationObserver(update).observe(root.getElementById("chat-view"), {
    attributes: true,
    attributeFilter: ["hidden", "class"],
  });
  if (root.host)
    new MutationObserver(update).observe(root.host, {
      attributes: true,
      attributeFilter: ["hidden"],
    });
  document.addEventListener("visibilitychange", update);
  media.addEventListener("change", update);
  root.addEventListener("assistant-state", update);
  stage.dataset.renderer = "webgl";
  stage.dataset.particles = String(count);
  update();
}
