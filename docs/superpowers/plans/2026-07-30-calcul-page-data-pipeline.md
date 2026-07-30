# Refonte pipeline de données — Page Calcul — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rendre la page Calcul fiable pour une entreprise : période explicite de bout en bout, toutes les données d'import persistées en base (y compris Volumes, actuellement absent), et une visibilité permanente sur ce qui est en base — plus de dépendance au `localStorage` du navigateur pour savoir quelles données seront utilisées au calcul.

**Architecture:** Backend (`service-commission`) gagne une 4ᵉ entité d'import (`Volume`), miroir exact du pattern déjà en place pour `RealisationCommerciale`/`NoteTriage` (upsert par clé naturelle, endpoints `GET .../periode/{p}` + `POST .../batch`). Frontend centralise tous les appels d'import dans un nouveau service `importApi.ts`, remplace le sélecteur de mois statique par un vrai sélecteur mois/année (réutilisé par la page Calcul et transmis à la page Carte via l'état de route), et bascule le calcul et l'affichage du statut d'import d'une lecture `localStorage` vers des lectures backend filtrées par période.

**Tech Stack:** Spring Boot 3.2.4 / Java 17 / JPA (Hibernate `ddl-auto=update`, pas de migration SQL manuelle) côté backend ; React 18 / TypeScript / Vite côté frontend.

## Global Constraints

- Format période interne partout : `YYYY-MM` (ex. `2026-05`). Les libellés humains ("Mai 2026") ne sont utilisés qu'à l'affichage.
- Toute requête vers `service-commission` doit inclure les en-têtes d'auth via `getAuthHeaders()` (JWT) — déjà le cas dans `importApi.ts` conçu ci-dessous.
- Pas de nouveau framework de test : ce projet n'a aucune infrastructure de test automatisé (pas de `src/test` backend, pas de runner frontend configuré). La vérification de chaque tâche se fait par compilation/build + `curl` + navigateur réel, comme pour tout le reste de ce projet.
- `spring.jpa.hibernate.ddl-auto=update` (déjà configuré) crée automatiquement la nouvelle table au prochain démarrage du conteneur — aucune migration SQL à écrire.
- Suivre exactement le style Lombok déjà en place (`@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder @ToString`) et les conventions de nommage de colonnes explicites (`@Column(name = "...")`) déjà utilisées dans `RealisationCommerciale`/`NoteTriage`.

---

### Task 1: Backend — entité `Volume` + endpoints d'import

**Files:**
- Create: `backend-microservices/service-commission/src/main/java/com/abcdis/commission/model/Volume.java`
- Create: `backend-microservices/service-commission/src/main/java/com/abcdis/commission/repository/VolumeRepository.java`
- Create: `backend-microservices/service-commission/src/main/java/com/abcdis/commission/service/VolumeService.java`
- Modify: `backend-microservices/service-commission/src/main/java/com/abcdis/commission/controller/ImportController.java`

**Interfaces:**
- Produces: `POST /api/import/volumes/batch` (body: `List<Volume>` sans `id`/`periode`/`derniereMaj`), `GET /api/import/volumes/periode/{periode}` (retourne `List<Volume>` avec tous les champs), consommés par le frontend en Task 3/4 via `importApi.ts`.
- Champs exposés par `Volume` (JSON) : `id`, `date` (`YYYY-MM-DD`), `matricule`, `role`, `volumeCharge`, `volumeRetourne`, `periode` (dérivée automatiquement, ignorée si envoyée par le client), `derniereMaj`.

- [ ] **Step 1: Créer l'entité `Volume`**

```java
package com.abcdis.commission.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "volume",
       uniqueConstraints = @UniqueConstraint(
               name = "uk_volume_date_matricule",
               columnNames = {"date_releve", "matricule"}),
       indexes = {
               @Index(name = "idx_volume_periode", columnList = "periode"),
               @Index(name = "idx_volume_matricule", columnList = "matricule")
       })
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
@ToString
public class Volume {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull(message = "La date est obligatoire")
    @Column(name = "date_releve", nullable = false)
    private LocalDate date;

    @NotBlank(message = "Le matricule est obligatoire")
    @Column(nullable = false, length = 50)
    private String matricule;

    @Column(length = 50)
    private String role;

    @NotNull(message = "Le volume chargé est obligatoire")
    @PositiveOrZero(message = "Le volume chargé doit être >= 0")
    @Column(name = "volume_charge", nullable = false)
    private Double volumeCharge;

    @NotNull(message = "Le volume retourné est obligatoire")
    @PositiveOrZero(message = "Le volume retourné doit être >= 0")
    @Column(name = "volume_retourne", nullable = false)
    private Double volumeRetourne;

    @Column(nullable = false, length = 20)
    private String periode;

    @Column(name = "derniere_maj")
    private LocalDateTime derniereMaj;

    @PrePersist
    @PreUpdate
    protected void avantSauvegarde() {
        this.derniereMaj = LocalDateTime.now();
        if (this.date != null) {
            this.periode = String.format("%04d-%02d", this.date.getYear(), this.date.getMonthValue());
        }
    }
}
```

- [ ] **Step 2: Créer `VolumeRepository`**

```java
package com.abcdis.commission.repository;

import com.abcdis.commission.model.Volume;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface VolumeRepository extends JpaRepository<Volume, Long> {
    Optional<Volume> findByDateAndMatricule(LocalDate date, String matricule);
    List<Volume> findByPeriode(String periode);
    List<Volume> findByMatricule(String matricule);
}
```

- [ ] **Step 3: Créer `VolumeService`**

```java
package com.abcdis.commission.service;

import com.abcdis.commission.exception.ResourceNotFoundException;
import com.abcdis.commission.model.Volume;
import com.abcdis.commission.repository.VolumeRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class VolumeService {

    private final VolumeRepository volumeRepository;

    @Transactional(readOnly = true)
    public List<Volume> listerToutes() {
        return volumeRepository.findAll();
    }

    @Transactional(readOnly = true)
    public List<Volume> listerParPeriode(String periode) {
        return volumeRepository.findByPeriode(periode);
    }

    @Transactional
    public Volume enregistrer(Volume volume) {
        volumeRepository.findByDateAndMatricule(volume.getDate(), volume.getMatricule())
                .ifPresent(existant -> volume.setId(existant.getId()));
        return volumeRepository.save(volume);
    }

    @Transactional
    public List<Volume> enregistrerBatch(List<Volume> volumes) {
        return volumes.stream().map(this::enregistrer).toList();
    }

    @Transactional
    public void supprimer(Long id) {
        if (!volumeRepository.existsById(id)) {
            throw new ResourceNotFoundException("Volume introuvable avec l'ID : " + id);
        }
        volumeRepository.deleteById(id);
    }
}
```

- [ ] **Step 4: Ajouter les routes Volumes dans `ImportController`**

Remplacer tout le contenu de `backend-microservices/service-commission/src/main/java/com/abcdis/commission/controller/ImportController.java` par :

```java
package com.abcdis.commission.controller;

import com.abcdis.commission.model.NoteTriage;
import com.abcdis.commission.model.ObjectifCommercial;
import com.abcdis.commission.model.RealisationCommerciale;
import com.abcdis.commission.model.Volume;
import com.abcdis.commission.service.NoteTriageService;
import com.abcdis.commission.service.ObjectifCommercialService;
import com.abcdis.commission.service.RealisationCommercialeService;
import com.abcdis.commission.service.VolumeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Controller d'import de données pour le calcul de commissions.
 * Expose /api/import/** pour importer en lot les données externes (Excel, etc.)
 */
@RestController
@RequestMapping("/api/import")
@RequiredArgsConstructor
public class ImportController {

    private final NoteTriageService noteTriageService;
    private final ObjectifCommercialService objectifService;
    private final RealisationCommercialeService realisationService;
    private final VolumeService volumeService;

    // ── Notes de Triage ──────────────────────────────────────────────────────

    @GetMapping("/triage")
    public ResponseEntity<List<NoteTriage>> listerTriage() {
        return ResponseEntity.ok(noteTriageService.listerToutes());
    }

    @PostMapping("/triage")
    public ResponseEntity<NoteTriage> importerTriage(@Valid @RequestBody NoteTriage triage) {
        return ResponseEntity.status(HttpStatus.CREATED).body(noteTriageService.enregistrer(triage));
    }

    @PostMapping("/triage/batch")
    public ResponseEntity<List<NoteTriage>> importerTriageBatch(@RequestBody List<@Valid NoteTriage> triages) {
        return ResponseEntity.status(HttpStatus.CREATED).body(noteTriageService.enregistrerBatch(triages));
    }

    @GetMapping("/triage/periode/{periode}")
    public ResponseEntity<List<NoteTriage>> listerTriageParPeriode(@PathVariable String periode) {
        return ResponseEntity.ok(noteTriageService.listerParPeriode(periode));
    }

    @DeleteMapping("/triage/{id}")
    public ResponseEntity<Void> supprimerTriage(@PathVariable Long id) {
        noteTriageService.supprimer(id);
        return ResponseEntity.noContent().build();
    }

    // ── Objectifs Commerciaux ────────────────────────────────────────────────

    @GetMapping("/objectifs")
    public ResponseEntity<List<ObjectifCommercial>> listerObjectifs() {
        return ResponseEntity.ok(objectifService.listerTous());
    }

    @PostMapping("/objectifs")
    public ResponseEntity<ObjectifCommercial> importerObjectif(@Valid @RequestBody ObjectifCommercial objectif) {
        return ResponseEntity.status(HttpStatus.CREATED).body(objectifService.enregistrer(objectif));
    }

    @PostMapping("/objectifs/batch")
    public ResponseEntity<List<ObjectifCommercial>> importerObjectifsBatch(@RequestBody List<@Valid ObjectifCommercial> objectifs) {
        return ResponseEntity.status(HttpStatus.CREATED).body(objectifService.enregistrerBatch(objectifs));
    }

    @GetMapping("/objectifs/periode/{periode}")
    public ResponseEntity<List<ObjectifCommercial>> listerObjectifsParPeriode(@PathVariable String periode) {
        return ResponseEntity.ok(objectifService.listerParPeriode(periode));
    }

    @GetMapping("/objectifs/carte/{carte}")
    public ResponseEntity<List<ObjectifCommercial>> listerObjectifsParCarte(@PathVariable String carte) {
        return ResponseEntity.ok(objectifService.listerParCarte(carte));
    }

    @DeleteMapping("/objectifs/{id}")
    public ResponseEntity<Void> supprimerObjectif(@PathVariable Long id) {
        objectifService.supprimer(id);
        return ResponseEntity.noContent().build();
    }

    // ── Réalisations Commerciales ────────────────────────────────────────────

    @GetMapping("/realisations")
    public ResponseEntity<List<RealisationCommerciale>> listerRealisations() {
        return ResponseEntity.ok(realisationService.listerToutes());
    }

    @PostMapping("/realisations")
    public ResponseEntity<RealisationCommerciale> importerRealisation(@Valid @RequestBody RealisationCommerciale realisation) {
        return ResponseEntity.status(HttpStatus.CREATED).body(realisationService.enregistrer(realisation));
    }

    @PostMapping("/realisations/batch")
    public ResponseEntity<List<RealisationCommerciale>> importerRealisationsBatch(@RequestBody List<@Valid RealisationCommerciale> realisations) {
        return ResponseEntity.status(HttpStatus.CREATED).body(realisationService.enregistrerBatch(realisations));
    }

    @GetMapping("/realisations/periode/{periode}")
    public ResponseEntity<List<RealisationCommerciale>> listerRealisationsParPeriode(@PathVariable String periode) {
        return ResponseEntity.ok(realisationService.listerParPeriode(periode));
    }

    @GetMapping("/realisations/carte/{carte}")
    public ResponseEntity<List<RealisationCommerciale>> listerRealisationsParCarte(@PathVariable String carte) {
        return ResponseEntity.ok(realisationService.listerParCarte(carte));
    }

    @DeleteMapping("/realisations/{id}")
    public ResponseEntity<Void> supprimerRealisation(@PathVariable Long id) {
        realisationService.supprimer(id);
        return ResponseEntity.noContent().build();
    }

    // ── Volumes ──────────────────────────────────────────────────────────────

    @GetMapping("/volumes")
    public ResponseEntity<List<Volume>> listerVolumes() {
        return ResponseEntity.ok(volumeService.listerToutes());
    }

    @PostMapping("/volumes")
    public ResponseEntity<Volume> importerVolume(@Valid @RequestBody Volume volume) {
        return ResponseEntity.status(HttpStatus.CREATED).body(volumeService.enregistrer(volume));
    }

    @PostMapping("/volumes/batch")
    public ResponseEntity<List<Volume>> importerVolumesBatch(@RequestBody List<@Valid Volume> volumes) {
        return ResponseEntity.status(HttpStatus.CREATED).body(volumeService.enregistrerBatch(volumes));
    }

    @GetMapping("/volumes/periode/{periode}")
    public ResponseEntity<List<Volume>> listerVolumesParPeriode(@PathVariable String periode) {
        return ResponseEntity.ok(volumeService.listerParPeriode(periode));
    }

    @DeleteMapping("/volumes/{id}")
    public ResponseEntity<Void> supprimerVolume(@PathVariable Long id) {
        volumeService.supprimer(id);
        return ResponseEntity.noContent().build();
    }
}
```

- [ ] **Step 5: Vérifier la compilation**

Run: `cd C:/Projets/RH-Commission/backend-microservices && mvn -pl service-commission -am clean compile -DskipTests -q`
Expected: aucune sortie (build silencieux = succès). En cas d'erreur, elle apparaît dans la sortie.

- [ ] **Step 6: Rebuild et redémarrer le conteneur**

Run: `cd C:/Projets/RH-Commission && docker compose up -d --build service-commission`
Expected: `Container rh-commission-service-commission-1 Started` à la fin des logs.

- [ ] **Step 7: Vérifier manuellement via curl**

```bash
TOKEN=$(curl -s -X POST http://localhost:8080/api/users/login -H "Content-Type: application/json" -d '{"email":"yassine.admin@abcdis.com","password":"Admin1234!"}' | grep -o '"token":"[^"]*"' | cut -d'"' -f4)

# Import batch
curl -s -X POST http://localhost:8080/api/import/volumes/batch \
  -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '[{"date":"2026-05-04","matricule":"TEST001","role":"LIVREUR","volumeCharge":100,"volumeRetourne":10}]'

# Doit renvoyer un tableau JSON avec periode="2026-05" et derniereMaj rempli

# Ré-import même date+matricule → doit mettre à jour (pas dupliquer)
curl -s -X POST http://localhost:8080/api/import/volumes/batch \
  -H "Content-Type: application/json" -H "Authorization: Bearer $TOKEN" \
  -d '[{"date":"2026-05-04","matricule":"TEST001","role":"LIVREUR","volumeCharge":150,"volumeRetourne":20}]'

# Lecture par période
curl -s http://localhost:8080/api/import/volumes/periode/2026-05 -H "Authorization: Bearer $TOKEN"
```

Expected : le dernier `GET` renvoie **une seule** ligne pour `TEST001` avec `volumeCharge:150, volumeRetourne:20` (confirme l'upsert, pas de doublon).

- [ ] **Step 8: Commit**

```bash
git add backend-microservices/service-commission/src/main/java/com/abcdis/commission/model/Volume.java backend-microservices/service-commission/src/main/java/com/abcdis/commission/repository/VolumeRepository.java backend-microservices/service-commission/src/main/java/com/abcdis/commission/service/VolumeService.java backend-microservices/service-commission/src/main/java/com/abcdis/commission/controller/ImportController.java
git commit -m "Ajoute persistance backend pour les Volumes (miroir Réalisations/Triage)"
```

---

### Task 2: Frontend — service `importApi.ts` + utilitaires `periode.ts`/`excelDate.ts`

**Files:**
- Create: `frontend/src/app/services/importApi.ts`
- Create: `frontend/src/app/utils/periode.ts`
- Create: `frontend/src/app/utils/excelDate.ts`

**Interfaces:**
- Consumes : `getAuthHeaders()` de `frontend/src/app/services/authHeaders.ts` (existant, inchangé).
- Produces : `importApi.{getObjectifsByPeriode, postObjectifsBatch, getRealisationsByPeriode, postRealisationsBatch, getTriageByPeriode, postTriageBatch, getVolumesByPeriode, postVolumesBatch}`, types `ApiObjectif`, `ApiRealisation`, `ApiTriage`, `ApiVolume` — consommés par Task 3 (`CalculationPage.tsx`) et Task 4 (`BrandCalculationPage.tsx`). `MONTHS_FR`, `toPeriodeKey(month, year)`, `toPeriodeLabel(month, year)`, `currentMonthYear()` de `periode.ts`, `parseExcelDate(raw)` de `excelDate.ts` — mêmes consommateurs.

- [ ] **Step 1: Créer `frontend/src/app/utils/periode.ts`**

```typescript
export const MONTHS_FR = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

export function toPeriodeKey(month: number, year: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}`;
}

export function toPeriodeLabel(month: number, year: number): string {
  return `${MONTHS_FR[month]} ${year}`;
}

export function currentMonthYear(): { month: number; year: number } {
  const now = new Date();
  return { month: now.getMonth(), year: now.getFullYear() };
}
```

- [ ] **Step 2: Créer `frontend/src/app/utils/excelDate.ts`**

Extrait tel quel (comportement identique) de la logique déjà présente dans `BrandCalculationPage.tsx` (lignes 181-192 avant refonte), pour être réutilisée à la fois à l'import (Task 3) et au calcul (Task 4) au lieu d'être dupliquée.

```typescript
export function parseExcelDate(raw: unknown): string {
  const rawStr = String(raw ?? '').trim();

  if (/^\d+$/.test(rawStr)) {
    const serial = parseInt(rawStr, 10);
    const dateObj = new Date(Date.UTC(1899, 11, 30 + serial));
    return dateObj.toISOString().split('T')[0];
  }

  if (rawStr.includes('/')) {
    const parts = rawStr.split('/');
    if (parts.length === 3) {
      return `${parts[2]}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`;
    }
  }

  if (rawStr.includes('-')) {
    return rawStr.split('T')[0];
  }

  return '';
}
```

- [ ] **Step 3: Créer `frontend/src/app/services/importApi.ts`**

```typescript
import { getAuthHeaders } from './authHeaders';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

function getHeaders(): HeadersInit {
  const role = (() => {
    try { return JSON.parse(localStorage.getItem('user') || '{}').superRole || ''; } catch { return ''; }
  })();
  return {
    'Content-Type': 'application/json',
    ...(role ? { 'X-User-Role': role } : {}),
    ...getAuthHeaders(),
  };
}

export interface ApiObjectif {
  id?: number;
  periode: string;
  carte: string;
  matricule: string;
  nomComplet?: string;
  target: number;
  derniereMaj?: string;
}

export interface ApiRealisation {
  id?: number;
  periode: string;
  carte: string;
  matricule: string;
  caRealise: number;
  derniereMaj?: string;
}

export interface ApiTriage {
  id?: number;
  periode: string;
  matricule: string;
  note: number;
  derniereMaj?: string;
}

export interface ApiVolume {
  id?: number;
  date: string;
  matricule: string;
  role?: string;
  volumeCharge: number;
  volumeRetourne: number;
  periode?: string;
  derniereMaj?: string;
}

async function getByPeriode<T>(resource: string, periode: string): Promise<T[]> {
  const res = await fetch(`${API_BASE_URL}/import/${resource}/periode/${encodeURIComponent(periode)}`, {
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error(`Impossible de récupérer ${resource} pour la période ${periode}`);
  return res.json();
}

async function postBatch<T>(resource: string, payload: unknown[]): Promise<T[]> {
  if (payload.length === 0) return [];
  const res = await fetch(`${API_BASE_URL}/import/${resource}/batch`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    throw new Error(body?.message || `Échec de l'import ${resource}`);
  }
  return res.json();
}

export const importApi = {
  getObjectifsByPeriode: (periode: string) => getByPeriode<ApiObjectif>('objectifs', periode),
  postObjectifsBatch: (payload: Omit<ApiObjectif, 'id' | 'derniereMaj'>[]) => postBatch<ApiObjectif>('objectifs', payload),

  getRealisationsByPeriode: (periode: string) => getByPeriode<ApiRealisation>('realisations', periode),
  postRealisationsBatch: (payload: Omit<ApiRealisation, 'id' | 'derniereMaj'>[]) => postBatch<ApiRealisation>('realisations', payload),

  getTriageByPeriode: (periode: string) => getByPeriode<ApiTriage>('triage', periode),
  postTriageBatch: (payload: Omit<ApiTriage, 'id' | 'derniereMaj'>[]) => postBatch<ApiTriage>('triage', payload),

  getVolumesByPeriode: (periode: string) => getByPeriode<ApiVolume>('volumes', periode),
  postVolumesBatch: (payload: Omit<ApiVolume, 'id' | 'derniereMaj' | 'periode'>[]) => postBatch<ApiVolume>('volumes', payload),
};
```

- [ ] **Step 4: Vérifier le build**

Run: `cd C:/Projets/RH-Commission/frontend && npx vite build`
Expected: `✓ built in ...` sans erreur TypeScript (ces fichiers ne sont pas encore importés ailleurs, donc le build doit simplement rester vert — aucune régression).

- [ ] **Step 5: Commit**

```bash
git add frontend/src/app/services/importApi.ts frontend/src/app/utils/periode.ts frontend/src/app/utils/excelDate.ts
git commit -m "Ajoute service importApi + utilitaires période/date Excel"
```

---

### Task 3: Frontend — `CalculationPage.tsx` : période dynamique + panneau de statut

**Files:**
- Modify: `frontend/src/app/pages/CalculationPage.tsx` (remplacement intégral du fichier)

**Interfaces:**
- Consumes : `importApi`, `ApiObjectif`, `ApiRealisation`, `ApiTriage`, `ApiVolume` (Task 2) ; `MONTHS_FR`, `toPeriodeKey`, `toPeriodeLabel` (Task 2) ; `parseExcelDate` (Task 2) ; `useConstraints()` de `../context/ConstraintsContext` (existant).
- Produces : navigation vers `/calculation/brand/:brand` avec `state: { periode: string, periodeLabel: string }` — consommé par Task 4.

- [ ] **Step 1: Remplacer le contenu de `CalculationPage.tsx`**

```typescript
import { useRef, useState, useEffect, useMemo, useCallback, type ChangeEvent } from 'react';
import { useNavigate } from 'react-router';
import {
  UploadCloud,
  Loader2,
  Target,
  AlertCircle,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';
import { useLang } from '../context/LangContext';
import { useConstraints } from '../context/ConstraintsContext';
import { logAudit } from '../services/auditApi';
import { importApi, type ApiObjectif, type ApiRealisation, type ApiTriage, type ApiVolume } from '../services/importApi';
import { MONTHS_FR, toPeriodeKey, toPeriodeLabel } from '../utils/periode';
import { parseExcelDate } from '../utils/excelDate';

import cocaBg from '../assets/coca cola.png';
import ferreroBg from '../assets/ferrero rocher.png';
import wallsBg from '../assets/walls.jpg';

// Utilitaire de normalisation des périodes pour correspondre au format attendu YYYY-MM
const formatPeriodeToYYYYMM = (raw: string, fallbackPeriod: string) => {
  const s = String(raw).toUpperCase().trim();
  let year = "2026";
  let month = "01";

  const yearMatch = s.match(/\d{4}/);
  if (yearMatch) year = yearMatch[0];
  else {
    const fallbackYearMatch = fallbackPeriod.match(/\d{4}/);
    if (fallbackYearMatch) year = fallbackYearMatch[0];
  }

  if (s.includes('JAN') || s.includes('01')) month = '01';
  else if (s.includes('FEV') || s.includes('FÉV') || s.includes('02')) month = '02';
  else if (s.includes('MAR') || s.includes('03')) month = '03';
  else if (s.includes('AVR') || s.includes('04')) month = '04';
  else if (s.includes('MAI') || s.includes('05')) month = '05';
  else if (s.includes('JUN') || s.includes('JUIN') || s.includes('06')) month = '06';
  else if (s.includes('JUL') || s.includes('JUIL') || s.includes('07')) month = '07';
  else if (s.includes('AOU') || s.includes('AOÛ') || s.includes('08')) month = '08';
  else if (s.includes('SEP') || s.includes('09')) month = '09';
  else if (s.includes('OCT') || s.includes('10')) month = '10';
  else if (s.includes('NOV') || s.includes('11')) month = '11';
  else if (s.includes('DEC') || s.includes('DÉC') || s.includes('12')) month = '12';

  return `${year}-${month}`;
};

export default function CalculationPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const objFileInputRef = useRef<HTMLInputElement | null>(null);

  const { t } = useLang();
  const c = t.calculation;
  const { constraints } = useConstraints();

  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth());
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());
  const periodeKey = useMemo(() => toPeriodeKey(selectedMonth, selectedYear), [selectedMonth, selectedYear]);
  const periodeLabel = useMemo(() => toPeriodeLabel(selectedMonth, selectedYear), [selectedMonth, selectedYear]);

  const [highlightedBrand, setHighlightedBrand] = useState<string>('coca-cola');

  const brandCards = [
    {
      id: 'coca-cola',
      name: 'Coca Cola',
      image: cocaBg,
      sector: 'Boissons',
      accent: 'border-orange-400 ring-2 ring-orange-200',
    },
    {
      id: 'walls',
      name: "Wall's",
      image: wallsBg,
      sector: 'Glaces',
      accent: 'border-sky-400 ring-2 ring-sky-200',
    },
    {
      id: 'ferrero-rocher',
      name: 'Ferrero Rocher',
      image: ferreroBg,
      sector: 'Chocolats',
      accent: 'border-amber-400 ring-2 ring-amber-200',
    },
  ];

  const [importing, setImporting] = useState(false);
  const [importingObj, setImportingObj] = useState(false);

  // ─── Statut d'import (source de vérité = base de données, pas la session) ──
  const [statusLoading, setStatusLoading] = useState(false);
  const [objectifsStatus, setObjectifsStatus] = useState<ApiObjectif[]>([]);
  const [realisationsStatus, setRealisationsStatus] = useState<ApiRealisation[]>([]);
  const [triageStatus, setTriageStatus] = useState<ApiTriage[]>([]);
  const [volumesStatus, setVolumesStatus] = useState<ApiVolume[]>([]);
  const [statusError, setStatusError] = useState<string[]>([]);

  const refreshStatus = useCallback(async () => {
    setStatusLoading(true);
    const [objRes, realRes, triRes, volRes] = await Promise.allSettled([
      importApi.getObjectifsByPeriode(periodeKey),
      importApi.getRealisationsByPeriode(periodeKey),
      importApi.getTriageByPeriode(periodeKey),
      importApi.getVolumesByPeriode(periodeKey),
    ]);

    const failedSources: string[] = [];

    if (objRes.status === 'fulfilled') setObjectifsStatus(objRes.value);
    else { setObjectifsStatus([]); failedSources.push('Objectifs'); }

    if (realRes.status === 'fulfilled') setRealisationsStatus(realRes.value);
    else { setRealisationsStatus([]); failedSources.push('Réalisations'); }

    if (triRes.status === 'fulfilled') setTriageStatus(triRes.value);
    else { setTriageStatus([]); failedSources.push('Triage'); }

    if (volRes.status === 'fulfilled') setVolumesStatus(volRes.value);
    else { setVolumesStatus([]); failedSources.push('Volumes'); }

    setStatusError(failedSources);
    setStatusLoading(false);
  }, [periodeKey]);

  useEffect(() => {
    refreshStatus();
  }, [refreshStatus]);

  const carteStatusCounts = useMemo(() => {
    const cartes = ['Coca Cola', "Wall's", 'Ferrero Rocher'];
    const map: Record<string, { objectifs: number; realisations: number }> = {};
    cartes.forEach(carteName => {
      map[carteName] = {
        objectifs: objectifsStatus.filter(o => o.carte === carteName).length,
        realisations: realisationsStatus.filter(r => r.carte === carteName).length,
      };
    });
    return map;
  }, [objectifsStatus, realisationsStatus]);

  const lastUpdated = useMemo(() => {
    const dates = [...objectifsStatus, ...realisationsStatus, ...triageStatus, ...volumesStatus]
      .map(x => x.derniereMaj)
      .filter((d): d is string => Boolean(d));
    if (dates.length === 0) return null;
    return dates.reduce((max, d) => (d > max ? d : max), dates[0]);
  }, [objectifsStatus, realisationsStatus, triageStatus, volumesStatus]);

  const activeConstraintsCount = (carteName: string) => {
    const target = carteName.toUpperCase();
    return constraints.filter(cst => {
      if (cst.active === false) return false;
      const dbCarte = (cst.carte || '').toUpperCase();
      if (target.includes('COCA') && dbCarte.includes('COCA')) return true;
      if (target.includes('FERRERO') && dbCarte.includes('FERRERO')) return true;
      if (target.includes('WALL') && dbCarte.includes('WALL')) return true;
      return dbCarte === target;
    }).length;
  };

  const getVal = (row: any, keyword: string) => {
    const key = Object.keys(row).find(k =>
      k.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").includes(keyword)
    );
    return key ? row[key] : undefined;
  };

  // ─── 1. IMPORTATION ET SAUVEGARDE STRICTE DES OBJECTIFS (BDD) ──────────
  const handleObjImportClick = () => {
    objFileInputRef.current?.click();
  };

  const handleObjFileSelected = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setImportingObj(true);
    try {
      const file = files[0];
      const data = await file.arrayBuffer();
      const wb = XLSX.read(data, { type: 'array' });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const dataJson = XLSX.utils.sheet_to_json<any>(sheet);

      const objPayload = dataJson.map(r => {
        const rawPeriode = getVal(r, 'periode');
        return {
          periode: rawPeriode ? formatPeriodeToYYYYMM(rawPeriode, periodeKey) : periodeKey,
          carte: String(getVal(r, 'carte') ?? ''),
          matricule: String(getVal(r, 'matricule') ?? ''),
          nomComplet: String(getVal(r, 'nom complet') ?? getVal(r, 'nom') ?? ''),
          target: Number(getVal(r, 'target') ?? getVal(r, 'objectif') ?? 0),
        };
      }).filter(r => r.matricule && r.carte);

      await importApi.postObjectifsBatch(objPayload);

      toast.success(`${objPayload.length} objectifs synchronisés avec succès pour ${periodeLabel} !`);
      logAudit({
        action: 'IMPORT_OBJECTIFS_SQL',
        entity: 'Calcul',
        details: `${objPayload.length} objectifs persistés en BDD pour ${periodeLabel}`,
      });
      await refreshStatus();
    } catch (err: any) {
      console.error('Erreur import Objectifs:', err);
      toast.error(err?.message ?? 'Échec de la sauvegarde des objectifs');
    } finally {
      setImportingObj(false);
      if (objFileInputRef.current) objFileInputRef.current.value = '';
    }
  };

  // ─── 2. IMPORTATION CLASSIQUE POUR SIMULATION (Réal, Triage, Volumes) ───
  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelected = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setImporting(true);

    try {
      let allRealisations: any[] = [];
      let allTriages: any[] = [];
      let allVolumes: any[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileName = file.name.toLowerCase();
        const data = await file.arrayBuffer();
        const wb = XLSX.read(data, { type: 'array' });
        const sheet = wb.Sheets[wb.SheetNames[0]];
        const dataJson = XLSX.utils.sheet_to_json<any>(sheet);

        if (fileName.includes('real') || fileName.includes('réal')) allRealisations.push(...dataJson);
        else if (fileName.includes('tri')) allTriages.push(...dataJson);
        else if (fileName.includes('vol') || fileName.includes('coke')) allVolumes.push(...dataJson);
      }

      const realPayload = allRealisations.map(r => {
        const rawPeriode = getVal(r, 'periode');
        return {
          periode: rawPeriode ? formatPeriodeToYYYYMM(rawPeriode, periodeKey) : periodeKey,
          carte: String(getVal(r, 'carte') ?? ''),
          matricule: String(getVal(r, 'matricule') ?? ''),
          caRealise: Number(getVal(r, 'target') ?? getVal(r, 'realise') ?? 0),
        };
      }).filter(r => r.matricule);

      const triPayload = allTriages.map(r => {
        let noteStr = String(getVal(r, 'note') ?? '0').replace('%', '');
        let note = Number(noteStr);
        if (note < 1 && note > 0) note = note * 100;
        const rawPeriode = getVal(r, 'periode');
        return {
          periode: rawPeriode ? formatPeriodeToYYYYMM(rawPeriode, periodeKey) : periodeKey,
          matricule: String(getVal(r, 'matricule') ?? ''),
          note: note,
        };
      }).filter(r => r.matricule);

      const volPayload = allVolumes.map(r => {
        const charge = Number(getVal(r, 'charge') ?? r['Volume chargé (En CP)'] ?? 0);
        const retourne = Number(getVal(r, 'retourne') ?? r['Volume retourné (en CP)'] ?? 0);
        const matricule = String(getVal(r, 'matricule') ?? '');
        const roleExtrait = String(getVal(r, 'role') ?? r.Role ?? r.role ?? '');
        const rawDate = getVal(r, 'date') ?? r.Date ?? r.date ?? r['Date'] ?? '';
        const isoDate = parseExcelDate(rawDate);

        return {
          date: isoDate,
          matricule,
          role: roleExtrait,
          volumeCharge: charge,
          volumeRetourne: retourne,
        };
      }).filter(r => r.matricule && r.date);

      const [realResult, triResult, volResult] = await Promise.allSettled([
        importApi.postRealisationsBatch(realPayload),
        importApi.postTriageBatch(triPayload),
        importApi.postVolumesBatch(volPayload),
      ]);

      const failed: string[] = [];
      if (realResult.status === 'rejected') failed.push('Réalisations');
      if (triResult.status === 'rejected') failed.push('Triage');
      if (volResult.status === 'rejected') failed.push('Volumes');

      if (failed.length > 0) {
        toast.error(`Échec de l'import pour : ${failed.join(', ')}`);
      }
      if (failed.length < 3) {
        const okCount = [
          realResult.status === 'fulfilled' ? realPayload.length : null,
          triResult.status === 'fulfilled' ? triPayload.length : null,
          volResult.status === 'fulfilled' ? volPayload.length : null,
        ];
        toast.success(`Import ${periodeLabel} : ${okCount[0] ?? 0} réal, ${okCount[1] ?? 0} tri, ${okCount[2] ?? 0} volumes`);
      }

      logAudit({
        action: 'IMPORT_EXCEL_SIMULATION',
        entity: 'Calcul',
        details: `${files.length} fichiers chargés pour ${periodeLabel}`,
      });

      await refreshStatus();
    } catch (err: any) {
      console.error('Erreur import Excel:', err);
      toast.error(err?.message ?? "Échec de l'import Excel");
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleBrandClick = (brandName: string) => {
    navigate(`/calculation/brand/${encodeURIComponent(brandName)}`, { state: { periode: periodeKey, periodeLabel } });
  };

  return (
    <div className="abc-page-inner abc-stack-lg">
      <div>
        <h1 className="abc-h2">{c.title}</h1>
        <p className="abc-sub abc-sub-tight">{c.subtitle}</p>
      </div>

      <section className="space-y-4">
        <div className="flex items-baseline gap-3">
          <span className="text-xs font-semibold tracking-[0.2em] text-gray-400">01</span>
          <h2 className="text-lg font-semibold text-gray-900">Source des données</h2>
        </div>

        <div className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-500">Période active :</span>
            <select
              className="abc-mini-select"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
            >
              {MONTHS_FR.map((m, i) => (
                <option key={m} value={i}>{m}</option>
              ))}
            </select>
            <select
              className="abc-mini-select"
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
            >
              <option value={2026}>2026</option>
              <option value={2025}>2025</option>
              <option value={2024}>2024</option>
            </select>
          </div>
        </div>

        {/* Inputs masqués pour la gestion de fichiers Excel */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          multiple
          className="hidden"
          onChange={handleFileSelected}
        />
        <input
          ref={objFileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          className="hidden"
          onChange={handleObjFileSelected}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <button
            type="button"
            onClick={handleObjImportClick}
            disabled={importingObj}
            className="group relative flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-orange-300 bg-orange-50/10 px-6 py-12 text-center transition-all hover:border-orange-500 hover:bg-orange-50/40 disabled:cursor-wait disabled:opacity-70"
          >
            <div className="rounded-full bg-orange-100 p-4 transition-colors group-hover:bg-orange-600 group-hover:text-white">
              {importingObj ? <Loader2 className="h-7 w-7 text-orange-600 animate-spin" /> : <Target className="h-7 w-7 text-orange-600 group-hover:text-white" strokeWidth={1.5} />}
            </div>
            <div className="space-y-1">
              <p className="text-sm font-bold text-gray-900">1. Importer les Objectifs Mensuels ({periodeLabel})</p>
              <p className="text-xs text-gray-500">Persiste et met à jour définitivement le référentiel des cibles</p>
            </div>
          </button>

          <button
            type="button"
            onClick={handleImportClick}
            disabled={importing}
            className="group relative flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-gray-300 bg-white px-6 py-12 text-center transition-all hover:border-gray-900 hover:bg-gray-50 disabled:cursor-wait disabled:opacity-70"
          >
            <div className="rounded-full bg-gray-100 p-4 transition-colors group-hover:bg-gray-900 group-hover:text-white">
              {importing ? <Loader2 className="h-7 w-7 animate-spin" strokeWidth={1.5} /> : <UploadCloud className="h-7 w-7" strokeWidth={1.5} />}
            </div>
            <div className="space-y-1">
              <p className="text-sm font-bold text-gray-900">2. Importer les Métriques ({periodeLabel})</p>
              <p className="text-xs text-gray-500">Réalisations, Triage, Volumes — glissez-déposez vos fichiers</p>
            </div>
          </button>
        </div>

        <div className="mt-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <span className="text-[10px] font-semibold tracking-[0.18em] text-gray-400">STATUT D'IMPORT — {periodeLabel.toUpperCase()}</span>
            {statusLoading && <Loader2 className="h-3.5 w-3.5 animate-spin text-gray-400" />}
          </div>

          {statusError.length > 0 && (
            <p className="mb-3 flex items-center gap-1.5 text-xs text-red-600">
              <AlertCircle className="h-3.5 w-3.5" /> Impossible de charger : {statusError.join(', ')}
            </p>
          )}

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-xl bg-gray-50 p-3 text-center">
              <p className="text-2xl font-bold text-gray-900">{objectifsStatus.length}</p>
              <p className="text-[11px] text-gray-500">Objectifs</p>
            </div>
            <div className="rounded-xl bg-gray-50 p-3 text-center">
              <p className="text-2xl font-bold text-gray-900">{realisationsStatus.length}</p>
              <p className="text-[11px] text-gray-500">Réalisations</p>
            </div>
            <div className="rounded-xl bg-gray-50 p-3 text-center">
              <p className="text-2xl font-bold text-gray-900">{triageStatus.length}</p>
              <p className="text-[11px] text-gray-500">Triage</p>
            </div>
            <div className="rounded-xl bg-gray-50 p-3 text-center">
              <p className="text-2xl font-bold text-gray-900">{volumesStatus.length}</p>
              <p className="text-[11px] text-gray-500">Volumes</p>
            </div>
          </div>

          <p className="mt-4 text-xs text-gray-400">
            {lastUpdated
              ? `Dernière mise à jour : ${new Date(lastUpdated).toLocaleString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`
              : `Aucune donnée importée pour ${periodeLabel}.`}
          </p>
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <div className="flex items-baseline gap-3">
            <span className="text-xs font-semibold tracking-[0.2em] text-gray-400">02</span>
            <h2 className="text-lg font-semibold text-gray-900">Produit à calculer</h2>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {brandCards.map((card) => {
            const selected = highlightedBrand === card.id;
            const counts = carteStatusCounts[card.name] || { objectifs: 0, realisations: 0 };
            return (
              <div
                key={card.id}
                onClick={() => {
                  setHighlightedBrand(card.id);
                  handleBrandClick(card.name);
                }}
                className={'group cursor-pointer rounded-2xl border bg-white p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md ' + (selected ? card.accent : 'border-gray-200 hover:border-gray-300')}
              >
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 overflow-hidden rounded-xl border border-gray-100 bg-gray-50 shrink-0">
                    <img src={card.image} alt={card.name} className="h-full w-full object-cover" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-base font-semibold text-gray-900">{card.name}</h3>
                    <p className="text-xs text-gray-400 truncate">{card.sector} · {activeConstraintsCount(card.name)} règle(s) active(s)</p>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2 text-[11px] font-medium">
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-gray-600">{counts.objectifs} objectif(s)</span>
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-gray-600">{counts.realisations} réalisation(s)</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
```

- [ ] **Step 2: Vérifier le build**

Run: `cd C:/Projets/RH-Commission/frontend && npx vite build`
Expected: `✓ built in ...` sans erreur.

- [ ] **Step 3: Vérification manuelle en navigateur**

1. Ouvrir `http://localhost:5173`, se connecter en ADMIN ou ADV.
2. Aller sur la page Calcul.
3. Vérifier que les deux `<select>` "mois"/"année" affichent le mois courant par défaut, et changer la valeur pour un mois sans données → le panneau "Statut d'import" doit afficher `0` partout et "Aucune donnée importée pour {mois}".
4. Importer un fichier Objectifs (bouton 1) et un fichier Réalisations/Triage/Volumes nommés respectivement `Realisations.xlsx`/`Triage.xlsx`/`Volume.xlsx` (bouton 2) pour le mois sélectionné.
5. Vérifier que le panneau "Statut d'import" affiche des compteurs > 0 juste après l'import, sans recharger la page.
6. Recharger complètement la page (F5) sur le même mois → les compteurs doivent rester identiques (preuve que la source est la base, pas la session).
7. Vérifier que les 3 cartes produit affichent des badges "X objectif(s) · Y réalisation(s)" cohérents avec le panneau.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/app/pages/CalculationPage.tsx
git commit -m "Refonte page Calcul: periode dynamique + statut d'import base de données"
```

---

### Task 4: Frontend — `BrandCalculationPage.tsx` : calcul basé sur la base, plus sur localStorage

**Files:**
- Modify: `frontend/src/app/pages/BrandCalculationPage.tsx` (remplacement intégral du fichier)

**Interfaces:**
- Consumes : `importApi` (Task 2), `currentMonthYear`, `toPeriodeKey`, `toPeriodeLabel` (Task 2), `state: { periode, periodeLabel }` transmis par Task 3 via `useLocation()`.

- [ ] **Step 1: Remplacer le contenu de `BrandCalculationPage.tsx`**

```typescript
import { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, Calculator, Users, Loader2 } from 'lucide-react';
import { useLocation, useNavigate, useParams } from 'react-router';
import { useConstraints } from '../context/ConstraintsContext';
import { useHistory } from '../context/HistoryContext';
import { usePresence } from '../context/PresenceContext';
import { toast } from 'sonner';
import { useLang } from '../context/LangContext';
import { getAuthHeaders } from '../services/authHeaders';
import { importApi } from '../services/importApi';
import { currentMonthYear, toPeriodeKey, toPeriodeLabel } from '../utils/periode';

interface Employee {
  id: string;
  matricule?: string;
  nom: string;
  prenom: string;
  role: string;
  carte: string;
  natureContrat: string;
  actif: boolean;
}

type CalculationDetail = {
  name: string;
  amount: number;
  type: 'commission' | 'bonus' | 'penalty';
};

type EmployeeCalculationResult = {
  employee: Employee;
  commissions: number;
  bonuses: number;
  finalSalary: number;
  details: CalculationDetail[];
};

export default function BrandCalculationPage() {
  const { brand = '' } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { constraints } = useConstraints();

  const { history = [], addCalculation } = useHistory();

  const { presenceRecords } = usePresence();
  const decodedBrand = decodeURIComponent(brand);
  const { t } = useLang();
  const b = t.brandCalc;

  const routeState = location.state as { periode?: string; periodeLabel?: string } | null;
  const { periode: periodeKey, periodeLabel } = useMemo(() => {
    if (routeState?.periode) {
      return { periode: routeState.periode, periodeLabel: routeState.periodeLabel || routeState.periode };
    }
    const { month, year } = currentMonthYear();
    return { periode: toPeriodeKey(month, year), periodeLabel: toPeriodeLabel(month, year) };
  }, [routeState]);

  const [brandEmployees, setBrandEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCalculating, setIsCalculating] = useState(false);
  const [results, setResults] = useState<EmployeeCalculationResult[]>([]);
  const [activeTab, setActiveTab] = useState<'detail' | 'recap'>('detail');

  useEffect(() => {
    const fetchEmployeesByBrand = async () => {
      try {
        setLoading(true);
        const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';
        const targetBrand = decodedBrand.trim().toUpperCase();

        let response = await fetch(`${apiBase}/personnel`, { headers: getAuthHeaders() });
        let data = [];

        if (response.ok) {
          const allPersonnel = await response.json();
          data = allPersonnel.filter((emp: Employee) => {
            if (!emp.carte) return false;
            const empCarte = emp.carte.trim().toUpperCase();

            if (targetBrand.includes('FERRERO') && empCarte.includes('FERRERO')) return true;
            if (targetBrand.includes('COCA') && empCarte.includes('COCA')) return true;
            if (targetBrand.includes('WALL') && empCarte.includes('WALL')) return true;

            return empCarte === targetBrand;
          });
        }

        setBrandEmployees(data.filter((emp: Employee) => emp.actif));
      } catch (error) {
        console.error("Erreur récupération du personnel:", error);
        toast.error("Impossible de charger les employés");
      } finally {
        setLoading(false);
      }
    };
    fetchEmployeesByBrand();
  }, [decodedBrand]);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'MAD' }).format(value);

  const handleCalculateAll = async () => {
    setIsCalculating(true);
    try {
      if (!constraints || constraints.length === 0) {
        toast.error("Aucune règle de calcul disponible dans le contexte.");
        setIsCalculating(false);
        return;
      }

      const activeConstraints = constraints.filter(c => {
        if (c.actif === false || c.actif === 0) return false;
        const dbCarte = (c.carte || '').toUpperCase();
        const urlBrand = (decodedBrand || '').toUpperCase();
        if (urlBrand.includes('COCA') && dbCarte.includes('COCA')) return true;
        if (urlBrand.includes('FERRERO') && dbCarte.includes('FERRERO')) return true;
        if (urlBrand.includes('WALL') && dbCarte.includes('WALL')) return true;
        return dbCarte.replace(/[_ \-']/g, '') === urlBrand.replace(/[_ \-']/g, '');
      });

      if (activeConstraints.length === 0) {
        toast.warning(`Aucune règle trouvée pour la marque : ${decodedBrand}`);
        setIsCalculating(false);
        return;
      }

      const brandHistory = history.filter(h => (h.carte || '').toUpperCase() === decodedBrand.toUpperCase());
      const uniqueBatches = new Set(brandHistory.map(h => h.batchId).filter(Boolean));
      const simNumber = uniqueBatches.size + 1;

      const currentBatchId = crypto.randomUUID ? crypto.randomUUID() : Date.now().toString();
      const simulationName = `Simulation ${simNumber} - ${decodedBrand}`;

      const urlBrand = decodedBrand.toUpperCase();
      const matchesBrand = (dbCarte: string | undefined) => {
        const carteUp = (dbCarte || '').toUpperCase();
        if (urlBrand.includes('FERRERO') && carteUp.includes('FERRERO')) return true;
        if (urlBrand.includes('COCA') && carteUp.includes('COCA')) return true;
        if (urlBrand.includes('WALL') && carteUp.includes('WALL')) return true;
        return carteUp === urlBrand;
      };

      const [objectifsRes, realisationsRes, triageRes, volumesRes] = await Promise.allSettled([
        importApi.getObjectifsByPeriode(periodeKey),
        importApi.getRealisationsByPeriode(periodeKey),
        importApi.getTriageByPeriode(periodeKey),
        importApi.getVolumesByPeriode(periodeKey),
      ]);

      const missingSources: string[] = [];
      const fetchedObjectifs = objectifsRes.status === 'fulfilled' ? objectifsRes.value.filter(o => matchesBrand(o.carte)) : [];
      if (objectifsRes.status === 'rejected') missingSources.push('Objectifs');
      const realPayload = realisationsRes.status === 'fulfilled' ? realisationsRes.value.filter(r => matchesBrand(r.carte)) : [];
      if (realisationsRes.status === 'rejected') missingSources.push('Réalisations');
      const triPayload = triageRes.status === 'fulfilled' ? triageRes.value : [];
      if (triageRes.status === 'rejected') missingSources.push('Triage');
      const volPayload = volumesRes.status === 'fulfilled' ? volumesRes.value : [];
      if (volumesRes.status === 'rejected') missingSources.push('Volumes');

      if (missingSources.length > 0) {
        toast.error(`Impossible de récupérer : ${missingSources.join(', ')} — calcul annulé.`);
        setIsCalculating(false);
        return;
      }

      if (fetchedObjectifs.length === 0 || realPayload.length === 0) {
        toast.warning(`Aucune donnée importée pour ${periodeLabel} / ${decodedBrand} — le calcul utilisera 0 pour les employés concernés.`);
      }

      const brandResults = brandEmployees.map(employee => {
        let commissions = 0;
        let bonuses = 0;
        const details: CalculationDetail[] = [];

        const empMatricule = String(employee.matricule || employee.id).trim().toUpperCase();

        const empObjectif = fetchedObjectifs.find((o) => String(o.matricule).trim().toUpperCase() === empMatricule) || { target: 0 };
        const empRealisation = realPayload.find((r) => String(r.matricule).trim().toUpperCase() === empMatricule) || { caRealise: 0 };
        const empTriage = triPayload.find((tr) => String(tr.matricule).trim().toUpperCase() === empMatricule) || { note: 0 };

        const empVolumeRecords = volPayload.filter((v) => String(v.matricule).trim().toUpperCase() === empMatricule);

        const roleSegments: Record<string, { volume: number }> = {};
        let totalVolume = 0;
        let globalTauxRetour = 0;

        if (empVolumeRecords.length > 0) {
          const first = empVolumeRecords[0];
          globalTauxRetour = first.volumeCharge > 0 ? (first.volumeRetourne / first.volumeCharge) * 100 : 0;

          empVolumeRecords.forEach((record) => {
            let dailyRole = String(employee.role || '').trim().toUpperCase();
            const dailyVol = (record.volumeCharge || 0) - (record.volumeRetourne || 0);

            const dailyPresence = presenceRecords.find(p => p.date === record.date);

            if (dailyPresence) {
              const mat1 = (dailyPresence.livreur1Matricule || '').trim().toUpperCase();
              const mat2 = (dailyPresence.livreur2Matricule || '').trim().toUpperCase();
              const mat3 = (dailyPresence.livreur3Matricule || '').trim().toUpperCase();

              if (empMatricule === mat1) {
                dailyRole = 'LIVREUR';
              } else if (empMatricule === mat2 || empMatricule === mat3) {
                dailyRole = 'AIDE LIVREUR';
              }

              if (decodedBrand.toUpperCase().includes('COCA') && dailyPresence.canal?.trim().toUpperCase() === 'GMS') {
                dailyRole = `${dailyRole} GMS`;
              }
            }

            if (!roleSegments[dailyRole]) {
              roleSegments[dailyRole] = { volume: 0 };
            }
            roleSegments[dailyRole].volume += dailyVol;
            totalVolume += dailyVol;
          });
        } else {
          let fallbackRole = String(employee.role || '').trim().toUpperCase();

          if (decodedBrand.toUpperCase().includes('COCA')) {
            const hasGmsPresenceThisMonth = presenceRecords.some(p => {
              const mat1 = (p.livreur1Matricule || '').trim().toUpperCase();
              const mat2 = (p.livreur2Matricule || '').trim().toUpperCase();
              const mat3 = (p.livreur3Matricule || '').trim().toUpperCase();
              return p.canal?.trim().toUpperCase() === 'GMS' && (empMatricule === mat1 || empMatricule === mat2 || empMatricule === mat3);
            });
            if (hasGmsPresenceThisMonth) {
              fallbackRole = `${fallbackRole} GMS`;
            }
          }

          roleSegments[fallbackRole] = { volume: 0 };
        }

        const tauxRea = empObjectif.target > 0 ? (empRealisation.caRealise / empObjectif.target) * 100 : 0;
        const CONTRAT = employee.natureContrat?.toUpperCase().includes('INT') ? 'INTERIM' : 'CDI';

        const metrics = {
          joursTravailles: 22,
          volumeDistribue: totalVolume,
          tauxRetour: globalTauxRetour,
          tauxTriage: empTriage.note,
          caRealise: empRealisation.caRealise,
          tauxRealisation: tauxRea,
          tauxRealisationGlobal: 105.0
        };

        activeConstraints.forEach(constraint => {
          const nomRegle = String(constraint.name || constraint.nom || 'Règle inconnue').toUpperCase();
          const conditionStr = String(constraint.condition || '').toUpperCase();
          const typeValue = String(constraint.typeValeur || (constraint as any).type_valeur || (constraint as any).type || (constraint as any).valueType || '').toUpperCase();
          const valeur = Number(constraint.valeur !== undefined ? constraint.valeur : (constraint as any).value || 0);
          const urlBrandUp = (decodedBrand || '').toUpperCase();

          let jsCondition = conditionStr
            .replace(/\bAND\b/g, '&&')
            .replace(/\bOR\b/g, '||')
            .replace(/ROLE LIKE 'AIDE LIVREUR%'/g, "ROLE.includes('AIDE LIVREUR')")
            .replace(/ROLE ===? 'AIDE LIVREUR 1'/g, "ROLE.includes('AIDE LIVREUR')")
            .replace(/ROLE ===? 'AIDE LIVREUR 2'/g, "ROLE.includes('AIDE LIVREUR')")
            .replace(/ROLE ===? 'AIDE LIVREUR'/g, "ROLE.includes('AIDE LIVREUR')")
            .replace(/==+/g, "===");

          const isVolumeRule = typeValue.includes('UNITE') || typeValue.includes('UNITÉ') || typeValue.includes('UNIT') || (valeur < 1 && !typeValue.includes('POURCENTAGE'));

          let amountGeneratedForRule = 0;
          let ruleApplied = false;

          if (isVolumeRule) {
            Object.entries(roleSegments).forEach(([roleJoue, stats]) => {
              let conditionVerifiee = false;
              try {
                const evaluator = new Function(
                  'ROLE', 'CONTRAT', 'JOURS_TRAVAILLES', 'TAUX_RETOUR', 'TAUX_TRIAGE', 'TAUX_REALISATION', 'TAUX_REALISATION_GLOBAL',
                  `return ${jsCondition};`
                );
                conditionVerifiee = evaluator(
                  roleJoue, CONTRAT, metrics.joursTravailles, metrics.tauxRetour,
                  metrics.tauxTriage, metrics.tauxRealisation, metrics.tauxRealisationGlobal
                );
              } catch (e) {}

              if (conditionVerifiee && stats.volume > 0) {
                const segmentAmount = valeur * stats.volume;
                commissions += segmentAmount;
                amountGeneratedForRule += segmentAmount;
                ruleApplied = true;
              }
            });
          } else {
            let conditionVerifiee = false;
            for (const roleJoue of Object.keys(roleSegments)) {
              try {
                const evaluator = new Function(
                  'ROLE', 'CONTRAT', 'JOURS_TRAVAILLES', 'TAUX_RETOUR', 'TAUX_TRIAGE', 'TAUX_REALISATION', 'TAUX_REALISATION_GLOBAL',
                  `return ${jsCondition};`
                );
                if (evaluator(
                    roleJoue, CONTRAT, metrics.joursTravailles, metrics.tauxRetour,
                    metrics.tauxTriage, metrics.tauxRealisation, metrics.tauxRealisationGlobal
                )) {
                  conditionVerifiee = true;
                  break;
                }
              } catch (e) {}
            }

            if (conditionVerifiee) {
              if (typeValue.includes('POURCENTAGE') || (valeur <= 100 && !urlBrandUp.includes('COCA'))) {
                amountGeneratedForRule = (valeur / 100) * metrics.caRealise;
                commissions += amountGeneratedForRule;
              } else {
                amountGeneratedForRule = valeur;
                bonuses += amountGeneratedForRule;
              }
              ruleApplied = true;
            }
          }

          if (ruleApplied && amountGeneratedForRule > 0) {
            details.push({
              name: nomRegle,
              amount: amountGeneratedForRule,
              type: (typeValue.includes('FIXE') || (!isVolumeRule && !typeValue.includes('POURCENTAGE') && valeur > 100)) ? 'bonus' : 'commission'
            });
          }
        });

        const finalSalary = commissions + bonuses;

        addCalculation({
          employeeName: `${employee.prenom} ${employee.nom}`,
          employeeRole: employee.role,
          totalSales: metrics.caRealise,
          deliveries: metrics.volumeDistribue,
          returns: metrics.tauxRetour,
          commissions,
          bonuses,
          finalSalary,
          constraintsApplied: details.map(d => d.name),
          details,
          carte: decodedBrand,
          matricule: employee.matricule || employee.id,
          periode: periodeKey,
          forcerRecalcul: true,
          batchId: currentBatchId,
          simulationName: simulationName,
        });

        return { employee, commissions, bonuses, finalSalary, details };
      });

      setResults(brandResults);
      toast.success(`${simulationName} exécutée avec succès !`);
    } catch (error) {
      console.error("Erreur générale calcul:", error);
      toast.error("Une erreur est survenue lors de l'exécution du calcul.");
    } finally {
      setIsCalculating(false);
    }
  };

  return (
    <div className="abc-page-inner abc-stack-lg">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-orange-100 rounded-xl text-orange-600">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Carte {decodedBrand}</h1>
            <p className="text-gray-600">Gestion et calcul groupé pour le personnel {decodedBrand} — période : {periodeLabel}.</p>
          </div>
        </div>
        <button
          onClick={() => navigate('/calculation')}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> {b.back}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex flex-col h-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-gray-900">{b.teamMembers}</h2>
              <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-bold rounded-full uppercase">
                {brandEmployees.length} {b.active}
              </span>
            </div>

            {loading ? (
              <div className="py-10 text-center text-gray-500">Chargement...</div>
            ) : (
              <div className="grid gap-3 flex-1 overflow-y-auto pr-2 mb-6">
                {brandEmployees.map(emp => (
                  <div key={emp.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-orange-200 transition-colors">
                    <div>
                      <div className="font-bold text-gray-900">{emp.prenom} {emp.nom}</div>
                      <div className="text-xs text-gray-500 uppercase font-semibold mt-1">
                        {emp.matricule || emp.id} • {emp.role} • {emp.natureContrat}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={handleCalculateAll}
              disabled={loading || brandEmployees.length === 0 || isCalculating}
              className="w-full flex items-center justify-center gap-2 bg-orange-500 text-white py-3 px-4 rounded-lg font-bold hover:bg-orange-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isCalculating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Calculator className="w-5 h-5" />}
              {isCalculating ? b.calculating : b.launchBtn}
            </button>
          </div>
        </div>

        <div className="lg:col-span-2">
          {results.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 h-full flex flex-col items-center justify-center text-center">
              <Calculator className="w-16 h-16 text-gray-200 mb-4" />
              <h3 className="text-lg font-bold text-gray-900 mb-2">{b.noCalc}</h3>
              <p className="text-gray-500 max-w-sm">{b.noCalcSub}</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 h-full flex flex-col">
              <div className="flex items-center justify-between border-b border-gray-200 mb-6">
                <div className="flex gap-6">
                  <button
                    onClick={() => setActiveTab('detail')}
                    className={`pb-3 border-b-2 font-medium transition-colors ${activeTab === 'detail' ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                  >
                    {b.detailTab}
                  </button>
                  <button
                    onClick={() => setActiveTab('recap')}
                    className={`pb-3 border-b-2 font-medium transition-colors ${activeTab === 'recap' ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                  >
                    {b.recapTab}
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto pr-2">
                {activeTab === 'detail' ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    {results.map((res, idx) => (
                      <div key={idx} className="bg-white border border-gray-100 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                        <div className="mb-4">
                          <h4 className="font-bold text-gray-900 text-lg">{res.employee.prenom} {res.employee.nom}</h4>
                          <p className="text-xs text-gray-500 mt-1 uppercase font-semibold">{res.employee.role} • {res.employee.natureContrat}</p>
                        </div>
                        <div className="text-3xl font-black text-orange-500 mb-6">
                          {formatCurrency(res.finalSalary)}
                        </div>
                        <div className="grid grid-cols-2 gap-3 w-full">
                          <div className="bg-green-50 p-3 rounded-xl border border-green-100 text-center">
                            <p className="text-[10px] text-green-600 uppercase font-bold mb-1">{b.commissions}</p>
                            <p className="font-bold text-green-700 text-sm">{formatCurrency(res.commissions)}</p>
                          </div>
                          <div className="bg-green-50 p-3 rounded-xl border border-green-100 text-center">
                            <p className="text-[10px] text-green-600 uppercase font-bold mb-1">{b.bonus}</p>
                            <p className="font-bold text-green-700 text-sm">{formatCurrency(res.bonuses)}</p>
                          </div>
                        </div>

                        {res.details && res.details.length > 0 && (
                          <div className="mt-4 pt-4 border-t border-gray-100">
                            <h5 className="text-xs font-bold text-gray-500 uppercase mb-3">Règles appliquées</h5>
                            <ul className="space-y-2">
                              {res.details.map((detail, dIdx) => (
                                <li key={dIdx} className="flex items-center justify-between text-sm">
                                  <span className="text-gray-700 flex-1 truncate pr-2" title={detail.name}>
                                    • {detail.name}
                                  </span>
                                  <span className="font-semibold whitespace-nowrap text-green-600">
                                    +{formatCurrency(detail.amount)}
                                  </span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-gray-200">
                    <table className="w-full text-left border-collapse whitespace-nowrap">
                      <thead className="bg-gray-50">
                        <tr className="border-b border-gray-200 text-xs text-gray-600 uppercase tracking-wider">
                          <th className="p-4 font-semibold">{b.colEmployee}</th>
                          <th className="p-4 font-semibold">{b.colComm}</th>
                          <th className="p-4 font-semibold">{b.colBonus}</th>
                          <th className="p-4 font-bold text-orange-600">{b.colNet}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {results.map((r, idx) => (
                          <tr key={idx} className="hover:bg-gray-50 transition-colors text-sm">
                            <td className="p-4 font-medium text-gray-900">{r.employee.prenom} {r.employee.nom}</td>
                            <td className="p-4 text-green-600 font-medium">+{formatCurrency(r.commissions)}</td>
                            <td className="p-4 text-green-600 font-medium">+{formatCurrency(r.bonuses)}</td>
                            <td className="p-4 font-bold text-orange-600">{formatCurrency(r.finalSalary)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-orange-50 font-bold border-t-2 border-orange-200">
                        <tr>
                          <td className="p-4 text-orange-900">{b.teamTotal}</td>
                          <td className="p-4 text-green-700">+{formatCurrency(results.reduce((acc, r) => acc + r.commissions, 0))}</td>
                          <td className="p-4 text-green-700">+{formatCurrency(results.reduce((acc, r) => acc + r.bonuses, 0))}</td>
                          <td className="p-4 text-orange-700 text-lg">{formatCurrency(results.reduce((acc, r) => acc + r.finalSalary, 0))}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Vérifier le build**

Run: `cd C:/Projets/RH-Commission/frontend && npx vite build`
Expected: `✓ built in ...` sans erreur.

- [ ] **Step 3: Vérification manuelle en navigateur (bout-en-bout)**

1. Sur la page Calcul, sélectionner un mois avec des données déjà importées (Task 3, étape 3), cliquer sur la carte "Coca Cola".
2. Vérifier l'en-tête de la page Carte affiche bien "période : {mois} {année}" correspondant au mois choisi.
3. Cliquer "Lancer le calcul groupé" → vérifier que les montants affichés sont cohérents avec les données importées (pas de zéros inattendus).
4. Retourner à la page Calcul, changer le mois pour un mois **sans données**, recliquer sur "Coca Cola", relancer le calcul → un toast d'avertissement doit apparaître ("Aucune donnée importée pour ... — le calcul utilisera 0...") et les montants doivent être à 0.
5. Ouvrir les DevTools → Application → Local Storage : confirmer qu'aucune clé `simulation_metrics` n'est créée/lue après ce test (preuve que le localStorage n'est plus utilisé).
6. Aller sur la page Historique, confirmer que le nouveau calcul apparaît avec la bonne période.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/app/pages/BrandCalculationPage.tsx
git commit -m "BrandCalculationPage: calcul base sur la periode selectionnee via backend, plus de localStorage"
```

---

### Task 5: Vérification bout-en-bout finale + documentation

**Files:**
- Modify: `docs/ai-memory/LOG.md`

**Interfaces:**
- Aucune (tâche de clôture — vérification manuelle + documentation).

- [ ] **Step 1: Scénario complet en navigateur réel**

1. Se connecter en ADV.
2. Sur la page Calcul, sélectionner "Mai 2026", importer Objectifs + Réalisations + Triage + Volumes pour ce mois.
3. Lancer le calcul pour Coca Cola, vérifier les résultats, valider dans l'Historique.
4. Revenir sur la page Calcul, changer vers "Juin 2026" (aucune donnée) → panneau de statut doit afficher 0 partout et les cartes produit des badges à 0.
5. Fermer complètement l'onglet, en rouvrir un nouveau, se reconnecter, retourner sur "Mai 2026" → le panneau de statut doit toujours refléter les données importées à l'étape 2 (persistance confirmée, indépendante de la session navigateur).
6. Relancer le calcul Coca Cola pour "Mai 2026" sans rien réimporter → doit utiliser exactement les mêmes données qu'à l'étape 3 (pas de données fantômes, pas de divergence).

- [ ] **Step 2: Mettre à jour `docs/ai-memory/LOG.md`**

Ajouter une entrée en haut du fichier (après la ligne `---` initiale) résumant : les 3 problèmes corrigés (période statique, absence de persistance pour Volumes, réutilisation silencieuse de localStorage), les fichiers backend/frontend touchés, et confirmation du test bout-en-bout ci-dessus.

- [ ] **Step 3: Commit final**

```bash
git add docs/ai-memory/LOG.md
git commit -m "Documente la refonte du pipeline de donnees de la page Calcul"
```

---

## Self-Review Notes

- **Couverture du spec** : sélecteur de période dynamique (Task 3), persistance Volumes (Task 1), panneau de statut basé sur la base (Task 3), calcul basé sur la période sélectionnée pour les 4 sources y compris le bug Objectifs découvert pendant l'analyse (Task 4), retrait des chiffres factices sur les cartes produit (Task 3), retrait complet de `localStorage` (Task 3 + Task 4) — tout couvert.
- **Cohérence des types** : `ApiVolume.date` (string ISO) traverse Task 2 → Task 3 (construit à l'import) → Task 4 (consommé au calcul) sans changement de forme. `periodeKey`/`periodeLabel` nommés identiquement dans Task 3 et Task 4.
- **Pas de placeholder** : chaque étape contient le code complet, aucune section "TODO" ou "similaire à la tâche N".
