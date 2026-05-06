package com.abcdis.hrapp.controller;

import com.abcdis.hrapp.model.FichePresence;
import com.abcdis.hrapp.service.FichePresenceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/fiche-presence")
@CrossOrigin(origins = "http://localhost:5173")
public class FichePresenceController {

    @Autowired
    private FichePresenceService service;

    private boolean hasFichePresenceAccess(String superRole) {
        return "ADMIN".equals(superRole) || "DISPATCHER".equals(superRole);
    }

    @GetMapping
    public List<FichePresence> getAllFichePresence() {
        return service.getAllFichePresence();
    }

    @GetMapping("/{id}")
    public ResponseEntity<FichePresence> getFichePresenceById(@PathVariable Long id) {
        return service.getFichePresenceById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/date/{date}")
    public List<FichePresence> getFichePresenceByDate(@PathVariable String date) {
        return service.getFichePresenceByDate(LocalDate.parse(date));
    }

    @GetMapping("/camion/{matricule}")
    public List<FichePresence> getFichePresenceByMatriculeCamion(@PathVariable String matricule) {
        return service.getFichePresenceByMatriculeCamion(matricule);
    }

    @GetMapping("/canal/{canal}")
    public List<FichePresence> getFichePresenceByCanal(@PathVariable String canal) {
        return service.getFichePresenceByCanal(canal);
    }

    @PostMapping
    public ResponseEntity<?> createFichePresence(
            @RequestBody FichePresence fichePresence,
            @RequestHeader(value = "X-User-Role", required = false, defaultValue = "") String userRole) {

        if (!hasFichePresenceAccess(userRole)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Accès refusé. Rôle ADMIN ou DISPATCHER requis."));
        }

        FichePresence saved = service.createFichePresence(fichePresence);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateFichePresence(
            @PathVariable Long id,
            @RequestBody FichePresence details,
            @RequestHeader(value = "X-User-Role", required = false, defaultValue = "") String userRole) {

        if (!hasFichePresenceAccess(userRole)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Accès refusé. Rôle ADMIN ou DISPATCHER requis."));
        }

        return service.updateFichePresence(id, details)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteFichePresence(
            @PathVariable Long id,
            @RequestHeader(value = "X-User-Role", required = false, defaultValue = "") String userRole) {

        if (!hasFichePresenceAccess(userRole)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Accès refusé. Rôle ADMIN ou DISPATCHER requis."));
        }

        if (service.deleteFichePresence(id)) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}