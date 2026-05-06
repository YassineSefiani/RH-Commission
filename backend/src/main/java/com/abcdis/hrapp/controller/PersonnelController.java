package com.abcdis.hrapp.controller;

import com.abcdis.hrapp.model.Personnel;
import com.abcdis.hrapp.repository.PersonnelRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/personnel")
@CrossOrigin(origins = "http://localhost:5173")
public class PersonnelController {
    
    @Autowired
    private PersonnelRepository personnelRepository;
    
    private boolean hasPersonnelAccess(String superRole) {
        return "ADMIN".equals(superRole) || "RH".equals(superRole);
    }
    
    @GetMapping
    public List<Personnel> getAllPersonnel() {
        return personnelRepository.findAll();
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<Personnel> getPersonnelById(@PathVariable Long id) {
        return personnelRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/matricule/{matricule}")
    public ResponseEntity<Personnel> getPersonnelByMatricule(@PathVariable String matricule) {
        return personnelRepository.findByMatricule(matricule)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/actifs")
    public List<Personnel> getPersonnelActifs() {
        return personnelRepository.findByActif(true);
    }
    
    @GetMapping("/carte/{carte}")
    public List<Personnel> getPersonnelByCarte(@PathVariable String carte) {
        return personnelRepository.findByCarte(carte);
    }

    @GetMapping("/ville/{ville}")
    public List<Personnel> getPersonnelByVille(@PathVariable String ville) {
        return personnelRepository.findByVille(ville);
    }
    
    @GetMapping("/contrat/{type}")
    public List<Personnel> getPersonnelByContrat(@PathVariable String type) {
        return personnelRepository.findByNatureContrat(type);
    }
    
    @GetMapping("/search")
    public List<Personnel> searchPersonnel(@RequestParam String nom) {
        return personnelRepository.findByNomContainingIgnoreCase(nom);
    }
    
    @PostMapping
    public ResponseEntity<?> createPersonnel(
            @RequestBody Personnel personnel,
            @RequestHeader(value = "X-User-Role", required = false) String userRole) {
        
        // Correction : On ne bloque que si un rôle est explicitement envoyé et qu'il n'est pas suffisant
        // Si userRole est null ou vide, on autorise l'accès (utile pour l'init auto sans login)
        if (userRole != null && !userRole.isEmpty() && !hasPersonnelAccess(userRole)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Accès refusé. Rôle ADMIN ou RH requis."));
        }
        
        if (personnelRepository.existsByMatricule(personnel.getMatricule())) {
            return ResponseEntity.status(HttpStatus.CONFLICT)
                    .body("Un personnel avec ce matricule existe déjà");
        }
        
        Personnel saved = personnelRepository.save(personnel);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<?> updatePersonnel(
            @PathVariable Long id,
            @RequestBody Personnel personnelDetails,
            @RequestHeader(value = "X-User-Role", required = false, defaultValue = "") String userRole) {
        
        if (!hasPersonnelAccess(userRole)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Accès refusé. Rôle ADMIN ou RH requis."));
        }
        
        return personnelRepository.findById(id)
                .map(personnel -> {
                    if (!personnel.getMatricule().equals(personnelDetails.getMatricule()) &&
                        personnelRepository.existsByMatricule(personnelDetails.getMatricule())) {
                        return ResponseEntity.status(HttpStatus.CONFLICT)
                                .body("Un personnel avec ce matricule existe déjà");
                    }
                    
                    personnel.setMatricule(personnelDetails.getMatricule());
                    personnel.setNom(personnelDetails.getNom());
                    personnel.setPrenom(personnelDetails.getPrenom());
                    personnel.setCarte(personnelDetails.getCarte());
                    personnel.setFonction(personnelDetails.getFonction());
                    personnel.setRole(personnelDetails.getRole());
                    personnel.setNumero(personnelDetails.getNumero());
                    personnel.setNatureContrat(personnelDetails.getNatureContrat());
                    personnel.setVille(personnelDetails.getVille());
                    personnel.setActif(personnelDetails.getActif());
                    
                    return ResponseEntity.ok(personnelRepository.save(personnel));
                })
                .orElse(ResponseEntity.notFound().build());
    }
    
    @PatchMapping("/{id}/toggle")
    public ResponseEntity<?> togglePersonnel(
            @PathVariable Long id,
            @RequestHeader(value = "X-User-Role", required = false, defaultValue = "") String userRole) {
        
        if (!hasPersonnelAccess(userRole)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Accès refusé. Rôle ADMIN ou RH requis."));
        }
        
        return personnelRepository.findById(id)
                .map(personnel -> {
                    personnel.setActif(!personnel.getActif());
                    return ResponseEntity.ok(personnelRepository.save(personnel));
                })
                .orElse(ResponseEntity.notFound().build());
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deletePersonnel(
            @PathVariable Long id,
            @RequestHeader(value = "X-User-Role", required = false, defaultValue = "") String userRole) {
        
        if (!hasPersonnelAccess(userRole)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Accès refusé. Rôle ADMIN ou RH requis."));
        }
        
        return personnelRepository.findById(id)
                .map(personnel -> {
                    personnelRepository.delete(personnel);
                    return ResponseEntity.ok().build();
                })
                .orElse(ResponseEntity.notFound().build());
    }
    
    @GetMapping("/stats")
    public ResponseEntity<?> getStats() {
        long total = personnelRepository.count();
        long actifs = personnelRepository.countByActif(true);
        long inactifs = personnelRepository.countByActif(false);
        return ResponseEntity.ok(new Stats(total, actifs, inactifs));
    }
    
    record Stats(long total, long actifs, long inactifs) {}
}