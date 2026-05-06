package com.abcdis.hrapp.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDate;

@Entity
@Table(name = "fiche_presence")
@Data
public class FichePresence {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private LocalDate date;

    @Column(length = 50)
    private String matriculeCamion;

    @Column(length = 100)
    private String canal;

    @Column
    private Long livreur1Id;

    @Column(length = 50)
    private String livreur1Matricule;

    @Column(length = 100)
    private String livreur1Nom;

    @Column(length = 100)
    private String livreur1Prenom;

    @Column
    private Long livreur2Id;

    @Column(length = 50)
    private String livreur2Matricule;

    @Column(length = 100)
    private String livreur2Nom;

    @Column(length = 100)
    private String livreur2Prenom;

    @Column
    private Long livreur3Id;

    @Column(length = 50)
    private String livreur3Matricule;

    @Column(length = 100)
    private String livreur3Nom;

    @Column(length = 100)
    private String livreur3Prenom;
}