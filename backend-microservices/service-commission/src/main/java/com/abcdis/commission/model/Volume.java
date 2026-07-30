package com.abcdis.commission.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "volume",
       uniqueConstraints = @UniqueConstraint(
               name = "uk_volume_date_matricule",
               columnNames = {"date_releve", "matricule"}),
       indexes = {
               @Index(name = "idx_volume_periode", columnList = "periode"),
               @Index(name = "idx_volume_matricule", columnList = "matricule")
       })
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
@ToString
public class Volume {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull(message = "La date est obligatoire")
    @Column(name = "date_releve", nullable = false)
    private LocalDate date;

    @NotBlank(message = "Le matricule est obligatoire")
    @Column(nullable = false, length = 50)
    private String matricule;

    @Column(length = 50)
    private String role;

    @NotNull(message = "Le volume chargé est obligatoire")
    @PositiveOrZero(message = "Le volume chargé doit être >= 0")
    @Column(name = "volume_charge", nullable = false)
    private Double volumeCharge;

    @NotNull(message = "Le volume retourné est obligatoire")
    @PositiveOrZero(message = "Le volume retourné doit être >= 0")
    @Column(name = "volume_retourne", nullable = false)
    private Double volumeRetourne;

    @Column(nullable = false, length = 20)
    private String periode;

    @Column(name = "derniere_maj")
    private LocalDateTime derniereMaj;

    @PrePersist
    @PreUpdate
    protected void avantSauvegarde() {
        this.derniereMaj = LocalDateTime.now();
        if (this.date != null) {
            this.periode = String.format("%04d-%02d", this.date.getYear(), this.date.getMonthValue());
        }
    }
}
