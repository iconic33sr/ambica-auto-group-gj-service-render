// function askNotificationPermission() {
//   if ('Notification' in window) {
//     if (Notification.permission === 'default') {
//       Notification.requestPermission().then(permission => {
//         if (permission === 'granted') {
//           console.log("✅ Notification permission granted.");
//         } else {
//           console.warn("❌ Notification denied.");
//         }
//       });
//     } else if (Notification.permission === 'granted') {
//       console.log("📣 Notifications already allowed.");
//     } else {
//       console.warn("⚠️ Notifications are blocked.");
//     }
//   }
// }


// function showNativeNotification(title, body, url = "/") {
//   if (Notification.permission === 'granted') {
//     navigator.serviceWorker.getRegistration().then(reg => {
//       if (reg) {
//         reg.showNotification(title, {
//           body: body,
//           icon: "/static/core/icons/iconic_logo_192.png",
//           data: { url: url },
//           tag: Date.now(), // Unique
//         });
//       }
//     });
//   }
// }
