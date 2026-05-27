package com.abcdis.personnel.controller;

import com.abcdis.personnel.dto.PersonnelStatsDTO;
import com.abcdis.personnel.model.Personnel;
import com.abcdis.personnel.service.PersonnelService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * API REST pour la gestion du personnel.
 * Toutes les erreurs sont gérées par GlobalExceptionHandler — zéro try-catch ici.
 */
@RestController
@RequestMapping("/api/personnel")
@RequiredArgsConstructor
public class PersonnelController {

    private final PersonnelService personnelService;

    @GetMapping
    public ResponseEntity<List<Personnel>> listerTous() {
        return ResponseEntity.ok(personnelService.listerTous());
    }

    @GetMapping("/actifs")
    public ResponseEntity<List<Personnel>> listerActifs() {
        return ResponseEntity.ok(personnelService.listerActifs());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Personnel> trouverParId(@PathVariable Long id) {
        return personnelService.trouverParId(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/matricule/{matricule}")
    public ResponseEntity<Personnel> trouverParMatricule(@PathVariable String matricule) {
        return personnelService.trouverParMatricule(matricule)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/carte/{carte}")
    public ResponseEntity<List<Personnel>> trouverParCarte(@PathVariable String carte) {
        return ResponseEntity.ok(personnelService.trouverParCarte(carte));
    }

    @GetMapping("/ville/{ville}")
    public ResponseEntity<List<Personnel>> trouverParVille(@PathVariable String ville) {
        return ResponseEntity.ok(personnelService.trouverParVille(ville));
    }

    @GetMapping("/contrat/{type}")
    public ResponseEntity<List<Personnel>> trouverParContrat(@PathVariable String type) {
        return ResponseEntity.ok(personnelService.trouverParContrat(type));
    }

    @GetMapping("/search")
    public ResponseEntity<List<Personnel>> rechercher(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String nom) {
        // Support ?q= (convention API) et ?nom= (convention frontend)
        String terme = q != null ? q : (nom != null ? nom : "");
        return ResponseEntity.ok(personnelService.rechercherParNom(terme));
    }

    @GetMapping("/stats")
    public ResponseEntity<PersonnelStatsDTO> statistiques() {
        return ResponseEntity.ok(personnelService.obtenirStatistiques());
    }

    @PostMapping
    public ResponseEntity<Personnel> creer(@Valid @RequestBody Personnel personnel) {
        return ResponseEntity.status(HttpStatus.CREATED).body(personnelService.creer(personnel));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Personnel> modifier(@PathVariable Long id,
                                              @RequestBody Personnel modifications) {
        return ResponseEntity.ok(personnelService.modifier(id, modifications));
    }

    @PutMapping("/{id}/basculer")
    public ResponseEntity<Personnel> basculerStatut(@PathVariable Long id) {
        return ResponseEntity.ok(personnelService.basculerStatut(id));
    }

    /** Alias frontend : PATCH /toggle identique à PUT /basculer */
    @PatchMapping("/{id}/toggle")
    public ResponseEntity<Personnel> toggleStatut(@PathVariable Long id) {
        return ResponseEntity.ok(personnelService.basculerStatut(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> supprimer(@PathVariable Long id) {
        personnelService.supprimer(id);
        return ResponseEntity.noContent().build();
    }
}
