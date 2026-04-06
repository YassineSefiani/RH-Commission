package com.abcdis.hrapp.controller;

import com.abcdis.hrapp.model.Constraint;
import com.abcdis.hrapp.repository.ConstraintRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/constraints")
@CrossOrigin(origins = "http://localhost:5173")
public class ConstraintController {
    
    @Autowired
    private ConstraintRepository constraintRepository;
    
    @GetMapping
    public List<Constraint> getAllConstraints() {
        return constraintRepository.findAll();
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<Constraint> getConstraintById(@PathVariable Long id) {
        return constraintRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }
    
    @PostMapping
    public Constraint createConstraint(@RequestBody Constraint constraint) {
        return constraintRepository.save(constraint);
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<Constraint> updateConstraint(
            @PathVariable Long id, 
            @RequestBody Constraint constraintDetails) {
        
        return constraintRepository.findById(id)
                .map(constraint -> {
                    constraint.setName(constraintDetails.getName());
                    constraint.setType(constraintDetails.getType());
                    constraint.setValue(constraintDetails.getValue());
                    constraint.setValueType(constraintDetails.getValueType());
                    constraint.setCondition(constraintDetails.getCondition());
                    constraint.setActive(constraintDetails.getActive());
                    constraint.setRuleGroups(constraintDetails.getRuleGroups());
                    return ResponseEntity.ok(constraintRepository.save(constraint));
                })
                .orElse(ResponseEntity.notFound().build());
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteConstraint(@PathVariable Long id) {
        return constraintRepository.findById(id)
                .map(constraint -> {
                    constraintRepository.delete(constraint);
                    return ResponseEntity.ok().build();
                })
                .orElse(ResponseEntity.notFound().build());
    }
    
    @PatchMapping("/{id}/toggle")
    public ResponseEntity<Constraint> toggleConstraint(@PathVariable Long id) {
        return constraintRepository.findById(id)
                .map(constraint -> {
                    constraint.setActive(!constraint.getActive());
                    return ResponseEntity.ok(constraintRepository.save(constraint));
                })
                .orElse(ResponseEntity.notFound().build());
    }
}
