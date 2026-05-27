package com.abcdis.presence.controller;

import com.abcdis.presence.model.Voyage;
import com.abcdis.presence.service.VoyageService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/voyages")
@RequiredArgsConstructor
public class VoyageController {

    private final VoyageService voyageService;

    @GetMapping("/fiche/{ficheId}")
    public ResponseEntity<List<Voyage>> listerParFiche(@PathVariable Long ficheId) {
        return ResponseEntity.ok(voyageService.listerParFiche(ficheId));
    }

    @PostMapping("/fiche/{ficheId}")
    public ResponseEntity<Voyage> ajouterVoyage(@PathVariable Long ficheId,
                                                 @RequestBody Voyage voyage) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(voyageService.ajouterVoyage(ficheId, voyage));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Voyage> modifierVoyage(@PathVariable Long id,
                                                  @RequestBody Voyage voyage) {
        return ResponseEntity.ok(voyageService.modifierVoyage(id, voyage));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> supprimerVoyage(@PathVariable Long id) {
        voyageService.supprimerVoyage(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/fiche/{ficheId}/total-ventes")
    public ResponseEntity<Double> getTotalVentes(@PathVariable Long ficheId) {
        return ResponseEntity.ok(voyageService.getTotalVentesFiche(ficheId));
    }
}
