Conçois une application web moderne de gestion RH et des ventes pour une entreprise de distribution.

🎨 Style général :

* Interface moderne et professionnelle (type SaaS)
* Palette de couleurs : bleu, blanc, gris clair
* Ombres légères, coins arrondis
* Design responsive (desktop en priorité)
* Sidebar à gauche + navbar en haut
* Utiliser des cartes (cards), graphiques et tableaux

---

📊 PAGE DASHBOARD :

Créer un tableau de bord principal avec :

1. Cartes KPI (en haut) :

* Nombre total d’employés (vendeurs, distributeurs, salariés)
* Nombre total de ventes
* Profit total
* Total des commissions

2. Graphiques :

* Graphique en ligne : évolution du profit par mois
* Graphique en barres : ventes par mois
* Graphique en camembert : répartition des employés (vendeurs / distributeurs / salariés)

3. Tableau :

* Top performeurs (vendeurs avec meilleures ventes ou profits)

---

⚙️ PAGE GESTION DES CONTRAINTES :

Créer une page pour définir les règles (contraintes) de calcul :

Fonctionnalités :

* Ajouter / Modifier / Supprimer des contraintes
* Types de contraintes :

  * Commission par produit (%)
  * Bonus de performance
  * Bonus de livraison
  * Pénalités (retard, retour produit)

Champs du formulaire :

* Nom de la contrainte
* Type (liste déroulante)
* Valeur (% ou montant fixe)
* Conditions (ex: ventes > X, livraisons > Y)
* Actif / Inactif (toggle)

Affichage :

* Tableau des contraintes avec filtres

---

🧮 PAGE CALCUL :

Créer une page de calcul des salaires et commissions :

Fonctionnalités :

* Sélection d’un employé (vendeur, distributeur, salarié)

* Affichage des infos :

  * rôle
  * salaire de base
  * zone

* Sélection des contraintes applicables (multi-sélection)

Entrées :

* Total des ventes
* Nombre de livraisons
* Nombre de retours (optionnel)

Résultat affiché :

* Détail du calcul :

  * Salaire de base
  * Commissions
  * Bonus
  * Pénalités

* Salaire final (mis en évidence)

Bouton :

* “Simuler”

---

📜 PAGE HISTORIQUE :

Créer une page pour afficher les historiques :

Fonctionnalités :

* Tableau des calculs passés :

  * Nom de l’employé
  * Mois
  * Total ventes
  * Commission
  * Salaire final

Filtres :

* Par date (mois / année)
* Par employé
* Par rôle

Option :

* Graphiques d’évolution par employé

---

🤖 PAGE PRÉDICTION IA :

Créer une page intelligente de prédiction des commissions et performances :

Fonctionnalités :

* Sélection d’un employé
* Affichage des données historiques (ventes, commissions, performances)

Entrées pour simulation :

* Estimation des ventes futures
* Nombre de livraisons prévues
* Produits à promouvoir

Résultats affichés :

* Commission prédite
* Salaire estimé
* Probabilité d’atteindre les objectifs (%)
* Suggestions intelligentes :

  * “Augmenter la vente de produit X pour améliorer la commission”
  * “Objectif atteignable ce mois-ci”

Visualisation :

* Graphique prédictif (courbe future)
* Comparaison :

  * Mois précédent vs prévision

---

🧭 NAVIGATION :

Menu latéral :

* Dashboard
* Contraintes
* Calcul
* Historique
* Prédiction IA
* Paramètres

---

💡 UX / UI :

* Icônes pour chaque section
* Effets hover
* Modales pour ajouter/modifier
* Messages d’erreur clairs
* Mettre en valeur les chiffres importants
* Ajouter des indicateurs visuels (badges, couleurs vert/rouge)

---

🎯 Objectif :
Créer une application professionnelle utilisée par les RH pour suivre les performances, gérer les règles de commission, calculer les salaires et prédire les performances futures grâce à l’intelligence artificielle.
