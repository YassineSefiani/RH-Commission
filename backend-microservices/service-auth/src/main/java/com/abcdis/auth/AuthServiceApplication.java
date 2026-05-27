package com.abcdis.auth;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║         POINT D'ENTRÉE DU MICROSERVICE AUTHENTIFICATION          ║
 * ╠══════════════════════════════════════════════════════════════════╣
 * ║                                                                  ║
 * ║  Ce microservice est responsable de :                            ║
 * ║    1. L'authentification des utilisateurs (login/password)       ║
 * ║    2. La génération des tokens JWT                               ║
 * ║    3. La validation des tokens JWT                               ║
 * ║    4. La gestion des utilisateurs (CRUD)                         ║
 * ║                                                                  ║
 * ║  PORT : 8081                                                     ║
 * ║                                                                  ║
 * ║  ARCHITECTURE JEE :                                              ║
 * ║  @SpringBootApplication regroupe :                               ║
 * ║    - @Configuration     : classe de configuration Spring         ║
 * ║    - @ComponentScan     : scan des composants du package         ║
 * ║    - @EnableAutoConfiguration : configuration automatique        ║
 * ║                                                                  ║
 * ║  Pour démarrer ce service :                                      ║
 * ║    mvn spring-boot:run -pl service-auth                          ║
 * ║  Ou depuis la racine du projet parent :                          ║
 * ║    cd service-auth && mvn spring-boot:run                        ║
 * ╚══════════════════════════════════════════════════════════════════╝
 */
@SpringBootApplication
public class AuthServiceApplication {

    /**
     * Méthode principale - Point d'entrée JVM pour le service d'authentification.
     * Spring Boot démarre un serveur Tomcat embarqué sur le port 8081.
     *
     * @param args Arguments de ligne de commande (non utilisés ici)
     */
    public static void main(String[] args) {
        // Lance le contexte Spring et démarre le serveur Tomcat intégré
        SpringApplication.run(AuthServiceApplication.class, args);
        System.out.println("╔══════════════════════════════════════╗");
        System.out.println("║  Service AUTH démarré sur port 8081  ║");
        System.out.println("║  /api/auth/login  → Connexion        ║");
        System.out.println("║  /api/auth/valider → Validation JWT  ║");
        System.out.println("╚══════════════════════════════════════╝");
    }
}
