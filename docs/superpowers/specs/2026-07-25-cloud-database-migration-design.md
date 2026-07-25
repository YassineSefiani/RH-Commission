# Design — Migration base de données cloud + déploiement complet

Date: 2026-07-25
Branche de référence: `DevBek`

## Contexte / problème

L'application ABC DIS (gestion RH, commissions, présence) tourne actuellement en local uniquement:
- Architecture microservices Spring Boot: `api-gateway` (8080) + `service-auth` (8081) + `service-personnel` (8082) + `service-commission` (8083) + `service-presence` (8084)
- Chaque service a sa propre base **SQL Server** (pattern database-per-service: `rh_auth`, `rh_personnel`, `rh_commission`, `rh_presence`), hébergées sur l'instance SQL Server Express locale du binôme (`SEFYASSINE\SQLEXPRESS`)
- Frontend React/Vite servi en local (`localhost:5173`)

Problèmes identifiés à l'exploration:
- La base de données n'existe que sur le poste d'un des deux développeurs — personne d'autre (binôme, entreprise) ne peut s'y connecter
- Mot de passe DB (`AbcDis2024!`) et secret JWT sont codés en dur en valeur par défaut dans les `application.properties` de chaque service, **committés en clair dans l'historique git**
- Connexion DB actuelle sans TLS (`encrypt=false`)
- Projet à rendre / finaliser: doit être utilisable par toute l'entreprise sans installation locale

## Objectif

Rendre l'application accessible par URL publique, sans installation, avec une base de données cloud sécurisée partagée par tous les utilisateurs (développeurs + entreprise), à coût nul.

## Contraintes

- **Budget: 0€**, pas de carte bancaire disponible pour l'hébergement
- Pas d'éligibilité confirmée à un programme étudiant (Azure for Students écarté sur cette base)
- Le pattern database-per-service (isolation par microservice) doit être conservé

## Approche retenue

Migration du moteur SQL Server vers **PostgreSQL hébergé sur Neon** (gratuit, permanent, sans CB), déploiement des 5 services backend en conteneurs Docker sur **Render** (tier gratuit), frontend sur **Vercel** (tier gratuit).

Alternative écartée: rester sur SQL Server + Azure SQL Database free offer. Écartée car cette offre exige une carte bancaire sans éligibilité "Azure for Students" (mail académique), ce qui viole la contrainte budget/CB de l'utilisateur.

## Architecture cible

```
Internet
  │
  ├── Frontend (Vercel, statique, gratuit)
  │
  └── api-gateway (Render, Docker) ──┬── service-auth (Render, Docker) ──── Neon PG "rh_auth"
                                      ├── service-personnel (Render, Docker) ── Neon PG "rh_personnel"
                                      ├── service-commission (Render, Docker) ─ Neon PG "rh_commission"
                                      └── service-presence (Render, Docker) ── Neon PG "rh_presence"
```

- 4 projets Neon séparés (pas une base partagée) pour préserver l'isolation actuelle par service. Le tier gratuit Neon autorise jusqu'à 100 projets, donc aucune contrainte de quota.
- TLS actif par défaut sur Neon (`sslmode=require`) — corrige le `encrypt=false` actuel.

## Migration SQL Server → PostgreSQL

Vérification effectuée: aucune requête SQL native spécifique à SQL Server dans les repositories Java (`nativeQuery=true`, `GETDATE()`, `TOP()`, etc. absents du code Java) — tout passe par Hibernate/Spring Data JPA. Le changement de moteur est donc mécanique, par service:

- `pom.xml`: remplacer la dépendance `mssql-jdbc` par `org.postgresql:postgresql`
- `application.properties`:
  - `spring.datasource.driver-class-name=org.postgresql.Driver`
  - `spring.jpa.database-platform=org.hibernate.dialect.PostgreSQLDialect`
  - URL au format `jdbc:postgresql://...` (déjà externalisée via `${DB_URL_*:...}`, pattern conservé)
  - `spring.jpa.hibernate.ddl-auto=update` conservé — Hibernate régénère le schéma pour Postgres automatiquement

**Travail manuel identifié**: [backend-microservices/scripts/init-data-commission.sql](../../../backend-microservices/scripts/init-data-commission.sql) est écrit en T-SQL (`GETDATE()`, `GO`, `USE rh_commission`) et doit être réécrit en syntaxe Postgres (`NOW()`, suppression des `GO`/`USE`, la base cible étant déjà celle de la chaîne de connexion Neon). [scripts/create-databases.sql](../../../backend-microservices/scripts/create-databases.sql) devient obsolète — Neon crée la base à la création du projet.

## Sécurité

- Nouveau mot de passe DB généré par Neon par projet — l'ancien (`AbcDis2024!`, actuellement dans git) devient inutilisable une fois qu'on ne se connecte plus à l'ancien SQL Server
- Nouveau secret JWT généré, jamais committé — uniquement en variable d'environnement Render
- Aucune valeur par défaut de secret réutilisée dans le code déployé; les defaults `${JWT_SECRET:...}` actuels dans le code servent uniquement de fallback dev local
- Note pour plus tard (hors scope immédiat): les anciens secrets restent visibles dans l'historique git. À traiter si le repo devient public (purge d'historique ou au minimum documentation du risque)

## Conteneurisation

- 1 `Dockerfile` par service (build multi-stage: étape Maven → jar, étape finale JRE léger)
- Flags mémoire JVM explicites (`-Xmx350m` env.) pour tenir dans la limite 512MB du tier gratuit Render
- `docker-compose.yml` à la racine du repo: lance les 5 services + un Postgres local en conteneur pour le développement offline (même moteur qu'en prod, pas de dépendance à SQL Server Express ni au réseau). En prod, mêmes images Docker, seules les variables d'environnement DB changent (Neon au lieu du Postgres local)

## Hébergement

- **Render** (gratuit, sans CB): 1 "Web Service" Docker par service backend (gateway + 4 services). Variables d'environnement par service: `DB_URL_*`, `DB_USERNAME`, `DB_PASSWORD`, `JWT_SECRET`, `CORS_ORIGINS`. Le gateway reçoit en plus `SERVICE_AUTH_URL`, `SERVICE_PERSONNEL_URL`, `SERVICE_COMMISSION_URL`, `SERVICE_PRESENCE_URL` pointant vers les URLs Render des 4 services.
- **Vercel** (gratuit, sans CB) pour le frontend: build `npm run build` depuis `frontend/`, variable d'environnement `VITE_API_BASE_URL` → URL Render du gateway.

### Gestion du cold start (limite connue du tier gratuit Render)

Render met un service en veille après 15 min sans trafic; le réveil prend 30-60s. Le proxy du gateway a actuellement un timeout de 15s ([application.yml](../../../backend-microservices/api-gateway/src/main/resources/application.yml)), plus court que le réveil — la première requête après veille échouerait telle quelle.

Mitigation:
- Relever `PROXY_READ_TIMEOUT_MS` à 60000 via variable d'environnement Render (déjà externalisé dans le code, aucun changement de code nécessaire)
- Optionnel: ping toutes les 10 min (cron-job.org, gratuit) sur `/actuator/health` de chaque service pour limiter les mises en veille pendant les périodes d'usage/démo

## Plan de migration (ordre d'exécution)

1. Créer 4 projets Neon (rh_auth, rh_personnel, rh_commission, rh_presence), récupérer les chaînes de connexion
2. Par service: basculer driver/dialecte Postgres, tester en local contre Neon (ou le Postgres du docker-compose)
3. Réécrire `init-data-commission.sql` en syntaxe Postgres
4. Écrire les Dockerfiles par service + `docker-compose.yml`, valider le tout en local
5. Générer un nouveau secret JWT + nouveaux mots de passe DB (ne jamais réutiliser les anciens)
6. Déployer les 5 services sur Render avec les variables d'environnement définies ci-dessus
7. Déployer le frontend sur Vercel
8. Test bout-en-bout via l'URL publique: login, CRUD personnel, calcul commission, présence
9. Mettre à jour `docs/ai-memory/CONTEXT.md` avec la nouvelle infrastructure (URLs, topologie DB, procédure de déploiement)

## Tests / vérification

- Après migration de chaque service: `mvn spring-boot:run` en local pointé sur son projet Neon, vérifier le boot, la création des tables (console Neon), et 2-3 appels CRUD via curl/Postman
- Après déploiement complet: parcours utilisateur réel dans le navigateur via l'URL Vercel — login, une action par module (personnel, commission, présence) — avant de considérer la tâche terminée

## Hors scope (explicitement exclu de ce design)

- Authentification/permissions (déjà en place via `service-auth` + JWT, pas de changement fonctionnel)
- Migration vers un hébergement payant (mentionné comme option future si l'entreprise finance, mais pas dans ce design)
- Purge de l'historique git des anciens secrets (noté comme risque, pas traité ici)
- Page "Prédiction IA" du spec initial (non implémentée, hors sujet de cette tâche)
