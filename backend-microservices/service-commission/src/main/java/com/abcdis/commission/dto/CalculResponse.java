package com.abcdis.commission.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class CalculResponse {

    private String nomEmploye;
    private String carte;
    private Double salaireBase;
    private Double totalVentes;
    private Double commissions;
    private Double bonus;
    private Double penalites;
    private Double salaireFinal;
    private List<String> contraintesAppliquees;
    private LocalDateTime dateCalcul;

    /** True si la réponse réutilise un calcul existant (anti-redondance). */
    private Boolean reutilise;

    /** Période YYYY-MM concernée. */
    private String periode;

    /** Matricule de l'employé (peut être null). */
    private String matricule;
}
