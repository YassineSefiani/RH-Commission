package com.abcdis.hrapp.dto;
import lombok.Data;
import java.util.List;

@Data
public class CalculationResponse {
    private String periode;
    private String carte;
    private List<EmployeeResult> resultats;
    private double totalEquipe;
}
