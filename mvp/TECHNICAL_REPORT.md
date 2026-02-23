# Rapport Technique - AlicIA et ZakarIA

Ce document récapitule les solutions techniques et les configurations optimisées pour garantir la stabilité et la performance du système AlicIA et ZakarIA.

---

## 1. Architecture Audio (Performance et Latence)
- **Moteur Audio :** Utilisation de deux `AudioContext` séparés (16kHz pour l'entrée, 24kHz pour la sortie) pour éviter les conflits de ré-échantillonnage et les bruits parasites.
- **Buffer de Latence :** Réglé à **256** (via `ScriptProcessorNode`) pour une réactivité quasi instantanée entre la parole de l'utilisateur et la réponse de l'IA.
- **Seuil de Détection (Noise Gate) :** Fixé à **0.005**. Permet de capter les voix douces tout en ignorant le bruit de fond constant.
- **Évitement d'Écho :** Désactivation de la connexion directe entre le processeur d'entrée et la destination de sortie (`processor.connect(silentGain)`) pour empêcher le modèle de s'auto-interrompre.

## 2. Gestion des Interruptions (Barge-in)
- **Réinitialisation de l'Horloge :** Lors d'une interruption (`interrupted: true`), le `nextStartTime` est synchronisé sur le temps réel de l'AudioContext (`ctx.currentTime`) pour une reprise immédiate de la parole par l'IA.
- **Nettoyage de File d'Attente :** Le signal d'interruption vide instantanément toutes les sources audio en cours de lecture.

## 3. Procédure de Fin de Conversation
- **Séquençage :** Le modèle a pour consigne stricte de générer une réponse vocale **et** d'appeler l'outil `fin_de_conversation` dans le même message.
- **Mise en Sourdine Automatique :** Dès que l'outil de fin est détecté, le microphone est coupé logiciellement (`isStreamingRef.current = false`) pour protéger le message d'au revoir contre toute interruption.
- **Délai de Grâce :** Un délai de **5 secondes** est appliqué avant la fermeture définitive pour permettre la lecture complète du message de départ.

## 4. Intelligence et Prompts (Personas)
- **Alicia :** Compagne chaleureuse, experte en émissions télé québécoises.
- **Zakaria :** Compagnon rassurant, expert en sport (Hockey/Canadiens), nature et histoire.
- **Règle d'Or :** Ne jamais initier la fin de la conversation. Toujours finir par une question ouverte simple.
- **Humour :** Blagues spécifiques intégrées (la tasse dans l'ascenseur et le chat à la pharmacie).
- **Contexte Temporel :** Injection dynamique de la date et de l'heure au Québec (EST/HNE) au démarrage.

## 5. Mémoire et Connaissances
- **Mémoire Permanente :** Stockage du résumé de la relation dans le `localStorage` (`alicia_zakaria_memory`).
- **Données Locales :** Injection du menu quotidien de la résidence et des informations de personnel dans les instructions système.

## 6. Sécurité et Accès
- **Code d'Accès :** Protection par fenêtre modale. Code **"Esteban"** (sensible à la casse).
- **Confidentialité :** Conforme à la Loi 25 (données locales au navigateur).

---
**Modèle de référence :** `gemini-2.5-flash-native-audio-preview-12-2025`
**Date du rapport :** 10 février 2026
