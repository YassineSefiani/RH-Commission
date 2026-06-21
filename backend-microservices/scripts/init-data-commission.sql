-- ================================================================
-- SCRIPT COMPLET DES CONTRAINTES DE COMMISSION (ABC DIS)
-- ================================================================

USE rh_commission;
GO

-- ════════════════════════════════════════════════════════════════
-- 1. COCA-COLA : COMMISSION DE DISTRIBUTION (Base DH / CP)
-- ════════════════════════════════════════════════════════════════

-- CDI
IF NOT EXISTS (SELECT 1 FROM contraintes WHERE nom = 'Dist. Coke CDI Livreur')
INSERT INTO contraintes (nom, carte, valeur, condition, type_valeur, actif, date_creation, date_modification)
VALUES ('Dist. Coke CDI Livreur', 'Coca Cola', 0.18, 'role == ''Livreur'' AND contrat == ''CDI''', 'PAR_UNITE', 1, GETDATE(), GETDATE());

IF NOT EXISTS (SELECT 1 FROM contraintes WHERE nom = 'Dist. Coke CDI Livreur GMS')
INSERT INTO contraintes (nom, carte, valeur, condition, type_valeur, actif, date_creation, date_modification)
VALUES ('Dist. Coke CDI Livreur GMS', 'Coca Cola', 0.11, 'role == ''Livreur GMS'' AND contrat == ''CDI''', 'PAR_UNITE', 1, GETDATE(), GETDATE());

IF NOT EXISTS (SELECT 1 FROM contraintes WHERE nom = 'Dist. Coke CDI Aide livreur 1')
INSERT INTO contraintes (nom, carte, valeur, condition, type_valeur, actif, date_creation, date_modification)
VALUES ('Dist. Coke CDI Aide livreur 1', 'Coca Cola', 0.12, 'role == ''Aide livreur 1'' AND contrat == ''CDI''', 'PAR_UNITE', 1, GETDATE(), GETDATE());

-- INTÉRIMAIRE
IF NOT EXISTS (SELECT 1 FROM contraintes WHERE nom = 'Dist. Coke Intérim Livreur')
INSERT INTO contraintes (nom, carte, valeur, condition, type_valeur, actif, date_creation, date_modification)
VALUES ('Dist. Coke Intérim Livreur', 'Coca Cola', 0.12, 'role == ''Livreur'' AND contrat == ''INTERIM''', 'PAR_UNITE', 1, GETDATE(), GETDATE());

IF NOT EXISTS (SELECT 1 FROM contraintes WHERE nom = 'Dist. Coke Intérim Livreur GMS')
INSERT INTO contraintes (nom, carte, valeur, condition, type_valeur, actif, date_creation, date_modification)
VALUES ('Dist. Coke Intérim Livreur GMS', 'Coca Cola', 0.11, 'role == ''Livreur GMS'' AND contrat == ''INTERIM''', 'PAR_UNITE', 1, GETDATE(), GETDATE());

IF NOT EXISTS (SELECT 1 FROM contraintes WHERE nom = 'Dist. Coke Intérim Aide 1')
INSERT INTO contraintes (nom, carte, valeur, condition, type_valeur, actif, date_creation, date_modification)
VALUES ('Dist. Coke Intérim Aide 1', 'Coca Cola', 0.08, 'role == ''Aide livreur 1'' AND contrat == ''INTERIM''', 'PAR_UNITE', 1, GETDATE(), GETDATE());

-- ════════════════════════════════════════════════════════════════
-- 2. COCA-COLA : COMMISSION DE RETOUR (Livreur CDI uniquement)
-- ════════════════════════════════════════════════════════════════

IF NOT EXISTS (SELECT 1 FROM contraintes WHERE nom = 'Retour Coke <1%')
INSERT INTO contraintes (nom, carte, valeur, condition, type_valeur, actif, date_creation, date_modification)
VALUES ('Retour Coke <1%', 'Coca Cola', 250.0, 'role == ''Livreur'' AND contrat == ''CDI'' AND jours_travailles > 15 AND taux_retour < 1.0', 'FIXE', 1, GETDATE(), GETDATE());

IF NOT EXISTS (SELECT 1 FROM contraintes WHERE nom = 'Retour Coke 1% à 2%')
INSERT INTO contraintes (nom, carte, valeur, condition, type_valeur, actif, date_creation, date_modification)
VALUES ('Retour Coke 1% à 2%', 'Coca Cola', 150.0, 'role == ''Livreur'' AND contrat == ''CDI'' AND jours_travailles > 15 AND taux_retour >= 1.0 AND taux_retour <= 2.0', 'FIXE', 1, GETDATE(), GETDATE());

-- ════════════════════════════════════════════════════════════════
-- 3. COCA-COLA : COMMISSION DE TRIAGE (CDI uniquement)
-- ════════════════════════════════════════════════════════════════

IF NOT EXISTS (SELECT 1 FROM contraintes WHERE nom = 'Triage Coke Livreur >70%')
INSERT INTO contraintes (nom, carte, valeur, condition, type_valeur, actif, date_creation, date_modification)
VALUES ('Triage Coke >70%', 'Coca Cola', 200.0, 'contrat == ''CDI'' AND jours_travailles > 15 AND taux_triage > 70.0', 'FIXE', 1, GETDATE(), GETDATE());

-- NOTE: Commission de Congé Coke -> En attente de confirmation par Hamza. (Non insérée)

-- ════════════════════════════════════════════════════════════════
-- 4. Wall's : COMMISSIONS COMMERCIALES & ENCADREMENT
-- ════════════════════════════════════════════════════════════════

-- Vendeur Wall's (1.50% du CA)
IF NOT EXISTS (SELECT 1 FROM contraintes WHERE nom = 'Comm. Vendeur Wall''s')
INSERT INTO contraintes (nom, carte, valeur, condition, type_valeur, actif, date_creation, date_modification)
VALUES ('Comm. Vendeur Wall''s', 'Wall''s', 1.50, 'role == ''Vendeur'' AND contrat == ''CDI''', 'POURCENTAGE', 1, GETDATE(), GETDATE());

-- Superviseur Retail (% du CA)
IF NOT EXISTS (SELECT 1 FROM contraintes WHERE nom = 'Wall''s Sup Retail >70%')
INSERT INTO contraintes (nom, carte, valeur, condition, type_valeur, actif, date_creation, date_modification)
VALUES ('Wall''s Sup Retail >70%', 'Wall''s', 0.70, 'role == ''Superviseur Retail'' AND contrat == ''CDI'' AND taux_realisation > 70.0 AND taux_realisation <= 80.0', 'POURCENTAGE', 1, GETDATE(), GETDATE());

IF NOT EXISTS (SELECT 1 FROM contraintes WHERE nom = 'Wall''s Sup Retail >80%')
INSERT INTO contraintes (nom, carte, valeur, condition, type_valeur, actif, date_creation, date_modification)
VALUES ('Wall''s Sup Retail >80%', 'Wall''s', 0.80, 'role == ''Superviseur Retail'' AND contrat == ''CDI'' AND taux_realisation > 80.0 AND taux_realisation <= 90.0', 'POURCENTAGE', 1, GETDATE(), GETDATE());

IF NOT EXISTS (SELECT 1 FROM contraintes WHERE nom = 'Wall''s Sup Retail >90%')
INSERT INTO contraintes (nom, carte, valeur, condition, type_valeur, actif, date_creation, date_modification)
VALUES ('Wall''s Sup Retail >90%', 'Wall''s', 0.90, 'role == ''Superviseur Retail'' AND contrat == ''CDI'' AND taux_realisation > 90.0 AND taux_realisation <= 100.0', 'POURCENTAGE', 1, GETDATE(), GETDATE());

IF NOT EXISTS (SELECT 1 FROM contraintes WHERE nom = 'Wall''s Sup Retail >100%')
INSERT INTO contraintes (nom, carte, valeur, condition, type_valeur, actif, date_creation, date_modification)
VALUES ('Wall''s Sup Retail >100%', 'Wall''s', 1.00, 'role == ''Superviseur Retail'' AND contrat == ''CDI'' AND taux_realisation > 100.0', 'POURCENTAGE', 1, GETDATE(), GETDATE());

-- Superviseur MT (Fixe en DH)
IF NOT EXISTS (SELECT 1 FROM contraintes WHERE nom = 'Wall''s Sup MT >70%')
INSERT INTO contraintes (nom, carte, valeur, condition, type_valeur, actif, date_creation, date_modification)
VALUES ('Wall''s Sup MT >70%', 'Wall''s', 4000.0, 'role == ''Superviseur MT'' AND contrat == ''CDI'' AND taux_realisation > 70.0 AND taux_realisation <= 80.0', 'FIXE', 1, GETDATE(), GETDATE());

IF NOT EXISTS (SELECT 1 FROM contraintes WHERE nom = 'Wall''s Sup MT >80%')
INSERT INTO contraintes (nom, carte, valeur, condition, type_valeur, actif, date_creation, date_modification)
VALUES ('Wall''s Sup MT >80%', 'Wall''s', 6000.0, 'role == ''Superviseur MT'' AND contrat == ''CDI'' AND taux_realisation > 80.0 AND taux_realisation <= 90.0', 'FIXE', 1, GETDATE(), GETDATE());

IF NOT EXISTS (SELECT 1 FROM contraintes WHERE nom = 'Wall''s Sup MT >90%')
INSERT INTO contraintes (nom, carte, valeur, condition, type_valeur, actif, date_creation, date_modification)
VALUES ('Wall''s Sup MT >90%', 'Wall''s', 8000.0, 'role == ''Superviseur MT'' AND contrat == ''CDI'' AND taux_realisation > 90.0 AND taux_realisation <= 100.0', 'FIXE', 1, GETDATE(), GETDATE());

IF NOT EXISTS (SELECT 1 FROM contraintes WHERE nom = 'Wall''s Sup MT >100%')
INSERT INTO contraintes (nom, carte, valeur, condition, type_valeur, actif, date_creation, date_modification)
VALUES ('Wall''s Sup MT >100%', 'Wall''s', 10000.0, 'role == ''Superviseur MT'' AND contrat == ''CDI'' AND taux_realisation > 100.0', 'FIXE', 1, GETDATE(), GETDATE());

-- Superviseur Petrolium : 0% dans le tableau, donc ignoré.

-- Superviseur HORECA (Fixe 0.60% partout)
IF NOT EXISTS (SELECT 1 FROM contraintes WHERE nom = 'Wall''s Sup HORECA')
INSERT INTO contraintes (nom, carte, valeur, condition, type_valeur, actif, date_creation, date_modification)
VALUES ('Wall''s Sup HORECA', 'Wall''s', 0.60, 'role == ''Superviseur HORECA'' AND contrat == ''CDI''', 'POURCENTAGE', 1, GETDATE(), GETDATE());

-- Area (% du CA)
IF NOT EXISTS (SELECT 1 FROM contraintes WHERE nom = 'Wall''s Area >70%')
INSERT INTO contraintes (nom, carte, valeur, condition, type_valeur, actif, date_creation, date_modification)
VALUES ('Wall''s Area >70%', 'Wall''s', 0.40, 'role == ''Area'' AND contrat == ''CDI'' AND taux_realisation > 70.0 AND taux_realisation <= 80.0', 'POURCENTAGE', 1, GETDATE(), GETDATE());

IF NOT EXISTS (SELECT 1 FROM contraintes WHERE nom = 'Wall''s Area >80%')
INSERT INTO contraintes (nom, carte, valeur, condition, type_valeur, actif, date_creation, date_modification)
VALUES ('Wall''s Area >80%', 'Wall''s', 0.50, 'role == ''Area'' AND contrat == ''CDI'' AND taux_realisation > 80.0 AND taux_realisation <= 90.0', 'POURCENTAGE', 1, GETDATE(), GETDATE());

IF NOT EXISTS (SELECT 1 FROM contraintes WHERE nom = 'Wall''s Area >90%')
INSERT INTO contraintes (nom, carte, valeur, condition, type_valeur, actif, date_creation, date_modification)
VALUES ('Wall''s Area >90%', 'Wall''s', 0.60, 'role == ''Area'' AND contrat == ''CDI'' AND taux_realisation > 90.0 AND taux_realisation <= 100.0', 'POURCENTAGE', 1, GETDATE(), GETDATE());

IF NOT EXISTS (SELECT 1 FROM contraintes WHERE nom = 'Wall''s Area >100%')
INSERT INTO contraintes (nom, carte, valeur, condition, type_valeur, actif, date_creation, date_modification)
VALUES ('Wall''s Area >100%', 'Wall''s', 0.70, 'role == ''Area'' AND contrat == ''CDI'' AND taux_realisation > 100.0', 'POURCENTAGE', 1, GETDATE(), GETDATE());


-- ════════════════════════════════════════════════════════════════
-- 5. Ferrero Rocher : COMMISSIONS COMMERCIALES & ENCADREMENT
-- ════════════════════════════════════════════════════════════════

-- Vendeur (% du CA)
IF NOT EXISTS (SELECT 1 FROM contraintes WHERE nom = 'Ferrero Rocher Vendeur >70%')
INSERT INTO contraintes (nom, carte, valeur, condition, type_valeur, actif, date_creation, date_modification)
VALUES ('Ferrero Rocher Vendeur >70%', 'Ferrero Rocher', 1.00, 'role == ''Vendeur'' AND contrat == ''CDI'' AND taux_realisation > 70.0 AND taux_realisation <= 80.0', 'POURCENTAGE', 1, GETDATE(), GETDATE());

IF NOT EXISTS (SELECT 1 FROM contraintes WHERE nom = 'Ferrero Rocher Vendeur >80%')
INSERT INTO contraintes (nom, carte, valeur, condition, type_valeur, actif, date_creation, date_modification)
VALUES ('Ferrero Rocher Vendeur >80%', 'Ferrero Rocher', 1.50, 'role == ''Vendeur'' AND contrat == ''CDI'' AND taux_realisation > 80.0 AND taux_realisation <= 90.0', 'POURCENTAGE', 1, GETDATE(), GETDATE());

IF NOT EXISTS (SELECT 1 FROM contraintes WHERE nom = 'Ferrero Rocher Vendeur >90%')
INSERT INTO contraintes (nom, carte, valeur, condition, type_valeur, actif, date_creation, date_modification)
VALUES ('Ferrero Rocher Vendeur >90%', 'Ferrero Rocher', 1.80, 'role == ''Vendeur'' AND contrat == ''CDI'' AND taux_realisation > 90.0 AND taux_realisation <= 100.0', 'POURCENTAGE', 1, GETDATE(), GETDATE());

IF NOT EXISTS (SELECT 1 FROM contraintes WHERE nom = 'Ferrero Rocher Vendeur >100%')
INSERT INTO contraintes (nom, carte, valeur, condition, type_valeur, actif, date_creation, date_modification)
VALUES ('Ferrero Rocher Vendeur >100%', 'Ferrero Rocher', 2.00, 'role == ''Vendeur'' AND contrat == ''CDI'' AND taux_realisation > 100.0', 'POURCENTAGE', 1, GETDATE(), GETDATE());

-- Vendeur Gros (Fixe en DH)
IF NOT EXISTS (SELECT 1 FROM contraintes WHERE nom = 'Ferrero Rocher Vendeur Gros >70%')
INSERT INTO contraintes (nom, carte, valeur, condition, type_valeur, actif, date_creation, date_modification)
VALUES ('Ferrero Rocher Vendeur Gros >70%', 'Ferrero Rocher', 3000.0, 'role == ''Vendeur Gros'' AND contrat == ''CDI'' AND taux_realisation > 70.0 AND taux_realisation <= 80.0', 'FIXE', 1, GETDATE(), GETDATE());

IF NOT EXISTS (SELECT 1 FROM contraintes WHERE nom = 'Ferrero Rocher Vendeur Gros >80%')
INSERT INTO contraintes (nom, carte, valeur, condition, type_valeur, actif, date_creation, date_modification)
VALUES ('Ferrero Rocher Vendeur Gros >80%', 'Ferrero Rocher', 4000.0, 'role == ''Vendeur Gros'' AND contrat == ''CDI'' AND taux_realisation > 80.0 AND taux_realisation <= 90.0', 'FIXE', 1, GETDATE(), GETDATE());

IF NOT EXISTS (SELECT 1 FROM contraintes WHERE nom = 'Ferrero Rocher Vendeur Gros >90%')
INSERT INTO contraintes (nom, carte, valeur, condition, type_valeur, actif, date_creation, date_modification)
VALUES ('Ferrero Rocher Vendeur Gros >90%', 'Ferrero Rocher', 5000.0, 'role == ''Vendeur Gros'' AND contrat == ''CDI'' AND taux_realisation > 90.0 AND taux_realisation <= 100.0', 'FIXE', 1, GETDATE(), GETDATE());

IF NOT EXISTS (SELECT 1 FROM contraintes WHERE nom = 'Ferrero Rocher Vendeur Gros >100%')
INSERT INTO contraintes (nom, carte, valeur, condition, type_valeur, actif, date_creation, date_modification)
VALUES ('Ferrero Rocher Vendeur Gros >100%', 'Ferrero Rocher', 8500.0, 'role == ''Vendeur Gros'' AND contrat == ''CDI'' AND taux_realisation > 100.0', 'FIXE', 1, GETDATE(), GETDATE());

-- Superviseur (Fixe en DH)
IF NOT EXISTS (SELECT 1 FROM contraintes WHERE nom = 'Ferrero Rocher Superviseur >70%')
INSERT INTO contraintes (nom, carte, valeur, condition, type_valeur, actif, date_creation, date_modification)
VALUES ('Ferrero Rocher Superviseur >70%', 'Ferrero Rocher', 2000.0, 'role == ''Superviseur'' AND contrat == ''CDI'' AND taux_realisation > 70.0 AND taux_realisation <= 80.0', 'FIXE', 1, GETDATE(), GETDATE());

IF NOT EXISTS (SELECT 1 FROM contraintes WHERE nom = 'Ferrero Rocher Superviseur >80%')
INSERT INTO contraintes (nom, carte, valeur, condition, type_valeur, actif, date_creation, date_modification)
VALUES ('Ferrero Rocher Superviseur >80%', 'Ferrero Rocher', 2500.0, 'role == ''Superviseur'' AND contrat == ''CDI'' AND taux_realisation > 80.0 AND taux_realisation <= 90.0', 'FIXE', 1, GETDATE(), GETDATE());

IF NOT EXISTS (SELECT 1 FROM contraintes WHERE nom = 'Ferrero Rocher Superviseur >90%')
INSERT INTO contraintes (nom, carte, valeur, condition, type_valeur, actif, date_creation, date_modification)
VALUES ('Ferrero Rocher Superviseur >90%', 'Ferrero Rocher', 3000.0, 'role == ''Superviseur'' AND contrat == ''CDI'' AND taux_realisation > 90.0 AND taux_realisation <= 100.0', 'FIXE', 1, GETDATE(), GETDATE());

IF NOT EXISTS (SELECT 1 FROM contraintes WHERE nom = 'Ferrero Rocher Superviseur >100%')
INSERT INTO contraintes (nom, carte, valeur, condition, type_valeur, actif, date_creation, date_modification)
VALUES ('Ferrero Rocher Superviseur >100%', 'Ferrero Rocher', 5000.0, 'role == ''Superviseur'' AND contrat == ''CDI'' AND taux_realisation > 100.0', 'FIXE', 1, GETDATE(), GETDATE());

-- "ALL > 100%" -> Variable dédiée pour le dépassement global équipe
IF NOT EXISTS (SELECT 1 FROM contraintes WHERE nom = 'Ferrero Rocher Sup ALL > 100%')
INSERT INTO contraintes (nom, carte, valeur, condition, type_valeur, actif, date_creation, date_modification)
VALUES ('Ferrero Rocher Sup ALL > 100%', 'Ferrero Rocher', 7500.0, 'role == ''Superviseur'' AND contrat == ''CDI'' AND taux_realisation_global > 100.0', 'FIXE', 1, GETDATE(), GETDATE());

-- Area (Fixe en DH)
IF NOT EXISTS (SELECT 1 FROM contraintes WHERE nom = 'Ferrero Rocher Area >80%')
INSERT INTO contraintes (nom, carte, valeur, condition, type_valeur, actif, date_creation, date_modification)
VALUES ('Ferrero Rocher Area >80%', 'Ferrero Rocher', 4000.0, 'role == ''Area'' AND contrat == ''CDI'' AND taux_realisation > 80.0 AND taux_realisation <= 90.0', 'FIXE', 1, GETDATE(), GETDATE());

IF NOT EXISTS (SELECT 1 FROM contraintes WHERE nom = 'Ferrero Rocher Area >90%')
INSERT INTO contraintes (nom, carte, valeur, condition, type_valeur, actif, date_creation, date_modification)
VALUES ('Ferrero Rocher Area >90%', 'Ferrero Rocher', 6000.0, 'role == ''Area'' AND contrat == ''CDI'' AND taux_realisation > 90.0 AND taux_realisation <= 100.0', 'FIXE', 1, GETDATE(), GETDATE());

IF NOT EXISTS (SELECT 1 FROM contraintes WHERE nom = 'Ferrero Rocher Area >100%')
INSERT INTO contraintes (nom, carte, valeur, condition, type_valeur, actif, date_creation, date_modification)
VALUES ('Ferrero Rocher Area >100%', 'Ferrero Rocher', 10000.0, 'role == ''Area'' AND contrat == ''CDI'' AND taux_realisation > 100.0', 'FIXE', 1, GETDATE(), GETDATE());

-- ════════════════════════════════════════════════════════════════
-- 6. COMMISSION STATIQUE
-- ════════════════════════════════════════════════════════════════

-- Variables par défaut (Valeur à définir depuis l'interface admin, inséré ici à 0 pour création du lien)
IF NOT EXISTS (SELECT 1 FROM contraintes WHERE nom = 'Commission Statique Magasinier')
INSERT INTO contraintes (nom, carte, valeur, condition, type_valeur, actif, date_creation, date_modification)
VALUES ('Commission Statique Magasinier', 'Coca Cola', 0.0, 'role == ''Magasinier'' AND contrat == ''CDI''', 'FIXE', 1, GETDATE(), GETDATE());

IF NOT EXISTS (SELECT 1 FROM contraintes WHERE nom = 'Commission Statique Dispatcher')
INSERT INTO contraintes (nom, carte, valeur, condition, type_valeur, actif, date_creation, date_modification)
VALUES ('Commission Statique Dispatcher', 'Coca Cola', 0.0, 'role == ''Dispatcher'' AND contrat == ''CDI''', 'FIXE', 1, GETDATE(), GETDATE());

PRINT '✓ Intégration totale et exhaustive des règles terminée.';
GO