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
    
    // Vérifier si l'utilisateur a le rôle requis pour Personnel
    private boolean hasPersonnelAccess(String superRole) {
        return "ADMIN".equals(superRole) || "RH".equals(superRole);
    }
    
    // GET /api/personnel - Récupérer tous les personnels (accessible à tous)
    @GetMapping
    public List<Personnel> getAllPersonnel() {
        return personnelRepository.findAll();
    }
    
    // GET /api/personnel/{id} - Récupérer un personnel par ID
    @GetMapping("/{id}")
    public ResponseEntity<Personnel> getPersonnelById(@PathVariable Long id) {
        return personnelRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    // GET /api/personnel/matricule/{matricule} - Récupérer par matricule
    @GetMapping("/matricule/{matricule}")
    public ResponseEntity<Personnel> getPersonnelByMatricule(@PathVariable String matricule) {
        return personnelRepository.findByMatricule(matricule)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    // GET /api/personnel/actifs - Récupérer uniquement les actifs
    @GetMapping("/actifs")
    public List<Personnel> getPersonnelActifs() {
        return personnelRepository.findByActif(true);
    }
    
    @GetMapping("/carte/{carte}")
    public List<Personnel> getPersonnelByCarte(@PathVariable String carte) {
        return personnelRepository.findByCarte(carte);
    }

    // GET /api/personnel/ville/{ville} - Recherche par ville
    @GetMapping("/ville/{ville}")
    public List<Personnel> getPersonnelByVille(@PathVariable String ville) {
        return personnelRepository.findByVille(ville);
    }
    
    // GET /api/personnel/contrat/{type} - Recherche par type de contrat
    @GetMapping("/contrat/{type}")
    public List<Personnel> getPersonnelByContrat(@PathVariable String type) {
        return personnelRepository.findByNatureContrat(type);
    }
    
    // GET /api/personnel/search?nom=xxx - Recherche par nom
    @GetMapping("/search")
    public List<Personnel> searchPersonnel(@RequestParam String nom) {
        return personnelRepository.findByNomContainingIgnoreCase(nom);
    }
    
    // POST /api/personnel - Créer un nouveau personnel (ADMIN ou RH uniquement, sauf si pas de rôle pour init)
    @PostMapping
    public ResponseEntity<?> createPersonnel(
            @RequestBody Personnel personnel,
            @RequestHeader(value = "X-User-Role", required = false, defaultValue = "") String userRole) {
        
        // Permettre la création sans authentification si aucun rôle n'est fourni (pour l'initialisation)
        if (!userRole.isEmpty() && !hasPersonnelAccess(userRole)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Accès refusé. Rôle ADMIN ou RH requis."));
        }
        
        if (personnelRepository.existsByMatricule(personnel.getMatricule())) {
            return ResponseEntity
                    .status(HttpStatus.CONFLICT)
                    .body("Un personnel avec ce matricule existe déjà");
        }
        
        Personnel saved = personnelRepository.save(personnel);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }
    
    // PUT /api/personnel/{id} - Mettre à jour un personnel (ADMIN ou RH uniquement)
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
                        return ResponseEntity
                                .status(HttpStatus.CONFLICT)
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
    
    // PATCH /api/personnel/{id}/toggle - Activer/Désactiver un personnel (ADMIN ou RH uniquement)
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
    
    // DELETE /api/personnel/{id} - Supprimer un personnel (ADMIN ou RH uniquement)
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
    
    // GET /api/personnel/stats - Statistiques
    @GetMapping("/stats")
    public ResponseEntity<?> getStats() {
        long total = personnelRepository.count();
        long actifs = personnelRepository.findByActif(true).size();
        long inactifs = personnelRepository.findByActif(false).size();
        
        return ResponseEntity.ok(new Stats(total, actifs, inactifs));
    }
    
    record Stats(long total, long actifs, long inactifs) {}
}