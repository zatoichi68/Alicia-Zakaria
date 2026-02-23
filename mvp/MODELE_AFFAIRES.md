# 💼 Modèle d'Affaires : AlicIA et ZakarIA

Ce document analyse les stratégies de monétisation pour rendre la solution accessible aux aînés tout en assurant la pérennité et la rentabilité de l'entreprise, compte tenu des coûts élevés d'inférence IA (audio temps réel).

---

## 💰 Analyse des Coûts Variables (Le défi)

Le moteur *Gemini Live (Native Audio)* et la téléphonie *Twilio* engendrent des coûts à la minute.

| Poste de coût | Estimation (pour 15 min de conversation/jour) | Coût Mensuel approx. |
| :--- | :--- | :--- |
| **IA (Input + Output)** | ~0,05 $ - 0,10 $ / min (variable selon tokens) | ~30,00 $ - 45,00 $ |
| **Téléphonie (Twilio)** | 0,013 $ / min | ~6,00 $ (si utilisé) |
| **Serveurs & Support** | Fixe | ~5,00 $ / usager |
| **Total Coût Direct** | | **~40,00 $ - 55,00 $ / mois / usager actif** |

*Constat : Le coût de revient est élevé pour les "gros utilisateurs". Le modèle d'affaires doit absorber cette variance.*

---

## 1️⃣ Option A : Le Modèle B2B "Résidence Connectée" (Volume)

**Client :** Les groupes de résidences (Chartwell, Cogir, Groupe Maurice).
**Proposition :** AlicIA comme service inclus dans le loyer (comme le câble ou l'internet).

### Structure de prix
*   **Frais d'installation :** 5 000 $ par résidence (formation personnel, configuration menus/activités).
*   **Abonnement mensuel :** **25,00 $ / porte** (pour 100% des résidents).

### Analyse de rentabilité
*   **Pourquoi ça marche :** Sur 100 résidents, seuls 20% l'utiliseront intensivement (Loi de Pareto). Les 80% d'utilisateurs "passifs" subventionnent les coûts des utilisateurs "actifs".
*   **Marge bénéficiaire :**
    *   Revenus (100 portes) : 2 500 $
    *   Coûts (20 actifs @ 50$ + 80 passifs @ 2$) : ~1 160 $
    *   **Profit net :** ~1 340 $ / mois / résidence (Marge ~53%).

### Avantages vs Inconvénients
*   ✅ Revenus récurrents stables (ARR).
*   ✅ Un seul interlocuteur pour la facturation.
*   ❌ Cycle de vente long (6-18 mois).
*   ❌ Risque de "taux d'occupation" si la résidence se vide.

---

## 2️⃣ Option B : Le Modèle B2C "Famille Bienveillante" (Premium)

**Client :** Les enfants des résidents (proches aidants).
**Proposition :** "Offrez une présence à vos parents quand vous ne pouvez pas être là."

### Structure de prix
*   **Abonnement :** **49,99 $ / mois** (Forfait Illimité*).
*   *Fair use policy : Limite douce à 20h de conversation/mois, puis dégradation vers un modèle texte ou moins coûteux.*

### Analyse de rentabilité
*   **Comparatif :** Une dame de compagnie coûte 25 $/heure. AlicIA coûte le prix de 2 heures de visite pour un mois complet 24/7.
*   **Marge bénéficiaire :**
    *   Si coût moyen = 40 $, Marge faible (~20%).
    *   Nécessite d'optimiser l'IA (utiliser des modèles "Flash" moins chers pour les heures creuses).

### Avantages vs Inconvénients
*   ✅ Vente émotionnelle rapide (culpabilité, besoin de sécurité).
*   ✅ Paiement par carte de crédit (automatisé).
*   ❌ Coût d'acquisition client (CAC) élevé (marketing Facebook/Google).
*   ❌ Risque de désabonnement élevé (Churn) si l'aîné n'aime pas.

---

## 3️⃣ Option C : Le Modèle "Hybride OSBL" (Recommandé pour le démarrage)

**Client :** Mixte (Gouvernement + Résidence).
**Proposition :** Projet d'innovation sociale subventionné.

### Structure
1.  **L'OSBL (Fondation AlicIA)** obtient une subvention (IRIA/DEC) pour couvrir 90% des coûts de développement et des frais d'API pour la première année (Projet Pilote).
2.  **La Résidence** paie un prix symbolique (**10 $ / mois / utilisateur actif**) pour l'accès.

### Analyse
*   **Année 1 :** Rentabilité assurée par les subventions (couvre les coûts IA). Objectif : Acquisition de données et preuve de concept.
*   **Année 2+ :** Conversion vers le modèle A (B2B) une fois que l'utilité est prouvée et que les résidents sont "habitués" au service.

---

## 🎯 Recommandation Stratégique

Viser l'**Option C** pour les 12 premiers mois, transitionnant vers l'**Option A**.

1.  Utiliser les subventions pour "payer" la consommation IA durant la phase d'apprentissage.
2.  Optimiser le code pour réduire les coûts (ex: mise en cache des réponses, utilisation de modèles moins coûteux pour les requêtes simples).
3.  Signer des contrats B2B à long terme basés sur le volume global (lissage des coûts).

---
*Document confidentiel - Stratégie AlicIA*
