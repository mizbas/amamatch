// あまあまマッチ:効果音とBGM
"use strict";
let ac = null, master = null, bgmGain = null, noiseBuf = null; const BUF = {};
const IOS = /iP(hone|ad|od)/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
let audioStale = false;
function b64(s) { const bin = atob(s), u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return u.buffer; }
function rebuildAudio() {
  const k = bgmKey || bgmWant; try { if (bgmNode) bgmNode.stop(); } catch (e) {}
  try { ac.close(); } catch (e) {}
  ac = null; master = null; bgmGain = null; bgmNode = null; bgmKey = null; bgmTok++; noiseBuf = null;
  bgmWant = k; audio();
}
function audio() {
  if (ac && audioStale) { audioStale = false; if (IOS || ac.state === 'closed') { rebuildAudio(); return; } }
  if (ac) { if (ac.state !== 'running') ac.resume().catch(() => rebuildAudio()); return; }
  try {
    ac = new (window.AudioContext || window.webkitAudioContext)();
    master = ac.createGain(); master.connect(ac.destination);
    bgmGain = ac.createGain(); bgmGain.connect(ac.destination); applyVolume();
    const s = ac.createBufferSource(); s.buffer = ac.createBuffer(1, 1, 22050); s.connect(master); s.start(0);
    if (typeof SND !== 'undefined') for (const k in SND) {
      const done = b => { BUF[k] = b; };
      const p = ac.decodeAudioData(b64(SND[k]), done, () => {}); if (p && p.then) p.then(done).catch(() => {});
    }
    if (bgmWant) { const k = bgmWant; bgmWant = null; bgm(k); }
  } catch (e) { ac = null; }
}
function applyVolume() {
  if (!ac) return; const t = ac.currentTime;
  master.gain.setTargetAtTime(save.sound ? save.seVol : 0, t, .03);
  bgmGain.gain.setTargetAtTime(save.sound ? save.bgmVol * .5 : 0, t, .08);
}
/* ---------- BGM(魔王魂) ---------- */
const BGM = {
  map: 'maoudamashii_bgm_acoustic10.mp3', w1: 'maoudamashii_bgm_acoustic22.mp3', w2: 'maoudamashii_bgm_acoustic44.mp3',
  w3: 'maoudamashii_bgm_acoustic52.mp3', w4: 'maoudamashii_bgm_ethnic14.mp3', w5: 'maoudamashii_bgm_acoustic34.mp3',
};
let bgmKey = null, bgmWant = null, bgmNode = null, bgmTok = 0; const BGMBUF = {};
function loopPoints(b) {
  const d = b.getChannelData(0), n = d.length, th = 2e-4; let a = 0, z = n - 1;
  const lim = Math.min(n >> 1, Math.floor(b.sampleRate * 3));
  while (a < lim && Math.abs(d[a]) < th) a++;
  while (z > n - lim && Math.abs(d[z]) < th) z--;
  return [a / b.sampleRate, (z + 1) / b.sampleRate];
}
function bgm(key) {
  if (!ac) { bgmWant = key; return; }
  if (key === bgmKey) return;
  bgmKey = key; const tok = ++bgmTok;
  if (bgmNode) { const old = bgmNode, g = old._g; g.gain.setTargetAtTime(0, ac.currentTime, .25); setTimeout(() => { try { old.stop(); } catch (e) {} }, 1400); bgmNode = null; }
  const file = BGM[key]; if (!file) return;
  const start = buf => {
    if (tok !== bgmTok) return;
    const src = ac.createBufferSource(), g = ac.createGain(), [a, z] = buf._lp || (buf._lp = loopPoints(buf));
    src.buffer = buf; src.loop = true; src.loopStart = a; src.loopEnd = z;
    g.gain.setValueAtTime(0, ac.currentTime); g.gain.linearRampToValueAtTime(1, ac.currentTime + 1.2);
    src.connect(g).connect(bgmGain); src.start(0, a); src._g = g; bgmNode = src;
  };
  if (BGMBUF[file]) return start(BGMBUF[file]);
  fetch('bgm/' + file).then(r => { if (!r.ok) throw 0; return r.arrayBuffer(); })
    .then(ab => new Promise((ok, ng) => { const p = ac.decodeAudioData(ab, ok, ng); if (p && p.then) p.then(ok, ng); }))
    .then(buf => { BGMBUF[file] = buf; start(buf); }).catch(() => {});
}
document.addEventListener('visibilitychange', () => { if (!ac) return;
  if (document.visibilityState === 'hidden') { audioStale = true; try { ac.suspend(); } catch (e) {} }
  else if (!IOS) ac.resume().catch(() => {}); });
window.addEventListener('pageshow', e => { if (e.persisted && ac) audioStale = true; });
['pointerdown', 'touchend', 'keydown'].forEach(ev => document.addEventListener(ev, () => { if (!ac || audioStale || ac.state !== 'running') audio(); }, { capture: true, passive: true }));

/* ---------- 鳴らす ---------- */
function play(name, o = {}) {
  if (!save.sound || !ac || !BUF[name] || window.__fast) return;
  const b = BUF[name], s = ac.createBufferSource(), g = ac.createGain(), t = ac.currentTime + (o.delay || 0);
  s.buffer = b; s.playbackRate.setValueAtTime(o.rate || 1, t);
  const vol = o.gain == null ? 1 : o.gain;
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + .01);
  if (o.dur) { g.gain.setValueAtTime(vol, t + Math.max(.02, o.dur - .08)); g.gain.linearRampToValueAtTime(0, t + o.dur); }
  s.connect(g).connect(master); s.start(t, o.offset || 0); if (o.dur) s.stop(t + o.dur + .02);
}
function tone(freq, dur = .12, type = 'sine', vol = .12, delay = 0) {
  if (!ac || !save.sound || window.__fast) return;
  const t0 = ac.currentTime + delay, o = ac.createOscillator(), g = ac.createGain();
  o.type = type; o.frequency.setValueAtTime(freq, t0);
  g.gain.setValueAtTime(vol, t0); g.gain.exponentialRampToValueAtTime(.001, t0 + dur);
  o.connect(g).connect(master); o.start(t0); o.stop(t0 + dur + .02);
}
function sweep(f1, f2, dur, type, vol, delay = 0) {
  if (!ac || !save.sound || window.__fast) return;
  const t0 = ac.currentTime + delay, o = ac.createOscillator(), g = ac.createGain();
  o.type = type; o.frequency.setValueAtTime(f1, t0); o.frequency.exponentialRampToValueAtTime(f2, t0 + dur);
  g.gain.setValueAtTime(vol, t0); g.gain.exponentialRampToValueAtTime(.001, t0 + dur);
  o.connect(g).connect(master); o.start(t0); o.stop(t0 + dur + .02);
}
function noise(dur, vol, f1, f2, delay = 0) {
  if (!ac || !save.sound || window.__fast) return;
  if (!noiseBuf) { noiseBuf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate); const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
  const t0 = ac.currentTime + delay, s = ac.createBufferSource(), bp = ac.createBiquadFilter(), g = ac.createGain();
  s.buffer = noiseBuf; bp.type = 'bandpass'; bp.Q.value = 1.3;
  bp.frequency.setValueAtTime(f1, t0); bp.frequency.exponentialRampToValueAtTime(f2, t0 + dur);
  g.gain.setValueAtTime(vol, t0); g.gain.exponentialRampToValueAtTime(.001, t0 + dur);
  s.connect(bp).connect(g).connect(master); s.start(t0); s.stop(t0 + dur + .02);
}
const SCALE = [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24];
const sfx = {
  tap: () => play('tap', { gain: .6 }),
  swap: () => play('swap', { gain: .7, rate: 1.1 }),
  bad: () => play('bad', { gain: .6 }),
  pop: c => { const st = SCALE[Math.min(c - 1, 10)]; play('pop', { rate: Math.pow(2, st / 12), gain: .9 });
    tone(587 * Math.pow(2, st / 12), .18, 'sine', .07, .01); },
  land: () => noise(.05, .05, 1800, 900),
  make: () => play('make', { gain: .9 }),
  line: () => { play('line', { gain: .8 }); noise(.35, .18, 500, 7000); },
  wrap: () => { sweep(190, 38, .45, 'sine', .45); noise(.35, .3, 900, 150); },
  bomb: () => { play('bomb', { gain: .9 }); sweep(2400, 180, .5, 'square', .03); },
  word: () => play('word', { gain: .8 }),
  goal: () => play('goal', { gain: .8 }),
  jelly: () => play('jelly', { gain: .5, rate: .9 + Math.random() * .3 }),
  ice: () => play('ice', { gain: .7, rate: .9 + Math.random() * .2 }),
  choco: () => { noise(.12, .2, 400, 200); tone(140, .12, 'triangle', .1); },
  ing: () => play('item', { gain: .8 }),
  coin: () => play('coin', { gain: .7 }),
  coins: () => play('coins', { gain: .8 }),
  item: () => play('item', { gain: .8 }),
  win: () => { play('clear', { gain: .9 }); play('fanfare', { gain: .7, delay: .35 }); },
  clap: () => play('clap', { gain: .6 }),
  lose: () => [392, 330, 262].forEach((f, i) => tone(f, .35, 'triangle', .1, i * .2)),
  sparkle: () => play('shine', { gain: .5 }),
  tick: i => play('count', { gain: .4, rate: 1 + i * .04, dur: .12 }),
};
function vib(ms) { try { if (save.vib !== false && navigator.vibrate && !window.__fast) navigator.vibrate(ms); } catch (e) {} }
