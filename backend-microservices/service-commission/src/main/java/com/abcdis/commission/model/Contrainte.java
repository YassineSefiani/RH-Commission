package com.abcdis.commission.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "contraintes")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString
public class Contrainte {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonProperty("name")
    @NotBlank(message = "Le nom de la contrainte est obligatoire")
    @Column(nullable = false)
    private String nom;

    @Column(nullable = false)
    private String carte;

    @JsonProperty("value")
    @NotNull
    @Positive(message = "La valeur doit être positive")
    @Column(nullable = false)
    private Double valeur;

    private String condition;

    @JsonProperty("valueType")
    @Column(name = "type_valeur", nullable = false)
    private String typeValeur;

    @JsonProperty("active")
    @Builder.Default
    @Column(nullable = false)
    private Boolean actif = true;

    /** Type de commission : commission_quantitative | commission_retour | commission_triage */
    @Column(name = "type_commission", length = 50)
    private String type;

    /** Conditions JSON complexes envoyées par le frontend (constructeur de règles) */
    @Column(name = "rule_groups", columnDefinition = "TEXT")
    private String ruleGroups;

    @Column(name = "date_creation", updatable = false)
    private LocalDateTime dateCreation;

    @Column(name = "date_modification")
    private LocalDateTime dateModification;

    @PrePersist
    protected void avantCreation() {
        this.dateCreation = LocalDateTime.now();
        this.dateModification = LocalDateTime.now();
    }

    @PreUpdate
    protected void avantModification() {
        this.dateModification = LocalDateTime.now();
    }
}
