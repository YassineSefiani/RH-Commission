package com.abcdis.hrapp.controller;

import com.abcdis.hrapp.model.VenteMensuelle;
import com.abcdis.hrapp.service.VenteMensuelleService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/ventes-mensuelles")
@CrossOrigin(origins = "http://localhost:5173")
public class VenteMensuelleController {
    
    @Autowired
    private VenteMensuelleService venteMensuelleService;
    
    // GET /api/ventes-mensuelles - Récupérer toutes les ventes
    @GetMapping
    public List<VenteMensuelle> getAllVentes() {
        return venteMensuelleService.getAllVentes();
    }
    
    // GET /api/ventes-mensuelles/{id} - Récupérer une vente par ID
    @GetMapping("/{id}")
    public ResponseEntity<VenteMensuelle> getVenteById(@PathVariable Long id) {
        Optional<VenteMensuelle> vente = venteMensuelleService.getVenteById(id);
        return vente.map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    // GET /api/ventes-mensuelles/date/{date} - Récupérer une vente par date
    @GetMapping("/date/{date}")
    public ResponseEntity<VenteMensuelle> getVenteByDate(
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        Optional<VenteMensuelle> vente = venteMensuelleService.getVenteByDate(date);
        return vente.map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    // GET /api/ventes-mensuelles/range - Récupérer les ventes entre deux dates
    @GetMapping("/range")
    public ResponseEntity<List<VenteMensuelle>> getVentesByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        List<VenteMensuelle> ventes = venteMensuelleService.getVentesByDateRange(startDate, endDate);
        return ResponseEntity.ok(ventes);
    }
    
    // POST /api/ventes-mensuelles - Créer une nouvelle vente
    @PostMapping
    public ResponseEntity<VenteMensuelle> createVente(@RequestBody VenteMensuelle vente) {
        VenteMensuelle createdVente = venteMensuelleService.createVente(vente);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdVente);
    }
    
    // PUT /api/ventes-mensuelles/{id} - Mettre à jour une vente
    @PutMapping("/{id}")
    public ResponseEntity<VenteMensuelle> updateVente(@PathVariable Long id, @RequestBody VenteMensuelle venteDetails) {
        try {
            VenteMensuelle updatedVente = venteMensuelleService.updateVente(id, venteDetails);
            return ResponseEntity.ok(updatedVente);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
    
    // DELETE /api/ventes-mensuelles/{id} - Supprimer une vente
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteVente(@PathVariable Long id) {
        try {
            venteMensuelleService.deleteVente(id);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
    
    // DELETE /api/ventes-mensuelles - Supprimer toutes les ventes
    @DeleteMapping
    public ResponseEntity<Void> deleteAllVentes() {
        venteMensuelleService.deleteAllVentes();
        return ResponseEntity.noContent().build();
    }
}
