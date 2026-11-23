/* ============================================================
   JEE Quest — app logic
   ============================================================ */
(function () {
  'use strict';
  const JQ = window.JQ;
  const { STAGES, ICON } = JQ;

  // ---------------- utils ----------------
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const MS = 86400000;
  const pad = (n) => String(n).padStart(2, '0');
  const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const MONL = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const WK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const WKL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  function parseD(s) { const [y, m, d] = String(s).split('-').map(Number); return new Date(y, (m || 1) - 1, d || 1); }
  function iso(d) { return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()); }
  function dnum(d) { return Math.round(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / MS); }
  function diff(a, b) { return dnum(b) - dnum(a); }
  function addDays(d, n) { return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n); }
  const fmtShort = (d) => `${d.getDate()} ${MON[d.getMonth()]}`;
  const fmtLong = (d) => `${WK[d.getDay()]}, ${d.getDate()} ${MON[d.getMonth()]} ${d.getFullYear()}`;
  function hash(n, salt) { let x = (n * 2654435761 + salt * 40503) >>> 0; x ^= x >>> 15; x = Math.imul(x, 2246822519) >>> 0; x ^= x >>> 13; return x >>> 0; }
  function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

  // `?today=2027-01-20` lets you time-travel for testing.
  const TODAY_OVERRIDE = new URLSearchParams(location.search).get('today');
  function now() {
    const n = new Date();
    if (TODAY_OVERRIDE && /^\d{4}-\d{2}-\d{2}$/.test(TODAY_OVERRIDE)) {
      const t = parseD(TODAY_OVERRIDE); t.setHours(n.getHours(), n.getMinutes(), n.getSeconds()); return t;
    }
    return n;
  }

  // ---------------- state ----------------
  const KEY = 'jeeQuest.v1';
  function load() {
    let s = {};
    try { s = JSON.parse(localStorage.getItem(KEY)) || {}; } catch (e) { s = {}; }
    const D = JSON.parse(JSON.stringify(JQ.DEFAULTS));
    const c = s.cfg || {};
    const boards = Object.assign(D.boards, c.boards || {});
    if (!Array.isArray(boards.subjects) || !boards.subjects.length) boards.subjects = D.boards.subjects;
    return {
      cfg: { name: c.name || D.name, jee: Object.assign(D.jee, c.jee || {}), boards },
      checks: Object.assign({ jee: {}, boards: {} }, s.checks || {}),
      plans: Object.assign({ jee: {}, boards: {} }, s.plans || {}),
      track: 'jee', // JEE Main only
      seen: Object.assign({ jee: null, boards: null }, s.seen || {}),
      battleSeen: s.battleSeen || {},
      welcomed: !!s.welcomed,
    };
  }
  let S = load();
  function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { /* storage unavailable */ } }

  // ---------------- track model ----------------
  function buildTrack(kind) {
    const c = S.cfg;
    let start, end, exams;
    if (kind === 'jee') {
      start = parseD(c.jee.start); end = parseD(c.jee.exam);
      exams = [{ date: end, name: 'JEE Main', short: 'JEE', boss: true }];
    } else {
      let subs = c.boards.subjects.filter((s) => s.on && s.date).map((s) => Object.assign({}, s, { d: parseD(s.date) }));
      if (!subs.length) subs = [Object.assign({}, JQ.DEFAULTS.boards.subjects[0], { d: parseD(JQ.DEFAULTS.boards.subjects[0].date) })];
      subs.sort((a, b) => a.d - b.d);
      start = parseD(c.boards.start); end = subs[subs.length - 1].d;
      exams = subs.map((s, i) => ({ date: s.d, name: s.name, short: s.short || s.name.slice(0, 4), boss: i === subs.length - 1 }));
    }
    if (diff(start, end) < 7) start = addDays(end, -60);
    const total = diff(start, end);
    const ti = diff(start, now());
    const zones = JQ.ZONES[kind];
    const days = [];
    for (let i = 0; i <= total; i++) {
      const date = addDays(start, i);
      const p = i / total;
      const exam = exams.find((e) => diff(e.date, date) === 0) || null;
      days.push({
        i, date, p, stage: JQ.stageFor(p), exam, dleft: total - i,
        zone: Math.min(zones.length - 1, Math.floor((i * zones.length) / (total + 1))),
        mock: !exam && date.getDay() === 0 && total - i > 3 && i > 0,
        ms: [],
      });
    }
    days.forEach((d) => {
      if (d.i > 0 && d.stage > days[d.i - 1].stage) d.ms.push({ type: 'crown', label: `Evolves into ${STAGES[d.stage].name}` });
      if (d.i > 0 && d.i % 7 === 0 && !d.exam) d.ms.push({ type: 'chest', label: `Week ${d.i / 7} — spoils of war` });
      [[0.25, 'Quarter Mark'], [0.5, 'Halfway Hall'], [0.75, 'Final Stretch']].forEach(([f, l]) => { if (d.i === Math.round(total * f)) d.ms.push({ type: 'flag', label: l }); });
      if ([30, 10, 7, 1].includes(d.dleft)) d.ms.push({ type: 'flag', label: d.dleft === 1 ? 'Eve of battle' : `D-${d.dleft} checkpoint` });
    });
    return { kind, start, end, total, ti, idx: clamp(ti, 0, total), days, exams, zones };
  }

  let T = null;
  const curP = () => (T.ti < 0 ? 0 : clamp(T.ti / T.total, 0, 1));
  const curStage = () => JQ.stageFor(curP());

  function status(d) {
    if (d.i === T.ti) return 'today';
    if (d.i < T.ti) return S.checks[T.kind][iso(d.date)] ? 'done' : 'missed';
    return 'future';
  }
  function streak(kind) {
    const ch = S.checks[kind]; let n = 0; let d = now();
    if (!ch[iso(d)]) d = addDays(d, -1);
    while (ch[iso(d)]) { n++; d = addDays(d, -1); }
    return n;
  }
  function bestStreak(kind) {
    const keys = Object.keys(S.checks[kind]).sort(); let best = 0, run = 0, prev = null;
    keys.forEach((k) => { const d = parseD(k); run = prev && diff(prev, d) === 1 ? run + 1 : 1; best = Math.max(best, run); prev = d; });
    return best;
  }
  function doneCount() { let n = 0; for (let i = 0; i <= Math.min(T.ti, T.total); i++) if (S.checks[T.kind][iso(T.days[i].date)]) n++; return n; }
  function nextExam() { const t = now(); return T.exams.find((e) => diff(t, e.date) >= 0) || null; }

  // ---------------- quests ----------------
  function quest(d) {
    if (T.kind === 'jee') {
      if (d.exam) return { sub: 'Boss', text: 'JEE Main — the Boss Battle. Read every question twice, attempt smart, trust your training.' };
      if (d.dleft === 1) return { sub: 'Rest', text: 'Light revision only. Pack admit card + photo ID, check the centre route, sleep by 10 PM.' };
      const sub = JQ.SUBJ[d.i % 3];
      if (d.dleft <= 7) return { sub, text: `Revision raid: ${sub} formula sheet + mistake notebook + one 1-hour timed sectional.` };
      if (d.mock) return { sub: 'Mock Test', text: 'Sunday Mock Test: a full 3-hour paper at 9 AM sharp, then 1 hour of honest analysis.' };
      const list = JQ.TOPICS[sub];
      const topic = list[hash(d.i, sub.length) % list.length];
      return { sub, text: JQ.JEE_TASKS[hash(d.i, 7) % JQ.JEE_TASKS.length].replace('{t}', topic) };
    }
    if (d.exam) return { sub: d.exam.name, text: `${d.exam.name} board exam — Guardian Gate! Neat presentation, label every diagram, attempt everything.` };
    const nx = T.exams.find((e) => diff(d.date, e.date) > 0);
    if (nx && diff(d.date, nx.date) === 1) return { sub: nx.name, text: `Final revision for ${nx.name}: formulae, derivations, diagrams and last year's paper. Sleep early.` };
    const dj = diff(d.date, parseD(S.cfg.jee.exam));
    if (dj >= -1 && dj <= 3) return { sub: 'JEE week', text: 'JEE battle week — keep Boards to a light 30-minute NCERT skim. Focus on the Hydra.' };
    if (d.mock) return { sub: 'Sample Paper', text: 'Sample Paper Sunday: one full CBSE sample paper in 3 hours, then check against the marking scheme.' };
    const inExams = diff(T.exams[0].date, d.date) >= 0;
    const sub = inExams && nx ? nx.name : T.exams[d.i % T.exams.length].name;
    const list = JQ.BOARD_TOPICS[sub] || ['Full syllabus revision'];
    const topic = list[hash(d.i, sub.length) % list.length];
    return { sub, text: JQ.BOARD_TASKS[hash(d.i, 11) % JQ.BOARD_TASKS.length].replace('{t}', topic) };
  }
  function quoteFor(d) { return JQ.QUOTES[hash(dnum(d.date), 3) % JQ.QUOTES.length].replace('{n}', d.i + 1); }

  // ---------------- HUD ----------------
  function renderHUD() {
    const p = curP(), s = curStage();
    const lvl = clamp(T.ti + 1, 1, T.total + 1);
    $('#hudBadge').innerHTML = `
      <div class="hb-ava">${JQ.warriorSVG(s, T.kind, { bust: true })}</div>
      <div class="hb-lvl" title="Level"><span>${T.ti < 0 ? 0 : lvl}</span></div>
      <div class="hb-meta"><div class="hb-name">${esc(S.cfg.name)} · <em>${STAGES[s].name}</em></div>
      <div class="xpbar" title="Journey progress"><i style="width:${(p * 100).toFixed(1)}%"></i><span>${Math.round(p * 100)}%</span></div></div>`;
    const st = streak(T.kind);
    let left, leftLbl;
    if (T.kind === 'jee') { left = Math.max(0, T.total - T.ti); leftLbl = 'to JEE'; }
    else { const nx = nextExam(); left = nx ? diff(now(), nx.date) : 0; leftLbl = nx ? `to ${nx.short}` : 'done'; }
    const chests = T.days.filter((d) => d.i <= T.ti && d.ms.some((m) => m.type === 'chest')).length;
    const chestsAll = T.days.filter((d) => d.ms.some((m) => m.type === 'chest')).length;
    $('#hudPills').innerHTML = `
      <div class="pill" title="Daily quest streak"><i class="pi">${ICON.flame}</i><b>${st}</b><small>streak</small></div>
      <div class="pill" title="Days remaining"><i class="pi">${ICON.hourglass}</i><b>${left}</b><small>${leftLbl}</small></div>
      <div class="pill hide-xs" title="Weekly chests unlocked"><i class="pi">${ICON.chest}</i><b>${chests}</b><small>/${chestsAll}</small></div>`;
    $$('.tab').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.track === S.track)));
    document.documentElement.style.setProperty('--hud-h', $('#hud').offsetHeight + 'px');
  }

  // ---------------- Side panel ----------------
  function renderSide() {
    const p = curP(), s = curStage(), st = STAGES[s];
    const today = T.days[T.idx];
    const before = T.ti < 0, after = T.ti > T.total;
    const nextStage = STAGES[s + 1];
    let nextTxt = 'Final form reached — go claim your rank.';
    if (nextStage) {
      const dEvo = T.days.find((d) => d.stage === s + 1);
      const n = dEvo ? dEvo.i - Math.max(T.ti, 0) : 0;
      nextTxt = `Evolves into <b>${nextStage.name}</b> in <b>${n}</b> day${n === 1 ? '' : 's'}`;
    }
    const total = Math.max(1, Math.min(T.ti, T.total) + 1);
    const done = doneCount();
    const power = Math.round(10 + p * 90);
    const focus = T.ti < 0 ? 0 : Math.round((done / total) * 100);
    const courage = Math.min(100, streak(T.kind) * 8 + (s * 6));
    const scale = (0.6 + 0.4 * p).toFixed(3);
    const q = quest(today);
    const checked = !!S.checks[T.kind][iso(today.date)];
    const isJee = T.kind === 'jee';

    const evoDots = STAGES.map((x, i) => `<li class="${i < s ? 'past' : i === s ? 'cur' : ''}"><i>${i + 1}</i><span>${x.name}</span></li>`).join('');

    let goalCard = '';
    if (isJee) {
      const win = S.cfg.jee.window.map((w) => `<span class="chip${w === S.cfg.jee.exam ? ' on' : ''}">${fmtShort(parseD(w))}</span>`).join('');
      goalCard = `<div class="card cd-card">
        <div class="cd-head"><span class="eyebrow">${after ? 'The siege is won' : 'The Final Siege · JEE Main'}</span><span class="cd-date">${fmtLong(T.end)} · 9:00 AM</span></div>
        <div class="cd-digits" id="cdDigits"></div>
        <div class="cd-win"><span class="mut">Session 1 window</span><div class="chips">${win}</div></div>
      </div>`;
    } else {
      const t = now();
      const rows = T.exams.map((e) => {
        const n = diff(t, e.date);
        const cls = n < 0 ? 'past' : n === 0 ? 'today' : '';
        return `<li class="${cls}"><i class="gi">${n < 0 ? ICON.check : e.boss ? ICON.skull : ICON.shield}</i><span class="gn">${esc(e.name)}</span><span class="gd">${fmtShort(e.date)}</span><b class="gl">${n < 0 ? 'Cleared' : n === 0 ? 'TODAY' : 'D-' + n}</b></li>`;
      }).join('');
      goalCard = `<div class="card cd-card">
        <div class="cd-head"><span class="eyebrow">Next Gate to Storm</span><span class="cd-date" id="cdNextName"></span></div>
        <div class="cd-digits" id="cdDigits"></div>
        <ul class="gates">${rows}</ul>
      </div>`;
    }

    $('#side').innerHTML = `
      <div class="card hero-card" id="heroCard">
        <div class="hc-top">
          <span class="stage-chip sigil" title="${JQ.HOUSE[T.kind]}">${JQ.sigilSVG(T.kind)}</span>
          <div class="hc-title"><h2>${st.name}</h2><span>${st.title}</span></div>
          <button class="btn mini" id="btnPreviewBoss" title="Preview the final battle">${ICON.swords}<span>Boss</span></button>
        </div>
        <div class="stage3d" id="stage3d">
          <div class="rays"></div>
          <div class="ghost-wrap" title="Your final form">${JQ.warriorSVG(5, T.kind, { ghost: true })}</div>
          <div class="pedestal"><i class="ped-top"></i><i class="ped-side"></i><i class="ped-rune"></i></div>
          <div class="w-holder" style="--sc:${scale}">${JQ.warriorSVG(s, T.kind)}</div>
          <div class="motes">${'<i></i>'.repeat(10)}</div>
        </div>
        <div class="hc-name"><b>${esc(S.cfg.name)}</b> · ${JQ.HOUSE[T.kind]}</div><div class="hc-sub">Rank ${s + 1} of 6 · Day ${before ? 0 : T.idx + 1} of ${T.total + 1}</div>
        <ol class="evo-track">${evoDots}</ol>
        <div class="evo-next">${before ? `Your journey begins in <b>${-T.ti}</b> days` : nextTxt}</div>
        <div class="stats">
          ${statBar('Power', power, 'Grows every single day of the countdown')}
          ${statBar('Focus', focus, `Quests completed: ${done}/${total}`)}
          ${statBar('Courage', courage, 'Fuelled by your streak')}
        </div>
      </div>
      ${goalCard}
      <div class="card quest-card ${checked ? 'is-done' : ''}">
        <div class="qc-head"><span class="eyebrow">${before ? 'Journey not started' : after ? 'Quest complete' : `Today's Decree · Day ${T.idx + 1}`}</span><span class="chip sub">${esc(q.sub)}</span></div>
        <p class="qc-text">${esc(q.text)}</p>
        ${before || after ? '' : `<button class="btn big ${checked ? 'done' : ''}" id="btnCheck">${checked ? ICON.check + ' Sealed — your streak holds!' : 'Seal today’s quest  <small>+1 🔥</small>'}</button>`}
        <div class="qc-foot"><span>Best streak <b>${bestStreak(T.kind)}</b></span><span>Done <b>${done}</b> days</span></div>
      </div>
      <div class="card quote-card"><span class="qmark">“</span><p>${esc(quoteFor(today))}</p></div>`;

    $('#btnCheck') && $('#btnCheck').addEventListener('click', (e) => toggleCheck(T.days[T.idx], e.currentTarget));
    $('#btnPreviewBoss').addEventListener('click', () => openBattle(T.ti < T.total));
    tilt($('#heroCard'), $('#stage3d'));
    tick();
    renderDayStrip();
  }

  // ---------------- Day calendar, countdown + planner (minimal home) ----------------
  // Soft month colours: [pastel background, deep ink]
  const MONTH_TINT = [
    ['#e7eefb', '#2f4f86'], ['#eee9fb', '#5a4396'], ['#fbe9ee', '#8e3550'], ['#e5f3f0', '#2c6a5f'],
    ['#f4f0e1', '#6b5a20'], ['#e8f1fb', '#2d5f8a'], ['#f1ebf7', '#6a4592'], ['#e9f3e6', '#3e6a2e'],
    ['#fbf0e3', '#8a5422'], ['#ece9f7', '#4a4396'], ['#e6f1ec', '#2e6a50'], ['#fbeee2', '#8a5422'],
  ];
  const tint = (d) => MONTH_TINT[d.date.getMonth()];
  const SUBJ_COL = {
    Physics: '#4a7bd1', Chemistry: '#3c9a6e', Maths: '#c4793a', Mathematics: '#c4793a', Biology: '#6a9a3c',
    English: '#7a5cc4', 'Physical Education': '#2f9aa8', Hindi: '#c4567a', Other: '#8a8a8e',
    'Mock Test': '#c0563f', Revision: '#8a6bbf',
  };
  function subjectsFor() {
    if (T.kind === 'jee') return ['Physics', 'Chemistry', 'Maths', 'Mock Test', 'Revision', 'Other'];
    return T.exams.map((e) => e.name).concat('Mock Test', 'Revision', 'Other');
  }
  function getPlan(d) {
    const p = S.plans[T.kind][iso(d.date)];
    return p ? { hours: p.hours || 0, tasks: (p.tasks || []).map((t) => Object.assign({}, t)) } : { hours: 0, tasks: [] };
  }
  function putPlan(d, p) {
    const k = iso(d.date);
    const prev = S.plans[T.kind][k];
    const wasDone = !!(prev && prev.tasks && prev.tasks.length && prev.tasks.every((t) => t.done));
    const prevDone = prev && prev.tasks ? prev.tasks.filter((t) => t.done).length : 0;
    if (p.tasks.filter((t) => t.done).length > prevDone) popDay = d.i;
    if (!p.hours && !p.tasks.length) delete S.plans[T.kind][k];
    else S.plans[T.kind][k] = p;
    // a day whose tasks are all ticked counts as completed
    if (p.tasks.length && p.tasks.every((t) => t.done)) S.checks[T.kind][k] = 1; else if (prev && prev.tasks && prev.tasks.length) delete S.checks[T.kind][k];
    save();
    // every goal of the day just got ticked: celebrate with a quote
    if (!wasDone && p.tasks.length && p.tasks.every((t) => t.done)) setTimeout(() => showReward(d, p), 120);
  }

  // Reward card: a motivational line once all of a day's goals are complete
  let lastQuote = -1;
  function showReward(d, p) {
    const Q = JQ.REWARD_QUOTES || JQ.QUOTES;
    let qi = Math.floor(Math.random() * Q.length); if (qi === lastQuote) qi = (qi + 1) % Q.length; lastQuote = qi;
    let el = $('#reward');
    if (!el) { el = document.createElement('div'); el.id = 'reward'; el.className = 'rw-overlay'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); document.body.appendChild(el); }
    const isToday = d.i === T.ti;
    el.innerHTML = `
      <div class="rw-card" role="document">
        <div class="rw-burst" aria-hidden="true"><i></i><i></i><i></i><span class="rw-face">${JQ.avatarSVG ? JQ.avatarSVG('joy') : '🏆'}</span></div>
        <span class="rw-kicker">${isToday ? 'Today' : fmtShort(d.date)} · Day ${d.i + 1} complete</span>
        <h3>${p.tasks.length === 1 ? 'Goal complete!' : `All ${p.tasks.length} goals done!`}</h3>
        <p class="rw-meta">${p.hours ? `${fmtH(p.hours)} of study · ` : ''}${T.total - d.i} day${T.total - d.i === 1 ? '' : 's'} to JEE Main</p>
        <blockquote>“${esc(Q[qi])}”</blockquote>
        <button type="button" class="rw-btn" id="rwClose">Keep going →</button>
      </div>`;
    const close = () => { el.classList.remove('open'); document.removeEventListener('keydown', onKey); };
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    el.onclick = (e) => { if (e.target === el || e.target.id === 'rwClose') close(); };
    document.addEventListener('keydown', onKey);
    requestAnimationFrame(() => el.classList.add('open'));
    setTimeout(() => { const b = $('#rwClose'); if (b) b.focus(); }, 60);
    confetti(innerWidth / 2, innerHeight * 0.42, 140);
  }
  const fmtH = (h) => (h % 1 ? h.toFixed(1) : String(h)) + 'h';
  // how the traveller feels about a day: sad until a goal is done, beaming when all are done
  function moodFor(d) {
    const p = S.plans[T.kind][iso(d.date)], tasks = (p && p.tasks) || [];
    const done = tasks.filter((t) => t.done).length;
    if ((tasks.length && done === tasks.length) || (!tasks.length && S.checks[T.kind][iso(d.date)])) return 'joy';
    if (done > 0) return 'smile';
    if (d.i <= T.ti || tasks.length) return 'sad';
    return 'calm';
  }

  let selDay = null;
  let planOpen = false; // task card under the selected day: opens on tap, closes on a second tap
  let planAnim = false;
  let popDay = null; // the bubble that was just tapped pops once
  let lastPathW = 0;
  const use3D = () => !!(JQ.W3 && JQ.W3.ok());
  function renderDayStrip() {
    const side = $('#side');
    let el = $('#dayStrip');
    if (!el) { el = document.createElement('div'); el.id = 'dayStrip'; el.className = 'day-cal'; }
    side.appendChild(el);
    if (selDay === null || selDay > T.total) selDay = T.idx;
    el.innerHTML = `
      <div class="dc-row">
        <button class="dc-arrow" id="dsPrev" aria-label="Previous day">${ICON.left}</button>
        <div class="dc3d" id="dc3d">
          <div class="dc-rings"><i></i><i></i><i></i></div>
          <div class="dc-page" id="dcPage"></div>
          <div class="dc-under u1"></div><div class="dc-under u2"></div>
        </div>
        <button class="dc-arrow" id="dsNext" aria-label="Next day">${ICON.right}</button>
      </div>
      <div class="dc-meta"><span id="dsInfo"></span><button class="ds-today" id="dsToday">Back to today</button></div>
      <div class="dp-wrap" id="dpWrap">
        <div class="dp-world" aria-hidden="true"><div class="dp-world-img" id="dpWorld"></div><div class="dp-world-veil"></div></div>
        <div class="dp-head"><span>Journey</span><span id="dpGoal"></span><div class="w3-ui"><button type="button" id="w3Today">Today</button><button type="button" id="w3Gate">Exam day</button></div></div>
        <section class="cs-card" id="csCard" aria-label="Countdown"></section>
        <div class="dp-scroll" id="dpScroll"><div class="dp-map" id="dpMap"></div>${use3D() ? '<div class="w3-hint">Scroll or drag to travel · tap a day to plan it</div>' : ''}</div>
      </div>`;
    document.body.classList.toggle('w3', use3D());
    $('#dsPrev').addEventListener('click', () => selectDay(selDay - 1, false, 'prev'));
    $('#dsNext').addEventListener('click', () => selectDay(selDay + 1, false, 'next'));
    $('#dsToday').addEventListener('click', () => selectDay(T.idx, false, T.idx > selDay ? 'next' : 'prev'));
    let sx = null;
    const card = $('#dc3d');
    card.addEventListener('touchstart', (e) => (sx = e.touches[0].clientX), { passive: true });
    card.addEventListener('touchend', (e) => {
      if (sx === null) return; const dx = e.changedTouches[0].clientX - sx; sx = null;
      if (Math.abs(dx) > 40) selectDay(selDay + (dx < 0 ? 1 : -1), false, dx < 0 ? 'next' : 'prev');
    });
    wirePlanner();
    wireCountdown();
    if (!use3D()) wireWorld();
    $('#dpMap').onclick = (e) => {
      const b = e.target.closest('.dp-node'); if (!b) return;
      if (b.classList.contains('is-locked')) { b.classList.remove('dp-shake'); void b.offsetWidth; b.classList.add('dp-shake'); toast('Past days are locked — today is the day that counts.'); return; }
      const ni = +b.dataset.pi;
      popDay = ni;
      if (ni !== selDay) { planOpen = true; planAnim = true; selectDay(ni, false, ni > selDay ? 'next' : 'prev'); return; }
      // same day tapped again: toggle its task card
      const card = $('#plCard');
      if (card) {
        card.classList.add('pl-out');
        setTimeout(() => { planOpen = false; refreshDay(); }, 180);
      } else { planOpen = true; planAnim = true; refreshDay(); }
    };
    if (use3D()) {
      // Today / Exam day live in the top bar (one merged header, no separate Journey bar)
      const hud = $('#hud'), ui = $('#dayStrip .w3-ui'), goal = $('#dpGoal');
      $$('#hud .w3-ui, #hud #dpGoal').forEach((n) => n.remove());
      if (hud && ui) { hud.insertBefore(ui, $('#btnTheme')); if (goal) { goal.classList.add('hud-goal'); hud.insertBefore(goal, ui); } }
      document.documentElement.style.setProperty('--hud-h', hud.offsetHeight + 'px');
      JQ.W3.mount($('#dpScroll'));
      $('#w3Today').addEventListener('click', () => selectDay(T.idx, false));
      $('#w3Gate').addEventListener('click', () => JQ.W3.goto(T.total));
      selectDay(selDay, true);
      JQ.W3.goto(selDay, true);
      return;
    }
    selectDay(selDay, true);
    const sc = $('#dpScroll'), n = $(`#dpMap [data-pi="${selDay}"]`);
    if (sc && n) sc.scrollTop = parseFloat(n.style.top) - sc.clientHeight * 0.38;
  }

  // 3D road trip: day markers ride on the road, the plan card floats beside the scene
  function build3DPath() {
    const map = $('#dpMap'); if (!map) return;
    lastPathW = map.clientWidth;
    const jee = T.kind === 'jee';
    const goalName = jee ? 'JEE Main' : T.exams[T.exams.length - 1].name;
    let html = '';
    T.days.forEach((d, i) => {
      const st = status(d);
      const cls = ['dp-node', 'st-' + st];
      if (d.exam) cls.push(d.exam.boss ? 'k-boss' : 'k-exam');
      if (S.plans[T.kind][iso(d.date)]) cls.push('has-plan');
      if (i === selDay) cls.push('is-sel');
      const [bg, ink] = tint(d);
      if (i === popDay) cls.push('dp-pop');
      const locked = i < T.ti;
      if (locked) cls.push('is-locked');
      // the traveller's face rides on today's bubble only (moves forward each day)
      const mood = !d.exam && i === T.ti && JQ.avatarSVG ? moodFor(d) : '';
      if (mood) cls.push('has-av', 'mood-' + mood);
      const face = mood ? `${JQ.avatarSVG(mood)}<b class="dp-num">${i + 1}</b>` : `<b>${d.exam ? esc(d.exam.short) : i + 1}</b>`;
      html += `<button class="${cls.join(' ')}" data-pi="${i}" style="--pa:${bg};--pi:${ink};visibility:hidden" ${locked ? 'aria-disabled="true" tabindex="-1" ' : ''}aria-label="Day ${i + 1}, ${fmtLong(d.date)}${locked ? ', locked' : ''}${mood ? `, ${{ joy: 'all goals done', smile: 'some goals done', sad: 'no goals done yet', calm: 'upcoming' }[mood]}` : ''}"><span class="dp-disc"><i class="dp-ring"></i><i class="dp-ring r2"></i>${face}</span><i class="dp-pdot"></i><span class="dp-date dp-r">${d.date.getDate()} ${MON[d.date.getMonth()]}</span><i class="dp-stem"></i></button>`;
    });
    popDay = null;
    if (planOpen) html += '<section class="pl-card pl-float" id="plCard" aria-label="Plan this day"></section>';
    map.innerHTML = html;
    const card = $('#plCard');
    if (card) { renderPlanner(); if (planAnim) card.classList.add('pl-anim'); }
    planAnim = false;
    const nodes = []; $$('#dpMap .dp-node').forEach((b) => (nodes[+b.dataset.pi] = b));
    const months = [];
    T.days.forEach((d) => { if (d.date.getDate() === 1 && d.i > 0) months.push({ i: d.i, title: MONL[d.date.getMonth()].toUpperCase(), sub: `${T.total - d.i} days to ${goalName}` }); });
    const pads = T.days.map((d) => {
      const st = status(d), [bg, ink] = tint(d);
      if (d.exam) return '#c0392b';
      return st === 'today' ? '#1d1d1f' : st === 'done' ? ink : st === 'missed' ? '#cfcfd4' : bg;
    });
    const subs = jee ? ['Physics', 'Chemistry', 'Maths'] : ['Physics', 'Chemistry', 'Mathematics'];
    const cnt = subs.map(() => 0);
    Object.values(S.plans[T.kind]).forEach((p) => (p.tasks || []).forEach((t) => {
      const k = t.sub === 'Maths' || t.sub === 'Mathematics' ? 2 : subs.indexOf(t.sub);
      if (k >= 0 && t.done) cnt[k]++;
    }));
    const yr = T.end.getFullYear();
    JQ.W3.build({
      key: `${T.kind}|${T.total}|${iso(T.start)}`, seed: jee ? 11 : 23, n: T.total, ti: T.ti, minF: T.ti > 0 ? Math.min(T.ti, T.total) - 0.6 : -1.5,
      start: { title: 'DAY 1 · THE JOURNEY BEGINS', sub: `${fmtShort(T.start)} · ${T.total} days to ${goalName} · NIT Tiruchirappalli` },
      months, pads,
      towerSub: jee ? `JEE Main ${yr} · Examination Centre` : `Board Examinations ${yr} · Examination Centre`,
      banner: jee ? [`JEE MAIN ${yr}`, 'EXAMINATION CENTRE', `Session 1 · from ${fmtShort(T.end)}`] : [`CBSE BOARDS ${yr}`, 'EXAMINATION CENTRE', 'Class XII · Science'],
      checks: cnt.map((n) => ({ n })),
      onMove: (i) => { const g = $('#dpGoal'), d = T.days[i]; if (g && d) g.textContent = `Day ${i + 1} · ${fmtShort(d.date)} · ${T.total - i ? `${T.total - i} days to ${goalName}` : goalName}`; },
    });
    JQ.W3.setMarkers(nodes);
    const cs = $('#csCard'), wide = innerWidth >= 980;
    const l = wide && cs && getComputedStyle(cs).position === 'absolute' ? cs.offsetLeft + cs.offsetWidth : 0;
    JQ.W3.insets(l, card && wide ? card.offsetWidth + 18 : 0, card && !wide ? card.offsetHeight + 10 : 0);
  }

  // 3D world behind the Journey: tilts with the mouse, drifts as you climb the path
  function wireWorld() {
    const wrap = $('#dpWrap'), img = $('#dpWorld'), sc = $('#dpScroll');
    if (!wrap || !img || !sc) return;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let mx = 0, my = 0, sy = 0, raf = 0;
    const apply = () => {
      raf = 0;
      img.style.transform = `rotateX(${(-my * 3).toFixed(2)}deg) rotateY(${(mx * 4).toFixed(2)}deg) translate3d(${(-mx * 14).toFixed(1)}px, ${(sy - my * 10).toFixed(1)}px, 0) scale(1.14)`;
    };
    const queue = () => { if (!raf) raf = requestAnimationFrame(apply); };
    if (!matchMedia('(pointer: coarse)').matches) {
      wrap.addEventListener('pointermove', (e) => {
        const r = wrap.getBoundingClientRect();
        mx = (e.clientX - r.left) / r.width - 0.5; my = (e.clientY - r.top) / r.height - 0.5; queue();
      });
      wrap.addEventListener('pointerleave', () => { mx = 0; my = 0; queue(); });
    }
    // climbing toward the exam (scrolling up) slowly brings the world forward
    const onScroll = () => { const max = Math.max(1, sc.scrollHeight - sc.clientHeight); sy = (sc.scrollTop / max - 0.5) * 40; queue(); };
    sc.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // Countdown card: big days-to-go + live clock + the selected day's goals
  function renderCountdown() {
    const box = $('#csCard'); if (!box) return;
    const t = now();
    let name, target, daysLeft;
    if (T.kind === 'jee') { name = 'JEE Main'; target = new Date(T.end); target.setHours(9, 0, 0, 0); daysLeft = Math.max(0, diff(t, T.end)); }
    else {
      const nx = nextExam();
      name = nx ? nx.name : 'Boards';
      target = nx ? new Date(nx.date) : null; if (target) target.setHours(10, 30, 0, 0);
      daysLeft = nx ? diff(t, nx.date) : 0;
    }
    const p = curP();
    const d = T.days[selDay];
    const plan = getPlan(d);
    const done = plan.tasks.filter((x) => x.done).length;
    const isToday = selDay === T.ti;
    const when = isToday ? 'Today' : fmtLong(d.date);
    const goals = plan.tasks.length
      ? `<ul class="cs-tasks">${plan.tasks.map((x, k) => `<li class="${x.done ? 'done' : ''}"><label><input type="checkbox" data-ck="${k}" ${x.done ? 'checked' : ''}/><i class="sdot" style="background:${SUBJ_COL[x.sub] || SUBJ_COL.Other}"></i><span>${esc(x.text)}</span></label></li>`).join('')}</ul>`
      : `<p class="cs-empty">No goals for ${isToday ? 'today' : 'this day'} yet. Tap a day on the Journey to plan it.</p>`;
    box.classList.toggle('cs-open', csOpen);
    box.innerHTML = `
      <div class="cs-top">
        <div class="cs-left">
          <span class="cs-label">${T.kind === 'jee' ? 'JEE Main countdown' : 'Next board paper'}</span>
          <div class="cs-days"><b>${daysLeft}</b><span>day${daysLeft === 1 ? '' : 's'} to ${esc(name)}</span></div>
          <span class="cs-date">${target ? `${fmtLong(target)} · ${T.kind === 'jee' ? '9:00 AM' : '10:30 AM'}` : 'All papers done'}</span>
        </div>
        <div class="cs-clock"><b id="csClock">--:--:--</b><span>IST · current time</span></div>
      </div>
      <div class="cs-bar"><i style="width:${(p * 100).toFixed(1)}%"></i></div>
      <div class="cs-barl"><span>Day ${clamp(T.ti + 1, 0, T.total + 1)} of ${T.total + 1}</span><span>${Math.round(p * 100)}% of the journey</span></div>
      <div class="cs-goals">
        <div class="cs-ghead"><span>Goals · ${esc(when)}<i class="cs-chev" aria-hidden="true"></i></span><span class="cs-gmeta">${plan.hours ? `<em>${fmtH(plan.hours)} study</em>` : ''}${plan.tasks.length ? `<em>${done}/${plan.tasks.length} done</em>` : ''}</span></div>
        ${goals}
      </div>`;
    tick();
  }
  let csOpen = false; // phone: compact countdown, tap to show the day's goals
  function wireCountdown() {
    $('#csCard').addEventListener('click', (e) => {
      if (innerWidth >= 980 || !document.body.classList.contains('w3') || e.target.closest('input, label')) return;
      csOpen = !csOpen; $('#csCard').classList.toggle('cs-open', csOpen);
    });
    $('#csCard').addEventListener('change', (e) => {
      const k = e.target.dataset.ck; if (k === undefined) return;
      const d = T.days[selDay]; const plan = getPlan(d);
      plan.tasks[+k].done = e.target.checked; putPlan(d, plan); refreshDay();
    });
  }

  // Planner: hours + multiple tasks for the selected day
  function renderPlanner() {
    const box = $('#plCard'); if (!box) return;
    const d = T.days[selDay];
    const plan = getPlan(d);
    const [bg, ink] = tint(d);
    const subs = subjectsFor();
    const q = quest(d);
    box.style.setProperty('--pa', bg); box.style.setProperty('--pi', ink);
    box.innerHTML = `
      <div class="pl-head"><span>Plan for ${selDay === T.ti ? 'today' : fmtShort(d.date)}</span><span class="pl-sub">${plan.tasks.length} task${plan.tasks.length === 1 ? '' : 's'}</span></div>
      <div class="pl-hours">
        <span class="pl-lbl">Study hours</span>
        <div class="pl-step"><button type="button" data-h="-0.5" aria-label="Less">−</button><b>${fmtH(plan.hours)}</b><button type="button" data-h="0.5" aria-label="More">+</button></div>
      </div>
      <div class="pl-quick">${[2, 4, 6, 8, 10].map((h) => `<button type="button" data-hs="${h}" class="${plan.hours === h ? 'on' : ''}">${h}h</button>`).join('')}</div>
      <form class="pl-add" id="plAdd" autocomplete="off">
        <select id="plSub" aria-label="Subject">${subs.map((s) => `<option>${esc(s)}</option>`).join('')}</select>
        <input id="plText" maxlength="120" placeholder="Add a task or topic…" aria-label="Task or topic"/>
        <button type="submit">Add</button>
      </form>
      <ul class="pl-list">${plan.tasks.map((x, k) => `
        <li class="${x.done ? 'done' : ''}">
          <label><input type="checkbox" data-pk="${k}" ${x.done ? 'checked' : ''}/><i class="sdot" style="background:${SUBJ_COL[x.sub] || SUBJ_COL.Other}"></i><span class="pl-sname">${esc(x.sub)}</span><span class="pl-text">${esc(x.text)}</span></label>
          <button type="button" class="pl-del" data-del="${k}" aria-label="Remove task">${ICON.close}</button>
        </li>`).join('')}</ul>
      <div class="pl-sugg"><span><b>Suggested</b> · ${esc(q.text)}</span><button type="button" id="plSugg">+ Add</button></div>`;
    const sel = $('#plSub'); if (plSubPref && subs.includes(plSubPref)) sel.value = plSubPref;
  }
  let plSubPref = null;
  function wirePlanner() {
    const box = $('#dpMap'); // the plan card lives inside the journey path (delegated events)
    box.addEventListener('click', (e) => {
      const d = T.days[selDay]; const plan = getPlan(d);
      const hb = e.target.closest('[data-h]'), hs = e.target.closest('[data-hs]'), del = e.target.closest('[data-del]');
      if (hb) { plan.hours = clamp(plan.hours + parseFloat(hb.dataset.h), 0, 16); putPlan(d, plan); refreshDay(); }
      else if (hs) { plan.hours = +hs.dataset.hs; putPlan(d, plan); refreshDay(); }
      else if (del) { plan.tasks.splice(+del.dataset.del, 1); putPlan(d, plan); refreshDay(); }
      else if (e.target.id === 'plSugg') {
        const q = quest(d);
        const sub = subjectsFor().find((s) => q.sub.startsWith(s.slice(0, 4))) || 'Other';
        plan.tasks.push({ text: q.text, sub, done: false }); putPlan(d, plan); refreshDay();
      }
    });
    box.addEventListener('change', (e) => {
      if (e.target.id === 'plSub') { plSubPref = e.target.value; return; }
      const k = e.target.dataset.pk; if (k === undefined) return;
      const d = T.days[selDay]; const plan = getPlan(d);
      plan.tasks[+k].done = e.target.checked; putPlan(d, plan); refreshDay();
    });
    box.addEventListener('submit', (e) => {
      e.preventDefault();
      const text = $('#plText').value.trim(); if (!text) return;
      const d = T.days[selDay]; const plan = getPlan(d);
      plSubPref = $('#plSub').value;
      plan.tasks.push({ text, sub: plSubPref, done: false }); putPlan(d, plan);
      refreshDay(); const inp = $('#plText'); if (inp) inp.focus();
    });
  }
  // re-render everything tied to the selected day, keeping the journey scroll position
  function refreshDay() {
    const sc = $('#dpScroll'), y = sc ? sc.scrollTop : 0;
    selectDay(selDay, true);
    if (sc) sc.scrollTop = y;
  }

  // Winding level path (Day 1 at the bottom, exam at the top)
  function buildDayPath() {
    if (use3D()) return build3DPath();
    const map = $('#dpMap'); if (!map) return;
    const W = map.clientWidth || 380, SP = W > 600 ? 96 : 84, TOPP = 96, BOT = 56;
    // when the countdown floats over the left of the Journey (laptop), keep the road in the space beside it
    const cs = $('#csCard');
    const ov = cs && getComputedStyle(cs).position === 'absolute' ? cs.offsetLeft + cs.offsetWidth + 16 : 0;
    const CX = ov + (W - ov) / 2;
    const A = Math.max(50, (W - ov) / 2 - 120); // road swings across the full width, leaving room for date labels
    lastPathW = W;
    const xs = T.days.map((d) => {
      const damp = d.i > T.total - 3 ? (T.total - d.i) / 3 : 1;
      return CX + A * Math.sin(d.i * 0.72 + 0.3) * damp;
    });
    // 1) render the selected day's plan card first so we know how much room to open in the path
    const cw = Math.min(W - 24, 400);
    map.innerHTML = planOpen ? `<section class="pl-card pl-inpath" id="plCard" aria-label="Plan this day" style="width:${cw}px"></section>` : '';
    const card = $('#plCard');
    let G = 0; // gap opened under the selected disc (only while its task card is open)
    if (card) {
      renderPlanner();
      card.insertAdjacentHTML('afterbegin', '<i class="pl-caret"></i>');
      G = card.offsetHeight + 64;
    }
    const H = TOPP + T.total * SP + BOT + G;
    // nodes at/above the selected day keep their place; the ones below slide down to make room
    const pts = T.days.map((d, i) => ({ x: xs[i], y: H - BOT - i * SP - (i >= selDay ? G : 0) }));
    map.style.height = H + 'px';
    if (card) {
      const sp = pts[selDay];
      const cl = clamp(sp.x - cw / 2, 12, W - cw - 12);
      card.style.left = cl + 'px';
      card.style.top = (sp.y + 44) + 'px';
      card.querySelector('.pl-caret').style.left = clamp(sp.x - cl, 24, cw - 24) + 'px';
      if (planAnim) card.classList.add('pl-anim');
    }
    planAnim = false;
    const path = smooth(pts);
    const prog = T.ti > 0 ? smooth(pts.slice(0, clamp(T.ti, 0, T.total) + 1)) : '';
    let html = `<svg class="dp-svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" aria-hidden="true"><path d="${path}" class="dp-shade"/><path d="${path}" class="dp-line"/><path d="${path}" class="dp-dash"/>${prog ? `<path d="${prog}" class="dp-prog"/>` : ''}</svg>`;
    const fin = T.exams[T.exams.length - 1];
    html += `<div class="dp-finish"><span>${T.kind === 'jee' ? 'JEE Main' : esc(fin.name)}</span><small>${fmtShort(T.end)} · the final battle</small></div>`;
    T.days.forEach((d, i) => {
      const pt = pts[i];
      const st = status(d);
      const cls = ['dp-node', 'st-' + st];
      if (d.exam) cls.push(d.exam.boss ? 'k-boss' : 'k-exam');
      if (S.plans[T.kind][iso(d.date)]) cls.push('has-plan');
      if (i === selDay) cls.push('is-sel');
      const [bg, ink] = tint(d);
      const side = pt.x > CX ? 'l' : 'r';
      const label = d.exam ? esc(d.exam.short) : i + 1;
      html += `<button class="${cls.join(' ')}" data-pi="${i}" style="left:${pt.x.toFixed(1)}px;top:${pt.y.toFixed(1)}px;--pa:${bg};--pi:${ink}" aria-label="Day ${i + 1}, ${fmtLong(d.date)}"><span class="dp-disc"><b>${label}</b></span><i class="dp-pdot"></i><span class="dp-date dp-${side}">${d.date.getDate()} ${MON[d.date.getMonth()]}</span></button>`;
      if (d.date.getDate() === 1 && i > 0) html += `<div class="dp-month dp-${side === 'l' ? 'r' : 'l'}" style="top:${pt.y.toFixed(1)}px;color:${ink}">${MONL[d.date.getMonth()]}</div>`;
    });
    const tp = pts[clamp(T.ti, 0, T.total)];
    const ax = tp.x + (tp.x > CX ? 62 : -62);
    html += `<div class="dp-you" style="left:${ax.toFixed(1)}px;top:${tp.y.toFixed(1)}px" title="You are here">${JQ.warriorSVG(curStage(), T.kind, { bust: true })}</div>`;
    map.insertAdjacentHTML('afterbegin', html);
    const g = $('#dpGoal'); if (g) g.textContent = `Day 1 → ${T.kind === 'jee' ? 'JEE Main' : fin.name}`;
  }

  function selectDay(i, instant, dir) {
    const ni = clamp(i, clamp(T.ti, 0, T.total), T.total); // past days are locked
    if (!instant && ni === selDay && dir) return;
    selDay = ni;
    const d = T.days[selDay];
    const st = status(d);
    // the character previews how strong you are on that day
    const h = $('.w-holder');
    if (h && h.dataset.stage !== String(d.stage)) { h.innerHTML = JQ.warriorSVG(d.stage, T.kind); h.dataset.stage = d.stage; }
    if (h) h.style.setProperty('--sc', (0.6 + 0.4 * d.p).toFixed(3));
    const sg = STAGES[d.stage];
    const t2 = $('.hc-title h2'), t3 = $('.hc-title span');
    if (t2) t2.textContent = sg.name;
    if (t3) t3.textContent = sg.title;
    // calendar page
    const stamp = d.exam ? (d.exam.boss ? 'Exam day' : 'Paper') : { today: 'Today', done: 'Done', missed: 'Missed', future: 'Upcoming' }[st];
    let goal, goalLong;
    if (T.kind === 'jee') {
      goal = d.dleft === 0 ? 'JEE Main' : `D-${d.dleft}`;
      goalLong = d.dleft === 0 ? 'JEE Main day' : `${d.dleft} day${d.dleft === 1 ? '' : 's'} to JEE Main`;
    } else {
      const nx = T.exams.find((e) => diff(d.date, e.date) >= 0);
      const n = nx ? diff(d.date, nx.date) : 0;
      goal = !nx ? 'Done' : n === 0 ? nx.short : `D-${n}`;
      goalLong = !nx ? 'All papers done' : n === 0 ? `${nx.name} paper today` : `${n} day${n === 1 ? '' : 's'} to ${nx.name}`;
    }
    const plan = getPlan(d);
    const [bg, ink] = tint(d);
    const pg = $('#dcPage');
    pg.className = `dc-page st-${d.exam ? 'exam' : st}`;
    pg.style.setProperty('--pa', bg); pg.style.setProperty('--pi', ink);
    pg.innerHTML = `
      <div class="dc-band">${MONL[d.date.getMonth()]} ${d.date.getFullYear()}</div>
      <div class="dc-num">${d.date.getDate()}</div>
      <div class="dc-wk">${WKL[d.date.getDay()]}</div>
      <div class="dc-plan">${plan.hours || plan.tasks.length ? `${plan.hours ? fmtH(plan.hours) : ''}${plan.hours && plan.tasks.length ? ' · ' : ''}${plan.tasks.length ? `${plan.tasks.filter((x) => x.done).length}/${plan.tasks.length} tasks` : ''}` : 'No plan yet'}</div>
      <div class="dc-foot"><span>Day ${selDay + 1}/${T.total + 1}</span><span>${goal}</span></div>
      <span class="dc-stamp">${stamp}</span>`;
    if (dir) { const c = $('#dc3d'); c.classList.remove('flip-next', 'flip-prev'); void c.offsetWidth; c.classList.add('flip-' + dir); }
    const rel = selDay === T.ti ? 'Today' : selDay < T.ti ? `${T.ti - selDay} day${T.ti - selDay === 1 ? '' : 's'} ago` : `In ${selDay - T.ti} day${selDay - T.ti === 1 ? '' : 's'}`;
    $('#dsInfo').textContent = `${rel} · ${goalLong}`;
    $('#dsToday').classList.toggle('hide', selDay === T.idx);
    $('#dsPrev').disabled = selDay === 0;
    $('#dsNext').disabled = selDay === T.total;
    buildDayPath(); // re-opens the path under the selected day with its plan card
    if (!instant && use3D()) JQ.W3.goto(selDay);
    else if (!instant) {
      const sc = $('#dpScroll'), n = $(`#dpMap [data-pi="${selDay}"]`);
      if (sc && n) sc.scrollTo({ top: parseFloat(n.style.top) - sc.clientHeight * 0.38, behavior: 'smooth' });
    }
    renderCountdown();
  }

  function statBar(label, v, tip) {
    return `<div class="stat" title="${esc(tip)}"><span>${label}</span><div class="sbar"><i style="width:${v}%"></i></div><b>${v}</b></div>`;
  }

  function tilt(card, target) {
    if (!card || matchMedia('(pointer: coarse)').matches) return;
    card.addEventListener('pointermove', (e) => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
      target.style.transform = `rotateY(${x * 16}deg) rotateX(${-y * 10}deg)`;
    });
    card.addEventListener('pointerleave', () => (target.style.transform = ''));
  }

  // ---------------- Countdown ----------------
  function tick() {
    const el = $('#cdDigits');
    let target, label = '';
    if (T.kind === 'jee') { target = new Date(T.end); target.setHours(9, 0, 0, 0); }
    else { const nx = nextExam(); if (nx) { target = new Date(nx.date); target.setHours(10, 30, 0, 0); label = `${nx.name} · ${fmtShort(nx.date)}, 10:30 AM`; } }
    const nm = $('#cdNextName'); if (nm) nm.textContent = label || 'All gates cleared';
    let ms = target ? target - now() : 0;
    if (ms < 0) ms = 0;
    const d = Math.floor(ms / MS), h = Math.floor((ms % MS) / 3600000), m = Math.floor((ms % 3600000) / 60000), s = Math.floor((ms % 60000) / 1000);
    const cell = (v, l) => `<div class="cd-cell"><div class="flip3d"><b>${v}</b></div><span>${l}</span></div>`;
    if (el) el.innerHTML = cell(d, 'Days') + cell(pad(h), 'Hours') + cell(pad(m), 'Min') + cell(pad(s), 'Sec');
    const cc = $('#csClock'); if (cc) { const [hms, ap] = new Date().toLocaleTimeString('en-IN', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }).split(/\s+/); cc.innerHTML = `${hms}<small>${(ap || '').toUpperCase()}</small>`; } // live Indian Standard Time
  }

  // ---------------- Map ----------------
  let lastMapW = 0;
  function renderMap() {
    const map = $('#map');
    const W = map.clientWidth || 380;
    lastMapW = W;
    const SP = W < 420 ? 96 : 108, TOP = 470, BOT = 170;
    const H = TOP + T.total * SP + BOT;
    const A = Math.min(W * 0.27, 165);
    const pts = T.days.map((d) => {
      const damp = d.i > T.total - 4 ? (T.total - d.i) / 4 : 1;
      return { x: W / 2 + A * Math.sin(d.i * 0.62 + 0.4) * damp, y: H - BOT - d.i * SP };
    });
    map.style.height = H + 'px';

    const zc = T.zones.length;
    map.style.background = JQ.terrainSea(T.kind);

    let html = '';
    // path
    const d = smooth(pts);
    const prog = T.ti >= 0 ? smooth(pts.slice(0, clamp(T.ti, 0, T.total) + 1)) : '';
    html += `<svg class="path-svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" aria-hidden="true">
      <path d="${d}" class="p-shadow"/><path d="${d}" class="p-edge"/><path d="${d}" class="p-top"/><path d="${d}" class="p-dots"/>
      ${prog ? `<path d="${prog}" class="p-prog-glow"/><path d="${prog}" class="p-prog"/>` : ''}
    </svg>`;

    // 3D war-map terrain (sea, land, forests, mountains, rivers, castles)
    html = JQ.terrainSVG({ kind: T.kind, W, H, TOP, SP, pts, days: T.days, total: T.total, zones: T.zones }) + html;
    // drifting fog banks + torch-light on today
    for (let y = TOP + 200, k = 0; y < H - 100; y += 520 + (k % 3) * 140, k++) {
      html += `<div class="fog ${k % 2 ? 'fr' : 'fl'}" style="top:${y}px;animation-delay:${-(k * 3.7) % 20}s"></div>`;
    }
    const tl = pts[clamp(T.ti, 0, T.total)];
    html += `<div class="torchlight" style="left:${tl.x}px;top:${tl.y}px"></div>`;

    // zone banners
    for (let k = 0; k < zc; k++) {
      const i0 = Math.ceil((k * (T.total + 1)) / zc);
      if (i0 >= T.total) continue;
      let y = pts[i0].y + SP * 0.5;
      const todayY = pts[clamp(T.ti, 0, T.total)].y;
      if (W < 520 && Math.abs(y - todayY) < 170) y = todayY + (y >= todayY ? 120 : -190); // keep clear of the warrior
      const mx = (pts[i0].x + pts[Math.min(i0 + 1, T.total)].x) / 2;
      const bx = W < 520 ? W / 2 : mx > W / 2 ? Math.max(130, mx - 230) : Math.min(W - 130, mx + 230);
      html += `<div class="zone-banner" style="top:${y}px;left:${bx.toFixed(0)}px"><span class="zb-k">Realm ${['I', 'II', 'III', 'IV', 'V', 'VI'][k]}</span><span class="zb-n">${T.zones[k].name}</span></div>`;
    }

    // boss lair
    const isJee = T.kind === 'jee';
    const B = JQ.BOSS[T.kind];
    const bossW = Math.min(380, W * 0.9);
    const defeated = T.ti > T.total;
    html += `<div class="lair ${defeated ? 'defeated' : ''}" style="height:${TOP}px">
      <div class="lair-sky"></div>
      <div class="lair-boss" style="width:${bossW}px">${isJee ? JQ.hydraSVG() : JQ.golemSVG()}</div>
      <div class="lair-title"><span>${B.kicker}</span><b>${B.name}</b><small>${B.title}</small></div>
    </div>`;

    // nodes
    T.days.forEach((dd, i) => {
      const pt = pts[i];
      const st = status(dd);
      const cls = ['node', 'st-' + st, 'z' + (dd.zone % 6)];
      if (dd.exam) cls.push(dd.exam.boss ? 'k-boss' : 'k-exam');
      else if (dd.mock) cls.push('k-mock');
      const side = pt.x > W / 2 ? 'l' : 'r';
      let inner;
      if (dd.exam && dd.exam.boss) inner = `<span class="disc"><i class="crest">${ICON.skull}</i><span class="num">BOSS</span></span>`;
      else if (dd.exam) inner = `<span class="disc"><i class="crest">${ICON.shield}</i><span class="num">${esc(dd.exam.short)}</span></span>`;
      else inner = `<span class="disc"><span class="num">${i + 1}</span>${dd.mock ? `<i class="mock">${ICON.swords}</i>` : ''}</span>`;
      const stars = st === 'done' ? `<span class="stars">${ICON.star}${ICON.star}${ICON.star}</span>` : '';
      const ms = dd.ms.length ? `<span class="ms">${ICON[dd.ms[0].type]}</span>` : '';
      const lbl = st === 'today' ? '' : `<span class="date lbl-${side}">${dd.exam ? esc(dd.exam.name) + ' · ' : ''}${fmtShort(dd.date)}</span>`;
      html += `<button class="${cls.join(' ')}" style="left:${pt.x.toFixed(1)}px;top:${pt.y.toFixed(1)}px" data-i="${i}" aria-label="Day ${i + 1}, ${fmtLong(dd.date)}, ${st}">${inner}${stars}${ms}${lbl}</button>`;
    });

    // you-are-here marker
    const hi = clamp(T.ti, 0, T.total);
    const hp = pts[hi];
    const flag = T.ti < 0 ? `Starts in ${-T.ti}d` : T.ti > T.total ? 'Victory!' : T.ti === T.total ? 'BOSS DAY' : `Today · ${fmtShort(T.days[hi].date)} · D-${T.total - T.ti}`;
    const hx = T.ti === T.total || T.ti > T.total ? hp.x + 96 : hp.x + (hp.x > W / 2 ? -76 : 76);
    html += `<div class="here" style="left:${hx.toFixed(1)}px;top:${(hp.y + 34).toFixed(1)}px"><div class="here-flag">${flag}</div><div class="here-w">${JQ.warriorSVG(curStage(), T.kind)}</div></div>`;

    map.innerHTML = html;
  }

  function smooth(p) {
    if (!p.length) return '';
    let d = `M${p[0].x.toFixed(1)},${p[0].y.toFixed(1)}`;
    for (let i = 0; i < p.length - 1; i++) {
      const p0 = p[i - 1] || p[i], p1 = p[i], p2 = p[i + 1], p3 = p[i + 2] || p2;
      d += ` C${(p1.x + (p2.x - p0.x) / 6).toFixed(1)},${(p1.y + (p2.y - p0.y) / 6).toFixed(1)} ${(p2.x - (p3.x - p1.x) / 6).toFixed(1)},${(p2.y - (p3.y - p1.y) / 6).toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
    }
    return d;
  }

  function scrollToToday(smoothScroll) {
    const el = $('.here'); if (!el) return;
    const wrap = $('#mapWrap');
    if (!wrap.offsetParent) return; // map hidden (minimal mode) — don't move the page
    const y = parseFloat(el.style.top);
    const inner = getComputedStyle(wrap).overflowY !== 'visible' && wrap.scrollHeight > wrap.clientHeight + 4;
    const behavior = smoothScroll ? 'smooth' : 'auto';
    if (inner) wrap.scrollTo({ top: y - wrap.clientHeight * 0.62, behavior });
    else {
      const top = wrap.getBoundingClientRect().top + window.scrollY + y - window.innerHeight * 0.6;
      window.scrollTo({ top, behavior });
    }
  }

  // ---------------- Day modal ----------------
  let dayI = 0;
  function openDay(i, dir) {
    dayI = clamp(i, 0, T.total);
    const d = T.days[dayI];
    const st = status(d);
    const stg = STAGES[d.stage];
    const q = quest(d);
    const z = T.zones[d.zone];
    const checked = !!S.checks[T.kind][iso(d.date)];
    const isBoss = d.exam && d.exam.boss;
    const stLabel = { today: 'Today', done: 'Cleared', missed: 'Missed', future: 'Locked' }[st];
    const ms = d.ms.map((m) => `<li><i>${ICON[m.type]}</i>${esc(m.label)}</li>`).join('') +
      (d.mock ? `<li><i>${ICON.swords}</i>${T.kind === 'jee' ? 'Sunday skirmish — full Mock Test' : 'Sunday skirmish — Sample Paper'}</li>` : '') +
      (d.exam ? `<li><i>${d.exam.boss ? ICON.skull : ICON.shield}</i>${esc(d.exam.name)} — ${d.exam.boss ? 'the final siege' : 'a gate to storm'}</li>` : '');
    let action = '';
    if (isBoss) action = `<button class="btn big boss" id="dayBattle">${ICON.swords} ${st === 'future' ? 'Preview the Final Siege' : 'Begin the Final Siege'}</button>`;
    if (st === 'future' && !isBoss) action = `<div class="locked">${ICON.lock}<span>Unlocks in <b>${d.i - T.ti}</b> day${d.i - T.ti === 1 ? '' : 's'}</span></div>`;
    else if (st !== 'future') action += `<button class="btn big ${checked ? 'done' : ''}" id="dayCheck">${checked ? ICON.check + ' Quest sealed' : st === 'missed' ? 'Seal it late' : 'Seal this quest'}</button>`;

    $('#dayStage').innerHTML = `
      <div class="cal3d ${dir ? 'flip-' + dir : ''}">
        <div class="cal-rings"><i></i><i></i><i></i></div>
        <div class="cal-page st-${st}">
          <div class="cal-band">${MONL[d.date.getMonth()]} ${d.date.getFullYear()}</div>
          <div class="cal-num">${d.date.getDate()}</div>
          <div class="cal-wk">${WKL[d.date.getDay()]}</div>
          <div class="cal-lvl">Day <b>${d.i + 1}</b> of ${T.total + 1}</div>
          <span class="cal-stamp">${stLabel}</span>
        </div>
        <div class="cal-under u1"></div><div class="cal-under u2"></div>
      </div>
      <div class="day-body">
        <div class="tags"><span class="chip">${d.dleft === 0 ? 'Exam day' : 'D-' + d.dleft}</span><span class="chip">${esc(z.name)}</span><span class="chip">${Math.round(d.p * 100)}% of journey</span></div>
        <div class="day-hero">
          <div class="dh-w" style="--sc:${(0.62 + 0.38 * d.p).toFixed(3)}">${JQ.warriorSVG(d.stage, T.kind)}</div>
          <div class="dh-txt"><span class="eyebrow">${st === 'future' ? 'By this day you will be' : 'Your warrior'}</span><h3>${stg.name}</h3><p>${stg.title}</p><div class="sbar sm"><i style="width:${Math.round(10 + d.p * 90)}%"></i></div><small>Power ${Math.round(10 + d.p * 90)}</small></div>
        </div>
        <div class="day-quest"><span class="eyebrow">Quest · ${esc(q.sub)}</span><p>${esc(q.text)}</p></div>
        ${ms ? `<ul class="ms-list">${ms}</ul>` : ''}
        <div class="day-actions">${action}</div>
      </div>`;
    $('#dayNavMid').innerHTML = `<b>${fmtLong(d.date)}</b><span>${st === 'today' ? 'You are here' : d.i < T.ti ? `${T.ti - d.i} day${T.ti - d.i === 1 ? '' : 's'} ago` : `in ${d.i - T.ti} day${d.i - T.ti === 1 ? '' : 's'}`}</span>`;
    $('#dayPrev').disabled = dayI === 0;
    $('#dayNext').disabled = dayI === T.total;
    const c = $('#dayCheck'); if (c) c.addEventListener('click', (e) => { toggleCheck(d, e.currentTarget); openDay(dayI); });
    const b = $('#dayBattle'); if (b) b.addEventListener('click', () => { closeOverlay($('#dayModal')); openBattle(st === 'future'); });
    openOverlay($('#dayModal'));
  }

  // ---------------- Check-ins ----------------
  function toggleCheck(d, srcEl) {
    const k = iso(d.date), ch = S.checks[T.kind];
    if (ch[k]) delete ch[k];
    else {
      ch[k] = 1;
      const r = srcEl ? srcEl.getBoundingClientRect() : null;
      confetti(r ? r.left + r.width / 2 : innerWidth / 2, r ? r.top : innerHeight / 2, 90);
      const s = streak(T.kind);
      toast(d.i === T.ti ? `Quest sealed! 🔥 ${s}-day streak` : `Day ${d.i + 1} sealed`);
    }
    save();
    renderHUD(); renderSide(); refreshNodes();
  }
  function refreshNodes() {
    const y = $('#mapWrap').scrollTop, wy = window.scrollY;
    renderMap();
    $('#mapWrap').scrollTop = y; window.scrollTo(0, wy);
  }

  // ---------------- Overlays ----------------
  function openOverlay(el) { el.classList.add('open'); el.setAttribute('aria-hidden', 'false'); document.body.classList.add('modal-open'); }
  function closeOverlay(el) {
    el.classList.remove('open'); el.setAttribute('aria-hidden', 'true');
    if (!$$('.overlay.open').length) document.body.classList.remove('modal-open');
    if (el.id === 'battle') stopBattle();
    if (el.id === 'evo' && afterEvo) { const f = afterEvo; afterEvo = null; setTimeout(f, 350); }
  }
  let afterEvo = null;

  // ---------------- Settings ----------------
  function openSettings() {
    const c = S.cfg;
    const win = c.jee.window.map((w) => `<option value="${w}" ${w === c.jee.exam ? 'selected' : ''}>${fmtLong(parseD(w))}</option>`).join('');
    const custom = !c.jee.window.includes(c.jee.exam);
    const subs = c.boards.subjects.map((s, i) => `
      <label class="subj-row"><input type="checkbox" data-si="${i}" ${s.on ? 'checked' : ''}/><span class="sn">${esc(s.name)}</span><input type="date" data-sd="${i}" value="${s.date}"/></label>`).join('');
    $('#settingsBody').innerHTML = `
      <h2 class="set-title">${ICON.gear} Quest Settings</h2>
      <div class="set-grid">
        <section class="set-card">
          <h3>Your warrior</h3>
          <label class="fld"><span>Warrior name</span><input id="sName" maxlength="18" value="${esc(c.name)}"/></label>
        </section>
        <section class="set-card jee">
          <h3>⚔ JEE Main</h3>
          <label class="fld"><span>Journey start (Day 1)</span><input type="date" id="sJStart" value="${c.jee.start}"/></label>
          <label class="fld"><span>Your exam date (from admit card)</span>
            <select id="sJExam">${win}<option value="custom" ${custom ? 'selected' : ''}>Custom date…</option></select></label>
          <label class="fld ${custom ? '' : 'hidden'}" id="sJCustomWrap"><span>Custom exam date</span><input type="date" id="sJCustom" value="${c.jee.exam}"/></label>
          <p class="hint">Session 1 window: 20, 21, 22, 23, 24 & 28 January 2027. Pick yours once the city slip / admit card is out.</p>
        </section>
        <section class="set-card boards">
          <h3>📜 CBSE Boards · Science</h3>
          <label class="fld"><span>Journey start (Day 1)</span><input type="date" id="sBStart" value="${c.boards.start}"/></label>
          <div class="presets"><span>Stream</span><button class="btn chip-btn" data-preset="PCM">PCM</button><button class="btn chip-btn" data-preset="PCB">PCB</button><button class="btn chip-btn" data-preset="PCMB">PCMB</button></div>
          <div class="subj-list">${subs}</div>
          <p class="hint">Tick the papers you are writing. Each one becomes a Guardian Gate; the last becomes the final guardian.</p>
        </section>
        <section class="set-card danger">
          <h3>Progress</h3>
          <p class="hint">Check-ins are stored only in this browser.</p>
          <button class="btn ghost" id="sReset">Reset all check-ins &amp; streaks</button>
        </section>
      </div>
      <div class="set-actions"><button class="btn ghost" data-close>Cancel</button><button class="btn big" id="sSave">Save &amp; rebuild map</button></div>`;
    $('#sJExam').addEventListener('change', (e) => $('#sJCustomWrap').classList.toggle('hidden', e.target.value !== 'custom'));
    $$('[data-preset]').forEach((b) => b.addEventListener('click', () => {
      const p = b.dataset.preset;
      $$('[data-si]').forEach((cb) => {
        const id = c.boards.subjects[+cb.dataset.si].id;
        if (id === 'math') cb.checked = p !== 'PCB';
        if (id === 'bio') cb.checked = p !== 'PCM';
        if (['phy', 'chem', 'eng'].includes(id)) cb.checked = true;
      });
    }));
    $('#sReset').addEventListener('click', () => {
      if (confirm('Reset all check-ins and streaks for both JEE and Boards? This cannot be undone.')) {
        S.checks = { jee: {}, boards: {} }; save(); toast('Progress reset'); render(false);
      }
    });
    $('#sSave').addEventListener('click', () => {
      const name = $('#sName').value.trim() || 'Warrior';
      const jStart = $('#sJStart').value, bStart = $('#sBStart').value;
      const jSel = $('#sJExam').value;
      const jExam = jSel === 'custom' ? $('#sJCustom').value : jSel;
      if (!jStart || !jExam || diff(parseD(jStart), parseD(jExam)) < 7) return toast('JEE start must be at least a week before the exam');
      const subs = c.boards.subjects.map((s, i) => Object.assign({}, s, { on: $(`[data-si="${i}"]`).checked, date: $(`[data-sd="${i}"]`).value || s.date }));
      const on = subs.filter((s) => s.on);
      if (!on.length) return toast('Pick at least one board subject');
      const lastB = on.map((s) => parseD(s.date)).sort((a, b) => a - b).pop();
      if (!bStart || diff(parseD(bStart), lastB) < 7) return toast('Boards start must be at least a week before your last paper');
      S.cfg = { name, jee: Object.assign({}, c.jee, { start: jStart, exam: jExam }), boards: { start: bStart, subjects: subs } };
      S.seen = { jee: null, boards: null };
      save(); closeOverlay($('#settingsModal')); render(true); toast('Map rebuilt ✨');
    });
    openOverlay($('#settingsModal'));
  }

  // ---------------- Evolution ----------------
  function showEvo(from, to) {
    const ov = $('#evo');
    ov.innerHTML = `<div class="evo-box">
      <div class="evo-kicker">${JQ.HOUSE[T.kind]} · Day ${T.idx + 1}</div>
      <h2 class="evo-title">Rise, ${STAGES[to].name}!</h2>
      <div class="evo-stage"><div class="evo-old">${JQ.warriorSVG(from, T.kind)}</div><div class="evo-flash"></div><div class="evo-new">${JQ.warriorSVG(to, T.kind)}</div></div>
      <div class="evo-names"><span>${STAGES[from].name}</span><i>${ICON.right}</i><b>${STAGES[to].name}</b></div>
      <p>${STAGES[to].desc}</p>
      <button class="btn big" data-close>Onward!</button></div>`;
    openOverlay(ov);
    setTimeout(() => confetti(innerWidth / 2, innerHeight * 0.4, 160), 1500);
  }

  // ---------------- Boss battle ----------------
  let bTimers = [];
  function stopBattle() { bTimers.forEach(clearTimeout); bTimers = []; }
  function openBattle(preview) {
    stopBattle();
    const isJee = T.kind === 'jee';
    const B = JQ.BOSS[T.kind];
    const ov = $('#battle');
    const hits = isJee ? ['PHYSICS', 'CHEMISTRY', 'MATHS'] : T.exams.map((e) => e.short.toUpperCase());
    const daysLeft = Math.max(0, T.total - T.ti);
    const heroStage = preview ? 5 : Math.max(curStage(), 4);
    ov.className = 'overlay battle ' + (isJee ? 'b-jee' : 'b-boards');
    ov.innerHTML = `
      <div class="arena" id="arena">
        <div class="ar-sky"></div><div class="ar-bolt"></div><div class="ar-rain"></div>
        <div class="ar-ground"></div>
        <div class="ar-boss">${isJee ? JQ.hydraSVG() : JQ.golemSVG()}</div>
        <div class="ar-hero">${JQ.warriorSVG(heroStage, T.kind)}</div>
        <div class="ar-slash"></div>
        <div class="ar-hp"><div class="hp-name"><b>${B.name}</b><small>${B.title}</small></div><div class="hp-bar"><i id="hpFill"></i></div></div>
        <div class="ar-dmg" id="arDmg"></div>
        <div class="ar-text" id="arText"></div>
        <div class="ar-burst"></div>
        <div class="ar-end" id="arEnd"></div>
      </div>
      <div class="ar-ui"><button class="btn ghost" id="arSkip">Skip ▸▸</button></div>`;
    openOverlay(ov);
    const arena = $('#arena');
    const say = (html, cls) => { const t = $('#arText'); t.className = 'ar-text show ' + (cls || ''); t.innerHTML = html; };
    const at = (ms, fn) => bTimers.push(setTimeout(fn, ms));
    let t = 300;
    at(t, () => { arena.classList.add('intro'); });
    at((t += 900), () => say(`<small>${B.kicker}</small>${B.name}`, 'slam'));
    at((t += 1600), () => say(isJee ? '300 marks · 3 heads · 180 minutes' : `${hits.length} gates · 1 frozen keep · 3 hours each`, 'sub'));
    at((t += 1500), () => { arena.classList.add('hero-in'); say(`${esc(S.cfg.name)} — ${T.total + 1} days of training`, 'sub hero'); });
    const step = Math.max(650, Math.min(1000, 3200 / hits.length));
    hits.forEach((h, k) => {
      at((t += k === 0 ? 1500 : step), () => {
        if (k === 0) say('', '');
        arena.classList.remove('dash'); void arena.offsetWidth; arena.classList.add('dash', 'hurt');
        const slash = $('.ar-slash'); slash.classList.remove('go'); void slash.offsetWidth; slash.classList.add('go');
        const dm = document.createElement('div'); dm.className = 'dmg'; dm.style.left = 40 + Math.random() * 30 + '%'; dm.style.top = 18 + Math.random() * 22 + '%';
        dm.innerHTML = `<b>-${Math.round(300 / hits.length)}</b><span>${esc(h)}</span>`;
        $('#arDmg').appendChild(dm);
        $('#hpFill').style.width = (100 - ((k + 1) / hits.length) * 100) + '%';
        at(380, () => arena.classList.remove('hurt'));
      });
    });
    at((t += 1100), () => { arena.classList.add('ko'); say('', ''); });
    at((t += 1300), () => {
      arena.classList.add('victory');
      confetti(innerWidth / 2, innerHeight * 0.35, 260);
      $('#arEnd').innerHTML = `<div class="v-title">Victory</div>
        <div class="v-sub">${B.win}</div>
        <p>${preview ? `This is your destiny in <b>${daysLeft}</b> days. Every quest you complete is a hit on the boss. Keep training, ${esc(S.cfg.name)}.` : `${T.total + 1} days of training led to this moment. Walk in calm. You were built for this.`}</p>
        <div class="v-btns"><button class="btn ghost" id="arReplay">Replay</button><button class="btn big" id="arClose">Back to the map</button></div>`;
      $('#arReplay').onclick = () => openBattle(preview);
      $('#arClose').onclick = () => closeOverlay(ov);
      $('#arSkip').style.visibility = 'hidden';
    });
    $('#arSkip').onclick = () => {
      stopBattle(); arena.classList.add('intro', 'hero-in', 'ko', 'victory'); $('#hpFill').style.width = '0%'; say('', '');
      bTimers.push(setTimeout(() => {}, 0));
      // jump straight to the ending
      const tEnd = setTimeout(() => {
        $('#arEnd').innerHTML = `<div class="v-title">Victory</div><div class="v-sub">${B.win}</div>
        <p>${preview ? `This is your destiny in <b>${daysLeft}</b> days. Keep training, ${esc(S.cfg.name)}.` : 'Walk in calm. You were built for this.'}</p>
        <div class="v-btns"><button class="btn ghost" id="arReplay">Replay</button><button class="btn big" id="arClose">Back to the map</button></div>`;
        $('#arReplay').onclick = () => openBattle(preview);
        $('#arClose').onclick = () => closeOverlay(ov);
        $('#arSkip').style.visibility = 'hidden';
      }, 50);
      bTimers.push(tEnd);
    };
  }

  // ---------------- Confetti ----------------
  const cv = $('#confetti'), cx = cv.getContext('2d');
  let parts = [], raf = 0;
  function sizeCanvas() { const dpr = Math.min(2, devicePixelRatio || 1); cv.width = innerWidth * dpr; cv.height = innerHeight * dpr; cx.setTransform(dpr, 0, 0, dpr, 0, 0); }
  function confetti(x, y, n) {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const cols = document.body.classList.contains('w3') ? ['#4fb3ff', '#3fe39a', '#ffae4a', '#ffffff', '#c98bff', '#ff6b8a'] : T.kind === 'jee' ? ['#d9a441', '#b3261e', '#ff8a3d', '#f6dc8e', '#5a1612'] : ['#e6f3fb', '#9fc3e0', '#ffffff', '#3a6b96', '#cfe3f2'];
    for (let i = 0; i < n; i++) {
      const a = -Math.PI / 2 + (Math.random() - 0.5) * 2.2, v = 6 + Math.random() * 9;
      parts.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, r: 3 + Math.random() * 5, c: cols[i % cols.length], rot: Math.random() * 6, vr: (Math.random() - 0.5) * 0.4, life: 1 });
    }
    if (!raf) raf = requestAnimationFrame(loop);
  }
  function loop() {
    cx.clearRect(0, 0, innerWidth, innerHeight);
    parts.forEach((p) => {
      p.vy += 0.28; p.vx *= 0.985; p.x += p.vx; p.y += p.vy; p.rot += p.vr; p.life -= 0.008;
      cx.save(); cx.globalAlpha = Math.max(0, p.life); cx.translate(p.x, p.y); cx.rotate(p.rot); cx.fillStyle = p.c; cx.fillRect(-p.r, -p.r / 2, p.r * 2, p.r); cx.restore();
    });
    parts = parts.filter((p) => p.life > 0 && p.y < innerHeight + 40);
    raf = parts.length ? requestAnimationFrame(loop) : 0;
    if (!raf) cx.clearRect(0, 0, innerWidth, innerHeight);
  }

  let toastT = 0;
  function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2600); }

  // ---------------- Events after render ----------------
  function checkEvents() {
    const k = T.kind, s = curStage();
    const bossToday = T.ti === T.total && S.battleSeen[k] !== iso(now());
    if (bossToday) { S.battleSeen[k] = iso(now()); save(); }
    if (S.seen[k] === null || S.seen[k] === undefined) { S.seen[k] = s; save(); }
    else if (s > S.seen[k]) {
      const from = S.seen[k]; S.seen[k] = s; save();
      afterEvo = bossToday ? () => openBattle(false) : null; // evolve first, then fight
      setTimeout(() => showEvo(from, s), 700); return;
    }
    else if (s < S.seen[k]) { S.seen[k] = s; save(); }
    if (bossToday) { setTimeout(() => openBattle(false), 900); return; }
    if (!S.welcomed) { S.welcomed = true; save(); setTimeout(() => toast(`Welcome, ${S.cfg.name}. Your campaign begins — tap any day on the war map.`), 800); }
  }

  // ---------------- Render orchestration ----------------
  let renderedDay = '';
  function render(scroll) {
    T = buildTrack(S.track);
    renderedDay = iso(now());
    document.body.classList.remove('theme-jee', 'theme-boards');
    document.body.classList.add('theme-' + S.track);
    const meta = document.querySelector('meta[name="theme-color"]'); if (meta) meta.content = document.body.classList.contains('minimal') ? '#ececec' : S.track === 'jee' ? '#120c0a' : '#0a1018';
    selDay = null;
    renderHUD(); renderSide(); renderMap();
    if (scroll) requestAnimationFrame(() => requestAnimationFrame(() => scrollToToday(false)));
    checkEvents();
  }

  function scheduleMidnight() {
    const n = new Date();
    const next = new Date(n.getFullYear(), n.getMonth(), n.getDate() + 1, 0, 0, 3);
    setTimeout(() => { render(true); scheduleMidnight(); }, next - n);
  }

  // ---------------- Wire-up ----------------
  function init() {
    $('#btnSettings').innerHTML = ICON.gear;
    let wx = '';
    for (let i = 0; i < 34; i++) {
      const r = rng(i * 131 + 7);
      wx += `<i style="left:${(r() * 100).toFixed(1)}%;--s:${(2 + r() * 4).toFixed(1)}px;--d:${(7 + r() * 9).toFixed(1)}s;--dl:${(-r() * 16).toFixed(1)}s;--x:${((r() - 0.5) * 120).toFixed(0)}px"></i>`;
    }
    $('#weather').innerHTML = wx;
    $('#btnToday').innerHTML = ICON.target + '<span>Today</span>';
    $('#dayPrev').innerHTML = ICON.left;
    $('#dayNext').innerHTML = ICON.right;
    $$('.x-btn').forEach((b) => (b.innerHTML = ICON.close));

    $$('.tab').forEach((b) => b.addEventListener('click', () => {
      if (S.track === b.dataset.track) return;
      S.track = b.dataset.track; save();
      document.body.classList.add('switching');
      setTimeout(() => { render(true); document.body.classList.remove('switching'); }, 220);
    }));
    $('#btnSettings').addEventListener('click', openSettings);
    // Day / Night look for the 3D world (remembered in this browser)
    const tb = $('#btnTheme');
    if (tb && JQ.W3) {
      let th = 'night'; try { th = localStorage.getItem('jeeQuest.theme') || 'night'; } catch (e) { /* storage unavailable */ }
      const paint = () => { tb.innerHTML = th === 'night' ? '☀<span> Day</span>' : '☾<span> Night</span>'; tb.setAttribute('aria-label', `Switch to ${th === 'night' ? 'day' : 'night'} world`); document.body.classList.toggle('w3-day', th === 'day'); };
      JQ.W3.setTheme(th); paint();
      tb.addEventListener('click', () => { th = th === 'night' ? 'day' : 'night'; try { localStorage.setItem('jeeQuest.theme', th); } catch (e) { /* ignore */ } JQ.W3.setTheme(th); paint(); });
    }
    $('#btnToday').addEventListener('click', () => scrollToToday(true));
    $('#map').addEventListener('click', (e) => {
      const n = e.target.closest('.node'); if (n) return openDay(+n.dataset.i);
      const h = e.target.closest('.here'); if (h) return openDay(T.idx);
      const l = e.target.closest('.lair'); if (l) return openBattle(T.ti < T.total);
    });
    $('#dayPrev').addEventListener('click', () => openDay(dayI - 1, 'prev'));
    $('#dayNext').addEventListener('click', () => openDay(dayI + 1, 'next'));
    let sx = null;
    $('#dayStage').addEventListener('touchstart', (e) => (sx = e.touches[0].clientX), { passive: true });
    $('#dayStage').addEventListener('touchend', (e) => {
      if (sx === null) return; const dx = e.changedTouches[0].clientX - sx; sx = null;
      if (Math.abs(dx) > 50) openDay(dayI + (dx < 0 ? 1 : -1), dx < 0 ? 'next' : 'prev');
    });
    document.addEventListener('click', (e) => {
      const c = e.target.closest('[data-close]'); if (c) closeOverlay(c.closest('.overlay'));
      if (e.target.classList && e.target.classList.contains('overlay') && !e.target.classList.contains('battle')) closeOverlay(e.target);
    });
    document.addEventListener('keydown', (e) => {
      const open = $$('.overlay.open').pop();
      if (e.key === 'Escape' && open) closeOverlay(open);
      if (!open && $('#dayStrip') && !/INPUT|SELECT|TEXTAREA/.test(document.activeElement.tagName)) {
        if (e.key === 'ArrowLeft') selectDay(selDay - 1, false, 'prev');
        if (e.key === 'ArrowRight') selectDay(selDay + 1, false, 'next');
      }
      if (open && open.id === 'dayModal') {
        if (e.key === 'ArrowLeft' && dayI > 0) openDay(dayI - 1, 'prev');
        if (e.key === 'ArrowRight' && dayI < T.total) openDay(dayI + 1, 'next');
      }
    });
    let rz = 0;
    addEventListener('resize', () => {
      sizeCanvas();
      clearTimeout(rz);
      rz = setTimeout(() => { document.documentElement.style.setProperty('--hud-h', $('#hud').offsetHeight + 'px'); if (Math.abs($('#map').clientWidth - lastMapW) > 2) { renderMap(); scrollToToday(false); } const dm = $('#dpMap'); if (dm && Math.abs(dm.clientWidth - lastPathW) > 2) refreshDay(); }, 150);
    });
    document.addEventListener('visibilitychange', () => { if (!document.hidden && iso(now()) !== renderedDay) render(true); });
    sizeCanvas();
    render(true);
    // fonts can shift layout (HUD height, panel widths) — re-anchor once they load
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => {
      document.documentElement.style.setProperty('--hud-h', $('#hud').offsetHeight + 'px');
      if (Math.abs($('#map').clientWidth - lastMapW) > 2) renderMap();
      scrollToToday(false);
    });
    setInterval(tick, 1000);
    scheduleMidnight();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
