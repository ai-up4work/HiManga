// Enable offline caching if needed (basic version)
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

// Push notifications
self.addEventListener('push', (event) => {
  const data = event.data?.json() || { 
    title: 'HiManga', 
    body: 'New manga chapter available!' 
  };
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icon512_maskable.png',
      badge: '/icon512_rounded.png',
      vibrate: [100, 50, 100],
      data: { url: data.url || '/' },
    })
  );
});

// Click opens app
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data?.url || '/')
  );
});