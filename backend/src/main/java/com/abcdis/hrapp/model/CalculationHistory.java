package com.abcdis.hrapp.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "calculation_history")
@Data
public class CalculationHistory {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private LocalDateTime date;
    
    @Column(nullable = false)
    private String employeeName;
    
    @Column(nullable = false)
    private String employeeRole;
    
    @Column(nullable = false)
    private Double baseSalary;
    
    @Column(nullable = false)
    private Double totalSales;
    
    @Column(nullable = false)
    private Integer deliveries;
    
    @Column(nullable = false)
    private Integer returns;
    
    @Column(nullable = false)
    private Double commissions;
    
    @Column(nullable = false)
    private Double bonuses;
    
    @Column(nullable = false)
    private Double penalties;
    
    @Column(nullable = false)
    private Double finalSalary;
    
    @Column(columnDefinition = "TEXT")
    private String constraintsApplied; // JSON array
    
    @Column(columnDefinition = "TEXT")
    private String details; // JSON array
}
