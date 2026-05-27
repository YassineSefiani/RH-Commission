package com.abcdis.personnel;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * ╔══════════════════════════════════════════════════════════════════╗
 * ║       POINT D'ENTRÉE DU MICROSERVICE PERSONNEL                   ║
 * ╠══════════════════════════════════════════════════════════════════╣
 * ║  Ce microservice gère tout le cycle de vie des employés :        ║
 * ║    - Création / modification / suppression d'un profil employé   ║
 * ║    - Recherche par nom, ville, carte commerciale, contrat        ║
 * ║    - Activation / désactivation des comptes                      ║
 * ║    - Statistiques : total, actifs, inactifs                      ║
 * ║                                                                  ║
 * ║  PORT : 8082                                                     ║
 * ║  BASE URL : /api/personnel                                       ║
 * ╚══════════════════════════════════════════════════════════════════╝
 */
@SpringBootApplication
public class PersonnelServiceApplication {
    public static void main(String[] args) {
        SpringApplication.run(PersonnelServiceApplication.class, args);
        System.out.println("╔══════════════════════════════════════════╗");
        System.out.println("║  Service PERSONNEL démarré sur port 8082 ║");
        System.out.println("║  /api/personnel → Gestion des employés   ║");
        System.out.println("╚══════════════════════════════════════════╝");
    }
}
