// Service Worker pour Firebase Cloud Messaging
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyBQcPXHMAs43e4ttQb7YQ6WP5cm14589v8",
  authDomain: "alicia-zakaria.firebaseapp.com",
  projectId: "alicia-zakaria",
  storageBucket: "alicia-zakaria.firebasestorage.app",
  messagingSenderId: "417768250731",
  appId: "1:417768250731:web:ac26549a8d93c02857c02e"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

// Helper pour écrire dans IndexedDB depuis le SW
const storeCallInDB = (roomName) => {
  return new Promise((resolve) => {
    const request = indexedDB.open('AliciaZakariaDB', 1);
    request.onupgradeneeded = (e) => {
      if (!e.target.result.objectStoreNames.contains('calls')) {
        e.target.result.createObjectStore('calls');
      }
    };
    request.onsuccess = (e) => {
      const db = e.target.result;
      const tx = db.transaction('calls', 'readwrite');
      tx.objectStore('calls').put(roomName, 'pending_room');
      tx.oncomplete = () => resolve();
    };
    request.onerror = () => resolve();
  });
};

messaging.onBackgroundMessage((payload) => {
  console.log('[SW] Message reçu:', payload);
  const data = payload.data || {};
  const roomName = data.roomName;

  if (roomName) {
    storeCallInDB(roomName);
  }

  const notificationOptions = {
    body: data.body || 'Cliquez pour rejoindre',
    icon: '/logo.png',
    data: { roomName },
    tag: 'video-call',
    renotify: true
  };

  return self.registration.showNotification(data.title || 'Appel Vidéo', notificationOptions);
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = 'https://alicia-zakaria.org/app/';
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes('alicia-zakaria.org')) {
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(targetUrl);
    })
  );
});
