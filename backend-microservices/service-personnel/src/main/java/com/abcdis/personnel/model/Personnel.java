package com.abcdis.personnel.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Entity
@Table(name = "personnel")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString
public class Personnel {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "Le matricule est obligatoire")
    @Column(name = "matricule", unique = true, length = 50)
    private String matricule;

    @NotBlank(message = "Le nom est obligatoire")
    @Column(name = "nom", nullable = false, length = 100)
    private String nom;

    @NotBlank(message = "Le prénom est obligatoire")
    @Column(name = "prenom", nullable = false, length = 100)
    private String prenom;

    @Column(name = "carte", length = 100)
    private String carte;

    @Column(name = "fonction", length = 100)
    private String fonction;

    @Column(name = "role", length = 100)
    private String role;

    @Column(name = "numero", length = 20)
    private String numero;

    @NotBlank(message = "La nature du contrat est obligatoire")
    @Column(name = "nature_contrat", length = 50)
    private String natureContrat;

    @Column(name = "ville", length = 100)
    private String ville;

    @Builder.Default
    @Column(name = "actif", nullable = false)
    private boolean actif = true;
}
