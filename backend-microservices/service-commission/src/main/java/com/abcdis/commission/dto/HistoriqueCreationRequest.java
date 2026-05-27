package com.abcdis.commission.dto;

/**
 * DTO pour créer un historique depuis le frontend.
 * Mappe les noms anglais du frontend vers le modèle Java français.
 */
public record HistoriqueCreationRequest(
        String employeeName,       // → nomEmploye
        String employeeRole,       // → roleEmploye
        String carte,              // → carte (optionnel)
        Double baseSalary,         // → salaireBase
        Double totalSales,         // → totalVentes
        Integer deliveries,        // → ignoré (pas dans le modèle)
        Double returnRate,         // → ignoré (pas dans le modèle)
        Double commissions,        // → commissions
        Double bonuses,            // → bonus
        Double penalties,          // → penalites
        Double finalSalary,        // → salaireFinal
        Object constraintsApplied, // → contraintesAppliquees (String JSON ou List)
        String details,            // → details
        String matricule,          // → matricule (optionnel — clé anti-redondance)
        String periode,            // → periode YYYY-MM (optionnel)
        Boolean forcerRecalcul     // → si true, écrase l'existant
) {}
