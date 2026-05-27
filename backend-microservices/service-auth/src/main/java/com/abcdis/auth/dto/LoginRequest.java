package com.abcdis.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

/**
 * DTO immuable (record Java 17) pour la requête de connexion.
 * POST /api/auth/connexion → { "email": "...", "motDePasse": "..." }
 */
public record LoginRequest(
        @Email(message = "Format d'email invalide")
        @NotBlank(message = "L'email est obligatoire")
        String email,

        @NotBlank(message = "Le mot de passe est obligatoire")
        String motDePasse
) {}
