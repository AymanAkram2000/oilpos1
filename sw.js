// OilPOS Service Worker - offline cache
const CACHE = 'oilpos-v1';
const ASSETS = [
  './',
  './index.html',
  'https://cdn.tailwindcss.com/3.4.17',
  'https://cdnjs.cloudflare.com/ajax/libs/dexie/3.2.7/dexie.min.js',
  'https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800&display=swap'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c =>
      Promise.all(ASSETS.map(url =>
        c.add(url).catch(err => console.warn('فشل تحميل:', url, err))
      ))
    ).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const {request} = e;
  // تجاهل الطلبات لـ Supabase عشان تروح للشبكة دايم
  if (request.url.includes('supabase.co')) return;
  e.respondWith(
    caches.match(request).then(cached =>
      cached || fetch(request).then(resp => {
        if (resp.ok && request.method === 'GET') {
          const copy = resp.clone();
          caches.open(CACHE).then(c => c.put(request, copy));
        }
        return resp;
      }).catch(() => caches.match('./index.html'))
    )
  );
});