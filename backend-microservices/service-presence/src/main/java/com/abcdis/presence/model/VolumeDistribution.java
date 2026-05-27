package com.abcdis.presence.model;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "volume_distribution")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
@ToString
public class VolumeDistribution {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 20)
    private String periode; // Format: "2026-05"

    @Column(nullable = false, length = 50)
    private String matricule;

    @Column(name = "volume_charge", nullable = false)
    private Double volumeCharge;

    @Column(name = "volume_retourne", nullable = false)
    private Double volumeRetourne;

    @Column(name = "jours_travailles", nullable = false)
    private Integer jouresTravailles; // Typo conservée pour compatibilité
}
