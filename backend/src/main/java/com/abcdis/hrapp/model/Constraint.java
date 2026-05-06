package com.abcdis.hrapp.model;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "constraints")
@Data
public class Constraint {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private String name;
    
    @Column(nullable = false)
    private String type; // commission, performance_bonus, delivery_bonus, penalty

    @Column(nullable = false)
    private String carte;
    
    @Column(name = "constraint_value")
    private Double value;
    
    @Column(nullable = false)
    private String valueType; // percentage, fixed
    
    @Column(nullable = false, length = 500)
    private String condition;
    
    @Column(nullable = false)
    private Boolean active = true;
    
    @Column(columnDefinition = "TEXT")
    private String ruleGroups; // JSON string pour les règles complexes
}