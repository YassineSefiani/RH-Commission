package com.abcdis.commission.controller;

import com.abcdis.commission.model.Contrainte;
import com.abcdis.commission.service.ContrainteService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/contraintes")
@RequiredArgsConstructor
public class ContrainteController {

    private final ContrainteService contrainteService;

    @GetMapping
    public ResponseEntity<List<Contrainte>> listerToutes() {
        return ResponseEntity.ok(contrainteService.listerToutes());
    }

    @GetMapping("/carte/{carte}")
    public ResponseEntity<List<Contrainte>> listerParCarte(@PathVariable String carte) {
        return ResponseEntity.ok(contrainteService.listerParCarte(carte));
    }

    @GetMapping("/actives")
    public ResponseEntity<List<Contrainte>> listerActives() {
        return ResponseEntity.ok(contrainteService.listerActives());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Contrainte> trouverParId(@PathVariable Long id) {
        return ResponseEntity.ok(contrainteService.trouverParId(id));
    }

    @PostMapping
    public ResponseEntity<Contrainte> creer(@Valid @RequestBody Contrainte contrainte) {
        return ResponseEntity.status(HttpStatus.CREATED).body(contrainteService.creer(contrainte));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Contrainte> modifier(@PathVariable Long id,
                                               @Valid @RequestBody Contrainte contrainte) {
        return ResponseEntity.ok(contrainteService.modifier(id, contrainte));
    }

    @PatchMapping("/{id}/statut")
    public ResponseEntity<Contrainte> basculerStatut(@PathVariable Long id) {
        return ResponseEntity.ok(contrainteService.basculerStatut(id));
    }

    /** Alias frontend : PATCH /toggle identique à PATCH /statut */
    @PatchMapping("/{id}/toggle")
    public ResponseEntity<Contrainte> toggleStatut(@PathVariable Long id) {
        return ResponseEntity.ok(contrainteService.basculerStatut(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> supprimer(@PathVariable Long id) {
        contrainteService.supprimer(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/stats")
    public ResponseEntity<Long> obtenirStats() {
        return ResponseEntity.ok(contrainteService.compterActives());
    }
}
