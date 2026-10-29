// あまあまマッチ:おかし・しかけ・アイテムの絵(SVG)
"use strict";
const PAL = [
  ['#ffb0c0', '#ff2d55', '#a3001f'],  // いちごハート
  ['#ffd9a3', '#ff8a00', '#b04800'],  // オレンジ玉
  ['#fff8b8', '#ffd000', '#b07f00'],  // レモンスター
  ['#ccffb5', '#3ed34a', '#0f7a26'],  // メロングミ
  ['#bdeeff', '#2a9dff', '#0a52b0'],  // ソーダしずく
  ['#f0cdff', '#a64dff', '#5e0fb0'],  // ぶどうジュエル
];
const HEX = ['#ff4d6d', '#ff9a1f', '#ffd400', '#46d652', '#3aa6ff', '#b363ff'];
const CNAME = ['いちご', 'オレンジ', 'レモン', 'メロン', 'ソーダ', 'ぶどう'];
function starPath(cx, cy, R, r) {
  let d = '';
  for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rad = i % 2 ? r : R;
    d += (i ? 'L' : 'M') + (cx + Math.cos(a) * rad).toFixed(1) + ' ' + (cy + Math.sin(a) * rad).toFixed(1); }
  return d + 'Z';
}
const SHAPES = [
  'M50 88C22 68 8 52 8 34C8 20 18 11 31 11C40 11 46 16 50 23C54 16 60 11 69 11C82 11 92 20 92 34C92 52 78 68 50 88Z',
  'M10 50a40 40 0 1 0 80 0a40 40 0 1 0 -80 0Z',
  starPath(50, 54, 45, 22),
  'M26 12h48a14 14 0 0 1 14 14v48a14 14 0 0 1 -14 14h-48a14 14 0 0 1 -14 -14v-48a14 14 0 0 1 14 -14Z',
  'M50 7C50 7 83 43 83 62C83 80 68 92 50 92C32 92 17 80 17 62C17 43 50 7 50 7Z',
  'M30 12h40l22 28l-42 52l-42 -52Z',
];
const SVGH = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">';
function candySVG(ci, sp) {
  const [Lc, M, D] = PAL[ci], P = SHAPES[ci];
  const wrapped = sp === 'wrap';
  let wings = '', stripes = '', extra = '';
  if (wrapped) wings =
    `<path d="M24 50L3 31Q-1 50 3 69Z" fill="${M}" stroke="${D}" stroke-width="3" stroke-linejoin="round"/>` +
    `<path d="M76 50L97 31Q101 50 97 69Z" fill="${M}" stroke="${D}" stroke-width="3" stroke-linejoin="round"/>` +
    `<path d="M8 40L18 48M8 60L18 52M92 40L82 48M92 60L82 52" stroke="#fff" stroke-width="3" stroke-linecap="round" opacity=".7"/>`;
  if (sp === 'lineH') for (const y of [14, 34, 54, 74]) stripes += `<rect x="0" y="${y}" width="100" height="10" fill="#fff" opacity=".92"/>`;
  if (sp === 'lineV') for (const x of [14, 34, 54, 74]) stripes += `<rect x="${x}" y="0" width="10" height="100" fill="#fff" opacity=".92"/>`;
  if (ci === 5) extra = `<path d="M30 12L40 40L50 12L60 40L70 12M8 40H92M40 40L50 92L60 40" fill="none" stroke="#fff" stroke-width="2" opacity=".35"/>`;
  if (ci === 1) extra = `<path d="M50 50m-22 0a22 22 0 1 1 44 0" fill="none" stroke="#fff" stroke-width="5" opacity=".35" stroke-linecap="round"/>`;
  const inner = wrapped ? ' transform="translate(16 16) scale(.68)"' : '';
  return SVGH + `<defs><linearGradient id="g" x1=".15" y1="0" x2=".85" y2="1"><stop offset="0" stop-color="${Lc}"/><stop offset=".48" stop-color="${M}"/><stop offset="1" stop-color="${D}"/></linearGradient>` +
    `<clipPath id="k"><path d="${P}"/></clipPath></defs>${wings}<g${inner}>` +
    `<path d="${P}" transform="translate(0 6)" fill="#2a0030" opacity=".28"/>` +
    `<path d="${P}" fill="url(#g)"/><g clip-path="url(#k)">${extra}${stripes}` +
    `<ellipse cx="36" cy="27" rx="27" ry="13" fill="#fff" opacity=".55" transform="rotate(-25 36 27)"/>` +
    `<ellipse cx="62" cy="88" rx="34" ry="12" fill="${D}" opacity=".4"/></g>` +
    `<path d="${P}" fill="none" stroke="${D}" stroke-width="3.5" stroke-linejoin="round"/>` +
    `<circle cx="27" cy="25" r="5.5" fill="#fff"/><circle cx="38" cy="20" r="2.5" fill="#fff" opacity=".8"/></g></svg>`;
}
function bombSVG() {
  const spr = [[30,30,20,'#ff4d6d'],[52,22,-40,'#ffd400'],[72,34,70,'#3aa6ff'],[24,52,-70,'#46d652'],[46,44,35,'#fff'],
    [66,54,-20,'#ff9a1f'],[34,70,60,'#b363ff'],[56,72,-55,'#ff4d6d'],[78,68,15,'#46d652'],[50,86,80,'#ffd400'],[18,40,10,'#3aa6ff'],[84,48,-80,'#fff']];
  return SVGH + `<defs><radialGradient id="b" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#a87050"/><stop offset=".55" stop-color="#5a2d14"/><stop offset="1" stop-color="#2a1004"/></radialGradient></defs>` +
    `<circle cx="50" cy="56" r="42" fill="#2a0030" opacity=".3"/><circle cx="50" cy="50" r="42" fill="url(#b)" stroke="#250c02" stroke-width="3"/>` +
    spr.map(([x, y, r, c]) => `<rect x="-6" y="-2.3" width="12" height="4.6" rx="2.3" fill="${c}" transform="translate(${x} ${y}) rotate(${r})"/>`).join('') +
    `<ellipse cx="36" cy="28" rx="18" ry="9" fill="#fff" opacity=".35" transform="rotate(-25 36 28)"/></svg>`;
}
// クリーム(hp=1〜3で段の数が変わる)
function creamSVG(hp) {
  const tint = ['#fff', '#ffe6f0', '#ffd0e0'][hp - 1], shade = ['#e9d6e6', '#f2b6cc', '#e890b0'][hp - 1];
  const blob = (y, s) => `<path transform="translate(50 ${y}) scale(${s})" d="M-40 10C-46 -4 -34 -14 -24 -10C-24 -24 -6 -26 0 -16C6 -28 26 -24 24 -10C36 -14 46 -2 40 10C40 22 -40 22 -40 10Z" fill="${tint}" stroke="${shade}" stroke-width="3"/>`;
  let s = SVGH + `<rect x="5" y="5" width="90" height="90" rx="18" fill="${shade}" opacity=".55"/>`;
  s += blob(68, 1.05);
  if (hp >= 2) s += blob(48, .9);
  if (hp >= 3) s += blob(30, .72) + `<circle cx="50" cy="14" r="8" fill="#ff2d55" stroke="#a3001f" stroke-width="2.5"/><path d="M50 7Q54 0 60 2" stroke="#3a7a2a" stroke-width="3" fill="none"/>`;
  s += `<ellipse cx="36" cy="58" rx="12" ry="5" fill="#fff" opacity=".9"/></svg>`;
  return s;
}
function chocoSVG() {
  return SVGH + `<defs><linearGradient id="c" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#9a5a36"/><stop offset="1" stop-color="#4a220e"/></linearGradient></defs>` +
    `<rect x="5" y="8" width="90" height="90" rx="14" fill="#2a0e04" opacity=".4"/>` +
    `<rect x="5" y="4" width="90" height="90" rx="14" fill="url(#c)" stroke="#2e1206" stroke-width="3"/>` +
    `<path d="M35 6V92M65 6V92M7 35H93M7 65H93" stroke="#3a1608" stroke-width="4"/>` +
    `<path d="M37 8V33H12M67 8V33H40M95 8V33H70M37 38V63H12M67 38V63H40M37 68V91H12M67 68V91H40" stroke="#c07a4a" stroke-width="2.5" fill="none" opacity=".7"/>` +
    `<ellipse cx="24" cy="18" rx="10" ry="4" fill="#fff" opacity=".3"/></svg>`;
}
function lockSVG() {
  return SVGH + `<g stroke-linecap="round"><path d="M10 10L90 90M90 10L10 90" stroke="#1a0612" stroke-width="20"/>` +
    `<path d="M10 10L90 90M90 10L10 90" stroke="#5a2a4a" stroke-width="13"/>` +
    `<path d="M14 12L88 86M86 14L14 86" stroke="#c070a0" stroke-width="3" stroke-dasharray="6 9"/></g>` +
    `<circle cx="50" cy="50" r="13" fill="#3a1030" stroke="#1a0612" stroke-width="3"/><circle cx="46" cy="46" r="4" fill="#fff" opacity=".5"/></svg>`;
}
function ingSVG(kind) {
  if (kind === 0) return SVGH +   // さくらんぼ
    `<path d="M38 60Q44 30 60 12M66 60Q62 32 60 12" stroke="#3a7a2a" stroke-width="5" fill="none" stroke-linecap="round"/>` +
    `<path d="M60 12Q76 8 84 20Q70 24 60 12Z" fill="#5ac84a" stroke="#2a6a1a" stroke-width="2.5"/>` +
    `<circle cx="36" cy="68" r="22" fill="#d3123a" stroke="#7a0018" stroke-width="3.5"/><circle cx="68" cy="68" r="22" fill="#e8204a" stroke="#7a0018" stroke-width="3.5"/>` +
    `<ellipse cx="29" cy="60" rx="7" ry="5" fill="#fff" opacity=".7"/><ellipse cx="61" cy="60" rx="7" ry="5" fill="#fff" opacity=".7"/></svg>`;
  return SVGH +   // くるみ
    `<ellipse cx="50" cy="58" rx="36" ry="34" fill="#a8703a" stroke="#5a3210" stroke-width="3.5"/>` +
    `<path d="M50 26V90M30 40Q40 52 30 66M70 40Q60 52 70 66M22 56H40M60 56H78" stroke="#6a3c14" stroke-width="3" fill="none" stroke-linecap="round"/>` +
    `<path d="M40 22Q50 12 60 22Q56 28 50 28Q44 28 40 22Z" fill="#7a4a1a" stroke="#5a3210" stroke-width="2.5"/>` +
    `<ellipse cx="36" cy="42" rx="8" ry="5" fill="#fff" opacity=".4"/></svg>`;
}
function itemSVG(k) {
  switch (k) {
    case 'hammer': return SVGH + `<rect x="44" y="40" width="12" height="54" rx="6" fill="#c0844a" stroke="#6a3a14" stroke-width="3" transform="rotate(30 50 60)"/>` +
      `<rect x="18" y="12" width="64" height="34" rx="12" fill="#ff5d8f" stroke="#a8204e" stroke-width="3.5" transform="rotate(30 50 30)"/><ellipse cx="34" cy="22" rx="10" ry="5" fill="#fff" opacity=".6" transform="rotate(30 50 30)"/></svg>`;
    case 'shuffle': return SVGH + `<path d="M14 34H40C56 34 56 66 72 66H86M74 54L88 66L74 78M14 66H40C46 66 49 61 51 56M58 42C61 37 65 34 72 34H86M74 22L88 34L74 46" stroke="#3a1650" stroke-width="15" fill="none" stroke-linecap="round" stroke-linejoin="round"/>` +
      `<path d="M14 34H40C56 34 56 66 72 66H86M74 54L88 66L74 78M14 66H40C46 66 49 61 51 56M58 42C61 37 65 34 72 34H86M74 22L88 34L74 46" stroke="#4fc3ff" stroke-width="8" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
    case 'plus5': return SVGH + `<circle cx="50" cy="50" r="42" fill="#46d652" stroke="#0f7a26" stroke-width="4"/><text x="50" y="66" text-anchor="middle" font-size="46" font-weight="900" fill="#fff" stroke="#0f7a26" stroke-width="2" font-family="sans-serif">+5</text></svg>`;
    case 'startLW': return candySVG(4, 'lineH');
    case 'startBomb': return bombSVG();
    case 'coin': return SVGH + `<circle cx="50" cy="54" r="40" fill="#b07800"/><circle cx="50" cy="48" r="40" fill="#ffd23f" stroke="#b07800" stroke-width="4"/><circle cx="50" cy="48" r="28" fill="none" stroke="#e0a800" stroke-width="4"/>` +
      `<path d="M50 30L55 43H68L57 51L61 64L50 56L39 64L43 51L32 43H45Z" fill="#fff6c0" stroke="#c08a00" stroke-width="2"/><ellipse cx="34" cy="30" rx="10" ry="5" fill="#fff" opacity=".7" transform="rotate(-30 34 30)"/></svg>`;
    case 'hand': return SVGH + `<path d="M38 92C28 80 18 66 22 58C26 52 34 56 38 62V20C38 12 50 12 50 20V48C50 42 62 42 62 50C62 44 74 44 74 52C74 46 86 48 86 56V74C86 84 80 92 72 92Z" fill="#fff" stroke="#3a1650" stroke-width="5" stroke-linejoin="round"/></svg>`;
    case 'gear': return SVGH + `<path d="M43 8h14l3 12 9 4 11-6 10 10-6 11 4 9 12 3v14l-12 3-4 9 6 11-10 10-11-6-9 4-3 12H43l-3-12-9-4-11 6-10-10 6-11-4-9-12-3V43l12-3 4-9-6-11 10-10 11 6 9-4z" fill="#fff" stroke="#3a1650" stroke-width="5" stroke-linejoin="round"/><circle cx="50" cy="50" r="13" fill="#ff8fc0" stroke="#3a1650" stroke-width="5"/></svg>`;
    case 'shop': return SVGH + `<path d="M14 40L22 14H78L86 40Z" fill="#ff5d8f" stroke="#3a1650" stroke-width="5" stroke-linejoin="round"/><path d="M30 14L26 40M50 14V40M70 14L74 40" stroke="#fff" stroke-width="5"/><rect x="20" y="40" width="60" height="46" rx="6" fill="#fff" stroke="#3a1650" stroke-width="5"/><rect x="40" y="56" width="20" height="30" fill="#ffd23f" stroke="#3a1650" stroke-width="4"/></svg>`;
  }
  return SVGH + '</svg>';
}
const svgURL = s => `url("data:image/svg+xml,${encodeURIComponent(s)}")`;
(function injectArtCSS() {
  let css = '';
  for (let ci = 0; ci < 6; ci++) for (const sp of ['n', 'lineH', 'lineV', 'wrap'])
    css += `.cand-${ci}-${sp}{background-image:${svgURL(candySVG(ci, sp === 'n' ? null : sp))}}`;
  css += `.cand-bomb{background-image:${svgURL(bombSVG())}}`;
  for (let hp = 1; hp <= 3; hp++) css += `.cream-${hp}{background-image:${svgURL(creamSVG(hp))}}`;
  css += `.choco{background-image:${svgURL(chocoSVG())}}`;
  css += `.lockover{background-image:${svgURL(lockSVG())}}`;
  css += `.ing-0{background-image:${svgURL(ingSVG(0))}}.ing-1{background-image:${svgURL(ingSVG(1))}}`;
  for (const k of ['hammer', 'shuffle', 'plus5', 'startLW', 'startBomb', 'coin', 'hand', 'gear', 'shop']) css += `.ico-${k}{background-image:${svgURL(itemSVG(k))}}`;
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);
})();
