package com.abcdis.auth.dto;

/**
 * Charge utile reçue du frontend pour enregistrer une entrée d'audit.
 */
public record AuditCreationRequest(
        String userEmail,
        String userRole,
        String action,
        String entity,
        String entityId,
        String details
) {}
