package com.abcdis.hrapp.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDate;

@Entity
@Table(name = "voyage")
@Data
public class Voyage {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false)
    private LocalDate date;
    
    @Column(nullable = false, length = 100)
    private String camion;
    
    @Column(nullable = false, length = 100)
    private String canal;
    
    @Column(nullable = false, length = 50)
    private String numeroVoyage;
    
    @Column(length = 100)
    private String livreur;
    
    @Column(length = 100)
    private String aideLivreur1;
    
    @Column(length = 100)
    private String aideLivreur2;
}
