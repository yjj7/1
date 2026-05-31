const CACHE = 'swm-v2';
const ASSETS = ['/', '/index.html'];

self.addEventListener('install', (e) => {
  (e as any).waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(ASSETS)).catch(() => {})
  );
  (self as any).skipWaiting();
});

self.addEventListener('activate', (e) => {
  (e as any).waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  (self as any).clients.claim();
});

self.addEventListener('fetch', (e: any) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        if (res.status === 200) {
          const clone = res.clone();
          caches.open(CACHE).then((cache) => cache.put(e.request, clone));
        }
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});