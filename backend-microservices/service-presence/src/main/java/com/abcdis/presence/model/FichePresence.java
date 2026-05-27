package com.abcdis.presence.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Entity
@Table(name = "fiches_presence")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString
public class FichePresence {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Le matricule du camion est obligatoire")
    @Column(name = "matricule_camion", nullable = false)
    private String matriculeCamion;

    @Column(nullable = false)
    private String canal;

    @NotNull(message = "La date est obligatoire")
    @Column(nullable = false)
    private LocalDate date;

    // ─── Livreur 1 (chauffeur principal) ────────────────────────────────
    @Column(name = "livreur1_id")
    private String livreur1Id;

    @NotBlank(message = "Le matricule du livreur 1 est obligatoire")
    @Column(name = "livreur1_matricule")
    private String livreur1Matricule;

    @NotBlank(message = "Le nom du livreur 1 est obligatoire")
    @Column(name = "livreur1_nom")
    private String livreur1Nom;

    @Column(name = "livreur1_prenom")
    private String livreur1Prenom;

    // ─── Livreur 2 (aide 1) ─────────────────────────────────────────────
    @Column(name = "livreur2_id")
    private String livreur2Id;

    @Column(name = "livreur2_matricule")
    private String livreur2Matricule;

    @Column(name = "livreur2_nom")
    private String livreur2Nom;

    @Column(name = "livreur2_prenom")
    private String livreur2Prenom;

    // ─── Livreur 3 (aide 2) ─────────────────────────────────────────────
    @Column(name = "livreur3_id")
    private String livreur3Id;

    @Column(name = "livreur3_matricule")
    private String livreur3Matricule;

    @Column(name = "livreur3_nom")
    private String livreur3Nom;

    @Column(name = "livreur3_prenom")
    private String livreur3Prenom;

    // ─── Champs hérités (gardés nullable pour compatibilité schéma DB) ──
    @Column(name = "nom_livreur")
    private String nomLivreur;

    @Column(name = "nom_aide_livreur")
    private String nomAideLivreur;

    @Column(name = "heure_depart")
    private LocalTime heureDepart;

    @Column(name = "heure_retour")
    private LocalTime heureRetour;

    @Builder.Default
    @Column(name = "nombre_voyages")
    private Integer nombreVoyages = 0;

    @Column(columnDefinition = "TEXT")
    private String observations;

    @Column(name = "date_creation", updatable = false)
    private LocalDateTime dateCreation;

    @PrePersist
    protected void avantCreation() {
        this.dateCreation = LocalDateTime.now();
        // Compat : remplit les colonnes legacy NOT NULL si non fournies
        if (this.nomLivreur == null) {
            this.nomLivreur = composerNomComplet(this.livreur1Prenom, this.livreur1Nom);
        }
        if (this.nomAideLivreur == null) {
            this.nomAideLivreur = composerNomComplet(this.livreur2Prenom, this.livreur2Nom);
        }
    }

    private static String composerNomComplet(String prenom, String nom) {
        String p = prenom != null ? prenom.trim() : "";
        String n = nom != null ? nom.trim() : "";
        String complet = (p + " " + n).trim();
        return complet.isEmpty() ? "" : complet;
    }
}
