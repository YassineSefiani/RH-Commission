package com.abcdis.presence.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "ventes_mensuelles",
       uniqueConstraints = @UniqueConstraint(
           columnNames = {"nom_employe", "carte", "mois", "annee"},
           name = "uk_vente_employe_mois"))
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString
public class VenteMensuelle {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "nom_employe", nullable = false)
    private String nomEmploye;

    @Column(nullable = false)
    private String carte;

    @Column(nullable = false)
    private Integer mois;

    @Column(nullable = false)
    private Integer annee;

    @Column(name = "montant_ventes", nullable = false)
    private Double montantVentes;

    @Column
    private Double objectif;

    @Column(name = "taux_realisation")
    private Double tauxRealisation;

    @Column(name = "date_enregistrement", updatable = false)
    private LocalDateTime dateEnregistrement;

    @PrePersist
    protected void avantCreation() {
        this.dateEnregistrement = LocalDateTime.now();
        calculerTauxRealisation();
    }

    @PreUpdate
    protected void avantModification() {
        calculerTauxRealisation();
    }

    private void calculerTauxRealisation() {
        if (this.objectif != null && this.objectif > 0 && this.montantVentes != null) {
            this.tauxRealisation = (this.montantVentes / this.objectif) * 100.0;
        }
    }
}
