// Firebase Cloud Messaging Service Worker (FCM Web Push)
importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js');

firebase.initializeApp({
  projectId: "gen-lang-client-0028535414",
  appId: "1:54158908506:web:bb22734289e1239488cc63",
  apiKey: "AIzaSyDsh3MyPdlGGcly2woFtjkQigfm8CnPvys",
  authDomain: "gen-lang-client-0028535414.firebaseapp.com",
  messagingSenderId: "54158908506",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background push notification: ', payload);
  const notificationTitle = payload.notification?.title || payload.data?.title || 'شغل وتقنية | إشعار جديد';
  const notificationOptions = {
    body: payload.notification?.body || payload.data?.body || 'لديك إشعار جديد في منصة شغل وتقنية',
    icon: payload.notification?.icon || '/icon.png',
    badge: '/icon.png',
    dir: 'rtl',
    lang: 'ar',
    tag: payload.data?.tag || payload.data?.jobId || 'rooh_job_notification',
    data: payload.data || { click_action: '/' }
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification.data?.click_action || event.notification.data?.url || '/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
