-- Données de test pour période 2026-05
-- MERGE INTO garantit l'idempotence (pas de doublon si relancé)

-- ─── PERSONNEL ────────────────────────────────────────────────────────────────
MERGE INTO personnel (matricule, nom, prenom, carte, fonction, role, numero, nature_contrat, ville, actif)
KEY(matricule)
VALUES
  ('P001', 'Bennani',   'Youssef',   'Coca Cola',      'Distribution', 'Livreur',     '0600000001', 'CDI', 'Casablanca', TRUE),
  ('P002', 'El Idrissi','Sara',      'Coca Cola',      'Distribution', 'Aide Livreur','0600000002', 'CDI', 'Rabat',      TRUE),
  ('P003', 'Moussaoui', 'Karim',     'Coca Cola',      'Distribution', 'Livreur',     '0600000003', 'Int', 'Marrakech',  TRUE),
  ('P004', 'Novo',      'Ahmed',     'Wall''s',         'Commercial',   'Vendeur',     '0600000004', 'CDI', 'Fès',        TRUE),
  ('P005', 'Sidi',      'Fatima',    'Wall''s',         'GT',           'Superviseur', '0600000005', 'CDI', 'Tanger',     TRUE),
  ('P006', 'Belaid',    'Mohammed',  'Ferrero Rocher', 'Commercial',   'Vendeur Gros','0600000006', 'CDI', 'Agadir',     TRUE),
  ('P007', 'Radi',      'Laila',     'Ferrero Rocher', 'Commercial',   'Superviseur', '0600000007', 'CDI', 'Meknès',     TRUE),
  ('P008', 'Tazi',      'Ismail',    'Coca Cola',      'Distribution', 'Livreur GMS', '0600000008', 'CDI', 'Oujda',      TRUE),
  ('P009', 'Karim',     'Nadia',     'Wall''s',         'HORECA',       'Area Manager','0600000009', 'CDI', 'Tétouan',    TRUE);

-- ─── VOLUMES COCA COLA (2026-05) ──────────────────────────────────────────────
MERGE INTO volume_distribution (matricule, periode, volume_charge, volume_retourne, joures_travailles)
KEY(matricule, periode)
VALUES
  ('P001', '2026-05', 5000.0, 20.0,  22),  -- CDI Livreur: R01=900, R02=250(retour<1%), R03=200(triage>=70%)
  ('P002', '2026-05', 3000.0, 45.0,  22),  -- CDI Aide Livreur: R01=360, R03=200(triage>=70%)
  ('P003', '2026-05', 4000.0, 80.0,  18),  -- Int Livreur: R01=480 seulement
  ('P008', '2026-05', 6000.0, 0.0,   22);  -- CDI Livreur GMS: R01=660

-- ─── NOTES DE TRIAGE COCA COLA CDI (2026-05) ──────────────────────────────────
MERGE INTO note_triage (matricule, periode, note)
KEY(matricule, periode)
VALUES
  ('P001', '2026-05', 0.85),  -- >= 70% → R03 = 200 MAD
  ('P002', '2026-05', 0.72),  -- >= 70% → R03 = 200 MAD
  ('P008', '2026-05', 0.90);  -- >= 70% → R03 = 200 MAD

-- ─── OBJECTIFS Wall''s (2026-05) ───────────────────────────────────────────────
MERGE INTO objectif_commercial (matricule, periode, carte, target)
KEY(matricule, periode, carte)
VALUES
  ('P004', '2026-05', 'Wall''s', 100000.0),   -- Vendeur
  ('P005', '2026-05', 'Wall''s', 500000.0),   -- Superviseur GT
  ('P009', '2026-05', 'Wall''s', 300000.0);   -- Area Manager

-- ─── RÉALISATIONS Wall''s (2026-05) ────────────────────────────────────────────
MERGE INTO realisation_commerciale (matricule, periode, carte, ca_realise)
KEY(matricule, periode, carte)
VALUES
  ('P004', '2026-05', 'Wall''s', 115000.0),   -- ratio=1.15 → R05: 115000*1.5%=1725 MAD
  ('P005', '2026-05', 'Wall''s', 480000.0),   -- ratio=0.96 → R06 GT: 480000*0.9%=4320 MAD
  ('P009', '2026-05', 'Wall''s', 330000.0);   -- ratio=1.10 → Area: 330000*0.7%=2310 MAD

-- ─── OBJECTIFS FERRERO (2026-05) ──────────────────────────────────────────────
MERGE INTO objectif_commercial (matricule, periode, carte, target)
KEY(matricule, periode, carte)
VALUES
  ('P006', '2026-05', 'Ferrero Rocher', 80000.0),    -- Vendeur Gros
  ('P007', '2026-05', 'Ferrero Rocher', 200000.0);   -- Superviseur

-- ─── RÉALISATIONS FERRERO (2026-05) ───────────────────────────────────────────
MERGE INTO realisation_commerciale (matricule, periode, carte, ca_realise)
KEY(matricule, periode, carte)
VALUES
  ('P006', '2026-05', 'Ferrero Rocher', 90000.0),    -- ratio=1.125 → R07 VG: 8500 MAD
  ('P007', '2026-05', 'Ferrero Rocher', 220000.0);   -- ratio=1.10  → R07 Sup: 5000 + bonus 7500 MAD
