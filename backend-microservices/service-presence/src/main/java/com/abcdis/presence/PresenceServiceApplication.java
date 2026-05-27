package com.abcdis.presence;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Point d'entrée du microservice Présence.
 *
 * <p>Ce microservice gère la présence journalière des livreurs et leurs activités :</p>
 * <ul>
 *   <li><strong>Fiches de Présence</strong> : enregistrement quotidien par camion —
 *       quel livreur, quel aide-livreur, quel canal de distribution</li>
 *   <li><strong>Voyages</strong> : chaque tournée de livraison effectuée dans la journée —
 *       destination, montant des ventes, nombre de colis</li>
 *   <li><strong>Ventes Mensuelles</strong> : agrégation des ventes par employé et par mois,
 *       avec objectifs et taux de réalisation</li>
 * </ul>
 *
 * <p><strong>Port :</strong> 8084</p>
 * <p><strong>Base de données :</strong> H2 en mémoire (presence_db)</p>
 * <p><strong>Accès console H2 :</strong> http://localhost:8084/h2-console</p>
 *
 * <p>Architecture en couches (principe de séparation des responsabilités) :</p>
 * <pre>
 *   Client HTTP
 *       ↓
 *   Controller  (reçoit les requêtes REST, valide les données)
 *       ↓
 *   Service     (logique métier : règles, calculs, validations)
 *       ↓
 *   Repository  (accès base de données via Spring Data JPA)
 *       ↓
 *   Base H2     (stockage en mémoire)
 * </pre>
 */
@SpringBootApplication
public class PresenceServiceApplication {

    /**
     * Méthode principale qui lance l'application Spring Boot.
     *
     * @param args Arguments de la ligne de commande
     */
    public static void main(String[] args) {
        SpringApplication.run(PresenceServiceApplication.class, args);
    }
}
