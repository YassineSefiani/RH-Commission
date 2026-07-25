# Migration Base de Données Cloud + Déploiement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrer les 4 bases SQL Server locales (sur le poste du binôme) vers PostgreSQL hébergé sur Neon, conteneuriser les 5 services Spring Boot (Docker), et déployer l'ensemble (backend sur Render, frontend sur Vercel) pour un accès public par URL, à coût nul.

**Architecture:** Pattern database-per-service conservé (4 projets Neon distincts). Chaque microservice passe du driver/dialecte SQL Server au driver/dialecte PostgreSQL (Hibernate abstrait déjà tout le SQL applicatif, aucune requête native à réécrire hormis le script de seed). Conteneurisation multi-stage (build Maven → JRE léger) pour tenir dans les limites mémoire du tier gratuit Render. Déploiement: 5 "Web Services" Docker sur Render (gateway + 4 services) + 1 site statique Vercel (frontend).

**Tech Stack:** Spring Boot 3.2.4 / Java 17 / Maven multi-module, PostgreSQL (Neon), Docker, Render, Vercel, React/Vite/TS.

## Global Constraints

- Budget: 0€, aucune carte bancaire — n'utiliser que des offres gratuites sans CB (Neon, Render free, Vercel free)
- Pattern database-per-service à conserver: 4 bases Postgres séparées, pas une base partagée
- Aucun secret réel (mot de passe DB de prod, JWT secret de prod) ne doit être committé dans git — seuls des defaults de dev local (non sensibles) restent dans le code
- Ne pas modifier la logique métier des services — migration d'infrastructure uniquement
- Toujours vérifier qu'on travaille sur la branche `DevBek` avant de commit

Référence: [docs/superpowers/specs/2026-07-25-cloud-database-migration-design.md](../specs/2026-07-25-cloud-database-migration-design.md)

---

## File Structure

```
RH-Commission/
├── docker-compose.yml                                          [create]
├── docs/
│   ├── DEPLOYMENT.md                                            [create]
│   └── ai-memory/CONTEXT.md                                     [modify]
└── backend-microservices/
    ├── scripts/
    │   ├── init-local-postgres-dbs.sh                           [create]
    │   └── init-data-commission.sql                              [modify — T-SQL vers Postgres]
    ├── api-gateway/Dockerfile                                    [create]
    ├── service-auth/
    │   ├── Dockerfile                                             [create]
    │   ├── pom.xml                                                [modify]
    │   └── src/main/resources/application.properties              [modify]
    ├── service-personnel/
    │   ├── Dockerfile                                             [create]
    │   ├── pom.xml                                                [modify]
    │   └── src/main/resources/application.properties              [modify]
    ├── service-commission/
    │   ├── Dockerfile                                             [create]
    │   ├── pom.xml                                                [modify]
    │   └── src/main/resources/application.properties              [modify]
    └── service-presence/
        ├── Dockerfile                                             [create]
        ├── pom.xml                                                [modify]
        └── src/main/resources/application.properties              [modify]
```

---

### Task 1: Provisionner les 4 projets Neon PostgreSQL

**Files:** aucun fichier repo — actions dans le dashboard Neon.

**Interfaces:**
- Produces: 4 chaînes de connexion Neon (une par service), utilisées comme valeurs des variables d'environnement `DB_URL_AUTH`, `DB_URL_PERSONNEL`, `DB_URL_COMMISSION`, `DB_URL_PRESENCE` dans les tâches suivantes. Format attendu après transformation: `jdbc:postgresql://<host>/<dbname>?sslmode=require` + `DB_USERNAME`/`DB_PASSWORD` séparés.

- [ ] **Step 1: Créer un compte Neon**

Aller sur https://neon.tech, s'inscrire (GitHub ou email, aucune carte bancaire demandée).

- [ ] **Step 2: Créer 4 projets**

Dans le dashboard Neon, créer 4 projets séparés (bouton "New Project"):
- `rh-auth`
- `rh-personnel`
- `rh-commission`
- `rh-presence`

Pour chacun, région la plus proche (ex: Europe), Postgres version par défaut (16).

- [ ] **Step 3: Récupérer et noter les chaînes de connexion**

Pour chaque projet, dans l'onglet "Connection Details" du dashboard Neon, copier la chaîne au format:
```
postgresql://<user>:<password>@<host>/<dbname>?sslmode=require
```

Créer un fichier local **non committé** `backend-microservices/.env.neon.local` (sera ignoré par git, voir Step 4) avec les 4 chaînes, pour s'y référer pendant les Tasks 2-5:
```
NEON_AUTH=postgresql://<user>:<password>@<host>/rh-auth?sslmode=require
NEON_PERSONNEL=postgresql://<user>:<password>@<host>/rh-personnel?sslmode=require
NEON_COMMISSION=postgresql://<user>:<password>@<host>/rh-commission?sslmode=require
NEON_PRESENCE=postgresql://<user>:<password>@<host>/rh-presence?sslmode=require
```

- [ ] **Step 4: Ignorer ce fichier dans git**

Ouvrir `.gitignore` à la racine du repo et ajouter à la fin:
```
# Secrets locaux (jamais committés)
.env.neon.local
backend-microservices/.env.neon.local
```

- [ ] **Step 5: Vérifier la connectivité**

Dans le dashboard Neon, ouvrir l'onglet "SQL Editor" du projet `rh-auth` et exécuter:
```sql
SELECT 1;
```
Attendu: résultat `1` sans erreur. Répéter pour les 3 autres projets.

- [ ] **Step 6: Commit**

```bash
git add .gitignore
git commit -m "chore: ignore local Neon connection strings file"
```

---

### Task 2: Migrer service-auth vers PostgreSQL

**Files:**
- Modify: `backend-microservices/service-auth/pom.xml:54-59`
- Modify: `backend-microservices/service-auth/src/main/resources/application.properties`

**Interfaces:**
- Consumes: `NEON_AUTH` connection string de la Task 1
- Produces: service-auth bootable en local contre Postgres, endpoint `GET /api/users` fonctionnel — les tâches de déploiement (Task 14) réutilisent la même config via variables d'env Render

- [ ] **Step 1: Remplacer le driver JDBC dans le pom.xml**

Dans `backend-microservices/service-auth/pom.xml`, remplacer (lignes 54-59):
```xml
        <!-- Pilote JDBC SQL Server (Microsoft) -->
        <dependency>
            <groupId>com.microsoft.sqlserver</groupId>
            <artifactId>mssql-jdbc</artifactId>
            <scope>runtime</scope>
        </dependency>
```
par:
```xml
        <!-- Pilote JDBC PostgreSQL -->
        <dependency>
            <groupId>org.postgresql</groupId>
            <artifactId>postgresql</artifactId>
            <scope>runtime</scope>
        </dependency>
```

- [ ] **Step 2: Mettre à jour application.properties**

Dans `backend-microservices/service-auth/src/main/resources/application.properties`, remplacer le bloc datasource:
```properties
spring.datasource.url=${DB_URL_AUTH:jdbc:sqlserver://localhost\\SQLEXPRESS;databaseName=rh_auth;trustServerCertificate=true;encrypt=false}
spring.datasource.driver-class-name=com.microsoft.sqlserver.jdbc.SQLServerDriver
spring.datasource.username=${DB_USERNAME:abcdis_user}
spring.datasource.password=${DB_PASSWORD:AbcDis2024!}
```
par:
```properties
spring.datasource.url=${DB_URL_AUTH:jdbc:postgresql://localhost:5432/rh_auth}
spring.datasource.driver-class-name=org.postgresql.Driver
spring.datasource.username=${DB_USERNAME:postgres}
spring.datasource.password=${DB_PASSWORD:postgres}
```

Et remplacer:
```properties
spring.jpa.database-platform=org.hibernate.dialect.SQLServerDialect
```
par:
```properties
spring.jpa.database-platform=org.hibernate.dialect.PostgreSQLDialect
```

- [ ] **Step 3: Builder et lancer le service contre Neon**

Depuis `backend-microservices/`:
```bash
cd backend-microservices
mvn -pl service-auth -am clean package -DskipTests
```
Attendu: `BUILD SUCCESS`.

Lancer en pointant sur Neon (remplacer par la vraie chaîne notée en Task 1, en séparant user/password/host/db):
```bash
DB_URL_AUTH="jdbc:postgresql://<host>/rh-auth?sslmode=require" \
DB_USERNAME="<user>" \
DB_PASSWORD="<password>" \
java -jar service-auth/target/*.jar
```
Attendu dans les logs: `Started HrAppApplication` (ou classe équivalente) sans exception, `Tomcat started on port 8081`.

- [ ] **Step 4: Vérifier via curl**

Dans un autre terminal:
```bash
curl -s http://localhost:8081/api/users
```
Attendu: `[]` (liste vide, HTTP 200) — confirme que Hibernate a créé la table `utilisateurs`/`users` dans Neon.

Dans le dashboard Neon (SQL Editor, projet `rh-auth`):
```sql
SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
```
Attendu: la ou les tables créées par `Utilisateur`/`AuditLog` apparaissent.

Arrêter le service (Ctrl+C).

- [ ] **Step 5: Commit**

```bash
git add backend-microservices/service-auth/pom.xml backend-microservices/service-auth/src/main/resources/application.properties
git commit -m "feat(service-auth): migrate datasource from SQL Server to PostgreSQL"
```

---

### Task 3: Migrer service-personnel vers PostgreSQL

**Files:**
- Modify: `backend-microservices/service-personnel/pom.xml:39-44`
- Modify: `backend-microservices/service-personnel/src/main/resources/application.properties`

**Interfaces:**
- Consumes: `NEON_PERSONNEL` connection string de la Task 1
- Produces: service-personnel bootable en local contre Postgres, endpoint `GET /api/personnel` fonctionnel

- [ ] **Step 1: Remplacer le driver JDBC dans le pom.xml**

Dans `backend-microservices/service-personnel/pom.xml`, remplacer (lignes 39-44):
```xml
        <!-- Pilote JDBC SQL Server -->
        <dependency>
            <groupId>com.microsoft.sqlserver</groupId>
            <artifactId>mssql-jdbc</artifactId>
            <scope>runtime</scope>
        </dependency>
```
par:
```xml
        <!-- Pilote JDBC PostgreSQL -->
        <dependency>
            <groupId>org.postgresql</groupId>
            <artifactId>postgresql</artifactId>
            <scope>runtime</scope>
        </dependency>
```

- [ ] **Step 2: Mettre à jour application.properties**

Dans `backend-microservices/service-personnel/src/main/resources/application.properties`, remplacer:
```properties
spring.datasource.url=${DB_URL_PERSONNEL:jdbc:sqlserver://localhost\\SQLEXPRESS;databaseName=rh_personnel;trustServerCertificate=true;encrypt=false}
spring.datasource.driver-class-name=com.microsoft.sqlserver.jdbc.SQLServerDriver
spring.datasource.username=${DB_USERNAME:abcdis_user}
spring.datasource.password=${DB_PASSWORD:AbcDis2024!}
```
par:
```properties
spring.datasource.url=${DB_URL_PERSONNEL:jdbc:postgresql://localhost:5432/rh_personnel}
spring.datasource.driver-class-name=org.postgresql.Driver
spring.datasource.username=${DB_USERNAME:postgres}
spring.datasource.password=${DB_PASSWORD:postgres}
```

Et remplacer:
```properties
spring.jpa.database-platform=org.hibernate.dialect.SQLServerDialect
```
par:
```properties
spring.jpa.database-platform=org.hibernate.dialect.PostgreSQLDialect
```

- [ ] **Step 3: Builder et lancer le service contre Neon**

```bash
cd backend-microservices
mvn -pl service-personnel -am clean package -DskipTests
```
Attendu: `BUILD SUCCESS`.

```bash
DB_URL_PERSONNEL="jdbc:postgresql://<host>/rh-personnel?sslmode=require" \
DB_USERNAME="<user>" \
DB_PASSWORD="<password>" \
java -jar service-personnel/target/*.jar
```
Attendu: `Tomcat started on port 8082` sans exception.

- [ ] **Step 4: Vérifier via curl**

```bash
curl -s http://localhost:8082/api/personnel
```
Attendu: `[]` (HTTP 200).

Arrêter le service (Ctrl+C).

- [ ] **Step 5: Commit**

```bash
git add backend-microservices/service-personnel/pom.xml backend-microservices/service-personnel/src/main/resources/application.properties
git commit -m "feat(service-personnel): migrate datasource from SQL Server to PostgreSQL"
```

---

### Task 4: Migrer service-commission vers PostgreSQL + réécrire le script de seed

**Files:**
- Modify: `backend-microservices/service-commission/pom.xml:41-46`
- Modify: `backend-microservices/service-commission/src/main/resources/application.properties`
- Modify: `backend-microservices/scripts/init-data-commission.sql`

**Interfaces:**
- Consumes: `NEON_COMMISSION` connection string de la Task 1
- Produces: service-commission bootable en local contre Postgres, endpoint `GET /api/contraintes` fonctionnel, contraintes de seed présentes en base

- [ ] **Step 1: Remplacer le driver JDBC dans le pom.xml**

Dans `backend-microservices/service-commission/pom.xml`, remplacer (lignes 41-46):
```xml
        <!-- Pilote JDBC SQL Server (Microsoft) -->
        <dependency>
            <groupId>com.microsoft.sqlserver</groupId>
            <artifactId>mssql-jdbc</artifactId>
            <scope>runtime</scope>
        </dependency>
```
par:
```xml
        <!-- Pilote JDBC PostgreSQL -->
        <dependency>
            <groupId>org.postgresql</groupId>
            <artifactId>postgresql</artifactId>
            <scope>runtime</scope>
        </dependency>
```

- [ ] **Step 2: Mettre à jour application.properties**

Dans `backend-microservices/service-commission/src/main/resources/application.properties`, remplacer:
```properties
spring.datasource.url=${DB_URL_COMMISSION:jdbc:sqlserver://localhost\\SQLEXPRESS;databaseName=rh_commission;trustServerCertificate=true;encrypt=false}
spring.datasource.driver-class-name=com.microsoft.sqlserver.jdbc.SQLServerDriver
spring.datasource.username=${DB_USERNAME:abcdis_user}
spring.datasource.password=${DB_PASSWORD:AbcDis2024!}
```
par:
```properties
spring.datasource.url=${DB_URL_COMMISSION:jdbc:postgresql://localhost:5432/rh_commission}
spring.datasource.driver-class-name=org.postgresql.Driver
spring.datasource.username=${DB_USERNAME:postgres}
spring.datasource.password=${DB_PASSWORD:postgres}
```

Et remplacer:
```properties
spring.jpa.database-platform=org.hibernate.dialect.SQLServerDialect
```
par:
```properties
spring.jpa.database-platform=org.hibernate.dialect.PostgreSQLDialect
```

- [ ] **Step 3: Builder et lancer le service contre Neon (crée les tables vides)**

```bash
cd backend-microservices
mvn -pl service-commission -am clean package -DskipTests
```
Attendu: `BUILD SUCCESS`.

```bash
DB_URL_COMMISSION="jdbc:postgresql://<host>/rh-commission?sslmode=require" \
DB_USERNAME="<user>" \
DB_PASSWORD="<password>" \
java -jar service-commission/target/*.jar
```
Attendu: `Tomcat started on port 8083` sans exception.

```bash
curl -s http://localhost:8083/api/contraintes
```
Attendu: `[]` (HHTP 200 — la table `contraintes` a été créée vide par Hibernate).

Arrêter le service (Ctrl+C).

- [ ] **Step 4: Réécrire le script de seed en syntaxe PostgreSQL**

Ouvrir `backend-microservices/scripts/init-data-commission.sql`. Remplacer l'en-tête T-SQL:
```sql
USE rh_commission;
GO
```
par (rien — la base cible est déjà celle de la chaîne de connexion utilisée pour exécuter le script, pas besoin de `USE`).

Remplacer chaque occurrence de `GETDATE()` par `NOW()`.

Supprimer chaque ligne `GO` (séparateur de batch T-SQL, n'existe pas en Postgres) qui suit les blocs `INSERT`.

Exemple de transformation (le fichier contient une trentaine de blocs similaires, appliquer le même remplacement partout):

Avant:
```sql
IF NOT EXISTS (SELECT 1 FROM contraintes WHERE nom = 'Dist. Coke CDI Livreur')
INSERT INTO contraintes (nom, carte, valeur, condition, type_valeur, actif, date_creation, date_modification)
VALUES ('Dist. Coke CDI Livreur', 'Coca Cola', 0.18, 'role == ''Livreur'' AND contrat == ''CDI''', 'PAR_UNITE', 1, GETDATE(), GETDATE());
```

Après:
```sql
INSERT INTO contraintes (nom, carte, valeur, condition, type_valeur, actif, date_creation, date_modification)
SELECT 'Dist. Coke CDI Livreur', 'Coca Cola', 0.18, 'role == ''Livreur'' AND contrat == ''CDI''', 'PAR_UNITE', true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM contraintes WHERE nom = 'Dist. Coke CDI Livreur');
```

(Le pattern `IF NOT EXISTS ... INSERT` de T-SQL devient `INSERT ... SELECT ... WHERE NOT EXISTS` en Postgres — même effet idempotent. `1`/`0` pour les booléens deviennent `true`/`false`.)

Appliquer cette même transformation à tous les blocs `IF NOT EXISTS (...) INSERT INTO contraintes ...` du fichier.

- [ ] **Step 5: Exécuter le script de seed contre Neon**

Dans le dashboard Neon, projet `rh-commission`, onglet "SQL Editor": coller le contenu complet de `backend-microservices/scripts/init-data-commission.sql` réécrit et exécuter.

Attendu: aucune erreur de syntaxe, message de succès.

- [ ] **Step 6: Vérifier les données de seed**

```bash
DB_URL_COMMISSION="jdbc:postgresql://<host>/rh-commission?sslmode=require" \
DB_USERNAME="<user>" \
DB_PASSWORD="<password>" \
java -jar service-commission/target/*.jar
```
```bash
curl -s http://localhost:8083/api/contraintes | head -c 300
```
Attendu: un tableau JSON non vide contenant les contraintes insérées (ex: `"nom":"Dist. Coke CDI Livreur"`).

Arrêter le service (Ctrl+C).

- [ ] **Step 7: Commit**

```bash
git add backend-microservices/service-commission/pom.xml backend-microservices/service-commission/src/main/resources/application.properties backend-microservices/scripts/init-data-commission.sql
git commit -m "feat(service-commission): migrate datasource to PostgreSQL, rewrite seed script"
```

---

### Task 5: Migrer service-presence vers PostgreSQL

**Files:**
- Modify: `backend-microservices/service-presence/pom.xml:41-46`
- Modify: `backend-microservices/service-presence/src/main/resources/application.properties`

**Interfaces:**
- Consumes: `NEON_PRESENCE` connection string de la Task 1
- Produces: service-presence bootable en local contre Postgres, endpoint `GET /api/fiches-presence` fonctionnel

- [ ] **Step 1: Remplacer le driver JDBC dans le pom.xml**

Dans `backend-microservices/service-presence/pom.xml`, remplacer (lignes 41-46):
```xml
        <!-- Pilote JDBC SQL Server -->
        <dependency>
            <groupId>com.microsoft.sqlserver</groupId>
            <artifactId>mssql-jdbc</artifactId>
            <scope>runtime</scope>
        </dependency>
```
par:
```xml
        <!-- Pilote JDBC PostgreSQL -->
        <dependency>
            <groupId>org.postgresql</groupId>
            <artifactId>postgresql</artifactId>
            <scope>runtime</scope>
        </dependency>
```

- [ ] **Step 2: Mettre à jour application.properties**

Dans `backend-microservices/service-presence/src/main/resources/application.properties`, remplacer:
```properties
spring.datasource.url=${DB_URL_PRESENCE:jdbc:sqlserver://localhost\\SQLEXPRESS;databaseName=rh_presence;trustServerCertificate=true;encrypt=false}
spring.datasource.driver-class-name=com.microsoft.sqlserver.jdbc.SQLServerDriver
spring.datasource.username=${DB_USERNAME:abcdis_user}
spring.datasource.password=${DB_PASSWORD:AbcDis2024!}
```
par:
```properties
spring.datasource.url=${DB_URL_PRESENCE:jdbc:postgresql://localhost:5432/rh_presence}
spring.datasource.driver-class-name=org.postgresql.Driver
spring.datasource.username=${DB_USERNAME:postgres}
spring.datasource.password=${DB_PASSWORD:postgres}
```

Et remplacer:
```properties
spring.jpa.database-platform=org.hibernate.dialect.SQLServerDialect
```
par:
```properties
spring.jpa.database-platform=org.hibernate.dialect.PostgreSQLDialect
```

- [ ] **Step 3: Builder et lancer le service contre Neon**

```bash
cd backend-microservices
mvn -pl service-presence -am clean package -DskipTests
```
Attendu: `BUILD SUCCESS`.

```bash
DB_URL_PRESENCE="jdbc:postgresql://<host>/rh-presence?sslmode=require" \
DB_USERNAME="<user>" \
DB_PASSWORD="<password>" \
java -jar service-presence/target/*.jar
```
Attendu: `Tomcat started on port 8084` sans exception.

- [ ] **Step 4: Vérifier via curl**

```bash
curl -s http://localhost:8084/api/fiches-presence
```
Attendu: `[]` (HTTP 200).

Arrêter le service (Ctrl+C).

- [ ] **Step 5: Commit**

```bash
git add backend-microservices/service-presence/pom.xml backend-microservices/service-presence/src/main/resources/application.properties
git commit -m "feat(service-presence): migrate datasource from SQL Server to PostgreSQL"
```

---

### Task 6: Script Postgres local pour docker-compose

**Files:**
- Create: `backend-microservices/scripts/init-local-postgres-dbs.sh`

**Interfaces:**
- Consumes: rien
- Produces: script monté dans le conteneur Postgres du docker-compose (Task 12) pour créer automatiquement les 4 bases (`rh_auth`, `rh_personnel`, `rh_commission`, `rh_presence`) au premier démarrage

- [ ] **Step 1: Écrire le script**

Créer `backend-microservices/scripts/init-local-postgres-dbs.sh`:
```bash
#!/bin/bash
set -e

for DB in rh_auth rh_personnel rh_commission rh_presence; do
  psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" <<-EOSQL
    CREATE DATABASE $DB;
EOSQL
done
```

- [ ] **Step 2: Rendre le script exécutable**

```bash
chmod +x backend-microservices/scripts/init-local-postgres-dbs.sh
```

- [ ] **Step 3: Vérifier la syntaxe bash**

```bash
bash -n backend-microservices/scripts/init-local-postgres-dbs.sh
```
Attendu: aucune sortie (pas d'erreur de syntaxe). La vérification fonctionnelle complète se fait en Task 12 (le script tourne réellement au premier `docker-compose up`).

- [ ] **Step 4: Commit**

```bash
git add backend-microservices/scripts/init-local-postgres-dbs.sh
git commit -m "chore: add local Postgres multi-db init script for docker-compose"
```

---

### Task 7: Dockerfile service-auth

**Files:**
- Create: `backend-microservices/service-auth/Dockerfile`

**Interfaces:**
- Consumes: contexte de build = `backend-microservices/` (le Dockerfile référence les autres modules du reactor Maven)
- Produces: image Docker `rh-service-auth`, écoute sur le port 8081, consommée par la Task 12 (docker-compose)

- [ ] **Step 1: Écrire le Dockerfile**

Créer `backend-microservices/service-auth/Dockerfile`:
```dockerfile
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /workspace
COPY . .
RUN mvn -pl service-auth -am clean package -DskipTests

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=build /workspace/service-auth/target/*.jar app.jar
EXPOSE 8081
ENTRYPOINT ["sh", "-c", "java -Xmx350m -jar app.jar"]
```

- [ ] **Step 2: Builder l'image**

Depuis la racine du repo:
```bash
docker build -f backend-microservices/service-auth/Dockerfile -t rh-service-auth backend-microservices/
```
Attendu: `BUILD SUCCESS` (étape Maven) puis image construite sans erreur.

- [ ] **Step 3: Lancer le conteneur et vérifier**

```bash
docker run --rm -p 8081:8081 \
  -e DB_URL_AUTH="jdbc:postgresql://<host>/rh-auth?sslmode=require" \
  -e DB_USERNAME="<user>" \
  -e DB_PASSWORD="<password>" \
  rh-service-auth
```
Dans un autre terminal:
```bash
curl -s http://localhost:8081/api/users
```
Attendu: `[]` (HTTP 200).

Arrêter le conteneur (Ctrl+C).

- [ ] **Step 4: Commit**

```bash
git add backend-microservices/service-auth/Dockerfile
git commit -m "feat(service-auth): add Dockerfile"
```

---

### Task 8: Dockerfile service-personnel

**Files:**
- Create: `backend-microservices/service-personnel/Dockerfile`

**Interfaces:**
- Consumes: contexte de build = `backend-microservices/`
- Produces: image Docker `rh-service-personnel`, écoute sur le port 8082

- [ ] **Step 1: Écrire le Dockerfile**

Créer `backend-microservices/service-personnel/Dockerfile`:
```dockerfile
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /workspace
COPY . .
RUN mvn -pl service-personnel -am clean package -DskipTests

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=build /workspace/service-personnel/target/*.jar app.jar
EXPOSE 8082
ENTRYPOINT ["sh", "-c", "java -Xmx350m -jar app.jar"]
```

- [ ] **Step 2: Builder l'image**

```bash
docker build -f backend-microservices/service-personnel/Dockerfile -t rh-service-personnel backend-microservices/
```
Attendu: build réussi.

- [ ] **Step 3: Lancer le conteneur et vérifier**

```bash
docker run --rm -p 8082:8082 \
  -e DB_URL_PERSONNEL="jdbc:postgresql://<host>/rh-personnel?sslmode=require" \
  -e DB_USERNAME="<user>" \
  -e DB_PASSWORD="<password>" \
  rh-service-personnel
```
```bash
curl -s http://localhost:8082/api/personnel
```
Attendu: `[]` (HTTP 200).

Arrêter le conteneur (Ctrl+C).

- [ ] **Step 4: Commit**

```bash
git add backend-microservices/service-personnel/Dockerfile
git commit -m "feat(service-personnel): add Dockerfile"
```

---

### Task 9: Dockerfile service-commission

**Files:**
- Create: `backend-microservices/service-commission/Dockerfile`

**Interfaces:**
- Consumes: contexte de build = `backend-microservices/`
- Produces: image Docker `rh-service-commission`, écoute sur le port 8083

- [ ] **Step 1: Écrire le Dockerfile**

Créer `backend-microservices/service-commission/Dockerfile`:
```dockerfile
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /workspace
COPY . .
RUN mvn -pl service-commission -am clean package -DskipTests

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=build /workspace/service-commission/target/*.jar app.jar
EXPOSE 8083
ENTRYPOINT ["sh", "-c", "java -Xmx350m -jar app.jar"]
```

- [ ] **Step 2: Builder l'image**

```bash
docker build -f backend-microservices/service-commission/Dockerfile -t rh-service-commission backend-microservices/
```
Attendu: build réussi.

- [ ] **Step 3: Lancer le conteneur et vérifier**

```bash
docker run --rm -p 8083:8083 \
  -e DB_URL_COMMISSION="jdbc:postgresql://<host>/rh-commission?sslmode=require" \
  -e DB_USERNAME="<user>" \
  -e DB_PASSWORD="<password>" \
  rh-service-commission
```
```bash
curl -s http://localhost:8083/api/contraintes | head -c 200
```
Attendu: tableau JSON non vide (contraintes seedées en Task 4).

Arrêter le conteneur (Ctrl+C).

- [ ] **Step 4: Commit**

```bash
git add backend-microservices/service-commission/Dockerfile
git commit -m "feat(service-commission): add Dockerfile"
```

---

### Task 10: Dockerfile service-presence

**Files:**
- Create: `backend-microservices/service-presence/Dockerfile`

**Interfaces:**
- Consumes: contexte de build = `backend-microservices/`
- Produces: image Docker `rh-service-presence`, écoute sur le port 8084

- [ ] **Step 1: Écrire le Dockerfile**

Créer `backend-microservices/service-presence/Dockerfile`:
```dockerfile
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /workspace
COPY . .
RUN mvn -pl service-presence -am clean package -DskipTests

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=build /workspace/service-presence/target/*.jar app.jar
EXPOSE 8084
ENTRYPOINT ["sh", "-c", "java -Xmx350m -jar app.jar"]
```

- [ ] **Step 2: Builder l'image**

```bash
docker build -f backend-microservices/service-presence/Dockerfile -t rh-service-presence backend-microservices/
```
Attendu: build réussi.

- [ ] **Step 3: Lancer le conteneur et vérifier**

```bash
docker run --rm -p 8084:8084 \
  -e DB_URL_PRESENCE="jdbc:postgresql://<host>/rh-presence?sslmode=require" \
  -e DB_USERNAME="<user>" \
  -e DB_PASSWORD="<password>" \
  rh-service-presence
```
```bash
curl -s http://localhost:8084/api/fiches-presence
```
Attendu: `[]` (HTTP 200).

Arrêter le conteneur (Ctrl+C).

- [ ] **Step 4: Commit**

```bash
git add backend-microservices/service-presence/Dockerfile
git commit -m "feat(service-presence): add Dockerfile"
```

---

### Task 11: Dockerfile api-gateway

**Files:**
- Create: `backend-microservices/api-gateway/Dockerfile`

**Interfaces:**
- Consumes: contexte de build = `backend-microservices/`
- Produces: image Docker `rh-api-gateway`, écoute sur le port 8080, route vers les 4 services via `SERVICE_*_URL`

- [ ] **Step 1: Écrire le Dockerfile**

Créer `backend-microservices/api-gateway/Dockerfile`:
```dockerfile
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /workspace
COPY . .
RUN mvn -pl api-gateway -am clean package -DskipTests

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app
COPY --from=build /workspace/api-gateway/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["sh", "-c", "java -Xmx250m -jar app.jar"]
```

- [ ] **Step 2: Builder l'image**

```bash
docker build -f backend-microservices/api-gateway/Dockerfile -t rh-api-gateway backend-microservices/
```
Attendu: build réussi.

- [ ] **Step 3: Lancer le conteneur et vérifier (sans les autres services, juste le boot)**

```bash
docker run --rm -p 8080:8080 rh-api-gateway
```
```bash
curl -s http://localhost:8080/actuator/health
```
Attendu: `{"status":"UP"}`. Le test du proxy réel (routage vers les 4 services) se fait en Task 12.

Arrêter le conteneur (Ctrl+C).

- [ ] **Step 4: Commit**

```bash
git add backend-microservices/api-gateway/Dockerfile
git commit -m "feat(api-gateway): add Dockerfile"
```

---

### Task 12: docker-compose.yml — stack complète locale

**Files:**
- Create: `docker-compose.yml` (racine du repo)

**Interfaces:**
- Consumes: les 5 Dockerfiles (Tasks 7-11), le script `init-local-postgres-dbs.sh` (Task 6)
- Produces: stack locale complète (postgres + 5 services) lançable via `docker-compose up`, base pour la vérification finale de l'architecture avant déploiement cloud

- [ ] **Step 1: Écrire docker-compose.yml**

Créer `docker-compose.yml` à la racine du repo:
```yaml
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - ./backend-microservices/scripts/init-local-postgres-dbs.sh:/docker-entrypoint-initdb.d/init-local-postgres-dbs.sh
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5

  service-auth:
    build:
      context: ./backend-microservices
      dockerfile: service-auth/Dockerfile
    ports:
      - "8081:8081"
    environment:
      DB_URL_AUTH: jdbc:postgresql://postgres:5432/rh_auth
      DB_USERNAME: postgres
      DB_PASSWORD: postgres
      CORS_ORIGINS: http://localhost:5173
    depends_on:
      postgres:
        condition: service_healthy

  service-personnel:
    build:
      context: ./backend-microservices
      dockerfile: service-personnel/Dockerfile
    ports:
      - "8082:8082"
    environment:
      DB_URL_PERSONNEL: jdbc:postgresql://postgres:5432/rh_personnel
      DB_USERNAME: postgres
      DB_PASSWORD: postgres
    depends_on:
      postgres:
        condition: service_healthy

  service-commission:
    build:
      context: ./backend-microservices
      dockerfile: service-commission/Dockerfile
    ports:
      - "8083:8083"
    environment:
      DB_URL_COMMISSION: jdbc:postgresql://postgres:5432/rh_commission
      DB_USERNAME: postgres
      DB_PASSWORD: postgres
    depends_on:
      postgres:
        condition: service_healthy

  service-presence:
    build:
      context: ./backend-microservices
      dockerfile: service-presence/Dockerfile
    ports:
      - "8084:8084"
    environment:
      DB_URL_PRESENCE: jdbc:postgresql://postgres:5432/rh_presence
      DB_USERNAME: postgres
      DB_PASSWORD: postgres
    depends_on:
      postgres:
        condition: service_healthy

  api-gateway:
    build:
      context: ./backend-microservices
      dockerfile: api-gateway/Dockerfile
    ports:
      - "8080:8080"
    environment:
      SERVICE_AUTH_URL: http://service-auth:8081
      SERVICE_PERSONNEL_URL: http://service-personnel:8082
      SERVICE_COMMISSION_URL: http://service-commission:8083
      SERVICE_PRESENCE_URL: http://service-presence:8084
      CORS_ORIGINS: http://localhost:5173
    depends_on:
      - service-auth
      - service-personnel
      - service-commission
      - service-presence
```

- [ ] **Step 2: Lancer la stack complète**

Depuis la racine du repo:
```bash
docker-compose up --build
```
Attendu: les 5 services démarrent sans erreur, logs montrent `Tomcat started on port XXXX` pour chacun. Le conteneur `postgres` doit passer `healthy` avant que les autres démarrent (grâce à `depends_on: condition: service_healthy`).

- [ ] **Step 3: Vérifier le routage via le gateway**

Dans un autre terminal, une fois tout démarré:
```bash
curl -s http://localhost:8080/api/users
curl -s http://localhost:8080/api/personnel
curl -s http://localhost:8080/api/contraintes | head -c 200
curl -s http://localhost:8080/api/fiches-presence
```
Attendu: chaque appel retourne un JSON valide (HTTP 200) — confirme que le gateway route correctement vers les 4 services, qui eux-mêmes se connectent au Postgres local.

- [ ] **Step 4: Arrêter et nettoyer**

```bash
docker-compose down
```

- [ ] **Step 5: Commit**

```bash
git add docker-compose.yml
git commit -m "feat: add docker-compose stack for local development"
```

---

### Task 13: Générer les secrets de production

**Files:** aucun fichier repo — génération et documentation manuelle.

**Interfaces:**
- Produces: valeur du secret JWT de production, à réutiliser identique dans les 3 services qui en ont besoin (`service-auth`, `service-commission`, `service-presence`) lors du déploiement Render (Task 14) — un JWT signé par un service doit être validable par les autres, donc même secret partout.

- [ ] **Step 1: Générer un secret JWT fort**

```bash
openssl rand -base64 48
```
Attendu: une chaîne aléatoire d'environ 64 caractères. Exemple de sortie (à ne pas réutiliser telle quelle): `K7f3n2XyZ...`. Noter cette valeur en lieu sûr (gestionnaire de mots de passe partagé avec le binôme, pas dans un fichier committé).

- [ ] **Step 2: Vérifier la longueur minimale**

Le secret doit faire au moins 32 caractères (256 bits) pour l'algorithme JWT HS256 utilisé par le projet (voir `jwt.secret` dans les `application.properties`). `openssl rand -base64 48` produit ~64 caractères, largement suffisant.

- [ ] **Step 3: Documenter la procédure de rotation future**

Ce secret n'est jamais committé. S'il doit être changé plus tard (compromission, rotation périodique), régénérer avec la même commande et mettre à jour la variable d'environnement `JWT_SECRET` sur les 3 services Render concernés (Task 14) — tous les tokens émis avant la rotation deviennent invalides, ce qui déconnecte tous les utilisateurs (à faire hors heures de pointe).

*(Pas de commit pour cette tâche — aucun fichier repo n'est modifié.)*

---

### Task 14: Déployer les 5 services backend sur Render

**Files:** aucun fichier repo — configuration dans le dashboard Render.

**Interfaces:**
- Consumes: images Docker des Tasks 7-11, chaînes de connexion Neon (Task 1), secret JWT (Task 13)
- Produces: 5 URLs publiques Render (une par service), utilisées comme `SERVICE_*_URL` du gateway et comme cible `VITE_API_BASE_URL` du frontend (Task 15)

- [ ] **Step 1: Créer un compte Render**

Aller sur https://render.com, s'inscrire (GitHub, aucune carte bancaire demandée pour le tier gratuit).

- [ ] **Step 2: Pousser les changements sur GitHub**

Render déploie depuis un repo GitHub. Vérifier que toutes les branches/commits des Tasks 1-13 sont poussés:
```bash
git push origin DevBek
```

- [ ] **Step 3: Créer le service service-auth**

Dashboard Render → "New" → "Web Service" → connecter le repo `RH-Commission`, branche `DevBek`.
- Runtime: Docker
- Dockerfile Path: `backend-microservices/service-auth/Dockerfile`
- Docker Build Context Directory: `backend-microservices`
- Plan: Free
- Variables d'environnement:
  - `DB_URL_AUTH` = `jdbc:postgresql://<host neon rh-auth>/rh-auth?sslmode=require`
  - `DB_USERNAME` = `<user neon rh-auth>`
  - `DB_PASSWORD` = `<password neon rh-auth>`
  - `JWT_SECRET` = `<secret généré en Task 13>`
  - `CORS_ORIGINS` = `https://<url-vercel-a-venir>` (mettre une valeur temporaire `http://localhost:5173`, à corriger après la Task 15)

Cliquer "Create Web Service". Attendre la fin du build (10-15 min, build Maven inclus).

- [ ] **Step 4: Répéter pour service-personnel, service-commission, service-presence**

Même procédure, avec:
- `service-personnel`: Dockerfile Path `backend-microservices/service-personnel/Dockerfile`, variables `DB_URL_PERSONNEL`, `DB_USERNAME`, `DB_PASSWORD`
- `service-commission`: Dockerfile Path `backend-microservices/service-commission/Dockerfile`, variables `DB_URL_COMMISSION`, `DB_USERNAME`, `DB_PASSWORD`, `JWT_SECRET` (même valeur que service-auth)
- `service-presence`: Dockerfile Path `backend-microservices/service-presence/Dockerfile`, variables `DB_URL_PRESENCE`, `DB_USERNAME`, `DB_PASSWORD`, `JWT_SECRET` (même valeur que service-auth)

- [ ] **Step 5: Noter les 4 URLs publiques**

Une fois les 4 déploiements terminés, Render affiche une URL par service (ex: `https://rh-service-auth.onrender.com`). Noter les 4 URLs.

- [ ] **Step 6: Vérifier chaque service individuellement**

```bash
curl -s https://<url-service-auth>.onrender.com/api/users
curl -s https://<url-service-personnel>.onrender.com/api/personnel
curl -s https://<url-service-commission>.onrender.com/api/contraintes | head -c 200
curl -s https://<url-service-presence>.onrender.com/api/fiches-presence
```
Attendu: chaque appel répond en JSON (HTTP 200), avec un délai possible de 30-60s si le service était en veille (premier appel après inactivité).

- [ ] **Step 7: Créer le service api-gateway**

Dashboard Render → "New" → "Web Service" → même repo, branche `DevBek`.
- Runtime: Docker
- Dockerfile Path: `backend-microservices/api-gateway/Dockerfile`
- Docker Build Context Directory: `backend-microservices`
- Plan: Free
- Variables d'environnement:
  - `SERVICE_AUTH_URL` = `https://<url-service-auth>.onrender.com`
  - `SERVICE_PERSONNEL_URL` = `https://<url-service-personnel>.onrender.com`
  - `SERVICE_COMMISSION_URL` = `https://<url-service-commission>.onrender.com`
  - `SERVICE_PRESENCE_URL` = `https://<url-service-presence>.onrender.com`
  - `PROXY_READ_TIMEOUT_MS` = `60000` (au lieu du défaut 15000, pour tolérer le réveil à froid des services en amont)
  - `CORS_ORIGINS` = `http://localhost:5173` (valeur temporaire, à corriger après la Task 15)

Cliquer "Create Web Service". Noter l'URL publique du gateway (ex: `https://rh-api-gateway.onrender.com`).

- [ ] **Step 8: Vérifier le routage via le gateway public**

```bash
curl -s https://<url-gateway>.onrender.com/api/users
curl -s https://<url-gateway>.onrender.com/api/personnel
curl -s https://<url-gateway>.onrender.com/api/contraintes | head -c 200
curl -s https://<url-gateway>.onrender.com/api/fiches-presence
```
Attendu: chaque appel répond en JSON (HTTP 200) via le gateway public.

*(Pas de commit — configuration faite entièrement dans le dashboard Render.)*

---

### Task 15: Déployer le frontend sur Vercel

**Files:**
- Modify: `frontend/.env`

**Interfaces:**
- Consumes: URL publique du gateway (Task 14, Step 7)
- Produces: URL publique du frontend, utilisée pour finaliser `CORS_ORIGINS` sur les 5 services Render (Step 4 ci-dessous)

- [ ] **Step 1: Mettre à jour la config locale de référence**

Dans `frontend/.env`, remplacer:
```
VITE_API_BASE_URL=http://localhost:8080/api
```
par un commentaire documentant que la valeur de prod est injectée par Vercel (le fichier `.env` local sert au dev local uniquement, inchangé):
```
# Dev local uniquement — en production, VITE_API_BASE_URL est défini dans les variables d'environnement Vercel
VITE_API_BASE_URL=http://localhost:8080/api
```

- [ ] **Step 2: Créer un compte Vercel et importer le projet**

Aller sur https://vercel.com, s'inscrire (GitHub, aucune carte bancaire demandée). "Add New" → "Project" → sélectionner le repo `RH-Commission`, branche `DevBek`.
- Root Directory: `frontend`
- Framework Preset: Vite
- Build Command: `npm run build`
- Output Directory: `dist`
- Variable d'environnement: `VITE_API_BASE_URL` = `https://<url-gateway>.onrender.com/api` (URL notée en Task 14, Step 7)

Cliquer "Deploy". Attendre la fin du build.

- [ ] **Step 3: Noter l'URL publique**

Vercel affiche une URL (ex: `https://rh-commission.vercel.app`). Noter cette URL.

- [ ] **Step 4: Mettre à jour CORS_ORIGINS sur les 5 services Render**

Retourner dans le dashboard Render, pour chacun des 5 services (gateway + 4), mettre à jour la variable `CORS_ORIGINS` avec l'URL Vercel réelle:
```
CORS_ORIGINS=https://rh-commission.vercel.app
```
Sauvegarder — chaque service redémarre automatiquement.

- [ ] **Step 5: Vérifier dans le navigateur**

Ouvrir `https://<url-vercel>` dans un navigateur. Attendu: la page de login s'affiche sans erreur CORS dans la console (F12 → Console).

- [ ] **Step 6: Commit**

```bash
git add frontend/.env
git commit -m "docs(frontend): clarify VITE_API_BASE_URL is prod-overridden via Vercel env vars"
```

---

### Task 16: Test bout-en-bout sur l'URL publique

**Files:** aucun fichier repo — vérification manuelle dans le navigateur.

**Interfaces:**
- Consumes: URL Vercel (Task 15), stack Render entièrement déployée (Task 14)
- Produces: confirmation que l'application est utilisable de bout en bout par un utilisateur réel

- [ ] **Step 1: Se connecter**

Ouvrir `https://<url-vercel>`, se connecter avec un compte existant (voir `service-auth` pour les comptes seedés, ou créer un utilisateur via `POST /api/users` si aucun compte n'existe).
Attendu: redirection vers le dashboard, pas d'erreur réseau dans la console navigateur (F12).

- [ ] **Step 2: Tester le module Personnel**

Naviguer vers la page Personnel, ajouter un employé de test via le formulaire.
Attendu: l'employé apparaît dans la liste après ajout, sans erreur.

- [ ] **Step 3: Tester le module Commission**

Naviguer vers la page Calcul/Contraintes, lancer un calcul de commission pour l'employé de test créé au Step 2.
Attendu: un résultat de calcul s'affiche, cohérent avec les contraintes seedées en Task 4.

- [ ] **Step 4: Tester le module Présence**

Naviguer vers la page Présence, ajouter une fiche de présence de test.
Attendu: la fiche apparaît dans la liste après ajout.

- [ ] **Step 5: Vérifier la persistance**

Rafraîchir la page (F5) après chaque test ci-dessus.
Attendu: les données créées (employé, calcul, fiche) sont toujours présentes après rafraîchissement — confirme qu'elles sont bien persistées dans Neon, pas seulement en mémoire côté frontend.

*(Pas de commit — validation manuelle uniquement.)*

---

### Task 17: Documenter l'infrastructure finale

**Files:**
- Modify: `docs/ai-memory/CONTEXT.md`
- Create: `docs/DEPLOYMENT.md`

**Interfaces:**
- Consumes: toutes les URLs et décisions des Tasks 1-16
- Produces: documentation à jour pour le binôme et l'entreprise (dernière étape du "rendu" du projet)

- [ ] **Step 1: Écrire le runbook de déploiement**

Créer `docs/DEPLOYMENT.md`:
```markdown
# Déploiement — RH-Commission

## Infrastructure

- **Base de données**: 4 projets PostgreSQL sur [Neon](https://neon.tech) (gratuit) — `rh-auth`, `rh-personnel`, `rh-commission`, `rh-presence`
- **Backend**: 5 services Docker sur [Render](https://render.com) (gratuit) — api-gateway + service-auth + service-personnel + service-commission + service-presence
- **Frontend**: [Vercel](https://vercel.com) (gratuit), build statique depuis `frontend/`

## Redéployer après un changement de code

Render et Vercel redéploient automatiquement à chaque push sur la branche `DevBek`. Aucune action manuelle nécessaire pour un changement de code applicatif.

## Changer un secret (DB password, JWT secret)

1. Générer la nouvelle valeur (`openssl rand -base64 48` pour un secret JWT)
2. Dashboard Render → service concerné → Environment → mettre à jour la variable
3. Le service redémarre automatiquement avec la nouvelle valeur
4. Pour `JWT_SECRET`: mettre à jour sur les 3 services qui le partagent (service-auth, service-commission, service-presence) — tous les utilisateurs sont déconnectés après ce changement

## Limite connue: mise en veille (cold start)

Les services Render gratuits se mettent en veille après 15 min sans trafic. Le réveil prend 30-60s. Le timeout du proxy gateway est réglé à 60s (`PROXY_READ_TIMEOUT_MS`) pour tolérer ce délai. Si l'attente au premier chargement gêne une démonstration, effectuer un premier appel (`curl <url-gateway>/actuator/health`) quelques minutes avant.

## Développement local

```bash
docker-compose up --build
```
Lance la stack complète (Postgres local + 5 services) sur les mêmes ports qu'en développement historique (8080-8084). Le frontend reste lancé séparément:
```bash
cd frontend && npm run dev
```
```

- [ ] **Step 2: Mettre à jour docs/ai-memory/CONTEXT.md**

Ouvrir `docs/ai-memory/CONTEXT.md`. Remplacer la section "## ⚠️ Point d'attention connu" et la section base de données pour refléter la nouvelle infrastructure (Postgres/Neon au lieu de SQL Server local, déploiement Render/Vercel au lieu de local uniquement). Ajouter un renvoi vers `docs/DEPLOYMENT.md` pour la procédure opérationnelle complète.

- [ ] **Step 3: Ajouter une entrée dans docs/ai-memory/LOG.md**

Ajouter en haut du fichier (date du jour):
```markdown
## 2026-07-25 (migration DB cloud terminée)

- Migration complète: SQL Server local → PostgreSQL Neon (4 projets), conteneurisation Docker des 5 services, déploiement Render (backend) + Vercel (frontend).
- Voir [docs/DEPLOYMENT.md](../DEPLOYMENT.md) pour la procédure opérationnelle.
- Ancien mot de passe SQL Server (`AbcDis2024!`) et ancien secret JWT obsolètes — nouveaux secrets générés en Task 13 du plan, jamais committés.
```

- [ ] **Step 4: Commit**

```bash
git add docs/DEPLOYMENT.md docs/ai-memory/CONTEXT.md docs/ai-memory/LOG.md
git commit -m "docs: document cloud deployment infrastructure and runbook"
```

---

## Self-Review Notes

- **Spec coverage**: topologie DB (Task 1-6), conteneurisation (Task 7-12), sécurité/secrets (Task 13), hébergement (Task 14-15), plan de migration dans l'ordre spécifié par le design (Tasks suivent l'ordre 1-9 du design), tests (Task 16), documentation (Task 17) — toutes les sections du design sont couvertes.
- **Placeholders**: les valeurs `<host>`, `<user>`, `<password>`, `<url-...>` dans les commandes sont des placeholders assumés — ils représentent des valeurs générées dynamiquement par des services externes (Neon, Render, Vercel) au moment de l'exécution, pas des inconnues du design. Chaque tâche précise où récupérer la vraie valeur.
- **Cohérence des types/noms**: noms de variables d'environnement (`DB_URL_AUTH`, `DB_URL_PERSONNEL`, `DB_URL_COMMISSION`, `DB_URL_PRESENCE`, `JWT_SECRET`, `SERVICE_*_URL`, `CORS_ORIGINS`, `PROXY_READ_TIMEOUT_MS`) vérifiés cohérents entre le code existant (`application.properties`, `application.yml`) et toutes les tâches du plan.
