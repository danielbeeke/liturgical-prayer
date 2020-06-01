let cacheName = 'liturgical-prayer-v1';

let images = [
  'afternoon.jpg',
  'arrow-right.svg',
  'back.svg',
  'compass.svg',
  'day.svg',
  'dropbox.svg',
  'face.svg',
  'googledrive.svg',
  'info_big.svg',
  'logo.svg',
  'meal.jpg',
  'note-add.svg',
  'power.svg',
  'remove.svg',
  'shield.svg',
  'arrow-left.svg',
  'author.svg',
  'calendar.svg',
  'cross.svg',
  'dots.svg',
  'evening.jpg',
  'fingerprint.svg',
  'handle.svg',
  'info.svg',
  'loop.svg',
  'morning.jpg',
  'pencil.svg',
  'remotestorage.svg',
  'settings.svg',
  'tag.svg'
];

let imagePaths = images.map(image => '/images/' + image);

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(cacheName).then((cache) => {
      return cache.addAll(imagePaths);
    })
  );
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((r) => {
      return r || fetch(e.request).then((response) => {
        return caches.open(cacheName).then((cache) => {
          cache.put(e.request, response.clone());
          return response;
        });
      });
    })
  );
});