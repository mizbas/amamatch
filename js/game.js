// あまあまマッチ:ゲームのしくみ(盤面・そろえる・消す・落ちる・しかけ・ゴール)
"use strict";
const $ = id => document.getElementById(id);
const wait = ms => window.__fast ? Promise.resolve() : new Promise(r => setTimeout(r, ms));
const later = (fn, ms) => { if (window.__fast) return; ms > 0 ? setTimeout(fn, ms) : fn(); };
let board;

let S = null, cells = [], grid = [], nextId = 1;
let moves = 0, score = 0, shownScore = 0, busy = false, ended = false, selected = null, hintTimer = null;
let got = {}, ingGot = 0, ingSpawned = 0, ingTotal = 0, chocoHit = false, hammerMode = false, continued = 0, movesUsed = 0;
let firstMoveDone = false;

/* ================= 基本 ================= */
const inB = (r, c) => r >= 0 && r < ROWS && c >= 0 && c < COLS;
const isCell = (r, c) => inB(r, c) && !cells[r][c].hole;
const isStatic = t => !!t && (t.kind === 'cream' || t.kind === 'choco');
const movable = t => !!t && (t.kind === 'candy' || t.kind === 'ing');
const swappable = t => movable(t) && !t.lock;
const tileK = k => grid[Math.floor(k / COLS)][k % COLS];
const keyOf = t => t.r * COLS + t.c;
const randColor = () => Math.floor(Math.random() * S.colors);
const shuffled = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };

function makeTile(kind, o = {}) {
  const el = document.createElement('div'); el.className = 'tile';
  const gem = document.createElement('div'); el.appendChild(gem);
  const t = Object.assign({ id: nextId++, kind, color: -1, special: null, lock: false, hp: 0, sub: 0, r: 0, c: 0, el, gem }, o);
  styleTile(t); board.appendChild(el); return t;
}
function candClass(color, special) {
  if (special === 'bomb') return 'cand-bomb';
  return `cand-${color}-${special === 'armed' ? 'wrap' : (special || 'n')}`;
}
function styleTile(t) {
  if (t.kind === 'candy') {
    t.gem.className = 'gem ' + candClass(t.color, t.special) +
      (t.special === 'armed' ? ' armed' : (t.special && t.special !== 'bomb' ? ' special' : ''));
    if (t.lock && !t.lockEl) { t.lockEl = document.createElement('div'); t.lockEl.className = 'lockover'; t.el.appendChild(t.lockEl); }
    if (!t.lock && t.lockEl) { t.lockEl.remove(); t.lockEl = null; }
  } else if (t.kind === 'cream') t.gem.className = 'gem cream-' + t.hp;
  else if (t.kind === 'choco') t.gem.className = 'gem choco';
  else if (t.kind === 'ing') t.gem.className = 'gem ing ing-' + t.sub;
  t.el.classList.toggle('static', isStatic(t));
}
function place(t, r, c) { t.r = r; t.c = c; t.el.style.transform = `translate(calc(var(--s) * ${c}), calc(var(--s) * ${r}))`; }
function placeNow(t, r, c) { t.el.style.transition = 'none'; place(t, r, c); }
function styleCell(r, c, bump) {
  const cl = cells[r][c]; if (!cl.el) return;
  cl.el.className = 'cell' + ((r + c) % 2 ? ' alt' : '') + (cl.jelly ? ' jelly' + cl.jelly : '');
  if (bump) { cl.el.classList.add('wob'); }
}

/* ================= 判定 ================= */
function colorAt(r, c) { const t = grid[r] && grid[r][c]; return t && t.kind === 'candy' && t.special !== 'bomb' && t.special !== 'armed' ? t.color : -9; }
function matchAt(r, c) {
  const col = colorAt(r, c); if (col < 0) return false;
  let n = 1; for (let x = c - 1; colorAt(r, x) === col; x--) n++; for (let x = c + 1; colorAt(r, x) === col; x++) n++;
  if (n >= 3) return true;
  n = 1; for (let y = r - 1; colorAt(y, c) === col; y--) n++; for (let y = r + 1; colorAt(y, c) === col; y++) n++;
  return n >= 3;
}
const isSpecialCandy = t => t && t.kind === 'candy' && !!t.special && t.special !== 'armed';
function allMoves() {
  const out = [];
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    for (const [dr, dc] of [[0, 1], [1, 0]]) {
      const r2 = r + dr, c2 = c + dc; if (!inB(r2, c2)) continue;
      const a = grid[r][c], b = grid[r2][c2]; if (!swappable(a) || !swappable(b)) continue;
      if ((isSpecialCandy(a) && isSpecialCandy(b)) || (a.special === 'bomb' && b.kind === 'candy') || (b.special === 'bomb' && a.kind === 'candy')) { out.push([[r, c], [r2, c2]]); continue; }
      grid[r][c] = b; grid[r2][c2] = a;
      const ok = matchAt(r, c) || matchAt(r2, c2);
      grid[r][c] = a; grid[r2][c2] = b;
      if (ok) out.push([[r, c], [r2, c2]]);
    }
  }
  return out;
}
const findMove = () => allMoves()[0] || null;
function findGroups() {
  const runs = [];
  for (let r = 0; r < ROWS; r++) { let c = 0;
    while (c < COLS) { const col = colorAt(r, c); let e = c + 1;
      if (col >= 0) while (e < COLS && colorAt(r, e) === col) e++;
      if (col >= 0 && e - c >= 3) { const cl = []; for (let x = c; x < e; x++) cl.push(r * COLS + x); runs.push({ dir: 'h', cells: cl, color: col }); }
      c = e; } }
  for (let c = 0; c < COLS; c++) { let r = 0;
    while (r < ROWS) { const col = colorAt(r, c); let e = r + 1;
      if (col >= 0) while (e < ROWS && colorAt(e, c) === col) e++;
      if (col >= 0 && e - r >= 3) { const cl = []; for (let y = r; y < e; y++) cl.push(y * COLS + c); runs.push({ dir: 'v', cells: cl, color: col }); }
      r = e; } }
  const owner = new Map(), groups = [];
  for (const run of runs) {
    const hit = [...new Set(run.cells.map(k => owner.get(k)).filter(Boolean))];
    let g;
    if (!hit.length) { g = { cells: new Set(), runs: [], color: run.color }; groups.push(g); }
    else { g = hit[0];
      for (const o of hit.slice(1)) { o.cells.forEach(k => { g.cells.add(k); owner.set(k, g); }); g.runs.push(...o.runs); groups.splice(groups.indexOf(o), 1); } }
    run.cells.forEach(k => { g.cells.add(k); owner.set(k, g); }); g.runs.push(run);
  }
  return groups;
}
// できるスペシャル:5つ一直線 > L字・T字 > 4つ一直線
function decideSpecial(g, prefer) {
  const longest = g.runs.reduce((a, b) => b.cells.length > a.cells.length ? b : a);
  const hasH = g.runs.some(r => r.dir === 'h'), hasV = g.runs.some(r => r.dir === 'v');
  let type = null;
  if (longest.cells.length >= 5) type = 'bomb';
  else if (hasH && hasV) type = 'wrap';
  else if (longest.cells.length === 4) type = longest.dir === 'h' ? 'lineV' : 'lineH';
  if (!type) return null;
  let key = prefer ? prefer.find(k => g.cells.has(k)) : undefined;
  if (key === undefined && type === 'wrap') {
    const v = new Set(g.runs.filter(r => r.dir === 'v').flatMap(r => r.cells));
    key = g.runs.filter(r => r.dir === 'h').flatMap(r => r.cells).find(k => v.has(k));
  }
  if (key === undefined) key = longest.cells[Math.floor(longest.cells.length / 2)];
  return { key, type, color: g.color };
}

/* ================= ゴール ================= */
function goalLeft(g) {
  switch (g.t) {
    case 'score': return Math.max(0, g.n - score);
    case 'collect': return Math.max(0, g.n - (got[g.c] || 0));
    case 'jelly': { let n = 0; for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) n += cells[r][c].jelly; return n; }
    case 'cream': return grid.flat().filter(t => t && t.kind === 'cream').length;
    case 'choco': return grid.flat().filter(t => t && t.kind === 'choco').length;
    case 'lock': return grid.flat().filter(t => t && t.lock).length;
    case 'ing': return Math.max(0, g.n - ingGot);
  }
  return 0;
}
const allGoalsDone = () => S.goals.every(g => goalLeft(g) === 0);

/* ================= 盤面づくり ================= */
function genColorsFor(mask) {
  const g = [];
  for (let r = 0; r < ROWS; r++) { g[r] = [];
    for (let c = 0; c < COLS; c++) { if (!mask[r][c]) { g[r][c] = -9; continue; } let col, tries = 0;
      do { col = randColor(); tries++; } while (tries < 30 && ((c >= 2 && g[r][c - 1] === col && g[r][c - 2] === col) || (r >= 2 && g[r - 1][c] === col && g[r - 2][c] === col)));
      g[r][c] = col; } }
  return g;
}
function buildBoard(pre) {
  board.innerHTML = '';
  cells = []; grid = [];
  const lay = S.layout;
  for (let r = 0; r < ROWS; r++) { cells[r] = []; grid[r] = [];
    for (let c = 0; c < COLS; c++) {
      const ch = lay[r][c], hole = ch === '#';
      const jelly = 'jJ12L'.includes(ch) ? (ch === 'J' ? 2 : 1) : 0;
      cells[r][c] = { hole, jelly, ch, el: null };
      if (!hole) { const d = document.createElement('div'); d.style.left = `calc(var(--s) * ${c})`; d.style.top = `calc(var(--s) * ${r})`;
        board.appendChild(d); cells[r][c].el = d; styleCell(r, c); }
      grid[r][c] = null;
    } }
  const mask = cells.map((row, r) => row.map((cl, c) => !cl.hole && !'cCK12x'.includes(cl.ch)));
  let cg;
  for (let i = 0; i < 300; i++) {
    cg = genColorsFor(mask);
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) grid[r][c] = mask[r][c] ? { kind: 'candy', color: cg[r][c], special: null, lock: false } : null;
    if (!findGroups().length && findMove()) break;
  }
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
    const cl = cells[r][c]; grid[r][c] = null; if (cl.hole) continue;
    const ch = cl.ch; let t;
    if ('cC1'.includes(ch) || ch === '2' || ch === 'K') t = makeTile('cream', { hp: ch === 'K' ? 3 : (ch === 'C' || ch === '2') ? 2 : 1 });
    else if (ch === 'x') t = makeTile('choco');
    else t = makeTile('candy', { color: cg[r][c], lock: ch === 'l' || ch === 'L' });
    grid[r][c] = t; placeNow(t, r, c);
  }
  // さくらんぼ:最初に1つ、上の段に置く
  ingTotal = (S.goals.find(g => g.t === 'ing') || { n: 0 }).n; ingSpawned = 0; ingGot = 0;
  if (ingTotal) {
    const tops = []; for (let c = 0; c < COLS; c++) for (let r = 0; r < ROWS; r++) { if (!isCell(r, c)) continue; const t = grid[r][c]; if (t && t.kind === 'candy' && !t.lock) tops.push(t); break; }
    shuffled(tops).slice(0, Math.min(2, ingTotal)).forEach(t => { t.kind = 'ing'; t.sub = ingSpawned % 2; t.color = -1; styleTile(t); ingSpawned++; });
  }
  // スタート時のアイテム
  const normals = () => shuffled(grid.flat().filter(t => t && t.kind === 'candy' && !t.special && !t.lock));
  if (pre && pre.startLW) { const n = normals(); if (n[0]) { n[0].special = Math.random() < .5 ? 'lineH' : 'lineV'; styleTile(n[0]); } if (n[1]) { n[1].special = 'wrap'; styleTile(n[1]); } }
  if (pre && pre.startBomb) { const n = normals(); if (n[0]) { n[0].special = 'bomb'; n[0].color = -1; styleTile(n[0]); } }
}
async function introDrop() {
  const all = grid.flat().filter(Boolean);
  if (window.__fast) return;
  all.forEach(t => { if (isStatic(t)) return; placeNow(t, t.r - ROWS - 1, t.c); t.r += ROWS + 1; });
  board.offsetHeight;
  let maxT = 0;
  all.forEach(t => { if (isStatic(t)) { t.gem.classList.add('spawn'); return; }
    const delay = (ROWS - 1 - t.r) * .05 + t.c * .015, d = .45; maxT = Math.max(maxT, delay + d);
    t.el.style.transition = `transform ${d}s cubic-bezier(.45,0,.85,.5) ${delay}s`; place(t, t.r, t.c);
    later(() => t.gem.classList.add('land'), (delay + d) * 1000); });
  later(sfx.land, 450);
  await wait(maxT * 1000 + 250);
  all.forEach(t => t.el.style.transition = '');
}

/* ================= 消去 ================= */
function specialArea(t) {
  const r0 = t.r, c0 = t.c, cl = [];
  const add = (r, c) => { if (isCell(r, c)) cl.push(r * COLS + c); };
  if (t.special === 'lineH') { for (let c = 0; c < COLS; c++) add(r0, c);
    return { cells: cl, fx: () => { fxBeam('h', r0, c0); sfx.line(); vib(25); shake(1); } }; }
  if (t.special === 'lineV') { for (let r = 0; r < ROWS; r++) add(r, c0);
    return { cells: cl, fx: () => { fxBeam('v', r0, c0); sfx.line(); vib(25); shake(1); } }; }
  if (t.special === 'wrap' || t.special === 'armed') {
    for (let r = r0 - 1; r <= r0 + 1; r++) for (let c = c0 - 1; c <= c0 + 1; c++) add(r, c);
    return { cells: cl, fx: () => { fxShock(r0, c0, 1.6); sfx.wrap(); vib(40); shake(2); } };
  }
  if (t.special === 'bomb') {
    const cnt = {}; grid.flat().forEach(x => { if (x && x.kind === 'candy' && x.color >= 0 && x !== t) cnt[x.color] = (cnt[x.color] || 0) + 1; });
    const ks = Object.keys(cnt); const col = ks.length ? +ks.sort((a, b) => cnt[b] - cnt[a])[0] : -5;
    grid.flat().forEach(x => { if (x && x.kind === 'candy' && x.color === col) cl.push(keyOf(x)); });
    const targets = cl.map(k => [Math.floor(k / COLS), k % COLS]);
    return { cells: cl, fx: () => { fxBolts(r0, c0, targets); sfx.bomb(); vib(70); shake(2); } };
  }
  return { cells: cl, fx() {} };
}
function goalEl(type, c) { return document.querySelector(`.goalitem[data-g="${type}${c == null ? '' : c}"]`); }
// 消す。スペシャルに当たったら連鎖して発動。発動地点から波のように広がって消える
async function clearCells(set, combo, color, fromMatch) {
  const orig = [...set];
  const delay = new Map(); for (const k of set) delay.set(k, 0);
  const queue = [...set], fired = new Set(), keep = new Set();
  while (queue.length) {
    const k = queue.shift(), t = tileK(k);
    if (!t || t.kind !== 'candy' || !t.special || t.lock || fired.has(t.id)) continue;
    fired.add(t.id);
    const d0 = delay.get(k) || 0, { cells: area, fx } = specialArea(t);
    later(fx, d0);
    if (t.special === 'wrap') keep.add(k);      // つつみは1回目の爆発では残る → あとでもう一度爆発
    for (const k2 of area) {
      const dist = Math.abs(Math.floor(k2 / COLS) - t.r) + Math.abs(k2 % COLS - t.c), d = d0 + dist * 38;
      if (!delay.has(k2) || delay.get(k2) > d) delay.set(k2, d);
      if (!set.has(k2)) { set.add(k2); queue.push(k2); }
    }
  }
  // となりでそろえると、クリーム・チョコにもダメージ
  const dmg = new Map();
  for (const [k, d] of delay) { const t = tileK(k); if (isStatic(t)) dmg.set(t, d); }
  if (fromMatch) for (const k of orig) { const r = Math.floor(k / COLS), c = k % COLS;
    for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { if (!inB(r + dr, c + dc)) continue; const t = grid[r + dr][c + dc]; if (isStatic(t) && !dmg.has(t)) dmg.set(t, (delay.get(k) || 0) + 40); } }

  const dying = []; let maxD = 0, sx = 0, sy = 0, bonus = 0, flies = 0;
  for (const [k, d] of delay) {
    const t = tileK(k); if (!t || t.kind !== 'candy' || keep.has(k)) continue;
    maxD = Math.max(maxD, d);
    if (t.lock) { t.lock = false; later(() => { styleTile(t); fxCrumbs(t.r, t.c, '#5a2a4a', 6); sfx.ice(); }, d); bonus += 60; continue; }
    grid[t.r][t.c] = null; dying.push(t); sx += t.c; sy += t.r;
    const cl = cells[t.r][t.c];
    if (cl.jelly > 0) { cl.jelly--; bonus += 100; const r = t.r, c = t.c; later(() => { styleCell(r, c, true); sfx.jelly(); }, d); }
    got[t.color] = (got[t.color] || 0) + 1;
    const ge = S.goals.find(g => g.t === 'collect' && g.c === t.color);
    if (ge && flies < 8 && got[t.color] <= ge.n) { flies++; const r = t.r, c = t.c; later(() => fxFly(r, c, goalEl('collect', t.color), HEX[t.color]), d); }
    later(() => { t.gem.classList.remove('hint', 'sel', 'land', 'spawn'); t.gem.classList.add('pop'); fxPop(t.r, t.c, t.color); }, d);
  }
  for (const [t, d] of dmg) {
    maxD = Math.max(maxD, d); bonus += 100;
    if (t.kind === 'cream') {
      t.hp--;
      if (t.hp <= 0) { grid[t.r][t.c] = null; const cl = cells[t.r][t.c], r = t.r, c = t.c;
        if (cl.jelly > 0) { cl.jelly--; later(() => styleCell(r, c, true), d); }
        later(() => { t.gem.classList.add('pop'); fxCrumbs(r, c, '#fff', 12); fxCrumbs(r, c, '#ffc0d8', 5); sfx.ice(); }, d);
        later(() => t.el.remove(), d + 260); }
      else later(() => { styleTile(t); t.gem.classList.remove('hit'); void t.gem.offsetWidth; t.gem.classList.add('hit'); fxCrumbs(t.r, t.c, '#fff', 8); sfx.ice(); }, d);
    } else if (t.kind === 'choco') {
      grid[t.r][t.c] = null; chocoHit = true; const r = t.r, c = t.c;
      later(() => { t.gem.classList.add('pop'); fxCrumbs(r, c, '#6a3418', 12); sfx.choco(); }, d);
      later(() => t.el.remove(), d + 260);
    }
  }
  for (const k of keep) { const t = tileK(k); t.special = 'armed'; styleTile(t); }
  const pts = dying.length * 60 * combo + fired.size * 150 + bonus;
  if (pts) {
    score += pts; if (dying.length) sfx.pop(combo);
    if (dying.length) { const p = cc(sy / dying.length, sx / dying.length);
      later(() => fxText(p.x, p.y, '+' + pts, HEX[color] || '#fff', p.s * (dying.length > 8 ? .75 : .55)), 80); }
  }
  await wait(maxD + 230);
  dying.forEach(t => t.el.remove());
  updateHud();
}
// 落ちる:1マスずつ。真上がかべなら、ななめからすべりこむ。穴や盤のふちの下からは新しいおかしが出てくる
function spawnTile() {
  const onBoard = grid.flat().filter(t => t && t.kind === 'ing').length;
  if (ingSpawned < ingTotal && onBoard + ingGot < ingTotal && ((onBoard === 0 && Math.random() < .6) || (onBoard < 2 && Math.random() < .25))) {
    ingSpawned++; return makeTile('ing', { sub: ingSpawned % 2 === 0 ? 1 : 0 });
  }
  return makeTile('candy', { color: randColor() });
}
async function gravity() {
  const landed = new Set();
  for (let pass = 0; pass < 60; pass++) {
    const moved = [], fresh = [], used = new Set();
    for (let r = ROWS - 1; r >= 0; r--) for (let c = 0; c < COLS; c++) {
      if (!isCell(r, c) || grid[r][c]) continue;
      const up = r - 1;
      if (!isCell(up, c)) {   // 上が穴かふち → ここから出てくる
        const t = spawnTile(); grid[r][c] = t; placeNow(t, r - 1, c); t.r = r; fresh.push(t); used.add(t); continue;
      }
      const ut = grid[up][c];
      if (movable(ut) && !used.has(ut)) { grid[up][c] = null; grid[r][c] = ut; ut.r = r; moved.push(ut); used.add(ut); continue; }
      if (!isStatic(ut)) continue;
      for (const dc of shuffled([-1, 1])) {
        const c2 = c + dc; if (!isCell(up, c2)) continue;
        const t = grid[up][c2]; if (!movable(t) || used.has(t)) continue;
        if (isCell(r, c2) && !grid[r][c2]) continue;   // まっすぐ落ちられるならそっちが先
        grid[up][c2] = null; grid[r][c] = t; t.r = r; t.c = c; moved.push(t); used.add(t); break;
      }
    }
    if (!moved.length && !fresh.length) break;
    if (!window.__fast) {
      board.offsetHeight;
      for (const t of moved) { t.el.style.transition = 'transform .075s linear'; place(t, t.r, t.c); landed.add(t); }
      for (const t of fresh) { t.el.style.transition = 'transform .075s linear'; t.gem.classList.add('fadein'); place(t, t.r, t.c); landed.add(t); }
      await wait(78);
    }
  }
  if (!window.__fast && landed.size) {
    for (const t of landed) { t.el.style.transition = ''; t.gem.classList.remove('land', 'fadein'); void t.gem.offsetWidth; t.gem.classList.add('land'); }
    sfx.land(); await wait(40);
  }
  // いちばん下まで来たさくらんぼを回収
  let got1 = false;
  for (let c = 0; c < COLS; c++) {
    let exit = -1; for (let r = ROWS - 1; r >= 0; r--) if (isCell(r, c)) { exit = r; break; }
    const t = exit >= 0 ? grid[exit][c] : null;
    if (t && t.kind === 'ing') {
      grid[exit][c] = null; ingGot++; got1 = true; score += 1000;
      const p = cc(exit, c); later(() => { fxSparkles(exit, c, 14, '#fff6a0'); fxFly(exit, c, goalEl('ing'), '#ff4d6d'); fxText(p.x, p.y, '+1000', '#ffd23f', p.s * .6); sfx.ing(); }, 0);
      later(() => { t.gem.classList.add('pop'); }, 0); later(() => t.el.remove(), 260);
    }
  }
  if (got1) { updateHud(); await wait(300); await gravity(); }
}
async function resolveBoard(prefer) {
  let combo = 0;
  for (let guard = 0; guard < 80; guard++) {
    // 1回爆発したつつみは、落ちたあともう一度爆発する
    const armed = grid.flat().filter(t => t && t.special === 'armed');
    if (armed.length) { await wait(160); await clearCells(new Set(armed.map(keyOf)), Math.max(1, combo), armed[0].color, false); await gravity(); continue; }
    const groups = findGroups(); if (!groups.length) break;
    combo++;
    const set = new Set(), spawns = [];
    for (const g of groups) { g.cells.forEach(k => set.add(k)); const s = decideSpecial(g, prefer); if (s) spawns.push(s); }
    if (combo >= 2) { showWord(WORDS[Math.min(combo, 6)]); if (combo >= 3) sfx.word(); }
    await clearCells(set, combo, groups[0].color, true);
    for (const s of spawns) {
      const r = Math.floor(s.key / COLS), c = s.key % COLS; if (grid[r][c]) continue;
      const t = makeTile('candy', { color: s.type === 'bomb' ? -1 : s.color, special: s.type }); placeNow(t, r, c);
      if (!window.__fast) { board.offsetHeight; t.el.style.transition = ''; }
      t.gem.classList.add('spawn'); grid[r][c] = t; fxSparkles(r, c, 10, '#fff8c0'); sfx.make(); vib(15);
      specialTip(s.type);
    }
    if (spawns.length) await wait(260);
    await gravity();
    prefer = null;
  }
}

/* スペシャル同士を入れ替えたときの合体技 */
async function comboSpecial(ta, tb) {
  const set = new Set(), A = ta.special, B = tb.special;
  const add = (r, c) => { if (isCell(r, c)) set.add(r * COLS + c); };
  let big = null;
  if (A === 'bomb' && B === 'bomb') {
    ta.special = tb.special = null; ta.color = tb.color = -1;
    showWord('ぜんぶ!!'); sfx.bomb(); vib(120); shake(2);
    fxBolts(ta.r, ta.c, grid.flat().filter(t => t && t.kind === 'candy').map(t => [t.r, t.c]));
    grid.flat().forEach(t => t && set.add(keyOf(t)));
  } else if (A === 'bomb' || B === 'bomb') {
    const bomb = A === 'bomb' ? ta : tb, other = A === 'bomb' ? tb : ta, kind = other.special;
    bomb.special = null; set.add(keyOf(bomb));
    const targets = grid.flat().filter(t => t && t !== bomb && t.kind === 'candy' && t.color === other.color);
    fxBolts(bomb.r, bomb.c, targets.map(t => [t.r, t.c])); sfx.bomb(); vib(70); shake(2);
    for (const t of targets) {
      if (kind && !t.special) { t.special = kind === 'wrap' ? 'wrap' : (Math.random() < .5 ? 'lineH' : 'lineV'); styleTile(t); t.gem.classList.add('spawn'); }
      set.add(keyOf(t));
    }
    if (kind) { showWord('へんしん!'); sfx.make(); await wait(600); }
  } else {
    const r0 = ta.r, c0 = ta.c, wA = A === 'wrap', wB = B === 'wrap';
    ta.special = tb.special = null;
    if (wA && wB) {   // つつみ×つつみ:5×5を2回
      for (let r = r0 - 2; r <= r0 + 2; r++) for (let c = c0 - 2; c <= c0 + 2; c++) add(r, c);
      fxShock(r0, c0, 3); sfx.wrap(); vib(80); shake(2); showWord('ドドーン!');
      big = tb; set.delete(keyOf(tb));
    } else {          // しましま×しましま:十字 / しましま×つつみ:3列ぶんの太い十字
      const w = (wA || wB) ? 1 : 0;
      for (let d = -w; d <= w; d++) { for (let i = 0; i < COLS; i++) { add(r0 + d, i); add(i, c0 + d); }
        if (inB(r0 + d, 0)) later(() => fxBeam('h', r0 + d, c0), 0); if (inB(0, c0 + d)) later(() => fxBeam('v', r0, c0 + d), 0); }
      sfx.line(); if (w) { sfx.wrap(); showWord('ドーン!'); } vib(60); shake(2);
    }
  }
  await clearCells(set, 1, ta.color >= 0 ? ta.color : tb.color, false);
  if (big && grid[big.r][big.c] === big) {   // 2回目の大爆発
    await gravity();
    const r0 = big.r, c0 = big.c, set2 = new Set([keyOf(big)]);
    for (let r = r0 - 2; r <= r0 + 2; r++) for (let c = c0 - 2; c <= c0 + 2; c++) if (isCell(r, c)) set2.add(r * COLS + c);
    await wait(200); fxShock(r0, c0, 3); sfx.wrap(); shake(2);
    await clearCells(set2, 2, big.color, false);
  }
}

/* ================= 入れ替え ================= */
async function trySwap(a, b) {
  if (busy || ended) return;
  const ta = grid[a.r][a.c], tb = grid[b.r][b.c];
  if (!swappable(ta) || !swappable(tb)) { if (ta && ta.lock || tb && tb.lock) { sfx.bad(); wobble(ta && ta.lock ? ta : tb); } return; }
  busy = true; clearHint(); clearSelect(); hideTutorial();
  grid[a.r][a.c] = tb; grid[b.r][b.c] = ta; place(ta, b.r, b.c); place(tb, a.r, a.c); sfx.swap();
  await wait(190);
  const combo = (isSpecialCandy(ta) && isSpecialCandy(tb)) || (ta.special === 'bomb' && tb.kind === 'candy') || (tb.special === 'bomb' && ta.kind === 'candy');
  if (combo) {
    useMove();
    await comboSpecial(ta, tb); await gravity(); await resolveBoard(null);
    return afterMove();
  }
  if (!findGroups().length) {
    sfx.bad();
    grid[a.r][a.c] = ta; grid[b.r][b.c] = tb; place(ta, a.r, a.c); place(tb, b.r, b.c);
    await wait(190); busy = false; resetHint(); return;
  }
  useMove();
  await resolveBoard([a.r * COLS + a.c, b.r * COLS + b.c]);
  return afterMove();
}
function wobble(t) { if (!t) return; t.gem.classList.remove('hit'); void t.gem.offsetWidth; t.gem.classList.add('hit'); }
function useMove() { moves--; movesUsed++; chocoHit = false; firstMoveDone = true; updateHud(); const m = $('moves'); m.classList.remove('bump'); void m.offsetWidth; m.classList.add('bump'); }
async function shuffleBoard(word = 'シャッフル!') {
  showWord(word); await wait(500);
  const tiles = grid.flat().filter(t => t && t.kind === 'candy' && !t.lock);
  const slots = tiles.map(t => [t.r, t.c]);
  let ok = false;
  for (let i = 0; i < 200 && !ok; i++) {
    const order = shuffled(tiles);
    order.forEach((t, idx) => { const [r, c] = slots[idx]; grid[r][c] = t; t.r = r; t.c = c; });
    ok = !findGroups().length && !!findMove();
  }
  for (let i = 0; i < 50 && !ok; i++) {
    tiles.forEach(t => { if (!t.special) { t.color = randColor(); styleTile(t); } });
    ok = !findGroups().length && !!findMove();
  }
  tiles.forEach(t => { t.el.style.transition = 'transform .4s ease-in-out'; place(t, t.r, t.c); });
  await wait(450); tiles.forEach(t => t.el.style.transition = '');
}
// チョコ:その手でひとつもこわさなかったら、となりのおかしを1つ食べてふえる
async function chocoSpread() {
  const chocos = grid.flat().filter(t => t && t.kind === 'choco');
  if (!chocos.length || chocoHit) return;
  const opts = [];
  for (const ch of chocos) for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const r = ch.r + dr, c = ch.c + dc; if (!isCell(r, c)) continue;
    const t = grid[r][c]; if (t && t.kind === 'candy' && !t.special && !t.lock) opts.push(t);
  }
  if (!opts.length) return;
  const t = opts[Math.floor(Math.random() * opts.length)];
  const nt = makeTile('choco'); placeNow(nt, t.r, t.c); grid[t.r][t.c] = nt; t.el.remove();
  nt.gem.classList.add('spawn'); sfx.choco(); later(() => fxCrumbs(nt.r, nt.c, '#6a3418', 8), 0);
  await wait(350);
  if (!findGroups().length && !findMove()) await shuffleBoard();
}

/* ================= ハンマー ================= */
async function hammerAt(r, c) {
  const t = grid[r][c]; if (!t || t.kind === 'ing') { sfx.bad(); return; }
  hammerMode = false; $('game').classList.remove('hammering'); busy = true; clearHint();
  save.items.hammer--; persist(); updateBoosters();
  sfx.item(); shake(2); vib(40); const p = cc(r, c); later(() => fxText(p.x, p.y, 'ゴン!', '#fff', p.s * .7), 0);
  await clearCells(new Set([r * COLS + c]), 1, t.color, false);
  await gravity(); await resolveBoard(null);
  updateHud();
  if (allGoalsDone()) return finish(true);
  if (!findMove()) await shuffleBoard();
  busy = false; resetHint();
}

/* ================= 進行 ================= */
async function afterMove() {
  await chocoSpread();
  updateHud();
  if (allGoalsDone()) return finish(true);
  if (moves <= 0) return outOfMoves();
  if (!findMove()) await shuffleBoard();
  busy = false; resetHint();
}
// クリア後:のこり手数ぶん、しましまに変身して一気に発動(あまあまタイム)
async function sugarTime() {
  if (moves > 0) {
    showWord('あまあまタイム!'); sfx.word(); await wait(800);
    let i = 0;
    while (moves > 0) {
      const cand = grid.flat().filter(t => t && t.kind === 'candy' && !t.special && !t.lock); if (!cand.length) { score += 300 * moves; moves = 0; break; }
      const t = cand[Math.floor(Math.random() * cand.length)];
      t.special = Math.random() < .5 ? 'lineH' : 'lineV'; styleTile(t); t.gem.classList.add('spawn');
      fxSparkles(t.r, t.c, 8, '#fff8c0'); moves--; updateHud(); sfx.tick(i++);
      await wait(110);
    }
  }
  for (let i = 0; i < 10; i++) {   // 盤面に残ったスペシャルも全部発動
    const sp = grid.flat().filter(t => t && t.kind === 'candy' && t.special);
    if (!sp.length) break;
    await wait(300);
    await clearCells(new Set(sp.map(keyOf)), 1, sp[0].color, false);
    await gravity(); await resolveBoard(null);
  }
}
function starsFor(sc) {
  let n = 1;
  if (sc >= S.stars[1]) n = 2; if (sc >= S.stars[2]) n = 3;
  return n;
}

/* ================= ヒント・選択・自動プレイ ================= */
// いちばん良さそうな手を選ぶ(ヒントとテスト用の自動プレイで使う)
function evalMove(m) {
  const [[r1, c1], [r2, c2]] = m, a = grid[r1][c1], b = grid[r2][c2];
  if (isSpecialCandy(a) && isSpecialCandy(b)) return 40;
  if (a.special === 'bomb' || b.special === 'bomb') return 30;
  // のこりが少ないゴールほど重く見る(最後の1つをねらう)
  const urg = t => { const g = S.goals.find(x => x.t === t); if (!g) return 0; const l = goalLeft(g); return l ? 2 + 14 / (l + 1) : 0; };
  const wJ = urg('jelly'), wS = Math.max(2, urg('cream'), urg('choco')), wI = 4 + urg('ing') * 1.5, wL = 2 + urg('lock');
  const cellVal = k => { const r = Math.floor(k / COLS), c = k % COLS, t = grid[r][c];
    return cells[r][c].jelly * wJ + (isStatic(t) ? wS : 0) + (t && t.lock ? wL : 0); };
  grid[r1][c1] = b; grid[r2][c2] = a;
  const gs = findGroups(); let v = 0;
  for (const g of gs) {
    v += g.cells.size;
    const s = decideSpecial(g, null); if (s) v += s.type === 'bomb' ? 12 : s.type === 'wrap' ? 7 : 5;
    for (const k of g.cells) { const r = Math.floor(k / COLS), c = k % COLS, t = grid[r][c];
      if (t.special) { v += 4; if (t.special !== 'bomb') for (const k2 of specialArea(t).cells) v += cellVal(k2) * .7; }
      if (t.lock) v += wL;
      v += cells[r][c].jelly * wJ;
      for (const [dr, dc] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) if (inB(r + dr, c + dc) && isStatic(grid[r + dr][c + dc])) v += wS;
      for (let y = r - 1; y >= 0; y--) { const u = grid[y][c]; if (u && u.kind === 'ing') { v += wI + (ROWS - y) * .3; break; } }
      const cg = S.goals.find(x => x.t === 'collect' && x.c === t.color); if (cg && goalLeft(cg) > 0) v += 1.5;
    }
    v += (ROWS - Math.min(...[...g.cells].map(k => Math.floor(k / COLS)))) * .15;   // 下のほうを消すと連鎖しやすい
  }
  grid[r1][c1] = a; grid[r2][c2] = b;
  return v + Math.random() * .5;
}
function bestMove() { let best = null, bv = -1; for (const m of allMoves()) { const v = evalMove(m); if (v > bv) { bv = v; best = m; } } return best; }
function resetHint() {
  clearHint();
  hintTimer = setTimeout(() => { if (busy || ended) return; const m = findMove(); if (m) m.forEach(([r, c]) => grid[r][c] && grid[r][c].gem.classList.add('hint')); }, 5000);
}
function clearHint() { clearTimeout(hintTimer); if (board) board.querySelectorAll('.hint').forEach(e => e.classList.remove('hint')); }
function clearSelect() { if (selected) { const t = grid[selected.r][selected.c]; if (t) t.gem.classList.remove('sel'); } selected = null; }

/* ================= 操作 ================= */
let drag = null;
const cellSize = () => board.getBoundingClientRect().width / COLS;
function cellFromEvent(e) {
  const rc = board.getBoundingClientRect();
  const c = Math.floor((e.clientX - rc.left) / (rc.width / COLS)), r = Math.floor((e.clientY - rc.top) / (rc.height / ROWS));
  return isCell(r, c) ? { r, c } : null;
}
function initInput() {
  board.addEventListener('pointerdown', e => {
    if (busy || ended) return;
    const cell = cellFromEvent(e); if (!cell) return;
    if (hammerMode) { hammerAt(cell.r, cell.c); return; }
    drag = { ...cell, x: e.clientX, y: e.clientY, moved: false };
    try { board.setPointerCapture(e.pointerId); } catch (_) {}
  });
  board.addEventListener('pointermove', e => {
    if (!drag || drag.moved) return;
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y, th = cellSize() * .3;
    if (Math.abs(dx) < th && Math.abs(dy) < th) return;
    drag.moved = true;
    let r2 = drag.r, c2 = drag.c;
    if (Math.abs(dx) > Math.abs(dy)) c2 += Math.sign(dx); else r2 += Math.sign(dy);
    if (isCell(r2, c2)) trySwap({ r: drag.r, c: drag.c }, { r: r2, c: c2 });
  });
  board.addEventListener('pointerup', () => {
    if (!drag) return;
    const d = drag; drag = null;
    if (d.moved || busy || ended) return;
    if (selected) {
      const adj = Math.abs(selected.r - d.r) + Math.abs(selected.c - d.c) === 1;
      if (adj) { const s = selected; clearSelect(); trySwap(s, d); return; }
      const same = selected.r === d.r && selected.c === d.c; clearSelect(); if (same) return;
    }
    const t = grid[d.r][d.c]; if (!swappable(t)) { if (t && t.lock) { wobble(t); sfx.bad(); } return; }
    selected = { r: d.r, c: d.c }; t.gem.classList.add('sel'); tone(880, .05, 'sine', .05);
  });
  board.addEventListener('pointercancel', () => drag = null);
  board.addEventListener('animationend', e => { if (e.target.classList.contains('gem')) e.target.classList.remove('land', 'spawn', 'hit', 'fadein');
    if (e.target.classList.contains('cell')) e.target.classList.remove('wob'); });
}
