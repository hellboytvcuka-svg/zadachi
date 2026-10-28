// Офлайн-кэш приложения: открывается сразу из кэша, свежая версия подтягивается в фоне
const CACHE = 'zadachi-v32';
const SHELL = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './apple-touch-icon.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return; // запросы к серверу не кэшируем
  const key = url.search.includes('u=') ? null : (e.request.mode === 'navigate' ? './index.html' : e.request);
  const net = fetch(e.request.url, {cache: 'no-cache', credentials: 'same-origin'}).then(r => {
    if (r.ok && key) { const copy = r.clone(); caches.open(CACHE).then(c => c.put(key, copy)); }
    return r;
  });
  if (!key) { e.respondWith(net); return; } // проверка обновлений — всегда из сети
  // сначала мгновенно из кэша, сеть обновляет кэш в фоне (новая версия покажется при следующем открытии)
  e.respondWith(caches.match(key).then(hit => {
    if (hit) { e.waitUntil(net.catch(() => {})); return hit; }
    return net.catch(() => caches.match('./index.html'));
  }));
});
