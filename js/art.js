/* ============================================================
   JEE Quest — procedural SVG art: warrior, bosses, map props, icons
   ============================================================ */
(function () {
  const JQ = (window.JQ = window.JQ || {});
  let UID = 0;

  const FLAME = '<path d="M0 -15 C6 -7 11 -2 9 6 C8 12 4 15 0 15 C-4 15 -8 12 -9 6 C-10 -1 -4 -4 -3 -9 C-1 -5 2 -5 0 -15Z"/><path d="M0 -2 C3 2 5 5 4 9 C3 12 1 13 0 13 C-2 13 -4 11 -4 8 C-4 5 -1 4 0 -2Z" fill="#fff6c8" opacity=".9"/>';
  const FROST = '<g stroke-width="3" stroke-linecap="round" fill="none"><path d="M0 -14 V14 M-12 -7 L12 7 M-12 7 L12 -7"/><path d="M-4 -11 L0 -7 L4 -11 M-4 11 L0 7 L4 11 M-12 -2 L-7 -4 L-9 -9 M12 2 L7 4 L9 9 M12 -2 L7 -4 L9 -9 M-12 2 L-7 4 L-9 9" stroke-width="2"/></g>';
  const PAL = {
    jee: { main: '#8e1b1b', dark: '#4a0d0d', trim: '#d9a441', cape: '#6e0f12', capeIn: '#c23a2a', glow: '#ff8a3d', gem: '#ff3b1f', fur: '#5a3f2e', furHi: '#7a5a44', emblem: FLAME },
    boards: { main: '#2c4a6e', dark: '#16263c', trim: '#cfe3f2', cape: '#1b2a40', capeIn: '#6f9cc7', glow: '#9fe4ff', gem: '#7fd8ff', fur: '#e8e2d6', furHi: '#ffffff', emblem: FROST },
  };
  JQ.PAL = PAL;

  // ------------------------------------------------------------------
  // WARRIOR  (stage 0..5)  viewBox 0 -24 200 274, feet at y≈236
  // ------------------------------------------------------------------
  function swordSVG(s, P, u) {
    const L = [54, 62, 76, 90, 104, 118][s];
    if (s === 0) {
      // a giant pencil — the rookie's first weapon
      return `<g class="w-sword">
        <rect x="-5" y="2" width="10" height="12" rx="3" fill="#ff8fa3"/>
        <rect x="-5.5" y="-3" width="11" height="6" fill="#c0c7cf"/>
        <rect x="-5" y="${-L + 14}" width="10" height="${L - 11}" fill="#ffc83d"/>
        <rect x="-1.6" y="${-L + 14}" width="3.2" height="${L - 11}" fill="#f0a91f"/>
        <path d="M-5 ${-L + 14} L0 ${-L} L5 ${-L + 14}Z" fill="#f3d2a2"/>
        <path d="M-1.9 ${-L + 5} L0 ${-L} L1.9 ${-L + 5}Z" fill="#3a3a3a"/>
      </g>`;
    }
    const w = [0, 4, 4.5, 5, 5.5, 6.5][s];
    const guard = [0, '#7a4e2c', '#7d8794', P.trim, P.trim, '#ffd34d'][s];
    const gw = [0, 10, 13, 15, 17, 21][s];
    const blade = s === 1 ? '#c79a62' : `url(#${u}bl)`;
    let g = `<g class="w-sword"${s >= 4 ? ` filter="url(#${u}gl)"` : ''}>`;
    if (s === 5) g += `<path class="w-flame" d="M0 ${-L - 14} Q${w + 11} ${-L / 2} ${w + 4} -12 L${-w - 4} -12 Q${-w - 11} ${-L / 2} 0 ${-L - 14}Z" fill="${P.glow}" opacity=".45"/>`;
    g += `<rect x="-3" y="-6" width="6" height="18" rx="2" fill="${s >= 3 ? '#4a2216' : '#5b3a22'}"/>`;
    g += `<circle cx="0" cy="14" r="${s >= 3 ? 4.5 : 3.5}" fill="${guard}"/>`;
    g += `<path d="M${-w} -8 L${-w} ${-L + 14} L0 ${-L} L${w} ${-L + 14} L${w} -8Z" fill="${blade}" stroke="${s === 1 ? '#8a6238' : 'rgba(0,0,0,.28)'}" stroke-width="1"/>`;
    if (s >= 2) g += `<path d="M0 -11 L0 ${-L + 10}" stroke="rgba(255,255,255,.75)" stroke-width="1.6"/>`;
    g += `<rect x="${-gw}" y="-11" width="${gw * 2}" height="5.5" rx="2.7" fill="${guard}" stroke="rgba(0,0,0,.2)"/>`;
    if (s >= 3) g += `<circle cx="0" cy="-8.2" r="3.2" fill="${P.gem}" stroke="#fff" stroke-width="1"/>`;
    g += '</g>';
    return g;
  }

  function shieldSVG(s, P, u) {
    if (s === 0) {
      // textbook shield
      return `<g transform="rotate(8)">
        <rect x="-14" y="-18" width="28" height="36" rx="3" fill="#2f6bd8" stroke="#1d468f" stroke-width="1.5"/>
        <rect x="-14" y="-18" width="6" height="36" rx="2" fill="#1f4fa8"/>
        <rect x="11.5" y="-16" width="2.5" height="32" fill="#f4f1e8"/>
        <rect x="-4" y="-9" width="13" height="3" rx="1.5" fill="#cfe0ff"/>
        <rect x="-4" y="-3" width="9" height="2.5" rx="1.2" fill="#cfe0ff"/>
      </g>`;
    }
    if (s === 1) {
      return `<g><circle r="21" fill="#a8743f" stroke="#5e3d1f" stroke-width="3"/>
        <path d="M-20 -7 H20 M-20 7 H20" stroke="#7b5230" stroke-width="2"/>
        <circle r="6" fill="#8d97a3" stroke="#5b636d" stroke-width="2"/></g>`;
    }
    const k = 1 + (s - 2) * 0.09;
    const fill = s === 2 ? `url(#${u}pl)` : s === 5 ? `url(#${u}gd)` : P.main;
    const rim = s === 2 ? '#5f6b78' : s === 5 ? '#fff1a8' : P.trim;
    let g = `<g transform="scale(${k})"><path d="M-21 -24 H21 V0 Q21 22 0 32 Q-21 22 -21 0Z" fill="${fill}" stroke="${rim}" stroke-width="${s >= 4 ? 4 : 3}"/>`;
    if (s >= 3) {
      g += `<path d="M-15 -18 H15 V0 Q15 16 0 24 Q-15 16 -15 0Z" fill="none" stroke="rgba(255,255,255,.35)" stroke-width="2"/>`;
      const ec = s === 5 ? '#8a5208' : P.trim;
      g += `<g transform="translate(0 3) scale(.95)" fill="${ec}" stroke="${ec}">${P.emblem}</g>`;
    } else {
      g += `<path d="M0 -21 V27 M-18 -4 H18" stroke="#6f7b88" stroke-width="3"/>`;
    }
    if (s === 5) g += `<circle cx="0" cy="-16" r="4" fill="${P.gem}" stroke="#fff" stroke-width="1.2"/>`;
    return g + '</g>';
  }

  // Curly hair: deterministic curl clusters
  const CURLS_BACK = [[56, 98, 10], [144, 98, 10], [58, 80, 13], [142, 80, 13], [64, 60, 14], [136, 60, 14], [76, 44, 14], [124, 44, 14], [90, 36, 14], [110, 36, 14], [100, 40, 15]];
  const CURLS_FRONT = [[66, 70, 9], [76, 58, 11], [90, 52, 11], [104, 52, 12], [118, 55, 11], [130, 64, 10], [84, 66, 7], [112, 66, 7], [97, 64, 6]];
  const SKIN = '#c8916a', SKIN_SH = '#a8724e', HAIR = '#1b110c', HAIR_HI = '#3a2a20';

  function headSVG(s, P, u) {
    let h = '';
    // back hair + side curls
    h += `<ellipse cx="100" cy="74" rx="44" ry="40" fill="${HAIR}"/>`;
    CURLS_BACK.forEach((c) => (h += `<circle cx="${c[0]}" cy="${c[1]}" r="${c[2]}" fill="${HAIR}"/>`));
    // ears + face
    h += `<ellipse cx="62" cy="94" rx="6.5" ry="8" fill="${SKIN_SH}"/><ellipse cx="138" cy="94" rx="6.5" ry="8" fill="${SKIN_SH}"/>`;
    h += `<path d="M63 86 Q63 54 100 52 Q137 54 137 86 Q137 112 120 122 Q100 132 80 122 Q63 112 63 86Z" fill="${SKIN}"/>`;
    // stubble + jaw shading (grows with rank)
    if (s >= 1) h += `<path d="M67 100 Q70 124 100 128 Q130 124 133 100 Q122 116 100 117 Q78 116 67 100Z" fill="#24140d" opacity="${[0, 0.08, 0.14, 0.18, 0.2, 0.2][s]}"/>`;
    h += `<ellipse cx="78" cy="106" rx="6" ry="3" fill="#e0705a" opacity=".22"/><ellipse cx="122" cy="106" rx="6" ry="3" fill="#e0705a" opacity=".22"/>`;
    // battle scar (earned at Sworn Sword)
    if (s >= 2) h += `<path d="M73 86 L81 101 M76.5 85 L83 97" stroke="#7d3a2c" stroke-width="1.8" stroke-linecap="round" opacity=".75"/>`;
    // eyes
    const ey = 92, pupil = s === 5 ? P.gem : '#3a2416';
    [86, 114].forEach((x, i) => {
      h += `<ellipse cx="${x}" cy="${ey}" rx="6.2" ry="6.8" fill="#fff"/>`;
      h += `<ellipse cx="${x + (s === 0 ? -1 : 0.8)}" cy="${ey + 0.8}" rx="4.4" ry="5.4" fill="${pupil}"/>`;
      h += `<circle cx="${x + (s === 0 ? -1 : 0.8)}" cy="${ey + 1}" r="2" fill="#120a06"/>`;
      h += `<circle cx="${x + 2}" cy="${ey - 2}" r="1.8" fill="#fff"/>`;
      h += `<path d="M${x - 7} ${ey - 3} Q${x} ${ey - 9} ${x + 7} ${ey - 3}" stroke="${HAIR}" stroke-width="2.2" fill="none" stroke-linecap="round"/>`;
    });
    // brows: worried → steady → fierce
    const B = [
      [[76, 81, 93, 77], [107, 77, 124, 81]],
      [[76, 80, 93, 79], [107, 79, 124, 80]],
      [[76, 79, 93, 80], [107, 80, 124, 79]],
      [[76, 78, 93, 81], [107, 81, 124, 78]],
      [[76, 77, 93, 82], [107, 82, 124, 76]],
      [[76, 77, 93, 82], [107, 82, 124, 76]],
    ][s];
    B.forEach((b) => (h += `<path d="M${b[0]} ${b[1]} Q${(b[0] + b[2]) / 2} ${Math.min(b[1], b[3]) - 2} ${b[2]} ${b[3]}" stroke="${HAIR}" stroke-width="${4.2 + s * 0.25}" fill="none" stroke-linecap="round"/>`));
    // nose
    h += `<path d="M100 95 Q96 104 101 106" stroke="${SKIN_SH}" stroke-width="2.2" fill="none" stroke-linecap="round"/>`;
    // mouth: nervous → calm → the confident half-smile
    h += [
      `<path d="M93 114 q2 -2.5 4 0 t4 0 t4 0" fill="none" stroke="#5e2c20" stroke-width="2.2" stroke-linecap="round"/>`,
      `<path d="M94 113 Q100 115 106 113" fill="none" stroke="#5e2c20" stroke-width="2.4" stroke-linecap="round"/>`,
      `<path d="M92 112 Q100 117 108 111" fill="none" stroke="#5e2c20" stroke-width="2.6" stroke-linecap="round"/>`,
      `<path d="M91 112 Q101 119 110 109" fill="none" stroke="#5e2c20" stroke-width="2.8" stroke-linecap="round"/><path d="M110 109 l2 -1.5" stroke="#5e2c20" stroke-width="2" stroke-linecap="round"/>`,
      `<path d="M90 111 Q101 120 112 107" fill="none" stroke="#5e2c20" stroke-width="3" stroke-linecap="round"/><path d="M112 107 q2 0 2.5 -2" stroke="#5e2c20" stroke-width="2" fill="none" stroke-linecap="round"/>`,
      `<path d="M89 110 Q101 122 113 106 Q101 114 89 110Z" fill="#5e2c20"/><path d="M92 111 Q101 115 110 108" stroke="#fff" stroke-width="2" fill="none"/>`,
    ][s];
    if (s === 0) h += `<path class="w-sweat" d="M140 64 q-6 9 0 12 q6 -3 0 -12z" fill="#8fd3ff" stroke="#4fa8e0" stroke-width="1"/>`;
    // front curls falling on the forehead
    CURLS_FRONT.forEach((c, i) => {
      h += `<circle cx="${c[0]}" cy="${c[1]}" r="${c[2]}" fill="${HAIR}"/>`;
      if (i % 2 === 0) h += `<path d="M${c[0] - c[2] * 0.5} ${c[1] - c[2] * 0.2} q${c[2] * 0.5} -${c[2] * 0.6} ${c[2] * 0.9} 0" stroke="${HAIR_HI}" stroke-width="1.6" fill="none" stroke-linecap="round"/>`;
    });
    h += `<path d="M86 70 q3 7 -1 12 M114 70 q-3 7 1 11" stroke="${HAIR}" stroke-width="4" fill="none" stroke-linecap="round"/>`;
    // Sovereign: silver circlet on the curls
    if (s === 5) {
      h += `<path d="M62 62 Q100 46 138 62" stroke="#e8ecf0" stroke-width="4.5" fill="none" stroke-linecap="round"/>`;
      h += `<path d="M76 54 l3 -10 l4 8 M96 50 l4 -13 l4 13 M117 52 l4 -8 l3 10" fill="#e8ecf0" stroke="#e8ecf0" stroke-width="2.5" stroke-linejoin="round"/>`;
      h += `<circle cx="100" cy="50" r="4" fill="${P.gem}" stroke="#fff" stroke-width="1.2"/>`;
    }
    return h;
  }

  function jagged(x0, x1, y, teeth, depth) {
    let d = '';
    const w = (x1 - x0) / teeth;
    for (let k = 0; k < teeth; k++) d += ` L${(x1 - w * (k + 0.5)).toFixed(1)} ${y + (k % 2 ? depth : depth * 0.4)} L${(x1 - w * (k + 1)).toFixed(1)} ${y}`;
    return d;
  }

  /**
   * Warrior — curly-haired northern swordsman in a fur cloak.
   * Rank (0-5) adds stubble, a scar, leather → steel, a bigger snowy fur cloak, house brooch, circlet.
   */
  JQ.warriorSVG = function (s, theme, opt) {
    opt = opt || {};
    s = Math.max(0, Math.min(5, s | 0));
    const P = PAL[theme] || PAL.jee;
    const u = 'w' + ++UID;
    const tunic = ['#8a7660', '#5e4a3a', '#3b2b22', '#33251e', '#2c2420', '#2a2220'][s];
    const sleeve = ['#7d6a55', '#4e3c30', '#2e221c', '#2a1f19', '#3e444c', '#3a3f46'][s];
    const pants = ['#5a4a3a', '#3e3028', '#2e2520', '#2a221e', '#24201e', '#22201f'][s];
    const boot = ['#4a382a', '#3a2a1e', '#2a1e16', '#241a14', '#1e1814', '#1a1614'][s];
    const plA = ['', '', '#6a4e3a', '#5e4434', '#9aa3ad', '#a9b1bb'][s];
    const plB = ['', '', '#2e2018', '#271b14', '#3e444c', '#33383f'][s];
    const fur = theme === 'boards' ? '#4a4a50' : '#3a2b24';
    const furHi = theme === 'boards' ? '#8a8a92' : '#76604c';
    const bladeA = ['', '', '#f2f6fa', '#ffffff', '#fffbe6', '#ffffff'][s];
    const bladeB = ['', '', '#94a3b5', '#b8c8da', P.glow, P.glow][s];
    const tw = s;
    const vb = opt.bust ? '50 26 100 100' : '0 -24 200 274';

    let g = `<svg class="warrior st${s}${opt.ghost ? ' ghost' : ''}" viewBox="${vb}" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><defs>
      <linearGradient id="${u}pl" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${plA || '#ddd'}"/><stop offset="1" stop-color="${plB || '#999'}"/></linearGradient>
      <linearGradient id="${u}gd" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff6c2"/><stop offset=".5" stop-color="#ffd34d"/><stop offset="1" stop-color="#d88f0c"/></linearGradient>
      <linearGradient id="${u}bl" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="${bladeB || '#aaa'}"/><stop offset="1" stop-color="${bladeA || '#fff'}"/></linearGradient>
      <radialGradient id="${u}au"><stop offset="0" stop-color="${P.glow}" stop-opacity=".7"/><stop offset=".55" stop-color="${P.glow}" stop-opacity=".18"/><stop offset="1" stop-color="${P.glow}" stop-opacity="0"/></radialGradient>
      <linearGradient id="${u}fur" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${furHi}"/><stop offset="1" stop-color="${fur}"/></linearGradient>
      <filter id="${u}gl" x="-80%" y="-30%" width="260%" height="160%"><feGaussianBlur stdDeviation="2.6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    </defs>`;

    if (s >= 4) g += `<circle class="w-aura" cx="100" cy="140" r="${s === 5 ? 120 : 100}" fill="url(#${u}au)"/>`;
    g += `<ellipse cx="100" cy="238" rx="${42 + s * 4}" ry="8" fill="rgba(0,0,0,.28)"/>`;
    g += `<g class="w-body"${s === 0 ? ' transform="rotate(-2 100 236)"' : ''}>`;
    // fur cloak hanging behind (Sworn Sword+)
    if (s >= 2) {
      const L = 60 - s * 3, R = 140 + s * 3, bottom = 196 + s * 7;
      g += `<path class="w-cape" d="M130 116 Q${R + 6} ${bottom - 50} ${R + 10} ${bottom}${jagged(L - 10, R + 10, bottom, 10, 9)} Q${L - 6} ${bottom - 50} 70 116Z" fill="${fur}" stroke="rgba(0,0,0,.3)" stroke-width="1"/>`;
      g += `<path d="M${L} ${bottom - 30} q3 -10 0 -20 M${R} ${bottom - 30} q-3 -10 0 -20 M${L + 8} ${bottom - 6} q2 -8 0 -14 M${R - 8} ${bottom - 6} q-2 -8 0 -14" stroke="${furHi}" stroke-width="2" fill="none" opacity=".6"/>`;
    }
    // legs + boots
    const lo = s >= 3 ? 3 : 0;
    g += `<rect x="${80 - lo}" y="174" width="16" height="44" rx="7" fill="${pants}"/><rect x="${104 + lo}" y="174" width="16" height="44" rx="7" fill="${pants}"/>`;
    g += `<rect x="${75 - lo}" y="208" width="25" height="24" rx="8" fill="${boot}"/><rect x="${100 + lo}" y="208" width="25" height="24" rx="8" fill="${boot}"/>`;
    if (s >= 2) g += `<rect x="${76 - lo}" y="208" width="23" height="5" rx="2.5" fill="${furHi}"/><rect x="${101 + lo}" y="208" width="23" height="5" rx="2.5" fill="${furHi}"/>`;
    // torso: tunic → leather jerkin → dark steel
    g += `<rect x="${70 - tw}" y="116" width="${60 + tw * 2}" height="66" rx="20" fill="${tunic}"/>`;
    if (s <= 1) g += `<path d="M88 122 L100 136 L112 122" stroke="rgba(0,0,0,.3)" stroke-width="2" fill="none"/><path d="M100 136 V160" stroke="rgba(0,0,0,.2)" stroke-width="1.5" stroke-dasharray="3 3"/>`;
    if (s === 0) g += `<rect x="108" y="146" width="11" height="10" rx="2" fill="#a08a6e" transform="rotate(8 113 151)"/>`;
    if (s >= 2) {
      g += `<path d="M${74 - tw} 124 Q100 116 ${126 + tw} 124 L${122 + tw} 168 Q100 177 ${78 - tw} 168 Z" fill="url(#${u}pl)" stroke="${s === 5 ? P.trim : 'rgba(0,0,0,.35)'}" stroke-width="${s === 5 ? 2 : 1}"/>`;
      g += `<path d="M${80 - tw} 132 H${120 + tw} M${80 - tw} 146 H${120 + tw}" stroke="rgba(0,0,0,.28)" stroke-width="1.4" stroke-dasharray="${s >= 4 ? '0' : '3 2'}"/>`;
      // baldric strap across the chest
      g += `<path d="M${78 - tw} 124 L${122 + tw} 166" stroke="#1e140e" stroke-width="7" stroke-linecap="round"/><rect x="96" y="141" width="8" height="8" rx="1.5" fill="${s >= 4 ? P.trim : '#9a8a70'}" transform="rotate(43 100 145)"/>`;
    }
    g += `<rect x="${70 - tw}" y="164" width="${60 + tw * 2}" height="9" rx="3" fill="#2a1c12"/><rect x="94" y="162.5" width="12" height="12" rx="2.5" fill="${s >= 4 ? P.trim : '#a89470'}"/>`;
    // arms (under the mantle)
    g += `<rect x="${54 - tw}" y="122" width="16" height="40" rx="8" transform="rotate(18 ${62 - tw} 124)" fill="${sleeve}"/>`;
    g += `<rect x="${130 + tw}" y="122" width="16" height="40" rx="8" transform="rotate(-18 ${138 + tw} 124)" fill="${sleeve}"/>`;
    if (s >= 2) g += `<rect x="${44 - tw}" y="146" width="14" height="10" rx="3" fill="#2a1c12" transform="rotate(18 ${51 - tw} 151)"/><rect x="${142 + tw}" y="146" width="14" height="10" rx="3" fill="#2a1c12" transform="rotate(-18 ${149 + tw} 151)"/>`;
    // sword + hand
    g += `<g transform="translate(${50 - tw} 160) rotate(${s === 0 ? -8 : -24 - s * 2})">${swordSVG(s, P, u)}</g>`;
    g += `<circle cx="${50 - tw}" cy="160" r="8" fill="${SKIN}" stroke="${SKIN_SH}" stroke-width="1"/>`;
    g += `<circle cx="${150 + tw}" cy="160" r="8" fill="${SKIN}"/>`;
    // fur mantle over the shoulders — grows with rank, snow from Knight
    if (s >= 1) {
      const k = [0, 0.62, 0.86, 1, 1.08, 1.14][s];
      const mantle = s === 1
        ? `M68 122 Q100 106 132 122 Q126 130 118 126 Q110 132 100 127 Q90 132 82 126 Q74 130 68 122Z`
        : `M52 144 Q44 118 70 108 Q100 98 130 108 Q156 118 148 144 Q142 136 136 143 Q129 134 121 141 Q113 132 105 140 Q100 134 95 140 Q87 132 79 141 Q71 134 64 143 Q58 136 52 144Z`;
      g += `<g transform="translate(100 120) scale(${k} 1) translate(-100 -120)"><path d="${mantle}" fill="url(#${u}fur)" stroke="rgba(0,0,0,.35)" stroke-width="1.2"/>`;
      if (s >= 2) g += `<path d="M62 124 q6 -6 12 -2 M80 112 q6 -5 12 -1 M108 111 q6 -4 12 0 M126 116 q6 -2 10 4 M58 136 q5 -4 9 0 M134 134 q5 -4 9 1" stroke="${fur}" stroke-width="2" fill="none" opacity=".9"/>`;
      if (s >= 3) {
        [[66, 118, 2.2], [80, 110, 1.8], [94, 106, 2.4], [112, 107, 2], [128, 112, 2.3], [140, 124, 1.8], [58, 132, 1.6], [104, 112, 1.4], [72, 126, 1.5], [122, 120, 1.6], [86, 116, 1.2], [134, 132, 1.3]]
          .forEach((d) => (g += `<circle cx="${d[0]}" cy="${d[1]}" r="${d[2]}" fill="#fff" opacity=".85"/>`));
      }
      g += '</g>';
    }
    // steel pauldron peeking out (Lord Commander+)
    if (s >= 4) g += `<ellipse cx="${131 + tw}" cy="138" rx="15" ry="10" fill="url(#${u}pl)" stroke="${s === 5 ? P.trim : '#2a2e34'}" stroke-width="2"/>`;
    // house brooch pinning the cloak (Knight+)
    if (s >= 3) g += `<g transform="translate(76 128) scale(.62)"><circle r="15" fill="#c9ced6" stroke="#5a6068" stroke-width="2.5"/><g fill="#3a3f46" stroke="#3a3f46" transform="scale(.75)">${P.emblem}</g></g>`;
    // shield
    g += `<g transform="translate(${152 + tw} 158)">${shieldSVG(s, P, u)}</g>`;
    // head
    g += `<g class="w-head"${s === 0 ? ' transform="rotate(-5 100 120)"' : s >= 4 ? ' transform="rotate(-3 100 120)"' : ''}>${headSVG(s, P, u)}</g>`;
    g += '</g>';
    if (s === 5) {
      [[28, 120, 1], [176, 96, 0.8], [40, 40, 0.7], [168, 190, 0.9], [20, 196, 0.6]].forEach((p, i) => {
        g += `<path class="w-spark" style="animation-delay:${i * 0.35}s" d="M0 -7 L1.8 -1.8 L7 0 L1.8 1.8 L0 7 L-1.8 1.8 L-7 0 L-1.8 -1.8Z" fill="#fff" transform="translate(${p[0]} ${p[1]}) scale(${p[2]})"/>`;
      });
    }
    return g + '</svg>';
  };

  // ------------------------------------------------------------------
  // JEE BOSS — Examorax, the 300-Mark Hydra (heads: P, C, M)
  // ------------------------------------------------------------------
  JQ.hydraSVG = function () {
    const u = 'h' + ++UID;
    const OUT = '#120504', BODY = '#2e1210';
    const wing = `M150 200 C110 120 60 70 6 38 C28 88 18 110 28 142 C48 120 64 130 70 152 C84 130 100 140 104 162 C116 150 132 160 150 200Z`;
    const head = (x, y, label, k, rot) => `
      <g class="b-head bh${k}" transform="translate(${x} ${y}) rotate(${rot})"><g class="b-head-in">
        <path d="M-28 -22 Q-52 -60 -24 -78 Q-34 -52 -14 -30Z" fill="#d8c9a8" stroke="${OUT}" stroke-width="3"/>
        <path d="M28 -22 Q52 -60 24 -78 Q34 -52 14 -30Z" fill="#d8c9a8" stroke="${OUT}" stroke-width="3"/>
        <path d="M-40 -6 Q-42 -42 0 -44 Q42 -42 40 -6 Q44 20 26 34 Q0 46 -26 34 Q-44 20 -40 -6Z" fill="url(#${u}hd)" stroke="${OUT}" stroke-width="4"/>
        <path d="M-27 12 Q0 2 27 12 Q32 36 0 46 Q-32 36 -27 12Z" fill="#3b1612" stroke="${OUT}" stroke-width="3"/>
        <ellipse cx="-8" cy="20" rx="3" ry="2" fill="${OUT}"/><ellipse cx="8" cy="20" rx="3" ry="2" fill="${OUT}"/>
        <path d="M-22 31 Q0 41 22 31" stroke="${OUT}" stroke-width="3" fill="none"/>
        <path d="M-16 33 l3 7 l3 -6 M10 34 l3 6 l3 -7 M-3 36 l3 6 l3 -6" fill="#fff" stroke="#fff" stroke-width="1"/>
        <path class="b-eye" d="M-32 -8 L-9 -1 L-13 7 L-31 3Z" fill="#ff8a1f"/>
        <path class="b-eye" d="M32 -8 L9 -1 L13 7 L31 3Z" fill="#ff8a1f"/>
        <rect x="-21" y="-5" width="3" height="9" rx="1.5" fill="${OUT}" transform="rotate(14 -20 0)"/>
        <rect x="18" y="-5" width="3" height="9" rx="1.5" fill="${OUT}" transform="rotate(-14 20 0)"/>
        <path d="M-36 -16 L-8 -6 M36 -16 L8 -6" stroke="${OUT}" stroke-width="5" stroke-linecap="round"/>
        <circle cy="-27" r="11" fill="${OUT}" stroke="#ff8a1f" stroke-width="2"/>
        <text y="-21.5" text-anchor="middle" font-size="15" fill="#ff7a4d" font-family="Cinzel,Georgia,serif" font-weight="900">${label}</text>
      </g></g>`;
    const neck = (d) => `<path d="${d}" stroke="${OUT}" stroke-width="50" fill="none" stroke-linecap="round"/><path d="${d}" stroke="${BODY}" stroke-width="43" fill="none" stroke-linecap="round"/><path d="${d}" stroke="#a8401c" stroke-width="13" fill="none" stroke-dasharray="7 7" opacity=".85"/>`;
    let belly = '';
    for (let y = 236; y <= 336; y += 14) {
      const hw = 58 * Math.sqrt(Math.max(0, 1 - Math.pow((y - 285) / 66, 2)));
      if (hw > 8) belly += `<path d="M${210 - hw} ${y} Q210 ${y + 7} ${210 + hw} ${y}" stroke="#5a1f0c" stroke-width="2.5" fill="none"/>`;
    }
    const syms = ['∫', 'Σ', 'Δ', 'λ', '√', 'π', 'dx', 'H₂O'];
    let floaters = '';
    syms.forEach((t, i) => {
      const a = (i / syms.length) * Math.PI * 2;
      floaters += `<text class="b-sym" style="animation-delay:${(i * 0.4).toFixed(1)}s" x="${(210 + Math.cos(a) * 190).toFixed(0)}" y="${(200 + Math.sin(a) * 150).toFixed(0)}" text-anchor="middle" font-size="${20 + (i % 3) * 6}" fill="#ff9a4a" font-family="Cinzel,Georgia,serif">${t}</text>`;
    });
    return `<svg class="boss-svg hydra" viewBox="0 0 420 380" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><defs>
      <radialGradient id="${u}g"><stop offset="0" stop-color="#ff6a1f" stop-opacity=".6"/><stop offset=".6" stop-color="#ff4a1f" stop-opacity=".15"/><stop offset="1" stop-color="#ff4a1f" stop-opacity="0"/></radialGradient>
      <linearGradient id="${u}b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4a1d18"/><stop offset="1" stop-color="#140706"/></linearGradient>
      <linearGradient id="${u}hd" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#55221c"/><stop offset="1" stop-color="#220c0a"/></linearGradient>
      <linearGradient id="${u}w" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#8a2a18"/><stop offset="1" stop-color="#1c0806"/></linearGradient>
    </defs>
    <ellipse class="b-glow" cx="210" cy="200" rx="210" ry="185" fill="url(#${u}g)"/>
    ${floaters}
    <ellipse cx="210" cy="364" rx="160" ry="14" fill="rgba(0,0,0,.4)"/>
    <g class="b-wing bwl"><path d="${wing}" fill="url(#${u}w)" stroke="${OUT}" stroke-width="3"/><path d="M150 200 L28 142 M150 200 L70 152 M150 200 L104 162" stroke="${OUT}" stroke-width="2" opacity=".6"/></g>
    <g class="b-wing bwr"><g transform="translate(420 0) scale(-1 1)"><path d="${wing}" fill="url(#${u}w)" stroke="${OUT}" stroke-width="3"/><path d="M150 200 L28 142 M150 200 L70 152 M150 200 L104 162" stroke="${OUT}" stroke-width="2" opacity=".6"/></g></g>
    <path d="M292 318 Q372 330 382 280 Q388 248 360 238 Q376 270 350 290 Q322 306 282 300Z" fill="url(#${u}b)" stroke="${OUT}" stroke-width="3"/>
    <path d="M360 238 l14 -12 l-2 18z" fill="#d8c9a8" stroke="${OUT}" stroke-width="2"/>
    ${neck('M172 232 Q118 190 104 130')}${neck('M210 222 Q210 160 210 100')}${neck('M248 232 Q302 190 316 130')}
    <ellipse cx="210" cy="268" rx="114" ry="92" fill="url(#${u}b)" stroke="${OUT}" stroke-width="4"/>
    <path d="M120 222 l10 -22 l8 18 l10 -24 l8 22 M262 218 l8 -22 l10 24 l8 -18 l10 22" fill="#d8c9a8" stroke="${OUT}" stroke-width="2.5"/>
    <ellipse cx="210" cy="285" rx="58" ry="66" fill="#b2532a" stroke="#5a1f0c" stroke-width="3"/>${belly}
    <g><ellipse cx="148" cy="342" rx="36" ry="22" fill="#2a0f0c" stroke="${OUT}" stroke-width="3"/><path d="M122 352 l-6 10 l12 -4 M140 356 l-2 11 l9 -8 M158 356 l2 11 l6 -10" fill="#fff" stroke="${OUT}" stroke-width="1.5"/></g>
    <g><ellipse cx="272" cy="342" rx="36" ry="22" fill="#2a0f0c" stroke="${OUT}" stroke-width="3"/><path d="M298 352 l6 10 l-12 -4 M280 356 l2 11 l-9 -8 M262 356 l-2 11 l-6 -10" fill="#fff" stroke="${OUT}" stroke-width="1.5"/></g>
    ${head(98, 108, 'P', 1, -14)}${head(322, 108, 'M', 3, 14)}${head(210, 76, 'C', 2, 0)}
    </svg>`;
  };

  // ------------------------------------------------------------------
  // BOARDS BOSS — Volumos, the Syllabus Colossus (golem of books)
  // ------------------------------------------------------------------
  JQ.golemSVG = function () {
    const u = 'g' + ++UID;
    const OUT = '#08142c';
    const cols = ['#2f4e6e', '#4b6f96', '#24405e', '#6b8fb6', '#1d3350', '#3d5f86'];
    let torso = '';
    const rows = [[150, 172, 26], [140, 198, 28], [146, 226, 26], [138, 252, 28], [150, 280, 24]];
    rows.forEach((r, i) => {
      const w = 420 - r[0] * 2;
      torso += `<rect x="${r[0]}" y="${r[1]}" width="${w}" height="${r[2]}" rx="4" fill="${cols[i % 6]}" stroke="${OUT}" stroke-width="3"/>`;
      torso += `<rect x="${r[0] + w - 22}" y="${r[1] + 4}" width="16" height="${r[2] - 8}" rx="2" fill="#f3ead2"/>`;
      torso += `<path d="M${r[0] + 14} ${r[1] + 6} V${r[1] + r[2] - 6} M${r[0] + 22} ${r[1] + 6} V${r[1] + r[2] - 6}" stroke="#cfe3f2" stroke-width="2"/>`;
      for (let k = 0; k < 4; k++) { const ix = r[0] + 30 + k * ((w - 60) / 3); torso += `<path d="M${ix - 5} ${r[1] + r[2] - 1} L${ix} ${r[1] + r[2] + 9 + (k % 2) * 5} L${ix + 5} ${r[1] + r[2] - 1}Z" fill="#e6f6ff" stroke="#7fb3d8" stroke-width="1"/>`; }
    });
    const arm = (flip) => {
      let a = `<g${flip ? ' transform="translate(420 0) scale(-1 1)"' : ''}><g class="b-arm">`;
      [[92, 176, '#4b6f96'], [74, 204, '#2f4e6e'], [58, 232, '#6b8fb6']].forEach((b, i) => {
        a += `<rect x="${b[0]}" y="${b[1]}" width="60" height="24" rx="4" fill="${b[2]}" stroke="${OUT}" stroke-width="3" transform="rotate(${-20 + i * 6} ${b[0] + 30} ${b[1] + 12})"/>`;
      });
      a += `<rect x="30" y="252" width="56" height="50" rx="14" fill="#9fc3e0" stroke="${OUT}" stroke-width="3.5"/>`;
      a += `<path d="M44 262 V292 M58 262 V292 M72 262 V292" stroke="${OUT}" stroke-width="2.5" opacity=".6"/>`;
      return a + '</g></g>';
    };
    const glyphs = ['A+', '95%', '∑', '✎', 'Ω', 'NCERT', '100', '∴'];
    let floaters = '';
    glyphs.forEach((t, i) => {
      const a = (i / glyphs.length) * Math.PI * 2 + 0.3;
      floaters += `<text class="b-sym" style="animation-delay:${(i * 0.45).toFixed(1)}s" x="${(210 + Math.cos(a) * 190).toFixed(0)}" y="${(196 + Math.sin(a) * 150).toFixed(0)}" text-anchor="middle" font-size="${16 + (i % 3) * 6}" fill="#7eeaff" font-family="Cinzel,Georgia,serif" font-weight="700">${t}</text>`;
    });
    let pages = '';
    [[60, 120, -20], [350, 90, 18], [380, 220, -10], [36, 210, 14]].forEach((p, i) => {
      pages += `<g class="b-page" style="animation-delay:${i * 0.6}s"><rect x="${p[0]}" y="${p[1]}" width="22" height="28" rx="2" fill="#f6efdc" stroke="${OUT}" stroke-width="1.5" transform="rotate(${p[2]} ${p[0] + 11} ${p[1] + 14})"/></g>`;
    });
    return `<svg class="boss-svg golem" viewBox="0 0 420 380" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><defs>
      <radialGradient id="${u}g"><stop offset="0" stop-color="#3fe0ff" stop-opacity=".55"/><stop offset=".6" stop-color="#3fe0ff" stop-opacity=".12"/><stop offset="1" stop-color="#3fe0ff" stop-opacity="0"/></radialGradient>
      <radialGradient id="${u}e"><stop offset="0" stop-color="#ffffff"/><stop offset=".35" stop-color="#7ff4ff"/><stop offset="1" stop-color="#0aa4d6"/></radialGradient>
      <linearGradient id="${u}c" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a2a7a"/><stop offset="1" stop-color="#1a1240"/></linearGradient>
    </defs>
    <ellipse class="b-glow" cx="210" cy="200" rx="210" ry="185" fill="url(#${u}g)"/>
    ${floaters}${pages}
    <ellipse cx="210" cy="366" rx="150" ry="13" fill="rgba(0,0,0,.4)"/>
    <g><rect x="150" y="304" width="52" height="22" rx="3" fill="#3d5f86" stroke="${OUT}" stroke-width="3"/><rect x="146" y="326" width="58" height="22" rx="3" fill="#24405e" stroke="${OUT}" stroke-width="3"/><rect x="140" y="346" width="66" height="16" rx="5" fill="#2a3550" stroke="${OUT}" stroke-width="3"/></g>
    <g><rect x="218" y="304" width="52" height="22" rx="3" fill="#4b6f96" stroke="${OUT}" stroke-width="3"/><rect x="216" y="326" width="58" height="22" rx="3" fill="#2f4e6e" stroke="${OUT}" stroke-width="3"/><rect x="214" y="346" width="66" height="16" rx="5" fill="#2a3550" stroke="${OUT}" stroke-width="3"/></g>
    ${arm(false)}${arm(true)}
    ${torso}
    <g class="b-headg">
      <path d="M90 66 L104 20 L126 52 L150 8 L172 46 L210 0 L248 46 L270 8 L294 52 L316 20 L330 66Z" fill="#e6f6ff" stroke="#5f8fb8" stroke-width="3"/>
      <circle cx="210" cy="30" r="8" fill="#3fe0ff" stroke="#fff" stroke-width="2"/>
      <path d="M210 168 Q150 150 96 160 L92 70 Q150 56 210 84Z" fill="url(#${u}c)" stroke="${OUT}" stroke-width="4"/>
      <path d="M210 168 Q270 150 324 160 L328 70 Q270 56 210 84Z" fill="url(#${u}c)" stroke="${OUT}" stroke-width="4"/>
      <path d="M210 160 Q156 142 106 150 L104 78 Q156 66 210 92Z" fill="#f6efdc" stroke="${OUT}" stroke-width="2"/>
      <path d="M210 160 Q264 142 314 150 L316 78 Q264 66 210 92Z" fill="#f6efdc" stroke="${OUT}" stroke-width="2"/>
      <path d="M120 96 Q160 88 190 100 M120 110 Q160 102 190 114 M230 100 Q260 88 300 96 M230 114 Q260 102 300 110" stroke="#c9bfa6" stroke-width="2" fill="none"/>
      <circle cx="210" cy="122" r="30" fill="${OUT}"/>
      <circle class="b-eye" cx="210" cy="122" r="24" fill="url(#${u}e)"/>
      <ellipse cx="210" cy="122" rx="5" ry="15" fill="${OUT}"/>
      <path d="M176 92 L204 104 M244 92 L216 104" stroke="${OUT}" stroke-width="7" stroke-linecap="round"/>
    </g>
    </svg>`;
  };

  // ------------------------------------------------------------------
  // Map props
  // ------------------------------------------------------------------
  const sh = (cx, cy, rx) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${rx * 0.22}" fill="rgba(0,0,0,.22)"/>`;
  JQ.PROPS = {
    tree: `<svg viewBox="0 0 60 72">${sh(30, 68, 18)}<rect x="26" y="40" width="8" height="28" rx="3" fill="#7a4e2c"/><circle cx="30" cy="30" r="22" fill="#3f9b4a"/><circle cx="19" cy="37" r="14" fill="#4fb35a"/><circle cx="41" cy="35" r="14" fill="#47a852"/><circle cx="23" cy="21" r="8" fill="#8ad98a" opacity=".6"/></svg>`,
    bush: `<svg viewBox="0 0 60 40">${sh(30, 36, 22)}<circle cx="18" cy="26" r="12" fill="#3f9b4a"/><circle cx="34" cy="21" r="15" fill="#4fb35a"/><circle cx="46" cy="28" r="10" fill="#47a852"/><circle cx="30" cy="14" r="5" fill="#8ad98a" opacity=".6"/><circle cx="22" cy="24" r="2.5" fill="#ff6b8a"/><circle cx="40" cy="27" r="2.5" fill="#ffd34d"/></svg>`,
    flower: `<svg viewBox="0 0 40 40">${sh(20, 37, 10)}<path d="M20 36 V18" stroke="#3f8a3f" stroke-width="3"/><g transform="translate(20 15)"><circle r="5" cx="0" cy="-6" fill="#ff7aa8"/><circle r="5" cx="6" cy="0" fill="#ff7aa8"/><circle r="5" cx="0" cy="6" fill="#ff7aa8"/><circle r="5" cx="-6" cy="0" fill="#ff7aa8"/><circle r="4" fill="#ffd34d"/></g></svg>`,
    rock: `<svg viewBox="0 0 60 44">${sh(30, 40, 24)}<path d="M8 40 L14 18 L28 8 L44 14 L54 40Z" fill="#8f8a86"/><path d="M14 18 L28 8 L30 24 L8 40Z" fill="#b3ada7"/><path d="M28 8 L44 14 L36 26 L30 24Z" fill="#a19b95"/></svg>`,
    pine: `<svg viewBox="0 0 50 80">${sh(25, 76, 14)}<rect x="22" y="58" width="6" height="18" fill="#6b4226"/><path d="M25 4 L44 36 H6Z" fill="#2f7d4a"/><path d="M25 20 L46 52 H4Z" fill="#2a6f42"/><path d="M25 36 L48 66 H2Z" fill="#256339"/><path d="M25 4 L30 14 L20 14Z" fill="#7fcf8f" opacity=".6"/></svg>`,
    mushroom: `<svg viewBox="0 0 44 44">${sh(22, 41, 14)}<rect x="17" y="22" width="10" height="18" rx="4" fill="#f6ead2"/><path d="M4 24 Q4 6 22 6 Q40 6 40 24Z" fill="#e2483d"/><circle cx="14" cy="15" r="3" fill="#fff"/><circle cx="26" cy="11" r="2.5" fill="#fff"/><circle cx="32" cy="19" r="2.5" fill="#fff"/></svg>`,
    crystal: `<svg viewBox="0 0 50 56">${sh(25, 52, 18)}<path d="M14 52 L10 26 L18 12 L24 50Z" fill="#9b6bff"/><path d="M22 52 L22 16 L30 2 L36 18 L34 52Z" fill="#c49bff"/><path d="M30 2 L36 18 L34 52 L29 52Z" fill="#8a55f0"/><path d="M34 52 L38 30 L46 36 L42 52Z" fill="#a77bff"/></svg>`,
    peak: `<svg viewBox="0 0 80 60">${sh(40, 56, 34)}<path d="M4 56 L32 10 L46 30 L54 20 L76 56Z" fill="#7d8a7a"/><path d="M32 10 L40 23 L34 26 L28 21 L24 24Z" fill="#fff"/><path d="M54 20 L60 30 L52 28Z" fill="#fff"/></svg>`,
    mesa: `<svg viewBox="0 0 80 54">${sh(40, 50, 34)}<path d="M8 50 L16 14 H62 L72 50Z" fill="#c4743f"/><path d="M16 14 H62 L60 22 H18Z" fill="#e39a5a"/><path d="M12 34 H68" stroke="#a65a2e" stroke-width="3"/></svg>`,
    cactus: `<svg viewBox="0 0 40 56">${sh(20, 53, 12)}<rect x="15" y="10" width="10" height="44" rx="5" fill="#3f9b5a"/><path d="M15 32 H8 V20" stroke="#3f9b5a" stroke-width="7" stroke-linecap="round" fill="none"/><path d="M25 26 H32 V16" stroke="#3f9b5a" stroke-width="7" stroke-linecap="round" fill="none"/><circle cx="20" cy="9" r="3" fill="#ff7aa8"/></svg>`,
    bones: `<svg viewBox="0 0 44 30">${sh(22, 27, 16)}<circle cx="16" cy="16" r="9" fill="#efe4cc"/><circle cx="13" cy="15" r="2" fill="#5a4a3a"/><circle cx="19" cy="15" r="2" fill="#5a4a3a"/><path d="M26 22 L40 12" stroke="#efe4cc" stroke-width="4" stroke-linecap="round"/></svg>`,
    palm: `<svg viewBox="0 0 60 80">${sh(30, 76, 14)}<path d="M30 76 Q26 50 32 26" stroke="#8a5a34" stroke-width="7" fill="none"/><path d="M32 26 Q14 14 2 26 Q18 20 32 28Z M32 26 Q50 12 58 28 Q44 20 32 28Z M32 26 Q24 4 8 6 Q24 12 31 27Z M32 26 Q42 2 56 6 Q40 12 33 27Z" fill="#2f9b5a"/><circle cx="30" cy="30" r="4" fill="#8a5a34"/></svg>`,
    lava: `<svg viewBox="0 0 70 40">${sh(35, 36, 30)}<path d="M6 36 Q10 18 24 16 Q36 6 50 16 Q66 20 64 36Z" fill="#3a2226"/><path class="lava-glow" d="M16 32 Q24 22 34 28 Q42 18 52 30" stroke="#ff7a2a" stroke-width="3" fill="none"/><circle class="lava-glow" cx="30" cy="20" r="2.5" fill="#ffb347"/></svg>`,
    deadtree: `<svg viewBox="0 0 50 70">${sh(25, 66, 12)}<path d="M25 66 V30 M25 42 L12 28 M25 36 L38 20 M12 28 L8 18 M38 20 L44 14 M25 30 L22 12" stroke="#3a2a2a" stroke-width="5" stroke-linecap="round" fill="none"/></svg>`,
    // boards realm
    bpine: `<svg viewBox="0 0 50 80">${sh(25, 76, 14)}<rect x="22" y="58" width="6" height="18" fill="#3a3a5a"/><path d="M25 4 L44 36 H6Z" fill="#2a7f9a"/><path d="M25 20 L46 52 H4Z" fill="#236d88"/><path d="M25 36 L48 66 H2Z" fill="#1d5c78"/><path d="M25 4 L30 14 L20 14Z" fill="#bff4ff" opacity=".7"/></svg>`,
    books: `<svg viewBox="0 0 50 46">${sh(25, 43, 20)}<rect x="8" y="30" width="34" height="11" rx="2" fill="#b5443b"/><rect x="11" y="20" width="30" height="10" rx="2" fill="#2e8b57"/><rect x="7" y="10" width="32" height="10" rx="2" fill="#30519e"/><path d="M36 30 V41 M38 20 V30 M34 10 V20" stroke="#f3ead2" stroke-width="3"/></svg>`,
    lantern: `<svg viewBox="0 0 30 70">${sh(15, 67, 9)}<rect x="13" y="22" width="4" height="44" fill="#2a3550"/><rect x="6" y="6" width="18" height="18" rx="4" fill="#ffe28a" class="lava-glow"/><path d="M4 6 H26 L22 0 H8Z" fill="#2a3550"/><rect x="6" y="22" width="18" height="3" fill="#2a3550"/></svg>`,
    bcrystal: `<svg viewBox="0 0 50 56">${sh(25, 52, 18)}<path d="M14 52 L10 26 L18 12 L24 50Z" fill="#3fd4ff"/><path d="M22 52 L22 16 L30 2 L36 18 L34 52Z" fill="#9ff0ff"/><path d="M30 2 L36 18 L34 52 L29 52Z" fill="#26a8d8"/><path d="M34 52 L38 30 L46 36 L42 52Z" fill="#5fe0ff"/></svg>`,
    scroll: `<svg viewBox="0 0 50 30">${sh(25, 27, 18)}<rect x="8" y="8" width="34" height="16" rx="3" fill="#f6efdc"/><circle cx="8" cy="16" r="6" fill="#e6d9b8"/><circle cx="42" cy="16" r="6" fill="#e6d9b8"/><path d="M14 13 H36 M14 18 H30" stroke="#b9a98a" stroke-width="2"/></svg>`,
    shell: `<svg viewBox="0 0 40 30">${sh(20, 27, 14)}<path d="M6 26 Q6 6 20 4 Q34 6 34 26Z" fill="#ffb3c7"/><path d="M20 4 V26 M12 8 L14 26 M28 8 L26 26" stroke="#e07a98" stroke-width="2"/></svg>`,
    bpeak: `<svg viewBox="0 0 80 60">${sh(40, 56, 34)}<path d="M4 56 L32 10 L46 30 L54 20 L76 56Z" fill="#3f5a8a"/><path d="M32 10 L40 23 L34 26 L28 21 L24 24Z" fill="#e6f6ff"/><path d="M54 20 L60 30 L52 28Z" fill="#e6f6ff"/></svg>`,
    coral: `<svg viewBox="0 0 50 50">${sh(25, 47, 16)}<path d="M25 46 V24 M25 30 Q14 26 12 12 M25 28 Q36 22 38 8 M12 20 Q6 16 6 10 M38 16 Q44 14 46 8" stroke="#ff7a9a" stroke-width="5" stroke-linecap="round" fill="none"/></svg>`,
    castle: `<svg viewBox="0 0 72 62">${sh(36, 58, 30)}<rect x="12" y="28" width="48" height="30" fill="#d8c3a0" stroke="#4a3120" stroke-width="2"/><rect x="6" y="14" width="16" height="44" fill="#cdb592" stroke="#4a3120" stroke-width="2"/><rect x="50" y="14" width="16" height="44" fill="#cdb592" stroke="#4a3120" stroke-width="2"/><path d="M6 14 v-5 h4 v5 h4 v-5 h4 v5 h4 v-5 M50 14 v-5 h4 v5 h4 v-5 h4 v5 h4 v-5 M22 28 v-4 h5 v4 h6 v-4 h5 v4 h6 v-4 h5 v4" fill="none" stroke="#4a3120" stroke-width="2"/><path d="M29 58 v-12 a7 7 0 0 1 14 0 v12Z" fill="#3a2414"/><path d="M58 9 V-2 M58 -2 h10 l-3 3 l3 3 h-10" fill="#b3261e" stroke="#4a3120" stroke-width="1.5"/><rect x="11" y="24" width="4" height="7" fill="#3a2414"/><rect x="57" y="24" width="4" height="7" fill="#3a2414"/></svg>`,
    tower: `<svg viewBox="0 0 34 76">${sh(17, 73, 12)}<rect x="7" y="22" width="20" height="50" fill="#d2bc98" stroke="#4a3120" stroke-width="2"/><path d="M4 24 L17 2 L30 24Z" fill="#8e1b1b" stroke="#4a3120" stroke-width="2"/><rect x="14" y="34" width="6" height="10" rx="3" fill="#3a2414"/><path d="M7 52 H27 M7 62 H27" stroke="#9c8462" stroke-width="1.5"/></svg>`,
    tent: `<svg viewBox="0 0 56 46">${sh(28, 43, 22)}<path d="M4 42 L28 8 L52 42Z" fill="#e8d6b0" stroke="#4a3120" stroke-width="2"/><path d="M16 42 L28 8 L22 42 M40 42 L28 8 L34 42" fill="#8e1b1b" stroke="#4a3120" stroke-width="1.5"/><path d="M24 42 L28 26 L32 42Z" fill="#3a2414"/><path d="M28 8 V-2 M28 -2 h9 l-3 3 l3 3 h-9" fill="#d9a441" stroke="#4a3120" stroke-width="1.5"/></svg>`,
    icewall: `<svg viewBox="0 0 96 50"><defs><linearGradient id="iw" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#8fbfe0"/></linearGradient></defs>${sh(48, 47, 42)}<path d="M4 46 L6 12 L20 8 L34 12 L48 6 L62 11 L78 7 L92 12 L92 46Z" fill="url(#iw)" stroke="#3c6a92" stroke-width="2"/><path d="M18 14 L16 44 M40 10 L42 44 M64 12 L60 44 M82 10 L84 44" stroke="#6fa3cc" stroke-width="1.5"/><path d="M6 12 L20 8 L34 12 L48 6 L62 11 L78 7 L92 12 L92 16 Q48 12 6 17Z" fill="#fff"/></svg>`,
    pillar: `<svg viewBox="0 0 36 76">${sh(18, 72, 14)}<rect x="6" y="66" width="24" height="7" rx="2" fill="#9fb0d0"/><rect x="9" y="14" width="18" height="52" fill="#c9d6ee"/><path d="M14 16 V64 M22 16 V64" stroke="#9fb0d0" stroke-width="2"/><rect x="5" y="8" width="26" height="7" rx="2" fill="#9fb0d0"/><path d="M5 8 L9 0 H27 L31 8Z" fill="#c9d6ee"/></svg>`,
  };

  // ------------------------------------------------------------------
  // UI icons
  // ------------------------------------------------------------------
  JQ.ICON = {
    flame: `<svg viewBox="0 0 24 24"><path d="M12 2c1 4 6 6 6 12a6 6 0 0 1-12 0c0-3 2-5 3-6 0 2 1 3 2 3 0-3-1-6 1-9z" fill="#ff7a2a"/><path d="M12 11c1 2 3 3 3 5.5a3 3 0 0 1-6 0c0-1.5 1-2.5 1.5-3 0 1 .5 1.5 1 1.5 0-1.5-.3-2.5.5-4z" fill="#ffd34d"/></svg>`,
    hourglass: `<svg viewBox="0 0 24 24"><path d="M6 2h12v2c0 4-4 6-4 8s4 4 4 8v2H6v-2c0-4 4-6 4-8S6 8 6 4z" fill="#ffe7a8" stroke="#a8670b" stroke-width="1.6"/><path d="M8.5 19c0-2 3.5-3.5 3.5-5.5 0 2 3.5 3.5 3.5 5.5z" fill="#ffb22e"/><rect x="4.5" y="1" width="15" height="2.6" rx="1.2" fill="#a8670b"/><rect x="4.5" y="20.4" width="15" height="2.6" rx="1.2" fill="#a8670b"/></svg>`,
    chest: `<svg viewBox="0 0 24 24"><rect x="3" y="10" width="18" height="11" rx="2" fill="#b5651d" stroke="#6b3a10" stroke-width="1.2"/><path d="M3 11a9 6 0 0 1 18 0z" fill="#d9822b" stroke="#6b3a10" stroke-width="1.2"/><rect x="3" y="11" width="18" height="2.2" fill="#ffd24a"/><rect x="10.5" y="10" width="3" height="5" rx="1" fill="#ffd24a" stroke="#6b3a10" stroke-width=".8"/></svg>`,
    crown: `<svg viewBox="0 0 24 24"><path d="M3 18 L4 7 L9 12 L12 4 L15 12 L20 7 L21 18Z" fill="#ffd34d" stroke="#a8670b" stroke-width="1.4"/><rect x="3" y="18" width="18" height="3" rx="1" fill="#e0a21b"/><circle cx="12" cy="14" r="1.8" fill="#ff3d55"/></svg>`,
    flag: `<svg viewBox="0 0 24 24"><rect x="4" y="2" width="2.4" height="20" rx="1" fill="#6b4a2a"/><path d="M6.4 3h13l-3 4 3 4h-13z" fill="#ff4d5e" stroke="#8e1f2c" stroke-width="1"/></svg>`,
    swords: `<svg viewBox="0 0 24 24"><path d="M4 3 L14 13 M20 3 L10 13" stroke="#e6edf3" stroke-width="2.6" stroke-linecap="round"/><path d="M12 15 L6 21 M12 15 L18 21 M9 12 L5 16 M15 12 L19 16" stroke="#ffcf4a" stroke-width="2.4" stroke-linecap="round"/></svg>`,
    skull: `<svg viewBox="0 0 24 24"><path d="M12 2c5 0 8 3.5 8 8 0 3-1.5 4.5-3 5.5V19h-2v-2h-2v2h-2v-2H9v2H7v-3.5C5.5 14.5 4 13 4 10c0-4.5 3-8 8-8z" fill="#f4ead2" stroke="#3a1a2a" stroke-width="1.2"/><circle cx="8.6" cy="10.5" r="2.2" fill="#c8102e"/><circle cx="15.4" cy="10.5" r="2.2" fill="#c8102e"/></svg>`,
    shield: `<svg viewBox="0 0 24 24"><path d="M12 2 L20 5 V11 C20 16 16 20 12 22 C8 20 4 16 4 11 V5Z" fill="#4fe3ff" stroke="#0b5c8a" stroke-width="1.4"/><path d="M12 6 L13.5 10 H17.5 L14.3 12.6 L15.5 16.5 L12 14.2 L8.5 16.5 L9.7 12.6 L6.5 10 H10.5Z" fill="#fff"/></svg>`,
    lock: `<svg viewBox="0 0 24 24"><rect x="5" y="10" width="14" height="11" rx="2.5" fill="#d9d2c4" stroke="#5a5248" stroke-width="1.3"/><path d="M8 10V7a4 4 0 0 1 8 0v3" stroke="#5a5248" stroke-width="2.2" fill="none"/><circle cx="12" cy="15.5" r="1.8" fill="#5a5248"/></svg>`,
    gear: `<svg viewBox="0 0 24 24"><path d="M10.3 2h3.4l.5 2.6 1.9.8 2.2-1.5 2.4 2.4-1.5 2.2.8 1.9 2.6.5v3.4l-2.6.5-.8 1.9 1.5 2.2-2.4 2.4-2.2-1.5-1.9.8-.5 2.6h-3.4l-.5-2.6-1.9-.8-2.2 1.5-2.4-2.4 1.5-2.2-.8-1.9L2 13.7v-3.4l2.6-.5.8-1.9-1.5-2.2 2.4-2.4 2.2 1.5 1.9-.8z" fill="currentColor"/><circle cx="12" cy="12" r="3.4" fill="var(--bg)"/></svg>`,
    star: `<svg viewBox="0 0 24 24"><path d="M12 2l2.9 6.3 6.9.7-5.2 4.6 1.5 6.8L12 17l-6.1 3.4 1.5-6.8L2.2 9l6.9-.7z"/></svg>`,
    check: `<svg viewBox="0 0 24 24"><path d="M4 12.5l5 5L20 6.5" stroke="currentColor" stroke-width="3.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    left: `<svg viewBox="0 0 24 24"><path d="M15 4l-8 8 8 8" stroke="currentColor" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    right: `<svg viewBox="0 0 24 24"><path d="M9 4l8 8-8 8" stroke="currentColor" stroke-width="3" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    close: `<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="3" stroke-linecap="round"/></svg>`,
    target: `<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2.4"/><circle cx="12" cy="12" r="4" fill="currentColor"/></svg>`,
  };
  // ------------------------------------------------------------------
  // House sigils (original): Flame for JEE, Frost for Boards
  // ------------------------------------------------------------------
  JQ.sigilSVG = function (kind) {
    const P = PAL[kind] || PAL.jee;
    const bg = kind === 'boards' ? '#1b2a40' : '#5a0f12';
    const fg = kind === 'boards' ? '#e6f3fb' : '#f2c25a';
    return `<svg viewBox="0 0 40 48" aria-hidden="true"><path d="M3 3 H37 V30 Q37 42 20 46 Q3 42 3 30Z" fill="${bg}" stroke="${P.trim}" stroke-width="2.5"/><path d="M7 7 H33 V29 Q33 38 20 41.5 Q7 38 7 29Z" fill="none" stroke="${P.trim}" stroke-width="1" opacity=".5"/><g transform="translate(20 23) scale(.85)" fill="${fg}" stroke="${fg}">${P.emblem}</g></svg>`;
  };
})();
