// JharBhoomi Info service worker: receives Web Push events and shows a
// notification themed per the rotating color/message the server picked, and
// focuses/opens the app when tapped.
self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('push', (event) => {
  let payload = {
    title: 'JharBhoomi Info',
    body: 'नई जानकारी उपलब्ध है।',
    theme: 'green',
    color: '#2f6b4f',
    url: '/',
  }
  try {
    if (event.data) payload = { ...payload, ...event.data.json() }
  } catch (err) {
    // malformed payload — fall back to defaults above
  }

  const options = {
    body: payload.body,
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    data: { url: payload.url, theme: payload.theme },
    tag: 'jbi-' + payload.theme,
    renotify: true,
    vibrate: [80, 40, 80],
  }

  event.waitUntil(self.registration.showNotification(payload.title, options))
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const targetUrl = (event.notification.data && event.notification.data.url) || '/'
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          if ('navigate' in client) client.navigate(targetUrl)
          return client.focus()
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(targetUrl)
    }),
  )
})
