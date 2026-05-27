package com.abcdis.auth.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Entity
@Table(name = "utilisateurs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@ToString(exclude = "motDePasse") // sécurité : ne jamais logger le hash
public class Utilisateur {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Email(message = "L'adresse email n'est pas valide")
    @NotBlank(message = "L'email est obligatoire")
    @Column(name = "email", unique = true, nullable = false, length = 200)
    private String email;

    @NotBlank(message = "Le mot de passe est obligatoire")
    @JsonProperty(access = JsonProperty.Access.WRITE_ONLY)
    @Column(name = "mot_de_passe", nullable = false, length = 255)
    private String motDePasse;

    @Column(name = "prenom", length = 100)
    private String prenom;

    @Column(name = "nom", length = 100)
    private String nom;

    @Column(name = "super_role", length = 50)
    private String superRole;

    @Builder.Default
    @Column(name = "actif", nullable = false)
    private boolean actif = true;
}
