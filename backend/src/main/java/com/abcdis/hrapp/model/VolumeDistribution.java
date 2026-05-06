package com.abcdis.hrapp.model;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "volume_distribution")
@Data
public class VolumeDistribution {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String periode;

    @Column(nullable = false)
    private String matricule;

    @Column(nullable = false)
    private Double volumeCharge;

    @Column(nullable = false)
    private Double volumeRetourne;

    @Column(nullable = false)
    private Integer jouresTravailles;
}
