package com.abcdis.commission.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "note_triage",
       uniqueConstraints = @UniqueConstraint(
               name = "uk_triage_periode_matricule",
               columnNames = {"periode", "matricule"}),
       indexes = {
               @Index(name = "idx_triage_periode", columnList = "periode"),
               @Index(name = "idx_triage_matricule", columnList = "matricule")
       })
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
@ToString
public class NoteTriage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "La période est obligatoire")
    @Pattern(regexp = "\\d{4}-\\d{2}", message = "Format période attendu : YYYY-MM")
    @Column(nullable = false, length = 20)
    private String periode;

    @NotBlank(message = "Le matricule est obligatoire")
    @Column(nullable = false, length = 50)
    private String matricule;

    @NotNull(message = "La note est obligatoire")
    @PositiveOrZero(message = "La note doit être >= 0")
    @DecimalMax(value = "100.0", message = "La note doit être <= 100")
    @Column(nullable = false)
    private Double note;

    @Column(name = "derniere_maj")
    private LocalDateTime derniereMaj;

    @PrePersist
    @PreUpdate
    protected void avantSauvegarde() {
        this.derniereMaj = LocalDateTime.now();
    }
}
