import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';

// Remplacer par votre config réelle de la console Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBQcPXHMAs43e4ttQb7YQ6WP5cm14589v8",
  authDomain: "alicia-zakaria.firebaseapp.com",
  projectId: "alicia-zakaria",
  storageBucket: "alicia-zakaria.firebasestorage.app",
  messagingSenderId: "417768250731",
  appId: "1:417768250731:web:ac26549a8d93c02857c02e"
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

const VAPID_KEY = "BJCmUXys-KW9iOEAejd08HgKt4JHYDnZge6VS2L3VfnXg-JCu7MhS4bo0NwnHEnSL-d7t16Il8c4Q5MQftveSoQ";

export const requestNotificationPermission = async () => {
  try {
    if (!('Notification' in window)) {
      throw new Error('Navigateur non compatible');
    }

    const registration = await navigator.serviceWorker.register('./firebase-messaging-sw.js');
    
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      throw new Error(`Permission ${permission}`);
    }

    const token = await getToken(messaging, { 
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration
    });
    
    if (token) return token;
    throw new Error('Token vide');
    
  } catch (error: any) {
    // On relance l'erreur pour qu'elle soit attrapée par le composant UI
    throw error;
  }
};

export const onMessageListener = () =>
  new Promise((resolve) => {
    onMessage(messaging, (payload) => {
      resolve(payload);
    });
  });
