package com.abcdis.commission.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "objectif_commercial",
       uniqueConstraints = @UniqueConstraint(
               name = "uk_objectif_periode_carte_matricule",
               columnNames = {"periode", "carte", "matricule"}),
       indexes = {
               @Index(name = "idx_objectif_periode", columnList = "periode"),
               @Index(name = "idx_objectif_matricule", columnList = "matricule")
       })
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
@ToString
public class ObjectifCommercial {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "La période est obligatoire")
    @Pattern(regexp = "\\d{4}-\\d{2}", message = "Format période attendu : YYYY-MM")
    @Column(nullable = false, length = 20)
    private String periode;

    @NotBlank(message = "La carte est obligatoire")
    @Column(nullable = false, length = 100)
    private String carte;

    @NotBlank(message = "Le matricule est obligatoire")
    @Column(nullable = false, length = 50)
    private String matricule;

    // ✨ NOUVEAU CHAMP
    @Column(name = "nom_complet", length = 150)
    private String nomComplet;
    
    @NotNull(message = "L'objectif est obligatoire")
    @PositiveOrZero(message = "L'objectif doit être >= 0")
    @Column(nullable = false)
    private Double target;

    /** Horodatage de la dernière modification — utilisé pour invalider les calculs. */
    @Column(name = "derniere_maj")
    private LocalDateTime derniereMaj;

    @PrePersist
    @PreUpdate
    protected void avantSauvegarde() {
        this.derniereMaj = LocalDateTime.now();
    }
}
