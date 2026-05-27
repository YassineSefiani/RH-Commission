package com.abcdis.commission.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "realisation_commerciale",
       uniqueConstraints = @UniqueConstraint(
               name = "uk_realisation_periode_carte_matricule",
               columnNames = {"periode", "carte", "matricule"}),
       indexes = {
               @Index(name = "idx_realisation_periode", columnList = "periode"),
               @Index(name = "idx_realisation_matricule", columnList = "matricule")
       })
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
@ToString
public class RealisationCommerciale {

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

    @NotNull(message = "Le CA réalisé est obligatoire")
    @PositiveOrZero(message = "Le CA réalisé doit être >= 0")
    @Column(name = "ca_realise", nullable = false)
    private Double caRealise;

    @Column(name = "derniere_maj")
    private LocalDateTime derniereMaj;

    @PrePersist
    @PreUpdate
    protected void avantSauvegarde() {
        this.derniereMaj = LocalDateTime.now();
    }
}
