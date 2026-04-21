package com.abcdis.hrapp.controller;

import com.abcdis.hrapp.model.Voyage;
import com.abcdis.hrapp.service.VoyageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/voyages")
@CrossOrigin(origins = "http://localhost:5173")
public class VoyageController {
    
    @Autowired
    private VoyageService voyageService;
    
    // GET /api/voyages - Récupérer tous les voyages
    @GetMapping
    public List<Voyage> getAllVoyages() {
        return voyageService.getAllVoyages();
    }
    
    // GET /api/voyages/{id} - Récupérer un voyage par ID
    @GetMapping("/{id}")
    public ResponseEntity<Voyage> getVoyageById(@PathVariable Long id) {
        Optional<Voyage> voyage = voyageService.getVoyageById(id);
        return voyage.map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    // GET /api/voyages/numero/{numeroVoyage} - Récupérer par numéro de voyage
    @GetMapping("/numero/{numeroVoyage}")
    public ResponseEntity<Voyage> getVoyageByNumeroVoyage(@PathVariable String numeroVoyage) {
        Optional<Voyage> voyage = voyageService.getVoyageByNumeroVoyage(numeroVoyage);
        return voyage.map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    // GET /api/voyages/date/{date} - Récupérer les voyages d'une date
    @GetMapping("/date/{date}")
    public ResponseEntity<List<Voyage>> getVoyagesByDate(
            @PathVariable @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        List<Voyage> voyages = voyageService.getVoyagesByDate(date);
        return ResponseEntity.ok(voyages);
    }
    
    // GET /api/voyages/camion/{camion} - Récupérer les voyages d'un camion
    @GetMapping("/camion/{camion}")
    public ResponseEntity<List<Voyage>> getVoyagesByCamion(@PathVariable String camion) {
        List<Voyage> voyages = voyageService.getVoyagesByCamion(camion);
        return ResponseEntity.ok(voyages);
    }
    
    // GET /api/voyages/canal/{canal} - Récupérer les voyages d'un canal
    @GetMapping("/canal/{canal}")
    public ResponseEntity<List<Voyage>> getVoyagesByCanal(@PathVariable String canal) {
        List<Voyage> voyages = voyageService.getVoyagesByCanal(canal);
        return ResponseEntity.ok(voyages);
    }
    
    // GET /api/voyages/livreur/{livreur} - Récupérer les voyages d'un livreur
    @GetMapping("/livreur/{livreur}")
    public ResponseEntity<List<Voyage>> getVoyagesByLivreur(@PathVariable String livreur) {
        List<Voyage> voyages = voyageService.getVoyagesByLivreur(livreur);
        return ResponseEntity.ok(voyages);
    }
    
    // GET /api/voyages/range - Récupérer les voyages entre deux dates
    @GetMapping("/range")
    public ResponseEntity<List<Voyage>> getVoyagesByDateRange(
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate) {
        List<Voyage> voyages = voyageService.getVoyagesByDateRange(startDate, endDate);
        return ResponseEntity.ok(voyages);
    }
    
    // POST /api/voyages - Créer un nouveau voyage
    @PostMapping
    public ResponseEntity<Voyage> createVoyage(@RequestBody Voyage voyage) {
        Voyage createdVoyage = voyageService.createVoyage(voyage);
        return ResponseEntity.status(HttpStatus.CREATED).body(createdVoyage);
    }
    
    // PUT /api/voyages/{id} - Mettre à jour un voyage
    @PutMapping("/{id}")
    public ResponseEntity<Voyage> updateVoyage(@PathVariable Long id, @RequestBody Voyage voyageDetails) {
        try {
            Voyage updatedVoyage = voyageService.updateVoyage(id, voyageDetails);
            return ResponseEntity.ok(updatedVoyage);
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
    
    // DELETE /api/voyages/{id} - Supprimer un voyage
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteVoyage(@PathVariable Long id) {
        try {
            voyageService.deleteVoyage(id);
            return ResponseEntity.noContent().build();
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
    
    // DELETE /api/voyages - Supprimer tous les voyages
    @DeleteMapping
    public ResponseEntity<Void> deleteAllVoyages() {
        voyageService.deleteAllVoyages();
        return ResponseEntity.noContent().build();
    }
}
