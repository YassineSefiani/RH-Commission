package com.abcdis.auth.dto;

import java.time.LocalDateTime;

/**
 * DTO standard pour toutes les réponses d'erreur de l'API.
 * Retourné par GlobalExceptionHandler sur chaque erreur.
 */
public record ErrorResponse(
        int status,
        String error,
        String message,
        LocalDateTime timestamp
) {
    public static ErrorResponse of(int status, String error, String message) {
        return new ErrorResponse(status, error, message, LocalDateTime.now());
    }
}
