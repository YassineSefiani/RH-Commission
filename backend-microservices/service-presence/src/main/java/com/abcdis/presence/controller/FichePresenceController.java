package com.abcdis.presence.controller;

import com.abcdis.presence.model.FichePresence;
import com.abcdis.presence.service.FichePresenceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/fiches-presence")
@RequiredArgsConstructor
public class FichePresenceController {

    private final FichePresenceService ficheService;

    @GetMapping
    public ResponseEntity<List<FichePresence>> listerToutes() {
        return ResponseEntity.ok(ficheService.listerToutes());
    }

    @GetMapping("/date/{date}")
    public ResponseEntity<List<FichePresence>> listerParDate(
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(ficheService.listerParDate(date));
    }

    @GetMapping("/periode")
    public ResponseEntity<List<FichePresence>> listerParPeriode(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate debut,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate fin) {
        return ResponseEntity.ok(ficheService.listerParPeriode(debut, fin));
    }

    @GetMapping("/livreur/{nom}")
    public ResponseEntity<List<FichePresence>> listerParLivreur(@PathVariable String nom) {
        return ResponseEntity.ok(ficheService.listerParLivreur(nom));
    }

    @GetMapping("/mois")
    public ResponseEntity<List<FichePresence>> listerParMoisAnnee(@RequestParam int mois,
                                                                    @RequestParam int annee) {
        return ResponseEntity.ok(ficheService.listerParMoisAnnee(mois, annee));
    }

    @GetMapping("/{id}")
    public ResponseEntity<FichePresence> trouverParId(@PathVariable Long id) {
        return ResponseEntity.ok(ficheService.trouverParId(id));
    }

    @PostMapping
    public ResponseEntity<FichePresence> creer(@Valid @RequestBody FichePresence fiche) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ficheService.creer(fiche));
    }

    @PutMapping("/{id}")
    public ResponseEntity<FichePresence> modifier(@PathVariable Long id,
                                                   @RequestBody FichePresence fiche) {
        return ResponseEntity.ok(ficheService.modifier(id, fiche));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> supprimer(@PathVariable Long id) {
        ficheService.supprimer(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/statistiques")
    public ResponseEntity<Map<String, Object>> obtenirStatistiques(@RequestParam int mois,
                                                                     @RequestParam int annee) {
        return ResponseEntity.ok(ficheService.obtenirStatistiques(mois, annee));
    }
}
