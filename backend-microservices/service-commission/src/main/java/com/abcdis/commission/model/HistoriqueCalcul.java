package com.abcdis.commission.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "historique_calculs",
       indexes = {
               @Index(name = "idx_hist_employe",   columnList = "nom_employe"),
               @Index(name = "idx_hist_matricule", columnList = "matricule"),
               @Index(name = "idx_hist_periode",   columnList = "periode"),
               @Index(name = "idx_hist_mois_annee", columnList = "mois, annee"),
               @Index(name = "idx_hist_carte",     columnList = "carte")
       })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString
public class HistoriqueCalcul {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonProperty("employeeName")
    @Column(name = "nom_employe", nullable = false)
    private String nomEmploye;

    @JsonProperty("employeeRole")
    @Column(name = "role_employe")
    private String roleEmploye;

    @Column(name = "carte")
    private String carte;

    /** Matricule de l'employé — clé naturelle pour la dé-duplication mensuelle. */
    @Column(name = "matricule", length = 50)
    private String matricule;

    /** Période YYYY-MM utilisée par le moteur d'anti-redondance. */
    @Column(name = "periode", length = 20)
    private String periode;

    /**
     * Empreinte des données source au moment du calcul.
     * Si max(derniereMaj) des Obj/Real/Triage de la même période reste {@literal <=}
     * cette valeur, le calcul peut être réutilisé tel quel.
     */
    @Column(name = "source_version")
    private java.time.LocalDateTime sourceVersion;

    @JsonProperty("baseSalary")
    @Column(name = "salaire_base")
    private Double salaireBase;

    @JsonProperty("totalSales")
    @Column(name = "total_ventes")
    private Double totalVentes;

    @Column(nullable = false)
    private Double commissions;

    @JsonProperty("bonuses")
    @Column(nullable = false)
    private Double bonus;

    @JsonProperty("penalties")
    @Column(nullable = false)
    private Double penalites;

    @JsonProperty("finalSalary")
    @Column(name = "salaire_final", nullable = false)
    private Double salaireFinal;

    @JsonProperty("constraintsApplied")
    @Column(name = "contraintes_appliquees", columnDefinition = "TEXT")
    private String contraintesAppliquees;

    @Column(columnDefinition = "TEXT")
    private String details;

    @JsonProperty("date")
    @Column(name = "date_calcul")
    private LocalDateTime dateCalcul;

    @Column(nullable = false)
    private Integer mois;

    @Column(nullable = false)
    private Integer annee;

    @JsonProperty("batchId")
    @Column(name = "batch_id", length = 100)
    private String batchId;

    @JsonProperty("simulationName")
    @Column(name = "simulation_name", length = 100)
    private String simulationName;
    
    @JsonProperty("isArchived")
    @Column(name = "is_archived", nullable = false, columnDefinition = "boolean default false")
    @Builder.Default
    private Boolean isArchived = false;

    @PrePersist
    protected void avantCreation() {
        if (this.dateCalcul == null) {
            this.dateCalcul = LocalDateTime.now();
        }
        // Dérive mois/annee du même instant pour garantir la cohérence
        if (this.mois == null)  this.mois  = this.dateCalcul.getMonthValue();
        if (this.annee == null) this.annee = this.dateCalcul.getYear();
    }
}
