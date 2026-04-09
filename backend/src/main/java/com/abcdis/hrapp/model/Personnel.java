package com.abcdis.hrapp.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDate;

@Entity
@Table(name = "personnel")
@Data
public class Personnel {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false, unique = true, length = 50)
    private String matricule;
    
    @Column(nullable = false, length = 100)
    private String nom;
    
    @Column(nullable = false, length = 100)
    private String prenom;

    @Column(length = 100)
    private String carte;
    
    @Column(length = 100)
    private String fonction;
    
    @Column(length = 50)
    private String role;
    
    @Column(length = 20)
    private String numero; // Numéro de téléphone
    
    @Column(nullable = false, length = 20)
    private String natureContrat; // CDI, Int (Interim), CDD, etc.
    
    @Column(length = 100)
    private String ville;
    
    @Column
    private Boolean actif = true; // Pour gérer les employés actifs/inactifs
}