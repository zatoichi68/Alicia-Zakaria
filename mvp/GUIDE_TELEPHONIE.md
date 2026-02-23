# 📞 Guide de Configuration : Ligne Téléphonique Sans Frais pour AlicIA

Ce document décrit les étapes techniques et opérationnelles pour permettre aux résidents d'appeler AlicIA ou ZakarIA via un numéro de téléphone traditionnel (1-800), sans avoir besoin d'une tablette ou d'internet.

---

## 1. Architecture Requise

Pour connecter le réseau téléphonique public (RTC) à l'intelligence artificielle de Google Gemini, nous avons besoin d'une passerelle.

```mermaid
[Résident (Téléphone)] <--> [Twilio (Passerelle)] <--> [Serveur WebSocket (Backend)] <--> [API Gemini Live]
```

## 2. Étapes de Configuration

### A. Achat du Numéro (Twilio)
1.  Créer un compte sur [Twilio](https://www.twilio.com).
2.  Acheter un numéro sans frais (Toll-Free) canadien (+1 833...).
    *   *Coût estimé : ~2.00 $US / mois.*
3.  Configurer le webhook "Voice" pour pointer vers notre futur serveur (ex: `https://api.alicia-zakaria.ca/voice`).

### B. Développement du Serveur Backend (Node.js)
Le MVP actuel est "frontend-only". Pour la téléphonie, un petit serveur est obligatoire.

1.  **Serveur WebSocket :** Utiliser `Node.js` avec `Fastify` ou `Express`.
2.  **Gestion des Flux (Streams) :**
    *   Recevoir le flux audio `mu-law` (format téléphone) de Twilio.
    *   Convertir ce flux en `PCM 16kHz` (format supporté par Gemini).
    *   Envoyer le flux à Gemini Live via WebSocket.
    *   Recevoir la réponse audio de Gemini, la convertir en `mu-law` et la renvoyer à Twilio.

### C. Configuration de l'IA (Prompts Spécifiques)
Les appels téléphoniques nécessitent des ajustements aux instructions système :
*   **Détection de silence :** L'IA doit être plus patiente car les téléphones ont parfois de la latence.
*   **Interruption (Barge-in) :** Twilio gère nativement une partie de l'écho, mais le serveur doit gérer l'interruption logicielle.
*   **Message d'accueil :** "Bonjour, ici AlicIA. Je vous écoute." (plus court et direct).

---

## 3. Coûts Estimés (Opérationnel)

| Service | Coût Unitaire | Estimation (100 aînés, 15 min/jour) |
| :--- | :--- | :--- |
| **Twilio (Ligne)** | 2.00 $ / mois | 2.00 $ |
| **Twilio (Minutes)** | 0.013 $ / min | ~600 $ / mois |
| **Gemini (Input)** | ~0.04 $ / min | ~1 800 $ / mois |
| **Gemini (Output)** | ~0.15 $ / min | (inclus dans l'estimé input/ratio) |
| **Serveur (Hébergement)** | Forfait Cloud | ~50 $ / mois |

*Note : Les crédits d'impôt et subventions (IRIA) peuvent couvrir une grande partie de ces frais.*

---

## 4. Prochaines Actions (Roadmap)

1.  [ ] Mettre en place un serveur Node.js pilote (ex: sur Google Cloud Run ou Heroku).
2.  [ ] Acheter un numéro de test Twilio (quelques dollars).
3.  [ ] Connecter le flux audio Twilio <-> Gemini.
4.  [ ] Tester la latence (objectif : < 1 seconde).

---
*Document interne - Alicia et Zakaria Inc.*
