-- ============================================================
-- Données initiales pour le service-commission
-- Ces données sont insérées automatiquement au démarrage
-- grâce à la configuration : spring.jpa.hibernate.ddl-auto=create-drop
-- ============================================================

-- ============================================================
-- Contraintes pour la carte COCA-COLA
-- ============================================================

-- Règle 1 : Commission en pourcentage sur les ventes Coca-Cola
-- L'employé touche 5% de toutes ses ventes Coca-Cola
INSERT INTO contraintes (nom, carte, valeur, condition, type_valeur, actif, date_creation, date_modification)
VALUES ('Commission ventes Coca-Cola', 'COCA_COLA', 5.0, 'ventes > 0', 'POURCENTAGE', true, NOW(), NOW());

-- Règle 2 : Bonus fixe si l'objectif de 100 000 MAD est dépassé
-- L'employé reçoit 2000 MAD supplémentaires s'il dépasse l'objectif
INSERT INTO contraintes (nom, carte, valeur, condition, type_valeur, actif, date_creation, date_modification)
VALUES ('Bonus objectif Coca-Cola', 'COCA_COLA', 2000.0, 'ventes > 100000', 'FIXE', true, NOW(), NOW());

-- ============================================================
-- Contraintes pour la carte FERRERO
-- ============================================================

-- Règle 3 : Commission en pourcentage sur les ventes Ferrero (taux plus élevé)
-- Ferrero est une marque premium → taux de commission plus attractif (6.5%)
INSERT INTO contraintes (nom, carte, valeur, condition, type_valeur, actif, date_creation, date_modification)
VALUES ('Commission ventes Ferrero', 'FERRERO', 6.5, 'ventes > 0', 'POURCENTAGE', true, NOW(), NOW());

-- Règle 4 : Bonus fixe Ferrero si objectif de 80 000 MAD atteint
INSERT INTO contraintes (nom, carte, valeur, condition, type_valeur, actif, date_creation, date_modification)
VALUES ('Bonus objectif Ferrero', 'FERRERO', 1500.0, 'ventes > 80000', 'FIXE', true, NOW(), NOW());

-- ============================================================
-- Contraintes pour la carte WALLS
-- ============================================================

-- Règle 5 : Commission en pourcentage sur les ventes Wall's
-- Taux plus bas car produits saisonniers (4%)
INSERT INTO contraintes (nom, carte, valeur, condition, type_valeur, actif, date_creation, date_modification)
VALUES ('Commission ventes Walls', 'WALLS', 4.0, 'ventes > 0', 'POURCENTAGE', true, NOW(), NOW());

-- Règle 6 : Bonus saisonnier Wall's pour les gros volumes
-- Objectif plus élevé car ventes concentrées sur l'été
INSERT INTO contraintes (nom, carte, valeur, condition, type_valeur, actif, date_creation, date_modification)
VALUES ('Bonus saisonnier Walls', 'WALLS', 2500.0, 'ventes > 120000', 'FIXE', true, NOW(), NOW());
