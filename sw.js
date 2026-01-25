self.addEventListener('install', (e) => {
    e.waitUntil(Promise.resolve());
});
self.addEventListener('fetch', (e) => {
    e.respondWith(fetch(e.request));
});
