package com.abcdis.hrapp.controller;

import com.abcdis.hrapp.model.Constraint;
import com.abcdis.hrapp.service.ConstraintService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/constraints")
@CrossOrigin(origins = "http://localhost:5173")
public class ConstraintController {

    @Autowired
    private ConstraintService service;

    // Vérifier si l'utilisateur a le rôle requis pour Constraints
    private boolean hasConstraintAccess(String superRole) {
        return "ADMIN".equals(superRole) || "ADV".equals(superRole);
    }

    @GetMapping
    public List<Constraint> getAll() {
        return service.getAllConstraints();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Constraint> getById(@PathVariable Long id) {
        return service.getConstraintById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // POST /api/constraints - Créer une contrainte (ADMIN ou ADV uniquement)
    @PostMapping
    public ResponseEntity<?> create(
            @RequestBody Constraint constraint,
            @RequestHeader(value = "X-User-Role", required = false, defaultValue = "") String userRole) {
        
        if (!hasConstraintAccess(userRole)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Accès refusé. Rôle ADMIN ou ADV requis."));
        }
        
        return ResponseEntity.ok(service.createConstraint(constraint));
    }

    // PUT /api/constraints/{id} - Modifier une contrainte (ADMIN ou ADV uniquement)
    @PutMapping("/{id}")
    public ResponseEntity<?> update(
            @PathVariable Long id,
            @RequestBody Constraint details,
            @RequestHeader(value = "X-User-Role", required = false, defaultValue = "") String userRole) {
        
        if (!hasConstraintAccess(userRole)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Accès refusé. Rôle ADMIN ou ADV requis."));
        }
        
        try {
            return ResponseEntity.ok(service.updateConstraint(id, details));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // DELETE /api/constraints/{id} - Supprimer une contrainte (ADMIN ou ADV uniquement)
    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(
            @PathVariable Long id,
            @RequestHeader(value = "X-User-Role", required = false, defaultValue = "") String userRole) {
        
        if (!hasConstraintAccess(userRole)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Accès refusé. Rôle ADMIN ou ADV requis."));
        }
        
        try {
            service.deleteConstraint(id);
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    // PATCH /api/constraints/{id}/toggle - Activer/Désactiver (ADMIN ou ADV uniquement)
    @PatchMapping("/{id}/toggle")
    public ResponseEntity<?> toggle(
            @PathVariable Long id,
            @RequestHeader(value = "X-User-Role", required = false, defaultValue = "") String userRole) {
        
        if (!hasConstraintAccess(userRole)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of("error", "Accès refusé. Rôle ADMIN ou ADV requis."));
        }
        
        try {
            return ResponseEntity.ok(service.toggleConstraint(id));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
}