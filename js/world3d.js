/* Throne of Ranks — 3D science-realm road trip to NIT Tiruchirappalli (three.js r128, global THREE).
   One day = one stretch of a glowing road. It runs through three realms filled with live
   simulations — Physics (orbits, gears, pendulums, fields, EM waves), Chemistry (molecules,
   atoms, DNA, reactions, lattices, flasks) and Mathematics (polyhedra, surfaces, graphs,
   spirals, equations) — to the NIT Tiruchirappalli main gate, where JEE Main is taken in
   front of three subject guards. */
(function () {
  'use strict';
  const JQ = (window.JQ = window.JQ || {});
  const W3 = (JQ.W3 = {});
  const D = 7; // road length of one day
  const RW = 3.2; // half width of the road
  const FONT = "Inter, 'Helvetica Neue', Arial, sans-serif";
  const ZC = { phys: '#4fb3ff', chem: '#3fe39a', math: '#ffae4a' };
  const THEMES = {
    night: {
      sky: ['#8a76c4', '#4b5bb0', '#26357a'], bg: '#2c3474', fog: ['#4a4a92', 100, 340], hemi: ['#c4d0ff', '#4c4894', 1.18], sun: ['#e6ebff', 0.85], stars: true,
      grid: ['#454d8e', '#ffffff', 'rgba(255,255,255,.4)'], zones: ['#5d92f2', '#49c9a2', '#e8985e'], campus: '#8c82e2', shade: [0.78, 1.1], litGround: false,
      path: '#3c4485', lane: '#222a5c', edge: '#8fdcff', inner: '#d6c9ff', ped: '#2f3776', plaza: '#30387a', look: -1.5,
    },
    day: {
      sky: ['#f2eff0', '#b4cdf3', '#5d8ad9'], bg: '#eaeff8', fog: ['#eef0f4', 140, 520], hemi: ['#ffffff', '#9aa6c8', 0.72], sun: ['#fff3df', 0.7], stars: false,
      grid: ['#e9ecf3', '#8fa3d6', 'rgba(143,163,214,.45)'], zones: ['#c4dcff', '#c2efd6', '#ffe0c0'], campus: '#d6d2f4', shade: [0.92, 1.06], litGround: true,
      path: '#e6e9f5', lane: '#3b4366', edge: '#4fb3ff', inner: '#e7e2ff', ped: '#eef1fa', plaza: '#e4e7f4', look: 2.5,
    },
  };
  let themeName = 'night', TH = THEMES.night;

  let supported = null;
  W3.ok = function () {
    if (supported !== null) return supported;
    try {
      const c = document.createElement('canvas');
      supported = !!(window.THREE && (c.getContext('webgl2') || c.getContext('webgl')));
    } catch (e) { supported = false; }
    return supported;
  };

  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
  const lerp = (a, b, t) => a + (b - a) * t;
  function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

  // ---------------- road shape ----------------
  let N = 80, zE = -560;
  function roadX(k) {
    const damp = sstep(N - 5, N - 10, k); // straightens out before the gate
    return (11 * Math.sin(k * 0.21 + 0.4) + 5 * Math.sin(k * 0.083 + 1.3)) * damp;
  }
  const kz = (k) => -k * D;
  function fwd(k) { const dx = (roadX(k + 0.01) - roadX(k - 0.01)) / 0.02; const l = Math.hypot(dx, D); return [dx / l, -D / l]; }
  const inCampus = (x, z) => z < zE + 34 && z > zE - 120 && Math.abs(x) < 97;
  function H(x, z) {
    if (inCampus(x, z)) return 0;
    const k = -z / D, dr = Math.abs(x - roadX(k));
    return sstep(24, 100, dr) * (3 + 10 * (0.5 + 0.5 * Math.sin(x * 0.031 + 1.7) * Math.cos(z * 0.027)) + 3 * Math.sin(x * 0.09 + z * 0.06));
  }
  const zoneOf = (k) => (k < N / 3 ? 'phys' : k < (2 * N) / 3 ? 'chem' : 'math');

  // ---------------- merged-geometry builder (static parts) ----------------
  let T3, BOX, CYL, CYL6;
  const tmp = {};
  function bases() {
    if (BOX) return;
    const ni = (g) => (g.index ? g.toNonIndexed() : g);
    BOX = ni(new T3.BoxGeometry(1, 1, 1).translate(0, 0.5, 0));
    CYL = ni(new T3.CylinderGeometry(0.5, 0.5, 1, 12).translate(0, 0.5, 0));
    CYL6 = ni(new T3.CylinderGeometry(0.5, 0.5, 1, 6).translate(0, 0.5, 0));
    tmp.m = new T3.Matrix4(); tmp.q = new T3.Quaternion(); tmp.e = new T3.Euler(0, 0, 0, 'YXZ');
    tmp.v = new T3.Vector3(); tmp.s = new T3.Vector3(); tmp.n3 = new T3.Matrix3(); tmp.a = new T3.Vector3(); tmp.c = new T3.Color();
  }
  function Geo() { this.p = []; this.n = []; this.c = []; }
  Geo.prototype.add = function (base, color, x, y, z, sx, sy, sz, ry, rx, rz) {
    const { m, q, e, v, s, n3, a, c } = tmp;
    m.compose(v.set(x, y, z), q.setFromEuler(e.set(rx || 0, ry || 0, rz || 0, 'YXZ')), s.set(sx, sy, sz));
    n3.getNormalMatrix(m); c.set(color);
    const P = base.attributes.position.array, Nn = base.attributes.normal.array;
    for (let i = 0; i < P.length; i += 3) {
      a.set(P[i], P[i + 1], P[i + 2]).applyMatrix4(m); this.p.push(a.x, a.y, a.z);
      a.set(Nn[i], Nn[i + 1], Nn[i + 2]).applyMatrix3(n3).normalize(); this.n.push(a.x, a.y, a.z);
      this.c.push(c.r, c.g, c.b);
    }
  };
  Geo.prototype.quad = function (pts, color) {
    const c = tmp.c.set(color);
    for (let i = 0; i < pts.length; i += 3) { this.p.push(pts[i], pts[i + 1], pts[i + 2]); this.n.push(0, 1, 0); this.c.push(c.r, c.g, c.b); }
  };
  Geo.prototype.mesh = function (mat) {
    const g = new T3.BufferGeometry();
    g.setAttribute('position', new T3.Float32BufferAttribute(this.p, 3));
    g.setAttribute('normal', new T3.Float32BufferAttribute(this.n, 3));
    g.setAttribute('color', new T3.Float32BufferAttribute(this.c, 3));
    g.computeBoundingSphere();
    return new T3.Mesh(g, mat);
  };

  // ---------------- canvas signs ----------------
  let maxAniso = 1;
  function sign(w, h, draw, opts) {
    opts = opts || {};
    const ppu = opts.ppu || 72;
    const cv = document.createElement('canvas');
    cv.width = Math.min(2048, Math.round(w * ppu)); cv.height = Math.min(1024, Math.round(h * ppu));
    const x = cv.getContext('2d');
    draw(x, cv.width, cv.height);
    const tex = new T3.CanvasTexture(cv); tex.anisotropy = maxAniso;
    const mat = new T3.MeshBasicMaterial({ map: tex, transparent: !!opts.alpha, depthWrite: !opts.alpha, side: opts.double ? T3.DoubleSide : T3.FrontSide, fog: opts.fog !== false });
    const m = new T3.Mesh(new T3.PlaneGeometry(w, h), mat);
    m.userData.redraw = (fn) => { x.clearRect(0, 0, cv.width, cv.height); fn(x, cv.width, cv.height); tex.needsUpdate = true; };
    return m;
  }
  function txt(x, s, px, weight, color, cx, cy, align, track) {
    x.font = `${weight} ${px}px ${FONT}`; x.fillStyle = color; x.textAlign = align || 'center'; x.textBaseline = 'middle';
    if (track && x.letterSpacing !== undefined) x.letterSpacing = track + 'px';
    const cw = x.canvas.width, mw = align === 'left' ? cw - cx - 16 : align === 'right' ? cx - 16 : Math.min(cx, cw - cx) * 2 - 40;
    x.fillText(s, cx, cy, Math.max(20, mw));
    if (track && x.letterSpacing !== undefined) x.letterSpacing = '0px';
  }
  function rrect(x, a, b, w, h, r) { x.beginPath(); x.moveTo(a + r, b); x.arcTo(a + w, b, a + w, b + h, r); x.arcTo(a + w, b + h, a, b + h, r); x.arcTo(a, b + h, a, b, r); x.arcTo(a, b, a + w, b, r); x.closePath(); }
  // holographic panel: dark glass, neon border, glowing text
  function holo(w, h, color, lines, opts) {
    return sign(w, h, (x, cw, ch) => {
      x.fillStyle = 'rgba(8,12,34,.72)'; rrect(x, 6, 6, cw - 12, ch - 12, 18); x.fill();
      x.shadowColor = color; x.shadowBlur = 18; x.strokeStyle = color; x.lineWidth = 5; rrect(x, 8, 8, cw - 16, ch - 16, 16); x.stroke();
      x.shadowBlur = 14;
      lines.forEach(([s, size, weight, col, y, track]) => txt(x, s, ch * size, weight, col || '#fff', cw / 2, ch * y, 'center', track));
      x.shadowBlur = 0;
    }, Object.assign({ alpha: true, double: true, ppu: 90 }, opts));
  }

  // ---------------- engine state ----------------
  let renderer, scene, camera, moon, hemi, stars, sky, world = null, host = null, ro = null, io = null, inView = true;
  let builtKey = null, lastCfg = null, pads = null, car = null, plates = [], markers = [], onMove = null, anims = [];
  const cur = { f: 0, yaw: 0, hx: 0, hy: 0, sx: 0, sy: 0 };
  const tgt = { f: 0, yaw: 0, hx: 0, hy: 0, sx: 0, sy: 0 };
  let raf = 0, lastT = 0, drag = null, suppressClick = false, lowPower = false, lastMoveF = null;
  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

  function init() {
    T3 = window.THREE; bases();
    lowPower = matchMedia('(pointer: coarse)').matches;
    renderer = new T3.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, lowPower ? 1.5 : 2));
    maxAniso = Math.min(8, renderer.capabilities.getMaxAnisotropy());
    renderer.domElement.className = 'w3-canvas';
    scene = new T3.Scene();
    const sc = document.createElement('canvas'); sc.width = 4; sc.height = 256;
    const sx = sc.getContext('2d'), gr = sx.createLinearGradient(0, 0, 0, 256);
    gr.addColorStop(0, '#5f8bdc'); gr.addColorStop(0.45, '#9dbcf0'); gr.addColorStop(0.8, '#d9e4f7'); gr.addColorStop(1, '#f1eef0');
    sx.fillStyle = gr; sx.fillRect(0, 0, 4, 256);
    // sky dome: horizon fading up to the zenith (follows the camera)
    const sg2 = new T3.SphereGeometry(820, 32, 18);
    sg2.setAttribute('color', new T3.BufferAttribute(new Float32Array(sg2.attributes.position.count * 3), 3));
    sky = new T3.Mesh(sg2, new T3.MeshBasicMaterial({ vertexColors: true, side: T3.BackSide, fog: false, depthWrite: false }));
    sky.renderOrder = -1; scene.add(sky);
    scene.fog = new T3.Fog('#000', 100, 300);
    camera = new T3.PerspectiveCamera(48, 1.6, 0.5, 900);
    hemi = new T3.HemisphereLight('#fff', '#888', 1); scene.add(hemi);
    moon = new T3.DirectionalLight('#fff', 0.7); moon.position.set(40, 80, 30); scene.add(moon);
    // star field that travels with the camera
    const sp = [], R = rng(99);
    for (let i = 0; i < 1400; i++) { const a = R() * Math.PI * 2, e = 0.08 + R() * 1.4, r = 600; sp.push(Math.cos(a) * Math.cos(e) * r, Math.sin(e) * r, Math.sin(a) * Math.cos(e) * r); }
    const sg = new T3.BufferGeometry(); sg.setAttribute('position', new T3.Float32BufferAttribute(sp, 3));
    stars = new T3.Points(sg, new T3.PointsMaterial({ color: '#cfd8ff', size: 1.6, sizeAttenuation: false, fog: false, transparent: true, opacity: 0.85 }));
    scene.add(stars);
    applyTheme();
    window.addEventListener('pointermove', onWinMove, { passive: true });
    window.addEventListener('pointerup', onWinUp);
    window.addEventListener('pointercancel', onWinUp);
    document.addEventListener('visibilitychange', () => { if (!document.hidden) request(); });
    ro = new ResizeObserver(() => { resize(); request(); });
    io = new IntersectionObserver((en) => { inView = en[0].isIntersecting; if (inView) request(); });
  }

  function applyTheme() {
    scene.background = new T3.Color(TH.bg);
    scene.fog.color.set(TH.fog[0]); scene.fog.near = TH.fog[1]; scene.fog.far = TH.fog[2];
    hemi.color.set(TH.hemi[0]); hemi.groundColor.set(TH.hemi[1]); hemi.intensity = TH.hemi[2];
    moon.color.set(TH.sun[0]); moon.intensity = TH.sun[1];
    stars.visible = TH.stars;
    const pos = sky.geometry.attributes.position, col = sky.geometry.attributes.color;
    const cH = new T3.Color(TH.sky[0]), cM = new T3.Color(TH.sky[1]), cT = new T3.Color(TH.sky[2]), cc = new T3.Color();
    for (let i = 0; i < pos.count; i++) {
      const y = pos.getY(i) / 820;
      if (y < 0.06) cc.copy(cH); else if (y < 0.3) cc.copy(cH).lerp(cM, (y - 0.06) / 0.24); else cc.copy(cM).lerp(cT, Math.min(1, (y - 0.3) / 0.5));
      col.setXYZ(i, cc.r, cc.g, cc.b);
    }
    col.needsUpdate = true;
  }
  W3.setTheme = function (name) {
    if (!THEMES[name]) return;
    themeName = name; TH = THEMES[name];
    if (!renderer) return;
    applyTheme(); builtKey = null;
    if (lastCfg) W3.build(lastCfg);
  };
  W3.theme = () => themeName;

  W3.mount = function (el) {
    if (!renderer) init();
    if (host === el) return;
    if (host) { ro.unobserve(host); io.unobserve(host); }
    host = el;
    host.insertBefore(renderer.domElement, host.firstChild);
    ro.observe(host); io.observe(host);
    host.addEventListener('wheel', onWheel, { passive: false });
    host.addEventListener('pointerdown', onDown);
    host.addEventListener('pointerleave', () => { if (!drag) { tgt.hx = 0; tgt.hy = 0; request(); } });
    host.addEventListener('click', (e) => { if (suppressClick) { e.stopPropagation(); e.preventDefault(); suppressClick = false; } }, true);
    resize();
  };

  function resize() {
    if (!host) return;
    const w = host.clientWidth, h = host.clientHeight; if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.fov = w / h < 0.9 ? 58 : 48;
    camera.updateProjectionMatrix();
  }

  // ---------------- input ----------------
  const ignore = (t) => t.closest && t.closest('.pl-card, .cs-card, input, select, textarea, .w3-ui');
  let fMin = -1.5; const fMax = () => N + 0.5; // fMin is moved up to today by the app (past days are locked)
  function onWheel(e) {
    if (ignore(e.target)) return;
    e.preventDefault();
    const d = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY;
    tgt.f = clamp(tgt.f + d * 0.0055, fMin, fMax()); request();
  }
  function onDown(e) {
    if (e.button !== 0 || ignore(e.target)) return;
    drag = { x: e.clientX, y: e.clientY, f: tgt.f, yaw: tgt.yaw, moved: false };
  }
  function onWinMove(e) {
    if (!host) return;
    if (drag) {
      const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      if (!drag.moved && Math.hypot(dx, dy) > 7) { drag.moved = true; host.classList.add('w3-drag'); }
      if (drag.moved) {
        tgt.f = clamp(drag.f + dy * 0.022, fMin, fMax());
        tgt.yaw = clamp(drag.yaw + dx * 0.0042, -0.75, 0.75);
        request();
      }
      return;
    }
    if (e.pointerType !== 'mouse' || reduced()) return;
    const r = host.getBoundingClientRect();
    if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) return;
    tgt.hx = (e.clientX - r.left) / r.width - 0.5; tgt.hy = (e.clientY - r.top) / r.height - 0.5; request();
  }
  function onWinUp() {
    if (!drag) return;
    if (drag.moved) { suppressClick = true; setTimeout(() => (suppressClick = false), 0); }
    drag = null; if (host) host.classList.remove('w3-drag');
    request();
  }

  W3.goto = function (f, instant) {
    tgt.f = clamp(f, fMin, fMax());
    if (instant || reduced()) cur.f = tgt.f;
    request();
  };
  W3.insets = function (l, r, b) { tgt.sx = (l - r) / 2; tgt.sy = (b || 0) / 2; request(); };
  W3.setMarkers = function (els) { markers = els; request(); };
  W3._dbg = () => ({ scene, camera, renderer, world });
  W3.state = () => ({ cur: Object.assign({}, cur), tgt: Object.assign({}, tgt), N, anims: anims.length });

  // ---------------- per-frame ----------------
  function request() { if (!raf && renderer) raf = requestAnimationFrame(frame); }
  const P = { v: null };
  let simT = 0;
  function frame(t) {
    raf = 0;
    if (!host || !world || !host.isConnected) return;
    const dt = Math.min(0.05, lastT ? (t - lastT) / 1000 : 0.016); lastT = t;
    const ease = (k) => 1 - Math.exp(-dt * k);
    if (!drag) tgt.yaw *= 1 - ease(1.4);
    for (const [key, k] of [['f', 5], ['yaw', 6], ['hx', 4], ['hy', 4], ['sx', 6], ['sy', 6]]) {
      const d = tgt[key] - cur[key];
      if (Math.abs(d) > (key === 'f' ? 0.0008 : key[0] === 's' ? 0.3 : 0.0005)) cur[key] += d * ease(k); else cur[key] = tgt[key];
    }
    placeCamera();
    // live simulations near the camera
    const still = reduced();
    if (!still) simT += dt;
    const cz = camera.position.z;
    for (let i = 0; i < anims.length; i++) {
      const a = anims[i];
      const near = Math.abs(a.z - cz) < (a.far ? 420 : 240);
      a.o.visible = near;
      if (near) a.fn(simT, dt);
    }
    renderer.render(scene, camera);
    project();
    const rf = Math.round(clamp(cur.f, 0, N));
    if (onMove && rf !== lastMoveF) { lastMoveF = rf; onMove(rf); }
    // the world is alive: keep animating while it is on screen
    if (inView && !document.hidden && (!still || Math.abs(tgt.f - cur.f) > 0.0008 || drag)) request(); else lastT = 0;
  }

  const V = {};
  function placeCamera() {
    if (!V.a) { V.a = new T3.Vector3(); V.b = new T3.Vector3(); V.c = new T3.Vector3(); }
    const f = cur.f;
    const end = sstep(N - 2.6, N, f);
    const bk = f - lerp(2.55, 4.4, end), lk = f + lerp(2.1, 1.2, end);
    const pivot = V.c.set(roadX(f), 0, kz(f));
    const pos = V.a.set(roadX(bk), lerp(12.5, 17, end) - cur.hy * 2, kz(bk));
    const yaw = cur.yaw + cur.hx * 0.14;
    const ox = pos.x - pivot.x, oz = pos.z - pivot.z, cs = Math.cos(yaw), sn = Math.sin(yaw);
    pos.x = pivot.x + ox * cs + oz * sn; pos.z = pivot.z - ox * sn + oz * cs;
    camera.position.copy(pos);
    camera.lookAt(V.b.set(roadX(lk), lerp(TH.look, 6, end), kz(lk)));
    const w = renderer.domElement.width / renderer.getPixelRatio(), h = renderer.domElement.height / renderer.getPixelRatio();
    if (Math.abs(cur.sx) > 0.5 || Math.abs(cur.sy) > 0.5) camera.setViewOffset(w, h, -cur.sx, cur.sy, w, h); else camera.clearViewOffset();
    stars.position.copy(camera.position); sky.position.copy(camera.position);
  }

  const rc = { r: null, d: null, o: [] };
  function occluded(x, z) {
    if (!rc.o.length) return false;
    if (!rc.r) { rc.r = new T3.Raycaster(); rc.d = new T3.Vector3(); }
    rc.d.set(x, 0.9, z).sub(camera.position); const len = rc.d.length(); rc.d.normalize();
    rc.r.set(camera.position, rc.d); rc.r.far = len - 0.6;
    return rc.r.intersectObjects(rc.o, false).length > 0;
  }
  function project() {
    if (!markers.length) return;
    const w = renderer.domElement.width / renderer.getPixelRatio(), h = renderer.domElement.height / renderer.getPixelRatio();
    const v = P.v || (P.v = new T3.Vector3());
    for (let i = 0; i < markers.length; i++) {
      const el = markers[i]; if (!el) continue;
      const x3 = roadX(i), z3 = kz(i);
      const dist = Math.hypot(camera.position.x - x3, camera.position.y, camera.position.z - z3);
      v.set(x3, 0.16, z3).project(camera);
      const vis = v.z < 1 && v.z > -1 && dist < 118 && v.x > -1.3 && v.x < 1.3 && v.y > -1.4 && v.y < 1.4;
      if (!vis) { if (el._v !== 0) { el.style.visibility = 'hidden'; el._v = 0; } continue; }
      if (el._v !== 1) { el.style.visibility = ''; el._v = 1; }
      const sx = (v.x + 1) / 2 * w, sy = (1 - v.y) / 2 * h, s = clamp(24 / dist, 0.36, 1.05);
      el.style.transform = `translate3d(${sx.toFixed(1)}px,${sy.toFixed(1)}px,0) scale(${s.toFixed(3)}) translate(-50%,-100%)`;
      const hid = occluded(x3, z3);
      if (el._h !== hid) { el._h = hid; el.classList.toggle('w3-hid', hid); }
      el.style.opacity = (hid ? 0.16 : 1 - sstep(80, 118, dist)).toFixed(2);
      el.style.zIndex = String(2000 - Math.round(dist * 10));
    }
  }

  // ---------------- build ----------------
  W3.build = function (cfg) {
    if (!renderer) init();
    lastCfg = cfg; onMove = cfg.onMove || null;
    fMin = cfg.minF != null ? cfg.minF : -1.5;
    if (tgt.f < fMin) { tgt.f = fMin; cur.f = Math.max(cur.f, fMin); }
    if (builtKey !== cfg.key) { buildWorld(cfg); builtKey = cfg.key; lastMoveF = null; }
    const col = tmp.c;
    cfg.pads.forEach((c, i) => { if (i < pads.count) pads.setColorAt(i, col.set(c)); });
    pads.instanceColor.needsUpdate = true;
    const ti = clamp(cfg.ti, -0.6, N);
    const k = ti - 0.42, [fx, fz] = fwd(k);
    car.position.set(roadX(k) + fz * 1.5, 0, kz(k) - fx * 1.5);
    car.rotation.y = Math.atan2(-fx, -fz);
    if (carAnim) carAnim.z = car.position.z;
    cfg.checks.forEach((c, i) => { const s = plates[i]; if (s && s.userData.n !== c.n) { s.userData.n = c.n; s.userData.redraw(s.userData.draw); } });
    if (!W3._fontsHooked && document.fonts && document.fonts.status !== 'loaded') {
      W3._fontsHooked = true;
      document.fonts.ready.then(() => { builtKey = null; if (lastCfg) W3.build(lastCfg); });
    }
    request();
  };

  function dispose(o) {
    o.traverse((m) => {
      if (m.geometry) m.geometry.dispose();
      if (m.material) { (Array.isArray(m.material) ? m.material : [m.material]).forEach((mt) => { if (mt.map) mt.map.dispose(); mt.dispose(); }); }
    });
  }

  // material / geometry caches (rebuilt with each world)
  let MC = {}, GC = {}, glowTex = null;
  const L = (c, g) => MC['L' + c + (g || 0)] || (MC['L' + c + (g || 0)] = new T3.MeshLambertMaterial({ color: c, emissive: c, emissiveIntensity: g == null ? 0.18 : g }));
  const B = (c, o) => { const k = 'B' + c + (o || 1); return MC[k] || (MC[k] = new T3.MeshBasicMaterial({ color: c, transparent: o != null && o < 1, opacity: o == null ? 1 : o, depthWrite: !(o != null && o < 1) })); };
  const LN = (c, o) => MC['N' + c + (o || 1)] || (MC['N' + c + (o || 1)] = new T3.LineBasicMaterial({ color: c, transparent: true, opacity: o == null ? 0.9 : o }));
  const GLASS = (c) => MC['G' + c] || (MC['G' + c] = new T3.MeshLambertMaterial({ color: c, emissive: c, emissiveIntensity: 0.25, transparent: true, opacity: 0.32, depthWrite: false, side: T3.DoubleSide }));
  const sph = () => GC.sph || (GC.sph = new T3.SphereGeometry(1, 20, 14));
  const sphLo = () => GC.sphLo || (GC.sphLo = new T3.SphereGeometry(1, 10, 8));
  const cylC = () => GC.cylC || (GC.cylC = new T3.CylinderGeometry(1, 1, 1, 8));
  const UP = { v: null };
  function glow(color, size, op) {
    if (!glowTex) {
      const c = document.createElement('canvas'); c.width = c.height = 64;
      const x = c.getContext('2d'), g = x.createRadialGradient(32, 32, 0, 32, 32, 32);
      g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.25, 'rgba(255,255,255,.55)'); g.addColorStop(1, 'rgba(255,255,255,0)');
      x.fillStyle = g; x.fillRect(0, 0, 64, 64); glowTex = new T3.CanvasTexture(c);
    }
    const s = new T3.Sprite(new T3.SpriteMaterial({ map: glowTex, color, transparent: true, opacity: op == null ? 0.85 : op, blending: T3.AdditiveBlending, depthWrite: false }));
    s.scale.set(size, size, 1); return s;
  }
  function mesh(g, m, x, y, z, s) { const o = new T3.Mesh(g, m); o.position.set(x || 0, y || 0, z || 0); if (s != null) (typeof s === 'number' ? o.scale.setScalar(s) : o.scale.set(s[0], s[1], s[2])); return o; }
  function bond(a, b, r, m) {
    if (!UP.v) UP.v = new T3.Vector3(0, 1, 0);
    const d = new T3.Vector3().subVectors(b, a), len = d.length();
    const o = new T3.Mesh(cylC(), m); o.scale.set(r, len, r);
    o.position.copy(a).addScaledVector(d, 0.5); o.quaternion.setFromUnitVectors(UP.v, d.normalize());
    return o;
  }
  function anim(o, fn, far) { const a = { o, fn, z: o.position.z, far }; anims.push(a); return a; }
  let carAnim = null;
  function pedestal(g, r, color) {
    g.add(mesh(GC.ped || (GC.ped = new T3.CylinderGeometry(1, 1.12, 0.6, 6)), L(TH.ped, 0.08), 0, 0.3, 0, [r, 1, r]));
    const ring = mesh(GC.ring || (GC.ring = new T3.TorusGeometry(1, 0.04, 6, 48)), B(color), 0, 0.64, 0, r * 0.98); ring.rotation.x = Math.PI / 2; g.add(ring);
  }

  // ======================= PHYSICS =======================
  function solar(s) {
    const g = new T3.Group(), sys = new T3.Group(); sys.position.y = 9 * s; sys.rotation.x = 0.32; g.add(sys);
    sys.add(mesh(sph(), B('#ffd166'), 0, 0, 0, 2.2 * s)); sys.add(glow('#ffb23a', 13 * s, 0.9));
    const pl = [[4.6, 0.45, '#8fd3ff', 1.7], [6.8, 0.75, '#ff8a5c', 1.15], [9.2, 0.95, '#7ef0c0', 0.8], [12, 1.25, '#d8b4ff', 0.55]];
    const items = pl.map(([r, sz, c, sp], i) => {
      const ring = mesh(GC.orb || (GC.orb = new T3.TorusGeometry(1, 0.012, 4, 120)), B(c, 0.35), 0, 0, 0, r * s); ring.rotation.x = Math.PI / 2; sys.add(ring);
      const p = new T3.Group(); p.add(mesh(sph(), L(c, 0.35), 0, 0, 0, sz * s));
      if (i === 3) { const rg = mesh(GC.sat || (GC.sat = new T3.RingGeometry(1.4, 2.1, 40)), new T3.MeshBasicMaterial({ color: '#f1d9ff', side: T3.DoubleSide, transparent: true, opacity: 0.6 }), 0, 0, 0, sz * s); rg.rotation.x = 1.2; p.add(rg); }
      sys.add(p); return { p, r: r * s, sp, ph: i * 1.7 };
    });
    pedestal(g, 4 * s, ZC.phys);
    g.add(mesh(cylC(), B('#4fb3ff', 0.25), 0, 4.6 * s, 0, [0.12 * s, 8.4 * s, 0.12 * s]));
    return [g, (t) => { items.forEach((it) => { const a = it.ph + t * it.sp * 0.6; it.p.position.set(Math.cos(a) * it.r, 0, Math.sin(a) * it.r); }); sys.rotation.y = t * 0.05; }];
  }
  function gearGeo(teeth, r, depth) {
    const key = `gear${teeth}_${r}`; if (GC[key]) return GC[key];
    const sh = new T3.Shape(), ro = r * 1.16, ri = r * 0.94, st = (Math.PI * 2) / teeth;
    for (let i = 0; i < teeth; i++) {
      const a = i * st;
      [[ri, a], [ro, a + st * 0.18], [ro, a + st * 0.48], [ri, a + st * 0.66]].forEach(([rr, aa], j) => { const x = Math.cos(aa) * rr, y = Math.sin(aa) * rr; if (!i && !j) sh.moveTo(x, y); else sh.lineTo(x, y); });
    }
    sh.closePath();
    const hole = new T3.Path(); hole.absarc(0, 0, r * 0.26, 0, Math.PI * 2, true); sh.holes.push(hole);
    for (let w = 0; w < 4; w++) { const a = w * Math.PI / 2 + 0.4, hp = new T3.Path(); hp.absarc(Math.cos(a) * r * 0.58, Math.sin(a) * r * 0.58, r * 0.17, 0, Math.PI * 2, true); sh.holes.push(hp); }
    const g = new T3.ExtrudeGeometry(sh, { depth, bevelEnabled: false, curveSegments: 10 }); g.translate(0, 0, -depth / 2);
    return (GC[key] = g);
  }
  function gears(s) {
    const g = new T3.Group(), rig = new T3.Group(); rig.position.y = 7 * s; g.add(rig);
    const defs = [[18, 3.4, 0, 0, '#9fb6d4'], [11, 2.08, 0, 0, '#ffcf6b'], [14, 2.64, 0, 0, '#7fd8ff']];
    const d01 = (3.4 + 2.08) * 1.05, d12 = (2.08 + 2.64) * 1.05;
    defs[1][2] = d01 * s; defs[1][3] = 0;
    defs[2][2] = (d01 + d12 * Math.cos(1.1)) * s; defs[2][3] = d12 * Math.sin(1.1) * s;
    const gs = defs.map(([n, r, x, y, c]) => {
      const m = mesh(gearGeo(n, r * s, 0.9 * s), L(c, 0.25), x - 3 * s, y, 0); rig.add(m);
      const hub = mesh(cylC(), B('#e8f6ff'), x - 3 * s, y, 0, [0.5 * s, 1.4 * s, 0.5 * s]); hub.rotation.x = Math.PI / 2; rig.add(hub);
      const hg = glow(c, 3 * s, 0.6); hg.position.set(x - 3 * s, y, 0.8 * s); rig.add(hg);
      return { m, n };
    });
    g.add(mesh(BOXG(), L('#2a3160', 0.1), -3 * s, 3 * s, -0.9 * s, [0.6 * s, 6 * s, 0.4 * s]));
    pedestal(g, 4.5 * s, ZC.phys);
    return [g, (t) => { const w = t * 0.6; gs[0].m.rotation.z = w; gs[1].m.rotation.z = -w * 18 / 11 + 0.15; gs[2].m.rotation.z = w * 18 / 14 + 0.1; }];
  }
  const BOXG = () => GC.box || (GC.box = new T3.BoxGeometry(1, 1, 1).translate(0, 0.5, 0));
  function cradle(s) {
    const g = new T3.Group(), Lh = 5 * s, top = 9 * s, n = 5, br = 0.62 * s;
    const frame = L('#b8c6e6', 0.2);
    for (const z of [-1.4 * s, 1.4 * s]) { g.add(mesh(BOXG(), frame, -4 * s, 0, z, [0.3 * s, top, 0.3 * s])); g.add(mesh(BOXG(), frame, 4 * s, 0, z, [0.3 * s, top, 0.3 * s])); g.add(mesh(BOXG(), frame, 0, top - 0.3 * s, z, [8.3 * s, 0.3 * s, 0.3 * s])); }
    const pivots = [];
    for (let i = 0; i < n; i++) {
      const p = new T3.Group(); p.position.set((i - 2) * br * 2.02, top - 0.3 * s, 0); g.add(p);
      for (const z of [-1.35 * s, 1.35 * s]) p.add(bond(new T3.Vector3(0, 0, z), new T3.Vector3(0, -Lh, 0), 0.03 * s, B('#cfe3ff', 0.7)));
      p.add(mesh(sph(), L('#dfe8f5', 0.3), 0, -Lh, 0, br)); pivots.push(p);
    }
    for (const p of [pivots[0], pivots[4]]) { const gl = glow('#7fd3ff', 2.4 * s, 0.6); gl.position.set(0, -Lh, 0); p.add(gl); }
    pedestal(g, 5 * s, ZC.phys);
    return [g, (t) => { const ph = Math.sin(t * 2.6); pivots[0].rotation.z = Math.min(0, ph) * 0.65; pivots[4].rotation.z = Math.max(0, ph) * 0.65; }];
  }
  function pendulum(s) {
    const g = new T3.Group(), top = 13 * s, Lh = 10 * s;
    g.add(mesh(BOXG(), L('#b8c6e6', 0.2), -5 * s, 0, 0, [0.4 * s, top, 0.4 * s])); g.add(mesh(BOXG(), L('#b8c6e6', 0.2), 5 * s, 0, 0, [0.4 * s, top, 0.4 * s]));
    g.add(mesh(BOXG(), L('#b8c6e6', 0.2), 0, top - 0.4 * s, 0, [10.4 * s, 0.4 * s, 0.4 * s]));
    const arc = mesh(new T3.TorusGeometry(Lh, 0.05 * s, 4, 60, 1.3), B('#4fb3ff', 0.5), 0, top - 0.4 * s, 0); arc.rotation.z = -Math.PI / 2 - 0.65; g.add(arc);
    const p = new T3.Group(); p.position.y = top - 0.4 * s; g.add(p);
    p.add(bond(new T3.Vector3(0, 0, 0), new T3.Vector3(0, -Lh, 0), 0.05 * s, B('#cfe3ff')));
    p.add(mesh(sph(), L('#ffd166', 0.5), 0, -Lh, 0, 1.1 * s)); const gl = glow('#ffb23a', 6 * s, 0.7); gl.position.y = -Lh; p.add(gl);
    pedestal(g, 6 * s, ZC.phys);
    return [g, (t) => { p.rotation.z = Math.sin(t * 1.25) * 0.62; }];
  }
  function magnet(s) {
    const g = new T3.Group(), m = new T3.Group(); m.position.y = 7 * s; g.add(m);
    m.add(mesh(BOXG(), L('#ff4b55', 0.35), 1.6 * s, -0.7 * s, 0, [3.2 * s, 1.4 * s, 1.4 * s]));
    m.add(mesh(BOXG(), L('#4f7dff', 0.35), -1.6 * s, -0.7 * s, 0, [3.2 * s, 1.4 * s, 1.4 * s]));
    const lines = [], parts = [];
    for (let j = 0; j < 4; j++) {
      const a = 3.6 * s * (1 + j * 0.42), b = 1.4 * s * (1 + j * 0.9);
      for (let p = 0; p < 4; p++) {
        const pts = []; for (let i = 0; i <= 64; i++) { const th = (i / 64) * Math.PI * 2; pts.push(new T3.Vector3(Math.cos(th) * a, Math.sin(th) * b, 0)); }
        const ln = new T3.Line(new T3.BufferGeometry().setFromPoints(pts), LN('#7fd3ff', 0.45 - j * 0.07)); ln.rotation.x = (p / 4) * Math.PI; m.add(ln); lines.push(ln);
        const dot = mesh(sphLo(), B('#e6f7ff'), 0, 0, 0, 0.16 * s); ln.add(dot); parts.push({ dot, a, b, ph: Math.random() * 6, sp: 0.9 - j * 0.12 });
      }
    }
    pedestal(g, 4 * s, ZC.phys);
    return [g, (t) => { parts.forEach((q) => { const th = q.ph + t * q.sp; q.dot.position.set(Math.cos(th) * q.a, Math.sin(th) * q.b, 0); }); m.rotation.y = t * 0.2; }];
  }
  function emwave(s) {
    const g = new T3.Group(), n = 34, len = 18 * s, base = 6 * s;
    g.add(bond(new T3.Vector3(-len / 2, base, 0), new T3.Vector3(len / 2 + 1.4 * s, base, 0), 0.06 * s, B('#ffffff', 0.8)));
    const cone = mesh(GC.cone || (GC.cone = new T3.ConeGeometry(1, 2, 10)), B('#ffffff'), len / 2 + 1.8 * s, base, 0, 0.35 * s); cone.rotation.z = -Math.PI / 2; g.add(cone);
    const mk = (c) => { const im = new T3.InstancedMesh(cylC(), B(c), n); g.add(im); return im; };
    const E = mk('#ff6b8a'), Bm = mk('#5fd0ff');
    const tipE = new T3.InstancedMesh(sphLo(), B('#ffc2cf'), n), tipB = new T3.InstancedMesh(sphLo(), B('#c9f1ff'), n); g.add(tipE); g.add(tipB);
    const m4 = new T3.Matrix4(), q = new T3.Quaternion(), v = new T3.Vector3(), sc = new T3.Vector3(), ax = new T3.Vector3(1, 0, 0);
    pedestal(g, 3 * s, ZC.phys);
    return [g, (t) => {
      for (let i = 0; i < n; i++) {
        const x = -len / 2 + (i / (n - 1)) * len, a = Math.sin(x / s * 0.7 - t * 2.4) * 3.2 * s;
        q.identity();
        E.setMatrixAt(i, m4.compose(v.set(x, base + a / 2, 0), q, sc.set(0.07 * s, Math.abs(a) + 0.001, 0.07 * s)));
        tipE.setMatrixAt(i, m4.compose(v.set(x, base + a, 0), q, sc.setScalar(0.18 * s)));
        q.setFromAxisAngle(ax, Math.PI / 2);
        Bm.setMatrixAt(i, m4.compose(v.set(x, base, -a / 2), q, sc.set(0.07 * s, Math.abs(a) + 0.001, 0.07 * s)));
        tipB.setMatrixAt(i, m4.compose(v.set(x, base, -a), q.identity(), sc.setScalar(0.18 * s)));
      }
      E.instanceMatrix.needsUpdate = Bm.instanceMatrix.needsUpdate = tipE.instanceMatrix.needsUpdate = tipB.instanceMatrix.needsUpdate = true;
    }];
  }

  // ======================= CHEMISTRY =======================
  const EL = { H: ['#f4f6fb', 0.34], C: ['#6b7385', 0.55], O: ['#ff4b55', 0.52], N: ['#4f7dff', 0.52], Na: ['#b38cff', 0.5], Cl: ['#4be38e', 0.62] };
  const MOLS = {
    'H₂O': { a: [['O', 0, 0, 0], ['H', 0.76, -0.59, 0], ['H', -0.76, -0.59, 0]], b: [[0, 1], [0, 2]] },
    'CH₄': { a: [['C', 0, 0, 0], ['H', 0.63, 0.63, 0.63], ['H', -0.63, -0.63, 0.63], ['H', -0.63, 0.63, -0.63], ['H', 0.63, -0.63, -0.63]], b: [[0, 1], [0, 2], [0, 3], [0, 4]] },
    'CO₂': { a: [['C', 0, 0, 0], ['O', 1.16, 0, 0], ['O', -1.16, 0, 0]], b: [[0, 1], [0, 2]] },
    'NH₃': { a: [['N', 0, 0.3, 0], ['H', 0.94, -0.08, 0], ['H', -0.47, -0.08, 0.81], ['H', -0.47, -0.08, -0.81]], b: [[0, 1], [0, 2], [0, 3]] },
    'C₆H₆': (() => { const a = [], b = []; for (let i = 0; i < 6; i++) { const t = (i / 6) * Math.PI * 2; a.push(['C', Math.cos(t) * 1.4, Math.sin(t) * 1.4, 0]); } for (let i = 0; i < 6; i++) { const t = (i / 6) * Math.PI * 2; a.push(['H', Math.cos(t) * 2.45, Math.sin(t) * 2.45, 0]); b.push([i, (i + 1) % 6], [i, i + 6]); } return { a, b }; })(),
  };
  function molGroup(name, sc) {
    const m = new T3.Group(), def = MOLS[name], pos = def.a.map(([, x, y, z]) => new T3.Vector3(x * sc, y * sc, z * sc));
    def.a.forEach(([el], i) => m.add(mesh(sph(), L(EL[el][0], 0.3), pos[i].x, pos[i].y, pos[i].z, EL[el][1] * sc * 0.75)));
    def.b.forEach(([i, j]) => m.add(bond(pos[i], pos[j], 0.09 * sc, L('#c9d2e8', 0.2))));
    return m;
  }
  function molecule(s, R) {
    const names = Object.keys(MOLS), name = names[(R() * names.length) | 0];
    const g = new T3.Group(), m = molGroup(name, 2.4 * s); m.position.y = 8 * s; g.add(m);
    const lab = holo(4.2 * s, 1.3 * s, ZC.chem, [[name, 0.5, 800, '#eafff4', 0.52]]); lab.position.y = 2.6 * s; g.add(lab);
    pedestal(g, 3.4 * s, ZC.chem);
    const ph = R() * 6;
    return [g, (t) => { m.rotation.y = t * 0.6 + ph; m.rotation.x = Math.sin(t * 0.5 + ph) * 0.5; m.position.y = 8 * s + Math.sin(t * 1.2 + ph) * 0.6 * s; }];
  }
  function bohr(s) {
    const g = new T3.Group(), at = new T3.Group(); at.position.y = 9 * s; g.add(at);
    const R = rng(5);
    for (let i = 0; i < 12; i++) at.add(mesh(sph(), L(i % 2 ? '#ff5a6a' : '#b9c2d6', 0.35), (R() - 0.5) * 1.3 * s, (R() - 0.5) * 1.3 * s, (R() - 0.5) * 1.3 * s, 0.55 * s));
    at.add(glow('#ff8a9a', 5 * s, 0.5));
    const orbs = [];
    [[4.2, 0, 2.2], [5.6, 1.05, 1.6], [7, -1.05, 1.2]].forEach(([r, tilt, sp], i) => {
      const o = new T3.Group(); o.rotation.set(tilt, 0, i * 0.6); at.add(o);
      const ring = mesh(GC.orb || (GC.orb = new T3.TorusGeometry(1, 0.012, 4, 120)), B('#7fffc4', 0.45), 0, 0, 0, r * s); ring.rotation.x = Math.PI / 2; o.add(ring);
      for (let e = 0; e < 2; e++) { const el = new T3.Group(); el.add(mesh(sphLo(), B('#bfffe2'), 0, 0, 0, 0.3 * s)); el.add(glow('#3fe39a', 1.8 * s, 0.9)); o.add(el); orbs.push({ el, r: r * s, sp, ph: e * Math.PI }); }
    });
    pedestal(g, 4 * s, ZC.chem);
    return [g, (t) => { orbs.forEach((q) => { const a = q.ph + t * q.sp; q.el.position.set(Math.cos(a) * q.r, 0, Math.sin(a) * q.r); }); at.rotation.y = t * 0.15; }];
  }
  function dna(s) {
    const g = new T3.Group(), h = new T3.Group(); g.add(h);
    const n = 26, rad = 2.6 * s, im = new T3.InstancedMesh(sph(), new T3.MeshLambertMaterial({ color: '#ffffff', emissive: '#333333' }), n * 2), rungs = new T3.InstancedMesh(cylC(), new T3.MeshBasicMaterial({ color: '#ffffff' }), n);
    const m4 = new T3.Matrix4(), q = new T3.Quaternion(), v = new T3.Vector3(), sc = new T3.Vector3(), c = new T3.Color(), zax = new T3.Vector3(0, 0, 1);
    const bp = ['#ff6b8a', '#ffd166', '#5fd0ff', '#7ef0c0'];
    for (let i = 0; i < n; i++) {
      const a = i * 0.52, y = 1.5 * s + i * 0.82 * s;
      im.setMatrixAt(i * 2, m4.compose(v.set(Math.cos(a) * rad, y, Math.sin(a) * rad), q.identity(), sc.setScalar(0.42 * s))); im.setColorAt(i * 2, c.set('#5fd0ff'));
      im.setMatrixAt(i * 2 + 1, m4.compose(v.set(-Math.cos(a) * rad, y, -Math.sin(a) * rad), q.identity(), sc.setScalar(0.42 * s))); im.setColorAt(i * 2 + 1, c.set('#c98bff'));
      q.setFromAxisAngle(zax, Math.PI / 2); const q2 = new T3.Quaternion().setFromAxisAngle(new T3.Vector3(0, 1, 0), -a); q2.multiply(q);
      rungs.setMatrixAt(i, m4.compose(v.set(0, y, 0), q2, sc.set(0.1 * s, rad * 2, 0.1 * s))); rungs.setColorAt(i, c.set(bp[i % 4]));
    }
    h.add(im); h.add(rungs);
    const gl = glow('#3fe39a', 16 * s, 0.25); gl.position.y = 12 * s; g.add(gl);
    pedestal(g, 4 * s, ZC.chem);
    return [g, (t) => { h.rotation.y = t * 0.45; }];
  }
  function flaskGeo(s, fill) {
    const p = [[0, 0], [1.6, 0], [2.0, 0.5], [2.05, 1.5], [1.45, 2.6], [0.55, 3.3], [0.5, 4.7], [0.64, 4.85]];
    const pts = (fill ? p.filter((q) => q[1] <= 2.2).concat([[1.65, 2.2], [0, 2.2]]) : p).map(([x, y]) => new T3.Vector2(x * s * (fill ? 0.94 : 1), y * s + (fill ? 0.05 * s : 0)));
    return new T3.LatheGeometry(pts, 26);
  }
  function flasks(s, R) {
    const g = new T3.Group(), bub = [];
    g.add(mesh(BOXG(), L('#2b3270', 0.1), 0, 3.2 * s, 0, [14 * s, 0.4 * s, 4 * s]));
    for (const x of [-6.6, 6.6]) g.add(mesh(BOXG(), L('#232a5c', 0.1), x * s, 0, 0, [0.5 * s, 3.2 * s, 3.6 * s]));
    [['#3fe39a', -4.2], ['#ff6bd5', 0], ['#5fd0ff', 4.2]].forEach(([c, x]) => {
      const f = new T3.Group(); f.position.set(x * s, 3.6 * s, 0); g.add(f);
      f.add(new T3.Mesh(flaskGeo(s, false), GLASS('#cfe8ff')));
      f.add(new T3.Mesh(flaskGeo(s, true), B(c, 0.78)));
      const gl = glow(c, 5 * s, 0.55); gl.position.y = 1.2 * s; f.add(gl);
      for (let i = 0; i < 9; i++) { const b = mesh(sphLo(), B('#ffffff', 0.85), 0, 0, 0, 0.13 * s); f.add(b); bub.push({ b, ph: R(), sp: 0.25 + R() * 0.3, x: (R() - 0.5) * 2, z: (R() - 0.5) * 2, s }); }
      const vap = glow(c, 3 * s, 0.4); vap.position.y = 5.6 * s; f.add(vap); bub.push({ vap, ph: R() });
    });
    const lab = holo(7 * s, 1.3 * s, ZC.chem, [['Reaction lab', 0.46, 700, '#eafff4', 0.52]]); lab.position.set(0, 10.4 * s, 0); g.add(lab);
    return [g, (t) => {
      bub.forEach((q) => {
        const u = (t * (q.sp || 0.3) + q.ph) % 1;
        if (q.vap) { q.vap.position.y = (5 + u * 2.5) * s; q.vap.material.opacity = 0.45 * (1 - u); return; }
        const y = u * 4.6, w = y < 2.2 ? 1.5 : 0.35;
        q.b.position.set(q.x * w * q.s * 0.6, y * q.s + 0.2 * q.s, q.z * w * q.s * 0.6); q.b.visible = y < 2.2 || u < 0.9;
      });
    }];
  }
  function lattice(s) {
    const g = new T3.Group(), cr = new T3.Group(); cr.position.y = 8 * s; g.add(cr);
    const n = 3, st = 1.9 * s, im = new T3.InstancedMesh(sph(), new T3.MeshLambertMaterial({ color: '#fff', emissive: '#2a2a2a' }), n * n * n);
    const m4 = new T3.Matrix4(), c = new T3.Color(), lp = [];
    let i = 0;
    for (let x = 0; x < n; x++) for (let y = 0; y < n; y++) for (let z = 0; z < n; z++) {
      const na = (x + y + z) % 2 === 0, p = [(x - 1) * st, (y - 1) * st, (z - 1) * st];
      im.setMatrixAt(i, m4.makeScale(na ? 0.45 * s : 0.68 * s, na ? 0.45 * s : 0.68 * s, na ? 0.45 * s : 0.68 * s).setPosition(p[0], p[1], p[2]));
      im.setColorAt(i++, c.set(na ? EL.Na[0] : EL.Cl[0]));
      if (x < n - 1) lp.push(...p, p[0] + st, p[1], p[2]); if (y < n - 1) lp.push(...p, p[0], p[1] + st, p[2]); if (z < n - 1) lp.push(...p, p[0], p[1], p[2] + st);
    }
    cr.add(im);
    const lg = new T3.BufferGeometry(); lg.setAttribute('position', new T3.Float32BufferAttribute(lp, 3)); cr.add(new T3.LineSegments(lg, LN('#bfffe2', 0.5)));
    const lab = holo(4.4 * s, 1.3 * s, ZC.chem, [['NaCl crystal', 0.42, 700, '#eafff4', 0.52]]); lab.position.y = 2.4 * s; g.add(lab);
    pedestal(g, 3.6 * s, ZC.chem);
    return [g, (t) => { cr.rotation.y = t * 0.4; cr.rotation.x = t * 0.23; }];
  }
  function reaction(s) {
    const g = new T3.Group(), stage = new T3.Group(); stage.position.y = 8 * s; g.add(stage);
    const H2 = () => { const m = new T3.Group(); m.add(mesh(sph(), L(EL.H[0], 0.3), 0.37 * 1.6 * s, 0, 0, 0.4 * s)); m.add(mesh(sph(), L(EL.H[0], 0.3), -0.37 * 1.6 * s, 0, 0, 0.4 * s)); m.add(bond(new T3.Vector3(-0.6 * s, 0, 0), new T3.Vector3(0.6 * s, 0, 0), 0.09 * s, L('#c9d2e8'))); return m; };
    const O2 = new T3.Group(); O2.add(mesh(sph(), L(EL.O[0], 0.35), 0.6 * s, 0, 0, 0.6 * s)); O2.add(mesh(sph(), L(EL.O[0], 0.35), -0.6 * s, 0, 0, 0.6 * s));
    const a = H2(), b = H2(); stage.add(a); stage.add(b); stage.add(O2);
    const p1 = molGroup('H₂O', 1.7 * s), p2 = molGroup('H₂O', 1.7 * s); stage.add(p1); stage.add(p2);
    const flash = glow('#fff2b3', 10 * s, 0); stage.add(flash);
    const lab = holo(8.5 * s, 1.4 * s, ZC.chem, [['2H₂ + O₂ → 2H₂O', 0.46, 800, '#eafff4', 0.52]]); lab.position.y = 2.6 * s; g.add(lab);
    pedestal(g, 4.5 * s, ZC.chem);
    return [g, (t) => {
      const u = (t / 6) % 1, k = sstep(0, 0.45, u);
      const show = u < 0.5;
      a.visible = b.visible = O2.visible = show; p1.visible = p2.visible = !show;
      a.position.set(lerp(-7, -1.6, k) * s, lerp(2, 0.6, k) * s, 0); b.position.set(lerp(-7, -1.6, k) * s, lerp(-2, -0.6, k) * s, 0);
      O2.position.set(lerp(7, 1.2, k) * s, 0, 0); O2.rotation.z = t * 2; a.rotation.z = t * 2.4; b.rotation.z = -t * 2.1;
      const v = sstep(0.5, 0.9, u);
      p1.position.set(-v * 3.2 * s, 0.8 * s, 0); p2.position.set(v * 3.2 * s, -0.8 * s, 0); p1.rotation.y = p2.rotation.x = t * 1.5;
      flash.material.opacity = u > 0.44 && u < 0.62 ? 1 - Math.abs(u - 0.5) * 8 : 0;
    }];
  }

  // ======================= MATHEMATICS =======================
  const POLYS = [
    ['Icosahedron', () => new T3.IcosahedronGeometry(1, 0), '#ffae4a'],
    ['Dodecahedron', () => new T3.DodecahedronGeometry(1, 0), '#ff7ab6'],
    ['Octahedron', () => new T3.OctahedronGeometry(1, 0), '#ffd166'],
    ['Tetrahedron', () => new T3.TetrahedronGeometry(1, 0), '#7fd3ff'],
    ['Torus knot', () => new T3.TorusKnotGeometry(0.7, 0.22, 90, 10, 2, 3), '#c98bff'],
  ];
  function poly(s, R, idx) {
    const [name, gf, c] = POLYS[idx % POLYS.length];
    const g = new T3.Group(), p = new T3.Group(); p.position.y = 8.5 * s; g.add(p);
    const geo = GC['p' + name] || (GC['p' + name] = gf());
    p.add(mesh(geo, new T3.MeshLambertMaterial({ color: c, emissive: c, emissiveIntensity: 0.3, transparent: true, opacity: 0.55, side: T3.DoubleSide, depthWrite: false }), 0, 0, 0, 3.4 * s));
    if (name !== 'Torus knot') { const e = new T3.LineSegments(GC['e' + name] || (GC['e' + name] = new T3.EdgesGeometry(geo)), LN('#fff3dc', 0.95)); e.scale.setScalar(3.45 * s); p.add(e); }
    p.add(glow(c, 12 * s, 0.35));
    const lab = holo(5 * s, 1.3 * s, ZC.math, [[name, 0.44, 700, '#fff3e0', 0.52]]); lab.position.y = 2.4 * s; g.add(lab);
    pedestal(g, 3.6 * s, ZC.math);
    const ph = R() * 6;
    return [g, (t) => { p.rotation.y = t * 0.5 + ph; p.rotation.x = t * 0.31 + ph; p.position.y = 8.5 * s + Math.sin(t + ph) * 0.7 * s; }];
  }
  function surface(s) {
    const g = new T3.Group(), n = 30, size = 14 * s;
    const geo = new T3.PlaneGeometry(size, size, n, n).rotateX(-Math.PI / 2);
    const pos = geo.attributes.position, base = Float32Array.from(pos.array);
    const cols = new Float32Array(pos.count * 3); geo.setAttribute('color', new T3.BufferAttribute(cols, 3));
    const fill = new T3.Mesh(geo, new T3.MeshBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.55, side: T3.DoubleSide, depthWrite: false }));
    const wire = new T3.Mesh(geo, new T3.MeshBasicMaterial({ color: '#ffe2b8', wireframe: true, transparent: true, opacity: 0.55 }));
    const sf = new T3.Group(); sf.position.y = 6 * s; sf.add(fill); sf.add(wire); g.add(sf);
    const ax = [[[-size / 2 - 1, 0, 0], [size / 2 + 1, 0, 0], '#ff6b6b'], [[0, -3 * s, 0], [0, 5 * s, 0], '#7ef07e'], [[0, 0, -size / 2 - 1], [0, 0, size / 2 + 1], '#6bb5ff']];
    ax.forEach(([a, b, c]) => sf.add(bond(new T3.Vector3(...a), new T3.Vector3(...b), 0.06 * s, B(c))));
    const lab = holo(8 * s, 1.4 * s, ZC.math, [['z = sin(x − t) · cos(y − t)', 0.42, 700, '#fff3e0', 0.52]]); lab.position.set(0, 13.2 * s, 0); g.add(lab);
    pedestal(g, 8 * s, ZC.math);
    const c = new T3.Color(), c1 = new T3.Color('#6a3cff'), c2 = new T3.Color('#ffb347');
    return [g, (t) => {
      for (let i = 0; i < pos.count; i++) {
        const x = base[i * 3] / s, z = base[i * 3 + 2] / s;
        const y = Math.sin(x * 0.55 - t * 1.3) * Math.cos(z * 0.55 - t * 0.9) * 2.4;
        pos.array[i * 3 + 1] = y * s;
        c.copy(c1).lerp(c2, (y + 2.4) / 4.8); cols[i * 3] = c.r; cols[i * 3 + 1] = c.g; cols[i * 3 + 2] = c.b;
      }
      pos.needsUpdate = true; geo.attributes.color.needsUpdate = true;
    }];
  }
  function graph(s) {
    const g = new T3.Group(), w = 16 * s, h = 9 * s, y0 = 7.5 * s;
    const board = sign(w, h, (x, cw, ch) => {
      x.fillStyle = 'rgba(10,12,40,.72)'; rrect(x, 4, 4, cw - 8, ch - 8, 22); x.fill();
      x.strokeStyle = 'rgba(255,174,74,.25)'; x.lineWidth = 2;
      for (let i = 1; i < 16; i++) { x.beginPath(); x.moveTo((cw * i) / 16, 10); x.lineTo((cw * i) / 16, ch - 10); x.stroke(); }
      for (let i = 1; i < 9; i++) { x.beginPath(); x.moveTo(10, (ch * i) / 9); x.lineTo(cw - 10, (ch * i) / 9); x.stroke(); }
      x.strokeStyle = 'rgba(255,255,255,.8)'; x.lineWidth = 4; x.beginPath(); x.moveTo(20, ch / 2); x.lineTo(cw - 20, ch / 2); x.moveTo(cw * 0.08, 20); x.lineTo(cw * 0.08, ch - 20); x.stroke();
      x.shadowColor = '#ffae4a'; x.shadowBlur = 12; x.strokeStyle = '#ffae4a'; x.lineWidth = 6; rrect(x, 6, 6, cw - 12, ch - 12, 20); x.stroke();
      txt(x, 'y = sin(x − t)', ch * 0.075, 700, '#ffd8a0', cw * 0.12, ch * 0.1, 'left');
      txt(x, 'y = cos(2x − t) / 2', ch * 0.075, 700, '#9fe3ff', cw * 0.12, ch * 0.9, 'left');
    }, { alpha: true, double: true, ppu: 60 });
    board.position.y = y0; g.add(board);
    for (const x of [-w / 2 + 0.6 * s, w / 2 - 0.6 * s]) g.add(mesh(BOXG(), L('#2a3160', 0.1), x, 0, -0.2 * s, [0.4 * s, y0 - h / 2, 0.4 * s]));
    const n = 140, mkLine = (c) => { const geo = new T3.BufferGeometry(); geo.setAttribute('position', new T3.Float32BufferAttribute(new Float32Array(n * 3), 3)); const l = new T3.Line(geo, LN(c, 1)); l.position.set(0, y0, 0.05 * s); g.add(l); return geo; };
    const g1 = mkLine('#ffae4a'), g2 = mkLine('#5fd0ff');
    const dot = mesh(sphLo(), B('#fff'), 0, 0, 0.1 * s, 0.28 * s); g.add(dot); const dg = glow('#ffae4a', 2.6 * s, 0.9); g.add(dg);
    return [g, (t) => {
      const a1 = g1.attributes.position.array, a2 = g2.attributes.position.array;
      for (let i = 0; i < n; i++) {
        const u = i / (n - 1), x = (-0.42 + u * 0.88) * w, xx = u * 4 * Math.PI;
        a1[i * 3] = x; a1[i * 3 + 1] = Math.sin(xx - t * 1.6) * h * 0.33;
        a2[i * 3] = x; a2[i * 3 + 1] = Math.cos(2 * xx - t * 1.6) * h * 0.16;
      }
      g1.attributes.position.needsUpdate = g2.attributes.position.needsUpdate = true;
      const u = (t * 0.12) % 1, x = (-0.42 + u * 0.88) * w, yy = Math.sin(u * 4 * Math.PI - t * 1.6) * h * 0.33 + y0;
      dot.position.set(x, yy, 0.1 * s); dg.position.set(x, yy, 0.12 * s);
    }];
  }
  function spiral(s) {
    const g = new T3.Group(), d = new T3.Group(); d.position.y = 9 * s; g.add(d);
    const n = 150, im = new T3.InstancedMesh(sph(), new T3.MeshBasicMaterial({ color: '#fff' }), n);
    const m4 = new T3.Matrix4(), c = new T3.Color(), c1 = new T3.Color('#ffd166'), c2 = new T3.Color('#ff5fa2');
    for (let i = 0; i < n; i++) { const a = i * 2.39996, r = Math.sqrt(i) * 0.55 * s, sz = (0.12 + i / n * 0.3) * s; im.setMatrixAt(i, m4.makeScale(sz, sz, sz).setPosition(Math.cos(a) * r, Math.sin(a) * r, 0)); im.setColorAt(i, c.copy(c1).lerp(c2, i / n)); }
    d.add(im); d.add(glow('#ffae4a', 14 * s, 0.25));
    const lab = holo(6 * s, 1.3 * s, ZC.math, [['φ = 1.618… golden angle', 0.4, 700, '#fff3e0', 0.52]]); lab.position.y = 2.2 * s; g.add(lab);
    pedestal(g, 4 * s, ZC.math);
    return [g, (t) => { d.rotation.z = t * 0.25; d.rotation.y = Math.sin(t * 0.4) * 0.5; }];
  }
  const EQ = {
    phys: ['F = ma', 'E = mc²', 'v = u + at', '∮ B·dl = μ₀I', 'λ = h / p', 'F = kq₁q₂ / r²', 'τ = r × F', 'T = 2π√(l/g)'],
    chem: ['PV = nRT', 'pH = −log[H⁺]', 'ΔG = ΔH − TΔS', 'Nₐ = 6.022 × 10²³', 'k = A·e^(−Eₐ/RT)', 'E = E° − (0.059/n) log Q'],
    math: ['e^(iπ) + 1 = 0', '∫ eˣ dx = eˣ + C', 'a² + b² = c²', '∑ 1/n² = π²/6', 'd/dx sin x = cos x', 'sin²θ + cos²θ = 1', 'lim (1 + 1/n)ⁿ = e'],
  };
  function equation(text, zone, s) {
    const c = ZC[zone];
    const m = sign(9 * s, 2 * s, (x, cw, ch) => { x.shadowColor = c; x.shadowBlur = 26; txt(x, text, ch * 0.5, 800, '#ffffff', cw / 2, ch * 0.52); x.shadowBlur = 0; txt(x, text, ch * 0.5, 800, '#ffffff', cw / 2, ch * 0.52); }, { alpha: true, double: true, ppu: 80 });
    const g = new T3.Group(); g.add(m);
    const ph = text.length;
    return [g, (t) => { m.position.y = 6 * s + Math.sin(t * 0.9 + ph) * 0.5 * s; }];
  }

  // ======================= the world =======================
  function buildWorld(cfg) {
    if (world) { scene.remove(world); dispose(world); }
    world = new T3.Group(); scene.add(world);
    MC = {}; GC = {}; anims = []; plates = []; rc.o = [];
    N = Math.max(8, cfg.n); zE = kz(N);
    const R = rng(cfg.seed || 7);

    // ---- ground: dark glass with a neon grid tinted by realm ----
    const gt = document.createElement('canvas'); gt.width = gt.height = 128;
    const gx = gt.getContext('2d'); gx.fillStyle = TH.grid[0]; gx.fillRect(0, 0, 128, 128);
    gx.strokeStyle = TH.grid[1]; gx.lineWidth = 3; gx.strokeRect(0, 0, 128, 128);
    gx.strokeStyle = TH.grid[2]; gx.lineWidth = 1; gx.beginPath(); gx.moveTo(64, 0); gx.lineTo(64, 128); gx.moveTo(0, 64); gx.lineTo(128, 64); gx.stroke();
    const gtex = new T3.CanvasTexture(gt); gtex.wrapS = gtex.wrapT = T3.RepeatWrapping; gtex.anisotropy = maxAniso;
    const zA = 100, zB = zE - 200, GW = 560;
    gtex.repeat.set(GW / 8, (zA - zB) / 8);
    const gg = new T3.PlaneGeometry(GW, zA - zB, lowPower ? 70 : 100, Math.round((zA - zB) / (lowPower ? 6 : 4))).rotateX(-Math.PI / 2).translate(0, 0, (zA + zB) / 2);
    const gp = gg.attributes.position, gcol = new Float32Array(gp.count * 3), c = new T3.Color(), c2 = new T3.Color();
    const zt = { phys: new T3.Color(TH.zones[0]), chem: new T3.Color(TH.zones[1]), math: new T3.Color(TH.zones[2]) };
    for (let i = 0; i < gp.count; i++) {
      const x = gp.getX(i), z = gp.getZ(i), h = H(x, z); gp.setY(i, h);
      const k = -z / D;
      if (inCampus(x, z)) c.set(TH.campus);
      else {
        // blend realm tints across boundaries
        const a = sstep(N / 3 - 3, N / 3 + 3, k), b = sstep((2 * N) / 3 - 3, (2 * N) / 3 + 3, k);
        c.copy(zt.phys).lerp(zt.chem, a).lerp(zt.math, b);
      }
      c.multiplyScalar(lerp(TH.shade[0], TH.shade[1], sstep(0, 12, h)));
      gcol[i * 3] = c.r; gcol[i * 3 + 1] = c.g; gcol[i * 3 + 2] = c.b;
    }
    gg.setAttribute('color', new T3.BufferAttribute(gcol, 3)); gg.computeVertexNormals();
    world.add(new T3.Mesh(gg, TH.litGround ? new T3.MeshLambertMaterial({ vertexColors: true, map: gtex }) : new T3.MeshBasicMaterial({ vertexColors: true, map: gtex })));

    // ---- road: dark lane with glowing edges ----
    const rd = new Geo(), glowRoad = new Geo();
    const k0 = -12, k1 = N + 0.3, st = 0.06;
    function edge(k, o, y) { const [fx, fz] = fwd(k); return [roadX(k) - fz * o, y, kz(k) + fx * o]; }
    const strip = (G, o0, o1, y, color, ka, kb) => {
      const pts = [];
      for (let k = ka; k < kb - 1e-6; k += st) {
        const kk = Math.min(kb, k + st);
        const a = edge(k, o0, y), b = edge(k, o1, y), cc = edge(kk, o0, y), d = edge(kk, o1, y);
        pts.push(...a, ...cc, ...b, ...b, ...cc, ...d);
      }
      G.quad(pts, color);
    };
    strip(rd, -RW - 1.2, RW + 1.2, 0.06, TH.path, k0, k1);
    strip(rd, -RW, RW, 0.09, TH.lane, k0, k1);
    for (const [o, col] of [[-RW - 1.2, TH.edge], [RW + 1.05, TH.edge], [-RW + 0.1, TH.inner], [RW - 0.25, TH.inner]]) strip(glowRoad, o, o + 0.15, 0.12, col, k0, k1);
    for (let k = k0 + 0.2; k < N - 0.6; k += 0.62) { if (Math.abs(k - Math.round(k)) < 0.22) continue; strip(glowRoad, -0.09, 0.09, 0.12, '#e8eaff', k, k + 0.3); }
    strip(glowRoad, -RW, RW, 0.125, '#ffffff', -0.62, -0.55);
    world.add(rd.mesh(new T3.MeshBasicMaterial({ vertexColors: true, side: T3.DoubleSide })));
    world.add(glowRoad.mesh(new T3.MeshBasicMaterial({ vertexColors: true, side: T3.DoubleSide })));

    // ---- day pads: glowing discs coloured by status ----
    pads = new T3.InstancedMesh(new T3.CylinderGeometry(1.05, 1.1, 0.12, 28), new T3.MeshBasicMaterial({ color: '#ffffff' }), N + 1);
    const m4 = new T3.Matrix4();
    for (let i = 0; i <= N; i++) { m4.makeTranslation(roadX(i), 0.15, kz(i)); pads.setMatrixAt(i, m4); pads.setColorAt(i, c.set('#ffffff')); }
    world.add(pads);

    // ---- the traveller: a little hover pod at today ----
    car = new T3.Group();
    car.add(mesh(sph(), L('#e9ecff', 0.25), 0, 1.0, 0, [0.95, 0.55, 1.7]));
    car.add(mesh(sph(), new T3.MeshLambertMaterial({ color: '#4fb3ff', emissive: '#1b4f9a', transparent: true, opacity: 0.8 }), 0, 1.35, 0.25, [0.7, 0.42, 0.9]));
    const cr = mesh(GC.ring || (GC.ring = new T3.TorusGeometry(1, 0.04, 6, 48)), B('#7fd3ff'), 0, 0.55, 0, [1.1, 1.6, 1]); cr.rotation.x = Math.PI / 2; car.add(cr);
    const cg = glow('#7fd3ff', 4, 0.8); cg.position.y = 0.35; car.add(cg);
    world.add(car);
    carAnim = anim(car, (t) => { car.children[0].position.y = 1.0 + Math.sin(t * 2.2) * 0.12; car.children[1].position.y = 1.35 + Math.sin(t * 2.2) * 0.12; });

    // ---- realm simulations along both sides of the road ----
    const kinds = {
      phys: [solar, gears, cradle, magnet, emwave, pendulum],
      chem: [molecule, bohr, dna, flasks, lattice, reaction],
      math: [poly, surface, graph, spiral, poly],
    };
    const cnt = { phys: 0, chem: 0, math: 0 }, eqc = { phys: 0, chem: 0, math: 0 };
    let side = 1, pi = 0;
    const place = (build, k, sd, off, s, far) => {
      const [fx, fz] = fwd(k), o = off * sd;
      const x = roadX(k) - fz * o, z = kz(k) + fx * o;
      const [g, fn] = build;
      g.position.set(x, H(x, z), z);
      // face the approaching traveller
      const tk = k - 2.2, tx = roadX(tk), tz = kz(tk);
      g.rotation.y = Math.atan2(tx - x, tz - z);
      world.add(g); anim(g, fn, far);
    };
    const step = lowPower ? 2.4 : 1.8;
    for (let k = 0.55; k < N - 5.6; k += step) {
      const zn = zoneOf(k), list = kinds[zn], fnb = list[cnt[zn]++ % list.length];
      const s = 0.85 + R() * 0.3;
      place(fnb === poly ? poly(s, R, pi++) : fnb(s, R), k, side, 17 + R() * 7, s);
      side = -side;
      if (R() < 0.75) { const ez = EQ[zn]; place(equation(ez[eqc[zn]++ % ez.length], zn, 1), k + step / 2, -side, 9.5 + R() * 2, 1); }
    }
    // giant landmarks further out, one realm feel per stretch
    const giants = { phys: [solar, pendulum, gears], chem: [dna, bohr, molecule], math: [poly, spiral, surface] };
    for (let k = 3; k < N - 8; k += lowPower ? 9 : 6) {
      const zn = zoneOf(k), list = giants[zn], fnb = list[(R() * list.length) | 0], s = 2.6 + R() * 1.4;
      place(fnb === poly ? poly(s, R, pi++) : fnb(s, R), k, R() < 0.5 ? -1 : 1, 55 + R() * 40, s, true);
    }
    // giant planets hanging in the sky
    [[-260, 140, kz(N * 0.12), 38, '#5a7bff', true], [300, 110, kz(N * 0.45), 26, '#ff8a5c', false], [-240, 170, kz(N * 0.8), 46, '#c98bff', true]].forEach(([x, y, z, r, col, rg]) => {
      const p = new T3.Group(); p.position.set(x, y, z);
      p.add(mesh(sph(), new T3.MeshLambertMaterial({ color: col, emissive: col, emissiveIntensity: 0.35, fog: false }), 0, 0, 0, r));
      if (rg) { const ring = mesh(new T3.RingGeometry(r * 1.4, r * 2.2, 64), new T3.MeshBasicMaterial({ color: '#e9dcff', side: T3.DoubleSide, transparent: true, opacity: 0.45, fog: false }), 0, 0, 0); ring.rotation.x = 1.25; p.add(ring); }
      const gl = glow(col, r * 5, 0.35); gl.material.fog = false; p.add(gl);
      world.add(p); anim(p, (t) => { p.rotation.y = t * 0.03; }, true);
    });

    // ---- realm portals + month holo-signs ----
    const portal = (k, zn, title, sub) => {
      const [fx, fz] = fwd(k), g = new T3.Group(); g.position.set(roadX(k), 0, kz(k)); g.rotation.y = Math.atan2(fx, fz);
      const col = ZC[zn];
      const ring = mesh(new T3.TorusGeometry(8.6, 0.32, 10, 80), B(col), 0, 2.6, 0); g.add(ring);
      const ring2 = mesh(new T3.TorusGeometry(7.8, 0.08, 4, 80, Math.PI * 1.4), B('#ffffff', 0.7), 0, 2.6, 0); g.add(ring2);
      for (let i = 0; i < 6; i++) { const o = glow(col, 2.2, 0.9); g.add(o); o.userData.a = (i / 6) * Math.PI * 2; }
      const s = holo(13, 2.6, col, [[title, 0.36, 800, '#ffffff', 0.4, 6], [sub, 0.17, 500, 'rgba(255,255,255,.85)', 0.74]]); s.position.y = 13.4; s.rotation.y = Math.PI; g.add(s);
      world.add(g);
      anim(g, (t) => { ring2.rotation.z = t * 0.6; g.children.forEach((o) => { if (o.userData.a != null) { const a = o.userData.a + t * 0.8; o.position.set(Math.cos(a) * 8.6, 2.6 + Math.sin(a) * 8.6, 0); } }); });
    };
    const startSub = cfg.start ? cfg.start.sub : 'Day 1';
    portal(-0.75, 'phys', 'PHYSICS REALM', startSub);
    portal(N / 3, 'chem', 'CHEMISTRY REALM', 'Atoms · Molecules · Reactions');
    portal((2 * N) / 3, 'math', 'MATHEMATICS REALM', 'Geometry · Calculus · Algebra');
    (cfg.months || []).forEach((m) => {
      const k = m.i - 0.5, [fx, fz] = fwd(k), o = RW + 3.6, zn = zoneOf(k);
      const s = holo(5.6, 2.2, ZC[zn], [[m.title, 0.3, 800, '#ffffff', 0.4, 4], [m.sub, 0.16, 500, 'rgba(255,255,255,.85)', 0.72]]);
      s.position.set(roadX(k) - fz * o, 3.6, kz(k) + fx * o); s.rotation.y = Math.atan2(fx, fz) + Math.PI; world.add(s);
      world.add(mesh(cylC(), B(ZC[zn], 0.6), s.position.x, 1.25, s.position.z, [0.08, 2.5, 0.08]));
    });

    buildGate(cfg, R);
  }

  // ---------- NIT Tiruchirappalli: the exam happens at the main gate, watched by three guards ----------
  function buildGate(cfg, R) {
    const Z = (zl) => zE + zl;
    const sc = new Geo(), lit = new Geo(); // lit (Lambert) + glowing (Basic) static parts
    const cream = '#e9dfca', brick = '#a64c36';
    const add = (G, base, col, x, y, zl, sx, sy, sz, ry, rx, rz) => G.add(base, col, x, y, Z(zl), sx, sy, sz, ry, rx, rz);

    // exam plaza in front of the gate
    add(sc, BOX, TH.plaza, 0, 0, 6, 58, 0.1, 30);
    for (const sd of [-1, 1]) add(lit, BOX, '#7fd3ff', sd * 29, 0.1, 6, 0.2, 0.05, 30);
    add(lit, BOX, '#7fd3ff', 0, 0.1, 21, 58, 0.05, 0.2);

    // ---- main gate ----
    const zg = -7.5, PX = 9.6;
    for (const sd of [-1, 1]) {
      add(sc, BOX, cream, sd * PX, 0, zg, 3, 12, 3); add(sc, BOX, brick, sd * PX, 0, zg, 3.3, 1.8, 3.3); add(sc, BOX, brick, sd * PX, 12, zg, 3.4, 0.7, 3.4);
      // the three subject colours run up the pillars
      ['#4fb3ff', '#3fe39a', '#ffae4a'].forEach((c, i) => add(lit, BOX, c, sd * (PX + (i - 1) * 0.8), 2, zg + 1.52, 0.22, 9.4, 0.06));
      // walls
      add(sc, BOX, brick, sd * 53, 0, zg, 84, 2.8, 0.9); add(sc, BOX, cream, sd * 53, 2.8, zg, 84.4, 0.4, 1.2);
      add(lit, BOX, '#7fd3ff', sd * 53, 3.25, zg + 0.62, 84, 0.08, 0.06);
      add(sc, BOX, brick, sd * 95, 0, zg - 60, 0.9, 2.8, 120); add(sc, BOX, cream, sd * 95, 2.8, zg - 60, 1.2, 0.4, 120.4);
      for (let x = 14; x < 95; x += 7) add(sc, BOX, cream, sd * x, 0, zg, 1.2, 3.4, 1.3);
    }
    add(sc, BOX, cream, 0, 8.8, zg, 2 * PX + 3.6, 3.4, 1.8); add(sc, BOX, brick, 0, 12.2, zg, 2 * PX + 4, 0.5, 2.1);
    const gate = sign(2 * PX - 1.6, 2.9, (x, w, h) => {
      x.fillStyle = '#6e1f1a'; x.fillRect(0, 0, w, h);
      x.strokeStyle = '#d9b46a'; x.lineWidth = 6; x.strokeRect(10, 10, w - 20, h - 20);
      txt(x, cfg.gateTop || 'राष्ट्रीय प्रौद्योगिकी संस्थान तिरुचिरापल्ली', h * 0.15, 600, '#f3dfae', w / 2, h * 0.24);
      txt(x, cfg.gateMain || 'NATIONAL INSTITUTE OF TECHNOLOGY', h * 0.22, 800, '#ffffff', w / 2, h * 0.5, 'center', 4);
      txt(x, cfg.gateSub || 'TIRUCHIRAPPALLI', h * 0.17, 700, '#f3dfae', w / 2, h * 0.77, 'center', 12);
    }, { ppu: 110 });
    gate.position.set(0, 10.5, Z(zg + 0.92)); world.add(gate); rc.o.push(gate);
    // holographic exam banner floating above the gate
    const bn = cfg.banner || ['JEE MAIN 2027', 'EXAMINATION CENTRE', ''];
    const banner = holo(14, 2.6, '#ffffff', [[bn[0], 0.56, 900, '#ffffff', 0.54, 8]]);
    banner.position.set(0, 16.2, Z(zg)); world.add(banner);
    anim(banner, (t) => { banner.position.y = 16.2 + Math.sin(t * 1.1) * 0.3; });

    // ---- open-air CBT exam hall at the gate: desks + glowing screens + candidates ----
    const screens = new Geo();
    for (const sd of [-1, 1]) {
      for (let r = 0; r < 3; r++) for (let cI = 0; cI < 4; cI++) {
        const x = sd * (13 + cI * 3.3), zl = 0 + r * 4;
        add(sc, BOX, '#cfd6ee', x, 0.95, zl, 2.6, 0.12, 1.3); add(sc, BOX, '#5a6380', x - 1.1, 0, zl, 0.12, 0.95, 1.1); add(sc, BOX, '#5a6380', x + 1.1, 0, zl, 0.12, 0.95, 1.1);
        add(sc, BOX, '#20263f', x, 1.07, zl - 0.4, 1.3, 0.85, 0.08); add(screens, BOX, '#8fe3ff', x, 1.14, zl - 0.35, 1.15, 0.7, 0.02);
        add(sc, BOX, '#3c4366', x, 0, zl + 1.2, 0.9, 0.55, 0.9); add(sc, BOX, '#3c4366', x, 0.55, zl + 1.62, 0.9, 0.9, 0.12);
        // seated candidate
        const tee = ['#f1f1f1', '#4a7bd1', '#c0563f', '#3c9a6e', '#e3b23c', '#7a5cc4'][(R() * 6) | 0];
        add(sc, CYL6, tee, x, 0.6, zl + 1.15, 0.62, 0.8, 0.44); add(sc, BOX, '#a8714f', x, 1.45, zl + 1.12, 0.36, 0.42, 0.36); add(sc, BOX, '#1e1b19', x, 1.82, zl + 1.14, 0.4, 0.14, 0.4);
      }
      // canopy
      for (const [x, zl] of [[13 - 2, -1.4], [13 + 3 * 3.3 + 2, -1.4], [13 - 2, 10.4], [13 + 3 * 3.3 + 2, 10.4]]) add(lit, BOX, '#c9b8ff', sd * x, 0, zl, 0.16, 4.6, 0.16);
      add(lit, BOX, '#c9b8ff', sd * (13 + 4.95), 4.55, -1.6, 15.4, 0.08, 0.08); add(lit, BOX, '#c9b8ff', sd * (13 + 4.95), 4.55, 10.6, 15.4, 0.08, 0.08);
      const hs = holo(7.2, 1.5, '#c9b8ff', [[sd < 0 ? 'EXAM HALL A · GATE 1' : 'EXAM HALL B · GATE 1', 0.36, 800, '#ffffff', 0.5, 4]]);
      hs.position.set(sd * (13 + 4.95), 6.2, Z(10.7)); hs.rotation.y = Math.PI; world.add(hs);
      const hs2 = holo(7.2, 1.5, '#c9b8ff', [[sd < 0 ? 'EXAM HALL A · GATE 1' : 'EXAM HALL B · GATE 1', 0.36, 800, '#ffffff', 0.5, 4]]);
      hs2.position.set(sd * (13 + 4.95), 6.2, Z(10.75)); world.add(hs2);
    }
    world.add(screens.mesh(new T3.MeshBasicMaterial({ vertexColors: true })));

    // ---- the campus behind the gate: examination building as a lit backdrop ----
    const BZ = -40, FH = 14;
    const bz = (zl) => BZ + zl;
    add(sc, BOX, cream, 0, 0, bz(-16), 44, FH, 16);
    for (const y of [4.6, 9.2, FH - 0.6, 0]) add(sc, BOX, brick, 0, y, bz(-16), 44.4, y ? 0.6 : 0.9, 16.4);
    for (const fy of [0, 4.6, 9.2]) for (let x = -20.2; x <= 20.3; x += 2.75) { if (Math.abs(x) < 8) continue; add(lit, BOX, R() < 0.7 ? '#ffd98a' : '#8fb4ff', x, fy + 1.55, bz(-7.97), 1.55, 2.3, 0.1); }
    for (const sd of [-1, 1]) {
      const cx = sd * 28;
      add(sc, BOX, cream, cx, 0, bz(-9), 12, FH, 30);
      for (const y of [4.6, 9.2, FH - 0.6, 0]) add(sc, BOX, brick, cx, y, bz(-9), 12.4, y ? 0.6 : 0.9, 30.4);
      for (const fy of [0, 4.6, 9.2]) { for (let zl = 3.4; zl > -22; zl -= 2.9) add(lit, BOX, R() < 0.7 ? '#ffd98a' : '#8fb4ff', cx - sd * 6.01, fy + 1.55, bz(zl), 0.1, 2.3, 1.6); for (let x = -4; x <= 4; x += 2.7) add(lit, BOX, '#ffd98a', cx + x, fy + 1.55, bz(6.02), 1.6, 2.3, 0.1); }
    }
    add(sc, BOX, '#f3ead6', 0, 0, bz(-14.5), 14, 21, 18); add(sc, BOX, brick, 0, 20.4, bz(-14.5), 14.5, 1, 18.5);
    for (const x of [-6.3, -3.8, -1.3, 1.3, 3.8, 6.3]) add(sc, CYL, '#fbf8f1', x, 0.9, bz(-2.2), 0.85, 7.7, 0.85);
    add(sc, BOX, '#e3ddd0', 0, 0, bz(-4), 17, 0.9, 7); add(sc, BOX, '#f7f2e6', 0, 8.6, bz(-4.2), 16, 2.3, 6.4); add(sc, BOX, brick, 0, 10.9, bz(-4.2), 16.2, 0.3, 6.6);
    add(lit, BOX, '#ffd896', 0, 0.9, bz(-5.5), 4.4, 4.6, 0.1);
    for (const x of [-4.6, -1.55, 1.55, 4.6]) add(lit, BOX, '#ffd98a', x, 12.2, bz(-5.48), 1.9, 2.6, 0.1);
    const name = sign(12.5, 1.9, (x, w, h) => { x.fillStyle = '#f7f2e6'; x.fillRect(0, 0, w, h); txt(x, cfg.tower || 'NIT TIRUCHIRAPPALLI', h * 0.46, 800, '#7a2a1d', w / 2, h * 0.4, 'center', 6); txt(x, cfg.towerSub || 'Examination Centre', h * 0.2, 600, '#5b5b60', w / 2, h * 0.8, 'center', 4); }, { ppu: 110 });
    name.position.set(0, 9.75, Z(bz(-0.98))); world.add(name);
    const clock = sign(3.4, 3.4, (x, w) => {
      x.fillStyle = '#fbf8f1'; x.beginPath(); x.arc(w / 2, w / 2, w * 0.48, 0, 7); x.fill(); x.strokeStyle = '#7a2a1d'; x.lineWidth = w * 0.04; x.stroke();
      x.lineCap = 'round'; x.strokeStyle = '#2b2b2e'; x.lineWidth = w * 0.035; x.beginPath(); x.moveTo(w / 2, w / 2); x.lineTo(w / 2, w * 0.24); x.stroke();
      x.lineWidth = w * 0.045; x.beginPath(); x.moveTo(w / 2, w / 2); x.lineTo(w * 0.68, w / 2); x.stroke();
    }, { alpha: true });
    clock.position.set(0, 17.4, Z(bz(-5.42))); world.add(clock);
    // flag
    add(sc, CYL, '#d0d3d8', -14, 0, -16, 0.26, 13, 0.26);
    const flag = sign(3.3, 2.2, (x, w, h) => { x.fillStyle = '#ff9933'; x.fillRect(0, 0, w, h / 3); x.fillStyle = '#fff'; x.fillRect(0, h / 3, w, h / 3); x.fillStyle = '#138808'; x.fillRect(0, (2 * h) / 3, w, h / 3); x.strokeStyle = '#000080'; x.lineWidth = 3; x.beginPath(); x.arc(w / 2, h / 2, h / 7.5, 0, 7); x.stroke(); }, { double: true });
    flag.position.set(-12.3, 11.6, Z(-16)); world.add(flag);
    anim(flag, (t) => { flag.rotation.y = 0.25 + Math.sin(t * 2) * 0.12; });
    // glowing campus lamps
    for (const sd of [-1, 1]) for (let zl = -12; zl > -34; zl -= 7) { add(sc, CYL6, '#6f757d', sd * 6, 0, zl, 0.2, 4.6, 0.2); add(lit, BOX, '#ffe3a3', sd * 6, 4.6, zl, 0.5, 0.35, 0.5); }

    world.add(sc.mesh(new T3.MeshLambertMaterial({ vertexColors: true })));
    world.add(lit.mesh(new T3.MeshBasicMaterial({ vertexColors: true })));

    // ---- the three subject guards at the gate ----
    const GD = cfg.checkpoints || [
      { name: 'Physics', glyph: 'Φ', color: ZC.phys, dark: '#1f4f8f' },
      { name: 'Chemistry', glyph: 'hex', color: ZC.chem, dark: '#17694a' },
      { name: 'Mathematics', glyph: '∑', color: ZC.math, dark: '#8a4a14' },
    ];
    GD.forEach((gd, i) => guard(gd, i, (i - 1) * 6.4, Z(-3.3), cfg));
  }

  function guard(gd, i, x, z, cfg) {
    const g = new T3.Group(); g.position.set(x, 0, z); world.add(g);
    const s = 2.0, col = gd.color, uni = gd.dark || '#223';
    pedestal(g, 2.3, col);
    const beam = mesh(new T3.CylinderGeometry(2.1, 2.3, 10, 24, 1, true), new T3.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.12, blending: T3.AdditiveBlending, depthWrite: false, side: T3.DoubleSide }), 0, 5.6, 0); g.add(beam);
    const body = new T3.Group(); body.position.y = 0.6; body.scale.setScalar(s); g.add(body);
    const skin = L('#a8714f', 0.15), dark = L('#1c2036', 0.1), U = L(uni, 0.22), glowM = B(col);
    // legs, boots
    for (const sx of [-0.2, 0.2]) { body.add(mesh(cylC(), dark, sx, 0.5, 0, [0.15, 1, 0.15])); body.add(mesh(BOXG(), L('#0e1020', 0.05), sx, 0, 0.05, [0.26, 0.16, 0.42])); }
    // torso + vest stripes + belt
    body.add(mesh(BOXG(), U, 0, 1.0, 0, [0.82, 1.05, 0.48]));
    body.add(mesh(BOXG(), glowM, 0, 1.35, 0.25, [0.84, 0.06, 0.02])); body.add(mesh(BOXG(), glowM, 0, 1.6, 0.25, [0.84, 0.06, 0.02]));
    body.add(mesh(BOXG(), L('#0e1020', 0.05), 0, 1.0, 0, [0.86, 0.1, 0.52]));
    const badge = glow(col, 0.55, 1); badge.position.set(-0.22, 1.82, 0.27); body.add(badge);
    // shoulders, arms
    for (const sd of [-1, 1]) { body.add(mesh(sph(), U, sd * 0.47, 1.95, 0, 0.17)); }
    const armL = new T3.Group(), armR = new T3.Group(); armL.position.set(-0.5, 1.95, 0); armR.position.set(0.5, 1.95, 0); body.add(armL); body.add(armR);
    for (const a of [armL, armR]) { a.add(mesh(cylC(), U, 0, -0.42, 0, [0.12, 0.84, 0.12])); a.add(mesh(sph(), skin, 0, -0.9, 0, 0.11)); }
    // head + cap with glowing visor
    const head = new T3.Group(); head.position.y = 2.32; body.add(head);
    head.add(mesh(sph(), skin, 0, 0, 0, [0.24, 0.27, 0.24]));
    head.add(mesh(cylC(), U, 0, 0.2, 0, [0.27, 0.14, 0.27]));
    head.add(mesh(BOXG(), glowM, 0, 0.13, 0.2, [0.46, 0.05, 0.22]));
    head.add(mesh(BOXG(), B('#0b0d18'), 0, 0.02, 0.22, [0.32, 0.07, 0.02])); // shades
    // subject-specific props and effects
    const fx = new T3.Group(); fx.position.y = 0.6 + 2.2 * s; g.add(fx);
    const orbit = [];
    if (i === 0) { // PHYSICS: planets + electric ring + magnet in hand
      armR.rotation.x = -0.9;
      const mg = new T3.Group(); mg.position.set(0, -0.95, 0.15); armR.add(mg);
      mg.add(mesh(BOXG(), L('#ff4b55', 0.4), 0.14, -0.08, 0, [0.28, 0.16, 0.16])); mg.add(mesh(BOXG(), L('#4f7dff', 0.4), -0.14, -0.08, 0, [0.28, 0.16, 0.16]));
      [['#ffd166', 0.32, 2.6, 1.2], ['#8fd3ff', 0.22, 3.2, -0.8], ['#ff8a5c', 0.26, 2.2, 1.7]].forEach(([c, r, rad, sp], j) => { const p = new T3.Group(); p.add(mesh(sph(), L(c, 0.5), 0, 0, 0, r)); p.add(glow(c, r * 6, 0.6)); fx.add(p); orbit.push({ p, rad, sp, ph: j * 2, tilt: 0.35 * (j - 1) }); });
      const ring = mesh(new T3.TorusGeometry(1.6, 0.05, 6, 64), B('#9fe3ff', 0.85), 0, -1.6, 0); ring.rotation.x = Math.PI / 2; g.add(ring); orbit.push({ ring, y0: 2.0 });
    } else if (i === 1) { // CHEMISTRY: glowing flask in hand + orbiting molecules + bubbles
      armR.rotation.x = -1.0;
      const fl = new T3.Group(); fl.position.set(0, -1.0, 0.2); fl.scale.setScalar(0.12); armR.add(fl);
      fl.add(new T3.Mesh(flaskGeo(1, false), GLASS('#cfe8ff'))); fl.add(new T3.Mesh(flaskGeo(1, true), B(col, 0.85)));
      const fg = glow(col, 1.6, 0.9); fg.position.set(0, -0.8, 0.4); armR.add(fg);
      ['H₂O', 'CO₂', 'CH₄'].forEach((nm, j) => { const m = molGroup(nm, 0.55); fx.add(m); orbit.push({ p: m, rad: 2.5 + j * 0.3, sp: 0.9 - j * 0.2, ph: j * 2.1, tilt: 0.3 * (j - 1), spin: true }); });
      for (let j = 0; j < 10; j++) { const b = mesh(sphLo(), new T3.MeshBasicMaterial({ color: '#bfffe2', transparent: true, opacity: 0.8, depthWrite: false }), 0, 0, 0, 0.09); g.add(b); orbit.push({ bub: b, ph: j / 10, x: (Math.random() - 0.5) * 3.2, zz: (Math.random() - 0.5) * 3.2 }); }
    } else { // MATHEMATICS: orbiting polyhedra + floating symbols + compass
      armR.rotation.x = -0.9;
      const tab = mesh(BOXG(), B('#ffe2b8', 0.9), 0, -1.15, 0.15, [0.5, 0.36, 0.04]); armR.add(tab);
      [[0, '#ffae4a'], [2, '#ffd166'], [3, '#ff7ab6']].forEach(([pi, c], j) => {
        const geo = POLYS[pi][1](); const m = new T3.Group();
        m.add(mesh(geo, new T3.MeshLambertMaterial({ color: c, emissive: c, emissiveIntensity: 0.4, transparent: true, opacity: 0.6 }), 0, 0, 0, 0.42));
        const e = new T3.LineSegments(new T3.EdgesGeometry(geo), LN('#fff3dc', 1)); e.scale.setScalar(0.43); m.add(e);
        fx.add(m); orbit.push({ p: m, rad: 2.6, sp: 0.8, ph: j * 2.09, tilt: 0.25 * (j - 1), spin: true });
      });
      ['π', '∫', '√', '∞'].forEach((sym, j) => {
        const sp = sign(1, 1, (x, w, h) => { x.shadowColor = col; x.shadowBlur = 16; txt(x, sym, h * 0.8, 800, '#fff4e0', w / 2, h * 0.55); }, { alpha: true, ppu: 96 });
        fx.add(sp); orbit.push({ p: sp, rad: 3.3, sp: -0.5, ph: j * 1.57, tilt: 0, sym: true });
      });
    }
    // name plate (hologram) with task counter
    const draw = (x, w, h) => {
      x.fillStyle = 'rgba(8,12,34,.8)'; rrect(x, 6, 6, w - 12, h - 12, 22); x.fill();
      x.shadowColor = col; x.shadowBlur = 20; x.strokeStyle = col; x.lineWidth = 6; rrect(x, 9, 9, w - 18, h - 18, 18); x.stroke(); x.shadowBlur = 0;
      const r = h * 0.3, cx = h * 0.52, cy = h * 0.5;
      x.fillStyle = col; x.beginPath(); x.arc(cx, cy, r, 0, 7); x.fill();
      if (gd.glyph === 'hex') {
        x.strokeStyle = '#0b1030'; x.lineWidth = h * 0.05; x.beginPath();
        for (let a = 0; a < 6; a++) { const t = (a / 6) * Math.PI * 2 + Math.PI / 6; x.lineTo(cx + Math.cos(t) * r * 0.58, cy + Math.sin(t) * r * 0.58); }
        x.closePath(); x.stroke(); x.beginPath(); x.arc(cx, cy, r * 0.3, 0, 7); x.lineWidth = h * 0.035; x.stroke();
      } else txt(x, gd.glyph, r * 1.2, 800, '#0b1030', cx, cy + r * 0.05);
      txt(x, `GUARD ${i + 1} · SECURITY`, h * 0.13, 700, 'rgba(255,255,255,.75)', h * 0.98, h * 0.26, 'left', 4);
      txt(x, gd.name.toUpperCase(), h * 0.33, 900, '#ffffff', h * 0.96, h * 0.55, 'left', 3);
      const n = plate.userData.n || 0;
      txt(x, `${n} ${gd.name === 'Mathematics' ? 'Maths' : gd.name} task${n === 1 ? '' : 's'} cleared`, h * 0.13, 500, col, h * 0.98, h * 0.82, 'left');
    };
    const plate = sign(5.4, 1.6, () => {}, { alpha: true, double: true, ppu: 110 });
    plate.userData.draw = draw; plate.userData.n = (cfg.checks && cfg.checks[i] && cfg.checks[i].n) || 0; plate.userData.redraw(draw);
    plate.position.set(0, 9.2, 0.3); g.add(plate); plates.push(plate); rc.o.push(plate);
    anim(g, (t) => {
      body.position.y = 0.6 + Math.sin(t * 1.6 + i) * 0.03;
      head.rotation.y = Math.sin(t * 0.5 + i * 1.3) * 0.35;
      armL.rotation.z = -0.08 - Math.sin(t * 1.6 + i) * 0.04;
      plate.position.y = 9.2 + Math.sin(t * 1.2 + i) * 0.12;
      beam.material.opacity = 0.1 + Math.sin(t * 2 + i) * 0.04;
      orbit.forEach((o) => {
        if (o.ring) { o.ring.position.y = o.y0 + Math.sin(t * 2) * 1.6; o.ring.scale.setScalar(1 + Math.sin(t * 4) * 0.05); return; }
        if (o.bub) { const u = (t * 0.35 + o.ph) % 1; o.bub.position.set(o.x, 0.8 + u * 6, o.zz); o.bub.material.opacity = 0.8 * (1 - u); return; }
        const a = o.ph + t * o.sp;
        o.p.position.set(Math.cos(a) * o.rad, Math.sin(a * 1.3) * 0.5 + Math.sin(a) * o.tilt * o.rad, Math.sin(a) * o.rad);
        if (o.spin) { o.p.rotation.x = t; o.p.rotation.y = t * 1.3; }
      });
    });
  }
})();
