-- ================================================================
-- SCRIPT : Création du login SQL Server pour les microservices
-- ================================================================
-- Exécuter dans SSMS connecté en Windows Auth sur SEFYASSINE\SQLEXPRESS
-- ================================================================

USE master;
GO

-- Étape 1 : Activer l'authentification SQL Server (mixed mode)
-- (Nécessaire si seule la Windows Auth était activée)
EXEC xp_instance_regwrite
    N'HKEY_LOCAL_MACHINE',
    N'Software\Microsoft\MSSQLServer\MSSQLServer',
    N'LoginMode',
    REG_DWORD,
    2;  -- 1 = Windows only, 2 = Mixed (Windows + SQL Auth)
GO

PRINT 'Mode d authentification mixte activé.';
PRINT 'IMPORTANT : Redémarrer le service SQL Server pour que ce changement soit pris en compte.';
PRINT 'Dans SSMS : clic droit sur le serveur → Propriétés → Sécurité → vérifier "SQL Server et Windows Auth"';
GO

-- Étape 2 : Créer le login SQL Server
IF NOT EXISTS (SELECT name FROM sys.server_principals WHERE name = 'abcdis_user')
BEGIN
    CREATE LOGIN abcdis_user WITH PASSWORD = 'AbcDis2024!',
        CHECK_POLICY = OFF,
        CHECK_EXPIRATION = OFF;
    PRINT '✓ Login abcdis_user créé.';
END
ELSE
    PRINT '→ Login abcdis_user existe déjà.';
GO

-- Étape 3 : Donner accès aux 4 bases de données

-- Base rh_auth
USE rh_auth;
IF NOT EXISTS (SELECT name FROM sys.database_principals WHERE name = 'abcdis_user')
BEGIN
    CREATE USER abcdis_user FOR LOGIN abcdis_user;
    ALTER ROLE db_owner ADD MEMBER abcdis_user;
    PRINT '✓ Accès rh_auth accordé.';
END
GO

-- Base rh_personnel
USE rh_personnel;
IF NOT EXISTS (SELECT name FROM sys.database_principals WHERE name = 'abcdis_user')
BEGIN
    CREATE USER abcdis_user FOR LOGIN abcdis_user;
    ALTER ROLE db_owner ADD MEMBER abcdis_user;
    PRINT '✓ Accès rh_personnel accordé.';
END
GO

-- Base rh_commission
USE rh_commission;
IF NOT EXISTS (SELECT name FROM sys.database_principals WHERE name = 'abcdis_user')
BEGIN
    CREATE USER abcdis_user FOR LOGIN abcdis_user;
    ALTER ROLE db_owner ADD MEMBER abcdis_user;
    PRINT '✓ Accès rh_commission accordé.';
END
GO

-- Base rh_presence
USE rh_presence;
IF NOT EXISTS (SELECT name FROM sys.database_principals WHERE name = 'abcdis_user')
BEGIN
    CREATE USER abcdis_user FOR LOGIN abcdis_user;
    ALTER ROLE db_owner ADD MEMBER abcdis_user;
    PRINT '✓ Accès rh_presence accordé.';
END
GO

PRINT '';
PRINT '=== Configuration terminée ===';
PRINT 'Login  : abcdis_user';
PRINT 'Mot de passe : AbcDis2024!';
PRINT 'RAPPEL : Redémarrer SQL Server si tu as changé le mode d auth.';