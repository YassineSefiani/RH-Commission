package com.abcdis.hrapp.model;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "objectif_commercial")
@Data
public class ObjectifCommercial {

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
    private Double target;
}
