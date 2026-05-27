-- ================================================================
-- DONNÉES INITIALES POUR LA BASE rh_commission
-- ================================================================
-- Ce script insère les 6 contraintes de commission par défaut.
-- À exécuter UNE SEULE FOIS après le premier démarrage de service-commission
-- (qui crée automatiquement la table "contraintes" via Hibernate).
--
-- Comment l'exécuter :
--   1. Démarrer service-commission une première fois (crée la table)
--   2. L'arrêter
--   3. Exécuter ce script dans SSMS sur la base rh_commission
--   4. Redémarrer service-commission
-- ================================================================

USE rh_commission;
GO

-- ─── Contraintes COCA_COLA ───────────────────────────────────────────
-- Règle 1 : 5% de commission sur toutes les ventes Coca-Cola
IF NOT EXISTS (SELECT 1 FROM contraintes WHERE nom = 'Commission ventes Coca-Cola')
INSERT INTO contraintes (nom, carte, valeur, condition, type_valeur, actif, date_creation, date_modification)
VALUES ('Commission ventes Coca-Cola', 'COCA_COLA', 5.0, 'ventes > 0', 'POURCENTAGE', 1, GETDATE(), GETDATE());

-- Règle 2 : Bonus fixe 2000 MAD si ventes dépassent 100 000 MAD
IF NOT EXISTS (SELECT 1 FROM contraintes WHERE nom = 'Bonus objectif Coca-Cola')
INSERT INTO contraintes (nom, carte, valeur, condition, type_valeur, actif, date_creation, date_modification)
VALUES ('Bonus objectif Coca-Cola', 'COCA_COLA', 2000.0, 'ventes > 100000', 'FIXE', 1, GETDATE(), GETDATE());

-- ─── Contraintes FERRERO ─────────────────────────────────────────────
-- Règle 3 : 6.5% (taux plus élevé car marque premium)
IF NOT EXISTS (SELECT 1 FROM contraintes WHERE nom = 'Commission ventes Ferrero')
INSERT INTO contraintes (nom, carte, valeur, condition, type_valeur, actif, date_creation, date_modification)
VALUES ('Commission ventes Ferrero', 'FERRERO', 6.5, 'ventes > 0', 'POURCENTAGE', 1, GETDATE(), GETDATE());

-- Règle 4 : Bonus fixe 1500 MAD si ventes > 80 000 MAD
IF NOT EXISTS (SELECT 1 FROM contraintes WHERE nom = 'Bonus objectif Ferrero')
INSERT INTO contraintes (nom, carte, valeur, condition, type_valeur, actif, date_creation, date_modification)
VALUES ('Bonus objectif Ferrero', 'FERRERO', 1500.0, 'ventes > 80000', 'FIXE', 1, GETDATE(), GETDATE());

-- ─── Contraintes WALLS ───────────────────────────────────────────────
-- Règle 5 : 4% (produits saisonniers, taux plus bas)
IF NOT EXISTS (SELECT 1 FROM contraintes WHERE nom = 'Commission ventes Walls')
INSERT INTO contraintes (nom, carte, valeur, condition, type_valeur, actif, date_creation, date_modification)
VALUES ('Commission ventes Walls', 'WALLS', 4.0, 'ventes > 0', 'POURCENTAGE', 1, GETDATE(), GETDATE());

-- Règle 6 : Bonus saisonnier 2500 MAD si ventes > 120 000 MAD
IF NOT EXISTS (SELECT 1 FROM contraintes WHERE nom = 'Bonus saisonnier Walls')
INSERT INTO contraintes (nom, carte, valeur, condition, type_valeur, actif, date_creation, date_modification)
VALUES ('Bonus saisonnier Walls', 'WALLS', 2500.0, 'ventes > 120000', 'FIXE', 1, GETDATE(), GETDATE());

PRINT '✓ 6 contraintes initiales insérées dans rh_commission.';
GO
