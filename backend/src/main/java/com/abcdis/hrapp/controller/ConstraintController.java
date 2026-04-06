package com.abcdis.hrapp.controller;

import com.abcdis.hrapp.model.Constraint;
import com.abcdis.hrapp.service.ConstraintService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/constraints")
@CrossOrigin(origins = "http://localhost:5173")
public class ConstraintController {

    @Autowired
    private ConstraintService service;

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

    @PostMapping
    public Constraint create(@RequestBody Constraint constraint) {
        return service.createConstraint(constraint);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Constraint> update(
            @PathVariable Long id,
            @RequestBody Constraint details) {
        try {
            return ResponseEntity.ok(service.updateConstraint(id, details));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@PathVariable Long id) {
        try {
            service.deleteConstraint(id);
            return ResponseEntity.ok().build();
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PatchMapping("/{id}/toggle")
    public ResponseEntity<Constraint> toggle(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(service.toggleConstraint(id));
        } catch (RuntimeException e) {
            return ResponseEntity.notFound().build();
        }
    }
}