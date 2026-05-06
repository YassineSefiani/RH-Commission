package com.abcdis.hrapp.dto;
import lombok.Data;
import java.util.List;

@Data
public class EmployeeResult {
    private String matricule;
    private String prenom;
    private String nom;
    private String role;
    private String natureContrat;
    private double commissions;
    private double bonuses;
    private double penalties;
    private double finalSalary;
    private List<ResultDetail> detail;
}
