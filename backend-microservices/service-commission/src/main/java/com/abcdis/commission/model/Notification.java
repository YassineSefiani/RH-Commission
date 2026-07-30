package com.abcdis.commission.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

/**
 * Alerte "revoir ce calcul" envoyée à l'ADV quand le dispatcher modifie une
 * fiche de présence liée à une période/employé déjà calculé.
 */
@Entity
@Table(name = "notifications",
       indexes = {
               @Index(name = "idx_notif_matricule_periode", columnList = "matricule, mois, annee")
       })
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Notification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String matricule;

    @Column(nullable = false)
    private Integer mois;

    @Column(nullable = false)
    private Integer annee;

    @Column(nullable = false, length = 500)
    private String message;

    @Builder.Default
    @Column(nullable = false)
    private Boolean lue = false;

    @Column(name = "date_creation", updatable = false)
    private LocalDateTime dateCreation;

    @PrePersist
    protected void avantCreation() {
        this.dateCreation = LocalDateTime.now();
    }
}
