package com.abcdis.commission.dto;

import lombok.Data;

@Data
public class NotificationRequest {
    private String matricule;
    private Integer mois;
    private Integer annee;
    private String message;
}
