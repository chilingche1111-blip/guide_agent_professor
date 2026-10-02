import * as THREE from "./vendor/three/three.module.min.js";
import { locate, communities, mapLabels } from "./campus-layout.js";

// Official map-relative site plan. Simplified architecture, not GPS navigation.
export async function createWorld(places, onSelect) {
  const host = document.getElementById("scene"),
    labels = document.getElementById("scene-labels");
  const renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: true,
    powerPreference: "low-power",
  });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.shadowMap.autoUpdate = false;
  renderer.shadowMap.needsUpdate = true;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.domElement.setAttribute("aria-hidden", "true");
  host.append(renderer.domElement);
  const scene = new THREE.Scene(),
    root = new THREE.Group(),
    camera = new THREE.PerspectiveCamera(34, 1, 0.1, 180);
  scene.add(root);
  const hemi = new THREE.HemisphereLight(0xe7f3ff, 0x25415a, 2.7),
    sun = new THREE.DirectionalLight(0xffead5, 4);
  sun.position.set(-15, 28, 12);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  Object.assign(sun.shadow.camera, {
    left: -28,
    right: 28,
    top: 18,
    bottom: -18,
  });
  sun.shadow.bias = -0.001;
  scene.add(hemi, sun);
  const materials = new Map(),
    batches = new Map(),
    cube = new THREE.BoxGeometry(1, 1, 1),
    dummy = new THREE.Object3D(),
    clickable = [];
  function material(color) {
    if (!materials.has(color))
      materials.set(
        color,
        new THREE.MeshStandardMaterial({ color, roughness: 0.8 }),
      );
    return materials.get(color);
  }
  // Batch repeated geometry by material and service to retain picking with few draw calls.
  function block(x, y, z, w, h, d, color, key = "") {
    const id = color + ":" + key;
    if (!batches.has(id)) batches.set(id, { color, key, items: [] });
    batches.get(id).items.push([x, y, z, w, h, d]);
  }
  function planBlock(u, v, w, d, h = 1.2, key = "", color = 0xb4c6d3) {
    const [x, , z] = locate(u, v);
    block(x, h / 2 + 0.2, z, w / 40, h, d / 40, color, key);
    block(x, h + 0.23, z, w / 40 + 0.08, 0.08, d / 40 + 0.08, 0xe3eaf0, key);
    for (let col = -w / 2 + 7; col < w / 2; col += 13)
      block(
        x + col / 40,
        h * 0.55 + 0.2,
        z + d / 80 + 0.016,
        0.16,
        h * 0.32,
        0.025,
        0x467385,
        key,
      );
  }
  block(-0.6, -0.27, 0, 43.6, 0.55, 14.4, 0x324d64);
  block(-0.6, 0.04, 0, 43.3, 0.08, 14.15, 0x667f87);
  // 修远大道 / 同远路, with east-west site orientation retained.
  block(1.7, 0.11, 1.9, 35, 0.07, 0.55, 0xa6b7ba);
  block(1.7, 0.11, -1.8, 34, 0.07, 0.42, 0xa6b7ba);
  for (const x of [-10.5, -4.2, 8.5, 15.1])
    block(x, 0.12, 1.1, 0.38, 0.07, 10.8, 0xa6b7ba);
  block(-0.6, 0.12, 6.35, 42, 0.07, 0.38, 0xa6b7ba);
  block(19.5, 0.12, 0, 0.38, 0.07, 13, 0xa6b7ba);
  for (const [u, v] of [
    [995, 495],
    [995, 535],
    [995, 567],
    [1000, 635],
    [1000, 681],
    [1000, 731],
    [1085, 650],
    [1085, 710],
    [781, 670],
    [781, 724],
  ])
    planBlock(u, v, 72, 23, 1.1, v < 590 ? "study" : "", 0xb8c9d8);
  const library = new THREE.Group();
  library.position.set(...locate(1160, 574));
  root.add(library);
  for (let i = 0; i < 13; i++) {
    const a = Math.PI + (i * Math.PI) / 12,
      m = new THREE.Mesh(cube, material(0xe1e7eb));
    m.position.set(Math.cos(a) * 2.45, 1.2, Math.sin(a) * 2.45);
    m.rotation.y = -a;
    m.scale.set(0.65, 2, 0.85);
    m.castShadow = m.receiveShadow = true;
    m.userData.place = "library";
    library.add(m);
    clickable.push(m);
  }
  for (const community of communities)
    for (const [u, v] of community.blocks)
      planBlock(
        u,
        v,
        62,
        18,
        1.5,
        community.name === "西区生活社区" ? "life" : "",
        0x86a9bd,
      );
  planBlock(788, 530, 48, 32, 0.9, "dining", 0xc5b28a);
  planBlock(1530, 530, 52, 35, 0.9, "dining", 0xc5b28a);
  planBlock(1450, 292, 42, 20, 0.8, "dining", 0xc5b28a);
  planBlock(1570, 550, 25, 72, 1.6, "activities", 0xc7d5e1);
  planBlock(1640, 770, 45, 29, 0.95, "clinic", 0xb8d7d2);
  const [cx, , cz] = locate(1640, 770);
  block(cx, 1.3, cz, 0.65, 0.09, 0.15, 0x70b8bf, "clinic");
  block(cx, 1.3, cz, 0.15, 0.09, 0.65, 0x70b8bf, "clinic");
  // Context from the same map: Beichen building, laboratories, lake and northern test track.
  planBlock(1230, 718, 48, 35, 1.65);
  // Academic clusters use relative plan positions, not precise door coordinates.
  planBlock(393, 625, 52, 36, 2.1, "highway", 0x9bb9c7);
  planBlock(274, 590, 70, 52, 0.85, "highway", 0xb4c6d3);
  planBlock(270, 725, 138, 32, 1.3, "materials", 0xb2bdce);
  planBlock(240, 679, 90, 28, 0.9, "materials", 0xb2bdce);
  planBlock(982, 407, 80, 44, 1.6, "information", 0x9bb9c7);
  planBlock(884, 416, 95, 35, 0.95, "information", 0xb4c6d3);
  for (const [u, v, w, d] of [
    [1210, 653, 42, 36],
    [1400, 765, 148, 40],
    [1530, 670, 63, 25],
    [1540, 710, 68, 22],
    [1060, 410, 170, 40],
    [400, 697, 100, 56],
  ])
    planBlock(u, v, w, d, 0.8);
  function oval(u, v, rx, rz, color, key = "") {
    const m = new THREE.Mesh(
        new THREE.CylinderGeometry(1, 1, 0.08, 48),
        material(color),
      ),
      [x, , z] = locate(u, v);
    m.position.set(x, 0.2, z);
    m.scale.set(rx, 1, rz);
    m.receiveShadow = true;
    root.add(m);
    if (key && places[key]) {
      m.userData.place = key;
      clickable.push(m);
    }
    return m;
  }
  for (const [u, v] of [
    [630, 685],
    [1680, 402],
  ]) {
    oval(u, v, 1.13, 1.72, 0xa9857c, "stadium");
    oval(u, v, 0.87, 1.4, 0xbdafa3, "stadium").position.y = 0.29;
    oval(u, v, 0.76, 1.25, 0x53847d, "stadium").position.y = 0.38;
    const [x, , z] = locate(u, v);
    block(x, 0.44, z, 1.48, 0.02, 0.03, 0xdce8de, "stadium");
    block(x - 1.32, 0.43, z, 0.27, 0.5, 2.5, 0xc6d1d7, "stadium");
  }
  const lake = oval(883, 700, 0.8, 1.25, 0x4bafc2);
  lake.rotation.y = 0.3;
  oval(860, 674, 0.65, 0.44, 0x4bafc2);
  oval(901, 696, 0.6, 0.56, 0x4bafc2);
  oval(1050, 365, 9.65, 2.0, 0x829699);
  oval(1050, 365, 9.37, 1.74, 0x536d79).position.y = 0.29;
  block(1.3, 0.29, -4.3, 17, 0.04, 0.17, 0xb8c5c6);
  for (const [u, v] of [
    [1150, 452],
    [1280, 495],
    [1370, 685],
    [1750, 495],
    [575, 539],
    [910, 588],
  ]) {
    const [x, , z] = locate(u, v);
    block(x, 0.26, z, 0.85, 0.32, 0.8, 0x497e80);
  }
  for (const { color, key, items } of batches.values()) {
    const mesh = new THREE.InstancedMesh(cube, material(color), items.length);
    items.forEach(([x, y, z, w, h, d], i) => {
      dummy.position.set(x, y, z);
      dummy.scale.set(w, h, d);
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });
    mesh.castShadow = mesh.receiveShadow = true;
    mesh.userData.place = key;
    root.add(mesh);
    if (key && places[key]) clickable.push(mesh);
  }
  host.dataset.locations = String(
    Object.values(places).filter((p) => !p.virtual).length,
  );
  host.dataset.layout = "weishui-2023";
  const marker = new THREE.Mesh(
    new THREE.RingGeometry(1.75, 1.82, 48),
    new THREE.MeshBasicMaterial({ color: 0x83e9ef, side: THREE.DoubleSide }),
  );
  marker.rotation.x = -Math.PI / 2;
  marker.visible = false;
  root.add(marker);
  const labelItems = mapLabels.map((p) => {
    const el = document.createElement("button");
    el.className = "map-label";
    el.dataset.place = p.key;
    el.textContent = p.name;
    el.setAttribute("aria-label", "探索" + p.name);
    el.onclick = () => onSelect(p.key, true, p.position);
    labels.append(el);
    return {
      ...p,
      el,
      point: new THREE.Vector3(p.position[0], 2.2, p.position[2]),
      width: Math.max(78, p.name.length * 11 + 24),
      height: 38,
    };
  });
  let angle = 0.08,
    targetAngle = 0.08,
    radius = 34,
    targetRadius = 34,
    elevation = 0.96,
    targetElevation = 0.96,
    focus = new THREE.Vector3(-0.6, 0.4, 0),
    targetFocus = focus.clone(),
    paused = false,
    active = true,
    visible = true,
    frame = 0,
    lastTime = 0,
    t = 0,
    selected = null,
    activePlaces = null,
    drag = null,
    moved = false,
    contextLost = false;
  let bounds = { width: 1, height: 1, left: 0, top: 0 },
    parent = { width: 1, left: 0, top: 0 },
    panelRect = null;
  const projected = new THREE.Vector3();
  function resize() {
    bounds = host.getBoundingClientRect();
    parent = host.parentElement.getBoundingClientRect();
    if (!bounds.width || !bounds.height) return;
    renderer.setSize(bounds.width, bounds.height);
    camera.aspect = bounds.width / bounds.height;
    camera.updateProjectionMatrix();
    measurePanel();
    draw(0);
  }
  function measurePanel() {
    const p = document.getElementById("place-panel");
    panelRect = p && !p.hidden ? p.getBoundingClientRect() : null;
  }
  function moving() {
    return (
      Math.abs(angle - targetAngle) > 0.001 ||
      Math.abs(radius - targetRadius) > 0.005 ||
      Math.abs(elevation - targetElevation) > 0.001 ||
      focus.distanceTo(targetFocus) > 0.005
    );
  }
  function draw(dt) {
    if (contextLost) return;
    const ease = paused ? 1 : 1 - Math.exp(-dt * 11);
    angle += (targetAngle - angle) * ease;
    radius += (targetRadius - radius) * ease;
    elevation += (targetElevation - elevation) * ease;
    focus.lerp(targetFocus, ease);
    const fit = Math.max(
        1,
        bounds.height / Math.min(bounds.width, parent.width),
      ),
      distance = radius * 1.23 * fit;
    camera.position.set(
      focus.x + Math.sin(angle) * distance * Math.cos(elevation),
      focus.y + distance * Math.sin(elevation),
      focus.z + Math.cos(angle) * distance * Math.cos(elevation),
    );
    camera.lookAt(focus);
    camera.updateMatrixWorld();
    renderer.render(scene, camera);
    host.dataset.renderCount = String(
      Number(host.dataset.renderCount || 0) + 1,
    );
    host.dataset.drawCalls = String(renderer.info.render.calls);
    const occupied = [],
      sorted = selected
        ? [...labelItems].sort(
            (a, b) => Number(b.key === selected) - Number(a.key === selected),
          )
        : labelItems;
    for (const item of sorted) {
      projected.copy(item.point).project(camera);
      const x =
          bounds.left - parent.left + (projected.x * 0.5 + 0.5) * bounds.width,
        y =
          bounds.top -
          parent.top +
          (-projected.y * 0.5 + 0.5) * bounds.height -
          18;
      const rect = {
        l: x - item.width / 2 - 4,
        r: x + item.width / 2 + 4,
        t: y - item.height - 4,
        b: y + 5,
      };
      let hide =
        projected.z > 1 ||
        Math.abs(projected.x) > 1 ||
        Math.abs(projected.y) > 1 ||
        (activePlaces && !activePlaces.includes(item.key)) ||
        rect.l < 12 ||
        rect.r > parent.width - 12;
      if (panelRect)
        hide ||=
          rect.r > panelRect.left - parent.left &&
          rect.l < panelRect.right - parent.left &&
          rect.b > panelRect.top - parent.top &&
          rect.t < panelRect.bottom - parent.top;
      hide ||= occupied.some(
        (p) => rect.l < p.r && rect.r > p.l && rect.t < p.b && rect.b > p.t,
      );
      item.el.hidden = !!hide;
      if (!hide) {
        occupied.push(rect);
        item.el.style.transform = `translate3d(${x}px,${y}px,0) translate(-50%,-100%)`;
      }
    }
    host.dataset.angle = angle.toFixed(3);
    host.dataset.zoom = radius.toFixed(2);
    host.dataset.view = targetElevation > 1.3 ? "top" : "perspective";
    host.dataset.time = t.toFixed(3);
  }
  function tick(time) {
    frame = 0;
    if (!active || !visible || document.hidden || contextLost) return;
    const dt = Math.min((time - lastTime) / 1000 || 0.016, 0.05);
    lastTime = time;
    if (!paused) t += dt;
    draw(dt);
    if (moving()) frame = requestAnimationFrame(tick);
  }
  function wake() {
    if (!frame && active && visible && !document.hidden && !contextLost) {
      lastTime = performance.now();
      frame = requestAnimationFrame(tick);
    }
  }
  new ResizeObserver(resize).observe(host);
  new IntersectionObserver(
    (entries) => {
      visible = entries[0].isIntersecting;
      if (visible) wake();
      else {
        cancelAnimationFrame(frame);
        frame = 0;
      }
    },
    { threshold: 0.01 },
  ).observe(host);
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      cancelAnimationFrame(frame);
      frame = 0;
    } else wake();
  });
  const ray = new THREE.Raycaster(),
    pointer = new THREE.Vector2();
  renderer.domElement.addEventListener("pointerdown", (e) => {
    drag = { x: e.clientX, y: e.clientY, angle: targetAngle };
    moved = false;
    renderer.domElement.setPointerCapture(e.pointerId);
  });
  renderer.domElement.addEventListener("pointermove", (e) => {
    if (!drag) return;
    const dx = e.clientX - drag.x;
    if (Math.abs(dx) > 5 || Math.abs(e.clientY - drag.y) > 5) moved = true;
    if (moved) {
      targetAngle = drag.angle - dx * 0.004;
      wake();
    }
  });
  renderer.domElement.addEventListener("pointerup", (e) => {
    if (drag && !moved) {
      const r = renderer.domElement.getBoundingClientRect();
      pointer.set(
        ((e.clientX - r.left) / r.width) * 2 - 1,
        (-(e.clientY - r.top) / r.height) * 2 + 1,
      );
      ray.setFromCamera(pointer, camera);
      const hit = ray.intersectObjects(clickable)[0];
      if (hit)
        onSelect(hit.object.userData.place, true, [
          hit.point.x,
          0,
          hit.point.z,
        ]);
    }
    drag = null;
  });
  renderer.domElement.addEventListener("pointercancel", () => (drag = null));
  renderer.domElement.addEventListener("webglcontextlost", (e) => {
    e.preventDefault();
    contextLost = true;
    cancelAnimationFrame(frame);
    frame = 0;
    document.getElementById("scene-fallback").hidden = false;
    document.getElementById("scene-fallback").textContent =
      "三维渲染已暂停，请刷新恢复。服务目录仍可使用。";
    labels.hidden = true;
    document.getElementById("map-view").disabled = true;
    document.getElementById("map-labels-toggle").disabled = true;
  });
  const views = {
    overview: {
      focus: [-0.6, 0.4, 0],
      angle: 0.08,
      radius: 34,
      elevation: 0.96,
      places: null,
    },
    learning: {
      focus: [-5, 0.5, 1.0],
      angle: 0.16,
      radius: 33,
      elevation: 1.05,
      places: ["library", "study", "highway", "materials", "information"],
    },
    living: {
      focus: [-4, 0.5, -0.2],
      angle: -0.1,
      radius: 32,
      elevation: 1.02,
      places: ["life"],
    },
    connection: {
      focus: [14, 0.5, 2.2],
      angle: 0.18,
      radius: 19,
      elevation: 1.0,
      places: ["activities"],
    },
  };
  function preset(key) {
    const v = views[key] || views.overview;
    selected = null;
    marker.visible = false;
    activePlaces = v.places;
    targetFocus.set(...v.focus);
    targetRadius = v.radius;
    targetElevation = v.elevation;
    targetAngle =
      angle + Math.atan2(Math.sin(v.angle - angle), Math.cos(v.angle - angle));
    host.dataset.chapter = key;
    measurePanel();
    wake();
  }
  resize();
  wake();
  return {
    snapshot() {
      return {
        angle: targetAngle,
        radius: targetRadius,
        elevation: targetElevation,
        focus: targetFocus.toArray(),
        places: activePlaces ? [...activePlaces] : null,
      };
    },
    restore(view) {
      selected = null;
      marker.visible = false;
      targetAngle = view.angle;
      targetRadius = view.radius;
      targetElevation = view.elevation;
      targetFocus.fromArray(view.focus);
      activePlaces = view.places;
      measurePanel();
      wake();
    },
    active(value) {
      active = value;
      if (!value) {
        cancelAnimationFrame(frame);
        frame = 0;
      } else {
        measurePanel();
        wake();
      }
    },
    focus(key, anchor = null, cinematic = false) {
      selected = key;
      measurePanel();
      const p = places[key];
      if (p.virtual) {
        marker.visible = false;
        activePlaces = null;
        wake();
        return;
      }
      activePlaces = null;
      const point = anchor || p.position;
      targetFocus.set(point[0], 0.5, point[2]);
      host.dataset.focusPosition = JSON.stringify(point);
      targetRadius = cinematic ? 13 : 23;
      targetElevation = cinematic ? 0.76 : 1.05;
      marker.position.set(point[0], 0.31, point[2]);
      marker.visible = true;
      wake();
    },
    reset() {
      preset("overview");
    },
    chapter: preset,
    rotate(v) {
      targetAngle += v;
      wake();
    },
    view(top) {
      targetElevation = top ? 1.53 : 0.96;
      if (top)
        targetAngle = angle + Math.atan2(Math.sin(-angle), Math.cos(-angle));
      wake();
    },
    zoom(v) {
      targetRadius = THREE.MathUtils.clamp(targetRadius + v, 13, 48);
      wake();
    },
    pause(value) {
      paused = value;
      wake();
    },
    night(value) {
      hemi.intensity = value ? 1.65 : 2.7;
      sun.intensity = value ? 2.6 : 4;
      sun.color.set(value ? 0xb8d9ef : 0xffead5);
      renderer.toneMappingExposure = value ? 1.1 : 1.15;
      renderer.shadowMap.needsUpdate = true;
      wake();
    },
  };
}
