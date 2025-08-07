function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            // Check if this cookie string begins with the name we want
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}


function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return new Uint8Array([...rawData].map(c => c.charCodeAt(0)));
}


async function subscribeToPush(vapidPublicKey) {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.warn("Push notifications are not supported.");
    return;
  }

  const registration = await navigator.serviceWorker.register("/service_worker.js", {scope: "/", updateViaCache: "none"});

  // 🛡 Wait until the SW is active
  if (registration.installing) {
    await new Promise(resolve => {
      registration.installing.addEventListener("statechange", function (event) {
        if (event.target.state === "activated") {
          resolve();
        }
      });
    });
  } else if (registration.waiting) {
    await new Promise(resolve => {
      registration.waiting.addEventListener("statechange", function (event) {
        if (event.target.state === "activated") {
          resolve();
        }
      });
    });
  } else if (registration.active) {
    // already active — continue
  }

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
  });

  await fetch("/save-subscription/", {
    method: "POST",
    headers: {
      'Content-Type': 'application/json',
      'X-CSRFToken': getCookie('csrftoken')
    },
    body: JSON.stringify({ user_id: userId, subscription })
  });
}

// function unsubscribePush() {
//   navigator.serviceWorker.ready.then(reg => {
//     reg.pushManager.getSubscription().then(subscription => {
//       if (subscription) {
//         fetch("/delete-subscription/", {
//           method: "POST",
//           headers: {
//             'Content-Type': 'application/json',
//             'X-CSRFToken': getCookie('csrftoken')
//           },
//           body: JSON.stringify(subscription)
//         });
//         subscription.unsubscribe();
//       }
//     });
//   });
// }

function unsubscribePush(userId) {
  navigator.serviceWorker.ready.then(async reg => {
    const subscription = await reg.pushManager.getSubscription();
    if (subscription) {
      const endpoint = subscription.endpoint;

      // Send the deletion request with user_id and endpoint
      await fetch("/delete-subscription/", {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
          'X-CSRFToken': getCookie('csrftoken')
        },
        body: JSON.stringify({
          user_id: userId,
          endpoint: endpoint
        })
      });

      // Unsubscribe from push manager
      await subscription.unsubscribe();
    }
  });
}
