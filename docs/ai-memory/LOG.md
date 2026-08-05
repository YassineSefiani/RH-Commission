# Journal de session — RH-Commission

Trace des requêtes traitées par Claude sur ce projet. Ajouter une entrée par session/tâche, la plus récente en haut. But: éviter de refaire un travail déjà fait, garder trace des décisions.

---

## 2026-07-30 (suite — fix `c.actif` no-op dans BrandCalculationPage)

- Corrigé le bug flaggé plus tôt aujourd'hui (voir entrée ci-dessous "revue finale") : [BrandCalculationPage.tsx:119](../../frontend/src/app/pages/BrandCalculationPage.tsx#L119) testait `c.actif === false || c.actif === 0` alors que `Constraint` (`ConstraintsContext.tsx`) expose `active: boolean`, pas `actif` — filtre toujours no-op, contrainte désactivée par RH restait appliquée. Changé en `c.active === false`.
- Vérifié `.nom`/`.valeur`/`.typeValeur` restants dans le même fichier (lignes 255-258) : ce sont des fallbacks défensifs après le vrai champ (`constraint.name || constraint.nom`, etc.) — inoffensifs, pas touchés.
- Build (`npx vite build`) : succès. Vérifié en navigateur réel (ADMIN, `docker compose` déjà up) : contrainte "Retour Coke 1% à 2%" (règle Coca Cola, 150 MAD) désactivée via la page Contraintes → calcul Coca Cola Août 2026 pour Youssef Bennani passe de 526,40 MAD à 376,40 MAD (ligne "RETOUR COKE 1% À 2%" disparue, les 2 autres règles intactes) → contrainte réactivée après, état restauré.
- Créé `C:\Projets\.claude\launch.json` (`npm --prefix RH-Commission/frontend run dev`, port 5173) pour permettre au navigateur de preview de lancer le frontend directement — n'existait pas avant.
- Commit fait dans la session principale (1ae2439).

## 2026-07-30 (suite — historique des fichiers importés sur la page Calcul)

- Demande utilisateur : visibilité sur les fichiers Excel importés (nom du fichier, qui, quand) — choisi parmi 3 options proposées (aperçu avant import / table détaillée / historique des imports).
- Réutilise l'infra d'audit déjà existante (`logAudit`/`fetchAuditLog`, `/api/audit`, déjà utilisée pour `IMPORT_OBJECTIFS_SQL`/`IMPORT_EXCEL_SIMULATION` mais sans nom de fichier dans `details`) plutôt que d'ajouter un nouveau système.
- `CalculationPage.tsx` : les deux handlers d'import ajoutent maintenant le(s) nom(s) de fichier réel(s) dans `details` (`file.name` pour Objectifs, liste jointe pour Réal/Triage/Volumes). Nouveau panneau "Historique des fichiers importés" (10 dernières entrées, toutes périodes confondues, pas juste la période active) sous le panneau de statut — interroge `fetchAuditLog` filtré côté client sur les 2 actions d'import, trié par date décroissante.
- Endpoint `/api/audit` déjà accessible sans restriction de rôle côté backend (vérifié dans `AuditController.java`) — fonctionne donc pour ADV, pas seulement ADMIN (contrairement à la page `/audit` globale, réservée ADMIN côté nav).
- Build (`npx vite build`) : succès. Vérification live interrompue en cours de route : Docker Desktop s'est arrêté pendant le test (panneau navigateur vide, `docker ps` → "cannot connect to the Docker API"), hors de mon contrôle — code committé et build-vérifié, mais pas re-testé en navigateur après ce point. À reconfirmer visuellement au prochain lancement de `docker compose up -d`.

## 2026-07-30 (suite — revue finale + corrections du plan Calcul)

- Revue finale (whole-branch, modèle le plus capable) du plan complet (Tasks 1-5) : 1 finding **Critical** + 4 **Important**, tous corrigés directement (pas de subagent, corrections bien comprises) puis re-revus par un reviewer frais — verdict "Ready to merge: Yes".
  - **Critical** : `formatPeriodeToYYYYMM` (`CalculationPage.tsx`) renvoyait février pour quasiment n'importe quelle date réelle — le test `.includes('02')` cherchait dans la chaîne AVANT d'en retirer l'année, et toute année "202X" contient la sous-chaîne "02". Reproduit avec un script Node isolé (confirmé : "2026-08" → "2026-02"), corrigé en isolant le mois après retrait de l'année + repli sur un motif numérique à bornes de mot. Testé sur 13 cas (mois français, MM/YYYY, ISO déjà normalisé, entrée vide/garbage) — tous corrects.
  - **Important** ×4 : matcher flou de marque dupliqué 3× → extrait dans `utils/brandMatch.ts` ; liste d'années codée en dur (2024-2026, cassée dès 2027) → dynamique (année courante ±2) ; erreurs/avertissements de `BrandCalculationPage` invisibles (toast seul, aucun `<Toaster/>` monté) → bandeau inline ajouté en complément ; `parseExcelDate` interprétait JJ/MM/AAAA en MM/DD/YYYY (convention américaine) alors que l'entreprise est marocaine/française → corrigé en DD/MM/YYYY + validation ajoutée pour éviter qu'une date malformée fasse échouer tout un lot d'import.
  - Re-testé en direct après corrections (build propre, sélecteur d'année, panneau de statut, bandeau d'avertissement visible) sans régression sur le scénario Août 2026 déjà validé.
- **Découverte concurrente** : un `<Toaster/>` (sonner) a été monté dans `App.tsx` par une session séparément spawnée (déclenchée par une suggestion faite plus tôt dans cette session) — corrige le fait qu'aucun `toast.*` de toute l'application n'était visible auparavant. Vérifié en direct (`[data-sonner-toaster]` présent dans le DOM après rebuild), sans conflit avec les corrections ci-dessus.
- **Nouveau finding hors-scope confirmé, flaggé pour plus tard** : `BrandCalculationPage.tsx` filtre les contraintes actives via `c.actif` alors que le type réel `Constraint` expose `active` (pas `actif`) — la vérification est donc toujours no-op, une règle de commission désactivée par le RH continue d'être appliquée dans les calculs. Bug de correction financière réel, confirmé par analyse de type, pas encore corrigé (hors scope du plan, business logic explicitement préservée à l'identique).
- Plan `docs/superpowers/plans/2026-07-30-calcul-page-data-pipeline.md` terminé : 5 tâches + revue finale + corrections, toutes approuvées. Commits sur `DevBek`, pas encore poussés.

## 2026-07-30 (suite — Task 5 finale: vérification bout-en-bout page Calcul refondue)

- Clôture du plan en 5 tâches (`docs/superpowers/plans/2026-07-30-calcul-page-data-pipeline.md`) exécuté via subagent-driven-development. Task 1 (entité `Volume` backend), Task 2 (`importApi.ts`+utils), Task 3 (`CalculationPage.tsx`), Task 4 (`BrandCalculationPage.tsx`) toutes revues et approuvées (task-reviewer par tâche, build/compile reconfirmé indépendamment par le contrôleur après Task 3 et Task 4).
- **Vérification bout-en-bout réelle** (pas de fichiers Excel manipulables par le navigateur dans cet outil — données de test injectées directement via les mêmes endpoints `/api/import/*/batch` qu'un import Excel appellerait, pour 3 employés Coca Cola réels P001/P002/P003, période 2026-08) :
  - Panneau de statut affiche 3/3/3/3 pour Août 2026 immédiatement après import, badges produit corrects (Coca Cola: 3 objectifs/3 réalisations, Wall's/Ferrero: 0/0).
  - Calcul lancé pour Coca Cola/Août 2026 : résultats **exactement conformes au calcul manuel attendu** (Youssef Bennani 526,40 MAD = 176,40 commission + 150 + 200 bonus ; Sara El Idrissi 70,80 MAD ; Karim Moussaoui 94,20 MAD) — confirme que le pipeline utilise bien les vraies données persistées pour la bonne période, logique métier intacte.
  - **Persistance confirmée** : navigation fraîche vers `/calculation` (sélecteurs mois/année reviennent sur le mois courant par défaut, comme prévu) puis re-sélection d'Août 2026 → panneau de statut toujours à 3/3/3/3 (pas de dépendance à la session navigateur, exactement le bug d'origine corrigé).
  - Période sans donnée (Décembre 2026) : panneau à 0 partout, calcul renvoie des zéros (sauf une bonification pré-existante non liée à ce fix, cf. ci-dessous), sans planter.
  - Historique confirme les 2 lots ("Simulation 5 - Coca Cola" 691 MAD, "Simulation 6 - Coca Cola" 250 MAD) avec les montants exacts vus sur la page de calcul.
- **Trouvaille hors-scope, confirmée mais non corrigée ici** : aucun composant `<Toaster />` (sonner) n'est monté nulle part dans l'app (vérifié via `document.querySelector('[data-sonner-toaster]')` → `null`) — tous les `toast.success/error/warning` de toute l'application sont silencieusement invisibles depuis toujours. Flaggé en tâche séparée (spawn_task `task_5e82fe2c`), pas corrigé dans ce plan (hors scope, aucun rapport avec les 3 problèmes de la page Calcul).
- **Donnée de test résiduelle** : 3 objectifs/3 réalisations/3 triage/3 volumes pour période 2026-08 (matricules P001/P002/P003, Coca Cola) et 2 lots de simulation dans l'historique ("Simulation 5/6 - Coca Cola", non validés) laissés en base — période future, sans impact, supprimables via le bouton "Purger Simulations" existant (filtre produit=Coca Cola + mois=Août 2026) si l'utilisateur préfère un environnement propre.
- Commits sur `DevBek` (pas encore poussés, comme le reste de cette session) : Tasks 1-4 chacune sur son propre commit (+ un commit LOG.md par tâche), plan et spec committés séparément.

## 2026-07-30 (suite — Task 4 plan frontend: BrandCalculationPage calcul basé sur la BDD, plus localStorage)

- Exécution de la Task 4 (dernière du plan en 4 tâches) : `.git/sdd/task-4-brief.md`, rapport détaillé `.git/sdd/task-4-report.md`.
- Réécriture intégrale de `frontend/src/app/pages/BrandCalculationPage.tsx` (verbatim, confirmé par `diff` byte-identique avec le code du brief). Corrige les 2 derniers bugs "mauvaise période utilisée silencieusement" du plan : (1) la page lisait Réalisations/Triage/Volumes depuis `localStorage['simulation_metrics']`, jamais invalidé par période → réutilisation silencieuse de données obsolètes ; (2) Objectifs venait de `GET /import/objectifs` sans filtre période (toutes périodes mélangées), `.find()` prenait le premier matricule matché peu importe sa période. Remplacé par 4 appels `importApi.get*ByPeriode(periodeKey)` (Task 2) en parallèle (`Promise.allSettled`), `periodeKey`/`periodeLabel` reçus via `location.state` (envoyé par `CalculationPage.tsx`, Task 3), fallback sur le mois courant seulement si state absent. `addCalculation(...)` envoie désormais `periode: periodeKey` (période sélectionnée) au lieu de `currentPeriodStr` (date du jour). Logique métier de calcul (contraintes, `roleSegments`, évaluateur `new Function`) préservée strictement à l'identique (hors-scope du plan).
- Build (`npx vite build`) : succès, `✓ built in 13.06s`.
- Vérifié en navigateur réel (ADMIN puis ADV) : sélection d'un mois différent d'aujourd'hui (Mars 2026, sans données) → en-tête `BrandCalculationPage` affiche bien "période : Mars 2026" (pas un fallback silencieux sur juillet/aujourd'hui) ; clic "Lancer le calcul groupé" ne crashe pas, aucune nouvelle erreur console (celles présentes étaient déjà là avant, d'une navigation antérieure) ; les 4 appels réseau `/api/import/*/periode/2026-03` renvoient bien `[]` (aucune donnée), confirmant l'exécution de la branche "aucune donnée" du code ; confirmé via `GET /api/historique` brut que les nouveaux lots de simulation créés portent bien `"periode":"2026-03"` (pas `"2026-07"` comme les anciens enregistrements pré-Task-4) ; `localStorage` ne contient plus jamais `simulation_metrics`.
- **Trouvé en marge (pré-existant, pas introduit par cette tâche, pas corrigé — hors scope)** : aucun composant `<Toaster />` (sonner) n'est monté nulle part dans l'arbre de rendu (`App.tsx`/`Layout.tsx`/`main.tsx` vérifiés) — le fichier `frontend/src/app/components/ui/sonner.tsx` définit un wrapper mais n'est jamais importé. Résultat : **tous** les `toast.success/error/warning` de toute l'appli (11 fichiers) sont des no-op visuels silencieux, y compris le nouveau `toast.warning` "Aucune donnée importée pour…" de cette page. Le code déclenche bien l'appel (confirmé par la condition remplie), mais rien n'apparaît à l'écran. À corriger séparément (monter `<Toaster />` une fois près de la racine) — pas fait ici, hors scope du brief Task 4.
- Note en marge : le filtre mois/année de la page Historique (`HistoryPage.tsx`) filtre sur `h.date` (date de création) et non `h.periode` (période de la commission) — pré-existant, sans lien avec cette tâche, juste noté car ça a causé une fausse lecture pendant la vérification (contournée en lisant la réponse brute de l'API).
- Commit sur `DevBek` (pas encore poussé) : réécriture de `BrandCalculationPage.tsx` uniquement, message imposé par le brief (`aaee625`).
- **Plan à 4 tâches maintenant terminé** (Task 1 backend volumes, Task 2 importApi/utils, Task 3 CalculationPage, Task 4 BrandCalculationPage) — toutes mergées sur `DevBek`, pas encore poussées sur origin.

## 2026-07-30 (suite — Task 3 plan frontend: CalculationPage période dynamique + statut d'import BDD)

- Exécution de la Task 3 d'un plan d'implémentation en 4 tâches (Task 1 = endpoints backend `/api/import/volumes*`, Task 2 = `importApi.ts` + utils `periode.ts`/`excelDate.ts`, déjà mergées ; Task 4 = `BrandCalculationPage`, pas encore faite). Brief complet : `.git/sdd/task-3-brief.md`, rapport détaillé : `.git/sdd/task-3-report.md`.
- Réécriture intégrale de `frontend/src/app/pages/CalculationPage.tsx` : sélecteur mois/année dynamique (remplace l'ancienne liste statique de 4 chaînes) propagé en `periodeKey`/`periodeLabel` (utils Task 2) ; panneau "Statut d'import" qui interroge réellement la BDD via `importApi.get*ByPeriode` (remplace l'ancien état de session perdu au reload) ; les 2 handlers d'import Excel (Objectifs, et Réalisations/Triage/Volumes) taguent désormais chaque ligne avec une période normalisée `YYYY-MM` (`formatPeriodeToYYYYMM`) au lieu d'une chaîne brute/fixe qui faisait échouer silencieusement la validation backend ; cartes produit (Coca Cola/Wall's/Ferrero Rocher) affichent des compteurs réels (règles actives via `ConstraintsContext`, objectifs/réalisations via le panneau de statut) au lieu de chiffres factices codés en dur ; `handleBrandClick` propage `{ periode, periodeLabel }` en route state pour Task 4. Plus aucun usage de `localStorage` dans ce fichier.
- Incident mineur pendant la transcription : le premier `Write` a transformé l'échappement regex `̀-ͯ` (utilisé pour retirer les accents dans `getVal`) en caractères Unicode combinants littéraux dans le code source — fonctionnellement identique en JS, mais pas une copie verbatim. Diagnostiqué par inspection de code points (`node`), corrigé par un script réécrivant uniquement cette chaîne.
- Build (`npx vite build`) : succès, `✓ built in 13.16s`, aucune erreur.
- Vérifié en navigateur réel (login ADMIN rapide) : sélecteurs mois/année par défaut sur le mois/année courants (juillet/2026, cohérent avec la date du jour), panneau "Statut d'import" à 0 partout pour juillet 2026 (aucune donnée importée, comportement attendu), changement de mois → nouveaux appels réseau `/api/import/*/periode/2026-01` tous en 200 et libellés/compteurs mis à jour en conséquence, clic sur une carte produit → navigation propre vers `BrandCalculationPage` sans erreur. Import Excel de bout en bout (fichiers réels) explicitement hors scope de cette vérification, laissé à un testeur humain plus tard dans le plan.
- Commit sur `DevBek` (pas encore poussé) : réécriture de `CalculationPage.tsx` uniquement, message imposé par le brief.

## 2026-07-30 (suite — remplacement boutons "Purger {carte}" par filtre produit)

- Bug remonté par l'utilisateur : les boutons "Purger {carte}" (un par produit, ajoutés dans la session précédente) ne fonctionnaient pas en pratique — le "Purger Validés"/"Purger Simulations" global, lui, marchait. Plutôt que débogueur les boutons cassés, l'utilisateur a demandé de les enlever et d'ajouter un filtre produit à la page Historique pour que le bouton existant (qui marche déjà) s'applique au sous-ensemble filtré.
- Frontend (`HistoryPage.tsx`) : ajout d'un `<select>` "produit" (carte) dans la barre de filtres ; `unarchivedSimulationsGlobally`/`archivedCalculationsGlobally` remplacés par des variantes `*Filtered` dérivées de `filtered` (respectent recherche/mois/année/produit) ; le dialogue de confirmation "Purger Validés/Simulations" opère désormais sur ces ensembles filtrés et son texte mentionne le produit filtré. Suppression complète de l'UI par-carte cassée (`handlePurgerCarte`, `purgingKey`, boutons "Purger {carte}").
- Backend (service-commission) : suppression du endpoint mort `DELETE /api/historique/purge`, de `HistoriqueService.purgerValide()`, et de la règle RH-only correspondante dans `JwtAuthFilter`. `findByCarteAndMoisAndAnneeAndIsArchivedTrue` conservé (toujours utilisé par le check de conflit dans `archiverCalcul`). `HistoryContext.tsx` : `refreshHistory` retiré (plus rien ne l'appelle).
- Testé de bout en bout en navigateur réel (RH) : filtre "Coca Cola" → "Purger Validés" ne supprime que les 3 calculs Coca Cola filtrés, les 3 calculs validés "Wall's" restent intacts après réinitialisation du filtre. Ancien endpoint `/api/historique/purge` confirmé mort (ne répond plus en succès).
- Backend recompilé + conteneur `service-commission` reconstruit (`docker compose up -d --build service-commission`), frontend rebuild (`vite build`) — les deux passent sans erreur.

## 2026-07-30 (suite — un seul calcul validé par produit/mois + purge RH)

- Faille corrigée: rien n'empêchait de valider plusieurs simulations pour le même produit (carte) et mois — l'ADV pouvait valider "Coca Cola avril" plusieurs fois sans blocage.
- Backend (`HistoriqueService.archiverCalcul`): vérifie qu'aucun autre calcul (batchId différent) n'est déjà validé pour carte+mois+année avant d'autoriser une validation. Les lignes d'un même lot (plusieurs employés validés ensemble) passent toujours ensemble. Conflit → 409 avec message clair.
- Nouvel endpoint RH uniquement: `DELETE /api/historique/purge?carte&mois&annee` — supprime définitivement les calculs validés de ce produit/mois pour débloquer une nouvelle validation après une erreur. Restreint via JwtAuthFilter (même pattern que DISPATCHER pour les fiches présence).
- Frontend: message d'erreur réel remonté (pas juste "erreur"), rollback de l'état optimiste manquant sur les 2 handlers de validation par lot (corrigé), bouton "Purger {carte}" visible RH uniquement sur la page Historique.
- Testé de bout en bout (API + navigateur réel): validation → conflit 409 → purge RH → re-validation possible. Confirmé.

## 2026-07-30 (suite — restriction fiche présence + notification ADV)

- Restriction ajoutée: modifier/supprimer une fiche de présence (page Presence) réservé au rôle DISPATCHER, frontend + backend (`service-presence` JwtAuthFilter: PUT/DELETE sur `/api/fiches-presence` → 403 pour tout rôle ≠ DISPATCHER).
- Nouvelle fonctionnalité: notification ADV quand le dispatcher modifie une fiche de présence liée à une période/employé déjà calculé. Granularité choisie: période (mois/année) + matricule, pas de lien exact fiche↔calcul (n'existe pas en base — `CalculRequest` est saisi à la main, aucune FK vers `FichePresence`).
  - Backend: nouvelle entité/repo/service/controller `Notification` dans service-commission. `POST /api/notifications` ne persiste que si un `HistoriqueCalcul` existe déjà pour matricule+mois+année (pas de spam). Route ajoutée au gateway (`ProxyController`, oubliée initialement — 404).
  - Frontend: `NotificationBell` (header, visible ADMIN/ADV, badge non-lus, poll 30s), `notificationsApi.ts`, hook dans `PresenceContext.tsx` (create/update/delete → notifie chaque livreur de la fiche).
- **Bugs trouvés et corrigés en testant** (aucun lié à mon travail direct, découverts en marge):
  - `HistoriqueCalcul.isArchived` toujours `null` au save via `@Builder` (Lombok ignore les valeurs par défaut des champs sauf `@Builder.Default`) → la page Calcul plantait en 500 dès qu'on lançait un vrai calcul. Corrigé.
  - `updatePresenceRecord` (PresenceContext.tsx) faisait un `fetch()` brut en dehors de `presenceApi.ts`, jamais patché lors du passage JWT — modifier une fiche était cassé (401 silencieux) depuis l'ajout de l'authentification. Corrigé (réutilise `presenceApi.update`).
  - Plusieurs autres `fetch()` bruts oubliés lors du même passage: `BrandCalculationPage.tsx`, `CalculationPage.tsx` (imports objectifs/réalisations). Corrigés.
- Testé de bout en bout via docker-compose + navigateur réel (pas juste curl): dispatcher modifie une fiche → notification apparaît correctement dans la cloche ADV avec le bon message/période/matricule.
- Tout commité sur `DevBek` (pas encore poussé, comme le reste de cette session).

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
