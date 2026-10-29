// あまあまマッチ:エフェクト(かけら・ビーム・稲妻・点数・言葉)
"use strict";
let fxc, fctx, parts = [], fxRunning = false, dpr = 1;
function initFx() { fxc = $('fx'); fctx = fxc.getContext('2d'); resizeFx(); }
function resizeFx() {
  dpr = Math.min(2, window.devicePixelRatio || 1);
  fxc.width = innerWidth * dpr; fxc.height = innerHeight * dpr;
  fxc.style.width = innerWidth + 'px'; fxc.style.height = innerHeight + 'px';
}
function cc(r, c) { const rc = board.getBoundingClientRect(), s = rc.width / COLS; return { x: rc.left + (c + .5) * s, y: rc.top + (r + .5) * s, s, rc }; }
function addPart(p) { if (window.__fast) return; parts.push(p); if (!fxRunning) { fxRunning = true; requestAnimationFrame(tick); } }
function drawStar(x, y, s) {
  fctx.beginPath(); fctx.moveTo(x, y - s);
  fctx.quadraticCurveTo(x, y, x + s, y); fctx.quadraticCurveTo(x, y, x, y + s);
  fctx.quadraticCurveTo(x, y, x - s, y); fctx.quadraticCurveTo(x, y, x, y - s); fctx.fill();
}
function tick() {
  fctx.setTransform(dpr, 0, 0, dpr, 0, 0); fctx.clearRect(0, 0, innerWidth, innerHeight);
  parts = parts.filter(p => p.life > 0);
  for (const p of parts) { drawPart(p); p.life -= p.decay; }
  if (parts.length) requestAnimationFrame(tick); else { fctx.clearRect(0, 0, innerWidth, innerHeight); fxRunning = false; }
}
function drawPart(p) {
  const a = Math.max(0, p.life);
  fctx.save(); fctx.globalAlpha = p.kind === 'text' ? Math.min(1, a * 2.5) : a;
  switch (p.kind) {
    case 'shard': {
      p.vy += p.g; p.x += p.vx; p.y += p.vy; p.rot += p.vr; p.vx *= .985;
      fctx.translate(p.x, p.y); fctx.rotate(p.rot);
      const z = p.size * (.5 + a * .5);
      fctx.fillStyle = p.color; fctx.beginPath(); fctx.ellipse(0, 0, z, z * .62, 0, 0, 7); fctx.fill();
      fctx.fillStyle = 'rgba(255,255,255,.7)'; fctx.beginPath(); fctx.ellipse(-z * .3, -z * .2, z * .35, z * .18, 0, 0, 7); fctx.fill();
      break; }
    case 'spark':
      p.x += p.vx; p.y += p.vy; p.vx *= .9; p.vy *= .9;
      fctx.fillStyle = p.color || '#fff'; fctx.shadowColor = '#fff'; fctx.shadowBlur = 8;
      drawStar(p.x, p.y, p.size * (.35 + a * .9)); break;
    case 'ring':
      p.r += p.vr; fctx.strokeStyle = p.color; fctx.lineWidth = Math.max(.5, p.w * a);
      fctx.beginPath(); fctx.arc(p.x, p.y, p.r, 0, 7); fctx.stroke(); break;
    case 'beamH': case 'beamV': {
      const grow = Math.min(1, (1 - a) * 5 + .05), w = p.s * (.2 + 1.1 * a);
      fctx.shadowColor = '#fff6a0'; fctx.shadowBlur = 20;
      if (p.kind === 'beamH') {
        const Lx = p.cx - grow * (p.cx - p.rc.left + p.s), Rx = p.cx + grow * (p.rc.right - p.cx + p.s);
        const g = fctx.createLinearGradient(0, p.cy - w / 2, 0, p.cy + w / 2);
        g.addColorStop(0, 'rgba(255,240,160,0)'); g.addColorStop(.5, '#fff'); g.addColorStop(1, 'rgba(255,240,160,0)');
        fctx.fillStyle = g; fctx.fillRect(Lx, p.cy - w / 2, Rx - Lx, w);
      } else {
        const T = p.cy - grow * (p.cy - p.rc.top + p.s), B = p.cy + grow * (p.rc.bottom - p.cy + p.s);
        const g = fctx.createLinearGradient(p.cx - w / 2, 0, p.cx + w / 2, 0);
        g.addColorStop(0, 'rgba(255,240,160,0)'); g.addColorStop(.5, '#fff'); g.addColorStop(1, 'rgba(255,240,160,0)');
        fctx.fillStyle = g; fctx.fillRect(p.cx - w / 2, T, w, B - T);
      }
      break; }
    case 'bolt': {
      fctx.strokeStyle = '#fff'; fctx.shadowColor = p.color; fctx.shadowBlur = 16; fctx.lineWidth = 3.5 * a + .5; fctx.lineJoin = 'round';
      fctx.beginPath(); fctx.moveTo(p.x1, p.y1);
      for (let i = 1; i < 6; i++) { const t = i / 6;
        fctx.lineTo(p.x1 + (p.x2 - p.x1) * t + (Math.random() - .5) * p.j, p.y1 + (p.y2 - p.y1) * t + (Math.random() - .5) * p.j); }
      fctx.lineTo(p.x2, p.y2); fctx.stroke(); break; }
    case 'text': {
      p.y += p.vy; p.vy *= .95;
      const sc = Math.min(1, (1 - a) * 7 + .4);
      fctx.translate(p.x, p.y); fctx.scale(sc, sc);
      fctx.font = `900 ${p.size}px "Hiragino Maru Gothic ProN","M PLUS Rounded 1c",sans-serif`;
      fctx.textAlign = 'center'; fctx.textBaseline = 'middle'; fctx.lineJoin = 'round';
      fctx.lineWidth = p.size * .22; fctx.strokeStyle = '#3a1650'; fctx.strokeText(p.text, 0, 0);
      fctx.fillStyle = p.color; fctx.fillText(p.text, 0, 0); break; }
    case 'flash':
      fctx.globalAlpha = a * .7; fctx.fillStyle = '#fff'; fctx.fillRect(0, 0, innerWidth, innerHeight); break;
    case 'fly': {   // ゴールへ飛んでいくおかし
      const t = 1 - a, e = t * t * (3 - 2 * t);
      const x = p.x1 + (p.x2 - p.x1) * e, y = p.y1 + (p.y2 - p.y1) * e - Math.sin(e * Math.PI) * 60;
      fctx.globalAlpha = 1; fctx.fillStyle = p.color; fctx.shadowColor = '#fff'; fctx.shadowBlur = 10;
      drawStar(x, y, p.size * (1 - e * .5)); break; }
  }
  fctx.restore();
}
function fxPop(r, c, color) {
  const p = cc(r, c), s = p.s, hex = HEX[color] || '#ffe08a';
  for (let i = 0; i < 7; i++) {
    const ang = Math.random() * 6.283, v = s * (.05 + Math.random() * .11);
    addPart({ kind: 'shard', x: p.x, y: p.y, vx: Math.cos(ang) * v, vy: Math.sin(ang) * v - s * .07, g: s * .009,
      rot: Math.random() * 6, vr: (Math.random() - .5) * .5, size: s * (.07 + Math.random() * .08), color: hex, life: 1, decay: .028 + Math.random() * .02 });
  }
  addPart({ kind: 'spark', x: p.x, y: p.y, vx: 0, vy: 0, size: s * .4, life: 1, decay: .09 });
  addPart({ kind: 'ring', x: p.x, y: p.y, r: s * .22, vr: s * .035, w: s * .09, color: '#fff', life: 1, decay: .08 });
}
function fxCrumbs(r, c, color, n = 9) {   // クリーム・チョコのかけら
  const p = cc(r, c);
  for (let i = 0; i < n; i++) { const ang = Math.random() * 6.283, v = p.s * (.04 + Math.random() * .09);
    addPart({ kind: 'shard', x: p.x, y: p.y, vx: Math.cos(ang) * v, vy: Math.sin(ang) * v - p.s * .05, g: p.s * .01,
      rot: Math.random() * 6, vr: (Math.random() - .5) * .4, size: p.s * (.08 + Math.random() * .09), color, life: 1, decay: .025 + Math.random() * .02 }); }
}
function fxSparkles(r, c, n = 8, color = '#fff') {
  const p = cc(r, c);
  for (let i = 0; i < n; i++) { const ang = Math.random() * 6.283, v = p.s * (.04 + Math.random() * .1);
    addPart({ kind: 'spark', x: p.x, y: p.y, vx: Math.cos(ang) * v, vy: Math.sin(ang) * v, size: p.s * (.12 + Math.random() * .12), color, life: 1, decay: .03 + Math.random() * .02 }); }
}
function fxBeam(dir, r, c) {
  const p = cc(r, c);
  addPart({ kind: dir === 'h' ? 'beamH' : 'beamV', cx: p.x, cy: p.y, s: p.s, rc: p.rc, life: 1, decay: .04 });
  for (let i = 0; i < 14; i++) {
    const t = Math.random();
    const x = dir === 'h' ? p.rc.left + t * p.rc.width : p.x + (Math.random() - .5) * p.s * .6;
    const y = dir === 'h' ? p.y + (Math.random() - .5) * p.s * .6 : p.rc.top + t * p.rc.height;
    addPart({ kind: 'spark', x, y, vx: (Math.random() - .5) * 3, vy: (Math.random() - .5) * 3, size: p.s * .18, color: '#fff6c0', life: 1, decay: .035 });
  }
}
function fxShock(r, c, rad) {
  const p = cc(r, c);
  addPart({ kind: 'ring', x: p.x, y: p.y, r: p.s * .3, vr: p.s * rad * .1, w: p.s * .45, color: '#fff3a0', life: 1, decay: .05 });
  addPart({ kind: 'ring', x: p.x, y: p.y, r: p.s * .2, vr: p.s * rad * .07, w: p.s * .2, color: '#fff', life: 1, decay: .06 });
  fxSparkles(r, c, 14, '#fff3a0');
}
function fxBolts(r, c, targets) {
  const p = cc(r, c);
  for (const [tr, tc] of targets) { const q = cc(tr, tc); addPart({ kind: 'bolt', x1: p.x, y1: p.y, x2: q.x, y2: q.y, j: p.s * .45, color: '#9fe8ff', life: 1, decay: .045 }); }
  addPart({ kind: 'flash', life: 1, decay: .08 });
  fxSparkles(r, c, 16, '#e0f8ff');
}
function fxFly(r, c, el, color) {   // ゴール表示へ飛ぶ光
  if (!el) return;
  const p = cc(r, c), q = el.getBoundingClientRect();
  addPart({ kind: 'fly', x1: p.x, y1: p.y, x2: q.left + q.width / 2, y2: q.top + q.height / 2, size: p.s * .28, color, life: 1, decay: .045 });
}
function fxText(x, y, text, color, size) { addPart({ kind: 'text', x, y, vy: -1.4, text, color, size, life: 1, decay: .017 }); }
function shake(n) { if (window.__fast) return; const w = $('boardWrap'); w.classList.remove('shake1', 'shake2'); void w.offsetWidth; w.classList.add(n > 1 ? 'shake2' : 'shake1'); }
const WORDS = ['', '', 'いいね!', 'すごい!', 'すばらしい!', 'さいこう!', 'あまあま〜!!'];
function showWord(txt) { if (window.__fast) return; const el = $('word'); el.textContent = txt; el.classList.remove('show'); void el.offsetWidth; el.classList.add('show'); }
