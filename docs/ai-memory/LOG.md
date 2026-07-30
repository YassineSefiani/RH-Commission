# Journal de session — RH-Commission

Trace des requêtes traitées par Claude sur ce projet. Ajouter une entrée par session/tâche, la plus récente en haut. But: éviter de refaire un travail déjà fait, garder trace des décisions.

---

## 2026-07-30 (restriction rôle DISPATCHER + authentification JWT réelle)

- Découverte importante: **aucun service (sauf service-auth) ne validait le JWT** — service-personnel/commission/presence acceptaient tout appel sans vérification, et **le frontend n'envoyait le token sur aucun appel API** (juste stocké en localStorage après login, jamais attaché aux requêtes). Sécurité de l'appli reposait entièrement sur le frontend qui cachait des boutons, pas sur une vraie barrière serveur.
- Ajout d'un `JwtAuthFilter` (simple servlet filter, pas de Spring Security) à service-personnel/commission/presence, réutilisant le secret JWT déjà partagé (`JWT_SECRET`). `/actuator/**` reste public (health checks).
- service-commission applique en plus des règles de rôle: `/api/historique` → ADMIN/ADV/RH (pas DISPATCHER), `/api/contraintes` + `/api/calcul` → ADMIN/ADV (aligne le backend sur ce que le frontend cachait déjà sans jamais l'appliquer réellement).
- Frontend: nouveau helper `frontend/src/app/services/authHeaders.ts`, câblé dans les 4 fichiers API (`api.ts`, `personnelApi.ts`, `presenceApi.ts`, `auditApi.ts`) — plusieurs appels GET n'avaient même pas d'objet `headers` du tout.
- Rôle DISPATCHER restreint à son périmètre réel (fiches de présence uniquement): Dashboard remplacé par mini-stats présence, History retiré du menu, page Personnel masque type de contrat + téléphone.
- Testé de bout en bout via docker-compose + navigateur: ADMIN inchangé (dashboard financier complet, historique, personnel complet), DISPATCHER bien restreint, appels sans token → 401, DISPATCHER sur `/api/historique`/`/api/contraintes` → 403.
- 4 commits sur `DevBek` (2 hygiène .gitignore `frontend/dist/`, 1 backend JWT, 1 frontend headers, 1 frontend UI dispatcher) — **pas encore poussés sur origin**, à confirmer avec l'utilisateur.
- Toujours en pause sur Task 14 (déploiement Render, blocage carte bancaire) — voir entrée du 2026-07-29 ci-dessous.

## 2026-07-29 (migration cloud DB — en pause, bloqué sur hébergement)

- Design + plan écrits et exécutés via superpowers (subagent-driven-development): [design](../superpowers/specs/2026-07-25-cloud-database-migration-design.md), [plan](../superpowers/plans/2026-07-25-cloud-database-migration.md).
- **Tasks 1-13 du plan terminées et revues**: les 4 services (auth/personnel/commission/presence) migrés de SQL Server vers PostgreSQL/Neon (4 projets Neon séparés, pattern database-per-service conservé), 5 Dockerfiles créés (un par service + gateway, exec-form entrypoint, `.dockerignore`), `docker-compose.yml` pour la stack locale complète (postgres + 5 services, testé, tient large sous 512MB/service), secret JWT de prod généré.
- Travail fait dans un worktree (`cloud-db-migration`, branché sur `DevBek`), fusionné (fast-forward) et poussé sur `origin/DevBek`.
- **Bug CRLF corrigé** (commit `7d28385`): `init-local-postgres-dbs.sh` cassait le conteneur postgres local sous Windows (core.autocrlf → CRLF → shebang invalide dans le conteneur Linux, exit 126). Fix: `.gitattributes` (`*.sh text eol=lf`).
- Test local confirmé fonctionnel par l'utilisateur: `docker-compose up --build` + frontend `npm run dev`, login OK (compte seed `yassine.admin@abcdis.com` / `Admin1234!`).
- Ajouté `docker-compose.override.yml` (gitignored) pour pouvoir tester en local contre les vraies bases Neon (au lieu du postgres jetable local) avec des données fictives via l'UI, sans toucher au fichier compose principal.
- **BLOQUANT — Task 14 (déploiement Render)**: Render exige une carte bancaire même sur le tier gratuit (vérif anti-abus, $1 non facturé) — l'utilisateur n'a pas de carte. Koyeb pareil (doc officielle: pré-autorisation $29) + limité à 1 service gratuit/organisation (il en faut 5). Oracle/Fly.io/Railway ont la même contrainte. **Recherche initiale de cette conversation ("Render sans CB") était obsolète/incomplète** — vérifier les faits à nouveau si on relance cette piste, la situation évolue vite sur ce sujet.
- Options non tranchées pour débloquer: (a) GitHub Student Pack (éligibilité à vérifier, accepte parfois une preuve d'inscription sans mail .edu), (b) auto-hébergement via Cloudflare Tunnel (gratuit sans CB, mais PC doit rester allumé pour que l'appli soit joignable), (c) reconsidérer une carte si finalement disponible (binôme ou autre).
- Utilisateur fait des modifications de code de son côté avant de reprendre — **rebuild avec `docker-compose up --build` après toute modif avant de retester/redéployer**. Reprendre à Task 14 du plan une fois la question hébergement tranchée.

## 2026-07-25 (suite — correction branche)

- Utilisateur a stoppé le brainstorming initial: exploration précédente faite sur `main`, qui est la mauvaise branche (squelette obsolète, 5 commits).
- Vraie branche de travail: **DevBek** (20+ commits, architecture microservices: api-gateway + service-auth/personnel/commission/presence, chacun avec sa propre base **SQL Server** locale sur le poste du binôme `SEFYASSINE\SQLEXPRESS`).
- CONTEXT.md entièrement réécrit pour refléter cette architecture réelle.
- Trouvé: secrets (mot de passe DB, JWT secret) codés en dur en valeur par défaut dans les `application.properties`, committés en clair dans git — à traiter dans le design de migration cloud.
- Objectif confirmé avec l'utilisateur: déploiement complet (pas juste la DB) pour accès entreprise via URL. Design en cours (superpowers:brainstorming), pas encore de spec écrite — reprendre la conversation avant de recommencer les questions déjà posées (branche + scope déjà tranchés).

## 2026-07-25

- Clone initial du repo (`https://github.com/YassineSefiani/RH-Commission.git`) dans `C:\Projets\RH-Commission`.
- Exploration structure complète backend (Spring Boot/Java) + frontend (React/Vite/TS).
- Rédaction de [CONTEXT.md](CONTEXT.md): stack, structure, endpoints API, écarts spec/impl.
- **Trouvé**: mismatch port backend (8081) vs défaut frontend (8080) dans `api.ts` — pas encore corrigé, juste noté.
- **Trouvé**: page "Prédiction IA" prévue au spec, absente du code (pas de route, pas de fichier page).
- Création de ce dossier `docs/ai-memory/` + `CLAUDE.md` racine pour auto-chargement du contexte à chaque session.
