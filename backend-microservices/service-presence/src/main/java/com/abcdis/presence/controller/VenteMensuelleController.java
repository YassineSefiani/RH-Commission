package com.abcdis.presence.controller;

import com.abcdis.presence.model.VenteMensuelle;
import com.abcdis.presence.service.VenteMensuelleService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/ventes")
@RequiredArgsConstructor
public class VenteMensuelleController {

    private final VenteMensuelleService venteService;

    @GetMapping("/mois")
    public ResponseEntity<List<VenteMensuelle>> listerParMoisAnnee(@RequestParam Integer mois,
                                                                     @RequestParam Integer annee) {
        return ResponseEntity.ok(venteService.listerParMoisAnnee(mois, annee));
    }

    @GetMapping("/carte/{carte}")
    public ResponseEntity<List<VenteMensuelle>> listerParCarte(@PathVariable String carte) {
        return ResponseEntity.ok(venteService.listerParCarte(carte));
    }

    @GetMapping("/employe/{nom}")
    public ResponseEntity<List<VenteMensuelle>> listerParEmploye(@PathVariable String nom) {
        return ResponseEntity.ok(venteService.listerParEmploye(nom));
    }

    @PostMapping
    public ResponseEntity<VenteMensuelle> enregistrer(@RequestBody VenteMensuelle vente) {
        return ResponseEntity.status(HttpStatus.CREATED).body(venteService.enregistrer(vente));
    }

    @PutMapping("/{id}")
    public ResponseEntity<VenteMensuelle> modifier(@PathVariable Long id,
                                                    @RequestBody VenteMensuelle vente) {
        return ResponseEntity.ok(venteService.modifier(id, vente));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> supprimer(@PathVariable Long id) {
        venteService.supprimer(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/total-annee")
    public ResponseEntity<Double> getTotalVentesAnnee(@RequestParam Integer annee) {
        return ResponseEntity.ok(venteService.getTotalVentesAnnee(annee));
    }
}
