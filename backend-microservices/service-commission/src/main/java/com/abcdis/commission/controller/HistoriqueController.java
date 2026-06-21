package com.abcdis.commission.controller;

import com.abcdis.commission.dto.HistoriqueCreationRequest;
import com.abcdis.commission.model.HistoriqueCalcul;
import com.abcdis.commission.service.HistoriqueService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/historique")
@RequiredArgsConstructor
public class HistoriqueController {

    // Injecte HistoriqueService — plus de couplage avec CalculService
    private final HistoriqueService historiqueService;

    @GetMapping
    public ResponseEntity<List<HistoriqueCalcul>> listerHistorique() {
        return ResponseEntity.ok(historiqueService.listerHistorique());
    }

    @GetMapping("/rechercher")
    public ResponseEntity<List<HistoriqueCalcul>> rechercherParNom(@RequestParam String nom) {
        return ResponseEntity.ok(historiqueService.rechercherParNom(nom));
    }

    @GetMapping("/filtrer")
    public ResponseEntity<List<HistoriqueCalcul>> filtrerParPeriode(@RequestParam Integer mois,
                                                                     @RequestParam Integer annee) {
        return ResponseEntity.ok(historiqueService.filtrerParMoisAnnee(mois, annee));
    }

    @GetMapping("/{id}")
    public ResponseEntity<HistoriqueCalcul> trouverParId(@PathVariable Long id) {
        return ResponseEntity.ok(historiqueService.trouverParId(id));
    }

    @GetMapping("/statistiques")
    public ResponseEntity<Map<String, Object>> obtenirStatistiques() {
        return ResponseEntity.ok(historiqueService.obtenirStatistiques());
    }

    /** Frontend POSTe les résultats de calcul client-side ici */
    @PostMapping
    public ResponseEntity<HistoriqueCalcul> enregistrer(@RequestBody HistoriqueCreationRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(historiqueService.enregistrer(request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> supprimerCalcul(@PathVariable Long id) {
        historiqueService.supprimerCalcul(id);
        return ResponseEntity.noContent().build();
    }

    /** Alias : DELETE /api/history (sans ID) → vide tout l'historique */
    @DeleteMapping
    public ResponseEntity<Void> viderHistoriqueAlias() {
        historiqueService.viderHistorique();
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/vider")
    public ResponseEntity<Void> viderHistorique() {
        historiqueService.viderHistorique();
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{id}/archive")
    public ResponseEntity<Void> archiverCalcul(@PathVariable Long id) {
        historiqueService.archiverCalcul(id);
        return ResponseEntity.ok().build();
    }
}
