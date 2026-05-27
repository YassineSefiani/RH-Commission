package com.abcdis.auth.dto;

/**
 * DTO immuable (record Java 17) retourné après authentification réussie.
 * Contient le token JWT et les infos utilisateur pour le frontend.
 */
public record LoginResponse(
        String token,
        String email,
        String prenom,
        String nom,
        String superRole
) {}
