// self.addEventListener('push', function(event) {
//   const data = event.data.json();
//   event.waitUntil(
//     self.registration.showNotification(data.title, {
//       body: data.body,
//       icon: "/static/core/icons/iconic_logo_192.png",
//       vibrate: [300, 100, 400], // ✅ Ensures vibration to trigger attention
//       requireInteraction: true,              // ✅ Stays on screen until user interacts (where supported)
//       tag: "cir-notify",                     // ✅ Prevents duplicate suppression
//       renotify: true,               
//       data: { url: data.url, timestamp: Date.now() },
//     })
//   );

// });

// self.addEventListener('notificationclick', function(event) {
//   event.notification.close();
//   event.waitUntil(clients.openWindow(event.notification.data.url));
// });