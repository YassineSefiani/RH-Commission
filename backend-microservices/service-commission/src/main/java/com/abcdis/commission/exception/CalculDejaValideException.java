package com.abcdis.commission.exception;

/**
 * Une validation existe déjà pour ce produit (carte) sur cette période
 * (mois/année) — un seul calcul validé par produit et par mois. Le RH doit
 * purger l'ancien avant qu'un nouveau puisse être validé.
 */
public class CalculDejaValideException extends RuntimeException {
    public CalculDejaValideException(String message) {
        super(message);
    }
}
