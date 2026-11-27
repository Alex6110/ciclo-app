const C = 'muudays-v15';
const FILES = ['./', 'index.html', 'style.css', 'app.js', 'mascotte.js', 'config.js', 'manifest.webmanifest', 'icon-192.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(C).then(c => c.addAll(FILES)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== C).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Rete prima, cache come ripiego: gli aggiornamenti arrivano subito e l'app resta usabile offline.
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(
    fetch(e.request)
      .then(r => { const copy = r.clone(); caches.open(C).then(c => c.put(e.request, copy)); return r; })
      .catch(() => caches.match(e.request).then(r => r || caches.match('index.html')))
  );
});

/* ---------- notifiche push ---------- */
// Il messaggio arriva cifrato: lo decifro con la chiave del backup salvata nel telefono.
const ub64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));
const chiave = () => new Promise(res => {
  const r = indexedDB.open('ciclo', 1);
  r.onupgradeneeded = () => r.transaction.abort();
  r.onerror = () => res({ e: 'archivio' });
  r.onsuccess = () => {
    try { const q = r.result.transaction('kv').objectStore('kv').get('key'); q.onsuccess = () => res(q.result && q.result.k ? { k: q.result.k } : { e: 'assente' }); q.onerror = () => res({ e: 'lettura' }); }
    catch { res({ e: 'archivio' }); }
  };
});
self.addEventListener('push', e => e.waitUntil((async () => {
  // Mostra SEMPRE una notifica (iOS lo pretende): se qualcosa va storto nel leggere il messaggio, il testo lo dice.
  let t = 'Muudays', b = 'C\'è un aggiornamento sul tuo ciclo.';
  try {
    const m = e.data ? e.data.json() : null;
    if (m && m.iv) {
      const r = await Promise.race([chiave(), new Promise(x => setTimeout(() => x({ e: 'lenta' }), 3500))]), k = r.k;
      if (!k) b += ` (chiave: ${r.e})`;
      else {
        try {
          const j = JSON.parse(new TextDecoder().decode(await crypto.subtle.decrypt({ name: 'AES-GCM', iv: ub64(m.iv) }, k, ub64(m.data))));
          t = j.t || t; b = j.b || b;
        } catch { b += ' (decifratura non riuscita)'; }
      }
    }
  } catch { b += ' (messaggio non leggibile)'; }
  await self.registration.showNotification(t, { body: b, icon: 'icon-192.png', badge: 'icon-192.png' });
})()));
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(cs => cs.length ? cs[0].focus() : self.clients.openWindow('./')));
});
