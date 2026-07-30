# Refonte du pipeline de données — Page Calcul

Date : 2026-07-30
Statut : approuvé, prêt pour plan d'implémentation

## Contexte

La page Calcul (`CalculationPage.tsx` + `BrandCalculationPage.tsx`) sert à importer les données mensuelles (objectifs, réalisations, notes de triage, volumes) puis à lancer le calcul de commission par carte/produit. Trois problèmes remontés par l'utilisateur (RH/ADV, capture d'écran à l'appui) :

1. **Mois statiques** — le sélecteur de période est une liste codée en dur (`['Mai 2026', 'Avril 2026', 'Mars 2026', 'Février 2026']`), jamais recalculée, et surtout quasi déconnectée du reste : l'import des métriques (Réal/Triage/Volumes) ignore la période choisie et utilise un fallback codé en dur (`'AVRIL/2026'`), le calcul utilise la date du jour plutôt que la période sélectionnée.
2. **Aucune visibilité sur ce qui est importé** — Objectifs, Réalisations et Notes de Triage sont bien persistés en base (PostgreSQL, avec anti-doublon par période+carte+matricule ou période+matricule). Mais **Volumes n'existe pas côté backend** : tout reste dans `localStorage` du navigateur, sans période ni date de péremption attachée. Rien n'affiche à l'utilisateur ce qui est actuellement en base pour le mois en cours.
3. **Réutilisation silencieuse de données obsolètes** — au moment de calculer, `BrandCalculationPage` ne va pas chercher les Réalisations/Triage en base : il relit le blob `localStorage` (`simulation_metrics`), qui n'est jamais invalidé ni scindé par période. Résultat : calculer une semaine après un import, sans rien réimporter, reproduit le même résultat sans avertissement — l'utilisateur ne peut pas savoir quelles données seront réellement utilisées.

## Objectifs

- Une seule source de vérité pour "quelle période est active", propagée de bout en bout (import → affichage → calcul).
- Toutes les données d'import (Objectifs, Réalisations, Triage, **Volumes**) persistées en base, plus aucune dépendance à `localStorage` pour le calcul.
- Visibilité permanente : à tout moment, l'utilisateur voit ce qui est en base pour la période sélectionnée (compteurs, date de dernière mise à jour), sans dépendre de la session navigateur en cours.
- Le calcul utilise explicitement la période sélectionnée ; si une source de données est vide pour cette période, l'utilisateur est prévenu avant de lancer.

## Non-objectifs

- Pas de refonte de la logique métier de calcul (règles de commission, segmentation par rôle/journée via présence) — elle reste telle quelle, seule la provenance des données change (base au lieu de localStorage).
- Pas de gestion d'historique/versioning des imports (on écrase/met à jour par période, comme le fait déjà le pattern Réalisation/Triage — pas de nouvel objectif de traçabilité fine ligne par ligne).
- Pas de changement des formats de fichiers Excel acceptés ni de leur détection par nom de fichier.
- Les cartes produit (Coca Cola / Wall's / Ferrero Rocher) gardent leur apparence générale ; seuls les chiffres factices codés en dur sont retirés/remplacés, pas de redesign visuel plus large.

## Architecture

### Backend — nouvelle entité `Volume`

Mirroring exact du pattern déjà en place pour `RealisationCommerciale`/`NoteTriage` (même style d'entité, service, repository, controller) :

```
@Entity Volume
- id (Long, généré)
- date (LocalDate) — jour de la remontée terrain
- matricule (String, requis)
- role (String, optionnel — rôle tel qu'importé, ex "LIVREUR")
- volumeCharge (Double, >= 0)
- volumeRetourne (Double, >= 0)
- periode (String, YYYY-MM, dérivée de `date` à la sauvegarde, indexée)
- derniereMaj (LocalDateTime, auto @PrePersist/@PreUpdate)
```

- **Pas de champ `carte`** — comme aujourd'hui, les volumes ne sont pas rattachés à un produit ; c'est l'appartenance de l'employé à une carte (via `personnel.carte`) qui détermine leur usage au moment du calcul. Cohérent avec `NoteTriage`, qui n'a pas non plus de `carte`.
- **Contrainte unique `(date, matricule)`** — réimporter la même journée pour le même employé met à jour la ligne existante (`enregistrer()` fait un lookup-puis-save, comme `RealisationCommercialeService.enregistrer()`).
- `volumeDistribue` et `tauxRetour` restent **calculés à la volée** (au niveau service ou frontend), pas stockés — évite toute dérive si `volumeCharge`/`volumeRetourne` sont corrigés après coup.

**Repository** : `findByPeriode(String)`, `findByMatricule(String)` (utilitaire), pas besoin de variante `IgnoreCase` (pas de carte).

**Service** (`VolumeService`) : `listerToutes()`, `listerParPeriode(periode)`, `enregistrer(Volume)` (upsert par date+matricule), `enregistrerBatch(List<Volume>)`.

**Controller** — nouvelles routes dans `ImportController` (même fichier, section "Volumes", même style que les 3 sections existantes) :
- `GET /api/import/volumes`
- `POST /api/import/volumes`
- `POST /api/import/volumes/batch`
- `GET /api/import/volumes/periode/{periode}`
- `DELETE /api/import/volumes/{id}`

Aucune migration SQL manuelle nécessaire : `spring.jpa.hibernate.ddl-auto=update` crée la table au prochain démarrage (comme pour toutes les entités existantes de ce service).

### Frontend — période comme source de vérité unique

- `CalculationPage.tsx` : le sélecteur de pills statique est remplacé par deux `<select>` (mois, année), même composant/style que ceux déjà utilisés sur la page Historique. Défaut = mois courant. La période sélectionnée (format interne `YYYY-MM`) est :
  - transmise aux deux handlers d'import (`handleObjFileSelected`, `handleFileSelected`) comme fallback quand la période n'est pas déductible de la ligne Excel (remplace le `formatPeriodeToYYYYMM(... ?? selectedPeriod ...)` déjà en place pour Objectifs, et corrige le fallback codé en dur `'AVRIL/2026'` pour Réal/Triage/Volumes en appliquant la même fonction) ;
  - transmise à `BrandCalculationPage` via l'état de route (`navigate(path, { state: { periode: selectedPeriod } })`), pour que le calcul sache explicitement pour quel mois il travaille — plus jamais la date du jour.

### Frontend — panneau "Statut d'import"

Remplace le bloc actuel "Dernier import (session)" qui ne reflète que l'état local React. Nouveau composant qui, à chaque changement de période, interroge en parallèle :
- `GET /api/import/objectifs/periode/{p}` → regroupé par `carte`
- `GET /api/import/realisations/periode/{p}` → regroupé par `carte`
- `GET /api/import/triage/periode/{p}` → compteur global (pas de carte)
- `GET /api/import/volumes/periode/{p}` → compteur global (pas de carte)

Affiche : nombre de lignes par source (et par carte quand applicable), date de dernière mise à jour (`max(derniereMaj)` déjà calculable côté frontend depuis les données reçues, pas besoin de nouvel endpoint serveur). Persistant et fiable car lu depuis la base à chaque affichage — plus de dépendance à la session navigateur.

Les cartes produit sur la page principale affichent un badge dérivé de ces compteurs (ex. "3 objectifs · 3 réalisations") à la place des chiffres factices actuels (`unitPrice`, `rate`, `units`, `sellers`, `commission`, tous codés en dur et jamais reliés à une vraie donnée).

### Frontend — calcul basé sur la base, plus sur localStorage

`BrandCalculationPage.handleCalculateAll()` :
- reçoit la période via l'état de route (fallback : mois courant si navigation directe sans état, pour ne pas casser un accès direct par URL) ;
- **corrige un bug additionnel découvert pendant l'analyse** : le fetch actuel des Objectifs (`GET /import/objectifs`, toutes périodes confondues, filtré côté client par carte uniquement) est remplacé par `GET /import/objectifs/periode/{p}` — sinon un employé présent sur plusieurs périodes en base verrait son premier match (période indéterminée) utilisé au lieu de la période sélectionnée, exactement le même bug que celui qu'on corrige pour Réalisations/Triage/Volumes ;
- va chercher, pour cette période : Objectifs (corrigé ci-dessus), et **ajoute** les appels `GET /import/realisations/periode/{p}`, `GET /import/triage/periode/{p}`, `GET /import/volumes/periode/{p}` ; le filtrage par carte pour Objectifs/Réalisations reste fait côté client sur le résultat déjà périodé ;
- `localStorage.getItem('simulation_metrics')` et son `setItem` correspondant dans `CalculationPage.tsx` sont supprimés — plus aucune lecture/écriture de ce blob.
- Si une des 4 sources ne contient aucune ligne pertinente (objectif/réalisation/triage/volume) pour la période+les employés de la carte, un message d'avertissement s'affiche avant le calcul ("Aucune réalisation importée pour Mai 2026 / Coca Cola — le calcul utilisera 0 pour ces employés."), sans bloquer le calcul (l'utilisateur reste libre de calculer avec des zéros s'il le souhaite, mais il le sait).

## Flux de données (résumé)

```
Import Excel (page Calcul, période sélectionnée)
   → parse XLSX → tag periode (ligne Excel ou fallback = période sélectionnée)
   → POST /api/import/{objectifs|realisations|triage|volumes}/batch
   → upsert en base (clé période+carte+matricule, ou période+matricule, ou date+matricule)

Affichage (page Calcul)
   → GET .../periode/{p} × 4 → panneau statut (compteurs + dernière maj)

Calcul (page Carte/BrandCalculationPage, même période)
   → GET .../periode/{p} × 4 (objectifs déjà existant, +3 nouveaux)
   → logique de calcul inchangée (segmentation rôle/jour via présence)
   → résultat affiché + POST /api/historique (inchangé)
```

## Gestion des erreurs

- Échec réseau sur un des 4 GET au moment du calcul → message clair identifiant la source en échec ("Impossible de récupérer les Réalisations — le calcul est annulé"), calcul non lancé (contrairement à l'import où l'échec silencieux actuel `catch(() => ({inserted: ...}))` sera retiré : un échec d'import doit être visible, pas avalé).
- Format de date invalide dans le fichier Volumes → ligne ignorée + décompte des lignes rejetées affiché dans le toast de fin d'import (même pattern que le filtre `.filter(r => r.matricule)` déjà utilisé pour les 3 autres imports).
- Navigation directe vers `/calculation/brand/:brand` sans état de route (ex. lien partagé, rafraîchissement) → fallback sur le mois courant, avec le panneau de statut qui reste visible pour que l'utilisateur confirme/change la période avant de calculer.

## Tests

- Backend : test manuel via `curl` (comme fait pour la fonctionnalité de purge précédente) — import batch Volumes, vérification upsert sur ré-import même date+matricule, `GET .../periode/{p}`.
- Frontend : test navigateur réel (pas seulement build) — import Objectifs + Réalisations + Triage + Volumes pour un mois, vérifier panneau statut à jour, changer de période et vérifier que le panneau reflète l'absence de données, lancer un calcul et vérifier qu'il utilise bien les nouvelles données (pas d'anciennes valeurs localStorage résiduelles).
