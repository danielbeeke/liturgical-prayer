let CACHE_VERSION = 1;

// Shorthand identifier mapped to specific versioned cache.
let CURRENT_CACHES = {
  sheet: 'sheet-cache-v' + CACHE_VERSION
};

self.addEventListener('activate', function(event) {
  let expectedCacheNames = Object.values(CURRENT_CACHES);

  // Active worker won't be treated as activated until promise
  // resolves successfully.
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (!expectedCacheNames.includes(cacheName)) {
            console.log('Deleting out of date cache:', cacheName);

            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', function(event) {
  if (event.request.url.includes('spreadsheets')) {
    event.respondWith(

      // Opens Cache objects that start with 'sheet'.
      caches.open(CURRENT_CACHES['sheet']).then(function(cache) {
        return cache.match(event.request).then(function(response) {
          if (response) {
            return response;
          }

          return fetch(event.request).then(function(networkResponse) {
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          });
        }).catch(function(error) {
          throw error;
        });
      })
    );
  }
  else {
    event.respondWith(fetch(event.request));
  }
});