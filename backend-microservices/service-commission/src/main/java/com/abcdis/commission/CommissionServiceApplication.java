package com.abcdis.commission;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * Point d'entrée du microservice Commission.
 *
 * <p>Ce microservice gère trois responsabilités principales :</p>
 * <ul>
 *   <li><strong>Contraintes</strong> : les règles de calcul des commissions
 *       (ex: "5% sur les ventes Coca-Cola", "Bonus fixe 2000 MAD si objectif atteint")</li>
 *   <li><strong>Calcul</strong> : le moteur de calcul qui applique les contraintes
 *       pour calculer le salaire final d'un employé</li>
 *   <li><strong>Historique</strong> : la sauvegarde et consultation de tous
 *       les calculs effectués</li>
 * </ul>
 *
 * <p><strong>Port :</strong> 8083</p>
 * <p><strong>Base de données :</strong> H2 en mémoire (commission_db)</p>
 * <p><strong>Accès console H2 :</strong> http://localhost:8083/h2-console</p>
 *
 * <p>L'annotation @SpringBootApplication combine trois annotations :</p>
 * <ul>
 *   <li>@Configuration : cette classe est une source de beans Spring</li>
 *   <li>@EnableAutoConfiguration : Spring configure automatiquement les composants</li>
 *   <li>@ComponentScan : Spring scanne le package pour trouver les composants</li>
 * </ul>
 */
@SpringBootApplication
public class CommissionServiceApplication {

    /**
     * Méthode principale qui démarre l'application Spring Boot.
     *
     * @param args Arguments de la ligne de commande (non utilisés ici)
     */
    public static void main(String[] args) {
        SpringApplication.run(CommissionServiceApplication.class, args);
    }
}
