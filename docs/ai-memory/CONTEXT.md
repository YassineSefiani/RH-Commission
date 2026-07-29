# Contexte projet — RH-Commission

Repo binôme (Yassine Sefiani + "Bek"): gestion RH/ventes pour entreprise distribution (ABC DIS). Calcul salaires + commissions vendeurs/distributeurs/salariés, contraintes configurables, historique, présence, personnel.

## ⚠️ Branche de travail

Le repo a 5 branches: `main`, `DevSef`, `DevBek`, `Merge`, `maquette`. **`main` est obsolète / squelette de départ (5 commits, backend monolithe H2 basique).** Le vrai projet actif est sur **`DevBek`** (20+ commits, architecture microservices complète). Toujours vérifier qu'on est sur `DevBek` (ou la branche que l'utilisateur désigne) avant de travailler — ne pas se fier à `main`/défaut.

## Stack réelle (branche DevBek)

Architecture **microservices** Spring Boot, pas monolithe:

- `backend-microservices/api-gateway` — reverse proxy, port **8080**. Route vers les 4 services via env vars (`SERVICE_AUTH_URL`, etc.)
- `backend-microservices/service-auth` — port **8081**, JWT
- `backend-microservices/service-personnel` — port **8082**
- `backend-microservices/service-commission` — port **8083**
- `backend-microservices/service-presence` — port **8084**
- `backend/` (ancien monolithe H2) — **résiduel de `main`, plus utilisé sur DevBek**, à ignorer/nettoyer

**Pattern database-per-service**: chaque microservice a sa PROPRE base — **migré de SQL Server vers PostgreSQL/Neon le 2026-07-25/29** (voir section migration ci-dessous). Ne plus utiliser SQL Server, c'est de l'historique.

Frontend: React/Vite/TS inchangé, pointe vers l'api-gateway (`VITE_API_BASE_URL` dans `frontend/.env`, `http://localhost:8080/api` en local).

## ☁️ Migration cloud DB (2026-07-25 → en cours)

Design + plan: [docs/superpowers/specs/2026-07-25-cloud-database-migration-design.md](../superpowers/specs/2026-07-25-cloud-database-migration-design.md), [docs/superpowers/plans/2026-07-25-cloud-database-migration.md](../superpowers/plans/2026-07-25-cloud-database-migration.md).

**Fait (Tasks 1-13/17)**:
- 4 bases migrées SQL Server → **PostgreSQL**, chacune sur son propre **projet Neon** (toujours database-per-service, juste un autre moteur). Driver épinglé `42.7.8` dans chaque `pom.xml` (contourne un souci TLS local avec la version gérée par le BOM Spring Boot, corrige aussi CVE-2024-1597).
- Anciens secrets (`AbcDis2024!`, JWT hardcodé) rendus obsolètes — nouveau secret JWT généré (`openssl rand -base64 48`), stocké uniquement en local gitignoré (`backend-microservices/.env.prod-secrets.local`) et à mettre en variable d'env Render.
- 5 Dockerfiles créés (un par service + gateway), entrypoint exec-form, `.dockerignore` à la racine de `backend-microservices/`.
- `docker-compose.yml` à la racine du repo: lance toute la stack en local (postgres jetable + 5 services). Testé OK par l'utilisateur.
- `docker-compose.override.yml` (gitignored, non committé): permet de pointer les 4 services sur les vraies bases Neon au lieu du postgres local, pour tester avec des données réelles/fictives via l'UI sans toucher au compose principal.
- Connection strings Neon réelles: `backend-microservices/.env.neon.local` (gitignored) — 4 lignes `NEON_AUTH`/`NEON_PERSONNEL`/`NEON_COMMISSION`/`NEON_PRESENCE`, format `postgresql://user:pass@host/neondb?sslmode=require&channel_binding=require`.
- Bug CRLF corrigé (`.gitattributes`, `*.sh text eol=lf`): `init-local-postgres-dbs.sh` cassait le conteneur postgres local sous Windows (core.autocrlf → shebang invalide dans le conteneur Linux).
- Travail fait dans un worktree (`cloud-db-migration`), fusionné (fast-forward) dans `DevBek`, poussé sur origin.

**Bloquant (Task 14 — déploiement Render)**: Render exige une carte bancaire même sur le tier gratuit (vérif anti-abus, pas de charge réelle). Idem Koyeb (doc officielle, + limité à 1 service gratuit/organisation, il en faut 5). L'utilisateur n'a pas de carte disponible — recherche d'alternative en cours (GitHub Student Pack ? Cloudflare Tunnel en auto-hébergement ? carte d'un tiers ?). **Ne pas se fier à une recherche web disant "Render/Koyeb sans CB" sans revérifier** — la situation a changé vite entre le design initial (recherché "sans CB") et l'exécution (CB exigée en pratique).

**Pas encore fait**: Task 14 (Render), Task 15 (Vercel frontend), Task 16 (test bout-en-bout URL publique), Task 17 (doc finale déploiement — `docs/DEPLOYMENT.md` prévu).

## Commandes utiles (DevBek)

```bash
# Stack complète locale (postgres jetable + 5 services)
docker-compose up --build

# Idem mais connecté aux vraies bases Neon (nécessite docker-compose.override.yml, non committé)
docker-compose up --build

# Un service seul, sans Docker (contre Neon, env vars nécessaires - voir .env.neon.local)
cd backend-microservices && mvn -pl service-auth -am spring-boot:run

# Frontend
cd frontend && npm run dev
```
