package com.abcdis.hrapp.dto;
import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class ResultDetail {
    private String regle;
    private String libelle;
    private double montant;
}
