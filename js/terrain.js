/* ============================================================
   Throne of Ranks — procedural 3D-style war-map terrain
   Dark sea, olive land with province borders, pine forests,
   snow-capped mountains, rivers + bridges, castles, villages.
   Deterministic: the same journey always draws the same land.
   ============================================================ */
(function () {
  const JQ = (window.JQ = window.JQ || {});

  function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  const wave = (y, p) => Math.sin(y * 0.0042 + p[0]) * 0.5 + Math.sin(y * 0.0107 + p[1]) * 0.32 + Math.sin(y * 0.031 + p[2]) * 0.18;
  const f1 = (n) => n.toFixed(1);

  const TH = {
    jee: {
      sea: '#0b151b', shelf: '#1a2d35', coast: 'rgba(230,215,170,.55)',
      land: ['#5f5a3b', '#4f5436', '#5a553c', '#665840', '#465032', '#3e2a21'], top: '#1e0f0c',
      cells: 'rgba(245,230,185,.09)', river: '#132630', riverEdge: '#2b4652', lava: '#ff6a1f',
      tree: ['#1a2618', '#2c3b25', '#3c5132'], snowTree: false,
      mLit: '#8a7a5a', mDark: '#372f24', snow: '#ece9e0', bridge: '#8a7f6c',
      heavyMtn: [2, 3, 5], heavyForest: [1, 4], snowFrom: 2, banner: '#8e1b1b', window: '#ffb347',
    },
    boards: {
      sea: '#0a131b', shelf: '#1a2a37', coast: 'rgba(255,255,255,.6)',
      land: ['#b9c5cc', '#adbbc4', '#a1b1bc', '#96a8b5', '#8b9fae', '#8197a8'], top: '#3a4f63',
      cells: 'rgba(30,50,70,.13)', river: '#dbe8ef', riverEdge: '#88a9bf', lava: null,
      tree: ['#1b302f', '#284343', '#3a5a58'], snowTree: true,
      mLit: '#eef2f5', mDark: '#7b92a5', snow: '#ffffff', bridge: '#6b7c8c',
      heavyMtn: [3, 4, 5], heavyForest: [0, 2], snowFrom: 0, banner: '#2c4a6e', window: '#ffd27a',
    },
  };

  function pineSymbol(t) {
    let s = `<symbol id="t-pine" viewBox="0 0 10 17"><ellipse cx="5.4" cy="15.6" rx="4" ry="1" fill="rgba(0,0,0,.45)"/><rect x="4.4" y="13" width="1.2" height="2.6" fill="#24180f"/>`;
    s += `<path d="M5 0 L9.6 13.4 H0.4Z" fill="${t.tree[1]}"/><path d="M5 0 L9.6 13.4 H5.2Z" fill="${t.tree[0]}"/><path d="M5 0 L2.2 8.5 L3.6 8 L1.2 13.4 H3Z" fill="${t.tree[2]}" opacity=".7"/>`;
    if (t.snowTree) s += `<path d="M5 0 L6.8 5.2 Q5 4.3 3.2 5.2Z M3.6 8.2 Q5 7.4 6.8 8.4 L6.4 7.2 Q5 6.6 3.9 7.3Z" fill="#fff"/>`;
    return s + '</symbol>';
  }
  const deadSymbol = `<symbol id="t-dead" viewBox="0 0 10 16"><ellipse cx="5" cy="15.4" rx="3" ry=".8" fill="rgba(0,0,0,.45)"/><path d="M5 15 V5 M5 9 L2 6 M5 7 L8 4 M2 6 L1.4 3.6 M8 4 L9 2.6 M5 5 L4.4 1.6" stroke="#1a100c" stroke-width="1.1" stroke-linecap="round" fill="none"/></symbol>`;

  function mountain(x, y, w, h, t, snow, volcanic, r) {
    const ax = x + (r() - 0.5) * w * 0.2, ay = y - h;
    const mid = ax + w * 0.06;
    let s = `<ellipse cx="${f1(x + w * 0.1)}" cy="${f1(y)}" rx="${f1(w * 0.56)}" ry="${f1(w * 0.1)}" fill="rgba(0,0,0,.4)"/>`;
    s += `<path d="M${f1(x - w / 2)} ${f1(y)} L${f1(ax)} ${f1(ay)} L${f1(mid)} ${f1(y)}Z" fill="${volcanic ? '#4a3028' : t.mLit}"/>`;
    s += `<path d="M${f1(ax)} ${f1(ay)} L${f1(x + w / 2)} ${f1(y)} L${f1(mid)} ${f1(y)}Z" fill="${volcanic ? '#1e1210' : t.mDark}"/>`;
    s += `<path d="M${f1(ax)} ${f1(ay)} L${f1(ax - w * 0.12)} ${f1(ay + h * 0.42)} M${f1(ax)} ${f1(ay)} L${f1(ax + w * 0.18)} ${f1(ay + h * 0.5)}" stroke="rgba(0,0,0,.18)" stroke-width="1"/>`;
    if (volcanic) {
      s += `<path class="t-lava" d="M${f1(ax - w * 0.06)} ${f1(ay + 2)} L${f1(ax)} ${f1(ay + h * 0.35)} L${f1(ax + w * 0.05)} ${f1(ay + 3)}" stroke="#ff7a2a" stroke-width="1.8" fill="none"/>`;
      s += `<circle class="t-lava" cx="${f1(ax)}" cy="${f1(ay)}" r="${f1(w * 0.12)}" fill="#ff6a1f" opacity=".35"/>`;
    } else if (snow) {
      s += `<path d="M${f1(ax)} ${f1(ay)} L${f1(ax - w * 0.17)} ${f1(ay + h * 0.32)} L${f1(ax - w * 0.06)} ${f1(ay + h * 0.27)} L${f1(ax + w * 0.02)} ${f1(ay + h * 0.36)} L${f1(ax + w * 0.1)} ${f1(ay + h * 0.26)} L${f1(ax + w * 0.16)} ${f1(ay + h * 0.3)}Z" fill="${t.snow}"/>`;
      s += `<path d="M${f1(ax)} ${f1(ay)} L${f1(ax + w * 0.1)} ${f1(ay + h * 0.26)} L${f1(ax + w * 0.16)} ${f1(ay + h * 0.3)}Z" fill="rgba(120,140,160,.45)"/>`;
    }
    return s;
  }

  function castle(x, y, sz, t, kind) {
    const k = sz / 40;
    const stone = kind === 'boards' ? ['#9aa9b6', '#5c6c7a'] : ['#7d7263', '#3e372f'];
    let s = `<g transform="translate(${f1(x)} ${f1(y)}) scale(${k.toFixed(2)})">`;
    s += `<ellipse cx="2" cy="0" rx="26" ry="5" fill="rgba(0,0,0,.45)"/>`;
    s += `<path d="M-18 0 V-16 L-14 -18 V-16 H14 V-18 L18 -16 V0Z" fill="${stone[1]}"/><rect x="-18" y="-16" width="20" height="16" fill="${stone[0]}"/>`;
    s += `<path d="M-18 -16 v-3 h4 v3 h4 v-3 h4 v3 h4 v-3 h4 v3 h4 v-3 h4 v3 h4 v-3 h4 v3" fill="none" stroke="${stone[1]}" stroke-width="2"/>`;
    s += `<rect x="-8" y="-34" width="14" height="34" fill="${stone[0]}"/><rect x="0" y="-34" width="6" height="34" fill="${stone[1]}"/>`;
    s += `<path d="M-8 -34 v-3 h3 v3 h3 v-3 h3 v3 h3 v-3 h2 v3" fill="none" stroke="${stone[1]}" stroke-width="1.6"/>`;
    s += `<path d="M-4 0 v-6 a3 3 0 0 1 6 0 v6Z" fill="#120c08"/>`;
    s += `<rect class="t-win" x="-4" y="-26" width="2.4" height="3.6" fill="${t.window}"/><rect class="t-win" x="-12" y="-10" width="2" height="3" fill="${t.window}"/><rect class="t-win" x="8" y="-11" width="2" height="3" fill="${t.window}"/>`;
    // banner pole + cloth
    s += `<path d="M-1 -34 V-58" stroke="#2a1d12" stroke-width="1.4"/><path class="t-flag" d="M-1 -57 H13 V-43 L6 -46 L-1 -43Z" fill="${t.banner}" stroke="rgba(0,0,0,.4)" stroke-width=".6"/>`;
    s += `<g transform="translate(6 -51) scale(.24)" fill="${kind === 'boards' ? '#e6f3fb' : '#f2c25a'}" stroke="${kind === 'boards' ? '#e6f3fb' : '#f2c25a'}">${JQ.PAL[kind].emblem}</g>`;
    return s + '</g>';
  }

  function village(x, y, t, r) {
    let s = '';
    const n = 3 + Math.floor(r() * 3);
    for (let k = 0; k < n; k++) {
      const hx = x + (r() - 0.5) * 34, hy = y + (r() - 0.5) * 18, w = 7 + r() * 4;
      s += `<g transform="translate(${f1(hx)} ${f1(hy)})"><ellipse cx="1" cy="0" rx="${f1(w * 0.7)}" ry="1.6" fill="rgba(0,0,0,.4)"/><rect x="${f1(-w / 2)}" y="-6" width="${f1(w)}" height="6" fill="#6e604c"/><path d="M${f1(-w / 2 - 1)} -6 L0 -11 L${f1(w / 2 + 1)} -6Z" fill="${t.snowTree ? '#e9eef2' : '#3a2c1e'}"/><rect class="t-win" x="-1" y="-4" width="2" height="2" fill="${t.window}"/></g>`;
    }
    return s;
  }

  /**
   * @param {{kind:string,W:number,H:number,TOP:number,SP:number,pts:{x:number,y:number}[],days:any[],total:number,zones:any[]}} o
   */
  JQ.terrainSVG = function (o) {
    const { kind, W, H, TOP, SP, pts, days, total, zones } = o;
    const t = TH[kind] || TH.jee;
    const R = rng(kind === 'jee' ? 1337 : 4242);
    const ph = [R() * 6, R() * 6, R() * 6], ph2 = [R() * 6, R() * 6, R() * 6];
    const edge = Math.max(10, W * 0.045);
    const cL = (y) => edge + edge * wave(y, ph);
    const cR = (y) => W - edge - edge * wave(y, ph2);
    const zc = zones.length;
    const ashZone = kind === 'jee' ? zc - 1 : -1;

    // ---- land polygon + zone gradient ----
    const L = [], Rr = [];
    for (let y = -20; y <= H + 40; y += 30) { L.push([cL(y), y]); Rr.push([cR(y), y]); }
    const poly = (off) => L.map((p) => `${f1(p[0] - off)},${p[1]}`).join(' ') + ' ' + Rr.slice().reverse().map((p) => `${f1(p[0] + off)},${p[1]}`).join(' ');
    const stops = [[0, t.top], [Math.max(0, (TOP - 60) / H), t.top]];
    for (let k = zc - 1; k >= 0; k--) {
      const c = Math.min(total, Math.round(((k + 0.5) * (total + 1)) / zc));
      stops.push([pts[c].y / H, t.land[k] || t.land[t.land.length - 1]]);
    }
    stops.push([1, t.land[0]]);
    stops.sort((a, b) => a[0] - b[0]);

    // province borders tile
    const C = rng(77);
    let cells = '';
    const g = [];
    for (let gy = 0; gy <= 4; gy++) { g[gy] = []; for (let gx = 0; gx <= 4; gx++) g[gy][gx] = [gx * 55 + (gx % 4 ? (C() - 0.5) * 30 : 0), gy * 45 + (gy % 4 ? (C() - 0.5) * 24 : 0)]; }
    for (let gy = 0; gy <= 4; gy++) for (let gx = 0; gx <= 4; gx++) {
      const p = g[gy][gx];
      if (gx < 4 && C() > 0.25) cells += `M${f1(p[0])} ${f1(p[1])} L${f1(g[gy][gx + 1][0])} ${f1(g[gy][gx + 1][1])} `;
      if (gy < 4 && C() > 0.25) cells += `M${f1(p[0])} ${f1(p[1])} L${f1(g[gy + 1][gx][0])} ${f1(g[gy + 1][gx][1])} `;
    }

    let defs = `<defs>
      <linearGradient id="t-land" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="0" y2="${H}">${stops.map((s) => `<stop offset="${s[0].toFixed(4)}" stop-color="${s[1]}"/>`).join('')}</linearGradient>
      <pattern id="t-cells" width="220" height="180" patternUnits="userSpaceOnUse"><path d="${cells}" stroke="${t.cells}" stroke-width="1.4" fill="none"/></pattern>
      <radialGradient id="t-shade" cx=".5" cy=".5" r=".7"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".35"/></radialGradient>
      ${pineSymbol(t)}${deadSymbol}
    </defs>`;

    let base = `<rect width="${W}" height="${H}" fill="${t.sea}"/>`;
    // sea ripples
    for (let y = 40; y < H; y += 70) {
      const xl = cL(y) - 12;
      if (xl > 14) base += `<path d="M4 ${y} q${f1(xl / 4)} -4 ${f1(xl / 2)} 0 t${f1(xl / 2)} 0" stroke="rgba(255,255,255,.05)" stroke-width="1" fill="none"/>`;
      const xr = cR(y) + 12;
      if (W - xr > 14) base += `<path d="M${f1(xr)} ${y + 30} q${f1((W - xr) / 4)} -4 ${f1((W - xr) / 2)} 0 t${f1((W - xr) / 2)} 0" stroke="rgba(255,255,255,.05)" stroke-width="1" fill="none"/>`;
    }
    base += `<polygon points="${poly(9)}" fill="${t.shelf}"/>`;
    base += `<polygon points="${poly(0)}" fill="url(#t-land)" stroke="${t.coast}" stroke-width="1.6"/>`;
    base += `<polygon points="${poly(0)}" fill="url(#t-cells)"/>`;

    // ---- rivers + bridges ----
    const rivers = [];
    const nR = Math.max(3, Math.floor(total / 12));
    let water = '';
    for (let r = 1; r <= nR; r++) {
      const i = Math.round((r * total) / (nR + 1));
      if (i >= total - 2 || i < 1) continue;
      const a = pts[i], b = pts[i + 1];
      const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
      const amp = 18 + R() * 14, fr = 0.014 + R() * 0.01;
      const ry = (x) => my + amp * Math.sin((x - mx) * fr) + 8 * Math.sin((x - mx) * 0.045);
      rivers.push(ry);
      let d = '';
      for (let x = -10; x <= W + 10; x += 14) d += (d ? ' L' : 'M') + f1(x) + ' ' + f1(ry(x));
      const lava = t.lava && days[i].zone === ashZone;
      water += `<path d="${d}" stroke="${lava ? '#5a1608' : t.riverEdge}" stroke-width="${lava ? 15 : 17}" fill="none" stroke-linecap="round"/>`;
      water += `<path class="${lava ? 't-lava' : ''}" d="${d}" stroke="${lava ? t.lava : t.river}" stroke-width="${lava ? 7 : 10}" fill="none" stroke-linecap="round"/>`;
      if (!lava) water += `<path d="${d}" stroke="rgba(255,255,255,${kind === 'boards' ? '.5' : '.08'})" stroke-width="1.4" stroke-dasharray="8 22" fill="none"/>`;
      const ang = (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
      water += `<g transform="translate(${f1(mx)} ${f1(my)}) rotate(${ang.toFixed(1)})"><rect x="-24" y="-17" width="48" height="34" rx="5" fill="rgba(0,0,0,.45)" transform="translate(2 3)"/><rect x="-24" y="-16" width="48" height="32" rx="5" fill="${t.bridge}"/><path d="M-22 -14 H22 M-22 14 H22" stroke="rgba(0,0,0,.45)" stroke-width="3"/><path d="M-18 -16 v32 M-6 -16 v32 M6 -16 v32 M18 -16 v32" stroke="rgba(0,0,0,.18)" stroke-width="1"/></g>`;
    }
    const nearRiver = (x, y, m) => rivers.some((ry) => Math.abs(y - ry(x)) < m);
    const nearRoad = (x, y, i, m) => {
      for (let j = Math.max(0, i - 2); j <= Math.min(total, i + 2); j++) {
        const p = pts[j]; if (Math.hypot(p.x - x, p.y - y) < m) return true;
        if (j < total) { const q = pts[j + 1]; if (Math.hypot((p.x + q.x) / 2 - x, (p.y + q.y) / 2 - y) < m) return true; }
      }
      return false;
    };
    const onLand = (x, y, pad) => x > cL(y) + pad && x < cR(y) - pad;

    // ---- forests, mountains, castles, villages ----
    const items = [];
    const sideX = (i, rr, minGap) => {
      const px = pts[i].x;
      const goLeft = px > W / 2 ? rr() < 0.8 : rr() < 0.2;
      const lo = goLeft ? cL(pts[i].y) + 24 : px + minGap;
      const hi = goLeft ? px - minGap : cR(pts[i].y) - 24;
      return hi > lo ? lo + rr() * (hi - lo) : null;
    };
    for (let i = 0; i <= total; i++) {
      const d = days[i];
      const r = rng(i * 977 + (kind === 'jee' ? 3 : 9));
      const z = d.zone;
      const isAsh = z === ashZone;
      // mountains
      const mChance = t.heavyMtn.includes(z) ? 0.95 : 0.3;
      if (r() < mChance && i < total) {
        const cx = sideX(i, r, 110);
        if (cx !== null) {
          const n = 2 + Math.floor(r() * 3), base = pts[i].y - r() * SP;
          for (let k = 0; k < n; k++) {
            const w = (W < 420 ? 28 : 36) + r() * 34, x = cx + (k - n / 2) * w * 0.55 + (r() - 0.5) * 10, y = base + (r() - 0.5) * 22;
            if (!onLand(x, y, w * 0.4) || nearRoad(x, y - w * 0.3, i, 70) || nearRiver(x, y, 20)) continue;
            items.push({ y, s: mountain(x, y, w, w * (0.75 + r() * 0.35), t, z >= t.snowFrom || kind === 'boards', isAsh && r() < 0.6, r) });
          }
        }
      }
      // forests
      const nClusters = (t.heavyForest.includes(z) ? 4 : isAsh ? 1 : 3) - (r() < 0.3 ? 1 : 0);
      for (let c = 0; c < nClusters; c++) {
        const cx = sideX(i, r, 70); if (cx === null) continue;
        const cy = pts[i].y - r() * SP;
        const nt = isAsh ? 3 + Math.floor(r() * 4) : 14 + Math.floor(r() * 22);
        const rad = 22 + r() * 34;
        for (let k = 0; k < nt; k++) {
          const a = r() * Math.PI * 2, dd = Math.sqrt(r()) * rad;
          const x = cx + Math.cos(a) * dd, y = cy + Math.sin(a) * dd * 0.65;
          if (!onLand(x, y, 6) || nearRoad(x, y, i, 50) || nearRiver(x, y, 14) || y < TOP - 40) continue;
          const s = (W < 420 ? 10 : 12) + r() * 7;
          items.push({ y, s: `<use href="#${isAsh ? 't-dead' : 't-pine'}" x="${f1(x - s / 2)}" y="${f1(y - s * 1.6)}" width="${f1(s)}" height="${f1(s * 1.7)}"/>` });
        }
      }
      // castles every ~9 days, villages between
      if (i % 9 === 4 && i < total - 2) {
        const cx = sideX(i, r, 92);
        const cy = pts[i].y - SP * 0.3;
        if (cx !== null && onLand(cx, cy, 30) && !nearRiver(cx, cy, 30)) items.push({ y: cy, s: castle(cx, cy, W < 420 ? 34 : 42, t, kind) });
      } else if (r() < 0.22 && i < total - 1) {
        const cx = sideX(i, r, 80);
        const cy = pts[i].y - r() * SP;
        if (cx !== null && onLand(cx, cy, 24) && !nearRiver(cx, cy, 24)) items.push({ y: cy, s: village(cx, cy, t, r) });
      }
    }
    // boats in the sea margins
    let boats = '';
    if (edge > 14) for (let y = 300; y < H - 200; y += 700 + R() * 600) {
      const left = R() < 0.5, x = left ? cL(y) * 0.4 : W - (W - cR(y)) * 0.4;
      boats += `<g transform="translate(${f1(x)} ${f1(y)})"><path d="M-7 0 Q0 4 7 0 L5 -2 H-5Z" fill="#3a2a1c"/><path d="M0 -2 V-12 L5 -4Z" fill="#d8cbb0"/></g>`;
    }

    items.sort((a, b) => a.y - b.y);
    return `<svg class="terrain-svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" aria-hidden="true">${defs}${base}${water}${boats}${items.map((it) => it.s).join('')}</svg>`;
  };

  JQ.terrainSea = (kind) => (TH[kind] || TH.jee).sea;
})();
