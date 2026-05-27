package com.abcdis.presence.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalTime;

@Entity
@Table(name = "voyages")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString(exclude = "fichePresence") // évite récursion infinie dans les logs
public class Voyage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * LAZY est correct, mais tous les accès à fichePresence doivent être dans une @Transactional.
     * VoyageService gère cela — fichePresence est chargé via ficheRepository, pas via le proxy lazy.
     */
    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "fiche_presence_id", nullable = false)
    private FichePresence fichePresence;

    @Column(name = "numero_voyage")
    private Integer numeroVoyage;

    private String destination;

    @Column(name = "montant_ventes")
    private Double montantVentes;

    @Column(name = "nombre_colis")
    private Integer nombreColis;

    @Column(name = "heure_depart")
    private LocalTime heureDepart;

    @Column(name = "heure_retour")
    private LocalTime heureRetour;

    @Column(columnDefinition = "TEXT")
    private String observations;
}
