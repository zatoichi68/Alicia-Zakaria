# Documentation Technique Interne - AlicIA & ZakarIA

Ce document détaille l'architecture logicielle, les flux de données et les configurations critiques du système.

## 1. Architecture Globale
Le système est composé de trois piliers principaux :
- **Frontend (MVP) :** Application React (Vite) hébergée sur Firebase Hosting.
- **Backend (Functions) :** Firebase Functions (Node.js) pour la gestion de la mémoire (Firestore), la recherche Google et la génération de tokens.
- **Voice Proxy (Cloud Run) :** Serveur WebSocket Node.js agissant comme passerelle sécurisée entre le client et l'API Gemini Live.

## 2. Flux Audio & IA Vocale
- **Modèle :** `gemini-2.5-flash-native-audio-preview-12-2025`.
- **Échantillonnage :** Entrée (Micro) à 16kHz PCM / Sortie (IA) à 24kHz PCM.
- **Gestion de la Limite des 10 Minutes :**
    - Un timer de **9 minutes** déclenche un rafraîchissement automatique.
    - L'IA génère un résumé (via `fin_de_conversation`), la session se ferme et se relance instantanément en injectant le résumé dans le nouveau contexte.
- **Filtrage des Sous-titres :** Les sous-titres ont été désactivés pour favoriser une immersion purement vocale. Le proxy backend filtre désormais toute tentative de génération de texte/pensée.

## 3. Gestion de la Mémoire (Firestore)
- **Structure :** 
    - `memories/{accessCode}` : Document principal (Prénom de l'usager, date de mise à jour).
    - `memories/{accessCode}/conversations/` : Sous-collection stockant les résumés chronologiques.
- **Persistance :** Le contexte est injecté au début de chaque session sous forme de "Piliers de Réminiscence". Cela permet à l'IA de se souvenir des rappels (ex: médicaments) et des préférences (ex: hockey).
- **Rétention :** Les données sont configurées avec un TTL (Time To Live) de **6 mois**.

## 4. Connexion Vidéo (Jitsi Meet)
- **Infrastructure :** Utilisation de l'instance publique `meet.jit.si` (Gratuit).
- **Mise en Relation :** Salles permanentes basées sur le `accessCode` du résident et le nom du proche.
- **Format du lien :** `meet.jit.si/AliciaZakaria_[Code]_[NomProche]`.
- **Interface Simplifiée :** Toolbar limitée au Micro, Caméra, Chat et Quitter. Le chat permet le partage de photos en temps réel.

### Justification du choix Jitsi
Le choix de Jitsi Meet repose sur quatre critères stratégiques pour le projet :
1. **Zéro Coût d'Infrastructure :** L'utilisation de l'instance publique permet d'offrir une fonctionnalité vidéo robuste sans frais de serveurs médias (SFU), ce qui est crucial pour la phase MVP.
2. **Accessibilité Sans Friction :** Contrairement à Teams ou Zoom, les proches n'ont pas besoin d'installer d'application ou de créer de compte. Un simple clic sur le lien permanent ouvre l'appel dans n'importe quel navigateur mobile.
3. **Contrôle de l'Interface (IFrame API) :** Jitsi permet de masquer la complexité technique (paramètres réseau, chiffrement, etc.) pour ne présenter à l'aîné qu'une interface minimaliste et rassurante.
4. **Capacités Multimodales :** L'intégration native du chat et du partage de fichiers répond directement au besoin de "texter" et de partager des photos de famille pendant l'appel, sans développement supplémentaire.

## 5. Recherche Internet (Google Search)
- **Fonctionnement :** Accessible via l'interface "Recherche" ou par l'IA vocale.
- **Technologie :** Utilisation du `grounding` de Gemini avec l'outil `googleSearch`.
- **Sources :** Les sources consultées sont affichées dans l'interface texte pour garantir la transparence de l'information.

## 6. Notifications et Appels (FCM)
Le système utilise **Firebase Cloud Messaging (FCM)** pour faire "sonner" le téléphone des proches lors d'un appel vidéo.
- **Service Worker :** `public/firebase-messaging-sw.js` gère la réception en arrière-plan.
- **Clé VAPID :** `BJCmUXys-KW9iOEAejd08HgKt4JHYDnZge6VS2L3VfnXg-JCu7MhS4bo0NwnHEnSL-d7t16Il8c4Q5MQftveSoQ` (utilisée pour l'enregistrement Web Push).
- **API d'envoi :** `/api/notify/send` (Backend) permet de déclencher une notification vers un Token spécifique.
- **Flux :** Lorsqu'un résident lance un appel Jitsi, une notification "data" est envoyée au proche pour l'inviter à rejoindre la salle.

## 7. Évolutions Futures : Passage à LiveKit
Pour la phase de production, il est prévu de remplacer Jitsi par **LiveKit** pour transformer la "réunion" en un véritable système d'appel natif.

### Justification du choix LiveKit
1. **Expérience "Téléphonique" Réelle :** Contrairement à Jitsi (IFrame), LiveKit s'intègre au niveau du code. Cela permet de créer une interface de "sonnerie" personnalisée et de gérer les états d'appel (occupé, ne répond pas) de manière fluide.
2. **IA Participative :** LiveKit permet à l'IA Alicia/Zakaria de rejoindre le flux audio en tant que participant silencieux. Elle pourra ainsi résumer l'appel pour la mémoire à long terme ou aider l'aîné si la conversation devient difficile.
3. **Notifications Push :** L'intégration native facilite l'envoi de signaux via Firebase Cloud Messaging (FCM) pour faire "sonner" le téléphone des proches même si leur application est fermée.
4. **Robustesse Réseau :** LiveKit offre une meilleure gestion de la bande passante, cruciale pour la stabilité vidéo dans les environnements de résidences (RPA/CHSLD) où le Wi-Fi est souvent partagé.

## 8. Défis Techniques et Limitations (Known Issues)

### Limitation des notifications sur iOS PWA
Un problème majeur persiste concernant la redirection automatique après un clic sur une notification sur iOS lorsque l'application est installée sur l'écran d'accueil (mode PWA) :
- **Perte de paramètres :** iOS a tendance à "nettoyer" les Query Parameters (`?mode=jitsi`) lors du lancement de la PWA via une notification, renvoyant l'utilisateur sur la page de connexion par défaut.
- **Blocage du bac à sable (Sandbox) :** Le Service Worker est restreint dans sa capacité à ouvrir des domaines tiers (`meet.jit.si`) ou à communiquer avec l'application via `postMessage` si celle-ci n'est pas déjà au premier plan.
- **Solution de contournement actuelle :** 
    1. Envoi du lien Jitsi en texte brut dans le corps de la notification.
    2. Ajout d'un lien manuel "Accès Espace Famille" sur l'écran de connexion pour forcer la redirection par une action utilisateur.
- **Résolution définitive prévue :** Le passage à une architecture **LiveKit native** (sans IFrame externe) permettra de garder l'utilisateur à l'intérieur de l'application tout au long du processus.

## 9. Variables d'Environnement Critiques
- `GEMINI_API_KEY` : Clé d'accès aux modèles génératifs.
- `VOICE_PROXY_SECRET` : Secret partagé pour signer les tokens WebSocket et sécuriser le proxy Cloud Run.
- `VITE_VOICE_PROXY_URL` : URL de la passerelle Cloud Run.

## 10. Déploiement
- **Application :** `firebase deploy --only hosting`
- **Fonctions :** `firebase deploy --only functions`
- **Voice Proxy :** `gcloud run deploy voice-proxy --source voice-proxy`

---
**Dernière mise à jour :** 10 février 2026
**Statut :** MVP Opérationnel
