package com.abcdis.dto;

import java.util.List;

public class CalculationResponseDTO {
    private String carte;
    private String periode;
    private double totalEquipe;
    private List<ResultatDTO> resultats;

    // Getters and Setters
    public String getCarte() {
        return carte;
    }

    public void setCarte(String carte) {
        this.carte = carte;
    }

    public String getPeriode() {
        return periode;
    }

    public void setPeriode(String periode) {
        this.periode = periode;
    }

    public double getTotalEquipe() {
        return totalEquipe;
    }

    public void setTotalEquipe(double totalEquipe) {
        this.totalEquipe = totalEquipe;
    }

    public List<ResultatDTO> getResultats() {
        return resultats;
    }

    public void setResultats(List<ResultatDTO> resultats) {
        this.resultats = resultats;
    }

    public static class ResultatDTO {
        private String matricule;
        private String nom;
        private String role;
        private String contrat;
        private double commissionDistribution;
        private double commissionRetour;
        private double commissionTriage;
        private double total;
        private List<DetailDTO> detail;

        // Getters and Setters
        public String getMatricule() {
            return matricule;
        }

        public void setMatricule(String matricule) {
            this.matricule = matricule;
        }

        public String getNom() {
            return nom;
        }

        public void setNom(String nom) {
            this.nom = nom;
        }

        public String getRole() {
            return role;
        }

        public void setRole(String role) {
            this.role = role;
        }

        public String getContrat() {
            return contrat;
        }

        public void setContrat(String contrat) {
            this.contrat = contrat;
        }

        public double getCommissionDistribution() {
            return commissionDistribution;
        }

        public void setCommissionDistribution(double commissionDistribution) {
            this.commissionDistribution = commissionDistribution;
        }

        public double getCommissionRetour() {
            return commissionRetour;
        }

        public void setCommissionRetour(double commissionRetour) {
            this.commissionRetour = commissionRetour;
        }

        public double getCommissionTriage() {
            return commissionTriage;
        }

        public void setCommissionTriage(double commissionTriage) {
            this.commissionTriage = commissionTriage;
        }

        public double getTotal() {
            return total;
        }

        public void setTotal(double total) {
            this.total = total;
        }

        public List<DetailDTO> getDetail() {
            return detail;
        }

        public void setDetail(List<DetailDTO> detail) {
            this.detail = detail;
        }
    }

    public static class DetailDTO {
        private String regle;
        private String libelle;
        private double montant;

        // Getters and Setters
        public String getRegle() {
            return regle;
        }

        public void setRegle(String regle) {
            this.regle = regle;
        }

        public String getLibelle() {
            return libelle;
        }

        public void setLibelle(String libelle) {
            this.libelle = libelle;
        }

        public double getMontant() {
            return montant;
        }

        public void setMontant(double montant) {
            this.montant = montant;
        }
    }
}