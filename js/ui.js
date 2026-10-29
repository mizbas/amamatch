// あまあまマッチ:画面(マップ・スタート・HUD・クリア・ショップ・設定・チュートリアル)
"use strict";
/* ================= セーブ ================= */
const KEY = 'amamatch-v2';
const fresh = () => ({ stars: {}, best: {}, coins: 300, items: { hammer: 2, shuffle: 2, plus5: 1, startLW: 1, startBomb: 1 },
  sound: true, seVol: 1, bgmVol: .6, vib: true, tips: {}, plays: 0 });
let save = fresh();
try { const s = JSON.parse(localStorage.getItem(KEY)); if (s && typeof s === 'object') save = Object.assign(fresh(), s, { items: Object.assign(fresh().items, s.items || {}), tips: s.tips || {} }); } catch (e) {}
function persist() { try { localStorage.setItem(KEY, JSON.stringify(save)); } catch (e) {} }
const unlocked = i => i === 0 || (save.stars[STAGES[i - 1].id] || 0) > 0;

/* ================= 画面きりかえ・テーマ ================= */
function show(id) { document.querySelectorAll('.screen').forEach(s => s.classList.toggle('active', s.id === id)); }
function theme(w) {
  const W = WORLDS[w - 1], b = document.body.style;
  b.setProperty('--bg1', W.bg[0]); b.setProperty('--bg2', W.bg[1]); b.setProperty('--bg3', W.bg[2]); b.setProperty('--boardbg', W.board);
}
function layout() {
  resizeFx();
  const w = Math.min(window.innerWidth - 24, 520), h = window.innerHeight - 250;
  const s = Math.max(28, Math.floor(Math.min(w, h) / COLS));
  board.style.setProperty('--s', s + 'px'); board.style.width = s * COLS + 'px'; board.style.height = s * ROWS + 'px';
}
function coinHTML(n) { return `<span class="coin"><i class="ico ico-coin"></i>${n.toLocaleString()}</span>`; }
function refreshCoins() { document.querySelectorAll('.coins-now').forEach(e => e.innerHTML = coinHTML(save.coins)); }

/* ================= マップ ================= */
const NODE_X = [50, 74, 80, 62, 38, 20, 28, 52];
function renderMap() {
  const box = $('worlds'); box.innerHTML = '';
  refreshCoins();
  let cur = null;
  WORLDS.forEach(W => {
    const list = STAGES.filter(s => s.w === W.w);
    const open = unlocked(list[0].idx);
    const sec = document.createElement('section'); sec.className = 'world' + (open ? '' : ' wlocked');
    sec.style.background = `linear-gradient(180deg,${W.bg[0]},${W.bg[1]} 60%,${W.bg[2]})`;
    const H = 86 * list.length + 40;
    let path = '';
    list.forEach((s, i) => { const x = NODE_X[i] * 3.6, y = H - 50 - i * 86; path += (i ? 'L' : 'M') + x + ' ' + y; });
    sec.innerHTML = `<div class="wbanner"><small>ワールド${W.w}</small>${W.name}</div>
      <div class="wpath" style="height:${H}px"><svg viewBox="0 0 360 ${H}" preserveAspectRatio="none"><path d="${path}" fill="none" stroke="#fff" stroke-width="7" stroke-linecap="round" stroke-dasharray="2 16" opacity=".8"/></svg></div>`;
    const wp = sec.querySelector('.wpath');
    list.forEach((s, i) => {
      const b = document.createElement('button'); b.className = 'lv';
      b.style.left = NODE_X[i] + '%'; b.style.top = (H - 50 - i * 86) + 'px';
      const st = save.stars[s.id] || 0, ok = unlocked(s.idx);
      if (!ok) { b.disabled = true; b.classList.add('locked'); b.innerHTML = '<span>🔒</span>'; }
      else { b.innerHTML = `<span>${s.id}</span><small>${[0, 1, 2].map(k => `<i class="${k < st ? 'on' : ''}">★</i>`).join('')}</small>`;
        b.onclick = () => { sfx.tap(); openStart(s.idx); }; }
      if (ok && !st) { b.classList.add('current'); cur = b; }
      if (i === list.length - 1) b.classList.add('boss');
      wp.appendChild(b);
    });
    if (!open) sec.insertAdjacentHTML('beforeend', `<div class="wlock">🔒 ${STAGES[list[0].idx - 1].id} をクリアするとひらくよ</div>`);
    box.appendChild(sec);
  });
  box.insertAdjacentHTML('beforeend', `<p class="credit">${CREDITS}</p>`);
  // 下から上へ進むので、ワールドを逆にならべる
  box.append(...[...box.querySelectorAll('.world')].reverse()); box.append(box.querySelector('.credit'));
  if (cur) setTimeout(() => cur.scrollIntoView({ block: 'center' }), 0);
  else setTimeout(() => $('map').scrollTop = 0, 0);
}
function goMap() { closeModal(); hideTutorial(); ended = true; renderMap(); show('map'); bgm('map'); theme(1); }

/* ================= ゴール表示 ================= */
function goalIcon(g) {
  switch (g.t) {
    case 'score': return `<span class="gi gi-star">★</span>`;
    case 'collect': return `<span class="gi gem ${candClass(g.c)}"></span>`;
    case 'jelly': return `<span class="gi gi-jelly"></span>`;
    case 'cream': return `<span class="gi gem cream-2"></span>`;
    case 'choco': return `<span class="gi gem choco"></span>`;
    case 'lock': return `<span class="gi gi-lock"><span class="gem ${candClass(4)}"></span><span class="lockover"></span></span>`;
    case 'ing': return `<span class="gi gem ing-0"></span>`;
  }
  return '';
}
function goalText(g) {
  switch (g.t) {
    case 'score': return `${g.n.toLocaleString()}点とる`;
    case 'collect': return `${CNAME[g.c]}を${g.n}こ あつめる`;
    case 'jelly': return 'ゼリーをぜんぶ消す';
    case 'cream': return 'クリームをぜんぶこわす';
    case 'choco': return 'チョコをぜんぶこわす';
    case 'lock': return 'カギをぜんぶ外す';
    case 'ing': return `さくらんぼを${g.n}こ 下まで落とす`;
  }
  return '';
}
const goalKey = g => g.t + (g.t === 'collect' ? g.c : '');
let lastLeft = {};
function updateHud() {
  if (!S) return;
  $('moves').textContent = Math.max(0, moves);
  $('movesBox').classList.toggle('low', moves <= 5 && !ended);
  const box = $('goals');
  if (box.dataset.stage !== S.id) {
    box.dataset.stage = S.id; lastLeft = {};
    box.innerHTML = S.goals.map(g => `<div class="goalitem" data-g="${goalKey(g)}">${goalIcon(g)}<b></b></div>`).join('');
  }
  S.goals.forEach(g => {
    const el = box.querySelector(`[data-g="${goalKey(g)}"]`), left = goalLeft(g), k = goalKey(g);
    const b = el.querySelector('b');
    b.textContent = left === 0 ? '' : (g.t === 'score' ? g.n.toLocaleString() : left);
    if (left === 0 && !el.classList.contains('done')) { el.classList.add('done'); if (lastLeft[k] != null) { sfx.goal(); } }
    else if (left > 0) el.classList.remove('done');
    if (lastLeft[k] != null && left < lastLeft[k]) { b.classList.remove('bump'); void b.offsetWidth; b.classList.add('bump'); }
    lastLeft[k] = left;
  });
  const max = S.stars[2];
  $('scoreFill').style.width = Math.min(100, score / max * 100) + '%';
  S.stars.forEach((t, i) => { const m = $('m' + i);
    m.style.display = t ? '' : 'none'; m.style.left = Math.min(97, t / max * 100) + '%'; m.classList.toggle('on', score >= t); });
  if (!scoreAnim) scoreAnim = requestAnimationFrame(function step() {
    shownScore += Math.max(1, Math.ceil((score - shownScore) * .18));
    if (shownScore >= score) shownScore = score;
    $('score').textContent = shownScore.toLocaleString();
    scoreAnim = shownScore < score ? requestAnimationFrame(step) : null;
  });
}
let scoreAnim = null;

/* ================= アイテム ================= */
function updateBoosters() {
  for (const k of ['hammer', 'shuffle']) {
    const b = $('bst-' + k); if (!b) continue; const n = save.items[k] || 0;
    b.querySelector('b').innerHTML = n ? n : `<i class="ico ico-coin"></i>${ITEMS[k].price}`;
    b.classList.toggle('empty', !n);
  }
}
function buy(k) {
  if (save.coins < ITEMS[k].price) { sfx.bad(); toast('コインが足りないよ'); return false; }
  save.coins -= ITEMS[k].price; save.items[k] = (save.items[k] || 0) + 1; persist(); sfx.coins(); refreshCoins(); return true;
}
function useBooster(k) {
  if (busy || ended) return;
  if (!(save.items[k] > 0)) { if (!buy(k)) return; }
  sfx.tap();
  if (k === 'hammer') {
    hammerMode = !hammerMode; $('game').classList.toggle('hammering', hammerMode);
    if (hammerMode) toast('こわしたいマスをタップ!'); updateBoosters(); return;
  }
  if (k === 'shuffle') {
    save.items.shuffle--; persist(); updateBoosters(); busy = true; clearHint();
    shuffleBoard('まぜまぜ!').then(() => { busy = false; resetHint(); });
  }
  updateBoosters();
}

/* ================= スタート ================= */
let pre = { startLW: false, startBomb: false };
function openStart(idx) {
  const s = STAGES[idx], W = WORLDS[s.w - 1];
  if (W.intro && !save.tips['w' + W.w] && s.idx === STAGES.findIndex(x => x.w === W.w)) return openIntro(idx);
  pre = { startLW: false, startBomb: false };
  const best = save.best[s.id];
  openModal(`<div class="sttl"><small>${W.name}</small>ステージ ${s.id}</div>
    <div class="stars small">${[0, 1, 2].map(k => `<span class="${k < (save.stars[s.id] || 0) ? 'on' : ''}">★</span>`).join('')}</div>
    <div class="goallist">${s.goals.map(g => `<div>${goalIcon(g)}<span>${goalText(g)}</span></div>`).join('')}</div>
    <p class="mv"><b>${s.moves}</b>手でクリアしよう${best ? `<br><small>ベスト ${best.toLocaleString()}点</small>` : ''}</p>
    <div class="prebst">${['startLW', 'startBomb'].map(k => `<button class="pb" data-pre="${k}"><i class="ico ico-${k}"></i><span>${ITEMS[k].name}</span><b>${save.items[k] ? '×' + save.items[k] : `<i class="ico ico-coin"></i>${ITEMS[k].price}`}</b></button>`).join('')}</div>
    <div class="btns"><button class="btn" data-act="close">とじる</button><button class="btn main" data-act="go" data-idx="${idx}">はじめる!</button></div>`);
}
function openIntro(idx) {
  const s = STAGES[idx], W = WORLDS[s.w - 1];
  openModal(`<div class="sttl"><small>ワールド${W.w}</small>${W.name}</div>
    <div class="introart art-${W.intro.art} ${{ cream: 'cream-2', ing: 'ing-0', choco: 'choco' }[W.intro.art] || ''}"></div>
    <h3 class="newg">あたらしいしかけ:${W.intro.title}</h3><p class="introtext">${W.intro.text}</p>
    <div class="btns"><button class="btn main" data-act="intro" data-idx="${idx}">わかった!</button></div>`);
  sfx.sparkle();
}
async function startStage(idx, preUse = {}) {
  closeModal(); hideTutorial();
  S = STAGES[idx]; theme(S.w);
  moves = S.moves; score = 0; shownScore = 0; got = {}; ended = false; busy = true; selected = null; hammerMode = false; continued = 0; movesUsed = 0; chocoHit = false; firstMoveDone = false;
  $('game').classList.remove('hammering');
  $('lvNum').textContent = S.id; $('wName').textContent = WORLDS[S.w - 1].name;
  $('goals').dataset.stage = '';
  show('game'); layout();
  buildBoard(preUse); updateHud(); updateBoosters();
  bgm(WORLDS[S.w - 1].bgm);
  save.plays++; persist();
  await introDrop();
  if (window.__fast) { busy = false; return; }
  showWord(`ステージ ${S.id}`);
  await wait(700);
  busy = false; resetHint();
  if (S.tut === 'swipe' && !save.tips.swipe) showTutorial();
  if (S.tut === 'special' && !save.tips.special) { save.tips.special = 1; persist();
    tipCard('スペシャルキャンディ', `<div class="tiprow"><span class="gem ${candClass(1, 'lineH')}"></span><span>4つ一直線 → <b>しましま</b>(1列消える)</span></div>
      <div class="tiprow"><span class="gem ${candClass(3, 'wrap')}"></span><span>L字・T字 → <b>つつみ</b>(まわりを2回ドカン)</span></div>
      <div class="tiprow"><span class="gem cand-bomb"></span><span>5つ一直線 → <b>チョコボム</b>(入れかえた色がぜんぶ消える)</span></div>
      <p class="small">スペシャル同士を入れかえると、もっとすごい合体技に!</p>`); }
}

/* ================= おわり ================= */
async function outOfMoves() {
  busy = true; clearHint();
  if (window.__fast) { ended = true; window.__onEnd && window.__onEnd({ win: false, score }); return; }
  await wait(400);
  const can = save.items.plus5 > 0, price = ITEMS.plus5.price;
  openModal(`<h2 class="sad">手数がなくなった…</h2>
    <div class="goallist left">${S.goals.filter(g => goalLeft(g) > 0).map(g => `<div>${goalIcon(g)}<span>のこり <b>${g.t === 'score' ? goalLeft(g).toLocaleString() + '点' : goalLeft(g)}</b></span></div>`).join('')}</div>
    <p>あと少し!</p>
    <div class="btns col"><button class="btn main" data-act="cont"><i class="ico ico-plus5"></i> +5手で続ける <small>${can ? `(のこり${save.items.plus5})` : `<i class="ico ico-coin"></i>${price}`}</small></button>
    <button class="btn" data-act="giveup">あきらめる</button></div>`);
}
function continueGame() {
  if (save.items.plus5 > 0) save.items.plus5--; else if (save.coins >= ITEMS.plus5.price) { save.coins -= ITEMS.plus5.price; sfx.coins(); } else { sfx.bad(); toast('コインが足りないよ'); return; }
  persist(); closeModal(); continued++; moves += 5; updateHud(); sfx.item(); showWord('+5手!');
  busy = false; ended = false; resetHint();
}
function giveUp() {
  ended = true; sfx.lose();
  openModal(`<h2 class="sad">ざんねん…</h2><p>ステージ ${S.id}</p>
    <div class="btns"><button class="btn" data-act="map">マップ</button><button class="btn main" data-act="retry">もういちど</button></div>`);
}
async function finish(won) {
  ended = true; busy = true; clearHint(); hideTutorial();
  if (window.__fast) { const st = starsFor(score); window.__onEnd && window.__onEnd({ win: true, score, stars: st, left: moves, used: movesUsed }); return; }
  await wait(300);
  showWord('クリア!'); sfx.goal(); await wait(900);
  await sugarTime();
  await wait(400);
  const st = starsFor(score), prev = save.stars[S.id] || 0, first = !prev;
  const coins = 20 + st * 15 + (first ? 60 : 0) + Math.max(0, st - prev) * 20;
  save.stars[S.id] = Math.max(prev, st); save.best[S.id] = Math.max(save.best[S.id] || 0, score);
  save.coins += coins; persist();
  sfx.win(); vib([30, 60, 30]); if (st === 3) setTimeout(sfx.clap, 900);
  const nextIdx = S.idx + 1 < STAGES.length ? S.idx + 1 : null;
  openModal(`<h2>クリア!</h2>
    <div class="stars">${[0, 1, 2].map(i => `<span class="${i < st ? 'on' : ''}" style="animation-delay:${.25 + i * .3}s">★</span>`).join('')}</div>
    <p>スコア <b>${score.toLocaleString()}</b> 点${score >= (save.best[S.id] || 0) && !first ? ' <span class="newbest">ベスト!</span>' : ''}</p>
    <p class="earn">${coinHTML(0)}</p>
    <div class="btns"><button class="btn" data-act="map">マップ</button>${nextIdx != null ? `<button class="btn main" data-act="next" data-idx="${nextIdx}">つぎへ ›</button>` : '<button class="btn main" data-act="map">おわり!</button>'}</div>`);
  for (let i = 0; i < st; i++) setTimeout(() => tone(1046 * Math.pow(2, i * 4 / 12), .25, 'triangle', .1), 250 + i * 300);
  // コインのカウントアップ
  const el = document.querySelector('.earn'); let n = 0; const step = Math.max(1, Math.ceil(coins / 25));
  setTimeout(function up() { n = Math.min(coins, n + step); el.innerHTML = '+' + coinHTML(n); if (n % (step * 3) === 0) sfx.coin(); if (n < coins) setTimeout(up, 30); else sfx.coins(); }, 1300);
}

/* ================= モーダル ================= */
function openModal(html) { $('card').innerHTML = html; $('modal').classList.remove('hidden'); }
function closeModal() { $('modal').classList.add('hidden'); }
function initModal() {
  $('card').addEventListener('click', e => {
    const btn = e.target.closest('[data-act],[data-pre],[data-buy]'); if (!btn) return;
    if (btn.dataset.pre) {
      const k = btn.dataset.pre;
      if (pre[k]) { pre[k] = false; btn.classList.remove('on'); sfx.tap(); return; }
      if (!(save.items[k] > 0)) { if (!buy(k)) return; btn.querySelector('b').textContent = '×' + save.items[k]; }
      pre[k] = true; btn.classList.add('on'); sfx.item(); return;
    }
    if (btn.dataset.buy) { const k = btn.dataset.buy; if (buy(k)) { openShop(); } return; }
    const act = btn.dataset.act; sfx.tap();
    if (act === 'close') closeModal();
    if (act === 'go') { const use = {}; for (const k in pre) if (pre[k]) { save.items[k]--; use[k] = true; } persist(); startStage(+btn.dataset.idx, use); }
    if (act === 'intro') { save.tips['w' + STAGES[+btn.dataset.idx].w] = 1; persist(); openStart(+btn.dataset.idx); }
    if (act === 'map') goMap();
    if (act === 'retry') openStart(S.idx);
    if (act === 'next') { closeModal(); renderMap(); show('map'); bgm('map'); theme(1); openStart(+btn.dataset.idx); }
    if (act === 'resume') closeModal();
    if (act === 'cont') continueGame();
    if (act === 'giveup') giveUp();
  });
}

/* ================= ショップ・設定 ================= */
function openShop() {
  openModal(`<h2>ショップ</h2><p class="coins-now">${coinHTML(save.coins)}</p>
    <div class="shoplist">${Object.entries(ITEMS).map(([k, it]) => `<div class="shopitem"><i class="ico ico-${k}"></i>
      <div><b>${it.name}</b> <small>×${save.items[k] || 0}</small><p>${it.desc}</p></div>
      <button class="btn buy" data-buy="${k}"><i class="ico ico-coin"></i>${it.price}</button></div>`).join('')}</div>
    <p class="small">コインはステージをクリアするともらえるよ。星が多いほどたくさん!</p>
    <div class="btns"><button class="btn main" data-act="close">とじる</button></div>`);
}
function openSettings() {
  openModal(`<h2>せってい</h2>
    <div class="setrow"><span>音</span><button class="tg ${save.sound ? 'on' : ''}" id="tgSound">${save.sound ? 'ON' : 'OFF'}</button></div>
    <div class="setrow"><span>BGM</span><input type="range" min="0" max="1" step=".05" value="${save.bgmVol}" id="rgBgm"></div>
    <div class="setrow"><span>効果音</span><input type="range" min="0" max="1" step=".05" value="${save.seVol}" id="rgSe"></div>
    <div class="setrow"><span>ふるえる</span><button class="tg ${save.vib ? 'on' : ''}" id="tgVib">${save.vib ? 'ON' : 'OFF'}</button></div>
    <p class="small">${CREDITS}</p>
    <div class="btns"><button class="btn main" data-act="close">とじる</button></div>`);
  $('tgSound').onclick = e => { save.sound = !save.sound; e.target.textContent = save.sound ? 'ON' : 'OFF'; e.target.classList.toggle('on', save.sound); applyVolume(); persist(); sfx.tap(); };
  $('tgVib').onclick = e => { save.vib = !save.vib; e.target.textContent = save.vib ? 'ON' : 'OFF'; e.target.classList.toggle('on', save.vib); persist(); vib(30); };
  $('rgBgm').oninput = e => { save.bgmVol = +e.target.value; applyVolume(); persist(); };
  $('rgSe').oninput = e => { save.seVol = +e.target.value; applyVolume(); persist(); };
  $('rgSe').onchange = () => sfx.pop(1);
}

/* ================= チュートリアル・ヒント表示 ================= */
let tutTimer = null;
function showTutorial() {
  const m = bestMove(); if (!m) return;
  const [[r1, c1], [r2, c2]] = m, hand = $('hand'), bub = $('bubble');
  const a = cc(r1, c1), b = cc(r2, c2);
  hand.style.setProperty('--x1', a.x + 'px'); hand.style.setProperty('--y1', a.y + 'px');
  hand.style.setProperty('--x2', b.x + 'px'); hand.style.setProperty('--y2', b.y + 'px');
  hand.classList.add('show');
  bub.innerHTML = 'となりのおかしと<b>入れかえて</b>、<br>おなじものを<b>3つ</b>そろえよう!'; bub.classList.add('show');
  grid[r1][c1].gem.classList.add('hint'); grid[r2][c2].gem.classList.add('hint');
}
function hideTutorial() {
  const h = $('hand'), b = $('bubble'); if (!h) return;
  if (h.classList.contains('show')) { save.tips.swipe = 1; persist(); }
  h.classList.remove('show'); b.classList.remove('show');
}
function tipCard(title, html) {
  const el = $('tipcard'); el.innerHTML = `<h3>${title}</h3>${html}<button class="btn main" id="tipOk">OK!</button>`;
  el.classList.add('show'); $('tipOk').onclick = () => { el.classList.remove('show'); sfx.tap(); };
}
const SP_TIPS = { lineH: ['しましまキャンディ!', '使うと1列ぜんぶ消えるよ'], lineV: ['しましまキャンディ!', '使うと1列ぜんぶ消えるよ'],
  wrap: ['つつみキャンディ!', 'まわりを2回ドカン!'], bomb: ['チョコボム!', '入れかえた色がぜんぶ消えるよ'] };
function specialTip(type) {
  const k = type === 'lineV' ? 'lineH' : type;
  if (window.__fast || save.tips['sp_' + k]) return; save.tips['sp_' + k] = 1; persist();
  const [t, d] = SP_TIPS[type]; toast(`<b>${t}</b> ${d}`, 2600);
}
let toastTimer = null;
function toast(html, ms = 1800) {
  if (window.__fast) return;
  const el = $('toast'); el.innerHTML = html; el.classList.add('show');
  clearTimeout(toastTimer); toastTimer = setTimeout(() => el.classList.remove('show'), ms);
}

/* ================= 起動 ================= */
function initUI() {
  board = $('board'); initFx(); initInput(); initModal();
  $('backBtn').onclick = () => { sfx.tap();
    if (ended) { goMap(); return; }
    openModal(`<h2 style="font-size:24px">マップにもどる?</h2><p>このステージはやりなおしになるよ</p>
      <div class="btns"><button class="btn" data-act="resume">つづける</button><button class="btn main" data-act="map">もどる</button></div>`); };
  $('bst-hammer').onclick = () => useBooster('hammer');
  $('bst-shuffle').onclick = () => useBooster('shuffle');
  $('shopBtn').onclick = () => { sfx.tap(); openShop(); };
  $('setBtn').onclick = () => { sfx.tap(); openSettings(); };
  window.addEventListener('resize', layout);
  const bg = $('bg');
  for (let i = 0; i < 10; i++) { const b = document.createElement('i'); const s = 30 + Math.random() * 90;
    b.style.cssText = `width:${s}px;height:${s}px;left:${Math.random() * 100}%;animation-duration:${14 + Math.random() * 16}s;animation-delay:-${Math.random() * 30}s`;
    bg.appendChild(b); }
  const row = $('candyrow');
  for (let i = 0; i < 6; i++) { const g = document.createElement('span'); g.className = 'gem ' + candClass(i); g.style.animationDelay = (i * .15) + 's'; row.appendChild(g); }
  theme(1); renderMap(); bgm('map');
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('sw.js').catch(() => {});
}

/* ================= テスト用:自動プレイ ================= */
window.__autoplay = async function (idx, runs) {
  const res = [];
  window.__fast = true;
  for (let i = 0; i < runs; i++) {
    let done = null; window.__onEnd = r => { done = r; };
    await startStage(idx, {});
    for (let step = 0; step < 300 && !done; step++) {
      if (busy) { await new Promise(r => setTimeout(r, 0)); continue; }
      const m = bestMove(); if (!m) { await shuffleBoard(); continue; }
      await trySwap({ r: m[0][0], c: m[0][1] }, { r: m[1][0], c: m[1][1] });
    }
    res.push(done || { win: false, stuck: true, score });
  }
  window.__fast = false;
  return res;
};
document.addEventListener('DOMContentLoaded', initUI);
