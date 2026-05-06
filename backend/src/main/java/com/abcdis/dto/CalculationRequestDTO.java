package com.abcdis.dto;

import java.util.List;

public class CalculationRequestDTO {
    private String carte;
    private String periode;
    private List<ContrainteDTO> contraintes;

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

    public List<ContrainteDTO> getContraintes() {
        return contraintes;
    }

    public void setContraintes(List<ContrainteDTO> contraintes) {
        this.contraintes = contraintes;
    }

    public static class ContrainteDTO {
        private String id;
        private boolean actif;

        // Getters and Setters
        public String getId() {
            return id;
        }

        public void setId(String id) {
            this.id = id;
        }

        public boolean isActif() {
            return actif;
        }

        public void setActif(boolean actif) {
            this.actif = actif;
        }
    }
}