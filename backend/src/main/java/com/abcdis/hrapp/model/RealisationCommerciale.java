package com.abcdis.hrapp.model;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "realisation_commerciale")
@Data
public class RealisationCommerciale {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String periode;

    @Column(nullable = false)
    private String carte;

    @Column(nullable = false)
    private String matricule;

    @Column(nullable = false)
    private Double caRealise;
}
