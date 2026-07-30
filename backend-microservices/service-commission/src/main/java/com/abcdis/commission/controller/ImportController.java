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
