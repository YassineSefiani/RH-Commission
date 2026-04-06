package com.abcdis.hrapp.service;

import com.abcdis.hrapp.model.Constraint;
import com.abcdis.hrapp.repository.ConstraintRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class ConstraintService {

    @Autowired
    private ConstraintRepository repository;

    public List<Constraint> getAllConstraints() {
        return repository.findAll();
    }

    public Optional<Constraint> getConstraintById(Long id) {
        return repository.findById(id);
    }

    public Constraint createConstraint(Constraint constraint) {
        return repository.save(constraint);
    }

    public Constraint updateConstraint(Long id, Constraint details) {
        Constraint constraint = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Constraint not found"));
        constraint.setName(details.getName());
        constraint.setType(details.getType());
        constraint.setValue(details.getValue());
        constraint.setValueType(details.getValueType());
        constraint.setCondition(details.getCondition());
        constraint.setActive(details.getActive());
        constraint.setRuleGroups(details.getRuleGroups());
        return repository.save(constraint);
    }

    public void deleteConstraint(Long id) {
        Constraint constraint = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Constraint not found"));
        repository.delete(constraint);
    }

    public Constraint toggleConstraint(Long id) {
        Constraint constraint = repository.findById(id)
                .orElseThrow(() -> new RuntimeException("Constraint not found"));
        constraint.setActive(!constraint.getActive());
        return repository.save(constraint);
    }
}