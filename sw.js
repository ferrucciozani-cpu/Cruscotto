// Service worker: l'app si apre anche senza connessione.
// Cambiare VERSION quando si pubblica una nuova versione dei file.
const VERSION = 'cruscotto-v1';
const FILES = ['./', './index.html', './firebase-config.js', './manifest.webmanifest',
               './icon-192.png', './icon-512.png', './apple-touch-icon.png'];
const SDK = 'https://www.gstatic.com/firebasejs/';

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k.startsWith('cruscotto-') && k !== VERSION).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
// Rete prima (così gli aggiornamenti arrivano), copia salvata se offline. Il traffico del database non passa da qui.
self.addEventListener('fetch', e => {
  const url = e.request.url;
  if (e.request.method !== 'GET') return;
  const own = url.startsWith(self.registration.scope);
  if (!own && !url.startsWith(SDK)) return;
  e.respondWith(
    fetch(e.request)
      .then(r => { if (r.ok) { const copy = r.clone(); caches.open(VERSION).then(c => c.put(e.request, copy)); } return r; })
      .catch(() => caches.match(e.request, { ignoreSearch: true })
        .then(r => r || (e.request.mode === 'navigate' ? caches.match('./index.html') : Response.error())))
  );
});
