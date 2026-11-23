/* Throne of Ranks — the traveller's cartoon face for the day bubbles.
   Curly dark hair, black rectangular glasses, stubble, grey tee and a silver chain.
   mood: 'sad' (nothing done yet) · 'calm' (a future day) · 'smile' (some goals done) · 'joy' (all goals done) */
(function () {
  'use strict';
  const JQ = (window.JQ = window.JQ || {});
  const INK = '#1b1b1b', SKIN = '#f2c48d', HAIR = '#3a2a20';
  const cache = {};
  // curly hair = a cloud of overlapping curls: outline pass, then fill pass (clean bumpy silhouette)
  const curls = (pts, extra) => `<g fill="${INK}">${pts.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r + 2}"/>`).join('')}</g><g fill="${HAIR}">${pts.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}"/>`).join('')}${extra || ''}</g>`;
  const BACK = [[22, 44, 5.5], [20, 35, 7], [23, 25, 8.5], [32, 16, 9], [44, 12, 9.5], [57, 11.5, 9.5], [68, 15, 9], [77, 23, 8.5], [80, 33, 7], [78, 43, 5.5], [50, 24, 12], [34, 26, 9], [66, 26, 9]];
  const FRINGE = [[29, 29, 5.5], [37, 25.5, 6], [46.5, 24, 6.2], [56, 24.5, 6.2], [64.5, 26.5, 5.8], [71.5, 30, 5]];

  const brows = {
    sad: '<path d="M32 39 L44 34.5"/><path d="M56 34.5 L68 39"/>',
    calm: '<path d="M32 36.5 Q38 34 44 36"/><path d="M56 36 Q62 34 68 36.5"/>',
    smile: '<path d="M32 35.5 Q38 31 44 34"/><path d="M56 34 Q62 31 68 35.5"/>',
    joy: '<path d="M32 33.5 Q38 28 44 32"/><path d="M56 32 Q62 28 68 33.5"/>',
  };
  const eye = (cx, mood) => {
    if (mood === 'joy') return `<path d="M${cx - 4.6} 47.5 Q${cx} 41.5 ${cx + 4.6} 47.5" fill="none" stroke="${INK}" stroke-width="2.6" stroke-linecap="round"/>`;
    if (mood === 'sad') return `<ellipse cx="${cx}" cy="46.6" rx="4.6" ry="2.9" fill="#fff"/><circle cx="${cx}" cy="47.6" r="2" fill="${INK}"/>
      <path d="M${cx - 5} ${cx < 50 ? 45.4 : 43.6} L${cx + 5} ${cx < 50 ? 43.6 : 45.4}" stroke="${INK}" stroke-width="2.2" stroke-linecap="round"/>`;
    if (mood === 'calm') return `<ellipse cx="${cx}" cy="46.4" rx="4.8" ry="2.6" fill="#fff"/><circle cx="${cx + 1}" cy="46.8" r="2.1" fill="${INK}"/>
      <path d="M${cx - 5} 45 L${cx + 5} 45" stroke="${INK}" stroke-width="2.3" stroke-linecap="round"/>`;
    return `<ellipse cx="${cx}" cy="45.8" rx="4.4" ry="3.6" fill="#fff"/><circle cx="${cx + 0.6}" cy="46" r="2.3" fill="${INK}"/><circle cx="${cx + 1.4}" cy="45" r=".7" fill="#fff"/>
      <path d="M${cx - 4.6} 43.4 Q${cx} 41.6 ${cx + 4.6} 43.4" fill="none" stroke="${INK}" stroke-width="1.6" stroke-linecap="round"/>`;
  };
  const mouth = {
    sad: `<path d="M42 63.5 Q50 57.5 58 63.5" fill="none" stroke="${INK}" stroke-width="2.4" stroke-linecap="round"/>`,
    calm: `<path d="M43 60 Q51 63 58 58.4" fill="none" stroke="${INK}" stroke-width="2.3" stroke-linecap="round"/>`,
    smile: `<path d="M41 58.5 Q50 66.5 59 58.5" fill="none" stroke="${INK}" stroke-width="2.4" stroke-linecap="round"/>`,
    joy: `<path d="M39.5 57.5 Q50 72 60.5 57.5 Z" fill="#7a2b2b" stroke="${INK}" stroke-width="2.2" stroke-linejoin="round"/>
      <path d="M41.5 58.4 Q50 61.4 58.5 58.4 L57.6 60.6 Q50 63.4 42.4 60.6 Z" fill="#fff"/>
      <path d="M45 66 Q50 63.2 55 66 Q50 68.6 45 66 Z" fill="#e0646a"/>`,
  };
  const extras = {
    sad: '<path d="M70.5 50 Q73 54.5 70.5 56.4 Q68 54.5 70.5 50 Z" fill="#7fc8ff" stroke="#3b82c4" stroke-width=".8"/>',
    calm: '',
    smile: '<ellipse cx="32.5" cy="55.5" rx="4" ry="2.4" fill="#ff8f8f" opacity=".45"/><ellipse cx="67.5" cy="55.5" rx="4" ry="2.4" fill="#ff8f8f" opacity=".45"/>',
    joy: '<ellipse cx="32" cy="55.5" rx="4.6" ry="2.8" fill="#ff7f7f" opacity=".55"/><ellipse cx="68" cy="55.5" rx="4.6" ry="2.8" fill="#ff7f7f" opacity=".55"/>' +
      '<path d="M86 18 L88 23 L93 25 L88 27 L86 32 L84 27 L79 25 L84 23 Z" fill="#ffd166"/><path d="M13 26 L14.4 29.6 L18 31 L14.4 32.4 L13 36 L11.6 32.4 L8 31 L11.6 29.6 Z" fill="#ffd166"/>',
  };

  JQ.avatarSVG = function (mood) {
    mood = brows[mood] ? mood : 'calm';
    if (cache[mood]) return cache[mood];
    const svg = `<svg class="av av-${mood}" viewBox="0 0 100 100" aria-hidden="true">
      <path d="M5 106 C7 85 22 77.5 36 75.5 L64 75.5 C78 77.5 93 85 95 106 Z" fill="#8e9096" stroke="${INK}" stroke-width="2.2"/>
      <ellipse cx="24" cy="92" rx="6" ry="4" fill="#a6a8ae" opacity=".7"/><ellipse cx="73" cy="90" rx="7" ry="4" fill="#7c7e84" opacity=".6"/><ellipse cx="58" cy="97" rx="5" ry="3" fill="#a6a8ae" opacity=".6"/>
      <path d="M40 63 L40 77 Q50 83 60 77 L60 63 Z" fill="#e2ad7c" stroke="${INK}" stroke-width="2"/>
      <path d="M37.5 76 Q50 93 62.5 76" fill="none" stroke="#5c5c5c" stroke-width="2.8"/><path d="M37.5 76 Q50 93 62.5 76" fill="none" stroke="#f4f4f4" stroke-width="1.5" stroke-dasharray="1.6 .8"/>
      ${curls(BACK, '<rect x="21" y="34" width="58" height="18"/>')}
      <ellipse cx="25" cy="50" rx="5" ry="7" fill="${SKIN}" stroke="${INK}" stroke-width="2"/><ellipse cx="75" cy="50" rx="5" ry="7" fill="${SKIN}" stroke="${INK}" stroke-width="2"/>
      <path d="M27 38 C27 27 37 22.5 50 22.5 C63 22.5 73 27 73 38 L73 52 C73 64 62 72 50 72 C38 72 27 64 27 52 Z" fill="${SKIN}" stroke="${INK}" stroke-width="2.2"/>
      <path d="M30 55 C33 66 42 71 50 71 C58 71 67 66 70 55 C64 61.5 58 63.5 50 63.5 C42 63.5 36 61.5 30 55 Z" fill="#c98e5e" opacity=".42"/>
      ${curls(FRINGE)}
      <g fill="none" stroke="#7a6152" stroke-width="1.4" stroke-linecap="round"><path d="M22 24 Q27 19 32 22"/><path d="M38 11 Q44 7 49 10"/><path d="M57 9 Q63 7 67 11"/><path d="M73 17 Q78 19 80 24"/><path d="M18 34 Q21 31 24 33"/><path d="M76 31 Q80 33 81 37"/><path d="M33 24 Q37 21 41 23"/><path d="M49 20 Q53 17 57 20"/><path d="M61 22 Q65 20 68 24"/></g>
      <g fill="none" stroke="${INK}" stroke-width="1.6" stroke-linecap="round"><path d="M42 29 C40.5 32 42 34.5 44.5 33.5"/><path d="M59 29.5 C60.8 32 59.5 34.5 57 34"/></g>
      <g fill="none" stroke="${INK}" stroke-width="3.4" stroke-linecap="round">${brows[mood]}</g>
      ${eye(38.5, mood)}${eye(61.5, mood)}
      <g fill="rgba(255,255,255,.14)" stroke="#20212e" stroke-width="3.2"><rect x="29.5" y="39" width="18" height="13" rx="3.2"/><rect x="52.5" y="39" width="18" height="13" rx="3.2"/></g>
      <path d="M47.5 44 L52.5 44 M29.5 43 L24.5 42 M70.5 43 L75.5 42" stroke="#20212e" stroke-width="2.6" stroke-linecap="round"/>
      <circle cx="31.6" cy="41" r=".9" fill="#c9ccd6"/><circle cx="68.4" cy="41" r=".9" fill="#c9ccd6"/>
      <path d="M47.5 53 Q50 56 52.5 53" fill="none" stroke="${INK}" stroke-width="1.6" stroke-linecap="round"/>
      ${mouth[mood]}${extras[mood]}
    </svg>`;
    return (cache[mood] = svg);
  };
})();
