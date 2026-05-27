package com.abcdis.commission.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class CalculRequest {

    @NotBlank(message = "Le nom de l'employé est obligatoire")
    private String nomEmploye;

    private String roleEmploye;

    @NotBlank(message = "La carte est obligatoire")
    private String carte;

    @NotNull(message = "Le salaire de base est obligatoire")
    @Positive(message = "Le salaire de base doit être positif")
    private Double salaireBase;

    private Double totalVentes;
    private Double volumeLivraisons;

    /** Optionnel — clé naturelle pour la dé-duplication mensuelle. */
    private String matricule;

    /** Optionnel — période YYYY-MM ; si absente, la date du jour est utilisée. */
    private String periode;

    /** Si true, force le recalcul même si un calcul valide existe déjà. */
    private Boolean forcerRecalcul;
}
