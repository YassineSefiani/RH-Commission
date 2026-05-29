-- ================================================================
-- SCRIPT DE CRÉATION DES BASES DE DONNÉES SQL SERVER
-- Projet : ABC DIS - Système de Gestion RH & Commissions
-- ================================================================
-- ⚠ EXÉCUTER CE SCRIPT EN PREMIER, AVANT DE DÉMARRER LES SERVICES.
--
-- Comment l'exécuter :
--   1. Ouvrir SQL Server Management Studio (SSMS)
--   2. Se connecter à SEFYASSINE\SQLEXPRESS avec Windows Auth
--   3. Ouvrir ce fichier ou copier-coller son contenu
--   4. Cliquer sur "Exécuter" (F5)
-- ================================================================

-- Chaque microservice a SA PROPRE base de données (Database-per-Service pattern).
-- Cela garantit l'isolation et l'indépendance de chaque service.

-- ─── 1. Base pour le service d'authentification (port 8081) ────────
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'rh_auth')
BEGIN
    CREATE DATABASE rh_auth;
    PRINT '✓ Base rh_auth créée avec succès.';
END
ELSE
    PRINT '→ Base rh_auth existe déjà.';
GO

-- ─── 2. Base pour le service personnel (port 8082) ──────────────────
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'rh_personnel')
BEGIN
    CREATE DATABASE rh_personnel;
    PRINT '✓ Base rh_personnel créée avec succès.';
END
ELSE
    PRINT '→ Base rh_personnel existe déjà.';
GO

-- ─── 3. Base pour le service commission (port 8083) ──────────────────
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'rh_commission')
BEGIN
    CREATE DATABASE rh_commission;
    PRINT '✓ Base rh_commission créée avec succès.';
END
ELSE
    PRINT '→ Base rh_commission existe déjà.';
GO

-- ─── 4. Base pour le service présence (port 8084) ───────────────────
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'rh_presence')
BEGIN
    CREATE DATABASE rh_presence;
    PRINT '✓ Base rh_presence créée avec succès.';
END
ELSE
    PRINT '→ Base rh_presence existe déjà.';
GO

PRINT '';
PRINT '=== Toutes les bases sont prêtes. Vous pouvez démarrer les services. ===';