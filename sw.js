// あまあまマッチ:オフラインでも遊べるようにファイルを保存
// 更新したら VERSION を変えること(遊ぶ人のスマホが新しい版を取りにいく)
const VERSION = 'amamatch-v3';
const FILES = ['./', 'index.html', 'manifest.json', 'icon.svg', 'css/style.css',
  'js/sounds.js', 'js/data.js', 'js/art.js', 'js/audio.js', 'js/fx.js', 'js/game.js', 'js/ui.js'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
// まず保存したものを出し、裏で新しいものを取りにいく(BGMは聞いたときに保存)
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || !e.request.url.startsWith(self.location.origin)) return;
  e.respondWith(caches.open(VERSION).then(cache => cache.match(e.request, { ignoreSearch: true }).then(hit => {
    const net = fetch(e.request).then(res => { if (res.ok) cache.put(e.request, res.clone()); return res; }).catch(() => hit);
    return hit || net;
  })));
});
