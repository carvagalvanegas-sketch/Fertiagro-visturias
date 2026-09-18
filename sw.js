const CACHE_NAME = 'fiscalizacao-hati-v1';

const APP_FILES = [
  './',
  './index.html'
];

// Instala el Service Worker y guarda los archivos básicos
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_FILES))
      .then(() => self.skipWaiting())
  );
});

// Activa la nueva versión y elimina cachés antiguos
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// Cuando no hay internet, intenta usar lo que está guardado
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Guarda una copia actualizada de los recursos
        if (response && response.status === 200) {
          const copy = response.clone();

          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, copy);
          });
        }

        return response;
      })
      .catch(() => {
        return caches.match(event.request)
          .then(cachedResponse => {
            if (cachedResponse) {
              return cachedResponse;
            }

            // Si se solicita una página y no hay internet,
            // intenta cargar el index.html guardado.
            if (event.request.mode === 'navigate') {
              return caches.match('./index.html');
            }

            return new Response('', {
              status: 503,
              statusText: 'Offline'
            });
          });
      })
  );
});
